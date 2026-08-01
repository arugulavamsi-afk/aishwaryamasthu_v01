/**
 * compute-mf-scores.js
 * Nightly script — fetches all fund NAV histories from mfapi.in,
 * computes Alpha/Beta/Sharpe/Sortino/CAGR/Stars for every fund,
 * and writes a single mf-data.json file to ./output/
 *
 * Run:  node scripts/compute-mf-scores.js
 * Needs: Node 18+ (native fetch)
 */

'use strict';

const fs   = require('fs');
const path = require('path');
const MFScoring = require('../public/mf-scoring-core.js'); // shared with the app

/* ── Config ─────────────────────────────────────────────── */
const OUT_DIR  = path.join(__dirname, '..', 'public');  // served directly by Firebase hosting
const OUT_FILE = path.join(OUT_DIR, 'mf-data.json');
/* Optional real TER data: { "<schemeCode>": <ter %>, ... }
   AMFI's TER page (amfiindia.com/ter-of-mf-schemes) is client-rendered with
   no stable public API — export its table to this file manually (or via a
   separate scraper) whenever you want per-fund TER in the app. Absent file
   = app falls back to category-median estimates marked "~". */
const TER_FILE = path.join(__dirname, 'ter-data.json');
const FETCH_TIMEOUT_MS  = 20_000;
const BATCH_SIZE        = 15;   // concurrent fetches per batch
const RETRY_ATTEMPTS    = 3;
const RETRY_DELAY_MS    = 1_500;

/* ── Benchmark codes (mirrors MFE_CAT_BENCH in app) ───────
   ALL codes verified live against api.mfapi.in/{code}/latest on
   2026-08-01. The previous table pointed at wrong/dead schemes
   (e.g. 136094 = HDFC Retirement EQUITY plan used for all debt,
   148942 = a matured SBI FMP used as "Nifty 500"). Re-verify any
   code before changing.                                          */
const CAT_BENCH_CODE = {
  'Large Cap':            '147666', // Axis Nifty 100 Index Direct Growth ✓
  'Large & Mid Cap':      '147625', // Motilal Nifty 500 Index Direct ✓
  'Mid Cap':              '147622', // Motilal Nifty Midcap 150 Index Direct ✓
  'Small Cap':            '147623', // Motilal Nifty Smallcap 250 Index Direct ✓
  'Multi Cap':            '147625', // Motilal Nifty 500 Index Direct ✓
  'Flexi Cap':            '147625', // Motilal Nifty 500 Index Direct ✓
  'Focused':              '147625', // Motilal Nifty 500 Index Direct ✓
  'Value/Contra':         '147625', // Motilal Nifty 500 Index Direct ✓
  'ELSS':                 '147625', // Motilal Nifty 500 Index Direct ✓
  'Index':                '120716', // UTI Nifty 50 Index Direct ✓
  'Aggressive Hybrid':    '120377', // ICICI Pru Balanced Advantage Direct Growth ✓
  'Conservative Hybrid':  '148800', // Nippon Nifty 5yr G-Sec ETF ✓ (debt-heavy proxy)
  'Balanced Advantage':   '120377', // ICICI Pru Balanced Advantage Direct Growth ✓
  'Multi Asset':          '120377', // ICICI Pru Balanced Advantage Direct Growth ✓
  'Hybrid':               '120377', // ICICI Pru Balanced Advantage Direct Growth ✓
  'Liquid':               '119833', // SBI Overnight Direct Growth ✓
  'Overnight':            '119833', // SBI Overnight Direct Growth ✓
  'Ultra Short':          '119833', // SBI Overnight Direct Growth ✓ (duration proxy)
  'Money Market':         '119833', // SBI Overnight Direct Growth ✓ (duration proxy)
  'Short Duration':       '148800', // Nippon Nifty 5yr G-Sec ETF ✓ (duration proxy)
  'Medium Duration':      '148800', // Nippon Nifty 5yr G-Sec ETF ✓
  'Corporate Bond':       '148800', // Nippon Nifty 5yr G-Sec ETF ✓ (no credit-spread index avail.)
  'Banking & PSU Debt':   '148800', // Nippon Nifty 5yr G-Sec ETF ✓
  'Gilt':                 '133307', // LIC Nifty 8-13yr G-Sec ETF ✓ (long-duration match)
  'Dynamic Bond':         '148800', // Nippon Nifty 5yr G-Sec ETF ✓
  'Debt':                 '148800', // Nippon Nifty 5yr G-Sec ETF ✓
  'Arbitrage':            '119833', // SBI Overnight Direct Growth ✓ (arbitrage ≈ repo)
  'Sectoral':             '147625', // Motilal Nifty 500 Index Direct ✓ (sub-sector codes override)
  'International':        '148381', // Motilal S&P 500 Index Direct Growth ✓
  'Commodity':            '118663', // Nippon Gold Savings Direct Growth ✓
  'Solution':             '147625', // Motilal Nifty 500 Index Direct ✓
  'FoF':                  '120716', // UTI Nifty 50 Index Direct ✓
  '_default':             '120716', // UTI Nifty 50 Index Direct ✓
};

/* ── Helpers ─────────────────────────────────────────────── */
const sleep = ms => new Promise(r => setTimeout(r, ms));

// Browser-like headers — prevents mfapi.in from rejecting cloud-runner requests
const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept':     'application/json, text/plain, */*',
  'Accept-Language': 'en-IN,en;q=0.9',
  'Referer':    'https://www.mfapi.in/',
};

async function fetchWithRetry(url, attempt = 1) {
  try {
    const res = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    if (attempt < RETRY_ATTEMPTS) {
      await sleep(RETRY_DELAY_MS * attempt);
      return fetchWithRetry(url, attempt + 1);
    }
    return null;
  }
}

// Fallback fund list from AMFI's official government server (never blocks cloud IPs).
// Returns same shape as mfapi.in /mf, plus amfiNav/amfiNavDate as a bonus.
async function fetchFundListFromAMFI() {
  const res = await fetch('https://www.amfiindia.com/spages/NAVAll.txt', {
    headers: { 'User-Agent': HEADERS['User-Agent'], 'Accept': 'text/plain' },
    signal:  AbortSignal.timeout(30_000),
  });
  if (!res.ok) throw new Error(`AMFI HTTP ${res.status}`);
  const text  = await res.text();
  const funds = [];
  for (const line of text.split('\n')) {
    const parts = line.trim().split(';');
    if (parts.length < 6) continue;
    const code = parseInt(parts[0], 10);
    if (isNaN(code)) continue;
    const name = parts[3]?.trim();
    if (!name) continue;
    const nav  = parseFloat(parts[4]);
    const date = parts[5]?.trim() || null;
    funds.push({ schemeCode: code, schemeName: name,
                 amfiNav: isNaN(nav) ? null : nav, amfiNavDate: date });
  }
  return funds;
}

/* NAV series with dates — required for date-aligned metrics */
function navSeries(data) {
  return MFScoring.toSeries(data); // { dates:[ms], navs:[num] }, chronological
}

async function batchMap(items, asyncFn, batchSize = BATCH_SIZE) {
  const results = [];
  for (let i = 0; i < items.length; i += batchSize) {
    const chunk = items.slice(i, i + batchSize);
    const batch = await Promise.allSettled(chunk.map(asyncFn));
    results.push(...batch.map(r => r.status === 'fulfilled' ? r.value : null));
    process.stdout.write(`\r  ${Math.min(i + batchSize, items.length)}/${items.length}`);
  }
  process.stdout.write('\n');
  return results;
}

/* ── Category / AMC parsers (identical to app) ──────────── */
function parseCat(n) {
  const nl = n.toLowerCase();
  if (/elss|tax.?sav/.test(nl))                                    return 'ELSS';
  if (/aggressive.?hybrid/.test(nl))                               return 'Aggressive Hybrid';
  if (/conservative.?hybrid/.test(nl))                             return 'Conservative Hybrid';
  if (/balanced.?advantage|dynamic.?asset.?alloc/.test(nl))        return 'Balanced Advantage';
  if (/multi.?asset/.test(nl))                                     return 'Multi Asset';
  if (/hybrid|balanced|equity.?saving/.test(nl))                   return 'Hybrid';
  if (/arbitrage/.test(nl))                                        return 'Arbitrage';
  if (/gold|silver|commodity|metal/.test(nl))                      return 'Commodity';
  if (/international|global|overseas|nasdaq|s&p 500|nyse|ftse|hang.?seng/.test(nl)) return 'International';
  if (/retirement|children.?gift|solution/.test(nl))               return 'Solution';
  if (/overnight/.test(nl))                                        return 'Overnight';
  if (/liquid/.test(nl))                                           return 'Liquid';
  if (/ultra.?short|low.?duration/.test(nl))                       return 'Ultra Short';
  if (/money.?market/.test(nl))                                    return 'Money Market';
  if (/short.?dur/.test(nl))                                       return 'Short Duration';
  if (/medium.?dur|medium.?long|long.?dur/.test(nl))               return 'Medium Duration';
  if (/corporate.?bond/.test(nl))                                  return 'Corporate Bond';
  if (/banking.?psu|psu.?bond/.test(nl))                          return 'Banking & PSU Debt';
  if (/gilt|g.?sec|gsec|state.?dev|sdl/.test(nl))                 return 'Gilt';
  if (/dynamic.?bond/.test(nl))                                    return 'Dynamic Bond';
  if (/debt|bond|credit.?risk|income|duration|floating|crisil|ibx|nbfc|aaa.*fund|financial.?serv.*debt|target.?matur|htm|bharat.?bond/.test(nl)) return 'Debt';
  if (/large.?&.?mid|large.*mid.*cap|largemid/.test(nl))          return 'Large & Mid Cap';
  if (/large.?cap|bluechip|blue.?chip/.test(nl))                  return 'Large Cap';
  if (/mid.?cap/.test(nl))                                         return 'Mid Cap';
  if (/small.?cap/.test(nl))                                       return 'Small Cap';
  if (/multi.?cap/.test(nl))                                       return 'Multi Cap';
  if (/flexi.?cap/.test(nl))                                       return 'Flexi Cap';
  if (/focused/.test(nl))                                          return 'Focused';
  if (/value|contra|dividend.?yield/.test(nl))                     return 'Value/Contra';
  if (/sector|thematic|pharma|health|technolog|infra|fmcg|energy|auto|realty|defence|manufactur|consumption|consumer|housing|media|tourism|transport|mnc/.test(nl)) return 'Sectoral';
  if (/index|nifty|sensex/.test(nl))                              return 'Index';
  if (/fund.?of.?fund|fof/.test(nl))                              return 'FoF';
  return 'Other';
}

function parseAMC(n) {
  const amcs = ['SBI','HDFC','ICICI Prudential','Axis','Kotak','Mirae Asset','Nippon India',
    'UTI','DSP','Franklin Templeton','Tata','Aditya Birla Sun Life','ABSL','Canara Robeco',
    'Parag Parikh','PPFAS','Edelweiss','Motilal Oswal','Quant','Invesco','IDFC','Bandhan',
    'Baroda BNP Paribas','Sundaram','PGIM','Mahindra Manulife','WhiteOak','Bajaj Finserv',
    '360 One','JM Financial','LIC','Navi','Samco','Quantum','NJ'];
  for (const a of amcs) if (n.toLowerCase().includes(a.toLowerCase())) return a;
  return n.split(' ').slice(0, 3).join(' ');
}

function parseSubSect(n) {
  const nl = n.toLowerCase();
  if (/banking.*psu|psu.*bond|psu.*debt/.test(nl))                           return 'Thematic';
  if (/pharma|healthcare|health.?care|medic|hospital|life.?science/.test(nl)) return 'Pharma & Healthcare';
  if (/technology|information.?tech|nifty.?it|software|digital.?india/.test(nl)) return 'Technology';
  if (/fmcg|fast.?moving|consumption|consumer/.test(nl))                     return 'FMCG & Consumption';
  if (/transport|logistics|mobility/.test(nl))                               return 'Transport & Logistics';
  if (/commodit|natural.?resource|metals|mining|precious.?metal/.test(nl))   return 'Commodities & Resources';
  if (/energy|power.?infra|power.?&.?infra|new.?energy|clean.?energy/.test(nl)) return 'Energy & Power';
  if (/\bpower\b|utilities/.test(nl))                                        return 'Energy & Power';
  if (/manufactur|capital.?goods|engineering/.test(nl))                      return 'Manufacturing';
  if (/infra/.test(nl))                                                      return 'Infrastructure';
  if (/automobile|automotive|auto.?fund|auto.?sector|auto.?opportun|nifty.?auto/.test(nl)) return 'Auto';
  if (/realty|real.?estate|housing/.test(nl))                               return 'Realty';
  if (/defence|defense/.test(nl))                                           return 'Defence & Aerospace';
  if (/\bpsu\b|public.?sector.?(?:enterprise|equity|unit)|bharat.?22/.test(nl)) return 'PSU';
  if (/\bmnc\b|multinational/.test(nl))                                     return 'MNC';
  if (/\besg\b|sustainability|responsible.?invest/.test(nl))                return 'ESG';
  if (/banking.?financ|banking.?serv|financial.?service|nifty.?bank/.test(nl)) return 'Banking & Finance';
  if (/\bbank\b/.test(nl) && /fund|sector|etf|bees|index|opportun/.test(nl)) return 'Banking & Finance';
  return 'Thematic';
}

/* ── Math — lives in public/mf-scoring-core.js (shared with app) ── */
const compute      = (fundSeries, benchSeries) => MFScoring.compute(fundSeries, benchSeries);
const normaliseCat = funds =>
  MFScoring.normaliseCat(funds.map(f => ({ cat: f.cat, metrics: f.metrics })));

/* ── Main ─────────────────────────────────────────────────── */
async function main() {
  console.log('=== MF Score Builder ===');
  console.log(`Started: ${new Date().toISOString()}\n`);

  if (!fs.existsSync(OUT_DIR)) { console.error('FATAL: public/ directory not found at', OUT_DIR); process.exit(1); }

  /* Step 1: Fetch full fund list (mfapi.in → AMFI fallback) */
  console.log('Step 1: Fetching fund list...');
  let listData  = await fetchWithRetry('https://api.mfapi.in/mf');
  let amfiNavMap = null; // populated when AMFI fallback is used

  if (!listData) {
    console.log('  mfapi.in unreachable — falling back to AMFI NAVAll.txt...');
    try {
      const amfiList = await fetchFundListFromAMFI();
      listData   = amfiList;
      amfiNavMap = {};
      amfiList.forEach(f => {
        if (f.amfiNav !== null) amfiNavMap[String(f.schemeCode)] = { nav: f.amfiNav, date: f.amfiNavDate };
      });
      console.log(`  AMFI fallback: ${listData.length} schemes`);
    } catch (err) {
      console.error('FATAL: Could not fetch fund list from mfapi.in or AMFI:', err.message);
      process.exit(1);
    }
  } else {
    console.log(`  mfapi.in: ${listData.length} schemes`);
  }

  const EXCLUDE = new RegExp([
    'segregated','idcw','dividend','weekly dividend','monthly dividend',
    'quarterly dividend','annual dividend','bonus option','fixed maturity','fmp',
    'interval fund','capital protection','maturity plan','etf(?!.*fof)',
    'exchange traded','of funds.*of funds','institutional','tier[\\s\\-]*[12]',
    'class[\\s\\-]*[ab]','regular','super institutional','pension plan','pension fund',
    'pf (?:equity|debt)','epf ','\\bgratuity\\b','staff ','employees? fund',
    'trustee','\\bnro\\b','\\bnre\\b','foreign currency','sr\\. citizen',
    'senior citizen','minor ','\\(g\\)$','unclaimed',
  ].join('|'), 'i');

  const raw = listData.filter(f => /direct/i.test(f.schemeName) && !EXCLUDE.test(f.schemeName));

  // De-duplicate: prefer Growth variant
  const growthMap = new Map();
  raw.forEach(f => {
    const base = f.schemeName
      .replace(/[-\s]*(growth option|growth plan|growth|direct plan|direct)[\s\-]*/gi, '')
      .replace(/\s+/g, ' ').trim().toLowerCase();
    const existing = growthMap.get(base);
    if (!existing || /growth/i.test(f.schemeName)) growthMap.set(base, f);
  });

  const funds = Array.from(growthMap.values()).map(f => {
    const preNav = amfiNavMap?.[String(f.schemeCode)];
    return {
      code:    String(f.schemeCode),
      name:    f.schemeName,
      amc:     parseAMC(f.schemeName),
      cat:     parseCat(f.schemeName),
      subSect: parseSubSect(f.schemeName),
      nav:     preNav?.nav    ?? null, // pre-populated from AMFI when available
      navDate: preNav?.date   ?? null,
      metrics: null,
    };
  });
  console.log(`  Found ${funds.length} eligible funds\n`);

  /* Step 2: Fetch benchmarks */
  console.log('Step 2: Fetching benchmark NAV histories...');
  const uniqueCodes = [...new Set(Object.values(CAT_BENCH_CODE))];
  const benchCache  = {};
  for (const code of uniqueCodes) {
    process.stdout.write(`  Benchmark ${code}...`);
    const data = await fetchWithRetry(`https://api.mfapi.in/mf/${code}`);
    const ser  = navSeries(data);
    if (ser.navs.length > 30) {
      benchCache[code] = ser;
      process.stdout.write(` ${ser.navs.length} data points\n`);
    } else {
      process.stdout.write(` FAILED\n`);
    }
  }
  const defaultBench = benchCache['120716'] || { dates: [], navs: [] };
  const getBench = cat => benchCache[CAT_BENCH_CODE[cat]] || benchCache[CAT_BENCH_CODE['_default']] || defaultBench;
  console.log();

  /* Step 3: Fetch full NAV history per fund and compute metrics */
  console.log('Step 3: Fetching NAV histories and computing metrics...');
  await batchMap(funds, async f => {
    const data = await fetchWithRetry(`https://api.mfapi.in/mf/${f.code}`);
    if (!data) return;

    // Refine category from API meta (more accurate than name parsing for most categories).
    // Guard: don't let meta override to 'Index' if name parsing already gave a specific
    // category. AMFI lumps ALL index-tracking funds (sectoral, midcap, international, debt)
    // into "Other Scheme - Index Funds", which is too coarse. Only assign 'Index' via meta
    // when the name parser returned 'Other' (unclassified). For every other category, trust
    // the name-based parse (e.g. Auto Index → Sectoral, Midcap 50 → Mid Cap, S&P 500 → International).
    const metaCat = catFromMeta(data?.meta?.scheme_category);
    if (metaCat && !(metaCat === 'Index' && f.cat !== 'Other')) {
      f.cat = metaCat;
    }

    const ser = navSeries(data);
    if (!ser.navs.length) return;

    // Latest NAV
    const latest = data.data?.[0];
    if (latest) { f.nav = parseFloat(latest.nav); f.navDate = latest.date; }

    // Compute metrics (date-aligned against category benchmark)
    const bench = getBench(f.cat);
    f.metrics   = bench.navs.length > 30 ? compute(ser, bench) : null;
  });

  /* Step 3B: NAV fallback — funds that had no data in Step 3 get nav from /latest */
  const navMissing = funds.filter(f => f.nav === null);
  if (navMissing.length > 0) {
    console.log(`Step 3B: ${navMissing.length} funds missing nav — fetching /latest fallback...`);
    await batchMap(navMissing, async f => {
      const data = await fetchWithRetry(`https://api.mfapi.in/mf/${f.code}/latest`);
      if (!data || !Array.isArray(data) || !data[0]) return;
      const nav = parseFloat(data[0].nav);
      if (!isNaN(nav) && nav > 0) { f.nav = nav; f.navDate = data[0].date; }
      // f.metrics stays null — no history available, so no risk metrics possible
    });
    const stillMissing = funds.filter(f => f.nav === null);
    console.log(`  Recovered: ${navMissing.length - stillMissing.length}  |  Still missing: ${stillMissing.length}`);
    if (stillMissing.length > 0) {
      stillMissing.forEach(f => console.log(`    [${f.cat}] ${f.name} (${f.code})`));
    }
  }
  console.log();

  /* Step 4: Score within each category */
  console.log('Step 4: Normalising scores per category...');
  const cats = [...new Set(funds.map(f => f.cat))];
  cats.forEach(cat => {
    const catFunds = funds.filter(f => f.cat === cat);
    normaliseCat(catFunds);
    const scored = catFunds.filter(f => f.metrics?.stars).length;
    console.log(`  ${cat}: ${catFunds.length} funds, ${scored} scored`);
  });
  console.log();

  /* Step 4B: Attach real TER where available */
  let terMap = {};
  try {
    if (fs.existsSync(TER_FILE)) {
      terMap = JSON.parse(fs.readFileSync(TER_FILE, 'utf8'));
      console.log(`TER data: ${Object.keys(terMap).length} schemes from ter-data.json`);
    }
  } catch (e) { console.warn('TER data unreadable — skipping:', e.message); }
  funds.forEach(f => {
    const t = parseFloat(terMap[f.code]);
    f.ter = isFinite(t) && t > 0 && t < 3 ? +t.toFixed(2) : null;
  });

  /* Step 5: Write output */
  const out = {
    generated:  new Date().toISOString(),
    fundCount:  funds.length,
    categories: {},
    caveats:    {},   // cat → ['sector-fad'|'debt-credit'|'small-peers']
  };

  cats.forEach(cat => {
    const catFunds = funds.filter(f => f.cat === cat && f.nav !== null);
    out.categories[cat] = catFunds.map(f => ({
      code:    f.code,
      name:    f.name,
      amc:     f.amc,
      subSect: f.subSect,
      nav:     f.nav,
      navDate: f.navDate,
      ter:     f.ter,   // real TER % or null (app falls back to category median)
      metrics: f.metrics,
    }));
    const ratedCount = catFunds.filter(f => f.metrics?.stars).length;
    const cavs = MFScoring.categoryCaveats(cat, ratedCount);
    if (cavs.length) out.caveats[cat] = cavs;
  });

  fs.writeFileSync(OUT_FILE, JSON.stringify(out));
  const kb = Math.round(fs.statSync(OUT_FILE).size / 1024);
  console.log(`Output: ${OUT_FILE} (${kb} KB)`);
  console.log(`Done: ${new Date().toISOString()}`);
}

/* mfeCatFromMeta — identical to app */
function catFromMeta(c) {
  if (!c) return null;
  const cl = c.toLowerCase();
  if (/elss|tax.?sav/.test(cl))                                        return 'ELSS';
  if (/large.?&?.?mid|largemid|large.*mid.*cap/.test(cl))              return 'Large & Mid Cap';
  if (/large.?cap/.test(cl))                                           return 'Large Cap';
  if (/mid.?cap/.test(cl))                                             return 'Mid Cap';
  if (/small.?cap/.test(cl))                                           return 'Small Cap';
  if (/multi.?cap/.test(cl))                                           return 'Multi Cap';
  if (/flexi.?cap/.test(cl))                                           return 'Flexi Cap';
  if (/focused/.test(cl))                                              return 'Focused';
  if (/value.?fund|contra|dividend.?yield/.test(cl))                   return 'Value/Contra';
  if (/aggressive.?hybrid/.test(cl))                                   return 'Aggressive Hybrid';
  if (/conservative.?hybrid/.test(cl))                                 return 'Conservative Hybrid';
  if (/balanced.?advantage|dynamic.?asset.?alloc/.test(cl))            return 'Balanced Advantage';
  if (/multi.?asset/.test(cl))                                         return 'Multi Asset';
  if (/hybrid|balanced/.test(cl))                                      return 'Hybrid';
  if (/arbitrage/.test(cl))                                            return 'Arbitrage';
  if (/gold|commodity/.test(cl))                                       return 'Commodity';
  if (/international|global|overseas/.test(cl))                        return 'International';
  if (/retirement|children|solution/.test(cl))                         return 'Solution';
  if (/overnight/.test(cl))                                            return 'Overnight';
  if (/liquid/.test(cl))                                               return 'Liquid';
  if (/ultra.?short|low.?duration/.test(cl))                           return 'Ultra Short';
  if (/money.?market/.test(cl))                                        return 'Money Market';
  if (/short.?duration/.test(cl))                                      return 'Short Duration';
  if (/medium.?duration|long.?duration|medium.*long/.test(cl))         return 'Medium Duration';
  if (/corporate.?bond/.test(cl))                                      return 'Corporate Bond';
  if (/banking.?psu|banking.*psu|psu.*bond/.test(cl))                 return 'Banking & PSU Debt';
  if (/gilt/.test(cl))                                                 return 'Gilt';
  if (/dynamic.?bond/.test(cl))                                        return 'Dynamic Bond';
  if (/credit.?risk/.test(cl))                                         return 'Debt';
  if (/floater|floating.?rate/.test(cl))                               return 'Ultra Short';
  if (/equity.?saving/.test(cl))                                       return 'Hybrid';
  if (/debt|bond|income|duration|credit|corporate|money|floating|crisil|ibx|\bsdl\b|state.?dev|g.?sec|gsec|target.?matur|\bhtm\b|bharat.?bond/.test(cl)) return 'Debt';
  if (/sector|thematic|manufactur|consum|defence|housing|media|tourism|transport|mnc/.test(cl)) return 'Sectoral';
  // Only classify as Index/ETF when there are no debt-type indicators in the category string
  if (/index|etf/.test(cl) && !/debt|target.?matur|bond|sdl|ibx|crisil/.test(cl)) return 'Index';
  if (/fof|fund.?of/.test(cl))                                         return 'FoF';
  return null;
}

main().catch(err => { console.error(err); process.exit(1); });
