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
        var _cg = function(k, fb) { var v = typeof _t === 'function' ? _t(k) : null; return (v && v !== k) ? v : fb; };
        if (score >= 800) return { label: _cg('cibil.grade.excellent', 'Excellent 🌟'), color: '#059669' };
        if (score >= 750) return { label: _cg('cibil.grade.great',     'Great 😊'),     color: '#10b981' };
        if (score >= 700) return { label: _cg('cibil.grade.good',      'Good 🙂'),      color: '#eab308' };
        if (score >= 650) return { label: _cg('cibil.grade.fair',      'Fair 😐'),      color: '#f59e0b' };
        if (score >= 600) return { label: _cg('cibil.grade.poor',      'Poor 😟'),      color: '#ef4444' };
        return { label: _cg('cibil.grade.verypoor', 'Very Poor 😰'), color: '#b91c1c' };
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
        var _ct = function(k, fb) { var v = typeof _t === 'function' ? _t(k) : null; return (v && v !== k) ? v : fb; };

        var factors = [
            { label: _ct('cibil.factor.ph', 'Payment History (35%)'),    pct: payScore,  color: '#10b981', tip: missed > 0 ? _ct('cibil.tip.ph.miss', 'Missed EMIs are the #1 score killer — set auto-pay immediately.') : _ct('cibil.tip.ph.good', 'Perfect — keep it up!') },
            { label: _ct('cibil.factor.cu', 'Credit Utilisation (30%)'), pct: utilScore, color: '#3b82f6', tip: util > 30 ? _ct('cibil.tip.cu.high', 'Reduce to below 30%. Quick fix: request a credit limit increase or pay twice/month.') : util > 10 ? _ct('cibil.tip.cu.mid', 'Good — aim for below 10% for an extra boost.') : _ct('cibil.tip.cu.low', 'Excellent — below 10% is the sweet spot.') },
            { label: _ct('cibil.factor.ca', 'Credit Age (15%)'),         pct: ageScore,  color: '#eab308', tip: age < 3 ? _ct('cibil.tip.ca.young', 'Young history — time heals this. Never close old accounts.') : _ct('cibil.tip.ca.ok', 'Healthy age — avoid closing old accounts.') },
            { label: _ct('cibil.factor.ne', 'New Enquiries (10%)'),      pct: enqScore,  color: '#f97316', tip: enq > 3 ? _ct('cibil.tip.ne.high', 'Too many applications signal desperation. Pause new applications for 6 months.') : enq <= 1 ? _ct('cibil.tip.ne.good', 'Good — space out applications by 6+ months.') : _ct('cibil.tip.ne.mid', 'Moderate — avoid new applications for 3 months.') },
            { label: _ct('cibil.factor.cm', 'Credit Mix (10%)'),         pct: mixScore,  color: '#8b5cf6', tip: cards === 0 ? _ct('cibil.tip.cm.nocard', 'No credit card — a secured card or credit-builder loan helps.') : cards > 4 ? _ct('cibil.tip.cm.many', 'Too many cards can hurt. Consolidate and close newest ones.') : _ct('cibil.tip.cm.ok', 'Good mix — maintain responsibly.') },
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
        if (missed > 0)   actions.push({ week: _ct('cibil.act.w1.week', 'Week 1'),   icon: '🔴', text: _ct('cibil.act.w1.text', 'Set auto-pay for ALL EMIs & credit card bills today. One missed payment can cost 80–100 points.'), urgent: true,  lag: _ct('cibil.act.w1.lag', 'Score impact visible 30–60 days after your next statement is reported to CIBIL. Past missed payments remain on record for 3–5 years regardless.') });
        if (util > 30)    actions.push({ week: _ct('cibil.act.w12.week', 'Week 1–2'), icon: '🔵', text: _ct('cibil.act.w12.pre', 'Pay down credit card balance to below 30% of limit. If balance is ₹') + _cibilComma(Math.round(loanAmt * 0.001)) + _ct('cibil.act.w12.mid', ', your target is ₹') + _cibilComma(Math.round(loanAmt * 0.0003)) + _ct('cibil.act.w12.suf', '.'), urgent: util > 60, lag: _ct('cibil.act.w12.lag', 'Balance reduction reflects in your score 30–60 days after your card issuer files the next statement with CIBIL.') });
        if (enq > 3)      actions.push({ week: _ct('cibil.act.w2.week',  'Week 2'),   icon: '🟠', text: _ct('cibil.act.w2.text', 'Stop all new loan/card applications for at least 6 months. Each hard enquiry drops score by 5–10 points.'), urgent: true,  lag: _ct('cibil.act.w2.lag', 'Hard enquiries fade gradually — each one loses impact after 12 months and drops off the report after 2 years. No quick fix here.') });
        if (age < 3)      actions.push({ week: _ct('cibil.act.m1a.week', 'Month 1'),  icon: '🟡', text: _ct('cibil.act.m1a.text', 'Never close your oldest credit card — even if unused. Keep it active with 1 small purchase/month.'), urgent: false, lag: _ct('cibil.act.m1a.lag', 'Credit age improves slowly over years. Closing an old card can immediately lower your average age and hurt your score.') });
        if (cards === 0)  actions.push({ week: _ct('cibil.act.m1b.week', 'Month 1'),  icon: '🟣', text: _ct('cibil.act.m1b.text', 'Apply for 1 secured credit card (against FD). Use it for ≤10% of limit and pay in full each month.'), urgent: false, lag: _ct('cibil.act.m1b.lag', 'New account appears on your CIBIL report within 30–60 days. Score benefits from consistent usage build over 6+ months.') });
        if (util <= 30 && missed === 0 && enq <= 2) actions.push({ week: _ct('cibil.act.m2.week', 'Month 2'), icon: '✅', text: _ct('cibil.act.m2.text', 'Request credit limit increase from your card issuer — this reduces utilisation ratio without extra spending.'), urgent: false, lag: _ct('cibil.act.m2.lag', 'Higher limit reflects in score 30–60 days after the next statement cycle, once the issuer reports to CIBIL.') });
        actions.push({ week: _ct('cibil.act.m3.week', 'Month 3'), icon: '📋', text: _ct('cibil.act.m3.text', 'Pull your free CIBIL report and dispute any errors at cibil.com/dispute. Errors corrected = instant score boost.'), urgent: false, lag: _ct('cibil.act.m3.lag', 'CIBIL disputes are resolved in 30–45 days. Your score updates after the lender confirms the correction.') });
        if (score >= 750) actions.push({ week: _ct('cibil.act.apply.week', 'Now'), icon: '🎯', text: _ct('cibil.act.apply.pre', 'Your score is excellent! Apply for your home loan now to lock the best interest rate (≈') + bestRate.toFixed(2) + _ct('cibil.act.apply.suf', '%).'), urgent: false, lag: '' });

        var planHtml = '';
        actions.forEach(function(a) {
            planHtml += '<div class="flex gap-2 items-start rounded-xl p-2" style="background:' + (a.urgent ? '#fef2f2' : '#f8fafc') + ';border:1px solid ' + (a.urgent ? '#fecaca' : '#e2e8f0') + ';">' +
                '<span class="text-sm flex-shrink-0">' + a.icon + '</span>' +
                '<div><div class="text-[9px] font-black text-slate-400 uppercase">' + a.week + '</div>' +
                '<div class="text-[10px] text-slate-700 leading-relaxed">' + a.text + '</div>' +
                (a.lag ? '<div class="text-[9px] text-slate-400 italic mt-0.5">⏱ ' + a.lag + '</div>' : '') +
                '</div></div>';
        });
        document.getElementById('cibil-action-plan').innerHTML = planHtml;

        // Improvement timeline
        var timelineItems = [];
        if (score < 750) {
            var projected30  = Math.min(900, score + (util > 30 ? 25 : 10));
            var projected90  = Math.min(900, score + (util > 30 ? 50 : 20) + (missed === 0 ? 10 : 0));
            var projected180 = Math.min(900, score + (util > 30 ? 70 : 30) + (enq > 2 ? 15 : 5));
            timelineItems = [
                { period: _ct('cibil.tl.period.30', '30 days'),  score: projected30,  action: _ct('cibil.tl.action.30', 'Pay down utilisation + auto-pay setup') },
                { period: _ct('cibil.tl.period.90', '90 days'),  score: projected90,  action: _ct('cibil.tl.action.90', 'Consistent payments + enquiry freeze') },
                { period: _ct('cibil.tl.period.6m', '6 months'), score: projected180, action: _ct('cibil.tl.action.6m', 'Clean history building + dispute errors') },
            ];
        } else {
            timelineItems = [{ period: _ct('cibil.act.apply.week', 'Now'), score: score, action: _ct('cibil.tl.action.now', '🎯 You\'re in the best rate band! Apply for credit now.') }];
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
            { range: '800–900', grade: _ct('cibil.tbl.grade.excellent', 'Excellent'), rate: 8.40 },
            { range: '775–799', grade: _ct('cibil.tbl.grade.excellent', 'Excellent'), rate: 8.55 },
            { range: '750–774', grade: _ct('cibil.tbl.grade.great',     'Great'),     rate: 8.70 },
            { range: '725–749', grade: _ct('cibil.tbl.grade.good',      'Good'),      rate: 9.00 },
            { range: '700–724', grade: _ct('cibil.tbl.grade.good',      'Good'),      rate: 9.35 },
            { range: '650–699', grade: _ct('cibil.tbl.grade.fair',      'Fair'),      rate: 10.25 },
            { range: '600–649', grade: _ct('cibil.tbl.grade.poor',      'Poor'),      rate: 11.50 },
            { range: '<600',    grade: _ct('cibil.tbl.grade.verypoor',  'Very Poor'), rate: 12.50 },
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
                '<td class="py-1.5 font-bold ' + (isYours ? 'text-amber-800' : 'text-slate-700') + '">' + b.range + (isYours ? ' ' + _ct('cibil.tbl.you', '← You') : '') + '</td>' +
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
        if (score >= 800) insightMsg = _ct('cibil.insight.elite', '🌟 <strong>Elite status.</strong> You\'ll get the absolute best rates. No lender can turn you down. Apply with confidence — and check for pre-approved offers from your bank.');
        else if (score >= 750) insightMsg = _ct('cibil.insight.great', '😊 <strong>Great score!</strong> You qualify for the best home loan rates (~8.4–8.7%). Even a small improvement toward 800 won\'t change your rate much — focus on maintaining rather than chasing.');
        else if (score >= 700) insightMsg = (_ct('cibil.insight.good', '🙂 <strong>Good, but improvable.</strong> At {score}, you\'re paying ~{myRate}% vs {bestRate}% possible — that\'s {totalSaved} extra over {tenure} years. Focus on utilisation and payments for 90 days.')).replace('{score}', score).replace('{myRate}', myRate).replace('{bestRate}', bestRate).replace('{totalSaved}', _cibilInr(totalSaved)).replace('{tenure}', tenure);
        else if (score >= 650) insightMsg = _ct('cibil.insight.fair', '😐 <strong>Fair — action needed.</strong> Lenders see you as moderate risk. Reducing utilisation below 30% and 6 months of clean payments can lift you 40–60 points. Wait 90 days before applying for a major loan.');
        else insightMsg = _ct('cibil.insight.poor', '😟 <strong>Poor — delay major loan applications.</strong> Most banks will reject or charge 11%+ rates. Spend 6–12 months on: zero missed payments, reduce credit card balance, freeze new applications. Your score CAN recover fully.');
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
            addEv([fy,5,15],  _t('fincal.ev.adv1.title'),
                _t('fincal.ev.adv1.desc'),
                'tax','💸',_t('fincal.ev.adv1.pen'));
            addEv([fy,8,15],  _t('fincal.ev.adv2.title'),
                _t('fincal.ev.adv2.desc'),
                'tax','💸',_t('fincal.ev.adv2.pen'));
            addEv([fy,11,15], _t('fincal.ev.adv3.title'),
                _t('fincal.ev.adv3.desc'),
                'tax','💸',_t('fincal.ev.adv3.pen'));
            addEv([fy+1,2,15],_t('fincal.ev.adv4.title'),
                _t('fincal.ev.adv4.desc'),
                'tax','💸',_t('fincal.ev.adv4.pen'));
        }

        // ITR Deadlines
        var fyLabel = 'FY' + fy + '-' + (fy-1999);
        addEv([fy+1,6,31], _t('fincal.ev.itr1.title'),
            _t('fincal.ev.itr1.desc').replace('%FY%', fyLabel),
            'tax','📋',_t('fincal.ev.itr1.pen'));
        addEv([fy+1,9,31], _t('fincal.ev.itr2.title'),
            _t('fincal.ev.itr2.desc'),
            'tax','📋',_t('fincal.ev.itr2.pen'));
        addEv([fy+1,11,31],_t('fincal.ev.itr3.title'),
            _t('fincal.ev.itr3.desc').replace('%FY%', fyLabel),
            'tax','🚨',_t('fincal.ev.itr3.pen'));

        // Form 16 receipt
        addEv([fy+1,5,15], _t('fincal.ev.form16.title'),
            _t('fincal.ev.form16.desc'),
            'tax','📄','');

        // TDS refund check
        addEv([fy+1,7,15], _t('fincal.ev.tds.title'),
            _t('fincal.ev.tds.desc'),
            'tax','💰','');

        // ── INVESTMENT EVENTS ────────────────────────────────────────────
        if (hasPPF) {
            // PPF: deposit before 5th of each month for interest. Special: April 5
            addEv([fy,3,4],   _t('fincal.ev.ppfapr.title'),
                _t('fincal.ev.ppfapr.desc'),
                'invest','🏛️',_t('fincal.ev.ppfapr.pen'));
            addEv([fy,2,31],  _t('fincal.ev.ppfmar.title'),
                _t('fincal.ev.ppfmar.desc'),
                'invest','🏛️',_t('fincal.ev.ppfmar.pen'));
            // Monthly PPF reminder (5th of each month)
            for (var m = 0; m < 12; m++) {
                var evDate = new Date(fy, m + 3, 4);
                if (evDate >= fyStart && evDate <= new Date(fyEnd.getFullYear(), fyEnd.getMonth() + 3, 0)) {
                    if (m === 0) continue; // Already added April 5 above
                    addEv([evDate.getFullYear(), evDate.getMonth(), 4],
                        _t('fincal.ev.ppfmon.title'),
                        _t('fincal.ev.ppfmon.desc'),
                        'invest','🏛️','');
                }
            }
        }

        if (hasELSS && regime === 'old') {
            addEv([fy+1,0,15], _t('fincal.ev.elss1.title'),
                _t('fincal.ev.elss1.desc'),
                'invest','📈',_t('fincal.ev.elss1.pen'));
            addEv([fy+1,1,28], _t('fincal.ev.elss2.title'),
                _t('fincal.ev.elss2.desc'),
                'invest','📈',_t('fincal.ev.elss2.pen'));
            addEv([fy+1,2,28], _t('fincal.ev.elss3.title'),
                _t('fincal.ev.elss3.desc'),
                'invest','⚠️',_t('fincal.ev.elss3.pen'));
        }

        if (hasSGB) {
            // SGB windows typically open 4–6 times/year. Use approximate typical dates.
            addEv([fy,4,22],  _t('fincal.ev.sgb.title'),
                _t('fincal.ev.sgb.desc1'),
                'invest','🥇',_t('fincal.ev.sgb.pen'));
            addEv([fy,7,19],  _t('fincal.ev.sgb.title'),
                _t('fincal.ev.sgb.desc2'),
                'invest','🥇','');
            addEv([fy,10,18], _t('fincal.ev.sgb.title'),
                _t('fincal.ev.sgb.desc3'),
                'invest','🥇','');
            addEv([fy+1,1,16],_t('fincal.ev.sgb.title'),
                _t('fincal.ev.sgb.desc4'),
                'invest','🥇','');
        }

        // NPS — March 31 (always relevant for salaried)
        addEv([fy+1,2,31], _t('fincal.ev.nps.title'),
            _t('fincal.ev.nps.desc'),
            'invest','🏛️', regime === 'old' ? _t('fincal.ev.nps.pen.old') : _t('fincal.ev.nps.pen.new'));

        // ── CREDIT CARD EVENTS ──────────────────────────────────────────
        // Add monthly for next 3 months — let JS handle month overflow naturally
        for (var cm = 0; cm < 3; cm++) {
            var stmtDate = new Date(today.getFullYear(), today.getMonth() + cm, ccDay);
            var dueDate  = new Date(today.getFullYear(), today.getMonth() + cm, ccDay + 20);
            addEv([stmtDate.getFullYear(), stmtDate.getMonth(), stmtDate.getDate()],
                _t('fincal.ev.cc.stmt.title'),
                _t('fincal.ev.cc.stmt.desc'),
                'credit','💳','');
            addEv([dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate()],
                _t('fincal.ev.cc.due.title'),
                _t('fincal.ev.cc.due.desc'),
                'credit','🔴',_t('fincal.ev.cc.due.pen'));
        }

        // ── EPF EVENTS ──────────────────────────────────────────────────
        if (hasEPF) {
            addEv([fy,3,30],  _t('fincal.ev.epfnom.title'),
                _t('fincal.ev.epfnom.desc'),
                'epf','🏢',_t('fincal.ev.epfnom.pen'));
            addEv([fy,5,30],  _t('fincal.ev.epfpb.title'),
                _t('fincal.ev.epfpb.desc'),
                'epf','🏢',_t('fincal.ev.epfpb.pen'));
            addEv([fy,11,31], _t('fincal.ev.epfint.title'),
                _t('fincal.ev.epfint.desc'),
                'epf','🏢','');
            addEv([fy+1,2,31],_t('fincal.ev.epfvpf.title'),
                _t('fincal.ev.epfvpf.desc'),
                'epf','🏢','');
        }

        // ── GENERAL COMPLIANCE ───────────────────────────────────────────
        addEv([fy+1,2,31], _t('fincal.ev.80c.title'),
            _t('fincal.ev.80c.desc'),
            'tax','📋', regime === 'old' ? _t('fincal.ev.80c.pen.old') : _t('fincal.ev.80c.pen.new'));
        addEv([fy,8,30],   _t('fincal.ev.hra1.title'),
            _t('fincal.ev.hra1.desc'),
            'tax','📑','');
        addEv([fy,11,31],  _t('fincal.ev.hra2.title'),
            _t('fincal.ev.hra2.desc'),
            'tax','📑','');
        addEv([fy+1,0,31], _t('fincal.ev.invdecl.title'),
            _t('fincal.ev.invdecl.desc'),
            'tax','📊',_t('fincal.ev.invdecl.pen'));
        addEv([fy,8,15],   _t('fincal.ev.crrep.title'),
            _t('fincal.ev.crrep.desc'),
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

        // Store all events for day-click lookups
        window._fcCurrentEvents = events;

        // Apply active filter to calendar dots too
        var filter = _fcActiveFilter || 'all';
        var filtered = filter === 'all' ? events : events.filter(function(ev) { return ev.cat === filter; });

        // Build day map: day → array of events (filtered)
        var dayMap = {};
        filtered.forEach(function(ev) {
            if (ev.date.getFullYear() === yr && ev.date.getMonth() === mo) {
                var key = ev.date.getDate();
                if (!dayMap[key]) dayMap[key] = [];
                dayMap[key].push(ev);
            }
        });

        var catColors = { tax:'#ef4444', invest:'#f59e0b', credit:'#3b82f6', epf:'#8b5cf6', general:'#10b981' };
        var firstDay = new Date(yr, mo, 1).getDay();
        var startOffset = (firstDay + 6) % 7; // Mon=0 … Sun=6
        var daysInMonth = new Date(yr, mo + 1, 0).getDate();
        var today = new Date(); today.setHours(0,0,0,0);

        var html = '';
        for (var i = 0; i < startOffset; i++) html += '<div class="aspect-square"></div>';

        for (var d = 1; d <= daysInMonth; d++) {
            var isToday = (today.getFullYear()===yr && today.getMonth()===mo && today.getDate()===d);
            var evs     = dayMap[d] || [];
            var cats    = evs.map(function(e){ return e.cat; }).filter(function(c,i,a){ return a.indexOf(c)===i; });
            var hasDots = cats.length > 0;
            var dateObj = new Date(yr, mo, d);
            var isPast  = dateObj < today;
            var bg      = isToday ? 'background:#1a5276;' : hasDots ? 'background:#f0f9ff;' : '';
            var border  = isToday ? 'border:1.5px solid #f5c842;' : hasDots ? 'border:1px solid #bae6fd;' : 'border:1px solid transparent;';
            var click   = hasDots ? ' onclick="fcShowDayEvents(' + yr + ',' + mo + ',' + d + ')" title="' + evs.length + ' event' + (evs.length > 1 ? 's' : '') + ' — click to view"' : '';
            var cursor  = hasDots ? 'cursor:pointer;' : '';
            html += '<div class="aspect-square rounded-lg flex flex-col items-center justify-center p-0.5 transition-all hover:scale-105"' +
                ' style="' + bg + border + (isPast && !isToday ? 'opacity:0.45;' : '') + cursor + '"' + click + '>' +
                '<span class="text-[9px] font-bold ' + (isToday ? 'text-white' : 'text-slate-700') + '">' + d + '</span>' +
                (hasDots ? '<div class="flex gap-0.5 mt-0.5">' + cats.slice(0,3).map(function(c){
                    return '<div class="w-1.5 h-1.5 rounded-full" style="background:' + (catColors[c]||'#10b981') + ';"></div>';
                }).join('') + '</div>' : '') +
                '</div>';
        }
        document.getElementById('fc-cal-grid').innerHTML = html;

        // Clear the day detail panel on month change
        var det = document.getElementById('fc-day-detail');
        if (det) det.innerHTML = '';
    }

    function fcShowDayEvents(yr, mo, d) {
        var allEvents = window._fcCurrentEvents || [];
        var filter = _fcActiveFilter || 'all';
        var dayEvs = allEvents.filter(function(ev) {
            return ev.date.getFullYear() === yr && ev.date.getMonth() === mo && ev.date.getDate() === d
                && (filter === 'all' || ev.cat === filter);
        });
        var det = document.getElementById('fc-day-detail');
        if (!det) return;
        if (dayEvs.length === 0) { det.innerHTML = ''; return; }

        var months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
        var catColors = { tax:'#ef4444', invest:'#f59e0b', credit:'#3b82f6', epf:'#8b5cf6', general:'#10b981' };
        var html = '<div class="mt-2 pt-2 border-t border-slate-100">' +
            '<div class="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-2">📅 ' + months[mo] + ' ' + d + ' — ' + dayEvs.length + ' event' + (dayEvs.length > 1 ? 's' : '') + '</div>' +
            dayEvs.map(function(ev) {
                var dot = catColors[ev.cat] || '#10b981';
                return '<div class="flex items-start gap-2 rounded-xl px-2.5 py-2 mb-1.5" style="background:#f8fafc;border:1px solid #e2e8f0;">' +
                    '<div class="w-2 h-2 rounded-full mt-1 flex-shrink-0" style="background:' + dot + ';"></div>' +
                    '<div class="flex-1 min-w-0">' +
                        '<div class="text-[10px] font-black text-slate-800 leading-snug">' + ev.title + '</div>' +
                        '<div class="text-[9px] text-slate-500 mt-0.5 leading-snug">' + ev.desc.slice(0, 110) + (ev.desc.length > 110 ? '…' : '') + '</div>' +
                        (ev.penalty ? '<div class="text-[8px] font-bold mt-0.5" style="color:#dc2626;">⚠️ ' + ev.penalty + '</div>' : '') +
                    '</div></div>';
            }).join('') +
            '</div>';
        det.innerHTML = html;
        det.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
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
