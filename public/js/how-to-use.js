/* ══════════════════════════════════════════════════════════
   HOW TO USE — collapsible guide card injected into each tool
══════════════════════════════════════════════════════════ */
(function () {

    var _HU = {
        growth: {
            what: 'Project how a one-time lumpsum or monthly SIP grows with compound interest over any time horizon.',
            steps: [
                '1. Choose Lumpsum (one-time investment) or SIP (monthly) using the toggle at the top',
                '2. Enter the amount, expected annual return rate (%), and time period in years',
                '3. Toggle Inflation Adjust to see the real purchasing power of your future corpus',
                '4. Toggle LTCG to deduct 12.5% equity gains tax on returns above ₹1.25L'
            ],
            tip: 'Not sure what return rate to use? Nifty 50 has averaged ~12% p.a. over 20 years; FDs give 6-7%.'
        },
        goal: {
            what: 'Find the exact monthly SIP or lumpsum needed today to reach a specific financial goal by a target date.',
            steps: [
                '1. Select a goal type (Education, Marriage, Home, Retirement…) or write your own',
                '2. Enter the target corpus amount and number of years until you need it',
                '3. Set expected return rate — category presets auto-fill inflation for that goal type',
                '4. See the required monthly SIP and lumpsum equivalent instantly'
            ],
            tip: 'Child\'s Education preset assumes 10–12% inflation. You can override it — private college costs vary widely.'
        },
        homeloan: {
            what: 'EMI calculator, prepayment benefit, rent vs buy analysis, and Section 24(b) tax savings — all in one tool.',
            steps: [
                'EMI tab: enter loan amount, interest rate, and tenure to get your exact monthly EMI',
                'Prepayment tab: see how a one-time lump-sum payment reduces total interest and shortens tenure',
                'Rent vs Buy tab: compare the true 10/20-year cost of owning vs renting in your city',
                'Tax Saving tab: calculate annual deduction on home loan interest under Section 24(b)'
            ],
            tip: 'Use the Rent vs Buy tab before signing anything — for horizons under 7 years, renting often wins financially.'
        },
        stepupsip: {
            what: 'See the dramatic difference between a flat monthly SIP and one that increases by 10% every year.',
            steps: [
                '1. Enter your starting monthly SIP amount',
                '2. Set expected annual return rate and investment horizon (years)',
                '3. Compare flat SIP vs step-up SIP corpus side by side'
            ],
            tip: 'A ₹5,000 SIP stepped up 10% per year can beat a flat ₹15,000 SIP over 20 years — the compounding gap is staggering.'
        },
        epfcalc: {
            what: 'Project your EPF balance at retirement accounting for salary growth and the current 8.15% p.a. rate.',
            steps: [
                '1. Enter your current basic salary and existing EPF balance',
                '2. Set your expected retirement age and annual salary increment percentage',
                '3. See projected corpus at retirement and monthly income equivalent'
            ],
            tip: 'EPF earns 8.15% fully tax-free — for most salaried employees, it is the single largest retirement asset.'
        },
        ppfnps: {
            what: 'Compare PPF (15-year lock-in, guaranteed 7.1%) and NPS (market-linked + compulsory annuity) side by side.',
            steps: [
                'Toggle between PPF and NPS using the tab at the top',
                'PPF: enter annual contribution and investment tenure',
                'NPS: enter annual contribution, years to retirement, and expected equity allocation return',
                'Compare maturity corpus, annuity income, and total tax deduction benefit'
            ],
            tip: 'NPS unlocks an extra ₹50,000 deduction under 80CCD(1B) — on top of the standard ₹1.5L 80C limit.'
        },
        insure: {
            what: 'Check whether your life and health cover is enough using the industry-standard HLV method.',
            steps: [
                '1. Enter annual income, outstanding loans, and number of financial dependents',
                '2. Add existing life cover (term policy + any LIC/ULIP) and health cover amount',
                '3. See your coverage shortfall and recommended cover'
            ],
            tip: 'Rule of thumb: life cover = 10–15× annual income; health = ₹10L base + ₹25L super top-up minimum.'
        },
        mfexplorer: {
            what: 'Browse 1,000+ mutual funds live with NAV, signal scores, and a built-in fund comparator.',
            steps: [
                '1. Search by fund name, or use Category and AMC filters to narrow down',
                '2. Click any fund to see NAV history, 1Y/3Y/5Y returns, and our signal score',
                '3. Tap "Add to Compare" on up to 5 funds to open the side-by-side comparator',
                '4. Tap ★ on any fund to save it to your My Mutual Funds watchlist'
            ],
            tip: 'Signal score above 70 = positive momentum + low expense ratio + consistency. Use it as a shortlist filter.'
        },
        mymfs: {
            what: 'Your personal mutual fund watchlist — track saved funds, scores, and NAV at a glance.',
            steps: [
                '1. Funds you starred in MF Explorer appear here automatically',
                '2. See latest NAV, your saved signal score, and 1-year return for each fund',
                '3. You can save up to 20 funds in your watchlist'
            ],
            tip: 'To add funds, go to MF Explorer → open any fund → tap the ★ button.'
        },
        mfkit: {
            what: 'A plain-language guide to mutual fund categories — find the right fund type for your goal and risk level.',
            steps: [
                '1. Use the selector at the top to filter by risk level or time horizon',
                '2. Read each card: what the fund does, typical return range, and who it suits',
                '3. Once you know your category, find specific funds in MF Explorer'
            ],
            tip: 'First-time investor? Start with an Index Fund (Nifty 50) or Large-Cap Fund — simple, low-cost, proven.'
        },
        fundpicker: {
            what: 'Understand how to evaluate mutual funds using Alpha, Sharpe ratio, Sortino ratio, and Expense Ratio.',
            steps: [
                '1. Click any metric card to see a plain-English explanation with examples',
                '2. Understand what a "good" number looks like for each metric',
                '3. Apply these metrics when comparing funds in MF Explorer'
            ],
            tip: 'For equity funds: Sharpe > 1 is a strong signal. For debt funds: expense ratio matters most.'
        },
        coffeecan: {
            what: 'Screen for quality long-term compounders using ROCE, revenue growth, debt levels, and moat criteria.',
            steps: [
                '1. Set filter thresholds: minimum ROCE%, minimum Revenue CAGR%, maximum Debt/Equity',
                '2. Browse companies that pass all your filters',
                '3. Focus on businesses with 10+ year track records — not recent momentum plays'
            ],
            tip: 'Named after Robert Kirby\'s 1984 strategy: buy quality businesses, lock them in a coffee can, leave them for 10 years.'
        },
        finplan: {
            what: 'Get a personalised monthly SIP plan based on your income, life goals, risk profile, and existing wealth.',
            steps: [
                '1. Fill in income, monthly expenses, and your top financial goals with timelines',
                '2. Add existing investments (EPF, MF, FD, property) and outstanding loans',
                '3. Set your risk appetite and review the recommended allocation and SIP amount',
                '4. Download or share your personalised plan'
            ],
            tip: 'Fill in My Profile first — it auto-fills your income, age, family, and investment details here.'
        },
        taxguide: {
            what: 'Compare old vs new tax regime, calculate MF capital gains tax, and find your optimal filing strategy.',
            steps: [
                'Tax Optimizer: enter annual income and deductions — see which regime saves more',
                'MF Capital Gains: enter purchase and sale details for equity or debt MF tax calculation',
                'Crypto Tax: enter trading P&L for 30% flat-rate tax (no deductions allowed)',
                'Surplus line: see investable amount remaining after tax is accounted for'
            ],
            tip: 'Budget 2025: income up to ₹12 lakh is effectively zero-tax under the new regime with 87A rebate.'
        },
        healthscore: {
            what: 'Get an honest, scored financial report card across 6 key areas of your money life.',
            steps: [
                '1. Fill in your monthly savings rate, emergency fund months, insurance coverage, and debt situation',
                '2. Your score (0–100) updates live as you fill in values',
                '3. Review individual area scores to see exactly where you are weak'
            ],
            tip: 'Score below 60? Fix these two things first: 3–6 months emergency fund, and a term life insurance policy.'
        },
        ssaplanner: {
            what: 'Plan your daughter\'s Sukanya Samriddhi corpus + education fund with ELSS SIP top-up to bridge the gap.',
            steps: [
                '1. Enter your daughter\'s current age and annual SSA contribution amount',
                '2. Set your target education corpus and the age by which you need it (18 or 21)',
                '3. See SSA projected value and the additional ELSS SIP needed to hit the target'
            ],
            tip: 'SSA earns 8.2% p.a. fully tax-free + Section 80C deduction — one of the best guaranteed schemes for daughters.'
        },
        ctcoptimizer: {
            what: 'Break down your CTC into components and restructure to legally increase take-home by ₹10K–50K/month.',
            steps: [
                '1. Enter your total annual CTC',
                '2. Adjust flexible components: HRA, NPS, food coupons, LTA, professional development',
                '3. See the exact take-home impact and tax saved for each change'
            ],
            tip: 'Employer NPS contribution of 10% of Basic is tax-free and sits outside the ₹1.5L 80C limit — highest-impact tweak.'
        },
        gratuity: {
            what: 'Calculate the gratuity you are legally owed when leaving a job, including partial-year rounding rules.',
            steps: [
                '1. Enter your last drawn Basic + DA salary',
                '2. Enter total years and months of continuous service (minimum 5 years to qualify)',
                '3. See gratuity amount and whether it falls within the ₹25 lakh tax-free limit'
            ],
            tip: 'Formula: (Basic + DA) × 15/26 × Years. Your employer is legally obligated to pay this amount.'
        },
        debtplan: {
            what: 'Eliminate all your debts faster using Avalanche (lowest interest cost) or Snowball (fastest wins) strategy.',
            steps: [
                '1. Add each loan: outstanding balance, annual interest rate, and current EMI',
                '2. Compare total interest saved and time to debt-free under Avalanche vs Snowball',
                '3. See the month-by-month payoff schedule and recommended payoff order'
            ],
            tip: 'Credit card debt at 36% p.a. is always priority #1 — no investment can guarantee that return.'
        },
        jointplan: {
            what: 'Financial planning designed for dual-income couples — combined goals, shared loans, and joint tax optimisation.',
            steps: [
                '1. Enter both partners\' income, individual investments, and shared EMI obligations',
                '2. Add joint goals (home, children\'s education, retirement)',
                '3. See combined corpus projection and tax-efficient savings allocation'
            ],
            tip: 'As a couple you can split LTCG ₹1.25L × 2 = ₹2.5L tax-free per year — a legal and easy optimisation.'
        },
        cibil: {
            what: 'Understand your CIBIL score, the factors dragging it down, and get a step-by-step improvement plan.',
            steps: [
                '1. Enter your current CIBIL score and active loan and credit card details',
                '2. See how credit utilisation, payment history, credit age, and enquiries affect your score',
                '3. Follow the personalised action plan to reach 750+ in 6–12 months'
            ],
            tip: 'A score of 750+ typically qualifies you for the lowest home loan rates — worth ₹6L+ in savings over 20 years.'
        },
        fincal: {
            what: 'A consolidated India-specific financial calendar so you never miss a tax payment, investment window, or deadline.',
            steps: [
                '1. Browse upcoming deadlines: advance tax, ITR, PPF, ELSS, SGB windows, EPF, credit card dates',
                '2. Tap any event to see full details and the consequence of missing it',
                '3. Set browser reminders for the dates that matter to you'
            ],
            tip: 'Advance tax is due in 4 installments. Missing even one attracts 1% interest per month under Section 234C.'
        },
        selfempl: {
            what: 'Tax planning, advance tax schedule, and business emergency fund calculator for freelancers and business owners.',
            steps: [
                '1. Enter your annual gross business or professional income',
                '2. Select scheme: 44AD (trading/business), 44ADA (professionals), or regular books',
                '3. See tax liability, advance tax installments, and recommended business emergency fund size'
            ],
            tip: '44ADA covers professionals (doctors, lawyers, CAs, architects) — pay tax on just 50% of gross receipts.'
        },
        goldcomp: {
            what: 'Compare Gold ETF, Gold MF, Physical Gold, Digital Gold, and SGB on true post-cost returns.',
            steps: [
                '1. Enter your investment amount and holding period in years',
                '2. Select the gold forms you want to compare',
                '3. See total cost breakdown (GST, making charges, locker, fund expense) and net return'
            ],
            tip: 'Physical gold loses 3–10% upfront to GST + making charges. Gold ETF or SGB is almost always better.'
        },
        networth: {
            what: 'Build your complete financial balance sheet: total assets minus total liabilities = your net worth.',
            steps: [
                '1. Add all assets: bank balances, MFs, EPF/PPF, FDs, property, gold, stocks',
                '2. Add all liabilities: home loan outstanding, car loan, personal loan, credit card dues',
                '3. Track your net worth trend month over month'
            ],
            tip: 'The trend matters more than the number. A slow upward slope every month is all you need to be on track.'
        },
        ulipcheck: {
            what: 'Assess whether your ULIP or traditional LIC policy is worth continuing — or better surrendered now.',
            steps: [
                '1. Enter annual premium, policy start year, current fund value, and sum assured',
                '2. See the actual IRR (internal rate of return) your policy is delivering',
                '3. Compare against the "Buy Term + Invest the Difference" scenario'
            ],
            tip: 'If your policy IRR is below 5–6%, surrendering and buying a pure term plan almost always wins financially.'
        },
        fixedincome: {
            what: 'Calculate and compare post-tax returns on FD, SCSS, POMIS, NSC, and KVP based on your tax slab.',
            steps: [
                '1. Select the instrument (FD, SCSS, POMIS, NSC, or KVP)',
                '2. Enter principal amount, tenure, and your income tax bracket',
                '3. Compare net post-tax returns across instruments side by side'
            ],
            tip: 'SCSS at 8.2% is the best guaranteed return available to senior citizens (60+) — also eligible under 80C.'
        },
        retirementhub: {
            what: 'Project your full retirement corpus (EPF + PPF + NPS + SIP), then plan tax-efficient withdrawals that last 25–30 years.',
            steps: [
                '1. Enter current age, target retirement age, and expected monthly expenses at retirement',
                '2. Add existing EPF, PPF, and NPS balances along with current monthly SIP',
                '3. Switch to Drawdown Planner: set SWP withdrawal amount and see depletion timeline',
                '4. Use 3-Bucket strategy to split corpus into short, medium, and long-term allocation'
            ],
            tip: 'Always factor in 6% inflation on your withdrawal amount — what costs ₹50K/month today will cost ₹1.6L in 20 years.'
        },
        cgcalc: {
            what: 'Calculate capital gains tax on stocks, equity MF, debt MF, gold, or SGB using post-Budget 2024 rates.',
            steps: [
                '1. Select asset type: Equity, Debt MF, Gold, or SGB',
                '2. Enter purchase price, sale price, and dates of purchase and sale',
                '3. See whether it\'s STCG or LTCG, with indexation vs flat-rate comparison where applicable'
            ],
            tip: 'Equity LTCG (held > 1 year) is taxed at 12.5% above ₹1.25L — time your exits to stay within the annual limit.'
        },
        hracalc: {
            what: 'Calculate your HRA exemption under Section 10(13A) and find out the annual tax you save on rent.',
            steps: [
                '1. Enter basic salary, actual HRA received from employer, and monthly rent paid',
                '2. Select city type: Metro (50% of basic) or Non-Metro (40% of basic)',
                '3. See exempt HRA amount and total annual tax saved'
            ],
            tip: 'Exemption = lowest of (Actual HRA | Rent − 10% of Basic | 50%/40% of Basic). All three boxes must check out.'
        },
        nomtrack: {
            what: 'Track nominations across all financial accounts and assess your estate readiness with a will checklist.',
            steps: [
                '1. Go through each account type: bank, MF, insurance, EPF, demat, PPF, NPS',
                '2. Mark whether the nomination is filed and up to date for each',
                '3. Review the will readiness checklist and see your overall estate readiness score'
            ],
            tip: '~30% of EPF accounts have no nominee — without one, your family faces months of legal process to claim the balance.'
        },
        budgettrack: {
            what: 'Track monthly income and expenses by category, spot outliers, and see 12-month spending trends.',
            steps: [
                '1. Set monthly budget limits for each spending category',
                '2. Enter actual expenses during the month (or in one go at month-end)',
                '3. Review the donut chart and bar chart to see where you\'re over or under'
            ],
            tip: 'Consistently over-budget in one category? That\'s where the habit change needs to happen — not everywhere at once.'
        },
        emergency: {
            what: 'Calculate exactly how much emergency corpus you need based on your actual monthly spending.',
            steps: [
                '1. Choose your coverage duration: 3 months (minimum), 6 months (recommended), or 12 months (conservative)',
                '2. Fill in your monthly expenses for each category — Rent, Groceries, Fuel, Utilities, etc.',
                '3. Add any extra categories with "Add Custom Expense"',
                '4. See your target corpus and the 3 / 6 / 12-month scenarios side by side'
            ],
            tip: 'Park your emergency fund in a Liquid Mutual Fund (1-day redemption, ~7% return) — not a savings account and never in equity.'
        }
    };

    function _buildCard(content) {
        var stepsHtml = content.steps.map(function (s) {
            return '<li style="padding:3px 0;border-bottom:1px solid rgba(255,255,255,0.05);last-child:border-none;">' + s + '</li>';
        }).join('');
        var tipHtml = content.tip
            ? '<div style="margin-top:10px;padding:8px 10px;background:rgba(245,200,66,0.08);border-left:3px solid rgba(245,200,66,0.45);border-radius:0 8px 8px 0;font-size:10.5px;color:rgba(255,255,255,0.65);line-height:1.6;">' +
              '<strong style="color:#f5c842;font-size:10px;text-transform:uppercase;letter-spacing:.04em;">Pro tip</strong><br>' + content.tip +
              '</div>'
            : '';

        return '<div style="font-size:10.5px;color:rgba(255,255,255,0.55);line-height:1.5;padding-top:10px;border-top:1px solid rgba(255,255,255,0.07);margin-top:2px;">' +
            '<div style="margin-bottom:8px;font-size:10px;color:rgba(255,255,255,0.4);font-style:italic;">' + content.what + '</div>' +
            '<ul style="list-style:none;padding:0;margin:0;color:rgba(255,255,255,0.7);">' + stepsHtml + '</ul>' +
            tipHtml +
        '</div>';
    }

    window.injectHowToUse = function (mode) {
        var content = _HU[mode];
        if (!content) return;

        var cardId  = 'howto-' + mode;
        var bodyId  = 'howto-body-'  + mode;
        var arrowId = 'howto-arrow-' + mode;

        if (document.getElementById(cardId)) return;

        var outer = document.createElement('div');
        outer.id = cardId;

        var toggleHtml =
            '<button onclick="(function(){' +
                'var b=document.getElementById(\'' + bodyId + '\');' +
                'var a=document.getElementById(\'' + arrowId + '\');' +
                'var open=b.style.display===\'block\';' +
                'b.style.display=open?\'none\':\'block\';' +
                'a.textContent=open?\'▾\':\'▴\';' +
            '})()" ' +
            'style="width:100%;display:flex;align-items:center;gap:8px;padding:9px 14px;background:transparent;border:none;cursor:pointer;text-align:left;">' +
                '<span style="font-size:14px;line-height:1;">📖</span>' +
                '<span style="font-size:11px;font-weight:700;color:rgba(245,200,66,0.8);flex:1;letter-spacing:.01em;">How to use this tool</span>' +
                '<span id="' + arrowId + '" style="font-size:11px;color:rgba(255,255,255,0.35);">▾</span>' +
            '</button>' +
            '<div id="' + bodyId + '" style="display:none;padding:0 14px 14px;">' +
                _buildCard(content) +
            '</div>';

        // ── Growth / Goal: inject into dedicated slots above the two-column layout.
        //    Slots are toggled by app.js switchMode when the user switches modes.
        if (mode === 'growth' || mode === 'goal') {
            var slot = document.getElementById('howto-' + mode + '-slot');
            if (!slot) return;
            outer.style.cssText = 'border-radius:12px;border:1px solid rgba(245,200,66,0.2);overflow:hidden;background:rgba(12,27,58,0.6);backdrop-filter:blur(4px);';
            outer.innerHTML = toggleHtml;
            slot.appendChild(outer);
            return;
        }

        // ── All other tools: prepend to {mode}-panel ──
        var target = document.getElementById(mode + '-panel');
        if (!target) return;
        outer.style.cssText = 'border-radius:12px;border:1px solid rgba(245,200,66,0.2);overflow:hidden;margin-bottom:4px;background:rgba(12,27,58,0.6);backdrop-filter:blur(4px);';
        outer.innerHTML = toggleHtml;
        target.insertBefore(outer, target.firstChild);
    };

})();
