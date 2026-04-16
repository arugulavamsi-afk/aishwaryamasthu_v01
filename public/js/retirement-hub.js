    /* ══════════════════════════════════════════════════════════
       RETIREMENT HUB — Integrated Retirement View
    ══════════════════════════════════════════════════════════ */
    function rhFmt(n) { return '₹' + Math.round(n).toLocaleString('en-IN'); }
    function rhNum(id) {
        var el = document.getElementById(id);
        return el ? (parseFloat(el.value.replace(/[^0-9.]/g, '')) || 0) : 0;
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
        var inflation = (rhNum('rh-inflation') || 6) / 100;
        var retReturn = (rhNum('rh-ret-return') || 7) / 100;
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
        var epfSipFV  = (epfMonthly > 0 && yrs > 0 && emr > 0)
            ? epfMonthly * ((Math.pow(1 + emr, yrs * 12) - 1) / emr) * (1 + emr)
            : 0;
        var epfCorpus = Math.round(epfBalFV + epfSipFV);

        // ── PPF ──────────────────────────────────────────────────────────
        var ppfBal    = rhNum('rh-ppf-balance');
        var ppfAnnual = rhNum('rh-ppf-annual');
        var PPF_RATE  = 0.071;
        var ppfC      = ppfBal;
        for (var py = 0; py < yrs; py++) {
            ppfC = (ppfC + ppfAnnual) * (1 + PPF_RATE);
        }
        var ppfCorpus = Math.round(ppfC);

        // ── NPS ──────────────────────────────────────────────────────────
        var npsBal      = rhNum('rh-nps-balance');
        var npsMonthly  = rhNum('rh-nps-monthly');
        var npsReturn   = (rhNum('rh-nps-return') || 10) / 100;
        var npsAnnuity  = (rhNum('rh-nps-annuity') || 6) / 100;
        var nmr         = npsReturn / 12;
        var npsBalFV    = npsBal * Math.pow(1 + npsReturn, yrs);
        var npsSipFV    = (npsMonthly > 0 && yrs > 0 && nmr > 0)
            ? npsMonthly * ((Math.pow(1 + nmr, yrs * 12) - 1) / nmr) * (1 + nmr)
            : 0;
        var npsTotalC      = Math.round(npsBalFV + npsSipFV);
        var npsLumpsumPct  = Math.min(100, Math.max(0, rhNum('rh-nps-lumpsum-pct') || 60)) / 100;
        var npsLumpsum     = Math.round(npsTotalC * npsLumpsumPct);
        var npsAnnPool     = Math.round(npsTotalC * (1 - npsLumpsumPct));
        var npsPension     = Math.round((npsAnnPool * npsAnnuity) / 12);

        // ── SIP ───────────────────────────────────────────────────────────
        var sipMonthly = rhNum('rh-sip-monthly');
        var sipReturn  = (rhNum('rh-sip-return') || 12) / 100;
        var smr        = sipReturn / 12;
        var sipCorpus  = (sipMonthly > 0 && yrs > 0 && smr > 0)
            ? Math.round(sipMonthly * ((Math.pow(1 + smr, yrs * 12) - 1) / smr) * (1 + smr))
            : 0;

        // ── Other ─────────────────────────────────────────────────────────
        var otherC      = rhNum('rh-other-corpus');
        var otherReturn = (rhNum('rh-other-return') || 7) / 100;
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
        var totalIncome = swp + npsPension;

        // ── Expenses at retirement ─────────────────────────────────────────
        var expToday         = rhNum('rh-expenses');
        var expInflated      = Math.round(expToday * Math.pow(1 + inflation, yrs));
        var medExpToday      = rhNum('rh-medical-expenses');
        var medInflation     = (rhNum('rh-medical-inflation') || 12) / 100;
        var medInflated      = Math.round(medExpToday * Math.pow(1 + medInflation, yrs));
        var totalExpInflated = expInflated + medInflated;
        var gap              = totalIncome - totalExpInflated;

        // ── Corpus depletion simulation ────────────────────────────────────
        var depletionAge = null;
        var needMo = Math.max(0, totalExpInflated - npsPension);
        if (needMo > 0 && totalCorpus > 0) {
            var bal = totalCorpus;
            for (var mo = 1; mo <= 60 * 12; mo++) {
                bal = bal * (1 + rMo) - needMo;
                if (bal <= 0) { depletionAge = retAge + Math.floor(mo / 12); break; }
            }
        }

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
        set('rh-nps-total-note', '(' + Math.round(npsLumpsumPct * 100) + '% lumpsum · annuity pool ' + rhFmt(npsAnnPool) + ')');

        var items = { epf: epfCorpus, ppf: ppfCorpus, nps: npsLumpsum, sip: sipCorpus, other: otherFV };
        Object.keys(items).forEach(function(k) {
            var p   = pct(items[k]);
            var bar = document.getElementById('rh-bar-' + k);
            var pEl = document.getElementById('rh-pct-' + k);
            if (bar) bar.style.width = p + '%';
            if (pEl) pEl.textContent = p + '%';
        });

        set('rh-swp',           rhFmt(swp) + '/mo');
        set('rh-nps-pension-d', rhFmt(npsPension) + '/mo');
        set('rh-total-income',  rhFmt(totalIncome) + '/mo');
        set('rh-exp-inflated',  rhFmt(totalExpInflated) + '/mo');
        set('rh-exp-note',      'General ₹' + expInflated.toLocaleString('en-IN') + ' + Medical ₹' + medInflated.toLocaleString('en-IN') + ' (at ' + (medInflation * 100).toFixed(0) + '% p.a.)');

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
            lines.push('At <strong>age ' + retAge + '</strong>, your total withdrawable corpus is <strong>' + rhFmt(totalCorpus) + '</strong>. ' +
                'This supports <strong>' + rhFmt(swp) + '/mo</strong> via SWP for ' + drawYrs + ' years at ' + (retReturn * 100).toFixed(0) + '% post-retirement return.');
            if (npsPension > 0)
                lines.push('NPS: ' + Math.round(npsLumpsumPct * 100) + '% lumpsum (' + rhFmt(npsLumpsum) + ') + annuity pool ' + rhFmt(npsAnnPool) + ' adds <strong>' + rhFmt(npsPension) + '/mo</strong> pension — total income <strong>' + rhFmt(totalIncome) + '/mo</strong>.');
            if (gap >= 0)
                lines.push('<span style="color:#065f46;font-weight:700">✅ Surplus: ' + rhFmt(gap) + '/mo</span> — retirement income exceeds projected expenses of ' + rhFmt(totalExpInflated) + '/mo (general ' + rhFmt(expInflated) + ' + medical ' + rhFmt(medInflated) + '). You\'re on track.');
            else {
                var shortfall = -gap;
                lines.push('<span style="color:#991b1b;font-weight:700">⚠️ Shortfall: ' + rhFmt(shortfall) + '/mo</span> vs projected expenses of ' + rhFmt(totalExpInflated) + '/mo at retirement (general ' + rhFmt(expInflated) + ' + medical ' + rhFmt(medInflated) + ' at ' + (medInflation * 100).toFixed(0) + '% p.a.).');
                if (sipMonthly > 0 && yrs > 0 && smr > 0 && rMo > 0) {
                    var corpusNeeded = (totalExpInflated - npsPension) * (1 - Math.pow(1 + rMo, -n)) / rMo;
                    var corpusGap    = Math.max(0, corpusNeeded - totalCorpus);
                    var addlSip      = corpusGap * smr / ((Math.pow(1 + smr, yrs * 12) - 1) * (1 + smr));
                    if (addlSip > 500)
                        lines.push('💡 Increase SIP by ~<strong>' + rhFmt(Math.round(addlSip)) + '/mo</strong> at ' + (sipReturn * 100).toFixed(0) + '% return to bridge the gap.');
                }
            }
            if (depletionAge && depletionAge < lifeExp)
                lines.push('<span style="color:#92400e;font-weight:700">⚠️ Warning:</span> Corpus depletes at <strong>age ' + depletionAge + '</strong> — ' + (lifeExp - depletionAge) + ' years short of life expectancy (' + lifeExp + ').');
            else if (!depletionAge && totalCorpus > 0)
                lines.push('✅ Corpus <strong>outlasts life expectancy</strong> (age ' + lifeExp + '). Strong retirement foundation.');
            if (medExpToday > 0)
                lines.push('<span style="color:#be123c;font-weight:700">🏥 Healthcare note:</span> Medical costs projected at <strong>' + (medInflation * 100).toFixed(0) + '% p.a.</strong> (vs ' + (inflation * 100).toFixed(0) + '% general inflation). Today\'s ₹' + medExpToday.toLocaleString('en-IN') + '/mo medical spend inflates to <strong>' + rhFmt(medInflated) + '/mo</strong> by retirement — included in the numbers above.');
            insEl.innerHTML = lines.map(function(l) { return '<p style="margin-bottom:4px">' + l + '</p>'; }).join('');
        }

        if (typeof saveUserData === 'function') saveUserData();
    }
