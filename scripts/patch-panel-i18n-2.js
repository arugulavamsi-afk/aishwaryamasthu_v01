// scripts/patch-panel-i18n-2.js — selfempl, fixedincome, plus missed items

const fs   = require('fs');
const path = require('path');
const PANELS = path.join(__dirname, '../public/panels');

function lbl(text, key) {
  return [
    `<label class="epf-label">${text}</label>`,
    `<label class="epf-label" data-i18n="${key}">${text}</label>`
  ];
}

const GLOBAL = [
  ['</svg>Reset\n                </button>', '</svg><span data-i18n="common.reset">Reset</span>\n                </button>'],
];

const PATCHES = {
  'selfempl.html': [
    [' mb-2">Your Business Profile</div>',  ' mb-2" data-i18n="selfempl.sec.profile">Your Business Profile</div>'],
    // Tab buttons
    ['>🧾 Presumptive Tax</button>',    ' data-i18n="selfempl.tab.tax">🧾 Presumptive Tax</button>'],
    ['>🛡️ Business Emergency Fund</button>', ' data-i18n="selfempl.tab.bef">🛡️ Business Emergency Fund</button>'],
    ['>📊 GST Cash-Flow</button>',      ' data-i18n="selfempl.tab.gst">📊 GST Cash-Flow</button>'],
    ['>📅 Advance Tax Planner</button>', ' data-i18n="selfempl.tab.adv">📅 Advance Tax Planner</button>'],
    // Labels
    lbl('Business Type',                              'lbl.selfempl.type'),
    lbl('Annual Turnover / Gross Receipts (₹)',        'lbl.selfempl.turnover'),
    lbl('Actual Annual Profit (₹)',                    'lbl.selfempl.profit'),
    lbl('Tax Regime',                                 'lbl.selfempl.regime'),
    lbl('Other Income (Salary/Interest) (₹/yr)',       'lbl.selfempl.other'),
    lbl('80C Investments (₹/yr)',                      'lbl.selfempl.80c'),
    lbl('NPS Contribution (₹/yr)',                     'lbl.selfempl.nps'),
  ],

  'fixedincome.html': [
    // h2 header
    ['<h2 class="text-base font-black flex items-center gap-2">🏦 Fixed Income Tools</h2>', '<h2 class="text-base font-black flex items-center gap-2" data-i18n="page.fi.h">🏦 Fixed Income Tools</h2>'],
    // Tab buttons
    ['>📊 FD Calculator</button>',  ' data-i18n="fi.tab.fd">📊 FD Calculator</button>'],
    ['>👴 SCSS &amp; POMIS</button>',  ' data-i18n="fi.tab.scss">👴 SCSS &amp; POMIS</button>'],
    ['>📮 NSC &amp; KVP</button>',    ' data-i18n="fi.tab.nsc">📮 NSC &amp; KVP</button>'],
    ['>⚖️ FD vs ELSS</button>',     ' data-i18n="fi.tab.elss">⚖️ FD vs ELSS</button>'],
    // Section headers
    [' mb-2">FD Details</div>',      ' mb-2" data-i18n="fi.sec.fd">FD Details</div>'],
    // Labels
    lbl('Principal (₹)',    'lbl.fi.principal'),
    lbl('Rate (% p.a.)',    'lbl.fi.rate'),
    lbl('Tenure (months)',  'lbl.fi.tenure'),
    lbl('Type',             'lbl.fi.type'),
    lbl('Tax Regime',       'lbl.fi.regime'),
    lbl('Your Tax Slab',    'lbl.fi.slab'),
  ],

  // Also patch Tax Regime labels missed in prior run (panels that have it)
  'ctcoptimizer.html': [
    lbl('LTA (₹/yr)', 'lbl.ctc.lta'),
    lbl('Tax Regime', 'lbl.ctc.regime'),
  ],
  'gratuity.html': [
    lbl('Tax Regime', 'lbl.gratuity.regime'),
  ],
  'ppfnps.html': [
    lbl('Tax Regime', 'lbl.nps.regime'),
    lbl('Your Tax Slab', 'lbl.nps.slab'),
  ],
  'goldcomp.html': [
    lbl('Tax Regime', 'lbl.gold.regime'),
  ],
  'jointplan.html': [
    lbl('Tax Regime (P1)', 'lbl.joint.regime'),
    lbl('Tax Regime (P2)', 'lbl.joint.regime'),
    lbl('Tax Slab (P1)',   'lbl.joint.slab'),
    lbl('Tax Slab (P2)',   'lbl.joint.slab'),
  ],
  'ulipcheck.html': [
    lbl('Current Surrender Value (₹)',    'lbl.ulip.sv'),
    lbl('Sum Assured (₹)',                'lbl.ulip.cover'),
    lbl('Current Age (yrs)',              'lbl.ulip.age'),
    lbl('Expected Investment Return (%)', 'lbl.ulip.inv_return'),
    lbl('Tax Slab',                       'lbl.ulip.slab'),
  ],

  // networth.html: missed asset sub-sections
  'networth.html': [
    ['>ASSETS — What You Own</div>',    ' data-i18n="nw.sec.assets">ASSETS — What You Own</div>'],
    ['>LIABILITIES — What You Owe</div>', ' data-i18n="nw.sec.liabilities">LIABILITIES — What You Owe</div>'],
  ],
};

let totalPatched = 0;
for (const [filename, patches] of Object.entries(PATCHES)) {
  const fpath = path.join(PANELS, filename);
  if (!fs.existsSync(fpath)) { console.warn(`SKIP: ${filename}`); continue; }

  let src = fs.readFileSync(fpath, 'utf8');
  const orig = src;
  let count = 0;

  for (const [oldStr, newStr] of GLOBAL) {
    if (src.includes(oldStr)) { src = src.split(oldStr).join(newStr); count++; }
  }
  for (const [oldStr, newStr] of patches) {
    if (oldStr === newStr) continue;
    if (src.includes(oldStr)) { src = src.split(oldStr).join(newStr); count++; }
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
