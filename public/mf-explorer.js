    /* ================================================================
       MF EXPLORER — Option A: AMFI list → filter → per-category scoring
       ---------------------------------------------------------------
       Step 1 (once, ~2s)  : GET mfapi.in/mf → parse + filter to
                             top-AMC Direct plans. Render category pills.
       Step 2 (on cat select, ~3-5s) : GET /latest for each fund in
                             that category → render table with NAV.
       Step 3 (after step 2, ~15-25s): GET full history per fund in
                             batches of 8 → compute metrics → normalise
                             scores 0-100 within category → auto-sort.
       Cache: steps 2+3 results stored per category in session.
    ================================================================ */

    const MFE_TOP_AMCS = [
        'sbi','hdfc','icici','axis','kotak','mirae','nippon','uti','dsp',
        'franklin','tata','aditya birla','absl','canara','parag parikh',
        'ppfas','edelweiss','motilal','quant','invesco','idfc','bandhan',
        'baroda','sundaram','pgim','mahindra','whiteoak','bajaj','360 one',
        'jm','lic','navi','samco','quantum','nj'
    ];

    /* ══════════════════════════════════════════════════════════════
       EXPENSE RATIO
       The old static per-scheme TER table was removed: most of its keys
       (e.g. '120716_lc') could never match a real scheme code, so funds
       silently fell back to medians while appearing fund-specific.
       Honest replacement:
         1. Per-fund TER from mf-data.json (`ter` field) when the nightly
            pipeline has real data (see scripts/ter-data.json) — exact.
         2. Otherwise category-median ESTIMATE, always marked "~" in UI.
    ══════════════════════════════════════════════════════════════ */
    let _mfeTerMap = {}; // code → TER % (real data from mf-data.json)

    /* Category-median Direct-plan TER estimates (fallback only) */
    const MFE_ER_CAT_MEDIAN = {
        'Index':0.20,'Large Cap':0.75,'Large & Mid Cap':0.80,'Mid Cap':0.72,
        'Small Cap':0.72,'Multi Cap':0.80,'Flexi Cap':0.75,'Focused':0.75,
        'Value/Contra':0.75,'ELSS':0.72,'Aggressive Hybrid':0.85,
        'Conservative Hybrid':0.65,'Balanced Advantage':0.75,'Multi Asset':0.80,
        'Hybrid':0.75,'Arbitrage':0.40,'Liquid':0.18,'Overnight':0.10,
        'Ultra Short':0.35,'Money Market':0.25,'Short Duration':0.35,
        'Medium Duration':0.45,'Corporate Bond':0.32,'Banking & PSU Debt':0.35,
        'Gilt':0.45,'Dynamic Bond':0.45,'Debt':0.38,'Sectoral':0.75,
        'International':0.88,'Commodity':0.35,'Solution':0.85,'FoF':0.50,'Other':0.80
    };
    function mfeGetER(code, cat) {
        const real = _mfeTerMap[String(code)];
        if (real != null && isFinite(real)) return { val: real, estimated: false };
        const med = MFE_ER_CAT_MEDIAN[cat];
        return med != null ? { val: med, estimated: true } : null;
    }

    /* Category ER benchmarks — colour thresholds
       Good  = ≤ 60% of benchmark  |  Avg = ≤ benchmark  |  Bad = above benchmark
       Benchmarks reflect SEBI-regulated category averages for Direct plans (FY24).
         Index / ETF:      0.30% — passive; anything above 0.30% is expensive
         Liquid:           0.20% — near-zero duration; 0.20% is market average
         Debt:             0.50% — active duration management justifies modest cost
         Overnight:        0.15% — near T-bill; should be ultra-cheap
         Arbitrage:        0.50% — mechanistic strategy; low skill premium
         Large Cap active: 1.00% — SEBI TER cap allows up to 1.05%
         Mid Cap:          1.10% — slightly higher for research-intensive segment
         Small Cap:        1.20% — highest research cost; SEBI cap ~1.2%
         Flexi/ELSS:       1.00% — similar to large cap mandate
         Hybrid:           1.00% — blended mandate
         Sectoral:         1.20% — concentrated, research-heavy
         International:    1.20% — FoF structure adds layer; includes underlying fund cost
         Commodity/Gold:   0.40% — passive tracking; anything above 0.40% is high
    */
    const MFE_ER_BENCH = {
        'Index':         0.30,   // passive — >0.30% is expensive
        'Large Cap':     1.00,
        'Large & Mid Cap':1.00,  // same SEBI TER cap as Large Cap
        'Multi Cap':     1.00,   // active multi-cap — SEBI cap ~1.05%
        'Mid Cap':       1.10,
        'Small Cap':     1.20,
        'Flexi Cap':     1.00,
        'ELSS':          1.00,
        'Hybrid':        1.00,
        'Debt':          0.50,   // active debt — >0.50% is high
        'Liquid':        0.20,   // near-zero duration — ultra-cheap expected
        'Arbitrage':     0.50,   // mechanistic — no skill premium justified above 0.50%
        'Sectoral':      1.20,
        'International': 1.20,
        'Commodity':     0.40,   // gold/commodity ETF tracking — >0.40% is expensive
    };

    /* ══════════════════════════════════════════════════════════════
       PER-CATEGORY BENCHMARKS  (mfapi.in scheme codes)
       Each category uses the most appropriate available proxy.
       Rationale:
         Large Cap    → Nifty 100           (SEBI top-100 universe; NOT Nifty 50)
         Large & Mid Cap→ Nifty 500 proxy   (ideal: LargeMidcap 250; Nifty 500 is broader proxy
                                             than Nifty 100 — verify LMC 250 fund code & swap)
         Mid Cap      → Nifty Midcap 150    (SEBI-mandated 101–250 range) ✓
         Small Cap    → Nifty Smallcap 250  (SEBI-mandated 251+ range) ✓
         Multi Cap    → Nifty 500           (best available proxy; ideal: Nifty 500 Multicap 50:25:25)
         Flexi Cap    → Nifty 500           (no market-cap floor; broadest index)
         ELSS         → Nifty 500           (no market-cap mandate; multi-cap in practice)
         Index        → Nifty 50            (most index funds track Nifty 50; per-fund would be ideal)
         Aggressive Hybrid → ICICI Pru BAF  (65/35 blended; Nifty 500 alone overstates equity risk)
         Conservative Hybrid → Overnight    (⚠ gap: short-duration debt fund would be better)
         Balanced Advantage → ICICI Pru BAF (dynamic equity+debt blend)
         Multi Asset  → ICICI Pru BAF       (equity+debt component; Nifty 500 was equity-only)
         Sectoral     → Nifty 500 fallback  (sub-sector ETFs used where available — see SUBSECT)
         International→ Motilal S&P 500 INR (US-focused; domestic index comparison meaningless)
         Debt/Liquid/Arbitrage → Overnight  (duration-neutral baseline; avoid circular benchmark)
         Gilt         → Overnight           (⚠ CRITICAL GAP: overnight ≠ long G-Sec duration;
                                             replace with a verified long G-Sec fund code)
         Commodity    → Nippon Gold ETF     (same asset class; measures tracking efficiency)
    ══════════════════════════════════════════════════════════════ */
    /* ALL codes verified live against api.mfapi.in/{code}/latest on 2026-08-01.
       The previous table pointed at wrong or dead schemes (136094 was an HDFC
       Retirement EQUITY plan used as the benchmark for every debt category;
       148942 was a matured SBI FMP used as "Nifty 500"). Re-verify any code
       against /latest before changing it. */
    const MFE_CAT_BENCH = {
        // ── Equity ──────────────────────────────────────────────
        'Large Cap':       '147666', // Axis Nifty 100 Index Direct Growth ✓
        'Large & Mid Cap': '147625', // Motilal Nifty 500 Index Direct ✓ (LMC 250 proxy)
        'Mid Cap':         '147622', // Motilal Nifty Midcap 150 Index Direct ✓
        'Small Cap':       '147623', // Motilal Nifty Smallcap 250 Index Direct ✓
        'Multi Cap':       '147625', // Motilal Nifty 500 Index Direct ✓
        'Flexi Cap':       '147625', // Motilal Nifty 500 Index Direct ✓
        'Focused':         '147625', // Motilal Nifty 500 Index Direct ✓
        'Value/Contra':    '147625', // Motilal Nifty 500 Index Direct ✓
        'ELSS':            '147625', // Motilal Nifty 500 Index Direct ✓
        'Index':           '120716', // UTI Nifty 50 Index Direct ✓
        // ── Hybrid ──────────────────────────────────────────────
        'Aggressive Hybrid':    '120377', // ICICI Pru Balanced Advantage Direct Growth ✓
        'Conservative Hybrid':  '148800', // Nippon Nifty 5yr G-Sec ETF ✓ (debt-heavy proxy)
        'Balanced Advantage':   '120377', // ICICI Pru Balanced Advantage Direct Growth ✓
        'Multi Asset':          '120377', // ICICI Pru Balanced Advantage Direct Growth ✓
        'Hybrid':               '120377', // ICICI Pru Balanced Advantage Direct Growth ✓
        // ── Debt ────────────────────────────────────────────────
        'Liquid':               '119833', // SBI Overnight Direct Growth ✓
        'Overnight':            '119833', // SBI Overnight Direct Growth ✓
        'Ultra Short':          '119833', // SBI Overnight Direct Growth ✓ (duration proxy)
        'Money Market':         '119833', // SBI Overnight Direct Growth ✓ (duration proxy)
        'Short Duration':       '148800', // Nippon Nifty 5yr G-Sec ETF ✓ (duration proxy)
        'Medium Duration':      '148800', // Nippon Nifty 5yr G-Sec ETF ✓
        'Corporate Bond':       '148800', // Nippon Nifty 5yr G-Sec ETF ✓ (no credit index avail.)
        'Banking & PSU Debt':   '148800', // Nippon Nifty 5yr G-Sec ETF ✓
        'Gilt':                 '133307', // LIC Nifty 8-13yr G-Sec ETF ✓ (long-duration match)
        'Dynamic Bond':         '148800', // Nippon Nifty 5yr G-Sec ETF ✓
        'Debt':                 '148800', // Nippon Nifty 5yr G-Sec ETF ✓
        'Arbitrage':            '119833', // SBI Overnight Direct Growth ✓ (arbitrage ≈ repo)
        // ── Others ──────────────────────────────────────────────
        'Sectoral':        '147625', // Motilal Nifty 500 Index Direct ✓ (sub-sector codes override)
        'International':   '148381', // Motilal S&P 500 Index Direct Growth ✓
        'Commodity':       '118663', // Nippon Gold Savings Direct Growth ✓
        'Solution':        '147625', // Motilal Nifty 500 Index Direct ✓
        'FoF':             '120716', // UTI Nifty 50 Index Direct ✓
        '_default':        '120716', // UTI Nifty 50 Index Direct ✓
    };

    /* Per-category benchmark cache — values are {dates,navs} series */
    let _mfeCatBenchCache = {}; // cat → series
    let _mfeNifty500Nav  = null; // cached Nifty 500 (Motilal 147625) series
    let _mfeNifty500Ready = false;

    /* Codes that share a pre-cached benchmark — avoids redundant fetches */
    const _MFE_NIFTY50_CODE  = '120716'; // UTI Nifty 50 → cached in _mfeBench at startup
    const _MFE_NIFTY500_CODE = '147625'; // Motilal Nifty 500 → cached in _mfeNifty500Nav on first use

    async function mfeFetchCatBench(cat, signal) {
        if (_mfeCatBenchCache[cat]) return _mfeCatBenchCache[cat];
        const code = MFE_CAT_BENCH[cat] || MFE_CAT_BENCH['_default'];
        // Reuse already-fetched Nifty 50 if this category maps to it
        if (code === _MFE_NIFTY50_CODE && _mfeBenchReady) {
            _mfeCatBenchCache[cat] = _mfeBench;
            return _mfeBench;
        }
        // Reuse already-fetched Nifty 500 if this category maps to it
        if (code === _MFE_NIFTY500_CODE && _mfeNifty500Ready) {
            _mfeCatBenchCache[cat] = _mfeNifty500Nav;
            return _mfeNifty500Nav;
        }
        try {
            const r = await fetch(`https://api.mfapi.in/mf/${code}`,
                { signal: signal || AbortSignal.timeout(20000) });
            if (!r.ok) throw new Error('HTTP ' + r.status);
            const j = await r.json();
            const ser = MFScoring.toSeries(j); // {dates,navs} — date-aligned metrics
            if (ser.navs.length > 30) {
                // If this was a Nifty 500 fetch, cache globally for reuse
                if (code === _MFE_NIFTY500_CODE) {
                    _mfeNifty500Nav   = ser;
                    _mfeNifty500Ready = true;
                }
                _mfeCatBenchCache[cat] = ser;
                return ser;
            }
        } catch {}
        // Fallback to Nifty 50 if fetch fails
        _mfeCatBenchCache[cat] = _mfeBench;
        return _mfeBench;
    }

    const MFE_CAT_BENCH_LABEL = {
        // Equity
        'Large Cap':          'Nifty 100',
        'Large & Mid Cap':    'Nifty 500 proxy (LMC 250)',
        'Mid Cap':            'Nifty Midcap 150',
        'Small Cap':          'Nifty Smallcap 250',
        'Multi Cap':          'Nifty 500',
        'Flexi Cap':          'Nifty 500',
        'Focused':            'Nifty 500',
        'Value/Contra':       'Nifty 500',
        'ELSS':               'Nifty 500',
        'Index':              'Nifty 50 (underlying)',
        // Hybrid
        'Aggressive Hybrid':  'Balanced Advantage proxy',
        'Conservative Hybrid':'5yr G-Sec proxy',
        'Balanced Advantage': 'Balanced Advantage peer',
        'Multi Asset':        'Balanced Advantage proxy',
        'Hybrid':             'Balanced Advantage proxy',
        // Debt
        'Liquid':             'Overnight rate',
        'Overnight':          'Overnight rate',
        'Ultra Short':        'Overnight rate (proxy)',
        'Money Market':       'Overnight rate (proxy)',
        'Short Duration':     '5yr G-Sec (proxy)',
        'Medium Duration':    '5yr G-Sec',
        'Corporate Bond':     '5yr G-Sec (proxy)',
        'Banking & PSU Debt': '5yr G-Sec (proxy)',
        'Gilt':               '8-13yr G-Sec',
        'Dynamic Bond':       '5yr G-Sec',
        'Debt':               '5yr G-Sec (proxy)',
        'Arbitrage':          'Overnight / repo rate',
        // Others
        'Sectoral':           'Nifty 500 (sub-sector specific)',
        'International':      'S&P 500 INR proxy',
        'Commodity':          'Gold ETF proxy',
        'Solution':           'Nifty 500 / Hybrid Benchmark',
        'FoF':                'Depends on underlying fund',
        '_default':           'Nifty 50',
    };

    const MFE_BENCH   = '120716'; // UTI Nifty 50 Index Direct (default)
    let _mfeCagrPeriod = '3Y';
    const MFE_PAGE    = 10;

    /* ── Sectoral sub-sector labels, benchmark metadata & icons ── */
    const MFE_SUBSECT_ORDER = [
        'Banking & Finance','Pharma & Healthcare','Technology',
        'FMCG & Consumption','Transport & Logistics','Infrastructure','Energy & Power',
        'Auto','Realty','Manufacturing','Defence & Aerospace',
        'PSU','Commodities & Resources','MNC','ESG','Thematic'
    ];
    const MFE_SUBSECT_BENCH_LABEL = {
        // Labels reflect the benchmark actually used (Nifty 500 where no
        // sector ETF with a working mfapi code exists — honesty > polish)
        'Banking & Finance':     'Nifty Bank',
        'Transport & Logistics':  'Nifty 500 (proxy)',
        'Pharma & Healthcare':   'Nifty Pharma',
        'Technology':            'Nifty 500 (proxy)',
        'FMCG & Consumption':    'Nifty 500 (proxy)',
        'Infrastructure':        'Nifty 500 (proxy)',
        'Energy & Power':        'Nifty 500 (proxy)',
        'Auto':                  'Nifty 500 (proxy)',
        'Realty':                'Nifty 500 (proxy)',
        'Manufacturing':         'Nifty 500 (proxy)',
        'Defence & Aerospace':   'Nifty 500 (proxy)',
        'PSU':                   'Nifty 500 (proxy)',
        'Commodities & Resources':'Nifty 500 (proxy)',
        'MNC':                   'Nifty 500 (proxy)',
        'ESG':                   'Nifty 500',
        'Thematic':              'Nifty 500',
    };

    /* Per-subsector mfapi.in scheme codes for benchmark NAV fetch
       ✓ = confirmed sectoral ETF on mfapi.in
       ⚠ = using Nifty 500 proxy (148942) — sector-specific ETF code needs verification
    */
    const MFE_SUBSECT_BENCH_CODE = {
        // Verified live 2026-08-01 (old codes pointed at unrelated schemes)
        'Banking & Finance':      '140087', // Nippon India ETF Nifty Bank BeES ✓
        'Pharma & Healthcare':    '149008', // Nippon India Nifty Pharma ETF ✓
        'Technology':             '147625', // Nifty 500 proxy — no working IT ETF code on mfapi
        'FMCG & Consumption':     '147625', // Nifty 500 proxy
        'Infrastructure':         '147625', // Nifty 500 proxy
        'Energy & Power':         '147625', // Nifty 500 proxy
        'Auto':                   '147625', // Nifty 500 proxy
        'Realty':                 '147625', // Nifty 500 proxy
        'Manufacturing':          '147625', // Nifty 500 proxy
        'Defence & Aerospace':    '147625', // Nifty 500 proxy
        'PSU':                    '147625', // Nifty 500 proxy
        'Commodities & Resources':'147625', // Nifty 500 proxy
        'Transport & Logistics':  '147625', // Nifty 500 proxy
        'MNC':                    '147625', // Nifty 500 proxy
        'ESG':                    '147625', // Nifty 500 — no dedicated ESG index ETF available
        'Thematic':               '147625', // Nifty 500 — heterogeneous; no single benchmark
    };
    const MFE_SUBSECT_ICON = {
        'Banking & Finance':'🏦','Pharma & Healthcare':'💊','Technology':'💻',
        'FMCG & Consumption':'🛒','Infrastructure':'🏗️','Energy & Power':'⚡',
        'Auto':'🚗','Realty':'🏢','PSU & Defence':'🛡️','MNC':'🌐',
        'ESG':'🌱','Thematic':'🔬',
    };

    /* Detect sectoral sub-sector from fund name */
    function mfeParseSubSect(n) {
        const nl = n.toLowerCase();

        // THEME-FIRST: specific themes checked before banking
        // so AMC names like "Bank of India", "Bajaj Finserv" don't mis-classify

        // Debt variants — not equity sectoral
        if (/banking.*psu|psu.*bond|psu.*debt/.test(nl)) return 'Thematic';

        // Pharma & Healthcare
        if (/pharma|healthcare|health.?care|medic|hospital|life.?science/.test(nl)) return 'Pharma & Healthcare';

        // Technology
        if (/technology|information.?tech|nifty.?it|software|digital.?india/.test(nl)) return 'Technology';

        // FMCG, Consumption & Consumer — no  needed, these words are specific enough
        if (/fmcg|fast.?moving|consumption|consumer/.test(nl)) return 'FMCG & Consumption';

        // Transport & Logistics
        if (/transport|logistics|mobility/.test(nl)) return 'Transport & Logistics';

        // Commodities & Resources
        if (/commodit|natural.?resource|metals|mining|precious.?metal/.test(nl)) return 'Commodities & Resources';

        // Energy & Power (before infra)
        if (/energy|power.?infra|power.?&.?infra|new.?energy|clean.?energy/.test(nl)) return 'Energy & Power';
        if (/power|utilities/.test(nl)) return 'Energy & Power';

        // Manufacturing (before infra — "Manufacturing & Infrastructure" → Manufacturing)
        if (/manufactur|capital.?goods|engineering/.test(nl)) return 'Manufacturing';

        // Infrastructure
        if (/infra/.test(nl)) return 'Infrastructure';

        // Auto
        if (/automobile|automotive|auto.?fund|auto.?sector|auto.?opportun|nifty.?auto/.test(nl)) return 'Auto';

        // Realty & Housing
        if (/realty|real.?estate|housing/.test(nl)) return 'Realty';

        // Defence
        if (/defence|defense/.test(nl)) return 'Defence & Aerospace';

        // PSU
        if (/psu|public.?sector.?(?:enterprise|equity|unit)|bharat.?22/.test(nl)) return 'PSU';

        // MNC
        if (/mnc|multinational/.test(nl)) return 'MNC';

        // ESG
        if (/esg|sustainability|responsible.?invest/.test(nl)) return 'ESG';

        // Banking & Finance — checked LAST so AMC names don't trigger this
        if (/banking.?financ|banking.?serv|financial.?service|nifty.?bank/.test(nl)) return 'Banking & Finance';
        if (/bank/.test(nl) && /fund|sector|etf|bees|index|opportun/.test(nl)) return 'Banking & Finance';

        return 'Thematic';
    }

    const MFE_DATA_URL = '/mf-data.json'; // served by Firebase hosting — same domain, CDN-cached
    let _mfeCaveats     = {};    // cat → caveat codes from pipeline (Phase 4 UI badges)
    let _mfePrecomputed = false;
    let _mfeNavStale    = false; // true when precomputed NAVs are > 20h old — triggers live refresh
    let _mfeNavRefreshAbort = null; // AbortController for background NAV refresh
    let _mfeSubSect = 'All'; // current sub-sector filter (Sectoral only)

    /* ── state ── */
    let _mfeList     = [];   // all eligible funds [{code,name,amc,cat}]
    let _mfeNavCache = {};   // code → {nav, date}
    let _mfeMetCache = {};   // code → {stdDev,beta,alpha,sharpe,sortino,score}|null
    let _mfeCatDone  = {};   // cat → true when step3 complete
    let _mfeCatNav   = {};   // cat → true when step2 complete
    let _mfeBench    = null; // benchmark series {dates,navs}
    let _mfeBenchReady = false;
    let _mfeCur      = 'Index';
    let _mfeSortCol  = 'score';
    let _mfeSortDir  = -1;
    let _mfePage     = 0;
    let _mfeReady    = false;   // step1 done
    let _mfeBusy     = false;   // step1 running
    let _mfeScopeAbort = null;  // AbortController for current category ops

    /* ════════════════════════════════════════════════════════
       PUBLIC: called by switchMode('mfexplorer')
    ════════════════════════════════════════════════════════ */
    function initMFExplorer() {
        if (_mfeBusy) return;
        if (_mfeReady) { _mfeShowTable(); mfeCatLoad(_mfeCur); return; }
        _mfeBusy = true;
        _mfeShow('mfe-loading'); _mfeHide('mfe-error');
        _mfeHide('mfe-table-wrap'); _mfeHide('mfe-phase-bar');
        _mfeMsg(_t('mfe.load.precomp'), _t('mfe.load.precomp.sub'));
        mfeLoadPrecomputed();
    }

    async function mfeLoadPrecomputed() {
        try {
            const res = await fetch(MFE_DATA_URL, { signal: AbortSignal.timeout(8000) });
            if (!res.ok) throw new Error('HTTP ' + res.status);
            const data = await res.json();
            if (!data?.categories || !data?.generated) throw new Error('Invalid data format');

            // Check staleness: if precomputed data is > 20h old, NAVs need live refresh
            const generated  = new Date(data.generated);
            const ageHours   = (Date.now() - generated.getTime()) / 3_600_000;
            _mfeNavStale     = ageHours > 20;

            const ts = document.getElementById('mfe-last-updated');
            if (ts) {
                const d = generated.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
                ts.textContent = _mfeNavStale
                    ? _t('mfe.ts.stale').replace('{d}', d)
                    : _t('mfe.ts.fresh').replace('{d}', d);
            }

            const MFE_PRECOMP_EXCLUDE = /\bseries\s+(?:[ivxlcdm]+|\d+)\b/i;

            // Category trust caveats from the pipeline (rendered as badges)
            _mfeCaveats = data.caveats || {};

            _mfeList = [];
            Object.entries(data.categories).forEach(([cat, funds]) => {
                funds.forEach(f => {
                    if (MFE_PRECOMP_EXCLUDE.test(f.name)) return; // skip closed-ended series funds
                    // Re-classify funds that the pipeline mis-tagged as 'Index'.
                    // AMFI lumps all index-tracking funds (sectoral, midcap, international, debt)
                    // into "Index Funds". Re-run name-based parsing and use a more specific result
                    // if available (e.g. Auto Index → Sectoral, Midcap 50 → Mid Cap, S&P 500 → International).
                    let actualCat = cat;
                    if (cat === 'Index') {
                        const namecat = mfeParseCat(f.name);
                        if (namecat && namecat !== 'Index' && namecat !== 'Other') actualCat = namecat;
                    }
                    const ss = f.subSect || 'Thematic';
                    _mfeList.push({ code: f.code, name: f.name, amc: f.amc, cat: actualCat, subSect: ss });
                    if (f.nav !== null) _mfeNavCache[f.code] = { nav: f.nav, date: f.navDate };
                    if (f.ter != null && isFinite(f.ter)) _mfeTerMap[f.code] = f.ter; // real TER from pipeline
                    // For Sectoral use composite key (code:subSect) so mfeRender can look it up directly
                    const metKey = (actualCat === 'Sectoral') ? f.code + ':' + ss : f.code;
                    _mfeMetCache[metKey] = f.metrics;
                    _mfeCatNav[actualCat]  = true;
                    _mfeCatDone[actualCat] = true;
                });
                // Mark every Sectoral sub-sector as done so switching is instant (no live re-fetch)
                if (cat === 'Sectoral') {
                    const subsects = new Set(funds.map(f => f.subSect).filter(Boolean));
                    subsects.forEach(ss => { _mfeCatDone['Sectoral:' + ss] = true; });
                }
            });

            const _stEl = document.getElementById('mfe-stat-total'); if(_stEl) _stEl.textContent = _mfeList.length.toLocaleString();
            _mfePrecomputed = true;
            _mfeReady = true;
            _mfeBusy  = false;
            _mfeHide('mfe-loading');
            _mfeShowTable();
            mfeCatLoad('Index');
            mfeSyncCatDropdowns('Index');
            if (typeof renderMyMFs === 'function') renderMyMFs();

            // If NAVs are stale, refresh the initial category live in background (non-blocking)
            if (_mfeNavStale) mfeLiveNavRefresh('Index');

        } catch (err) {
            console.warn('[MFExplorer] Pre-computed load failed, falling back:', err.message);
            _mfeBusy = false;
            _mfeMsg(_t('mfe.load.live'), _t('mfe.load.live.sub'));
            mfeStep1();
        }
    }


    /* ════════════════════════════════════════════════════════
       LIVE NAV REFRESH — runs silently in background when
       precomputed data is > 20h old. Fetches today's NAV
       from mfapi.in /latest for every fund in the category,
       updates _mfeNavCache, and re-renders the table in place.
       Metrics (alpha/beta/sharpe/stars) remain from precomputed
       data — they're slow-moving and don't need daily refresh.
    ════════════════════════════════════════════════════════ */
    async function mfeLiveNavRefresh(cat) {
        // Cancel any prior refresh still running
        if (_mfeNavRefreshAbort) _mfeNavRefreshAbort.abort();
        const ctl = new AbortController();
        _mfeNavRefreshAbort = ctl;

        const funds = _mfeList.filter(f => f.cat === cat);
        if (!funds.length) return;

        const BATCH = 25;
        let refreshed = 0;
        for (let i = 0; i < funds.length; i += BATCH) {
            if (ctl.signal.aborted) return;
            const batch = funds.slice(i, i + BATCH);
            await Promise.allSettled(batch.map(async f => {
                try {
                    const r = await fetch(`https://api.mfapi.in/mf/${f.code}/latest`,
                        { signal: AbortSignal.timeout(6000) });
                    if (!r.ok) return;
                    const j = await r.json();
                    const d = j?.data?.[0];
                    const nav = parseFloat(d?.nav);
                    if (!d || isNaN(nav) || nav <= 0) return;
                    _mfeNavCache[f.code] = { nav, date: d.date };
                    refreshed++;
                } catch {}
            }));
            // Re-render silently after each batch so prices update progressively
            if (!ctl.signal.aborted && _mfeCur === cat) mfeRender();
        }

        if (ctl.signal.aborted) return;

        // Update the timestamp label to confirm NAV is now live
        if (refreshed > 0) {
            const ts = document.getElementById('mfe-last-updated');
            if (ts) {
                const today = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
                ts.textContent = 'Metrics: pre-computed · NAV: Live (' + today + ')';
            }
        }
    }

    function refreshMFExplorer() {
        _mfeList=[]; _mfeNavCache={}; _mfeMetCache={}; _mfeCatDone={}; _mfeCatNav={};
        _mfeBench=null; _mfeBenchReady=false; _mfeNifty500Nav=null; _mfeNifty500Ready=false; _mfeCatBenchCache={}; _mfeTerMap={}; _mfeCaveats={}; _mfeReady=false; _mfeBusy=false; _mfePage=0; _mfeSubSect='All';
        _mfeNavStale=false;
        if (_mfeNavRefreshAbort) { _mfeNavRefreshAbort.abort(); _mfeNavRefreshAbort=null; }
        if (_mfeScopeAbort) { _mfeScopeAbort.abort(); _mfeScopeAbort=null; }
        const ic=document.getElementById('mfe-refresh-icon');
        if(ic){ic.classList.add('mfe-spin');setTimeout(()=>ic.classList.remove('mfe-spin'),2000);}
        initMFExplorer();
    }

    /* ════════════════════════════════════════════════════════
       STEP 1 — fetch full AMFI list, filter, show category pills
    ════════════════════════════════════════════════════════ */
    async function mfeStep1() {
        try {
            const res = await fetch('https://api.mfapi.in/mf', {signal:AbortSignal.timeout(25000)});
            if (!res.ok) throw new Error('HTTP '+res.status);
            const list = await res.json();

            // ── Quality filters ──────────────────────────────────────────
            // 1. Direct plans from top AMCs only
            // 2. Exclude segregated portfolios (credit-event constructs, not investable)
            // 3. Exclude IDCW/Dividend variants — keep Growth option only for fair comparison
            // 4. Exclude wound-down, matured, ETF feeders, and FoF-of-FoFs
            // 5. Exclude clearly institutional / restricted plans
            const EXCLUDE_PATTERN = new RegExp([
                'segregated',          // segregated portfolio funds (credit events)
                'idcw',                // income distribution cum capital withdrawal
                'dividend',            // dividend payout/reinvestment plans
                'weekly dividend',
                'monthly dividend',
                'quarterly dividend',
                'annual dividend',
                'bonus option',
                'fixed maturity',      // FMPs — closed-ended, not comparable
                'fmp',
                'interval fund',
                'capital protection',
                'maturity plan',
                'etf(?!.*fof)',        // ETFs (but keep ETF-FoF wrappers)
                'exchange traded',
                'of funds.*of funds',  // FoF-of-FoFs
                'institutional',
                'tier[\s\-]*[12]',
                'class[\s\-]*[ab]',
                'regular',
                'super institutional', // super-institutional plans
                'pension plan',        // NPS / pension-specific plans
                'pension fund',
                'pf (?:equity|debt)',  // provident fund plans
                'epf ',                // EPF-specific plans
                '\bgratuity\b',      // gratuity plans
                'staff ',              // employee/staff plans
                'employees? fund',
                'trustee',             // trustee/board plans
                '\bnro\b',           // NRO plans
                '\bnre\b',           // NRE plans
                'foreign currency',
                'sr\. citizen',       // senior citizen specific
                'senior citizen',
                'minor ',              // minor account plans
                '\(g\)$',            // Growth variant already caught by dedup
                'unclaimed',           // unclaimed redemption
                '\\bseries\\s+(?:[ivxlcdm]+|\\d+)\\b' // closed-ended series funds (e.g. "Series IV", "Series 1")
            ].join('|'), 'i');

            const raw = list.filter(f => {
                const n = f.schemeName.toLowerCase();
                return /direct/i.test(n)
                    && !EXCLUDE_PATTERN.test(n);
                // AMC whitelist removed — show all SEBI-registered direct plans
            });

            // De-duplicate: if same fund name prefix exists in both Growth and other
            // options, keep Growth. Strategy: deduplicate by stripping option suffixes
            // and keeping the Growth/Growth Option variant.
            const growthPreferred = new Map();
            raw.forEach(f => {
                // Normalise name by removing trailing option labels
                const base = f.schemeName
                    .replace(/[-\s]*(growth option|growth plan|growth|direct plan|direct)[\s\-]*/gi, '')
                    .replace(/\s+/g, ' ').trim().toLowerCase();
                const existing = growthPreferred.get(base);
                // Prefer "growth" in name over other variants
                const isGrowth = /growth/i.test(f.schemeName);
                if (!existing || isGrowth) {
                    growthPreferred.set(base, f);
                }
            });

            _mfeList = Array.from(growthPreferred.values())
                .map(f => ({
                    code: String(f.schemeCode),
                    name: f.schemeName,
                    amc:  mfeParseAMC(f.schemeName),
                    cat:  mfeParseCat(f.schemeName),
                    subSect: mfeParseSubSect(f.schemeName)
                }));

            const _stEl2 = document.getElementById('mfe-stat-total'); if(_stEl2) _stEl2.textContent = _mfeList.length.toLocaleString();
            const ts = document.getElementById('mfe-last-updated');
            if (ts) ts.textContent = 'Updated: ' + new Date().toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'});

            _mfeReady = true;
            _mfeBusy  = false;
            _mfeHide('mfe-loading');
            _mfeShowTable();

            // Kick off benchmark fetch in background
            mfeFetchBench();

            // Load default category
            mfeCatLoad('Index');
            mfeSyncCatDropdowns('Index');

        } catch(err) {
            _mfeBusy = false;
            _mfeHide('mfe-loading'); _mfeShow('mfe-error');
            const em = document.getElementById('mfe-error-msg');
            if (em) em.textContent = err.message;
        }
    }

    /* ════════════════════════════════════════════════════════
       STEP 2 — fetch latest NAV for all funds in category
       NOTE: /latest returns exactly 1 data point (today's NAV).
       AUM proxy already applied in Step 1 via top-AMC + Direct
       filter. We store the NAV and refine category from API meta.
    ════════════════════════════════════════════════════════ */
    async function mfeStep2(cat, signal) {
        const funds = _mfeList.filter(f => f.cat === cat);
        const toFetch = funds.filter(f => !_mfeNavCache[f.code]);
        if (toFetch.length === 0) { _mfeCatNav[cat]=true; return; }

        const BATCH = 20; // larger batch for broader fund universe
        let done = 0;
        const total = toFetch.length;

        for (let i = 0; i < toFetch.length; i += BATCH) {
            if (signal?.aborted) return;
            const batch = toFetch.slice(i, i + BATCH);
            await Promise.allSettled(batch.map(async f => {
                try {
                    const r = await fetch(`https://api.mfapi.in/mf/${f.code}/latest`,
                        {signal: AbortSignal.timeout(8000)});
                    if (!r.ok) return;
                    const j = await r.json();
                    const d = j?.data?.[0];
                    const nav = parseFloat(d?.nav);
                    if (!d || isNaN(nav)) return;
                    _mfeNavCache[f.code] = {nav, date: d.date};
                    // Refine category from API metadata (more accurate than name parsing).
                    // Guard: don't let meta override to 'Index' if the name parser already gave a
                    // specific category. AMFI lumps ALL index-tracking funds (sectoral, midcap,
                    // smallcap, international, etc.) into "Other Scheme - Index Funds", which is
                    // too coarse. Only assign 'Index' via meta when the name parser returned 'Other'
                    // (unclassified). For every other category, trust the name-based parse.
                    const metaCat = mfeCatFromMeta(j?.meta?.scheme_category);
                    if (metaCat && !(metaCat === 'Index' && f.cat !== 'Other')) f.cat = metaCat;
                } catch {}
            }));
            done += batch.length;
            _mfeProgress(
                _t('mfe.load.nav') + ' ' + done + '/' + total,
                _t('mfe.load.cat').replace('{cat}', cat),
                Math.round(done / total * 100)
            );
            if (_mfeCur === cat) mfeRender();
        }

        const catCount = _mfeList.filter(f => f.cat === cat && _mfeNavCache[f.code]).length;
        const _ccEl = document.getElementById('mfe-stat-cat'); if(_ccEl) _ccEl.textContent = catCount.toLocaleString();
        _mfeCatNav[cat] = true;
    }

    /* ════════════════════════════════════════════════════════
       STEP 3 — fetch full 3yr history per fund → compute → score
    ════════════════════════════════════════════════════════ */
    async function mfeStep3(cat, signal, catBench) {
        // catBench = category-appropriate benchmark series {dates,navs}
        const bench = (catBench && catBench.navs && catBench.navs.length > 30) ? catBench : _mfeBench;
        // For Sectoral, use composite key code:subSect so each sub-sector is scored once
        const _mfeCacheKey = (f) => (cat === 'Sectoral') ? f.code + ':' + _mfeSubSect : f.code;
        const _mfeDoneKey  = (cat === 'Sectoral') ? 'Sectoral:' + _mfeSubSect : cat;
        const funds = _mfeList.filter(f => f.cat === cat && !_mfeMetCache.hasOwnProperty(_mfeCacheKey(f)));
        if (funds.length === 0) { _mfeCatDone[_mfeDoneKey] = true; return; }

        const BATCH = 12; // increased for broader fund universe
        let done = 0;
        const total = funds.length;

        for (let i = 0; i < funds.length; i += BATCH) {
            if (signal?.aborted) return;
            const batch = funds.slice(i, i + BATCH);
            await Promise.allSettled(batch.map(async f => {
                try {
                    const r = await fetch(`https://api.mfapi.in/mf/${f.code}`,
                        {signal: AbortSignal.timeout(20000)});
                    if (!r.ok) { _mfeMetCache[_mfeCacheKey(f)] = null; return; }
                    const j = await r.json();
                    const ser = MFScoring.toSeries(j);
                    _mfeMetCache[_mfeCacheKey(f)] = (ser.navs.length >= 30 && bench && bench.navs.length > 30)
                        ? mfeCompute(ser, bench)
                        : null;
                } catch { _mfeMetCache[_mfeCacheKey(f)] = null; }
            }));
            done += batch.length;
            const pct = Math.round(done/total*100);
            _mfeProgress(_t('mfe.load.scoring') + ' ' + done + '/' + total, _t('mfe.step3.sub'), pct);
            const scoredCount = _mfeList.filter(f => f.cat===cat && _mfeMetCache[(cat==='Sectoral')?f.code+':'+_mfeSubSect:f.code]).length; const _ssEl = document.getElementById('mfe-stat-scored'); if(_ssEl) _ssEl.textContent = scoredCount.toLocaleString();
            // Normalise + re-render after each batch
            mfeNorm(cat);
            if (_mfeCur === cat) mfeRender();
        }

        _mfeCatDone[_mfeDoneKey] = true;
        mfeNorm(cat);
        if (_mfeCur === cat) { mfeRender(); _mfeHide('mfe-phase-bar'); }
    }

    /* ════════════════════════════════════════════════════════
       ORCHESTRATOR — called when category is selected
    ════════════════════════════════════════════════════════ */
    async function mfeCatLoad(cat) {
        if (_mfeScopeAbort) _mfeScopeAbort.abort();
        const ctl = new AbortController();
        _mfeScopeAbort = ctl;

        const catFunds = _mfeList.filter(f => f.cat === cat);
        const _scEl = document.getElementById('mfe-stat-cat'); if(_scEl) _scEl.textContent = catFunds.length.toLocaleString();
        const _scEl2 = document.getElementById('mfe-stat-scored'); if(_scEl2) _scEl2.textContent = '—';

        // Update benchmark label in UI
        let bLabel;
        if (cat === 'Sectoral' && _mfeSubSect) {
            bLabel = MFE_SUBSECT_BENCH_LABEL[_mfeSubSect] || 'Nifty 500';
        } else {
            bLabel = MFE_CAT_BENCH_LABEL[cat] || 'Nifty 50';
        }
        const bEl = document.getElementById('mfe-bench-label');
        if (bEl) bEl.textContent = _t('mfe.bench.prefix') + bLabel;

        const _catDoneKey = (cat === 'Sectoral' && _mfeSubSect) ? 'Sectoral:' + _mfeSubSect : cat;
        if (_mfeCatDone[_catDoneKey]) {
            _mfeHide('mfe-phase-bar');
            mfeRender();
            // Precomputed data is stale — refresh NAVs for this category in background
            if (_mfeNavStale) mfeLiveNavRefresh(cat);
            return;
        }

        _mfeShow('mfe-phase-bar');

        if (!_mfeCatNav[cat]) {
            await mfeStep2(cat, ctl.signal);
            if (ctl.signal.aborted) return;
        }

        // (subsect always pre-set by mfeSetCat — no fallback needed)

        // Fetch category-appropriate benchmark (may reuse cached Nifty 50)
        // For Sectoral: use sub-sector specific benchmark if available
        let benchLabel, catBench;
        if (cat === 'Sectoral' && _mfeSubSect && MFE_SUBSECT_BENCH_CODE[_mfeSubSect]) {
            benchLabel = MFE_SUBSECT_BENCH_LABEL[_mfeSubSect] || 'Nifty 500';
            _mfeProgress(`Fetching ${benchLabel} benchmark…`, 'Sub-sector specific benchmark for Alpha, Beta calculations', 0);
            const ssCode = MFE_SUBSECT_BENCH_CODE[_mfeSubSect];
            if (!_mfeCatBenchCache['SS_' + _mfeSubSect]) {
                try {
                    const r = await fetch(`https://api.mfapi.in/mf/${ssCode}`, {signal: ctl.signal || AbortSignal.timeout(20000)});
                    if (r.ok) {
                        const j = await r.json();
                        const ser = MFScoring.toSeries(j);
                        if (ser.navs.length > 30) _mfeCatBenchCache['SS_' + _mfeSubSect] = ser;
                    }
                } catch {}
            }
            catBench = _mfeCatBenchCache['SS_' + _mfeSubSect] || await mfeFetchCatBench(cat, ctl.signal);
        } else {
            benchLabel = MFE_CAT_BENCH_LABEL[cat] || 'Nifty 50';
            _mfeProgress(`Fetching ${benchLabel} benchmark…`, 'Used for Alpha, Beta, Sharpe, Sortino calculations', 0);
            catBench = await mfeFetchCatBench(cat, ctl.signal);
        }
        if (ctl.signal.aborted) return;

        // Ensure Nifty 50 also available as fallback
        if (!_mfeBenchReady) await mfeFetchBench();

        await mfeStep3(cat, ctl.signal, catBench);
    }

    /* ════════════════════════════════════════════════════════
       BENCHMARK fetch
    ════════════════════════════════════════════════════════ */
    async function mfeFetchBench() {
        if (_mfeBenchReady) return;
        try {
            const r = await fetch(`https://api.mfapi.in/mf/${MFE_BENCH}`,
                {signal: AbortSignal.timeout(25000)});
            if (!r.ok) return;
            const j = await r.json();
            _mfeBench = MFScoring.toSeries(j);
            _mfeBenchReady = _mfeBench.navs.length > 30;
            // Pre-seed ONLY categories that genuinely map to Nifty 50.
            // (Previously Hybrid/Sectoral/International/Commodity/Arbitrage were
            // seeded with Nifty 50 too, which blocked their real benchmarks
            // from ever being fetched — cache hit short-circuits the fetch.)
            if (_mfeBenchReady) {
                ['Index','FoF','_default']
                    .forEach(cat => { if (!_mfeCatBenchCache[cat]) _mfeCatBenchCache[cat] = _mfeBench; });
            }
        } catch {}
    }

    /* ════════════════════════════════════════════════════════
       METRIC COMPUTATION
    ════════════════════════════════════════════════════════ */
    /* ── Metric math lives in mf-scoring-core.js (shared with the nightly
       precompute script). These wrappers keep old call-sites working.
       All inputs are {dates,navs} series — date-aligned, calendar-annualised. ── */
    function mfeCagr(series, years)       { return MFScoring.cagr(series, years); }
    function mfeRolling(series, bench)    { return MFScoring.rolling(series, bench); }
    function mfeCompute(series, bench)    { return MFScoring.compute(series, bench); }

    /* ══════════════════════════════════════════════════════════
       SCORING — 1–5 signal tiers by percentile (Morningstar distribution)
       Weights, 3y/5y blending, benchmark-relative hit rate, star tiers
       and pillar grades all live in mf-scoring-core.js — see the header
       of that file for the current methodology and change log.
    ══════════════════════════════════════════════════════════ */
    function mfeNorm(cat) {
        // Use composite key for Sectoral (code:subSect), plain code for all others
        const _ck = (f) => (cat === 'Sectoral') ? f.code + ':' + _mfeSubSect : f.code;
        const funds = _mfeList.filter(f => f.cat===cat && _mfeMetCache[_ck(f)]);
        if (!funds.length) return;
        // Weights, star tiers and pillar grades live in mf-scoring-core.js
        // (single source of truth, shared with the nightly precompute script).
        // Mutates the cached metric objects in place: .stars .score .pillars
        MFScoring.normaliseCat(funds.map(f => ({ cat, metrics: _mfeMetCache[_ck(f)] })));
    }

    /* ════════════════════════════════════════════════════════
       RENDER
    ════════════════════════════════════════════════════════ */
    /* ── Star rating display helper ── */
    const _mfeSigCfg = [
        null,
        { lbl:'Avoid',   verdict:'Bottom 10% — many better options in this category'  },
        { lbl:'Weak',    verdict:'Below most peers in this category'                   },
        { lbl:'Average', verdict:'Middle of the pack for this category'                },
        { lbl:'Strong',  verdict:'Better than most funds in this category'             },
        { lbl:'Elite',   verdict:'Top 10% — stands out in this category'               },
    ];
    const _mfePillarLabel = ['Weak', 'Fair', 'Strong'];

    function mfeSignalHtml(tier, score, pillars, win) {
        if (tier == null) return '<span class="mfe-st-nd">…</span>';
        const cfg = _mfeSigCfg[tier];
        if (!cfg) return '';
        const stars = Array.from({length: 5}, (_, i) =>
            `<span class="mfe-star-${i < tier ? 'on' : 'off'}">\u2605</span>`
        ).join('');
        let tip = `${tier} \u2605 out of 5 \u00B7 ${cfg.lbl}\n${cfg.verdict}`;
        if (pillars) {
            tip += '\n\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500'
                + `\nReturns:      ${_mfePillarLabel[(pillars.ret  || 1) - 1]}`
                + `\nSafety:       ${_mfePillarLabel[(pillars.safe || 1) - 1]}`
                + `\nConsistency:  ${_mfePillarLabel[(pillars.cons || 1) - 1]}`;
        }
        // Rating window disclosure (5Y blend / 3Y only / limited history)
        const winKey = win === '5Y' ? 'mfe.win.5y' : win === '3Y' ? 'mfe.win.3y' : win === '<3Y' ? 'mfe.win.lt3y' : null;
        if (winKey) tip += '\n' + _t(winKey);
        const ltBadge = win === '<3Y' ? `<span class="mfe-win-lt" title="${_t('mfe.win.lt3y')}">‹3y</span>` : '';
        return `<span class="mfe-stars" title="${tip}">${stars}</span>${ltBadge}`;
    }

    /* kept for sort compat — internal value unchanged */
    function mfeStarHtml(tier) { return mfeSignalHtml(tier); }

    /* ── CAGR cell helper ── */
    function mfeCagrHtml(m) {
        if (!m || !m.cagr) return '<span class="mfe-shimmer"></span>';
        const key = {y1:'y1',y3:'y3',y5:'y5',y10:'y10'}[_mfeCagrPeriod.toLowerCase().replace('y','y')];
        const periodMap = {'1Y':'y1','3Y':'y3','5Y':'y5','10Y':'y10'};
        const val = m.cagr[periodMap[_mfeCagrPeriod]];
        if (val == null) return '<span class="mfe-cagr-na">—</span>';
        const cls = val >= 0 ? 'mfe-cagr-pos' : 'mfe-cagr-neg';
        return `<span class="${cls}">${val >= 0 ? '+' : ''}${val.toFixed(2)}%</span>`;
    }

    /* ── Category trust caveats + past-performance disclaimer ── */
    function mfeRenderCaveats(cat) {
        const el = document.getElementById('mfe-caveats');
        if (!el) return;
        const ratedCount = _mfeList.filter(f => {
            const k = (cat === 'Sectoral') ? f.code + ':' + _mfeSubSect : f.code;
            return f.cat === cat && _mfeMetCache[k]?.stars;
        }).length;
        // Prefer pipeline-computed caveats; fall back to live computation
        const codes = _mfeCaveats[cat] || MFScoring.categoryCaveats(cat, ratedCount);
        const keyMap = { 'sector-fad': 'mfe.cav.sector', 'debt-credit': 'mfe.cav.debt', 'small-peers': 'mfe.cav.small' };
        const lines = codes.map(c => keyMap[c] ? `<div class="mfe-caveat-line">${_t(keyMap[c])}</div>` : '').join('');
        el.innerHTML = lines + `<div class="mfe-caveat-line mfe-caveat-past">${_t('mfe.cav.pastperf')}</div>`;
        el.classList.remove('hidden');
    }

    function mfeRender() {
        // Keep sub-sector pills in sync (counts may update as NAVs load)
        if (_mfeCur === 'Sectoral') mfeRenderSubSectPills();
        mfeRenderCaveats(_mfeCur);

        const search=(document.getElementById('mfe-search')?.value||'').toLowerCase().trim();
        let view = _mfeList.filter(f => {
            if (f.cat !== _mfeCur) return false;
            if (!_mfeNavCache[f.code]) return false;
            // Sub-sector filter (Sectoral only — always a specific sub-sector, no All)
            if (_mfeCur === 'Sectoral' && _mfeSubSect && f.subSect !== _mfeSubSect) return false;
            if (search && !f.name.toLowerCase().includes(search) && !f.amc.toLowerCase().includes(search)) return false;
            return true;
        });

        // Sort — stars use score (percentile rank) for ordering
        const periodMap = {'1Y':'y1','3Y':'y3','5Y':'y5','10Y':'y10'};
        view.sort((a,b)=>{
            if (_mfeSortCol==='score'){
                const _sck = (f) => (_mfeCur === 'Sectoral') ? f.code + ':' + _mfeSubSect : f.code;
                const sa=_mfeMetCache[_sck(a)]?.score??-1, sb=_mfeMetCache[_sck(b)]?.score??-1;
                return _mfeSortDir*(sa-sb);
            }
            if (_mfeSortCol==='cagr'){
                const pk = periodMap[_mfeCagrPeriod];
                const ca=_mfeMetCache[a.code]?.cagr?.[pk]??-999;
                const cb=_mfeMetCache[b.code]?.cagr?.[pk]??-999;
                return _mfeSortDir*(ca-cb);
            }
            if (_mfeSortCol==='rollingHit'){
                const ra=_mfeMetCache[a.code]?.rolling?.hitRate??-1;
                const rb=_mfeMetCache[b.code]?.rolling?.hitRate??-1;
                return _mfeSortDir*(ra-rb);
            }
            if (_mfeSortCol==='rollingAvg'){
                const ra=_mfeMetCache[a.code]?.rolling?.avg??-999;
                const rb=_mfeMetCache[b.code]?.rolling?.avg??-999;
                return _mfeSortDir*(ra-rb);
            }
            if (_mfeSortCol==='expenseRatio'){
                // .val — mfeGetER returns {val, estimated}, not a number
                const ea=mfeGetER(a.code, a.cat)?.val??99, eb=mfeGetER(b.code, b.cat)?.val??99;
                return _mfeSortDir*(ea-eb);
            }
            if (_mfeSortCol==='nav') return _mfeSortDir*((_mfeNavCache[a.code]?.nav||0)-(_mfeNavCache[b.code]?.nav||0));
            return _mfeSortDir*a.name.localeCompare(b.name);
        });

        const total=view.length, totalPg=Math.max(1,Math.ceil(total/MFE_PAGE));
        if (_mfePage>=totalPg) _mfePage=0;
        const start=_mfePage*MFE_PAGE, page=view.slice(start, start+MFE_PAGE);

        const tbody=document.getElementById('mfe-tbody');
        if (!tbody) return;

        const mc=(v,fn)=> v!=null && isFinite(v)
            ? `<span class="${fn(v)}">${v.toFixed(2)}</span>`
            : '<span class="mfe-shimmer"></span>';

        tbody.innerHTML = page.map((f,i)=>{
            const rank=start+i+1;
            const nc=_mfeNavCache[f.code];
            const _mfeCk = (_mfeCur === 'Sectoral') ? f.code + ':' + _mfeSubSect : f.code;
        const m=_mfeMetCache[_mfeCk];
            const medals=['🥇','🥈','🥉'];
            const rankHtml=`<span class="mfe-rank${rank<=3?' mfe-rank-top':''}">${rank<=3?medals[rank-1]:rank}</span>`;
            const hasM = m !== undefined && m !== null;
            const sigCell = !hasM
                ? '<span class="mfe-st-nd">…</span>'
                : mfeSignalHtml(m?.stars ?? null, m?.score ?? null, m?.pillars ?? null, m?.window ?? null);

            // For Commodity and International, note that Alpha/Beta use non-Nifty benchmark
            const benchNote = (_mfeCur==='International'||_mfeCur==='Commodity')
                ? ` title="vs ${MFE_CAT_BENCH_LABEL[_mfeCur]}"` : '';

            // Rolling returns cells
            const rollHit = m?.rolling?.hitRate;
            const rollAvg = m?.rolling?.avg;
            // Benchmark-relative: beating the benchmark in ≥60% of windows is strong
            const rollHitHtml = !hasM ? '<span class="mfe-shimmer"></span>'
                : rollHit==null ? '<span class="mfe-na">—</span>'
                : `<span class="${rollHit>=60?'mfe-good':rollHit>=40?'mfe-avg':'mfe-bad'}">${rollHit.toFixed(1)}%</span>`;
            const rollAvgHtml = !hasM ? '<span class="mfe-shimmer"></span>'
                : rollAvg==null ? '<span class="mfe-na">—</span>'
                : `<span class="${rollAvg>=12?'mfe-good':rollAvg>=8?'mfe-avg':'mfe-bad'}">${rollAvg>=0?'+':''}${rollAvg.toFixed(2)}%</span>`;

            // Expense Ratio cell — show for all funds, estimated if not in lookup
            const erData = mfeGetER(f.code, f.cat);
            const erBench = MFE_ER_BENCH[f.cat] ?? 1.0;
            let erHtml;
            if (!erData) {
                erHtml = '<span class="mfe-na">—</span>';
            } else {
                const erCls = erData.val <= erBench*0.6 ? 'mfe-good'
                            : erData.val <= erBench      ? 'mfe-avg' : 'mfe-bad';
                const erTip = erData.estimated ? ' title="Estimated — category median"' : '';
                const erSuffix = erData.estimated ? '<span style="font-size:9px;opacity:0.6">~</span>' : '';
                erHtml = `<span class="${erCls}"${erTip}>${erData.val.toFixed(2)}%${erSuffix}</span>`;
            }

            const _bmSaved = typeof mfIsWatchlisted === 'function' && mfIsWatchlisted(f.code);
            const _bmIcon  = _bmSaved ? '★' : '☆';
            const _bmTitle = _bmSaved ? 'Saved — click to remove from My Mutual Funds' : 'Click to save to My Mutual Funds';
            const _bmColor = _bmSaved ? '#f5c842' : '#94a3b8';
            const _bmHover = _bmSaved ? '#e2ac1a' : '#f5c842';
            const _bmEscName = _esc(f.name).replace(/'/g,'&#39;');
            const _bmEscAmc  = _esc(f.amc).replace(/'/g,'&#39;');
            const _bmSub = _esc(f.subSect||'').replace(/'/g,'&#39;');
            // Compare button state
            const _cmpAdded = typeof _mfcFunds !== 'undefined' && !!_mfcFunds.find(fc => fc.code === f.code);
            const _cmpAtMax = !_cmpAdded && typeof _mfcFunds !== 'undefined' && _mfcFunds.length >= MFC_MAX;
            const _cmpIcon  = _cmpAdded ? '⊖' : '⊕';
            const _cmpColor = _cmpAdded ? '#0d9488' : _cmpAtMax ? '#cbd5e1' : '#94a3b8';
            const _cmpHover = _cmpAdded ? '#065f46' : _cmpAtMax ? '#cbd5e1' : '#0d9488';
            const _cmpTitle = _cmpAdded ? 'Remove from Fund Comparator' : _cmpAtMax ? 'Comparator full (5/5)' : 'Add to Fund Comparator';
            return `<tr>
                <td class="mfe-td mfe-td-rank text-center">${rankHtml}</td>
                <td class="mfe-td mfe-td-name">
                    <span class="mfe-fname">${_esc(f.name)}</span>
                    <span class="mfe-famc">${_esc(f.amc)}${_mfeCur==='Sectoral'?` <span style="margin-left:4px;font-size:9px;font-weight:700;padding:1px 5px;border-radius:9px;background:rgba(13,148,136,0.12);color:#0d9488;">${_esc(MFE_SUBSECT_ICON[f.subSect]||'📌')} ${_esc(f.subSect)}</span>`:''}</span>
                </td>
                <td class="mfe-td text-center">${sigCell}</td>
                <td class="mfe-td text-right font-bold">${hasM ? mfeCagrHtml(m) : '<span class="mfe-shimmer"></span>'}</td>
                <td class="mfe-td text-right font-bold">${nc?'₹'+nc.nav.toFixed(4):'<span class="mfe-shimmer"></span>'}</td>
                <td class="mfe-td text-center">${rollHitHtml}</td>
                <td class="mfe-td text-right">${rollAvgHtml}</td>
                <td class="mfe-td text-center">${erHtml}</td>
                <td class="mfe-td text-right">${m&&m.stdDev!=null?mc(m.stdDev,v=>v<12?'mfe-good':v<20?'mfe-avg':'mfe-bad')+'%':'<span class="mfe-shimmer"></span>'}</td>
                <td class="mfe-td text-right"${benchNote}>${m&&m.beta!=null?mc(m.beta,v=>v<0.9?'mfe-good':v<1.15?'mfe-avg':'mfe-bad'):'<span class="mfe-shimmer"></span>'}</td>
                <td class="mfe-td text-right"${benchNote}>${m&&m.alpha!=null?mc(m.alpha,v=>v>2?'mfe-good':v>0?'mfe-avg':'mfe-bad')+'%':'<span class="mfe-shimmer"></span>'}</td>
                <td class="mfe-td text-right">${m&&m.sharpe!=null?mc(m.sharpe,v=>v>1.5?'mfe-good':v>0.8?'mfe-avg':'mfe-bad'):'<span class="mfe-shimmer"></span>'}</td>
                <td class="mfe-td text-right">${m&&m.sortino!=null?mc(m.sortino,v=>v>1.5?'mfe-good':v>0.8?'mfe-avg':'mfe-bad'):'<span class="mfe-shimmer"></span>'}</td>
                <td class="mfe-td text-center"><button data-mf-bm="${_esc(f.code)}" onclick="mfToggleWatchlist('${_esc(f.code)}','${_bmEscName}','${_esc(f.cat)}','${_bmSub}','${_bmEscAmc}')" onmouseover="this.style.color='${_bmHover}';this.style.transform='scale(1.25)';" onmouseout="this.style.color='${_bmColor}';this.style.transform='';" style="font-size:17px;line-height:1;background:none;border:none;cursor:pointer;color:${_bmColor};padding:2px 4px;transition:color .15s,transform .15s;" title="${_bmTitle}">${_bmIcon}</button></td>
                <td class="mfe-td text-center"><button data-mf-cmp="${_esc(f.code)}" onclick="mfcToggleFromExplorer('${_esc(f.code)}','${_bmEscName}','${_bmEscAmc}','${_esc(f.cat)}','${_bmSub}')" onmouseover="this.style.color='${_cmpHover}';this.style.transform='scale(1.25)';" onmouseout="this.style.color='${_cmpColor}';this.style.transform='';" style="font-size:17px;line-height:1;background:none;border:none;cursor:${_cmpAtMax?'not-allowed':'pointer'};color:${_cmpColor};padding:2px 4px;transition:color .15s,transform .15s;" title="${_cmpTitle}">${_cmpIcon}</button></td>
            </tr>`;
        }).join('');

        // ── Update category header ──
        const catName = _mfeCur === 'Sectoral' && _mfeSubSect
            ? `${_mfeCur} — ${_mfeSubSect}`
            : _mfeCur;
        const benchText = _mfeCur === 'Sectoral' && _mfeSubSect
            ? 'Benchmark: ' + (MFE_SUBSECT_BENCH_LABEL[_mfeSubSect] || 'Nifty 500')
            : 'Benchmark: ' + (MFE_CAT_BENCH_LABEL[_mfeCur] || 'Nifty 50');

        const catIconMap = {
            'Index':'📊','Large Cap':'🏛','Large & Mid Cap':'📊','Mid Cap':'📈','Small Cap':'🚀',
            'Multi Cap':'🗂','Flexi Cap':'🔄','Focused':'🎯','Value/Contra':'💎','ELSS':'🧾',
            'Sectoral':'🏭','Aggressive Hybrid':'⚡','Conservative Hybrid':'🛡',
            'Balanced Advantage':'⚖️','Multi Asset':'🎨','Hybrid':'⚖️',
            'Liquid':'💧','Ultra Short':'⏱','Money Market':'💰','Short Duration':'📅',
            'Medium Duration':'📆','Corporate Bond':'🏢','Banking & PSU Debt':'🏦',
            'Gilt':'🏛','Dynamic Bond':'🎢','Debt':'🏦',
            'International':'🌍','Solution':'🎓','FoF':'📦','Commodity':'🥇',
        };
        const hdrName  = document.getElementById('mfe-cat-header-name');
        const hdrCount = document.getElementById('mfe-cat-header-count');
        const hdrBench = document.getElementById('mfe-cat-header-bench');
        const hdrIcon  = document.getElementById('mfe-cat-header-icon');
        const hdrPage  = document.getElementById('mfe-cat-header-page');
        if (hdrName)  hdrName.textContent  = catName;
        if (hdrCount) hdrCount.textContent = total.toLocaleString() + ' ' + _t('mfe.lbl.funds');
        if (hdrBench) hdrBench.textContent = benchText;
        if (hdrIcon)  hdrIcon.textContent  = catIconMap[_mfeCur] || '📊';
        if (hdrPage && totalPg > 1) hdrPage.textContent = `Showing ${start+1}–${Math.min(start+MFE_PAGE,total)} of ${total}`;
        else if (hdrPage) hdrPage.textContent = '';

        // ── Row count (legacy) ──
        const rc=document.getElementById('mfe-row-count');
        if(rc) rc.textContent = '';

        // ── Pagination ──
        const pg=document.getElementById('mfe-pagination');
        if (pg) {
            if (totalPg <= 1) {
                pg.innerHTML = '';
            } else {
                // Show up to 5 page number buttons around current page
                const maxBtns = 5;
                let pgStart = Math.max(0, _mfePage - Math.floor(maxBtns/2));
                let pgEnd   = Math.min(totalPg, pgStart + maxBtns);
                if (pgEnd - pgStart < maxBtns) pgStart = Math.max(0, pgEnd - maxBtns);
                let pgHtml = `<button onclick="mfeGoPage(${_mfePage-1})" ${_mfePage===0?'disabled':''} class="mfe-pg-btn mfe-pg-arrow">‹</button>`;
                if (pgStart > 0) pgHtml += `<button onclick="mfeGoPage(0)" class="mfe-pg-btn">1</button><span class="text-slate-300 text-xs font-bold">…</span>`;
                for (let i = pgStart; i < pgEnd; i++) {
                    pgHtml += `<button onclick="mfeGoPage(${i})" class="mfe-pg-btn${i===_mfePage?' mfe-pg-active':''}">${i+1}</button>`;
                }
                if (pgEnd < totalPg) pgHtml += `<span class="text-slate-300 text-xs font-bold">…</span><button onclick="mfeGoPage(${totalPg-1})" class="mfe-pg-btn">${totalPg}</button>`;
                pgHtml += `<button onclick="mfeGoPage(${_mfePage+1})" ${_mfePage>=totalPg-1?'disabled':''} class="mfe-pg-btn mfe-pg-arrow">›</button>`;
                pg.innerHTML = pgHtml;
            }
        }

        // CAGR column header label
        const cagrHdr = document.getElementById('mfe-cagr-header');
        if (cagrHdr) cagrHdr.innerHTML = `CAGR ${_mfeCagrPeriod} <span class="mfe-si">↕</span>`;

        // Sort indicator
        document.querySelectorAll('.mfe-th-sort').forEach(th=>th.classList.remove('mfe-sort-on'));
        document.querySelector(`.mfe-th-sort[onclick="mfeSortBy('${_mfeSortCol}')"]`)?.classList.add('mfe-sort-on');

        // Keep bridge tray in sync after each render
        mfeUpdateCompareBridge();
    }

    /* ── Compare toggle helpers ── */

    function mfcToggleFromExplorer(code, name, amc, cat, sub) {
        if (typeof _mfcFunds === 'undefined') return;
        const idx = _mfcFunds.findIndex(function(f){ return f.code === code; });
        if (idx !== -1) {
            _mfcFunds.splice(idx, 1);
            if (typeof mfcSave === 'function') mfcSave();
            if (typeof mfcRenderChips === 'function') mfcRenderChips();
            if (_mfcFunds.length) { if (typeof mfcRenderTable === 'function') mfcRenderTable(); }
            else { if (typeof mfcShowEmpty === 'function') mfcShowEmpty(); }
        } else {
            if (_mfcFunds.length >= MFC_MAX) { alert('Maximum ' + MFC_MAX + ' funds can be compared at once.'); return; }
            var f = (typeof _mfeList !== 'undefined' && _mfeList.find(function(x){ return x.code === code; }))
                    || { code: code, name: name, amc: amc, cat: cat, subSect: sub };
            _mfcFunds.push(f);
            if (typeof mfcSave === 'function') mfcSave();
            if (typeof mfcRenderChips === 'function') mfcRenderChips();
            if (typeof mfcFetchAndRender === 'function') mfcFetchAndRender();
        }
        mfeUpdateCompareBtns();
        mfeUpdateCompareBridge();
    }

    function mfeUpdateCompareBtns() {
        if (typeof _mfcFunds === 'undefined') return;
        document.querySelectorAll('[data-mf-cmp]').forEach(function(btn) {
            var code   = btn.dataset.mfCmp;
            var inCmp  = !!_mfcFunds.find(function(f){ return f.code === code; });
            var atMax  = !inCmp && _mfcFunds.length >= MFC_MAX;
            btn.textContent   = inCmp ? '⊖' : '⊕';
            btn.style.color   = inCmp ? '#0d9488' : atMax ? '#cbd5e1' : '#94a3b8';
            btn.style.cursor  = atMax ? 'not-allowed' : 'pointer';
            btn.title         = inCmp ? 'Remove from Fund Comparator' : atMax ? 'Comparator full (5/5)' : 'Add to Fund Comparator';
        });
    }

    function mfeUpdateCompareBridge() {
        var bridge = document.getElementById('mfe-cmp-bridge');
        if (!bridge) return;
        if (typeof _mfcFunds === 'undefined' || _mfcFunds.length === 0) {
            bridge.classList.add('hidden');
            return;
        }
        bridge.classList.remove('hidden');
        var lbl = document.getElementById('mfe-cmp-bridge-label');
        if (lbl) lbl.textContent = _t('mfe.cmp.queued').replace('{n}', _mfcFunds.length);
        var chips = document.getElementById('mfe-cmp-bridge-chips');
        if (chips) {
            chips.innerHTML = _mfcFunds.map(function(f) {
                var short = f.name.replace(/\b(direct|growth|plan|option|fund)\b/gi, '').trim().replace(/\s+/g, ' ');
                return '<span style="font-size:10px;font-weight:700;padding:1px 8px;border-radius:999px;background:#ccfbf1;border:1px solid #6ee7b7;color:#065f46;">' + _esc(short.length > 26 ? short.slice(0, 24) + '…' : short) + '</span>';
            }).join('');
        }
    }

    /* ════════════════════════════════════════════════════════
       UI CONTROLS
    ════════════════════════════════════════════════════════ */

    /* Called when user picks from any of the 4 category dropdowns.
       Resets the other 3 to their placeholder, then loads the chosen cat. */
    function mfeSetCatGroup(selectEl) {
        const val = selectEl.value;
        if (!val) return;
        // Reset all other dropdowns to their disabled placeholder
        ['mfe-cat-equity','mfe-cat-debt','mfe-cat-hybrid','mfe-cat-others'].forEach(function(id) {
            const el = document.getElementById(id);
            if (el && el !== selectEl) el.selectedIndex = 0;
        });
        mfeSetCat(val);
    }

    /* Sync the 4 dropdowns when cat changes programmatically */
    function mfeSyncCatDropdowns(cat) {
        const groupMap = {
            'Index':'mfe-cat-equity','Large Cap':'mfe-cat-equity','Large & Mid Cap':'mfe-cat-equity',
            'Mid Cap':'mfe-cat-equity','Small Cap':'mfe-cat-equity','Multi Cap':'mfe-cat-equity',
            'Flexi Cap':'mfe-cat-equity','Focused':'mfe-cat-equity','Value/Contra':'mfe-cat-equity',
            'ELSS':'mfe-cat-equity','Sectoral':'mfe-cat-equity',
            'Liquid':'mfe-cat-debt','Ultra Short':'mfe-cat-debt','Money Market':'mfe-cat-debt',
            'Short Duration':'mfe-cat-debt','Medium Duration':'mfe-cat-debt','Corporate Bond':'mfe-cat-debt',
            'Banking & PSU Debt':'mfe-cat-debt','Gilt':'mfe-cat-debt','Dynamic Bond':'mfe-cat-debt','Debt':'mfe-cat-debt',
            'Aggressive Hybrid':'mfe-cat-hybrid','Conservative Hybrid':'mfe-cat-hybrid',
            'Balanced Advantage':'mfe-cat-hybrid','Multi Asset':'mfe-cat-hybrid','Hybrid':'mfe-cat-hybrid',
            'Solution':'mfe-cat-others','FoF':'mfe-cat-others','International':'mfe-cat-others','Commodity':'mfe-cat-others',
        };
        const activeGroup = groupMap[cat];
        const colorMap = {
            'mfe-cat-equity': {border:'rgba(13,148,136,0.7)',  bg:'rgba(13,148,136,0.08)',  ring:'rgba(13,148,136,0.3)'},
            'mfe-cat-debt':   {border:'rgba(59,130,246,0.7)',  bg:'rgba(59,130,246,0.08)',  ring:'rgba(59,130,246,0.3)'},
            'mfe-cat-hybrid': {border:'rgba(124,58,237,0.7)', bg:'rgba(124,58,237,0.08)', ring:'rgba(124,58,237,0.3)'},
            'mfe-cat-others': {border:'rgba(245,158,11,0.7)', bg:'rgba(245,158,11,0.08)', ring:'rgba(245,158,11,0.3)'},
        };
        const defaultColors = {
            'mfe-cat-equity': 'rgba(13,148,136,0.35)',
            'mfe-cat-debt':   'rgba(59,130,246,0.35)',
            'mfe-cat-hybrid': 'rgba(124,58,237,0.35)',
            'mfe-cat-others': 'rgba(245,158,11,0.35)',
        };
        ['mfe-cat-equity','mfe-cat-debt','mfe-cat-hybrid','mfe-cat-others'].forEach(function(id) {
            const el = document.getElementById(id);
            if (!el) return;
            if (id === activeGroup) {
                el.value = cat;
                // Highlight active dropdown
                const col = colorMap[id];
                el.style.borderColor = col.border;
                el.style.background  = col.bg;
                el.style.fontWeight  = '800';
                el.style.boxShadow   = '0 0 0 2px ' + col.ring;
            } else {
                el.selectedIndex = 0;
                // Reset inactive
                el.style.borderColor = defaultColors[id];
                el.style.background  = '';
                el.style.fontWeight  = '700';
                el.style.boxShadow   = '';
            }
        });
        // Update fund count badge
        const badge = document.getElementById('mfe-fund-count-badge');
        if (badge) {
            const cnt = _mfeList.filter(f => f.cat === cat).length;
            badge.textContent = cnt > 0 ? cnt + ' funds' : cat;
        }
    }

    function mfeSetCat(cat) {
        if (cat===_mfeCur && _mfeCatDone[cat]) return;
        _mfeCur=cat; _mfePage=0;
        // For Sectoral: reset to empty so mfeRenderSubSectPills auto-picks first available
        // For Sectoral: keep last-used sub-sector (or pick first in order).
        // NEVER reset to '' — that breaks the composite done-key check in mfeCatLoad.
        if (cat !== 'Sectoral') {
            _mfeSubSect = 'All';
        } else if (!_mfeSubSect || _mfeSubSect === 'All') {
            _mfeSubSect = MFE_SUBSECT_ORDER[0]; // default to Banking & Finance
        }
        // (keep existing _mfeSubSect if already a valid subsector)
        // Sync the 4 group dropdowns
        mfeSyncCatDropdowns(cat);
        // Update pill styling (desktop) + sync mobile dropdown
        document.querySelectorAll('.mfe-cat-btn').forEach(b=>{
            b.className=b.className.replace(/mfe-cat-(active|inactive)/g,'');
            b.classList.add(b.dataset.cat===cat?'mfe-cat-active':'mfe-cat-inactive');
        });
        const activeBtn = document.querySelector(`.mfe-cat-btn[data-cat="${cat}"]`);
        if (activeBtn) activeBtn.scrollIntoView({behavior:'smooth',block:'nearest',inline:'center'});
        const dd = document.getElementById('mfe-cat-dropdown');
        if (dd && dd.value !== cat) dd.value = cat;
        // Show sub-sector dropdown for Sectoral immediately
        if (cat === 'Sectoral') {
            const wrap = document.getElementById('mfe-subsect-row');
            if (wrap) wrap.classList.remove('hidden');
            const dd = document.getElementById('mfe-ss-dropdown');
            if (dd) {
                // Always rebuild options (counts update as funds load)
                dd.innerHTML = MFE_SUBSECT_ORDER.map(function(ss) {
                    return '<option value="' + ss + '">' + ss + ' — ' + (MFE_SUBSECT_BENCH_LABEL[ss] || 'Nifty 500') + '</option>';
                }).join('');
                dd.value = _mfeSubSect; // keep the already-set subsect
            }
            const badge = document.getElementById('mfe-ss-bench-badge');
            if (badge) badge.textContent = 'vs ' + (MFE_SUBSECT_BENCH_LABEL[_mfeSubSect] || 'Nifty 500');
        }
        mfeRenderSubSectPills();
        const cf=_mfeList.filter(f=>f.cat===cat);
        const _cfEl = document.getElementById('mfe-stat-cat'); if(_cfEl) _cfEl.textContent=cf.length.toLocaleString();
        const _cfEl2 = document.getElementById('mfe-stat-scored'); if(_cfEl2) _cfEl2.textContent='—';
        if (_mfeReady) {
            // For Sectoral, check the composite done key so we don't re-score
            if (cat === 'Sectoral') {
                const _sdKey = 'Sectoral:' + _mfeSubSect;
                if (_mfeCatDone[_sdKey]) {
                    mfeRender(); // already cached — instant
                } else {
                    mfeCatLoad(cat); // needs scoring
                }
            } else {
                mfeCatLoad(cat);
            }
        }
    }

    /* Build sub-sector filter pills (Sectoral only) */
    function mfeRenderSubSectPills() {
        const wrap = document.getElementById('mfe-subsect-row');
        if (!wrap) return;
        if (_mfeCur !== 'Sectoral') { wrap.classList.add('hidden'); return; }
        wrap.classList.remove('hidden');

        // Compute counts from already-loaded funds
        const sectoralFunds = _mfeList.filter(f => f.cat === 'Sectoral');
        const counts = {};
        sectoralFunds.forEach(f => { counts[f.subSect] = (counts[f.subSect]||0) + 1; });

        // Auto-select first available sub-sector if current selection has 0 funds
        const available = MFE_SUBSECT_ORDER.filter(ss => (counts[ss]||0) > 0);
        if (available.length && (!_mfeSubSect || !counts[_mfeSubSect])) {
            _mfeSubSect = available[0];
            const bEl = document.getElementById('mfe-bench-label');
            if (bEl) bEl.textContent = 'Benchmark: ' + (MFE_SUBSECT_BENCH_LABEL[_mfeSubSect] || 'Nifty 500');
            const badge = document.getElementById('mfe-ss-bench-badge');
            if (badge) badge.textContent = 'vs ' + (MFE_SUBSECT_BENCH_LABEL[_mfeSubSect] || 'Nifty 500');
        }

        // ── Unified dropdown (mobile + desktop) ──
        const dd = document.getElementById('mfe-ss-dropdown');
        if (dd) {
            dd.innerHTML = available.map(ss => {
                const cnt  = counts[ss] || 0;
                const bench = MFE_SUBSECT_BENCH_LABEL[ss] || 'Nifty 500';
                return `<option value="${ss}"${_mfeSubSect===ss?' selected':''}>${ss} (${cnt} funds) — ${bench}</option>`;
            }).join('');
        }

        // ── Bench badge ──
        const badge = document.getElementById('mfe-ss-bench-badge');
        if (badge) {
            badge.textContent = 'vs ' + (MFE_SUBSECT_BENCH_LABEL[_mfeSubSect] || 'Nifty 500');
        }
    }

    function mfeSetSubSect(ss) {
        _mfeSubSect = ss; _mfePage = 0;
        const bEl = document.getElementById('mfe-bench-label');
        if (bEl) bEl.textContent = 'Benchmark: ' + (MFE_SUBSECT_BENCH_LABEL[ss] || 'Nifty 500');
        const dd = document.getElementById('mfe-ss-dropdown');
        if (dd && dd.value !== ss) dd.value = ss;
        const badge = document.getElementById('mfe-ss-bench-badge');
        if (badge) badge.textContent = 'vs ' + (MFE_SUBSECT_BENCH_LABEL[ss] || 'Nifty 500');

        // Only trigger scoring if this sub-sector hasn't been computed yet.
        // Composite cache key (code:subSect) means each sub-sector scores exactly once.
        const _ssDoneKey = 'Sectoral:' + ss;
        if (!_mfeCatDone[_ssDoneKey]) {
            // Not yet scored — let mfeCatLoad run step3
            mfeRenderSubSectPills();
            mfeCatLoad('Sectoral');
        } else {
            // Already cached — just re-render instantly
            mfeRenderSubSectPills();
            mfeRender();
        }
    }

    function mfeSortBy(col) {
        _mfeSortDir = _mfeSortCol===col ? -_mfeSortDir : -1;
        _mfeSortCol=col;
        mfeRender();
    }

    function mfeSetCagr(period) {
        _mfeCagrPeriod = period;
        document.querySelectorAll('.mfe-cagr-btn').forEach(b => {
            b.classList.toggle('active', b.dataset.cagr === period);
        });
        mfeRender();
    }

    function mfeGoPage(n) {
        const tp=Math.ceil(_mfeList.filter(f=>f.cat===_mfeCur&&_mfeNavCache[f.code]).length/MFE_PAGE);
        _mfePage=Math.max(0,Math.min(n,tp-1));
        mfeRender();
        document.getElementById('mfe-table-wrap')?.scrollIntoView({behavior:'smooth',block:'start'});
    }

    function mfeOnSearch() { if(_mfeReady) mfeRender(); }

    /* ════════════════════════════════════════════════════════
       HELPERS
    ════════════════════════════════════════════════════════ */
    function _mfeShowTable() { _mfeShow('mfe-table-wrap'); }

    function _mfeProgress(label, sub, pct) {
        _mfeShow('mfe-phase-bar');
        const lb=document.getElementById('mfe-phase-label'),
              sb=document.getElementById('mfe-phase-sub'),
              pb=document.getElementById('mfe-phase-prog'),
              pc=document.getElementById('mfe-phase-pct');
        if(lb) lb.textContent=label;
        if(sb) sb.textContent=sub;
        if(pb) pb.style.width=pct+'%';
        if(pc) pc.textContent=pct+'%';
    }

    function _mfeMsg(main,sub) {
        const a=document.getElementById('mfe-loading-text'),b=document.getElementById('mfe-loading-sub');
        if(a) a.textContent=main; if(b) b.textContent=sub;
    }

    function _mfeShow(id){document.getElementById(id)?.classList.remove('hidden');}
    function _mfeHide(id){document.getElementById(id)?.classList.add('hidden');}
    function _esc(s){return window.esc(s);}   // shared escape helper from auth.js

    function mfeParseCat(n) {
        const nl = n.toLowerCase();
        if (/elss|tax.?sav/.test(nl)) return 'ELSS';
        if (/aggressive.?hybrid/.test(nl))            return 'Aggressive Hybrid';
        if (/conservative.?hybrid/.test(nl))          return 'Conservative Hybrid';
        if (/balanced.?advantage|dynamic.?asset.?alloc/.test(nl)) return 'Balanced Advantage';
        if (/multi.?asset/.test(nl))                  return 'Multi Asset';
        if (/hybrid|balanced|equity.?saving/.test(nl)) return 'Hybrid';
        if (/arbitrage/.test(nl)) return 'Arbitrage';
        if (/gold|silver|commodity|metal/.test(nl)) return 'Commodity';
        if (/international|global|overseas|nasdaq|s&p 500|nyse|ftse|hang.?seng/.test(nl)) return 'International';
        if (/retirement|children.?gift|solution/.test(nl)) return 'Solution';
        if (/overnight/.test(nl)) return 'Overnight';
        if (/liquid/.test(nl))    return 'Liquid';
        if (/ultra.?short|low.?duration/.test(nl))    return 'Ultra Short';
        if (/money.?market/.test(nl))                 return 'Money Market';
        if (/short.?dur/.test(nl))                    return 'Short Duration';
        if (/medium.?dur|medium.?long|long.?dur/.test(nl)) return 'Medium Duration';
        if (/corporate.?bond/.test(nl))               return 'Corporate Bond';
        if (/banking.?psu|psu.?bond/.test(nl))        return 'Banking & PSU Debt';
        if (/gilt|g.?sec|gsec|state.?dev|sdl/.test(nl)) return 'Gilt';
        if (/dynamic.?bond/.test(nl))                 return 'Dynamic Bond';
        if (/debt|bond|credit.?risk|income|duration|floating|crisil|ibx|nbfc|aaa.*fund|financial.?serv.*debt|target.?matur|htm|bharat.?bond/.test(nl)) return 'Debt';
        if (/large.?&.?mid|large.*mid.*cap|largemid/.test(nl)) return 'Large & Mid Cap';
        if (/large.?cap|bluechip|blue.?chip/.test(nl)) return 'Large Cap';
        if (/mid.?cap/.test(nl))   return 'Mid Cap';
        if (/small.?cap/.test(nl)) return 'Small Cap';
        if (/multi.?cap/.test(nl)) return 'Multi Cap';
        if (/flexi.?cap/.test(nl)) return 'Flexi Cap';
        if (/focused/.test(nl))    return 'Focused';
        if (/value|contra|dividend.?yield/.test(nl))  return 'Value/Contra';
        if (/sector|thematic|pharma|health|technolog|infra|fmcg|energy|auto|realty|defence|manufactur|consumption|consumer|housing|media|tourism|transport|mnc/.test(nl)) return 'Sectoral';
        if (/index|nifty|sensex/.test(nl)) return 'Index';
        if (/fund.?of.?fund|fof/.test(nl)) return 'FoF';
        return 'Other';
    }

    function mfeCatFromMeta(c) {
        if(!c) return null;
        const cl = c.toLowerCase();

        // ── ELSS / Tax (check early — contains "elss" or "tax saving") ──
        if (/elss|tax.?sav/.test(cl)) return 'ELSS';

        // ── Large & Mid Cap (must come before large cap / mid cap) ──
        if (/large.?&?.?mid|largemid|large.*mid.*cap/.test(cl)) return 'Large & Mid Cap';

        // ── Equity market cap ──
        if (/large.?cap/.test(cl))  return 'Large Cap';
        if (/mid.?cap/.test(cl))    return 'Mid Cap';
        if (/small.?cap/.test(cl))  return 'Small Cap';

        // ── Multi Cap (SEBI: min 25% each in large/mid/small) ──
        if (/multi.?cap/.test(cl))  return 'Multi Cap';

        // ── Flexi Cap ──
        if (/flexi.?cap/.test(cl))  return 'Flexi Cap';

        // ── Focused Fund ──
        if (/focused/.test(cl))     return 'Focused';

        // ── Value / Contra ──
        if (/value.?fund|contra|dividend.?yield/.test(cl)) return 'Value/Contra';

        // ── Hybrid sub-categories (check before generic 'hybrid') ──
        if (/aggressive.?hybrid/.test(cl))  return 'Aggressive Hybrid';
        if (/conservative.?hybrid/.test(cl)) return 'Conservative Hybrid';
        if (/balanced.?advantage|dynamic.?asset.?alloc/.test(cl)) return 'Balanced Advantage';
        if (/multi.?asset/.test(cl))         return 'Multi Asset';
        if (/equity.?saving/.test(cl))       return 'Hybrid';
        if (/hybrid|balanced/.test(cl))      return 'Hybrid';

        // ── Arbitrage ──
        if (/arbitrage/.test(cl))   return 'Arbitrage';

        // ── Commodity / Gold ──
        if (/gold|commodity/.test(cl)) return 'Commodity';

        // ── International ──
        if (/international|global|overseas/.test(cl)) return 'International';

        // ── Solution Oriented ──
        if (/retirement|children|solution/.test(cl)) return 'Solution';

        // ── Debt sub-categories (order matters — most specific first) ──
        if (/overnight/.test(cl))                          return 'Overnight';
        if (/liquid/.test(cl))                             return 'Liquid';
        if (/ultra.?short|low.?duration/.test(cl))         return 'Ultra Short';
        if (/money.?market/.test(cl))                      return 'Money Market';
        if (/short.?duration/.test(cl))                    return 'Short Duration';
        if (/medium.?duration|long.?duration|medium.*long/.test(cl)) return 'Medium Duration';
        if (/corporate.?bond/.test(cl))                    return 'Corporate Bond';
        if (/banking.?psu|banking.*psu|psu.*bond/.test(cl)) return 'Banking & PSU Debt';
        if (/gilt/.test(cl))                               return 'Gilt';
        if (/dynamic.?bond/.test(cl))                      return 'Dynamic Bond';
        if (/credit.?risk/.test(cl))                       return 'Debt';
        if (/floater|floating.?rate/.test(cl))             return 'Ultra Short';
        // ── Debt catch-all (bond, income, duration, g-sec, SDL, etc.) ──
        if (/debt|bond|income|duration|credit|corporate|money|floating|crisil|ibx|\bsdl\b|state.?dev|g.?sec|gsec|target.?matur|\bhtm\b|bharat.?bond/.test(cl)) return 'Debt';

        // ── Sectoral/thematic ──
        if (/sector|thematic|manufactur|consum|defence|housing|media|tourism|transport|mnc/.test(cl)) return 'Sectoral';

        // ── Index / ETF — equity only (debt already caught above) ──
        if (/index|etf/.test(cl)) return 'Index';

        // ── Fund of Funds ──
        if (/fof|fund.?of/.test(cl)) return 'FoF';

        return null;
    }

    function mfeParseAMC(n) {
        const amcs=['SBI','HDFC','ICICI Prudential','Axis','Kotak','Mirae Asset','Nippon India',
            'UTI','DSP','Franklin Templeton','Tata','Aditya Birla Sun Life','ABSL','Canara Robeco',
            'Parag Parikh','PPFAS','Edelweiss','Motilal Oswal','Quant','Invesco','IDFC','Bandhan',
            'Baroda BNP Paribas','Sundaram','PGIM','Mahindra Manulife','WhiteOak','Bajaj Finserv',
            '360 One','JM Financial','LIC','Navi','Samco','Quantum','NJ'];
        for(const a of amcs) if(n.toLowerCase().includes(a.toLowerCase())) return a;
        return n.split(' ').slice(0,3).join(' ');
    }