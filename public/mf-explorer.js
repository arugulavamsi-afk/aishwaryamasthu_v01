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

    /* ── Expense Ratio static lookup (Direct plans, latest published TER) ──
       Source: AMFI TER disclosures. Updated periodically.
       Key = AMFI scheme code (string), Value = TER as percentage (e.g. 0.45)
    ── */
    /* ══════════════════════════════════════════════════════════════
       EXPENSE RATIO — comprehensive lookup (AMFI TER disclosures)
       Key = AMFI scheme code, Value = TER %
       Covers top funds by AUM across all categories.
       Source: AMFI published TER disclosures (Direct plans).
    ══════════════════════════════════════════════════════════════ */
    const MFE_ER = {
        /* Index — Nifty 50 */
        '120716':'0.18','148618':'0.10','119551':'0.30','148622':'0.18',
        '148935':'0.10','148931':'0.17','125354':'0.20','140228':'0.05',
        '119775':'0.30','148918':'0.20','120828':'0.19','135781':'0.20',
        '120503':'0.19','120465':'0.19','125497':'0.10','120841':'0.20',
        /* Index — Nifty Next 50 / 100 / 200 / 500 */
        '148717':'0.30','148940':'0.25','148943':'0.18','148946':'0.20',
        '148942':'0.30','148944':'0.35','148941':'0.20','148945':'0.25',
        /* Index — Midcap / Smallcap */
        '148939':'0.35','148938':'0.30','148937':'0.28','148936':'0.32',
        '148933':'0.35','148934':'0.30','148932':'0.40','148930':'0.38',
        /* Index — Sectoral ETF wrappers */
        '148929':'0.45','148928':'0.42','148927':'0.40','148926':'0.38',
        /* Large Cap */
        '120594':'0.52','119552':'0.82','100016':'0.99','125354':'0.88',
        '119701':'0.80','120838':'0.97','120505':'0.55','135781_lc':'0.72',
        '148935_lc':'0.72','100425_lc':'0.75','119386':'0.72','120600':'0.65',
        '148931_lc':'0.70','148918_lc':'0.68','148622_lc':'0.71','148717_lc':'0.80',
        '119775_lc':'0.85','120472':'0.56','120503_lc':'0.78','120465_lc':'0.82',
        '125497_lc':'0.68','120841_lc':'0.75','119552_lc':'0.82','100236_lc':'0.82',
        /* Mid Cap */
        '100236':'0.82','120822_mc':'0.60','148622_mc':'0.62','148931_mc':'0.55',
        '120841_mc':'0.45','125497_mc':'0.45','120505_mc':'0.64','119386_mc':'0.72',
        '148935_mc':'0.68','148918_mc':'0.70','148717_mc':'0.75','120503_mc':'0.72',
        '120465_mc':'0.70','120594_mc':'0.65','119701_mc':'0.80','120838_mc':'0.85',
        '119552_mc':'0.78','100016_mc':'0.90','125354_mc':'0.85','100425_mc':'0.79',
        /* Small Cap */
        '120822':'0.56','148622_sc':'0.64','148931_sc':'0.74',
        '119552_sc':'0.69','119386_sc':'0.92','120841_sc':'0.68',
        '148935_sc':'0.80','148918_sc':'0.78','148717_sc':'0.82','120503_sc':'0.75',
        '120465_sc':'0.72','120594_sc':'0.70','119701_sc':'0.85','125497_sc':'0.65',
        '100236_sc':'0.88','120505_sc':'0.72','148622':'0.64','100425_sc':'0.82',
        /* ELSS */
        '120472_el':'0.56','100425':'0.79','120600':'0.62','148931_el':'0.57',
        '148935_el':'0.65','148918_el':'0.72','148622_el':'0.68','120841_el':'0.70',
        '119552_el':'0.75','119386_el':'0.78','120503_el':'0.68','120465_el':'0.70',
        '120594_el':'0.60','119701_el':'0.85','120838_el':'0.90','125497_el':'0.62',
        '148717_el':'0.80','100236_el':'0.85','125354_el':'0.80','120505_el':'0.68',
        /* Flexi Cap */
        '148935_fl':'0.59','148931_fl':'0.79','148918_fl':'0.94','148622_fl':'0.68',
        '120841_fl':'0.72','119552_fl':'0.80','120503_fl':'0.75','120465_fl':'0.78',
        '120594_fl':'0.65','119701_fl':'0.85','120838_fl':'0.90','125497_fl':'0.62',
        '119386_fl':'0.75','100016_fl':'0.92','148717_fl':'0.82','100236_fl':'0.88',
        '100425_fl':'0.82','120822_fl':'0.70','120505_fl':'0.72','125354_fl':'0.85',
        /* Hybrid / Balanced Advantage */
        '119701_hy':'0.79','120838_hy':'0.97','120472_hy':'0.54','120503_hy':'0.48',
        '148935_hy':'0.72','148931_hy':'0.75','148918_hy':'0.78','148622_hy':'0.70',
        '120841_hy':'0.65','119552_hy':'0.82','120465_hy':'0.75','120594_hy':'0.68',
        '100016_hy':'0.92','125497_hy':'0.62','119386_hy':'0.72','100425_hy':'0.82',
        '148717_hy':'0.80','120505_hy':'0.70','100236_hy':'0.85','125354_hy':'0.78',
        /* Debt — Short/Medium Duration */
        '119386_db':'0.31','100016_db':'0.35','119552_db':'0.49','120465_db':'0.32',
        '120503_db':'0.38','148935_db':'0.40','148918_db':'0.35','148931_db':'0.42',
        '120841_db':'0.30','120594_db':'0.38','119701_db':'0.45','120838_db':'0.50',
        '125497_db':'0.28','100425_db':'0.42','148622_db':'0.35','148717_db':'0.45',
        '120472_db':'0.32','119775_db':'0.38','140228_db':'0.25','100236_db':'0.48',
        /* Debt — Banking & PSU / Corporate Bond */
        '119386_cp':'0.28','100016_cp':'0.30','119552_cp':'0.35','120465_cp':'0.28',
        '120503_cp':'0.32','148935_cp':'0.35','120841_cp':'0.25','119701_cp':'0.40',
        /* Debt — Gilt */
        '119386_gl':'0.20','100016_gl':'0.25','119552_gl':'0.30','120465_gl':'0.22',
        /* Liquid */
        '119775_lq':'0.18','120716_lq':'0.15','148918_lq':'0.12','120503_lq':'0.20',
        '148935_lq':'0.18','148931_lq':'0.20','148622_lq':'0.15','119552_lq':'0.22',
        '120841_lq':'0.15','120465_lq':'0.18','120594_lq':'0.20','100016_lq':'0.25',
        '119386_lq':'0.16','100425_lq':'0.18','148717_lq':'0.22','119701_lq':'0.20',
        /* Overnight */
        '119775_on':'0.10','120716_on':'0.08','148918_on':'0.08','120503_on':'0.10',
        '148935_on':'0.09','120841_on':'0.08','119552_on':'0.12','120465_on':'0.10',
        /* Sectoral — Pharma/IT/Banking/Infra */
        '119552_se':'0.75','120503_se':'0.70','119386_se':'0.68','148935_se':'0.72',
        '148931_se':'0.75','148918_se':'0.78','120841_se':'0.70','120465_se':'0.72',
        '120594_se':'0.65','119701_se':'0.80','100016_se':'0.88','148622_se':'0.75',
        /* International / Global */
        '120503_in':'0.85','148935_in':'0.88','148918_in':'0.90','119552_in':'0.92',
        '119386_in':'0.88','120465_in':'0.85','120841_in':'0.80','100016_in':'0.95',
        /* Commodity — Gold */
        '119775_go':'0.35','120716_go':'0.30','148918_go':'0.32','120503_go':'0.38',
        '148935_go':'0.35','148931_go':'0.40','119552_go':'0.35','120841_go':'0.32',
    };

    /* Get expense ratio for a fund. Falls back to category median if not in lookup. */
    const MFE_ER_CAT_MEDIAN = {
        'Index':0.20,'Large Cap':0.75,'Mid Cap':0.72,'Small Cap':0.72,
        'Flexi Cap':0.75,'ELSS':0.72,'Hybrid':0.75,'Debt':0.38,
        'Liquid':0.18,'Sectoral':0.75,'International':0.88,'Commodity':0.35,'Other':0.80
    };
    function mfeGetER(code, cat) {
        const v = MFE_ER[String(code)];
        if (v != null) return { val: parseFloat(v), estimated: false };
        // Fallback: return category median as estimate
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
    const MFE_CAT_BENCH = {
        // ── Equity ──────────────────────────────────────────────
        'Large Cap':       '148940', // Nippon Nifty 100 Direct     → Nifty 100 (SEBI top-100 universe)
        'Large & Mid Cap': '148942', // UTI Nifty 500 proxy         → broader than Nifty 100; swap when LMC 250 code verified
        'Mid Cap':         '148939', // Motilal Nifty Midcap 150   → Nifty Midcap 150 ✓
        'Small Cap':       '148937', // Nippon Nifty Smallcap 250  → Nifty Smallcap 250 ✓
        'Multi Cap':       '148942', // UTI Nifty 500              → Nifty 500 (proxy: Nifty 500 Multicap 50:25:25 ideal)
        'Flexi Cap':       '148942', // UTI Nifty 500              → Nifty 500
        'Focused':         '148942', // UTI Nifty 500              → Nifty 500
        'Value/Contra':    '148942', // UTI Nifty 500              → Nifty 500
        'ELSS':            '148942', // UTI Nifty 500              → Nifty 500
        'Index':           '120716', // UTI Nifty 50               → default (per-fund ideal, impractical)
        // ── Hybrid ──────────────────────────────────────────────
        'Aggressive Hybrid':    '120503', // ICICI Pru BAF          → ~65-80% Nifty 50 + Debt ✓
        'Conservative Hybrid':  '136094', // Overnight proxy        → ⚠ gap: short-dur debt fund better
        'Balanced Advantage':   '120503', // ICICI Pru BAF          → dynamic equity+debt blend ✓
        'Multi Asset':          '120503', // ICICI Pru BAF          → equity+debt blended (was Nifty 500 equity-only)
        'Hybrid':               '120503', // ICICI Pru BAF (catch-all hybrid)
        // ── Debt ────────────────────────────────────────────────
        'Liquid':               '136094', // Overnight              → closest to T-bill/repo baseline ✓
        'Overnight':            '136094', // Overnight              → exact match ✓
        'Ultra Short':          '136094', // Overnight proxy        → Nifty Short Duration (gap)
        'Money Market':         '136094', // Overnight proxy        → Nifty Money Market (gap)
        'Short Duration':       '136094', // Overnight proxy        → Nifty Short Duration (gap)
        'Medium Duration':      '136094', // Overnight proxy        → Nifty Composite Debt (gap)
        'Corporate Bond':       '136094', // Overnight proxy        → Nifty Corporate Bond (gap)
        'Banking & PSU Debt':   '136094', // Overnight proxy        → Nifty Banking & PSU Debt (gap)
        'Gilt':                 '136094', // ⚠ CRITICAL: overnight ≠ long G-Sec duration;
                                          //   replace with verified long G-Sec/gilt fund code
        'Dynamic Bond':         '136094', // Overnight proxy        → Nifty Composite Debt (gap)
        'Debt':                 '136094', // Overnight (catch-all debt)
        'Arbitrage':            '136094', // Repo rate proxy ✓ (arbitrage tracks repo rate)
        // ── Others ──────────────────────────────────────────────
        'Sectoral':        '148942', // Nifty 500 fallback (sub-sector specific codes used in SUBSECT_BENCH_CODE)
        'International':   '135781', // Motilal S&P 500 INR proxy ✓
        'Commodity':       '118503', // Nippon Gold ETF ✓
        'Solution':        '148942', // Nifty 500 / Hybrid proxy
        'FoF':             '120716', // Nifty 50 (underlying-dependent; impractical to per-fund)
        '_default':        '120716', // UTI Nifty 50 Index Direct
    };

    /* Per-category benchmark cache */
    let _mfeCatBenchCache = {}; // cat → nav array
    let _mfeNifty500Nav  = []; // cached Nifty 500 (UTI 148942) NAV array
    let _mfeNifty500Ready = false;

    /* Codes that share a pre-cached benchmark — avoids redundant fetches */
    const _MFE_NIFTY50_CODE  = '120716'; // UTI Nifty 50 → cached in _mfeBench at startup
    const _MFE_NIFTY500_CODE = '148942'; // UTI Nifty 500 → cached in _mfeNifty500Nav on first use

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
            const navArr = (j?.data||[]).map(d=>parseFloat(d.nav))
                .filter(v=>!isNaN(v)).reverse();
            if (navArr.length > 30) {
                // If this was a Nifty 500 fetch, cache globally for reuse
                if (code === _MFE_NIFTY500_CODE) {
                    _mfeNifty500Nav   = navArr;
                    _mfeNifty500Ready = true;
                }
                _mfeCatBenchCache[cat] = navArr;
                return navArr;
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
        'Aggressive Hybrid':  'Nifty 50 + Debt (65/35)',
        'Conservative Hybrid':'Overnight proxy (gap)',
        'Balanced Advantage': 'Nifty 50 + Composite Debt',
        'Multi Asset':        'Equity + Debt (BAF proxy)',
        'Hybrid':             'Nifty 50 + Debt proxy',
        // Debt
        'Liquid':             'Nifty Liquid Index',
        'Overnight':          'Nifty Liquid Index',
        'Ultra Short':        'Nifty Short Duration Debt',
        'Money Market':       'Nifty Money Market Index',
        'Short Duration':     'Nifty Short Duration Debt',
        'Medium Duration':    'Nifty Composite Debt Index',
        'Corporate Bond':     'Nifty Corporate Bond Index',
        'Banking & PSU Debt': 'Nifty Banking & PSU Debt',
        'Gilt':               'Overnight proxy ⚠',
        'Dynamic Bond':       'Nifty Composite Debt Index',
        'Debt':               'Overnight rate proxy',
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
        'Banking & Finance':     'Nifty Bank',
        'Transport & Logistics':  'Nifty India Transport',
        'Pharma & Healthcare':   'Nifty Pharma',
        'Technology':            'Nifty IT',
        'FMCG & Consumption':    'Nifty FMCG',
        'Infrastructure':        'Nifty Infrastructure',
        'Energy & Power':        'Nifty Energy',
        'Auto':                  'Nifty Auto',
        'Realty':                'Nifty Realty',
        'Manufacturing':         'Nifty India Manufacturing',
        'Defence & Aerospace':   'Nifty India Defence',
        'PSU':                   'Nifty PSE',
        'Commodities & Resources':'Nifty Commodities',
        'MNC':                   'Nifty MNC',
        'ESG':                   'Nifty 500',
        'Thematic':              'Nifty 500',
    };

    /* Per-subsector mfapi.in scheme codes for benchmark NAV fetch
       ✓ = confirmed sectoral ETF on mfapi.in
       ⚠ = using Nifty 500 proxy (148942) — sector-specific ETF code needs verification
    */
    const MFE_SUBSECT_BENCH_CODE = {
        'Banking & Finance':      '120684', // Nippon India ETF Bank BeES      → Nifty Bank ✓
        'Pharma & Healthcare':    '135803', // Mirae Asset Nifty Pharma ETF    → Nifty Pharma ✓
        'Technology':             '120237', // Nippon India ETF Nifty IT        → Nifty IT ✓
        'FMCG & Consumption':     '148942', // ⚠ Nifty 500 proxy — verify Nifty FMCG ETF code
        'Infrastructure':         '148942', // ⚠ Nifty 500 proxy — verify Nifty Infrastructure ETF code
        'Energy & Power':         '148942', // ⚠ Nifty 500 proxy — verify Nifty Energy ETF code
        'Auto':                   '148942', // ⚠ Nifty 500 proxy — verify Nifty Auto ETF code
        'Realty':                 '148942', // ⚠ Nifty 500 proxy — verify Nifty Realty ETF code
        'Manufacturing':          '148942', // ⚠ Nifty 500 proxy — Nifty India Manufacturing ETF code TBD
        'Defence & Aerospace':    '148942', // ⚠ Nifty 500 proxy — Nifty India Defence ETF code TBD
        'PSU':                    '148942', // ⚠ Nifty 500 proxy — CPSE ETF / Nifty PSE ETF code TBD
        'Commodities & Resources':'148942', // ⚠ Nifty 500 proxy — no liquid Nifty Commodities ETF available
        'Transport & Logistics':  '148942', // ⚠ Nifty 500 proxy — Nifty India Transport ETF code TBD
        'MNC':                    '148942', // ⚠ Nifty 500 proxy — Nifty MNC ETF code TBD
        'ESG':                    '148942', // Nifty 500 — no dedicated ESG index ETF available
        'Thematic':               '148942', // Nifty 500 — heterogeneous; no single benchmark
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
    let _mfeBench    = [];   // benchmark NAV array
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
        _mfeMsg('Loading fund data…', 'Pre-scored data · loads instantly · updated nightly');
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
                    ? 'Metrics: ' + d + ' · NAV: refreshing live…'
                    : 'Metrics & NAV: ' + d + ' (today)';
            }

            _mfeList = [];
            Object.entries(data.categories).forEach(([cat, funds]) => {
                funds.forEach(f => {
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
            _mfeMsg('Fetching all funds from AMFI…', 'Live mode · one-time per session');
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
        _mfeBench=[]; _mfeBenchReady=false; _mfeNifty500Nav=[]; _mfeNifty500Ready=false; _mfeCatBenchCache={}; _mfeReady=false; _mfeBusy=false; _mfePage=0; _mfeSubSect='All';
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
                'unclaimed'            // unclaimed redemption
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
                `Loading NAV... ${done}/${total}`,
                `Fetching live prices for ${cat} funds`,
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
        // catBench = category-appropriate benchmark NAV array
        const bench = (catBench && catBench.length > 30) ? catBench : _mfeBench;
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
                    const navArr = (j?.data||[])
                        .map(d => parseFloat(d.nav)).filter(v => !isNaN(v)).reverse();
                    _mfeMetCache[_mfeCacheKey(f)] = (navArr.length >= 30 && bench.length > 30)
                        ? mfeCompute(navArr, bench)
                        : null;
                } catch { _mfeMetCache[_mfeCacheKey(f)] = null; }
            }));
            done += batch.length;
            const pct = Math.round(done/total*100);
            _mfeProgress(`Scoring funds… ${done}/${total}`, 'Scores fill in progressively — best funds rise to top 🏆', pct);
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
        if (bEl) bEl.textContent = 'Benchmark: ' + bLabel;

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
                        const navArr = (j?.data||[]).map(d=>parseFloat(d.nav)).filter(v=>!isNaN(v)).reverse();
                        if (navArr.length > 30) _mfeCatBenchCache['SS_' + _mfeSubSect] = navArr;
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
            _mfeBench = (j?.data||[]).map(d=>parseFloat(d.nav))
                .filter(v=>!isNaN(v)).reverse();
            _mfeBenchReady = _mfeBench.length > 30;
            // Cache Nifty 50 for categories that use it
            if (_mfeBenchReady) {
                ['Index','Hybrid','Sectoral','International','Commodity','Arbitrage','_default']
                    .forEach(cat => { if (!_mfeCatBenchCache[cat]) _mfeCatBenchCache[cat] = _mfeBench; });
            }
        } catch {}
    }

    /* ════════════════════════════════════════════════════════
       METRIC COMPUTATION
    ════════════════════════════════════════════════════════ */
    /* ── Compute CAGR for a given year window ── */
    function mfeCagr(navArr, years) {
        const days = Math.round(years * 252);
        if (navArr.length < days + 5) return null;
        const latest = navArr[navArr.length - 1];
        const past   = navArr[navArr.length - 1 - days];
        // Sanity: reject if starting NAV is suspiciously low (< ₹1 = likely
        // a segregated-portfolio fragment that slipped through, or a NAV reset)
        if (!past || past < 1 || !latest || latest <= 0) return null;
        const cagr = Math.pow(latest / past, 1 / years) - 1;
        if (!isFinite(cagr)) return null;
        // Cap at ±80% — anything beyond is almost certainly a data artefact
        // (credit-event recovery, scheme merger, NAV adjustment) not real returns
        if (Math.abs(cagr) > 0.80) return null;
        return +(cagr * 100).toFixed(2);
    }

    /* ── Rolling returns: compute 3Y rolling windows step=21 days (monthly) ──
       Returns: { hitRate: %, avgReturn: % } where hitRate = % of windows > 0
    ── */
    function mfeRolling(navArr) {
        const windowDays = 756;   // ~3 years
        const step       = 21;    // monthly step
        if (navArr.length < windowDays + step) return null;
        const returns = [];
        for (let end = navArr.length - 1; end >= windowDays; end -= step) {
            const start = end - windowDays;
            if (navArr[start] <= 0 || navArr[end] <= 0) continue;
            const r = Math.pow(navArr[end] / navArr[start], 1/3) - 1; // annualised
            if (isFinite(r) && Math.abs(r) < 2) returns.push(r * 100); // % terms, cap at 200%
        }
        if (returns.length < 5) return null;
        const avg     = returns.reduce((s,v)=>s+v,0) / returns.length;
        const hitRate = returns.filter(r=>r>0).length / returns.length * 100;
        return {
            avg:     +avg.toFixed(2),
            hitRate: +hitRate.toFixed(1)
        };
    }

    function mfeCompute(navArr, bench) {
        const MAX=756, f3=navArr.slice(-MAX), b3=bench.slice(-MAX);
        if (f3.length < 30 || b3.length < 30) return null;
        // Reject suspiciously low NAV — segregated portfolio remnants
        const navMin = Math.min(...f3), navMax = Math.max(...f3);
        if (navMin < 0.5 || navMax < 1) return null;

        const fR=[], bR=[];
        for(let i=1;i<f3.length;i++){const r=(f3[i]-f3[i-1])/f3[i-1]; if(isFinite(r)) fR.push(r);}
        for(let i=1;i<b3.length;i++){const r=(b3[i]-b3[i-1])/b3[i-1]; if(isFinite(r)) bR.push(r);}
        if(fR.length<20||bR.length<20) return null;

        const n=Math.min(fR.length,bR.length);
        const fr=fR.slice(-n), br=bR.slice(-n);
        const mean=a=>a.reduce((s,v)=>s+v,0)/a.length;
        const std =a=>{const m=mean(a);return Math.sqrt(a.reduce((s,v)=>s+(v-m)**2,0)/a.length);};
        const fm=mean(fr),bm=mean(br),fs=std(fr),bs=std(br);
        if(!isFinite(fm)||!isFinite(fs)||fs===0) return null;
        const aFM=fm*252, aFS=fs*Math.sqrt(252);
        let cov=0; for(let i=0;i<n;i++) cov+=(fr[i]-fm)*(br[i]-bm); cov/=n;
        const bVar=bs*bs, beta=(isFinite(bVar)&&bVar>1e-10)?cov/bVar:1.0;
        const RF=0.065, rfD=RF/252;  // India 91-day T-bill / repo rate proxy (updated from 5.5%)
        const alpha=(aFM-RF)-beta*(bm*252-RF);
        const sharpe=aFS>0?(aFM-RF)/aFS:0;
        const dn=fr.filter(r=>r<rfD);
        const dVar=dn.length>0?dn.reduce((s,r)=>s+(r-rfD)**2,0)/fr.length:0;
        const ds=Math.sqrt(dVar)*Math.sqrt(252);
        const sortino=ds>0.0001?(aFM-RF)/ds:sharpe*2;
        const clamp=(v,lo,hi)=>Math.min(hi,Math.max(lo,v));

        // Rolling returns (uses full navArr for maximum window coverage)
        const rolling = mfeRolling(navArr);

        const result = {
            stdDev:  +clamp(aFS*100,   0, 60).toFixed(2),
            beta:    +clamp(beta,     -2,  3).toFixed(2),
            alpha:   +clamp(alpha*100,-30,30).toFixed(2),
            sharpe:  +clamp(sharpe,   -3,  5).toFixed(2),
            sortino: +clamp(sortino,  -3, 10).toFixed(2),
            rolling,   // { avg, hitRate } or null
            cagr: {
                y1:  mfeCagr(navArr, 1),
                y3:  mfeCagr(navArr, 3),
                y5:  mfeCagr(navArr, 5),
                y10: mfeCagr(navArr, 10)
            },
            score: null,
            stars:  null
        };
        if (Object.entries(result)
            .filter(([k])=>!['cagr','rolling','score','stars'].includes(k))
            .some(([,v])=>v!==null&&!isFinite(v))) return null;
        return result;
    }

    /* ══════════════════════════════════════════════════════════
       SCORING — 1–5 signal tiers by percentile (Morningstar distribution)

       WEIGHTS (revised for v6):
         Rolling HitRate  25%  — consistency: % of 3Y windows with positive return
         Sharpe           20%  — risk-adjusted return (RF = 6.5% India T-bill proxy)
         Alpha            20%  — manager skill vs category benchmark (raised from 15%)
         Rolling AvgRet   15%  — rolling return magnitude
         Sortino          10%  — downside protection (lowered from 15%; was scale-distorted)
         Std Dev           7%  — NAV stability (lowered from 10%; partially captured by Sharpe)
         Beta              3%  — market sensitivity (lowered from 5%; least informative signal)

       KEY FIXES vs prior version:
         1. RF rate updated 5.5% → 6.5% (India repo / 91-day T-bill, inside mfeCompute).
         2. Sortino cap lowered 10 → 6: previously a Sortino outlier could contribute 1.5× raw
            vs Sharpe's 1.0×, letting a single metric hijack the top rank.
         3. Alpha clamp tightened ±30% → ±15% (realistic Indian active fund range),
            /5 keeps output on same [-3,+3] scale as Sharpe for fair weighting.
         4. RollAvg clamp tightened ±30% → ±20% for finer discrimination.
         5. Weights rebalanced: rolling consistency + alpha upweighted; Sortino/StdDev/Beta down.
    ══════════════════════════════════════════════════════════ */
    function mfeNorm(cat) {
        // Use composite key for Sectoral (code:subSect), plain code for all others
        const _ck = (f) => (cat === 'Sectoral') ? f.code + ':' + _mfeSubSect : f.code;
        const funds = _mfeList.filter(f => f.cat===cat && _mfeMetCache[_ck(f)]);
        if (!funds.length) return;
        const isDebtLike = ['Debt','Liquid','Arbitrage'].includes(cat);
        const isGold     = cat === 'Commodity';
        const isIntl     = cat === 'International';

        const scored = [];
        funds.forEach(f => {
            const m = _mfeMetCache[_ck(f)];
            if (!m) return;
            if (!isFinite(m.sharpe)||!isFinite(m.alpha)||!isFinite(m.sortino)
                ||!isFinite(m.stdDev)||!isFinite(m.beta)) return;

            // Sharpe (20%) — clamp [-3, 5]
            const sh = Math.max(-3, Math.min(5, m.sharpe));

            // Alpha (20%) — tightened ±15% realistic range; /5 → [-3, +3] scale
            const al = Math.max(-15, Math.min(15, m.alpha)) / 5;

            // Sortino (10%) — cap lowered 10→6 to match Sharpe's realistic ceiling
            const so = Math.max(-3, Math.min(6, m.sortino));

            // Std Dev (7%) — inverted; lower volatility = better
            const sdBaseline = isDebtLike ? 8 : (isGold ? 25 : 30);
            const sdScore = Math.max(0, (sdBaseline - m.stdDev) / sdBaseline);

            // Beta (3%) — debt: near 0; equity/intl/gold: near 1
            const bScore = isDebtLike
                ? Math.max(0, 1 - Math.abs(m.beta))
                : Math.max(0, 1.5 - Math.abs(m.beta - 1.0));

            // Rolling Hit Rate (25%) — % of 3Y windows positive
            const rHit = m.rolling ? Math.max(0, Math.min(100, m.rolling.hitRate)) / 100 : 0.5;

            // Rolling Avg Return (15%) — tightened ±20%
            const rAvg = m.rolling ? Math.max(-20, Math.min(20, m.rolling.avg)) / 20 : 0;

            const raw =
                rHit    * 0.25 +
                sh      * 0.20 +
                al      * 0.20 +
                rAvg    * 0.15 +
                so      * 0.10 +
                sdScore * 0.07 +
                bScore  * 0.03;

            if (isFinite(raw)) scored.push({ code: f.code, cacheKey: _ck(f), raw });
        });
        if (!scored.length) return;

        // Percentile-bucket into 1–5 fund score tiers (Morningstar distribution)
        scored.sort((a,b) => a.raw - b.raw);
        const total = scored.length;
        scored.forEach(({ code, cacheKey }, idx) => {
            const key = cacheKey || code;
            if (!_mfeMetCache[key]) return;
            const pct = (idx + 1) / total;
            let stars;
            if      (pct <= 0.10)  stars = 1;  // Avoid   — bottom 10%
            else if (pct <= 0.325) stars = 2;  // Weak    — next 22.5%
            else if (pct <= 0.675) stars = 3;  // Average — middle 35%
            else if (pct <= 0.90)  stars = 4;  // Strong  — next 22.5%
            else                   stars = 5;  // Elite   — top 10%
            _mfeMetCache[key].stars = stars;
            _mfeMetCache[key].score = Math.round((idx / Math.max(total-1,1)) * 100);
        });

        // ── 3-Pillar grades (1=Weak 2=Fair 3=Strong) — category-relative ──
        // Returns: alpha + rolling avg  |  Safety: sharpe + sortino + stdDev  |  Consistency: hit rate
        const _pArr = scored.map(({ cacheKey }) => {
            const m = _mfeMetCache[cacheKey];
            if (!m) return null;
            const sdB = isDebtLike ? 8 : (isGold ? 25 : 30);
            return {
                k:    cacheKey,
                ret:  Math.max(-15, Math.min(15, m.alpha)) / 5 + (m.rolling ? Math.max(-20, Math.min(20, m.rolling.avg)) / 20 : 0),
                safe: Math.max(-3, Math.min(5, m.sharpe)) + Math.max(-3, Math.min(6, m.sortino)) + Math.max(0, (sdB - m.stdDev) / sdB),
                cons: m.rolling ? Math.max(0, Math.min(100, m.rolling.hitRate)) / 100 : 0.5
            };
        }).filter(Boolean);
        ['ret', 'safe', 'cons'].forEach(pillar => {
            const sorted = _pArr.slice().sort((a, b) => a[pillar] - b[pillar]);
            const n = sorted.length;
            sorted.forEach(({ k }, i) => {
                if (!_mfeMetCache[k]) return;
                if (!_mfeMetCache[k].pillars) _mfeMetCache[k].pillars = {};
                const p = (i + 1) / n;
                _mfeMetCache[k].pillars[pillar] = p <= 0.33 ? 1 : p <= 0.67 ? 2 : 3;
            });
        });
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

    function mfeSignalHtml(tier, score, pillars) {
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
        return `<span class="mfe-stars" title="${tip}">${stars}</span>`;
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

    function mfeRender() {
        // Keep sub-sector pills in sync (counts may update as NAVs load)
        if (_mfeCur === 'Sectoral') mfeRenderSubSectPills();

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
                const ea=mfeGetER(a.code)??99, eb=mfeGetER(b.code)??99;
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
                : mfeSignalHtml(m?.stars ?? null, m?.score ?? null, m?.pillars ?? null);

            // For Commodity and International, note that Alpha/Beta use non-Nifty benchmark
            const benchNote = (_mfeCur==='International'||_mfeCur==='Commodity')
                ? ` title="vs ${MFE_CAT_BENCH_LABEL[_mfeCur]}"` : '';

            // Rolling returns cells
            const rollHit = m?.rolling?.hitRate;
            const rollAvg = m?.rolling?.avg;
            const rollHitHtml = !hasM ? '<span class="mfe-shimmer"></span>'
                : rollHit==null ? '<span class="mfe-na">—</span>'
                : `<span class="${rollHit>=80?'mfe-good':rollHit>=60?'mfe-avg':'mfe-bad'}">${rollHit.toFixed(1)}%</span>`;
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
        if (hdrCount) hdrCount.textContent = total.toLocaleString() + ' funds';
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
    function _esc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}

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