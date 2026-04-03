    // =====================================================================
    //  SELF-EMPLOYED & BUSINESS OWNER PLANNER
    // =====================================================================

    function seFmt(el) {
        var raw = el.value.replace(/[^0-9]/g,'');
        if (!raw) return;
        var n = parseInt(raw,10), s = n.toString();
        if (s.length <= 3) { el.value = s; el.classList.remove('text-slate-400'); return; }
        var last3 = s.slice(-3), rest = s.slice(0,-3);
        el.value = rest.replace(/\B(?=(\d{2})+(?!\d))/g,',') + ',' + last3;
        el.classList.remove('text-slate-400');
    }
    function _seComma(n) {
        var s = Math.round(n).toString();
        if (s.length <= 3) return s;
        return s.slice(0,-3).replace(/\B(?=(\d{2})+(?!\d))/g,',') + ',' + s.slice(-3);
    }
    function _seInr(n) {
        if (n >= 1e7) return '₹' + (n/1e7).toFixed(2) + ' Cr';
        if (n >= 1e5) return '₹' + (n/1e5).toFixed(2) + ' L';
        return '₹' + _seComma(Math.round(n));
    }
    function _seParse(id) {
        var el = document.getElementById(id);
        return el ? (parseFloat(el.value.replace(/[^0-9.]/g,'')) || 0) : 0;
    }
    // Indian income tax slab (New Regime FY25-26)
    function _seNewTax(income) {
        if (income <= 400000)  return 0;
        if (income <= 800000)  return (income - 400000) * 0.05;
        if (income <= 1200000) return 20000 + (income - 800000) * 0.10;
        if (income <= 1600000) return 60000 + (income - 1200000) * 0.15;
        if (income <= 2000000) return 120000 + (income - 1600000) * 0.20;
        if (income <= 2400000) return 200000 + (income - 2000000) * 0.25;
        return 300000 + (income - 2400000) * 0.30;
    }
    // Old regime (basic slab)
    function _seOldTax(income, deductions) {
        var taxable = Math.max(0, income - deductions);
        var tax = 0;
        if (taxable <= 250000)  tax = 0;
        else if (taxable <= 500000)  tax = (taxable - 250000) * 0.05;
        else if (taxable <= 1000000) tax = 12500 + (taxable - 500000) * 0.20;
        else tax = 112500 + (taxable - 1000000) * 0.30;
        // Surcharge
        if (taxable > 5000000 && taxable <= 10000000) tax *= 1.10;
        else if (taxable > 10000000) tax *= 1.15;
        return tax;
    }

    function seTab(tab) {
        ['tax','bef','gst','adv'].forEach(function(t) {
            var panel = document.getElementById('se-panel-' + t);
            var btn   = document.getElementById('se-tab-' + t);
            if (!panel || !btn) return;
            if (t === tab) { panel.classList.remove('hidden'); btn.className = 'se-tab-btn se-tab-active'; }
            else           { panel.classList.add('hidden');    btn.className = 'se-tab-btn se-tab-inactive'; }
        });
        if (tab === 'tax') seCalcTax();
        if (tab === 'bef') seCalcBEF();
        if (tab === 'gst') seCalcGST();
        if (tab === 'adv') seCalcAdv();
    }

    function seCalcTax() {
        var bizType  = document.getElementById('se-biz-type')?.value || '44AD_digital';
        var turnover = _seParse('se-turnover');
        var regime   = document.getElementById('se-tax-regime')?.value || 'new';
        var otherInc = _seParse('se-other-income');
        var c80      = Math.min(_seParse('se-80c'), 150000);
        var nps      = Math.min(_seParse('se-nps'), 50000);

        // Show/hide actual profit input
        var aprRow = document.getElementById('se-actual-profit-row');
        if (aprRow) aprRow.classList.toggle('hidden', bizType !== 'regular');
        var oldDedRow = document.getElementById('se-old-deductions');
        if (oldDedRow) oldDedRow.classList.toggle('hidden', regime !== 'old');

        // Compute presumptive profit
        var pctLabel = '';
        var profit = 0;
        if (bizType === '44AD_digital')  { profit = turnover * 0.06; pctLabel = '6% of turnover (44AD digital)'; }
        else if (bizType === '44AD_cash'){ profit = turnover * 0.08; pctLabel = '8% of turnover (44AD cash)'; }
        else if (bizType === '44ADA')    { profit = turnover * 0.50; pctLabel = '50% of receipts (44ADA)'; }
        else { profit = _seParse('se-actual-profit'); pctLabel = 'actual profit (regular books)'; }

        var totalIncome = profit + otherInc;

        // Compute tax
        var tax = 0, deductions = 0;
        if (regime === 'new') {
            tax = _seNewTax(totalIncome);
            // Rebate u/s 87A if income ≤ 12L (new regime)
            if (totalIncome <= 1200000) tax = 0;
        } else {
            deductions = 50000 + c80 + nps; // std deduction 50K for professionals
            tax = _seOldTax(totalIncome, deductions);
            if (totalIncome - deductions <= 500000) tax = 0; // 87A rebate
        }
        var cess = tax * 0.04;
        var totalTax = tax + cess;
        var effRate = turnover > 0 ? (totalTax / turnover * 100) : 0;

        document.getElementById('se-res-profit').textContent    = _seInr(profit);
        document.getElementById('se-res-profit-pct').textContent = pctLabel;
        document.getElementById('se-res-taxable').textContent   = _seInr(Math.max(0, regime === 'new' ? totalIncome : totalIncome - deductions));
        document.getElementById('se-res-tax').textContent       = _seInr(totalTax);
        document.getElementById('se-res-effrate').textContent   = effRate.toFixed(2) + '%';
        document.getElementById('se-res-monthly-setaside').textContent = _seInr(totalTax / 12) + '/mo';
        document.getElementById('se-res-advance-tax').textContent      = _seInr(totalTax / 4);

        // Workings
        var w = '';
        w += '• Gross turnover / receipts: ' + _seInr(turnover) + '<br>';
        w += '• Presumptive profit (' + pctLabel + '): ' + _seInr(profit) + '<br>';
        if (otherInc) w += '• Other income: ' + _seInr(otherInc) + '<br>';
        if (regime === 'old' && deductions) w += '• Deductions (std + 80C + NPS): ' + _seInr(deductions) + '<br>';
        w += '• Taxable income: ' + _seInr(Math.max(0, regime === 'new' ? totalIncome : totalIncome - deductions)) + '<br>';
        w += '• Income tax: ' + _seInr(tax) + '<br>';
        w += '• Health & Education Cess (4%): ' + _seInr(cess) + '<br>';
        w += '• <strong>Total tax + cess: ' + _seInr(totalTax) + '</strong>';
        document.getElementById('se-tax-workings').innerHTML = w;

        // Comparison table: presumptive vs regular (assume regular profit = 15% margin)
        var regProfit15 = turnover * 0.15;
        var regTax15 = regime === 'new' ? _seNewTax(regProfit15 + otherInc) * 1.04 : _seOldTax(regProfit15 + otherInc, deductions) * 1.04;
        var rows = [
            { label: bizType === '44ADA' ? '44ADA (50% deemed)' : '44AD (6%/8% deemed)', profit: profit, tax: totalTax },
            { label: 'Regular books (15% margin)', profit: regProfit15, tax: regTax15 },
            { label: 'Regular books (25% margin)', profit: turnover*0.25, tax: (regime==='new'?_seNewTax(turnover*0.25+otherInc)*1.04:_seOldTax(turnover*0.25+otherInc,deductions)*1.04) },
        ];
        var tbl = '<table class="w-full text-[10px]"><thead><tr class="text-left"><th class="pb-1 font-black text-slate-500">Method</th><th class="pb-1 font-black text-slate-500">Profit</th><th class="pb-1 font-black text-slate-500">Tax + Cess</th><th class="pb-1 font-black text-slate-500">Saving vs 44AD</th></tr></thead><tbody>';
        rows.forEach(function(r, idx) {
            var saving = rows[0].tax - r.tax;
            var isBase = idx === 0;
            tbl += '<tr style="border-bottom:1px solid #f1f5f9;' + (isBase?'background:#f0f9ff;':'') + '">' +
                '<td class="py-1.5 font-bold text-slate-700">' + r.label + (isBase?' ← current':'') + '</td>' +
                '<td class="py-1.5">' + _seInr(r.profit) + '</td>' +
                '<td class="py-1.5 font-bold ' + (r.tax <= rows[0].tax ? 'text-emerald-700' : 'text-red-600') + '">' + _seInr(r.tax) + '</td>' +
                '<td class="py-1.5 font-bold ' + (saving > 0 ? 'text-red-500' : saving < 0 ? 'text-emerald-600' : 'text-slate-400') + '">' +
                (isBase ? '—' : (saving > 0 ? '+' + _seInr(saving) + ' saved' : saving < 0 ? _seInr(-saving) + ' more tax' : '—')) + '</td></tr>';
        });
        tbl += '</tbody></table>';
        document.getElementById('se-comparison-table').innerHTML = tbl;

        // Auto-populate advance tax tab
        var advEl = document.getElementById('se-adv-tax');
        if (advEl && !advEl.dataset.userEdited) {
            advEl.value = _seComma(Math.round(totalTax));
            advEl.classList.remove('text-slate-400');
            seCalcAdv();
        }
        if (typeof saveUserData === 'function') saveUserData();
    }

    function seCalcBEF() {
        var sal  = _seParse('se-bef-salaries');
        var rent = _seParse('se-bef-rent');
        var tools= _seParse('se-bef-tools');
        var loans= _seParse('se-bef-loans');
        var util = _seParse('se-bef-utilities');
        var inv  = _seParse('se-bef-inventory');
        var pers = _seParse('se-bef-personal');
        var months = parseInt(document.getElementById('se-bef-months')?.value) || 6;
        var current= _seParse('se-bef-current');

        var bizBurn  = sal + rent + tools + loans + util + inv;
        var totalBurn= bizBurn + pers;
        var target   = totalBurn * months;
        var shortfall= Math.max(0, target - current);

        document.getElementById('se-bef-burn').textContent       = _seInr(totalBurn) + '/mo';
        document.getElementById('se-bef-target').textContent     = _seInr(target);
        document.getElementById('se-bef-target-sub').textContent = months + ' months of total burn';
        document.getElementById('se-bef-shortfall').textContent  = shortfall > 0 ? _seInr(shortfall) : '✅ Fully funded';
        document.getElementById('se-bef-sip-6').textContent      = shortfall > 0 ? _seInr(shortfall/6) + '/mo' : '—';
        document.getElementById('se-bef-sip-12').textContent     = shortfall > 0 ? _seInr(shortfall/12) + '/mo' : '—';

        // Breakdown bars
        var items = [
            { label:'Salaries',    val: sal,  color:'#ef4444' },
            { label:'Rent/Office', val: rent, color:'#f59e0b' },
            { label:'Tools/SaaS',  val: tools,color:'#3b82f6' },
            { label:'Loan EMIs',   val: loans,color:'#8b5cf6' },
            { label:'Utilities',   val: util, color:'#10b981' },
            { label:'Inventory',   val: inv,  color:'#f97316' },
            { label:'Personal',    val: pers, color:'#ec4899' },
        ].filter(function(x){ return x.val > 0; });
        var html = '';
        items.forEach(function(x) {
            var pct = totalBurn > 0 ? Math.round(x.val/totalBurn*100) : 0;
            html += '<div class="flex items-center gap-2">' +
                '<div class="text-[9px] text-slate-600 w-20 flex-shrink-0">' + x.label + '</div>' +
                '<div class="flex-1 h-2 rounded-full bg-slate-100"><div class="h-full rounded-full" style="width:' + pct + '%;background:' + x.color + ';"></div></div>' +
                '<div class="text-[9px] font-bold text-slate-700 w-16 text-right">' + _seInr(x.val) + ' (' + pct + '%)</div>' +
                '</div>';
        });
        document.getElementById('se-bef-breakdown').innerHTML = html || '<div class="text-[10px] text-slate-400">Enter costs above</div>';
    }

    function seCalcGST() {
        var type     = document.getElementById('se-gst-type')?.value || 'regular';
        var revenue  = _seParse('se-gst-revenue');
        var rateOut  = parseFloat(document.getElementById('se-gst-rate-out')?.value) || 18;
        var purchases= _seParse('se-gst-purchases');
        var rateIn   = parseFloat(document.getElementById('se-gst-rate-in')?.value) || 18;
        var delay    = parseInt(document.getElementById('se-gst-delay')?.value) || 45;

        var regInputs = document.getElementById('se-gst-regular-inputs');
        if (regInputs) regInputs.style.display = type === 'regular' ? '' : 'none';

        if (type !== 'regular') {
            document.getElementById('se-gst-out').textContent     = '—';
            document.getElementById('se-gst-itc').textContent     = '—';
            document.getElementById('se-gst-net').textContent     = '—';
            document.getElementById('se-gst-cashgap').textContent = '—';
            var insEl = document.getElementById('se-gst-insight');
            if (insEl) insEl.innerHTML = type === 'composition'
                ? '📋 <strong>Composition Scheme:</strong> Pay 1% (traders) / 2% (manufacturers) / 5% (restaurants) on turnover. Cannot collect GST from customers. Cannot claim ITC. Simpler compliance — ideal if turnover ₹40L–₹1.5Cr.'
                : '✅ You are unregistered. GST registration mandatory if turnover exceeds ₹40L (goods) or ₹20L (services) per year.';
            return;
        }

        var gstOut  = revenue * rateOut / 100;
        var itc     = purchases * rateIn / 100;
        var netGST  = Math.max(0, gstOut - itc);
        // Cash gap: GST collected but client hasn't paid yet
        var cashGap = gstOut * (delay / 30); // proportion of monthly GST tied up in delay

        document.getElementById('se-gst-out').textContent     = _seInr(gstOut);
        document.getElementById('se-gst-itc').textContent     = _seInr(itc);
        document.getElementById('se-gst-net').textContent     = _seInr(netGST);
        document.getElementById('se-gst-cashgap').textContent = _seInr(cashGap);

        var insEl = document.getElementById('se-gst-insight');
        if (insEl) {
            var msg = '📊 You collect <strong>' + _seInr(gstOut) + '</strong> GST monthly and can reclaim <strong>' + _seInr(itc) + '</strong> ITC. ' +
                'Net GST payable by 20th: <strong>' + _seInr(netGST) + '</strong>. ';
            if (delay > 30) msg += '⚠️ With clients paying after <strong>' + delay + ' days</strong>, you have ~<strong>' + _seInr(cashGap) + '</strong> in GST float — money you\'ve collected from clients but not yet received in your bank. Set aside net GST on the day you raise the invoice, not when client pays.';
            else msg += '✅ Your collection cycle (' + delay + ' days) is reasonable. Still, maintain a dedicated GST account to avoid mixing.';
            insEl.innerHTML = msg;
        }
    }

    function seCalcAdv() {
        var totalTax = _seParse('se-adv-tax');
        var today    = new Date();
        var fy       = today.getMonth() >= 3 ? today.getFullYear() : today.getFullYear() - 1;
        var instalments = [
            { date: new Date(fy,5,15),  pct: 15, label: '1st — June 15' },
            { date: new Date(fy,8,15),  pct: 45, label: '2nd — September 15' },
            { date: new Date(fy,11,15), pct: 75, label: '3rd — December 15' },
            { date: new Date(fy+1,2,15),pct: 100,label: '4th — March 15' },
        ];
        var html = '';
        var prevPct = 0;
        instalments.forEach(function(ins) {
            var amount   = totalTax * (ins.pct - prevPct) / 100;
            var diff     = Math.round((ins.date - today) / 86400000);
            var isPast   = diff < 0;
            var isNear   = diff >= 0 && diff <= 30;
            var bg       = isPast ? '#f8fafc' : isNear ? '#fef2f2' : '#f0f9ff';
            var border   = isPast ? '#e2e8f0' : isNear ? '#fecaca' : '#bae6fd';
            var badgeClr = isPast ? '#94a3b8' : isNear ? '#dc2626' : '#1a5276';
            var badge    = isPast ? 'Done / Past' : diff === 0 ? 'TODAY' : diff + ' days';
            html += '<div class="rounded-xl px-3 py-2 flex items-center justify-between gap-3" style="background:' + bg + ';border:1px solid ' + border + ';">' +
                '<div>' +
                '<div class="text-[10px] font-black text-slate-800">' + ins.label + ' <span class="text-[8px] font-bold text-slate-400">(cumulative ' + ins.pct + '%)</span></div>' +
                '<div class="text-[9px] text-slate-500">' + ins.date.toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'}) + ' — pay this instalment</div>' +
                '</div>' +
                '<div class="text-right flex-shrink-0">' +
                '<div class="text-base font-black text-slate-800">' + _seInr(amount) + '</div>' +
                '<div class="text-[9px] font-bold px-1.5 py-0.5 rounded-md" style="color:' + badgeClr + ';background:' + bg + ';">' + badge + '</div>' +
                '</div></div>';
            prevPct = ins.pct;
        });
        document.getElementById('se-adv-schedule').innerHTML = html;
    }

    function initSelfEmpl() {
        seTab('tax');
        seCalcTax();
        seCalcBEF();
        seCalcGST();
        seCalcAdv();
    }

    function resetSelfEmpl() {
        var defs = {
            'se-turnover':'25,00,000','se-actual-profit':'8,00,000','se-other-income':'0',
            'se-80c':'1,50,000','se-nps':'50,000',
            'se-bef-salaries':'80,000','se-bef-rent':'25,000','se-bef-tools':'10,000',
            'se-bef-loans':'15,000','se-bef-utilities':'5,000','se-bef-inventory':'0',
            'se-bef-personal':'60,000','se-bef-current':'0',
            'se-gst-revenue':'8,00,000','se-gst-purchases':'3,00,000','se-gst-delay':'45',
            'se-adv-tax':'1,80,000'
        };
        Object.keys(defs).forEach(function(id) {
            var el = document.getElementById(id);
            if (el) { el.value = defs[id]; el.classList.add('text-slate-400'); }
        });
        var selDefs = {'se-biz-type':'44AD_digital','se-tax-regime':'new','se-bef-months':'6','se-gst-type':'regular','se-gst-rate-out':'18','se-gst-rate-in':'18'};
        Object.keys(selDefs).forEach(function(id) {
            var el = document.getElementById(id);
            if (el) el.value = selDefs[id];
        });
        seTab('tax');
    }

    function sePreset(name) {
        var p = {
            freelancer: { type:'44ADA',      turnover:'30,00,000', regime:'new' },
            doctor:     { type:'44ADA',      turnover:'60,00,000', regime:'new' },
            trader:     { type:'44AD_cash',  turnover:'80,00,000', regime:'new' },
            msme:       { type:'44AD_digital',turnover:'1,50,00,000',regime:'new' },
        };
        var d = p[name]; if (!d) return;
        var bizEl = document.getElementById('se-biz-type'); if (bizEl) bizEl.value = d.type;
        var turnEl = document.getElementById('se-turnover'); if (turnEl) { turnEl.value = d.turnover; turnEl.classList.remove('text-slate-400'); }
        var regEl = document.getElementById('se-tax-regime'); if (regEl) regEl.value = d.regime;
        seCalcTax();
    }
