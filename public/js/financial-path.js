/* ══════════════════════════════════════════════════════════
   YOUR FINANCIAL PATH
   A saved-plan dashboard: trajectory chart ("where is my money
   heading") + the plan detail, with an active path and archive.

   Single source of truth: this tool RE-DISPLAYS the goalSIPs
   snapshot captured by fpCalculatePlan (window._fpPathSnapshot) — it
   does not recompute corpus/gap/onTrack. Only the trajectory
   CHART runs a light directional projection (pathProjectSeries).
══════════════════════════════════════════════════════════ */

window._pathState = window._pathState || { active: null, archive: [] };
var _pathChart = null;
var _PATH_ARCHIVE_CAP = 12;

// Indian-abbreviated currency (₹1.23 Cr / ₹4.56 L), matches nwFmt
function pathFmt(n) {
    var a = Math.abs(n), s = n < 0 ? '-' : '';
    if (a >= 1e7) return s + '₹' + (a / 1e7).toFixed(2) + ' Cr';
    if (a >= 1e5) return s + '₹' + (a / 1e5).toFixed(2) + ' L';
    return s + '₹' + Math.round(a).toLocaleString('en-IN');
}
function pathFull(n) { return '₹' + Math.round(n).toLocaleString('en-IN'); }
function _pathEsc(s) { return (typeof window.esc === 'function') ? window.esc(s || '') : (s || ''); }
function _pathDate(iso) {
    try { return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }); }
    catch (e) { return ''; }
}
// i18n helper: translate key, fall back to English; supports {placeholder} vars
function _pt(key, fallback, vars) {
    var s = fallback;
    if (typeof _t === 'function') { var v = _t(key); if (v && v !== key) s = v; }
    if (vars) { Object.keys(vars).forEach(function (k) { s = s.replace('{' + k + '}', vars[k]); }); }
    return s;
}

// Reset the finplan "Save to Path" confirmation when a fresh plan is generated
function fpRefreshSaveToPath() {
    var done = document.getElementById('fp-path-saved');
    if (done) done.classList.add('hidden');
}
window.fpRefreshSaveToPath = fpRefreshSaveToPath;

// ── Save the currently generated plan as the active path ──────────
function pathSaveCurrentPlan() {
    var plan = window._fpPathSnapshot;
    if (!plan) { alert(_pt('finpath.alert.noplan', 'Generate a plan in Financial Plan first, then save it to Your Financial Path.')); return; }
    var st = window._pathState || { active: null, archive: [] };
    if (st.active) {
        st.archive = st.archive || [];
        st.archive.unshift(st.active);
        if (st.archive.length > _PATH_ARCHIVE_CAP) st.archive = st.archive.slice(0, _PATH_ARCHIVE_CAP);
    }
    st.active = plan;
    window._pathState = st;
    pathSyncPlanGoalsToTracker(plan);   // make the plan's goals trackable
    if (typeof saveUserData === 'function') saveUserData();
    var done = document.getElementById('fp-path-saved');
    if (done) done.classList.remove('hidden');
    pathRender();
}
window.pathSaveCurrentPlan = pathSaveCurrentPlan;

// Add the plan's goals to the tracked list (window._savedGoals) so they can be
// tracked with check-ins in the "Your Goals" section. Add-only: never touches an
// existing tracked goal's savedAmt / checkIns / createdAt. Dedup mirrors the
// Goal Planner bridge (app.js saveGoalToFP): match by fpType, and for custom by label.
function pathSyncPlanGoalsToTracker(plan) {
    if (!plan || !plan.goalSIPs || !plan.goalSIPs.length) return;
    window._savedGoals = window._savedGoals || [];
    var added = 0;
    plan.goalSIPs.forEach(function (g) {
        var fpType = g.type || 'custom';
        var label  = g.label || 'Goal';
        var exists = window._savedGoals.some(function (sg) {
            return sg.fpType === fpType && (fpType !== 'custom' || sg.label === label);
        });
        if (exists) return;
        window._savedGoals.push({
            fpType: fpType, label: label, emoji: g.emoji || '🎯',
            targetAmt: g.target || 0, years: g.years || 1,
            createdAt: new Date().toISOString(), savedAmt: 0, checkIns: []
        });
        added++;
    });
    if (added > 0) window._savedGoalsTs = new Date().toISOString();
}
window.pathSyncPlanGoalsToTracker = pathSyncPlanGoalsToTracker;

// Restore an archived path to active (swaps the current active into archive)
function pathRestore(idx) {
    var st = window._pathState;
    if (!st || !st.archive || !st.archive[idx]) return;
    var chosen = st.archive.splice(idx, 1)[0];
    if (st.active) st.archive.unshift(st.active);
    st.active = chosen;
    if (typeof saveUserData === 'function') saveUserData();
    pathRender();
}
window.pathRestore = pathRestore;

function pathDeleteArchived(idx) {
    var st = window._pathState;
    if (!st || !st.archive) return;
    st.archive.splice(idx, 1);
    if (typeof saveUserData === 'function') saveUserData();
    pathRender();
}
window.pathDeleteArchived = pathDeleteArchived;

// ── Directional trajectory projection (chart only) ────────────────
// Two phases:
//  • Accumulation (until retirement): balance compounds at the blended return
//    and adds the annual SIP; each goal's target is drawn down in its year.
//  • Drawdown (retirement → life expectancy): SIP stops, the corpus earns the
//    post-retirement return and an inflation-growing living expense is withdrawn,
//    so the corpus depletes.
//
// The drawdown's assumptions come from the user's own inputs, frozen into the
// snapshot when the plan was generated (see fpCalculatePlan in app.js): My
// Profile's monthly expenses and inflation rate, and the Retirement Hub's
// post-retirement return. The constants below are fallbacks only, for snapshots
// saved before those fields were captured.
var PATH_LIFE_EXPECTANCY = 85;
var PATH_POST_RET_RETURN = 0.07;   // fallback — Retirement Hub's default
var PATH_INFLATION       = 0.06;   // fallback — My Profile / Retirement Hub default
// Last-resort proxy when no expense figure is available at all: 70% of income.
// This only holds for someone saving ~30% of take-home — it overstates the
// retirement need for anyone saving more, so it is used only as a fallback.
var PATH_REPLACEMENT     = 0.70;
// Goal types whose target is SPENT at the goal year (cash leaves the portfolio).
// "Keep" goals stay invested: retirement spending is already modelled by the
// drawdown phase (subtracting its target too would double-count), and
// wealth / emergency corpora remain part of net worth.
var PATH_SPEND_TYPES = { home: 1, education: 1, marriage: 1, travel: 1, business: 1, custom: 1 };

// Resolve the drawdown assumptions for a plan: prefer what the user actually
// entered (frozen into the snapshot at generation time), fall back to the
// constants above for older snapshots. `basis` tells the explainer which source
// the living-expense figure came from, so the chart never presents the
// replacement-rate proxy as though it were a considered figure.
function pathRetAssumptions(plan) {
    var expMonthly = plan.monthlyExpenses || 0;
    var incMonthly = plan.monthlyIncome || 0;
    var retAge     = plan.retireAge || 60;
    // Clamp above retirement age so a stray entry can't yield a zero-length or
    // negative drawdown (which would report a required corpus of 0).
    var life = plan.lifeExpectancyAge > 0 ? Math.round(plan.lifeExpectancyAge) : PATH_LIFE_EXPECTANCY;
    return {
        inflation: plan.inflationPct     > 0 ? plan.inflationPct     / 100 : PATH_INFLATION,
        retReturn: plan.postRetReturnPct > 0 ? plan.postRetReturnPct / 100 : PATH_POST_RET_RETURN,
        annualExpenseToday: expMonthly > 0 ? expMonthly * 12 : incMonthly * 12 * PATH_REPLACEMENT,
        basis: expMonthly > 0 ? 'expenses' : (incMonthly > 0 ? 'proxy' : 'none'),
        lifeExp: Math.max(life, retAge + 1)
    };
}
window.pathRetAssumptions = pathRetAssumptions;

// Corpus needed AT RETIREMENT to fund the drawdown all the way to life
// expectancy — exactly the withdrawals pathProjectSeries applies, solved as a
// present value instead of simulated. The Financial Plan measures its
// retirement goal against this, so a target that is "met" but too small to
// sustain the user's own expenses is flagged instead of passing unqualified.
//
// Withdrawals land at year end (ordinary annuity), matching the projection loop:
//   PV = E × (1 − v^n) / (r − g),  v = (1+g)/(1+r),  E = first-year expense
// where g = inflation, r = post-retirement return. r == g is the limiting case.
function pathRequiredRetCorpus(assume, yearsToRetire, retireAge) {
    var n = Math.max(assume.lifeExp - retireAge, 0);
    if (n <= 0 || !(assume.annualExpenseToday > 0)) return 0;
    var E = assume.annualExpenseToday * Math.pow(1 + assume.inflation, yearsToRetire);
    var g = assume.inflation, r = assume.retReturn;
    if (Math.abs(r - g) < 1e-9) return E * n / (1 + r);
    var v = (1 + g) / (1 + r);
    return E * (1 - Math.pow(v, n)) / (r - g);
}
window.pathRequiredRetCorpus = pathRequiredRetCorpus;

function pathProjectSeries(plan) {
    var startYear = new Date().getFullYear();
    var age       = plan.age || 30;
    var retireAge = plan.retireAge || 60;
    var goals = plan.goalSIPs || [];
    var goalYears = goals.map(function (g) { return parseInt(g.years) || 0; });
    var yearsToRetire = Math.max(retireAge - age, 1);
    var assume = pathRetAssumptions(plan);
    // Extend past retirement to the plan-until age so drawdown depletion is visible.
    var horizon = Math.max(
        yearsToRetire,
        goalYears.length ? Math.max.apply(null, goalYears) : 0,
        assume.lifeExp - age,
        1
    );
    // Existing corpus and new SIP money grow at different rates — mixing them
    // (or growing either at the wrong rate) is what made the chart inaccurate.
    // Prefer plan.existingCorpus (the Financial Plan's own tracked investments,
    // paired with its asset-weighted existingReturn — same number the plan's
    // gap calc already uses) over netWorthToday, which nets in home equity,
    // gold, EPF and loan liabilities that don't compound at an equity SIP rate.
    // Fall back to netWorthToday only when no existing-investment buckets were
    // picked, using a conservative rate since the asset mix is then unknown.
    var hasExistingCorpus = (plan.existingCorpus || 0) > 0;
    var existingPool = hasExistingCorpus ? plan.existingCorpus : (plan.netWorthToday > 0 ? plan.netWorthToday : 0);
    var existingRate = hasExistingCorpus ? (plan.existingReturn || 8) / 100 : 0.08;
    var sipPool = 0;
    var annualSIP = (plan.monthlyInvest || 0) * 12;
    var r = (plan.blendedReturn || 10) / 100;

    // Annual living expense at the moment of retirement (0 when neither expenses
    // nor income are known — then no drawdown is modelled and the corpus just grows).
    var retExpenseAtRet = assume.annualExpenseToday > 0
        ? assume.annualExpenseToday * Math.pow(1 + assume.inflation, yearsToRetire)
        : 0;

    // Milestones mark every goal's target year; outflows only deduct the
    // spend-type goals (see PATH_SPEND_TYPES above).
    var goalsByYear = {}, outflowByYear = {};
    goals.forEach(function (g) {
        var y = parseInt(g.years) || 0;
        (goalsByYear[y] = goalsByYear[y] || []).push(g);
        if (PATH_SPEND_TYPES[g.type || 'custom']) outflowByYear[y] = (outflowByYear[y] || 0) + (g.target || 0);
    });

    var balance = existingPool + sipPool;
    var series = [], milestones = [], depletionYear = null, shortfallYear = null;
    for (var y = 0; y <= horizon; y++) {
        var curAge = age + y;
        if (y > 0) {
            if (curAge <= retireAge) {
                // Accumulation — existing corpus and new SIP money compound at
                // their own rates, then the year's SIP lands in the SIP pool.
                existingPool = existingPool > 0 ? existingPool * (1 + existingRate) : existingPool;
                sipPool = (sipPool > 0 ? sipPool * (1 + r) : sipPool) + annualSIP;
                balance = existingPool + sipPool;
            } else {
                // Drawdown — pools merge (no more SIP, one conservative return
                // applies to whatever corpus remains) minus an inflation-growing expense.
                var grown = balance > 0 ? balance * (1 + assume.retReturn) : 0;
                var yearsIntoRet = curAge - retireAge; // 1, 2, 3 …
                var expense = retExpenseAtRet * Math.pow(1 + assume.inflation, yearsIntoRet - 1);
                balance = grown - expense;
            }
        }
        if (goalsByYear[y]) {
            goalsByYear[y].forEach(function (g) {
                milestones.push({
                    idx: y, year: startYear + y, label: g.label, emoji: g.emoji,
                    target: g.target, onTrack: g.onTrack, balanceBefore: balance
                });
            });
        }
        if (outflowByYear[y]) {
            var outflow = outflowByYear[y];
            balance -= outflow;
            if (curAge <= retireAge) {
                // Spend the newer, more liquid SIP pool first, then dip into the
                // existing corpus — keeps the two pools in sync with `balance`
                // so next year's differential compounding stays correct.
                var fromSip = Math.min(sipPool, outflow);
                sipPool -= fromSip;
                existingPool -= (outflow - fromSip);
            }
        }
        // Net worth can never plot below ₹0 — a depleted corpus is empty, not a
        // debt, and you can't withdraw money you don't have. Record the first
        // year the money runs out (depletion in retirement, shortfall during
        // accumulation), then floor the balance AND the pools at zero so the
        // line flattens along the axis instead of diving into deep negatives.
        if (balance < 0) {
            if (curAge > retireAge) { if (depletionYear === null) depletionYear = startYear + y; }
            else if (shortfallYear === null) { shortfallYear = startYear + y; }
            balance = 0; existingPool = 0; sipPool = 0;
        }
        series.push({ year: startYear + y, value: Math.round(balance) });
    }
    return {
        series: series, milestones: milestones, startYear: startYear, horizon: horizon,
        retireIndex: (retireAge - age), retireYear: startYear + (retireAge - age),
        depletionYear: depletionYear, shortfallYear: shortfallYear
    };
}
window.pathProjectSeries = pathProjectSeries;

// ── Render ────────────────────────────────────────────────────────
function pathRender() {
    var empty    = document.getElementById('path-empty');
    var planWrap = document.getElementById('path-plan');
    var goalsWrap = document.getElementById('path-goals-wrap');
    var disc     = document.getElementById('path-disc');
    if (!empty || !planWrap) return; // panel not in DOM yet

    var st = window._pathState || { active: null, archive: [] };
    var plan = st.active;
    var savedGoals = window._savedGoals || [];
    var hasPlan  = !!plan;
    var hasGoals = savedGoals.length > 0;

    // Goals tracking section — independent of whether a plan exists (this is the
    // merged Goal Tracker). Reuses initGoalTracker() to fill #gt-goals-container.
    if (goalsWrap) {
        goalsWrap.classList.toggle('hidden', !hasGoals);
        if (hasGoals && typeof initGoalTracker === 'function') initGoalTracker();
    }

    // Plan-dependent sections
    planWrap.classList.toggle('hidden', !hasPlan);
    if (disc) disc.classList.toggle('hidden', !hasPlan);
    // Empty state only when there's neither a plan nor any goals to track.
    empty.classList.toggle('hidden', hasPlan || hasGoals);

    pathRenderArchive(st.archive || []);

    if (!hasPlan) {
        if (_pathChart) { _pathChart.destroy(); _pathChart = null; }
        return;
    }

    // The ACTIVE path tracks the user's current assumptions. Change the Retirement
    // Hub's post-retirement return or My Profile's expenses/inflation and this
    // curve follows, instead of showing whatever happened to be frozen when the
    // plan was last saved. Only the three drawdown assumptions are refreshed — the
    // plan itself (goals, SIP, age, allocation) stays exactly as saved. Archived
    // paths are historical records and keep their originals.
    if (typeof window.fpLiveRetAssumptions === 'function') {
        var live = window.fpLiveRetAssumptions();
        plan = Object.assign({}, plan);
        ['monthlyExpenses', 'inflationPct', 'postRetReturnPct', 'lifeExpectancyAge'].forEach(function (k) {
            if (live[k] > 0) plan[k] = live[k];
        });
    }

    // Header
    var hd = document.getElementById('path-header');
    if (hd) {
        hd.innerHTML =
            '<div class="flex items-center justify-between gap-2 flex-wrap">' +
                '<div>' +
                    '<div class="text-sm font-black text-slate-800">' + (plan.name && plan.name !== 'there' ? _pt('finpath.hd.named', "{n}'s Path", { n: _pathEsc(plan.name) }) : _pt('finpath.hd.title', 'Your Financial Path')) + '</div>' +
                    '<div class="text-[10px] text-slate-400">' + _pt('finpath.hd.saved', 'Saved {d}', { d: _pathDate(plan.generatedAt) }) + '</div>' +
                '</div>' +
                '<span class="text-[10px] font-black px-2.5 py-1 rounded-full" style="background:' + (plan.profileBarColor || '#6366f1') + '20;color:' + (plan.profileBarColor || '#6366f1') + ';">' +
                    _pathEsc(plan.profileLabel || '') + ' · ' + _pt('finpath.hd.blended', '{p}% blended', { p: (plan.blendedReturn || 0) }) +
                '</span>' +
            '</div>';
    }

    var proj = pathProjectSeries(plan);
    pathRenderChart(proj, plan);
    pathRenderExplainer(proj, plan);
    pathRenderMilestones(proj.milestones);
    pathRenderCards(plan);
    pathRenderArchive(st.archive || []);
}
window.pathRender = pathRender;
function pathApplyIcons(){
    var n=document.querySelectorAll('#finpath-panel [data-pathicon]');
    for(var i=0;i<n.length;i++){ var s=(typeof window._svgIcon==='function')?window._svgIcon(n[i].getAttribute('data-pathicon'),''):''; if(s) n[i].innerHTML=s; }
}
window.pathApplyIcons = pathApplyIcons;

// ── Explainer under the chart ─────────────────────────────────────
// Spells out, in plain language and with this plan's own numbers, how the
// trajectory grows and depletes and which assumptions drive it — so the curve
// isn't a black box. Adapts when income is missing (no drawdown modelled).
function pathRenderExplainer(proj, plan) {
    var el = document.getElementById('path-explain');
    if (!el) return;

    var hasExisting  = (plan.existingCorpus || 0) > 0;
    var existingAmt  = hasExisting ? plan.existingCorpus : (plan.netWorthToday > 0 ? plan.netWorthToday : 0);
    var existingRate = hasExisting ? (plan.existingReturn || 8) : 8;
    var assume       = pathRetAssumptions(plan);
    var modelsDrawdown = assume.basis !== 'none';

    // Round to 1dp first: rates arrive as fractions (0.07 × 100 = 7.000000000000001),
    // which would otherwise render as "7.0%" instead of "7%".
    function fnum(n) { n = Math.round(n * 10) / 10; return (n % 1) ? n.toFixed(1) : String(Math.round(n)); }
    function row(label, val) {
        return '<div class="flex items-center justify-between py-0.5 gap-3">' +
            '<span class="text-[10px] text-slate-500 min-w-0 truncate">' + label + '</span>' +
            '<span class="text-[10px] font-black text-slate-700 flex-shrink-0">' + val + '</span></div>';
    }

    // Assumptions grid — directly answers "what factors were considered".
    var factors = '';
    if (existingAmt > 0) factors += row(_pt('finpath.explain.f.er', 'Existing corpus return'), fnum(existingRate) + '%');
    factors += row(_pt('finpath.explain.f.br', 'New SIP (blended) return'), (plan.blendedReturn || 10) + '%');
    if (modelsDrawdown) {
        // Name the living-expense source explicitly — a real expense figure and a
        // 70%-of-income guess are very different inputs and shouldn't look alike.
        if (assume.basis === 'expenses')
            factors += row(_pt('finpath.explain.f.exp', 'Monthly expenses today (My Profile)'), pathFmt(assume.annualExpenseToday / 12));
        else
            factors += row(_pt('finpath.explain.f.rep', 'Income replaced in retirement'), Math.round(PATH_REPLACEMENT * 100) + '%');
        factors += row(_pt('finpath.explain.f.pr', 'Post-retirement return'), fnum(assume.retReturn * 100) + '%');
        factors += row(_pt('finpath.explain.f.infl', 'Inflation'), fnum(assume.inflation * 100) + '%');
        factors += row(_pt('finpath.explain.f.life', 'Plan runs until age'), assume.lifeExp);
    }

    // Reconcile with the Financial Plan: show the corpus this drawdown actually
    // needs beside what the plan projects, using the same helper the plan's
    // retirement card uses. Without this the dip has no stated cause.
    var retShortText = '';
    if (modelsDrawdown && proj.retireIndex >= 0) {
        var ytr  = Math.max((plan.retireAge || 60) - (plan.age || 30), 1);
        var need = pathRequiredRetCorpus(assume, ytr, plan.retireAge || 60);
        var have = (proj.series[proj.retireIndex] || {}).value || 0;
        if (need > 0) {
            factors += row(_pt('finpath.explain.f.need', 'Corpus needed at retirement'), pathFmt(need));
            factors += row(_pt('finpath.explain.f.have', 'Projected at retirement'),     pathFmt(have));
            if (have < need)
                retShortText = ' ' + _pt('finpath.explain.draw.short',
                    'Your projected corpus at retirement ({have}) is below the {need} this spending needs — that gap is why the line runs down to ₹0.',
                    { have: pathFmt(have), need: pathFmt(need) });
        }
    }

    var drawText = modelsDrawdown
        ? _pt('finpath.explain.draw.t', 'At retirement (amber dot) SIPs stop and your living costs are withdrawn every year, rising with inflation, so the corpus gradually depletes. Net worth is floored at ₹0 — it never shows as negative; if the money runs out that year is marked in red.')
        : _pt('finpath.explain.draw.noexp', 'No expenses or income were entered, so post-retirement spending isn’t modelled here — add your monthly expenses in My Profile and re-save the plan to see the drawdown.');
    // Be explicit when the figure is a guess rather than the user's own number.
    if (assume.basis === 'proxy')
        drawText += ' ' + _pt('finpath.explain.draw.proxy', 'Your monthly expenses aren’t set, so this assumes you’ll need 70% of your current take-home — a rough stand-in that overstates the need if you save more than 30%. Add your expenses in My Profile for an accurate curve.');
    drawText += retShortText;

    el.innerHTML =
        '<div class="mt-3 pt-3 border-t border-slate-100">' +
            '<div class="text-[11px] font-black text-slate-600 mb-1.5">' + _pt('finpath.explain.h', 'How this trajectory is calculated') + '</div>' +
            '<div class="text-[10px] text-slate-500 leading-relaxed mb-1"><span class="font-bold text-slate-600">' + _pt('finpath.explain.grow.h', 'Until retirement — growth') + ':</span> ' +
                _pt('finpath.explain.grow.t', 'Your existing corpus and monthly SIP each compound every year at their own rate (below). When you reach a spend-goal, its target is withdrawn from the corpus — that’s each dip in the line.') + '</div>' +
            '<div class="text-[10px] text-slate-500 leading-relaxed mb-2"><span class="font-bold text-slate-600">' + _pt('finpath.explain.draw.h', 'After retirement — drawdown') + ':</span> ' + drawText + '</div>' +
            '<div class="rounded-lg bg-slate-50 px-3 py-2">' +
                '<div class="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">' + _pt('finpath.explain.factors.h', 'Assumptions used') + '</div>' +
                factors +
            '</div>' +
        '</div>';
}
window.pathRenderExplainer = pathRenderExplainer;

function pathRenderChart(proj, plan) {
    var canvas = document.getElementById('path-chart');
    if (!canvas || typeof Chart === 'undefined') return;
    if (_pathChart) { _pathChart.destroy(); _pathChart = null; }

    var series = proj.series;
    var milestoneYears = {};
    proj.milestones.forEach(function (m) { milestoneYears[m.year] = m; });

    // The retirement year gets an amber marker (drawdown starts here); the year
    // the corpus runs dry, if any, gets a red marker.
    var depYear = proj.depletionYear;
    var pointRadius = series.map(function (p) {
        if (milestoneYears[p.year]) return 5;
        if (p.year === depYear) return 5;
        if (p.year === proj.retireYear) return 5;
        return 0;
    });
    var pointColors = series.map(function (p) {
        var m = milestoneYears[p.year];
        if (m) return m.onTrack ? '#10b981' : '#ef4444';
        if (p.year === depYear) return '#ef4444';       // corpus-depleted marker
        if (p.year === proj.retireYear) return '#f59e0b'; // retirement marker
        return 'rgba(0,0,0,0)';
    });

    _pathChart = new Chart(canvas.getContext('2d'), {
        type: 'line',
        data: {
            labels: series.map(function (p) { return "'" + String(p.year).slice(2); }),
            datasets: [{
                label: 'Projected net worth',
                data: series.map(function (p) { return p.value; }),
                borderColor: '#6366f1',
                borderWidth: 2.5,
                pointRadius: pointRadius,
                pointHoverRadius: 6,
                pointBackgroundColor: pointColors,
                pointBorderColor: pointColors,
                fill: { target: 'origin', above: 'rgba(99,102,241,0.10)' },
                tension: 0.3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            // Hover anywhere along the line (not just on the milestone dots, which
            // are the only points with a non-zero radius) to see that year's value.
            interaction: { mode: 'index', intersect: false, axis: 'x' },
            plugins: {
                legend: { display: false },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    callbacks: {
                        title: function (items) {
                            var yr = proj.startYear + items[0].dataIndex;
                            return _pt('finpath.chart.year', 'Year {y}', { y: yr });
                        },
                        label: function (c) { return ' ' + pathFmt(c.parsed.y); },
                        afterLabel: function (c) {
                            var yr = proj.startYear + c.dataIndex;
                            var lines = [];
                            var m = milestoneYears[yr];
                            if (m) lines.push((m.onTrack ? '✅ ' : '🔴 ') + _pt('finpath.chart.mstip', '{label} — target {t}', { label: m.label, t: pathFmt(m.target) }));
                            if (yr === proj.retireYear) lines.push(_pt('finpath.chart.retire', '🏖️ Retirement — drawdown begins'));
                            if (yr === proj.depletionYear) lines.push(_pt('finpath.chart.deplete', '⚠️ Corpus runs out here'));
                            return lines.join('\n');
                        }
                    }
                }
            },
            scales: {
                x: { ticks: { font: { size: 9 }, maxTicksLimit: 12 }, grid: { display: false } },
                y: {
                    // Net worth is floored at ₹0, so the axis starts there — the
                    // trajectory flattens along the baseline if the corpus depletes.
                    beginAtZero: true,
                    ticks: { font: { size: 9 }, callback: function (v) { return pathFmt(v); } },
                    grid: {
                        color: function (ctx) { return ctx.tick.value === 0 ? 'rgba(0,0,0,0.15)' : 'rgba(0,0,0,0.04)'; },
                        lineWidth: function (ctx) { return ctx.tick.value === 0 ? 1.5 : 1; }
                    }
                }
            }
        }
    });
}

function pathRenderMilestones(milestones) {
    var el = document.getElementById('path-milestones');
    if (!el) return;
    if (!milestones || milestones.length === 0) { el.innerHTML = ''; return; }
    el.innerHTML = milestones.map(function (m) {
        var c = m.onTrack ? '#10b981' : '#ef4444';
        var badge = m.onTrack ? _pt('finpath.ontrack', 'On track') : _pt('finpath.shortfall', 'Shortfall');
        return '<div class="flex items-center gap-2 py-1.5 border-b border-slate-50 last:border-0">' +
            window._emojiIco((m.emoji || '🎯'), 'pro-ico-lg') +
            '<div class="flex-1 min-w-0">' +
                '<div class="text-[11px] font-bold text-slate-700 truncate">' + _pathEsc(m.label) + '</div>' +
                '<div class="text-[10px] text-slate-400">' + _pt('finpath.ms.detail', '{y} · target {t}', { y: m.year, t: pathFmt(m.target) }) + '</div>' +
            '</div>' +
            '<span class="text-[10px] font-black px-2 py-0.5 rounded-full flex-shrink-0" style="background:' + c + '18;color:' + c + ';">' + badge + '</span>' +
        '</div>';
    }).join('');
}

function pathRenderCards(plan) {
    var el = document.getElementById('path-cards');
    if (!el) return;
    var html = '';

    // Allocation summary
    var allocs = plan.allocs || [];
    if (allocs.length) {
        html += '<div class="path-card">' +
            '<div class="path-card-title">' + window._emojiIco('📊') + _pt('finpath.card.alloc', 'Recommended Allocation') + '</div>' +
            allocs.map(function (a) {
                return '<div class="flex items-center gap-2 py-1">' +
                    '<div style="width:8px;height:8px;border-radius:50%;background:' + a.color + ';flex-shrink:0;"></div>' +
                    '<div class="text-[11px] text-slate-600 flex-1 min-w-0 truncate">' + window._emojiIco((a.icon || ''), 'pro-ico') + ' ' + _pathEsc(a.name) + '</div>' +
                    '<div class="text-[11px] font-black text-slate-700">' + a.pct + '%</div>' +
                '</div>';
            }).join('') +
        '</div>';
    }

    // Monthly SIP total
    html += '<div class="path-card">' +
        '<div class="flex items-center justify-between">' +
            '<span class="text-[11px] font-bold text-slate-500">' + window._emojiIco('💸') + _pt('finpath.card.sip', 'Monthly SIP') + '</span>' +
            '<span class="text-sm font-black text-indigo-600">' + _pt('finpath.card.permonth', '{v}/mo', { v: pathFull(plan.monthlyInvest || 0) }) + '</span>' +
        '</div>' +
        (plan.existingCorpus > 0
            ? '<div class="flex items-center justify-between mt-1.5 pt-1.5 border-t border-slate-100">' +
                '<span class="text-[11px] font-bold text-slate-500">' + window._emojiIco('🏦') + _pt('finpath.card.existing', 'Existing corpus') + '</span>' +
                '<span class="text-xs font-black text-slate-700">' + pathFmt(plan.existingCorpus) + '</span>' +
              '</div>'
            : '') +
    '</div>';

    // NOTE: projected per-goal cards were removed here — actual goal tracking now
    // lives in the "Your Goals" section (reused Goal Tracker). The chart milestones
    // still convey projected on-track/shortfall, so the split is: chart = projected,
    // Your Goals = actual. This avoids two competing per-goal "on track" badges.

    el.innerHTML = html;
}

function pathRenderArchive(archive) {
    var wrap = document.getElementById('path-archive-wrap');
    var el = document.getElementById('path-archive');
    if (!wrap || !el) return;
    if (!archive || archive.length === 0) { wrap.classList.add('hidden'); el.innerHTML = ''; return; }
    wrap.classList.remove('hidden');
    el.innerHTML = archive.map(function (p, i) {
        var proj = pathProjectSeries(p);
        // Summarise by the corpus at retirement (the meaningful peak), not the
        // depleted end-of-life value the extended horizon now reaches.
        var ri = proj.retireIndex;
        var retVal = (ri >= 0 && proj.series[ri]) ? proj.series[ri].value
                   : (proj.series.length ? proj.series[proj.series.length - 1].value : 0);
        return '<div class="flex items-center gap-2 py-2 border-b border-slate-50 last:border-0">' +
            '<div class="flex-1 min-w-0">' +
                '<div class="text-[11px] font-bold text-slate-700">' + _pathDate(p.generatedAt) + '</div>' +
                '<div class="text-[10px] text-slate-400 truncate">' + _pathEsc(p.profileLabel || '') +
                    _pt('finpath.arch.detail', ' · projected {v} by {y}', { v: pathFmt(retVal), y: proj.retireYear }) + '</div>' +
            '</div>' +
            '<button onclick="pathRestore(' + i + ')" class="text-[10px] font-bold text-indigo-600 px-2 py-1 rounded-lg border border-indigo-100 hover:bg-indigo-50 flex-shrink-0">' + _pt('finpath.arch.restore', 'Restore') + '</button>' +
            '<button onclick="pathDeleteArchived(' + i + ')" class="text-[10px] font-bold text-slate-400 px-1.5 py-1 rounded-lg hover:text-rose-500 flex-shrink-0" title="' + _pt('finpath.arch.delete', 'Delete') + '">✕</button>' +
        '</div>';
    }).join('');
}
