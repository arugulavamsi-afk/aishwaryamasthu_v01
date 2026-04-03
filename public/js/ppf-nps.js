    /* ══════════════════════════════════════════════════════════
       PPF & NPS CALCULATOR
    ══════════════════════════════════════════════════════════ */
    var _ppfNpsTab = 'ppf';

    function ppfFormat(el) {
        var raw = (el.value || '').replace(/[^0-9]/g, '');
        el.value = raw ? Number(raw).toLocaleString('en-IN') : '';
    }

    function ppfNum(id) {
        return parseFloat((document.getElementById(id)?.value || '').replace(/,/g, '')) || 0;
    }

    function ppfFmt(n) {
        if (!n && n !== 0) return '—';
        var abs = Math.abs(n); var sign = n < 0 ? '-' : '';
        if (abs >= 1e7) return sign + '₹' + (abs/1e7).toFixed(2) + ' Cr';
        if (abs >= 1e5) return sign + '₹' + (abs/1e5).toFixed(2) + ' L';
        return sign + '₹' + Math.round(abs).toLocaleString('en-IN');
    }


    function initPPFNPS() {
        ppfCalc();
        npsCalc();
    }

    function resetPPFNPS() {
        // PPF defaults
        var ppfDefs = {'ppf-annual':'1,50,000','ppf-balance':'0','ppf-years-done':'0','ppf-rate':'7.1','ppf-extend':'0'};
        Object.entries(ppfDefs).forEach(function([id, val]) {
            var el = document.getElementById(id); if (!el) return;
            el.value = val; el.classList.add('text-slate-400');
        });
        // NPS defaults
        var npsDefs = {'nps-monthly':'5,000','nps-age':'30','nps-balance':'0','nps-return':'10','nps-annuity-rate':'6','nps-slab':'20'};
        Object.entries(npsDefs).forEach(function([id, val]) {
            var el = document.getElementById(id); if (!el) return;
            el.value = val; el.classList.add('text-slate-400');
        });
        ppfnpsTab('ppf');
        ppfCalc(); npsCalc();
        if (typeof saveUserData === 'function') saveUserData();
    }

    function ppfnpsTab(tab) {
        _ppfNpsTab = tab;
        var ppfS  = document.getElementById('ppf-section');
        var npsS  = document.getElementById('nps-section');
        var ppfR  = document.getElementById('ppf-rules-section');
        var npsR  = document.getElementById('nps-rules-section');
        var ppfT  = document.getElementById('ppf-table-section');
        var tabPPF = document.getElementById('ppfnps-tab-ppf');
        var tabNPS = document.getElementById('ppfnps-tab-nps');
        if (!ppfS) return;
        if (tab === 'ppf') {
            ppfS.classList.remove('hidden'); if (ppfR) ppfR.classList.remove('hidden'); if (ppfT) ppfT.classList.remove('hidden');
            if (npsS) npsS.classList.add('hidden'); if (npsR) npsR.classList.add('hidden');
            if (tabPPF) { tabPPF.style.background='#f0fdf4'; tabPPF.style.color='#166534'; tabPPF.style.border='2px solid #86efac'; }
            if (tabNPS) { tabNPS.style.background='#f8fafc'; tabNPS.style.color='#64748b'; tabNPS.style.border='2px solid #e2e8f0'; }
        } else {
            if (npsS) npsS.classList.remove('hidden'); if (npsR) npsR.classList.remove('hidden');
            ppfS.classList.add('hidden'); if (ppfR) ppfR.classList.add('hidden'); if (ppfT) ppfT.classList.add('hidden');
            if (tabNPS) { tabNPS.style.background='#eff6ff'; tabNPS.style.color='#1e3a5f'; tabNPS.style.border='2px solid #93c5fd'; }
            if (tabPPF) { tabPPF.style.background='#f8fafc'; tabPPF.style.color='#64748b'; tabPPF.style.border='2px solid #e2e8f0'; }
        }
    }

    function ppfPreset(annual, balance, yearsDone, rate, extend) {
        var f = {'ppf-annual': Number(annual).toLocaleString('en-IN'),
                 'ppf-balance': Number(balance).toLocaleString('en-IN'),
                 'ppf-years-done': String(yearsDone),
                 'ppf-rate': String(rate),
                 'ppf-extend': String(extend)};
        Object.entries(f).forEach(function([id, val]) {
            var el = document.getElementById(id); if (!el) return;
            el.value = val; el.classList.remove('text-slate-400');
        });
        ppfCalc();
    }

    function npsPreset(monthly, age, balance, ret, annuityRate, slab) {
        var f = {'nps-monthly': Number(monthly).toLocaleString('en-IN'),
                 'nps-age': String(age),
                 'nps-balance': Number(balance).toLocaleString('en-IN'),
                 'nps-return': String(ret),
                 'nps-annuity-rate': String(annuityRate),
                 'nps-slab': String(slab)};
        Object.entries(f).forEach(function([id, val]) {
            var el = document.getElementById(id); if (!el) return;
            el.value = val; el.classList.remove('text-slate-400');
        });
        npsCalc();
    }

    function ppfToggleTable() {
        var wrap = document.getElementById('ppf-table-wrap');
        var btn  = document.getElementById('ppf-table-btn');
        var hidden = wrap.classList.toggle('hidden');
        btn.textContent = hidden ? _t('common.show') : _t('common.hide');
    }

    function ppfCalc() {
        var annual    = ppfNum('ppf-annual');
        var balance   = ppfNum('ppf-balance');
        var yearsDone = Math.round(ppfNum('ppf-years-done')) || 0;
        var rate      = (ppfNum('ppf-rate') || 7.1) / 100;
        var extendYrs = parseInt(document.getElementById('ppf-extend')?.value || '0');

        if (!annual) return;

        // PPF: interest calculated on minimum balance between 5th and last day of month
        // Simplified: interest on opening balance + contributions, credited annually
        var totalYears = 15 + extendYrs;
        var remainYears = Math.max(0, totalYears - yearsDone);

        var corpus   = balance;
        var totalInvested = balance;
        var totalInterest = 0;
        var yearData = [];

        for (var yr = 1; yr <= remainYears; yr++) {
            var actualYear = yearsDone + yr;
            var openBal   = corpus;
            // PPF interest: on minimum balance between 5th & end of month → simplified as annual compounding
            var interest  = (openBal + annual) * rate;
            corpus = openBal + annual + interest;
            totalInvested += annual;
            totalInterest += interest;

            // Partial withdrawal: from Year 7, up to 50% of balance at end of (yr-4) or (yr-2) whichever lower
            var partialLimit = 0;
            if (actualYear >= 7 && actualYear <= 15) {
                var balYr4  = yearData.length >= 4 ? yearData[yearData.length - 4].closeBal : 0;
                var balYrN2 = yearData.length >= 2 ? yearData[yearData.length - 2].closeBal : 0;
                partialLimit = Math.round(Math.min(balYr4, balYrN2) * 0.5);
            }
            // Loan: Year 3–6, up to 25% of balance at end of (yr-2)
            var loanLimit = 0;
            if (actualYear >= 3 && actualYear <= 6) {
                var balYr2 = yearData.length >= 2 ? yearData[yearData.length - 2].closeBal : balance;
                loanLimit = Math.round(balYr2 * 0.25);
            }

            yearData.push({ year: actualYear, openBal: Math.round(openBal), contribution: Math.round(annual),
                interest: Math.round(interest), closeBal: Math.round(corpus),
                partial: partialLimit, loan: loanLimit });
        }

        var maturity = Math.round(corpus);
        var cagr = totalInvested > 0 ? (Math.pow(maturity / totalInvested, 1 / remainYears) - 1) * 100 : 0;
        var multiple = totalInvested > 0 ? (maturity / totalInvested) : 0;

        // Partial withdrawal available now (Year 7+)
        var partialNow = 0;
        if ((yearsDone + 1) >= 7 && yearData.length >= 4) {
            partialNow = Math.round(Math.min(yearData[yearData.length - 4]?.closeBal || 0,
                                             yearData[yearData.length - 2]?.closeBal || 0) * 0.5);
        }
        // Loan now (Year 3–6)
        var loanNow = 0;
        if (yearsDone >= 3 && yearsDone <= 6 && yearData.length >= 2) {
            loanNow = Math.round((yearData[yearData.length - 2]?.closeBal || 0) * 0.25);
        }

        // DOM
        document.getElementById('ppf-maturity').textContent  = ppfFmt(maturity);
        document.getElementById('ppf-interest').textContent  = ppfFmt(Math.round(totalInterest));
        document.getElementById('ppf-invested').textContent  = ppfFmt(Math.round(totalInvested));
        document.getElementById('ppf-cagr').textContent      = cagr.toFixed(1) + '%';
        document.getElementById('ppf-multiple').textContent  = multiple.toFixed(2) + 'x';
        document.getElementById('ppf-partial').textContent   = partialNow > 0 ? ppfFmt(partialNow) : 'Not yet eligible';
        document.getElementById('ppf-loan').textContent      = loanNow > 0 ? ppfFmt(loanNow) : 'Not in loan window';

        // Insight
        var ins = document.getElementById('ppf-insight');
        ins.classList.remove('hidden');
        ins.innerHTML = '<strong>💡 PPF Insight:</strong> Investing ₹' + Number(annual).toLocaleString('en-IN') +
            '/yr for <strong>' + remainYears + ' years</strong> at ' + (rate*100).toFixed(1) + '% grows to <strong>' + ppfFmt(maturity) +
            '</strong> — a <strong>' + multiple.toFixed(2) + 'x</strong> multiple on your investment. ' +
            'Interest of <strong>' + ppfFmt(Math.round(totalInterest)) + '</strong> is completely tax-free under Sec 10. ' +
            (extendYrs > 0 ? 'Extension of ' + extendYrs + ' years adds significant compounding benefit. ' : '') +
            'Annual 80C deduction: ₹' + Math.min(150000, annual).toLocaleString('en-IN') + '.';

        // Year-by-year table
        var rows = '';
        yearData.forEach(function(d, i) {
            var bg = i % 2 === 0 ? 'background:#f0fdf4;' : '';
            var highlight = d.year === 15 ? 'font-weight:900;' : '';
            rows += '<tr style="' + bg + highlight + '">' +
                '<td class="px-2 py-1 font-black text-slate-600">' + d.year + (d.year === 15 ? ' ★' : '') + '</td>' +
                '<td class="px-2 py-1 text-right text-slate-500">' + ppfFmt(d.openBal) + '</td>' +
                '<td class="px-2 py-1 text-right text-slate-600">' + ppfFmt(d.contribution) + '</td>' +
                '<td class="px-2 py-1 text-right text-emerald-700 font-bold">' + ppfFmt(d.interest) + '</td>' +
                '<td class="px-2 py-1 text-right font-black text-blue-700">' + ppfFmt(d.closeBal) + '</td>' +
                '<td class="px-2 py-1 text-right text-orange-600">' + (d.partial > 0 ? ppfFmt(d.partial) : '—') + '</td>' +
                '<td class="px-2 py-1 text-right text-sky-600">' + (d.loan > 0 ? ppfFmt(d.loan) : '—') + '</td>' +
            '</tr>';
        });
        document.getElementById('ppf-table-body').innerHTML = rows;

        if (typeof saveUserData === 'function') saveUserData();
    }

    function npsCalc() {
        var monthly     = ppfNum('nps-monthly');
        var age         = Math.round(ppfNum('nps-age')) || 30;
        var balance     = ppfNum('nps-balance');
        var returnRate  = (ppfNum('nps-return') || 10) / 100;
        var annuityRate = (ppfNum('nps-annuity-rate') || 6) / 100;
        var slab        = (parseInt(document.getElementById('nps-slab')?.value || '20')) / 100;
        var regime      = document.getElementById('nps-regime')?.value || 'new';

        if (!monthly && !balance) return;

        var retireAge   = 60;
        var years       = Math.max(0, retireAge - age);
        var monthlyRate = returnRate / 12;

        // Future value of existing balance + monthly SIP
        var corpusBalance = balance * Math.pow(1 + returnRate, years);
        var corpusSIP = monthly > 0 && monthlyRate > 0
            ? monthly * ((Math.pow(1 + monthlyRate, years * 12) - 1) / monthlyRate) * (1 + monthlyRate)
            : monthly * years * 12;
        var totalCorpus = Math.round(corpusBalance + corpusSIP);

        // Split
        var lumpsum        = Math.round(totalCorpus * 0.6);
        var annuityCorpus  = Math.round(totalCorpus * 0.4);
        var monthlyPension = Math.round((annuityCorpus * annuityRate) / 12);

        // Total invested
        var totalInvested = Math.round(balance + monthly * years * 12);

        // Tax deduction availability:
        // Old regime: 80C (up to ₹1.5L) + 80CCD(1B) (up to ₹50K) = ₹2L/yr
        // New regime: 80C and 80CCD(1B) are NOT available.
        //             Only 80CCD(2) employer contribution is allowed (handled separately).
        var annualContrib = monthly * 12;
        var annualDeduction, sec80c, sec80ccd, totalTaxSaved, regimeNote;
        if (regime === 'old') {
            sec80c          = Math.min(annualContrib, 150000);
            sec80ccd        = Math.min(Math.max(0, annualContrib - 150000), 50000);
            annualDeduction = sec80c + sec80ccd;
            totalTaxSaved   = Math.round(annualDeduction * slab * years);
            regimeNote      = '';
        } else {
            sec80c          = 0;
            sec80ccd        = 0;
            annualDeduction = 0;
            totalTaxSaved   = 0;
            regimeNote      = '<div style="margin-top:8px;padding:8px 10px;border-radius:8px;background:#fff7ed;border:1px solid #fed7aa;font-size:10px;color:#92400e;">' +
                              '<strong>⚠ New Regime:</strong> 80C and 80CCD(1B) deductions are <strong>not available</strong>. ' +
                              'Employer NPS contribution (80CCD(2), up to 10% of basic) is still deductible in both regimes. ' +
                              'Switch to Old Regime above to see the full deduction benefit.</div>';
        }

        // DOM
        document.getElementById('nps-total-corpus').textContent  = ppfFmt(totalCorpus);
        document.getElementById('nps-lumpsum').textContent       = ppfFmt(lumpsum);
        document.getElementById('nps-pension').textContent       = ppfFmt(monthlyPension) + '/mo';
        document.getElementById('nps-annuity-corpus').textContent= ppfFmt(annuityCorpus);
        document.getElementById('nps-tax-saved').textContent     = regime === 'new' ? '₹0 (New Regime)' : ppfFmt(totalTaxSaved);
        document.getElementById('nps-years').textContent         = years + ' yrs';
        document.getElementById('nps-invested').textContent      = ppfFmt(totalInvested);

        // Insight
        var ins = document.getElementById('nps-insight');
        ins.classList.remove('hidden');
        if (regime === 'old') {
            ins.innerHTML = '<strong>💡 NPS Insight:</strong> ₹' + Number(monthly).toLocaleString('en-IN') +
                '/mo for <strong>' + years + ' years</strong> at ' + (returnRate*100).toFixed(0) + '% builds a corpus of <strong>' + ppfFmt(totalCorpus) +
                '</strong>. You get <strong>' + ppfFmt(lumpsum) + ' tax-free</strong> as lumpsum and a monthly pension of <strong>' + ppfFmt(monthlyPension) +
                '</strong>. Total tax saved over career: <strong>' + ppfFmt(totalTaxSaved) + '</strong> (80C ₹' + ppfFmt(Math.round(sec80c)) +
                ' + 80CCD(1B) ₹' + ppfFmt(Math.round(sec80ccd)) + ' × ' + (slab*100).toFixed(0) + '% slab). ' +
                '<span style="color:#b45309;"><strong>⚠ Remember:</strong> Monthly annuity pension is taxable at your slab rate in retirement.</span>';
        } else {
            ins.innerHTML = '<strong>💡 NPS Insight:</strong> ₹' + Number(monthly).toLocaleString('en-IN') +
                '/mo for <strong>' + years + ' years</strong> at ' + (returnRate*100).toFixed(0) + '% builds a corpus of <strong>' + ppfFmt(totalCorpus) +
                '</strong>. You get <strong>' + ppfFmt(lumpsum) + ' tax-free</strong> as lumpsum and a monthly pension of <strong>' + ppfFmt(monthlyPension) +
                '</strong>. ' + regimeNote +
                '<span style="color:#b45309;"><strong>⚠ Remember:</strong> Monthly annuity pension is taxable at your slab rate in retirement.</span>';
        }

        if (typeof saveUserData === 'function') saveUserData();
    }
