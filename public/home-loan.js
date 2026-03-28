    /* ══════════════════════════════════════════════
       HOME LOAN ADVISOR
    ══════════════════════════════════════════════ */
    function initHomeLoan() {
        // Populate year dropdown with -5 to +30 years from current
        var yearSel = document.getElementById('hl-start-year');
        if (yearSel && yearSel.options.length <= 1) {
            var cur = new Date().getFullYear();
            for (var y = cur - 5; y <= cur + 30; y++) {
                var opt = document.createElement('option');
                opt.value = y; opt.textContent = y;
                if (y === cur) opt.selected = false; // keep placeholder selected
                yearSel.appendChild(opt);
            }
        }
        // Colour change on select
        ['hl-start-month','hl-start-year'].forEach(function(id) {
            var el = document.getElementById(id);
            if (el) el.addEventListener('change', function() {
                if (this.value) this.style.color = '#1e293b';
            });
        });
        // Restore saved data if available
        // Re-apply colours and run all calcs now that panel is visible
        var hlDefaults = {'hl-rate':'8.5','hl-tenure':'20','pp-rate':'8.5','pp-tenure':'20','pp-after':'3','rvb-rate':'8.5','rvb-tenure':'20','rvb-apprec':'7','rvb-stamp':'7','rvb-gst':'0','rvb-rent-incr':'5','rvb-inv-return':'12','rvb-years':'20','tx-rate':'8.5','tx-tenure':'20'};
        Object.keys(hlDefaults).forEach(function(id) {
            var el = document.getElementById(id);
            if (!el) return;
            var isDefault = (!el.value || el.value === hlDefaults[id]);
            if (isDefault) { el.classList.add('text-slate-400'); }
            else { el.classList.remove('text-slate-400'); }
        });
        ['hl-amount','pp-amount','pp-lump','rvb-price','rvb-down','rvb-maint','rvb-society','rvb-modt','rvb-rent','tx-amount'].forEach(function(id) {
            var el = document.getElementById(id);
            if (!el) return;
            if (el.value && el.value !== '0') { el.classList.remove('text-slate-400'); }
            else { el.classList.add('text-slate-400'); }
        });
        window._hlPendingData = null;
        hlTab('emi');
        hlEmiCalc();
        hlPrepayCalc();
        hlRvbCalc();
        hlTaxCalc();
        if (typeof saveUserData === 'function') saveUserData();
    }

    function hlTab(t) {
        ['emi','prepay','rentvsbuy','tax'].forEach(function(s) {
            var sec = document.getElementById('hl-section-' + s);
            var btn = document.getElementById('hl-tab-'     + s);
            if (!sec || !btn) return;
            var active = s === t;
            sec.classList.toggle('hidden', !active);
            btn.className = (active ? 'hl-tab-active' : 'hl-tab-inactive') + ' px-4 py-2 rounded-xl text-xs font-black transition-all';
        });
    }

    function hlFormat(el) {
        var raw = (el.value||'').replace(/[^0-9]/g,'');
        el.value = raw ? Number(raw).toLocaleString('en-IN') : '';
    }
    function hlNum(id) {
        return parseFloat((document.getElementById(id)?.value||'').replace(/,/g,'').replace(/[^0-9.]/g,'')) || 0;
    }
    function hlFmt(n) { return 'Rs.' + Math.round(n).toLocaleString('en-IN'); }

    /* ── EMI CALCULATOR ── */
    function hlEmiCalc() {
        var P = hlNum('hl-amount');
        var r = hlNum('hl-rate') / 100 / 12;
        var n = hlNum('hl-tenure') * 12;
        var el = document.getElementById('hl-emi-result');
        var aw = document.getElementById('hl-emi-amort-wrap');
        if (!P || !r || !n) {
            if (el) el.innerHTML = '<p class="text-xs text-slate-400 text-center font-semibold py-4">Enter loan details to see EMI</p>';
            if (aw) aw.classList.add('hidden');
            return;
        }
        var emi        = P * r * Math.pow(1+r,n) / (Math.pow(1+r,n) - 1);
        var totalPay   = emi * n;
        var totalInt   = totalPay - P;
        var intRatio   = (totalInt / totalPay * 100).toFixed(0);

        // Start date
        var smEl = document.getElementById('hl-start-month');
        var syEl = document.getElementById('hl-start-year');
        var endDate = '';
        if (smEl && syEl && smEl.value && syEl.value) {
            var d = new Date(parseInt(syEl.value), parseInt(smEl.value) - 1, 1);
            d.setMonth(d.getMonth() + n);
            endDate = d.toLocaleDateString('en-IN', {month:'short', year:'numeric'});
            smEl.style.color = '#1e293b'; syEl.style.color = '#1e293b';
        }

        el.innerHTML =
            '<div class="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-3">Your EMI Breakdown</div>' +
            '<div class="rounded-2xl p-4 text-center mb-3 shine-header" style="background:linear-gradient(135deg,#1a4a7a,#1e3a5f);">' +
                '<div class="text-[10px] text-blue-200 font-semibold mb-1">Monthly EMI</div>' +
                '<div class="text-3xl font-black text-white">' + hlFmt(emi) + '</div>' +
                '<div class="text-[10px] text-blue-300 mt-1">per month for ' + (n/12) + ' years' + (endDate ? ' · until ' + endDate : '') + '</div>' +
            '</div>' +
            '<div class="space-y-1.5">' +
                '<div class="hl-stat" style="background:#eff6ff;"><span class="text-[11px] text-blue-700 font-semibold">Principal Amount</span><span class="font-black text-blue-800">' + hlFmt(P) + '</span></div>' +
                '<div class="hl-stat" style="background:#fef2f2;"><span class="text-[11px] text-red-600 font-semibold">Total Interest</span><span class="font-black text-red-700">' + hlFmt(totalInt) + '</span></div>' +
                '<div class="hl-stat" style="background:#f8fafc;border:1px solid #e2e8f0;"><span class="text-[11px] text-slate-600 font-black">Total Payment</span><span class="font-black text-slate-800">' + hlFmt(totalPay) + '</span></div>' +
            '</div>' +
            '<div class="mt-3 rounded-xl overflow-hidden" style="border:1px solid #e2e8f0;">' +
                '<div class="flex" style="height:12px;">' +
                    '<div style="width:' + (100-intRatio) + '%;background:#3b82f6;" title="Principal"></div>' +
                    '<div style="width:' + intRatio + '%;background:#ef4444;" title="Interest"></div>' +
                '</div>' +
                '<div class="flex justify-between px-2 py-1 text-[9px] font-bold">' +
                    '<span class="text-blue-600">Principal ' + (100-intRatio) + '%</span>' +
                    '<span class="text-red-500">Interest ' + intRatio + '%</span>' +
                '</div>' +
            '</div>' +
            '<div class="mt-2 text-[9px] text-slate-400 text-center">Every 1% rate increase on ' + hlFmt(P) + ' adds ~' + hlFmt(P*0.01/100*12*0.6) + ' to monthly EMI</div>';

        // Amortisation
        if (aw) aw.classList.remove('hidden');
        var tbody = document.getElementById('hl-amort-body');
        if (!tbody) return;
        var bal = P, rows = '';
        for (var yr = 1; yr <= n/12; yr++) {
            var prinYr = 0, intYr = 0;
            for (var m = 0; m < 12; m++) {
                var intM  = bal * r;
                var prinM = emi - intM;
                intYr  += intM;
                prinYr += prinM;
                bal    -= prinM;
                if (bal < 0) bal = 0;
            }
            var rowBg = yr % 2 === 0 ? 'background:#f8fafc;' : '';
            rows += '<tr style="' + rowBg + '">' +
                '<td class="px-3 py-1.5 font-bold text-slate-600">Yr ' + yr + '</td>' +
                '<td class="px-3 py-1.5 text-right text-blue-700 font-semibold">' + hlFmt(prinYr) + '</td>' +
                '<td class="px-3 py-1.5 text-right text-red-500 font-semibold">'  + hlFmt(intYr)  + '</td>' +
                '<td class="px-3 py-1.5 text-right font-bold text-slate-700">'    + hlFmt(Math.max(0,bal)) + '</td>' +
            '</tr>';
        }
        tbody.innerHTML = rows;
        if (typeof saveUserData === 'function') saveUserData();
    }

    function hlToggleAmort() {
        var t = document.getElementById('hl-amort-table');
        var b = document.getElementById('hl-amort-btn');
        if (!t || !b) return;
        var hidden = t.classList.toggle('hidden');
        b.textContent = hidden ? 'Show year-by-year' : 'Hide';
    }

    /* ── PREPAYMENT BENEFIT ── */
    function hlPrepayCalc() {
        var P     = hlNum('pp-amount');
        var rate  = hlNum('pp-rate');
        var ten   = hlNum('pp-tenure');
        var lump  = hlNum('pp-lump');
        var after = hlNum('pp-after');
        var choice = document.querySelector('input[name="pp-choice"]:checked')?.value || 'reduce_tenure';
        var el    = document.getElementById('hl-prepay-result');
        if (!P || !rate || !ten || !lump) {
            if (el) el.innerHTML = '<p class="text-xs text-slate-400 text-center font-semibold py-4">Enter details to see prepayment benefit</p>';
            return;
        }
        var r   = rate / 100 / 12;
        var n   = ten * 12;
        var emi = P * r * Math.pow(1+r,n) / (Math.pow(1+r,n) - 1);

        // Balance after 'after' years
        var bal = P;
        for (var i = 0; i < after*12; i++) {
            bal = bal * (1+r) - emi;
        }
        bal = Math.max(0, bal);
        var balAfterPrepay = Math.max(0, bal - lump);
        var remMonths = (ten - after) * 12;

        // Without prepayment
        var totalWithout = emi * n;
        var intWithout   = totalWithout - P;

        // With prepayment
        var newEmi, newTenure, totalWith, intWith, intSaved, timeSaved;
        if (choice === 'reduce_tenure') {
            // Same EMI, shorter tenure
            newEmi = emi;
            if (r > 0 && balAfterPrepay > 0) {
                newTenure = Math.ceil(Math.log(newEmi / (newEmi - balAfterPrepay * r)) / Math.log(1 + r));
            } else { newTenure = 0; }
            totalWith = emi * after * 12 + newEmi * newTenure;
            intWith   = totalWith - P;
            intSaved  = Math.max(0, intWithout - intWith);
            var totalMonths = after*12 + newTenure;
            timeSaved = remMonths - newTenure;
        } else {
            // Same tenure, lower EMI
            newTenure = remMonths;
            newEmi    = balAfterPrepay > 0 && r > 0 ? balAfterPrepay * r * Math.pow(1+r,remMonths) / (Math.pow(1+r,remMonths) - 1) : 0;
            totalWith = emi * after * 12 + newEmi * remMonths;
            intWith   = totalWith - P;
            intSaved  = Math.max(0, intWithout - intWith);
            timeSaved = 0;
        }

        el.innerHTML =
            '<div class="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-3">Prepayment Impact</div>' +
            '<div class="grid grid-cols-2 gap-2 mb-3">' +
                '<div class="rounded-xl p-3 text-center" style="background:#fef2f2;border:1px solid #fecaca;">' +
                    '<div class="text-[9px] text-red-500 font-bold mb-0.5">Without Prepayment</div>' +
                    '<div class="text-sm font-black text-red-700">' + hlFmt(totalWithout) + '</div>' +
                    '<div class="text-[9px] text-red-400">Total payment</div>' +
                '</div>' +
                '<div class="rounded-xl p-3 text-center" style="background:#f0fdf4;border:1px solid #86efac;">' +
                    '<div class="text-[9px] text-emerald-600 font-bold mb-0.5">With Prepayment</div>' +
                    '<div class="text-sm font-black text-emerald-700">' + hlFmt(totalWith) + '</div>' +
                    '<div class="text-[9px] text-emerald-400">Total payment</div>' +
                '</div>' +
            '</div>' +
            '<div class="space-y-1.5">' +
                '<div class="hl-stat" style="background:#f0fdf4;border:1px solid #86efac;">' +
                    '<span class="text-[11px] text-emerald-700 font-black">Interest Saved</span>' +
                    '<span class="text-base font-black text-emerald-600">' + hlFmt(intSaved) + '</span>' +
                '</div>' +
                (choice === 'reduce_tenure' && timeSaved > 0
                    ? '<div class="hl-stat" style="background:#eff6ff;"><span class="text-[11px] text-blue-700 font-black">Time Saved</span><span class="font-black text-blue-600">' + Math.floor(timeSaved/12) + ' yrs ' + (timeSaved%12) + ' mo</span></div>'
                    : '<div class="hl-stat" style="background:#eff6ff;"><span class="text-[11px] text-blue-700 font-black">New EMI</span><span class="font-black text-blue-600">' + hlFmt(newEmi) + '/mo</span></div>') +
                '<div class="hl-stat" style="background:#faf5ff;"><span class="text-[11px] text-purple-700 font-semibold">Outstanding before prepayment</span><span class="font-bold text-purple-700">' + hlFmt(bal) + '</span></div>' +
                '<div class="hl-stat" style="background:#faf5ff;"><span class="text-[11px] text-purple-700 font-semibold">Outstanding after prepayment</span><span class="font-bold text-purple-700">' + hlFmt(balAfterPrepay) + '</span></div>' +
            '</div>' +
            '<div class="mt-3 rounded-xl px-3 py-2 text-[10px] leading-relaxed" style="background:#fef9c3;border:1px solid #fde68a;color:#92400e;">' +
                '<strong>Tip:</strong> Prepaying early (years 1–5) saves more interest than the same amount later because interest is front-loaded. Every rupee prepaid in year 1 saves ~' + (rate/100*ten/2).toFixed(1) + 'x in total interest over the loan.' +
            '</div>';
        if (typeof saveUserData === 'function') saveUserData();
    }

    /* ── RENT VS BUY ── */
    function hlRvbCalc() {
        var price    = hlNum('rvb-price');
        var down     = hlNum('rvb-down');
        var rate     = hlNum('rvb-rate');
        var tenure   = hlNum('rvb-tenure');
        var apprec   = hlNum('rvb-apprec') / 100;
        var maint    = hlNum('rvb-maint');       // Annual property tax (₹)
        var society  = hlNum('rvb-society');     // Monthly society charges (₹)
        var stampPct = hlNum('rvb-stamp') || 7;  // Stamp duty + registration %
        var gstPct   = hlNum('rvb-gst')   || 0;  // GST % (0 for ready-to-move)
        var modtAmt  = hlNum('rvb-modt')  || 0;  // MODT + legal charges (₹)
        var rent     = hlNum('rvb-rent');
        var rentIncr = hlNum('rvb-rent-incr') / 100;
        var invRet   = hlNum('rvb-inv-return') / 100;
        var years    = hlNum('rvb-years');
        var el       = document.getElementById('hl-rvb-result');
        if (!price || !rent || !years) {
            if (el) el.innerHTML = '<p class="text-xs text-slate-400 text-center font-semibold py-4">Enter details to see Rent vs Buy analysis</p>';
            return;
        }

        var loan = price - down;
        var r    = rate / 100 / 12;
        var n    = tenure * 12;
        var emi  = loan > 0 && r > 0 ? loan * r * Math.pow(1+r,n) / (Math.pow(1+r,n) - 1) : 0;

        // ── Upfront one-time costs (buyer pays, renter saves) ──────────────
        var stampAmt     = price * (stampPct / 100);
        var gstAmt       = price * (gstPct   / 100);
        var totalUpfront = stampAmt + gstAmt + modtAmt;

        // Monthly cost breakdown for buyer (used in saving calculation)
        var buyMonthly = emi + (maint / 12) + society;

        // Build year-by-year series for chart
        var buyArr = [], rentArr = [];
        // Renter starts with full down payment PLUS the upfront costs they don't pay
        var balLoan = loan, investCorpus = down + totalUpfront, rentCur = rent;
        var totalEmi = 0, totalMaint = 0, totalSociety = 0, totalRent = 0;

        for (var yr = 1; yr <= years; yr++) {
            // BUY: property appreciates, loan reduces
            var propVal = price * Math.pow(1 + apprec, yr);
            for (var m = 0; m < 12; m++) {
                var intM = balLoan * r;
                var prinM = emi - intM;
                balLoan = Math.max(0, balLoan - prinM);
            }
            totalEmi     += emi * 12;
            totalMaint   += maint;
            totalSociety += society * 12;
            // Buy net worth = equity in property (upfront costs are sunk — already paid from down payment pool)
            var buyNW = propVal - balLoan;
            buyArr.push(buyNW);

            // RENT: invest down payment + upfront savings + monthly difference
            var mthSaving = buyMonthly - rentCur;
            if (mthSaving > 0) investCorpus += mthSaving * 12;
            investCorpus *= (1 + invRet);
            totalRent += rentCur * 12;
            rentCur *= (1 + rentIncr);
            rentArr.push(investCorpus);
        }

        var buyNetWorth  = buyArr[years-1];
        var rentNetWorth = rentArr[years-1];
        var buyBetter    = buyNetWorth > rentNetWorth;
        var diff         = Math.abs(buyNetWorth - rentNetWorth);

        // Colors: winner gets accent, loser gets neutral grey
        var buyBg    = buyBetter  ? '#eff6ff' : '#f8fafc';
        var buyBord  = buyBetter  ? '#3b82f6' : '#e2e8f0';
        var buyTxt   = buyBetter  ? '#1d4ed8'  : '#64748b';
        var rentBg   = !buyBetter ? '#f0fdf4'  : '#f8fafc';
        var rentBord = !buyBetter ? '#22c55e'  : '#e2e8f0';
        var rentTxt  = !buyBetter ? '#15803d'  : '#64748b';
        var winColor = buyBetter  ? '#1d4ed8'  : '#15803d';
        var winLabel = buyBetter  ? '🏠 Buying builds more wealth' : '📈 Renting + investing builds more wealth';

        // SVG chart — wealth growth lines
        var W = 340, H = 140, PAD = 10, LPAD = 8;
        var allVals = buyArr.concat(rentArr);
        var maxV = Math.max.apply(null, allVals);
        var minV = Math.min(0, Math.min.apply(null, allVals));
        var range = maxV - minV || 1;
        var xs = [], buyPts = '', rentPts = '';
        for (var i = 0; i < years; i++) {
            var x = LPAD + (i / (years-1||1)) * (W - LPAD - PAD);
            var yB = H - PAD - ((buyArr[i]  - minV) / range) * (H - PAD*2);
            var yR = H - PAD - ((rentArr[i] - minV) / range) * (H - PAD*2);
            xs.push(x);
            buyPts  += (i===0?'M':'L') + x.toFixed(1) + ',' + yB.toFixed(1) + ' ';
            rentPts += (i===0?'M':'L') + x.toFixed(1) + ',' + yR.toFixed(1) + ' ';
        }

        // Find crossover year
        var crossover = -1;
        for (var i = 1; i < years; i++) {
            if ((buyArr[i] > rentArr[i]) !== (buyArr[i-1] > rentArr[i-1])) { crossover = i+1; break; }
        }

        // Shaded fill areas under each line
        var buyFill  = buyPts  + 'L' + xs[years-1].toFixed(1) + ',' + (H-PAD) + ' L' + LPAD.toFixed(1) + ',' + (H-PAD) + ' Z';
        var rentFill = rentPts + 'L' + xs[years-1].toFixed(1) + ',' + (H-PAD) + ' L' + LPAD.toFixed(1) + ',' + (H-PAD) + ' Z';

        // Y-axis labels
        var yLabels = '';
        for (var t = 0; t <= 4; t++) {
            var v = minV + (range * t / 4);
            var y = H - PAD - (t/4) * (H - PAD*2);
            var lbl = v >= 10000000 ? (v/10000000).toFixed(1)+'Cr' : v >= 100000 ? (v/100000).toFixed(0)+'L' : (v/1000).toFixed(0)+'K';
            yLabels += '<text x="' + (LPAD-2) + '" y="' + y.toFixed(1) + '" text-anchor="end" font-size="7" fill="#94a3b8">' + lbl + '</text>';
        }

        // X-axis labels (every 5 years)
        var xLabels = '';
        for (var i = 0; i < years; i++) {
            if ((i+1) % 5 === 0 || i === 0 || i === years-1) {
                xLabels += '<text x="' + xs[i].toFixed(1) + '" y="' + (H-1) + '" text-anchor="middle" font-size="7" fill="#94a3b8">Yr' + (i+1) + '</text>';
            }
        }

        // Crossover marker
        var crossoverMark = '';
        if (crossover > 0 && crossover <= years) {
            var cx = xs[crossover-1].toFixed(1);
            crossoverMark = '<line x1="'+cx+'" y1="'+PAD+'" x2="'+cx+'" y2="'+(H-PAD)+'" stroke="#f59e0b" stroke-width="1.5" stroke-dasharray="3,2"/>' +
                '<text x="'+(parseFloat(cx)+3)+'" y="'+(PAD+8)+'" font-size="6.5" fill="#b45309" font-weight="bold">Crossover Yr'+crossover+'</text>';
        }

        var svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:150px;">' +
            '<rect width="'+W+'" height="'+H+'" fill="#f8fafc" rx="8"/>' +
            '<line x1="'+LPAD+'" y1="'+(H-PAD)+'" x2="'+(W-PAD)+'" y2="'+(H-PAD)+'" stroke="#e2e8f0" stroke-width="1"/>' +
            '<line x1="'+LPAD+'" y1="'+PAD+'" x2="'+LPAD+'" y2="'+(H-PAD)+'" stroke="#e2e8f0" stroke-width="1"/>' +
            yLabels + xLabels +
            '<path d="' + buyFill  + '" fill="' + (buyBetter  ? 'rgba(59,130,246,0.08)' : 'rgba(148,163,184,0.06)') + '"/>' +
            '<path d="' + rentFill + '" fill="' + (!buyBetter ? 'rgba(34,197,94,0.08)'  : 'rgba(148,163,184,0.06)') + '"/>' +
            '<path d="' + buyPts  + '" fill="none" stroke="' + (buyBetter  ? '#3b82f6' : '#94a3b8') + '" stroke-width="' + (buyBetter  ? '2' : '1.5') + '" stroke-linecap="round" stroke-linejoin="round"/>' +
            '<path d="' + rentPts + '" fill="none" stroke="' + (!buyBetter ? '#22c55e' : '#94a3b8') + '" stroke-width="' + (!buyBetter ? '2' : '1.5') + '" stroke-linecap="round" stroke-linejoin="round"/>' +
            crossoverMark +
            '<circle cx="' + xs[years-1].toFixed(1) + '" cy="' + (H-PAD-((buyArr[years-1]-minV)/range*(H-PAD*2))).toFixed(1) + '" r="3" fill="' + (buyBetter  ? '#3b82f6' : '#94a3b8') + '"/>' +
            '<circle cx="' + xs[years-1].toFixed(1) + '" cy="' + (H-PAD-((rentArr[years-1]-minV)/range*(H-PAD*2))).toFixed(1) + '" r="3" fill="' + (!buyBetter ? '#22c55e' : '#94a3b8') + '"/>' +
            '<rect x="'+(W-80)+'" y="6" width="8" height="3" rx="1.5" fill="' + (buyBetter  ? '#3b82f6' : '#94a3b8') + '"/>' +
            '<text x="'+(W-69)+'" y="10" font-size="7.5" fill="' + (buyBetter  ? '#1d4ed8'  : '#64748b') + '" font-weight="' + (buyBetter  ? 'bold' : 'normal') + '">🏠 Buy</text>' +
            '<rect x="'+(W-80)+'" y="16" width="8" height="3" rx="1.5" fill="' + (!buyBetter ? '#22c55e' : '#94a3b8') + '"/>' +
            '<text x="'+(W-69)+'" y="20" font-size="7.5" fill="' + (!buyBetter ? '#15803d'  : '#64748b') + '" font-weight="' + (!buyBetter ? 'bold' : 'normal') + '">📈 Rent</text>' +
            '</svg>';

        // Upfront cost breakdown string
        var upfrontBreakdown = hlFmt(stampAmt) + ' stamp+reg' +
            (gstAmt > 0 ? ' + ' + hlFmt(gstAmt) + ' GST' : '') +
            (modtAmt > 0 ? ' + ' + hlFmt(modtAmt) + ' MODT/legal' : '');

        el.innerHTML =
            // Winner banner
            '<div class="text-center rounded-xl py-2.5 px-3 font-black text-sm mb-3" style="background:' + winColor + '12;color:' + winColor + ';border:1.5px solid ' + winColor + '30;">' +
                winLabel + ' by <span style="font-size:1rem;">' + hlFmt(diff) + '</span>' +
            '</div>' +

            // Upfront cost callout — always visible so user knows what's included
            '<div class="rounded-xl px-3 py-2 mb-3 text-[10px] leading-relaxed" style="background:#fff7ed;border:1px solid #fed7aa;color:#92400e;">' +
                '<strong>📋 Upfront buying costs included:</strong> ' + upfrontBreakdown +
                ' = <strong>' + hlFmt(totalUpfront) + '</strong> — added to buy-side cost &amp; renter\'s investable capital.' +
            '</div>' +

            // Chart
            '<div class="mb-3 rounded-xl overflow-hidden" style="border:1px solid #e2e8f0;">' +
                '<div class="px-3 pt-2 pb-0 text-[9px] font-black text-slate-400 uppercase tracking-wider">Net Wealth Over ' + years + ' Years</div>' +
                svg +
            '</div>' +

            // Two tiles — only winner highlighted
            '<div class="grid grid-cols-2 gap-2 mb-3">' +
                '<div class="rounded-xl p-3" style="background:' + buyBg + ';border:2px solid ' + buyBord + ';transition:all .2s;">' +
                    '<div class="text-[9px] font-black mb-1.5" style="color:' + buyTxt + ';">🏠 Buy Path' + (buyBetter ? ' 🏆' : '') + '</div>' +
                    '<div class="text-[10px] space-y-0.5">' +
                        '<div class="flex justify-between"><span class="text-slate-400">Property value</span><span class="font-bold text-slate-700">' + hlFmt(price * Math.pow(1+apprec,years)) + '</span></div>' +
                        '<div class="flex justify-between"><span class="text-slate-400">EMI paid</span><span class="font-semibold text-red-400">-' + hlFmt(emi * Math.min(years,tenure) * 12) + '</span></div>' +
                        '<div class="flex justify-between"><span class="text-slate-400">Stamp + reg</span><span class="font-semibold text-red-400">-' + hlFmt(stampAmt) + '</span></div>' +
                        (gstAmt > 0 ? '<div class="flex justify-between"><span class="text-slate-400">GST</span><span class="font-semibold text-red-400">-' + hlFmt(gstAmt) + '</span></div>' : '') +
                        (modtAmt > 0 ? '<div class="flex justify-between"><span class="text-slate-400">MODT + legal</span><span class="font-semibold text-red-400">-' + hlFmt(modtAmt) + '</span></div>' : '') +
                        '<div class="flex justify-between"><span class="text-slate-400">Prop tax + maint</span><span class="font-semibold text-red-400">-' + hlFmt(totalMaint) + '</span></div>' +
                        (totalSociety > 0 ? '<div class="flex justify-between"><span class="text-slate-400">Society charges</span><span class="font-semibold text-red-400">-' + hlFmt(totalSociety) + '</span></div>' : '') +
                        '<div class="flex justify-between pt-1 mt-1 border-t" style="border-color:' + buyBord + ';"><span class="font-black" style="color:' + buyTxt + ';">Net Worth</span><span class="font-black" style="color:' + buyTxt + ';">' + hlFmt(buyNetWorth) + '</span></div>' +
                    '</div>' +
                '</div>' +
                '<div class="rounded-xl p-3" style="background:' + rentBg + ';border:2px solid ' + rentBord + ';transition:all .2s;">' +
                    '<div class="text-[9px] font-black mb-1.5" style="color:' + rentTxt + ';">📈 Rent + Invest' + (!buyBetter ? ' 🏆' : '') + '</div>' +
                    '<div class="text-[10px] space-y-0.5">' +
                        '<div class="flex justify-between"><span class="text-slate-400">Invested</span><span class="font-bold text-slate-700">' + hlFmt(down + totalUpfront) + '</span></div>' +
                        '<div class="flex justify-between"><span class="text-slate-400">(Down + saved costs)</span><span class="text-[9px] text-slate-400">' + hlFmt(down) + ' + ' + hlFmt(totalUpfront) + '</span></div>' +
                        '<div class="flex justify-between"><span class="text-slate-400">Investment corpus</span><span class="font-bold text-slate-700">' + hlFmt(investCorpus) + '</span></div>' +
                        '<div class="flex justify-between"><span class="text-slate-400">Total rent paid</span><span class="font-semibold text-red-400">-' + hlFmt(totalRent) + '</span></div>' +
                        '<div class="flex justify-between pt-1 mt-1 border-t" style="border-color:' + rentBord + ';"><span class="font-black" style="color:' + rentTxt + ';">Net Worth</span><span class="font-black" style="color:' + rentTxt + ';">' + hlFmt(rentNetWorth) + '</span></div>' +
                    '</div>' +
                '</div>' +
            '</div>' +

            // Crossover note
            (crossover > 0 && crossover <= years
                ? '<div class="rounded-xl px-3 py-2 mb-2 text-[10px]" style="background:#fef9c3;border:1px solid #fde68a;color:#92400e;"><strong>Crossover at Year ' + crossover + ':</strong> This is when ' + (buyBetter ? 'buying overtakes renting' : 'renting overtakes buying') + ' in net wealth. Before that point the other path was ahead.</div>'
                : '') +

            // Disclaimer
            '<div class="rounded-xl px-3 py-2 text-[10px] leading-relaxed" style="background:#f8fafc;border:1px solid #e2e8f0;color:#64748b;">' +
                '<strong>Includes:</strong> stamp duty, registration, GST (if under-construction), MODT/legal, property tax, society maintenance. ' +
                '<strong>Note:</strong> Owning provides security, customisation &amp; no landlord risk — not captured here. Returns vary by city. Consult a financial advisor.' +
            '</div>';
        if (typeof saveUserData === 'function') saveUserData();
    }

    /* ── SECTION 24(b) TAX SAVING ── */
    function hlTaxCalc() {
        var P      = hlNum('tx-amount');
        var rate   = hlNum('tx-rate');
        var tenure = hlNum('tx-tenure');
        var slab   = hlNum('tx-slab') / 100;
        var type   = document.getElementById('tx-type')?.value || 'self';
        var regime = document.getElementById('tx-regime')?.value || 'new';
        var el     = document.getElementById('hl-tax-result');
        if (!P || !rate || !tenure) {
            if (el) el.innerHTML = '<p class="text-xs text-slate-400 text-center font-semibold py-4">Enter details to see tax saving</p>';
            return;
        }

        // Under the new regime, Section 24(b) deduction for self-occupied property
        // is NOT available (removed from Budget 2020 onwards). Let-out property
        // interest is still deductible against house property income in both regimes.
        if (regime === 'new' && type === 'self') {
            el.innerHTML =
                '<div class="rounded-xl p-4 text-sm leading-relaxed" style="background:#fff7ed;border:1px solid #fed7aa;">' +
                '<div class="font-black text-orange-700 mb-1">⚠ Section 24(b) not available under New Regime</div>' +
                '<div class="text-orange-800 text-[11px]">The ₹2L interest deduction on self-occupied home loans under Section 24(b) is <strong>not allowed</strong> under the New Tax Regime (FY 2025-26). ' +
                'Switch to <strong>Old Regime</strong> above to claim this benefit — but compare your total tax outgo first using the Tax Guide calculator.</div>' +
                '<div class="mt-2 text-[10px] text-orange-600">For <strong>let-out / rented</strong> properties, interest is deductible against house property income in both regimes.</div>' +
                '</div>';
            return;
        }
        var r   = rate / 100 / 12;
        var n   = tenure * 12;
        var emi = P * r * Math.pow(1+r,n) / (Math.pow(1+r,n) - 1);

        // Year-by-year interest
        var rows = '', bal = P;
        var totalTaxSaved = 0;
        var totalInterest = 0;
        for (var yr = 1; yr <= Math.min(tenure, 30); yr++) {
            var intYr = 0, prinYr = 0;
            for (var m = 0; m < 12; m++) {
                var intM = bal * r;
                intYr += intM;
                prinYr += (emi - intM);
                bal -= (emi - intM);
                if (bal < 0) bal = 0;
            }
            var deduction  = type === 'self' ? Math.min(intYr, 200000) : intYr;
            var taxSaved   = deduction * slab * 1.04; // incl 4% cess
            totalInterest += intYr;
            totalTaxSaved += taxSaved;
            var rowBg = yr % 2 === 0 ? 'background:#f8fafc;' : '';
            rows += '<tr style="' + rowBg + '">' +
                '<td class="px-3 py-1.5 font-bold text-slate-600">Yr ' + yr + '</td>' +
                '<td class="px-3 py-1.5 text-right text-red-500">'     + hlFmt(intYr)    + '</td>' +
                '<td class="px-3 py-1.5 text-right text-emerald-600">' + hlFmt(deduction) + '</td>' +
                '<td class="px-3 py-1.5 text-right font-bold text-blue-600">' + hlFmt(taxSaved) + '</td>' +
            '</tr>';
        }

        var effectiveRate = P > 0 ? (rate - (totalTaxSaved/tenure) / (P/100)).toFixed(2) : rate;
        el.innerHTML =
            '<div class="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-3">Section 24(b) Tax Saving</div>' +
            '<div class="grid grid-cols-2 gap-2 mb-3">' +
                '<div class="rounded-xl p-3 text-center" style="background:#f0fdf4;border:1px solid #86efac;">' +
                    '<div class="text-[9px] text-emerald-600 font-bold">Total Tax Saved</div>' +
                    '<div class="text-xl font-black text-emerald-700">' + hlFmt(totalTaxSaved) + '</div>' +
                    '<div class="text-[9px] text-emerald-400">over ' + tenure + ' yrs (incl. cess)</div>' +
                '</div>' +
                '<div class="rounded-xl p-3 text-center" style="background:#eff6ff;border:1px solid #bfdbfe;">' +
                    '<div class="text-[9px] text-blue-600 font-bold">Effective Loan Rate</div>' +
                    '<div class="text-xl font-black text-blue-700">' + effectiveRate + '%</div>' +
                    '<div class="text-[9px] text-blue-400">after tax benefit</div>' +
                '</div>' +
            '</div>' +
            (type === 'self'
                ? '<div class="rounded-lg px-3 py-2 mb-3 text-[10px] font-semibold text-amber-800" style="background:#fef3c7;border:1px solid #fde68a;">Self-occupied: max ₹2L/yr deduction. Years when interest > ₹2L, excess is not deductible.</div>'
                : '<div class="rounded-lg px-3 py-2 mb-3 text-[10px] font-semibold text-blue-800" style="background:#eff6ff;border:1px solid #bfdbfe;">Let-out: Full interest deductible (no cap). Rental income is taxable.</div>') +
            '<div class="overflow-x-auto rounded-xl" style="border:1px solid #e2e8f0;">' +
                '<table class="w-full text-[10px]" style="min-width:360px;">' +
                    '<thead><tr style="background:#f1f5f9;">' +
                        '<th class="px-3 py-2 text-left font-black text-slate-500">Year</th>' +
                        '<th class="px-3 py-2 text-right font-black text-slate-500">Interest</th>' +
                        '<th class="px-3 py-2 text-right font-black text-slate-500">Deduction</th>' +
                        '<th class="px-3 py-2 text-right font-black text-slate-500">Tax Saved</th>' +
                    '</tr></thead>' +
                    '<tbody>' + rows + '</tbody>' +
                '</table>' +
            '</div>';
        if (typeof saveUserData === 'function') saveUserData();
    }