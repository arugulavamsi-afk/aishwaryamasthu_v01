/* ================================================================
   MF SCORING CORE — single source of truth for all fund metrics.
   Used by BOTH:
     • public/mf-explorer.js        (browser, global `MFScoring`)
     • scripts/compute-mf-scores.js (Node, `require`)
   Any change here changes precomputed AND live scores identically.

   v1 (date-aligned rewrite):
     1. Fund vs benchmark returns are DATE-ALIGNED — daily returns are
        computed only over NAV dates both series share. The previous
        index-offset alignment corrupted beta/alpha for any fund with
        missing NAV days.
     2. CAGR and rolling returns are CALENDAR-BASED — the past NAV is
        located by date (±15-day tolerance), and annualisation uses the
        actual elapsed time, not an assumed 252 rows/year.
     3. Sortino zero-downside fallback is a capped, non-negative value
        instead of the old `sharpe * 2`.
     4. Debt-like beta targets 1.0 (was 0) — benchmarks are now genuine
        same-asset-class funds, so a fund tracking its category
        benchmark correctly shows beta ≈ 1.

   v2 (methodology):
     5. Score blends 60% 3-year + 40% 5-year risk stats when ≥5 years
        of shared history exists (metrics.w5 / metrics.window).
     6. Rolling hit rate is BENCHMARK-RELATIVE: % of 3Y windows where
        the fund beat its category benchmark (was: % positive).
     7. categoryCaveats() exposes trust flags (sector-fad, debt-credit,
        small-peers) for the UI and the nightly data feed.
   ================================================================ */
(function (root, factory) {
    if (typeof module === 'object' && module.exports) module.exports = factory();
    else root.MFScoring = factory();
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    var RF_RATE = 0.065;           // India 91-day T-bill / repo proxy
    var DAY_MS  = 86400000;
    var YEAR_MS = 365.25 * DAY_MS;
    var DATE_TOL_MS = 15 * DAY_MS; // nearest-NAV lookup tolerance

    /* Categories whose funds are debt-like for scoring baselines */
    var DEBT_CATS = ['Debt', 'Liquid', 'Overnight', 'Ultra Short', 'Money Market',
        'Short Duration', 'Medium Duration', 'Corporate Bond', 'Banking & PSU Debt',
        'Gilt', 'Dynamic Bond', 'Arbitrage'];

    /* ── 'dd-mm-yyyy' → UTC ms (mfapi.in date format) ── */
    function parseDate(s) {
        if (!s || s.length < 10) return null;
        var d = +s.slice(0, 2), m = +s.slice(3, 5), y = +s.slice(6, 10);
        if (!d || !m || !y) return null;
        return Date.UTC(y, m - 1, d);
    }

    /* ── mfapi.in payload → chronological { dates:[ms], navs:[num] } ──
       Accepts the full API response object ({data:[{date,nav},...]}) or
       the data array itself. Input is newest-first; output is ascending,
       de-duplicated by date, NaN NAVs dropped. */
    function toSeries(apiData) {
        var rows = Array.isArray(apiData) ? apiData : (apiData && apiData.data) || [];
        var dates = [], navs = [];
        for (var i = rows.length - 1; i >= 0; i--) {          // oldest → newest
            var nav = parseFloat(rows[i].nav);
            var t   = parseDate(rows[i].date);
            if (isNaN(nav) || t === null) continue;
            if (dates.length && t <= dates[dates.length - 1]) continue; // dupes / disorder
            dates.push(t); navs.push(nav);
        }
        return { dates: dates, navs: navs };
    }

    /* ── binary search: index of the date nearest to target ── */
    function idxNearest(dates, target) {
        var lo = 0, hi = dates.length - 1;
        if (hi < 0) return -1;
        while (lo < hi) {
            var mid = (lo + hi) >> 1;
            if (dates[mid] < target) lo = mid + 1; else hi = mid;
        }
        if (lo > 0 && Math.abs(dates[lo - 1] - target) < Math.abs(dates[lo] - target)) lo--;
        return lo;
    }

    /* ── intersect two series on shared NAV dates (ascending) ── */
    function align(fund, bench) {
        var bmap = {};
        for (var i = 0; i < bench.dates.length; i++) bmap[bench.dates[i]] = bench.navs[i];
        var dates = [], f = [], b = [];
        for (var j = 0; j < fund.dates.length; j++) {
            var t = fund.dates[j];
            if (bmap[t] !== undefined) { dates.push(t); f.push(fund.navs[j]); b.push(bmap[t]); }
        }
        return { dates: dates, f: f, b: b };
    }

    /* ── calendar-based CAGR over `years`, ±15-day date tolerance ── */
    function cagr(series, years) {
        var n = series.dates.length;
        if (n < 2) return null;
        var endD = series.dates[n - 1], endNav = series.navs[n - 1];
        var target = endD - years * YEAR_MS;
        var i = idxNearest(series.dates, target);
        if (i < 0 || Math.abs(series.dates[i] - target) > DATE_TOL_MS) return null;
        var past = series.navs[i];
        // Sanity: NAV < ₹1 is likely a segregated-portfolio fragment / NAV reset
        if (!past || past < 1 || !endNav || endNav <= 0) return null;
        var yrs = (endD - series.dates[i]) / YEAR_MS;
        if (yrs < years * 0.9) return null;
        var c = Math.pow(endNav / past, 1 / yrs) - 1;
        // Cap ±80% — beyond this is almost certainly a data artefact
        if (!isFinite(c) || Math.abs(c) > 0.80) return null;
        return +(c * 100).toFixed(2);
    }

    /* ── 3-year rolling returns, ~monthly steps, calendar-annualised ──
       hitRate = % of windows where the fund BEAT its category benchmark
       over the same dates (falls back to "> 0" for windows the benchmark's
       history doesn't cover). avg = fund's own annualised window average.
       Returns { avg %, hitRate % } or null. */
    function rolling(series, bench) {
        var n = series.dates.length;
        if (n < 100) return null;
        var out = [], hits = 0;
        var haveBench = bench && bench.dates && bench.dates.length > 30;
        for (var end = n - 1; end >= 0; end -= 21) {
            var target = series.dates[end] - 3 * YEAR_MS;
            if (series.dates[0] > target + DATE_TOL_MS) break; // ran out of history
            var i = idxNearest(series.dates, target);
            if (i < 0 || Math.abs(series.dates[i] - target) > DATE_TOL_MS) continue;
            var yrs = (series.dates[end] - series.dates[i]) / YEAR_MS;
            if (yrs < 2.7) continue;
            if (series.navs[i] <= 0 || series.navs[end] <= 0) continue;
            var r = Math.pow(series.navs[end] / series.navs[i], 1 / yrs) - 1;
            if (!isFinite(r) || Math.abs(r) >= 2) continue;

            // Benchmark return over the same window (nearest bench NAVs)
            var hurdle = 0; // default: positive-return test
            if (haveBench) {
                var bs = idxNearest(bench.dates, series.dates[i]);
                var be = idxNearest(bench.dates, series.dates[end]);
                if (bs >= 0 && be >= 0 && be > bs
                    && Math.abs(bench.dates[bs] - series.dates[i])  <= DATE_TOL_MS
                    && Math.abs(bench.dates[be] - series.dates[end]) <= DATE_TOL_MS
                    && bench.navs[bs] > 0 && bench.navs[be] > 0) {
                    var byrs = (bench.dates[be] - bench.dates[bs]) / YEAR_MS;
                    var br = Math.pow(bench.navs[be] / bench.navs[bs], 1 / byrs) - 1;
                    if (isFinite(br)) hurdle = br;
                }
            }
            out.push(r * 100);
            if (r > hurdle) hits++;
        }
        if (out.length < 5) return null;
        var avg = out.reduce(function (s, v) { return s + v; }, 0) / out.length;
        return { avg: +avg.toFixed(2), hitRate: +(hits / out.length * 100).toFixed(1) };
    }

    /* ── risk stats over the last `maxDays` aligned trading days ── */
    function statsFor(al, maxDays) {
        var len = al.dates.length;
        var start = Math.max(0, len - maxDays);
        var fw = al.f.slice(start), bw = al.b.slice(start);

        var navMin = Infinity, navMax = -Infinity;
        for (var i = 0; i < fw.length; i++) {
            if (fw[i] < navMin) navMin = fw[i];
            if (fw[i] > navMax) navMax = fw[i];
        }
        if (navMin < 0.5 || navMax < 1) return null; // segregated remnant / reset

        var fr = [], br = [];
        for (var j = 1; j < fw.length; j++) {
            var rf = (fw[j] - fw[j - 1]) / fw[j - 1];
            var rb = (bw[j] - bw[j - 1]) / bw[j - 1];
            if (isFinite(rf) && isFinite(rb)) { fr.push(rf); br.push(rb); }
        }
        var n = fr.length;
        if (n < 20) return null;

        var fm = 0, bm = 0;
        for (i = 0; i < n; i++) { fm += fr[i]; bm += br[i]; }
        fm /= n; bm /= n;
        var fv = 0, bv = 0, cov = 0;
        for (i = 0; i < n; i++) {
            var df = fr[i] - fm, db = br[i] - bm;
            fv += df * df; bv += db * db; cov += df * db;
        }
        fv /= n; bv /= n; cov /= n;
        var fs = Math.sqrt(fv);
        if (!isFinite(fm) || !isFinite(fs) || fs === 0) return null;

        var aFM = fm * 252, aFS = fs * Math.sqrt(252);
        var beta = (isFinite(bv) && bv > 1e-10) ? cov / bv : 1.0;
        var rfD = RF_RATE / 252;
        var alpha  = (aFM - RF_RATE) - beta * (bm * 252 - RF_RATE);
        var sharpe = aFS > 0 ? (aFM - RF_RATE) / aFS : 0;
        var dVar = 0, dn = 0;
        for (i = 0; i < n; i++) if (fr[i] < rfD) { dVar += (fr[i] - rfD) * (fr[i] - rfD); dn++; }
        dVar = dn > 0 ? dVar / n : 0;
        var ds = Math.sqrt(dVar) * Math.sqrt(252);
        // Zero-downside fallback: capped, never negative-doubled
        var sortino = ds > 0.0001 ? (aFM - RF_RATE) / ds
                                  : Math.min(10, Math.max(0, sharpe) * 2);
        var clamp = function (v, lo, hi) { return Math.min(hi, Math.max(lo, v)); };

        var s = {
            stdDev:  +clamp(aFS * 100,   0, 60).toFixed(2),
            beta:    +clamp(beta,       -2,  3).toFixed(2),
            alpha:   +clamp(alpha * 100, -30, 30).toFixed(2),
            sharpe:  +clamp(sharpe,     -3,  5).toFixed(2),
            sortino: +clamp(sortino,    -3, 10).toFixed(2)
        };
        var ks = ['stdDev', 'beta', 'alpha', 'sharpe', 'sortino'];
        for (i = 0; i < ks.length; i++) if (!isFinite(s[ks[i]])) return null;
        return s;
    }

    /* ── full metric computation: fund series vs benchmark series ──
       Displayed risk metrics come from the 3-year window (last 756 shared
       trading days). When ≥ ~5 years of shared history exists, a second
       5-year window (`w5`) is computed and the SCORE blends 60% 3y + 40% 5y
       (Morningstar-style) so one hot 3-year stretch can't dominate.
       `window` tags the rating basis: '5Y', '3Y', or '<3Y'. */
    var DAYS_3Y = 756, DAYS_5Y = 1260, MIN_5Y = 1200, MIN_3Y = 600;
    function compute(fundSeries, benchSeries) {
        var al = align(fundSeries, benchSeries);
        var len = al.dates.length;
        if (len < 30) return null;

        var s3 = statsFor(al, DAYS_3Y);
        if (!s3) return null;
        var w5 = len >= MIN_5Y ? statsFor(al, DAYS_5Y) : null;

        var m = {
            stdDev:  s3.stdDev,
            beta:    s3.beta,
            alpha:   s3.alpha,
            sharpe:  s3.sharpe,
            sortino: s3.sortino,
            w5:      w5,                              // 5y stats or null
            window:  w5 ? '5Y' : (len >= MIN_3Y ? '3Y' : '<3Y'),
            rolling: rolling(fundSeries, benchSeries), // benchmark-relative hit rate
            cagr: {
                y1:  cagr(fundSeries, 1),
                y3:  cagr(fundSeries, 3),
                y5:  cagr(fundSeries, 5),
                y10: cagr(fundSeries, 10)
            },
            score: null,
            stars: null
        };
        return m;
    }

    /* ══════════════════════════════════════════════════════════
       SCORING — 1–5 tiers by percentile (Morningstar distribution)
       WEIGHTS:
         Rolling HitRate 25% · Sharpe 20% · Alpha 20% · Rolling Avg 15%
         Sortino 10% · Std Dev 7% · Beta 3%
       entries: [{ key, cat, metrics }] — mutates metrics in place,
       setting .stars (1–5), .score (0–100), .pillars {ret,safe,cons}.
    ══════════════════════════════════════════════════════════ */
    function normaliseCat(entries) {
        /* NOT-RATED GATE (Morningstar-style): stars require a full ~3-year
           record. `rolling === null` means under ~3 years of NAV history;
           window '<3Y' means too little shared benchmark history. Young funds
           previously topped lists because annualised short-window stats are
           inflated and their missing hit rate defaulted to a neutral 0.5.
           Unrated funds keep raw metrics but stars/score stay null and they
           are EXCLUDED from the percentile pool so they can't distort peers. */
        var valid = [];
        entries.forEach(function (e) {
            if (!e || !e.metrics) return;
            if (!e.metrics.rolling || e.metrics.window === '<3Y') {
                e.metrics.stars = null; e.metrics.score = null; e.metrics.pillars = null;
                return;
            }
            valid.push(e);
        });
        if (!valid.length) return;

        /* Blended metric: 60% 3y + 40% 5y when a 5y window exists.
           Funds without 5y history are scored on 3y alone — same peer pool,
           tagged via metrics.window so the UI can disclose the basis. */
        var bl = function (m, k) {
            return (m.w5 && isFinite(m.w5[k])) ? 0.6 * m[k] + 0.4 * m.w5[k] : m[k];
        };

        var scored = [];
        valid.forEach(function (e) {
            var m = e.metrics;
            if (!isFinite(m.sharpe) || !isFinite(m.alpha) || !isFinite(m.sortino)
                || !isFinite(m.stdDev) || !isFinite(m.beta)) return;
            var isDebt = DEBT_CATS.indexOf(e.cat) !== -1;
            var isGold = e.cat === 'Commodity';

            var sh = Math.max(-3, Math.min(5, bl(m, 'sharpe')));
            var al = Math.max(-15, Math.min(15, bl(m, 'alpha'))) / 5;
            var so = Math.max(-3, Math.min(6, bl(m, 'sortino')));
            var sdBaseline = isDebt ? 8 : (isGold ? 25 : 30);
            var sdScore = Math.max(0, (sdBaseline - bl(m, 'stdDev')) / sdBaseline);
            // Beta target is 1.0 for ALL categories: benchmarks are genuine
            // same-asset-class funds, so tracking ≈ 1. Debt uses a tighter band.
            var bScore = isDebt
                ? Math.max(0, 1 - Math.abs(bl(m, 'beta') - 1.0))
                : Math.max(0, 1.5 - Math.abs(bl(m, 'beta') - 1.0));
            var rHit = m.rolling ? Math.max(0, Math.min(100, m.rolling.hitRate)) / 100 : 0.5;
            var rAvg = m.rolling ? Math.max(-20, Math.min(20, m.rolling.avg)) / 20 : 0;

            var raw = rHit * 0.25 + sh * 0.20 + al * 0.20 + rAvg * 0.15
                    + so * 0.10 + sdScore * 0.07 + bScore * 0.03;
            if (isFinite(raw)) scored.push({ e: e, raw: raw, sdB: sdBaseline });
        });
        if (!scored.length) return;

        scored.sort(function (a, b) { return a.raw - b.raw; });
        var total = scored.length;
        scored.forEach(function (s, idx) {
            var pct = (idx + 1) / total;
            s.e.metrics.stars = pct <= 0.10 ? 1 : pct <= 0.325 ? 2
                              : pct <= 0.675 ? 3 : pct <= 0.90 ? 4 : 5;
            s.e.metrics.score = Math.round((idx / Math.max(total - 1, 1)) * 100);
        });

        /* 3-pillar grades (1=Weak 2=Fair 3=Strong), category-relative,
           using the same 3y/5y blended values as the score */
        var pArr = scored.map(function (s) {
            var m = s.e.metrics;
            return {
                e:    s.e,
                ret:  Math.max(-15, Math.min(15, bl(m, 'alpha'))) / 5
                      + (m.rolling ? Math.max(-20, Math.min(20, m.rolling.avg)) / 20 : 0),
                safe: Math.max(-3, Math.min(5, bl(m, 'sharpe')))
                      + Math.max(-3, Math.min(6, bl(m, 'sortino')))
                      + Math.max(0, (s.sdB - bl(m, 'stdDev')) / s.sdB),
                cons: m.rolling ? Math.max(0, Math.min(100, m.rolling.hitRate)) / 100 : 0.5
            };
        });
        ['ret', 'safe', 'cons'].forEach(function (pillar) {
            var sorted = pArr.slice().sort(function (a, b) { return a[pillar] - b[pillar]; });
            var n = sorted.length;
            sorted.forEach(function (row, i) {
                if (!row.e.metrics.pillars) row.e.metrics.pillars = {};
                var p = (i + 1) / n;
                row.e.metrics.pillars[pillar] = p <= 0.33 ? 1 : p <= 0.67 ? 2 : 3;
            });
        });
    }

    /* ── Category-level trust caveats for the UI / data feed ──
       Codes (not display strings — UI translates via i18n):
         'sector-fad'   concentrated theme; relative rank can crown the best
                        fund of a bad idea
         'debt-credit'  NAV-based metrics cannot see credit/default risk
         'small-peers'  < 10 rated peers; percentile tiers are unstable */
    function categoryCaveats(cat, peerCount) {
        var out = [];
        if (cat === 'Sectoral') out.push('sector-fad');
        if (DEBT_CATS.indexOf(cat) !== -1) out.push('debt-credit');
        if (typeof peerCount === 'number' && peerCount > 0 && peerCount < 10) out.push('small-peers');
        return out;
    }

    return {
        RF_RATE: RF_RATE,
        DEBT_CATS: DEBT_CATS,
        categoryCaveats: categoryCaveats,
        parseDate: parseDate,
        toSeries: toSeries,
        align: align,
        cagr: cagr,
        rolling: rolling,
        compute: compute,
        normaliseCat: normaliseCat
    };
}));
