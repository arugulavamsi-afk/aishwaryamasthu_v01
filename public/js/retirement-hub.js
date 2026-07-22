    /* ══════════════════════════════════════════════════════════
       RETIREMENT HUB — Integrated Retirement View
       One flow: build corpus → withdraw inflation-adjusted expenses
       → will it last? → smart fixes → depletion timeline.
    ══════════════════════════════════════════════════════════ */
    function rhFmt(n) { return '₹' + Math.round(n).toLocaleString('en-IN'); }
    function rhNum(id) {
        var el = document.getElementById(id);
        return el ? (parseFloat(el.value.replace(/[^0-9.]/g, '')) || 0) : 0;
    }
    // Like rhNum but falls back to def only when the field is empty/invalid,
    // so an explicit 0 (e.g. 0% lumpsum, 0% inflation) is honoured
    function rhNumOr(id, def) {
        var el = document.getElementById(id);
        if (!el || el.value === '') return def;
        var v = parseFloat(String(el.value).replace(/[^0-9.]/g, ''));
        return isNaN(v) ? def : v;
    }
    // FV of a level monthly contribution (annuity-due); principal sum when rate is 0
    function rhSipFV(mo, r, n) {
        if (mo <= 0 || n <= 0) return 0;
        return r > 0 ? mo * ((Math.pow(1 + r, n) - 1) / r) * (1 + r) : mo * n;
    }
    // First-year monthly withdrawal of an INFLATION-ADJUSTED SWP: month-end
    // withdrawals that hold level within each year and step up by `gAnnual` every
    // year, draining the pool `P` to exactly zero after `years` (pool earns `rMo`
    // monthly). Used for the sustainable-draw / monthly-gap figure. Reduces to the
    // classic flat annuity when gAnnual = 0.
    function rhGrowingSWP(P, rMo, gAnnual, years) {
        if (P <= 0 || years <= 0) return 0;
        if (rMo <= 0 && gAnnual <= 0) return Math.round(P / (years * 12));
        var a12 = rMo > 0 ? (1 - Math.pow(1 + rMo, -12)) / rMo : 12;
        var q   = (1 + gAnnual) / Math.pow(1 + rMo, 12);
        var series = Math.abs(q - 1) < 1e-9 ? years : (1 - Math.pow(q, years)) / (1 - q);
        var denom  = a12 * series;
        return denom > 0 ? Math.round(P / denom) : 0;
    }
    function rhFormatInput(el) {
        var raw = el.value.replace(/[^0-9]/g, '');
        if (raw) el.value = parseInt(raw).toLocaleString('en-IN');
    }

    var _rhDefs = {
        'rh-age':'30','rh-ret-age':'60','rh-life-exp':'90',
        'rh-inflation':'6','rh-ret-return':'7','rh-expenses':'60,000',
        'rh-medical-expenses':'5,000','rh-medical-inflation':'12',
        'rh-epf-balance':'2,00,000','rh-epf-basic':'50,000',
        'rh-ppf-balance':'0','rh-ppf-annual':'1,50,000','rh-ppf-years-done':'0',
        'rh-nps-balance':'0','rh-nps-monthly':'5,000','rh-nps-return':'10','rh-nps-annuity':'6','rh-nps-lumpsum-pct':'60',
        'rh-sip-monthly':'10,000','rh-sip-return':'12',
        'rh-other-corpus':'0','rh-other-return':'7'
    };

    // Timeline chart/table state (rendering helpers live in drawdown.js)
    var _rhYearData = [];
    var _rhChartView = 'corpus';
    var _rhChart = null;

    function initRetirementHub() {
        Object.entries(_rhDefs).forEach(function(kv) {
            var el = document.getElementById(kv[0]); if (!el) return;
            if (!el.value || el.value === kv[1]) el.classList.add('text-slate-400');
            else el.classList.remove('text-slate-400');
        });
        retHubCalc();
    }

    function rhToggleStress() {
        var panel   = document.getElementById('rh-stress-panel');
        var chevron = document.getElementById('rh-stress-chevron');
        var hidden  = panel.classList.toggle('hidden');
        if (chevron) chevron.textContent = hidden ? _t('rh.stress.show') : _t('rh.stress.hide');
    }

    function resetRetirementHub() {
        Object.entries(_rhDefs).forEach(function(kv) {
            var el = document.getElementById(kv[0]); if (!el) return;
            el.value = kv[1]; el.classList.add('text-slate-400');
        });
        retHubCalc();
        if (typeof saveUserData === 'function') saveUserData();
    }

    // ── Read all inputs once ──────────────────────────────────────────────────
    function rhReadInputs() {
        return {
            age:          Math.round(rhNum('rh-age')) || 30,
            retAge:       Math.round(rhNum('rh-ret-age')) || 60,
            lifeExp:      Math.round(rhNum('rh-life-exp')) || 90,
            inflation:    rhNumOr('rh-inflation', 6) / 100,
            retReturn:    rhNumOr('rh-ret-return', 7) / 100,
            expToday:     rhNum('rh-expenses'),
            medExpToday:  rhNum('rh-medical-expenses'),
            medInflation: rhNumOr('rh-medical-inflation', 12) / 100,
            epfBal:       rhNum('rh-epf-balance'),
            epfBasic:     rhNum('rh-epf-basic'),
            ppfBal:       rhNum('rh-ppf-balance'),
            ppfAnnual:    rhNum('rh-ppf-annual'),
            ppfYearsDone: Math.round(rhNum('rh-ppf-years-done')),
            npsBal:       rhNum('rh-nps-balance'),
            npsMonthly:   rhNum('rh-nps-monthly'),
            npsReturn:    rhNumOr('rh-nps-return', 10) / 100,
            npsAnnuity:   rhNumOr('rh-nps-annuity', 6) / 100,
            npsLumpsumPct: Math.min(100, Math.max(0, rhNumOr('rh-nps-lumpsum-pct', 60))) / 100,
            sipMonthly:   rhNum('rh-sip-monthly'),
            sipReturn:    rhNumOr('rh-sip-return', 12) / 100,
            otherC:       rhNum('rh-other-corpus'),
            otherReturn:  rhNumOr('rh-other-return', 7) / 100
        };
    }

    // ── Reusable corpus builder (parameterised by years-to-retirement) ─────────
    // Enables the "delay retirement" solver to re-price the whole corpus.
    function rhBuildCorpus(inp, yrs) {
        yrs = Math.max(0, yrs);
        // EPF
        var EPF_RATE   = 0.0825;
        var epfBalFV   = inp.epfBal * Math.pow(1 + EPF_RATE, yrs);
        var epfMonthly = 0;
        if (inp.epfBasic > 0) {
            var emp = inp.epfBasic * 0.12;
            var eps = Math.min(1250, Math.round(inp.epfBasic * 0.0833));
            epfMonthly = emp + (emp - eps);
        }
        var epfSipFV  = yrs > 0 ? rhSipFV(epfMonthly, EPF_RATE / 12, yrs * 12) : 0;
        var epfCorpus = Math.round(epfBalFV + epfSipFV);
        // EPS pension — floor estimate from future service (needs ≥10 yrs)
        var epsPension = (inp.epfBasic > 0 && yrs >= 10)
            ? Math.round(Math.min(inp.epfBasic, 15000) * Math.min(yrs, 35) / 70) : 0;
        // PPF — deposits only for remaining 15-yr term, then compounds untouched
        var PPF_RATE = 0.071;
        var ppfContribYrs = Math.min(yrs, Math.max(0, 15 - inp.ppfYearsDone));
        var ppfC = inp.ppfBal;
        for (var py = 0; py < yrs; py++) ppfC = (ppfC + (py < ppfContribYrs ? inp.ppfAnnual : 0)) * (1 + PPF_RATE);
        var ppfCorpus = Math.round(ppfC);
        // NPS — lumpsum is withdrawable; annuity pool funds the pension
        var npsBalFV  = inp.npsBal * Math.pow(1 + inp.npsReturn, yrs);
        var npsSipFV  = yrs > 0 ? rhSipFV(inp.npsMonthly, inp.npsReturn / 12, yrs * 12) : 0;
        var npsTotalC = Math.round(npsBalFV + npsSipFV);
        var npsLumpsum = Math.round(npsTotalC * inp.npsLumpsumPct);
        var npsAnnPool = Math.round(npsTotalC * (1 - inp.npsLumpsumPct));
        var npsPension = Math.round((npsAnnPool * inp.npsAnnuity) / 12);
        // SIP + Other
        var sipCorpus = yrs > 0 ? Math.round(rhSipFV(inp.sipMonthly, inp.sipReturn / 12, yrs * 12)) : 0;
        var otherFV   = Math.round(inp.otherC * Math.pow(1 + inp.otherReturn, yrs));
        var totalCorpus = epfCorpus + ppfCorpus + npsLumpsum + sipCorpus + otherFV;
        return {
            epfCorpus: epfCorpus, ppfCorpus: ppfCorpus, npsLumpsum: npsLumpsum,
            npsAnnPool: npsAnnPool, npsPension: npsPension, npsLumpsumPct: inp.npsLumpsumPct,
            sipCorpus: sipCorpus, otherFV: otherFV, totalCorpus: totalCorpus, epsPension: epsPension
        };
    }

    // ── Year-by-year drawdown simulation ──────────────────────────────────────
    // Withdraws inflation-adjusted expenses (general + medical, separate rates)
    // net of level pensions + any extra income; corpus earns annReturn.
    function rhPlanSim(startCorpus, cfg) {
        var bal = startCorpus;
        var gen = cfg.genY1, med = cfg.medY1, extra = cfg.extraY1 || 0;
        var data = [], depletionAge = null, balAtAge = {};
        var years = Math.max(1, cfg.planToAge - cfg.retAge + 1);
        for (var yr = 1; yr <= years; yr++) {
            var age     = cfg.retAge + yr - 1;
            var needM   = gen + med;
            var incomeM = (cfg.pensionM || 0) + extra;
            var netM    = Math.max(0, needM - incomeM);
            var annualW = netM * 12;
            var openBal = bal;
            var returns = openBal > 0 ? openBal * cfg.annReturn : 0;
            bal = openBal + returns - annualW;
            var closeBal = bal > 0 ? bal : 0;
            data.push({
                age: age, openBal: Math.round(Math.max(0, openBal)), monthly: Math.round(needM),
                netMonthly: Math.round(netM), annualW: Math.round(annualW),
                otherInc: Math.round(incomeM * 12), returns: Math.round(Math.max(0, returns)),
                closeBal: Math.round(closeBal)
            });
            balAtAge[age] = Math.round(closeBal);
            if (bal <= 0 && depletionAge === null) { depletionAge = age + 1; bal = 0; }
            gen *= (1 + cfg.inflation); med *= (1 + cfg.medInflation); extra *= (1 + cfg.inflation);
        }
        return { data: data, depletionAge: depletionAge, endBalance: Math.round(bal), balAtAge: balAtAge };
    }

    // ── Model one scenario with a modification; returns whether it lasts to lifeExp
    // mod: { extraSip, expenseFactor, retAgeDelta, extraIncomeM (today ₹/mo) }
    function rhModel(inp, mod) {
        mod = mod || {};
        var extraSip = mod.extraSip || 0;
        var f        = (mod.expenseFactor == null) ? 1 : mod.expenseFactor;
        var dRet     = mod.retAgeDelta || 0;
        var extraToday = mod.extraIncomeM || 0;
        var retAge = inp.retAge + dRet;
        var yrs    = Math.max(0, retAge - inp.age);
        var inp2   = extraSip ? Object.assign({}, inp, { sipMonthly: inp.sipMonthly + extraSip }) : inp;
        var c      = rhBuildCorpus(inp2, yrs);
        var genY1  = inp.expToday    * f * Math.pow(1 + inp.inflation, yrs);
        var medY1  = inp.medExpToday * f * Math.pow(1 + inp.medInflation, yrs);
        var sim = rhPlanSim(c.totalCorpus, {
            retAge: retAge, planToAge: Math.max(inp.lifeExp, 100), annReturn: inp.retReturn,
            genY1: genY1, medY1: medY1, inflation: inp.inflation, medInflation: inp.medInflation,
            pensionM: c.npsPension + c.epsPension,
            extraY1: extraToday * Math.pow(1 + inp.inflation, yrs)
        });
        var lasts = sim.depletionAge === null || sim.depletionAge > inp.lifeExp;
        return { lasts: lasts, depletionAge: sim.depletionAge };
    }

    // Binary search: smallest x in [lo,hi] with test(x) true (test monotonic ↑)
    function rhSolveMin(test, lo, hi, iters) {
        if (test(lo)) return lo;
        if (!test(hi)) return null;
        for (var i = 0; i < (iters || 34); i++) { var m = (lo + hi) / 2; if (test(m)) hi = m; else lo = m; }
        return hi;
    }
    // Binary search: largest x in [lo,hi] with test(x) true (test monotonic ↓)
    function rhSolveMax(test, lo, hi, iters) {
        if (!test(lo)) return null;
        if (test(hi)) return hi;
        for (var i = 0; i < (iters || 34); i++) { var m = (lo + hi) / 2; if (test(m)) lo = m; else hi = m; }
        return lo;
    }

    // ── Smart fixes when the corpus falls short ───────────────────────────────
    function rhBuildFixes(inp) {
        var fixes = [], L = inp.lifeExp;
        var todayExp = inp.expToday + inp.medExpToday;

        // 1) Increase SIP (only meaningful while still accumulating)
        if (inp.retAge > inp.age) {
            var addSip = rhSolveMin(function(x){ return rhModel(inp, { extraSip: x }).lasts; }, 0, 500000);
            if (addSip !== null && addSip > 100) {
                var rounded = Math.ceil(addSip / 100) * 100;
                var pct = inp.sipMonthly > 0 ? ' (+' + Math.round(rounded / inp.sipMonthly * 100) + '%)' : '';
                fixes.push({ icon: '📈', title: 'Increase monthly SIP by ' + rhFmt(rounded) + pct,
                    detail: 'Your corpus then lasts through retirement (to age ' + L + ').' });
            }
        }
        // 2) Reduce expenses
        var cut = rhSolveMin(function(r){ return rhModel(inp, { expenseFactor: 1 - r }).lasts; }, 0, 0.9);
        if (cut !== null && cut > 0.005) {
            var pctCut = Math.ceil(cut * 100);
            fixes.push({ icon: '✂️', title: 'Reduce monthly expenses by ' + pctCut + '%',
                detail: 'Trims today’s ' + rhFmt(todayExp) + '/mo to ' + rhFmt(Math.round(todayExp * (1 - pctCut / 100))) + '/mo — corpus lasts to age ' + L + '.' });
        }
        // 3) Delay retirement
        var delay = null, maxDelay = Math.max(0, 75 - inp.retAge);
        for (var d = 1; d <= maxDelay; d++) { if (rhModel(inp, { retAgeDelta: d }).lasts) { delay = d; break; } }
        if (delay !== null) {
            fixes.push({ icon: '⏳', title: 'Delay retirement to age ' + (inp.retAge + delay) + ' (+' + delay + ' yr' + (delay > 1 ? 's' : '') + ')',
                detail: 'More accumulation and a shorter drawdown — corpus lasts to age ' + L + '.' });
        }
        // 4) Extra income in retirement
        var addInc = rhSolveMin(function(x){ return rhModel(inp, { extraIncomeM: x }).lasts; }, 0, Math.max(todayExp, 20000));
        if (addInc !== null && addInc > 100) {
            fixes.push({ icon: '💼', title: 'Add ' + rhFmt(Math.ceil(addInc / 100) * 100) + '/mo income in retirement',
                detail: 'Part-time work, rental or an annuity — corpus lasts to age ' + L + '.' });
        }
        return fixes;
    }

    // ── Headroom when the corpus already lasts ────────────────────────────────
    function rhBuildHeadroom(inp) {
        var out = [], L = inp.lifeExp, todayExp = inp.expToday + inp.medExpToday;
        // Spend more
        var maxF = rhSolveMax(function(f){ return rhModel(inp, { expenseFactor: f }).lasts; }, 1, 3);
        if (maxF !== null && maxF > 1.02) {
            var extraPct = Math.floor((maxF - 1) * 100);
            out.push({ icon: '🌴', title: 'You could spend up to ' + extraPct + '% more',
                detail: 'Around ' + rhFmt(Math.round(todayExp * maxF)) + '/mo (today’s value) and still last to age ' + L + '.' });
        }
        // Retire earlier
        var earlier = 0, maxEarly = Math.max(0, inp.retAge - inp.age);
        for (var e = 1; e <= maxEarly; e++) { if (rhModel(inp, { retAgeDelta: -e }).lasts) earlier = e; else break; }
        if (earlier > 0) {
            out.push({ icon: '🎉', title: 'You could retire ' + earlier + ' year' + (earlier > 1 ? 's' : '') + ' earlier',
                detail: 'Retire at age ' + (inp.retAge - earlier) + ' and the corpus still lasts to age ' + L + '.' });
        }
        return out;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    function retHubCalc() {
        var inp     = rhReadInputs();
        var yrs     = Math.max(0, inp.retAge - inp.age);
        var drawYrs = Math.max(1, inp.lifeExp - inp.retAge);
        var rMo     = inp.retReturn / 12;

        var c           = rhBuildCorpus(inp, yrs);
        var totalCorpus = c.totalCorpus;
        var npsPension  = c.npsPension;
        var epsPension  = c.epsPension;
        var pensionM    = npsPension + epsPension;

        // Expenses inflated to the first year of retirement
        var expInflated = Math.round(inp.expToday    * Math.pow(1 + inp.inflation, yrs));
        var medInflated = Math.round(inp.medExpToday * Math.pow(1 + inp.medInflation, yrs));
        var monthlyNeed = expInflated + medInflated;
        var netDraw     = Math.max(0, monthlyNeed - pensionM);

        // Primary simulation (to 100 so the chart shows full depletion)
        var planToAge = Math.max(inp.lifeExp, 100);
        var plan = rhPlanSim(totalCorpus, {
            retAge: inp.retAge, planToAge: planToAge, annReturn: inp.retReturn,
            genY1: expInflated, medY1: medInflated,
            inflation: inp.inflation, medInflation: inp.medInflation, pensionM: pensionM, extraY1: 0
        });
        var yearData     = plan.data;
        var depletionAge = plan.depletionAge;
        var lasts        = (depletionAge === null) || (depletionAge > inp.lifeExp);
        var cushion      = plan.balAtAge[inp.lifeExp] || 0;
        var shortfallYrs = lasts ? 0 : (inp.lifeExp - depletionAge);

        // Sustainable inflation-adjusted monthly draw (for the /mo gap + profile card)
        var sustainableDraw = rhGrowingSWP(totalCorpus, rMo, inp.inflation, drawYrs);
        var monthlyGap      = (sustainableDraw + pensionM) - monthlyNeed;

        _rhYearData = yearData;

        // ── Profile summary ────────────────────────────────────────────────────
        if (totalCorpus > 0 || inp.expToday > 0) {
            if (typeof window.saveToolSummary === 'function')
                window.saveToolSummary('retirement', {
                    totalCorpus: totalCorpus, monthlyIncome: monthlyNeed,
                    yearsToRetire: yrs, retirementAge: inp.retAge, gap: Math.round(monthlyGap),
                    // Stored as percentages (rhReadInputs keeps them as fractions) so
                    // Financial Path can reuse the rates the user actually set here
                    // instead of hardcoding its own. See fpPostRetReturn() in app.js.
                    retReturnPct: inp.retReturn * 100, inflationPct: inp.inflation * 100,
                    lifeExpAge: inp.lifeExp
                });
        }

        // ── DOM helpers ──────────────────────────────────────────────────────────
        function set(id, v) { var e = document.getElementById(id); if (e) e.textContent = v; }
        function pct(part)  { return totalCorpus > 0 ? Math.round(part / totalCorpus * 100) : 0; }
        var pm = _t('rh.permonth');

        // Corpus header + breakdown
        set('rh-total-corpus',  rhFmt(totalCorpus));
        set('rh-ret-age-disp',  _t('rh.age.prefix') + inp.retAge);
        set('rh-yrs-disp',      _t('rh.yrs.togo').replace('{n}', yrs));
        set('rh-draw-yrs-disp', _t('rh.yr.drawdown').replace('{n}', drawYrs));
        set('rh-epf-result',    rhFmt(c.epfCorpus));
        set('rh-ppf-result',    rhFmt(c.ppfCorpus));
        set('rh-nps-result',    rhFmt(c.npsLumpsum));
        set('rh-sip-result',    rhFmt(c.sipCorpus));
        set('rh-other-result',  rhFmt(c.otherFV));
        set('rh-nps-total-note', _t('rh.nps.note').replace('{pct}', Math.round(c.npsLumpsumPct * 100)).replace('{amt}', rhFmt(c.npsAnnPool)));
        var items = { epf: c.epfCorpus, ppf: c.ppfCorpus, nps: c.npsLumpsum, sip: c.sipCorpus, other: c.otherFV };
        Object.keys(items).forEach(function(k) {
            var p = pct(items[k]);
            var bar = document.getElementById('rh-bar-' + k);
            var pEl = document.getElementById('rh-pct-' + k);
            if (bar) bar.style.width = p + '%';
            if (pEl) pEl.textContent = p + '%';
        });

        // Outcome row: need / pensions / net draw
        set('rh-need',          rhFmt(monthlyNeed) + pm);
        set('rh-need-note',     _t('rh.out.neednote').replace('{gen}', rhFmt(expInflated)).replace('{med}', rhFmt(medInflated)));
        set('rh-nps-pension-d', rhFmt(npsPension) + pm);
        set('rh-eps-pension-d', rhFmt(epsPension) + pm);
        set('rh-net-draw',      rhFmt(netDraw) + pm);

        // Verdict row
        set('rh-lasts-age', lasts ? (inp.lifeExp + '+') : String(depletionAge));
        set('rh-lasts-note', lasts ? _t('rh.out.outlasts') : _t('rh.out.shortby').replace('{n}', shortfallYrs).replace('{life}', inp.lifeExp));
        var vLbl = document.getElementById('rh-verdict-label');
        var vVal = document.getElementById('rh-verdict');
        var vNote= document.getElementById('rh-verdict-note');
        if (vLbl && vVal) {
            if (lasts) {
                vLbl.textContent  = _t('rh.out.cushionlbl').replace('{life}', inp.lifeExp);
                vVal.textContent  = rhFmt(cushion);
                vVal.style.color  = '#34d399';
                if (vNote) vNote.textContent = _t('rh.out.cushionnote');
            } else {
                vLbl.textContent  = _t('rh.out.shortlbl');
                vVal.textContent  = shortfallYrs + ' ' + _t('rh.out.yrs');
                vVal.style.color  = '#f87171';
                if (vNote) vNote.textContent = _t('rh.out.runsout').replace('{age}', depletionAge);
            }
        }

        // Plain-language summary
        var insEl = document.getElementById('rh-insight');
        if (insEl) {
            var s = 'At age <strong>' + inp.retAge + '</strong> you’ll need about <strong>' + rhFmt(monthlyNeed) + '/mo</strong>' +
                    ' (today’s ' + rhFmt(inp.expToday + inp.medExpToday) + '/mo, inflated). ';
            if (pensionM > 0) s += 'Pensions cover <strong>' + rhFmt(pensionM) + '/mo</strong>, so you draw <strong>' + rhFmt(netDraw) + '/mo</strong> from your <strong>' + rhFmt(totalCorpus) + '</strong> corpus. ';
            else s += 'You draw <strong>' + rhFmt(netDraw) + '/mo</strong> from your <strong>' + rhFmt(totalCorpus) + '</strong> corpus. ';
            s += lasts
                ? 'That lasts beyond age <strong>' + inp.lifeExp + '</strong>, leaving about <strong>' + rhFmt(cushion) + '</strong> spare. Withdrawals rise every year with inflation.'
                : 'Rising with inflation, it runs out at age <strong>' + depletionAge + '</strong> — <strong>' + shortfallYrs + ' years short</strong> of ' + inp.lifeExp + '. See the fixes below.';
            insEl.innerHTML = s;
        }

        // ── Smart fixes / headroom ───────────────────────────────────────────────
        var fixEl = document.getElementById('rh-fixes');
        if (fixEl) {
            var cards = lasts ? rhBuildHeadroom(inp) : rhBuildFixes(inp);
            var heading = lasts ? _t('rh.fix.ontrack') : _t('rh.fix.heading').replace('{life}', inp.lifeExp);
            var accent  = lasts ? '#059669' : '#b45309';
            var bg      = lasts ? '#f0fdf4' : '#fffbeb';
            var border  = lasts ? '#86efac' : '#fde68a';
            if (cards.length === 0 && lasts) {
                cards = [{ icon: '✅', title: _t('rh.fix.ontrackcard'), detail: _t('rh.fix.ontrackdetail').replace('{life}', inp.lifeExp) }];
            }
            var html = '<div class="text-[10px] font-black uppercase tracking-wider mb-2" style="color:' + accent + ';">' + heading + '</div>';
            html += cards.map(function(f) {
                return '<div class="flex items-start gap-2 rounded-xl px-2.5 py-2 mb-1.5" style="background:#fff;border:1px solid ' + border + ';">' +
                    '<span class="text-base leading-none flex-shrink-0">' + f.icon + '</span>' +
                    '<div><div class="text-[11px] font-black text-slate-800 leading-snug">' + f.title + '</div>' +
                    '<div class="text-[10px] text-slate-500 leading-snug mt-0.5">' + f.detail + '</div></div></div>';
            }).join('');
            fixEl.innerHTML = html;
            fixEl.style.background = bg;
            fixEl.style.border = '1px solid ' + border;
        }

        // ── Stress test: −30% on market assets at retirement start ────────────────
        var stressStart = c.epfCorpus + c.ppfCorpus + (c.npsLumpsum + c.sipCorpus + c.otherFV) * 0.70;
        var stressPlan = rhPlanSim(stressStart, {
            retAge: inp.retAge, planToAge: planToAge, annReturn: inp.retReturn,
            genY1: expInflated, medY1: medInflated,
            inflation: inp.inflation, medInflation: inp.medInflation, pensionM: pensionM, extraY1: 0
        });
        var stressDepl   = stressPlan.depletionAge;
        var baseOutlasts   = lasts;
        var stressOutlasts = (stressDepl === null) || (stressDepl > inp.lifeExp);
        set('rh-base-depletion',   depletionAge ? String(depletionAge) : inp.lifeExp + '+');
        set('rh-stress-depletion', stressDepl ? String(stressDepl) : inp.lifeExp + '+');
        var rhBl = document.getElementById('rh-base-label');
        var rhSl = document.getElementById('rh-stress-label');
        var rhSi = document.getElementById('rh-stress-insight');
        if (rhBl) { rhBl.textContent = baseOutlasts ? _t('rh.stress.outlasts') : _t('rh.stress.depletes').replace('{n}', depletionAge); rhBl.style.color = baseOutlasts ? '#86efac' : '#fbbf24'; }
        if (rhSl) { rhSl.textContent = stressOutlasts ? _t('rh.stress.outlasts') : _t('rh.stress.depletes').replace('{n}', stressDepl); rhSl.style.color = stressOutlasts ? '#86efac' : '#fca5a5'; }
        if (rhSi) {
            if (!stressOutlasts && baseOutlasts)      rhSi.innerHTML = _t('rh.stress.insight.a').replace('{n}', stressDepl);
            else if (!stressOutlasts)                 rhSi.innerHTML = _t('rh.stress.insight.b').replace('{base}', depletionAge).replace('{stress}', stressDepl);
            else                                      rhSi.innerHTML = _t('rh.stress.insight.c');
        }

        // ── Depletion timeline: stat pills, buckets, chart, table ─────────────────
        var realReturn = ((1 + inp.retReturn) / (1 + inp.inflation) - 1) * 100;
        var rr = realReturn / 100;
        var swr30 = rr > 0 ? (rr * Math.pow(1 + rr, 30)) / (Math.pow(1 + rr, 30) - 1) * 100 : (1 / 30 * 100);
        var corpusAt85 = plan.balAtAge[85] || 0;
        var swp75Entry = yearData.filter(function(d){ return d.age === 75; })[0];
        var swp75 = swp75Entry ? swp75Entry.netMonthly : 0;
        set('dd-real-return',  realReturn.toFixed(1) + '%');
        set('dd-swr',          Math.min(swr30, 6).toFixed(1) + '%');
        set('dd-corpus-at-85', ddFmt(corpusAt85));
        set('dd-swp-75',       ddFmt(swp75) + pm);

        var b1 = yearData.length > 0 ? yearData[0].annualW : 0;
        var b2 = 0;
        for (var i = 1; i <= 3 && i < yearData.length; i++) b2 += yearData[i].annualW / Math.pow(1.075, i);
        b2 = Math.round(b2);
        var b3 = Math.max(0, totalCorpus - b1 - b2);
        set('dd-b1-amount', ddFmt(b1) + _t('dd.peryear'));
        set('dd-b2-amount', ddFmt(b2));
        set('dd-b3-amount', ddFmt(b3));

        var rows = '';
        yearData.forEach(function(d, i) {
            if (i > 0 && yearData[i-1].closeBal === 0 && d.openBal === 0) return;
            var bg  = i % 2 === 0 ? 'background:#fff7ed;' : '';
            var clr = d.closeBal === 0 ? 'color:#dc2626;font-weight:900;' : '';
            rows += '<tr style="' + bg + '">' +
                '<td class="px-2 py-1 font-black text-slate-600">' + d.age + '</td>' +
                '<td class="px-2 py-1 text-right text-slate-600">' + ddFmt(d.openBal) + '</td>' +
                '<td class="px-2 py-1 text-right text-orange-600">' + ddFmt(d.netMonthly) + pm + '</td>' +
                '<td class="px-2 py-1 text-right text-slate-500">' + ddFmt(d.annualW) + '</td>' +
                '<td class="px-2 py-1 text-right text-emerald-600">' + (d.otherInc > 0 ? ddFmt(d.otherInc) : '—') + '</td>' +
                '<td class="px-2 py-1 text-right text-emerald-700 font-bold">' + ddFmt(d.returns) + '</td>' +
                '<td class="px-2 py-1 text-right font-black" style="' + clr + '">' + (d.closeBal > 0 ? ddFmt(d.closeBal) : _t('dd.depleted')) + '</td>' +
            '</tr>';
        });
        var tbody = document.getElementById('dd-table-body');
        if (tbody) tbody.innerHTML = rows;

        if (typeof ddRenderChart === 'function') { _ddYearData = yearData; ddRenderChart(yearData); }

        if (typeof saveUserData === 'function') saveUserData();
    }
