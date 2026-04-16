// scripts/patch-panel-i18n.js
// Adds data-i18n attributes to all panel HTML files for comprehensive i18n coverage.

const fs   = require('fs');
const path = require('path');
const PANELS = path.join(__dirname, '../public/panels');

// Helper: add data-i18n to a label
function lbl(text, key) {
  return [
    `<label class="epf-label">${text}</label>`,
    `<label class="epf-label" data-i18n="${key}">${text}</label>`
  ];
}

// Helper: add data-i18n to a section header div (various class combos)
function sec(text, key, extraClass = '') {
  const base = extraClass
    ? `>${text}</div>`
    : `>${text}</div>`;
  return [`>${text}</div>`, ` data-i18n="${key}">${text}</div>`];
}

// Patches per file: array of [oldStr, newStr]
const PATCHES = {

  // ─── GLOBAL (applied to every panel) ────────────────────────────────────
  _global: [
    // Reset button text in all panels
    ['</svg>Reset\n                </button>', '</svg><span data-i18n="common.reset">Reset</span>\n                </button>'],
    // Quick Scenarios sections (multiple class variants)
    [' uppercase tracking-wider mb-1.5">Quick Scenarios</div>', ' uppercase tracking-wider mb-1.5" data-i18n="common.quickscen">Quick Scenarios</div>'],
    [' uppercase tracking-wider mb-1">Quick Scenarios</div>',   ' uppercase tracking-wider mb-1" data-i18n="common.quickscen">Quick Scenarios</div>'],
  ],

  // ─── insure.html ─────────────────────────────────────────────────────────
  'insure.html': [
    // Section headers
    [' mb-2">Your Profile</div>',                              ' mb-2" data-i18n="insure.sec.profile">Your Profile</div>'],
    [' mt-3 mb-1.5">Critical Illness · Disability · Parents</div>', ' mt-3 mb-1.5" data-i18n="insure.sec.advanced">Critical Illness · Disability · Parents</div>'],
    // Labels
    lbl('Annual Income (₹)',        'insure.lbl.income'),
    lbl('Age (yrs)',                'insure.lbl.age'),
    lbl('Dependents',              'insure.lbl.dependents'),
    lbl('Outstanding Loans (₹)',   'insure.lbl.loans'),
    lbl('Current Term Cover (₹)',  'insure.lbl.term_cover'),
    lbl('Current Health Cover (₹)','insure.lbl.health_cover'),
    lbl('Monthly Expenses (₹)',    'insure.lbl.monthly_exp'),
    lbl('Family Size (health)',    'insure.lbl.family_size'),
    lbl('Liquid Assets (₹)',       'insure.lbl.liquid_assets'),
    lbl('Current CI Cover (₹)',    'insure.lbl.ci_cover'),
    lbl('Disability Cover (₹)',    'insure.lbl.disability'),
    ["<label class=\"epf-label\">Parents' Health Cover (₹)</label>", "<label class=\"epf-label\" data-i18n=\"insure.lbl.parents_cover\">Parents' Health Cover (₹)</label>"],
    lbl('Parent 1 Age (yrs)',      'insure.lbl.parent1_age'),
    lbl('Parent 2 Age (yrs)',      'insure.lbl.parent2_age'),
    // Result card labels
    ['>Required Term Cover</div>',    ' data-i18n="res.insure.term_req">Required Term Cover</div>'],
    ['>Required Health Cover</div>',  ' data-i18n="res.insure.health_req">Required Health Cover</div>'],
    ['>Critical Illness</div>\n                            <div id="ins-ci-needed"', ' data-i18n="res.insure.ci">Critical Illness</div>\n                            <div id="ins-ci-needed"'],
    ['>Disability Cover</div>\n                            <div id="ins-disability-needed"', ' data-i18n="res.insure.disability">Disability Cover</div>\n                            <div id="ins-disability-needed"'],
    ['>Parents Health</div>',         ' data-i18n="res.insure.parents">Parents Health</div>'],
    ['>HLV Multiple</div>',           ' data-i18n="res.insure.hlv_mult">HLV Multiple</div>'],
    ['>Term Gap</div>',               ' data-i18n="res.insure.term_gap">Term Gap</div>'],
    ['>Health Gap</div>',             ' data-i18n="res.insure.health_gap">Health Gap</div>'],
    ['>Est. Term Premium</div>',      ' data-i18n="res.insure.term_prem">Est. Term Premium</div>'],
    ['>CI Gap</div>',                 ' data-i18n="res.insure.ci_gap">CI Gap</div>'],
    ['>Parents Premium</div>',        ' data-i18n="res.insure.parents_prem">Parents Premium</div>'],
    // Workings section headers
    ['>📐 How Your Term Cover Is Calculated</div>',  ' data-i18n="insure.work.term">📐 How Your Term Cover Is Calculated</div>'],
    ['>🏥 Health Cover Breakdown</div>',              ' data-i18n="insure.work.health">🏥 Health Cover Breakdown</div>'],
    ['>🎗️ Critical Illness + Disability</div>',       ' data-i18n="insure.work.ci">🎗️ Critical Illness + Disability</div>'],
    [">\u{1F474} Parents' Health Cover</div>",        " data-i18n=\"insure.work.parents\">\u{1F474} Parents' Health Cover</div>"],
    // Rules
    ['>📌 India Insurance Adequacy Rules (Post-COVID Baseline)</div>', ' data-i18n="insure.rules">📌 India Insurance Adequacy Rules (Post-COVID Baseline)</div>'],
  ],

  // ─── ppfnps.html ─────────────────────────────────────────────────────────
  'ppfnps.html': [
    // PPF section headers
    [' mb-2">PPF Inputs</div>',                        ' mb-2" data-i18n="ppf.sec.inputs">PPF Inputs</div>'],
    // PPF labels
    lbl('Annual Contribution (₹)',            'lbl.ppf.annual'),
    lbl('Current PPF Balance (₹)',            'lbl.ppf.balance'),
    lbl('Years Already Invested',             'lbl.ppf.years_done'),
    lbl('Interest Rate (%)',                  'lbl.ppf.rate'),
    lbl('Extension After 15 Yrs (blocks of 5)', 'lbl.ppf.extend'),
    // PPF result cards
    ['>Maturity Value</div>',    ' data-i18n="res.ppf.maturity">Maturity Value</div>'],
    ['>Total Interest</div>',    ' data-i18n="res.ppf.interest">Total Interest</div>'],
    ['>Total Invested</div>\n                            <div id="ppf-invested"', ' data-i18n="res.ppf.invested">Total Invested</div>\n                            <div id="ppf-invested"'],
    // PPF table + rules
    ['>📋 PPF Year-by-Year Passbook</div>', ' data-i18n="ppf.tbl.title">📋 PPF Year-by-Year Passbook</div>'],
    ['>📌 PPF Key Rules</div>',             ' data-i18n="ppf.rules">📌 PPF Key Rules</div>'],
    // NPS section
    [' mb-2">NPS Inputs</div>',                        ' mb-2" data-i18n="nps.sec.inputs">NPS Inputs</div>'],
    lbl('Monthly Contribution (₹)',           'lbl.nps.monthly'),
    lbl('Current Age (yrs)',                  'lbl.nps.age'),
    lbl('Current NPS Balance (₹)',            'lbl.nps.balance'),
    lbl('Expected Return (%/yr)',             'lbl.nps.return'),
    lbl('Annuity Rate (%/yr)',               'lbl.nps.annuity'),
    // NPS result cards
    ['>Total NPS Corpus</div>',  ' data-i18n="res.nps.corpus">Total NPS Corpus</div>'],
    ['>Tax-Free Lumpsum</div>',  ' data-i18n="res.nps.lumpsum">Tax-Free Lumpsum</div>'],
    ['>Monthly Pension</div>',   ' data-i18n="res.nps.pension">Monthly Pension</div>'],
    // NPS rules
    ['>📌 NPS Key Rules</div>',  ' data-i18n="nps.rules">📌 NPS Key Rules</div>'],
  ],

  // ─── ctcoptimizer.html ───────────────────────────────────────────────────
  'ctcoptimizer.html': [
    [' mb-2">Your CTC &amp; Structure</div>', ' mb-2" data-i18n="ctc.sec.structure">Your CTC &amp; Structure</div>'],
    lbl('Annual CTC (₹)',              'lbl.ctc.annual'),
    lbl('Basic Salary (₹/mo)',        'lbl.ctc.basic'),
    lbl('Tax Regime',                 'lbl.ctc.regime'),
    lbl('HRA (₹/mo)',                 'lbl.ctc.hra'),
    lbl('Monthly Rent Paid (₹)',      'lbl.ctc.rent'),
    lbl('City Type',                  'lbl.ctc.city'),
    lbl('Food Coupons (₹/mo)',        'lbl.ctc.food'),
    lbl('Phone/Internet (₹/mo)',      'lbl.ctc.phone'),
    lbl('Employer NPS (% of basic)',  'lbl.ctc.emp_nps'),
    lbl('80C Investments (₹/yr)',     'lbl.ctc.80c'),
    // Result cards
    ['>Current Monthly Take-Home</div>',    ' data-i18n="res.ctc.takehome">Current Monthly Take-Home</div>'],
    ['>Optimized Monthly Take-Home</div>',  ' data-i18n="res.ctc.optimized">Optimized Monthly Take-Home</div>'],
    ['>Annual Tax</div>',                   ' data-i18n="res.ctc.annual_tax">Annual Tax</div>'],
    ['>Tax After Opt.</div>',               ' data-i18n="res.ctc.tax_opt">Tax After Opt.</div>'],
    ['>Effective Tax Rate</div>',           ' data-i18n="res.ctc.eff_rate">Effective Tax Rate</div>'],
    ['>Monthly Tax Saved</div>',            ' data-i18n="res.ctc.monthly_saved">Monthly Tax Saved</div>'],
    // Sections
    ['>📋 Monthly Salary Breakup</div>',            ' data-i18n="ctc.breakup">📋 Monthly Salary Breakup</div>'],
    ['>🚀 Salary Optimization — How to Increase Take-Home Without a Raise</div>', ' data-i18n="ctc.optimization">🚀 Salary Optimization — How to Increase Take-Home Without a Raise</div>'],
    ['>⚖️ Old vs New Regime — Which Saves You More?</div>', ' data-i18n="ctc.regime_compare">⚖️ Old vs New Regime — Which Saves You More?</div>'],
  ],

  // ─── gratuity.html ───────────────────────────────────────────────────────
  'gratuity.html': [
    [' mb-2">Your Employment Details</div>', ' mb-2" data-i18n="gratuity.sec.details">Your Employment Details</div>'],
    lbl('Last Drawn Basic + DA Salary (₹/mo)', 'lbl.gratuity.basic'),
    lbl('Years of Service',                    'lbl.gratuity.years'),
    lbl('Extra Months',                        'lbl.gratuity.months'),
    lbl('Employer Type',                       'lbl.gratuity.type'),
    lbl('Tax Slab (on excess above ₹25L)',     'lbl.gratuity.slab'),
    // Result cards
    ['>Gross Gratuity</div>',        ' data-i18n="res.gratuity.gross">Gross Gratuity</div>'],
    ['>Tax-Free Amount</div>',       ' data-i18n="res.gratuity.taxfree">Tax-Free Amount</div>'],
    ['>Net In-Hand</div>',           ' data-i18n="res.gratuity.net">Net In-Hand</div>'],
    ['>Service Counted</div>',       ' data-i18n="res.gratuity.service">Service Counted</div>'],
    ['>Tax on Excess</div>',         ' data-i18n="res.gratuity.tax">Tax on Excess</div>'],
    ['>Per Year Value</div>',        ' data-i18n="res.gratuity.per_year">Per Year Value</div>'],
    ['>% of Annual CTC</div>',       ' data-i18n="res.gratuity.pct">% of Annual CTC</div>'],
    ['>📐 Calculation Workings</div>', ' data-i18n="gratuity.workings">📐 Calculation Workings</div>'],
    ['>📌 Gratuity Rules Every Employee Must Know</div>', ' data-i18n="gratuity.rules">📌 Gratuity Rules Every Employee Must Know</div>'],
  ],

  // ─── debtplan.html ───────────────────────────────────────────────────────
  'debtplan.html': [
    ['>Loan Name</div>',   ' data-i18n="debt.col.name">Loan Name</div>'],
    ['>Balance</div>',     ' data-i18n="debt.col.balance">Balance</div>'],
    ['>Rate%</div>',       ' data-i18n="debt.col.rate">Rate%</div>'],
    ['>EMI/mo</div>',      ' data-i18n="debt.col.emi">EMI/mo</div>'],
    lbl('Extra Monthly Prepayment (₹)', 'debt.lbl.extra'),
    // Result cards
    ['>Total Debt</div>',      ' data-i18n="res.debt.total">Total Debt</div>'],
    ['>Interest Saved</div>',  ' data-i18n="res.debt.saved">Interest Saved</div>'],
    ['>Debt-Free In</div>',    ' data-i18n="res.debt.free_in">Debt-Free In</div>'],
  ],

  // ─── jointplan.html ──────────────────────────────────────────────────────
  'jointplan.html': [
    // Section headers
    [' uppercase tracking-wider">Spouse / Partner 1</div>',  ' uppercase tracking-wider" data-i18n="joint.sec.p1">Spouse / Partner 1</div>'],
    [' uppercase tracking-wider">Spouse / Partner 2</div>',  ' uppercase tracking-wider" data-i18n="joint.sec.p2">Spouse / Partner 2</div>'],
    [' mb-0.5">Family Goals</div>',                           ' mb-0.5" data-i18n="joint.sec.goals">Family Goals</div>'],
    // Labels
    lbl('Name',                         'lbl.joint.name'),
    lbl('Monthly Gross Income (₹)',     'lbl.joint.income'),
    lbl('Monthly Investment Capacity (₹)', 'lbl.joint.invest_cap'),
    lbl('Equity MF Portfolio Value (₹)', 'lbl.joint.portfolio'),
    lbl("Today's Cost (₹)",             'lbl.joint.today_cost'),
    lbl('Years to Goal',                'lbl.joint.years_goal'),
    lbl('Target Amount (₹)',            'lbl.joint.target_amt'),
    lbl('Current Avg Age',              'lbl.joint.avg_age'),
    lbl('Monthly Need (₹)',             'lbl.joint.monthly_need'),
    lbl('Expected Return (% p.a.)',     'lbl.joint.return'),
    lbl('80C Already Used (₹/yr)',      'lbl.joint.80c'),
    // Result cards
    ['>Household Financial Summary</div>', ' data-i18n="res.joint.summary">Household Financial Summary</div>'],
    ['>🔑 LTCG Tax Optimization</div>',   ' data-i18n="res.joint.ltcg">🔑 LTCG Tax Optimization</div>'],
    ['>📊 Optimal Investment Split</div>', ' data-i18n="res.joint.split">📊 Optimal Investment Split</div>'],
  ],

  // ─── cibil.html ──────────────────────────────────────────────────────────
  'cibil.html': [
    [' mb-2">Your Credit Profile</div>', ' mb-2" data-i18n="cibil.sec.profile">Your Credit Profile</div>'],
    lbl('Current CIBIL / Credit Score',           'lbl.cibil.score'),
    lbl('Credit Utilisation (%)',                  'lbl.cibil.util'),
    lbl('Missed EMIs (last 2 yrs)',                'lbl.cibil.missed'),
    lbl('Credit Age (years)',                      'lbl.cibil.age'),
    lbl('Active Credit Cards',                     'lbl.cibil.cards'),
    lbl('Hard Enquiries (6 mo)',                   'lbl.cibil.enquiries'),
    lbl('Loan Amount Seeking (₹) — for EMI savings calc', 'lbl.cibil.loan_amt'),
    lbl('Loan Tenure (Years)',                     'lbl.cibil.loan_tenure'),
    // Result sections
    ['>Score Factor Analysis</div>',       ' data-i18n="cibil.sec.factors">Score Factor Analysis</div>'],
    [">🗓️ Your 90-Day Action Plan</div>",  " data-i18n=\"cibil.sec.action\">\u{1F5D3}️ Your 90-Day Action Plan</div>"],
    [">📚 What Moves Your Score</div>",    " data-i18n=\"cibil.sec.education\">\u{1F4DA} What Moves Your Score</div>"],
    [">🛡️ How to Dispute CIBIL Errors</div>", " data-i18n=\"cibil.sec.dispute\">\u{1F6E1}️ How to Dispute CIBIL Errors</div>"],
    ['>Total Interest Saved (Lifetime)</div>', ' data-i18n="res.cibil.total_saved">Total Interest Saved (Lifetime)</div>'],
    ['>📊 Score Band Impact — ₹50L Home Loan, 20 Years</div>', ' data-i18n="cibil.sec.table">📊 Score Band Impact — ₹50L Home Loan, 20 Years</div>'],
  ],

  // ─── fincal.html ─────────────────────────────────────────────────────────
  'fincal.html': [
    [' mb-2">Your Financial Profile</div>',       ' mb-2" data-i18n="fincal.sec.profile">Your Financial Profile</div>'],
    [' uppercase tracking-wider">All Events — Current Financial Year</div>', ' uppercase tracking-wider" data-i18n="fincal.sec.events">All Events — Current Financial Year</div>'],
    [' uppercase tracking-wider">Monthly Calendar View</div>',              ' uppercase tracking-wider" data-i18n="fincal.sec.calendar">Monthly Calendar View</div>'],
    lbl('Tax Regime',                         'lbl.fincal.regime'),
    lbl('Annual Income (₹)',                  'lbl.fincal.income'),
    lbl('Have PPF Account?',                  'lbl.fincal.ppf'),
    lbl('Have ELSS / Tax-saving MF?',         'lbl.fincal.elss'),
    lbl('EPF Member?',                        'lbl.fincal.epf'),
    lbl('Invest in SGB / Gold ETF?',          'lbl.fincal.sgb'),
  ],

  // ─── goldcomp.html ───────────────────────────────────────────────────────
  'goldcomp.html': [
    [' mb-2">Your Gold Investment Profile</div>',  ' mb-2" data-i18n="gold.sec.profile">Your Gold Investment Profile</div>'],
    lbl('Investment Amount (₹)',                'lbl.gold.amount'),
    lbl('Holding Period (Years)',              'lbl.gold.years'),
    lbl('Expected Gold Price Return (% p.a.)', 'lbl.gold.return'),
    lbl('Income Tax Slab',                     'lbl.gold.slab'),
    ["<label class=\"epf-label\">Physical Gold — Making Charges (%)</label>", "<label class=\"epf-label\" data-i18n=\"lbl.gold.making\">Physical Gold — Making Charges (%)</label>"],
    lbl('Locker Rent (₹/year)',                'lbl.gold.locker'),
    // Results
    [">🏆 Best Option for Your Profile</div>", " data-i18n=\"res.gold.winner\">\u{1F3C6} Best Option for Your Profile</div>"],
    [">📉 Physical Gold Hidden Cost Drag</div>", " data-i18n=\"gold.sec.phys\">\u{1F4C9} Physical Gold Hidden Cost Drag</div>"],
    // Warning
    ['>SEBI WARNING: Digital Gold (PhonePe / Paytm / Google Pay) is UNREGULATED</div>', ' data-i18n="gold.warning">SEBI WARNING: Digital Gold (PhonePe / Paytm / Google Pay) is UNREGULATED</div>'],
  ],

  // ─── networth.html ───────────────────────────────────────────────────────
  'networth.html': [
    // h2 header
    ['<h2 class="text-base font-black flex items-center gap-2">⚖️ Net Worth Tracker</h2>', '<h2 class="text-base font-black flex items-center gap-2" data-i18n="page.nw.h">⚖️ Net Worth Tracker</h2>'],
    // Asset section headers
    ['>💵 Liquid</div>',                 ' data-i18n="nw.sec.liquid">💵 Liquid</div>'],
    ['>📈 Equity</div>',                 ' data-i18n="nw.sec.equity">📈 Equity</div>'],
    [">🔒 Retirement &amp; Fixed Income</div>", " data-i18n=\"nw.sec.retirement\">\u{1F512} Retirement &amp; Fixed Income</div>"],
    ['>🏠 Real Estate</div>',            ' data-i18n="nw.sec.realestate">🏠 Real Estate</div>'],
    ['>🥇 Gold</div>',                   ' data-i18n="nw.sec.gold">🥇 Gold</div>'],
    ['>🔴 Liabilities — What You Owe</div>', ' data-i18n="nw.sec.liabilities">🔴 Liabilities — What You Owe</div>'],
    // Labels
    lbl('Savings / Bank (₹)',          'lbl.nw.savings'),
    lbl('Fixed Deposits (₹)',          'lbl.nw.fd'),
    lbl('Direct Stocks (₹)',           'lbl.nw.stocks'),
    lbl('Equity Mutual Funds (₹)',     'lbl.nw.eq_mf'),
    lbl('EPF Balance (₹)',             'lbl.nw.epf'),
    lbl('PPF Balance (₹)',             'lbl.nw.ppf'),
    lbl('NPS Balance (₹)',             'lbl.nw.nps'),
    lbl('Debt Mutual Funds (₹)',       'lbl.nw.debt_mf'),
    lbl('Primary Home Value (₹)',      'lbl.nw.home'),
    lbl('Other Property (₹)',          'lbl.nw.property'),
    lbl('Physical Gold (₹)',           'lbl.nw.gold_phys'),
    lbl('Digital Gold / SGB / ETF (₹)', 'lbl.nw.gold_paper'),
    lbl('Home Loan Outstanding (₹)',   'lbl.nw.home_loan'),
    lbl('Car Loan (₹)',                'lbl.nw.car_loan'),
    lbl('Personal Loan (₹)',           'lbl.nw.pl'),
    lbl('Education Loan (₹)',          'lbl.nw.edu_loan'),
    lbl('Credit Card Outstanding (₹)', 'lbl.nw.cc'),
    lbl('Other Loans (₹)',             'lbl.nw.other_loans'),
    lbl('Cryptocurrency (₹)',          'lbl.nw.crypto'),
    lbl('ULIP / Endowment SV (₹)',     'lbl.nw.ulip_sv'),
    lbl('Vehicles (₹)',                'lbl.nw.vehicles'),
  ],

  // ─── ulipcheck.html ──────────────────────────────────────────────────────
  'ulipcheck.html': [
    // h2 header
    ['<h2 class="text-base font-black flex items-center gap-2">🔍 ULIP / Endowment Policy Analyzer</h2>', '<h2 class="text-base font-black flex items-center gap-2" data-i18n="page.ulip.h">🔍 ULIP / Endowment Policy Analyzer</h2>'],
    [' mb-2">Your Policy Details</div>', ' mb-2" data-i18n="ulip.sec.policy">Your Policy Details</div>'],
    lbl('Annual Premium (₹)',     'lbl.ulip.premium'),
    lbl('Policy Term (years)',   'lbl.ulip.term'),
    lbl('Years Paid So Far',     'lbl.ulip.paid'),
    lbl('Maturity Value (₹)',    'lbl.ulip.maturity'),
    // Results
    ['>Policy IRR</div>',         ' data-i18n="res.ulip.irr">Policy IRR</div>'],
    ['>BTID Advantage</div>',     ' data-i18n="res.ulip.advantage">BTID Advantage</div>'],
    ['>BTID Value</div>',         ' data-i18n="res.ulip.btid">BTID Value</div>'],
  ],

  // ─── coffeecan.html ──────────────────────────────────────────────────────
  'coffeecan.html': [
    [' data-i18n="page.coffeecan.h"', ' data-i18n="page.coffeecan.h"'], // already has it, skip
  ],

  // ─── epfcalc.html ────────────────────────────────────────────────────────
  // Already has many data-i18n from prior work; just add a few remaining
  'epfcalc.html': [
    [' mb-2">Your EPF Details</div>', ' mb-2" data-i18n="ssh.epfdetails">Your EPF Details</div>'],
  ],
};

// ── Apply patches ────────────────────────────────────────────────────────────
let totalPatched = 0;

for (const [filename, rawPatches] of Object.entries(PATCHES)) {
  if (filename === '_global') continue; // handled separately below
  const fpath = path.join(PANELS, filename);
  if (!fs.existsSync(fpath)) { console.warn(`SKIP (not found): ${filename}`); continue; }

  let src = fs.readFileSync(fpath, 'utf8');
  const orig = src;
  let count = 0;

  // Apply global patches first
  for (const [oldStr, newStr] of PATCHES._global) {
    if (src.includes(oldStr)) {
      src = src.split(oldStr).join(newStr);
      count++;
    }
  }

  // Apply file-specific patches
  for (const [oldStr, newStr] of rawPatches) {
    if (oldStr === newStr) continue; // skip no-ops
    if (src.includes(oldStr)) {
      src = src.split(oldStr).join(newStr);
      count++;
    }
  }

  if (src !== orig) {
    fs.writeFileSync(fpath, src, 'utf8');
    console.log(`✅ ${filename} — ${count} replacements`);
    totalPatched++;
  } else {
    console.log(`⚪ ${filename} — no changes`);
  }
}

console.log(`\nDone — ${totalPatched} files patched.`);
