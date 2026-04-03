    // =====================================================================
    //  CIBIL SCORE EDUCATION & IMPROVEMENT TRACKER
    // =====================================================================

    function cibilFmtMoney(el) {
        var raw = el.value.replace(/[^0-9]/g, '');
        if (!raw) return;
        var n = parseInt(raw, 10);
        var s = Math.round(n).toString();
        if (s.length <= 3) { el.value = s; }
        else {
            var last3 = s.slice(-3);
            var rest  = s.slice(0, -3);
            el.value  = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + last3;
        }
        el.classList.remove('text-slate-400');
    }

    function _cibilComma(n) {
        if (isNaN(n)) return '0';
        var s = Math.round(n).toString();
        if (s.length <= 3) return s;
        var last3 = s.slice(-3), rest = s.slice(0, -3);
        return rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + last3;
    }

    function _cibilInr(n) {
        if (n >= 1e7) return '₹' + (n / 1e7).toFixed(2) + ' Cr';
        if (n >= 1e5) return '₹' + (n / 1e5).toFixed(2) + ' L';
        return '₹' + _cibilComma(Math.round(n));
    }

    // Approximate home-loan interest rate lookup by score band
    function _cibilRate(score) {
        if (score >= 800) return 8.40;
        if (score >= 775) return 8.55;
        if (score >= 750) return 8.70;
        if (score >= 725) return 9.00;
        if (score >= 700) return 9.35;
        if (score >= 675) return 9.75;
        if (score >= 650) return 10.25;
        if (score >= 625) return 10.90;
        if (score >= 600) return 11.50;
        return 12.50; // below 600 — high risk / likely rejected
    }

    function _cibilEMI(principal, annualRate, tenureYears) {
        var r  = annualRate / 12 / 100;
        var n  = tenureYears * 12;
        if (r === 0) return principal / n;
        return principal * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1);
    }

    function _cibilGrade(score) {
        if (score >= 800) return { label: 'Excellent 🌟', color: '#059669' };
        if (score >= 750) return { label: 'Great 😊',     color: '#10b981' };
        if (score >= 700) return { label: 'Good 🙂',      color: '#eab308' };
        if (score >= 650) return { label: 'Fair 😐',      color: '#f59e0b' };
        if (score >= 600) return { label: 'Poor 😟',      color: '#ef4444' };
        return { label: 'Very Poor 😰', color: '#b91c1c' };
    }

    function cibilCalc() {
        var score    = parseInt(document.getElementById('cibil-score').value)      || 720;
        var util     = parseFloat(document.getElementById('cibil-util').value)     || 35;
        var missed   = parseInt(document.getElementById('cibil-missed').value)     || 0;
        var age      = parseFloat(document.getElementById('cibil-age').value)      || 4;
        var cards    = parseInt(document.getElementById('cibil-cards').value)      || 2;
        var enq      = parseInt(document.getElementById('cibil-enquiries').value)  || 1;
        var loanAmt  = parseFloat((document.getElementById('cibil-loan-amt').value || '5000000').replace(/[^0-9]/g, '')) || 5000000;
        var tenure   = parseInt(document.getElementById('cibil-loan-tenure').value) || 20;

        score = Math.min(900, Math.max(300, score));

        // Score display + gauge
        var grade = _cibilGrade(score);
        document.getElementById('cibil-score-display').textContent = score;
        var gradeEl = document.getElementById('cibil-grade-label');
        gradeEl.textContent = grade.label;
        gradeEl.style.color = grade.color;
        var gaugeW = Math.round(((score - 300) / 600) * 100);
        var gaugeEl = document.getElementById('cibil-gauge-fill');
        if (gaugeEl) { gaugeEl.style.width = gaugeW + '%'; gaugeEl.style.background = 'linear-gradient(90deg,' + grade.color + '88,' + grade.color + ')'; }

        // Rates & EMI
        var myRate   = _cibilRate(score);
        var bestRate = 8.40;
        var myEMI    = _cibilEMI(loanAmt, myRate, tenure);
        var bestEMI  = _cibilEMI(loanAmt, bestRate, tenure);
        var emiSave  = myEMI - bestEMI;
        var totalIntMine = myEMI  * tenure * 12 - loanAmt;
        var totalIntBest = bestEMI * tenure * 12 - loanAmt;
        var totalSaved   = totalIntMine - totalIntBest;

        document.getElementById('cibil-rate-display').textContent = myRate.toFixed(2) + '%';
        document.getElementById('cibil-emi-save').textContent     = score >= 750 ? '₹0 (best rate!)' : (_cibilInr(emiSave) + '/mo');
        document.getElementById('cibil-total-saved').textContent  = score >= 750 ? '₹0 — you already have the best rate!' : _cibilInr(Math.max(0, totalSaved));

        // Factor bars
        var utilScore  = util <= 10 ? 100 : util <= 30 ? 80 : util <= 50 ? 55 : util <= 75 ? 30 : 10;
        var payScore   = missed === 0 ? 100 : missed === 1 ? 50 : missed <= 3 ? 25 : 5;
        var ageScore   = age >= 7 ? 100 : age >= 5 ? 80 : age >= 3 ? 55 : age >= 1 ? 30 : 10;
        var enqScore   = enq === 0 ? 100 : enq === 1 ? 80 : enq <= 3 ? 55 : enq <= 5 ? 30 : 10;
        var mixScore   = cards >= 1 && cards <= 4 ? 85 : cards === 0 ? 40 : 65;

        var factors = [
            { label: 'Payment History (35%)',   pct: payScore,  color: '#10b981', tip: missed > 0 ? 'Missed EMIs are the #1 score killer — set auto-pay immediately.' : 'Perfect — keep it up!' },
            { label: 'Credit Utilisation (30%)', pct: utilScore, color: '#3b82f6', tip: util > 30 ? 'Reduce to below 30%. Quick fix: request a credit limit increase or pay twice/month.' : util > 10 ? 'Good — aim for below 10% for an extra boost.' : 'Excellent — below 10% is the sweet spot.' },
            { label: 'Credit Age (15%)',         pct: ageScore,  color: '#eab308', tip: age < 3 ? 'Young history — time heals this. Never close old accounts.' : 'Healthy age — avoid closing old accounts.' },
            { label: 'New Enquiries (10%)',      pct: enqScore,  color: '#f97316', tip: enq > 3 ? 'Too many applications signal desperation. Pause new applications for 6 months.' : enq <= 1 ? 'Good — space out applications by 6+ months.' : 'Moderate — avoid new applications for 3 months.' },
            { label: 'Credit Mix (10%)',         pct: mixScore,  color: '#8b5cf6', tip: cards === 0 ? 'No credit card — a secured card or credit-builder loan helps.' : cards > 4 ? 'Too many cards can hurt. Consolidate and close newest ones.' : 'Good mix — maintain responsibly.' },
        ];

        var factorsHtml = '';
        factors.forEach(function(f) {
            factorsHtml += '<div>' +
                '<div class="flex justify-between items-center mb-0.5">' +
                '<span class="text-[10px] font-bold text-slate-700">' + f.label + '</span>' +
                '<span class="text-[10px] font-black" style="color:' + f.color + '">' + f.pct + '/100</span>' +
                '</div>' +
                '<div class="h-2 rounded-full bg-slate-100">' +
                '<div class="h-full rounded-full transition-all duration-700" style="width:' + f.pct + '%;background:' + f.color + ';"></div>' +
                '</div>' +
                '<div class="text-[9px] text-slate-500 mt-0.5">' + f.tip + '</div>' +
                '</div>';
        });
        document.getElementById('cibil-factors').innerHTML = factorsHtml;

        // 90-day action plan
        var actions = [];
        if (missed > 0)   actions.push({ week: 'Week 1', icon: '🔴', text: 'Set auto-pay for ALL EMIs & credit card bills today. One missed payment can cost 80–100 points.', urgent: true });
        if (util > 30)    actions.push({ week: 'Week 1–2', icon: '🔵', text: 'Pay down credit card balance to below 30% of limit. If balance is ₹' + _cibilComma(Math.round(loanAmt * 0.001)) + ', your target is ₹' + _cibilComma(Math.round(loanAmt * 0.0003)) + '.', urgent: util > 60 });
        if (enq > 3)      actions.push({ week: 'Week 2', icon: '🟠', text: 'Stop all new loan/card applications for at least 6 months. Each hard enquiry drops score by 5–10 points.', urgent: true });
        if (age < 3)      actions.push({ week: 'Month 1', icon: '🟡', text: 'Never close your oldest credit card — even if unused. Keep it active with 1 small purchase/month.', urgent: false });
        if (cards === 0)  actions.push({ week: 'Month 1', icon: '🟣', text: 'Apply for 1 secured credit card (against FD). Use it for ≤10% of limit and pay in full each month.', urgent: false });
        if (util <= 30 && missed === 0 && enq <= 2) actions.push({ week: 'Month 2', icon: '✅', text: 'Request credit limit increase from your card issuer — this reduces utilisation ratio without extra spending.', urgent: false });
        actions.push({ week: 'Month 3', icon: '📋', text: 'Pull your free CIBIL report and dispute any errors at cibil.com/dispute. Errors corrected = instant score boost.', urgent: false });
        if (score >= 750) actions.push({ week: 'Now', icon: '🎯', text: 'Your score is excellent! Apply for your home loan now to lock the best interest rate (≈' + bestRate.toFixed(2) + '%).', urgent: false });

        var planHtml = '';
        actions.forEach(function(a) {
            planHtml += '<div class="flex gap-2 items-start rounded-xl p-2" style="background:' + (a.urgent ? '#fef2f2' : '#f8fafc') + ';border:1px solid ' + (a.urgent ? '#fecaca' : '#e2e8f0') + ';">' +
                '<span class="text-sm flex-shrink-0">' + a.icon + '</span>' +
                '<div><div class="text-[9px] font-black text-slate-400 uppercase">' + a.week + '</div>' +
                '<div class="text-[10px] text-slate-700 leading-relaxed">' + a.text + '</div></div></div>';
        });
        document.getElementById('cibil-action-plan').innerHTML = planHtml;

        // Improvement timeline
        var timelineItems = [];
        if (score < 750) {
            var projected30  = Math.min(900, score + (util > 30 ? 25 : 10));
            var projected90  = Math.min(900, score + (util > 30 ? 50 : 20) + (missed === 0 ? 10 : 0));
            var projected180 = Math.min(900, score + (util > 30 ? 70 : 30) + (enq > 2 ? 15 : 5));
            timelineItems = [
                { period: '30 days',  score: projected30,  action: 'Pay down utilisation + auto-pay setup' },
                { period: '90 days',  score: projected90,  action: 'Consistent payments + enquiry freeze' },
                { period: '6 months', score: projected180, action: 'Clean history building + dispute errors' },
            ];
        } else {
            timelineItems = [{ period: 'Now', score: score, action: '🎯 You\'re in the best rate band! Apply for credit now.' }];
        }
        var tlHtml = '';
        timelineItems.forEach(function(t) {
            var tGrade = _cibilGrade(t.score);
            tlHtml += '<div class="flex items-center gap-2">' +
                '<div class="text-[9px] font-black text-slate-400 w-16 flex-shrink-0">' + t.period + '</div>' +
                '<div class="h-2 flex-1 rounded-full bg-slate-100">' +
                '<div class="h-full rounded-full" style="width:' + Math.round(((t.score-300)/600)*100) + '%;background:' + tGrade.color + ';transition:width .7s;"></div></div>' +
                '<div class="text-[10px] font-black w-10 flex-shrink-0" style="color:' + tGrade.color + '">' + t.score + '</div>' +
                '</div>' +
                '<div class="text-[9px] text-slate-400 ml-18 mb-1 pl-16">' + t.action + '</div>';
        });
        document.getElementById('cibil-timeline').innerHTML = tlHtml;

        // Score band comparison table
        var bands = [
            { range: '800–900', grade: 'Excellent', rate: 8.40 },
            { range: '775–799', grade: 'Excellent', rate: 8.55 },
            { range: '750–774', grade: 'Great',     rate: 8.70 },
            { range: '725–749', grade: 'Good',      rate: 9.00 },
            { range: '700–724', grade: 'Good',      rate: 9.35 },
            { range: '650–699', grade: 'Fair',      rate: 10.25 },
            { range: '600–649', grade: 'Poor',      rate: 11.50 },
            { range: '<600',    grade: 'Very Poor', rate: 12.50 },
        ];
        var bestBandEMI  = _cibilEMI(loanAmt, 8.40, tenure);
        var bestBandInt  = bestBandEMI * tenure * 12 - loanAmt;
        var tblHtml = '';
        bands.forEach(function(b) {
            var bEMI = _cibilEMI(loanAmt, b.rate, tenure);
            var bInt = bEMI * tenure * 12 - loanAmt;
            var diff = bInt - bestBandInt;
            var isYours = myRate === b.rate;
            var rowBg   = isYours ? 'background:#fef3c7;' : '';
            tblHtml += '<tr style="' + rowBg + 'border-bottom:1px solid #f1f5f9;">' +
                '<td class="py-1.5 font-bold ' + (isYours ? 'text-amber-800' : 'text-slate-700') + '">' + b.range + (isYours ? ' ← You' : '') + '</td>' +
                '<td class="py-1.5 text-slate-600">' + b.grade + '</td>' +
                '<td class="py-1.5 font-bold text-slate-800">' + b.rate.toFixed(2) + '%</td>' +
                '<td class="py-1.5 font-bold text-slate-800">₹' + _cibilComma(Math.round(bEMI)) + '</td>' +
                '<td class="py-1.5 text-slate-700">' + _cibilInr(bInt) + '</td>' +
                '<td class="py-1.5 font-bold ' + (diff > 0 ? 'text-red-600' : 'text-emerald-600') + '">' + (diff > 0 ? '+' + _cibilInr(diff) : '—') + '</td>' +
                '</tr>';
        });
        document.getElementById('cibil-table-body').innerHTML = tblHtml;

        // Insight
        var insightEl = document.getElementById('cibil-insight');
        var insightMsg = '';
        if (score >= 800) insightMsg = '🌟 <strong>Elite status.</strong> You\'ll get the absolute best rates. No lender can turn you down. Apply with confidence — and check for pre-approved offers from your bank.';
        else if (score >= 750) insightMsg = '😊 <strong>Great score!</strong> You qualify for the best home loan rates (~8.4–8.7%). Even a small improvement toward 800 won\'t change your rate much — focus on maintaining rather than chasing.';
        else if (score >= 700) insightMsg = '🙂 <strong>Good, but improvable.</strong> At ' + score + ', you\'re paying ~' + myRate + '% vs ' + bestRate + '% possible — that\'s ' + _cibilInr(totalSaved) + ' extra over ' + tenure + ' years. Focus on utilisation and payments for 90 days.';
        else if (score >= 650) insightMsg = '😐 <strong>Fair — action needed.</strong> Lenders see you as moderate risk. Reducing utilisation below 30% and 6 months of clean payments can lift you 40–60 points. Wait 90 days before applying for a major loan.';
        else insightMsg = '😟 <strong>Poor — delay major loan applications.</strong> Most banks will reject or charge 11%+ rates. Spend 6–12 months on: zero missed payments, reduce credit card balance, freeze new applications. Your score CAN recover fully.';
        insightEl.innerHTML = insightMsg;
        if (typeof saveUserData === 'function') saveUserData();
    }

    function initCibil() { cibilCalc(); }

    // =====================================================================
    //  FINANCIAL CALENDAR & SMART REMINDERS
    // =====================================================================

    var _fcActiveFilter = 'all';
    var _fcViewMonth    = null; // Date object for current calendar month view

    function fcFmt(el) {
        var raw = el.value.replace(/[^0-9]/g, '');
        if (!raw) return;
        var n = parseInt(raw, 10);
        var s = Math.round(n).toString();
        if (s.length <= 3) { el.value = s; return; }
        var last3 = s.slice(-3), rest = s.slice(0, -3);
        el.value = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + last3;
        el.classList.remove('text-slate-400');
    }

    // Build all events for current FY (Apr–Mar) + next 12 months
    function _fcBuildEvents() {
        var today   = new Date();
        var regime  = (document.getElementById('fc-regime')?.value) || 'new';
        var hasPPF  = (document.getElementById('fc-ppf')?.value)   === 'yes';
        var hasELSS = (document.getElementById('fc-elss')?.value)  === 'yes';
        var hasSGB  = (document.getElementById('fc-sgb')?.value)   === 'yes';
        var hasEPF  = (document.getElementById('fc-epf')?.value)   === 'yes';
        var ccDay   = parseInt(document.getElementById('fc-cc-date')?.value) || 5;
        var incomeRaw = (document.getElementById('fc-income')?.value || '1200000').replace(/[^0-9]/g,'');
        var income  = parseInt(incomeRaw) || 1200000;

        // Current financial year: Apr 1 of this or last year
        var fyStart = today.getMonth() >= 3
            ? new Date(today.getFullYear(), 3, 1)
            : new Date(today.getFullYear() - 1, 3, 1);
        var fyEnd   = new Date(fyStart.getFullYear() + 1, 2, 31);
        var fy      = fyStart.getFullYear(); // e.g. 2025 for FY2025-26

        var events = [];

        function addEv(dateArr, title, desc, cat, icon, penalty) {
            // dateArr: [year, month0based, day]
            var d = new Date(dateArr[0], dateArr[1], dateArr[2]);
            events.push({ date: d, title: title, desc: desc, cat: cat, icon: icon, penalty: penalty || '' });
        }

        // ── TAX EVENTS ──────────────────────────────────────────────────
        // Advance Tax (only if income > 10L or business income)
        if (income > 500000) {
            addEv([fy,5,15],  '🟡 Advance Tax — 1st Instalment (15%)',
                'Pay 15% of estimated annual tax. Miss this → 1% interest/month under Sec 234C.',
                'tax','💸','1% interest/month on shortfall (Sec 234C)');
            addEv([fy,8,15],  '🟠 Advance Tax — 2nd Instalment (45%)',
                'Cumulative 45% of estimated tax due. Common cause of surprise penalties in December.',
                'tax','💸','1% interest/month on shortfall');
            addEv([fy,11,15], '🔴 Advance Tax — 3rd Instalment (75%)',
                'Cumulative 75% of estimated tax due. Most salaried people forget this one.',
                'tax','💸','1% interest/month on shortfall');
            addEv([fy+1,2,15],'🔴 Advance Tax — 4th Instalment (100%)',
                'Final 100% advance tax due. After this any shortfall attracts Sec 234B interest.',
                'tax','💸','1% interest/month under Sec 234B');
        }

        // ITR Deadlines
        addEv([fy+1,6,31], '📋 ITR Filing Deadline — Salaried (Jul 31)',
            'File your income tax return for FY' + fy + '-' + (fy-1999) + '. Late filing fee: ₹1,000–₹5,000 + 1% interest/month. Losses cannot be carried forward if filed late.',
            'tax','📋','₹5,000 late fee + 1% interest/month (Sec 234A)');
        addEv([fy+1,9,31], '⚠️ Belated ITR Deadline (Oct 31)',
            'Last date for belated or revised ITR. After this, you cannot file for FY' + fy + '-' + (fy-1999) + ' at all.',
            'tax','⚠️','₹5,000 penalty + cannot file after this');
        addEv([fy+1,11,31],'🔴 Final Belated Return — Dec 31',
            'Absolute last chance to file a belated return for FY' + fy + '-' + (fy-1999) + '. Miss this and you permanently lose the ability to file.',
            'tax','🚨','Permanently cannot file — all refunds forfeited');

        // Form 16 receipt
        addEv([fy+1,5,15], '📄 Form 16 Due from Employer',
            'Your employer must issue Form 16 by June 15. If you haven\'t received it, follow up immediately — you need it to file ITR accurately.',
            'tax','📄','');

        // TDS refund check
        addEv([fy+1,7,15], '💰 Check TDS Refund Status',
            'If excess TDS was deducted, track your refund status on incometax.gov.in. Most refunds arrive within 4–6 weeks of ITR processing.',
            'tax','💰','');

        // ── INVESTMENT EVENTS ────────────────────────────────────────────
        if (hasPPF) {
            // PPF: deposit before 5th of each month for interest. Special: April 5
            addEv([fy,3,4],   '🏛️ PPF April 5 Deadline',
                'Deposit before April 5 to earn interest on the FULL amount for April. Depositing on Apr 6 means you lose one month of 7.1% interest on up to ₹1.5L.',
                'invest','🏛️','Lose 1 month interest on ₹1.5L = ~₹888');
            addEv([fy,2,31],  '🏛️ PPF Annual Maximum — March 31',
                'Invest up to ₹1.5L in PPF before March 31 to claim 80C deduction and maximise EEE tax-free corpus.',
                'invest','🏛️','Miss 80C deduction: ₹4,500–₹45,000 tax lost (5%–30% slab)');
            // Monthly PPF reminder (5th of each month)
            for (var m = 0; m < 12; m++) {
                var evDate = new Date(fy, m + 3, 4);
                if (evDate >= fyStart && evDate <= new Date(fyEnd.getFullYear(), fyEnd.getMonth() + 3, 0)) {
                    if (m === 0) continue; // Already added April 5 above
                    addEv([evDate.getFullYear(), evDate.getMonth(), 4],
                        '🏛️ PPF Monthly Contribution (before 5th)',
                        'Deposit this month\'s PPF contribution before the 5th to earn interest for this month.',
                        'invest','🏛️','');
                }
            }
        }

        if (hasELSS && regime === 'old') {
            addEv([fy+1,0,15], '📈 ELSS — Invest by January 15',
                'Invest in ELSS before Jan 15 to avoid the March server crash. Units allotted in Jan count for this FY\'s 80C. Don\'t wait till March — mutual fund sites crash.',
                'invest','📈','Miss 80C: ₹4,500–₹45,000 tax lost');
            addEv([fy+1,1,28], '📈 ELSS — Final Warning (Feb 28)',
                'ELSS investments made in March often fail due to server overload. This is your last safe date to invest for this FY\'s 80C.',
                'invest','📈','Server failure risk → units not allotted in time');
            addEv([fy+1,2,28], '⚠️ ELSS Last Date — March 28 (risky)',
                'Technically March 31 is the deadline but MF servers crash. Only invest today if absolutely necessary. 3-year lock-in from allotment date.',
                'invest','⚠️','Units may not be allotted before Mar 31 due to server overload');
        }

        if (hasSGB) {
            // SGB windows typically open 4–6 times/year. Use approximate typical dates.
            addEv([fy,4,22],  '🥇 SGB Window — Check RBI Notification',
                'Sovereign Gold Bond subscription windows open periodically. Check RBI website for exact dates. SGB earns 2.5% p.a. interest + gold price appreciation. No making charges.',
                'invest','🥇','Miss window → wait 2–3 months for next');
            addEv([fy,7,19],  '🥇 SGB Window — Check RBI Notification',
                'Check RBI notification for Sovereign Gold Bond subscription. Lock in gold price today. 8-year tenure, premature exit after 5 years.',
                'invest','🥇','');
            addEv([fy,10,18], '🥇 SGB Window — Check RBI Notification',
                'SGB series typically available in Q3. Issue price set by RBI based on average gold price. ₹50/gram discount on digital payments.',
                'invest','🥇','');
            addEv([fy+1,1,16],'🥇 SGB Window — Check RBI Notification',
                'Q4 SGB series. Final opportunity this financial year. Check rbi.org.in for exact subscription dates.',
                'invest','🥇','');
        }

        // NPS — March 31 (always relevant for salaried)
        addEv([fy+1,2,31], '🏛️ NPS — 80CCD(1B) Contribution by March 31',
            'Additional ₹50,000 NPS deduction under 80CCD(1B) over and above 80C limit. Under old regime this saves ₹5,000–₹15,000 in tax.',
            'invest','🏛️', regime === 'old' ? '₹5,000–₹15,000 tax saving forfeited' : 'Check if applicable under your regime');

        // ── CREDIT CARD EVENTS ──────────────────────────────────────────
        var dueDayCC = ccDay + 20 > 28 ? (ccDay + 20 - 28) : ccDay + 20;
        // Add monthly for next 3 months
        for (var cm = 0; cm < 3; cm++) {
            var stmtMo = new Date(today.getFullYear(), today.getMonth() + cm, ccDay);
            var dueDate = new Date(today.getFullYear(), today.getMonth() + cm, dueDayCC);
            addEv([stmtMo.getFullYear(), stmtMo.getMonth(), ccDay],
                '💳 Credit Card Statement Generated',
                'Your statement is generated today. Log in and check for any fraudulent charges or billing errors. Dispute window: 30 days.',
                'credit','💳','');
            addEv([dueDate.getFullYear(), dueDate.getMonth(), dueDayCC],
                '🔴 Credit Card Payment Due',
                'Pay the FULL statement amount to avoid 36–42% p.a. interest. Even paying ₹1 short triggers interest on the entire balance. Set auto-pay today.',
                'credit','🔴','36–42% p.a. interest on entire balance if not paid in full');
        }

        // ── EPF EVENTS ──────────────────────────────────────────────────
        if (hasEPF) {
            addEv([fy,3,30],  '🏢 EPF — Update Nomination (April 30)',
                'Update/verify your EPF e-Nomination at epfindia.gov.in. Without active nomination, your family cannot claim EPF corpus easily.',
                'epf','🏢','Family faces 6–12 months of paperwork without nomination');
            addEv([fy,5,30],  '🏢 Check EPF Passbook — Annual Statement',
                'Download your EPF passbook from epfindia.gov.in. Verify employer contributions, interest credited, and any discrepancies. Raises must be reported within 2 years.',
                'epf','🏢','Undetected errors go unresolved after 2 years');
            addEv([fy,11,31], '🏢 EPF Interest Credited — Dec 31',
                'EPF interest (currently 8.25% p.a.) is credited by December 31 for the previous financial year. Check your passbook to confirm.',
                'epf','🏢','');
            addEv([fy+1,2,31],'🏢 EPF VPF — Last Date for FY Contribution',
                'Voluntary Provident Fund contributions above 12% are tax-deductible under 80C. Increase VPF via your employer before March 31.',
                'epf','🏢','');
        }

        // ── GENERAL COMPLIANCE ───────────────────────────────────────────
        addEv([fy+1,2,31], '📋 80C Investments — Final Date (March 31)',
            'Last date for all 80C investments (PPF, ELSS, LIC premium, NSC, tuition fees, home loan principal). Maximum deduction ₹1.5L under old regime.',
            'tax','📋', regime === 'old' ? 'Miss: ₹4,500–₹45,000 tax lost' : 'Not applicable under new regime');
        addEv([fy,8,30],   '📑 HRA Claim — Collect Rent Receipts',
            'If you claim HRA, collect rent receipts from your landlord for Apr–Sep. Keep rent agreement handy. Landlord PAN required if rent > ₹1L/year.',
            'tax','📑','');
        addEv([fy,11,31],  '📑 HRA Claim — Collect Rent Receipts (Oct–Mar)',
            'Collect rent receipts for Oct–Mar. Submit to employer before February to ensure TDS is adjusted.',
            'tax','📑','');
        addEv([fy+1,0,31], '📊 Investment Declarations to Employer (Jan 31)',
            'Submit final investment proof to your employer for TDS calculation. Include all 80C investments, HRA proofs, home loan certificate.',
            'tax','📊','Excess TDS deducted if not submitted; claim refund in ITR');
        addEv([fy,8,15],   '🔒 Free Annual Credit Report Check',
            'Check your free CIBIL report at cibil.com (1 free per year per bureau). Also check Experian, Equifax. Errors corrected = instant score boost.',
            'credit','🔒','');

        // Sort by date
        events.sort(function(a, b) { return a.date - b.date; });
        return events;
    }

    function _fcDaysFromNow(d) {
        var today = new Date(); today.setHours(0,0,0,0);
        var t = new Date(d); t.setHours(0,0,0,0);
        return Math.round((t - today) / 86400000);
    }

    function finCalRender() {
        var events  = _fcBuildEvents();
        var today   = new Date(); today.setHours(0,0,0,0);
        var filter  = _fcActiveFilter;

        // Count buckets
        var critical = 0, soon = 0, upcoming = 0;
        var nextEv   = null;
        events.forEach(function(ev) {
            var diff = _fcDaysFromNow(ev.date);
            if (diff < 0) return;
            if (diff <= 7)           critical++;
            else if (diff <= 30)     soon++;
            else if (diff <= 90)     upcoming++;
            if (!nextEv && diff >= 0) nextEv = ev;
        });
        document.getElementById('fc-count-critical').textContent = critical;
        document.getElementById('fc-count-soon').textContent     = soon;
        document.getElementById('fc-count-upcoming').textContent = upcoming;

        // Next banner
        if (nextEv) {
            var diff0 = _fcDaysFromNow(nextEv.date);
            document.getElementById('fc-next-icon').textContent  = nextEv.icon;
            document.getElementById('fc-next-title').textContent = nextEv.title;
            document.getElementById('fc-next-days').textContent  = diff0 === 0 ? 'TODAY' : diff0;
            var banEl = document.getElementById('fc-next-banner');
            if (diff0 <= 7)  banEl.style.background = 'linear-gradient(90deg,#7f1d1d,#991b1b)';
            else if (diff0 <= 30) banEl.style.background = 'linear-gradient(90deg,#78350f,#92400e)';
            else banEl.style.background = 'linear-gradient(90deg,#064e3b,#065f46)';
        }

        // Events list
        var catColors = { tax:'#ef4444', invest:'#f59e0b', credit:'#3b82f6', epf:'#8b5cf6', general:'#10b981' };
        var html = '';
        var shown = 0;
        events.forEach(function(ev) {
            if (filter !== 'all' && ev.cat !== filter) return;
            var diff = _fcDaysFromNow(ev.date);
            var urgBg, urgText, diffLabel;
            if (diff < 0)       { urgBg='#f8fafc'; urgText='#94a3b8'; diffLabel = Math.abs(diff) + 'd ago'; }
            else if (diff === 0){ urgBg='#fef2f2'; urgText='#b91c1c'; diffLabel = 'TODAY'; }
            else if (diff <= 7) { urgBg='#fef2f2'; urgText='#dc2626'; diffLabel = diff + 'd'; }
            else if (diff <= 30){ urgBg='#fffbeb'; urgText='#b45309'; diffLabel = diff + 'd'; }
            else                { urgBg='#f8fafc'; urgText='#475569'; diffLabel = diff + 'd'; }
            var dot = catColors[ev.cat] || '#10b981';
            var dateStr = ev.date.toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' });
            html += '<div class="flex items-start gap-2 rounded-xl px-2.5 py-2" style="background:' + urgBg + ';border:1px solid ' + (diff <= 7 && diff >= 0 ? '#fecaca' : '#e2e8f0') + ';">' +
                '<div class="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style="background:' + dot + ';"></div>' +
                '<div class="flex-1 min-w-0">' +
                '<div class="flex items-start justify-between gap-2">' +
                '<div class="text-[10px] font-black text-slate-800 leading-snug">' + ev.title + '</div>' +
                '<div class="text-[9px] font-black flex-shrink-0 px-1.5 py-0.5 rounded-md" style="color:' + urgText + ';background:' + urgBg + ';">' + diffLabel + '</div>' +
                '</div>' +
                '<div class="text-[9px] text-slate-500 mt-0.5">' + dateStr + ' · ' + ev.desc.slice(0,90) + (ev.desc.length > 90 ? '…' : '') + '</div>' +
                (ev.penalty ? '<div class="text-[8px] font-bold mt-0.5" style="color:#dc2626;">⚠️ ' + ev.penalty + '</div>' : '') +
                '</div></div>';
            shown++;
        });
        if (shown === 0) html = '<div class="text-[10px] text-slate-400 text-center py-4">No events for this filter.</div>';
        document.getElementById('fc-events-list').innerHTML = html;

        // Render calendar
        _fcRenderCalendar(events);
        if (typeof saveUserData === 'function') saveUserData();
    }

    function _fcRenderCalendar(events) {
        if (!_fcViewMonth) {
            var n = new Date();
            _fcViewMonth = new Date(n.getFullYear(), n.getMonth(), 1);
        }
        var yr = _fcViewMonth.getFullYear();
        var mo = _fcViewMonth.getMonth();
        var months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
        document.getElementById('fc-month-label').textContent = months[mo] + ' ' + yr;

        // Build a set: dateStr → [cats]
        var dayMap = {};
        events.forEach(function(ev) {
            if (ev.date.getFullYear() === yr && ev.date.getMonth() === mo) {
                var key = ev.date.getDate();
                if (!dayMap[key]) dayMap[key] = [];
                if (dayMap[key].indexOf(ev.cat) === -1) dayMap[key].push(ev.cat);
            }
        });

        var catColors = { tax:'#ef4444', invest:'#f59e0b', credit:'#3b82f6', epf:'#8b5cf6', general:'#10b981' };
        var firstDay = new Date(yr, mo, 1).getDay(); // 0=Sun
        // Convert to Mon=0
        var startOffset = (firstDay + 6) % 7;
        var daysInMonth = new Date(yr, mo + 1, 0).getDate();
        var today = new Date(); today.setHours(0,0,0,0);

        var html = '';
        // Empty cells before first day
        for (var i = 0; i < startOffset; i++) {
            html += '<div class="aspect-square"></div>';
        }
        for (var d = 1; d <= daysInMonth; d++) {
            var isToday = (today.getFullYear()===yr && today.getMonth()===mo && today.getDate()===d);
            var cats    = dayMap[d] || [];
            var hasDots = cats.length > 0;
            var dateObj = new Date(yr, mo, d);
            var isPast  = dateObj < today;
            var bg = isToday ? 'background:#1a5276;' : hasDots ? 'background:#f0f9ff;' : '';
            var border = isToday ? 'border:1.5px solid #f5c842;' : hasDots ? 'border:1px solid #bae6fd;' : 'border:1px solid transparent;';
            html += '<div class="aspect-square rounded-lg flex flex-col items-center justify-center p-0.5 cursor-default transition-all" style="' + bg + border + (isPast && !isToday ? 'opacity:0.45;' : '') + '">' +
                '<span class="text-[9px] font-bold ' + (isToday ? 'text-white' : 'text-slate-700') + '">' + d + '</span>' +
                (hasDots ? '<div class="flex gap-0.5 mt-0.5">' + cats.slice(0,3).map(function(c){ return '<div class="w-1 h-1 rounded-full" style="background:' + (catColors[c]||'#10b981') + ';"></div>'; }).join('') + '</div>' : '') +
                '</div>';
        }
        document.getElementById('fc-cal-grid').innerHTML = html;
    }

    function fcMonthNav(dir) {
        if (!_fcViewMonth) {
            var n = new Date();
            _fcViewMonth = new Date(n.getFullYear(), n.getMonth(), 1);
        }
        _fcViewMonth = new Date(_fcViewMonth.getFullYear(), _fcViewMonth.getMonth() + dir, 1);
        var events = _fcBuildEvents();
        _fcRenderCalendar(events);
    }

    function fcFilter(cat) {
        _fcActiveFilter = cat;
        // Update button styles
        ['all','tax','invest','credit','epf'].forEach(function(c) {
            var btn = document.getElementById('fc-btn-' + c);
            if (!btn) return;
            if (c === cat) {
                btn.className = 'fc-filter-btn fc-filter-active';
            } else {
                btn.className = 'fc-filter-btn';
            }
        });
        finCalRender();
    }


    function cibilPreset(name) {
        var p = {
            poor:  { score: '580', util: '78', missed: '3', age: '1', cards: '1', enq: '5', loan: '30,00,000', tenure: '20' },
            fair:  { score: '650', util: '48', missed: '1', age: '3', cards: '2', enq: '2', loan: '40,00,000', tenure: '20' },
            good:  { score: '720', util: '32', missed: '0', age: '5', cards: '2', enq: '1', loan: '50,00,000', tenure: '20' },
            great: { score: '780', util: '12', missed: '0', age: '8', cards: '3', enq: '0', loan: '75,00,000', tenure: '20' },
        };
        var d = p[name]; if (!d) return;
        var map = { 'cibil-score': d.score, 'cibil-util': d.util, 'cibil-missed': d.missed, 'cibil-age': d.age, 'cibil-cards': d.cards, 'cibil-enquiries': d.enq, 'cibil-loan-amt': d.loan, 'cibil-loan-tenure': d.tenure };
        Object.keys(map).forEach(function(id) {
            var el = document.getElementById(id);
            if (el) { el.value = map[id]; el.classList.remove('text-slate-400'); }
        });
        cibilCalc();
    }

    function resetDebtPlan() {
        _debtLoans = [];
        _debtLoanId = 0;
        var c = document.getElementById('debt-loans-container');
        if (c) c.innerHTML = '';
        var ex = document.getElementById('debt-extra');
        if (ex) { ex.value = '5,000'; ex.classList.add('text-slate-400'); }
        debtScenario('typical');
        if (typeof saveUserData === 'function') saveUserData();
    }
