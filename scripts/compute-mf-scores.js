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

/* ── Config ─────────────────────────────────────────────── */
const OUT_DIR  = path.join(__dirname, '..', 'public');  // served directly by Firebase hosting
const OUT_FILE = path.join(OUT_DIR, 'mf-data.json');
const FETCH_TIMEOUT_MS  = 20_000;
const BATCH_SIZE        = 15;   // concurrent fetches per batch
const RETRY_ATTEMPTS    = 3;
const RETRY_DELAY_MS    = 1_500;
const RF_RATE           = 0.065; // India 91-day T-bill proxy

/* ── Benchmark codes (mirrors MFE_CAT_BENCH in app) ─────── */
const CAT_BENCH_CODE = {
  'Large Cap':            '148940',
  'Large & Mid Cap':      '148942',
  'Mid Cap':              '148939',
  'Small Cap':            '148937',
  'Multi Cap':            '148942',
  'Flexi Cap':            '148942',
  'Focused':              '148942',
  'Value/Contra':         '148942',
  'ELSS':                 '148942',
  'Index':                '120716',
  'Aggressive Hybrid':    '120503',
  'Conservative Hybrid':  '136094',
  'Balanced Advantage':   '120503',
  'Multi Asset':          '120503',
  'Hybrid':               '120503',
  'Liquid':               '136094',
  'Overnight':            '136094',
  'Ultra Short':          '136094',
  'Money Market':         '136094',
  'Short Duration':       '136094',
  'Medium Duration':      '136094',
  'Corporate Bond':       '136094',
  'Banking & PSU Debt':   '136094',
  'Gilt':                 '136094',
  'Dynamic Bond':         '136094',
  'Debt':                 '136094',
  'Arbitrage':            '136094',
  'Sectoral':             '148942',
  'International':        '135781',
  'Commodity':            '118503',
  'Solution':             '148942',
  'FoF':                  '120716',
  '_default':             '120716',
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

function navArray(data) {
  return (data?.data || [])
    .map(d => parseFloat(d.nav))
    .filter(v => !isNaN(v))
    .reverse(); // chronological order
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

/* ── Math (identical to app) ─────────────────────────────── */
function cagr(navArr, years) {
  const days   = Math.round(years * 252);
  if (navArr.length < days + 5) return null;
  const latest = navArr[navArr.length - 1];
  const past   = navArr[navArr.length - 1 - days];
  if (!past || past < 1 || !latest || latest <= 0) return null;
  const c = Math.pow(latest / past, 1 / years) - 1;
  if (!isFinite(c) || Math.abs(c) > 0.80) return null;
  return +(c * 100).toFixed(2);
}

function rolling(navArr) {
  const windowDays = 756, step = 21;
  if (navArr.length < windowDays + step) return null;
  const returns = [];
  for (let end = navArr.length - 1; end >= windowDays; end -= step) {
    const start = end - windowDays;
    if (navArr[start] <= 0 || navArr[end] <= 0) continue;
    const r = Math.pow(navArr[end] / navArr[start], 1 / 3) - 1;
    if (isFinite(r) && Math.abs(r) < 2) returns.push(r * 100);
  }
  if (returns.length < 5) return null;
  const avg     = returns.reduce((s, v) => s + v, 0) / returns.length;
  const hitRate = returns.filter(r => r > 0).length / returns.length * 100;
  return { avg: +avg.toFixed(2), hitRate: +hitRate.toFixed(1) };
}

function compute(navArr, bench) {
  const MAX = 756;
  const f3  = navArr.slice(-MAX);
  const b3  = bench.slice(-MAX);
  if (f3.length < 30 || b3.length < 30) return null;
  const navMin = Math.min(...f3), navMax = Math.max(...f3);
  if (navMin < 0.5 || navMax < 1) return null;

  const fR = [], bR = [];
  for (let i = 1; i < f3.length; i++) { const r = (f3[i] - f3[i-1]) / f3[i-1]; if (isFinite(r)) fR.push(r); }
  for (let i = 1; i < b3.length; i++) { const r = (b3[i] - b3[i-1]) / b3[i-1]; if (isFinite(r)) bR.push(r); }
  if (fR.length < 20 || bR.length < 20) return null;

  const n  = Math.min(fR.length, bR.length);
  const fr = fR.slice(-n), br = bR.slice(-n);
  const mean = a => a.reduce((s, v) => s + v, 0) / a.length;
  const std  = a => { const m = mean(a); return Math.sqrt(a.reduce((s, v) => s + (v - m) ** 2, 0) / a.length); };
  const fm = mean(fr), bm = mean(br), fs = std(fr), bs = std(br);
  if (!isFinite(fm) || !isFinite(fs) || fs === 0) return null;

  const aFM = fm * 252, aFS = fs * Math.sqrt(252);
  let cov = 0;
  for (let i = 0; i < n; i++) cov += (fr[i] - fm) * (br[i] - bm);
  cov /= n;
  const bVar  = bs * bs;
  const beta  = (isFinite(bVar) && bVar > 1e-10) ? cov / bVar : 1.0;
  const rfD   = RF_RATE / 252;
  const alpha = (aFM - RF_RATE) - beta * (bm * 252 - RF_RATE);
  const sharpe  = aFS > 0 ? (aFM - RF_RATE) / aFS : 0;
  const dn      = fr.filter(r => r < rfD);
  const dVar    = dn.length > 0 ? dn.reduce((s, r) => s + (r - rfD) ** 2, 0) / fr.length : 0;
  const ds      = Math.sqrt(dVar) * Math.sqrt(252);
  const sortino = ds > 0.0001 ? (aFM - RF_RATE) / ds : sharpe * 2;
  const clamp   = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  const roll    = rolling(navArr);

  const m = {
    stdDev:  +clamp(aFS * 100, 0,  60).toFixed(2),
    beta:    +clamp(beta,      -2,   3).toFixed(2),
    alpha:   +clamp(alpha*100, -30, 30).toFixed(2),
    sharpe:  +clamp(sharpe,    -3,   5).toFixed(2),
    sortino: +clamp(sortino,   -3,  10).toFixed(2),
    rolling: roll,
    cagr: {
      y1:  cagr(navArr, 1),
      y3:  cagr(navArr, 3),
      y5:  cagr(navArr, 5),
      y10: cagr(navArr, 10),
    },
    score: null,
    stars: null,
  };
  if (['stdDev','beta','alpha','sharpe','sortino'].some(k => !isFinite(m[k]))) return null;
  return m;
}

function normaliseCat(funds) {
  // Mirrors mfeNorm() — percentile-bucket into 1–5 signal tiers
  const valid = funds.filter(f => f.metrics);
  if (!valid.length) return;
  const isDebtLike = f => ['Debt','Liquid','Arbitrage'].includes(f.cat);
  const isGold     = f => f.cat === 'Commodity';

  const scored = valid.map(f => {
    const m  = f.metrics;
    const sh = Math.max(-3, Math.min(5, m.sharpe));
    const al = Math.max(-15, Math.min(15, m.alpha)) / 5;
    const so = Math.max(-3, Math.min(6, m.sortino));
    const sdBaseline = isDebtLike(f) ? 8 : isGold(f) ? 25 : 30;
    const sdScore    = Math.max(0, (sdBaseline - m.stdDev) / sdBaseline);
    const bScore     = isDebtLike(f)
      ? Math.max(0, 1 - Math.abs(m.beta))
      : Math.max(0, 1.5 - Math.abs(m.beta - 1.0));
    const rHit = m.rolling ? Math.max(0, Math.min(100, m.rolling.hitRate)) / 100 : 0.5;
    const rAvg = m.rolling ? Math.max(-20, Math.min(20, m.rolling.avg)) / 20 : 0;
    const raw  = rHit * 0.25 + sh * 0.20 + al * 0.20 + rAvg * 0.15 + so * 0.10 + sdScore * 0.07 + bScore * 0.03;
    return { f, raw: isFinite(raw) ? raw : null };
  }).filter(s => s.raw !== null);

  scored.sort((a, b) => a.raw - b.raw);
  const total = scored.length;
  scored.forEach(({ f }, idx) => {
    const pct = (idx + 1) / total;
    f.metrics.stars = pct <= 0.10 ? 1 : pct <= 0.325 ? 2 : pct <= 0.675 ? 3 : pct <= 0.90 ? 4 : 5;
    f.metrics.score = Math.round((idx / Math.max(total - 1, 1)) * 100);
  });
}

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
    const arr  = navArray(data);
    if (arr.length > 30) {
      benchCache[code] = arr;
      process.stdout.write(` ${arr.length} data points\n`);
    } else {
      process.stdout.write(` FAILED\n`);
    }
  }
  const defaultBench = benchCache['120716'] || [];
  const getBench = cat => benchCache[CAT_BENCH_CODE[cat]] || benchCache[CAT_BENCH_CODE['_default']] || defaultBench;
  console.log();

  /* Step 3: Fetch full NAV history per fund and compute metrics */
  console.log('Step 3: Fetching NAV histories and computing metrics...');
  await batchMap(funds, async f => {
    const data = await fetchWithRetry(`https://api.mfapi.in/mf/${f.code}`);
    if (!data) return;

    // Refine category from API meta (more accurate than name parsing).
    // Guard: don't let meta override certain name-parsed categories to 'Index':
    //  - Debt index funds (IBX/Crisil/SDL/G-Sec target-maturity) — SEBI categorises these as Index Funds
    //  - International funds (Nasdaq/S&P/overseas ETF FoF) — AMFI may say "ETF Fund of Funds" without "overseas"
    //  - Value-factor index funds (Nifty 500 Value 50, Nifty 50 Value 20) — passive but value-strategy funds
    const metaCat = catFromMeta(data?.meta?.scheme_category);
    if (metaCat && !(metaCat === 'Index' && (
        /crisil|ibx|target.?matur|bharat.?bond|\bsdl\b|g.?sec|gsec|gilt/i.test(f.name) ||
        f.cat === 'International' ||
        f.cat === 'Value/Contra'
    ))) {
      f.cat = metaCat;
    }

    const arr = navArray(data);
    if (!arr.length) return;

    // Latest NAV
    const latest = data.data?.[0];
    if (latest) { f.nav = parseFloat(latest.nav); f.navDate = latest.date; }

    // Compute metrics
    const bench = getBench(f.cat);
    f.metrics   = compute(arr, bench);
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

  /* Step 5: Write output */
  const out = {
    generated:  new Date().toISOString(),
    fundCount:  funds.length,
    categories: {},
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
      metrics: f.metrics,
    }));
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
