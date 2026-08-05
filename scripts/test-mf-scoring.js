/**
 * test-mf-scoring.js — regression tests for public/mf-scoring-core.js
 * Run after ANY change to the scoring core:  node scripts/test-mf-scoring.js
 * Exit code 0 = all pass, 1 = failure. No dependencies.
 */
'use strict';

const S = require('../public/mf-scoring-core.js');

let pass = 0, fail = 0;
function ok(cond, name, detail) {
  if (cond) { pass++; console.log(`  ✓ ${name}`); }
  else      { fail++; console.error(`  ✗ ${name}${detail ? ' — ' + detail : ''}`); }
}
function near(a, b, tol) { return a !== null && isFinite(a) && Math.abs(a - b) <= tol; }

const DAY = 86400000;
/* Build an mfapi-style payload (newest-first) from chronological rows */
function toApi(rows) {
  const dd = t => { const d = new Date(t); const p = n => String(n).padStart(2, '0');
    return `${p(d.getUTCDate())}-${p(d.getUTCMonth() + 1)}-${d.getUTCFullYear()}`; };
  return { data: rows.slice().reverse().map(r => ({ date: dd(r.t), nav: String(r.nav) })) };
}
/* Business-day-ish grid: skip Sat/Sun */
function bizDays(startUTC, count) {
  const out = []; let t = startUTC;
  while (out.length < count) {
    const dow = new Date(t).getUTCDay();
    if (dow !== 0 && dow !== 6) out.push(t);
    t += DAY;
  }
  return out;
}

/* ── 1. toSeries: parsing, ordering, dedupe ─────────────────── */
console.log('toSeries');
{
  const api = { data: [
    { date: '03-01-2024', nav: '12.5' },
    { date: '02-01-2024', nav: 'N.A.' },   // bad NAV dropped
    { date: '02-01-2024', nav: '12.0' },
    { date: '01-01-2024', nav: '11.0' },
  ]};
  const s = S.toSeries(api);
  ok(s.navs.length === 3, 'drops bad NAVs, keeps rest');
  ok(s.navs[0] === 11.0 && s.navs[2] === 12.5, 'chronological order');
  ok(s.dates[0] < s.dates[1] && s.dates[1] < s.dates[2], 'ascending dates');
}

/* ── 2. beta/alpha recovery on clean aligned data ───────────── */
console.log('beta/alpha recovery (clean data)');
const START = Date.UTC(2021, 0, 4);
const N = 1100;                      // > 4 years of business days
const grid = bizDays(START, N);
const BETA = 1.3, A_DAILY = 0.0001;  // exact linear fund
{
  let bnav = 100, fnav = 100;
  const brows = [{ t: grid[0], nav: bnav }], frows = [{ t: grid[0], nav: fnav }];
  for (let k = 1; k < N; k++) {
    const rb = 0.0004 + 0.003 * Math.sin(2 * Math.PI * k / 40);
    bnav *= 1 + rb; fnav *= 1 + BETA * rb + A_DAILY;
    brows.push({ t: grid[k], nav: bnav }); frows.push({ t: grid[k], nav: fnav });
  }
  const bench = S.toSeries(toApi(brows)), fund = S.toSeries(toApi(frows));
  const m = S.compute(fund, bench);
  const expAlpha = (252 * A_DAILY + S.RF_RATE * (BETA - 1)) * 100; // exact, in %
  ok(m !== null, 'compute returns metrics');
  ok(near(m.beta, BETA, 0.01), 'beta ≈ 1.30', `got ${m && m.beta}`);
  ok(near(m.alpha, expAlpha, 0.4), `alpha ≈ ${expAlpha.toFixed(2)}%`, `got ${m && m.alpha}`);

  /* ── 3. misalignment resilience (the bug this core fixes) ─── */
  console.log('date-misalignment resilience');
  // Fund misses every 7th NAV day (AMC holiday), bench misses others
  const fGap = frows.filter((_, i) => i % 7 !== 3);
  const bGap = brows.filter((_, i) => i % 11 !== 5);
  const fundG = S.toSeries(toApi(fGap)), benchG = S.toSeries(toApi(bGap));
  const mg = S.compute(fundG, benchG);
  ok(mg !== null && near(mg.beta, BETA, 0.05), 'beta survives missing days', `got ${mg && mg.beta}`);

  // Old index-offset method for comparison (what the app used to do)
  const oldBeta = (() => {
    const f3 = fundG.navs.slice(-756), b3 = benchG.navs.slice(-756);
    const fR = [], bR = [];
    for (let i = 1; i < f3.length; i++) fR.push((f3[i] - f3[i-1]) / f3[i-1]);
    for (let i = 1; i < b3.length; i++) bR.push((b3[i] - b3[i-1]) / b3[i-1]);
    const n = Math.min(fR.length, bR.length);
    const fr = fR.slice(-n), br = bR.slice(-n);
    const mean = a => a.reduce((s, v) => s + v, 0) / a.length;
    const fm = mean(fr), bm = mean(br);
    let cov = 0, bv = 0;
    for (let i = 0; i < n; i++) { cov += (fr[i]-fm)*(br[i]-bm); bv += (br[i]-bm)**2; }
    return cov / bv;
  })();
  ok(Math.abs(mg.beta - BETA) < Math.abs(oldBeta - BETA),
     'date-aligned beta beats index-offset beta',
     `new err ${(mg.beta - BETA).toFixed(3)} vs old err ${(oldBeta - BETA).toFixed(3)}`);
}

/* ── 4. calendar CAGR ───────────────────────────────────────── */
console.log('calendar CAGR');
{
  const grid5 = bizDays(Date.UTC(2020, 0, 6), 1300);   // ~5 years
  const t0 = grid5[0];
  const rows = grid5.map(t => ({ t, nav: 100 * Math.pow(2, (t - t0) / (2 * 365.25 * DAY)) }));
  const s = S.toSeries(toApi(rows));
  ok(near(S.cagr(s, 2), 41.42, 0.5), '2Y CAGR of doubling-in-2y ≈ 41.42%', `got ${S.cagr(s, 2)}`);
  ok(S.cagr(s, 10) === null, '10Y CAGR on 5y history → null');
  // gaps don't break it
  const gappy = S.toSeries(toApi(rows.filter((_, i) => i % 9 !== 4)));
  ok(near(S.cagr(gappy, 2), 41.42, 0.5), '2Y CAGR robust to missing days');
}

/* ── 5. rolling + sortino edge cases ────────────────────────── */
console.log('rolling & sortino');
{
  const grid4 = bizDays(Date.UTC(2021, 0, 4), 1050);
  const rows = grid4.map((t, i) => ({ t, nav: 100 * Math.pow(1.0004, i) })); // monotonic up
  const s = S.toSeries(toApi(rows));
  const roll = S.rolling(s);
  ok(roll !== null && roll.hitRate === 100, 'monotonic fund → 100% hit rate', JSON.stringify(roll));
  const m = S.compute(s, s);
  ok(m !== null && m.sortino >= 0 && m.sortino <= 10, 'zero-downside sortino finite & capped',
     `got ${m && m.sortino}`);
}

/* ── 6. normaliseCat: ranking, stars, debt beta target ──────── */
console.log('normaliseCat');
{
  const mk = (sharpe, beta, cat) => ({
    cat, metrics: { sharpe, alpha: sharpe * 2, sortino: sharpe, stdDev: 12, beta,
      rolling: { avg: sharpe * 5, hitRate: 50 + sharpe * 10 },
      cagr: {}, score: null, stars: null }
  });
  const entries = [];
  for (let i = 0; i < 20; i++) entries.push(mk(-1 + i * 0.2, 1.0, 'Large Cap'));
  S.normaliseCat(entries);
  ok(entries[19].metrics.stars === 5 && entries[19].metrics.score === 100, 'best fund → 5★ / 100');
  ok(entries[0].metrics.stars === 1 && entries[0].metrics.score === 0, 'worst fund → 1★ / 0');
  const dist = [1,2,3,4,5].map(s => entries.filter(e => e.metrics.stars === s).length);
  ok(dist.join(',') === '2,4,7,5,2', 'Morningstar-style distribution', dist.join(','));
  ok(entries[10].metrics.pillars && [1,2,3].includes(entries[10].metrics.pillars.ret),
     'pillars populated');

  // Debt: beta ≈ 1 (tracks its debt benchmark) must outrank beta ≈ 0 twin
  const d1 = mk(1.0, 1.0, 'Liquid'), d0 = mk(1.0, 0.0, 'Liquid');
  S.normaliseCat([d1, d0]);
  ok(d1.metrics.score > d0.metrics.score, 'debt fund tracking benchmark (β≈1) ranks higher');
}

/* ── 7. Phase 2: 5y blend window ────────────────────────────── */
console.log('3y+5y blend window');
{
  const grid6 = bizDays(Date.UTC(2020, 0, 6), 1560);   // ~6 years
  let bnav = 100, fnav = 100;
  const brows = [{ t: grid6[0], nav: bnav }], frows = [{ t: grid6[0], nav: fnav }];
  for (let k = 1; k < grid6.length; k++) {
    const rb = 0.0004 + 0.003 * Math.sin(2 * Math.PI * k / 40);
    bnav *= 1 + rb; fnav *= 1 + rb + 0.0001;
    brows.push({ t: grid6[k], nav: bnav }); frows.push({ t: grid6[k], nav: fnav });
  }
  const m6 = S.compute(S.toSeries(toApi(frows)), S.toSeries(toApi(brows)));
  ok(m6 !== null && m6.w5 !== null && isFinite(m6.w5.sharpe), '6y history → w5 stats present');
  ok(m6.window === '5Y', 'window tag = 5Y', m6 && m6.window);

  const short = 700; // ~2.8y — below both 5y and 3y thresholds? (3y tag needs ≥600)
  const mS = S.compute(S.toSeries(toApi(frows.slice(-short))), S.toSeries(toApi(brows.slice(-short))));
  ok(mS !== null && mS.w5 === null && mS.window === '3Y', '~2.8y history → no w5, tag 3Y',
     mS && mS.window);

  // Blend affects ranking: X's strong 5y record outranks Y's slightly better 3y
  const mk5 = (s3, w5s) => ({ cat: 'Large Cap', metrics: {
    sharpe: s3, alpha: 0, sortino: s3, stdDev: 15, beta: 1,
    w5: w5s == null ? null : { sharpe: w5s, alpha: 0, sortino: w5s, stdDev: 15, beta: 1 },
    rolling: { avg: 10, hitRate: 50 }, cagr: {}, score: null, stars: null } });
  const X = mk5(1.0, 3.0), Y = mk5(1.2, null), Z = mk5(0.5, 0.5);
  S.normaliseCat([X, Y, Z]);
  ok(X.metrics.score > Y.metrics.score, 'strong 5y record outweighs slightly better 3y',
     `X=${X.metrics.score} Y=${Y.metrics.score}`);
}

/* ── 8. Phase 2: benchmark-relative hit rate ────────────────── */
console.log('benchmark-relative hit rate');
{
  const grid4 = bizDays(Date.UTC(2021, 0, 4), 1050);
  const mkRows = g => grid4.map((t, i) => ({ t, nav: 100 * Math.pow(g, i) }));
  const fund  = S.toSeries(toApi(mkRows(1.0004)));  // +10%/yr — positive
  const bench = S.toSeries(toApi(mkRows(1.0006)));  // +16%/yr — stronger
  const rVs = S.rolling(fund, bench);
  ok(rVs !== null && rVs.hitRate === 0, 'positive fund losing to benchmark → 0% hit rate',
     rVs && rVs.hitRate);
  const rAbs = S.rolling(fund, null);
  ok(rAbs !== null && rAbs.hitRate === 100, 'no benchmark → falls back to >0 test');
  const rWin = S.rolling(bench, fund);
  ok(rWin !== null && rWin.hitRate === 100, 'fund beating benchmark → 100% hit rate');
}

/* ── 9. Phase 2: category caveats ───────────────────────────── */
console.log('category caveats');
{
  ok(S.categoryCaveats('Sectoral', 50).join(',') === 'sector-fad', 'Sectoral → sector-fad');
  ok(S.categoryCaveats('Gilt', 5).join(',') === 'debt-credit,small-peers',
     'small Gilt → debt-credit + small-peers');
  ok(S.categoryCaveats('Large Cap', 50).length === 0, 'big equity category → no caveats');
}

/* ── 10. Not-Rated gate: young funds excluded from stars ────── */
console.log('not-rated gate');
{
  const mkR = (sharpe, rolling, win) => ({ cat: 'Large Cap', metrics: {
    sharpe, alpha: sharpe, sortino: sharpe, stdDev: 15, beta: 1, w5: null,
    window: win, rolling, cagr: {}, score: 3, stars: 3 } }); // pre-set stars to prove reset
  const young  = mkR(4.0, null, '<3Y');                     // hot 6-month NFO
  const young2 = mkR(3.5, null, '3Y');                      // no rolling data
  const olds   = [0.5, 1.0, 1.5].map(s => mkR(s, { avg: 10, hitRate: 55 }, '3Y'));
  S.normaliseCat([young, young2, ...olds]);
  ok(young.metrics.stars === null && young.metrics.score === null,
     'hot young fund gets no stars despite best sharpe');
  ok(young2.metrics.stars === null, 'fund without rolling data gets no stars');
  ok(olds.every(o => o.metrics.stars !== null), 'seasoned funds still rated');
  ok(olds[2].metrics.score === 100, 'best seasoned fund still tops the rated pool');
}

/* ── 11. align ──────────────────────────────────────────────── */
console.log('align');
{
  const a = { dates: [1, 2, 3, 5].map(d => d * DAY), navs: [10, 11, 12, 13] };
  const b = { dates: [2, 3, 4, 5].map(d => d * DAY), navs: [20, 21, 22, 23] };
  const al = S.align(a, b);
  ok(al.dates.length === 3 && al.f.join(',') === '11,12,13' && al.b.join(',') === '20,21,23',
     'intersects on shared dates only');
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
