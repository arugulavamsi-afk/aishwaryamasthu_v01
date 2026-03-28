        let chartInstance = null;
        let currentMode = 'dashboard';
        let goalCalculateClicked = false;

        // Per-tab state to preserve values when switching tabs
        const tabState = {
            growth: { invType: 'lumpsum', amount: '', rate: '', years: '', inflationEnabled: false, infRate: '', ltcgEnabled: false },
            goal:   { invType: 'lumpsum', goalType: 'vehicle', customGoalText: '', customRate: '' }
        };

        // Dedicated goal-only amount/years — never shared with growth DOM fields
        // Stored separately so loadUserData cannot cross-contaminate them
        window._goalAmount = window._goalAmount || '';
        window._goalYears  = window._goalYears  || '';

        // Expose to window so the first-script persistence functions can access them
        window._tabState    = tabState;
        Object.defineProperty(window, '_currentMode', { get: function(){ return currentMode; } });


        function saveTabState(mode) {
            if (window._switchingMode) return; // guard: don't save during mode switch
            if (mode === 'growth' || mode === 'inflation') {
                tabState.growth.invType  = document.getElementById('inv-type').value;
                tabState.growth.amount   = document.getElementById('amount').value;
                tabState.growth.rate     = document.getElementById('rate').value;
                tabState.growth.years    = document.getElementById('years').value;
                tabState.growth.inflationEnabled = document.getElementById('inflation-toggle').checked;
                tabState.growth.infRate  = document.getElementById('inf-rate').value;
                tabState.growth.ltcgEnabled = document.getElementById('ltcg-toggle')?.checked || false;
            } else if (mode === 'goal') {
                tabState.goal.invType        = document.getElementById('inv-type').value;
                tabState.goal.goalType       = document.getElementById('goal-type').value;
                tabState.goal.customGoalText = document.getElementById('custom-goal-text')?.value || '';
                tabState.goal.customRate     = document.getElementById('custom-rate').value;
                tabState.goal.goalInflRate   = document.getElementById('goal-infl-rate')?.value || '';
                // Store in dedicated vars — isolated from growth DOM
                window._goalAmount = document.getElementById('amount').value;
                window._goalYears  = document.getElementById('years').value;
            }
        }

        function restoreTabState(mode) {
            if (mode === 'growth') {
                const s = tabState.growth;
                document.getElementById('inv-type').value = s.invType;
                const amountEl = document.getElementById('amount');
                amountEl.value = s.amount;
                if (s.amount && s.amount !== '0') {
                    amountEl.classList.remove('text-slate-400');
                } else {
                    amountEl.value = '0';
                    amountEl.classList.add('text-slate-400');
                }
                formatInput(amountEl, 'amount-words');
                const rateEl = document.getElementById('rate');
                rateEl.value = s.rate || '0';
                if (s.rate && parseFloat(s.rate) !== 0) rateEl.classList.remove('text-slate-400');
                else rateEl.classList.add('text-slate-400');
                updateWords('rate', 'rate-words');
                const yearsEl = document.getElementById('years');
                if (s.years && s.years !== '0') {
                    yearsEl.value = s.years;
                    yearsEl.classList.remove('text-slate-400');
                } else {
                    yearsEl.value = '';
                    yearsEl.classList.remove('text-slate-400');
                    document.getElementById('years-words').innerText = '';
                }
                updateWords('years', 'years-words');
                // Inflation toggle
                const toggle = document.getElementById('inflation-toggle');
                toggle.checked = s.inflationEnabled;
                document.getElementById('toggle-track').classList.toggle('on', s.inflationEnabled);
                document.getElementById('toggle-thumb').classList.toggle('on', s.inflationEnabled);
                document.getElementById('inflation-rate-container').classList.toggle('hidden', !s.inflationEnabled);
                // LTCG toggle
                const ltcgTog = document.getElementById('ltcg-toggle');
                if (ltcgTog) ltcgTog.checked = s.ltcgEnabled || false;
                if (s.inflationEnabled) {
                    currentMode = 'inflation';
                    const infEl = document.getElementById('inf-rate');
                    infEl.value = s.infRate || '0';
                    if (s.infRate && parseFloat(s.infRate) !== 0) {
                        infEl.classList.remove('text-slate-400');
                        infEl.classList.add('text-rose-900');
                    } else {
                        infEl.classList.add('text-slate-400');
                        infEl.classList.remove('text-rose-900');
                    }
                    updateWords('inf-rate', 'inf-rate-words');
                } else {
                    currentMode = 'growth';
                }
            } else if (mode === 'goal') {
                const s = tabState.goal;
                document.getElementById('inv-type').value = s.invType || 'lumpsum';

                // Amount — read ONLY from dedicated window._goalAmount, never from growth DOM
                const amountEl  = document.getElementById('amount');
                const wordsEl   = document.getElementById('amount-words');
                if (window._goalAmount && window._goalAmount !== '0') {
                    amountEl.value = window._goalAmount;
                    amountEl.classList.remove('text-slate-400');
                } else {
                    amountEl.value = '';
                    amountEl.classList.remove('text-slate-400');
                    if (wordsEl) wordsEl.innerText = '';
                }
                formatInput(amountEl, 'amount-words');

                // Years — read ONLY from dedicated window._goalYears, never from growth DOM
                const yearsEl  = document.getElementById('years');
                const yWordsEl = document.getElementById('years-words');
                if (window._goalYears && window._goalYears !== '0') {
                    yearsEl.value = window._goalYears;
                    yearsEl.classList.remove('text-slate-400');
                } else {
                    yearsEl.value = '';
                    yearsEl.classList.remove('text-slate-400');
                    if (yWordsEl) yWordsEl.innerText = '';
                }
                updateWords('years', 'years-words');

                document.getElementById('goal-type').value = s.goalType || 'vehicle';
                const customInput = document.getElementById('custom-goal-input');
                if (customInput) customInput.style.display = s.goalType === 'custom' ? 'block' : 'none';
                const customText = document.getElementById('custom-goal-text');
                if (customText) customText.value = s.customGoalText || '';
                const customRateEl = document.getElementById('custom-rate');
                customRateEl.value = s.customRate || '';
                updateWords('custom-rate', 'custom-rate-words');
                if (s.goalInflRate) {
                    const ir = document.getElementById('goal-infl-rate');
                    if (ir) ir.value = s.goalInflRate;
                }
            }
        }

        function resetGrowthCalc() {
            tabState.growth = { invType: 'lumpsum', amount: '', rate: '', years: '', inflationEnabled: false, infRate: '' };
            document.getElementById('inv-type').value = 'lumpsum';
            const amountEl = document.getElementById('amount');
            amountEl.value = '0'; amountEl.classList.add('text-slate-400');
            formatInput(amountEl, 'amount-words');
            const rateEl = document.getElementById('rate');
            rateEl.value = '0'; rateEl.classList.add('text-slate-400');
            updateWords('rate', 'rate-words');
            const yearsEl = document.getElementById('years');
            yearsEl.value = '0'; yearsEl.classList.add('text-slate-400');
            updateWords('years', 'years-words');
            const toggle = document.getElementById('inflation-toggle');
            toggle.checked = false;
            document.getElementById('toggle-track').classList.remove('on');
            document.getElementById('toggle-thumb').classList.remove('on');
            document.getElementById('inflation-rate-container').classList.add('hidden');
            const infEl = document.getElementById('inf-rate');
            infEl.value = '0'; infEl.classList.add('text-slate-400'); infEl.classList.remove('text-rose-900');
            // Reset LTCG toggle
            const ltcgToggle = document.getElementById('ltcg-toggle');
            if (ltcgToggle) ltcgToggle.checked = false;
            const ltcgRow = document.getElementById('ltcg-result-row');
            if (ltcgRow) ltcgRow.classList.add('hidden');
            currentMode = 'growth';
            calculate();
            if (typeof saveUserData === 'function') saveUserData();
        }

        function resetGoalPlanner() {
            tabState.goal = { invType: 'lumpsum', amount: '', years: '', goalType: 'vehicle', customGoalText: '', customRate: '' };
            document.getElementById('inv-type').value = 'lumpsum';
            const amountEl = document.getElementById('amount');
            amountEl.value = '0'; amountEl.classList.add('text-slate-400');
            formatInput(amountEl, 'amount-words');
            const yearsEl = document.getElementById('years');
            yearsEl.value = '0'; yearsEl.classList.add('text-slate-400');
            updateWords('years', 'years-words');
            document.getElementById('goal-type').value = 'vehicle';
            const customInput = document.getElementById('custom-goal-input');
            if (customInput) customInput.style.display = 'none';
            const customText = document.getElementById('custom-goal-text');
            if (customText) customText.value = '';
            const customRateEl = document.getElementById('custom-rate');
            customRateEl.value = ''; updateWords('custom-rate', 'custom-rate-words');
            goalCalculateClicked = false;
            document.getElementById('invest-suggestions').classList.add('hidden');
            calculate();
            if (typeof saveUserData === 'function') saveUserData();
        }

        const quotes = [
            "Compound interest is the eighth wonder of the world.", "Time is your greatest asset in investing.", "Patience is the key to building wealth.", "Invest in yourself first.", "The best time to plant a tree was 20 years ago. The second best time is now.",
            "Do not save what is left after spending, spend what is left after saving.", "Risk comes from not knowing what you are doing.", "Wealth consists not in having great possessions, but in having few wants.", "An investment in knowledge pays the best interest.", "Money is a terrible master but an excellent servant.",
            "Never depend on single income. Make investment to create a second source.", "Small disciplines repeated with consistency every day lead to great achievements.", "The stock market is a device for transferring money from the impatient to the patient.", "Financial peace isn't the acquisition of stuff. It's learning to live on less than you make.", "Opportunities come infrequently. When it rains gold, put out the bucket.",
            "Know what you own, and know why you own it.", "It's not how much money you make, but how much money you keep.", "A penny saved is a penny earned.", "Every dollar you save is a step closer to financial freedom.", "Don't let your money sit idle; put it to work.",
            "Rich people acquire assets. The poor and middle class acquire liabilities.", "In investing, what is comfortable is rarely profitable.", "The individual investor should act consistently as an investor and not as a speculator.", "Wide diversification is only required when investors do not understand what they are doing.", "You get recessions, you have stock market declines. If you don't understand that's going to happen, then you're not ready.",
            "Behind every stock is a company. Find out what it's doing.", "Price is what you pay. Value is what you get.", "The biggest risk of all is not taking one.", "We don't have to be smarter than the rest. We have to be more disciplined.", "Investing should be more like watching paint dry or watching grass grow.",
            "Time in the market beats timing the market.", "Rule No. 1: Never lose money. Rule No. 2: Never forget Rule No. 1.", "Someone's sitting in the shade today because someone planted a tree a long time ago.", "Buy not on optimism, but on arithmetic.", "Minimizing downside risk while maximizing the upside is a powerful concept.",
            "If you aren't thinking about owning a stock for 10 years, don't even think about owning it for 10 minutes.", "The secret to wealth is simple: Find a way to do more for others than anyone else does.", "Money grows on the tree of persistence.", "Start small, think big, grow fast.",
            "A budget is telling your money where to go instead of wondering where it went.", "Beware of little expenses; a small leak will sink a great ship.", "The four most dangerous words in investing are: 'This time it's different.'", "Invest for the long haul.",
            "Save blindly, invest wisely.", "A journey of a thousand miles begins with a single step.", "Wealth is the ability to fully experience life.", "Don't work for money; make it work for you.", "Failing to plan is planning to fail.",
            "If you buy things you do not need, soon you will have to sell things you need.", "Money is only a tool. It will take you wherever you wish, but it will not replace you as the driver.",
            "Wealth flows from energy and ideas.", "Every day is a bank account, and time is our currency.",
            "The best investment you can make is in your own abilities.", "It's not about the money, it's about the freedom.", "To get rich, you have to be making money while you're asleep.",
            "Financial freedom is available to those who learn about it and work for it.", "Keep your eyes on the price, not the crowd.", "Simplicity is the ultimate sophistication in investing.",
            "Debt is a trap. Compounding is the key.", "Spend less than you earn. Invest the surplus. Avoid debt.", "Be fearful when others are greedy, and greedy when others are fearful.", "The secret of getting ahead is getting started.", "Discipline is the bridge between goals and accomplishment.",
            "Every time you borrow money, you're robbing your future self.", "A goal without a timeline is just a dream.",
            "The more you learn, the more you earn.", "Action is the foundational key to all success.", "What gets measured gets managed.",
            "Investing is a marathon, not a sprint.", "Focus on the process, not just the prize.", "Consistency is the DNA of financial success.", "Make your money your hardest working employee.", "Today's sacrifices are tomorrow's wealth."
        ];

        function numberToWords(num) {
            if (isNaN(num) || num === null || num === undefined) return '';
            if (num === 0) return 'Zero';
            if (num < 0) return 'Negative ' + numberToWords(Math.abs(num));
            const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
            const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
            function convertGroup(n) {
                let str = "";
                if (n > 99) { str += a[Math.floor(n / 100)] + "Hundred "; n %= 100; }
                if (n > 19) { str += b[Math.floor(n / 10)] + " "; n %= 10; }
                if (n > 0) { str += a[n]; }
                return str;
            }
            let res = "";
            let crore = Math.floor(num / 10000000); num %= 10000000;
            let lakh = Math.floor(num / 100000); num %= 100000;
            let thousand = Math.floor(num / 1000); num %= 1000;
            if (crore > 0) res += convertGroup(crore) + "Crore ";
            if (lakh > 0) res += convertGroup(lakh) + "Lakh ";
            if (thousand > 0) res += convertGroup(thousand) + "Thousand ";
            if (num > 0) res += convertGroup(num);
            return res.trim();
        }

        function formatInput(el, wordsId) {
            let val = el.value.replace(/[^0-9]/g, "");
            if (val === "") { el.value = ""; document.getElementById(wordsId).innerText = "Zero"; return; }
            let num = parseInt(val, 10);
            el.value = new Intl.NumberFormat('en-IN').format(num);
            document.getElementById(wordsId).innerText = numberToWords(num);
        }

        function updateWords(inputId, wordsId) {
            let val = parseFloat(document.getElementById(inputId).value);
            document.getElementById(wordsId).innerText = isNaN(val) ? "" : numberToWords(Math.round(val));
        }

        // ===== Animated number counter =====
        function animateCounter(el, targetText, duration = 700) {
            // Extract numeric value from formatted string like ₹1,23,456
            const numMatch = targetText.replace(/[^\d]/g, '');
            const target = parseInt(numMatch, 10) || 0;
            if (!target || target === 0) { el.innerText = targetText; return; }
            // Flip-in animation
            el.classList.remove('result-flip-in');
            void el.offsetWidth;
            el.classList.add('result-flip-in');
            const start = performance.now();
            const fmt = (v) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v);
            function step(now) {
                const elapsed = now - start;
                const progress = Math.min(elapsed / duration, 1);
                // ease-out cubic
                const eased = 1 - Math.pow(1 - progress, 3);
                el.innerText = fmt(Math.round(target * eased));
                if (progress < 1) requestAnimationFrame(step);
                else el.innerText = targetText;
            }
            requestAnimationFrame(step);
        }

        /* ===== MOBILE DROPDOWN HELPERS ===== */
        const _mobTabMeta = {
            dashboard:   { label: 'Dashboard',             icon: '🏡' },
            growth:      { label: 'Growth Calculator', icon: '📈' },
            goal:        { label: 'Goal Planner',       icon: '🎯' },
            emergency:   { label: 'Emergency Fund',     icon: '🛡️' },
            mfkit:       { label: 'MF Kit',             icon: '💼' },
            fundpicker:  { label: 'Fund Picker Guide',  icon: '🔬' },
            healthscore: { label: 'Fin Health Score',   icon: '💗' },
            finplan:     { label: 'Financial Plan',     icon: '📋' },
            mfexplorer:  { label: 'MF Explorer',        icon: '🔭' },
            taxguide:    { label: 'Tax Guide',            icon: '🧾' },
            homeloan:    { label: 'Home Loan Advisor',     icon: '🏠' },
            stepupsip:   { label: 'Step-Up SIP',             icon: '📈' },
            epfcalc:     { label: 'EPF Corpus Projector',    icon: '🏦' },
            ssaplanner:  { label: 'SSA + Child Planner',      icon: '👧' },
            drawdown:    { label: 'Retirement Drawdown',       icon: '🏖️' },
            ppfnps:      { label: 'PPF & NPS Calculator',      icon: '🏛️' },
            ctcoptimizer:{ label: 'CTC & Salary Optimizer',    icon: '💰' },
            insure:      { label: 'Insurance Adequacy',         icon: '🛡️' },
            gratuity:    { label: 'Gratuity Calculator',        icon: '🏅' },
            debtplan:    { label: 'Loan Prepayment Planner',    icon: '⚡' },
            jointplan:   { label: 'Joint Family Planner',       icon: '👨‍👩‍👧' },
            cibil:       { label: 'CIBIL Score Tracker',        icon: '🏦' },
            fincal:      { label: 'Financial Calendar',         icon: '📅' },
            selfempl:    { label: 'Self-Employed & Business',   icon: '🧾' },
            goldcomp:    { label: 'Gold Investment Comparator', icon: '🥇' },
            'dashcat-calc': { label: 'Calculators',    icon: '⚡' },
            'dashcat-mf':   { label: 'Mutual Funds',   icon: '📊' },
            'dashcat-tax':  { label: 'Planning & Tax', icon: '🗺️' },
            'dashcat-fav':  { label: 'Favourites',     icon: '⭐' }
        };

        function toggleMobileDropdown() {
            const menu    = document.getElementById('mobile-dropdown-menu');
            const chevron = document.getElementById('mobile-dropdown-chevron');
            const isOpen  = !menu.classList.contains('hidden');
            if (isOpen) {
                closeMobileDropdown();
            } else {
                menu.classList.remove('hidden');
                chevron.style.transform = 'rotate(180deg)';
            }
        }

        function closeMobileDropdown() {
            const menu    = document.getElementById('mobile-dropdown-menu');
            const chevron = document.getElementById('mobile-dropdown-chevron');
            if (menu) menu.classList.add('hidden');
            if (chevron) chevron.style.transform = 'rotate(0deg)';
        }

        function mobileSwitchMode(mode) {
            switchMode(mode);
            closeMobileDropdown();
        }

        function updateMobileDropdown(mode) { updateBreadcrumb(mode); } // legacy compat

        var _prevCategoryMode = null; // tracks which dashcat-* panel a tool was opened from

        function updateBreadcrumb(mode) {
            const meta = _mobTabMeta[mode];
            const bc   = document.getElementById('nav-breadcrumb');
            const icon = document.getElementById('nav-bc-icon');
            const lbl  = document.getElementById('nav-bc-label');
            if (!bc) return;
            if (mode === 'dashboard' || !meta) {
                bc.classList.remove('flex');
                bc.classList.add('hidden');
            } else {
                bc.classList.remove('hidden');
                bc.classList.add('flex');
                if (icon) icon.textContent = meta.icon;
                if (lbl)  lbl.textContent  = meta.label;

                // Show category breadcrumb segment if user drilled in from a category panel
                const catBtn  = document.getElementById('nav-bc-cat-btn');
                const catSep  = document.getElementById('nav-bc-sep-cat');
                const toolSep = document.getElementById('nav-bc-sep-tool');
                const catMeta = _prevCategoryMode ? _mobTabMeta[_prevCategoryMode] : null;

                if (catMeta && !mode.startsWith('dashcat-')) {
                    if (catBtn) {
                        catBtn.textContent = catMeta.icon + ' ' + catMeta.label;
                        const _cat = _prevCategoryMode;
                        catBtn.onclick = function() { switchMode(_cat); };
                        catBtn.classList.remove('hidden');
                        catBtn.classList.add('flex');
                    }
                    if (catSep)  { catSep.classList.remove('hidden');  catSep.classList.add('inline'); }
                    if (toolSep) { toolSep.classList.remove('hidden'); toolSep.classList.add('inline'); }
                } else {
                    if (catBtn)  { catBtn.classList.add('hidden');  catBtn.classList.remove('flex'); }
                    if (catSep)  { catSep.classList.add('hidden');  catSep.classList.remove('inline'); }
                    if (toolSep) { toolSep.classList.add('hidden'); toolSep.classList.remove('inline'); }
                }
            }
        }

        // Close dropdown when clicking outside
        document.addEventListener('click', function(e) {
            const dd = document.getElementById('mobile-tab-dropdown');
            if (dd && !dd.contains(e.target)) closeMobileDropdown();
        });

        function switchMode(mode) {
            // Always scroll to top on any mode switch
            window.scrollTo({ top: 0, behavior: 'instant' });

            // Track category context for breadcrumb back-navigation
            if (mode === 'dashboard' || mode.startsWith('dashcat-')) {
                // Going to dashboard or a category panel — clear category tracking
                _prevCategoryMode = null;
            } else if (typeof currentMode === 'string' && currentMode.startsWith('dashcat-')) {
                // Drilling into a tool from a category panel — remember it
                _prevCategoryMode = currentMode;
            }
            // If tool-hopping (tool → tool), keep existing _prevCategoryMode so back still works

            // Update breadcrumb instead of pill tabs
            updateBreadcrumb(mode);
            // Save current tab state before switching
            saveTabState(currentMode);

            // Guard: prevent any calculate()->saveTabState() calls during the switch
            // from snapshotting the wrong DOM values into the new tab's state
            window._switchingMode = true;

            currentMode = mode;
            // No pill tabs to update — breadcrumb handled by updateBreadcrumb()

            const isDashboard  = mode === 'dashboard';
            const isEmergency  = mode === 'emergency';
            const isMFKit      = mode === 'mfkit';
            const isFundPicker = mode === 'fundpicker';
            const isGoal       = mode === 'goal';
            const isHealthScore= mode === 'healthscore';
            const isFinPlan    = mode === 'finplan';
            const isMFExplorer = mode === 'mfexplorer';
            const isTaxGuide   = mode === 'taxguide';
            const isHomeLoan   = mode === 'homeloan';
            const isStepUpSIP  = mode === 'stepupsip';
            const isEPFCalc    = mode === 'epfcalc';
            const isSSAPlanner = mode === 'ssaplanner';
            const isDrawdown      = mode === 'drawdown';
            const isPPFNPS        = mode === 'ppfnps';
            const isCtcOptimizer  = mode === 'ctcoptimizer';
            const isInsure        = mode === 'insure';
            const isGratuity      = mode === 'gratuity';
            const isDebtPlan      = mode === 'debtplan';
            const isJointPlan     = mode === 'jointplan';
            const isCibil         = mode === 'cibil';
            const isFinCal        = mode === 'fincal';
            const isSelfEmpl      = mode === 'selfempl';
            const isGoldComp      = mode === 'goldcomp';
            const isDashCalc      = mode === 'dashcat-calc';
            const isDashMF        = mode === 'dashcat-mf';
            const isDashTax       = mode === 'dashcat-tax';
            const isDashFav       = mode === 'dashcat-fav';
            const isFullPanel  = isDashboard || isEmergency || isMFKit || isFundPicker || isHealthScore || isFinPlan || isMFExplorer || isTaxGuide || isHomeLoan || isStepUpSIP || isEPFCalc || isSSAPlanner || isDrawdown || isPPFNPS || isCtcOptimizer || isInsure || isGratuity || isDebtPlan || isJointPlan || isCibil || isFinCal || isSelfEmpl || isGoldComp || isDashCalc || isDashMF || isDashTax || isDashFav;

            // Show/hide main panels
            const leftPanel = document.getElementById('growth-left-panel');
            const rightPanel = document.querySelector('main > div.w-full.lg\\:w-2\\/3');
            ['dashboard-panel','emergency-panel','mfkit-panel','fundpicker-panel','healthscore-panel','finplan-panel','mfexplorer-panel','taxguide-panel','homeloan-panel','stepupsip-panel','epfcalc-panel','ssaplanner-panel','drawdown-panel','ppfnps-panel','ctcoptimizer-panel','insure-panel','gratuity-panel','debtplan-panel','jointplan-panel','cibil-panel','fincal-panel','selfempl-panel','goldcomp-panel','dashcat-calc-panel','dashcat-mf-panel','dashcat-tax-panel','dashcat-fav-panel'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.classList.add('hidden');
            });
            const activeId = isDashboard ? 'dashboard-panel' : isEmergency ? 'emergency-panel' : isMFKit ? 'mfkit-panel' : isFundPicker ? 'fundpicker-panel' : isHealthScore ? 'healthscore-panel' : isFinPlan ? 'finplan-panel' : isMFExplorer ? 'mfexplorer-panel' : isTaxGuide ? 'taxguide-panel' : isHomeLoan ? 'homeloan-panel' : isStepUpSIP ? 'stepupsip-panel' : isEPFCalc ? 'epfcalc-panel' : isSSAPlanner ? 'ssaplanner-panel' : isDrawdown ? 'drawdown-panel' : isPPFNPS ? 'ppfnps-panel' : isCtcOptimizer ? 'ctcoptimizer-panel' : isInsure ? 'insure-panel' : isGratuity ? 'gratuity-panel' : isDebtPlan ? 'debtplan-panel' : isJointPlan ? 'jointplan-panel' : isCibil ? 'cibil-panel' : isFinCal ? 'fincal-panel' : isSelfEmpl ? 'selfempl-panel' : isGoldComp ? 'goldcomp-panel' : isDashCalc ? 'dashcat-calc-panel' : isDashMF ? 'dashcat-mf-panel' : isDashTax ? 'dashcat-tax-panel' : isDashFav ? 'dashcat-fav-panel' : null;
            if (activeId) {
                const el = document.getElementById(activeId);
                el.classList.remove('hidden');
                el.classList.remove('panel-fade');
                void el.offsetWidth;
                el.classList.add('panel-fade');
            }
            if (!isFullPanel && leftPanel) {
                leftPanel.classList.remove('panel-fade');
                void leftPanel.offsetWidth;
                leftPanel.classList.add('panel-fade');
            }
            if (leftPanel) leftPanel.style.display = isFullPanel ? 'none' : '';
            if (rightPanel) rightPanel.style.display = isFullPanel ? 'none' : '';

            if (isEmergency) { calcEmergency(); applyLang(); return; }
            if (isMFKit) { renderMFKit(); applyLang(); return; }
            if (isFundPicker) { renderFundPickerPage(); applyLang(); return; }
            if (isHealthScore) { applyLang(); return; }
            if (isFinPlan) { fpInitQuestions(); applyLang(); return; }
            if (isMFExplorer) { initMFExplorer(); applyLang(); return; }
            if (isDashboard)  {
                if (typeof initDashboard === 'function') initDashboard();
                applyLang();
                return;
            } // dashboard-panel shown, no init needed
            if (isTaxGuide)   { initTaxGuide();   applyLang(); return; }
            if (isHomeLoan)   { initHomeLoan();   applyLang(); return; }
            if (isStepUpSIP)  { initStepUpSIP();  applyLang(); return; }
            if (isEPFCalc)    { initEPFCalc();    applyLang(); return; }
            if (isSSAPlanner) { initSSAPlanner(); applyLang(); return; }
            if (isDrawdown)      { initDrawdown();      applyLang(); return; }
            if (isPPFNPS)        { initPPFNPS();        applyLang(); return; }
            if (isCtcOptimizer)  { initCtcOptimizer();  applyLang(); return; }
            if (isInsure)        { initInsure();        applyLang(); return; }
            if (isGratuity)      { initGratuity();      applyLang(); return; }
            if (isDebtPlan)      { initDebtPlan();      applyLang(); return; }
            if (isJointPlan)     { initJointPlan();     applyLang(); return; }
            if (isCibil)         { initCibil();         applyLang(); return; }
            if (isFinCal)        { initFinCal();        applyLang(); return; }
            if (isSelfEmpl)      { initSelfEmpl();      applyLang(); return; }
            if (isGoldComp)      { initGoldComp();      applyLang(); return; }
            if (isDashCalc)      { _dashInjectPinBtns('dashcat-calc-panel'); applyLang(); return; }
            if (isDashMF)        { _dashInjectPinBtns('dashcat-mf-panel');   applyLang(); return; }
            if (isDashTax)       { _dashInjectPinBtns('dashcat-tax-panel');  applyLang(); return; }
            if (isDashFav)       { initDashFav();       applyLang(); return; }

            // Show/hide reset buttons
            document.getElementById('reset-growth-btn').style.display = isGoal ? 'none' : 'flex';
            document.getElementById('reset-goal-btn').style.display = isGoal ? 'flex' : 'none';

            // Toggle panel headers
            document.getElementById('growth-panel-header').classList.toggle('hidden', isGoal);
            document.getElementById('goal-panel-header').classList.toggle('hidden', !isGoal);
            document.getElementById('growth-results-header').classList.toggle('hidden', isGoal);
            document.getElementById('goal-results-header').classList.toggle('hidden', !isGoal);

            document.getElementById('rate-container').style.display = isGoal ? 'none' : 'block';
            document.getElementById('inflation-toggle-container').style.display = isGoal ? 'none' : 'block';
            document.getElementById('ltcg-toggle-container').style.display = isGoal ? 'none' : 'block';
            if (isGoal) {
                document.getElementById('inflation-rate-container').classList.add('hidden');
                const toggle = document.getElementById('inflation-toggle');
                toggle.checked = false;
                document.getElementById('toggle-track').classList.remove('on');
                document.getElementById('toggle-thumb').classList.remove('on');
                currentMode = 'goal';
                // Hide investment suggestions until Calculate is clicked
                document.getElementById('invest-suggestions').classList.add('hidden');
                goalCalculateClicked = false;
            }
            document.getElementById('custom-rate-container').style.display = isGoal ? 'block' : 'none';
            document.getElementById('goal-type-container').style.display = isGoal ? 'block' : 'none';
            document.getElementById('goal-inflation-section').classList.toggle('hidden', !isGoal);
            document.getElementById('amount-label').innerText = isGoal ? _t('lbl.gr.todaycost') : _t('lbl.gr.amount');
            if (isGoal) goalInflSetDefaults();
            document.getElementById('years-label').innerText = isGoal ? 'Goal Term (Years)' : 'Time Period (Years)';
            document.getElementById('calc-btn').innerText = isGoal ? 'Calculate Required Investment' : 'Calculate Projection';
            document.getElementById('growth-results').style.display = isGoal ? 'none' : 'block';
            document.getElementById('goal-results').style.display = isGoal ? 'block' : 'none';

            // Guard already set at top of switchMode
            try {
                restoreTabState(isGoal ? 'goal' : 'growth');

                // After restore: clear amount + years if goal mode has no saved values
                if (isGoal) {
                    const amtEl   = document.getElementById('amount');
                    const yrsEl   = document.getElementById('years');
                    const wordsEl = document.getElementById('amount-words');
                    const yWrdsEl = document.getElementById('years-words');
                    if (amtEl && (amtEl.value === '0' || amtEl.value === '')) {
                        amtEl.value = '';
                        amtEl.classList.remove('text-slate-400');
                        if (wordsEl) wordsEl.innerText = '';
                    }
                    if (yrsEl && (yrsEl.value === '0' || yrsEl.value === '')) {
                        yrsEl.value = '';
                        yrsEl.classList.remove('text-slate-400');
                        if (yWrdsEl) yWrdsEl.innerText = '';
                    }
                }
            } finally {
                window._switchingMode = false;
            }
            onYearsChange();
            calculate();
        }

        function onInflationToggle() {
            const toggle = document.getElementById('inflation-toggle');
            const track = document.getElementById('toggle-track');
            const thumb = document.getElementById('toggle-thumb');
            if (toggle.checked) {
                track.classList.add('on');
                thumb.classList.add('on');
                document.getElementById('inflation-rate-container').classList.remove('hidden');
                currentMode = 'inflation';
            } else {
                track.classList.remove('on');
                thumb.classList.remove('on');
                document.getElementById('inflation-rate-container').classList.add('hidden');
                currentMode = 'growth';
            }
            calculate();
        }

        function onGoalTypeChange() {
            const gt = document.getElementById('goal-type').value;
            document.getElementById('custom-goal-input').style.display = gt === 'custom' ? 'block' : 'none';
            goalInflSetDefaults();
            calculate();
        }

        function onYearsChange() {
            if (currentMode !== 'goal') {
                document.getElementById('short-term-note').style.display = 'none';
                return;
            }
            const y = parseInt(document.getElementById('years').value) || 0;
            document.getElementById('short-term-note').style.display = y > 0 && y < 7 ? 'block' : 'none';
        }

        function getGoalLabel() {
            const gt = document.getElementById('goal-type');
            if (!gt) return 'Your Goal';
            const map = { vehicle:'🚗 Buy a Vehicle', marriage:'💍 Marriage', education:"🎓 Child's Education", retirement:'🏖️ Retirement', custom:'✏️ Custom' };
            if (gt.value === 'custom') {
                const txt = document.getElementById('custom-goal-text')?.value.trim();
                return txt ? '✏️ ' + txt : '✏️ Custom Goal';
            }
            return map[gt.value] || 'Your Goal';
        }

        function getRiskDots(level) {
            // level 1-5
            const colors = ['', '#22c55e', '#84cc16', '#eab308', '#f97316', '#ef4444'];
            let html = '<div class="flex items-center gap-1">';
            for (let i = 1; i <= 5; i++) {
                if (i <= level) {
                    html += `<div class="risk-dot" style="background:${colors[level]};width:10px;height:10px;border-radius:50%;flex-shrink:0;"></div>`;
                } else {
                    html += `<div class="risk-dot empty" style="background:#e2e8f0;width:10px;height:10px;border-radius:50%;flex-shrink:0;"></div>`;
                }
            }
            html += '</div>';
            return html;
        }

        function getRiskColor(level) {
            return ['','#16a34a','#65a30d','#ca8a04','#ea580c','#dc2626'][level];
        }

        function getInvestmentSuggestions(years) {
            if (years < 7) {
                return [
                    { name:'Fixed Deposit (FD)', icon:'🏦', returns:'6.5 – 8%', risk:1, riskLabel:'Very Low',
                      why:'Bank-guaranteed returns. Ideal capital protection for short goals.',
                      what:'A Fixed Deposit is a savings product offered by banks where you deposit a lump sum for a fixed tenure at a predetermined interest rate. The principal and interest are guaranteed by the bank.',
                      scenarios:'Best when you need guaranteed, predictable returns for a specific date. Ideal for emergency funds, short-term savings goals (1–5 years), or when capital protection is your top priority.',
                      example:'Priya deposits ₹5,00,000 in an FD at 7.5% for 3 years. At maturity she receives ₹6,23,000 — a guaranteed gain of ₹1,23,000 with zero market risk.' },
                    { name:'Recurring Deposit (RD)', icon:'📅', returns:'6 – 7.5%', risk:1, riskLabel:'Very Low',
                      why:'Build corpus monthly with fixed returns, no market risk.',
                      what:'An RD lets you invest a fixed amount every month for a chosen period. Interest is compounded quarterly and the maturity amount is guaranteed by the bank — similar to an FD but with monthly contributions.',
                      scenarios:'Perfect if you have a regular monthly surplus and want to build a lump sum without market risk. Great for salaried individuals saving for a specific short-term goal like a vacation or gadget purchase.',
                      example:'Raj invests ₹5,000/month in an RD at 7% for 2 years. At maturity he gets ₹1,29,500 — his total investment of ₹1,20,000 grows by ₹9,500 with complete safety.' },
                    { name:'Liquid Mutual Funds', icon:'💧', returns:'5.5 – 7%', risk:1, riskLabel:'Very Low',
                      why:'Better than savings account, withdraw anytime within hours.',
                      what:'Liquid funds invest in very short-term debt instruments (maturity up to 91 days) like treasury bills and commercial paper. They offer better returns than a savings account with same-day or next-day withdrawal.',
                      scenarios:'Ideal as a parking space for your emergency fund or for money you need access to within days. Use it instead of a savings account to earn more without locking your money.',
                      example:'Anita parks ₹2,00,000 in a liquid fund at 6.5%. After 6 months she earns ~₹6,500 — better than a savings account\'s ₹3,000 — and can withdraw to her bank within hours.' },
                    { name:'Debt Mutual Funds', icon:'📊', returns:'6 – 8.5%', risk:2, riskLabel:'Low',
                      why:'Invests in bonds & govt securities. Slightly better returns than FD.',
                      what:'Debt mutual funds invest in fixed-income instruments like government bonds, corporate bonds, and money market instruments. Returns are generally stable but slightly vary with interest rate changes.',
                      scenarios:'Good for investors who want slightly higher returns than FDs and can tolerate minor fluctuations. Suitable for 1–3 year horizons. Note: Post Apr 2023 Finance Act, gains are taxed at your income slab — same as FD. No indexation benefit anymore.',
                      example:'Vikram invests ₹3,00,000 in a short-duration debt fund at 7.5% for 2 years. He earns ~₹46,800 in returns — more than an FD. Note: Post Apr 2023, debt fund gains are taxed at your income slab rate (no indexation benefit).' },
                    { name:'NSC (Natl. Savings Cert.)', icon:'📜', returns:'7.7%', risk:1, riskLabel:'Very Low',
                      why:'Govt-backed. Qualifies for 80C tax deduction. 5yr lock-in.',
                      what:'NSC is a government-backed savings scheme available at post offices with a fixed 5-year tenure. Interest is compounded annually but paid at maturity. Qualifies for ₹1.5L Section 80C deduction.',
                      scenarios:'Best for tax-saving investors in the 20–30% tax bracket who don\'t need liquidity for 5 years. Excellent risk-free option if you\'ve exhausted PPF and ELSS limits.',
                      example:'Suman invests ₹50,000 in NSC at 7.7% for 5 years. She gets ₹72,500 at maturity and also saves ₹10,400 in income tax (at 20% slab) — an effective return of over 10%.' },
                    { name:'Post Office Time Deposit', icon:'📮', returns:'6.9 – 7.5%', risk:1, riskLabel:'Very Low',
                      why:'Sovereign guarantee. Safe alternative to bank FD.',
                      what:'Post Office Time Deposits are government-backed FD equivalents for 1, 2, 3, or 5 years. Interest is paid annually and the 5-year variant qualifies for 80C tax benefits. Backed by sovereign guarantee.',
                      scenarios:'Ideal for conservative investors in semi-urban or rural areas who trust post office infrastructure, or anyone seeking sovereign guarantee (safer even than most banks). Perfect for senior citizens.',
                      example:'Ramesh, a retiree, deposits ₹10,00,000 in a 5-year Post Office TD at 7.5%. He earns ₹75,000/year in interest — a reliable income stream with zero default risk.' },
                    { name:'POMIS (Post Office MIS)', icon:'📬', returns:'7.4%', risk:1, riskLabel:'Very Low',
                      why:'Monthly interest income. Sovereign guarantee. No market risk.',
                      what:'Post Office Monthly Income Scheme (POMIS) pays interest every month at 7.4% p.a. (current rate, revised quarterly). Maximum investment ₹9L (single) / ₹15L (joint). 5-year tenure. Backed by the Government of India — safer than any bank FD.',
                      scenarios:'Ideal for retirees or anyone needing regular monthly cash flow without touching principal. Perfect substitute for bank FD for those seeking sovereign safety. Works well in Tier-2/3 cities where post office access is easier than bank branches.',
                      example:'Suresh, 58, deposits ₹9,00,000 in POMIS at 7.4%. He gets ₹5,550/month for 5 years — a guaranteed monthly income with full principal returned at maturity.' },
                    { name:'SCSS (Senior Citizen Savings)', icon:'👴', returns:'8.2%', risk:1, riskLabel:'Very Low',
                      why:'Highest guaranteed rate available in India. Only for 60+ (or 55+ VRS).',
                      what:'Senior Citizen Savings Scheme (SCSS) pays 8.2% p.a. — the highest guaranteed rate on any government savings instrument. Available at post offices and authorised banks. Maximum ₹30L per depositor. 5-year tenure (extendable by 3 yrs). 80C deduction available. Interest paid quarterly.',
                      scenarios:'The single best instrument for any retiree aged 60+. Better rate than FDs, debt funds, or any comparable safe instrument. Invest here before any other fixed-income product. Available jointly with spouse — both can invest ₹30L each if eligible.',
                      avoid:'Only for those aged 60+ (or 55+ for voluntary retirement). Premature withdrawal allowed after 1 year with penalty. Interest is taxable at slab rate.',
                      example:'Meena, 62, invests ₹30,00,000 in SCSS at 8.2%. She earns ₹61,500/quarter (₹2,46,000/year) — a risk-free quarterly income that beats every bank FD and debt fund currently available.' },
                    { name:'KVP (Kisan Vikas Patra)', icon:'🌾', returns:'7.5%', risk:1, riskLabel:'Very Low',
                      why:'Doubles your money in ~115 months. Sovereign guarantee.',
                      what:'Kisan Vikas Patra (KVP) is a government savings certificate that doubles your invested amount in a fixed period. Current rate 7.5% p.a. compounds to 2× in ~115 months (9 yrs 7 months). Available at post offices. No upper investment limit. Fully liquid after 2.5 years.',
                      scenarios:'Good for investors who want a simple, zero-thinking savings certificate with a defined doubling period. Useful for those who prefer physical certificates (no demat needed). Popular in rural and semi-urban India.',
                      avoid:'Interest is taxable at slab rate. No 80C benefit. Not ideal for high earners in 30% bracket compared to PPF or ELSS.',
                      example:'Raju invests ₹1,00,000 in KVP at 7.5%. In ~9.5 years his investment automatically becomes ₹2,00,000 — no monitoring needed, backed by the Government of India.' },
                    { name:'RBI Floating Rate Bonds', icon:'🏛️', returns:'7.35% (floating)', risk:1, riskLabel:'Very Low',
                      why:'Sovereign. Rate resets every 6 months vs NSC. Protects against rate rises.',
                      what:'RBI Floating Rate Savings Bonds (FRSB) pay 0.35% above the NSC rate, reset every 6 months (currently 7.35% p.a.). No upper investment limit. 7-year lock-in. Interest paid semi-annually. Backed by RBI — the safest possible issuer. Available via RBI Retail Direct or major banks.',
                      scenarios:'Ideal when interest rates are expected to rise (your returns go up automatically). Best for large lump sums above the SCSS/POMIS caps. Good for HNIs wanting sovereign paper without the NSC 5-year commitment.',
                      avoid:'7-year lock-in is long. No 80C benefit. Premature withdrawal not allowed except for senior citizens (after prescribed age thresholds). Interest taxable.',
                      example:'Kavitha invests ₹50,00,000 in RBI FRB at 7.35%. She receives ₹1,83,750 every 6 months. If NSC rate rises to 8%, her FRSB rate automatically becomes 8.35% — she benefits from rising rates automatically.' },
                ];
            } else {
                return [
                    { name:'Equity Mutual Funds', icon:'📈', returns:'12 – 15%', risk:4, riskLabel:'High',
                      why:'Best long-term wealth creator. CAGR ~12% historically over 10+ yrs.',
                      what:'Equity mutual funds invest primarily in stocks across sectors and market caps. They are managed by professional fund managers and offer diversification. Returns fluctuate with the market but historically outperform all other asset classes over 10+ years.',
                      scenarios:'Ideal for long-term goals (7+ years) where you can ride out market volatility. Best for wealth building for retirement, children\'s education, or any large long-term goal. Suited for investors with moderate-to-high risk appetite.',
                      example:'Deepa invests ₹10,000/month via SIP in an equity fund at 12% for 15 years. She invests ₹18L total and her corpus grows to ₹50L+ — a 2.8x gain from compounding and market growth.' },
                    { name:'ELSS (Tax Saving Funds)', icon:'🧾', returns:'12 – 15%', risk:4, riskLabel:'High',
                      why:'Equity returns + 80C tax saving. Shortest lock-in (3 yrs) among tax options.',
                      what:'ELSS (Equity Linked Savings Scheme) are equity mutual funds that qualify for Section 80C tax deduction up to ₹1.5L per year. They have a mandatory 3-year lock-in — the shortest among all 80C options — and invest predominantly in stocks.',
                      scenarios:'The go-to choice for tax-saving investors who also want equity growth. If you haven\'t used your full ₹1.5L 80C limit, always consider ELSS first. Great for building wealth while saving tax simultaneously.',
                      example:'Karan invests ₹1,50,000/year in ELSS at 13% for 10 years. He saves ₹46,800/year in tax (30% slab) and his investment grows to ₹28L — effectively earning 20%+ effective annual returns after tax savings.' },
                    { name:'PPF (Public Provident Fund)', icon:'🏛️', returns:'7.1%', risk:1, riskLabel:'Very Low',
                      why:'Tax-free, govt-backed, 15yr maturity. Ideal for retirement anchor.',
                      what:'PPF is a government-backed long-term savings scheme with a 15-year lock-in (extendable in 5-year blocks). Returns are tax-free and currently earn 7.1% compounded annually. Contributions up to ₹1.5L qualify for 80C deduction.',
                      scenarios:'Ideal as the safe, guaranteed anchor of a retirement portfolio. Use it for the debt portion of your long-term savings. Best for risk-averse investors or to balance aggressive equity investments.',
                      example:'Meena invests ₹1,50,000/year in PPF for 15 years at 7.1%. She invests ₹22.5L total and receives ₹40.7L tax-free at maturity — all interest and maturity amount fully exempt from tax.' },
                    { name:'NPS (National Pension Sys.)', icon:'🎯', returns:'8 – 12%', risk:3, riskLabel:'Medium',
                      why:'Pension-focused. Extra ₹50k deduction u/s 80CCD(1B). Great for retirement.',
                      what:'NPS is a government-regulated pension system where you invest across equity, corporate bonds, and government securities. At retirement (60), you must use 40% to buy an annuity; 60% can be withdrawn tax-free. Offers an additional ₹50,000 deduction beyond the standard 80C limit.',
                      scenarios:'Perfect for retirement planning, especially for the self-employed and high-income earners who want extra tax deductions. Tier I NPS offers the most tax benefits but locks money till age 60.',
                      example:'Arjun, 30, invests ₹6,000/month in NPS at 10% for 30 years. His corpus reaches ₹1.36 Cr at 60. He also saves ₹15,600/year extra in tax via the 80CCD(1B) deduction — a powerful retirement booster.' },
                    { name:'Gold ETF / Gold Fund', icon:'🥇', returns:'9 – 11%', risk:2, riskLabel:'Low–Med',
                      why:'Gold price appreciation without physical storage, purity or making charge worries. Fully liquid, SIP-able.',
                      what:'Gold ETFs and Gold Funds are the smartest way to own gold today. Gold ETFs (like Nippon India Gold ETF, HDFC Gold ETF) trade on NSE/BSE like stocks and need a demat account. Gold Funds (like Mirae Asset Gold Fund FoF, Nippon India Gold Savings Fund) allow SIP investing without a demat account.\n\nSovereign Gold Bonds (SGBs): The Government of India has not issued new SGB tranches since early 2024. However, existing SGBs are still actively traded on NSE/BSE in the secondary market — and they frequently trade at a 3–8% discount to the current gold price, making them an attractive buy for long-term investors who have a demat account. Secondary market SGBs still carry all the original benefits: 2.5% annual interest (paid semi-annually), tax-free capital gains if held to maturity (8 years), and no storage risk. Search for "SGB" on Zerodha, Groww, or any broker\'s bond platform to see available series.',
                      scenarios:'Ideal as a portfolio hedge — allocate 5–10% for inflation protection and crisis insurance. When equity markets crash, gold typically rises, cushioning your portfolio. Works well in a long-term diversified strategy.',
                      example:'Priya invests ₹3,000/month in Nippon India Gold ETF FoF via SIP for 10 years. As gold appreciated ~10% annually, her ₹3.6L investment grew to approximately ₹6.1L — with zero storage hassle and instant liquidity.' },
                    { name:'Index Funds (Nifty 50)', icon:'🔷', returns:'11 – 13%', risk:3, riskLabel:'Medium',
                      why:'Low-cost, passive. Tracks Nifty 50. Less risk than active equity funds.',
                      what:'Index funds passively track a market index (like Nifty 50 or Sensex) by holding the same stocks in the same proportions. They have very low expense ratios (0.05–0.2%) and don\'t rely on a fund manager\'s skill. Returns mirror the index performance.',
                      scenarios:'Ideal for first-time investors or those who believe in long-term market growth without fund manager risk. Perfect "set and forget" investment. Use it as the core of any long-term equity portfolio.',
                      example:'Ritu starts a ₹5,000/month SIP in a Nifty 50 index fund at 12% for 20 years. She invests ₹12L and her corpus grows to ₹49.9L — with an expense ratio of only 0.1%, keeping nearly all the gains.' },
                    { name:'Balanced/Hybrid Funds', icon:'⚖️', returns:'10 – 12%', risk:3, riskLabel:'Medium',
                      why:'Mix of equity + debt. Smoother returns, less volatility than pure equity.',
                      what:'Hybrid or balanced funds invest in a mix of equity (stocks) and debt (bonds). Aggressive hybrid funds are ~65–80% equity, while conservative hybrid funds lean more towards debt. They auto-rebalance, providing smoother returns than pure equity.',
                      scenarios:'Perfect for moderate-risk investors who want equity growth with some downside protection. Great for investors 3–5 years from retirement who need to reduce risk but maintain growth, or for first-time equity investors.',
                      example:'Suresh invests ₹8,000/month in an aggressive hybrid fund at 11% for 12 years. His ₹11.5L investment becomes ₹22.7L — equity-like returns with less volatility, making it easier to stay invested through market dips.' },
                    { name:'Real Estate / REITs', icon:'🏢', returns:'8 – 12%', risk:3, riskLabel:'Medium',
                      why:'Real estate exposure without full capital. REITs give rental income.',
                      what:'REITs (Real Estate Investment Trusts) are listed instruments that own income-generating real estate (offices, malls, warehouses). They distribute 90% of net income as dividends. You can invest in REITs with as little as ₹10,000–15,000 on stock exchanges.',
                      scenarios:'Good for investors who want real estate exposure without buying property. Ideal for adding a non-correlated asset to your portfolio. The dividend income is useful for those seeking passive income alongside capital appreciation.',
                      example:'Neha invests ₹1,00,000 in Embassy Office Parks REIT. She earns ~₹8,000/year in dividends (8% yield) plus potential price appreciation. Total return could reach 10–12% annually over a 7-year period.' },
                ];
            }
        }

        function calculateFromButton() {
            if (currentMode === 'goal') goalCalculateClicked = true;
            calculate();
        }

        function calculate() {
            const randIndex = Math.floor(Math.random() * quotes.length);
            document.getElementById('motivation').innerText = `"${quotes[randIndex]}"`;
            const rawAmount = document.getElementById('amount').value.replace(/,/g, "");
            const todayCost = parseFloat(rawAmount) || 0;
            const years = parseInt(document.getElementById('years').value) || 0;
            const type = document.getElementById('inv-type').value;
            updateWords('years', 'years-words');
            if (currentMode === 'growth' || currentMode === 'inflation') {
                const rate = parseFloat(document.getElementById('rate').value) || 0;
                updateWords('rate', 'rate-words');
                calcGrowthOrInflation(todayCost, rate, years, type);
            } else {
                // Goal mode: inflate today's cost to future value using goal-specific inflation
                const inflRate = parseFloat(document.getElementById('goal-infl-rate')?.value) || 0;
                const futureTarget = todayCost > 0 && years > 0 && inflRate > 0
                    ? todayCost * Math.pow(1 + inflRate / 100, years)
                    : todayCost;
                goalInflUpdatePreview(todayCost, futureTarget, years, inflRate);
                calcGoal(futureTarget, years, type, todayCost, inflRate);
            }
            saveTabState(currentMode);
            if (typeof saveUserData === 'function') saveUserData();
        }

        function calcGrowthOrInflation(amount, rate, years, type) {
            let fv = 0, invested = 0;
            const labels = [], dataGrowth = [], dataSecondary = [];
            const r = rate / 100;
            const mRate = r / 12;
            let infRate = 0;
            if (currentMode === 'inflation') {
                infRate = (parseFloat(document.getElementById('inf-rate').value) || 0) / 100;
            }
            for (let i = 0; i <= years; i++) {
                labels.push("Yr " + i);
                let currentVal = 0, prin = 0;
                if (type === 'sip') {
                    prin = amount * i * 12;
                    currentVal = i === 0 ? 0 : amount * ((Math.pow(1 + mRate, i * 12) - 1) / mRate) * (1 + mRate);
                } else if (type === 'annually') {
                    prin = amount * i;
                    currentVal = i === 0 ? 0 : amount * ((Math.pow(1 + r, i) - 1) / r) * (1 + r);
                } else {
                    prin = amount;
                    currentVal = amount * Math.pow(1 + r, i);
                }
                if (currentMode === 'inflation') {
                    let realVal = currentVal / Math.pow(1 + infRate, i);
                    dataGrowth.push(realVal);
                    dataSecondary.push(currentVal);
                    if (i === years) { invested = prin; fv = realVal; }
                } else {
                    dataGrowth.push(currentVal);
                    dataSecondary.push(prin);
                    if (i === years) { invested = prin; fv = currentVal; }
                }
            }
            const format = (val) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);
            const mainResultEl = document.getElementById('main-result');
            animateCounter(mainResultEl, format(fv));
            document.getElementById('main-result-words').innerText = numberToWords(Math.round(fv));
            // Flip secondary stats
            ['sec-val-1','sec-val-2'].forEach(function(id) {
                var el = document.getElementById(id);
                if (el) { el.classList.remove('num-flip-in'); void el.offsetWidth; el.classList.add('num-flip-in'); }
            });
            document.getElementById('sec-val-2').innerText = format(invested);
            document.getElementById('sec-val-2-words').innerText = numberToWords(Math.round(invested));
            if (currentMode === 'inflation') {
                document.getElementById('main-result-title').innerText = "Real Value (Purchasing Power)";
                document.getElementById('sec-label-1').innerText = "Nominal Value (Unadjusted)";
                let nominalFv = dataSecondary[dataSecondary.length - 1];
                document.getElementById('sec-val-1').innerText = format(nominalFv);
                document.getElementById('sec-val-1-words').innerText = numberToWords(Math.round(nominalFv));
                document.getElementById('sec-val-1').className = 'text-lg sm:text-xl font-bold text-slate-500 break-all';
                document.getElementById('chart-title').innerText = "Purchasing Power vs Nominal Value";
                renderLineChart(labels, dataGrowth, dataSecondary, "Real Value (Adjusted)", "Nominal Value", '#10b981', '#f43f5e');
            } else {
                document.getElementById('main-result-title').innerText = "Projected Future Value";
                document.getElementById('sec-label-1').innerText = "Total Interest";
                document.getElementById('sec-val-1').innerText = "+" + format(fv - invested);
                document.getElementById('sec-val-1-words').innerText = numberToWords(Math.round(fv - invested));
                document.getElementById('sec-val-1').className = 'text-lg sm:text-xl font-bold text-emerald-500 break-all';
                document.getElementById('chart-title').innerText = "Growth Trajectory";
                renderLineChart(labels, dataGrowth, dataSecondary, "Total Value", "Amount Invested", '#10b981', '#64748b');
            }

            // ── LTCG / STCG Tax adjustment ─────────────────────────────────────────
            const ltcgEnabled = document.getElementById('ltcg-toggle')?.checked;
            const ltcgRow = document.getElementById('ltcg-result-row');
            // In inflation mode fv = real (purchasing-power) value; LTCG must be
            // computed on nominal gains, so use dataSecondary's last entry instead.
            const nominalFvForTax = currentMode === 'inflation'
                ? dataSecondary[dataSecondary.length - 1]
                : fv;
            if (ltcgEnabled && (currentMode === 'growth' || currentMode === 'inflation') && nominalFvForTax > 0 && invested > 0) {
                const gain = Math.max(0, nominalFvForTax - invested);
                // Annual ₹1.25L exemption: for SIP/annual we assume gains booked yearly, for lumpsum once at end
                const annualExempt = 125000;
                const totalExempt = (type === 'sip' || type === 'annually') ? annualExempt * years : annualExempt;
                const taxableGain = Math.max(0, gain - totalExempt);
                const tax = taxableGain * 0.125;
                const postTaxFV = nominalFvForTax - tax;
                if (ltcgRow) ltcgRow.classList.remove('hidden');
                document.getElementById('ltcg-posttax-val').innerText = format(postTaxFV);
                document.getElementById('ltcg-posttax-words').innerText = numberToWords(Math.round(postTaxFV));
                const exemptUsed = Math.min(gain, totalExempt);
                const inflNote = currentMode === 'inflation' ? ' · on nominal value' : '';
                document.getElementById('ltcg-tax-breakdown').innerText =
                    'Gains: ' + format(gain) +
                    ' · Exempt: ' + format(exemptUsed) +
                    ' · Tax @ 12.5%: ' + format(tax) +
                    (type === 'sip' ? ' (₹1.25L/yr over ' + years + ' yrs)' : ' (₹1.25L one-time)') +
                    inflNote;
            } else {
                if (ltcgRow) ltcgRow.classList.add('hidden');
            }
        }

        /* ── Goal-specific inflation defaults ─────────────────────────────────
           Sources: RBI data, NTA trend, ASSOCHAM healthcare report
           These are conservative mid-points — user can edit freely.
        ── */
        const GOAL_INFLATION = {
            education: { rate: 10,  category: 'Education Inflation',  note: '10–12% p.a. historically in India' },
            healthcare:{ rate: 12,  category: 'Healthcare Inflation',  note: '12–15% p.a. — fastest rising sector' },
            marriage:  { rate: 8,   category: 'Wedding Cost Inflation', note: '8–10% p.a. — lifestyle + venue costs' },
            vehicle:   { rate: 7,   category: 'Vehicle Price Inflation',note: '6–8% p.a. — input + fuel costs' },
            retirement:{ rate: 6,   category: 'General CPI Inflation',  note: '5–7% p.a. — India CPI average' },
            custom:    { rate: 6,   category: 'General CPI Inflation',  note: '5–7% p.a. — adjust if you know better' },
            home:      { rate: 9,   category: 'Real Estate Inflation',  note: '8–10% p.a. — property price trend' }
        };

        function goalInflSetDefaults() {
            const gt  = document.getElementById('goal-type')?.value || 'custom';
            const cfg = GOAL_INFLATION[gt] || GOAL_INFLATION.custom;
            const rateEl = document.getElementById('goal-infl-rate');
            const catEl  = document.getElementById('goal-infl-category');
            const noteEl = document.getElementById('goal-infl-note');
            if (rateEl) rateEl.value = cfg.rate;
            if (catEl)  catEl.textContent = cfg.category;
            if (noteEl) noteEl.textContent = cfg.note;
            goalInflUpdate();
        }

        function goalInflReset() {
            goalInflSetDefaults();
            calculate();
        }

        function goalInflUpdate() {
            const todayRaw = (document.getElementById('amount')?.value || '').replace(/,/g,'');
            const todayCost = parseFloat(todayRaw) || 0;
            const years     = parseInt(document.getElementById('years')?.value) || 0;
            const inflRate  = parseFloat(document.getElementById('goal-infl-rate')?.value) || 0;
            const future    = todayCost > 0 && years > 0 && inflRate > 0
                ? todayCost * Math.pow(1 + inflRate / 100, years)
                : 0;
            goalInflUpdatePreview(todayCost, future, years, inflRate);
            calculate();
        }

        function goalInflUpdatePreview(todayCost, futureTarget, years, inflRate) {
            const el = document.getElementById('goal-infl-preview');
            if (!el) return;
            const fmt = n => '&#8377;' + new Intl.NumberFormat('en-IN',{maximumFractionDigits:0}).format(Math.round(n));
            if (todayCost > 0 && years > 0 && inflRate > 0 && futureTarget !== todayCost) {
                el.innerHTML = fmt(todayCost) + ' today &nbsp;&#8594;&nbsp; <strong>' + fmt(futureTarget) + '</strong> in ' + years + ' yrs at ' + inflRate + '% inflation &nbsp;&#9888;&#65039; This is your real target';
                el.classList.remove('hidden');
            } else if (todayCost > 0 && (inflRate === 0 || years === 0)) {
                el.innerHTML = 'Enter years &amp; rate above to see the inflation-adjusted target.';
                el.classList.remove('hidden');
            } else {
                el.classList.add('hidden');
            }
        }

        function calcGoal(target, years, type, todayCost, inflRate) {
            let ratesToCompare = [8, 10, 12, 15];
            const rawCustomRate = document.getElementById('custom-rate').value;
            if (rawCustomRate !== "") {
                const customRate = parseFloat(rawCustomRate);
                if (!isNaN(customRate) && !ratesToCompare.includes(customRate)) {
                    ratesToCompare.unshift(customRate);
                    ratesToCompare.sort((a, b) => a - b);
                }
            }
            const container = document.getElementById('goal-cards-container');
            container.innerHTML = '';
            const format = (val) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);
            const periodText = type === 'sip' ? '/mo' : (type === 'annually' ? '/yr' : ' today');
            let barLabels = [], barData = [];
            ratesToCompare.forEach(rate => {
                let required = 0, r = rate / 100;
                if (type === 'lumpsum') {
                    required = target / Math.pow(1 + r, years);
                } else if (type === 'sip') {
                    let i = r / 12, n = years * 12;
                    required = target / (((Math.pow(1 + i, n) - 1) / i) * (1 + i));
                } else if (type === 'annually') {
                    required = target / (((Math.pow(1 + r, years) - 1) / r) * (1 + r));
                }
                barLabels.push(`${rate}% Return`);
                barData.push(required);
                const isCustom = rawCustomRate !== "" && parseFloat(rawCustomRate) === rate;
                const cardBorder = isCustom ? 'border-indigo-300 bg-indigo-50' : 'border-slate-200 bg-slate-50';
                const textCol = isCustom ? 'text-indigo-600' : 'text-emerald-600';
                container.insertAdjacentHTML('beforeend', `
                    <div class="${cardBorder} border rounded-xl p-3 flex-1 min-w-[120px] flex flex-col justify-center">
                        <div class="text-[11px] font-bold text-slate-500 mb-1">If ${rate}% Return ${isCustom ? '(Custom)' : ''}</div>
                        <div class="text-lg font-black ${textCol}">${format(required)}<span class="text-[10px] font-semibold text-slate-500">${periodText}</span></div>
                        <div class="num-word mt-1">${numberToWords(Math.round(required))}</div>
                    </div>
                `);
            });
            const inflNote = (todayCost && todayCost > 0 && inflRate > 0 && todayCost !== target)
                ? ` — ₹${new Intl.NumberFormat('en-IN',{maximumFractionDigits:0}).format(Math.round(todayCost))} today @ ${inflRate}% inflation`
                : '';
            document.getElementById('goal-subtitle').innerText = `To reach ${format(target)} in ${years} Years via ${type.toUpperCase()}:${inflNote}`;

            // Update goal badge
            const badge = document.getElementById('goal-type-badge');
            if (badge) badge.innerText = getGoalLabel();

            document.getElementById('chart-title').innerText = "Required Investment vs Expected Return";
            renderBarChart(barLabels, barData, type);

            renderInvestmentSuggestions(years);
        }

        function renderInvestmentSuggestions(years) {
            const section = document.getElementById('invest-suggestions');
            const grid = document.getElementById('invest-cards-grid');
            const termBadge = document.getElementById('invest-term-badge');
            if (!section || !grid) return;
            if (!goalCalculateClicked) { section.classList.add('hidden'); return; }

            const suggestions = getInvestmentSuggestions(years);
            const isShortTerm = years < 7;

            if (termBadge) {
                termBadge.innerText = isShortTerm ? '⏱ Short-Term (<7 yrs) — Debt Focus' : '📆 Long-Term (≥7 yrs) — Balanced/Equity';
                termBadge.className = isShortTerm
                    ? 'text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700'
                    : 'text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700';
            }

            grid.innerHTML = '';
            suggestions.forEach((inv, idx) => {
                const riskColors = ['','#16a34a','#65a30d','#ca8a04','#ea580c','#dc2626'];
                const riskBg = ['','#f0fdf4','#f7fee7','#fefce8','#fff7ed','#fef2f2'];
                const color = riskColors[inv.risk];
                const bg = riskBg[inv.risk];

                let dots = '';
                for (let d = 1; d <= 5; d++) {
                    dots += `<div style="width:9px;height:9px;border-radius:50%;background:${d <= inv.risk ? color : '#e2e8f0'};flex-shrink:0;"></div>`;
                }

                grid.insertAdjacentHTML('beforeend', `
                    <div class="invest-card border border-[#f5c842]/30 rounded-xl p-3 bg-white cursor-pointer group relative overflow-hidden" style="border-left: 3px solid ${color};" onclick="openInvestModal(${idx}, ${years < 7 ? 0 : 1})">
                        <div class="flex items-start justify-between gap-2 mb-1.5">
                            <div class="font-bold text-sm text-slate-800">${inv.icon} ${inv.name}</div>
                            <div class="text-xs font-black shrink-0" style="color:${color}">${inv.returns}</div>
                        </div>
                        <div class="text-[11px] text-slate-500 mb-2.5 leading-snug">${inv.why}</div>
                        <div class="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
                            <div class="flex items-center gap-1.5">
                                <div class="flex items-center gap-0.5">${dots}</div>
                                <span class="text-[10px] font-bold" style="color:${color}">${inv.riskLabel} Risk</span>
                            </div>
                            <span class="text-[10px] font-semibold text-slate-400 group-hover:text-emerald-600 transition-colors flex items-center gap-0.5 shrink-0">Details <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg></span>
                        </div>
                        <div class="absolute inset-0 rounded-xl ring-2 ring-transparent group-hover:ring-emerald-300 transition-all pointer-events-none"></div>
                    </div>
                `);
            });

            section.style.display = 'block';
        }

        // Store last rendered suggestions for modal access
        let _lastSuggestions = [];
        let _currentModalIdx = 0;
        let _currentTermGroup = 1;

        function _renderModalContent(idx) {
            _currentModalIdx = idx;
            const suggestions = _lastSuggestions;
            const inv = suggestions[idx];
            if (!inv) return;

            const riskColors = ['','#16a34a','#65a30d','#ca8a04','#ea580c','#dc2626'];
            const riskBg = ['','#f0fdf4','#f7fee7','#fefce8','#fff7ed','#fef2f2'];
            const color = riskColors[inv.risk];
            const bg = riskBg[inv.risk];

            document.getElementById('modal-header').style.background = bg;
            document.getElementById('modal-icon').innerText = inv.icon;
            document.getElementById('modal-name').innerText = inv.name;
            document.getElementById('modal-returns').innerText = inv.returns;
            document.getElementById('modal-returns').style.color = color;
            document.getElementById('modal-risk-label').innerText = inv.riskLabel + ' Risk';
            document.getElementById('modal-risk-label').style.color = color;

            let dots = '';
            for (let d = 1; d <= 5; d++) {
                dots += `<div style="width:11px;height:11px;border-radius:50%;background:${d <= inv.risk ? color : '#e2e8f0'};flex-shrink:0;"></div>`;
            }
            document.getElementById('modal-risk-dots').innerHTML = dots;

            document.getElementById('modal-what').innerText = inv.what;
            document.getElementById('modal-scenarios').innerText = inv.scenarios;
            document.getElementById('modal-example').innerText = inv.example;

            // Counter badge
            document.getElementById('modal-counter').innerText = `${idx + 1} of ${suggestions.length}`;

            // Navigation dots
            let navDots = '';
            for (let i = 0; i < suggestions.length; i++) {
                navDots += `<div onclick="modalNavigate(${i - _currentModalIdx})" style="width:7px;height:7px;border-radius:50%;cursor:pointer;transition:all 0.15s;background:${i === idx ? color : '#e2e8f0'};transform:${i === idx ? 'scale(1.35)' : 'scale(1)'};"></div>`;
            }
            document.getElementById('modal-dots').innerHTML = navDots;

            // Prev/Next button states
            document.getElementById('modal-prev-btn').disabled = (idx === 0);
            document.getElementById('modal-next-btn').disabled = (idx === suggestions.length - 1);

            // Scroll body to top on navigation
            const body = document.querySelector('#invest-modal .overflow-y-auto');
            if (body) body.scrollTop = 0;
        }

        function openInvestModal(idx, termGroup) {
            const years = termGroup === 0 ? 1 : 10;
            const suggestions = getInvestmentSuggestions(years);
            _lastSuggestions = suggestions;
            _currentTermGroup = termGroup;

            const modal = document.getElementById('invest-modal');
            modal.classList.remove('hidden');
            _renderModalContent(idx);

            // Re-trigger animation
            const card = modal.querySelector('.animate-modal');
            card.style.animation = 'none';
            requestAnimationFrame(() => { card.style.animation = ''; });
        }

        function modalNavigate(delta) {
            const newIdx = _currentModalIdx + delta;
            if (newIdx < 0 || newIdx >= _lastSuggestions.length) return;
            _renderModalContent(newIdx);
        }

        function closeModal(e) {
            if (e.target === document.getElementById('invest-modal') || e.target === document.getElementById('invest-modal').querySelector('.absolute.inset-0')) {
                document.getElementById('invest-modal').classList.add('hidden');
            }
        }

        function renderLineChart(labels, dataPrimary, dataSecondary, labelPrimary, labelSecondary, colorPrimary, colorSecondary) {
            const ctx = document.getElementById('mainChart').getContext('2d');
            if (chartInstance) chartInstance.destroy();
            chartInstance = new Chart(ctx, {
                type: 'line',
                data: {
                    labels,
                    datasets: [
                        { label: labelPrimary, data: dataPrimary, borderColor: colorPrimary, backgroundColor: colorPrimary === '#10b981' ? 'rgba(16,185,129,0.15)' : 'rgba(0,0,0,0)', fill: true, tension: 0.3, pointRadius: 2, pointHoverRadius: 6 },
                        { label: labelSecondary, data: dataSecondary, borderColor: colorSecondary, borderDash: [5, 5], tension: 0, fill: false, pointRadius: 0, pointHoverRadius: 5 }
                    ]
                },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    interaction: { mode: 'index', intersect: false },
                    plugins: {
                        legend: { display: true, position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } },
                        tooltip: {
                            backgroundColor: 'rgba(15,23,42,0.9)', titleFont: { size: 12, family: 'Inter' }, bodyFont: { size: 13, family: 'Inter', weight: 'bold' }, padding: 10,
                            callbacks: { label: (c) => (c.dataset.label || '') + ': ' + new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(c.raw) }
                        }
                    },
                    scales: { y: { ticks: { callback: (val) => '₹' + (val >= 10000000 ? (val/10000000).toFixed(1)+'Cr' : val >= 100000 ? (val/100000).toFixed(1)+'L' : (val/1000).toFixed(0)+'k'), font: { size: 10 } } }, x: { grid: { display: false }, ticks: { font: { size: 10 } } } }
                }
            });
        }

        function renderBarChart(labels, data, type) {
            const ctx = document.getElementById('mainChart').getContext('2d');
            if (chartInstance) chartInstance.destroy();
            chartInstance = new Chart(ctx, {
                type: 'bar',
                data: { labels, datasets: [{ label: `Required ${type.toUpperCase()} Amount`, data, backgroundColor: '#34d399', hoverBackgroundColor: '#10b981', borderRadius: 6 }] },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    interaction: { mode: 'index', intersect: false },
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            backgroundColor: 'rgba(15,23,42,0.9)', titleFont: { size: 12, family: 'Inter' }, bodyFont: { size: 13, family: 'Inter', weight: 'bold' }, padding: 10,
                            callbacks: { label: (c) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(c.raw) }
                        }
                    },
                    scales: { y: { ticks: { callback: (val) => '₹' + (val >= 10000000 ? (val/10000000).toFixed(1)+'Cr' : val >= 100000 ? (val/100000).toFixed(1)+'L' : (val/1000).toFixed(0)+'k'), font: { size: 10 } } }, x: { grid: { display: false }, ticks: { font: { size: 10 } } } }
                }
            });
        }

        // ============= EMERGENCY FUND FUNCTIONS =============
        let efMonths = 6;
        Object.defineProperty(window, '_efMonths', { get: function(){ return efMonths; } });
        let efChartInstance = null;
        let customExpenseCount = 0;

        const EF_CATEGORY_COLORS = [
            '#3b82f6','#22c55e','#f59e0b','#a855f7','#0ea5e9','#ec4899',
            '#f97316','#ef4444','#14b8a6','#84cc16','#6366f1','#f43f5e'
        ];

        function setMonths(m) {
            efMonths = m;
            [3,6,12].forEach(n => {
                const btn = document.getElementById('m-btn-' + n);
                if (n === m) {
                    btn.className = 'ef-months-btn ef-months-active flex-1 py-2.5 rounded-xl text-sm font-bold border transition-all';
                } else {
                    btn.className = 'ef-months-btn flex-1 py-2.5 rounded-xl text-sm font-bold border transition-all';
                }
            });
            document.getElementById('ef-months-display').innerText = m;
            document.getElementById('ef-coverage-label').innerText = m + '-Month Emergency Fund';
            calcEmergency();
        }

        function efFormatInput(el) {
            let val = el.value.replace(/[^0-9]/g, '');
            if (val === '' || val === '0') { el.value = '0'; el.classList.add('text-slate-400'); return; }
            let num = parseInt(val, 10);
            el.value = new Intl.NumberFormat('en-IN').format(num);
            el.classList.remove('text-slate-400');
        }

        function efGetRawValue(input) {
            return parseInt(input.value.replace(/,/g, '') || '0', 10);
        }

        function addCustomExpense() {
            customExpenseCount++;
            const icons = ['🧾','💊','🎮','📱','👗','🐾','🍽️','🎵','💇','🛠️'];
            const icon = icons[(customExpenseCount - 1) % icons.length];
            const id = 'custom-row-' + customExpenseCount;

            const div = document.createElement('div');
            div.className = 'expense-row flex items-center gap-3 group';
            div.setAttribute('data-category', 'Custom');
            div.id = id;
            div.innerHTML = `
                <div class="w-7 h-7 rounded-lg flex items-center justify-center text-base flex-shrink-0 bg-slate-100">${icon}</div>
                <input type="text" placeholder="Expense name" maxlength="24"
                    class="text-sm font-semibold text-slate-700 flex-1 min-w-0 bg-transparent border-b border-dashed border-slate-300 focus:border-amber-400 outline-none px-1 py-0.5"
                    oninput="this.closest('[data-category]').setAttribute('data-category', this.value || 'Custom')">
                <button onclick="removeCustomExpense('${id}')" class="text-slate-300 hover:text-red-400 transition-colors flex-shrink-0" title="Remove">
                    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
                <div class="relative flex-shrink-0">
                    <span class="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">₹</span>
                    <input type="text" value="0" inputmode="numeric"
                        class="ef-input w-32 pl-6 pr-2 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-right focus:ring-2 focus:ring-amber-400 focus:border-amber-400 outline-none transition-all text-slate-400"
                        onfocus="if(this.value==='0'){this.value='';this.classList.remove('text-slate-400');}"
                        onblur="if(this.value===''||this.value==='0'){this.value='0';this.classList.add('text-slate-400');}"
                        oninput="efFormatInput(this); calcEmergency(); this.classList.remove('text-slate-400');">
                </div>`;
            document.getElementById('custom-expense-rows').appendChild(div);
            div.querySelector('input[type="text"]').focus();
        }

        function removeCustomExpense(id) {
            const el = document.getElementById(id);
            if (el) { el.remove(); calcEmergency(); }
        }

        function resetEmergencyFund() {
            // Reset all fixed expense inputs to 0
            document.querySelectorAll('#expense-rows .ef-input').forEach(input => {
                input.value = '0';
                input.classList.add('text-slate-400');
            });
            // Remove all custom rows
            document.getElementById('custom-expense-rows').innerHTML = '';
            customExpenseCount = 0;
            // Reset months to default 6
            setMonths(6);
            calcEmergency();
            if (typeof saveUserData === 'function') saveUserData();
        }

        function calcEmergency() {
            const fmt = (val) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);

            // Collect all expense rows
            const allRows = document.querySelectorAll('#expense-rows .expense-row, #custom-expense-rows .expense-row');
            let categories = [], values = [], total = 0;

            allRows.forEach((row, idx) => {
                const input = row.querySelector('.ef-input');
                if (!input) return;
                const val = efGetRawValue(input);
                const label = row.getAttribute('data-category') || 'Other';
                if (val > 0) { categories.push(label); values.push(val); }
                total += val;
            });

            // Update monthly total
            document.getElementById('ef-monthly-total').innerText = fmt(total);
            document.getElementById('ef-monthly-words').innerText = numberToWords(total);

            // Compute targets
            const t3 = total * 3, t6 = total * 6, t12 = total * 12;
            document.getElementById('ef-3m').innerText = fmt(t3);
            document.getElementById('ef-6m').innerText = fmt(t6);
            document.getElementById('ef-12m').innerText = fmt(t12);

            const target = total * efMonths;
            // Animate the main result with flip
            const efResultEl = document.getElementById('ef-total-result');
            efResultEl.classList.remove('result-flip-in');
            void efResultEl.offsetWidth;
            efResultEl.classList.add('result-flip-in');
            efResultEl.innerText = fmt(target);
            document.getElementById('ef-total-words').innerText = numberToWords(Math.round(target));
            document.getElementById('ef-coverage-label').innerText = efMonths + '-Month Emergency Fund';
            document.getElementById('ef-months-display').innerText = efMonths;

            // Chart
            if (categories.length === 0) {
                document.getElementById('ef-empty-state').classList.remove('hidden');
                document.getElementById('ef-chart-container').classList.add('hidden');
                if (efChartInstance) { efChartInstance.destroy(); efChartInstance = null; }
            } else {
                document.getElementById('ef-empty-state').classList.add('hidden');
                document.getElementById('ef-chart-container').classList.remove('hidden');
                renderEFDonutChart(categories, values);
            }
            if (typeof saveUserData === 'function') saveUserData();
        }

        function renderEFDonutChart(labels, data) {
            const ctx = document.getElementById('efChart').getContext('2d');
            if (efChartInstance) efChartInstance.destroy();
            const colors = EF_CATEGORY_COLORS.slice(0, labels.length);
            const fmt = (val) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);
            const total = data.reduce((a, b) => a + b, 0);

            efChartInstance = new Chart(ctx, {
                type: 'doughnut',
                data: { labels, datasets: [{ data, backgroundColor: colors, hoverOffset: 8, borderWidth: 2, borderColor: '#fff' }] },
                options: {
                    responsive: true, maintainAspectRatio: false, cutout: '65%',
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            backgroundColor: 'rgba(15,23,42,0.9)',
                            callbacks: {
                                label: (c) => {
                                    const pct = ((c.raw / total) * 100).toFixed(1);
                                    return `${c.label}: ${fmt(c.raw)} (${pct}%)`;
                                }
                            }
                        }
                    }
                }
            });

            // Build legend
            const legend = document.getElementById('ef-legend');
            legend.innerHTML = '';
            labels.forEach((lbl, i) => {
                const pct = ((data[i] / total) * 100).toFixed(1);
                legend.insertAdjacentHTML('beforeend', `
                    <div class="flex items-center gap-1.5 min-w-0">
                        <div class="w-2.5 h-2.5 rounded-sm flex-shrink-0" style="background:${colors[i]}"></div>
                        <span class="text-[11px] text-slate-600 truncate flex-1">${lbl}</span>
                        <span class="text-[11px] font-bold text-slate-500 flex-shrink-0">${pct}%</span>
                    </div>`);
            });
        }
        // ========== END EMERGENCY FUND FUNCTIONS ==========

        window.onload = () => {
            // Initialize greyed zero state for Growth Calculator fields
            ['rate', 'years', 'inf-rate'].forEach(id => {
                const el = document.getElementById(id);
                if (el) { el.classList.add('text-slate-400'); }
            });
            formatInput(document.getElementById('amount'), 'amount-words');
            updateWords('rate', 'rate-words');
            updateWords('years', 'years-words');
            updateWords('inf-rate', 'inf-rate-words');
            // Show inflation toggle on initial growth mode
            document.getElementById('inflation-toggle-container').style.display = 'block';
            // Show LTCG toggle on initial growth mode
            document.getElementById('ltcg-toggle-container').style.display = 'block';
            // Restore saved user data BEFORE calculate() so that saveUserData()
            // (triggered inside calculate) does not overwrite the restored values.
            if (typeof loadUserData === 'function') loadUserData();
            calculate();
        };

        ['rate', 'inf-rate', 'custom-rate'].forEach(id => {
            document.getElementById(id)?.addEventListener('input', calculate);
        });
        document.getElementById('inv-type').addEventListener('change', calculate);

        // Close modal on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                document.getElementById('invest-modal').classList.add('hidden');
                document.getElementById('mf-modal').classList.add('hidden');
            }
        });

        // ==================== MUTUAL FUND KIT ====================

        const MF_DATA = [
            {
                id: 'large-cap', icon: '🏛️', name: 'Large Cap Funds', category: 'equity',
                categoryLabel: 'Equity', categoryColor: '#2563eb', categoryBg: '#eff6ff',
                returns: '10 – 13%', horizon: '5+ yrs', risk: 3, riskLabel: 'Medium–High',
                tagline: 'Invest in India\'s top 100 companies by market cap.',
                what: 'Large cap funds invest at least 80% of their corpus in the top 100 companies by market capitalisation (like Reliance, TCS, HDFC Bank). These companies are industry leaders with proven track records, strong balance sheets, and relatively stable earnings.',
                scenarios: 'Best for first-time equity investors who want market exposure with lower volatility. Ideal for 5–7 year goals where you need equity growth but cannot tolerate sharp drawdowns. Good as the stable core of any equity portfolio.',
                avoid: 'Avoid if you have a short horizon (<3 years) or expect market-beating returns. They tend to underperform mid/small caps during bull runs due to lower growth potential of large companies.',
                example: 'Rohan, 30, starts a ₹10,000/month SIP in Axis Bluechip Fund. Over 10 years at ~11% CAGR, his ₹12L investment grows to ~₹21.9L — steady, inflation-beating returns with relatively lower sleepless nights.',
                popular: 'Mirae Asset Large Cap Fund, Axis Bluechip Fund, ICICI Pru Bluechip Fund, SBI Bluechip Fund, Canara Robeco Bluechip Equity Fund'
            },
            {
                id: 'mid-cap', icon: '🚀', name: 'Mid Cap Funds', category: 'equity',
                categoryLabel: 'Equity', categoryColor: '#2563eb', categoryBg: '#eff6ff',
                returns: '13 – 18%', horizon: '7+ yrs', risk: 4, riskLabel: 'High',
                tagline: 'Bet on tomorrow\'s large caps — companies ranked 101–250.',
                what: 'Mid cap funds invest at least 65% in companies ranked 101–250 by market cap. These are established but growing businesses — they\'ve survived early-stage risks but still have significant headroom for growth. Think of them as future large caps.',
                scenarios: 'Great for investors with 7–10+ year horizons who want higher returns than large caps and can tolerate higher volatility. Best used as a 20–30% satellite allocation alongside large cap or index funds. Excellent for wealth multiplication over a decade.',
                avoid: 'Avoid for emergency funds, short-term goals, or if you panic at 30–40% drawdowns. Mid caps can fall sharply in bear markets and may take 2–3 years to recover.',
                example: 'Priya, 28, puts ₹5,000/month in Kotak Emerging Equity Fund. Over 12 years at ~15% CAGR, her ₹7.2L investment grows to ~₹22.5L. The higher volatility was worth it — her wealth grew 3x vs a safer FD.',
                popular: 'Kotak Emerging Equity Fund, Nippon India Growth Fund, HDFC Mid-Cap Opportunities, Axis Midcap Fund, DSP Midcap Fund'
            },
            {
                id: 'small-cap', icon: '⚡', name: 'Small Cap Funds', category: 'equity',
                categoryLabel: 'Equity', categoryColor: '#2563eb', categoryBg: '#eff6ff',
                returns: '15 – 22%', horizon: '10+ yrs', risk: 5, riskLabel: 'Very High',
                tagline: 'High octane growth — companies ranked 251 and below.',
                what: 'Small cap funds invest at least 65% in companies ranked 251 and beyond by market cap. These are small, often undiscovered businesses with potential for explosive growth but also high risk of failure or prolonged underperformance. Returns can be spectacular or dismal.',
                scenarios: 'Only for aggressive, experienced investors with 10+ year horizons and strong mental fortitude. Can form 10–15% of portfolio for high-growth seekers. Best entered via SIP to average out volatility.',
                avoid: 'Absolutely avoid for any goal shorter than 7–10 years. Not for conservative investors, retirees, or those who check portfolio daily. A 50–60% drawdown is possible and has historically occurred.',
                example: 'Aryan, 25, invests ₹3,000/month in SBI Small Cap Fund. Over 15 years at ~18% CAGR, his ₹5.4L invested becomes ~₹31.2L — over 5x his money! But he had to sit through 2018 and 2020 crashes without selling.',
                popular: 'SBI Small Cap Fund, Nippon India Small Cap Fund, Axis Small Cap Fund, Kotak Small Cap Fund, HDFC Small Cap Fund'
            },
            {
                id: 'flexi-cap', icon: '🔄', name: 'Flexi Cap Funds', category: 'equity',
                categoryLabel: 'Equity', categoryColor: '#2563eb', categoryBg: '#eff6ff',
                returns: '11 – 15%', horizon: '5+ yrs', risk: 4, riskLabel: 'High',
                tagline: 'Fund manager picks the best across all market caps dynamically.',
                what: 'Flexi cap funds can invest in companies of any size — large, mid, or small cap — without any minimum allocation constraint. The fund manager dynamically shifts between market caps based on market conditions and opportunities. This gives maximum flexibility to generate alpha.',
                scenarios: 'Excellent "one fund" equity solution for investors who don\'t want to manage multiple equity funds. The fund manager does the market cap allocation for you. Good for 5–10 year goals, SIPs, and moderate-to-high risk investors.',
                avoid: 'Avoid if you want control over specific market cap allocation. Not ideal if you already have dedicated large, mid, and small cap funds — it may create overlap.',
                example: 'Sunita invests ₹15,000/month in Parag Parikh Flexi Cap Fund. The fund manager shifted to large caps during COVID crash and moved back to mid/small caps in recovery. Over 7 years, her ₹12.6L became ₹24L+.',
                popular: 'Parag Parikh Flexi Cap Fund, HDFC Flexi Cap Fund, UTI Flexi Cap Fund, Kotak Flexicap Fund, Canara Robeco Flexi Cap'
            },
            {
                id: 'multicap', icon: '🌐', name: 'Multi Cap Funds', category: 'equity',
                categoryLabel: 'Equity', categoryColor: '#2563eb', categoryBg: '#eff6ff',
                returns: '12 – 16%', horizon: '7+ yrs', risk: 4, riskLabel: 'High',
                tagline: 'Mandated 25% each in large, mid & small cap — true diversification.',
                what: 'Multi cap funds are mandated by SEBI to invest minimum 25% each in large cap, mid cap, and small cap stocks. This rule-based diversification ensures all three segments are represented, unlike flexi cap where the manager has full discretion.',
                scenarios: 'Great for investors who want guaranteed diversification across all market caps in a single fund. Suitable for 7+ year horizons. The enforced small/mid cap allocation can boost long-term returns compared to pure large cap funds.',
                avoid: 'Not ideal for conservative investors — the mandatory small cap exposure (25%) can cause sharp short-term volatility. Also avoid for goals under 7 years.',
                example: 'Vikram invests ₹8,000/month in Nippon India Multi Cap Fund. The mandatory 25% small cap allocation helped his returns outperform pure large cap funds over a 10-year period at ~14% CAGR, turning ₹9.6L into ₹24.3L.',
                popular: 'Nippon India Multi Cap Fund, HDFC Multi-Cap Fund, Kotak Multicap Fund, Mahindra Manulife Multi Cap Fund, ITI Multi Cap Fund'
            },
            {
                id: 'elss', icon: '🧾', name: 'ELSS (Tax Saving)', category: 'tax',
                categoryLabel: 'Tax Saving', categoryColor: '#7c3aed', categoryBg: '#f5f3ff',
                returns: '12 – 15%', horizon: '3+ yrs (lock-in)', risk: 4, riskLabel: 'High',
                tagline: 'Save up to ₹46,800 tax annually + earn equity returns.',
                what: 'ELSS (Equity Linked Savings Scheme) are equity mutual funds with a mandatory 3-year lock-in period per SIP installment. Investments up to ₹1.5L qualify for Section 80C deduction. With the shortest lock-in among all 80C options and market-linked returns, it is the most rewarding tax-saving instrument.',
                scenarios: 'The #1 choice for tax-saving investors who can tolerate equity risk. If you haven\'t exhausted your ₹1.5L 80C limit, always start with ELSS. Effective annual returns (after tax savings) can be 20%+ for 30% slab taxpayers.',
                avoid: 'Avoid if you need liquidity within 3 years (lock-in is per installment for SIPs). Not suitable for retirees or purely capital-protection seekers.',
                example: 'Kavya (30% tax bracket) invests ₹1,50,000/year in Mirae Asset Tax Saver Fund. She saves ₹46,800 in taxes every year. Over 10 years at 13% CAGR, her investment grows to ₹28.5L. Effective return: ~22% post-tax!',
                popular: 'Mirae Asset ELSS Tax Saver Fund, Quant ELSS Tax Saver Fund, Axis ELSS Tax Saver Fund, SBI Long Term Equity Fund, Canara Robeco ELSS Tax Saver'
            },
            {
                id: 'index', icon: '🔷', name: 'Index Funds', category: 'passive',
                categoryLabel: 'Passive', categoryColor: '#0891b2', categoryBg: '#ecfeff',
                returns: '11 – 13%', horizon: '7+ yrs', risk: 3, riskLabel: 'Medium',
                tagline: 'Track Nifty 50 / Sensex at rock-bottom costs. No fund manager needed.',
                what: 'Index funds passively replicate a market index (Nifty 50, Nifty Next 50, Sensex, etc.) by holding the exact same stocks in the same proportions. No active stock-picking; returns mirror the index. Ultra-low expense ratios (0.05–0.20%) mean more returns stay with you.',
                scenarios: 'Ideal for beginner investors, long-term wealth builders, and those who believe in market efficiency. "Set and forget" — no need to monitor fund manager changes. Use Nifty 50 index funds as the core of your equity portfolio.',
                avoid: 'Won\'t outperform the market — if you want to beat the index, go active. Not ideal if you specifically want mid/small cap exposure (use dedicated index funds for that).',
                example: 'Ritu puts ₹5,000/month in UTI Nifty 50 Index Fund at an expense ratio of 0.20%. Over 20 years at 12% CAGR, ₹12L invested becomes ~₹49.9L. An actively managed fund charging 1.5% would have given only ₹42L — ₹7.9L less!',
                popular: 'UTI Nifty 50 Index Fund, Nippon India Index Fund – Nifty 50, HDFC Index Fund Nifty 50, Navi Nifty 50 Index Fund (0.06% ER), Motilal Oswal Nifty Next 50'
            },
            {
                id: 'etf', icon: '📡', name: 'ETFs (Exchange Traded Funds)', category: 'passive',
                categoryLabel: 'Passive', categoryColor: '#0891b2', categoryBg: '#ecfeff',
                returns: '11 – 13%', horizon: '7+ yrs', risk: 3, riskLabel: 'Medium',
                tagline: 'Like index funds but traded on stock exchanges like shares.',
                what: 'ETFs track an index (like Nifty 50) and trade on stock exchanges just like individual shares. They have even lower expense ratios than index funds (often 0.02–0.05%) but require a Demat account to buy. Price updates in real-time during market hours.',
                scenarios: 'Best for investors with Demat accounts who want the absolute lowest cost index exposure. Great for lumpsum investors and those who want intraday flexibility. Nifty Bees and Nifty 50 ETFs are the most liquid.',
                avoid: 'Not ideal for SIP investors (require manual monthly buying). Avoid illiquid ETFs with low trading volumes — bid-ask spread can eat into returns. Not suited for those without a Demat account.',
                example: 'Shivam buys ₹50,000 worth of Nippon India Nifty 50 Bees ETF at ₹220/unit. The expense ratio is 0.05%. Over 10 years at 12% CAGR, his ₹50,000 grows to ₹1.55L — and the tiny 0.05% cost saved him ₹15,000 vs a higher-expense fund.',
                popular: 'Nippon India Nifty 50 Bees ETF, HDFC Nifty 50 ETF, SBI Nifty 50 ETF, Kotak Nifty 50 ETF, Mirae Asset Nifty 50 ETF'
            },
            {
                id: 'sectoral', icon: '🏗️', name: 'Sectoral / Thematic Funds', category: 'equity',
                categoryLabel: 'Equity', categoryColor: '#2563eb', categoryBg: '#eff6ff',
                returns: '12 – 25%+', horizon: '7+ yrs', risk: 5, riskLabel: 'Very High',
                tagline: 'Concentrate bets on one sector — banking, IT, pharma, infra etc.',
                what: 'Sectoral funds invest 80%+ in a specific sector (banking, technology, pharma, infrastructure, consumption, etc.). Thematic funds are broader — they invest in a theme across sectors (like ESG, manufacturing, digital India). Returns can be massive in upcycles but crashes can be brutal.',
                scenarios: 'Only for investors with strong conviction and deep understanding of a particular sector\'s cycle. Can be used as 5–10% tactical allocation for experienced investors. Best entered at sector lows and exited at peaks.',
                avoid: 'Avoid as a core holding. Never put more than 10–15% in any single sectoral fund. Absolutely avoid if you don\'t understand the sector\'s business cycle. Not for SIPs as a long-term strategy.',
                example: 'Deepak invested ₹2,00,000 in Nippon India Pharma Fund in March 2020 (COVID low). Pharma boomed post-COVID. By March 2022, his investment was worth ₹4,40,000 — a 120% return in 2 years! But by 2023 it fell 20% from peak — showing the boom-bust cycle.',
                popular: 'Nippon India Pharma Fund, ICICI Pru Technology Fund, SBI PSU Fund, Mirae Asset Great Consumer Fund, Quant Infrastructure Fund, Kotak Banking ETF'
            },
            {
                id: 'international', icon: '🌍', name: 'International / Global Funds', category: 'others',
                categoryLabel: 'Others', categoryColor: '#0f766e', categoryBg: '#f0fdfa',
                returns: '10 – 18%', horizon: '7+ yrs', risk: 4, riskLabel: 'High',
                tagline: 'Invest in US, China, global markets from your Indian account.',
                what: 'International funds invest in overseas stocks — US tech giants (Apple, Google, Amazon), global index funds, or country-specific funds (US, China, Europe). They provide geographic diversification and rupee depreciation benefit (as INR weakens, USD-denominated assets gain more in INR terms).',
                scenarios: 'Add 10–20% to your portfolio for geographic diversification and USD exposure. Great for benefiting from global tech growth. Useful hedge against INR depreciation for long-term investors.',
                avoid: 'Currently restricted under SEBI — as of 2023, new subscriptions to many overseas funds are paused. Currency risk is a double-edged sword. Avoid if you don\'t understand forex and global macro factors.',
                example: 'Ananya had ₹1,00,000 in Parag Parikh\'s US-tilted flexi cap fund. USD strengthened 10% against INR over 3 years. Even if US stocks returned 12% in USD terms, she made ~22%+ in INR terms — INR depreciation acting as a bonus return.',
                popular: 'Parag Parikh Flexi Cap (US tilt), Motilal Oswal Nasdaq 100 FOF, Mirae Asset NYSE FANG+ ETF FoF, HDFC Developed World Indexes FOF, Franklin India Feeder – Franklin U.S. Opportunities'
            },
            {
                id: 'liquid', icon: '💧', name: 'Liquid Funds', category: 'debt',
                categoryLabel: 'Debt', categoryColor: '#059669', categoryBg: '#ecfdf5',
                returns: '5.5 – 7%', horizon: '1 day – 3 months', risk: 1, riskLabel: 'Very Low',
                tagline: 'Your savings account alternative — better returns, same-day withdrawal.',
                what: 'Liquid funds invest in very short-term debt instruments (treasury bills, commercial paper, CDs) with maturity up to 91 days. They offer better returns than savings accounts (5.5–7% vs 3–4%) with same-day or next-day withdrawal. NAV is updated every day including weekends.',
                scenarios: 'Park your emergency fund here instead of a savings account. Use for short-term parking of money between investments or before a known expense. Businesses use it to park working capital.',
                avoid: 'Not a long-term investment — returns are only marginally better than savings accounts. Avoid if you need money in under 30 minutes (some funds have a 1-hour settlement delay). Don\'t use as a core portfolio holding.',
                example: 'Neha parks ₹2,00,000 in Nippon India Liquid Fund instead of a savings account. After 6 months at 6.5% p.a., she earns ₹6,500 — double the ₹3,000 her savings account would have given. When she needed the money, it arrived in her account by evening.',
                popular: 'Nippon India Liquid Fund, HDFC Liquid Fund, ICICI Prudential Liquid Fund, Axis Liquid Fund, Mirae Asset Cash Management Fund'
            },
            {
                id: 'ultra-short', icon: '⏱️', name: 'Ultra Short Duration Funds', category: 'debt',
                categoryLabel: 'Debt', categoryColor: '#059669', categoryBg: '#ecfdf5',
                returns: '6 – 7.5%', horizon: '3–6 months', risk: 1, riskLabel: 'Very Low',
                tagline: 'Slightly better than liquid funds for 3–6 month parking needs.',
                what: 'Ultra short duration funds invest in debt instruments with a portfolio maturity of 3–6 months. They offer slightly higher returns than liquid funds while maintaining high liquidity. They\'re suitable for medium-short term parking and are less volatile than short duration funds.',
                scenarios: 'Use for parking money you need in 3–6 months — like advance tax payment, insurance premium, or vacation fund. Also a good alternative to 3-month FDs as exit load is usually nil after 30–90 days.',
                avoid: 'Interest rate changes can slightly impact returns — not risk-free like FDs. Avoid if you need money within 1–7 days (use liquid funds). Not suitable for long-term (1+ year) investment.',
                example: 'Raj is saving for his car down payment in 5 months. He parks ₹3,00,000 in Aditya Birla Ultra Short Duration Fund. At 7% p.a. for 5 months, he earns ₹8,750 — better than a savings account and no TDS if returns stay under ₹5,000/year.',
                popular: 'Aditya Birla SL Savings Fund, ICICI Pru Ultra Short Term Fund, SBI Magnum Ultra Short Duration Fund, Kotak Savings Fund, Nippon India Ultra Short Duration Fund'
            },
            {
                id: 'short-duration', icon: '📅', name: 'Short Duration Funds', category: 'debt',
                categoryLabel: 'Debt', categoryColor: '#059669', categoryBg: '#ecfdf5',
                returns: '6.5 – 8%', horizon: '1–3 yrs', risk: 2, riskLabel: 'Low',
                tagline: 'Debt fund equivalent of a 1–3 year FD — but more tax efficient.',
                what: 'Short duration funds invest in bonds and money market instruments with a portfolio duration of 1–3 years. They offer better returns than liquid/ultra short funds and benefit from falling interest rates. Post Finance Act 2023, all debt fund gains (regardless of holding period) are taxed at your income slab rate — no indexation benefit anymore.',
                scenarios: 'Best for 1–3 year goals where you want better returns than FDs with some flexibility. Note: Post Apr 2023, debt MF gains are taxed at your income slab — same as FD interest. For tax efficiency, consider arbitrage funds if you\'re in the 30% bracket.',
                avoid: 'Rising interest rate environments can cause temporary losses (mark-to-market risk). Not for capital-critical goals or investors who cannot tolerate any short-term volatility.',
                example: 'Suresh has ₹5,00,000 for his sister\'s wedding in 2 years. He puts it in HDFC Short Term Debt Fund at 7.5% p.a. After 2 years, he gets ₹5,79,000 — ₹29,000 more than a 2-year FD at 7%. Plus potential tax efficiency.',
                popular: 'HDFC Short Term Debt Fund, ICICI Pru Short Term Fund, Aditya Birla SL Short Term Fund, Axis Short Duration Fund, Nippon India Short Term Fund'
            },
            {
                id: 'gilt', icon: '🏅', name: 'Gilt Funds', category: 'debt',
                categoryLabel: 'Debt', categoryColor: '#059669', categoryBg: '#ecfdf5',
                returns: '7 – 10%', horizon: '3–5+ yrs', risk: 3, riskLabel: 'Medium',
                tagline: 'Zero credit risk — invest only in government bonds. But interest rate sensitive.',
                what: 'Gilt funds invest exclusively in government securities (G-secs) issued by Central or State governments. There is absolutely zero credit/default risk since the government guarantees repayment. However, they are highly sensitive to interest rate changes — when rates fall, gilt prices rise sharply, and vice versa.',
                scenarios: 'Ideal when you believe interest rates are about to fall significantly (like in a rate cut cycle). Can deliver FD-beating returns in falling rate environments. Good for conservative investors wanting government-only exposure.',
                avoid: 'Avoid during rising interest rate cycles — NAV can fall sharply. Don\'t invest if you need capital protection at a specific date — not suitable for short horizons.',
                example: 'In 2019–2020, when RBI cut rates aggressively, Nippon India Gilt Securities Fund delivered 14–18% annual returns! Investors who bought before the rate cut cycle made FD-beating returns from the safest government bonds.',
                popular: 'SBI Magnum Gilt Fund, ICICI Pru Gilt Fund, Nippon India Gilt Securities Fund, DSP Government Securities Fund, HDFC Gilt Fund'
            },
            {
                id: 'credit-risk', icon: '⚠️', name: 'Credit Risk Funds', category: 'debt',
                categoryLabel: 'Debt', categoryColor: '#059669', categoryBg: '#ecfdf5',
                returns: '8 – 10%', horizon: '3+ yrs', risk: 3, riskLabel: 'Medium–High',
                tagline: 'Higher returns from lower-rated corporate bonds — but comes with default risk.',
                what: 'Credit risk funds invest at least 65% in below AA-rated bonds (i.e., BBB to A+ rated corporate bonds). These bonds pay higher interest to compensate for higher default risk. When companies default, the NAV can crash suddenly. The Franklin India Debt Scandal (2020) was a major example.',
                scenarios: 'Only for sophisticated investors who understand credit risk and can hold 3+ years. Can add 5–10% as a satellite to boost portfolio yield. Should only be bought with proper due diligence on fund house credit quality.',
                avoid: 'Avoid entirely if you\'re a conservative investor. Never put large sums here. Avoid if fund house has a history of credit events. Post-Franklin India episode, many investors exited this category entirely.',
                example: 'The Franklin India Ultra Short Bond Fund fiasco in April 2020: the fund house froze 6 schemes due to credit risk in their portfolios. Investors couldn\'t redeem for months! Some eventually recovered their money, but it was a harsh lesson in credit risk.',
                popular: 'ICICI Pru Credit Risk Fund, Nippon India Credit Risk Fund, SBI Credit Risk Fund (Use only after careful research — this category requires extra caution)'
            },
            {
                id: 'aggressive-hybrid', icon: '⚖️', name: 'Aggressive Hybrid Funds', category: 'hybrid',
                categoryLabel: 'Hybrid', categoryColor: '#b45309', categoryBg: '#fffbeb',
                returns: '10 – 13%', horizon: '5+ yrs', risk: 3, riskLabel: 'Medium–High',
                tagline: '65–80% equity + 20–35% debt = smoother equity-like returns.',
                what: 'Aggressive hybrid funds (formerly "balanced funds") invest 65–80% in equities and the rest in debt. This automatic asset allocation smooths out volatility — when equity falls, debt cushions the blow. They auto-rebalance, reducing the behavioural risk of panic-selling.',
                scenarios: 'Perfect for first-time equity investors who want equity returns but with lower volatility. Excellent "single fund" solution for 5–10 year goals. Great for investors 3–5 years from a goal who want to de-risk while maintaining some growth.',
                avoid: 'Returns may lag pure equity funds in strong bull markets. Not ideal if you specifically want to control your own debt-equity allocation. Slightly less tax efficient due to the debt component.',
                example: 'Meena, 45, is 7 years from retirement. She puts ₹15,000/month in ICICI Pru Equity & Debt Fund. In 2020 COVID crash, while Nifty fell 38%, her fund fell only 25%. She didn\'t panic, stayed invested, and her corpus grew steadily to ₹23L over 8 years.',
                popular: 'ICICI Pru Equity & Debt Fund, SBI Equity Hybrid Fund, Mirae Asset Hybrid Equity Fund, Kotak Equity Hybrid Fund, DSP Equity & Bond Fund'
            },
            {
                id: 'conservative-hybrid', icon: '🛡️', name: 'Conservative Hybrid Funds', category: 'hybrid',
                categoryLabel: 'Hybrid', categoryColor: '#b45309', categoryBg: '#fffbeb',
                returns: '7 – 9%', horizon: '2–3+ yrs', risk: 2, riskLabel: 'Low–Medium',
                tagline: '75–90% debt + 10–25% equity — for capital protection with mild growth.',
                what: 'Conservative hybrid funds invest 75–90% in debt (bonds, G-secs) and 10–25% in equity. The small equity portion aims to deliver slightly better returns than pure debt funds, while the large debt allocation ensures capital stability. Less volatile than aggressive hybrid funds.',
                scenarios: 'Ideal for senior citizens, retirees, or conservative investors who want marginally better returns than FDs/debt funds. Good for 2–3 year goals where some equity exposure is acceptable.',
                avoid: 'Not ideal for aggressive growth targets — equity allocation is too small for meaningful wealth creation. Don\'t use as a complete portfolio solution for long-term goals.',
                example: 'Shanta, 60, parks her retirement corpus in ICICI Pru Regular Savings Fund. The 80% debt ensures stability while the 20% equity gives her inflation-beating returns of ~8–9% annually — much better than FDs, without wild swings.',
                popular: 'ICICI Pru Regular Savings Fund, Kotak Debt Hybrid Fund, SBI Conservative Hybrid Fund, HDFC Hybrid Debt Fund, Canara Robeco Conservative Hybrid Fund'
            },
            {
                id: 'arbitrage', icon: '🔀', name: 'Arbitrage Funds', category: 'hybrid',
                categoryLabel: 'Hybrid', categoryColor: '#b45309', categoryBg: '#fffbeb',
                returns: '5.5 – 7%', horizon: '1–3 months', risk: 1, riskLabel: 'Very Low',
                tagline: 'Almost risk-free returns taxed as equity — ideal for high-tax investors.',
                what: 'Arbitrage funds exploit price differences between cash and futures markets. They simultaneously buy in cash market and sell in futures — locking in a nearly risk-free spread. Since they hold 65%+ in equity, they\'re taxed as equity funds (12.5% LTCG after 1 year vs your slab rate for debt/FD — huge benefit for 30% bracket investors).',
                scenarios: 'Perfect for investors in the 30% tax bracket who want to park money for 3 months to 1 year. Better post-tax returns than liquid/ultra-short funds for high earners. Excellent tax-efficient alternative to short-term FDs.',
                avoid: 'Returns are market-spread dependent and can fall when arbitrage opportunities dry up. Not ideal if you\'re in a lower tax bracket (the equity tax advantage disappears). Don\'t expect equity-like returns.',
                example: 'Vivek (30% tax bracket) parks ₹10L for 8 months in ICICI Pru Arbitrage Fund. He earns ~5.8% p.a. — taxed at 20% STCG (equity). After tax he gets ~4.64%. A liquid fund at 6.5% taxed at 30% slab gives only 4.55%. Arbitrage still wins — and holding >1 year cuts tax to just 12.5% LTCG!',
                popular: 'ICICI Pru Arbitrage Fund, Kotak Equity Arbitrage Fund, Nippon India Arbitrage Fund, SBI Arbitrage Opportunities Fund, Axis Arbitrage Fund'
            },
            {
                id: 'fof', icon: '🗂️', name: 'Fund of Funds (FoF)', category: 'others',
                categoryLabel: 'Others', categoryColor: '#0f766e', categoryBg: '#f0fdfa',
                returns: '9 – 14%', horizon: '5+ yrs', risk: 3, riskLabel: 'Varies',
                tagline: 'A fund that invests in other mutual funds — instant diversification.',
                what: 'A Fund of Funds (FoF) invests in other mutual funds rather than directly in stocks or bonds. It provides instant diversification across multiple funds, fund houses, and strategies. They can be domestic FoFs (investing in Indian MFs) or overseas FoFs (investing in global funds).',
                scenarios: 'Great for novice investors who want a complete portfolio in one fund. Overseas FoFs (like Motilal Oswal Nasdaq 100 FoF) are the only way to access international indices without a foreign brokerage account.',
                avoid: 'Double layer of expense ratios eats into returns. Taxed as debt funds (regardless of underlying equity) post 2023 budget changes — tax efficiency is lower than direct equity. Avoid if you want to optimize costs.',
                example: 'Pooja wants Nasdaq 100 exposure. She invests ₹50,000 in Motilal Oswal Nasdaq 100 FOF. The underlying fund tracks NASDAQ — giving her Apple, Microsoft, Google exposure without a US brokerage account. Over 5 years, US tech boomed and her ₹50k grew to ₹1.1L.',
                popular: 'Motilal Oswal Nasdaq 100 FOF, Mirae Asset NYSE FANG+ ETF FoF, ICICI Pru Multi Asset Fund of Funds, Edelweiss Greater China Equity Off-Shore Fund, Kotak Global Innovation FoF'
            },
            {
                id: 'dynamic-bond', icon: '🎛️', name: 'Dynamic Bond Funds', category: 'debt',
                categoryLabel: 'Debt', categoryColor: '#059669', categoryBg: '#ecfdf5',
                returns: '7 – 10%', horizon: '3+ yrs', risk: 3, riskLabel: 'Medium',
                tagline: 'Fund manager actively adjusts duration based on interest rate outlook.',
                what: 'Dynamic bond funds can invest across any duration of debt instruments. The fund manager actively adjusts the portfolio duration (short or long) based on interest rate expectations. When rates are expected to fall, they go long-duration (to maximize capital gains); when rates are expected to rise, they go short.',
                scenarios: 'Ideal for investors who want professional management of interest rate risk without deciding themselves. Good for 3+ year horizons. Best when you believe in the fund manager\'s macro expertise but don\'t want to time rates yourself.',
                avoid: 'Fund manager calls can go wrong — if the manager misjudges rate direction, returns suffer. Not suitable for investors who want predictable, fixed returns. Avoid for short-term goals.',
                example: 'In 2019–2020 rate cut cycle, ICICI Pru All Seasons Bond Fund (dynamic) delivered ~13% returns by going long-duration. In 2022 rate hike cycle, funds that stayed long-duration lost 2–3%. Dynamic funds that shifted short early preserved capital.',
                popular: 'ICICI Pru All Seasons Bond Fund, SBI Dynamic Bond Fund, Axis Dynamic Bond Fund, HDFC Dynamic Debt Fund, Kotak Dynamic Bond Fund'
            },
            {
                id: 'govt-savings', icon: '🏛️', name: 'Govt Small Savings Schemes', category: 'others',
                categoryLabel: 'Govt Schemes', categoryColor: '#059669', categoryBg: '#ecfdf5',
                returns: '7.1 – 8.2%', horizon: '5–15 yrs', risk: 1, riskLabel: 'Very Low',
                tagline: 'Sovereign-guaranteed instruments — highest safe rates in India.',
                what: 'Government small savings schemes are sovereign-guaranteed instruments managed by the Ministry of Finance and distributed via post offices and authorised banks. They offer the highest guaranteed rates available in India for conservative investors — completely safe, zero default risk, and accessible even in remote areas without a bank account or demat. Key schemes: PPF (7.1%, tax-free, 15 yrs), SCSS (8.2%, for 60+, best retiree rate), POMIS (7.4%, monthly income, 5 yrs), NSC (7.7%, 80C, 5 yrs), KVP (7.5%, doubles in ~9.5 yrs), RBI Floating Rate Bonds (7.35%, 7 yrs, rate resets every 6 months).',
                scenarios: 'Ideal for conservative investors, senior citizens, retirees, Tier-2/3 city residents, and anyone who wants sovereign safety over market returns. If you have not maxed PPF and SCSS before looking at debt mutual funds, you are leaving guaranteed superior returns on the table. Especially important for those without demat accounts or those uncomfortable with market instruments.',
                avoid: 'Most schemes have lock-in periods (1–15 years). Interest on most (except PPF) is taxable at slab rate. KVP and RBI FRB do not qualify for 80C. Check eligibility — SCSS is only for 60+ (or 55+ on VRS).',
                example: 'Shyam, 62, retired with ₹50L corpus. He puts ₹30L in SCSS (8.2%, ₹61,500/quarter) + ₹9L in POMIS (7.4%, ₹5,550/month) + ₹11L in PPF. His guaranteed quarterly + monthly income covers living expenses with zero market exposure — a retiree blueprint using only government schemes.',
                popular: 'SCSS (best for 60+), PPF (best long-term tax-free), POMIS (monthly income), NSC (80C, 5yr), KVP (doubles money), RBI Floating Rate Bonds (large corpus, rate-linked)'
            }
        ];

        let _mfCurrentFilter = 'all';
        let _mfRendered = false;
        let _pickerRendered = false;
        let _pickerCurrentFilter = 'all';
        const PICKER_METRIC_CATEGORY = {
            alpha:'returns', beta:'risk', sharpe:'risk', stddev:'risk',
            expense:'cost', sortino:'risk', rsquared:'structure',
            rollingreturn:'returns', aum:'structure', directvsregular:'cost',
            exitloadtax:'cost', aumquickref:'structure'
        };

        // ===== FUND QUALITY METRICS DATA =====
        const MF_METRICS = [
            {
                id: 'alpha',
                icon: '🏆',
                name: 'Alpha (α)',
                tagline: 'How much extra return the fund delivered above its benchmark',
                description: 'Alpha measures the fund manager\'s skill. An Alpha of +2 means the fund returned 2% more than its benchmark after adjusting for risk. A negative Alpha means the manager actually destroyed value — you\'d have been better off in an index fund.',
                goodRange: '> 0 (ideally > 1% consistently)',
                badRange: '< 0 (underperforming the benchmark)',
                goodColor: '#16a34a',
                badColor: '#dc2626',
                goodLabel: 'Positive = Manager adds value',
                badLabel: 'Negative = Stick to index funds',
                tip: 'Look at 3-year and 5-year Alpha, not just 1-year. Any manager can get lucky once.',
                example: 'Nifty 50 returns 12%. A fund with +2 Alpha returned ~14%. One with -1 Alpha returned ~11% — worse than just buying the index.',
                meter: 75,
                meterColor: '#16a34a'
            },
            {
                id: 'beta',
                icon: '📉',
                name: 'Beta (β)',
                tagline: 'How much the fund swings when the market moves',
                description: 'Beta tells you how volatile a fund is relative to the market. A Beta of 1.2 means if the Nifty falls 10%, this fund typically falls 12%. A Beta of 0.8 means it falls only 8%. Higher Beta = higher risk AND higher potential reward.',
                goodRange: '0.8–1.0 for stable funds; <0.8 for conservative',
                badRange: '>1.2 unless you are actively seeking high risk',
                goodColor: '#2563eb',
                badColor: '#ea580c',
                goodLabel: '~1.0 = moves with market',
                badLabel: '>1.2 = amplified swings',
                tip: 'Beta above 1 is fine for aggressive investors with long horizons. Avoid in retirement or short-term goals.',
                example: 'Market falls 20% in a crash. A Beta-1.3 fund falls 26%. A Beta-0.7 fund falls only 14%. Same market, very different impact.',
                meter: 60,
                meterColor: '#2563eb'
            },
            {
                id: 'sharpe',
                icon: '⚖️',
                name: 'Sharpe Ratio',
                tagline: 'Return earned per unit of total risk taken',
                description: 'Sharpe Ratio = (Fund Return − Risk-Free Rate) ÷ Standard Deviation. It answers: "Was the extra return worth the extra risk?" A Sharpe of 1.5 is good; 2+ is excellent. Two funds with 15% returns can have very different Sharpe ratios depending on how bumpy the ride was.',
                goodRange: '> 1.0 (good), > 1.5 (excellent), > 2.0 (outstanding)',
                badRange: '< 0.5 (poor risk-adjusted return)',
                goodColor: '#16a34a',
                badColor: '#dc2626',
                goodLabel: '>1.0 = decent risk-return trade-off',
                badLabel: '<0.5 = too much risk for return',
                tip: 'Use Sharpe to compare two funds in the same category. Never compare equity Sharpe to debt Sharpe.',
                example: 'Fund A returns 18% with Sharpe 0.6. Fund B returns 15% with Sharpe 1.4. Fund B is the smarter pick despite lower returns.',
                meter: 80,
                meterColor: '#16a34a'
            },
            {
                id: 'stddev',
                icon: '📊',
                name: 'Standard Deviation',
                tagline: 'How wildly the fund\'s returns fluctuate month to month',
                description: 'Standard Deviation (SD) measures return volatility. A fund with 15% average return and SD of 5% is stable — returns stay roughly between 10%–20%. The same fund with SD of 20% could return anywhere from -5% to 35%. Low SD = smoother ride.',
                goodRange: 'Equity: <15% preferred; Debt: <3%; Lower is calmer',
                badRange: 'Equity: >25% is very volatile; Debt: >6% is risky',
                goodColor: '#0891b2',
                badColor: '#dc2626',
                goodLabel: 'Lower SD = more predictable',
                badLabel: 'High SD = wild swings in NAV',
                tip: 'Compare SD within the same category. A mid-cap fund\'s SD will naturally be higher than a large-cap fund.',
                example: 'Two large-cap funds: Fund A SD = 10%, Fund B SD = 22%. Fund B feels like a rollercoaster even though it\'s in the same category.',
                meter: 55,
                meterColor: '#0891b2'
            },
            {
                id: 'expense',
                icon: '💸',
                name: 'Expense Ratio',
                tagline: 'Annual fee the fund deducts from your corpus — every single year',
                description: 'Expense Ratio is the annual cost charged by the AMC, deducted from NAV daily. On a ₹10 lakh investment, a 1.5% expense ratio costs ₹15,000/year regardless of performance. Over 20 years, the difference between a 0.5% and 1.5% expense ratio can be lakhs.',
                goodRange: 'Index Funds: <0.3%; Active Equity: <1.0%; Active Debt: <0.7%',
                badRange: 'Active Equity >2%; any fund consistently above category average',
                goodColor: '#16a34a',
                badColor: '#dc2626',
                goodLabel: 'Lower = more returns stay with you',
                badLabel: 'High ratio = silent wealth destroyer',
                tip: 'Compare Direct Plan vs Regular Plan. Regular plans are 0.5%–1% higher — that\'s commission going to the distributor, not you.',
                example: '₹10L growing at 12% for 20 years: 0% expense = ₹96L. 1.5% expense = ₹72L. A ₹24 lakh difference from fees alone.',
                meter: 90,
                meterColor: '#16a34a'
            },
            {
                id: 'sortino',
                icon: '🛡️',
                name: 'Sortino Ratio',
                tagline: 'Like Sharpe, but only penalises downside volatility',
                description: 'Sharpe penalises ALL volatility — including upward swings. Sortino only penalises downside risk (bad days). A fund that shoots up 5% one month and stays flat next month has high Sharpe volatility but zero Sortino downside risk. Sortino is more investor-friendly.',
                goodRange: '> 1.0 (good), > 2.0 (excellent)',
                badRange: '< 0.5 (too much downside for the return)',
                goodColor: '#7c3aed',
                badColor: '#dc2626',
                goodLabel: '>1.0 = good downside protection',
                badLabel: '<0.5 = frequent bad months',
                tip: 'Sortino is especially useful for funds you need to partially redeem (SWP). Low Sortino means your SWP gets hit hard in downturns.',
                example: 'Fund A Sortino 0.4: often drops 3–5% in bad months. Fund B Sortino 1.8: drops rarely and mildly. Both may have same annual return.',
                meter: 70,
                meterColor: '#7c3aed'
            },
            {
                id: 'rsquared',
                icon: '🔗',
                name: 'R-Squared (R²)',
                tagline: 'How closely the fund tracks its benchmark index',
                description: 'R-Squared (0–100%) tells you how much of the fund\'s movement is explained by the benchmark. An R² of 95% means 95% of the fund\'s ups and downs mirror the index. High R² + high expense ratio = you are paying active fees for passive behaviour. That\'s bad.',
                goodRange: 'Active funds: 70–85% (manager is making distinct choices); Passive: >97%',
                badRange: 'Active funds: >95% (closet indexer — why pay active fees?)',
                goodColor: '#0891b2',
                badColor: '#ea580c',
                goodLabel: '~75-85% = manager making real decisions',
                badLabel: '>95% = switch to a cheap index fund',
                tip: 'R² > 95% in an active fund is called "closet indexing." The manager barely deviates from the index but charges you full active fees.',
                example: 'An active large-cap fund with R² = 97% and expense 1.8%. You pay 18x more than a Nifty 50 index fund for virtually the same portfolio.',
                meter: 65,
                meterColor: '#0891b2'
            },
            {
                id: 'rollingreturn',
                icon: '📅',
                name: 'Rolling Returns',
                tagline: 'Consistency of returns across every possible period — not cherry-picked dates',
                description: 'A fund may show "15% returns" — but that depends on exactly when you measure from and to. Rolling Returns calculate the return for every possible start date over a period (e.g., every 3-year window). A fund with a high average rolling return AND low variance is truly consistent, not just lucky timing.',
                goodRange: '3-yr rolling return: consistency matters more than peak; look for % of periods with positive return',
                badRange: 'High average but wide variance = lucky streaks, not skill',
                goodColor: '#16a34a',
                badColor: '#ea580c',
                goodLabel: 'Consistent positive rolling = reliable manager',
                badLabel: 'Huge variance = get lucky or get hurt',
                tip: 'On Groww, Morningstar, or Value Research, check if a fund beats its benchmark in >60% of all rolling 3-year windows.',
                example: 'Fund A: 3-yr rolling average 14%, variance high — 8% to 22%. Fund B: 12%, tight range 10%–14%. Fund B is the safer SIP pick.',
                meter: 72,
                meterColor: '#16a34a'
            },
            {
                id: 'aum',
                icon: '🏦',
                name: 'AUM & Fund Size',
                tagline: 'Too small = risky; too large = harder to outperform',
                description: 'Assets Under Management (AUM) matters differently by category. A tiny AUM (<₹500 Cr) makes a fund vulnerable to redemption pressure — big investors exiting forces the fund to sell holdings at bad prices. But a massive AUM (>₹50,000 Cr) in mid-cap can hurt performance — hard to buy enough small-company shares without moving prices.',
                goodRange: 'Large Cap: ₹5,000–50,000 Cr fine; Mid/Small Cap: ₹500–15,000 Cr sweet spot',
                badRange: 'Any category: <₹100 Cr (too small); Mid/Small Cap: >₹25,000 Cr (too large)',
                goodColor: '#0891b2',
                badColor: '#ea580c',
                goodLabel: 'Right-sized for its category',
                badLabel: 'Too small = fragile; too large = index-like',
                tip: 'A mid-cap fund that\'s grown to ₹30,000 Cr often quietly shifts to large-caps to deploy capital — check the portfolio.',
                example: 'A small-cap fund at ₹50,000 Cr cannot meaningfully hold small-cap stocks — it would move the price just by buying.',
                meter: 58,
                meterColor: '#0891b2'
            },
            {
                id: 'directvsregular',
                icon: '🎯',
                name: 'Direct vs Regular Plan',
                tagline: 'Same fund, same manager — but one silently costs you lakhs more',
                description: 'Every mutual fund offers two plans: Direct (you invest directly with the AMC, no distributor) and Regular (you invest via a broker/distributor who earns a commission). The fund, manager, and strategy are 100% identical — only the expense ratio differs. That small difference in cost compounds massively over a decade.',
                goodRange: 'Direct Plan: 0.5–1.5% lower expense ratio; 1–2% higher annual returns over time',
                badRange: 'Regular Plan: distributor earns 0.5–1.5% trail commission — paid by YOU, every year, forever',
                goodColor: '#16a34a',
                badColor: '#dc2626',
                goodLabel: 'Direct Plan = keep your full alpha',
                badLabel: 'Regular Plan = silent commission drain',
                tip: 'Switch to Direct via Zerodha Coin, Groww Direct, or the AMC website directly. Takes 10 minutes, saves lakhs over 20 years.',
                example: '₹10,000 SIP for 20 years at 13% (Direct) = ₹1.37 Cr. At 11.5% (Regular after 1.5% drag) = ₹1.09 Cr. Regular costs you ₹28 lakh just in commissions.',
                meter: 90,
                meterColor: '#16a34a'
            },
            {
                id: 'exitloadtax',
                icon: '🧾',
                name: 'Exit Load & Taxation',
                tagline: 'What you don\'t know about redemption can cost you dearly',
                description: 'Exit Load is a penalty charged when you redeem a fund within a specified period (usually 1 year for equity funds = 1% exit load). Taxation depends on the holding period and fund type. Post-2023 budget, debt fund gains are taxed as per your income slab — a major change for conservative investors.',
                goodRange: 'Equity (LTCG >1yr): 12.5% on gains above ₹1.25L p.a. | STCG <1yr: 20% flat',
                badRange: 'Debt (post Apr 2023): Gains taxed at your income slab rate regardless of holding period',
                goodColor: '#7c3aed',
                badColor: '#ea580c',
                goodLabel: 'Hold >1yr for equity LTCG benefit',
                badLabel: 'Redeem early = exit load + STCG tax hit',
                tip: 'For debt investing, now consider FDs or direct bond platforms — the indexation benefit on debt MFs was removed in Budget 2023.',
                example: 'Redeeming a ₹5L equity fund after 10 months: pay 1% exit load (₹5,000) + 20% STCG on gains. Waiting just 2 more months saves you both.',
                meter: 75,
                meterColor: '#7c3aed'
            },
            {
                id: 'aumquickref',
                icon: '📐',
                name: 'AUM Size Quick Reference',
                tagline: 'At-a-glance: ideal fund size by category',
                description: 'AUM thresholds aren\'t one-size-fits-all. A ₹50,000 Cr large-cap fund is perfectly fine; the same AUM in a small-cap fund is a performance disaster. Use this quick guide to judge fund size at a glance — the \'Goldilocks Zone\' is where a fund is big enough to be stable but small enough to be nimble.',
                goodRange: 'Liquid/Debt: any size fine | Large Cap: ₹5K–₹80K Cr | Flexi Cap: ₹5K–₹40K Cr | Mid Cap: ₹1K–₹20K Cr | Small Cap: ₹500–₹10K Cr',
                badRange: 'Small/Mid Cap >₹25,000 Cr: fund becomes a closet large-cap | Any category <₹100 Cr: fragile and illiquid',
                goodColor: '#0891b2',
                badColor: '#ea580c',
                goodLabel: 'Goldilocks zone: stable yet nimble',
                badLabel: 'Outside range = structural performance drag',
                tip: 'Check AUM trend, not just current size. A fund doubling AUM in 1 year after strong returns is a warning — performance may not repeat at larger scale.',
                example: 'Quant Small Cap Fund: grew from ₹1,000 Cr to ₹25,000 Cr in 2 years post strong returns. New investors face a structurally different fund than early entrants enjoyed.',
                meter: 62,
                meterColor: '#0891b2'
            }
        ];

        const MF_CHECKLIST = [
            { icon: '📊', question: 'Is Alpha positive for 3+ consecutive years?', pass: 'Manager consistently beats benchmark', fail: 'Consider an index fund instead' },
            { icon: '⚖️', question: 'Is Sharpe Ratio above 1.0?', pass: 'Returns justify the risk you\'re taking', fail: 'You\'re getting poor compensation for volatility' },
            { icon: '💸', question: 'Is Expense Ratio below the category average?', pass: 'More of your return stays with you', fail: 'Silent drag on your compounding — switch to Direct Plan' },
            { icon: '🔗', question: 'For active funds, is R² below 90%?', pass: 'Manager is making genuinely active decisions', fail: 'You\'re paying for active management but getting index-like results' },
            { icon: '📅', question: 'Does the fund beat benchmark in >60% of rolling 3-yr windows?', pass: 'Consistent outperformance, not just lucky timing', fail: 'Returns may be timing-dependent — risky for SIP investors' },
            { icon: '🏦', question: 'Is the fund size right for its category?', pass: 'AUM is appropriate for the fund\'s mandate', fail: 'Too large = forced into different stocks; too small = vulnerable to redemptions' }
        ];

        // AUM category visual data for the quick reference card
        const AUM_CATEGORY_BARS = [
            { label: 'Liquid / Debt', min: 0, good: 500, max: 150000, goodLabel: 'Any size OK', color: '#059669', icon: '🏛️' },
            { label: 'Large Cap',     min: 100, good: 5000, cap: 80000, max: 150000, goodLabel: '₹5K–80K Cr', color: '#2563eb', icon: '📊' },
            { label: 'Flexi Cap',     min: 100, good: 5000, cap: 40000, max: 150000, goodLabel: '₹5K–40K Cr', color: '#7c3aed', icon: '🔄' },
            { label: 'Mid Cap',       min: 100, good: 1000, cap: 20000, max: 150000, goodLabel: '₹1K–20K Cr', color: '#d97706', icon: '📈' },
            { label: 'Small Cap',     min: 100, good: 500,  cap: 10000, max: 150000, goodLabel: '₹500–10K Cr', color: '#dc2626', icon: '🚀' },
        ];

        function renderAUMQuickRefCard() {
            const rows = AUM_CATEGORY_BARS.map(c => {
                const total = 150000;
                const goodStart = Math.round((c.good / total) * 100);
                const goodEnd   = c.cap ? Math.round((c.cap / total) * 100) : 100;
                const goodWidth = goodEnd - goodStart;
                const alertText = c.cap ? `>₹${c.cap>=1000 ? c.cap/1000+'K' : c.cap}Cr ⚠️` : '✅ flexible';
                return `
                <div class="flex items-center gap-2">
                    <span class="text-base w-5 flex-shrink-0">${c.icon}</span>
                    <span class="text-[10px] font-bold text-slate-700 w-20 flex-shrink-0 leading-tight">${c.label}</span>
                    <div class="flex-1 flex flex-col gap-0.5">
                        <div class="relative h-4 bg-slate-200 rounded-full overflow-hidden">
                            <div class="absolute h-full rounded-full" style="left:${goodStart}%;width:${goodWidth}%;background:${c.color};"></div>
                        </div>
                        <span style="font-size:9px;font-weight:700;color:${c.color};padding-left:${goodStart}%;">${c.goodLabel}</span>
                    </div>
                    <span style="font-size:9px;font-weight:700;color:#e11d48;width:60px;flex-shrink:0;text-align:right;line-height:1.2;">${alertText}</span>
                </div>`;
            }).join('');
            return `
            <div class="px-4 py-3 flex flex-col gap-3">
                <p class="text-[11px] text-slate-500 leading-relaxed">Each bar shows the <span class="font-bold text-emerald-700">green zone</span> (ideal AUM range). Anything to the right of the green zone = too large; fund behaviour changes.</p>
                <div class="flex flex-col gap-3">${rows}</div>
                <div class="flex items-center gap-3 mt-1 flex-wrap">
                    <div class="flex items-center gap-1.5"><span class="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span><span class="text-[9px] text-slate-500 font-bold">Sweet spot</span></div>
                    <div class="flex items-center gap-1.5"><span class="w-3 h-3 rounded-full bg-slate-200 inline-block"></span><span class="text-[9px] text-slate-500 font-bold">Caution zone</span></div>
                    <div class="flex items-center gap-1.5"><span class="text-rose-500 text-[9px] font-black">⚠️</span><span class="text-[9px] text-slate-500 font-bold">Too large — changes mandate</span></div>
                </div>
            </div>`;
        }

        function renderMFPickerSection() {
            // Render metric cards
            const grid = document.getElementById('mf-metric-cards');
            if (!grid) return;
            grid.innerHTML = '';
            MF_METRICS.forEach((m, idx) => {
                const isAUMQuickRef     = m.id === 'aumquickref';
                const isDirectVsRegular = m.id === 'directvsregular';
                const directVsRegularBody = `
                    <div class="px-4 py-3 space-y-2.5">
                        <p class="text-[11px] text-slate-600 leading-relaxed">${m.description}</p>
                        <!-- Side-by-side visual comparison -->
                        <div class="grid grid-cols-2 gap-2">
                            <div class="rounded-xl p-3 border-2 border-emerald-200 bg-emerald-50 text-center">
                                <div class="text-lg mb-1">🎯</div>
                                <div class="text-[10px] font-black text-emerald-800 uppercase tracking-wide">Direct Plan</div>
                                <div class="text-xs font-black text-emerald-700 mt-1">₹1.37 Cr</div>
                                <div class="text-[9px] text-emerald-600 font-medium">₹10K SIP × 20 yrs</div>
                                <div class="mt-1.5 text-[9px] font-bold text-emerald-700 bg-emerald-100 rounded-lg px-1.5 py-0.5">You keep 100%</div>
                            </div>
                            <div class="rounded-xl p-3 border-2 border-rose-200 bg-rose-50 text-center">
                                <div class="text-lg mb-1">💸</div>
                                <div class="text-[10px] font-black text-rose-800 uppercase tracking-wide">Regular Plan</div>
                                <div class="text-xs font-black text-rose-700 mt-1">₹1.09 Cr</div>
                                <div class="text-[9px] text-rose-600 font-medium">Same SIP × 20 yrs</div>
                                <div class="mt-1.5 text-[9px] font-bold text-rose-700 bg-rose-100 rounded-lg px-1.5 py-0.5">₹28L lost to fees</div>
                            </div>
                        </div>
                        <div class="bg-blue-50 border border-blue-100 rounded-lg px-2.5 py-1.5">
                            <div class="text-[9px] font-black text-blue-700 uppercase tracking-wider mb-0.5">💡 Pro Tip</div>
                            <p class="text-[10px] text-blue-800 leading-relaxed">${m.tip}</p>
                        </div>
                    </div>`;
                const isExitLoad = m.id === 'exitloadtax';
                const exitLoadBody = `
                    <div class="px-4 py-3 space-y-2.5">
                        <p class="text-[11px] text-slate-600 leading-relaxed">${m.description}</p>
                        <!-- Tax table -->
                        <div class="rounded-xl overflow-hidden border border-[#f5c842]/30">
                            <div class="grid grid-cols-3 bg-slate-100 text-[8px] font-black text-slate-500 uppercase tracking-wide">
                                <div class="px-2 py-1.5">Fund Type</div>
                                <div class="px-2 py-1.5 text-center">Holding</div>
                                <div class="px-2 py-1.5 text-right">Tax Rate</div>
                            </div>
                            <div class="divide-y divide-slate-100 text-[10px]">
                                <div class="grid grid-cols-3 px-2 py-1.5 bg-white">
                                    <span class="font-bold text-slate-700">Equity MF</span>
                                    <span class="text-center text-slate-500">&gt;1 yr</span>
                                    <span class="text-right font-black text-emerald-700">12.5% LTCG</span>
                                </div>
                                <div class="grid grid-cols-3 px-2 py-1.5 bg-slate-50">
                                    <span class="font-bold text-slate-700">Equity MF</span>
                                    <span class="text-center text-slate-500">&lt;1 yr</span>
                                    <span class="text-right font-black text-rose-600">20% STCG</span>
                                </div>
                                <div class="grid grid-cols-3 px-2 py-1.5 bg-white">
                                    <span class="font-bold text-slate-700">Debt MF</span>
                                    <span class="text-center text-slate-500">Any</span>
                                    <span class="text-right font-black text-amber-600">Slab rate</span>
                                </div>
                                <div class="grid grid-cols-3 px-2 py-1.5 bg-slate-50">
                                    <span class="font-bold text-slate-700">ELSS</span>
                                    <span class="text-center text-slate-500">3 yr lock</span>
                                    <span class="text-right font-black text-emerald-700">12.5% LTCG</span>
                                </div>
                            </div>
                        </div>
                        <div class="flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-lg px-2.5 py-1.5">
                            <span class="text-amber-500 font-black text-xs mt-0.5 flex-shrink-0">!</span>
                            <p class="text-[10px] text-amber-800 leading-relaxed">${m.tip}</p>
                        </div>
                    </div>`;
                const bodyContent = isAUMQuickRef ? renderAUMQuickRefCard()
                                  : isDirectVsRegular ? directVsRegularBody
                                  : isExitLoad ? exitLoadBody
                                  : `
                        <div class="px-4 py-3 space-y-2.5">
                            <p class="text-[11px] text-slate-600 leading-relaxed">${m.description}</p>
                            <div class="flex flex-col gap-1.5">
                                <div class="flex items-start gap-2 bg-green-50 border border-green-100 rounded-lg px-2.5 py-1.5">
                                    <span class="text-green-500 font-black text-xs mt-0.5 flex-shrink-0">✓</span>
                                    <div>
                                        <div class="text-[9px] font-black text-green-700 uppercase tracking-wider">Good: ${m.goodLabel}</div>
                                        <div class="text-[10px] text-green-800 font-medium">${m.goodRange}</div>
                                    </div>
                                </div>
                                <div class="flex items-start gap-2 bg-red-50 border border-red-100 rounded-lg px-2.5 py-1.5">
                                    <span class="text-red-500 font-black text-xs mt-0.5 flex-shrink-0">✗</span>
                                    <div>
                                        <div class="text-[9px] font-black text-red-700 uppercase tracking-wider">Watch out: ${m.badLabel}</div>
                                        <div class="text-[10px] text-red-800 font-medium">${m.badRange}</div>
                                    </div>
                                </div>
                            </div>
                            <div class="bg-blue-50 border border-blue-100 rounded-lg px-2.5 py-1.5">
                                <div class="text-[9px] font-black text-blue-700 uppercase tracking-wider mb-0.5">💡 Pro Tip</div>
                                <p class="text-[10px] text-blue-800 leading-relaxed">${m.tip}</p>
                            </div>
                            <div class="bg-slate-50 border border-[#f5c842]/30 rounded-lg px-2.5 py-1.5">
                                <div class="text-[9px] font-black text-slate-500 uppercase tracking-wider mb-0.5">📖 Indian Example</div>
                                <p class="text-[10px] text-slate-700 leading-relaxed">${m.example}</p>
                            </div>
                        </div>`;

                // Highlight the new trio of bonus cards with a subtle "NEW" badge
                const isNewCard = ['directvsregular','exitloadtax','aumquickref'].includes(m.id);
                const newBadge  = isNewCard ? `<span class="text-[8px] font-black px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 uppercase tracking-wide">Must Know</span>` : '';

                grid.insertAdjacentHTML('beforeend', `
                    <div class="bg-white border border-[#f5c842]/30 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                        <div class="px-4 pt-4 pb-3 border-b border-slate-100" style="background: linear-gradient(135deg, ${m.goodColor}0d 0%, ${m.goodColor}05 100%);">
                            <div class="flex items-center gap-2 mb-1 flex-wrap">
                                <span class="text-xl">${m.icon}</span>
                                <span class="text-sm font-black text-slate-800">${m.name}</span>
                                ${newBadge}
                            </div>
                            <p class="text-[11px] text-slate-500 leading-snug">${m.tagline}</p>
                            <!-- Mini meter -->
                            <div class="mt-2.5 flex items-center gap-2">
                                <div class="flex-1 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                    <div class="h-full rounded-full transition-all duration-1000" style="width:${m.meter}%; background:${m.meterColor};"></div>
                                </div>
                                <span class="text-[9px] font-bold text-slate-400 uppercase tracking-wide">importance</span>
                            </div>
                        </div>
                        ${bodyContent}
                    </div>
                `);
            });

            // Render checklist
            const checklist = document.getElementById('mf-checklist');
            if (!checklist) return;
            checklist.innerHTML = '';
            MF_CHECKLIST.forEach((item, i) => {
                checklist.insertAdjacentHTML('beforeend', `
                    <div class="flex flex-col gap-1.5 bg-slate-50 border border-[#f5c842]/30 rounded-xl p-3 h-full">
                        <div class="flex items-start gap-2">
                            <span class="text-base flex-shrink-0 mt-0.5">${item.icon}</span>
                            <span class="text-xs font-black text-slate-800 leading-snug">${item.question}</span>
                        </div>
                        <div class="flex flex-col gap-1 pl-1 flex-1 justify-end">
                            <div class="flex items-start gap-1.5">
                                <span class="text-[10px] font-black text-green-600 flex-shrink-0">✓ YES:</span>
                                <span class="text-[10px] text-green-700 leading-snug">${item.pass}</span>
                            </div>
                            <div class="flex items-start gap-1.5">
                                <span class="text-[10px] font-black text-red-500 flex-shrink-0">✗ NO:</span>
                                <span class="text-[10px] text-red-700 leading-snug">${item.fail}</span>
                            </div>
                        </div>
                    </div>
                `);
            });
        }

        // ===== FUND PICKER GUIDE PAGE =====

        function filterPickerMetrics(cat) {
            _pickerCurrentFilter = cat;
            ['all','returns','risk','cost','structure'].forEach(function(f) {
                var btn = document.getElementById('picker-f-' + f);
                if (btn) btn.className = (f === cat)
                    ? 'mf-filter-active text-xs font-bold px-3 py-1.5 rounded-full transition-all'
                    : 'mf-filter-inactive text-xs font-bold px-3 py-1.5 rounded-full transition-all';
            });
            document.querySelectorAll('#picker-metric-cards .picker-card').forEach(function(card) {
                var cardCat = card.dataset.pickerCat;
                var show = (cat === 'all' || cardCat === cat);
                card.style.display = show ? '' : 'none';
                if (show) { card.classList.remove('picker-card-anim'); void card.offsetWidth; card.classList.add('picker-card-anim'); }
            });
        }

        function renderFundPickerPage() {
            if (_pickerRendered) return;
            _pickerRendered = true;

            // ── Metric Cards ──────────────────────────────────────────────
            var grid = document.getElementById('picker-metric-cards');
            if (!grid) return;
            grid.innerHTML = '';
            MF_METRICS.forEach(function(m, idx) {
                var cat = PICKER_METRIC_CATEGORY[m.id] || 'returns';
                var isAUMQuickRef     = m.id === 'aumquickref';
                var isDirectVsRegular = m.id === 'directvsregular';
                var isExitLoad        = m.id === 'exitloadtax';
                var isNewCard = ['directvsregular','exitloadtax','aumquickref'].includes(m.id);
                var newBadge  = isNewCard
                    ? '<span class="text-[8px] font-black px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 uppercase tracking-wide">' + _t('picker.mustknow') + '</span>'
                    : '';

                var directVsRegularBody =
                    '<div class="px-4 py-3 space-y-2.5">' +
                        '<p class="text-[11px] text-slate-600 leading-relaxed">' + _mMetricDesc(m.id, m.description) + '</p>' +
                        '<div class="grid grid-cols-2 gap-2">' +
                            '<div class="rounded-xl p-3 border-2 border-emerald-200 bg-emerald-50 text-center">' +
                                '<div class="text-lg mb-1">🎯</div>' +
                                '<div class="text-[10px] font-black text-emerald-800 uppercase tracking-wide">Direct Plan</div>' +
                                '<div class="text-xs font-black text-emerald-700 mt-1">₹1.37 Cr</div>' +
                                '<div class="text-[9px] text-emerald-600 font-medium">₹10K SIP × 20 yrs</div>' +
                                '<div class="mt-1.5 text-[9px] font-bold text-emerald-700 bg-emerald-100 rounded-lg px-1.5 py-0.5">You keep 100%</div>' +
                            '</div>' +
                            '<div class="rounded-xl p-3 border-2 border-rose-200 bg-rose-50 text-center">' +
                                '<div class="text-lg mb-1">💸</div>' +
                                '<div class="text-[10px] font-black text-rose-800 uppercase tracking-wide">Regular Plan</div>' +
                                '<div class="text-xs font-black text-rose-700 mt-1">₹1.09 Cr</div>' +
                                '<div class="text-[9px] text-rose-600 font-medium">Same SIP × 20 yrs</div>' +
                                '<div class="mt-1.5 text-[9px] font-bold text-rose-700 bg-rose-100 rounded-lg px-1.5 py-0.5">₹28L lost to fees</div>' +
                            '</div>' +
                        '</div>' +
                        '<div class="bg-blue-50 border border-blue-100 rounded-lg px-2.5 py-1.5">' +
                            '<div class="text-[9px] font-black text-blue-700 uppercase tracking-wider mb-0.5">' + _t('picker.protip') + '</div>' +
                            '<p class="text-[10px] text-blue-800 leading-relaxed">' + _mMetricTip(m.id, m.tip) + '</p>' +
                        '</div>' +
                    '</div>';

                var exitLoadBody =
                    '<div class="px-4 py-3 space-y-2.5">' +
                        '<p class="text-[11px] text-slate-600 leading-relaxed">' + _mMetricDesc(m.id, m.description) + '</p>' +
                        '<div class="rounded-xl overflow-hidden border border-[#f5c842]/30">' +
                            '<div class="grid grid-cols-3 bg-slate-100 text-[8px] font-black text-slate-500 uppercase tracking-wide">' +
                                '<div class="px-2 py-1.5">Fund Type</div>' +
                                '<div class="px-2 py-1.5 text-center">Holding</div>' +
                                '<div class="px-2 py-1.5 text-right">Tax Rate</div>' +
                            '</div>' +
                            '<div class="divide-y divide-slate-100 text-[10px]">' +
                                '<div class="grid grid-cols-3 px-2 py-1.5 bg-white"><span class="font-bold text-slate-700">Equity MF</span><span class="text-center text-slate-500">&gt;1 yr</span><span class="text-right font-black text-emerald-700">12.5% LTCG</span></div>' +
                                '<div class="grid grid-cols-3 px-2 py-1.5 bg-slate-50"><span class="font-bold text-slate-700">Equity MF</span><span class="text-center text-slate-500">&lt;1 yr</span><span class="text-right font-black text-rose-600">20% STCG</span></div>' +
                                '<div class="grid grid-cols-3 px-2 py-1.5 bg-white"><span class="font-bold text-slate-700">Debt MF</span><span class="text-center text-slate-500">Any</span><span class="text-right font-black text-amber-600">Slab rate</span></div>' +
                                '<div class="grid grid-cols-3 px-2 py-1.5 bg-slate-50"><span class="font-bold text-slate-700">ELSS</span><span class="text-center text-slate-500">3 yr lock</span><span class="text-right font-black text-emerald-700">12.5% LTCG</span></div>' +
                            '</div>' +
                        '</div>' +
                        '<div class="flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-lg px-2.5 py-1.5">' +
                            '<span class="text-amber-500 font-black text-xs mt-0.5 flex-shrink-0">!</span>' +
                            '<p class="text-[10px] text-amber-800 leading-relaxed">' + m.tip + '</p>' +
                        '</div>' +
                    '</div>';

                var defaultBody =
                    '<div class="px-4 py-3 space-y-2.5">' +
                        '<p class="text-[11px] text-slate-600 leading-relaxed">' + _mMetricDesc(m.id, m.description) + '</p>' +
                        '<div class="flex flex-col gap-1.5">' +
                            '<div class="flex items-start gap-2 bg-green-50 border border-green-100 rounded-lg px-2.5 py-1.5">' +
                                '<span class="text-green-500 font-black text-xs mt-0.5 flex-shrink-0">✓</span>' +
                                '<div>' +
                                    '<div class="text-[9px] font-black text-green-700 uppercase tracking-wider">' + _t('picker.good') + ': ' + _mMetricGoodLabel(m.id, m.goodLabel) + '</div>' +
                                    '<div class="text-[10px] text-green-800 font-medium">' + _mMetricGoodRange(m.id, m.goodRange) + '</div>' +
                                '</div>' +
                            '</div>' +
                            '<div class="flex items-start gap-2 bg-red-50 border border-red-100 rounded-lg px-2.5 py-1.5">' +
                                '<span class="text-red-500 font-black text-xs mt-0.5 flex-shrink-0">✗</span>' +
                                '<div>' +
                                    '<div class="text-[9px] font-black text-red-700 uppercase tracking-wider">' + _t('picker.watchout') + ': ' + _mMetricBadLabel(m.id, m.badLabel) + '</div>' +
                                    '<div class="text-[10px] text-red-800 font-medium">' + _mMetricBadRange(m.id, m.badRange) + '</div>' +
                                '</div>' +
                            '</div>' +
                        '</div>' +
                        '<div class="bg-blue-50 border border-blue-100 rounded-lg px-2.5 py-1.5">' +
                            '<div class="text-[9px] font-black text-blue-700 uppercase tracking-wider mb-0.5">' + _t('picker.protip') + '</div>' +
                            '<p class="text-[10px] text-blue-800 leading-relaxed">' + _mMetricTip(m.id, m.tip) + '</p>' +
                        '</div>' +
                        '<div class="bg-slate-50 border border-[#f5c842]/30 rounded-lg px-2.5 py-1.5">' +
                            '<div class="text-[9px] font-black text-slate-500 uppercase tracking-wider mb-0.5">' + _t('picker.eg') + '</div>' +
                            '<p class="text-[10px] text-slate-700 leading-relaxed">' + _mMetricExample(m.id, m.example) + '</p>' +
                        '</div>' +
                    '</div>';

                var bodyContent = isAUMQuickRef     ? renderAUMQuickRefCard()
                                : isDirectVsRegular ? directVsRegularBody
                                : isExitLoad        ? exitLoadBody
                                :                     defaultBody;

                var catLabel = { returns:_t('picker.cat.returns'), risk:_t('picker.cat.risk'), cost:_t('picker.cat.cost'), structure:_t('picker.cat.structure') };
                var catColor = { returns:'#2563eb', risk:'#7c3aed', cost:'#dc2626', structure:'#0891b2' };
                var catBadge = '<span class="text-[8px] font-bold px-1.5 py-0.5 rounded-full" style="background:' +
                               (catColor[cat]||'#6366f1') + '18;color:' + (catColor[cat]||'#6366f1') + ';">' +
                               (catLabel[cat]||cat) + '</span>';

                grid.insertAdjacentHTML('beforeend',
                    '<div class="picker-card picker-card-anim bg-white border border-[#f5c842]/30 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow" data-picker-cat="' + cat + '">' +
                        '<div class="px-4 pt-4 pb-3 border-b border-slate-100" style="background: linear-gradient(135deg, ' + m.goodColor + '0d 0%, ' + m.goodColor + '05 100%);">' +
                            '<div class="flex items-center gap-2 mb-1 flex-wrap">' +
                                '<span class="text-xl">' + m.icon + '</span>' +
                                '<span class="text-sm font-black text-slate-800">' + _mMetricName(m.id, m.name) + '</span>' +
                                catBadge +
                                newBadge +
                            '</div>' +
                            '<p class="text-[11px] text-slate-500 leading-snug">' + _mMetricTagline(m.id, m.tagline) + '</p>' +
                            '<div class="mt-2.5 flex items-center gap-2">' +
                                '<div class="flex-1 bg-slate-100 rounded-full h-1.5 overflow-hidden">' +
                                    '<div class="h-full rounded-full transition-all duration-1000" style="width:' + m.meter + '%; background:' + m.meterColor + ';"></div>' +
                                '</div>' +
                                '<span class="text-[9px] font-bold text-slate-400 uppercase tracking-wide">importance</span>' +
                            '</div>' +
                        '</div>' +
                        bodyContent +
                    '</div>'
                );
            });

            // ── Checklist ─────────────────────────────────────────────────
            var checklist = document.getElementById('picker-checklist');
            if (checklist) {
                checklist.innerHTML = '';
                MF_CHECKLIST.forEach(function(item) {
                    checklist.insertAdjacentHTML('beforeend',
                        '<div class="flex flex-col gap-1.5 bg-slate-50 border border-[#f5c842]/30 rounded-xl p-3 h-full">' +
                            '<div class="flex items-start gap-2">' +
                                '<span class="text-base flex-shrink-0 mt-0.5">' + item.icon + '</span>' +
                                '<span class="text-xs font-black text-slate-800 leading-snug">' + item.question + '</span>' +
                            '</div>' +
                            '<div class="flex flex-col gap-1 pl-1 flex-1 justify-end">' +
                                '<div class="flex items-start gap-1.5">' +
                                    '<span class="text-[10px] font-black text-green-600 flex-shrink-0">✓ YES:</span>' +
                                    '<span class="text-[10px] text-green-700 leading-snug">' + item.pass + '</span>' +
                                '</div>' +
                                '<div class="flex items-start gap-1.5">' +
                                    '<span class="text-[10px] font-black text-red-500 flex-shrink-0">✗ NO:</span>' +
                                    '<span class="text-[10px] text-red-700 leading-snug">' + item.fail + '</span>' +
                                '</div>' +
                            '</div>' +
                        '</div>'
                    );
                });
            }

            // ── Comparison Table ──────────────────────────────────────────
            var tableWrap = document.getElementById('picker-comparison-table-wrap');
            if (tableWrap) {
                // Find the overflow-x-auto scroll wrapper inside mfkit-panel
                var mfPanel   = document.getElementById('mfkit-panel');
                var srcScroll = mfPanel ? mfPanel.querySelector('.overflow-x-auto') : null;
                if (srcScroll) {
                    var clone = srcScroll.cloneNode(true);
                    tableWrap.appendChild(clone);
                }
            }
        }

                function getMFCategoryColors(category) {
            const map = {
                equity:  { color: '#2563eb', bg: '#eff6ff', badge: '#bfdbfe' },
                debt:    { color: '#059669', bg: '#ecfdf5', badge: '#a7f3d0' },
                hybrid:  { color: '#b45309', bg: '#fffbeb', badge: '#fde68a' },
                tax:     { color: '#7c3aed', bg: '#f5f3ff', badge: '#ddd6fe' },
                passive: { color: '#0891b2', bg: '#ecfeff', badge: '#a5f3fc' },
                others:  { color: '#0f766e', bg: '#f0fdfa', badge: '#99f6e4' }
            };
            return map[category] || map.equity;
        }

        function renderMFKit() {
            if (_mfRendered) return;
            _mfRendered = true;
            const grid = document.getElementById('mf-tiles-grid');
            grid.innerHTML = '';
            MF_DATA.forEach((fund, idx) => {
                const c = getMFCategoryColors(fund.category);
                const riskColors = ['','#16a34a','#65a30d','#ca8a04','#ea580c','#dc2626'];
                const riskColor = riskColors[fund.risk];
                let dots = '';
                for (let d = 1; d <= 5; d++) {
                    dots += `<div style="width:9px;height:9px;border-radius:50%;background:${d <= fund.risk ? riskColor : '#e2e8f0'};flex-shrink:0;"></div>`;
                }
                grid.insertAdjacentHTML('beforeend', `
                    <div class="mf-tile invest-card border border-[#f5c842]/30 rounded-xl p-3 bg-white cursor-pointer group relative overflow-hidden"
                         data-category="${fund.category}" data-id="${fund.id}"
                         style="border-left: 3px solid ${c.color};"
                         onclick="openMFModal(${idx})">
                        <div class="flex items-start justify-between gap-2 mb-1.5">
                            <div class="font-bold text-sm text-slate-800 leading-tight">${fund.icon} ${_mfName(fund.id, fund.name)}</div>
                            <span class="text-[10px] font-black px-2 py-0.5 rounded-full flex-shrink-0" style="background:${c.badge};color:${c.color}">${fund.categoryLabel}</span>
                        </div>
                        <div class="text-[11px] text-slate-500 mb-2.5 leading-snug">${_mfTag(fund.id, fund.tagline)}</div>
                        <div class="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
                            <div class="flex flex-col gap-0.5">
                                <span class="text-[9px] font-bold text-slate-400 uppercase">${_t('mf.returns')}</span>
                                <span class="text-xs font-black" style="color:${c.color}">${fund.returns}</span>
                            </div>
                            <div class="flex flex-col items-center gap-0.5">
                                <span class="text-[9px] font-bold text-slate-400 uppercase">${_t('mf.horizon')}</span>
                                <span class="text-xs font-bold text-slate-600">${fund.horizon}</span>
                            </div>
                            <div class="flex flex-col items-end gap-0.5">
                                <div class="flex items-center gap-0.5">${dots}</div>
                                <span class="text-[9px] font-bold" style="color:${riskColor}">${_mfRisk(fund.riskLabel)}</span>
                            </div>
                        </div>
                        <div class="flex items-center justify-end mt-2">
                            <span class="text-[10px] font-semibold text-slate-400 group-hover:text-emerald-600 transition-colors flex items-center gap-0.5">${_t('mf.details')} <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg></span>
                        </div>
                        <div class="absolute inset-0 rounded-xl ring-2 ring-transparent group-hover:ring-emerald-300 transition-all pointer-events-none"></div>
                    </div>
                `);
            });
            renderMFPickerSection();
        }

        function filterMF(category) {
            _mfCurrentFilter = category;
            ['all','equity','debt','hybrid','tax','passive','others'].forEach(f => {
                const btn = document.getElementById('mf-f-' + f);
                if (btn) btn.className = (f === category) ? 'mf-filter-active text-xs font-bold px-3 py-1.5 rounded-full transition-all' : 'mf-filter-inactive text-xs font-bold px-3 py-1.5 rounded-full transition-all';
            });
            const tiles = document.querySelectorAll('#mf-tiles-grid .mf-tile');
            tiles.forEach(tile => {
                if (category === 'all' || tile.dataset.category === category) {
                    tile.classList.remove('mf-tile-hidden');
                } else {
                    tile.classList.add('mf-tile-hidden');
                }
            });
        }

        function openMFModal(idx) {
            const fund = MF_DATA[idx];
            if (!fund) return;
            const c = getMFCategoryColors(fund.category);
            const riskColors = ['','#16a34a','#65a30d','#ca8a04','#ea580c','#dc2626'];
            const riskColor = riskColors[fund.risk];
            const header = document.getElementById('mf-modal-header');
            header.style.background = c.bg;
            document.getElementById('mf-modal-icon').innerText = fund.icon;
            document.getElementById('mf-modal-name').innerText = _mfName(fund.id, fund.name);
            document.getElementById('mf-modal-returns').innerText = fund.returns;
            document.getElementById('mf-modal-returns').style.color = c.color;
            document.getElementById('mf-modal-horizon').innerText = fund.horizon;
            document.getElementById('mf-modal-risk-label').innerText = _mfRisk(fund.riskLabel);
            document.getElementById('mf-modal-risk-label').style.color = riskColor;
            const badge = document.getElementById('mf-modal-category-badge');
            badge.innerText = _mfCat(fund.categoryLabel);
            badge.style.background = c.badge;
            badge.style.color = c.color;
            let dots = '';
            for (let d = 1; d <= 5; d++) {
                dots += `<div style="width:11px;height:11px;border-radius:50%;background:${d <= fund.risk ? riskColor : '#e2e8f0'};flex-shrink:0;"></div>`;
            }
            document.getElementById('mf-modal-risk-dots').innerHTML = dots;
            document.getElementById('mf-modal-what').innerText = _mfWhat(fund.id, fund.what);
            document.getElementById('mf-modal-scenarios').innerText = _mfScenarios(fund.id, fund.scenarios);
            document.getElementById('mf-modal-avoid').innerText = _mfAvoid(fund.id, fund.avoid);
            document.getElementById('mf-modal-example').innerText = _mfExampleModal(fund.id, fund.example);
            const modal = document.getElementById('mf-modal');
            modal.classList.remove('hidden');
            const card = modal.querySelector('.animate-modal');
            card.style.animation = 'none';
            requestAnimationFrame(() => { card.style.animation = ''; });
        }

        function closeMFModal(event) {
            const modal = document.getElementById('mf-modal');
            if (event.target === modal || event.target === modal.querySelector('.absolute.inset-0')) {
                modal.classList.add('hidden');
            }
        }
        // ==================== FINANCIAL HEALTH SCORE ====================
        let hsChartInstance = null;
        let hsPfChartInstance = null;

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
                card.innerHTML =
                    '<div class="fp-goal-card-header" onclick="fpToggleCardBody(this)">' +
                        '<div class="flex items-center gap-2">' +
                            '<span class="text-base">' + meta.emoji + '</span>' +
                            '<div>' +
                                '<div class="text-xs font-black text-slate-700">' + (g.customName || meta.label) + '</div>' +
                                '<div class="text-[10px] ' + horizClass + ' font-bold" id="fp-horiz-label-' + i + '">' + horizLabel + ' · ' + g.years + ' yrs</div>' +
                            '</div>' +
                        '</div>' +
                        '<svg class="fp-card-chevron w-4 h-4 text-slate-400 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>' +
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
                container.innerHTML = '<p class="text-[10px] text-slate-400 font-semibold uppercase tracking-wide">Current value of each investment ↓</p>';
                return;
            }
            container.classList.remove('hidden');
            var rows = '<p class="text-[10px] text-slate-400 font-semibold uppercase tracking-wide">Current value of each investment ↓</p>';
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
                if (headerSub) headerSub.textContent = '5 quick questions to understand your comfort with risk';
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
            document.getElementById('fp-result-greeting').textContent       = 'Hi ' + name + '! Here\'s your personalised plan';
            document.getElementById('fp-result-profile-label').textContent  = profile.label;
            document.getElementById('fp-result-profile-sub').textContent    = profile.sub;
            document.getElementById('fp-risk-score-label').textContent      = 'Risk Score: ' + totalScore + '/15';
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
                        else { p.textContent = totalScore + '/15'; l.textContent = 'Risk Score'; }
                    }
                }
            });
            document.getElementById('fp-center-pct').textContent   = totalScore + '/15';
            document.getElementById('fp-center-label').textContent  = 'Risk Score';

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
            var ea = document.getElementById('fp-existing-amounts'); if(ea){ ea.classList.add('hidden'); ea.innerHTML='<p class="text-[10px] text-slate-400 font-semibold uppercase tracking-wide">Current value of each investment ↓</p>'; }
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

        // Close modal on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') document.getElementById('invest-modal').classList.add('hidden');
        });