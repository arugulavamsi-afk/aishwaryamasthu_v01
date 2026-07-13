/**
 * compute-cc-data.js — Coffee Can dynamic screening pipeline (hybrid NSE + Yahoo)
 *
 * Universe:       Nifty 500 constituents CSV (NSE archives — free, stable, no auth)
 * Revenue / PAT:  NSE corporate annual results filings (10+ years, primary source)
 * ROCE / D-E / FCF: Yahoo Finance fundamentals-timeseries (~4 recent FYs, unofficial)
 * Price / mcap:   Yahoo Finance quote API (screened companies only)
 *
 * Fetched fundamentals accumulate in output/cc-history.json so re-runs are
 * incremental (only missing fiscal years are fetched) and the dataset deepens
 * over time. Screening + scoring run over the accumulated history and the
 * result is written to public/cc-data.json, consumed by public/coffee-can.js.
 * If cc-data.json is missing or stale the app falls back to its built-in list,
 * so failure here is never fatal.
 *
 * Methodology (Mukherjea / Marcellus Coffee Can, adapted):
 *   gate  — ≥5 FYs of filings, revenue CAGR ≥10% (financials ≥15%),
 *           avg ROCE ≥15% (financials: avg ROE ≥15%), ≤1 loss year
 *   score — percentile-ranked pillars within the screened set:
 *           Rev CAGR 25% | ROCE/ROE 25% | Profit consistency 15%
 *           FCF quality 15% | Debt level 10% | Growth consistency 10%
 *           (FCF & debt don't apply to financials → neutral 75, as before)
 *
 * Run:  node scripts/compute-cc-data.js [--limit N] [--symbols TCS,INFY] [--force-nse]
 * Needs: Node 18+ (native fetch). First full run backfills ~10 FYs × 500
 * companies from NSE (~45–60 min throttled); later runs take a few minutes.
 */

'use strict';

const fs   = require('fs');
const path = require('path');

/* ── Config ─────────────────────────────────────────────── */
const OUT_FILE     = path.join(__dirname, '..', 'public', 'cc-data.json');
const HISTORY_FILE = path.join(__dirname, '..', 'output', 'cc-history.json');

const UNIVERSE_URLS = [
  'https://archives.nseindia.com/content/indices/ind_nifty500list.csv',
  'https://nsearchives.nseindia.com/content/indices/ind_nifty500list.csv',
];

const CFG = {
  fetchTimeoutMs:   20_000,
  nseGapMs:         650,      // throttle between NSE API calls
  yahooGapMs:       350,      // throttle between Yahoo timeseries calls
  nseRewarmEvery:   40,       // refresh NSE session cookie every N calls
  maxBackfillYears: 12,       // deepest NSE backfill per company
  nseRecheckDays:   7,        // don't re-list a company's filings more often
  yahooRefreshDays: 30,       // refresh Yahoo fundamentals monthly
  minYears:         5,        // data sufficiency gate (grows toward 10 over time)
  windowYears:      10,       // lookback cap once history is deep enough
  gates: {
    corp: { cagrMin: 0.10, retMin: 15, lossYearsMax: 1 },   // ROCE-based
    fin:  { cagrMin: 0.15, retMin: 15, lossYearsMax: 1 },   // ROE-based
  },
  weights: { cagr: 0.25, ret: 0.25, profit: 0.15, fcf: 0.15, debt: 0.10, growth: 0.10 },
  topN:             25,
  minScreenedToWrite: 8,      // refuse to overwrite cc-data.json below this
};

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

/* CLI flags */
const argv = process.argv.slice(2);
const flag = name => {
  const i = argv.indexOf('--' + name);
  return i === -1 ? null : (argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : true);
};
const LIMIT     = flag('limit')   ? parseInt(flag('limit'), 10)  : null;
const ONLY_SYMS = flag('symbols') ? String(flag('symbols')).split(',').map(s => s.trim().toUpperCase()) : null;
const FORCE_NSE = !!flag('force-nse');

const sleep = ms => new Promise(r => setTimeout(r, ms));
const num = v => {
  if (v === null || v === undefined || v === '' || v === '-') return null;
  const n = parseFloat(String(v).replace(/,/g, ''));
  return Number.isFinite(n) ? n : null;
};

/* ── Universe: Nifty 500 constituents ───────────────────── */
async function fetchUniverse() {
  for (const url of UNIVERSE_URLS) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(CFG.fetchTimeoutMs) });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const lines = (await res.text()).trim().split('\n');
      const rows = lines.slice(1).map(l => {
        /* CSV has no quoted commas in practice, but company names may — split from the right */
        const parts = l.trim().split(',');
        if (parts.length < 5) return null;
        const isin = parts.pop(), series = parts.pop(), symbol = parts.pop(), industry = parts.pop();
        return { name: parts.join(','), industry, symbol: symbol.toUpperCase(), series, isin };
      }).filter(r => r && r.series === 'EQ');
      if (rows.length > 300) { console.log(`Universe: ${rows.length} companies (${url.split('/')[2]})`); return rows; }
    } catch (e) { console.log(`Universe fetch failed at ${url.split('/')[2]}: ${e.message}`); }
  }
  return null;
}

/* ── NSE session + fetch (cookie warm-up, rewarm on 401/403) ─ */
let _nseCookie = '', _nseCalls = 0;
async function nseWarmup() {
  const res = await fetch('https://www.nseindia.com/', {
    headers: { 'User-Agent': UA, 'Accept': 'text/html', 'Accept-Language': 'en-US,en;q=0.9' },
    signal: AbortSignal.timeout(CFG.fetchTimeoutMs),
  });
  _nseCookie = (res.headers.getSetCookie?.() || []).map(c => c.split(';')[0]).join('; ');
  _nseCalls = 0;
  if (!_nseCookie) throw new Error('no NSE session cookie');
}
async function nseJson(url, attempt = 1) {
  if (!_nseCookie || _nseCalls >= CFG.nseRewarmEvery) await nseWarmup();
  _nseCalls++;
  await sleep(CFG.nseGapMs);
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': UA, 'Accept': 'application/json', 'Cookie': _nseCookie,
        'Referer': 'https://www.nseindia.com/companies-listing/corporate-filings-financial-results',
      },
      signal: AbortSignal.timeout(CFG.fetchTimeoutMs),
    });
    if (res.status === 401 || res.status === 403) { _nseCookie = ''; throw new Error('HTTP ' + res.status); }
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return await res.json();
  } catch (e) {
    if (attempt >= 3) throw e;
    await sleep(1500 * attempt);
    return nseJson(url, attempt + 1);
  }
}

/* ── NSE annual filings → per-FY revenue/PAT ────────────── */
const MONTHS = { JAN:0, FEB:1, MAR:2, APR:3, MAY:4, JUN:5, JUL:6, AUG:7, SEP:8, OCT:9, NOV:10, DEC:11 };
function parseNseDate(s) {                       // "31-Mar-2024" / "31-MAR-2024"
  const m = /^(\d{1,2})-([A-Za-z]{3})-(\d{4})/.exec(String(s || '').trim());
  return m ? new Date(Date.UTC(+m[3], MONTHS[m[2].toUpperCase()], +m[1])) : null;
}
const DAY = 86_400_000;

/* Pick the best filing per (fiscal-year, basis): latest filed, audited preferred */
function pickAnnualFilings(list) {
  const byKey = new Map();
  for (const f of list || []) {
    if (!/annual/i.test(f.relatingTo || f.period || '')) continue;
    const from = parseNseDate(f.fromDate), to = parseNseDate(f.toDate);
    if (!from || !to) continue;
    const days = (to - from) / DAY;
    if (days < 350 || days > 380) continue;      // true 12-month periods only
    const fy    = to.getUTCFullYear();           // FY key = calendar year of period end
    const basis = /^consolidated$/i.test(f.consolidated || '') ? 'c' : 's';
    const key   = fy + basis;
    const prev  = byKey.get(key);
    const score = (/audited/i.test(f.audited || '') ? 1e13 : 0) + (parseNseDate(f.filingDate)?.getTime() || 0);
    if (!prev || score > prev._score) byKey.set(key, Object.assign({ _fy: fy, _basis: basis, _score: score, _endMs: to.getTime() }, f));
  }
  return Array.from(byKey.values());
}

async function fetchFilingNumbers(f) {
  const url = 'https://www.nseindia.com/api/corporates-financial-results-data?index=equities' +
    `&params=${encodeURIComponent(f.params)}&seq_id=${encodeURIComponent(f.seqNumber)}` +
    `&industry=${encodeURIComponent(f.industry || '-')}&frOldNewFlag=${f.oldNewFlag ?? 'N'}` +
    `&ind=${f.reInd ?? 'N'}&format=${encodeURIComponent(f.format || 'New')}`;
  const d = await nseJson(url);
  const r = d?.resultsData2 || d?.resultsData || {};
  /* Revenue: operating revenue → interest earned (banks) → total income. ₹ lakhs. */
  const rev = num(r.re_net_sale) ?? num(r.re_int_earned) ?? num(r.re_total_inc) ?? num(r.re_tot_inc);
  const pat = num(r.re_con_pro_loss) ?? num(r.re_proloss_ord_act) ?? num(r.re_net_profit);
  return (rev !== null && rev > 0 && pat !== null) ? { rev, pat } : null;
}

/* Update hist.nse = { "<fy><c|s>": { rev, pat, end } } with any missing FYs.
   Consolidated is fetched first; a standalone filing is only fetched for FYs
   with no usable consolidated figures (halves the NSE call count). */
async function updateNseHistory(symbol, hist) {
  const list = await nseJson(
    `https://www.nseindia.com/api/corporates-financial-results?index=equities&symbol=${encodeURIComponent(symbol)}&period=Annual`);
  const filings = pickAnnualFilings(Array.isArray(list) ? list : [])
    .sort((a, b) => (b._fy - a._fy) || (a._basis === 'c' ? -1 : 1));   // newest first, 'c' before 's'
  const maxFy = filings.length ? filings[0]._fy : 0;
  let fetched = 0;
  for (const f of filings) {
    if (f._fy <= maxFy - CFG.maxBackfillYears) continue;
    const key = f._fy + f._basis;
    if (hist.nse[key]) continue;
    if (f._basis === 's' && hist.nse[f._fy + 'c']?.rev) continue;
    try {
      const n = await fetchFilingNumbers(f);
      if (n) { hist.nse[key] = { rev: n.rev, pat: n.pat, end: f._endMs }; fetched++; }
      else   { hist.nse[key] = { rev: null, pat: null, end: f._endMs }; }   // don't refetch dead filings
    } catch (e) { /* leave missing — retried next run */ }
  }
  hist.nseCheckedAt = Date.now();
  return fetched;
}

/* ── Yahoo fundamentals-timeseries ──────────────────────── */
const Y_TYPES = [
  'annualTotalRevenue', 'annualNetIncome', 'annualEBIT', 'annualTotalDebt',
  'annualStockholdersEquity', 'annualTotalAssets', 'annualCurrentLiabilities', 'annualFreeCashFlow',
];
async function fetchYahooFundamentals(symbol) {
  const ySym = symbol + '.NS';
  const now = Math.floor(Date.now() / 1000);
  const url = `https://query1.finance.yahoo.com/ws/fundamentals-timeseries/v1/finance/timeseries/${encodeURIComponent(ySym)}` +
    `?symbol=${encodeURIComponent(ySym)}&type=${Y_TYPES.join(',')}&period1=${now - 12 * 365 * 86400}&period2=${now}`;
  await sleep(CFG.yahooGapMs);
  const res = await fetch(url, { headers: { 'User-Agent': UA, 'Accept': 'application/json' }, signal: AbortSignal.timeout(CFG.fetchTimeoutMs) });
  if (!res.ok) throw new Error('HTTP ' + res.status);
  const json = await res.json();
  const byYear = {};                              // { 2024: { rev, ni, ebit, debt, eq, ta, cl, fcf } }
  const SHORT = {
    annualTotalRevenue: 'rev', annualNetIncome: 'ni', annualEBIT: 'ebit', annualTotalDebt: 'debt',
    annualStockholdersEquity: 'eq', annualTotalAssets: 'ta', annualCurrentLiabilities: 'cl', annualFreeCashFlow: 'fcf',
  };
  for (const series of json?.timeseries?.result || []) {
    const type = series?.meta?.type?.[0];
    const shortKey = SHORT[type];
    if (!shortKey || !Array.isArray(series[type])) continue;
    for (const pt of series[type]) {
      const raw = pt?.reportedValue?.raw;
      if (!pt?.asOfDate || typeof raw !== 'number') continue;
      const yr = +pt.asOfDate.slice(0, 4);
      const rec = (byYear[yr] = byYear[yr] || {});
      rec[shortKey] = raw;                               // INR units
      if (!rec.asOf || pt.asOfDate > rec.asOf) rec.asOf = pt.asOfDate;
    }
  }
  return Object.keys(byYear).length ? byYear : null;
}

/* ── Yahoo price + market cap (screened symbols only) ───── */
async function yahooSession() {
  const res = await fetch('https://fc.yahoo.com/', {
    headers: { 'User-Agent': UA }, redirect: 'manual', signal: AbortSignal.timeout(CFG.fetchTimeoutMs),
  }).catch(() => null);
  const setCookies = res?.headers?.getSetCookie?.() ?? [];
  const cookie = setCookies.map(c => c.split(';')[0]).filter(Boolean).join('; ');
  if (!cookie) throw new Error('no Yahoo session cookie');
  const crumbRes = await fetch('https://query1.finance.yahoo.com/v1/test/getcrumb', {
    headers: { 'User-Agent': UA, 'Cookie': cookie }, signal: AbortSignal.timeout(CFG.fetchTimeoutMs),
  });
  const crumb = (await crumbRes.text()).trim();
  if (!crumbRes.ok || !crumb || crumb.includes('{')) throw new Error('no Yahoo crumb');
  return { cookie, crumb };
}
async function fetchQuotes(symbols) {
  const out = {};
  try {
    const { cookie, crumb } = await yahooSession();
    for (let i = 0; i < symbols.length; i += 40) {
      const batch = symbols.slice(i, i + 40).map(s => s + '.NS');
      const url = 'https://query1.finance.yahoo.com/v7/finance/quote?symbols=' +
        encodeURIComponent(batch.join(',')) + '&crumb=' + encodeURIComponent(crumb);
      const res = await fetch(url, {
        headers: { 'User-Agent': UA, 'Cookie': cookie, 'Accept': 'application/json' },
        signal: AbortSignal.timeout(CFG.fetchTimeoutMs),
      });
      if (!res.ok) throw new Error('quote HTTP ' + res.status);
      const json = await res.json();
      for (const q of json?.quoteResponse?.result || []) {
        if (typeof q.regularMarketPrice !== 'number' || q.regularMarketPrice <= 0) continue;
        out[q.symbol.replace(/\.NS$/, '')] = {
          price:  q.regularMarketPrice,
          mcapCr: (typeof q.marketCap === 'number' && q.marketCap > 0) ? Math.round(q.marketCap / 1e7) : null,
        };
      }
      await sleep(300);
    }
  } catch (e) { console.log(`Batched quotes failed (${e.message}) — falling back to chart endpoint`); }
  /* Per-symbol chart fallback for gaps (price only) */
  for (const s of symbols) {
    if (out[s]) continue;
    try {
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(s + '.NS')}?range=1d&interval=1d`;
      const res = await fetch(url, { headers: { 'User-Agent': UA, 'Accept': 'application/json' }, signal: AbortSignal.timeout(CFG.fetchTimeoutMs) });
      const price = (await res.json())?.chart?.result?.[0]?.meta?.regularMarketPrice;
      if (typeof price === 'number' && price > 0) out[s] = { price, mcapCr: null };
      await sleep(250);
    } catch (e) { /* stays missing */ }
  }
  return out;
}

/* ── History store ──────────────────────────────────────── */
function loadHistory() {
  try { return JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8')); }
  catch { return { version: 1, companies: {} }; }
}
function saveHistory(h) {
  h.updated = new Date().toISOString();
  fs.mkdirSync(path.dirname(HISTORY_FILE), { recursive: true });
  fs.writeFileSync(HISTORY_FILE, JSON.stringify(h));
}

/* ── Metrics from accumulated history ───────────────────── */
/* Build one consistent revenue/PAT series: consolidated if deep enough, else standalone */
function nseSeries(hist) {
  const pick = basis => Object.entries(hist.nse)
    .filter(([k, v]) => k.endsWith(basis) && v && v.rev !== null && v.rev > 0)
    .map(([k, v]) => ({ fy: parseInt(k, 10), rev: v.rev, pat: v.pat, end: v.end }))
    .sort((a, b) => a.fy - b.fy);
  const cons = pick('c'), stand = pick('s');
  return (cons.length >= Math.max(CFG.minYears, stand.length * 0.7)) ? cons : (stand.length > cons.length ? stand : cons);
}

/* NSE's DB has occasional garbage figures in old filings (e.g. TCS FY14
   consolidated revenue is off by ~50×). Drop interior points that disagree
   with BOTH neighbours by more than 4× — real crashes never do. */
function scrubOutliers(series) {
  return series.filter((p, i) => {
    if (i === 0 || i === series.length - 1) return true;
    const rPrev = p.rev / series[i - 1].rev, rNext = p.rev / series[i + 1].rev;
    return !((rPrev > 4 && rNext > 4) || (rPrev < 0.25 && rNext < 0.25));
  });
}

/* NSE's results API lags ~1–2 FYs behind; Yahoo has the fresh years.
   Append Yahoo revenue/PAT for FYs after the last NSE point — but only if an
   overlapping FY confirms both report the same basis (ratio within ±20%),
   so consolidated and standalone series never get spliced together. */
function spliceYahooYears(series, hist) {
  if (!series.length) return series;
  const yh = hist.yahoo || {};
  const last = series[series.length - 1];
  const overlap = series.slice(-3).find(p => typeof yh[p.fy]?.rev === 'number');
  if (!overlap) return series;
  const ratio = (yh[overlap.fy].rev / 1e5) / overlap.rev;         // INR → lakhs
  if (ratio < 0.8 || ratio > 1.25) return series;
  const out = series.slice();
  for (const yr of Object.keys(yh).map(Number).sort((a, b) => a - b)) {
    const d = yh[yr];
    if (yr <= last.fy || typeof d.rev !== 'number' || d.rev <= 0) continue;
    const end = Date.parse(d.asOf || `${yr}-03-31`);
    out.push({ fy: yr, rev: d.rev / 1e5, pat: typeof d.ni === 'number' ? d.ni / 1e5 : null, end });
  }
  return out;
}

function computeMetrics(company, hist) {
  const isFin = /financial services/i.test(company.industry || '');
  let series = spliceYahooYears(scrubOutliers(nseSeries(hist)), hist);
  if (series.length > CFG.windowYears) series = series.slice(-CFG.windowYears);
  if (series.length < CFG.minYears) return null;

  const first = series[0], last = series[series.length - 1];
  const span = (last.end - first.end) / (365.25 * DAY);
  if (span < CFG.minYears - 1.2 || last.rev <= 0 || first.rev <= 0) return null;
  const revCagr = Math.pow(last.rev / first.rev, 1 / span) - 1;

  let growthYears = 0, growthPairs = 0, lossYears = 0;
  for (let i = 0; i < series.length; i++) {
    if (series[i].pat !== null && series[i].pat <= 0) lossYears++;
    if (i > 0) {
      const gapDays = (series[i].end - series[i - 1].end) / DAY;
      if (gapDays > 300 && gapDays < 430) {
        growthPairs++;
        if (series[i].rev / series[i - 1].rev - 1 >= 0.10) growthYears++;
      }
    }
  }

  /* Yahoo pillars */
  const yh = hist.yahoo || {};
  const yrs = Object.keys(yh).map(Number).sort((a, b) => a - b).slice(-5);
  const rocePts = [], fcfPts = [];
  let de = null, ni = 0, fcfSum = 0, niN = 0;
  for (const y of yrs) {
    const d = yh[y];
    if (!d) continue;
    if (isFin) {
      if (typeof d.ni === 'number' && typeof d.eq === 'number' && d.eq > 0) rocePts.push(d.ni / d.eq * 100);
    } else if (typeof d.ebit === 'number' && typeof d.ta === 'number' && typeof d.cl === 'number' && (d.ta - d.cl) > 0) {
      rocePts.push(d.ebit / (d.ta - d.cl) * 100);
    }
    if (typeof d.fcf === 'number') { fcfPts.push(d.fcf); fcfSum += d.fcf; }
    if (typeof d.ni === 'number')  { ni += d.ni; niN++; }
    if (typeof d.debt === 'number' && typeof d.eq === 'number' && d.eq > 0) de = d.debt / d.eq;
  }
  if (!rocePts.length) return null;               // returns pillar is mandatory
  const avgRet = rocePts.reduce((a, b) => a + b, 0) / rocePts.length;

  return {
    symbol: company.symbol, name: company.name, industry: company.industry, isFinancial: isFin,
    years: series.length, fyFirst: first.fy, fyLast: last.fy,
    revFirstCr: Math.round(first.rev / 100), revLastCr: Math.round(last.rev / 100),   // lakhs → Cr
    revCagr: +(revCagr * 100).toFixed(1),
    growthYears, growthPairs,
    profitYrs: series.length - lossYears, lossYears,
    avgRet: +avgRet.toFixed(1), retYears: rocePts.length,
    fcfPosYears: fcfPts.filter(v => v > 0).length, fcfYears: fcfPts.length,
    fcfToPat: (!isFin && ni > 0 && niN > 0) ? +(fcfSum / ni).toFixed(2) : null,
    de: (isFin || de === null) ? null : +de.toFixed(2),
  };
}

function passesGates(m) {
  const g = m.isFinancial ? CFG.gates.fin : CFG.gates.corp;
  return m.revCagr / 100 >= g.cagrMin &&
         m.avgRet >= g.retMin &&
         m.lossYears <= g.lossYearsMax &&
         (m.isFinancial || m.fcfYears > 0);       // non-financials must have FCF data
}

/* Percentile rank (0–100) of value within arr */
function pctile(arr, v) {
  if (arr.length <= 1) return 75;
  const below = arr.filter(x => x < v).length;
  const equal = arr.filter(x => x === v).length;
  return Math.round((below + equal / 2) / arr.length * 100);
}

function scoreAll(list) {
  const grp = fin => list.filter(m => m.isFinancial === fin);
  for (const m of list) {
    const peers   = grp(m.isFinancial);
    const cagrP   = pctile(peers.map(x => x.revCagr), m.revCagr);
    const retP    = pctile(peers.map(x => x.avgRet), m.avgRet);
    const profitP = m.profitYrs / m.years * 100;
    const growthP = m.growthPairs > 0 ? m.growthYears / m.growthPairs * 100 : 60;
    let fcfP = 75, debtP = 75;                    // neutral for financials
    if (!m.isFinancial) {
      fcfP = m.fcfYears > 0 ? (m.fcfPosYears / m.fcfYears * 80 + (m.fcfToPat !== null && m.fcfToPat >= 0.8 ? 20 : m.fcfToPat >= 0.5 ? 10 : 0)) : 40;
      debtP = m.de === null ? 60 : Math.max(0, 1 - Math.min(m.de, 1)) * 100;
    }
    const w = CFG.weights;
    m.score = Math.round(cagrP * w.cagr + retP * w.ret + profitP * w.profit + fcfP * w.fcf + debtP * w.debt + growthP * w.growth);
  }
  return list.sort((a, b) => b.score - a.score);
}

/* ── Main ───────────────────────────────────────────────── */
async function main() {
  console.log('=== Coffee Can Screening Pipeline (NSE + Yahoo) ===');
  console.log(`Started: ${new Date().toISOString()}\n`);

  let universe = await fetchUniverse();
  const history = loadHistory();
  if (!universe) {
    console.log('Universe fetch failed — using symbols already in history file.');
    universe = Object.values(history.companies).map(h => ({ name: h.name, industry: h.industry, symbol: h.symbol }));
    if (!universe.length) { console.error('FATAL: no universe and empty history.'); process.exit(1); }
  }
  if (ONLY_SYMS) universe = universe.filter(u => ONLY_SYMS.includes(u.symbol));
  if (LIMIT)     universe = universe.slice(0, LIMIT);
  console.log(`Processing ${universe.length} companies\n`);

  const now = Date.now();
  let nseFetched = 0, nseFailed = 0, yFetched = 0, yFailed = 0, done = 0;

  for (const c of universe) {
    const hist = history.companies[c.symbol] = history.companies[c.symbol] ||
      { symbol: c.symbol, nse: {}, yahoo: {} };
    hist.name = c.name; hist.industry = c.industry;

    /* NSE: fetch when history is shallow or a new FY may have been filed */
    const nseYears = Object.keys(hist.nse).length;
    const needNse = FORCE_NSE || nseYears < CFG.minYears * 2 ||   // c+s bases ⇒ ×2
      !hist.nseCheckedAt || (now - hist.nseCheckedAt) > CFG.nseRecheckDays * DAY;
    if (needNse) {
      try { nseFetched += await updateNseHistory(c.symbol, hist); }
      catch (e) { nseFailed++; }
    }

    /* Yahoo fundamentals: monthly refresh */
    if (!hist.yahooFetchedAt || (now - hist.yahooFetchedAt) > CFG.yahooRefreshDays * DAY) {
      try {
        const y = await fetchYahooFundamentals(c.symbol);
        if (y) { hist.yahoo = Object.assign(hist.yahoo || {}, y); yFetched++; }
        else yFailed++;
        hist.yahooFetchedAt = now;
      } catch (e) { yFailed++; }
    }

    if (++done % 25 === 0) {
      saveHistory(history);                        // checkpoint — resumable
      console.log(`  ...${done}/${universe.length} (NSE filings +${nseFetched}, NSE fails ${nseFailed}, Yahoo ok ${yFetched})`);
    }
  }
  saveHistory(history);
  console.log(`\nFetch done: NSE +${nseFetched} filings (${nseFailed} symbol failures), Yahoo ${yFetched} ok / ${yFailed} failed`);

  /* Compute, gate, score */
  const metrics = [];
  let insufficient = 0;
  for (const c of universe) {
    const m = computeMetrics(c, history.companies[c.symbol]);
    if (m) metrics.push(m); else insufficient++;
  }
  const screened = scoreAll(metrics.filter(passesGates)).slice(0, CFG.topN);
  console.log(`Metrics computed: ${metrics.length} (${insufficient} with insufficient data)`);
  console.log(`Screened (pass all gates): ${metrics.filter(passesGates).length} → top ${screened.length}\n`);
  for (const m of screened) {
    console.log(`  ${m.symbol.padEnd(12)} score ${String(m.score).padStart(3)}  cagr ${m.revCagr}%  ${m.isFinancial ? 'ROE ' : 'ROCE'} ${m.avgRet}%  ` +
      `profit ${m.profitYrs}/${m.years}  FY${m.fyFirst}–FY${m.fyLast}${m.de !== null ? '  D/E ' + m.de : ''}`);
  }

  if (screened.length < CFG.minScreenedToWrite) {
    console.error(`FATAL: only ${screened.length} companies screened — refusing to overwrite ${path.basename(OUT_FILE)}.`);
    process.exit(1);
  }

  /* Live price + mcap for the screened set only */
  const quotes = await fetchQuotes(screened.map(m => m.symbol));

  const companies = screened.map((m, i) => ({
    rank: i + 1,
    symbol: m.symbol, name: m.name, sector: m.industry, isFinancial: m.isFinancial,
    price: quotes[m.symbol]?.price ?? null,
    mcap:  quotes[m.symbol]?.mcapCr ?? null,
    years: m.years, fyFirst: m.fyFirst, fyLast: m.fyLast,
    revFirstCr: m.revFirstCr, revLastCr: m.revLastCr,
    revCagr: m.revCagr, growthYears: m.growthYears, growthPairs: m.growthPairs,
    profitYrs: m.profitYrs, avgRet: m.avgRet, retYears: m.retYears,
    fcfPosYears: m.fcfPosYears, fcfYears: m.fcfYears, fcfToPat: m.fcfToPat,
    de: m.de, score: m.score,
  }));

  const out = {
    generated: new Date().toISOString(),
    source: 'NSE annual filings + Yahoo Finance (unofficial)',
    methodology: 'Coffee Can (Mukherjea/Marcellus, adapted) — see scripts/compute-cc-data.js',
    universe: universe.length, passed: metrics.filter(passesGates).length,
    minYears: CFG.minYears,
    companies,
  };
  fs.writeFileSync(OUT_FILE, JSON.stringify(out));

  for (const c of companies) {
    console.log(`  #${String(c.rank).padStart(2)} ${c.name.slice(0, 30).padEnd(30)} score ${c.score}  cagr ${c.revCagr}%  ${c.isFinancial ? 'ROE' : 'ROCE'} ${c.avgRet}%  ${c.years}y`);
  }
  console.log(`\nOutput: ${OUT_FILE} (${Math.round(fs.statSync(OUT_FILE).size / 1024)} KB)`);
  console.log(`Done: ${new Date().toISOString()}`);
}

main().catch(err => { console.error(err); process.exit(1); });
