        // ==================== FINANCIAL PLAN ====================

        let fpState = {
            step: 1,
            goals: [],          // array of { type, emoji, label, targetAmt, years }
            existing: [],
            existingAmounts: {},  // key → current value in INR
            existingCustom:'',
            answers: {},
            planGenerated: false,
            // EPF-specific fields
            epfBasic: 0,        // monthly basic salary (for EPF auto-calc)
            epfMode: 'balance'  // 'balance' = user enters current balance | 'auto' = calc from basic
        };
        window._fpState = fpState;
        let fpDonutChart = null;

        const FP_GOAL_META = {
            retirement: { emoji:'🏖️', label:'Retirement',      defaultYrs: 25, color:'#6366f1' },
            home:       { emoji:'🏠', label:'Buy a Home',       defaultYrs: 7,  color:'#3b82f6' },
            education:  { emoji:'🎓', label:"Child's Education",defaultYrs: 10, color:'#8b5cf6' },
            wealth:     { emoji:'💰', label:'Wealth Creation',  defaultYrs: 15, color:'#10b981' },
            marriage:   { emoji:'💍', label:'Marriage',         defaultYrs: 5,  color:'#ec4899' },
            travel:     { emoji:'✈️', label:'Travel / Break',   defaultYrs: 3,  color:'#0ea5e9' },
            emergency:  { emoji:'🛡️', label:'Emergency Fund',   defaultYrs: 1,  color:'#f59e0b' },
            business:   { emoji:'🚀', label:'Start a Business', defaultYrs: 5,  color:'#ef4444' },
            custom:     { emoji:'✏️', label:'Custom Goal',      defaultYrs: 5,  color:'#64748b' }
        };

        const fpQuestions = [
            {
                id: 'q1', icon: '📉',
                text: 'Your investment drops 20% in a market crash. What do you do?',
                options: [
                    { pts: 0, label: "Sell immediately — I can't bear to watch it fall further" },
                    { pts: 1, label: 'Wait nervously and reassess in a few months' },
                    { pts: 2, label: 'Hold steady — markets recover over time' },
                    { pts: 3, label: 'Invest more — this is an opportunity!' }
                ]
            },
            {
                id: 'q2', icon: '💼',
                text: 'How stable and predictable is your monthly income?',
                options: [
                    { pts: 0, label: 'Very uncertain — freelance / gig work / irregular' },
                    { pts: 1, label: 'Mostly stable but sometimes variable' },
                    { pts: 2, label: 'Stable salary with occasional bonuses' },
                    { pts: 3, label: 'Very stable — government / senior role / multiple income streams' }
                ]
            },
            {
                id: 'q3', icon: '🧠',
                text: 'Which statement best describes your investing mindset?',
                options: [
                    { pts: 0, label: 'Preserve my capital above all — no losses please' },
                    { pts: 1, label: 'Slow and steady — small gains are fine' },
                    { pts: 2, label: 'Grow my wealth meaningfully over 5–10 years' },
                    { pts: 3, label: 'Maximise returns aggressively — I understand the risks' }
                ]
            },
            {
                id: 'q4', icon: '⏳',
                text: 'How long can you leave your money invested without touching it?',
                options: [
                    { pts: 0, label: 'Less than 2 years — might need it soon' },
                    { pts: 1, label: '2 to 5 years' },
                    { pts: 2, label: '5 to 10 years' },
                    { pts: 3, label: "More than 10 years — it's my long-term wealth" }
                ]
            },
            {
                id: 'q5', icon: '📊',
                text: 'What is your experience with investing?',
                options: [
                    { pts: 0, label: 'None — I mostly keep money in savings accounts' },
                    { pts: 1, label: 'Some — Fixed Deposits or recurring deposits only' },
                    { pts: 2, label: 'Moderate — SIPs, mutual funds, PPF' },
                    { pts: 3, label: 'Experienced — direct stocks, ETFs, active trading' }
                ]
            }
        ];

        const fpPortfolios = {
            conservative: {
                label: 'Conservative Investor', sub: 'Capital preservation with steady, low-risk growth',
                gradient: 'linear-gradient(135deg,#1e3a5f,#2563eb)', barColor: '#60a5fa',
                blendedReturn: 8.5,
                allocations: [
                    { name:'Large Cap Mutual Funds',  pct:20, color:'#3b82f6', icon:'📊', tip:'Low volatility blue-chip equity',            rate:12,  liquid:'medium',  when:'Long-term goals (7+ yrs)' },
                    { name:'PPF / Sukanya Samriddhi', pct:25, color:'#10b981', icon:'🔒', tip:'7.1% guaranteed, tax-free, 15-yr lock-in',   rate:7.1, liquid:'low',     when:'Retirement / education (lock-in applies)' },
                    { name:'Debt Mutual Funds',       pct:20, color:'#6366f1', icon:'🏛️', tip:'Stable returns, better than FD post-tax',   rate:7.5, liquid:'high',    when:'Medium-term goals (3–7 yrs)' },
                    { name:'Bank FD / RD',            pct:15, color:'#8b5cf6', icon:'🏦', tip:'Guaranteed returns, high liquidity',          rate:7.0, liquid:'high',    when:'Short-term goals (1–5 yrs)' },
                    { name:'Gold ETF / Gold Fund',    pct:10, color:'#f59e0b', icon:'🥇', tip:'Inflation hedge — Nippon/Mirae Gold ETF FoF', rate:10,  liquid:'high',    when:'Crisis hedge — redeem last' },
                    { name:'Liquid Fund',             pct:10, color:'#64748b', icon:'💧', tip:'Park your emergency buffer here',             rate:6.5, liquid:'instant', when:'Emergency / near-term needs' }
                ],
                roadmap: [
                    { icon:'🔒', title:'Start PPF immediately',      desc:'Open a PPF account and invest Rs.1,500/month minimum. Tax-free at maturity + 80C benefit.',      color:'#10b981' },
                    { icon:'📊', title:'SIP in 1–2 Large Cap Funds', desc:'Start with a Nifty 100 index fund or HDFC Top 100. Keep it simple, consistent, long-term.',      color:'#3b82f6' },
                    { icon:'🏦', title:'Ladder your FDs',            desc:'Instead of one large FD, create 3–6 month staggered FDs for better liquidity.',                  color:'#8b5cf6' },
                    { icon:'🥇', title:'SIP into Gold ETF monthly',  desc:'Buy Nippon India Gold ETF FoF or Mirae Asset Gold Fund. No storage risk, no making charges.',   color:'#f59e0b' }
                ]
            },
            moderate: {
                label: 'Moderate Investor', sub: 'Balanced growth — wealth building with managed risk',
                gradient: 'linear-gradient(135deg,#064e3b,#0d9488)', barColor: '#34d399',
                blendedReturn: 10.5,
                allocations: [
                    { name:'Large Cap Mutual Funds',  pct:28, color:'#3b82f6', icon:'📊', tip:'Core equity holding, lower volatility',       rate:12,  liquid:'medium',  when:'Long-term goals (7+ yrs)' },
                    { name:'Mid Cap Mutual Funds',    pct:15, color:'#6366f1', icon:'📈', tip:'Higher growth potential over 5+ years',       rate:14,  liquid:'medium',  when:'Long-term goals (8+ yrs)' },
                    { name:'ELSS / Tax Saving Funds', pct:10, color:'#8b5cf6', icon:'🎯', tip:'Equity + 80C benefit, 3-yr lock-in',          rate:13,  liquid:'low',     when:'Post 3-yr lock-in, long-term' },
                    { name:'PPF / NPS Tier-I',        pct:15, color:'#10b981', icon:'🔒', tip:'Tax-efficient long-term debt anchor',          rate:7.5, liquid:'low',     when:'Retirement corpus only' },
                    { name:'Debt Mutual Funds',       pct:15, color:'#0ea5e9', icon:'🏛️', tip:'Stability buffer within the portfolio',       rate:7.5, liquid:'high',    when:'Medium-term goals (3–7 yrs)' },
                    { name:'Gold ETF / Gold Fund',    pct:10, color:'#f59e0b', icon:'🥇', tip:'Inflation hedge — Nippon/Mirae Gold ETF FoF', rate:10,  liquid:'high',    when:'Crisis hedge — redeem last' },
                    { name:'Liquid Fund',             pct: 7, color:'#64748b', icon:'💧', tip:'Minimum 3–6 months of expenses',              rate:6.5, liquid:'instant', when:'Emergency / near-term needs' }
                ],
                roadmap: [
                    { icon:'🎯', title:'Max out 80C with ELSS',         desc:'Invest Rs.1.5L/year in ELSS — save up to Rs.46,800 in taxes while building equity.',         color:'#8b5cf6' },
                    { icon:'📈', title:'Add Mid Cap SIP after 6 months', desc:'Once large cap SIP is stable, add mid cap exposure. Stay for 7+ years.',                     color:'#6366f1' },
                    { icon:'🛡️', title:'Open NPS for extra tax benefit', desc:'NPS gives Rs.50,000 extra deduction under 80CCD(1B) beyond the 80C limit.',                 color:'#10b981' },
                    { icon:'🥇', title:'SIP into Gold ETF each month',   desc:'Nippon India or Mirae Asset Gold ETF FoF. Treat as portfolio insurance, not speculation.',   color:'#f59e0b' }
                ]
            },
            moderateAggressive: {
                label: 'Moderately Aggressive', sub: 'Growth-oriented — equity heavy, long investment horizon',
                gradient: 'linear-gradient(135deg,#7c2d12,#ea580c)', barColor: '#fb923c',
                blendedReturn: 12.5,
                allocations: [
                    { name:'Large Cap Mutual Funds',    pct:25, color:'#3b82f6', icon:'📊', tip:'Stable backbone of your equity portfolio', rate:12,  liquid:'medium',  when:'Long-term goals (7+ yrs)' },
                    { name:'Mid Cap Mutual Funds',      pct:20, color:'#6366f1', icon:'📈', tip:'12–15% returns historically over 10yr',   rate:14,  liquid:'medium',  when:'Long-term goals (8+ yrs)' },
                    { name:'Small Cap Mutual Funds',    pct:12, color:'#a855f7', icon:'🚀', tip:'High risk, high reward — stay 10+ years', rate:16,  liquid:'medium',  when:'Only for goals 10+ yrs away' },
                    { name:'ELSS / Flexi Cap Funds',    pct:13, color:'#8b5cf6', icon:'🎯', tip:'Flexibility across market caps + tax save', rate:13, liquid:'low',     when:'Post 3-yr lock-in, long-term' },
                    { name:'NPS (Tier-I Equity)',       pct:10, color:'#10b981', icon:'🛡️', tip:'Pension + 80CCD extra deduction',         rate:12,  liquid:'low',     when:'Retirement only — long lock-in' },
                    { name:'Debt / Hybrid Fund',        pct:10, color:'#0ea5e9', icon:'🏛️', tip:'Reduces overall portfolio volatility',    rate:8,   liquid:'high',    when:'Medium-term goals (3–8 yrs)' },
                    { name:'Gold ETF / Gold Fund',      pct: 5, color:'#f59e0b', icon:'🥇', tip:'Crisis hedge — Nippon/Mirae Gold ETF FoF', rate:10, liquid:'high',    when:'Crisis hedge — redeem last' },
                    { name:'Liquid Fund',               pct: 5, color:'#64748b', icon:'💧', tip:'Minimum 3 months emergency corpus',       rate:6.5, liquid:'instant', when:'Emergency / near-term needs' }
                ],
                roadmap: [
                    { icon:'🚀', title:'Build a Core-Satellite SIP portfolio', desc:'Core: 50% in large cap. Satellite: 30% mid + 20% small cap. Rebalance yearly.', color:'#6366f1' },
                    { icon:'🛡️', title:'Max NPS for dual tax benefits',        desc:'Invest Rs.2L/year in NPS — get 80C + extra 80CCD(1B) deductions simultaneously.', color:'#10b981' },
                    { icon:'📊', title:'Use index funds for large cap',         desc:'Nifty 50 index funds beat 80% of active large cap funds at a fraction of the cost.', color:'#3b82f6' },
                    { icon:'⚖️', title:'Annual rebalancing is key',            desc:'Once a year, bring your portfolio back to target allocation. Sell high, buy low.', color:'#ea580c' }
                ]
            },
            aggressive: {
                label: 'Aggressive Investor', sub: 'Maximum wealth creation — high risk, high conviction',
                gradient: 'linear-gradient(135deg,#4c1d95,#7c3aed)', barColor: '#a78bfa',
                blendedReturn: 13.5,
                allocations: [
                    { name:'Large Cap / Index Funds',       pct:22, color:'#3b82f6', icon:'📊', tip:'Cost-efficient core equity allocation',    rate:12,  liquid:'medium',  when:'Long-term goals (7+ yrs)' },
                    { name:'Mid Cap Mutual Funds',          pct:20, color:'#6366f1', icon:'📈', tip:'High alpha potential, 7–10yr horizon',     rate:14,  liquid:'medium',  when:'Long-term goals (8+ yrs)' },
                    { name:'Small Cap Mutual Funds',        pct:18, color:'#a855f7', icon:'🚀', tip:'Aggressive growth, stay invested 10+ yrs', rate:16,  liquid:'medium',  when:'Only for goals 10+ yrs away' },
                    { name:'Direct Stocks / Sectoral ETFs', pct:15, color:'#ec4899', icon:'🎯', tip:'Research-backed concentrated bets',        rate:15,  liquid:'high',    when:'Long-term + tactical rebalancing' },
                    { name:'ELSS / International Funds',   pct:10, color:'#8b5cf6', icon:'🌐', tip:'Diversify globally + save tax with ELSS',  rate:12,  liquid:'low',     when:'Long-term, post lock-in' },
                    { name:'NPS (Tier-I, Equity heavy)',   pct: 8, color:'#10b981', icon:'🛡️', tip:'Tax-efficient retirement anchor',          rate:12,  liquid:'low',     when:'Retirement only — long lock-in' },
                    { name:'Gold ETF / Gold Fund',         pct: 4, color:'#f59e0b', icon:'🥇', tip:'Minimal crisis hedge — Nippon/Mirae Gold ETF', rate:10, liquid:'high', when:'Crisis hedge — redeem last' },
                    { name:'Liquid Fund',                  pct: 3, color:'#64748b', icon:'💧', tip:'Keep bare minimum liquid for safety',       rate:6.5, liquid:'instant', when:'Emergency / near-term needs' }
                ],
                roadmap: [
                    { icon:'🎯', title:'Pick direct stocks with conviction',   desc:'Limit direct stock picks to 8–12 companies you understand deeply. Max 15% of portfolio.', color:'#ec4899' },
                    { icon:'🌐', title:'Add international exposure',           desc:'Invest in Nasdaq or S&P 500 index fund through Motilal Oswal or Mirae for global diversification.', color:'#8b5cf6' },
                    { icon:'⚡', title:'Deploy capital during corrections',    desc:'Keep a 10% cash war chest ready to deploy aggressively in market downturns.', color:'#a855f7' },
                    { icon:'📚', title:'Track and learn continuously',         desc:'Read annual reports, study businesses. The more you know, the better your returns.', color:'#6366f1' }
                ]
            }
        };

        // ---- Multi-goal tile toggle ----
        // Restore goal tile visual state from fpState.goals after a page reload.
        // Called by loadUserData once the state has been re-applied to window._fpState.
        function fpRestoreGoalTiles() {
            // 1. Clear all active visual states first
            document.querySelectorAll('.fp-goal-tile').forEach(function(btn) {
                btn.classList.remove('fp-goal-tile-active');
            });
            // 2. Re-apply active state for every goal that was saved
            if (!window._fpState) return;
            window._fpState.goals.forEach(function(g) {
                var tile = document.querySelector('.fp-goal-tile[data-goal="' + g.type + '"]');
                if (tile) tile.classList.add('fp-goal-tile-active');
            });
            // 3. Rebuild the goal detail cards (target amounts, horizons, custom names)
            if (typeof fpRenderGoalCards === 'function') fpRenderGoalCards();
        }

                function fpToggleGoalTile(btn, type, emoji, label) {
            var meta = FP_GOAL_META[type];
            var isActive = btn.classList.contains('fp-goal-tile-active');
            // Flip animation
            btn.classList.remove('flip-anim');
            void btn.offsetWidth; // reflow
            btn.classList.add('flip-anim');
            btn.addEventListener('animationend', function() { btn.classList.remove('flip-anim'); }, { once: true });
            if (isActive) {
                btn.classList.remove('fp-goal-tile-active');
                fpState.goals = fpState.goals.filter(function(g){ return g.type !== type; });
            } else {
                btn.classList.add('fp-goal-tile-active');
                // Guard: only push if this type isn't already in the list (prevents
                // duplicates if tiles somehow get clicked while state is out of sync)
                if (!fpState.goals.some(function(g){ return g.type === type; })) {
                    fpState.goals.push({ type: type, emoji: meta.emoji, label: meta.label, targetAmt: '', years: meta.defaultYrs });
                }
            }
            fpRenderGoalCards();
            fpLiveUpdate();
        }

        function fpRenderGoalCards() {
            var container = document.getElementById('fp-goal-details');
            var cardsDiv  = document.getElementById('fp-goal-cards');
            if (!container || !cardsDiv) return;
            if (fpState.goals.length === 0) { container.classList.add('hidden'); return; }
            container.classList.remove('hidden');
            cardsDiv.innerHTML = '';
            var _fpProfileGoals = (window._userProfile && window._userProfile.profileGoals) || [];
            fpState.goals.forEach(function(g, i) {
                var meta = FP_GOAL_META[g.type];
                var card = document.createElement('div');
                card.className = 'fp-goal-card';
                var horizClass = g.years <= 4 ? 'text-red-500' : g.years <= 10 ? 'text-amber-500' : 'text-emerald-600';
                var horizLabel = g.years <= 4 ? 'Short-term' : g.years <= 10 ? 'Medium-term' : 'Long-term';
                // Format stored raw number for display
                var displayAmt = '';
                if (g.targetAmt && g.targetAmt !== '') {
                    var raw = parseInt((g.targetAmt + '').replace(/,/g,''), 10);
                    if (!isNaN(raw)) displayAmt = new Intl.NumberFormat('en-IN').format(raw);
                }
                var _fpLabel   = g.customName || meta.label;
                var _fpPinned  = _fpProfileGoals.some(function(pg){ return pg.label === _fpLabel && pg.source === 'fin_plan'; });
                var _fpPinBtn  = _fpPinned
                    ? '<button onclick="event.stopPropagation();fpToggleGoalProfile(' + i + ')" class="flex items-center gap-0.5 text-[9px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 transition-all" style="background:linear-gradient(130deg,#f5c842,#e8a44a);color:#5c3d00;border:none;" title="Remove from My Profile"><span>●</span> My Profile</button>'
                    : '<button onclick="event.stopPropagation();fpToggleGoalProfile(' + i + ')" class="flex items-center gap-0.5 text-[9px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 transition-all" style="background:transparent;color:#94a3b8;border:1px solid #e2e8f0;" title="Save to My Profile"><span>○</span> My Profile</button>';
                card.innerHTML =
                    '<div class="fp-goal-card-header" onclick="fpToggleCardBody(this)">' +
                        '<div class="flex items-center gap-2">' +
                            '<span class="text-base">' + meta.emoji + '</span>' +
                            '<div>' +
                                '<div class="text-xs font-black text-slate-700">' + _fpLabel + '</div>' +
                                '<div class="text-[10px] ' + horizClass + ' font-bold" id="fp-horiz-label-' + i + '">' + horizLabel + ' · ' + g.years + ' yrs</div>' +
                            '</div>' +
                        '</div>' +
                        '<div class="flex items-center gap-1.5">' +
                            _fpPinBtn +
                            '<svg class="fp-card-chevron w-4 h-4 text-slate-400 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>' +
                        '</div>' +
                    '</div>' +
                    '<div class="fp-goal-card-body">' +
                        '<div>' +
                            '<div class="fp-mini-label">Target Amount (₹)</div>' +
                            '<div class="relative">' +
                                '<span style="position:absolute;left:8px;top:50%;transform:translateY(-50%);font-size:0.75rem;font-weight:700;color:#94a3b8;pointer-events:none;">₹</span>' +
                                '<input type="text" class="fp-mini-input" inputmode="numeric" placeholder="e.g. 50,00,000" value="' + displayAmt + '" ' +
                                    'style="padding-left:1.5rem;" ' +
                                    'id="fp-amt-input-' + i + '" ' +
                                    'oninput="fpFormatGoalAmt(this,' + i + ')">' +
                            '</div>' +
                        '</div>' +
                        '<div>' +
                            '<div class="fp-mini-label">Years to Achieve</div>' +
                            '<div class="relative">' +
                                '<input type="number" class="fp-mini-input" min="1" max="40" placeholder="yrs" value="' + g.years + '" ' +
                                    'id="fp-yrs-input-' + i + '" ' +
                                    'oninput="fpUpdateGoalYears(' + i + ',this.value)">' +
                                '<span style="position:absolute;right:8px;top:50%;transform:translateY(-50%);font-size:0.65rem;font-weight:700;color:#94a3b8;pointer-events:none;">yrs</span>' +
                            '</div>' +
                        '</div>' +
                        (g.type === 'custom' ?
                        '<div class="col-span-2">' +
                            '<div class="fp-mini-label">Goal Name</div>' +
                            '<input type="text" class="fp-mini-input" placeholder="e.g. Dream car" value="' + (g.customName||'') + '" ' +
                                'oninput="fpUpdateGoal(' + i + ',\'customName\',this.value); fpLiveUpdate(); document.querySelector(\'#fp-horiz-label-' + i + '\').previousElementSibling && (document.getElementById(\'fp-goal-cards\').querySelectorAll(\'.text-xs.font-black\')[' + i + '].textContent = this.value || \'Custom Goal\')">' +
                        '</div>' : '') +
                    '</div>';
                cardsDiv.appendChild(card);
            });
        }

        function fpToggleCardBody(header) {
            var body = header.nextElementSibling;
            var chevron = header.querySelector('.fp-card-chevron');
            var isOpen = body.style.display !== 'none';
            body.style.display = isOpen ? 'none' : 'grid';
            if (chevron) chevron.style.transform = isOpen ? '' : 'rotate(180deg)';
        }

        function fpUpdateGoal(idx, key, val) {
            if (fpState.goals[idx]) fpState.goals[idx][key] = val;
            fpLiveUpdate();
        }

        // Format target amount with Indian comma system live while typing
        function fpFormatGoalAmt(el, idx) {
            var raw = el.value.replace(/[^0-9]/g, '');
            if (!raw) { el.value = ''; fpUpdateGoal(idx, 'targetAmt', ''); return; }
            var num = parseInt(raw, 10);
            el.value = new Intl.NumberFormat('en-IN').format(num);
            // Put cursor at end
            var pos = el.value.length;
            if (el.setSelectionRange) { setTimeout(function(){ el.setSelectionRange(pos,pos); },0); }
            fpUpdateGoal(idx, 'targetAmt', raw);
        }

        // Update years + refresh the horizon label inside the card header live
        function fpUpdateGoalYears(idx, val) {
            var yrs = parseInt(val) || 1;
            fpUpdateGoal(idx, 'years', yrs);
            // Update the sub-label in the card header without full re-render
            var lbl = document.getElementById('fp-horiz-label-' + idx);
            if (lbl) {
                var hClass = yrs <= 4 ? 'text-red-500' : yrs <= 10 ? 'text-amber-500' : 'text-emerald-600';
                var hText  = yrs <= 4 ? 'Short-term' : yrs <= 10 ? 'Medium-term' : 'Long-term';
                lbl.className = 'text-[10px] ' + hClass + ' font-bold';
                lbl.textContent = hText + ' · ' + yrs + ' yrs';
            }
        }

        // ---- Risk questions ----
        function fpInitQuestions() {
            var qContainer = document.getElementById('fp-questions-container');
            if (!qContainer) return;
            qContainer.innerHTML = '';
            fpQuestions.forEach(function(q, qi) {
                var div = document.createElement('div');
                div.className = 'space-y-2';
                div.innerHTML = '<p class="text-sm font-bold text-slate-700 flex items-start gap-2"><span>' + q.icon + '</span><span>Q' + (qi+1) + '. ' + q.text + '</span></p>' +
                    '<div class="space-y-1" style="gap:6px;display:flex;flex-direction:column;">' +
                    q.options.map(function(opt, oi) {
                        var sel = fpState.answers[q.id] === oi ? 'fp-q-selected' : '';
                        return '<div class="fp-q-option ' + sel + '" onclick="fpSelectAnswer(\'' + q.id + '\',' + oi + ',' + opt.pts + ',this)"><div class="fp-q-radio"></div><span class="text-xs font-semibold text-slate-600 leading-relaxed">' + opt.label + '</span></div>';
                    }).join('') + '</div>';
                qContainer.appendChild(div);
            });
        }

        function fpSelectAnswer(qId, optIdx, pts, el) {
            el.parentElement.querySelectorAll('.fp-q-option').forEach(function(o){ o.classList.remove('fp-q-selected'); });
            el.classList.add('fp-q-selected');
            fpState.answers[qId] = optIdx;
            fpState.answers[qId + '_pts'] = pts;
        }

        // kept for compatibility — no longer used for single select
        function fpSelectGoal(btn, goal) { fpToggleGoalTile(btn, goal, FP_GOAL_META[goal].emoji, FP_GOAL_META[goal].label); }

        function fpSelectHorizon(btn, yrs) {
            document.querySelectorAll('.fp-horizon-btn').forEach(function(b){ b.classList.remove('fp-horizon-active'); });
            btn.classList.add('fp-horizon-active');
            fpState.horizon = yrs;
            fpLiveUpdate();
        }

        const FP_EXISTING_META = {
            epf:         { icon:'🏢', label:'EPF Balance',      returnRate: 8.25, liquid: 'low',    risk: 'Low', isEpf: true },
            fd:          { icon:'🏦', label:'FD / RD',         returnRate: 7,   liquid: 'medium', risk: 'Low' },
            mf:          { icon:'📊', label:'Mutual Funds',    returnRate: 12,  liquid: 'high',   risk: 'Med–High' },
            ppf:         { icon:'🔒', label:'PPF',             returnRate: 7.1, liquid: 'low',    risk: 'Low' },
            gold:        { icon:'🥇', label:'Gold / Gold ETF', returnRate: 9,   liquid: 'high',   risk: 'Low–Med' },
            stocks:      { icon:'📈', label:'Stocks',          returnRate: 13,  liquid: 'high',   risk: 'High' },
            nps:         { icon:'🛡️', label:'NPS',             returnRate: 10,  liquid: 'low',    risk: 'Med' },
            real_estate: { icon:'🏘️', label:'Real Estate',    returnRate: 8,   liquid: 'low',    risk: 'Med' },
            crypto:      { icon:'₿',  label:'Crypto / VDA',  returnRate: 15,  liquid: 'high',   risk: 'Extreme', isCrypto: true, grossReturn: 15, effectiveReturn: 10.5, taxNote: '30% flat tax + 1% TDS on every gain. No loss set-off. Post-tax ~10.5% if gross 15%.' },
            scss:        { icon:'👴', label:'SCSS',             returnRate: 8.2, liquid: 'low',    risk: 'Low', note: 'Senior Citizen Savings Scheme — 60+ only. Best guaranteed rate.' },
            pomis:       { icon:'📬', label:'POMIS',            returnRate: 7.4, liquid: 'low',    risk: 'Low', note: 'Post Office Monthly Income Scheme. Monthly payout.' },
            kvp:         { icon:'🌾', label:'KVP',              returnRate: 7.5, liquid: 'low',    risk: 'Low', note: 'Kisan Vikas Patra — doubles in ~9.5 yrs.' },
            rbi_frb:     { icon:'🏛️', label:'RBI FRB',          returnRate: 7.35,liquid: 'low',    risk: 'Low', note: 'RBI Floating Rate Bonds — rate resets every 6 months.' },
            nsc:         { icon:'📜', label:'NSC',              returnRate: 7.7, liquid: 'low',    risk: 'Low', note: 'National Savings Certificate — 80C, 5yr lock-in.' },
            custom_inv:  { icon:'✏️', label:'Other',           returnRate: 8,   liquid: 'medium', risk: 'Varies' }
        };

        function fpRenderExistingAmounts() {
            var container = document.getElementById('fp-existing-amounts');
            if (!container) return;
            if (fpState.existing.length === 0) {
                container.classList.add('hidden');
                container.innerHTML = '<p class="text-[10px] text-slate-400 font-semibold uppercase tracking-wide">' + _t('fp.existing.label') + '</p>';
                return;
            }
            container.classList.remove('hidden');
            var rows = '<p class="text-[10px] text-slate-400 font-semibold uppercase tracking-wide">' + _t('fp.existing.label') + '</p>';
            fpState.existing.forEach(function(key) {
                var meta = FP_EXISTING_META[key] || { icon:'💼', label: key };
                var val = fpState.existingAmounts[key] || 0;
                var display = val > 0 ? val.toLocaleString('en-IN') : '';
                var isCrypto  = (key === 'crypto');
                var isScss    = (key === 'scss');
                var hasNote   = meta.note && !isCrypto;
                var bgClass   = isCrypto  ? 'bg-amber-50 border border-amber-200'
                              : isScss    ? 'bg-emerald-50 border border-emerald-200'
                              : 'bg-slate-50 border border-slate-200';
                var textClass = isCrypto  ? 'text-amber-800'
                              : isScss    ? 'text-emerald-800'
                              : 'text-slate-700';
                rows += '<div class="flex items-center gap-2.5 rounded-xl px-3 py-2 ' + bgClass + '">' +
                    '<span class="text-base flex-shrink-0">' + meta.icon + '</span>' +
                    '<span class="text-xs font-bold flex-1 min-w-0 ' + textClass + '">' + meta.label +
                        (isCrypto ? '<span class="block text-[9px] font-semibold text-amber-600 leading-tight">30% flat tax · 1% TDS · no loss set-off</span>' : '') +
                        (hasNote  ? '<span class="block text-[9px] font-semibold leading-tight" style="color:#64748b;">' + meta.note + '</span>' : '') +
                    '</span>' +
                    '<div class="relative flex-shrink-0">' +
                        '<span class="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold pointer-events-none">₹</span>' +
                        '<input type="text" inputmode="numeric" placeholder="0" value="' + display + '"' +
                            ' class="fp-mini-input pl-5 w-32 text-right"' +
                            ' oninput="fpUpdateExistingAmt(this,\'' + key + '\')">' +
                    '</div>' +
                '</div>';
            });
            container.innerHTML = rows;
        }

        function fpUpdateExistingAmt(input, key) {
            var raw = (input.value || '').replace(/,/g, '').replace(/[^\d]/g, '');
            var num = parseInt(raw) || 0;
            fpState.existingAmounts[key] = num;
            // Re-format with Indian comma separators while preserving cursor
            var formatted = raw.length > 0 ? Number(raw).toLocaleString('en-IN') : '';
            var cursorFromEnd = input.value.length - input.selectionEnd;
            input.value = formatted;
            var newCursor = formatted.length - cursorFromEnd;
            if (newCursor < 0) newCursor = 0;
            input.setSelectionRange(newCursor, newCursor);
            fpLiveUpdate();
        }

        function fpGetTotalExistingCorpus() {
            return Object.values(fpState.existingAmounts).reduce(function(s, v) { return s + (v || 0); }, 0);
        }

        function fpGetWeightedExistingReturn() {
            // Weighted average return rate across existing investments by value
            // For crypto, use effectiveReturn (post-tax ~10.5%) not gross 15%
            // to avoid inflating the blended portfolio projection
            var total = 0, weightedSum = 0;
            fpState.existing.forEach(function(key) {
                var val = fpState.existingAmounts[key] || 0;
                var meta = FP_EXISTING_META[key];
                if (meta && val > 0) {
                    var rate = (meta.isCrypto && meta.effectiveReturn) ? meta.effectiveReturn : meta.returnRate;
                    weightedSum += val * rate;
                    total += val;
                }
            });
            return total > 0 ? (weightedSum / total) : 0;
        }

        function fpToggleExisting(btn, key) {
            btn.classList.toggle('fp-existing-active');
            var idx = fpState.existing.indexOf(key);
            if (idx === -1) {
                fpState.existing.push(key);
            } else {
                fpState.existing.splice(idx, 1);
                delete fpState.existingAmounts[key];
            }
            if (key === 'custom_inv') {
                var inp = document.getElementById('fp-existing-custom-input');
                if (inp) inp.classList.toggle('hidden', !btn.classList.contains('fp-existing-active'));
            }
            if (key === 'epf') {
                var epfPanel = document.getElementById('fp-epf-panel');
                if (epfPanel) epfPanel.classList.toggle('hidden', !btn.classList.contains('fp-existing-active'));
            }
            if (key === 'crypto') {
                var cryptoActiveEl = document.getElementById('fp-crypto-active');
                if (cryptoActiveEl && !btn.classList.contains('fp-existing-active')) {
                    cryptoActiveEl.classList.add('hidden');
                }
            }
            fpRenderExistingAmounts();
            fpLiveUpdate();
        }

        /* ── Crypto explicit opt-in flow ── */
        function fpCryptoToggle(btn) {
            // If already active, toggle off
            if (btn.classList.contains('fp-existing-active')) {
                fpToggleExisting(btn, 'crypto');
                var active = document.getElementById('fp-crypto-active');
                if (active) active.classList.add('hidden');
                return;
            }
            // Show modal popup for risk confirmation
            var modal = document.getElementById('fp-crypto-modal');
            if (modal) modal.style.display = 'flex';
        }

        function fpCryptoConfirm() {
            // Close modal, add crypto to plan
            var modal  = document.getElementById('fp-crypto-modal');
            var active = document.getElementById('fp-crypto-active');
            if (modal)  modal.style.display = 'none';
            if (active) active.classList.remove('hidden');
            var btn = document.getElementById('fp-existing-crypto-btn');
            if (btn && !btn.classList.contains('fp-existing-active')) {
                btn.classList.add('fp-existing-active');
                fpState.existing.push('crypto');
                fpRenderExistingAmounts();
                fpLiveUpdate();
            }
        }

        function fpCryptoCancel() {
            // Close modal, keep crypto out of plan
            var modal = document.getElementById('fp-crypto-modal');
            if (modal) modal.style.display = 'none';
        }

        function fpFormatEpfInput(el) {
            var raw = (el.value || '').replace(/[^0-9]/g, '');
            if (raw) el.value = Number(raw).toLocaleString('en-IN');
            else el.value = '';
        }

        function fpEpfSync() {
            // Read balance field and push into existingAmounts
            var balRaw = (document.getElementById('fp-epf-balance')?.value || '').replace(/[^0-9]/g,'');
            var bal    = parseInt(balRaw) || 0;
            var basicRaw = (document.getElementById('fp-epf-basic')?.value || '').replace(/[^0-9]/g,'');
            var basic  = parseInt(basicRaw) || 0;

            fpState.epfBasic = basic;
            fpState.existingAmounts['epf'] = bal;

            // Update summary chip
            var summary = document.getElementById('fp-epf-summary');
            if (summary) {
                var lines = [];
                if (bal > 0) lines.push('💰 Current EPF corpus: ₹' + bal.toLocaleString('en-IN'));
                if (basic > 0) {
                    var emplEpf  = Math.round(basic * 0.12);
                    var empEpf   = Math.round(basic * 0.12);      // employee 12%
                    var eps      = Math.min(1250, Math.round(basic * 0.0833)); // EPS capped at ₹1,250
                    var erEpf    = emplEpf - eps;                  // actual EPF from employer side
                    var monthly  = empEpf + erEpf;                  // total into EPF a/c
                    lines.push('📥 Monthly EPF deposit: ₹' + monthly.toLocaleString('en-IN') + '/mo');
                    lines.push('   (You: ₹' + empEpf.toLocaleString('en-IN') + ' + Employer EPF: ₹' + erEpf.toLocaleString('en-IN') + ' | EPS pension: ₹' + eps.toLocaleString('en-IN') + ')');
                }
                if (lines.length > 0) {
                    summary.innerHTML = lines.join('<br>');
                    summary.classList.remove('hidden');
                } else {
                    summary.classList.add('hidden');
                }
            }
            fpLiveUpdate();
        }

        function fpGoStep(n) {
            if (n === 2) {
                var age = parseInt(document.getElementById('fp-age').value);
                var income = document.getElementById('fp-income').value.replace(/,/g,'');
                if (!age || age < 18 || age > 80) { alert('Please enter a valid age (18–80).'); return; }
                if (!income || parseInt(income) < 1000) { alert('Please enter your monthly income.'); return; }
                gpRenderSavedGoalsBanner();
            }
            if (n === 3 && fpState.goals.length === 0) { alert('Please select at least one financial goal.'); return; }
            fpState.step = n;
            [1,2,3].forEach(function(s) {
                var el = document.getElementById('fp-step-' + s); if (el) el.classList.toggle('hidden', s !== n);
            });
            [1,2,3,4].forEach(function(s) {
                var dot = document.querySelector('#fp-step-badge [data-s="' + s + '"]'); if (!dot) return;
                dot.className = 'fp-step-dot ' + (s < n ? 'fp-dot-done' : s === n ? 'fp-dot-active' : 'fp-dot-inactive');
            });
            fpUpdateTabNav(n);
            if (n === 3) fpInitRiskStep();
        }

        /* ---- Tab Navigation: allows free movement between steps ---- */
        function fpNavTab(n) {
            // Going backward: always allow
            // Going forward: validate required steps
            if (n > 1) {
                var age = parseInt(document.getElementById('fp-age').value);
                var income = document.getElementById('fp-income').value.replace(/,/g,'');
                if (!age || age < 18 || age > 80 || !income || parseInt(income) < 1000) {
                    alert('Please complete your Personal Profile first (age + income).'); fpGoStep(1); return;
                }
            }
            if (n === 2) gpRenderSavedGoalsBanner();
            if (n >= 3 && fpState.goals.length === 0) {
                alert('Please select at least one financial goal first.'); fpGoStep(2); return;
            }
            if (n === 3) {
                // If risk profile already saved, skip questionnaire — go straight to plan
                var savedRisk = fpLoadRiskScore();
                if (savedRisk && !fpState._editingRisk) {
                    fpInitRiskStep(); // show saved summary
                    // Show step 3 panel so user sees their profile, then auto-advance hint
                    [1,2,3].forEach(function(s){
                        var el = document.getElementById('fp-step-' + s);
                        if (el) el.classList.toggle('hidden', s !== 3);
                    });
                    [1,2,3,4].forEach(function(s){
                        var dot = document.querySelector('#fp-step-badge [data-s="' + s + '"]');
                        if (!dot) return;
                        dot.className = 'fp-step-dot ' + (s < 3 ? 'fp-dot-done' : s === 3 ? 'fp-dot-active' : 'fp-dot-inactive');
                    });
                    fpUpdateTabNav(3);
                    return;
                }
            }
            if (n === 4) {
                // Generate plan: must have risk answers OR a saved score
                var savedRisk = fpLoadRiskScore();
                var answeredAll = fpQuestions.every(function(q){ return fpState.answers[q.id] !== undefined; });
                if (!answeredAll && !savedRisk) {
                    alert('Please complete the Risk Assessment first.'); fpGoStep(3); return;
                }
                fpCalculatePlan(); return;
            }
            // If results are visible and user clicks step 1/2/3, hide results and go to that step
            if (fpState.planGenerated) {
                var rc = document.getElementById('fp-results-card');
                var rp = document.getElementById('fp-results-placeholder');
                if (rc) rc.classList.add('hidden');
                if (rp) rp.classList.remove('hidden');
                fpState.planGenerated = false;
                // Restore two-column layout
                var leftCol  = document.getElementById('fp-left-col');
                var rightCol = document.getElementById('fp-right-col');
                if (leftCol)  leftCol.classList.remove('hidden');
                if (rightCol) { rightCol.classList.add('lg:w-1/2'); rightCol.classList.remove('w-full'); }
            }
            fpGoStep(n);
        }

        function fpUpdateTabNav(n) {
            [1,2,3].forEach(function(s) {
                var btn = document.getElementById('fp-tab-' + s);
                if (!btn) return;
                btn.className = btn.className.replace(/fp-tab-(active|inactive|done)-pill/g, '');
                if (s < n) {
                    btn.classList.add('fp-tab-done-pill');
                    // Show check in dot
                    var dot = btn.querySelector('.fp-tab-dot');
                    if (dot) dot.textContent = '✓';
                } else if (s === n) {
                    btn.classList.add('fp-tab-active-pill');
                    var dot = btn.querySelector('.fp-tab-dot');
                    if (dot) dot.textContent = s;
                } else {
                    btn.classList.add('fp-tab-inactive-pill');
                    var dot = btn.querySelector('.fp-tab-dot');
                    if (dot) dot.textContent = s;
                }
            });
            // Tab 4 (Generate) gets active highlight only when plan is generated
            var tab4 = document.getElementById('fp-tab-4');
            if (tab4) {
                tab4.className = tab4.className.replace(/fp-tab-(active|inactive|done)-pill/g, '');
                tab4.classList.add(fpState.planGenerated ? 'fp-tab-done-pill' : 'fp-tab-inactive-pill');
            }
        }

        /* ---- Risk Score Persistence ---- */
        /* ── Risk Profile — Firestore-backed, in-memory cache ────────────────
           Stored under users/{uid}.riskProfile in Firestore.
           Loaded once on login into window._fpRiskCache.
           Synchronous reads throughout app use the cache.
           This is a one-time activity — persists across devices and sessions.
        ── */
        window._fpRiskCache = null; // populated by loadUserData after login

        function fpSaveRiskScore(answers, score) {
            var data = { answers: answers, score: score, savedAt: new Date().toISOString() };
            window._fpRiskCache = data;  // update in-memory cache immediately
            // Persist to Firestore
            var user = window._fbAuth && window._fbAuth.currentUser;
            if (user && window._fbDb) {
                window._fbDb.collection('users').doc(user.uid)
                    .set({ riskProfile: data }, { merge: true })
                    .catch(function(e){ console.warn('fpSaveRiskScore Firestore failed:', e); });
            }
        }

        function fpLoadRiskScore() {
            return window._fpRiskCache || null;
        }

        function fpClearRiskScore() {
            window._fpRiskCache = null;
            var user = window._fbAuth && window._fbAuth.currentUser;
            if (user && window._fbDb) {
                window._fbDb.collection('users').doc(user.uid)
                    .set({ riskProfile: firebase.firestore.FieldValue.delete() }, { merge: true })
                    .catch(function(e){ console.warn('fpClearRiskScore Firestore failed:', e); });
            }
        }

        /* ---- Initialise the Risk Step: show saved profile OR questionnaire ---- */
        function fpInitRiskStep() {
            var saved = fpLoadRiskScore();
            var savedView = document.getElementById('fp-risk-saved-view');
            var questView = document.getElementById('fp-risk-questions-view');
            var editBtn   = document.getElementById('fp-risk-edit-toggle-btn');
            var headerSub = document.getElementById('fp-risk-header-sub');

            if (saved && !fpState._editingRisk) {
                // Restore answers into fpState so plan can use them
                fpState.answers = Object.assign({}, saved.answers);
                // Show the saved summary
                savedView.classList.remove('hidden');
                questView.classList.add('hidden');
                if (editBtn) editBtn.classList.remove('hidden');
                if (headerSub) headerSub.textContent = 'Your risk profile is saved — generate or edit';

                // Populate saved card UI
                var profileKey = fpGetRiskProfile(saved.score, parseInt(document.getElementById('fp-age').value) || 30);
                var profile = fpPortfolios[profileKey];
                var savedLabel = document.getElementById('fp-saved-profile-label');
                var savedSub   = document.getElementById('fp-saved-profile-sub');
                var savedScore = document.getElementById('fp-saved-score-display');
                var savedBar   = document.getElementById('fp-saved-score-bar');
                if (savedLabel) savedLabel.textContent = profile ? profile.label : 'Custom Profile';
                if (savedSub)   savedSub.textContent   = profile ? profile.sub   : '';
                if (savedScore) savedScore.textContent  = saved.score;
                if (savedBar)   setTimeout(function(){ savedBar.style.width = Math.round((saved.score / 15) * 100) + '%'; }, 80);
                // Show completion date
                var dateEl = document.getElementById('fp-risk-saved-date');
                if (dateEl && saved.savedAt) {
                    try {
                        var d = new Date(saved.savedAt);
                        dateEl.textContent = '📅 Completed ' + d.toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' });
                    } catch(e) { dateEl.textContent = ''; }
                }

            } else {
                // Show questionnaire
                savedView.classList.add('hidden');
                questView.classList.remove('hidden');
                if (editBtn) editBtn.classList.add('hidden');
                if (headerSub) headerSub.textContent = _t('fp.step3.sub');
                fpInitQuestions();
            }
        }

        function fpToggleRiskEdit() {
            fpState._editingRisk = !fpState._editingRisk;
            fpInitRiskStep();
        }

        // ---- Live snapshot ----
        function fpLiveUpdate() {
            var get = function(id){ var el = document.getElementById(id); return el ? el.value.trim() : ''; };
            var name = get('fp-name'), age = get('fp-age'), retireAge = get('fp-retire-age');
            var income = get('fp-income'), invest = get('fp-invest-amt');
            if (document.getElementById('fp-snap-name')) document.getElementById('fp-snap-name').textContent = name || '—';
            if (document.getElementById('fp-snap-age')) document.getElementById('fp-snap-age').textContent = age ? age + ' years' : '—';
            if (document.getElementById('fp-snap-retire')) {
                var yrsAway = parseInt(retireAge) - parseInt(age);
                document.getElementById('fp-snap-retire').textContent = retireAge ? 'Age ' + retireAge + (yrsAway > 0 ? ' (' + yrsAway + ' yrs away)' : '') : '—';
            }
            if (document.getElementById('fp-snap-income')) document.getElementById('fp-snap-income').textContent = income ? '₹' + income + '/mo' : '—';
            if (document.getElementById('fp-snap-invest')) document.getElementById('fp-snap-invest').textContent = invest ? '₹' + invest + '/mo' : '—';
            // Primary goal (first selected)
            var goalEl = document.getElementById('fp-snap-goal');
            if (goalEl) goalEl.textContent = fpState.goals.length > 0 ? (fpState.goals[0].emoji + ' ' + fpState.goals[0].label) : '—';
            // All goals list
            var listEl = document.getElementById('fp-snap-goals-list');
            if (listEl) {
                if (fpState.goals.length === 0) {
                    listEl.innerHTML = '<span class="text-xs text-slate-400 italic">None selected yet</span>';
                } else {
                    listEl.innerHTML = fpState.goals.map(function(g) {
                        return '<div class="text-xs font-bold text-violet-600">' + g.emoji + ' ' + g.label + (g.years ? ' · ' + g.years + 'yr' : '') + '</div>';
                    }).join('');
                }
            }
            var hLabels = { 3:'Short-term (<5 yrs)', 8:'Medium-term (5–10 yrs)', 15:'Long-term (>10 yrs)' };
            if (document.getElementById('fp-snap-horizon')) document.getElementById('fp-snap-horizon').textContent = hLabels[fpState.horizon] || '—';
            if (typeof saveUserData === 'function') saveUserData();
        }

        function fpFormatMoney(el, wordsId) {
            var val = el.value.replace(/[^0-9]/g,'');
            if (!val) { document.getElementById(wordsId).textContent = '—'; return; }
            var num = parseInt(val,10);
            el.value = new Intl.NumberFormat('en-IN').format(num);
            document.getElementById(wordsId).textContent = numberToWords(num);
        }

        // ---- Risk profile + goal-aware blending ----
        function fpGetRiskProfile(score, age) {
            var adjusted = score;
            if (age >= 55) adjusted = Math.max(0, score - 5);
            else if (age >= 45) adjusted = Math.max(0, score - 2);
            else if (age <= 28) adjusted = Math.min(15, score + 1);
            if (adjusted <= 4)  return 'conservative';
            if (adjusted <= 8)  return 'moderate';
            if (adjusted <= 11) return 'moderateAggressive';
            return 'aggressive';
        }
        // Expose for My Profile risk quiz
        window.fpSaveRiskScore  = fpSaveRiskScore;
        window.fpGetRiskProfile = fpGetRiskProfile;

        // ---- FIX: Return the appropriate projected return rate for a goal
        //  based on its type and time horizon. Long-term goals use the full
        //  portfolio blended rate; short-term and safe goals use realistic
        //  debt/liquid rates so corpus projections are not inflated.
        function fpGoalRate(type, years, profileBlendedReturn) {
            if (type === 'emergency') return 6.8;   // liquid/debt only — must be safe
            if (years <= 2)          return 7.0;    // very short: FD / liquid / short-debt
            if (years <= 4)          return 7.5;    // short: debt funds / RD
            if (years <= 7)          return Math.min(9.0, profileBlendedReturn); // medium: debt-heavy blend
            return profileBlendedReturn;             // long-term: full portfolio rate
        }

        // Blend base portfolio with goal-horizon nudges
        function fpBlendPortfolio(baseKey, goals) {
            var base = fpPortfolios[baseKey];
            var allocs = base.allocations.map(function(a){ return Object.assign({}, a); });

            // FIX: Exclude Emergency Fund from horizon calc — its 1-yr default
            // would drag avgHorizon below 5, falsely triggering the short-horizon
            // equity-cut nudge even when the main goal is a 10-yr Retirement.
            var goalsForHorizon = goals.filter(function(g){ return g.type !== 'emergency'; });
            if (goalsForHorizon.length === 0) goalsForHorizon = goals;

            var totalWt = 0, weightedYrs = 0;
            goalsForHorizon.forEach(function(g) {
                var wt = parseFloat((g.targetAmt+'').replace(/,/g,'')) || 1;
                weightedYrs += g.years * wt;
                totalWt += wt;
            });
            var avgHorizon = totalWt > 0 ? weightedYrs / totalWt : 10;

            // Short-horizon nudge: increase debt/liquid, reduce small/mid cap
            if (avgHorizon < 5) {
                allocs.forEach(function(a) {
                    if (a.name.includes('Small Cap')) a.pct = Math.max(0, a.pct - 8);
                    if (a.name.includes('Mid Cap'))   a.pct = Math.max(0, a.pct - 5);
                    if (a.name.includes('Debt') || a.name.includes('FD')) a.pct += 8;
                    if (a.name.includes('Liquid'))    a.pct += 5;
                });
            }

            // Emergency fund among goals → boost liquid allocation
            var hasEmergency = goals.some(function(g){ return g.type === 'emergency'; });
            if (hasEmergency) {
                allocs.forEach(function(a) {
                    if (a.name.includes('Liquid')) a.pct = Math.min(a.pct + 8, 20);
                });
            }

            // Home buy with short timeline → more debt, less small/mid cap
            var homeGoal = goals.find(function(g){ return g.type === 'home'; });
            if (homeGoal && homeGoal.years <= 7) {
                allocs.forEach(function(a) {
                    if (a.name.includes('Debt') || a.name.includes('FD')) a.pct += 5;
                    if (a.name.includes('Small Cap') || a.name.includes('Mid Cap')) a.pct = Math.max(0, a.pct - 3);
                });
            }

            // Normalise to 100%
            var total = allocs.reduce(function(s,a){ return s + a.pct; }, 0);
            allocs = allocs.filter(function(a){ return a.pct > 0; });
            allocs.forEach(function(a){ a.pct = Math.round(a.pct / total * 100); });
            // FIX: Apply rounding correction to the LARGEST allocation (not always index 0)
            var diff = 100 - allocs.reduce(function(s,a){ return s + a.pct; }, 0);
            if (diff !== 0 && allocs.length > 0) {
                var maxIdx = allocs.reduce(function(mi, a, i){ return a.pct > allocs[mi].pct ? i : mi; }, 0);
                allocs[maxIdx].pct += diff;
            }

            return allocs;
        }

        // SIP FV formula: P × [((1+r)^n − 1)/r] × (1+r)  where r = monthly rate, n = months
        function fpSipCorpus(monthlyAmt, annualRate, years) {
            if (!monthlyAmt || monthlyAmt <= 0) return 0;
            var r = (annualRate / 100) / 12;
            var n = years * 12;
            if (r === 0) return Math.round(monthlyAmt * n);
            return Math.round(monthlyAmt * ((Math.pow(1+r,n)-1)/r) * (1+r));
        }

        // FV factor helper (avoids division-by-zero; used for requiredSIP calc)
        function fpFvFactor(annualRate, years) {
            var r = (annualRate / 100) / 12;
            var n = Math.max(years * 12, 1);
            if (r === 0) return n;
            return ((Math.pow(1+r, n) - 1) / r) * (1+r);
        }

        function fpBuildGoalSIPs(goals, monthlyInvest, blendedRate) {
            if (!monthlyInvest || goals.length === 0) return null;

            // FIX: Assign a horizon-appropriate rate per goal so corpus projections
            // are realistic (not projecting a 1-yr Emergency Fund at 12.5%).
            var rates = goals.map(function(g) {
                return fpGoalRate(g.type, g.years, blendedRate);
            });

            // FIX: Weight by required monthly SIP (= target ÷ FV-factor), not by
            // 1/years. This ensures larger / nearer goals get the budget they
            // actually need instead of the old formula giving 96% of budget to a
            // 1-year Emergency Fund vs a 25-year Retirement.
            //
            // Goals without a target → use the average required SIP of goals that
            // DO have targets, so they get a fair equal share of remaining budget.
            var requiredSIPs = goals.map(function(g, i) {
                var target = parseInt((g.targetAmt+'').replace(/,/g,'')) || 0;
                if (target <= 0) return null; // no target set
                return Math.max(target / fpFvFactor(rates[i], g.years), 1);
            });

            var withTargetSIPs = requiredSIPs.filter(function(w){ return w !== null; });
            var avgRequired = withTargetSIPs.length > 0
                ? withTargetSIPs.reduce(function(s,w){ return s+w; }, 0) / withTargetSIPs.length
                : monthlyInvest / goals.length; // fallback: equal share

            var weights = requiredSIPs.map(function(w){ return w !== null ? w : avgRequired; });
            var wTotal  = weights.reduce(function(s,w){ return s+w; }, 0);

            // Compute raw SIP amounts
            var rawAmts = weights.map(function(w){ return (w / wTotal) * monthlyInvest; });

            // FIX: Round SIP amounts to nearest ₹100 and then fix the total so
            // all goal SIPs sum exactly to monthlyInvest.
            var amts = rawAmts.map(function(a){ return Math.max(Math.round(a / 100) * 100, 0); });
            var amtDiff = monthlyInvest - amts.reduce(function(s,a){ return s+a; }, 0);
            if (amtDiff !== 0) {
                // Add diff to the goal with the highest raw allocation
                var maxRawIdx = rawAmts.reduce(function(mi,a,i){ return a > rawAmts[mi] ? i : mi; }, 0);
                amts[maxRawIdx] += amtDiff;
            }

            // Compute weightPct and fix rounding so it sums to 100
            var rawPcts = weights.map(function(w){ return (w / wTotal) * 100; });
            var pcts    = rawPcts.map(function(p){ return Math.round(p); });
            var pctDiff = 100 - pcts.reduce(function(s,p){ return s+p; }, 0);
            if (pctDiff !== 0) {
                var maxPctIdx = rawPcts.reduce(function(mi,p,i){ return p > rawPcts[mi] ? i : mi; }, 0);
                pcts[maxPctIdx] += pctDiff;
            }

            return goals.map(function(g, i) {
                var rate   = rates[i];
                var share  = amts[i];
                var corpus = fpSipCorpus(share, rate, g.years);
                var target = parseInt((g.targetAmt+'').replace(/,/g,'')) || 0;
                var gap    = target > 0 ? target - corpus : null;
                var extraSIP = (gap > 0) ? Math.ceil(gap / fpFvFactor(rate, g.years) / 100) * 100 : 0;
                return {
                    label:     g.emoji + ' ' + (g.customName || g.label),
                    goalLabel: g.customName || g.label,
                    emoji: g.emoji, years: g.years, amt: share,
                    corpus: corpus, target: target, gap: gap, extraSIP: extraSIP,
                    color: FP_GOAL_META[g.type].color,
                    type: g.type,
                    rate: rate,             // goal-specific rate — used downstream
                    weightPct: pcts[i]      // guaranteed to sum to 100
                };
            });
        }

        // ── Secondary redemption priority within same liquidity tier ──────────
        // Lower = redeem first (safest / most liquid / least compounding impact)
        function fpRedeemPriority(name) {
            if (/Liquid/i.test(name))                              return 0;
            if (/FD|RD|Fixed Deposit/i.test(name))                return 1;
            if (/Short.{0,10}Debt|Ultra.{0,10}Short/i.test(name)) return 2;
            if (/Debt|Hybrid/i.test(name))                        return 3;
            if (/Gold/i.test(name))                               return 4;
            if (/Large.*Cap|Index/i.test(name))                   return 5;
            if (/Direct.*Stock|Sectoral/i.test(name))             return 6;
            if (/Flexi.*Cap|Multi.*Cap/i.test(name))              return 7;
            if (/Mid.*Cap/i.test(name))                           return 8;
            if (/ELSS/i.test(name))                               return 9;
            if (/Small.*Cap/i.test(name))                         return 10;
            if (/International/i.test(name))                      return 11;
            if (/NPS/i.test(name))                                return 12;
            if (/PPF|Sukanya/i.test(name))                        return 13;
            return 6;
        }

        // Goal + horizon-aware redemption instruction per asset
        function fpRedeemDesc(assetName, goalYears, goalType) {
            if (/Liquid/i.test(assetName))
                return 'Redeem first — same/next business day. Always the primary emergency layer.';
            if (/FD|RD/i.test(assetName))
                return goalYears <= 3
                    ? 'Redeem after liquid fund. Premature-break penalty is small; use when needed.'
                    : 'Plan exit 4–6 weeks before goal to avoid premature-break penalty.';
            if (/Short.{0,10}Debt|Ultra.{0,10}Short/i.test(assetName))
                return 'Redeem 7–10 business days before goal. Low exit cost and quick settlement.';
            if (/Debt|Hybrid/i.test(assetName))
                return goalYears <= 5
                    ? 'Redeem 2–4 weeks before goal. Check exit load (usually 0–1%).'
                    : 'Begin a Systematic Transfer Plan (STP) to a liquid fund 6–9 months before goal.';
            if (/Gold/i.test(assetName))
                return 'Redeem after debt/liquid layers are used. Sell during market hours at live NAV.';
            if (/Large.*Cap|Index/i.test(assetName))
                return goalYears <= 7
                    ? 'Start STP to debt funds 2 years before goal. Never redeem equity in one shot.'
                    : 'Begin systematic transfer to debt 3 years before goal to lock in gains gradually.';
            if (/Direct.*Stock|Sectoral/i.test(assetName))
                return 'Plan exit in tranches over 3–6 months before goal. Start early to avoid forced selling.';
            if (/Flexi.*Cap|Multi.*Cap/i.test(assetName))
                return 'Start STP to debt 3 years before goal. Flexi/multi-cap can be volatile at exit.';
            if (/Mid.*Cap/i.test(assetName))
                return 'Begin moving to large cap/debt 3–4 years before goal. Higher volatility at exit.';
            if (/Small.*Cap/i.test(assetName))
                return 'Start switching to safer assets 4–5 years before goal. Liquidity can be thin in downturns.';
            if (/ELSS/i.test(assetName))
                return 'Each SIP instalment has its own 3-year lock-in date. Redeem instalment-by-instalment after unlock.';
            if (/NPS/i.test(assetName))
                return goalType === 'retirement'
                    ? 'Accessible at age 60: 60% as tax-free lump sum; 40% must purchase an annuity.'
                    : 'Partial withdrawal only for specific reasons. Plan other assets for this goal first.';
            if (/PPF|Sukanya/i.test(assetName))
                return (goalType === 'retirement' || goalType === 'education')
                    ? 'Matures in 15 years; extendable in 5-yr blocks. Partial withdrawal allowed from year 7.'
                    : 'PPF has a 15-year lock-in. Ensure your goal date aligns with the maturity window.';
            return 'Verify exit load, STCG/LTCG tax, and settlement timeline before redeeming.';
        }

        // Build per-goal redemption plan using enriched goalSIPs data
        function fpBuildRedemptionPlan(enrichedGoals, allocs) {
            var liqRank = { instant: 0, high: 1, medium: 2, low: 3 };

            // Sort: primary = liquidity tier, secondary = redemption priority within tier
            var sorted = allocs.slice().sort(function(a, b) {
                var td = (liqRank[a.liquid] || 1) - (liqRank[b.liquid] || 1);
                if (td !== 0) return td;
                return fpRedeemPriority(a.name) - fpRedeemPriority(b.name);
            });

            return enrichedGoals.map(function(g) {
                var yrs         = g.years;
                var isEmergency = g.type === 'emergency';

                // Asset suitability: goal-type + horizon aware
                var suitable = sorted.filter(function(a) {
                    if (isEmergency)
                        return a.liquid === 'instant' || /FD|RD/i.test(a.name);
                    if (yrs <= 1)
                        return a.liquid === 'instant';
                    if (yrs <= 3) {
                        if (a.liquid === 'low') return false;
                        if (/Large.*Cap|Mid.*Cap|Small.*Cap|Direct.*Stock|Sectoral|ELSS|International|Flexi|Multi/i.test(a.name)) return false;
                        return a.liquid === 'instant' || a.liquid === 'high';
                    }
                    if (yrs <= 7) {
                        if (a.liquid === 'low') return false;
                        if (/Mid.*Cap|Small.*Cap|Direct.*Stock|Sectoral|International/i.test(a.name)) return false;
                        return true;
                    }
                    if (yrs < 15) {
                        if (g.type !== 'retirement' && /NPS/i.test(a.name)) return false;
                        if (!/retirement|education/.test(g.type) && /PPF|Sukanya/i.test(a.name)) return false;
                        return true;
                    }
                    return true; // 15+ yrs: all assets suitable
                });

                // Attach redemption-context descriptions
                var assets = suitable.map(function(a) {
                    return Object.assign({}, a, { redeemDesc: fpRedeemDesc(a.name, yrs, g.type) });
                });

                // De-risking timeline (when to start STP equity → debt)
                var hasEquity = assets.some(function(a) { return a.liquid === 'medium'; });
                var deRiskNote = null;
                if (!isEmergency && hasEquity) {
                    var startIn = yrs <= 2  ? 0
                                : yrs <= 5  ? yrs - 2
                                : yrs <= 10 ? yrs - 3
                                :             yrs - 4;
                    deRiskNote = startIn === 0
                        ? 'Goal is within 2 years — start moving equity to debt/liquid now.'
                        : 'Start STP from equity → debt/liquid in ~' + startIn + ' year' +
                          (startIn !== 1 ? 's' : '') + ' (' + (yrs - startIn) + ' year' +
                          (yrs - startIn !== 1 ? 's' : '') + ' before goal). Shift gradually to reduce timing risk.';
                }

                return {
                    label:       g.goalLabel || g.label || '',
                    emoji:       g.emoji,
                    years:       yrs,
                    color:       g.color || FP_GOAL_META[g.type].color,
                    type:        g.type,
                    corpus:      g.corpus  || 0,
                    target:      g.target  || 0,
                    assets:      assets,
                    hasLocked:   assets.some(function(a) { return a.liquid === 'low'; }),
                    deRiskNote:  deRiskNote,
                    isEmergency: isEmergency
                };
            });
        }

        // Build per-goal roadmap items
        function fpBuildGoalRoadmap(goals, baseRoadmap) {
            var extras = [];
            var goalRoadmapMap = {
                home:      { icon:'🏠', title:'Set up a Home Down Payment SIP',       desc:'Allocate a separate SIP for your home down payment in a low-risk debt fund. Keep it accessible.',        color:'#3b82f6' },
                education: { icon:'🎓', title:'Open a Sukanya Samriddhi / Child Fund', desc:'For a child\'s education corpus, Sukanya Samriddhi (girls) or a dedicated ELSS gives tax-free growth.',  color:'#8b5cf6' },
                marriage:  { icon:'💍', title:'Marriage Goal — Use Hybrid Funds',      desc:'For a 3–7 year marriage goal, balanced/hybrid funds reduce risk while keeping returns above inflation.',  color:'#ec4899' },
                emergency: { icon:'🛡️', title:'Emergency Fund First — Always',        desc:'Before any SIP, build 6 months of expenses in a liquid fund or sweep-in FD. This is non-negotiable.',   color:'#f59e0b' },
                business:  { icon:'🚀', title:'Business Fund in Flexi-Cap SIPs',       desc:'A 5–7 year SIP in flexi-cap funds can compound your business seed capital significantly.',               color:'#ef4444' },
                travel:    { icon:'✈️', title:'Travel Fund via Recurring Deposits',    desc:'Short-term goal? Use RDs or short-duration debt funds. Avoid equity for goals under 3 years.',           color:'#0ea5e9' },
                retirement: { icon:'🏖️', title:'NPS is your Retirement Superweapon',  desc:'NPS offers the lowest-cost pension solution. Max out Tier-I equity allocation for the long run.',       color:'#6366f1' },
                wealth:    { icon:'💰', title:'SIP Step-up Strategy',                  desc:'Increase your SIP by 10% every year. A Rs.10,000 SIP growing at 10% p.a. step-up becomes 4× in 15 years.',color:'#10b981' },
                custom:    { icon:'✏️', title:'Map this goal to a dedicated fund',     desc:'Open a separate SIP for this goal so you can track progress independently and avoid mixing funds.',      color:'#64748b' }
            };
            goals.forEach(function(g) {
                if (goalRoadmapMap[g.type]) extras.push(goalRoadmapMap[g.type]);
            });
            // Merge: goal-specific first, then base
            return extras.concat(baseRoadmap).slice(0, 5);
        }

        // ---- Generate Plan ----
        function fpCalculatePlan() {
            // Check if we have all answers (either freshly answered or loaded from saved)
            var answered = fpQuestions.filter(function(q){ return fpState.answers[q.id] !== undefined; }).length;
            var savedRisk = fpLoadRiskScore();
            // If using saved risk profile, restore answers into fpState
            if (savedRisk && Object.keys(fpState.answers).length === 0) {
                fpState.answers = Object.assign({}, savedRisk.answers);
            }

            // If not all answered and no saved score, try to use saved
            if (answered < fpQuestions.length) {
                if (savedRisk) {
                    fpState.answers = Object.assign({}, savedRisk.answers);
                    answered = fpQuestions.filter(function(q){ return fpState.answers[q.id] !== undefined; }).length;
                }
                if (answered < fpQuestions.length) {
                    alert('Please answer all 5 questions to generate your plan.'); fpGoStep(3); return;
                }
            }

            var totalScore    = fpQuestions.reduce(function(s,q){ return s + (fpState.answers[q.id+'_pts'] || 0); },0);

            // Save the risk score for future sessions
            fpSaveRiskScore(fpState.answers, totalScore);
            fpState._editingRisk = false; // reset edit mode
            var age           = parseInt(document.getElementById('fp-age').value) || 30;
            var name          = document.getElementById('fp-name').value.trim() || 'there';
            var monthlyInvest = parseInt(document.getElementById('fp-invest-amt').value.replace(/,/g,'')) || 0;
            var retireAge     = parseInt(document.getElementById('fp-retire-age').value) || 60;
            var yearsToRetire = Math.max(1, retireAge - age);

            // Existing corpus calculations
            var existingCorpus     = fpGetTotalExistingCorpus();
            var existingReturn     = fpGetWeightedExistingReturn();       // weighted avg %
            var hasExisting        = existingCorpus > 0 || fpState.epfBasic > 0;

            // Base projection: existing lump sums grown to retirement
            var existingFutureVal  = existingCorpus > 0 ? existingCorpus * Math.pow(1 + existingReturn / 100, yearsToRetire) : 0;

            // EPF ongoing contributions FV (employee 12% + employer EPF share, excluding EPS)
            // This is additional to whatever balance the user entered, representing future accumulation
            var epfOngoingFV = 0;
            if (fpState.epfBasic > 0) {
                var _epfBasic   = fpState.epfBasic;
                var _empEpf     = Math.round(_epfBasic * 0.12);
                var _eps        = Math.min(1250, Math.round(_epfBasic * 0.0833));
                var _erEpf      = _empEpf - _eps;
                var _monthlyEpf = _empEpf + _erEpf;  // total monthly into EPF account
                var _epfRate    = 0.0825;             // 8.25% current EPF rate
                // FV of monthly EPF contributions over yearsToRetire
                epfOngoingFV = _monthlyEpf * 12 * ((Math.pow(1 + _epfRate, yearsToRetire) - 1) / _epfRate) * (1 + _epfRate / 12);
                existingFutureVal += epfOngoingFV;
            }

            var profileKey = fpGetRiskProfile(totalScore, age);
            var profile    = fpPortfolios[profileKey];
            var allocs     = fpBlendPortfolio(profileKey, fpState.goals);
            var goalSIPs   = fpBuildGoalSIPs(fpState.goals, monthlyInvest, profile.blendedReturn);
            var roadmap    = fpBuildGoalRoadmap(fpState.goals, profile.roadmap);
            // Pass enriched goalSIPs so redemption plan has corpus/target/rate.
            // Fallback when no invest amount entered: enrich raw goals minimally.
            var redeemInput = goalSIPs || fpState.goals.map(function(g) {
                return {
                    goalLabel: g.label, label: g.label,
                    emoji: g.emoji, years: g.years, type: g.type,
                    corpus: 0, target: parseInt((g.targetAmt||'').replace(/,/g,''))||0,
                    color: FP_GOAL_META[g.type].color
                };
            });
            var redeemPlan = redeemInput.length > 0 ? fpBuildRedemptionPlan(redeemInput, allocs) : [];

            fpState.planGenerated = true;
            var fmt = function(n){ return new Intl.NumberFormat('en-IN').format(Math.round(n)); };

            [1,2,3,4].forEach(function(s) {
                var dot = document.querySelector('#fp-step-badge [data-s="' + s + '"]'); if (!dot) return;
                dot.className = 'fp-step-dot ' + (s <= 3 ? 'fp-dot-done' : 'fp-dot-active');
            });

            // Update tab pills — all done, generate highlighted
            [1,2,3].forEach(function(s) {
                var btn = document.getElementById('fp-tab-' + s);
                if (!btn) return;
                btn.className = btn.className.replace(/fp-tab-(active|inactive|done)-pill/g, '');
                btn.classList.add('fp-tab-done-pill');
                var dot = btn.querySelector('.fp-tab-dot');
                if (dot) dot.textContent = '✓';
            });
            var tab4 = document.getElementById('fp-tab-4');
            if (tab4) {
                tab4.className = tab4.className.replace(/fp-tab-(active|inactive|done)-pill/g, '');
                tab4.classList.add('fp-tab-active-pill');
                var d4 = tab4.querySelector('.fp-tab-dot');
                if (d4) d4.textContent = '🧭';
            }

            // Hide left column and expand right to full width
            var leftCol  = document.getElementById('fp-left-col');
            var rightCol = document.getElementById('fp-right-col');
            if (leftCol)  leftCol.classList.add('hidden');
            if (rightCol) { rightCol.classList.remove('lg:w-1/2'); rightCol.classList.add('w-full'); }

            // Hide all step forms when showing results
            [1,2,3].forEach(function(s){ var el=document.getElementById('fp-step-'+s); if(el) el.classList.add('hidden'); });

            document.getElementById('fp-results-placeholder').classList.add('hidden');
            var fpRC = document.getElementById('fp-results-card');
            fpRC.classList.remove('hidden');
            fpRC.classList.remove('slide-up-in');
            void fpRC.offsetWidth;
            fpRC.classList.add('slide-up-in');

            document.getElementById('fp-result-header').style.background   = profile.gradient;
            document.getElementById('fp-result-greeting').textContent       = _t('fp.result.greeting').replace('{n}', name);
            document.getElementById('fp-result-profile-label').textContent  = profile.label;
            document.getElementById('fp-result-profile-sub').textContent    = profile.sub;
            document.getElementById('fp-risk-score-label').textContent      = _t('fp.result.riskscore').replace('{s}', totalScore);
            var barFill = document.getElementById('fp-risk-bar-fill');
            barFill.style.background = profile.barColor;
            barFill.style.width = ((totalScore / 15) * 100) + '%';

            // ---- Donut chart ----
            if (fpDonutChart) { fpDonutChart.destroy(); fpDonutChart = null; }
            var ctx = document.getElementById('fp-donut-chart').getContext('2d');
            fpDonutChart = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: allocs.map(function(a){ return a.name; }),
                    datasets: [{ data: allocs.map(function(a){ return a.pct; }), backgroundColor: allocs.map(function(a){ return a.color; }), borderWidth:2, borderColor:'#fff', hoverOffset:8 }]
                },
                options: {
                    responsive:true, maintainAspectRatio:false, cutout:'68%',
                    plugins:{ legend:{display:false}, tooltip:{ callbacks:{ label:function(c){ return ' ' + c.label + ': ' + c.parsed + '%'; } } } },
                    animation:{ animateRotate:true, duration:700 },
                    onHover: function(evt, elements) {
                        var p = document.getElementById('fp-center-pct'), l = document.getElementById('fp-center-label');
                        if (elements.length > 0) { var i = elements[0].index; p.textContent = allocs[i].pct + '%'; l.textContent = allocs[i].name; }
                        else { p.textContent = totalScore + '/15'; l.textContent = _t('fp.result.riskscore.label'); }
                    }
                }
            });
            document.getElementById('fp-center-pct').textContent   = totalScore + '/15';
            document.getElementById('fp-center-label').textContent  = _t('fp.result.riskscore.label');

            // ---- Legend — shows "best used for" per asset ----
            document.getElementById('fp-legend').innerHTML = allocs.map(function(a) {
                return '<div class="fp-legend-row">' +
                    '<div class="flex items-center gap-2 min-w-0">' +
                        '<div class="w-2.5 h-2.5 rounded-full flex-shrink-0" style="background:' + a.color + '"></div>' +
                        '<div class="min-w-0">' +
                            '<div class="text-xs font-bold text-slate-700 truncate">' + a.icon + ' ' + a.name + '</div>' +
                            '<div class="text-[10px] text-slate-400">' + a.tip + '</div>' +
                            (a.when ? '<div class="text-[9px] font-semibold mt-0.5" style="color:' + a.color + '">Use for: ' + a.when + '</div>' : '') +
                        '</div>' +
                    '</div>' +
                    '<span class="text-sm font-black flex-shrink-0 ml-1" style="color:' + a.color + '">' + a.pct + '%</span>' +
                '</div>';
            }).join('');

            // ---- Existing Wealth Summary (if any corpus entered) ----
            var existingSection = document.getElementById('fp-existing-section');
            if (!existingSection) {
                // Insert it before SIP breakdown: find the sip-breakdown parent
                var sipBreakdownEl = document.getElementById('fp-sip-breakdown');
                var sipParent = sipBreakdownEl ? sipBreakdownEl.closest('.px-5.pb-3') : null;
                if (sipParent) {
                    var div = document.createElement('div');
                    div.id = 'fp-existing-section';
                    div.className = 'px-5 pb-3';
                    sipParent.parentNode.insertBefore(div, sipParent);
                    existingSection = div;
                }
            }
            if (existingSection) {
                if (hasExisting) {
                    var existingRows = fpState.existing.map(function(key) {
                        var meta = FP_EXISTING_META[key] || { icon:'💼', label: key, returnRate: 8 };
                        var val  = fpState.existingAmounts[key] || 0;
                        if (!val && key !== 'epf') return '';
                        if (key === 'epf' && val === 0) return ''; // skip EPF row if balance not entered
                        var longestYrs = fpState.goals.reduce(function(mx,g){ return Math.max(mx, parseInt(g.years)||0); }, yearsToRetire);
                        // Crypto: use effective post-tax return for projection, not gross
                        if (key === 'crypto' && val > 0) {
                            var grossR   = (meta.grossReturn || 15) / 100;
                            var effR     = (meta.effectiveReturn || 10.5) / 100;
                            var fvGross  = val * Math.pow(1 + grossR, longestYrs);
                            var fvEff    = val * Math.pow(1 + effR,   longestYrs);
                            return '<div class="rounded-xl border border-red-200 p-2.5 mb-1" style="background:#fef2f2;">' +
                                '<div class="flex items-center justify-between gap-2 mb-1.5">' +
                                    '<div class="flex items-center gap-1.5">' +
                                        '<span class="text-sm">₿</span>' +
                                        '<div>' +
                                            '<div class="text-xs font-bold text-red-700">Crypto / VDA ⚠️</div>' +
                                            '<div class="text-[9px] text-red-400">Extreme risk · 30% tax · no loss set-off</div>' +
                                        '</div>' +
                                    '</div>' +
                                    '<span class="text-xs font-black text-slate-800 flex-shrink-0">₹' + fmt(val) + '</span>' +
                                '</div>' +
                                '<div class="grid grid-cols-2 gap-1.5 text-[10px]">' +
                                    '<div class="rounded-lg p-1.5" style="background:#fee2e2;">' +
                                        '<div class="text-[9px] font-black text-red-600 uppercase tracking-wider">Gross (' + (meta.grossReturn||15) + '% p.a.)</div>' +
                                        '<div class="font-black text-slate-700">₹' + fmt(fvGross) + '</div>' +
                                        '<div class="text-[9px] text-red-400">Before tax</div>' +
                                    '</div>' +
                                    '<div class="rounded-lg p-1.5" style="background:#fff1f1;">' +
                                        '<div class="text-[9px] font-black text-red-600 uppercase tracking-wider">Post-Tax est. (~' + (meta.effectiveReturn||10.5) + '%)</div>' +
                                        '<div class="font-black text-red-700">₹' + fmt(fvEff) + '</div>' +
                                        '<div class="text-[9px] text-red-400">After 30% flat tax drag</div>' +
                                    '</div>' +
                                '</div>' +
                                '<div class="text-[9px] text-red-500 mt-1.5 leading-relaxed">⚠️ Projections are illustrative only. Crypto returns are highly volatile; actual outcomes could be -100% to +500%. Regulatory changes may further impact returns.</div>' +
                            '</div>';
                        }

                        // EPF: project balance + ongoing monthly contributions
                        var fv, extraNote = '';
                        if (key === 'epf') {
                            var basic   = fpState.epfBasic || 0;
                            var empEpf  = Math.round(basic * 0.12);
                            var eps     = Math.min(1250, Math.round(basic * 0.0833));
                            var erEpf   = empEpf - eps;
                            var monthly = empEpf + erEpf; // total monthly into EPF account
                            var r = meta.returnRate / 100;
                            var balFV = val * Math.pow(1 + r, longestYrs);
                            var sipFV = monthly > 0 ? monthly * 12 * ((Math.pow(1 + r, longestYrs) - 1) / r) * (1 + r/12) : 0;
                            fv = balFV + sipFV;
                            if (monthly > 0) {
                                extraNote = ' + ₹' + fmt(monthly) + '/mo contribution · EPS ₹' + fmt(eps) + '/mo pension';
                            }
                            return '<div class="rounded-xl border border-blue-100 p-2.5 mb-1" style="background:#eff6ff;">' +
                                '<div class="flex items-center justify-between gap-2">' +
                                    '<div class="flex items-center gap-2 min-w-0">' +
                                        '<span class="text-sm flex-shrink-0">🏢</span>' +
                                        '<div class="min-w-0">' +
                                            '<div class="text-xs font-bold text-blue-700">EPF Balance</div>' +
                                            '<div class="text-[10px] text-blue-500">' + meta.returnRate + '% p.a. · ' + longestYrs + ' yrs</div>' +
                                        '</div>' +
                                    '</div>' +
                                    '<span class="text-xs font-black text-slate-800 flex-shrink-0">₹' + fmt(val) + '</span>' +
                                '</div>' +
                                '<div class="mt-1.5 text-[10px] text-blue-600 leading-relaxed">' +
                                    (monthly > 0 ? '📥 Ongoing: ₹' + fmt(monthly) + '/mo into EPF (you + employer, excl. EPS)<br>' : '') +
                                    (eps > 0     ? '🧓 EPS pension component: ₹' + fmt(eps) + '/mo (builds pension, not EPF balance)<br>' : '') +
                                    '📈 Projected corpus: ₹' + fmt(fv) + ' in ' + longestYrs + ' yrs (tax-free at maturity)' +
                                '</div>' +
                            '</div>';
                        }

                        fv = val * Math.pow(1 + meta.returnRate / 100, longestYrs);
                        var noteHtml = meta.note ? '<div class="text-[9px] text-slate-400">' + meta.note + '</div>' : '';
                        return '<div class="flex items-center justify-between gap-2 py-1.5 border-b border-slate-50 last:border-0">' +
                            '<div class="flex items-center gap-2 min-w-0">' +
                                '<span class="text-sm flex-shrink-0">' + meta.icon + '</span>' +
                                '<div class="min-w-0">' +
                                    '<div class="text-xs font-bold text-slate-700 truncate">' + meta.label + '</div>' +
                                    '<div class="text-[10px] text-slate-400">~' + meta.returnRate + '% p.a. · ' + longestYrs + ' yrs → projected ₹' + fmt(fv) + '</div>' +
                                    noteHtml +
                                '</div>' +
                            '</div>' +
                            '<span class="text-xs font-black text-slate-800 flex-shrink-0">₹' + fmt(val) + '</span>' +
                        '</div>';
                    }).filter(Boolean).join('');

                    var totalGoalCorpus = goalSIPs ? goalSIPs.reduce(function(s,g){ return s + g.corpus; }, 0) : 0;
                    var combinedCorpus  = totalGoalCorpus + existingFutureVal;
                    var coveragePct     = totalGoalCorpus > 0 ? Math.round((existingFutureVal / totalGoalCorpus) * 100) : 0;

                    existingSection.innerHTML =
                        '<h3 class="text-xs font-black text-slate-400 uppercase tracking-wider mb-2">🏦 Your Existing Wealth</h3>' +
                        '<div class="rounded-2xl border border-emerald-100 overflow-hidden" style="background:#f0fdf4;">' +
                            '<div class="px-4 pt-3 pb-2">' + existingRows + '</div>' +
                            '<div class="px-4 pb-3 pt-1 flex flex-wrap gap-3 border-t border-emerald-100 mt-1">' +
                                '<div>' +
                                    '<div class="text-[9px] font-black text-emerald-700 uppercase tracking-wider">Current Total</div>' +
                                    '<div class="text-sm font-black text-slate-800">₹' + fmt(existingCorpus) + '</div>' +
                                '</div>' +
                                '<div>' +
                                    '<div class="text-[9px] font-black text-emerald-700 uppercase tracking-wider">Projected Value</div>' +
                                    '<div class="text-sm font-black text-slate-800">₹' + fmt(existingFutureVal) + '</div>' +
                                    '<div class="text-[10px] text-slate-400">in ' + yearsToRetire + ' yrs @ ~' + (existingReturn > 0 ? existingReturn.toFixed(1) : '—') + '% blended</div>' +
                                '</div>' +
                                (coveragePct > 0 ?
                                '<div>' +
                                    '<div class="text-[9px] font-black text-emerald-700 uppercase tracking-wider">Goal Coverage</div>' +
                                    '<div class="text-sm font-black" style="color:#10b981">' + coveragePct + '%</div>' +
                                    '<div class="text-[10px] text-slate-400">of new SIP corpus offset</div>' +
                                '</div>' : '') +
                            '</div>' +
                            '<div class="px-4 py-2 text-[10px] text-emerald-700 font-semibold leading-relaxed border-t border-emerald-100">' +
                                '✅ Your existing investments are projected to contribute <strong>₹' + fmt(existingFutureVal) + '</strong> toward your goals. ' +
                                'The SIP amounts below are your <em>additional</em> investment needed on top of this.' +
                            '</div>' +
                        '</div>';
                } else {
                    existingSection.innerHTML = '';
                }
            }

            // ---- SIP Breakdown ----
            var sipDiv = document.getElementById('fp-sip-breakdown');
            if (goalSIPs && monthlyInvest > 0) {
                var reasonLines = goalSIPs.map(function(g) {
                    var rateNote = g.type === 'emergency' ? 'safe 6.8% (liquid/debt — must be instantly accessible)'
                                 : g.years <= 2           ? 'conservative 7.0% (short horizon — capital safety first)'
                                 : g.years <= 4           ? 'conservative 7.5% (short horizon — debt-focused)'
                                 : g.years <= 7           ? 'moderate ~9% (medium horizon — debt-equity blend)'
                                 :                          (g.rate || profile.blendedReturn).toFixed(1) + '% (long horizon — full portfolio rate)';
                    var weightNote = g.target > 0
                        ? 'needs ₹' + fmt(g.amt) + '/mo to reach ₹' + fmt(g.target) + ' target in ' + g.years + ' yrs'
                        : 'no target set — receives equal share';
                    return '<div class="flex items-start gap-2 text-[11px] text-slate-500 leading-relaxed">' +
                        '<span style="color:' + g.color + ';font-weight:900;flex-shrink:0;">' + g.emoji + '</span>' +
                        '<span><strong style="color:#374151;">' + g.weightPct + '%</strong> → ' + g.goalLabel + ': ' + weightNote + '. Projected at ' + rateNote + '.</span></div>';
                }).join('');
                sipDiv.innerHTML =
                    '<div class="rounded-xl border border-blue-100 p-3 mb-3" style="background:#eff6ff;">' +
                        '<div class="text-[10px] font-black text-blue-600 uppercase tracking-wider mb-1.5">💡 Why this split?</div>' +
                        '<div class="space-y-1">' + reasonLines + '</div>' +
                        '<div class="text-[10px] text-blue-400 mt-2 pt-2 border-t border-blue-100">Each goal receives the SIP amount it actually needs to hit its target. Goals without a target get an equal share. Short-term goals use conservative rates; long-term goals use your full portfolio return.</div>' +
                    '</div>' +
                    '<div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">SIP split by goal</div>' +
                    goalSIPs.map(function(g) {
                        return '<div class="fp-sip-row" style="border-left:3px solid ' + g.color + ';padding-left:10px;">' +
                            '<div class="flex items-center gap-2"><span class="text-sm">' + g.label + '</span><span class="text-[10px] text-slate-400">' + g.years + 'yr horizon</span></div>' +
                            '<span class="text-xs font-black text-slate-800">₹' + fmt(g.amt) + '/mo</span>' +
                        '</div>';
                    }).join('') +
                    '<div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-3 mb-1.5">Asset-wise SIP split</div>' +
                    allocs.map(function(a) {
                        var amt = Math.round((a.pct/100) * monthlyInvest / 100) * 100;
                        return '<div class="fp-sip-row"><div class="flex items-center gap-2"><span>' + a.icon + '</span><span class="text-xs font-semibold text-slate-600">' + a.name + '</span></div><span class="text-xs font-black text-slate-800">₹' + fmt(amt) + '/mo</span></div>';
                    }).join('');
            } else if (monthlyInvest > 0) {
                sipDiv.innerHTML =
                    '<div class="rounded-xl border border-blue-100 p-3 mb-3" style="background:#eff6ff;">' +
                        '<div class="text-[10px] font-black text-blue-600 uppercase tracking-wider mb-1">💡 How this is calculated</div>' +
                        '<div class="text-[11px] text-slate-500 leading-relaxed">Each asset gets a share proportional to its weight in your risk-adjusted portfolio. Equity for long-term growth, debt and liquid for stability and near-term needs.</div>' +
                    '</div>' +
                    allocs.map(function(a) {
                        var amt = Math.round((a.pct/100) * monthlyInvest / 100) * 100;
                        return '<div class="fp-sip-row"><div class="flex items-center gap-2"><span>' + a.icon + '</span><span class="text-xs font-semibold text-slate-600">' + a.name + '</span></div><span class="text-xs font-black text-slate-800">₹' + fmt(amt) + '/mo</span></div>';
                    }).join('');
            } else {
                sipDiv.innerHTML = '<p class="text-xs text-slate-400 italic">Enter your monthly investable amount (Step 1) to see the exact SIP split.</p>';
            }

            // ---- Goal Corpus Projections ----
            var corpusSection = document.getElementById('fp-corpus-section');
            var corpusCards   = document.getElementById('fp-corpus-cards');
            if (goalSIPs && goalSIPs.length > 0) {
                corpusSection.style.display = '';
                // Distribute existing future value proportionally across goals by weight
                var totalWeight = goalSIPs.reduce(function(s,g){ return s + g.weightPct; }, 0) || 1;
                corpusCards.innerHTML = goalSIPs.map(function(g) {
                    // FIX: Project the existing corpus to THIS GOAL's own horizon,
                    // not to yearsToRetire. A 2-yr Travel goal should not show the
                    // existing corpus compounded for 25 years.
                    var goalExistingFV = hasExisting
                        ? existingCorpus * Math.pow(1 + existingReturn / 100, g.years) * (g.weightPct / totalWeight)
                        : 0;
                    var effectiveCorpus = g.corpus + goalExistingFV;
                    var onTrack     = g.gap !== null && (effectiveCorpus >= g.target || g.gap <= 0);
                    var noTarget    = g.target <= 0;
                    var statusColor = noTarget ? '#6366f1' : (onTrack ? '#10b981' : '#ef4444');
                    var statusIcon  = noTarget ? '📊' : (onTrack ? '✅' : '⚠️');
                    var progressPct = (!noTarget && effectiveCorpus > 0) ? Math.min(100, Math.round((effectiveCorpus / g.target) * 100)) : 100;
                    var gap         = noTarget ? 0 : Math.max(0, g.target - effectiveCorpus);
                    // FIX: Use each goal's own rate (stored on the SIP object),
                    // not the hardcoded profile.blendedReturn for every goal.
                    var goalRate    = g.rate || profile.blendedReturn;
                    var extraSIP    = (gap > 0 && g.years > 0) ? Math.ceil(gap / fpFvFactor(goalRate, g.years) / 500) * 500 : 0;
                    var statusMsg   = noTarget ? 'No target set — showing projected corpus' :
                                     onTrack  ? 'On track! Projected ₹' + fmt(effectiveCorpus) + ' vs target ₹' + fmt(g.target) :
                                                'Shortfall of ₹' + fmt(gap) + ' — add ₹' + fmt(extraSIP) + '/mo to close the gap';
                    var totalInvested = g.amt * g.years * 12;
                    var gainAmt       = effectiveCorpus - totalInvested;
                    var gainPct       = totalInvested > 0 ? Math.round((gainAmt/totalInvested)*100) : 0;

                    return '<div class="rounded-2xl border overflow-hidden" style="border-color:' + statusColor + '25;">' +
                        '<div class="flex items-center justify-between px-4 py-3" style="background:' + statusColor + '0c;">' +
                            '<div class="flex items-center gap-2">' +
                                '<span class="text-lg">' + g.emoji + '</span>' +
                                '<div>' +
                                    '<div class="text-xs font-black text-slate-700">' + g.goalLabel + '</div>' +
                                    '<div class="text-[10px] text-slate-400">₹' + fmt(g.amt) + '/mo SIP · ' + g.years + ' years' +
                                        (goalExistingFV > 0 ? ' + ₹' + fmt(goalExistingFV) + ' from existing' : '') + '</div>' +
                                '</div>' +
                            '</div>' +
                            '<span class="text-xl">' + statusIcon + '</span>' +
                        '</div>' +
                        '<div class="px-4 py-3">' +
                            '<div class="grid grid-cols-2 gap-2 mb-3">' +
                                '<div class="rounded-xl p-3" style="background:' + statusColor + '0f;">' +
                                    '<div class="text-[9px] font-black uppercase tracking-wider mb-1" style="color:' + statusColor + '">Total Projected Corpus</div>' +
                                    '<div class="text-base font-black text-slate-800 leading-tight">₹' + fmt(effectiveCorpus) + '</div>' +
                                    '<div class="text-[10px] text-slate-400 mt-0.5">' +
                                        'SIP: ₹' + fmt(g.corpus) +
                                        (goalExistingFV > 0 ? ' + Existing: ₹' + fmt(goalExistingFV) : '') +
                                    '</div>' +
                                    (gainAmt > 0 ? '<div class="text-[10px] font-bold mt-1" style="color:' + statusColor + '">+₹' + fmt(gainAmt) + ' gain (' + gainPct + '%)</div>' : '') +
                                '</div>' +
                                (!noTarget ?
                                '<div class="rounded-xl p-3 bg-slate-50">' +
                                    '<div class="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">Your Target</div>' +
                                    '<div class="text-base font-black text-slate-800 leading-tight">₹' + fmt(g.target) + '</div>' +
                                    '<div class="text-[10px] text-slate-400 mt-0.5">as entered by you</div>' +
                                '</div>' :
                                '<div class="rounded-xl p-3 bg-slate-50">' +
                                    '<div class="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">Total Invested (SIP)</div>' +
                                    '<div class="text-base font-black text-slate-800 leading-tight">₹' + fmt(totalInvested) + '</div>' +
                                    '<div class="text-[10px] text-slate-400 mt-0.5">' + g.years * 12 + ' months × ₹' + fmt(g.amt) + '</div>' +
                                '</div>') +
                            '</div>' +
                            (!noTarget ?
                            '<div class="mb-3">' +
                                '<div class="flex justify-between text-[10px] mb-1">' +
                                    '<span class="text-slate-400">Progress to target</span>' +
                                    '<span class="font-black" style="color:' + statusColor + '">' + progressPct + '%</span>' +
                                '</div>' +
                                '<div class="w-full h-2 bg-slate-100 rounded-full overflow-hidden">' +
                                    '<div class="h-full rounded-full transition-all duration-700" style="width:' + progressPct + '%;background:' + statusColor + ';"></div>' +
                                '</div>' +
                            '</div>' : '') +
                            '<div class="rounded-xl px-3 py-2 text-[11px] font-semibold" style="background:' + statusColor + '0f;color:' + statusColor + '">' +
                                statusMsg +
                            '</div>' +
                        '</div>' +
                    '</div>';
                }).join('');
            } else {
                corpusSection.style.display = 'none';
            }

            // ---- Redemption Guide ----
            var redeemSection = document.getElementById('fp-redemption-section');
            var redeemCards   = document.getElementById('fp-redemption-cards');
            if (redeemPlan.length > 0) {
                redeemSection.style.display = '';
                var liqLabel = { instant:'🟢 Same day', high:'🟡 1–3 days', medium:'🟠 3–7 days', low:'🔴 Lock-in' };
                redeemCards.innerHTML = redeemPlan.map(function(g) {
                    var hTag  = g.years <= 3 ? 'Short-term'  : g.years <= 7 ? 'Medium-term' : 'Long-term';
                    var hClr  = g.years <= 3 ? '#ef4444'     : g.years <= 7 ? '#f59e0b'     : '#10b981';

                    var corpusStrip = (g.corpus > 0)
                        ? '<div class="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2 border-b border-slate-100" style="background:#f8fafc;">'
                            + '<div><div class="text-[9px] font-black text-slate-400 uppercase tracking-wider">Projected Corpus</div>'
                            + '<div class="text-sm font-black text-slate-800">₹' + fmt(g.corpus) + '</div></div>'
                            + (g.target > 0
                                ? '<div><div class="text-[9px] font-black text-slate-400 uppercase tracking-wider">Your Target</div>'
                                  + '<div class="text-sm font-black text-slate-600">₹' + fmt(g.target) + '</div></div>'
                                : '')
                            + '</div>'
                        : '';

                    var emergencyNote = g.isEmergency
                        ? '<div class="mx-4 mt-3 mb-1 px-3 py-2 rounded-xl text-[10px] leading-relaxed font-semibold text-amber-800 border border-amber-200" style="background:#fffbeb;">'
                            + '🛡️ Emergency corpus must stay in instant-access instruments <strong>at all times</strong>. Never allocate it to equity or locked instruments.'
                          + '</div>'
                        : '';

                    var deRiskBanner = g.deRiskNote
                        ? '<div class="mx-4 mt-3 mb-1 px-3 py-2 rounded-xl text-[10px] leading-relaxed font-semibold text-blue-700 border border-blue-100" style="background:#eff6ff;">'
                            + '📅 <strong>De-risk plan:</strong> ' + g.deRiskNote
                          + '</div>'
                        : '';

                    var assetRows = g.assets.map(function(a, idx) {
                        var chip = '<span class="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style="background:' + a.color + '18;color:' + a.color + ';">' + (liqLabel[a.liquid] || '—') + '</span>';
                        return '<div class="flex items-start gap-3">'
                            + '<div class="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-black text-white mt-0.5" style="background:' + a.color + '">' + (idx + 1) + '</div>'
                            + '<div class="flex-1 min-w-0">'
                                + '<div class="flex items-center flex-wrap gap-x-2 gap-y-0.5 mb-0.5">'
                                    + '<span class="text-xs font-bold text-slate-700">' + a.icon + ' ' + a.name + '</span>'
                                    + chip
                                    + '<span class="text-[10px] text-slate-400">~' + a.rate + '% p.a.</span>'
                                + '</div>'
                                + '<div class="text-[10px] text-slate-500 leading-relaxed">' + a.redeemDesc + '</div>'
                            + '</div>'
                        + '</div>';
                    }).join('');

                    var lockedWarn = g.hasLocked
                        ? '<div class="mx-4 mt-1 mb-3 px-3 py-2 rounded-xl text-[10px] font-semibold text-amber-600 border border-amber-100" style="background:#fffbeb;">'
                            + '⚠️ One or more assets have lock-in periods. Check exact maturity/unlock dates and start exit planning 6–12 months early.'
                          + '</div>'
                        : '';

                    return '<div class="rounded-2xl border border-slate-200 overflow-hidden">'
                        + '<div class="flex items-center justify-between px-4 py-3" style="background:' + g.color + '12;">'
                            + '<div class="flex items-center gap-2">'
                                + '<span class="text-lg">' + g.emoji + '</span>'
                                + '<div>'
                                    + '<div class="text-xs font-black text-slate-700">' + g.label + '</div>'
                                    + '<div class="text-[10px] text-slate-400">Needed in ' + g.years + ' year' + (g.years !== 1 ? 's' : '') + ' · Redeem in order shown ↓</div>'
                                + '</div>'
                            + '</div>'
                            + '<span class="text-[9px] font-bold px-2.5 py-1 rounded-full text-white" style="background:' + hClr + '">' + hTag + '</span>'
                        + '</div>'
                        + corpusStrip
                        + emergencyNote
                        + deRiskBanner
                        + '<div class="px-4 py-3 space-y-3">' + assetRows + '</div>'
                        + lockedWarn
                    + '</div>';
                }).join('');
            } else {
                redeemSection.style.display = 'none';
            }

            // ---- Roadmap ----
            document.getElementById('fp-roadmap').innerHTML = roadmap.map(function(r) {
                return '<div class="fp-road-item" style="background:' + r.color + '0f;border-color:' + r.color + '30;"><span class="text-lg flex-shrink-0">' + r.icon + '</span><div><div class="text-xs font-black uppercase tracking-wide mb-0.5" style="color:' + r.color + '">' + r.title + '</div><div class="text-xs text-slate-600 leading-relaxed">' + r.desc + '</div></div></div>';
            }).join('');

            setTimeout(function(){ document.getElementById('fp-results-card').scrollIntoView({behavior:'smooth',block:'start'}); },200);
        }

        // ---- Reset ----
        function fpEditPlan() {
            // Go back to step 1, but keep all current state (name, goals, answers)
            var rc = document.getElementById('fp-results-card');
            if (rc) rc.classList.add('hidden');
            var rp = document.getElementById('fp-results-placeholder');
            if (rp) rp.classList.remove('hidden');
            // Restore two-column layout
            var leftCol  = document.getElementById('fp-left-col');
            var rightCol = document.getElementById('fp-right-col');
            if (leftCol)  leftCol.classList.remove('hidden');
            if (rightCol) { rightCol.classList.add('lg:w-1/2'); rightCol.classList.remove('w-full'); }
            fpGoStep(1);
            fpUpdateTabNav(1);
            var planPanel = document.getElementById('finplan-panel');
            if (planPanel) setTimeout(function(){ planPanel.scrollIntoView({behavior:'smooth', block:'start'}); }, 100);
        }

        function fpReset() {
            fpClearRiskScore();
            fpState = { step:1, goals:[], existing:[], existingAmounts:{}, existingCustom:'', answers:{}, planGenerated:false, _editingRisk:false, epfBasic:0, epfMode:'balance' };
            var epfPanel    = document.getElementById('fp-epf-panel');
            var epfBal      = document.getElementById('fp-epf-balance');
            var epfBasic    = document.getElementById('fp-epf-basic');
            var epfSum      = document.getElementById('fp-epf-summary');
            var cryptoBtn   = document.getElementById('fp-existing-crypto-btn');
            if (epfPanel)    epfPanel.classList.add('hidden');
            if (epfBal)      epfBal.value = '';
            if (epfBasic)    epfBasic.value = '';
            if (epfSum)      epfSum.classList.add('hidden');
            if (cryptoBtn) cryptoBtn.classList.remove('fp-existing-active');
            var cryptoActive = document.getElementById('fp-crypto-active');
            if (cryptoActive) cryptoActive.classList.add('hidden');
            var cryptoModal = document.getElementById('fp-crypto-modal');
            if (cryptoModal) cryptoModal.style.display = 'none';
            ['fp-name','fp-age','fp-retire-age','fp-income','fp-invest-amt'].forEach(function(id){ var el=document.getElementById(id); if(el) el.value=''; });
            ['fp-income-words','fp-invest-words'].forEach(function(id){ var el=document.getElementById(id); if(el) el.textContent='—'; });
            document.querySelectorAll('.fp-goal-tile').forEach(function(b){ b.classList.remove('fp-goal-tile-active'); });
            document.querySelectorAll('.fp-existing-btn').forEach(function(b){ b.classList.remove('fp-existing-active'); });
            var ci = document.getElementById('fp-existing-custom-input'); if(ci) ci.classList.add('hidden');
            var ct = document.getElementById('fp-existing-custom-text'); if(ct) ct.value='';
            var gd = document.getElementById('fp-goal-details'); if(gd) gd.classList.add('hidden');
            var gc = document.getElementById('fp-goal-cards');   if(gc) gc.innerHTML='';
            var ea = document.getElementById('fp-existing-amounts'); if(ea){ ea.classList.add('hidden'); ea.innerHTML='<p class="text-[10px] text-slate-400 font-semibold uppercase tracking-wide">' + _t('fp.existing.label') + '</p>'; }
            var es = document.getElementById('fp-existing-section'); if(es) es.innerHTML='';
            fpGoStep(1);
            fpUpdateTabNav(1);
            // Reset two-column layout
            var leftCol  = document.getElementById('fp-left-col');
            var rightCol = document.getElementById('fp-right-col');
            if (leftCol)  leftCol.classList.remove('hidden');
            if (rightCol) { rightCol.classList.add('lg:w-1/2'); rightCol.classList.remove('w-full'); }
            // Reset tab dots to initial state
            [1,2,3].forEach(function(s) {
                var btn = document.getElementById('fp-tab-' + s); if (!btn) return;
                btn.className = btn.className.replace(/fp-tab-(active|inactive|done)-pill/g, '');
                btn.classList.add(s === 1 ? 'fp-tab-active-pill' : 'fp-tab-inactive-pill');
                var dot = btn.querySelector('.fp-tab-dot'); if (dot) dot.textContent = s;
            });
            var tab4 = document.getElementById('fp-tab-4');
            if (tab4) { tab4.className = tab4.className.replace(/fp-tab-(active|inactive|done)-pill/g, ''); tab4.classList.add('fp-tab-inactive-pill'); }
            var rc=document.getElementById('fp-results-card'); if(rc) rc.classList.add('hidden');
            var rp=document.getElementById('fp-results-placeholder'); if(rp) rp.classList.remove('hidden');
            fpLiveUpdate();
            if (typeof saveUserData === 'function') saveUserData();
        }

        // ==================== END FINANCIAL PLAN ====================