    /* ══════════════════════════════════════════════════════════
       RETIREMENT HUB — Integrated Retirement View
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

    function retHubCalc() {
        var age       = Math.round(rhNum('rh-age')) || 30;
        var retAge    = Math.round(rhNum('rh-ret-age')) || 60;
        var lifeExp   = Math.round(rhNum('rh-life-exp')) || 90;
        var inflation = rhNumOr('rh-inflation', 6) / 100;
        var retReturn = rhNumOr('rh-ret-return', 7) / 100;
        var yrs       = Math.max(0, retAge - age);
        var drawYrs   = Math.max(1, lifeExp - retAge);

        // ── EPF ──────────────────────────────────────────────────────────
        var epfBal     = rhNum('rh-epf-balance');
        var epfBasic   = rhNum('rh-epf-basic');
        var EPF_RATE   = 0.0825;
        var epfBalFV   = epfBal * Math.pow(1 + EPF_RATE, yrs);
        var epfMonthly = 0;
        if (epfBasic > 0) {
            var emp = epfBasic * 0.12;
            var eps = Math.min(1250, Math.round(epfBasic * 0.0833));
            epfMonthly = emp + (emp - eps); // employee + employer excl EPS
        }
        var emr       = EPF_RATE / 12;
        var epfSipFV  = (yrs > 0) ? rhSipFV(epfMonthly, emr, yrs * 12) : 0;
        var epfCorpus = Math.round(epfBalFV + epfSipFV);

        // EPS pension (mirrors epf.js): min(basic, ₹15,000) × service ÷ 70, service capped
        // at 35 yrs. Only future service is known here, so this is a floor estimate;
        // EPS needs ≥10 yrs of service to qualify for pension
        var epsPension = (epfBasic > 0 && yrs >= 10)
            ? Math.round(Math.min(epfBasic, 15000) * Math.min(yrs, 35) / 70)
            : 0;

        // ── PPF ──────────────────────────────────────────────────────────
        var ppfBal       = rhNum('rh-ppf-balance');
        var ppfAnnual    = rhNum('rh-ppf-annual');
        var ppfYearsDone = Math.round(rhNum('rh-ppf-years-done'));
        var PPF_RATE     = 0.071;
        // Deposits continue only for the remaining years of the 15-yr term
        // (extensions not assumed); after maturity the balance compounds untouched
        var ppfContribYrs = Math.min(yrs, Math.max(0, 15 - ppfYearsDone));
        var ppfC = ppfBal;
        for (var py = 0; py < yrs; py++) {
            ppfC = (ppfC + (py < ppfContribYrs ? ppfAnnual : 0)) * (1 + PPF_RATE);
        }
        var ppfCorpus = Math.round(ppfC);

        // ── NPS ──────────────────────────────────────────────────────────
        var npsBal      = rhNum('rh-nps-balance');
        var npsMonthly  = rhNum('rh-nps-monthly');
        var npsReturn   = rhNumOr('rh-nps-return', 10) / 100;
        var npsAnnuity  = rhNumOr('rh-nps-annuity', 6) / 100;
        var nmr         = npsReturn / 12;
        var npsBalFV    = npsBal * Math.pow(1 + npsReturn, yrs);
        var npsSipFV    = (yrs > 0) ? rhSipFV(npsMonthly, nmr, yrs * 12) : 0;
        var npsTotalC      = Math.round(npsBalFV + npsSipFV);
        var npsLumpsumPct  = Math.min(100, Math.max(0, rhNumOr('rh-nps-lumpsum-pct', 60))) / 100;
        var npsLumpsum     = Math.round(npsTotalC * npsLumpsumPct);
        var npsAnnPool     = Math.round(npsTotalC * (1 - npsLumpsumPct));
        var npsPension     = Math.round((npsAnnPool * npsAnnuity) / 12);

        // ── SIP ───────────────────────────────────────────────────────────
        var sipMonthly = rhNum('rh-sip-monthly');
        var sipReturn  = rhNumOr('rh-sip-return', 12) / 100;
        var smr        = sipReturn / 12;
        var sipCorpus  = (yrs > 0) ? Math.round(rhSipFV(sipMonthly, smr, yrs * 12)) : 0;

        // ── Other ─────────────────────────────────────────────────────────
        var otherC      = rhNum('rh-other-corpus');
        var otherReturn = rhNumOr('rh-other-return', 7) / 100;
        var otherFV     = Math.round(otherC * Math.pow(1 + otherReturn, yrs));

        // ── Total withdrawable corpus ──────────────────────────────────────
        var totalCorpus = epfCorpus + ppfCorpus + npsLumpsum + sipCorpus + otherFV;

        // ── SWP (monthly, lasts drawYrs) ───────────────────────────────────
        var rMo = retReturn / 12;
        var n   = drawYrs * 12;
        var swp = totalCorpus > 0
            ? (rMo > 0 ? Math.round(totalCorpus * rMo / (1 - Math.pow(1 + rMo, -n)))
                       : Math.round(totalCorpus / n))
            : 0;
        var totalIncome = swp + npsPension + epsPension;

        // ── Expenses at retirement ─────────────────────────────────────────
        var expToday         = rhNum('rh-expenses');
        var expInflated      = Math.round(expToday * Math.pow(1 + inflation, yrs));
        var medExpToday      = rhNum('rh-medical-expenses');
        var medInflation     = rhNumOr('rh-medical-inflation', 12) / 100;
        var medInflated      = Math.round(medExpToday * Math.pow(1 + medInflation, yrs));
        var totalExpInflated = expInflated + medInflated;
        var gap              = totalIncome - totalExpInflated;

        if (totalCorpus > 0 || expToday > 0) {
            if (typeof window.saveToolSummary === 'function')
                window.saveToolSummary('retirement', {
                    totalCorpus:    totalCorpus,
                    monthlyIncome:  totalIncome,
                    yearsToRetire:  yrs,
                    retirementAge:  retAge,
                    gap:            gap
                });
        }

        // ── Corpus depletion simulation ────────────────────────────────────
        // Withdraws actual expenses (net of pensions), inflating them every year
        // of retirement — general at `inflation`, medical at `medInflation`
        function rhSimDepletion(startBal) {
            if (startBal <= 0) return null;
            var bal = startBal, gen = expInflated, med = medInflated;
            for (var mo = 1; mo <= 60 * 12; mo++) {
                bal = bal * (1 + rMo) - Math.max(0, gen + med - npsPension - epsPension);
                if (bal <= 0) return retAge + Math.floor(mo / 12);
                if (mo % 12 === 0) { gen *= 1 + inflation; med *= 1 + medInflation; }
            }
            return null; // outlasts the 60-yr simulation horizon
        }
        var depletionAge = rhSimDepletion(totalCorpus);

        // ── Stress test: -30% crash at retirement start ───────────────────
        // Haircut hits market-linked assets only (NPS lumpsum, SIP, other);
        // EPF and PPF are sovereign-backed and don't crash
        var stressDepletionAge = rhSimDepletion(
            epfCorpus + ppfCorpus + (npsLumpsum + sipCorpus + otherFV) * 0.70);

        // ── DOM updates ────────────────────────────────────────────────────
        function set(id, v) { var e = document.getElementById(id); if (e) e.textContent = v; }
        function pct(part)  { return totalCorpus > 0 ? Math.round(part / totalCorpus * 100) : 0; }

        set('rh-total-corpus',  rhFmt(totalCorpus));
        set('rh-ret-age-disp',  _t('rh.age.prefix') + retAge);
        set('rh-yrs-disp',      _t('rh.yrs.togo').replace('{n}', yrs));
        set('rh-draw-yrs-disp', _t('rh.yr.drawdown').replace('{n}', drawYrs));
        set('rh-epf-result',    rhFmt(epfCorpus));
        set('rh-ppf-result',    rhFmt(ppfCorpus));
        set('rh-nps-result',    rhFmt(npsLumpsum));
        set('rh-sip-result',    rhFmt(sipCorpus));
        set('rh-other-result',  rhFmt(otherFV));
        set('rh-nps-total-note', _t('rh.nps.note').replace('{pct}', Math.round(npsLumpsumPct * 100)).replace('{amt}', rhFmt(npsAnnPool)));

        var items = { epf: epfCorpus, ppf: ppfCorpus, nps: npsLumpsum, sip: sipCorpus, other: otherFV };
        Object.keys(items).forEach(function(k) {
            var p   = pct(items[k]);
            var bar = document.getElementById('rh-bar-' + k);
            var pEl = document.getElementById('rh-pct-' + k);
            if (bar) bar.style.width = p + '%';
            if (pEl) pEl.textContent = p + '%';
        });

        var pm = _t('rh.permonth');
        set('rh-swp',           rhFmt(swp) + pm);
        set('rh-nps-pension-d', rhFmt(npsPension) + pm);
        set('rh-eps-pension-d', rhFmt(epsPension) + pm);
        set('rh-total-income',  rhFmt(totalIncome) + pm);
        set('rh-exp-inflated',  rhFmt(totalExpInflated) + pm);
        set('rh-exp-note',      _t('rh.exp.note').replace('{gen}', expInflated.toLocaleString('en-IN')).replace('{med}', medInflated.toLocaleString('en-IN')).replace('{pct}', (medInflation * 100).toFixed(0)));

        var gapEl = document.getElementById('rh-gap');
        if (gapEl) {
            gapEl.textContent = (gap >= 0 ? '+' : '') + rhFmt(gap) + '/mo';
            gapEl.className   = 'text-2xl font-black mt-0.5 ' + (gap >= 0 ? 'text-emerald-400' : 'text-rose-400');
        }
        var gapLabelEl = document.getElementById('rh-gap-label');
        if (gapLabelEl) {
            gapLabelEl.textContent = gap >= 0 ? _t('rh.surplus') : _t('rh.shortfall');
            gapLabelEl.style.color = gap >= 0 ? '#6ee7b7' : '#fca5a5';
        }

        // Insight
        var insEl = document.getElementById('rh-insight');
        if (insEl) {
            var lines = [];
            lines.push(_t('rh.insight.line1').replace('{retAge}', retAge).replace('{corpus}', rhFmt(totalCorpus)).replace('{swp}', rhFmt(swp)).replace('{drawYrs}', drawYrs).replace('{retReturn}', (retReturn * 100).toFixed(0)));
            if (npsPension > 0)
                lines.push(_t('rh.insight.nps').replace('{lumpsumPct}', Math.round(npsLumpsumPct * 100)).replace('{lumpsum}', rhFmt(npsLumpsum)).replace('{annPool}', rhFmt(npsAnnPool)).replace('{pension}', rhFmt(npsPension)).replace('{totalIncome}', rhFmt(totalIncome)));
            if (epsPension > 0)
                lines.push(_t('rh.insight.eps').replace('{pension}', rhFmt(epsPension)).replace('{yrs}', Math.min(yrs, 35)));
            if (gap >= 0)
                lines.push(_t('rh.insight.surplus').replace('{gap}', rhFmt(gap)).replace('{totalExp}', rhFmt(totalExpInflated)).replace('{genExp}', rhFmt(expInflated)).replace('{medExp}', rhFmt(medInflated)));
            else {
                var shortfall = -gap;
                lines.push(_t('rh.insight.shortfall').replace('{gap}', rhFmt(shortfall)).replace('{totalExp}', rhFmt(totalExpInflated)).replace('{genExp}', rhFmt(expInflated)).replace('{medExp}', rhFmt(medInflated)).replace('{medPct}', (medInflation * 100).toFixed(0)));
                if (yrs > 0) {
                    // PV of retirement expenses net of pensions, with each expense
                    // component inflating annually through the drawdown years
                    var pvNeed = 0, pvGen = expInflated, pvMed = medInflated;
                    for (var m2 = 1; m2 <= n; m2++) {
                        pvNeed += Math.max(0, pvGen + pvMed - npsPension - epsPension) / Math.pow(1 + rMo, m2);
                        if (m2 % 12 === 0) { pvGen *= 1 + inflation; pvMed *= 1 + medInflation; }
                    }
                    var corpusGap = Math.max(0, pvNeed - totalCorpus);
                    var fvFactor  = smr > 0 ? ((Math.pow(1 + smr, yrs * 12) - 1) / smr) * (1 + smr) : yrs * 12;
                    var addlSip   = corpusGap / fvFactor;
                    if (addlSip > 500)
                        lines.push(_t('rh.insight.addsip').replace('{amount}', rhFmt(Math.round(addlSip))).replace('{pct}', (sipReturn * 100).toFixed(0)));
                }
            }
            if (depletionAge && depletionAge < lifeExp)
                lines.push(_t('rh.insight.corpusshort').replace('{age}', depletionAge).replace('{n}', lifeExp - depletionAge).replace('{lifeExp}', lifeExp));
            else if (totalCorpus > 0)
                lines.push(_t('rh.insight.corpuslasts').replace('{n}', lifeExp));
            if (medExpToday > 0)
                lines.push(_t('rh.insight.medical').replace('{pct}', (medInflation * 100).toFixed(0)).replace('{genPct}', (inflation * 100).toFixed(0)).replace('{today}', medExpToday.toLocaleString('en-IN')).replace('{inflated}', rhFmt(medInflated)));
            lines.push(_t('rh.insight.flat'));
            insEl.innerHTML = lines.map(function(l) { return '<p style="margin-bottom:4px">' + l + '</p>'; }).join('');
        }

        // ── Stress panel DOM updates ───────────────────────────────────────
        var baseOutlasts   = !depletionAge || depletionAge > lifeExp;
        var stressOutlasts = !stressDepletionAge || stressDepletionAge > lifeExp;
        var rhSd  = document.getElementById('rh-stress-depletion');
        var rhBd  = document.getElementById('rh-base-depletion');
        var rhSl  = document.getElementById('rh-stress-label');
        var rhBl  = document.getElementById('rh-base-label');
        var rhSi  = document.getElementById('rh-stress-insight');
        if (rhBd) rhBd.textContent = depletionAge ? String(depletionAge) : lifeExp + '+';
        if (rhSd) rhSd.textContent = stressDepletionAge ? String(stressDepletionAge) : lifeExp + '+';
        if (rhBl) {
            rhBl.textContent = baseOutlasts ? _t('rh.stress.outlasts') : _t('rh.stress.depletes').replace('{n}', depletionAge);
            rhBl.style.color = baseOutlasts ? '#86efac' : '#fbbf24';
        }
        if (rhSl) {
            rhSl.textContent = stressOutlasts ? _t('rh.stress.outlasts') : _t('rh.stress.depletes').replace('{n}', stressDepletionAge);
            rhSl.style.color = stressOutlasts ? '#86efac' : '#fca5a5';
        }
        if (rhSi) {
            if (!stressOutlasts && baseOutlasts) {
                rhSi.innerHTML = _t('rh.stress.insight.a').replace('{n}', stressDepletionAge);
            } else if (!stressOutlasts) {
                rhSi.innerHTML = _t('rh.stress.insight.b').replace('{base}', depletionAge).replace('{stress}', stressDepletionAge);
            } else {
                rhSi.innerHTML = _t('rh.stress.insight.c');
            }
        }

        if (typeof saveUserData === 'function') saveUserData();
    }
