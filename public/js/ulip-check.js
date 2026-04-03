    /* ══════════════════════════════════════════════════════════
       ULIP / ENDOWMENT POLICY ANALYZER
    ══════════════════════════════════════════════════════════ */

    var _ucDefaults = {
        'uc-premium':'50,000','uc-term':'21','uc-paid':'5',
        'uc-maturity':'15,00,000','uc-sv':'1,50,000',
        'uc-cover':'10,00,000','uc-age':'35','uc-inv-return':'12'
    };

    function ucFmt(n) {
        var a = Math.abs(n), s = n < 0 ? '-' : '';
        if (a >= 1e7) return s + '₹' + (a / 1e7).toFixed(2) + ' Cr';
        if (a >= 1e5) return s + '₹' + (a / 1e5).toFixed(2) + ' L';
        return s + '₹' + Math.round(a).toLocaleString('en-IN');
    }

    function ucNum(id) {
        return parseFloat((document.getElementById(id)?.value || '').replace(/,/g, '')) || 0;
    }

    function ucFmtInput(el) {
        var raw = (el.value || '').replace(/[^0-9]/g, '');
        el.value = raw ? Number(raw).toLocaleString('en-IN') : '';
    }

    function ucSet(id, txt) {
        var el = document.getElementById(id);
        if (el) el.textContent = txt;
    }

    // Bisection IRR: all premiums paid from year 1..term, maturity at year term
    function _ucTotalIRR(premium, term, maturity) {
        function npv(r) {
            var s = 0;
            for (var t = 1; t <= term; t++) s -= premium / Math.pow(1 + r, t);
            s += maturity / Math.pow(1 + r, term);
            return s;
        }
        var lo = -0.50, hi = 2.0;
        if (npv(hi) > 0) return hi;   // maturity astronomically high
        if (npv(lo) < 0) return lo;   // IRR below -50%
        for (var i = 0; i < 200; i++) {
            var mid = (lo + hi) / 2;
            if (npv(mid) > 0) lo = mid; else hi = mid;
        }
        return (lo + hi) / 2;
    }

    // Forward IRR: opportunity cost of SV + remaining premiums → maturity
    function _ucForwardIRR(sv, premium, remaining, maturity) {
        if (remaining <= 0) return null;
        function npv(r) {
            var s = -sv;
            for (var t = 1; t <= remaining; t++) s -= premium / Math.pow(1 + r, t);
            s += maturity / Math.pow(1 + r, remaining);
            return s;
        }
        var lo = -0.50, hi = 2.0;
        if (npv(hi) > 0) return hi;
        if (npv(lo) < 0) return lo;
        for (var i = 0; i < 200; i++) {
            var mid = (lo + hi) / 2;
            if (npv(mid) > 0) lo = mid; else hi = mid;
        }
        return (lo + hi) / 2;
    }

    function initUlipCheck() {
        Object.keys(_ucDefaults).forEach(function(id) {
            var el = document.getElementById(id);
            if (!el || !el.value || el.value === _ucDefaults[id]) {
                if (el) el.classList.add('text-slate-400');
            } else {
                el.classList.remove('text-slate-400');
            }
        });
        ucCalc();
    }

    function resetUlipCheck() {
        Object.entries(_ucDefaults).forEach(function(entry) {
            var el = document.getElementById(entry[0]);
            if (!el) return;
            el.value = entry[1];
            el.classList.add('text-slate-400');
        });
        var slabEl = document.getElementById('uc-slab');
        if (slabEl) slabEl.value = '20';
        ucCalc();
        if (typeof saveUserData === 'function') saveUserData();
    }

    function ucPreset(type) {
        var presets = {
            jeevan_anand: { premium:50000,  term:21, paid:5, maturity:1500000, sv:150000,  cover:1000000, age:35 },
            endowment:    { premium:30000,  term:20, paid:3, maturity:800000,  sv:60000,   cover:500000,  age:32 },
            moneyback:    { premium:45000,  term:20, paid:7, maturity:1200000, sv:250000,  cover:750000,  age:40 },
            ulip:         { premium:100000, term:15, paid:5, maturity:2500000, sv:400000,  cover:1000000, age:38 }
        };
        var p = presets[type]; if (!p) return;
        var fmtIds = ['uc-premium','uc-maturity','uc-sv','uc-cover'];
        [['uc-premium',p.premium],['uc-term',p.term],['uc-paid',p.paid],
         ['uc-maturity',p.maturity],['uc-sv',p.sv],['uc-cover',p.cover],['uc-age',p.age]
        ].forEach(function(pair) {
            var el = document.getElementById(pair[0]);
            if (!el) return;
            el.value = fmtIds.indexOf(pair[0]) !== -1
                ? Number(pair[1]).toLocaleString('en-IN')
                : String(pair[1]);
            el.classList.remove('text-slate-400');
        });
        ucCalc();
    }

    function ucCalc() {
        var premium   = ucNum('uc-premium');
        var term      = Math.round(ucNum('uc-term'));
        var paid      = Math.round(ucNum('uc-paid'));
        var maturity  = ucNum('uc-maturity');
        var sv        = ucNum('uc-sv');
        var cover     = ucNum('uc-cover');
        var age       = Math.round(ucNum('uc-age')) || 35;
        var invRet    = ucNum('uc-inv-return') || 12;
        var slabPct   = parseFloat(document.getElementById('uc-slab')?.value || '20');

        if (!premium || !term || !maturity) return;
        paid = Math.min(paid, term);
        var remaining = term - paid;

        // ── Summary numbers ─────────────────────────────────────
        var totalPaid   = premium * paid;
        var totalRemain = premium * remaining;

        // ── IRRs ─────────────────────────────────────────────────
        var totalIRR = _ucTotalIRR(premium, term, maturity);
        var fwdIRR   = remaining > 0 ? _ucForwardIRR(sv, premium, remaining, maturity) : null;

        // ── Term cost estimate ────────────────────────────────────
        var ratePerL = age <= 30 ? 8 : age <= 35 ? 10 : age <= 40 ? 14 : age <= 45 ? 20 : 30;
        var termCost = Math.round((cover / 100000) * ratePerL * 100);

        // ── BTID corpus ───────────────────────────────────────────
        var freeInvest = premium - termCost;          // annual surplus after buying term
        var r = invRet / 100;
        var btidCorpus = 0;
        if (remaining > 0) {
            if (freeInvest > 0) {
                // SV grows + monthly SIP of freeInvest/12
                var monthly = freeInvest / 12;
                var mRate   = r / 12;
                var months  = remaining * 12;
                var sipGrowth = monthly * (Math.pow(1 + mRate, months) - 1) / mRate * (1 + mRate);
                btidCorpus = sv * Math.pow(1 + r, remaining) + sipGrowth;
            } else {
                // Only surrender value grows; term cost > premium so no surplus
                btidCorpus = sv * Math.pow(1 + r, remaining);
            }
        } else {
            btidCorpus = sv;
        }

        var advantage = btidCorpus - maturity;

        // ── 80C tax benefit ───────────────────────────────────────
        var annualTaxBenefit  = Math.min(premium, 150000) * (slabPct / 100);
        var totalTaxBenefit   = annualTaxBenefit * remaining;
        var effPremium        = premium - annualTaxBenefit;
        var effTotalIRR       = _ucTotalIRR(effPremium > 0 ? effPremium : 1, term, maturity);

        // ── DOM: IRR cards ────────────────────────────────────────
        var irrPct = (totalIRR * 100).toFixed(2);
        var irrEl  = document.getElementById('uc-irr');
        if (irrEl) {
            irrEl.textContent = irrPct + '%';
            irrEl.style.color = totalIRR < 0.05 ? '#ef4444' : totalIRR < 0.07 ? '#f59e0b' : '#10b981';
        }

        var gradeEl = document.getElementById('uc-irr-grade');
        if (gradeEl) {
            if (totalIRR < 0.03)       gradeEl.textContent = '🔴 Terrible — below savings account rate';
            else if (totalIRR < 0.05)  gradeEl.textContent = '🔴 Very Poor — FD gives more than this';
            else if (totalIRR < 0.06)  gradeEl.textContent = '🟡 Poor — barely at FD rate';
            else if (totalIRR < 0.07)  gradeEl.textContent = '🟡 Below Average — inflation erodes it';
            else if (totalIRR < 0.08)  gradeEl.textContent = '🟡 Mediocre — marginally above FD';
            else                        gradeEl.textContent = '🟢 Decent — but verify with BTID below';
        }

        var effIrrEl = document.getElementById('uc-eff-irr');
        if (effIrrEl) {
            effIrrEl.textContent = (effTotalIRR * 100).toFixed(2) + '%';
            effIrrEl.style.color = effTotalIRR < 0.06 ? '#f59e0b' : '#10b981';
        }

        var fwdEl = document.getElementById('uc-fwd-irr');
        if (fwdEl && fwdIRR !== null) {
            var fwdPct = (fwdIRR * 100).toFixed(2);
            fwdEl.textContent = fwdPct + '%';
            fwdEl.style.color = fwdIRR < 0.06 ? '#ef4444' : fwdIRR < 0.09 ? '#f59e0b' : '#10b981';
        } else if (fwdEl) {
            fwdEl.textContent = '—';
        }

        // ── DOM: summary numbers ──────────────────────────────────
        ucSet('uc-total-paid',      ucFmt(totalPaid));
        ucSet('uc-total-remain',    ucFmt(totalRemain));
        ucSet('uc-remaining-years', remaining + ' yrs left');
        ucSet('uc-term-cost',       ucFmt(termCost) + '/yr');
        ucSet('uc-free-invest',     freeInvest > 0 ? ucFmt(freeInvest) + '/yr' : 'Term > Premium');
        ucSet('uc-btid-corpus',     ucFmt(Math.round(btidCorpus)));
        ucSet('uc-policy-maturity', ucFmt(maturity));
        ucSet('uc-tax-benefit',     ucFmt(annualTaxBenefit) + '/yr · ' + ucFmt(totalTaxBenefit) + ' total');
        ucSet('uc-sv-display',      ucFmt(sv));

        var advEl = document.getElementById('uc-advantage');
        if (advEl) {
            if (advantage >= 0) {
                advEl.textContent = '+' + ucFmt(Math.round(advantage)) + ' more via BTID';
                advEl.style.color = '#10b981';
            } else {
                advEl.textContent = ucFmt(Math.round(-advantage)) + ' more from policy';
                advEl.style.color = '#f59e0b';
            }
        }

        // ── Recommendation ────────────────────────────────────────
        var recEl = document.getElementById('uc-recommendation');
        if (recEl) {
            var rec, bg, bdr, clr;
            if (totalIRR < 0.04) {
                rec = '🚨 <strong>STRONGLY RECOMMEND SURRENDERING.</strong> This policy earns less than a savings account (' + irrPct + '% IRR). Even a simple FD at 7% would be better. The BTID strategy projects <strong>' + ucFmt(Math.round(btidCorpus)) + '</strong> vs policy maturity of <strong>' + ucFmt(maturity) + '</strong>. <em>First buy a pure term plan to replace the cover, then surrender.</em>';
                bg='#fef2f2'; bdr='#ef4444'; clr='#7f1d1d';
            } else if (totalIRR < 0.06 && advantage > 0) {
                rec = '⚠️ <strong>LIKELY WORTH SURRENDERING.</strong> Policy IRR ' + irrPct + '% is at or below FD rate. BTID projects <strong>' + ucFmt(Math.round(btidCorpus)) + '</strong> vs <strong>' + ucFmt(maturity) + '</strong> — a surplus of <strong>' + ucFmt(Math.round(advantage)) + '</strong>. Note: continuing gives 80C tax benefit of ~' + ucFmt(totalTaxBenefit) + ' total — factor this in. <em>Buy term insurance first before surrendering.</em>';
                bg='#fff7ed'; bdr='#f97316'; clr='#7c2d12';
            } else if (totalIRR < 0.08 && advantage > 0) {
                rec = '💡 <strong>CONSIDER SURRENDERING.</strong> BTID projects more wealth. However, policy IRR of ' + irrPct + '% is above FD rate. Key question: is this cover (' + ucFmt(cover) + ') your <em>only</em> life insurance? If yes, buy a term plan first. Also consider: 80C benefit of ~' + ucFmt(totalTaxBenefit) + ' reduces your effective cost if you stay.';
                bg='#fffbeb'; bdr='#fde68a'; clr='#78350f';
            } else if (advantage <= 0) {
                rec = '✅ <strong>CONTINUE THE POLICY</strong> in this scenario. The policy maturity (' + ucFmt(maturity) + ') exceeds the BTID projection. However: <strong>never rely on an endowment policy as your primary life cover</strong> — buy a separate term plan. Also verify the maturity projection in your policy bond is realistic.';
                bg='#f0fdf4'; bdr='#86efac'; clr='#14532d';
            } else {
                rec = '💡 <strong>MARGINAL CASE.</strong> IRR of ' + irrPct + '% and BTID advantage of ' + ucFmt(Math.round(advantage)) + '. Decision depends on your other 80C investments, risk appetite, and whether this is your only life cover. Consult a SEBI-registered fee-only advisor before deciding.';
                bg='#eff6ff'; bdr='#93c5fd'; clr='#1e3a5f';
            }
            recEl.innerHTML = '<div class="text-[11px] leading-relaxed">' + rec + '</div>';
            recEl.style.cssText = 'background:' + bg + ';border:1.5px solid ' + bdr + ';color:' + clr + ';border-radius:14px;padding:12px 14px;';
        }

        if (typeof saveUserData === 'function') saveUserData();
    }
