/* ── Tax Guide — Old vs New Regime Calculator ── */
    function tgFormat(el) {
        var raw = (el.value||'').replace(/[^0-9]/g,'');
        if (raw) el.value = Number(raw).toLocaleString('en-IN');
        else el.value = '';
    }

    function tgNum(id) {
        return parseInt((document.getElementById(id)?.value||'').replace(/[^0-9]/g,'')) || 0;
    }

    function tgTaxOld(taxable) {
        if (taxable <= 250000) return 0;
        var t = 0;
        if (taxable > 1000000) { t += (taxable - 1000000) * 0.30; taxable = 1000000; }
        if (taxable > 500000)  { t += (taxable - 500000)  * 0.20; taxable = 500000; }
        if (taxable > 250000)  { t += (taxable - 250000)  * 0.05; }
        return t;
    }

    function tgTaxNew(taxable) {
        // FY 2025-26 (Budget 2025) New Regime slabs
        if (taxable <= 400000) return 0;
        var t = 0;
        var prev = 400000;
        var bands = [
            [800000, 0.05],
            [1200000, 0.10],
            [1600000, 0.15],
            [2000000, 0.20],
            [2400000, 0.25],
            [Infinity, 0.30]
        ];
        for (var i = 0; i < bands.length; i++) {
            if (taxable <= prev) break;
            var chunk = Math.min(taxable, bands[i][0]) - prev;
            if (chunk > 0) t += chunk * bands[i][1];
            prev = bands[i][0];
        }
        // 87A Rebate: full rebate if taxable income ≤ ₹12L (Budget 2025)
        if (taxable <= 1200000) t = 0;
        return t;
    }

    /* ══════════════════════════════════════════════════════════
       SHARED TAX REGIME + SLAB HELPERS  (FY 2025-26 / Budget 2025)
    ══════════════════════════════════════════════════════════ */
    function _mkSlabOpts(regime, sel) {
        // Returns <option> HTML for the correct regime's slab brackets.
        // sel = currently selected value (string) to preserve selection after rebuild.
        var opts = regime === 'old'
            ? [ {v:'0',  l:'0% — taxable income ≤ ₹2.5L'},
                {v:'5',  l:'5% — taxable income ₹2.5L–₹5L (87A: effective 0% if ≤₹5L)'},
                {v:'20', l:'20% — taxable income ₹5L–₹10L'},
                {v:'30', l:'30% — taxable income above ₹10L'} ]
            : [ {v:'0',  l:'0% — taxable income ≤ ₹12L (87A rebate, zero tax)'},
                {v:'15', l:'15% — taxable income ₹12L–₹16L'},
                {v:'20', l:'20% — taxable income ₹16L–₹20L'},
                {v:'25', l:'25% — taxable income ₹20L–₹24L'},
                {v:'30', l:'30% — taxable income above ₹24L'} ];
        // If existing selected value doesn't exist in new regime, fall back to 20%
        var valid = opts.map(function(o){ return o.v; });
        var picked = valid.indexOf(sel) !== -1 ? sel : '20';
        return opts.map(function(o){
            return '<option value="' + o.v + '"' + (o.v === picked ? ' selected' : '') + '>' + o.l + '</option>';
        }).join('');
    }

    function _regimeChange(regId, slabId, calcFn) {
        // Called when a regime selector changes — rebuilds slab options then re-runs calc.
        var regEl  = document.getElementById(regId);
        var slabEl = document.getElementById(slabId);
        if (!regEl || !slabEl) return;
        slabEl.innerHTML = _mkSlabOpts(regEl.value, slabEl.value);
        if (typeof calcFn === 'function') calcFn();
    }

    function tgSlabBreakdown(taxable, regime) {
        var result = [];
        var slabs = regime === 'old'
            ? [ {label:'Up to 2.5L', floor:0,       ceil:250000,  rate:0},
                {label:'2.5L-5L',    floor:250000,  ceil:500000,  rate:0.05},
                {label:'5L-10L',     floor:500000,  ceil:1000000, rate:0.20},
                {label:'Above 10L',  floor:1000000, ceil:Infinity,rate:0.30} ]
            : [ {label:'Up to 4L',   floor:0,       ceil:400000,  rate:0},
                {label:'4L-8L',      floor:400000,  ceil:800000,  rate:0.05},
                {label:'8L-12L',     floor:800000,  ceil:1200000, rate:0.10},
                {label:'12L-16L',    floor:1200000, ceil:1600000, rate:0.15},
                {label:'16L-20L',    floor:1600000, ceil:2000000, rate:0.20},
                {label:'20L-24L',    floor:2000000, ceil:2400000, rate:0.25},
                {label:'Above 24L',  floor:2400000, ceil:Infinity,rate:0.30} ];
        slabs.forEach(function(s) {
            if (taxable <= s.floor) return;
            var chunk = Math.min(taxable, s.ceil) - s.floor;
            if (chunk > 0) result.push({label:s.label, chunk:chunk, rate:s.rate, tax:chunk*s.rate});
        });
        return result;
    }


    /* ── Post-Tax Return Calculator (Tax Guide) ── */
    function ptcCalc() {
        var preReturn = parseFloat(document.getElementById('ptc-return')?.value) || 0;
        var fundType  = document.getElementById('ptc-type')?.value || 'equity-lt';
        var slab      = parseFloat(document.getElementById('ptc-slab')?.value) || 0;
        var resultEl  = document.getElementById('ptc-result');
        if (!resultEl) return;
        if (!preReturn) {
            resultEl.innerHTML = '<span class="text-slate-400">Enter a pre-tax return to see post-tax comparison</span>';
            return;
        }

        // Determine tax rate and type
        var taxRate, taxLabel, taxColor, note = '';
        if (fundType === 'equity-lt' || fundType === 'elss') {
            // LTCG 12.5% — but first ₹1.25L exempt per year
            // For a calculator showing rates, we show rate after exemption note
            taxRate  = 0.125;
            taxLabel = 'LTCG 12.5%';
            taxColor = '#059669';
            note     = '₹1.25L/yr of gains exempt before this rate applies';
        } else if (fundType === 'equity-st') {
            taxRate  = 0.20;
            taxLabel = 'STCG 20%';
            taxColor = '#dc2626';
            note     = 'Held < 1 year — no exemption';
        } else {
            // Slab rate: debt/liquid/intl/fd
            taxRate  = slab / 100;
            taxLabel = slab + '% slab';
            taxColor = '#d97706';
            note     = fundType === 'fd'   ? 'TDS at 10% for FD if PAN provided' :
                       fundType === 'intl' ? 'International funds taxed as debt post-2023' :
                       'Post FA 2023 — no indexation benefit';
        }

        var postReturn = preReturn * (1 - taxRate);
        var taxDrag    = preReturn - postReturn;

        // Compound impact over 10 years
        var corpus_pre  = Math.pow(1 + preReturn/100,  10);
        var corpus_post = Math.pow(1 + postReturn/100, 10);
        var corpusGap   = ((corpus_pre - corpus_post) / corpus_pre * 100).toFixed(1);

        var fmtPct = function(n) { return n.toFixed(2) + '%'; };
        var fmtX   = function(n) { return n.toFixed(2) + 'x'; };

        resultEl.innerHTML =
            '<div class="grid grid-cols-3 gap-2 mb-2">' +
                '<div class="rounded-lg p-2 text-center" style="background:#f0fdf4;border:1px solid #86efac;">' +
                    '<div class="text-[9px] font-bold text-emerald-600 mb-0.5">Pre-Tax Return</div>' +
                    '<div class="text-base font-black text-emerald-700">' + fmtPct(preReturn) + '</div>' +
                '</div>' +
                '<div class="rounded-lg p-2 text-center" style="background:#fff7ed;border:1px solid #fed7aa;">' +
                    '<div class="text-[9px] font-bold text-orange-600 mb-0.5">Tax (' + taxLabel + ')</div>' +
                    '<div class="text-base font-black text-orange-700">−' + fmtPct(taxDrag) + '</div>' +
                '</div>' +
                '<div class="rounded-lg p-2 text-center" style="background:#eff6ff;border:1px solid #bfdbfe;">' +
                    '<div class="text-[9px] font-bold text-blue-600 mb-0.5">Post-Tax Return</div>' +
                    '<div class="text-base font-black text-blue-700">' + fmtPct(postReturn) + '</div>' +
                '</div>' +
            '</div>' +
            '<div class="flex gap-3 text-[10px] flex-wrap">' +
                '<span class="text-slate-500">10-yr corpus: <strong class="text-emerald-700">' + fmtX(corpus_post) + '</strong> post-tax vs <strong class="text-slate-600">' + fmtX(corpus_pre) + '</strong> pre-tax</span>' +
                '<span class="text-rose-500 font-semibold">Tax drag: ' + corpusGap + '% of final corpus</span>' +
            '</div>' +
            (note ? '<div class="mt-1.5 text-[9px] text-slate-400 font-semibold">ℹ️ ' + note + '</div>' : '');
    }

    function tgCalc() {
        var salary   = tgNum('tg-income');
        var otherInc = tgNum('tg-other-income');
        var gross    = salary + otherInc;
        var monthlyEl = document.getElementById('tg-income-monthly');
        if (monthlyEl) monthlyEl.textContent = salary > 0 ? 'approx. Rs.' + Math.round(salary/12).toLocaleString('en-IN') + '/month CTC' : '';

        if (!gross) {
            document.getElementById('tg-results').innerHTML = '<p class="text-xs text-slate-400 text-center font-semibold">Enter your salary to see comparison</p>';
            var sc = document.getElementById('tg-surplus-card');
            var sk = document.getElementById('tg-slab-card');
            if (sc) sc.classList.add('hidden');
            if (sk) sk.classList.add('hidden');
            return;
        }

        var c80      = Math.min(tgNum('tg-80c'), 150000);
        var c80d     = Math.min(tgNum('tg-80d'), 75000);
        var hra      = tgNum('tg-hra');
        var nps      = Math.min(tgNum('tg-nps'), 50000);
        var empNps   = tgNum('tg-emp-nps');  // 80CCD(2) — deductible in both regimes
        var homeloan = Math.min(tgNum('tg-homeloan'), 200000);
        var otherD   = tgNum('tg-other-deduct');
        var expenses = tgNum('tg-expenses');
        var fmt = function(n){ return 'Rs.' + Math.round(n).toLocaleString('en-IN'); };

        // OLD REGIME
        var stdOld       = 50000;
        var oldDeductions = stdOld + c80 + c80d + hra + nps + homeloan + otherD + empNps;
        var oldTaxable    = Math.max(0, gross - oldDeductions);
        var oldTax        = tgTaxOld(oldTaxable);
        if (oldTaxable <= 500000) oldTax = Math.max(0, oldTax - 12500);
        var oldCess      = oldTax * 0.04;
        var oldTotal     = oldTax + oldCess;
        var oldTakeHome  = gross - oldTotal;

        // NEW REGIME — 80CCD(2) applies to both regimes
        var stdNew       = 75000;
        var newTaxable    = Math.max(0, gross - stdNew - empNps);
        var newTax        = tgTaxNew(newTaxable);
        var newCess      = newTax * 0.04;
        var newTotal     = newTax + newCess;
        var newTakeHome  = gross - newTotal;

        var saving   = oldTotal - newTotal;
        var winner   = saving > 0 ? 'new' : (saving < 0 ? 'old' : 'equal');
        var winAmt   = Math.abs(saving);
        var winColor = winner === 'new' ? '#059669' : winner === 'old' ? '#7c3aed' : '#6366f1';
        var winLabel = winner === 'new' ? _t('tg.win.new')
                     : winner === 'old' ? _t('tg.win.old')
                     : _t('tg.win.equal');
        var bestTotal    = winner === 'new' ? newTotal    : oldTotal;
        var bestTakeHome = winner === 'new' ? newTakeHome : oldTakeHome;
        var bestRegime   = winner === 'new' ? _t('tg.regime.new') : (winner === 'old' ? _t('tg.regime.old') : _t('tg.regime.either'));
        var bestTaxable  = winner === 'new' ? newTaxable  : oldTaxable;
        var effRate      = gross > 0 ? ((bestTotal / gross) * 100).toFixed(1) : 0;
        var marginal;
        if (winner === 'new' || winner === 'equal') {
            // FY 2025-26 new regime
            marginal = bestTaxable > 2400000 ? '30%' : bestTaxable > 2000000 ? '25%'
                     : bestTaxable > 1600000 ? '20%' : bestTaxable > 1200000 ? '15%'
                     : bestTaxable > 800000  ? '10%' : bestTaxable > 400000  ? '5%' : '0%';
        } else {
            // Old regime
            marginal = bestTaxable > 1000000 ? '30%' : bestTaxable > 500000 ? '20%'
                     : bestTaxable > 250000  ? '5%' : '0%';
        }

        document.getElementById('tg-results').innerHTML =
            '<div class="text-center mb-3 rounded-xl py-2.5 px-3 font-black text-sm" style="background:' + winColor + '18;color:' + winColor + ';border:1px solid ' + winColor + '30;">' +
                (winner !== 'equal' ? '&#x2705; ' : '&#x1F504; ') + winLabel + (winAmt > 0 ? ' &mdash; ' + _t('tg.win.save') + ' ' + fmt(winAmt) + '/yr' : '') +
            '</div>' +
            '<div class="grid grid-cols-2 gap-2 mb-2">' +
                tgRegimeCard('Old Regime', gross, oldDeductions, oldTaxable, oldTax, oldCess, oldTotal, winner === 'old', '#7c3aed') +
                tgRegimeCard('New Regime', gross, stdNew, newTaxable, newTax, newCess, newTotal, winner === 'new', '#059669') +
            '</div>' +
            '<div class="rounded-lg px-3 py-2 text-[10px] space-y-0.5" style="background:#f1f5f9;">' +
                '<div class="flex justify-between"><span class="text-slate-500">' + _t('tg.res.best') + '</span><span class="font-black" style="color:' + winColor + ';">' + bestRegime + '</span></div>' +
                '<div class="flex justify-between"><span class="text-slate-500">' + _t('tg.res.effrate') + '</span><span class="font-bold">' + effRate + '%</span></div>' +
                '<div class="flex justify-between"><span class="text-slate-500">' + _t('tg.res.marginal') + '</span><span class="font-bold">' + marginal + '</span></div>' +
                '<div class="flex justify-between"><span class="text-slate-500">' + _t('tg.res.annual') + '</span><span class="font-black text-emerald-600">' + fmt(bestTakeHome) + '</span></div>' +
                '<div class="flex justify-between"><span class="text-slate-500">' + _t('tg.res.monthly') + '</span><span class="font-black text-emerald-600">' + fmt(bestTakeHome/12) + '</span></div>' +
            '</div>' +
            '<div class="text-[9px] text-slate-400 mt-2 text-center">' + _t('tg.res.cessnote') + '</div>' +
            (gross >= 5000000 ? (function(){
            var sc = gross >= 20000000 ? '25%' : gross >= 10000000 ? '15%' : '10%';
            var scDesc = gross >= 20000000 ? 'Above ₹2Cr: +25% on tax'
                       : gross >= 10000000 ? 'Above ₹1Cr: +15% on tax'
                       : 'Above ₹50L: +10% on tax';
            var approxSc = Math.round(bestTotal * (gross >= 20000000 ? 0.25 : gross >= 10000000 ? 0.15 : 0.10));
            return '<div class="mt-2 px-3 py-2 rounded-lg text-[10px] font-semibold leading-relaxed" style="background:#fef3c7;border:2px solid #fde68a;color:#92400e;">' +
                '<div class="font-black mb-0.5">⚠️ Surcharge NOT included — add approx. ₹' + fmt(approxSc) + ' extra</div>' +
                '<div class="font-medium">' + scDesc + ' surcharge. At your income level, total tax liability is significantly higher.</div>' +
                '<div class="text-amber-700 mt-0.5">New regime caps surcharge at 25%. Old regime can go up to 37%. Consult a CA for accurate liability.</div>' +
                '</div>';
        })() : '')

        // Slab breakdown
        var breakdown = tgSlabBreakdown(bestTaxable, winner === 'new' ? 'new' : 'old');
        var rateCol = {0:'#94a3b8',0.05:'#22c55e',0.10:'#84cc16',0.15:'#eab308',0.20:'#f97316',0.25:'#ef4444',0.30:'#dc2626'};
        var slabHtml = '';
        breakdown.forEach(function(s) {
            var col = rateCol[s.rate] || '#64748b';
            slabHtml += '<div class="flex items-center gap-2 text-[10px] py-1 border-b border-slate-50 last:border-0">' +
                '<div class="w-2 h-2 rounded-full flex-shrink-0" style="background:' + col + ';"></div>' +
                '<span class="text-slate-600 flex-1">' + s.label + '</span>' +
                '<span class="text-slate-400">' + Math.round(s.rate*100) + '%</span>' +
                '<span class="font-bold text-slate-700 w-24 text-right">' + fmt(s.tax) + '</span>' +
            '</div>';
        });
        if (bestTaxable <= 1200000 && winner === 'new') {
            slabHtml += '<div class="text-[9px] text-emerald-600 font-bold mt-1">' + _t('tg.res.rebate87a') + '</div>';
        }
        var slabCard = document.getElementById('tg-slab-card');
        var slabContent = document.getElementById('tg-slab-content');
        if (slabContent) slabContent.innerHTML = slabHtml || '<p class="text-[10px] text-slate-400">' + _t('tg.res.notax') + '</p>';
        if (slabCard) slabCard.classList.toggle('hidden', breakdown.length === 0 || (bestTaxable <= 1200000 && winner === 'new'));

        // Investable surplus
        var surplusCard    = document.getElementById('tg-surplus-card');
        var surplusContent = document.getElementById('tg-surplus-content');
        if (expenses > 0 && surplusCard && surplusContent) {
            var mthTakeHome = bestTakeHome / 12;

            // Employee EPF = 12% of basic — deducted before cash-in-hand
            var epfBasic  = tgNum('tg-epf-basic');
            var empEpf    = epfBasic > 0 ? Math.round(epfBasic * 0.12) : 0;
            var mthActual = mthTakeHome - empEpf;

            var epfNoteEl = document.getElementById('tg-epf-note');
            if (epfNoteEl) {
                if (empEpf > 0) {
                    epfNoteEl.textContent = _t('tg.epf.note1') + ' ' + fmt(empEpf) + '/mo (12% ' + _t('tg.epf.of') + ' basic). ' + _t('tg.epf.note2') + ' ' + fmt(empEpf) + '/mo ' + _t('tg.epf.note3');
                    epfNoteEl.classList.remove('hidden');
                } else {
                    epfNoteEl.classList.add('hidden');
                }
            }

            var surplus = mthActual - expenses;
            var sColor  = surplus > 0 ? '#059669' : '#dc2626';
            var savRate = mthActual > 0 ? Math.max(0, (surplus / mthActual) * 100).toFixed(0) : 0;

            surplusContent.innerHTML =
                '<div class="grid grid-cols-2 gap-2 text-[10px] mb-2">' +
                    '<div class="rounded-lg p-2" style="background:#fff;">' +
                        '<div class="text-slate-500 font-semibold">' + _t('tg.sur.posttax') + '</div>' +
                        '<div class="font-black text-slate-800 text-sm">' + fmt(mthTakeHome) + '/mo</div>' +
                        '<div class="text-[9px] text-slate-400">' + _t('tg.sur.grossvia') + ' ' + bestRegime + '</div>' +
                    '</div>' +
                    (empEpf > 0
                        ? '<div class="rounded-lg p-2" style="background:#fff;">' +
                            '<div class="text-slate-500 font-semibold">' + _t('tg.sur.cashinhand') + '</div>' +
                            '<div class="font-black text-slate-800 text-sm">' + fmt(mthActual) + '/mo</div>' +
                            '<div class="text-[9px] text-slate-400">after EPF -' + fmt(empEpf) + '</div>' +
                          '</div>'
                        : '<div class="rounded-lg p-2" style="background:#fff;">' +
                            '<div class="text-slate-500 font-semibold">' + _t('tg.sur.expenses') + '</div>' +
                            '<div class="font-black text-slate-800 text-sm">' + fmt(expenses) + '/mo</div>' +
                            '<div class="text-[9px] text-slate-400">' + _t('tg.sur.asentered') + '</div>' +
                          '</div>') +
                '</div>' +
                (empEpf > 0
                    ? '<div class="rounded-lg px-3 py-2 mb-2 text-[10px]" style="background:#eff6ff;border:1px solid #bfdbfe;">' +
                        '<div class="flex justify-between mb-0.5"><span class="text-blue-600">Cash-in-hand</span><span class="font-bold text-blue-800">' + fmt(mthActual) + '</span></div>' +
                        '<div class="flex justify-between mb-0.5"><span class="text-blue-600">Monthly Expenses</span><span class="font-bold text-blue-800">- ' + fmt(expenses) + '</span></div>' +
                        '<div class="flex justify-between pt-1 border-t border-blue-100"><span class="font-black text-blue-700">Free surplus</span><span class="font-black text-blue-700">' + fmt(Math.max(0, surplus)) + '</span></div>' +
                        '<div class="text-[9px] text-blue-400 mt-1">' + _t('tg.epf.corpus1') + ' ' + fmt(empEpf * 2) + '/mo ' + _t('tg.epf.corpus2') + ' (' + _t('tg.epf.corpus3') + ', ' + _t('tg.epf.each') + ' ' + fmt(empEpf) + ')</div>' +
                      '</div>'
                    : '') +
                '<div class="rounded-xl px-3 py-2.5 text-center" style="background:#fff;border:2px solid ' + sColor + '30;">' +
                    '<div class="text-[10px] font-black text-slate-500 mb-0.5">' + _t('tg.sur.investable') + '</div>' +
                    '<div class="text-2xl font-black" style="color:' + sColor + ';">' + fmt(Math.abs(surplus)) + '/mo</div>' +
                    (surplus > 0
                        ? '<div class="text-[9px] text-emerald-500 font-bold mt-0.5">' + _t('tg.sur.savrate') + ': ' + savRate + '% ' + _t('tg.sur.ofcash') + '</div>'
                        : '<div class="text-[9px] text-rose-500 font-bold mt-0.5">' + _t('tg.sur.overspend') + '</div>') +
                '</div>';

            window._tgSurplus = surplus > 0 ? Math.round(surplus) : 0;
            window._tgRegime  = bestRegime;
            surplusCard.classList.remove('hidden');
        } else {
            if (surplusCard) surplusCard.classList.add('hidden');
            window._tgSurplus = null;
        }
        if (typeof saveUserData === 'function') saveUserData();
    }

    function tgRegimeCard(label, gross, deductions, taxable, tax, cess, total, isWinner, color) {
        var fmt = function(n){ return 'Rs.' + Math.round(n).toLocaleString('en-IN'); };
        var row = function(lbl, val, extraClass) {
            return '<div class="flex justify-between items-center min-h-[1.35rem]' + (extraClass ? ' ' + extraClass : '') + '">' +
                '<span class="text-slate-500 leading-tight">' + lbl + '</span>' +
                '<span class="font-bold tabular-nums whitespace-nowrap ml-1">' + val + '</span></div>';
        };
        return '<div class="rounded-xl p-2.5 flex flex-col" style="background:' + color + '08;border:2px solid ' + (isWinner ? color : '#e2e8f0') + ';">' +
            '<div class="text-[10px] font-black mb-1.5 min-h-[1.25rem] flex items-center" style="color:' + color + ';">' + label + (isWinner ? ' &#127942;' : '') + '</div>' +
            '<div class="space-y-0.5 text-[9.5px]">' +
                row(_t('tg.card.gross'),   fmt(gross)) +
                row(_t('tg.card.ded'),     '<span class="text-emerald-600">-' + fmt(deductions) + '</span>') +
                row(_t('tg.card.taxable'), fmt(taxable)) +
                row(_t('tg.card.tax'),     fmt(tax), 'pt-0.5 border-t border-slate-100 mt-0.5') +
                row(_t('tg.card.cess'),    fmt(cess)) +
            '</div>' +
            '<div class="flex justify-between items-center rounded-lg px-1.5 py-1 mt-2" style="background:#fff;">' +
                '<span class="font-black text-slate-700 text-[10px] leading-tight">' + _t('tg.card.total') + '</span>' +
                '<span class="font-black text-[10px] tabular-nums whitespace-nowrap ml-1" style="color:' + color + ';">' + fmt(total) + '</span>' +
            '</div>' +
            '<div class="text-[9px] text-slate-400 mt-1 min-h-[1.1rem]">' + _t('tg.card.takehome') + ': ' + fmt(gross - total) + '</div>' +
        '</div>';
    }

    function tgSendToFinPlan() {
        var surplus = window._tgSurplus;
        if (!surplus || surplus <= 0) { alert('Enter your monthly expenses first to calculate the investable surplus.'); return; }
        if (typeof switchMode === 'function') switchMode('finplan');
        setTimeout(function() {
            var el  = document.getElementById('fp-invest-amt');
            var inc = document.getElementById('fp-income');
            if (el) {
                el.value = surplus.toLocaleString('en-IN');
                el.classList.remove('text-slate-400');
                if (typeof fpFormatMoney === 'function') fpFormatMoney(el, 'fp-invest-words');
                if (typeof fpLiveUpdate  === 'function') fpLiveUpdate();
            }
            var tgInc = tgNum('tg-income');
            if (inc && (!inc.value || inc.value === '0') && tgInc > 0) {
                inc.value = Math.round(tgInc/12).toLocaleString('en-IN');
                inc.classList.remove('text-slate-400');
                if (typeof fpFormatMoney === 'function') fpFormatMoney(inc, 'fp-income-words');
                if (typeof fpLiveUpdate  === 'function') fpLiveUpdate();
            }
            tgShowToast('Surplus Rs.' + surplus.toLocaleString('en-IN') + '/mo sent to Financial Plan!');
        }, 450);
    }


    /* ── Reset functions for Tax Guide + Home Loan ── */
    function resetTaxGuide() {
        var tgIds = ['tg-income', 'tg-other-income', 'tg-80c', 'tg-80d', 'tg-hra', 'tg-nps', 'tg-emp-nps', 'tg-homeloan', 'tg-other-deduct', 'tg-expenses', 'tg-epf-basic'];
        var defaults = {'tg-80c': '1,50,000'};
        tgIds.forEach(function(id) {
            var el = document.getElementById(id);
            if (!el) return;
            el.value = defaults[id] || '';
            el.classList.add('text-slate-400');
        });
        // Reset selects
        var r = document.getElementById('tg-results');
        if (r) r.innerHTML = '<p class="text-xs text-slate-400 text-center font-semibold">' + _t('tg.placeholder') + '</p>';
        var sc = document.getElementById('tg-surplus-card');
        var sk = document.getElementById('tg-slab-card');
        if (sc) sc.classList.add('hidden');
        if (sk) sk.classList.add('hidden');
        if (typeof saveUserData === 'function') saveUserData();
    }

    function resetHomeLoan() {
        var hlIds = ['hl-amount', 'hl-rate', 'hl-tenure', 'hl-start-month', 'hl-start-year', 'pp-amount', 'pp-rate', 'pp-tenure', 'pp-lump', 'pp-after', 'rvb-price', 'rvb-down', 'rvb-rate', 'rvb-tenure', 'rvb-apprec', 'rvb-maint', 'rvb-society', 'rvb-stamp', 'rvb-gst', 'rvb-modt', 'rvb-rent', 'rvb-rent-incr', 'rvb-inv-return', 'rvb-years', 'tx-amount', 'tx-rate', 'tx-tenure', 'tx-slab', 'tx-regime', 'tx-type'];
        var defaults = {"hl-rate": "8.5", "hl-tenure": "20", "pp-rate": "8.5", "pp-tenure": "20", "pp-after": "3", "rvb-rate": "8.5", "rvb-tenure": "20", "rvb-apprec": "7", "rvb-rent-incr": "5", "rvb-inv-return": "12", "rvb-years": "20", "tx-rate": "8.5", "tx-tenure": "20"};
        hlIds.forEach(function(id) {
            var el = document.getElementById(id);
            if (!el) return;
            el.value = defaults[id] || '';
            if (defaults[id]) el.classList.add('text-slate-400');
        });
        // Clear results
        ['hl-emi-result','hl-prepay-result','hl-rvb-result','hl-tax-result'].forEach(function(id) {
            var el = document.getElementById(id);
            if (el) el.innerHTML = '<p class="text-xs text-slate-400 text-center font-semibold py-4">Enter details to calculate</p>';
        });
        var aw = document.getElementById('hl-emi-amort-wrap');
        if (aw) aw.classList.add('hidden');
        if (typeof saveUserData === 'function') saveUserData();
    }

    function tgShowToast(msg) {
        var t = document.createElement('div');
        t.textContent = msg;
        t.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#059669;color:#fff;font-size:12px;font-weight:700;padding:10px 20px;border-radius:20px;z-index:9999;box-shadow:0 4px 16px rgba(0,0,0,0.2);white-space:nowrap;';
        document.body.appendChild(t);
        setTimeout(function(){ t.style.opacity='0';t.style.transition='opacity 0.4s'; setTimeout(function(){ t.remove(); },400); },2500);
    }

    /* ── Prefill Tax Optimizer from Financial Plan income field ── */
    function tgPrefillFromFP() {
        var incomeEl = document.getElementById('fp-income');
        var monthly  = parseInt((incomeEl?.value||'').replace(/,/g,'')) || 0;
        switchMode('taxguide');
        setTimeout(function(){
            var tgEl = document.getElementById('tg-income');
            if (tgEl && monthly > 0) {
                // FP income is take-home; approximate gross as take-home × 1.2 (rough 20% tax)
                // User can adjust — this just gives a starting point
                var annualGross = Math.round(monthly * 12 * 1.2 / 10000) * 10000;
                tgEl.value = annualGross.toLocaleString('en-IN');
                var mEl = document.getElementById('tg-income-monthly');
                if (mEl) mEl.textContent = 'approx. Rs.' + Math.round(annualGross/12).toLocaleString('en-IN') + '/month CTC';
                tgCalc();
            }
        }, 100);
    }

    /* ── Init hook (called by switchMode) ── */
    function initTaxGuide() {
        tgCalc();
    }