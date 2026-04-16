    /* ══════════════════════════════════════════════════════════
       WHATSAPP SHARE
    ══════════════════════════════════════════════════════════ */
    var _waUrl = 'https://aishwaryamasthu-66c6f.web.app';

    function _waFmt(el) {
        return el ? (el.textContent || el.innerText || '').trim() : '—';
    }


    /* ══════════════════════════════════════════════════════════
       WHATSAPP SHARE
    ══════════════════════════════════════════════════════════ */
    function waShare(page) {
        var msg = '';
        var url = _waUrl;

        if (page === 'growth' || page === 'goal') {
            var result = _waFmt(document.getElementById('main-result'));
            var mode   = typeof currentMode !== 'undefined' ? currentMode : 'growth';
            if (mode === 'goal') {
                var years  = document.getElementById('years')?.value || '';
                var goal   = _waFmt(document.getElementById('amount-words'));
                msg = '🎯 I calculated my *Goal Planner* on Aishwaryamasthu!\n' +
                      'Target corpus: *' + result + '*' + (years ? ' in ' + years + ' years' : '') + '\n' +
                      (goal && goal !== 'Zero' ? '(' + goal + ')\n' : '') +
                      '\nCalculate yours 👇';
            } else {
                var rate  = document.getElementById('rate')?.value || '';
                var years2 = document.getElementById('years')?.value || '';
                msg = '📈 I just calculated my *wealth growth* on Aishwaryamasthu!\n' +
                      'Future corpus: *' + result + '*' + (years2 ? ' in ' + years2 + ' years' : '') +
                      (rate ? ' at ' + rate + '% return' : '') + '\n' +
                      '\nCalculate yours 👇';
            }
        }

        else if (page === 'emergency') {
            var total  = _waFmt(document.getElementById('ef-total-result'));
            var months = typeof efMonths !== 'undefined' ? efMonths : '';
            msg = '🛡️ I calculated my *Emergency Fund* on Aishwaryamasthu!\n' +
                  'I need *' + total + '*' + (months ? ' (' + months + ' months of expenses)' : '') + '\n' +
                  'Most Indians are 1 emergency away from debt. Are you covered?\n' +
                  '\nCheck yours 👇';
        }

        else if (page === 'homeloan') {
            var emi    = document.querySelector('#hl-emi-result .text-3xl')?.textContent?.trim() || '';
            var amount = document.getElementById('hl-amount')?.value || '';
            var rate   = document.getElementById('hl-rate')?.value || '';
            var tenure = document.getElementById('hl-tenure')?.value || '';
            if (!emi) emi = 'calculated';
            msg = '🏠 I calculated my *Home Loan EMI* on Aishwaryamasthu!\n' +
                  (amount ? 'Loan: ₹' + amount : '') +
                  (rate   ? ' @ ' + rate + '%' : '') +
                  (tenure ? ' for ' + tenure + ' yrs' : '') + '\n' +
                  'Monthly EMI: *' + emi + '*\n' +
                  '\nCalculate yours 👇';
        }

        else if (page === 'prepay') {
            var ppAmount   = document.getElementById('pp-amount')?.value || '';
            var ppRate     = document.getElementById('pp-rate')?.value || '';
            var ppTenure   = document.getElementById('pp-tenure')?.value || '';
            var ppLump     = document.getElementById('pp-lump')?.value || '';
            var ppAfter    = document.getElementById('pp-after')?.value || '';
            var intSaved   = document.querySelector('#hl-prepay-result .text-emerald-600')?.textContent?.trim() || '';
            var yrsSaved   = document.querySelector('#hl-prepay-result .text-blue-600')?.textContent?.trim() || '';
            msg = '💰 I calculated my *Prepayment Benefit* on Aishwaryamasthu!\n' +
                  (ppAmount ? 'Loan: ₹' + ppAmount : '') +
                  (ppRate   ? ' @ ' + ppRate + '%' : '') +
                  (ppTenure ? ' for ' + ppTenure + ' yrs' : '') + '\n' +
                  (ppLump   ? 'Lump-sum prepayment: ₹' + ppLump + (ppAfter ? ' after ' + ppAfter + ' yrs\n' : '\n') : '') +
                  (intSaved ? 'Interest saved: *' + intSaved + '*\n' : '') +
                  (yrsSaved ? 'Tenure reduced by: *' + yrsSaved + '*\n' : '') +
                  'A smart prepayment can save lakhs in interest!\n' +
                  '\nCalculate yours 👇';
        }

        else if (page === 'rentvsbuy') {
            var rvbPrice   = document.getElementById('rvb-price')?.value || '';
            var rvbDown    = document.getElementById('rvb-down')?.value || '';
            var rvbRate    = document.getElementById('rvb-rate')?.value || '';
            var rvbRent    = document.getElementById('rvb-rent')?.value || '';
            var rvbYears   = document.getElementById('rvb-years')?.value || '20';
            var verdict    = document.querySelector('#hl-rvb-result .font-black.text-base, #hl-rvb-result .font-black.text-lg')?.textContent?.trim() || '';
            msg = '⚖️ I ran a *Rent vs Buy analysis* on Aishwaryamasthu!\n' +
                  (rvbPrice ? 'Property: ₹' + rvbPrice : '') +
                  (rvbDown  ? ' | Down payment: ₹' + rvbDown : '') + '\n' +
                  (rvbRent  ? 'Current rent: ₹' + rvbRent + '/mo\n' : '') +
                  (rvbYears ? 'Horizon: ' + rvbYears + ' years\n' : '') +
                  (verdict  ? 'Verdict: *' + verdict + '*\n' : '') +
                  'Renting vs Buying — the math might surprise you!\n' +
                  '\nCalculate yours 👇';
        }

        else if (page === 'tax24b') {
            var txAmount   = document.getElementById('tx-amount')?.value || '';
            var txRate     = document.getElementById('tx-rate')?.value || '';
            var txTenure   = document.getElementById('tx-tenure')?.value || '';
            var txSlab     = document.getElementById('tx-slab')?.value || '';
            var taxSaved   = document.querySelector('#hl-tax-result .text-emerald-600, #hl-tax-result .font-black.text-2xl')?.textContent?.trim() || '';
            msg = '🧾 I calculated my *Section 24(b) Tax Saving* on Aishwaryamasthu!\n' +
                  (txAmount ? 'Loan: ₹' + txAmount : '') +
                  (txRate   ? ' @ ' + txRate + '%' : '') +
                  (txTenure ? ' for ' + txTenure + ' yrs' : '') + '\n' +
                  (txSlab   ? 'Tax slab: ' + txSlab + '%\n' : '') +
                  (taxSaved ? 'Tax saved under Sec 24(b): *' + taxSaved + '*\n' : '') +
                  'Home loan interest deduction — are you claiming yours?\n' +
                  '\nCalculate yours 👇';
        }

        else if (page === 'stepupsip') {
            var flatC  = _waFmt(document.getElementById('su-flat-corpus'));
            var stepC  = _waFmt(document.getElementById('su-stepup-corpus'));
            var extra  = _waFmt(document.getElementById('su-extra-wealth'));
            var mult   = _waFmt(document.getElementById('su-xirr'));
            var sip    = document.getElementById('su-amount')?.value || '';
            var stepup = document.getElementById('su-stepup')?.value || '10';
            msg = '📈 This changed how I think about SIPs! (*Aishwaryamasthu*)\n' +
                  (sip ? '₹' + sip + '/mo flat SIP → *' + flatC + '*\n' : '') +
                  (sip ? '₹' + sip + '/mo with ' + stepup + '% annual step-up → *' + stepC + '*\n' : '') +
                  (extra !== '—' ? 'Extra wealth from step-up: *' + extra + '* 🤯\n' : '') +
                  '\nSee the staggering difference 👇';
        }

        else if (page === 'epf') {
            var corpus  = _waFmt(document.getElementById('epf-total-corpus'));
            var age     = document.getElementById('epf-retire')?.value || '60';
            var pension = _waFmt(document.getElementById('epf-pension'));
            msg = '🏦 My *EPF corpus at retirement* — India\'s invisible number!\n' +
                  'Total EPF at age ' + age + ': *' + corpus + '*\n' +
                  (pension !== '—' ? 'Monthly EPS pension: *' + pension + '*\n' : '') +
                  'Most salaried Indians don\'t even know this number. Do you?\n' +
                  '\nCalculate yours 👇';
        }

        else if (page === 'ssa') {
            var ssaVal   = _waFmt(document.getElementById('ssa-maturity-val'));
            var elssVal  = _waFmt(document.getElementById('ssa-elss-val'));
            var total    = _waFmt(document.getElementById('ssa-total-val'));
            var dobYear  = document.getElementById('ssa-dob-year')?.value || '';
            msg = '👧 I planned my *daughter\'s education & marriage corpus* on Aishwaryamasthu!\n' +
                  'Sukanya Samriddhi: *' + ssaVal + '* (8.2% tax-free, Govt guaranteed)\n' +
                  'ELSS SIP: *' + elssVal + '*\n' +
                  'Combined at age 21: *' + total + '*\n' +
                  '\nPlan for your daughter 👇';
        }

        else if (page === 'drawdown') {
            var depAge   = document.getElementById('dd-depletion-age')?.textContent?.trim() || '';
            var yrsLast  = document.getElementById('dd-years-last')?.textContent?.trim() || '';
            var swpStart = document.getElementById('dd-swp-start')?.textContent?.trim() || '';
            var ddCorpus = document.getElementById('dd-corpus')?.value || '';
            msg = '🏖️ I just planned my *Retirement Drawdown* on Aishwaryamasthu!\n' +
                  (ddCorpus ? 'Corpus: ₹' + ddCorpus + '\n' : '') +
                  (swpStart ? 'First month SWP: *' + swpStart + '*\n' : '') +
                  (depAge   ? 'Corpus lasts until age: *' + depAge + '* (' + yrsLast + ')\n' : '') +
                  'Bucket strategy: Liquid 1yr · Debt 2–4yr · Equity rest\n' +
                  '\nPlan your retirement income 👇';
        }

        else if (page === 'ppf') {
            var ppfMaturity  = document.getElementById('ppf-maturity')?.textContent?.trim() || '';
            var ppfInterest  = document.getElementById('ppf-interest')?.textContent?.trim() || '';
            var ppfAnnual    = document.getElementById('ppf-annual')?.value || '';
            var ppfMultiple  = document.getElementById('ppf-multiple')?.textContent?.trim() || '';
            msg = '🏛️ I calculated my *PPF maturity* on Aishwaryamasthu!\n' +
                  (ppfAnnual ? 'Annual contribution: ₹' + ppfAnnual + '\n' : '') +
                  (ppfMaturity ? 'Maturity value (tax-free): *' + ppfMaturity + '*\n' : '') +
                  (ppfInterest ? 'Total interest earned: *' + ppfInterest + '*\n' : '') +
                  (ppfMultiple ? 'Wealth multiple: *' + ppfMultiple + '*\n' : '') +
                  'PPF: 7.1% tax-free · EEE status · 80C deductible\n' +
                  '\nCalculate yours 👇';
        }

        else if (page === 'nps') {
            var npsCorpus   = document.getElementById('nps-total-corpus')?.textContent?.trim() || '';
            var npsLumpsum  = document.getElementById('nps-lumpsum')?.textContent?.trim() || '';
            var npsPension  = document.getElementById('nps-pension')?.textContent?.trim() || '';
            var npsTaxSaved = document.getElementById('nps-tax-saved')?.textContent?.trim() || '';
            msg = '🏛️ I projected my *NPS retirement corpus* on Aishwaryamasthu!\n' +
                  (npsCorpus  ? 'Total NPS corpus at 60: *' + npsCorpus + '*\n' : '') +
                  (npsLumpsum ? 'Tax-free lumpsum (60%): *' + npsLumpsum + '*\n' : '') +
                  (npsPension ? 'Monthly pension: *' + npsPension + '*\n' : '') +
                  (npsTaxSaved ? 'Total tax saved: *' + npsTaxSaved + '*\n' : '') +
                  '80C + 80CCD(1B) deductions · Most tax-efficient retirement tool\n' +
                  '\nProject yours 👇';
        }

        else if (page === 'ctc') {
            var ctcTakeHome  = document.getElementById('ctc-current-takehome')?.textContent?.trim() || '';
            var ctcOptimized = document.getElementById('ctc-optimized-takehome')?.textContent?.trim() || '';
            var ctcBanner    = document.getElementById('ctc-savings-banner')?.textContent?.trim() || '';
            var ctcAnnual    = document.getElementById('ctc-annual')?.value || '';
            msg = '💰 I just optimized my *CTC & Salary* on Aishwaryamasthu!\n' +
                  (ctcAnnual ? 'Annual CTC: ₹' + ctcAnnual + '\n' : '') +
                  (ctcTakeHome ? 'Current take-home: *' + ctcTakeHome + '*\n' : '') +
                  (ctcOptimized ? 'Optimized take-home: *' + ctcOptimized + '*\n' : '') +
                  (ctcBanner && ctcBanner.includes('▲') ? ctcBanner + '\n' : '') +
                  'HRA · NPS 80CCD(2) · Food coupons · LTA restructuring\n' +
                  '\nFind your hidden salary savings 👇';
        }

        else if (page === 'insure') {
            var insTermNeeded  = document.getElementById('ins-term-needed')?.textContent?.trim() || '';
            var insHealthNeeded= document.getElementById('ins-health-needed')?.textContent?.trim() || '';
            var insTermGap     = document.getElementById('ins-term-gap-pill')?.textContent?.trim() || '';
            var insHealthGap   = document.getElementById('ins-health-gap-pill')?.textContent?.trim() || '';
            var insIncome      = document.getElementById('ins-income')?.value || '';
            msg = '🛡️ I checked my *Insurance Adequacy* on Aishwaryamasthu!\n' +
                  (insIncome ? 'Annual income: ₹' + insIncome + '\n' : '') +
                  (insTermNeeded ? 'Required term cover: *' + insTermNeeded + '*\n' : '') +
                  (insTermGap ? 'Term gap: *' + insTermGap + '*\n' : '') +
                  (insHealthNeeded ? 'Required health cover: *' + insHealthNeeded + '*\n' : '') +
                  (insHealthGap ? 'Health gap: *' + insHealthGap + '*\n' : '') +
                  'HLV method · ₹10L floater + ₹25L super top-up · Stop underinsurance\n' +
                  '\nCheck your coverage 👇';
        }

        else if (page === 'gratuity') {
            var gratGross   = document.getElementById('grat-gross')?.textContent?.trim() || '';
            var gratNet     = document.getElementById('grat-net')?.textContent?.trim() || '';
            var gratService = document.getElementById('grat-service-counted')?.textContent?.trim() || '';
            var gratBasic   = document.getElementById('grat-basic')?.value || '';
            var gratTax     = document.getElementById('grat-tax')?.textContent?.trim() || '';
            msg = '🏅 I just calculated my *Gratuity* on Aishwaryamasthu!\n' +
                  (gratBasic   ? 'Basic + DA salary: ₹' + gratBasic + '/mo\n' : '') +
                  (gratService ? 'Service counted: *' + gratService + '*\n' : '') +
                  (gratGross   ? 'Gross gratuity: *' + gratGross + '*\n' : '') +
                  (gratNet     ? 'Net in-hand: *' + gratNet + '*\n' : '') +
                  'Formula: 15/26 × Basic × Years · Tax-free up to ₹25L\n' +
                  '\nCalculate yours before you resign 👇';
        }

        else if (page === 'debtplan') {
            var debtTotalBal  = document.getElementById('debt-total-bal')?.textContent?.trim() || '';
            var debtIntSaved  = document.getElementById('debt-interest-saved')?.textContent?.trim() || '';
            var debtPayoff    = document.getElementById('debt-payoff-months')?.textContent?.trim() || '';
            var debtExtra     = document.getElementById('debt-extra')?.value || '';
            var debtPriority  = document.querySelector('#debt-priority-list .font-black.text-slate-700')?.textContent?.trim() || '';
            msg = '⚡ I just planned my *Loan Prepayment* on Aishwaryamasthu!\n' +
                  (debtTotalBal ? 'Total outstanding debt: *' + debtTotalBal + '*\n' : '') +
                  (debtExtra ? 'Extra monthly prepayment: ₹' + debtExtra + '\n' : '') +
                  (debtIntSaved ? 'Interest saved: *' + debtIntSaved + '*\n' : '') +
                  (debtPayoff ? 'Debt-free in: *' + debtPayoff + '*\n' : '') +
                  'Avalanche (high rate first) & Snowball (small balance first) methods\n' +
                  '\nPlan your debt freedom 👇';
        }

        else if (page === 'taxguide') {
            var surplus = document.getElementById('tg-surplus-content')?.textContent?.trim() || '';
            var regime  = document.querySelector('#tg-result-section .font-black')?.textContent?.trim() || 'calculated';
            msg = '🧾 I checked my *tax saving* on Aishwaryamasthu!\n' +
                  'Old vs New regime comparison done ✅\n' +
                  'Are you maximising your 80C, HRA and NPS deductions?\n' +
                  '\nCheck your tax saving 👇';
        }

        else if (page === 'healthscore') {
            var score = _waFmt(document.getElementById('hs-score-display'));
            var grade = _waFmt(document.getElementById('hs-grade-title'));
            msg = '💗 I just checked my *Financial Health Score* on Aishwaryamasthu!\n' +
                  'My score: *' + score + '/100* — ' + grade + '\n' +
                  'Insurance ✓  Emergency Fund ✓  Investments ✓  Debt ✓\n' +
                  '\nCheck your honest score 👇';
        }

        else if (page === 'finplan') {
            var monthly = document.querySelector('#fp-result-header .text-2xl')?.textContent?.trim() || '';
            msg = '📋 I just got my *personalised investment plan* on Aishwaryamasthu!\n' +
                  (monthly ? 'My recommended monthly SIP: *' + monthly + '*\n' : '') +
                  'It covers: goals, risk profile, EPF, insurance gaps & asset allocation.\n' +
                  '\nGet your free plan 👇';
        }

        else if (page === 'fundcompare') {
            var chips = document.querySelectorAll('.mfc-chip span');
            var names = Array.from(chips).map(function(s){ return s.textContent.trim(); }).filter(Boolean);
            var fundList = names.length ? names.join(' vs ') : 'multiple funds';
            msg = '⚖️ I just compared *' + fundList + '* on Aishwaryamasthu!\n' +
                  'Side-by-side: CAGR · Alpha · Sharpe · Beta · Standard Deviation\n' +
                  'The numbers tell a very different story than the ads.\n' +
                  '\nCompare your funds 👇';
        }

        else if (page === 'cibil') {
            var cScore = document.getElementById('cibil-score')?.value || '';
            var cGrade = document.getElementById('cibil-grade-label')?.textContent?.trim() || '';
            var cSaved = document.getElementById('cibil-total-saved')?.textContent?.trim() || '';
            msg = '🏦 I just checked my *CIBIL Score* on Aishwaryamasthu!\n' +
                  (cScore ? 'My score: *' + cScore + '* — ' + cGrade + '\n' : '') +
                  (cSaved && cSaved !== '—' ? 'Potential interest saved by improving score: *' + cSaved + '*\n' : '') +
                  'Score 750+ can save ₹6L+ on a home loan 🏠\n' +
                  '\nCheck your CIBIL impact 👇';
        }

        else if (page === 'fincal') {
            var fcNext = document.getElementById('fc-next-title')?.textContent?.trim() || '';
            var fcCrit = document.getElementById('fc-count-critical')?.textContent?.trim() || '0';
            msg = '📅 I just checked my *Financial Calendar* on Aishwaryamasthu!\n' +
                  (parseInt(fcCrit) > 0 ? '🔴 ' + fcCrit + ' critical deadline(s) within 7 days!\n' : '') +
                  (fcNext ? 'Next deadline: *' + fcNext + '*\n' : '') +
                  'Advance tax · ITR · PPF · ELSS · SGB · EPF — all in one place\n' +
                  '\nNever miss a financial deadline again 👇';
        }

        else if (page === 'selfempl') {
            var seProfit = document.getElementById('se-res-profit')?.textContent?.trim() || '';
            var seTax    = document.getElementById('se-res-tax')?.textContent?.trim() || '';
            var seRate   = document.getElementById('se-res-effrate')?.textContent?.trim() || '';
            msg = '🧾 I just calculated my *Self-Employed Tax* on Aishwaryamasthu!\n' +
                  (seProfit ? 'Presumptive profit: *' + seProfit + '*\n' : '') +
                  (seTax    ? 'Tax + cess: *' + seTax + '*\n' : '') +
                  (seRate   ? 'Effective rate on turnover: *' + seRate + '*\n' : '') +
                  '44AD/44ADA presumptive tax · Business emergency fund · GST timing\n' +
                  '\nCalculate your self-employed tax 👇';
        }

        else if (page === 'goldcomp') {
            var gcWinner = document.getElementById('gc-winner-name')?.textContent?.trim() || '';
            var gcAmt    = document.getElementById('gc-amount')?.value || '';
            var gcYrs    = document.getElementById('gc-years')?.value || '5';
            msg = '🥇 I just compared *Gold Investment Options* on Aishwaryamasthu!\n' +
                  (gcAmt  ? 'Investment: ₹' + gcAmt + ' for ' + gcYrs + ' years\n' : '') +
                  (gcWinner ? '🏆 Best option: *' + gcWinner + '*\n' : '') +
                  '⚠️ Digital Gold (PhonePe/Paytm) = UNREGULATED — SEBI has flagged it!\n' +
                  'ETF vs Gold MF vs Physical Gold — full cost + tax comparison\n' +
                  '\nCheck before Akshaya Tritiya / Dhanteras 👇';
        }

        else if (page === 'ulipcheck') {
            var ucIrrVal  = document.getElementById('uc-irr')?.textContent?.trim() || '';
            var ucAdvVal  = document.getElementById('uc-advantage')?.textContent?.trim() || '';
            msg = '🔍 I just analysed my *LIC/ULIP policy* on Aishwaryamasthu!\n' +
                  (ucIrrVal ? 'My policy IRR: *' + ucIrrVal + '*\n' : '') +
                  (ucAdvVal ? 'BTID advantage: *' + ucAdvVal + '*\n' : '') +
                  'Should I surrender? IRR vs FD vs BTID — full analysis\n' +
                  '₹50,000/yr for ₹5L cover & 4% return — is your LIC worth it?\n' +
                  '\nCheck your policy 👇';
        }

        else if (page === 'fixedincome') {
            var fiTab = document.querySelector('.fi-tab-active')?.textContent?.trim() || 'FD';
            msg = '🏦 I just used *Fixed Income Tools* on Aishwaryamasthu!\n' +
                  'FD Calculator · SCSS · POMIS · NSC · KVP · FD vs ELSS comparison\n' +
                  'Smart tools for every Indian investor — not just SIP investors!\n\n' +
                  'Know your fixed income 👇';
        }
        else if (page === 'networth') {
            var nwVal = document.getElementById('nw-net-worth')?.textContent?.trim() || '';
            var nwAst = document.getElementById('nw-total-assets')?.textContent?.trim() || '';
            msg = '⚖️ I just calculated my *Net Worth* on Aishwaryamasthu!\n' +
                  (nwAst ? 'Total Assets: *' + nwAst + '*\n' : '') +
                  (nwVal ? 'Net Worth: *' + nwVal + '*\n' : '') +
                  'Assets vs Liabilities · Asset allocation · Debt ratio · Full financial snapshot\n' +
                  '\nKnow your number 👇';
        }

        else if (page === 'retirementhub') {
            var rhTotal   = document.getElementById('rh-total-corpus')?.textContent?.trim() || '';
            var rhIncome  = document.getElementById('rh-total-income')?.textContent?.trim() || '';
            var rhGap     = document.getElementById('rh-gap')?.textContent?.trim() || '';
            var rhRetAge  = document.getElementById('rh-ret-age-disp')?.textContent?.trim() || '';
            msg = '🏖️ I just mapped my *Retirement — all in one view* on Aishwaryamasthu!\n' +
                  (rhRetAge  ? 'Retirement ' + rhRetAge + '\n' : '') +
                  (rhTotal   ? 'Total corpus: *' + rhTotal + '*\n' : '') +
                  (rhIncome  ? 'Monthly income: *' + rhIncome + '*\n' : '') +
                  (rhGap     ? 'Surplus/Gap: *' + rhGap + '*\n' : '') +
                  'EPF + PPF + NPS + SIP — one number, one plan\n' +
                  '\nPlan your retirement 👇';
        }

        else if (page === 'hra') {
            var hraExempt  = _waFmt(document.getElementById('hra-exempt-mo'));
            var hraSaved   = _waFmt(document.getElementById('hra-tax-saved'));
            msg = '🏠 I calculated my *HRA Exemption* on Aishwaryamasthu!\n' +
                  'Monthly HRA exempt: *' + hraExempt + '*\n' +
                  'Annual tax saved: *' + hraSaved + '*\n' +
                  'Sec 10(13A) · Old Regime · Metro/Non-Metro\n' +
                  '\nCalculate yours 👇';
        }

        else if (page === 'nomtrack') {
            var ntScore = _waFmt(document.getElementById('nt-score-val'));
            var ntBadge = _waFmt(document.getElementById('nt-score-badge'));
            // Generate and download the nomination/Will PDF first
            if (typeof ntGeneratePdf === 'function') ntGeneratePdf();
            msg = '📜 I just shared my *Nomination & Will Declaration* — generated via Aishwaryamasthu!\n' +
                  'Estate Readiness Score: *' + ntScore + '* — ' + ntBadge + '\n' +
                  'I\'ve attached the PDF with my full nomination details & estate plan.\n' +
                  '~30% EPF accounts in India have NO nominee — is yours updated?\n' +
                  '\nCheck yours 👇';
        }

        if (!msg) {
            msg = '📊 Check out *Aishwaryamasthu* — India\'s best free financial planning tool!\n\n' +
                  'SIP calculator · Goal planner · EPF projector · SSA planner · Tax guide & more 👇';
        }

        var fullMsg = msg + '\n' + url;
        var waLink  = 'https://wa.me/?text=' + encodeURIComponent(fullMsg);
        window.open(waLink, '_blank') || (location.href = waLink);
    }



