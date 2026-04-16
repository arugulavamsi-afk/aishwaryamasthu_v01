    // =====================================================================
    //  GOLD INVESTMENT COMPARATOR
    // =====================================================================

    function gcFmt(el) {
        var raw = el.value.replace(/[^0-9]/g, '');
        if (!raw) return;
        var n = parseInt(raw, 10), s = n.toString();
        if (s.length <= 3) { el.value = s; el.classList.remove('text-slate-400'); return; }
        var last3 = s.slice(-3), rest = s.slice(0, -3);
        el.value = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + last3;
        el.classList.remove('text-slate-400');
    }
    function _gcComma(n) {
        if (isNaN(n) || n < 0) return '0';
        var s = Math.round(n).toString();
        if (s.length <= 3) return s;
        return s.slice(0,-3).replace(/\B(?=(\d{2})+(?!\d))/g,',') + ',' + s.slice(-3);
    }
    function _gcInr(n) {
        if (n >= 1e7) return '₹' + (n/1e7).toFixed(2) + ' Cr';
        if (n >= 1e5) return '₹' + (n/1e5).toFixed(2) + ' L';
        return '₹' + _gcComma(Math.round(n));
    }
    function _gcParse(id) {
        var el = document.getElementById(id);
        return el ? (parseFloat(el.value.replace(/[^0-9.]/g,'')) || 0) : 0;
    }

    function goldCalc() {
        var amount   = _gcParse('gc-amount') || 100000;
        var years    = parseInt(document.getElementById('gc-years')?.value) || 5;
        var retPct   = parseFloat(document.getElementById('gc-return')?.value) || 10;
        var slab     = parseFloat(document.getElementById('gc-slab')?.value) || 20;
        var making   = parseFloat(document.getElementById('gc-making')?.value) || 12;
        var lockerYr = _gcParse('gc-locker') || 2000;
        var ret      = retPct / 100;

        // ── GOLD ETF ───────────────────────────────────────────────────
        // Entry cost: ~0 (brokerage ≈ 0.01-0.05%, negligible; treat as 0)
        var etfExpenseRatio = 0.005; // 0.50% p.a.
        var etfEffReturn    = ret - etfExpenseRatio;
        var etfFV           = amount * Math.pow(1 + etfEffReturn, years);
        var etfGain         = etfFV - amount;
        var etfTax          = years >= 1 ? etfGain * 0.125 : etfGain * (slab / 100);
        var etfNet          = etfFV - etfTax;
        var etfEffRet       = Math.pow(etfNet / amount, 1/years) - 1;

        // ── GOLD MF / FoF ──────────────────────────────────────────────
        // Expense ratio ~0.15% (lower than ETF as direct plan, but double-layer)
        var mfExpenseRatio  = 0.0040; // ~0.40% total (ETF expense + FoF layer)
        var mfEffReturn     = ret - mfExpenseRatio;
        var mfFV            = amount * Math.pow(1 + mfEffReturn, years);
        var mfGain          = mfFV - amount;
        // Gold MF: slab rate regardless of holding period (since Finance Act 2023)
        var mfTax           = mfGain * (slab / 100);
        var mfNet           = mfFV - mfTax;
        var mfEffRet        = Math.pow(mfNet / amount, 1/years) - 1;

        // ── PHYSICAL GOLD ──────────────────────────────────────────────
        // 3% GST + making charges (on original amount)
        var gstAmt     = amount * 0.03;
        var makingAmt  = amount * (making / 100);
        var totalLockerCost = lockerYr * years;
        // Effective gold units purchased = amount net of GST and making
        var physEffective   = amount - gstAmt - makingAmt;
        // Gold grows on the units purchased
        var physFV          = physEffective * Math.pow(1 + ret, years);
        // Physical gold LTCG after 2yr = 12.5% without indexation (Finance Act 2024, effective Jul 23 2024)
        var physGainTaxable = Math.max(0, physFV - physEffective);
        var physTax         = years >= 2 ? physGainTaxable * 0.125 : physGainTaxable * (slab / 100);
        var physNet         = physFV - physTax - totalLockerCost;
        var physEffRet      = amount > 0 ? Math.pow(physNet / amount, 1/years) - 1 : 0;

        // ── UPDATE CARDS ──────────────────────────────────────────────
        var sEl = function(id, val) { var e = document.getElementById(id); if(e) e.textContent = val; };

        sEl('gc-etf-entry',   '~₹0 (brokerage only)');
        sEl('gc-etf-netval',  _gcInr(etfNet));
        sEl('gc-etf-gain',    'Gain: ' + _gcInr(etfGain) + ' → Tax: ' + _gcInr(etfTax));
        sEl('gc-etf-effret',  (etfEffRet * 100).toFixed(2) + '% p.a. post-tax');

        sEl('gc-mf-entry',   '~₹0 (no demat fees)');
        sEl('gc-mf-netval',  _gcInr(mfNet));
        sEl('gc-mf-gain',    'Gain: ' + _gcInr(mfGain) + ' → Tax: ' + _gcInr(mfTax));
        sEl('gc-mf-effret',  (mfEffRet * 100).toFixed(2) + '% p.a. post-tax');

        sEl('gc-phys-entry',  '₹' + _gcComma(Math.round(gstAmt)) + ' GST upfront');
        sEl('gc-phys-making', _gcInr(makingAmt) + ' (' + making + '%)');
        sEl('gc-phys-locker', _gcInr(lockerYr) + '/yr = ' + _gcInr(totalLockerCost) + ' total');
        sEl('gc-phys-netval', _gcInr(physNet));
        sEl('gc-phys-gain',   'Net after all costs: ' + _gcInr(physNet));
        sEl('gc-phys-effret', (physEffRet * 100).toFixed(2) + '% p.a. post-tax');

        // ── COST DRAG ─────────────────────────────────────────────────
        sEl('gc-cd-gst',     _gcInr(gstAmt) + ' (3%)');
        sEl('gc-cd-making',  _gcInr(makingAmt) + ' (' + making + '%)');
        sEl('gc-cd-locker',  _gcInr(totalLockerCost) + ' over ' + years + 'yr');
        sEl('gc-cd-tax',     _gcInr(physTax));
        sEl('gc-cd-total',   _gcInr(gstAmt + makingAmt + totalLockerCost + physTax));

        // ── WINNER ────────────────────────────────────────────────────
        var nets = [
            { name: 'Gold ETF',    net: etfNet,  eff: etfEffRet,  key: 'etf' },
            { name: 'Gold MF/FoF', net: mfNet,   eff: mfEffRet,   key: 'mf'  },
            { name: 'Physical Gold', net: physNet,eff: physEffRet, key: 'phys'},
        ];
        nets.sort(function(a,b){ return b.net - a.net; });
        var winner = nets[0];
        var worst  = nets[2];
        sEl('gc-winner-name', winner.name);
        sEl('gc-winner-years', years);
        sEl('gc-winner-vs-phys', _gcInr(Math.max(0, winner.net - physNet)));
        sEl('gc-winner-annualised', (winner.eff * 100).toFixed(2) + '% p.a. net');

        var reasonMap = {
            etf:  'Gold ETFs win for demat holders. 12.5% LTCG tax (after 1yr) beats slab-rate Gold MF for 20–30% taxpayers, and zero GST/making charges beats Physical Gold by a wide margin.',
            mf:   'Gold MF/FoF is best if you don\'t have a demat account. No entry cost, SIP from ₹500/mo. Slab-rate tax is a disadvantage vs ETF for high earners, but beats the GST+making drag of physical gold.',
            phys: 'Physical gold wins only in this scenario due to your low making charge assumption. In real life, jewellery making charges of 8–25% mean physical gold almost never wins financially — only emotionally.'
        };
        sEl('gc-winner-reason', reasonMap[winner.key] || '');

        // ── BREAKEVEN ─────────────────────────────────────────────────
        var breakevenEl = document.getElementById('gc-breakeven');
        if (breakevenEl) {
            // Find year where physNet > etfNet
            var breakevenYr = null;
            for (var y = 1; y <= 30; y++) {
                var eN = amount * Math.pow(1 + etfEffReturn, y) - (amount * Math.pow(1 + etfEffReturn, y) - amount) * (y >= 1 ? 0.125 : slab/100);
                var pEff = amount - gstAmt - makingAmt;
                var pFV  = pEff * Math.pow(1 + ret, y);
                var pTax  = y >= 2 ? Math.max(0,pFV-pEff)*0.125 : Math.max(0,pFV-pEff)*(slab/100);
                var pN   = pFV - pTax - (lockerYr * y);
                if (pN > eN && breakevenYr === null) { breakevenYr = y; }
            }
            if (breakevenYr) {
                breakevenEl.innerHTML = '📅 Physical gold overtakes Gold ETF only after <strong>' + breakevenYr + ' years</strong> of holding — and only if the making charge is very low (coins/bars). Jewellery with high making charges may <strong>never break even</strong> vs Gold ETF.';
            } else {
                breakevenEl.innerHTML = '❌ <strong>Physical gold does not break even vs Gold ETF within 30 years</strong> at your current making charge (' + making + '%). The upfront cost drag from GST + making charges is too large to recover, especially with slab-rate taxation.';
            }
        }

        if (typeof saveUserData === 'function') saveUserData();
    }

    function initGoldComp() { goldCalc(); }

    function resetGoldComp() {
        var defs = {
            'gc-amount':'1,00,000','gc-years':'5','gc-return':'10','gc-making':'12','gc-locker':'2,000'
        };
        Object.keys(defs).forEach(function(id) {
            var el = document.getElementById(id);
            if (el) { el.value = defs[id]; el.classList.add('text-slate-400'); }
        });
        document.getElementById('gc-slab').value = '20';
        goldCalc();
    }

    function gcPreset(name) {
        var p = {
            sip:      { amount: '5,000',    years: '10', ret: '10', making: '5',  locker: '0' },
            lumpsum:  { amount: '1,00,000', years: '5',  ret: '10', making: '12', locker: '2,000' },
            wedding:  { amount: '5,00,000', years: '3',  ret: '10', making: '18', locker: '3,000' },
            longterm: { amount: '2,00,000', years: '10', ret: '11', making: '5',  locker: '2,000' }
        };
        var d = p[name]; if (!d) return;
        var map = { 'gc-amount': d.amount, 'gc-years': d.years, 'gc-return': d.ret, 'gc-making': d.making, 'gc-locker': d.locker };
        Object.keys(map).forEach(function(id) {
            var el = document.getElementById(id);
            if (el) { el.value = map[id]; el.classList.remove('text-slate-400'); }
        });
        goldCalc();
    }

    function initFinCal() {
        _fcViewMonth = null;
        finCalRender();
    }

    function resetFinCal() {
        var el;
        el = document.getElementById('fc-regime');    if (el) el.value = 'new';
        el = document.getElementById('fc-ppf');       if (el) el.value = 'yes';
        el = document.getElementById('fc-elss');      if (el) el.value = 'yes';
        el = document.getElementById('fc-sgb');       if (el) el.value = 'yes';
        el = document.getElementById('fc-epf');       if (el) el.value = 'yes';
        el = document.getElementById('fc-cc-date');   if (el) { el.value = '5'; el.classList.add('text-slate-400'); }
        el = document.getElementById('fc-income');    if (el) { el.value = '12,00,000'; el.classList.add('text-slate-400'); }
        _fcActiveFilter = 'all';
        _fcViewMonth    = null;
        finCalRender();
    }

    function resetCibil() {
        var defaults = { 'cibil-score': '720', 'cibil-util': '35', 'cibil-missed': '0', 'cibil-age': '4', 'cibil-cards': '2', 'cibil-enquiries': '1', 'cibil-loan-amt': '50,00,000', 'cibil-loan-tenure': '20' };
        Object.keys(defaults).forEach(function(id) {
            var el = document.getElementById(id);
            if (el) { el.value = defaults[id]; el.classList.add('text-slate-400'); }
        });
        cibilCalc();
    }
