        // ==================== FINANCIAL HEALTH SCORE ====================
        let hsChartInstance = null;
        let hsPfChartInstance = null;

        // Percentile curves by age bracket.
        // Anchored to: RBI Household Finance Committee report, SEBI Investor Survey 2022,
        // India insurance penetration (~3.7% of GDP), average household savings rate (~11-12%).
        // Each entry: [score_floor, percentile_of_people_scoring_AT_OR_BELOW_this_floor]
        // i.e. scoring 70 in the 26-35 bracket means you beat ~76% of peers.
        var _HS_PERCENTILE_BRACKETS = [
            { min: 18, max: 25, label: '18–25',
              curve: [[90,96],[80,90],[70,80],[60,65],[50,48],[40,30],[30,16],[0,5]] },
            { min: 26, max: 35, label: '26–35',
              curve: [[90,95],[80,88],[70,76],[60,60],[50,44],[40,28],[30,14],[0,5]] },
            { min: 36, max: 45, label: '36–45',
              curve: [[90,94],[80,86],[70,73],[60,57],[50,41],[40,26],[30,13],[0,4]] },
            { min: 46, max: 55, label: '46–55',
              curve: [[90,93],[80,84],[70,70],[60,54],[50,39],[40,24],[30,12],[0,4]] },
            { min: 56, max: 80, label: '56+',
              curve: [[90,92],[80,82],[70,68],[60,52],[50,37],[40,23],[30,11],[0,4]] }
        ];

        function hsOrdinal(n) {
            var s = ['th','st','nd','rd'], v = n % 100;
            return n + (s[(v - 20) % 10] || s[v] || s[0]);
        }

        function hsGetPercentile(score, age) {
            var bracket = null;
            for (var b = 0; b < _HS_PERCENTILE_BRACKETS.length; b++) {
                if (age >= _HS_PERCENTILE_BRACKETS[b].min && age <= _HS_PERCENTILE_BRACKETS[b].max) {
                    bracket = _HS_PERCENTILE_BRACKETS[b]; break;
                }
            }
            if (!bracket) bracket = _HS_PERCENTILE_BRACKETS[1]; // default 26-35
            var curve = bracket.curve;
            for (var i = 0; i < curve.length - 1; i++) {
                var upper = curve[i], lower = curve[i + 1];
                if (score >= lower[0] && score <= upper[0]) {
                    var t = upper[0] === lower[0] ? 1 : (score - lower[0]) / (upper[0] - lower[0]);
                    return { percentile: Math.round(lower[1] + t * (upper[1] - lower[1])), bracket: bracket.label };
                }
            }
            return { percentile: curve[curve.length - 1][1], bracket: bracket.label };
        }

        function hsFormatInput(el) {
            let val = el.value.replace(/[^0-9]/g, '');
            if (val === '') { el.value = ''; return; }
            let num = parseInt(val, 10);
            el.value = new Intl.NumberFormat('en-IN').format(num);
        }

        function hsGetVal(id) {
            const raw = document.getElementById(id).value.replace(/[^0-9]/g, '');
            return parseInt(raw, 10) || 0;
        }

        function resetHealthScore() {
            const moneyFields = ['hs-income','hs-emi','hs-expenses','hs-savings','hs-health-ins','hs-term-ins','hs-efund',
                                  'hs-pf-equity','hs-pf-debt','hs-pf-realty','hs-pf-gold','hs-pf-retiral','hs-pf-other'];
            moneyFields.forEach(id => {
                const el = document.getElementById(id);
                el.value = '0';
                el.classList.add('text-slate-400');
            });
            document.getElementById('hs-age').value = '';
            // Reset results display
            document.getElementById('hs-empty-state').classList.remove('hidden');
            document.getElementById('hs-score-result').classList.add('hidden');
            document.getElementById('hs-score-badge').innerText = '--';
            document.getElementById('hs-grade-badge').innerText = _t('hs.notscored');
            document.getElementById('hs-pie-empty').classList.remove('hidden');
            document.getElementById('hs-pie-container').classList.add('hidden');
            document.getElementById('hs-actions-empty').classList.remove('hidden');
            document.getElementById('hs-actions-list').classList.add('hidden');
            document.getElementById('hs-stats-strip').classList.add('hidden');
            var pfStrip = document.getElementById('hs-pf-strip'); if (pfStrip) pfStrip.classList.add('hidden');
            var pfPieE = document.getElementById('hs-pf-pie-empty'); if (pfPieE) pfPieE.classList.remove('hidden');
            var pfPieC = document.getElementById('hs-pf-pie-container'); if (pfPieC) pfPieC.classList.add('hidden');
            if (hsChartInstance) { hsChartInstance.destroy(); hsChartInstance = null; }
            if (hsPfChartInstance) { hsPfChartInstance.destroy(); hsPfChartInstance = null; }
            var pctBannerReset = document.getElementById('hs-percentile-banner');
            if (pctBannerReset) pctBannerReset.style.display = 'none';
            if (typeof saveUserData === 'function') saveUserData();
        }

        function calcHealthScore() {
            const income    = hsGetVal('hs-income');
            const emi       = hsGetVal('hs-emi');
            const expenses  = hsGetVal('hs-expenses');
            const savings   = hsGetVal('hs-savings');
            const healthIns = hsGetVal('hs-health-ins');
            const termIns   = hsGetVal('hs-term-ins');
            const efund     = hsGetVal('hs-efund');
            const age       = parseInt(document.getElementById('hs-age').value, 10) || 0;

            // Portfolio fields
            const pfEquity  = hsGetVal('hs-pf-equity');
            const pfDebt    = hsGetVal('hs-pf-debt');
            const pfRealty  = hsGetVal('hs-pf-realty');
            const pfGold    = hsGetVal('hs-pf-gold');
            const pfRetiral = hsGetVal('hs-pf-retiral');
            const pfOther   = hsGetVal('hs-pf-other');
            const pfTotal   = pfEquity + pfDebt + pfRealty + pfGold + pfRetiral + pfOther;

            if (income === 0) {
                document.getElementById('hs-empty-state').classList.remove('hidden');
                document.getElementById('hs-score-result').classList.add('hidden');
                document.getElementById('hs-pie-empty').classList.remove('hidden');
                document.getElementById('hs-pie-container').classList.add('hidden');
                document.getElementById('hs-actions-empty').classList.remove('hidden');
                document.getElementById('hs-actions-list').classList.add('hidden');
                document.getElementById('hs-stats-strip').classList.add('hidden');
                document.getElementById('hs-score-badge').textContent = '--';
                document.getElementById('hs-grade-badge').textContent = _t('hs.notscored');
                return;
            }

            const annualIncome = income * 12;
            const totalMonthlyOutgo = emi + expenses + savings;
            const freeCash = Math.max(0, income - totalMonthlyOutgo);
            const monthlyExpenses = expenses + emi; // for EF calculation

            // ---- SCORING ----
            const categories = [];

            // 1. Savings Rate (20 pts)
            const savingsRate = income > 0 ? (savings / income) * 100 : 0;
            let savingsPts = 0;
            if      (savingsRate >= 30) savingsPts = 20;
            else if (savingsRate >= 20) savingsPts = 16;
            else if (savingsRate >= 10) savingsPts = 11;
            else if (savingsRate >= 5)  savingsPts = 6;
            else                        savingsPts = Math.max(0, Math.round(savingsRate * 1.2));
            categories.push({ name: 'Savings Rate', pts: savingsPts, max: 20, icon: '💰',
                color: '#10b981', desc: `${savingsRate.toFixed(1)}% of income saved` });

            // 2. EMI Burden (20 pts)
            const emiPct = income > 0 ? (emi / income) * 100 : 0;
            let emiPts = 0;
            if      (emiPct === 0)    emiPts = 20;
            else if (emiPct < 20)     emiPts = 20;
            else if (emiPct < 30)     emiPts = 15;
            else if (emiPct < 40)     emiPts = 9;
            else if (emiPct < 50)     emiPts = 4;
            else                      emiPts = 0;
            categories.push({ name: 'Debt Burden', pts: emiPts, max: 20, icon: '🏦',
                color: '#ef4444', desc: `EMIs are ${emiPct.toFixed(1)}% of income` });

            // 3. Health Insurance (15 pts)
            let healthPts = 0;
            const hiLakh = healthIns / 100000;
            if      (hiLakh >= 20) healthPts = 15;
            else if (hiLakh >= 10) healthPts = 13;
            else if (hiLakh >= 5)  healthPts = 9;
            else if (hiLakh >= 3)  healthPts = 5;
            else if (hiLakh >= 1)  healthPts = 2;
            else                   healthPts = 0;
            categories.push({ name: 'Health Insurance', pts: healthPts, max: 15, icon: '🏥',
                color: '#ec4899', desc: hiLakh > 0 ? `₹${hiLakh.toFixed(1)}L sum insured` : 'No coverage!' });

            // 4. Term Insurance (15 pts)  — compare to annual income multiple
            let termPts = 0;
            const termMult = annualIncome > 0 ? termIns / annualIncome : 0;
            if      (termMult >= 15) termPts = 15;
            else if (termMult >= 10) termPts = 13;
            else if (termMult >= 7)  termPts = 9;
            else if (termMult >= 5)  termPts = 5;
            else if (termMult >= 2)  termPts = 2;
            else                     termPts = 0;
            categories.push({ name: 'Term Insurance', pts: termPts, max: 15, icon: '🛡️',
                color: '#8b5cf6', desc: termMult > 0 ? `${termMult.toFixed(1)}× annual income` : 'No term plan!' });

            // 5. Emergency Fund (15 pts)
            const efMonths = monthlyExpenses > 0 ? efund / monthlyExpenses : 0;
            let efPts = 0;
            if      (efMonths >= 12) efPts = 15;  // Outstanding — full year safety net
            else if (efMonths >= 9)  efPts = 12;  // Excellent — well above standard
            else if (efMonths >= 6)  efPts = 10;  // Good — meets the 6-month benchmark
            else if (efMonths >= 4)  efPts = 7;   // Partial — building toward target
            else if (efMonths >= 2)  efPts = 4;   // Early stage
            else if (efMonths >= 1)  efPts = 2;   // Minimal buffer
            else                     efPts = 0;   // No emergency fund
            categories.push({ name: 'Emergency Fund', pts: efPts, max: 15, icon: '🚨',
                color: '#f59e0b', desc: `${efMonths.toFixed(1)} months of expenses covered` });

            // 6. Expense Management (15 pts)
            const spendPct = income > 0 ? ((expenses + emi) / income) * 100 : 100;
            let spendPts = 0;
            if      (spendPct <= 50) spendPts = 15;
            else if (spendPct <= 60) spendPts = 12;
            else if (spendPct <= 70) spendPts = 8;
            else if (spendPct <= 80) spendPts = 4;
            else if (spendPct <= 90) spendPts = 1;
            else                     spendPts = 0;
            categories.push({ name: 'Spending Control', pts: spendPts, max: 15, icon: '🛒',
                color: '#f97316', desc: `${spendPct.toFixed(1)}% of income spent` });

            // 7. Age Readiness (10 pts) — only scored if age is entered
            if (age >= 18 && age <= 80) {
                let agePts = 0;
                let ageDesc = '';
                if (age <= 25) {
                    if      (savingsRate >= 10) agePts = 10;
                    else if (savingsRate >= 5)  agePts = 8;
                    else if (savingsRate > 0)   agePts = 5;
                    else                        agePts = 2;
                    ageDesc = `Great head start at ${age}! Time is your biggest asset — keep it going.`;
                } else if (age <= 35) {
                    if      (savingsRate >= 20) agePts = 10;
                    else if (savingsRate >= 15) agePts = 8;
                    else if (savingsRate >= 10) agePts = 5;
                    else if (savingsRate >= 5)  agePts = 2;
                    else                        agePts = 0;
                    ageDesc = `At ${age}, target 20%+ savings rate to retire by 60 with a solid corpus.`;
                } else if (age <= 45) {
                    if      (savingsRate >= 25) agePts = 10;
                    else if (savingsRate >= 20) agePts = 7;
                    else if (savingsRate >= 15) agePts = 4;
                    else if (savingsRate >= 10) agePts = 1;
                    else                        agePts = 0;
                    ageDesc = `At ${age}, 25%+ savings is the benchmark — retirement is ~20 years away.`;
                } else if (age <= 55) {
                    if      (savingsRate >= 30) agePts = 10;
                    else if (savingsRate >= 25) agePts = 6;
                    else if (savingsRate >= 20) agePts = 3;
                    else if (savingsRate >= 15) agePts = 1;
                    else                        agePts = 0;
                    ageDesc = `At ${age}, target 30%+ savings — retirement is within 10 years.`;
                } else {
                    if      (savingsRate >= 35) agePts = 10;
                    else if (savingsRate >= 30) agePts = 5;
                    else if (savingsRate >= 25) agePts = 2;
                    else                        agePts = 0;
                    ageDesc = `At ${age}, maximize every rupee — prioritize NPS, PPF, and debt reduction.`;
                }
                categories.push({ name: 'Age Readiness', pts: agePts, max: 10, icon: '🎂',
                    color: '#6366f1', desc: ageDesc });
            }

            // 8. Net Worth Readiness (15 pts) — only scored if any portfolio value entered
            if (pfTotal > 0) {
                const annualInc = income * 12;
                const pfMult    = annualInc > 0 ? pfTotal / annualInc : 0;
                const equityPct = pfTotal > 0 ? (pfEquity / pfTotal) * 100 : 0;
                const debtPct   = pfTotal > 0 ? ((pfDebt + pfRetiral) / pfTotal) * 100 : 0;
                const altPct    = pfTotal > 0 ? ((pfRealty + pfGold) / pfTotal) * 100 : 0;

                // Ideal equity allocation by age: 100-age rule
                const idealEquityPct = Math.max(20, 100 - (age || 35));
                const equityGap = Math.abs(equityPct - idealEquityPct);

                let nwPts = 0;
                // Sub-score: net worth multiple of annual income (max 7 pts)
                if      (pfMult >= 10) nwPts += 7;
                else if (pfMult >= 5)  nwPts += 6;
                else if (pfMult >= 3)  nwPts += 5;
                else if (pfMult >= 2)  nwPts += 4;
                else if (pfMult >= 1)  nwPts += 3;
                else if (pfMult >= 0.5)nwPts += 2;
                else                   nwPts += 1;

                // Sub-score: diversification — at least 2 asset classes (max 4 pts)
                var assetClassCount = [pfEquity > 0, pfDebt > 0 || pfRetiral > 0, pfRealty > 0, pfGold > 0].filter(Boolean).length;
                nwPts += Math.min(4, assetClassCount);

                // Sub-score: equity allocation alignment with age rule (max 4 pts)
                if      (equityGap <= 10) nwPts += 4;
                else if (equityGap <= 20) nwPts += 3;
                else if (equityGap <= 30) nwPts += 2;
                else                      nwPts += 0;

                var nwDesc = pfMult.toFixed(1) + '× annual income · ' + assetClassCount + ' asset classes · ' + equityPct.toFixed(0) + '% equity (ideal ' + idealEquityPct + '%)';
                categories.push({ name: 'Net Worth Readiness', pts: nwPts, max: 15, icon: '📊',
                    color: '#0ea5e9', desc: nwDesc });

                // Update portfolio strip
                var strip = document.getElementById('hs-pf-strip');
                if (strip) {
                    strip.classList.remove('hidden');
                    var pfTotalEl = document.getElementById('hs-pf-total');
                    var pfMultEl  = document.getElementById('hs-pf-income-mult');
                    var pfEqPctEl = document.getElementById('hs-pf-equity-pct');
                    if (pfTotalEl) pfTotalEl.textContent  = pfTotal >= 1e7 ? '₹' + (pfTotal/1e7).toFixed(2) + ' Cr' : pfTotal >= 1e5 ? '₹' + (pfTotal/1e5).toFixed(1) + 'L' : '₹' + Math.round(pfTotal).toLocaleString('en-IN');
                    if (pfMultEl)  pfMultEl.textContent   = pfMult.toFixed(1) + '×';
                    if (pfEqPctEl) pfEqPctEl.textContent  = equityPct.toFixed(0) + '%';
                }

                // ---- PORTFOLIO PIE CHART ----
                const pfPieData   = [];
                const pfPieLabels = [];
                const pfPieColors = [];
                if (pfEquity  > 0) { pfPieData.push(pfEquity);  pfPieLabels.push('Equity MF/Stocks'); pfPieColors.push('#10b981'); }
                if (pfDebt    > 0) { pfPieData.push(pfDebt);    pfPieLabels.push('Debt MF/FD');       pfPieColors.push('#3b82f6'); }
                if (pfRetiral > 0) { pfPieData.push(pfRetiral); pfPieLabels.push('EPF/PPF/NPS');      pfPieColors.push('#8b5cf6'); }
                if (pfRealty  > 0) { pfPieData.push(pfRealty);  pfPieLabels.push('Real Estate');      pfPieColors.push('#f97316'); }
                if (pfGold    > 0) { pfPieData.push(pfGold);    pfPieLabels.push('Gold');             pfPieColors.push('#f59e0b'); }
                if (pfOther   > 0) { pfPieData.push(pfOther);   pfPieLabels.push('Other');            pfPieColors.push('#94a3b8'); }

                const pfPieEmpty = document.getElementById('hs-pf-pie-empty');
                const pfPieCont  = document.getElementById('hs-pf-pie-container');
                if (pfPieData.length > 0 && pfPieEmpty && pfPieCont) {
                    pfPieEmpty.classList.add('hidden');
                    pfPieCont.classList.remove('hidden');
                    if (hsPfChartInstance) { hsPfChartInstance.destroy(); hsPfChartInstance = null; }
                    const pfCtx = document.getElementById('hsPfChart').getContext('2d');
                    hsPfChartInstance = new Chart(pfCtx, {
                        type: 'doughnut',
                        data: { labels: pfPieLabels, datasets: [{ data: pfPieData,
                            backgroundColor: pfPieColors, borderColor: '#fff', borderWidth: 3, hoverOffset: 10 }] },
                        options: {
                            responsive: true, maintainAspectRatio: true, cutout: '60%',
                            plugins: { legend: { display: false }, tooltip: {
                                callbacks: { label: function(ctx) {
                                    const val = ctx.parsed;
                                    const pct = ((val / pfTotal) * 100).toFixed(1);
                                    const fmt = val >= 1e7 ? '₹' + (val/1e7).toFixed(2) + 'Cr' : val >= 1e5 ? '₹' + (val/1e5).toFixed(1) + 'L' : '₹' + Math.round(val).toLocaleString('en-IN');
                                    return ' ' + fmt + ' (' + pct + '%)';
                                }}
                            }},
                            animation: { animateRotate: true, duration: 900 }
                        }
                    });
                    const pfLegend = document.getElementById('hs-pf-pie-legend');
                    pfLegend.innerHTML = '';
                    pfPieLabels.forEach(function(lbl, i) {
                        const pct = ((pfPieData[i] / pfTotal) * 100).toFixed(1);
                        pfLegend.innerHTML += '<div class="flex items-center justify-between text-xs">' +
                            '<div class="flex items-center gap-1.5">' +
                            '<div class="w-2.5 h-2.5 rounded-full flex-shrink-0" style="background:' + pfPieColors[i] + ';"></div>' +
                            '<span class="font-medium text-slate-600">' + lbl + '</span>' +
                            '</div>' +
                            '<span class="font-black text-slate-700">' + pct + '%</span>' +
                            '</div>';
                    });
                }
            } else {
                var strip2 = document.getElementById('hs-pf-strip');
                if (strip2) strip2.classList.add('hidden');
                var pfPieE2 = document.getElementById('hs-pf-pie-empty');
                var pfPieC2 = document.getElementById('hs-pf-pie-container');
                if (pfPieE2) pfPieE2.classList.remove('hidden');
                if (pfPieC2) pfPieC2.classList.add('hidden');
                if (hsPfChartInstance) { hsPfChartInstance.destroy(); hsPfChartInstance = null; }
            }

            // Normalize to 100 regardless of whether age category is present (max 100 or 110)
            const rawTotal = categories.reduce((a, c) => a + c.pts, 0);
            const maxTotal = categories.reduce((a, c) => a + c.max, 0);
            const totalScore = Math.min(100, Math.round(rawTotal * 100 / maxTotal));

            // ---- PERCENTILE BENCHMARK ----
            var pctBanner   = document.getElementById('hs-percentile-banner');
            var pctHeadline = document.getElementById('hs-percentile-headline');
            var pctNumber   = document.getElementById('hs-percentile-number');
            var pctContext  = document.getElementById('hs-percentile-context');
            if (pctBanner) {
                pctBanner.style.display = 'flex'; // always show once score is calculated
                if (age >= 18 && age <= 80) {
                    var pgData   = hsGetPercentile(totalScore, age);
                    var pctColor = totalScore >= 70 ? '#10b981' : totalScore >= 50 ? '#f59e0b' : '#ef4444';
                    if (pctHeadline) pctHeadline.textContent = 'Better than ' + pgData.percentile + '% of Indians aged ' + pgData.bracket;
                    if (pctNumber)  { pctNumber.textContent = hsOrdinal(pgData.percentile); pctNumber.style.color = pctColor; }
                    if (pctContext) {
                        var pctCtxText = pgData.percentile >= 80 ? 'You\'re among the most financially prepared Indians in your age group.'
                                       : pgData.percentile >= 60 ? 'Above average — most Indians your age are not this prepared.'
                                       : pgData.percentile >= 40 ? 'Around the median — plenty of room to pull ahead.'
                                       : 'Most Indians your age face similar challenges. The fix starts here.';
                        pctContext.textContent = pctCtxText;
                    }
                } else {
                    // Age not entered — show the banner as a prompt
                    if (pctHeadline) pctHeadline.textContent = 'How do you compare to Indians your age?';
                    if (pctNumber)  { pctNumber.textContent = '?'; pctNumber.style.color = '#94a3b8'; }
                    if (pctContext)  pctContext.textContent  = 'Enter your age in the form on the left to see your peer percentile.';
                }
            }

            // ---- GRADE ----
            let grade, emoji, desc, arcColor;
            if      (totalScore >= 90) { grade='Financial Rockstar 🤘'; emoji='🏆'; desc="Warren Buffett has entered the chat. Your finances are in elite shape. Go flex (responsibly)."; arcColor='#10b981'; }
            else if (totalScore >= 80) { grade='Wealth Builder'; emoji='🌟'; desc="You're doing things right. A few tweaks and you'll be unstoppable. Keep stacking those chips!"; arcColor='#22c55e'; }
            else if (totalScore >= 70) { grade='On the Right Track'; emoji='📈'; desc="Solid foundation! A few gaps need attention but you're clearly thinking ahead. Nice work."; arcColor='#84cc16'; }
            else if (totalScore >= 55) { grade='Getting There'; emoji='🚀'; desc="You're aware, which is step one. Now close those gaps — one action at a time!"; arcColor='#eab308'; }
            else if (totalScore >= 40) { grade='Wake-Up Call'; emoji='⚡'; desc="Your money needs a serious pep talk. The good news? You're reading this — so the healing begins now."; arcColor='#f97316'; }
            else if (totalScore >= 25) { grade='SOS Mode'; emoji='🚨'; desc="Houston, we have a problem. But every financial superhero has an origin story. Yours starts today."; arcColor='#ef4444'; }
            else                       { grade='Financial Emergency'; emoji='🆘'; desc="Okay, time for some real talk. The gap is big but closable. Start with just ONE action below."; arcColor='#dc2626'; }

            // ---- RENDER SCORE ----
            document.getElementById('hs-empty-state').classList.add('hidden');
            var hsResultEl = document.getElementById('hs-score-result');
            hsResultEl.classList.remove('hidden');
            hsResultEl.classList.remove('result-flip-in');
            void hsResultEl.offsetWidth;
            hsResultEl.classList.add('result-flip-in');
            // Animate score counter
            const scoreEl = document.getElementById('hs-score-display');
            const badgeEl = document.getElementById('hs-score-badge');
            let scoreStart = performance.now();
            const scoreDuration = 900;
            function animScore(now) {
                const p = Math.min((now - scoreStart) / scoreDuration, 1);
                const eased = 1 - Math.pow(1 - p, 3);
                const cur = Math.round(totalScore * eased);
                scoreEl.textContent = cur;
                badgeEl.textContent = cur;
                if (p < 1) requestAnimationFrame(animScore);
                else { scoreEl.textContent = totalScore; badgeEl.textContent = totalScore; }
            }
            requestAnimationFrame(animScore);
            // Store grade key for language switching, then translate
            var _gKey = _HS_GRADE_KEYS[grade] || 'rockstar';
            var _titleEl = document.getElementById('hs-grade-title');
            _titleEl.dataset.gradeKey = _gKey;
            document.getElementById('hs-grade-emoji').textContent = emoji;
            _titleEl.textContent = _t('hs.grade.' + _gKey);
            document.getElementById('hs-grade-desc').textContent  = _t('hs.desc.'  + _gKey);
            document.getElementById('hs-grade-badge').textContent = _t('hs.grade.' + _gKey);

            // Arc animation
            const arc = document.getElementById('hs-arc');
            const circumference = 2 * Math.PI * 52;
            const offset = circumference * (1 - totalScore / 100);
            arc.style.strokeDashoffset = offset;
            arc.style.stroke = arcColor;

            // ---- BREAKDOWN BARS ----
            const barsContainer = document.getElementById('hs-breakdown-bars');
            barsContainer.innerHTML = '';
            categories.forEach(cat => {
                const pct = (cat.pts / cat.max) * 100;
                barsContainer.innerHTML += `
                    <div>
                        <div class="flex items-center justify-between mb-1">
                            <span class="text-xs font-bold text-slate-600 flex items-center gap-1.5">${cat.icon} ${cat.name}</span>
                            <span class="text-xs font-black" style="color:${cat.color}">${cat.pts}/${cat.max}</span>
                        </div>
                        <div class="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                            <div class="h-2 rounded-full hs-bar-fill" style="width:0%;background:${cat.color};" data-target="${pct}"></div>
                        </div>
                        <div class="text-[10px] text-slate-400 mt-0.5 font-medium">${cat.desc}</div>
                    </div>`;
            });
            // Animate bars
            requestAnimationFrame(() => barsContainer.querySelectorAll('.hs-bar-fill').forEach(b => requestAnimationFrame(() => b.style.width = b.dataset.target + '%')));

            // ---- PIE CHART ----
            const remaining = Math.max(0, income - emi - expenses - savings);
            const pieData = [];
            const pieLabels = [];
            const pieColors = [];
            if (savings > 0)  { pieData.push(savings);  pieLabels.push(_t('hs.pie.savings')); pieColors.push('#10b981'); }
            if (emi > 0)      { pieData.push(emi);      pieLabels.push(_t('hs.pie.emi'));     pieColors.push('#ef4444'); }
            if (expenses > 0) { pieData.push(expenses); pieLabels.push(_t('hs.pie.exp'));     pieColors.push('#f97316'); }
            if (remaining > 0){ pieData.push(remaining);pieLabels.push(_t('hs.pie.cash'));    pieColors.push('#3b82f6'); }

            if (pieData.length > 0) {
                document.getElementById('hs-pie-empty').classList.add('hidden');
                document.getElementById('hs-pie-container').classList.remove('hidden');
                if (hsChartInstance) { hsChartInstance.destroy(); hsChartInstance = null; }
                const ctx = document.getElementById('hsChart').getContext('2d');
                hsChartInstance = new Chart(ctx, {
                    type: 'doughnut',
                    data: { labels: pieLabels, datasets: [{ data: pieData, backgroundColor: pieColors,
                        borderColor: '#fff', borderWidth: 3, hoverOffset: 10 }] },
                    options: {
                        responsive: true, maintainAspectRatio: true, cutout: '60%',
                        plugins: { legend: { display: false }, tooltip: {
                            callbacks: { label: ctx => {
                                const val = ctx.parsed;
                                const pct = ((val / income) * 100).toFixed(1);
                                return ` ₹${val.toLocaleString('en-IN')} (${pct}%)`;
                            }}
                        }},
                        animation: { animateRotate: true, duration: 900 }
                    }
                });
                // Legend
                const legend = document.getElementById('hs-pie-legend');
                legend.innerHTML = '';
                pieLabels.forEach((lbl, i) => {
                    const pct = ((pieData[i] / income) * 100).toFixed(1);
                    legend.innerHTML += `
                        <div class="flex items-center justify-between text-xs">
                            <div class="flex items-center gap-1.5">
                                <div class="w-2.5 h-2.5 rounded-full flex-shrink-0" style="background:${pieColors[i]};"></div>
                                <span class="font-medium text-slate-600">${lbl}</span>
                            </div>
                            <span class="font-black text-slate-700">${pct}%</span>
                        </div>`;
                });
            } else {
                document.getElementById('hs-pie-empty').classList.remove('hidden');
                document.getElementById('hs-pie-container').classList.add('hidden');
            }

            // ---- STATS STRIP ----
            const statsStrip = document.getElementById('hs-stats-strip');
            statsStrip.classList.remove('hidden');
            statsStrip.classList.remove('visible');
            void statsStrip.offsetWidth;
            statsStrip.classList.add('visible');
            document.getElementById('hs-stat-savings-pct').textContent = savingsRate.toFixed(1) + '%';
            document.getElementById('hs-stat-emi-pct').textContent = emiPct.toFixed(1) + '%';
            document.getElementById('hs-stat-ef-months').textContent = efMonths.toFixed(1);
            document.getElementById('hs-stat-term-mult').textContent = termMult.toFixed(1) + 'x';

            // ---- ACTION PLAN ----
            const actions = [];
            const worstCats = [...categories].sort((a,b) => (a.pts/a.max) - (b.pts/b.max));
            const actionMap = {
                'Savings Rate':      { tip: `Bump your SIP by just ₹${Math.round(income * 0.05 / 100) * 100}/month. Even 5% more = big difference in 10 years.`, color:'#10b981', icon:'💰' },
                'Debt Burden':       { tip: `EMIs above 30% are choking your wealth growth. Target prepaying the highest-interest loan first.`, color:'#ef4444', icon:'🏦' },
                'Health Insurance':  { tip: `Aim for at least ₹10L floater for a family. At ₹${Math.round(income*0.002/100)*100}/month, a super top-up makes it affordable.`, color:'#ec4899', icon:'🏥' },
                'Term Insurance':    { tip: `You need 10–15× your annual income in term cover. A ₹1Cr plan costs just ~₹500–800/month at your age.`, color:'#8b5cf6', icon:'🛡️' },
                'Emergency Fund':    { tip: `Build towards 6 months of expenses (₹${(monthlyExpenses*6).toLocaleString('en-IN')}). Park in a liquid MF or sweep FD.`, color:'#f59e0b', icon:'🚨' },
                'Spending Control':  { tip: `More than 70% of income is going to spend+EMI. Track expenses with apps like Walnut or Money Manager.`, color:'#f97316', icon:'🛒' },
                'Age Readiness':     { tip: age <= 35 ? `You're in the wealth-building window — increase SIP aggressively. Every 1% more now = massive corpus at 60.` : age <= 50 ? `Boost savings to 25–30% now. Consider NPS for the extra 80CCD(1B) deduction on top of 80C.` : `Prioritize debt freedom + NPS + PPF. Shift equity SIPs to a more balanced fund as you near retirement.`, color:'#6366f1', icon:'🎂' },
                'Net Worth Readiness': { tip: pfTotal === 0 ? `You haven't entered your savings yet! Add your MF, EPF, FD, gold and real estate values above to see your net worth health score.` : pfTotal > 0 && (pfEquity / pfTotal) < 0.2 ? `Your portfolio is too conservative — equity under 20%. Consider moving some FD/debt money to index funds for long-term inflation-beating growth.` : pfTotal > 0 && (pfEquity / pfTotal) > 0.8 ? `Over 80% in equity is high risk. Add some debt MF or PPF to balance volatility, especially if you're near a financial goal.` : `Diversify further. Aim for at least 3–4 asset classes: equity MF, debt MF/FD, gold (5–10%), and retiral corpus (EPF/PPF/NPS).`, color:'#0ea5e9', icon:'📊' },
            };

            document.getElementById('hs-actions-empty').classList.add('hidden');
            document.getElementById('hs-actions-list').classList.remove('hidden');
            const actList = document.getElementById('hs-actions-list');
            actList.innerHTML = '';
            let shown = 0;
            worstCats.forEach(cat => {
                if (shown >= 4) return;
                if (cat.pts < cat.max) {
                    const a = actionMap[cat.name];
                    var _catKey = _HS_CAT_KEYS[cat.name] || '';
                    var _catDisplay = _catKey ? _t('hs.cat.' + _catKey) : cat.name;
                    actList.innerHTML += `
                        <div class="flex items-start gap-2.5 p-3 rounded-xl border" style="background:${a.color}12;border-color:${a.color}30;">
                            <span class="text-base flex-shrink-0 mt-0.5">${a.icon}</span>
                            <div>
                                <div class="text-[11px] font-black uppercase tracking-wide mb-0.5" style="color:${a.color}">${_catDisplay}</div>
                                <div class="text-xs text-slate-600 leading-relaxed">${a.tip}</div>
                            </div>
                        </div>`;
                    shown++;
                }
            });
            if (shown === 0) {
                actList.innerHTML = `<div class="text-center py-6 text-emerald-500 font-bold text-sm">${_t('hs.crushing')}</div>`;
            }
            if (typeof saveUserData === 'function') saveUserData();
        }
        // ==================== END FINANCIAL HEALTH SCORE ====================