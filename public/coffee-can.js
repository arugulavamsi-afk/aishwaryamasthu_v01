/* ═══════════════════════════════════════════════════════════════════
   THE COFFEE CAN — Long-duration quality compounder screener
   Data: curated from public filings (NSE/BSE annual reports, screener.in)
   Methodology: Saurabh Mukherjea / Marcellus Coffee Can framework
   Last dataset update: Mar 2025
   ═══════════════════════════════════════════════════════════════════ */

    var _ccReady = false;
    var _ccSort  = 'score';
    var _ccDir   = -1;
    var _ccSectorFilter = 'All';

    /* ─── SCORING WEIGHTS ─────────────────────────────────────────── */
    // Revenue CAGR 25% | ROCE 25% | Profit Consistency 15%
    // FCF Consistency 15% | Debt Level 10% | Promoter Stability 10%

    /* ─── COFFEE CAN UNIVERSE ──────────────────────────────────────── */
    var CC_DATA = [
        {
            rank:1, name:'TCS', fullName:'Tata Consultancy Services',
            sector:'IT Services', mcap:1380000,
            revCagr:14, avgRoce:43, profitYrs:10, fcf:'Strong', de:0.0,
            promoterTrend:'Stable', promoterPct:72,
            score:87, isFinancial:false,
            why:[
                'Revenue CAGR 14% over 10 years — sustained double-digit growth across cycles ✅',
                'Average ROCE 43% — exceptional capital efficiency with near-zero debt ✅',
                'Profit positive all 10 years including COVID — exemplary consistency ✅',
                'Free Cash Flow matches/exceeds Net Profit every year — zero earnings manipulation risk ✅',
                'Debt-free balance sheet; ₹60,000+ Cr cash on books ✅',
                'Moat: 600,000+ employee talent lock-in, 7 of top 10 global banks as clients, multi-decade relationships ✅'
            ],
            risks:[
                'Revenue growth has slowed to 5–8% in FY24–25 amid global IT spending cuts',
                'High wage inflation in India could compress margins',
                'AI disruption threat to traditional IT services over 5–7 year horizon'
            ],
            moat:'Scale + client stickiness + multi-decade relationships',
            note:''
        },
        {
            rank:2, name:'Page Industries', fullName:'Page Industries (Jockey India)',
            sector:'FMCG – Innerwear', mcap:44000,
            revCagr:16, avgRoce:64, profitYrs:10, fcf:'Strong', de:0.1,
            promoterTrend:'Stable', promoterPct:59,
            score:89, isFinancial:false,
            why:[
                'Revenue CAGR 16% over 10 years — brand-led pricing power driving consistent growth ✅',
                'Average ROCE 64% — best-in-class capital efficiency in Indian consumer space ✅',
                'Profit positive all 10 years — zero down years even in pandemic ✅',
                'Exclusive Jockey license in India creates monopoly-like position ✅',
                'Asset-light model: outsources manufacturing, owns brand & distribution ✅',
                'Strong FCF; high dividend payout ratio ✅'
            ],
            risks:[
                'Licensed business — Jockey contract renewal risk (though historically renewed)',
                'Premiumization trend may slow in a price-sensitive mass market',
                'Online channel (D2C brands like XYXX) creating competitive pressure'
            ],
            moat:'Exclusive Jockey license · brand loyalty · distribution depth',
            note:''
        },
        {
            rank:3, name:'Pidilite', fullName:'Pidilite Industries',
            sector:'Adhesives / Chemicals', mcap:143000,
            revCagr:13, avgRoce:32, profitYrs:10, fcf:'Strong', de:0.1,
            promoterTrend:'Stable', promoterPct:70,
            score:84, isFinancial:false,
            why:[
                'Revenue CAGR 13% over 10 years — consumer + industrial adhesives growth across India ✅',
                'Average ROCE 32% — remarkable for a manufacturing business ✅',
                'Profit positive all 10 years — Fevicol brand acts as pricing umbrella ✅',
                'Fevicol is a verb in India — brand moat comparable to Xerox/Bisleri ✅',
                'Rural penetration still low — long growth runway ahead ✅',
                'FCF consistently positive; minimal capex intensity ✅'
            ],
            risks:[
                'Vinyl Acetate Monomer (VAM) is key raw material — global price volatility affects margins',
                'Valuation remains stretched at 65–70x earnings historically',
                'B2B construction segment cyclically linked to real-estate cycles'
            ],
            moat:'Fevicol brand equity · distribution in 4 lakh+ outlets · switching cost',
            note:''
        },
        {
            rank:4, name:'Asian Paints', fullName:'Asian Paints Ltd',
            sector:'Paints / Decorative', mcap:222000,
            revCagr:12, avgRoce:38, profitYrs:10, fcf:'Strong', de:0.0,
            promoterTrend:'Stable', promoterPct:52,
            score:82, isFinancial:false,
            why:[
                'Revenue CAGR 12% over 10 years — consistent across construction cycles ✅',
                'Average ROCE 38% — strong capital efficiency in a capital-light model ✅',
                'Profit positive all 10 years including FY21 (COVID) ✅',
                '55%+ market share in decorative paints — near-monopoly in India ✅',
                'Superior supply chain: 150+ depots, 60,000+ dealers ✅',
                'Debt-free; strong FCF every year ✅'
            ],
            risks:[
                'New entrants: Grasim (Birla Opus) entering with ₹10,000 Cr investment — competitive threat',
                'Raw material (TiO2, crude-linked) cost volatility',
                'Waterproofing & construction chemicals still small — adjacent category success unproven'
            ],
            moat:'Market share leadership · brand · last-mile distribution',
            note:''
        },
        {
            rank:5, name:'Infosys', fullName:'Infosys Ltd',
            sector:'IT Services', mcap:625000,
            revCagr:12, avgRoce:36, profitYrs:10, fcf:'Very Strong', de:0.0,
            promoterTrend:'Decreasing', promoterPct:15,
            score:81, isFinancial:false,
            why:[
                'Revenue CAGR 12% over 10 years — steady growth with strong deal pipeline ✅',
                'Average ROCE 36% — consistently superior to cost of capital ✅',
                'Profit positive all 10 years — highest industry margins among Tier-1 IT ✅',
                'FCF consistently higher than reported PAT — clean earnings quality ✅',
                'Debt-free; $3B+ cash on books; aggressive buybacks returning value ✅',
                'Strong employee productivity metrics and client concentration well-managed ✅'
            ],
            risks:[
                'Promoter stake very low (15%) — corporate governance questions historically',
                'Revenue growth guidance weak for FY25 (1–3%)',
                'AI/automation displacing traditional IT headcount-based revenue models'
            ],
            moat:'Global delivery model · domain expertise · Fortune 500 relationships',
            note:''
        },
        {
            rank:6, name:'HDFC Bank', fullName:'HDFC Bank Ltd',
            sector:'Private Banking', mcap:1270000,
            revCagr:16, avgRoce:17, profitYrs:10, fcf:'N/A', de:'N/A',
            promoterTrend:'Stable', promoterPct:null,
            score:83, isFinancial:true,
            why:[
                'Revenue (NII) CAGR 16% over 10 years — best-in-class deposit franchise ✅',
                'ROCE 17% (financial sector benchmark) — industry-leading RoA consistently at ~1.8% ✅',
                'Profit positive all 10 years — zero year of loss even during NPE cycle ✅',
                'GNPA maintained below 1.5% vs industry 4–5% — superior credit culture ✅',
                'Current + Savings Account (CASA) ratio 40%+ — low cost of funds moat ✅',
                'Post HDFC merger balance sheet strengthened — liability franchise unmatched ✅'
            ],
            risks:[
                'Post-merger NIM compression ongoing — deposit franchise integration taking time',
                'Slowing credit growth in unsecured retail book (credit cards, personal loans)',
                'RBI regulatory scrutiny on high-growth NBFCs/banks intensifying'
            ],
            moat:'CASA franchise · credit culture · 8,700+ branch network',
            note:'Financial sector: D/E and FCF not applicable. RoA/GNPA used instead.'
        },
        {
            rank:7, name:'Kotak Bank', fullName:'Kotak Mahindra Bank',
            sector:'Private Banking', mcap:365000,
            revCagr:17, avgRoce:13, profitYrs:10, fcf:'N/A', de:'N/A',
            promoterTrend:'Stable', promoterPct:25,
            score:82, isFinancial:true,
            why:[
                'Revenue CAGR 17% over 10 years — disciplined growth, no reckless expansion ✅',
                'Industry-leading RoA ~2.2% — capital-efficient banking model ✅',
                'Profit positive all 10 years — zero NPE cycle casualty ✅',
                'Uday Kotak-led conservative underwriting culture — GNPA <2% consistently ✅',
                'Kotak Securities + AMC + Life Insurance = ecosystem diversification ✅',
                'Lower dependence on high-cost wholesale deposits ✅'
            ],
            risks:[
                'Uday Kotak succession — key-man risk post partial stake reduction',
                'RBI directions on credit card issuance (2024) — near-term growth impact',
                'Valuation premium over peers creates limited margin of safety'
            ],
            moat:'Conservative credit culture · low-cost deposits · promoter-led discipline',
            note:'Financial sector: D/E and FCF not applicable. RoA/GNPA used instead.'
        },
        {
            rank:8, name:'Bajaj Finance', fullName:'Bajaj Finance Ltd',
            sector:'NBFC – Consumer Finance', mcap:448000,
            revCagr:27, avgRoce:12, profitYrs:10, fcf:'N/A', de:'N/A',
            promoterTrend:'Stable', promoterPct:55,
            score:81, isFinancial:true,
            why:[
                'Revenue CAGR 27% over 10 years — highest sustained AUM growth among all Indian NBFCs ✅',
                'RoA consistently ~3.5–4% — best in Indian financial sector ✅',
                'Profit positive all 10 years; NIM maintained >10% ✅',
                'Cross-sell flywheel: 88 Mn+ customers buying 6+ products each ✅',
                'Technology moat: proprietary risk engine processing 100+ data points per application ✅',
                'Bajaj Holdings promoter support; conservative leverage vs peers ✅'
            ],
            risks:[
                'Consumer credit cycle risk — unsecured loans growing; stress visible in FY25',
                'Scale creates law of large numbers challenge — sustaining 25%+ growth harder',
                'Competition from HDFC Bank, SBI Cards intensifying in EMI finance space'
            ],
            moat:'Cross-sell depth · proprietary scoring · Bajaj brand trust',
            note:'Financial sector: D/E per NBFC norms ~3.5x (regulatory). FCF not applicable.'
        },
        {
            rank:9, name:'Divis Labs', fullName:'Divis Laboratories',
            sector:'Pharma – API / CDMO', mcap:118000,
            revCagr:17, avgRoce:28, profitYrs:9, fcf:'Strong', de:0.0,
            promoterTrend:'Stable', promoterPct:52,
            score:80, isFinancial:false,
            why:[
                'Revenue CAGR 17% over 10 years — global generic API supply chain beneficiary ✅',
                'Average ROCE 28% — superior for a capital-intensive pharma manufacturer ✅',
                'Profit positive 9/10 years — one year impacted by US FDA observations ✅',
                'Debt-free; 100% self-funded expansion — no equity dilution ✅',
                'Nutraceuticals and Custom Synthesis segments reduce single-product risk ✅',
                'Backward integrated; among lowest-cost producers globally ✅'
            ],
            risks:[
                'US FDA inspection risk — USFDA warning letters have impacted revenues before',
                'Customer concentration: top 5 clients = ~60% revenue',
                'API business has limited pricing power; commodity pricing risk'
            ],
            moat:'Cost leadership · backward integration · regulatory compliance track record',
            note:''
        },
        {
            rank:10, name:'Nestle India', fullName:'Nestle India Ltd',
            sector:'FMCG – Food & Beverage', mcap:229000,
            revCagr:9, avgRoce:112, profitYrs:10, fcf:'Very Strong', de:0.0,
            promoterTrend:'Stable', promoterPct:62,
            score:80, isFinancial:false,
            why:[
                'Average ROCE 112% — asset-light brand machine; one of highest ROCE in NSE 500 ✅',
                'Profit positive all 10 years — uninterrupted even through Maggi ban (2015) ✅',
                'Free Cash Flow significantly exceeds Net Profit — zero working capital intensity ✅',
                'Maggi 70%+ market share — consumer loyalty resilient across price cycles ✅',
                'Parent (Nestle SA) R&D pipeline keeps product suite fresh ✅',
                'Debt-free; minimal capex; high dividend payout ✅'
            ],
            risks:[
                'Revenue CAGR only 9% — below 12% Coffee Can threshold (borderline case)',
                'Volume growth sluggish in FY24 amid high food inflation pressure on consumer',
                'Single category concentration: Maggi = 30%+ of revenues'
            ],
            moat:'Maggi brand dominance · Nestle SA global backing · distribution network',
            note:'Revenue CAGR slightly below 12% threshold but qualifies on all other metrics.'
        },
        {
            rank:11, name:'HUL', fullName:'Hindustan Unilever Ltd',
            sector:'FMCG – Home & Personal Care', mcap:562000,
            revCagr:10, avgRoce:98, profitYrs:10, fcf:'Very Strong', de:0.0,
            promoterTrend:'Stable', promoterPct:62,
            score:79, isFinancial:false,
            why:[
                'Average ROCE 98% — exceptional asset-light model; minimal capital needed ✅',
                'Profit positive all 10 years — across every economic cycle ✅',
                'FCF equals ~110% of Net Profit — pristine cash conversion ✅',
                'Portfolio covers 35 categories, 50 brands — no single product risk ✅',
                'Unilever global backing for R&D, brand & sustainability ✅',
                'Debt-free; aggressive buybacks; high dividend yield ✅'
            ],
            risks:[
                'Revenue CAGR 10% — modest; volume growth has been 2–4% for several years',
                'Rural slowdown hits mass-market HUL brands disproportionately',
                'Premium segment losing share to D2C brands (Mamaearth, Minimalist, etc.)'
            ],
            moat:'Portfolio breadth · last-mile rural distribution · Unilever R&D',
            note:'Revenue CAGR slightly below 12% threshold; qualifies on quality metrics.'
        },
        {
            rank:12, name:'Titan', fullName:'Titan Company',
            sector:'Lifestyle – Jewellery / Watches', mcap:280000,
            revCagr:17, avgRoce:26, profitYrs:10, fcf:'Moderate', de:0.1,
            promoterTrend:'Stable', promoterPct:52,
            score:78, isFinancial:false,
            why:[
                'Revenue CAGR 17% over 10 years — aspirational India consumption story ✅',
                'Average ROCE 26% — strong for a jewellery business (capital-intensive by nature) ✅',
                'Profit positive all 10 years ✅',
                'Tanishq — most trusted jewellery brand in India; pricing power demonstrated ✅',
                'Watches (Titan/Fastrack), Eyewear (Titan Eye+) diversify revenue mix ✅',
                'Tata group backing provides governance and brand trust ✅'
            ],
            risks:[
                'Jewellery business = 85% revenue; gold price volatility affects demand timing',
                'FCF moderate — gold inventory build-up is capital intensive',
                'Lab-grown diamonds entering jewellery market at 80% lower price'
            ],
            moat:'Tanishq brand premium · Tata trust · organised market share gain from unorganised',
            note:''
        },
        {
            rank:13, name:'Dr. Lal PathLabs', fullName:'Dr. Lal PathLabs Ltd',
            sector:'Healthcare – Diagnostics', mcap:21000,
            revCagr:14, avgRoce:27, profitYrs:10, fcf:'Strong', de:0.0,
            promoterTrend:'Stable', promoterPct:55,
            score:78, isFinancial:false,
            why:[
                'Revenue CAGR 14% over 10 years — diagnostics penetration in India still low ✅',
                'Average ROCE 27% — strong returns from an asset-light hub-and-spoke model ✅',
                'Profit positive all 10 years including COVID year ✅',
                'Debt-free; generates strong FCF from low working capital cycle ✅',
                'Brand trust: 50+ years of history; NABL-accredited labs ✅',
                'Hub and spoke (3 national labs + 200+ processing labs + 8,000+ collection centres) ✅'
            ],
            risks:[
                'Competition from Thyrocare, Metropolis, and aggressive hospital diagnostics',
                'COVID-era windfall has normalised; revenue growth moderated to 8–10%',
                'Price erosion in commoditised tests (CBC, LFT, etc.) from aggregators'
            ],
            moat:'Pan-India collection network · brand trust · test menu breadth',
            note:''
        },
        {
            rank:14, name:'Astral', fullName:'Astral Ltd (formerly Astral Poly)',
            sector:'Building Materials – Pipes', mcap:43000,
            revCagr:19, avgRoce:21, profitYrs:10, fcf:'Moderate', de:0.1,
            promoterTrend:'Stable', promoterPct:55,
            score:76, isFinancial:false,
            why:[
                'Revenue CAGR 19% over 10 years — one of fastest-growing building material stocks ✅',
                'Average ROCE 21% — above threshold for capital-intensive manufacturing ✅',
                'Profit positive all 10 years ✅',
                'Diversified into adhesives (acquired Resinova, Seal IT) to reduce pipes cyclicality ✅',
                'CPVC pipes — technology moat through Lubrizol (USA) partnership ✅',
                'Debt near zero despite heavy expansion ✅'
            ],
            risks:[
                'Building materials sector cyclically linked to real-estate & capex cycle',
                'FCF modest — heavy reinvestment in capacity expansion',
                'Margin pressure from organized competition (Prince, Supreme, Finolex entering CPVC)'
            ],
            moat:'CPVC technology · distribution depth · brand in south & west India',
            note:''
        },
        {
            rank:15, name:'Eicher Motors', fullName:'Eicher Motors Ltd',
            sector:'Automobiles – Premium 2W', mcap:115000,
            revCagr:17, avgRoce:32, profitYrs:9, fcf:'Strong', de:0.0,
            promoterTrend:'Stable', promoterPct:50,
            score:75, isFinancial:false,
            why:[
                'Revenue CAGR 17% over 10 years — Royal Enfield category creator in India ✅',
                'Average ROCE 32% — exceptional for an auto OEM ✅',
                'Profit positive 9/10 years (FY20 slight miss due to BS-VI transition) ✅',
                'Debt-free; every rupee of capex funded from internal accruals ✅',
                'Royal Enfield: 90%+ market share in 250–750cc segment in India ✅',
                'International expansion (Europe, Thailand, Brazil) opening new revenue streams ✅'
            ],
            risks:[
                'Premium 2-wheeler segment sensitive to economic slowdown',
                'New entrants: Harley-Davidson X440, BMW G310, Triumph400 challenging RE',
                'EV transition risk — RE pure-ICE portfolio is a medium-term concern'
            ],
            moat:'Royal Enfield category monopoly · community/lifestyle brand · pricing power',
            note:''
        },
        {
            rank:16, name:'Marico', fullName:'Marico Ltd',
            sector:'FMCG – Personal Care', mcap:60000,
            revCagr:8, avgRoce:42, profitYrs:10, fcf:'Very Strong', de:0.0,
            promoterTrend:'Stable', promoterPct:59,
            score:74, isFinancial:false,
            why:[
                'Average ROCE 42% — among highest ROCE FMCGs on Dalal Street ✅',
                'Profit positive all 10 years ✅',
                'FCF significantly exceeds Net Profit — zero working capital surprise ✅',
                'Parachute — 60% market share in India branded coconut oil; pricing monopoly ✅',
                'Debt-free; high capital return via buybacks and dividends ✅',
                'International (Bangladesh, Egypt, Vietnam) now ~25% revenue — diversified ✅'
            ],
            risks:[
                'Revenue CAGR only 8% — below 12% threshold; sluggish volume growth',
                'Saffola edible oils losing ground to aggressive regional brands',
                'Parachute growth limited by market maturity in core urban India'
            ],
            moat:'Parachute pricing power · international diversification · capital discipline',
            note:'Revenue CAGR below 12% threshold; qualifies on quality, ROCE and FCF metrics.'
        },
        {
            rank:17, name:'Abbott India', fullName:'Abbott India Ltd',
            sector:'Pharma – Specialty / OTC', mcap:22000,
            revCagr:10, avgRoce:35, profitYrs:10, fcf:'Strong', de:0.0,
            promoterTrend:'Stable', promoterPct:75,
            score:74, isFinancial:false,
            why:[
                'Average ROCE 35% — asset-light MNC pharma model; formulation-only, no API risk ✅',
                'Profit positive all 10 years ✅',
                'Debt-free; high cash on books; dividend payout ~100% ✅',
                'Thyronorm — largest thyroid brand in India; near-monopoly position ✅',
                'Abbott Global backing for R&D pipeline and quality standards ✅',
                'Strong FCF; minimal reinvestment needed ✅'
            ],
            risks:[
                'Revenue CAGR only 10% — modest growth',
                'NLEM (National List of Essential Medicines) price control caps on key brands',
                'Promoter (Abbott Laboratories USA) holds 75% — low free float; illiquid'
            ],
            moat:'Thyronorm brand · Abbott global pipeline · formulation expertise',
            note:'Revenue CAGR slightly below 12% threshold; qualifies on quality metrics.'
        },
        {
            rank:18, name:'Torrent Pharma', fullName:'Torrent Pharmaceuticals',
            sector:'Pharma – Branded Generics', mcap:97000,
            revCagr:14, avgRoce:21, profitYrs:9, fcf:'Strong', de:0.4,
            promoterTrend:'Stable', promoterPct:71,
            score:72, isFinancial:false,
            why:[
                'Revenue CAGR 14% over 10 years — domestic branded generics + Germany + Brazil ✅',
                'Average ROCE 21% — improving post acquisition integrations ✅',
                'Profit positive 9/10 years ✅',
                'Strong domestic branded portfolio — chronic therapy (cardio, CNS, gynaec) ✅',
                'Germany business (Heumann) provides Europe diversification ✅',
                'FCF strong post-acquisition debt paydown ✅'
            ],
            risks:[
                'D/E 0.4 — acquisitions (Unichem, Elder) raised debt; watch paydown pace',
                'US FDA inspection risk for Indrad and Dahej plants',
                'Brazil operations facing currency and pricing headwinds'
            ],
            moat:'Domestic brand equity · Germany market position · chronic therapy depth',
            note:''
        },
        {
            rank:19, name:'DMart', fullName:'Avenue Supermarts (DMart)',
            sector:'Retail – Organised Grocery', mcap:265000,
            revCagr:28, avgRoce:19, profitYrs:8, fcf:'Moderate', de:0.1,
            promoterTrend:'Stable', promoterPct:75,
            score:72, isFinancial:false,
            why:[
                'Revenue CAGR 28% since listing — highest retail revenue growth in India ✅',
                'Average ROCE 19% — improving consistently with scale ✅',
                'Debt-near-zero; every store funded from internal cash flows ✅',
                'Own-premises model: 90%+ stores owned, not leased — zero rental risk ✅',
                'EDLC / EDLP (Every Day Low Cost / Price) moat — structural cost advantage ✅',
                'Promoter-run; Radhakishan Damani — legendary capital allocation discipline ✅'
            ],
            risks:[
                'Limited track record (listed 2017) — 10Y data not fully available',
                'Quick commerce (Blinkit, Zepto, Swiggy Instamart) disrupting kirana + DMart',
                'DMart Ready (e-commerce) still subscale — digital pivot slow'
            ],
            moat:'Own-store economics · EDLC model · promoter capital discipline',
            note:'Listed Feb 2017 — data reflects ~8 years; 10Y CAGR extrapolated from IPO DRHP.'
        },
        {
            rank:20, name:'Grindwell Norton', fullName:'Grindwell Norton Ltd',
            sector:'Industrial – Abrasives & Ceramics', mcap:30000,
            revCagr:12, avgRoce:24, profitYrs:9, fcf:'Strong', de:0.0,
            promoterTrend:'Stable', promoterPct:75,
            score:70, isFinancial:false,
            why:[
                'Revenue CAGR 12% over 10 years — niche industrial compounder ✅',
                'Average ROCE 24% — impressive for capital-intensive abrasives manufacturing ✅',
                'Debt-free; steady FCF generation ✅',
                'Saint-Gobain (France) parent: global technology and distribution access ✅',
                'Market leader in abrasives, refractories and ceramics in India ✅',
                'Low-profile, under-analysed company — favoured by long-term investors ✅'
            ],
            risks:[
                'Profit positive 9/10 years — missed once due to global input cost spike',
                'Industrial capex cycle dependent — B2B revenues volatile quarter-to-quarter',
                'Low liquidity (Saint-Gobain holds 75%) — limited institutional coverage'
            ],
            moat:'Saint-Gobain technology · abrasives market leadership · industrial customer stickiness',
            note:''
        }
    ];

    /* ─── HELPERS ──────────────────────────────────────────────────── */
    function _ccFmt(n) { return '₹' + Number(n).toLocaleString('en-IN'); }
    function _ccMcap(cr) {
        if (cr >= 100000) return '₹' + (cr/100000).toFixed(1) + 'L Cr';
        if (cr >= 1000)   return '₹' + Math.round(cr/1000) + ',000 Cr';
        return '₹' + cr.toLocaleString('en-IN') + ' Cr';
    }
    function _ccDeLabel(v) { return (v === 'N/A' || v === null) ? 'N/A*' : v.toFixed(1); }
    function _ccScoreColor(s) {
        if (s >= 85) return '#10b981';
        if (s >= 78) return '#f59e0b';
        return '#6366f1';
    }
    function _ccScoreBg(s) {
        if (s >= 85) return 'rgba(16,185,129,0.12)';
        if (s >= 78) return 'rgba(245,158,11,0.12)';
        return 'rgba(99,102,241,0.12)';
    }
    function _ccFcfColor(f) {
        return f === 'Very Strong' ? '#10b981' : f === 'Strong' ? '#34d399' : f === 'Moderate' ? '#f59e0b' : '#64748b';
    }
    function _ccSectors() {
        var s = new Set(CC_DATA.map(function(c){ return c.sector; }));
        return ['All'].concat(Array.from(s).sort());
    }

    /* ─── SORT + FILTER ────────────────────────────────────────────── */
    function _ccGetData() {
        var d = CC_DATA.slice();
        if (_ccSectorFilter !== 'All') d = d.filter(function(c){ return c.sector === _ccSectorFilter; });
        d.sort(function(a, b) {
            var av = a[_ccSort], bv = b[_ccSort];
            if (av === 'N/A' || av === null) av = -999;
            if (bv === 'N/A' || bv === null) bv = -999;
            if (typeof av === 'string' && av !== -999) {
                var order = {'Very Strong':4,'Strong':3,'Moderate':2,'Weak':1};
                av = order[av] || 0; bv = order[bv] || 0;
            }
            return _ccDir * (av - bv);
        });
        return d;
    }

    function ccSort(col) {
        if (_ccSort === col) _ccDir = -_ccDir; else { _ccSort = col; _ccDir = -1; }
        ccRenderList();
    }

    function ccFilterSector(sel) {
        _ccSectorFilter = sel;
        ccRenderList();
    }

    /* ─── EXPAND/COLLAPSE ───────────────────────────────────────────── */
    function ccToggleDetail(idx) {
        var body = document.getElementById('cc-detail-' + idx);
        var btn  = document.getElementById('cc-expand-' + idx);
        if (!body) return;
        var open = body.style.display !== 'none';
        body.style.display = open ? 'none' : 'block';
        if (btn) btn.textContent = open ? '▼ Details' : '▲ Close';
    }

    /* ─── RENDER LIST ──────────────────────────────────────────────── */
    function ccRenderList() {
        var wrap = document.getElementById('cc-list');
        if (!wrap) return;
        var data = _ccGetData();
        if (data.length === 0) {
            wrap.innerHTML = '<div class="text-center py-8 text-slate-400 text-sm">No companies match the selected sector filter.</div>';
            return;
        }

        wrap.innerHTML = data.map(function(c, i) {
            var sc = c.score;
            var scCol = _ccScoreColor(sc);
            var scBg  = _ccScoreBg(sc);
            var deStr = _ccDeLabel(c.de);
            var mcStr = _ccMcap(c.mcap);
            var rankBadge = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '#' + (i+1);

            var whyHtml = c.why.map(function(w){
                return '<li class="text-[11px] leading-snug" style="color:#1e293b;">' + w + '</li>';
            }).join('');
            var riskHtml = c.risks.length
                ? c.risks.map(function(r){ return '<li class="text-[11px] leading-snug text-amber-700">⚠ ' + r + '</li>'; }).join('')
                : '<li class="text-[11px] text-slate-400">No major red flags identified.</li>';

            return '<div class="rounded-2xl overflow-hidden mb-3" style="border:1.5px solid rgba(245,200,66,0.22);background:#fffef8;">' +
                /* Card header */
                '<div class="flex items-start gap-3 px-4 py-3">' +
                    '<div class="flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center text-sm font-black" style="background:' + scBg + ';color:' + scCol + ';">' + rankBadge + '</div>' +
                    '<div class="flex-1 min-w-0">' +
                        '<div class="flex items-baseline gap-2 flex-wrap">' +
                            '<span class="text-sm font-black text-slate-800">' + c.name + '</span>' +
                            '<span class="text-[10px] font-semibold text-slate-400 truncate">' + c.fullName + '</span>' +
                        '</div>' +
                        '<div class="flex items-center gap-1.5 mt-0.5 flex-wrap">' +
                            '<span class="text-[9px] font-bold px-2 py-0.5 rounded-full" style="background:rgba(99,102,241,0.1);color:#4f46e5;">' + c.sector + '</span>' +
                            '<span class="text-[9px] text-slate-400">' + mcStr + '</span>' +
                            (c.isFinancial ? '<span class="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style="background:rgba(245,158,11,0.12);color:#b45309;">Financial Co.</span>' : '') +
                        '</div>' +
                    '</div>' +
                    /* Score badge */
                    '<div class="flex-shrink-0 text-center">' +
                        '<div class="text-lg font-black leading-none" style="color:' + scCol + ';">' + sc + '</div>' +
                        '<div class="text-[8px] font-bold uppercase tracking-wide" style="color:' + scCol + ';">Score</div>' +
                    '</div>' +
                '</div>' +
                /* Score bar */
                '<div class="mx-4 mb-2 rounded-full overflow-hidden" style="height:4px;background:#f1f5f9;">' +
                    '<div style="width:' + sc + '%;height:100%;background:linear-gradient(90deg,' + scCol + '80,' + scCol + ');border-radius:99px;transition:width 0.4s;"></div>' +
                '</div>' +
                /* Metrics row */
                '<div class="grid grid-cols-4 gap-0 px-4 pb-3">' +
                    _ccMetric('Rev CAGR', c.revCagr + '%', c.revCagr >= 12 ? '#10b981' : '#f59e0b') +
                    _ccMetric('Avg ROCE', c.avgRoce + '%', c.avgRoce >= 20 ? '#10b981' : '#f59e0b') +
                    _ccMetric('Profit', c.profitYrs + '/10', c.profitYrs >= 9 ? '#10b981' : '#f59e0b') +
                    _ccMetric('D/E', deStr, (c.de === 'N/A' || c.de === null || c.de <= 0.5) ? '#10b981' : '#f59e0b') +
                '</div>' +
                /* Moat tag + expand button */
                '<div class="flex items-center gap-2 px-4 pb-3">' +
                    '<span class="text-[9px] font-semibold flex-1 truncate" style="color:#7c5c0a;">🛡 ' + c.moat + '</span>' +
                    '<button id="cc-expand-' + i + '" onclick="ccToggleDetail(' + i + ')" class="text-[9px] font-bold px-2.5 py-1 rounded-lg flex-shrink-0 transition-all" style="background:rgba(245,200,66,0.18);border:1px solid rgba(245,200,66,0.35);color:#92400e;">▼ Details</button>' +
                '</div>' +
                /* Expandable detail */
                '<div id="cc-detail-' + i + '" style="display:none;border-top:1px solid rgba(245,200,66,0.2);">' +
                    '<div class="px-4 py-3 grid sm:grid-cols-2 gap-4">' +
                        '<div>' +
                            '<div class="text-[10px] font-black uppercase tracking-wide mb-1.5" style="color:#065f46;">✅ Why it qualifies</div>' +
                            '<ul class="space-y-1.5 list-none">' + whyHtml + '</ul>' +
                        '</div>' +
                        '<div>' +
                            '<div class="text-[10px] font-black uppercase tracking-wide mb-1.5" style="color:#92400e;">⚠ Risk flags</div>' +
                            '<ul class="space-y-1.5 list-none">' + riskHtml + '</ul>' +
                            (c.note ? '<div class="mt-2 text-[9px] italic text-slate-400">' + c.note + '</div>' : '') +
                        '</div>' +
                    '</div>' +
                '</div>' +
            '</div>';
        }).join('');
    }

    function _ccMetric(label, value, color) {
        return '<div class="text-center">' +
            '<div class="text-[11px] font-black" style="color:' + color + ';">' + value + '</div>' +
            '<div class="text-[8px] text-slate-400 font-semibold uppercase tracking-wide">' + label + '</div>' +
        '</div>';
    }

    /* ─── RENDER CONTROLS ──────────────────────────────────────────── */
    function ccRenderControls() {
        var ctrl = document.getElementById('cc-controls');
        if (!ctrl) return;
        var sectors = _ccSectors();
        var sectorOpts = sectors.map(function(s){
            return '<option value="' + s + '"' + (s === _ccSectorFilter ? ' selected' : '') + '>' + s + '</option>';
        }).join('');

        ctrl.innerHTML =
            '<div class="flex flex-wrap items-center gap-2">' +
                '<select onchange="ccFilterSector(this.value)" class="text-[11px] font-semibold px-3 py-1.5 rounded-xl border" style="background:#fffef5;border-color:rgba(245,200,66,0.4);color:#5c3d00;">' + sectorOpts + '</select>' +
                '<span class="text-[10px] text-slate-400">Sort by:</span>' +
                _ccSortBtn('Score', 'score') +
                _ccSortBtn('Rev CAGR', 'revCagr') +
                _ccSortBtn('ROCE', 'avgRoce') +
                _ccSortBtn('MCap', 'mcap') +
            '</div>';
    }

    function _ccSortBtn(label, col) {
        var active = _ccSort === col;
        return '<button onclick="ccSort(\'' + col + '\')" class="text-[10px] font-bold px-2.5 py-1 rounded-lg transition-all" style="' +
            (active ? 'background:linear-gradient(130deg,#f5c842,#e8a44a);color:#5c3d00;border:none;' : 'background:rgba(245,200,66,0.12);color:#92400e;border:1px solid rgba(245,200,66,0.3);') +
            '">' + label + (active ? (_ccDir === -1 ? ' ↓' : ' ↑') : '') + '</button>';
    }

    /* ─── BASE RATE REALITY TOGGLE ────────────────────────────────── */
    function ccToggleBaseRate() {
        var detail = document.getElementById('cc-baserate-detail');
        var arrow  = document.getElementById('cc-br-arrow');
        if (!detail) return;
        var open = detail.style.display !== 'none';
        detail.style.display = open ? 'none' : 'block';
        if (arrow) arrow.textContent = open ? '▼ Show' : '▲ Hide';
    }

    /* ─── MAIN INIT ─────────────────────────────────────────────────── */
    function initCoffeeCan() {
        if (_ccReady) { ccRenderControls(); ccRenderList(); return; }
        _ccReady = true;
        ccRenderControls();
        ccRenderList();
    }
