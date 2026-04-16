    /* ══════════════════════════════════════════════════════════
       LOAN PREPAYMENT PLANNER (DEBT AVALANCHE / SNOWBALL)
    ══════════════════════════════════════════════════════════ */
    var _debtMethod = 'avalanche';
    var _debtLoans  = [];  // [{name, balance, rate, emi, id}]
    var _debtLoanId = 0;

    function debtFormat(el) {
        var raw = (el.value || '').replace(/[^0-9]/g, '');
        el.value = raw ? Number(raw).toLocaleString('en-IN') : '';
    }
    function debtNum(str) {
        return parseFloat((str || '').replace(/,/g, '')) || 0;
    }
    function debtFmt(n) {
        if (!n && n !== 0) return '—';
        var a = Math.abs(n), s = n < 0 ? '-' : '';
        if (a >= 1e7) return s + '₹' + (a/1e7).toFixed(2) + ' Cr';
        if (a >= 1e5) return s + '₹' + (a/1e5).toFixed(2) + ' L';
        return s + '₹' + Math.round(a).toLocaleString('en-IN');
    }

    function initDebtPlan() {
        if (_debtLoans.length === 0) {
            // Default: typical Indian portfolio
            debtScenario('typical');
        } else {
            debtRenderLoans();
            debtCalc();
        }
    }


    function debtScenario(name) {
        _debtLoans = [];
        _debtLoanId = 0;
        var c = document.getElementById('debt-loans-container');
        if (c) c.innerHTML = '';
        var ex = document.getElementById('debt-extra');

        if (name === 'typical') {
            if (ex) { ex.value = '5,000'; ex.classList.add('text-slate-400'); }
            debtAddLoan('Home Loan',     '35,00,000', '8.5',  '31,500');
            debtAddLoan('Car Loan',      '5,00,000',  '10',   '10,600');
            debtAddLoan('Personal Loan', '2,00,000',  '14',   '7,000');
        } else if (name === 'heavy') {
            if (ex) { ex.value = '10,000'; ex.classList.add('text-slate-400'); }
            debtAddLoan('Home Loan',     '50,00,000', '8.75', '44,000');
            debtAddLoan('Car Loan',      '7,00,000',  '10',   '14,800');
            debtAddLoan('Personal Loan', '4,00,000',  '16',   '16,000');
            debtAddLoan('Credit Card',   '80,000',    '36',   '4,000');
        } else if (name === 'cc') {
            if (ex) { ex.value = '15,000'; ex.classList.add('text-slate-400'); }
            debtAddLoan('Credit Card 1', '1,20,000', '36', '6,000');
            debtAddLoan('Credit Card 2', '60,000',   '42', '3,000');
            debtAddLoan('Personal Loan', '2,00,000', '18', '8,000');
        } else if (name === 'homeloan') {
            if (ex) { ex.value = '20,000'; ex.classList.add('text-slate-400'); }
            debtAddLoan('Home Loan', '40,00,000', '8.5', '35,500');
            debtAddLoan('Car Loan',  '6,00,000',  '10',  '12,700');
        }
    }

    function debtAddLoan(name, balance, rate, emi) {
        var id = ++_debtLoanId;
        _debtLoans.push({ id: id, name: name || '', balance: balance || '', rate: rate || '', emi: emi || '' });
        debtRenderLoans();
        debtCalc();
        if (typeof saveUserData === 'function') saveUserData();
    }

    function debtRemoveLoan(id) {
        _debtLoans = _debtLoans.filter(function(l) { return l.id !== id; });
        debtRenderLoans();
        debtCalc();
        if (typeof saveUserData === 'function') saveUserData();
    }

    function debtUpdateLoan(id, field, val) {
        var loan = _debtLoans.find(function(l) { return l.id === id; });
        if (loan) { loan[field] = val; }
        debtCalc();
        if (typeof saveUserData === 'function') saveUserData();
    }

    function debtRenderLoans() {
        var c = document.getElementById('debt-loans-container');
        if (!c) return;

        var typeColors = { 'home':'#dbeafe','car':'#dcfce7','personal':'#fef3c7','credit':'#fee2e2','education':'#f3e8ff' };

        c.innerHTML = _debtLoans.map(function(l) {
            var color = '#f8fafc';
            var lname = (l.name || '').toLowerCase();
            Object.keys(typeColors).forEach(function(k){ if(lname.indexOf(k)>=0) color=typeColors[k]; });

            // Ensure balance and EMI are formatted with Indian commas
            var rawBal = (l.balance || '').replace(/,/g,'');
            var rawEmi = (l.emi || '').replace(/,/g,'');
            var balFmt = rawBal ? Number(rawBal).toLocaleString('en-IN') : '';
            var emiFmt = rawEmi ? Number(rawEmi).toLocaleString('en-IN') : '';
            var rate   = l.rate || '';

            // Compact single-row: [Name] [₹Balance] [Rate%] [₹EMI] [✕]
            return '<div class="debt-loan-row" style="background:' + color + ';border-radius:8px;padding:5px 7px;">' +
                '<div class="flex items-center gap-1" style="min-width:0;">' +

                // Name — no grey (it's real text); no debtRenderLoans on oninput to avoid focus loss
                '<input class="debt-loan-input" style="flex:1;min-width:0;" value="' + (l.name||'') + '" placeholder="Loan name" ' +
                'oninput="debtUpdateLoan(' + l.id + ',\'name\',this.value);debtCalc();">' +

                // Balance
                '<div class="relative flex-shrink-0" style="width:90px;">' +
                '<span style="position:absolute;left:6px;top:50%;transform:translateY(-50%);font-size:10px;color:#94a3b8;font-weight:700;pointer-events:none;z-index:1;">₹</span>' +
                '<input class="debt-loan-input pl-4 text-slate-400" style="width:100%;" value="' + balFmt + '" placeholder="Balance" inputmode="numeric" ' +
                'onfocus="if(this.classList.contains(\'text-slate-400\')){this.value=\'\';this.classList.remove(\'text-slate-400\');}" ' +
                'onblur="if(!this.value){this.value=\'' + balFmt + '\';this.classList.add(\'text-slate-400\');}else{this.classList.remove(\'text-slate-400\');}" ' +
                'oninput="var r=this.value.replace(/[^0-9]/g,\'\');this.value=r?Number(r).toLocaleString(\'en-IN\'):\'\';this.classList.remove(\'text-slate-400\');debtUpdateLoan(' + l.id + ',\'balance\',this.value);">' +
                '</div>' +

                // Rate
                '<input class="debt-loan-input text-slate-400" style="width:46px;flex-shrink:0;text-align:center;" value="' + rate + '" placeholder="%" type="number" step="0.1" min="0" max="100" ' +
                'onfocus="if(this.classList.contains(\'text-slate-400\')){this.select();this.classList.remove(\'text-slate-400\');}" ' +
                'onblur="if(!this.value){this.classList.add(\'text-slate-400\');}else{this.classList.remove(\'text-slate-400\');}" ' +
                'oninput="this.classList.remove(\'text-slate-400\');debtUpdateLoan(' + l.id + ',\'rate\',this.value);">' +

                // EMI
                '<div class="relative flex-shrink-0" style="width:90px;">' +
                '<span style="position:absolute;left:6px;top:50%;transform:translateY(-50%);font-size:10px;color:#94a3b8;font-weight:700;pointer-events:none;z-index:1;">₹</span>' +
                '<input class="debt-loan-input pl-4 text-slate-400" style="width:100%;" value="' + emiFmt + '" placeholder="EMI/mo" inputmode="numeric" ' +
                'onfocus="if(this.classList.contains(\'text-slate-400\')){this.value=\'\';this.classList.remove(\'text-slate-400\');}" ' +
                'onblur="if(!this.value){this.value=\'' + emiFmt + '\';this.classList.add(\'text-slate-400\');}else{this.classList.remove(\'text-slate-400\');}" ' +
                'oninput="var r=this.value.replace(/[^0-9]/g,\'\');this.value=r?Number(r).toLocaleString(\'en-IN\'):\'\';this.classList.remove(\'text-slate-400\');debtUpdateLoan(' + l.id + ',\'emi\',this.value);">' +
                '</div>' +

                // Remove
                '<button onclick="debtRemoveLoan(' + l.id + ')" class="flex-shrink-0 text-red-400 hover:text-red-600 font-black text-sm leading-none px-0.5" title="Remove">✕</button>' +
                '</div>' +
                '</div>';
        }).join('');
    }

    function debtTab(method) {
        _debtMethod = method;
        var tabAv = document.getElementById('debt-tab-avalanche');
        var tabSn = document.getElementById('debt-tab-snowball');
        if (method === 'avalanche') {
            if (tabAv) { tabAv.style.background='#fef2f2'; tabAv.style.color='#991b1b'; tabAv.style.border='2px solid #fca5a5'; }
            if (tabSn) { tabSn.style.background='#f8fafc'; tabSn.style.color='#64748b'; tabSn.style.border='2px solid #e2e8f0'; }
        } else {
            if (tabSn) { tabSn.style.background='#eff6ff'; tabSn.style.color='#1e3a5f'; tabSn.style.border='2px solid #93c5fd'; }
            if (tabAv) { tabAv.style.background='#f8fafc'; tabAv.style.color='#64748b'; tabAv.style.border='2px solid #e2e8f0'; }
        }
        debtCalc();
    }

    function debtCalc() {
        if (_debtLoans.length === 0) return;

        var extraMonthly = debtNum(document.getElementById('debt-extra')?.value);

        // Build loan objects
        var loans = _debtLoans.map(function(l) {
            return {
                id:      l.id,
                name:    l.name || 'Loan',
                balance: debtNum(l.balance),
                rate:    parseFloat(l.rate) || 0,
                emi:     debtNum(l.emi)
            };
        }).filter(function(l) { return l.balance > 0 && l.rate > 0; });

        if (loans.length === 0) return;

        // Sort for priority display
        var sorted;
        if (_debtMethod === 'avalanche') {
            sorted = loans.slice().sort(function(a, b) { return b.rate - a.rate; });
        } else {
            sorted = loans.slice().sort(function(a, b) { return a.balance - b.balance; });
        }

        // Total debt
        var totalBal = loans.reduce(function(s, l) { return s + l.balance; }, 0);
        var totalEmi = loans.reduce(function(s, l) { return s + l.emi; }, 0);

        // Simulate payoff WITH extra prepayment
        function simulate(loanList, extra) {
            var ls = loanList.map(function(l) {
                return { name: l.name, bal: l.balance, rate: l.rate / 100 / 12, minEmi: l.emi || Math.round(l.balance * (l.rate/100/12) / (1 - Math.pow(1+l.rate/100/12, -120))) };
            });
            var months = 0, totalInt = 0;
            var MAX = 600;
            while (ls.some(function(l) { return l.bal > 0; }) && months < MAX) {
                months++;
                var leftover = extra;
                // Pay interest + minimum on all
                ls.forEach(function(l) {
                    if (l.bal <= 0) return;
                    var int = l.bal * l.rate;
                    totalInt += int;
                    var prin = Math.min(l.bal, l.minEmi - int);
                    l.bal = Math.max(0, l.bal - prin);
                });
                // Apply leftover to target (first in priority order)
                var target = ls.find(function(l) { return l.bal > 0; });
                if (target && leftover > 0) {
                    target.bal = Math.max(0, target.bal - leftover);
                }
            }
            return { months: months, interest: Math.round(totalInt) };
        }

        // Simulate without extra to get baseline
        function simulateNoExtra(loanList) {
            var ls = loanList.map(function(l) {
                return { bal: l.balance, rate: l.rate / 100 / 12, minEmi: l.emi || Math.round(l.balance * (l.rate/100/12) / (1 - Math.pow(1+l.rate/100/12, -120))) };
            });
            var months = 0, totalInt = 0, MAX = 600;
            while (ls.some(function(l) { return l.bal > 0; }) && months < MAX) {
                months++;
                ls.forEach(function(l) {
                    if (l.bal <= 0) return;
                    var int = l.bal * l.rate;
                    totalInt += int;
                    l.bal = Math.max(0, l.bal - Math.min(l.bal, l.minEmi - int));
                });
            }
            return { months: months, interest: Math.round(totalInt) };
        }

        var withExtra  = simulate(sorted, extraMonthly);
        var withoutExtra = simulateNoExtra(loans);
        var interestSaved = Math.max(0, withoutExtra.interest - withExtra.interest);

        // DOM updates
        document.getElementById('debt-total-bal').textContent       = debtFmt(totalBal);
        document.getElementById('debt-interest-saved').textContent  = debtFmt(interestSaved);
        var mo = withExtra.months;
        document.getElementById('debt-payoff-months').textContent   =
            mo >= 12 ? Math.floor(mo/12) + 'y ' + (mo%12) + 'm' : mo + ' mo';

        // Priority list
        var colors = ['#dc2626','#ea580c','#d97706','#16a34a','#0891b2','#7c3aed','#db2777'];
        var icons  = { 'avalanche': '🔥 Pay off first (highest rate)', 'snowball': '❄️ Pay off first (smallest balance)' };
        var pLabel = document.getElementById('debt-priority-label');
        if (pLabel) pLabel.textContent = _debtMethod === 'avalanche' ? '🎯 Avalanche Order (Highest Rate First)' : '🎯 Snowball Order (Smallest Balance First)';

        var list = document.getElementById('debt-priority-list');
        if (list) {
            list.innerHTML = sorted.map(function(l, i) {
                var color = colors[i % colors.length];
                var badge = i === 0 ? ' 🎯 Attack Now' : i === 1 ? ' ⏭ Next' : '';
                return '<div class="flex items-center gap-2 rounded-lg px-2.5 py-2" style="background:#f8fafc;border:1px solid #e2e8f0;">' +
                    '<div class="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black text-white flex-shrink-0" style="background:' + color + ';">' + (i+1) + '</div>' +
                    '<div class="flex-1 min-w-0">' +
                    '<div class="text-[10px] font-black text-slate-700">' + l.name + badge + '</div>' +
                    '<div class="text-[9px] text-slate-400">' + debtFmt(l.balance) + ' @ ' + l.rate + '% · EMI ' + debtFmt(l.emi) + '/mo</div>' +
                    '</div>' +
                    '<div class="text-[10px] font-black flex-shrink-0" style="color:' + color + ';">' + l.rate.toFixed(1) + '%</div>' +
                    '</div>';
            }).join('');
        }

        // Insight
        var ins = document.getElementById('debt-insight');
        if (ins) {
            ins.classList.remove('hidden');
            var topLoan = sorted[0];
            var monthsSaved = withoutExtra.months - withExtra.months;
            ins.innerHTML = '<strong>💡 Strategy:</strong> ' +
                (_debtMethod === 'avalanche'
                    ? 'Attack <strong>' + topLoan.name + '</strong> (' + topLoan.rate + '%) first — it costs you the most in interest.'
                    : 'Clear <strong>' + topLoan.name + '</strong> (' + debtFmt(topLoan.balance) + ') first — quick win builds momentum.') +
                ' With ₹' + Number(extraMonthly).toLocaleString('en-IN') + '/mo extra, you save <strong>' + debtFmt(interestSaved) + ' in interest</strong>' +
                (monthsSaved > 0 ? ' and become debt-free <strong>' + (monthsSaved >= 12 ? Math.floor(monthsSaved/12) + ' yr ' + (monthsSaved%12) + ' mo' : monthsSaved + ' months') + ' sooner</strong>.' : '.');
        }

        // ── OPPORTUNITY COST: Prepay vs Invest in Equity ───────────────────
        var oppCard = document.getElementById('debt-opp-card');
        if (oppCard && extraMonthly > 0) {
            var N  = withExtra.months;
            var r  = 0.01; // 12% p.a. → 1% per month
            var equityFV   = Math.round(extraMonthly * ((Math.pow(1 + r, N) - 1) / r) * (1 + r));
            var maxRate    = Math.max.apply(null, loans.map(function(l) { return l.rate; }));
            var prepayWins = maxRate >= 12;
            var vColor     = prepayWins ? '#166534' : '#92400e';
            var verdict    = prepayWins
                ? 'Prepay first. Your highest loan (' + maxRate.toFixed(1) + '% p.a.) costs more than equity\'s post-tax return (~9–10% after LTCG & fees). Prepaying is a guaranteed, risk-free saving.'
                : 'Consider splitting — but read the caveats below before deciding. Your highest rate (' + maxRate.toFixed(1) + '%) looks below equity\'s ~12% gross, but post-tax equity returns are realistically 9–10%. If this is a <strong>home loan</strong>, the ₹2L interest deduction (old regime) may reduce its effective rate further — making prepayment even less urgent. Consult your CA.';
            oppCard.classList.remove('hidden');
            oppCard.innerHTML =
                '<div class="text-[10px] font-black uppercase tracking-wider mb-2" style="color:#57534e;">⚖️ Prepay vs Invest — What does ₹' + Number(extraMonthly).toLocaleString('en-IN') + '/mo extra do?</div>' +
                '<div class="grid grid-cols-2 gap-2 mb-2">' +
                    '<div class="rounded-lg p-2 text-center" style="background:#fef2f2;border:1px solid #fca5a5;">' +
                        '<div class="text-[9px] font-bold text-red-600">Interest Saved (Prepay)</div>' +
                        '<div class="text-sm font-black text-red-700">' + debtFmt(interestSaved) + '</div>' +
                        '<div class="text-[9px] text-red-400">Guaranteed · Tax-free saving</div>' +
                    '</div>' +
                    '<div class="rounded-lg p-2 text-center" style="background:#f0fdf4;border:1px solid #86efac;">' +
                        '<div class="text-[9px] font-bold text-emerald-600">Equity Corpus (Invest instead)</div>' +
                        '<div class="text-sm font-black text-emerald-700">' + debtFmt(equityFV) + '</div>' +
                        '<div class="text-[9px] text-emerald-400">At 12% p.a. gross · ~9–10% post-LTCG & fees · Not guaranteed</div>' +
                    '</div>' +
                '</div>' +
                '<div class="text-[10px] font-semibold leading-snug rounded-lg px-2.5 py-1.5 mb-1.5" style="background:' + vColor + '18;color:' + vColor + ';border:1px solid ' + vColor + '30;">' + verdict + '</div>' +
                '<div class="text-[9px] leading-relaxed mt-1 rounded-lg px-2.5 py-1.5" style="color:#78716c;background:#fafaf9;border:1px solid #e7e5e4;">⚠️ Equity figure assumes 12% p.a. gross (Nifty 50 historical avg). After 10% LTCG tax on gains above ₹1L and fund expense ratios, realistic post-tax returns are <strong>9–10% p.a.</strong> — narrowing the gap with debt repayment. <strong>Home loan:</strong> interest up to ₹2L/yr is deductible u/s 24(b) under the old tax regime, reducing effective loan cost — e.g., an 8.5% loan becomes ~5.95% for a 30% bracket taxpayer. <strong>Consult your CA before deciding to prepay or invest.</strong></div>';
        } else if (oppCard) {
            oppCard.classList.add('hidden');
        }

        if (typeof saveUserData === 'function') saveUserData();
    }
