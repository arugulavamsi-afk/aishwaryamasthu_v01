    /* ══════════════════════════════════════════════════════════
       FIXED INCOME TOOLS
    ══════════════════════════════════════════════════════════ */

    var _fiNewSlabs = [
        ['0',  '0% — ≤₹4L (nil) / 87A rebate ≤₹12L'],
        ['5',  '5% — ₹4L–₹8L'],
        ['10', '10% — ₹8L–₹12L'],
        ['15', '15% — ₹12L–₹16L'],
        ['20', '20% — ₹16L–₹20L'],
        ['25', '25% — ₹20L–₹24L'],
        ['30', '30% — Above ₹24L']
    ];
    var _fiOldSlabs = [
        ['0',  '0% — ≤₹2.5L (nil slab)'],
        ['5',  '5% — ₹2.5L–₹5L'],
        ['20', '20% — ₹5L–₹10L'],
        ['30', '30% — Above ₹10L']
    ];

    function fiSetSlabOptions(slabId, regime) {
        var el = document.getElementById(slabId);
        if (!el) return;
        var prev = el.value;
        var opts = regime === 'old' ? _fiOldSlabs : _fiNewSlabs;
        el.innerHTML = opts.map(function(o) {
            return '<option value="' + o[0] + '">' + o[1] + '</option>';
        }).join('');
        el.value = opts.some(function(o) { return o[0] === prev; }) ? prev : '30';
        el.classList.remove('text-slate-400'); // selects are never greyed
    }

    function fiUpdateSlabs(tab) {
        var pairs = {
            fd:    [['fi-fd-regime',   'fi-fd-slab']],
            scss:  [['fi-scss-regime', 'fi-scss-slab'], ['fi-pomis-regime','fi-pomis-slab']],
            pomis: [['fi-pomis-regime','fi-pomis-slab']],
            nsc:   [['fi-nsc-regime',  'fi-nsc-slab']],
            elss:  [['fi-cmp-regime',  'fi-cmp-slab']]
        };
        (pairs[tab] || []).forEach(function(pair) {
            var regEl = document.getElementById(pair[0]);
            if (regEl) regEl.classList.remove('text-slate-400');
            var regime = regEl?.value || 'new';
            fiSetSlabOptions(pair[1], regime);
        });
        if (tab === 'fd')    fiCalcFD();
        if (tab === 'scss')  { fiCalcSCSS(); }
        if (tab === 'pomis') { fiCalcPOMIS(); }
        if (tab === 'nsc')   { fiCalcNSC(); }
        if (tab === 'elss')  fiCalcELSS();
        if (typeof saveUserData === 'function') saveUserData();
    }

    function fiFmt(n) {
        if (!n && n !== 0) return '—';
        var a = Math.abs(n), s = n < 0 ? '-' : '';
        if (a >= 1e7) return s + '₹' + (a/1e7).toFixed(2) + ' Cr';
        if (a >= 1e5) return s + '₹' + (a/1e5).toFixed(2) + ' L';
        return s + '₹' + Math.round(a).toLocaleString('en-IN');
    }
    function fiNum(id) {
        return parseFloat((document.getElementById(id)?.value || '').replace(/,/g, '')) || 0;
    }
    function fiFormat(el) {
        var raw = (el.value || '').replace(/[^0-9]/g, '');
        el.value = raw ? Number(raw).toLocaleString('en-IN') : '';
    }
    function fiPct(id, def) {
        return parseFloat((document.getElementById(id)?.value || String(def)).replace(/[^0-9.]/g, '')) || def;
    }
    function fiSel(id, def) {
        return document.getElementById(id)?.value || String(def);
    }

    function fiTab(tab) {
        ['fd','scss','nsc','elss'].forEach(function(t) {
            var pane = document.getElementById('fi-pane-' + t);
            var btn  = document.getElementById('fi-btn-' + t);
            if (!pane || !btn) return;
            pane.classList.toggle('hidden', t !== tab);
            if (t === tab) {
                btn.className = 'fi-tab-active rounded-xl px-3 py-1.5 text-[11px] font-bold text-yellow-300';
                btn.style.background = 'rgba(245,200,66,0.18)';
                btn.style.border     = '1px solid rgba(245,200,66,0.45)';
            } else {
                btn.className = 'rounded-xl px-3 py-1.5 text-[11px] font-semibold text-slate-600 bg-white border border-slate-200';
                btn.style.background = '';
                btn.style.border     = '';
            }
        });
        if (tab === 'fd')   fiCalcFD();
        if (tab === 'scss') { fiCalcSCSS(); fiCalcPOMIS(); }
        if (tab === 'nsc')  { fiCalcNSC(); fiCalcKVP(); }
        if (tab === 'elss') fiCalcELSS();
    }

    function initFixedIncome() {
        // Populate all slab dropdowns and clear grey from all selects
        [['fi-fd-regime','fi-fd-slab'],['fi-scss-regime','fi-scss-slab'],
         ['fi-pomis-regime','fi-pomis-slab'],['fi-nsc-regime','fi-nsc-slab'],
         ['fi-cmp-regime','fi-cmp-slab']].forEach(function(pair) {
            var regEl = document.getElementById(pair[0]);
            if (regEl) regEl.classList.remove('text-slate-400');
            var regime = regEl?.value || 'new';
            fiSetSlabOptions(pair[1], regime); // also clears grey on slab
        });
        var fdType = document.getElementById('fi-fd-type');
        if (fdType) fdType.classList.remove('text-slate-400');
        fiTab('fd');
    }

    function resetFixedIncome() {
        var defs = {
            'fi-fd-principal': '1,00,000', 'fi-fd-rate': '7.0', 'fi-fd-tenure': '12',
            'fi-scss-principal': '10,00,000', 'fi-pomis-principal': '5,00,000',
            'fi-nsc-principal': '1,00,000', 'fi-kvp-principal': '1,00,000',
            'fi-cmp-principal': '1,50,000', 'fi-cmp-fd-rate': '7.0', 'fi-cmp-elss-return': '12.0'
        };
        Object.entries(defs).forEach(function([id, v]) {
            var el = document.getElementById(id); if (!el) return;
            el.value = v; el.classList.add('text-slate-400');
        });
        // Reset regime selects to new
        ['fi-fd-regime','fi-scss-regime','fi-pomis-regime','fi-nsc-regime','fi-cmp-regime'].forEach(function(id) {
            var el = document.getElementById(id); if (el) el.value = 'new';
        });
        document.getElementById('fi-fd-type').selectedIndex = 0;
        // Repopulate slabs after regime reset
        [['fi-fd-regime','fi-fd-slab'],['fi-scss-regime','fi-scss-slab'],
         ['fi-pomis-regime','fi-pomis-slab'],['fi-nsc-regime','fi-nsc-slab'],
         ['fi-cmp-regime','fi-cmp-slab']].forEach(function(pair) {
            fiSetSlabOptions(pair[1], 'new');
            var sl = document.getElementById(pair[1]); if (sl) sl.value = '30';
        });
        fiTab('fd');
        if (typeof saveUserData === 'function') saveUserData();
    }

    // ── FD Calculator ────────────────────────────────────────
    function fiCalcFD() {
        var P    = fiNum('fi-fd-principal');
        var rate = fiPct('fi-fd-rate', 7.0);
        var mo   = fiNum('fi-fd-tenure') || 12;
        var type = fiSel('fi-fd-type', 'cumulative');
        var slab = parseFloat(fiSel('fi-fd-slab', '0')) / 100;
        if (!P) return;

        var r = rate / 100;
        var yrs = mo / 12;
        var grossMat, grossInt, payoutAmt, payoutLabel;

        if (type === 'cumulative') {
            grossMat  = P * Math.pow(1 + r/4, 4 * yrs);
            grossInt  = grossMat - P;
        } else if (type === 'quarterly') {
            grossInt  = P * r * yrs;
            grossMat  = P + grossInt;
            payoutAmt = P * r / 4;
            payoutLabel = 'Quarterly payout';
        } else {
            grossInt  = P * r * yrs;
            grossMat  = P + grossInt;
            payoutAmt = P * r / 12;
            payoutLabel = 'Monthly payout';
        }

        var taxAmt  = grossInt * slab;
        var netInt  = grossInt - taxAmt;
        var netMat  = P + netInt;

        var effYield;
        if (type === 'cumulative') {
            effYield = yrs > 0 ? (Math.pow(netMat / P, 1/yrs) - 1) * 100 : 0;
        } else {
            effYield = yrs > 0 ? (netInt / P / yrs) * 100 : 0;
        }

        var annInt  = grossInt / (yrs || 1);
        var tdsNote = annInt > 40000 ? '⚠ TDS @ 10% applies (annual interest > ₹40K). Submit Form 15G/H if total income < taxable limit.' : '✅ No TDS (annual interest ≤ ₹40K). For senior citizens threshold is ₹50K.';

        function $s(id, v) { var e = document.getElementById(id); if (e) e.textContent = v; }
        $s('fi-fd-gross-mat',  fiFmt(grossMat));
        $s('fi-fd-net-mat',    fiFmt(netMat));
        $s('fi-fd-gross-int',  fiFmt(grossInt));
        $s('fi-fd-tax-amt',    slab > 0 ? fiFmt(taxAmt) : '—');
        $s('fi-fd-net-int',    fiFmt(netInt));
        $s('fi-fd-yield',      effYield.toFixed(2) + '%');

        var payEl  = document.getElementById('fi-fd-payout-row');
        var payVal = document.getElementById('fi-fd-payout');
        if (payEl && payVal) {
            if (payoutAmt) { payVal.textContent = fiFmt(payoutAmt); payEl.classList.remove('hidden'); }
            else payEl.classList.add('hidden');
        }
        var tdsEl = document.getElementById('fi-fd-tds');
        if (tdsEl) { tdsEl.textContent = tdsNote; tdsEl.classList.remove('hidden'); }

        var tw = document.getElementById('fi-fd-workings');
        if (tw) tw.innerHTML =
            '<div class="flex justify-between py-0.5 border-b border-slate-100"><span>Principal</span><span class="font-bold">' + fiFmt(P) + '</span></div>' +
            '<div class="flex justify-between py-0.5 border-b border-slate-100"><span>Rate · Tenure</span><span class="font-bold">' + rate + '% · ' + mo + ' mo</span></div>' +
            '<div class="flex justify-between py-0.5 border-b border-slate-100"><span>Gross interest</span><span class="font-bold">' + fiFmt(grossInt) + '</span></div>' +
            (slab > 0 ? '<div class="flex justify-between py-0.5 border-b border-slate-100"><span>Tax @ ' + (slab*100).toFixed(0) + '%</span><span class="font-bold text-red-600">−' + fiFmt(taxAmt) + '</span></div>' : '') +
            '<div class="flex justify-between py-1 font-black text-blue-700"><span>Net maturity</span><span>' + fiFmt(netMat) + '</span></div>' +
            '<div class="flex justify-between py-0.5"><span class="text-[9px] text-slate-400">Post-tax yield</span><span class="font-bold text-emerald-600">' + effYield.toFixed(2) + '% p.a.</span></div>';

        if (typeof saveUserData === 'function') saveUserData();
    }

    // ── SCSS Calculator (8.2% p.a., quarterly payout) ────────
    function fiCalcSCSS() {
        var P    = fiNum('fi-scss-principal');
        var slab = parseFloat(fiSel('fi-scss-slab', '30')) / 100;
        if (!P) return;

        var rate = 0.082; // 8.2% per annum, Q1 FY25-26
        var maxInv = 3000000; // ₹30L max
        var capNote = P > maxInv ? '⚠ Exceeds ₹30L limit. Max investment is ₹30L.' : '';

        var annual   = P * rate;
        var quarterly = annual / 4;
        var postTaxQ = quarterly * (1 - slab);
        var postTaxA = annual * (1 - slab);
        var tdsSCSS  = annual > 50000 ? '⚠ TDS applicable (annual > ₹50K). Submit 15H to avoid.' : '✅ No TDS';
        var taxSaving80C = Math.min(P, 150000) * slab;

        function $s(id, v) { var e = document.getElementById(id); if (e) e.textContent = v; }
        $s('fi-scss-quarterly', fiFmt(quarterly));
        $s('fi-scss-post-tax-q', fiFmt(postTaxQ));
        $s('fi-scss-annual',    fiFmt(annual));
        $s('fi-scss-post-tax-a', fiFmt(postTaxA));
        $s('fi-scss-80c',       taxSaving80C > 0 ? fiFmt(taxSaving80C) : '—');
        $s('fi-scss-tds',       tdsSCSS + (capNote ? ' ' + capNote : ''));
        if (typeof saveUserData === 'function') saveUserData();
    }

    // ── POMIS Calculator (7.4% p.a., monthly payout) ─────────
    function fiCalcPOMIS() {
        var P    = fiNum('fi-pomis-principal');
        var slab = parseFloat(fiSel('fi-pomis-slab', '30')) / 100;
        if (!P) return;

        var rate    = 0.074; // 7.4% p.a.
        var maxSingle = 900000; var maxJoint = 1500000;
        var monthly  = P * rate / 12;
        var annual   = P * rate;
        var postTaxM = monthly * (1 - slab);
        var postTaxA = annual * (1 - slab);
        var capNote  = P > maxSingle ? (P > maxJoint ? '⚠ Exceeds ₹15L joint limit.' : '⚠ Exceeds ₹9L single limit — open joint account.') : '';

        function $s(id, v) { var e = document.getElementById(id); if (e) e.textContent = v; }
        $s('fi-pomis-monthly',   fiFmt(monthly));
        $s('fi-pomis-post-tax-m', fiFmt(postTaxM));
        $s('fi-pomis-annual',    fiFmt(annual));
        $s('fi-pomis-post-tax-a', fiFmt(postTaxA));
        $s('fi-pomis-note',      capNote || '✅ Within ₹9L single account limit. Capital returned at maturity (5 yrs).');
        if (typeof saveUserData === 'function') saveUserData();
    }

    // ── NSC Calculator (7.7% p.a., 5-year, compounded annually) ──
    function fiCalcNSC() {
        var P    = fiNum('fi-nsc-principal');
        var slab = parseFloat(fiSel('fi-nsc-slab', '30')) / 100;
        if (!P) return;

        var rate    = 0.077;
        var maturity = P * Math.pow(1 + rate, 5);
        var totalInt = maturity - P;
        // 80C benefit on investment + years 1-4 reinvested interest (deemed reinvested)
        // Tax due only on year-5 interest (accrual in year 5 not covered by 80C)
        var yr5Int   = P * Math.pow(1 + rate, 4) * rate; // interest in final year
        var taxDue   = yr5Int * slab;
        var taxSaving80C = Math.min(P, 150000) * slab; // initial 80C
        var netGain  = totalInt - taxDue + taxSaving80C; // net advantage
        var effYield = (Math.pow((P + totalInt - taxDue) / P, 1/5) - 1) * 100;

        function $s(id, v) { var e = document.getElementById(id); if (e) e.textContent = v; }
        $s('fi-nsc-maturity',  fiFmt(maturity));
        $s('fi-nsc-total-int', fiFmt(totalInt));
        $s('fi-nsc-yr5-tax',   fiFmt(taxDue));
        $s('fi-nsc-80c',       fiFmt(taxSaving80C));
        $s('fi-nsc-yield',     effYield.toFixed(2) + '%');
        $s('fi-nsc-note',      '80C deduction on investment + reinvested interest (years 1–4). Only year-5 interest taxable.');
        if (typeof saveUserData === 'function') saveUserData();
    }

    // ── KVP Calculator (7.5% p.a., doubles in 115 months) ───────
    function fiCalcKVP() {
        var P = fiNum('fi-kvp-principal');
        if (!P) return;

        var rate      = 0.075;
        var months    = 115; // doubles in 115 months at 7.5%
        var maturity  = P * 2;
        var totalInt  = P;
        var yrs       = months / 12;
        var effYield  = (Math.pow(2, 1/yrs) - 1) * 100; // pre-tax CAGR

        function $s(id, v) { var e = document.getElementById(id); if (e) e.textContent = v; }
        $s('fi-kvp-maturity',  fiFmt(maturity));
        $s('fi-kvp-months',    months + ' months (' + yrs.toFixed(1) + ' yrs)');
        $s('fi-kvp-int',       fiFmt(totalInt));
        $s('fi-kvp-yield',     effYield.toFixed(2) + '% CAGR');
        $s('fi-kvp-note',      '⚠ No 80C benefit. Interest taxable at maturity as per your slab. Premature closure allowed after 2.5 yrs with penalty.');
        if (typeof saveUserData === 'function') saveUserData();
    }

    // ── Tax FD vs ELSS Comparison ─────────────────────────────
    function fiCalcELSS() {
        var P         = fiNum('fi-cmp-principal');
        var fdRate    = fiPct('fi-cmp-fd-rate', 7.0) / 100;
        var elssRate  = fiPct('fi-cmp-elss-return', 12.0) / 100;
        var slab      = parseFloat(fiSel('fi-cmp-slab', '30')) / 100;
        if (!P) return;

        var cap = Math.min(P, 150000);
        var taxSaving = cap * slab; // same 80C for both

        // Tax FD: 5-year lock-in, interest taxed at slab rate annually (approx via post-tax rate)
        var fdPostRate = fdRate * (1 - slab);
        var fdMat5     = P * Math.pow(1 + fdPostRate/4, 4*5); // quarterly compounding
        var fdGrossMat = P * Math.pow(1 + fdRate/4, 4*5);
        var fdTax5     = (fdGrossMat - P) * slab;

        // ELSS: 3-year lock-in, 5-year holding; LTCG 10% on gains above ₹1L
        var elssMat5   = P * Math.pow(1 + elssRate, 5);
        var elssGains  = elssMat5 - P;
        var ltcgTax    = Math.max(0, (elssGains - 100000)) * 0.10;
        var elssNet5   = elssMat5 - ltcgTax;
        var elssYield  = (Math.pow(elssNet5 / P, 0.2) - 1) * 100;
        var fdYield    = (Math.pow(fdMat5 / P, 0.2) - 1) * 100;

        var winner = elssNet5 > fdMat5 ? 'ELSS' : 'Tax FD';
        var diff   = Math.abs(elssNet5 - fdMat5);
        var winnerColor = winner === 'ELSS' ? '#059669' : '#0369a1';

        function $s(id, v) { var e = document.getElementById(id); if (e) e.textContent = v; }
        $s('fi-cmp-fd-mat',    fiFmt(fdMat5));
        $s('fi-cmp-elss-mat',  fiFmt(elssNet5));
        $s('fi-cmp-fd-yield',  fdYield.toFixed(2) + '%');
        $s('fi-cmp-elss-yield',elssYield.toFixed(2) + '%');
        $s('fi-cmp-fd-tax',    fiFmt(fdTax5));
        $s('fi-cmp-elss-tax',  ltcgTax > 0 ? fiFmt(ltcgTax) : 'Nil (gains ≤ ₹1L)');
        $s('fi-cmp-80c',       fiFmt(taxSaving));
        $s('fi-cmp-diff',      fiFmt(diff));

        var wEl = document.getElementById('fi-cmp-winner');
        if (wEl) {
            wEl.textContent = winner + ' wins by ' + fiFmt(diff) + ' over 5 years';
            wEl.style.color = winnerColor;
        }

        var cw = document.getElementById('fi-cmp-workings');
        if (cw) cw.innerHTML =
            '<div class="text-[9px] font-black text-blue-700 mb-1">📊 Tax-Saving FD (5 yrs)</div>' +
            '<div class="flex justify-between py-0.5 border-b border-slate-100"><span>Investment</span><span class="font-bold">' + fiFmt(P) + '</span></div>' +
            '<div class="flex justify-between py-0.5 border-b border-slate-100"><span>FD rate (gross)</span><span class="font-bold">' + (fdRate*100).toFixed(1) + '% → post-tax ' + (fdPostRate*100).toFixed(2) + '%</span></div>' +
            '<div class="flex justify-between py-0.5 border-b border-slate-100"><span>Tax on interest (@ ' + (slab*100).toFixed(0) + '% slab)</span><span class="font-bold text-red-600">−' + fiFmt(fdTax5) + '</span></div>' +
            '<div class="flex justify-between py-1 font-black text-blue-700"><span>FD post-tax maturity</span><span>' + fiFmt(fdMat5) + '</span></div>' +
            '<div class="text-[9px] font-black text-emerald-700 mt-2 mb-1">📈 ELSS (5 yr hold)</div>' +
            '<div class="flex justify-between py-0.5 border-b border-slate-100"><span>Expected CAGR</span><span class="font-bold">' + (elssRate*100).toFixed(1) + '%</span></div>' +
            '<div class="flex justify-between py-0.5 border-b border-slate-100"><span>Gross maturity</span><span class="font-bold">' + fiFmt(elssMat5) + '</span></div>' +
            '<div class="flex justify-between py-0.5 border-b border-slate-100"><span>LTCG tax (10% above ₹1L)</span><span class="font-bold text-red-600">−' + (ltcgTax > 0 ? fiFmt(ltcgTax) : '0') + '</span></div>' +
            '<div class="flex justify-between py-1 font-black text-emerald-700"><span>ELSS post-tax maturity</span><span>' + fiFmt(elssNet5) + '</span></div>';

        if (typeof saveUserData === 'function') saveUserData();
    }
