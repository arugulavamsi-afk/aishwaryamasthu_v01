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
    if (typeof saveUserData === 'function') saveUserData();
    var done = document.getElementById('fp-path-saved');
    if (done) done.classList.remove('hidden');
    pathRender();
}
window.pathSaveCurrentPlan = pathSaveCurrentPlan;

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
// start = today's net worth (fallback existing corpus); each year the
// balance compounds at the blended return and adds the annual SIP;
// each goal's target is drawn down in its target year.
function pathProjectSeries(plan) {
    var startYear = new Date().getFullYear();
    var goals = plan.goalSIPs || [];
    var goalYears = goals.map(function (g) { return parseInt(g.years) || 0; });
    var horizon = Math.max(
        (plan.retireAge || 60) - (plan.age || 30),
        goalYears.length ? Math.max.apply(null, goalYears) : 0,
        1
    );
    var balance = plan.netWorthToday > 0 ? plan.netWorthToday : (plan.existingCorpus || 0);
    var annualSIP = (plan.monthlyInvest || 0) * 12;
    var r = (plan.blendedReturn || 10) / 100;

    var outflowByYear = {};
    goals.forEach(function (g) {
        var y = parseInt(g.years) || 0;
        outflowByYear[y] = (outflowByYear[y] || 0) + (g.target || 0);
    });

    var series = [], milestones = [];
    for (var y = 0; y <= horizon; y++) {
        if (y > 0) balance = balance * (1 + r) + annualSIP;
        if (outflowByYear[y]) {
            goals.forEach(function (g) {
                if ((parseInt(g.years) || 0) === y) {
                    milestones.push({
                        idx: y, year: startYear + y, label: g.label, emoji: g.emoji,
                        target: g.target, onTrack: g.onTrack, balanceBefore: balance
                    });
                }
            });
            balance -= outflowByYear[y];
        }
        // Plot the true running balance — it may go negative when goals outpace
        // the corpus, so the shortfall is visible below zero rather than hidden.
        series.push({ year: startYear + y, value: Math.round(balance) });
    }
    return { series: series, milestones: milestones, startYear: startYear, horizon: horizon };
}
window.pathProjectSeries = pathProjectSeries;

// ── Render ────────────────────────────────────────────────────────
function pathRender() {
    var empty = document.getElementById('path-empty');
    var content = document.getElementById('path-content');
    if (!empty || !content) return; // panel not in DOM yet
    var st = window._pathState || { active: null, archive: [] };
    var plan = st.active;

    if (!plan) {
        empty.classList.remove('hidden');
        content.classList.add('hidden');
        if (_pathChart) { _pathChart.destroy(); _pathChart = null; }
        pathRenderArchive(st.archive || []);
        return;
    }
    empty.classList.add('hidden');
    content.classList.remove('hidden');

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
    pathRenderMilestones(proj.milestones);
    pathRenderCards(plan);
    pathRenderArchive(st.archive || []);
}
window.pathRender = pathRender;

function pathRenderChart(proj, plan) {
    var canvas = document.getElementById('path-chart');
    if (!canvas || typeof Chart === 'undefined') return;
    if (_pathChart) { _pathChart.destroy(); _pathChart = null; }

    var series = proj.series;
    var milestoneYears = {};
    proj.milestones.forEach(function (m) { milestoneYears[m.year] = m; });

    var pointRadius = series.map(function (p) { return milestoneYears[p.year] ? 5 : 0; });
    var pointColors = series.map(function (p) {
        var m = milestoneYears[p.year];
        if (!m) return 'rgba(0,0,0,0)';
        return m.onTrack ? '#10b981' : '#ef4444';
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
                // Fill relative to the zero line: indigo above, red "underwater"
                // below — so a shortfall reads instantly.
                fill: { target: 'origin', above: 'rgba(99,102,241,0.10)', below: 'rgba(239,68,68,0.16)' },
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
                            var m = milestoneYears[yr];
                            if (!m) return '';
                            return (m.onTrack ? '✅ ' : '🔴 ') + _pt('finpath.chart.mstip', '{label} — target {t}', { label: m.label, t: pathFmt(m.target) });
                        }
                    }
                }
            },
            scales: {
                x: { ticks: { font: { size: 9 }, maxTicksLimit: 12 }, grid: { display: false } },
                y: {
                    ticks: { font: { size: 9 }, callback: function (v) { return pathFmt(v); } },
                    grid: {
                        // Draw a stronger red baseline at ₹0 so a dip below it — the
                        // "underwater" zone — is obvious.
                        color: function (ctx) { return ctx.tick.value === 0 ? 'rgba(239,68,68,0.45)' : 'rgba(0,0,0,0.04)'; },
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
        var badge = m.onTrack ? _pt('finpath.ontrack', '✅ On track') : _pt('finpath.shortfall', '🔴 Shortfall');
        return '<div class="flex items-center gap-2 py-1.5 border-b border-slate-50 last:border-0">' +
            '<span class="text-base flex-shrink-0">' + (m.emoji || '🎯') + '</span>' +
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
            '<div class="path-card-title">' + _pt('finpath.card.alloc', '📊 Recommended Allocation') + '</div>' +
            allocs.map(function (a) {
                return '<div class="flex items-center gap-2 py-1">' +
                    '<div style="width:8px;height:8px;border-radius:50%;background:' + a.color + ';flex-shrink:0;"></div>' +
                    '<div class="text-[11px] text-slate-600 flex-1 min-w-0 truncate">' + (a.icon || '') + ' ' + _pathEsc(a.name) + '</div>' +
                    '<div class="text-[11px] font-black text-slate-700">' + a.pct + '%</div>' +
                '</div>';
            }).join('') +
        '</div>';
    }

    // Monthly SIP total
    html += '<div class="path-card">' +
        '<div class="flex items-center justify-between">' +
            '<span class="text-[11px] font-bold text-slate-500">' + _pt('finpath.card.sip', '💸 Monthly SIP') + '</span>' +
            '<span class="text-sm font-black text-indigo-600">' + _pt('finpath.card.permonth', '{v}/mo', { v: pathFull(plan.monthlyInvest || 0) }) + '</span>' +
        '</div>' +
        (plan.existingCorpus > 0
            ? '<div class="flex items-center justify-between mt-1.5 pt-1.5 border-t border-slate-100">' +
                '<span class="text-[11px] font-bold text-slate-500">' + _pt('finpath.card.existing', '🏦 Existing corpus') + '</span>' +
                '<span class="text-xs font-black text-slate-700">' + pathFmt(plan.existingCorpus) + '</span>' +
              '</div>'
            : '') +
    '</div>';

    // Per-goal on-track / shortfall
    var goals = plan.goalSIPs || [];
    if (goals.length) {
        html += '<div class="path-card">' +
            '<div class="path-card-title">' + _pt('finpath.card.goals', '🎯 Goals — Are You On Track?') + '</div>' +
            goals.map(function (g) {
                var c = g.onTrack ? '#10b981' : '#ef4444';
                var badge = g.onTrack ? _pt('finpath.ontrack', '✅ On track') : _pt('finpath.shortfall', '🔴 Shortfall');
                var shortfallLine = (!g.onTrack && g.gap > 0)
                    ? '<div class="text-[10px] text-rose-500 mt-0.5">' + _pt('finpath.goal.shortby', 'Short by {g}', { g: pathFmt(g.gap) }) +
                      (g.extraSIP > 0 ? _pt('finpath.goal.addclose', ' · add {e}/mo to close it', { e: pathFull(g.extraSIP) }) : '') + '</div>'
                    : '';
                return '<div class="py-2 border-b border-slate-50 last:border-0">' +
                    '<div class="flex items-center gap-2">' +
                        '<span class="text-base flex-shrink-0">' + (g.emoji || '🎯') + '</span>' +
                        '<div class="flex-1 min-w-0">' +
                            '<div class="text-[11px] font-bold text-slate-700 truncate">' + _pathEsc(g.label) + '</div>' +
                            '<div class="text-[10px] text-slate-400">' + _pt('finpath.goal.detail', 'in {y} yrs · target {t} · projected {p}', { y: g.years, t: pathFmt(g.target), p: pathFmt(g.effectiveCorpus || g.corpus || 0) }) + '</div>' +
                        '</div>' +
                        '<span class="text-[10px] font-black px-2 py-0.5 rounded-full flex-shrink-0" style="background:' + c + '18;color:' + c + ';">' + badge + '</span>' +
                    '</div>' +
                    shortfallLine +
                '</div>';
            }).join('') +
        '</div>';
    }

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
        var endVal = proj.series.length ? proj.series[proj.series.length - 1].value : 0;
        return '<div class="flex items-center gap-2 py-2 border-b border-slate-50 last:border-0">' +
            '<div class="flex-1 min-w-0">' +
                '<div class="text-[11px] font-bold text-slate-700">' + _pathDate(p.generatedAt) + '</div>' +
                '<div class="text-[10px] text-slate-400 truncate">' + _pathEsc(p.profileLabel || '') +
                    _pt('finpath.arch.detail', ' · projected {v} by {y}', { v: pathFmt(endVal), y: (proj.startYear + proj.horizon) }) + '</div>' +
            '</div>' +
            '<button onclick="pathRestore(' + i + ')" class="text-[10px] font-bold text-indigo-600 px-2 py-1 rounded-lg border border-indigo-100 hover:bg-indigo-50 flex-shrink-0">' + _pt('finpath.arch.restore', 'Restore') + '</button>' +
            '<button onclick="pathDeleteArchived(' + i + ')" class="text-[10px] font-bold text-slate-400 px-1.5 py-1 rounded-lg hover:text-rose-500 flex-shrink-0" title="' + _pt('finpath.arch.delete', 'Delete') + '">✕</button>' +
        '</div>';
    }).join('');
}
