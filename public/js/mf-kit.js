        // ==================== MUTUAL FUND KIT ====================

        const MF_DATA = [
            {
                id: 'large-cap', icon: '🏛️', name: 'Large Cap Funds', category: 'equity',
                categoryLabel: 'Equity', categoryColor: '#2563eb', categoryBg: '#eff6ff',
                returns: '10 – 13%', horizon: '5+ yrs', risk: 3, riskLabel: 'Medium–High',
                tagline: 'Invest in India\'s top 100 companies by market cap.',
                what: 'Large cap funds invest at least 80% of their corpus in the top 100 companies by market capitalisation (like Reliance, TCS, HDFC Bank). These companies are industry leaders with proven track records, strong balance sheets, and relatively stable earnings.',
                scenarios: 'Best for first-time equity investors who want market exposure with lower volatility. Ideal for 5–7 year goals where you need equity growth but cannot tolerate sharp drawdowns. Good as the stable core of any equity portfolio.',
                avoid: 'Avoid if you have a short horizon (<3 years) or expect market-beating returns. They tend to underperform mid/small caps during bull runs due to lower growth potential of large companies.',
                example: 'Rohan, 30, starts a ₹10,000/month SIP in Axis Bluechip Fund. Over 10 years at ~11% CAGR, his ₹12L investment grows to ~₹21.9L — steady, inflation-beating returns with relatively lower sleepless nights.',
                popular: 'Mirae Asset Large Cap Fund, Axis Bluechip Fund, ICICI Pru Bluechip Fund, SBI Bluechip Fund, Canara Robeco Bluechip Equity Fund'
            },
            {
                id: 'mid-cap', icon: '🚀', name: 'Mid Cap Funds', category: 'equity',
                categoryLabel: 'Equity', categoryColor: '#2563eb', categoryBg: '#eff6ff',
                returns: '13 – 18%', horizon: '7+ yrs', risk: 4, riskLabel: 'High',
                tagline: 'Bet on tomorrow\'s large caps — companies ranked 101–250.',
                what: 'Mid cap funds invest at least 65% in companies ranked 101–250 by market cap. These are established but growing businesses — they\'ve survived early-stage risks but still have significant headroom for growth. Think of them as future large caps.',
                scenarios: 'Great for investors with 7–10+ year horizons who want higher returns than large caps and can tolerate higher volatility. Best used as a 20–30% satellite allocation alongside large cap or index funds. Excellent for wealth multiplication over a decade.',
                avoid: 'Avoid for emergency funds, short-term goals, or if you panic at 30–40% drawdowns. Mid caps can fall sharply in bear markets and may take 2–3 years to recover.',
                example: 'Priya, 28, puts ₹5,000/month in Kotak Emerging Equity Fund. Over 12 years at ~15% CAGR, her ₹7.2L investment grows to ~₹22.5L. The higher volatility was worth it — her wealth grew 3x vs a safer FD.',
                popular: 'Kotak Emerging Equity Fund, Nippon India Growth Fund, HDFC Mid-Cap Opportunities, Axis Midcap Fund, DSP Midcap Fund'
            },
            {
                id: 'small-cap', icon: '⚡', name: 'Small Cap Funds', category: 'equity',
                categoryLabel: 'Equity', categoryColor: '#2563eb', categoryBg: '#eff6ff',
                returns: '15 – 22%', horizon: '10+ yrs', risk: 5, riskLabel: 'Very High',
                tagline: 'High octane growth — companies ranked 251 and below.',
                what: 'Small cap funds invest at least 65% in companies ranked 251 and beyond by market cap. These are small, often undiscovered businesses with potential for explosive growth but also high risk of failure or prolonged underperformance. Returns can be spectacular or dismal.',
                scenarios: 'Only for aggressive, experienced investors with 10+ year horizons and strong mental fortitude. Can form 10–15% of portfolio for high-growth seekers. Best entered via SIP to average out volatility.',
                avoid: 'Absolutely avoid for any goal shorter than 7–10 years. Not for conservative investors, retirees, or those who check portfolio daily. A 50–60% drawdown is possible and has historically occurred.',
                example: 'Aryan, 25, invests ₹3,000/month in SBI Small Cap Fund. Over 15 years at ~18% CAGR, his ₹5.4L invested becomes ~₹31.2L — over 5x his money! But he had to sit through 2018 and 2020 crashes without selling.',
                popular: 'SBI Small Cap Fund, Nippon India Small Cap Fund, Axis Small Cap Fund, Kotak Small Cap Fund, HDFC Small Cap Fund'
            },
            {
                id: 'flexi-cap', icon: '🔄', name: 'Flexi Cap Funds', category: 'equity',
                categoryLabel: 'Equity', categoryColor: '#2563eb', categoryBg: '#eff6ff',
                returns: '11 – 15%', horizon: '5+ yrs', risk: 4, riskLabel: 'High',
                tagline: 'Fund manager picks the best across all market caps dynamically.',
                what: 'Flexi cap funds can invest in companies of any size — large, mid, or small cap — without any minimum allocation constraint. The fund manager dynamically shifts between market caps based on market conditions and opportunities. This gives maximum flexibility to generate alpha.',
                scenarios: 'Excellent "one fund" equity solution for investors who don\'t want to manage multiple equity funds. The fund manager does the market cap allocation for you. Good for 5–10 year goals, SIPs, and moderate-to-high risk investors.',
                avoid: 'Avoid if you want control over specific market cap allocation. Not ideal if you already have dedicated large, mid, and small cap funds — it may create overlap.',
                example: 'Sunita invests ₹15,000/month in Parag Parikh Flexi Cap Fund. The fund manager shifted to large caps during COVID crash and moved back to mid/small caps in recovery. Over 7 years, her ₹12.6L became ₹24L+.',
                popular: 'Parag Parikh Flexi Cap Fund, HDFC Flexi Cap Fund, UTI Flexi Cap Fund, Kotak Flexicap Fund, Canara Robeco Flexi Cap'
            },
            {
                id: 'multicap', icon: '🌐', name: 'Multi Cap Funds', category: 'equity',
                categoryLabel: 'Equity', categoryColor: '#2563eb', categoryBg: '#eff6ff',
                returns: '12 – 16%', horizon: '7+ yrs', risk: 4, riskLabel: 'High',
                tagline: 'Mandated 25% each in large, mid & small cap — true diversification.',
                what: 'Multi cap funds are mandated by SEBI to invest minimum 25% each in large cap, mid cap, and small cap stocks. This rule-based diversification ensures all three segments are represented, unlike flexi cap where the manager has full discretion.',
                scenarios: 'Great for investors who want guaranteed diversification across all market caps in a single fund. Suitable for 7+ year horizons. The enforced small/mid cap allocation can boost long-term returns compared to pure large cap funds.',
                avoid: 'Not ideal for conservative investors — the mandatory small cap exposure (25%) can cause sharp short-term volatility. Also avoid for goals under 7 years.',
                example: 'Vikram invests ₹8,000/month in Nippon India Multi Cap Fund. The mandatory 25% small cap allocation helped his returns outperform pure large cap funds over a 10-year period at ~14% CAGR, turning ₹9.6L into ₹24.3L.',
                popular: 'Nippon India Multi Cap Fund, HDFC Multi-Cap Fund, Kotak Multicap Fund, Mahindra Manulife Multi Cap Fund, ITI Multi Cap Fund'
            },
            {
                id: 'elss', icon: '🧾', name: 'ELSS (Tax Saving)', category: 'tax',
                categoryLabel: 'Tax Saving', categoryColor: '#7c3aed', categoryBg: '#f5f3ff',
                returns: '12 – 15%', horizon: '3+ yrs (lock-in)', risk: 4, riskLabel: 'High',
                tagline: 'Save up to ₹46,800 tax annually + earn equity returns.',
                what: 'ELSS (Equity Linked Savings Scheme) are equity mutual funds with a mandatory 3-year lock-in period per SIP installment. Investments up to ₹1.5L qualify for Section 80C deduction. With the shortest lock-in among all 80C options and market-linked returns, it is the most rewarding tax-saving instrument.',
                scenarios: 'The #1 choice for tax-saving investors who can tolerate equity risk. If you haven\'t exhausted your ₹1.5L 80C limit, always start with ELSS. Effective annual returns (after tax savings) can be 20%+ for 30% slab taxpayers.',
                avoid: 'Avoid if you need liquidity within 3 years (lock-in is per installment for SIPs). Not suitable for retirees or purely capital-protection seekers.',
                example: 'Kavya (30% tax bracket) invests ₹1,50,000/year in Mirae Asset Tax Saver Fund. She saves ₹46,800 in taxes every year. Over 10 years at 13% CAGR, her investment grows to ₹28.5L. Effective return: ~22% post-tax!',
                popular: 'Mirae Asset ELSS Tax Saver Fund, Quant ELSS Tax Saver Fund, Axis ELSS Tax Saver Fund, SBI Long Term Equity Fund, Canara Robeco ELSS Tax Saver'
            },
            {
                id: 'index', icon: '🔷', name: 'Index Funds', category: 'passive',
                categoryLabel: 'Passive', categoryColor: '#0891b2', categoryBg: '#ecfeff',
                returns: '11 – 13%', horizon: '7+ yrs', risk: 3, riskLabel: 'Medium',
                tagline: 'Track Nifty 50 / Sensex at rock-bottom costs. No fund manager needed.',
                what: 'Index funds passively replicate a market index (Nifty 50, Nifty Next 50, Sensex, etc.) by holding the exact same stocks in the same proportions. No active stock-picking; returns mirror the index. Ultra-low expense ratios (0.05–0.20%) mean more returns stay with you.',
                scenarios: 'Ideal for beginner investors, long-term wealth builders, and those who believe in market efficiency. "Set and forget" — no need to monitor fund manager changes. Use Nifty 50 index funds as the core of your equity portfolio.',
                avoid: 'Won\'t outperform the market — if you want to beat the index, go active. Not ideal if you specifically want mid/small cap exposure (use dedicated index funds for that).',
                example: 'Ritu puts ₹5,000/month in UTI Nifty 50 Index Fund at an expense ratio of 0.20%. Over 20 years at 12% CAGR, ₹12L invested becomes ~₹49.9L. An actively managed fund charging 1.5% would have given only ₹42L — ₹7.9L less!',
                popular: 'UTI Nifty 50 Index Fund, Nippon India Index Fund – Nifty 50, HDFC Index Fund Nifty 50, Navi Nifty 50 Index Fund (0.06% ER), Motilal Oswal Nifty Next 50'
            },
            {
                id: 'etf', icon: '📡', name: 'ETFs (Exchange Traded Funds)', category: 'passive',
                categoryLabel: 'Passive', categoryColor: '#0891b2', categoryBg: '#ecfeff',
                returns: '11 – 13%', horizon: '7+ yrs', risk: 3, riskLabel: 'Medium',
                tagline: 'Like index funds but traded on stock exchanges like shares.',
                what: 'ETFs track an index (like Nifty 50) and trade on stock exchanges just like individual shares. They have even lower expense ratios than index funds (often 0.02–0.05%) but require a Demat account to buy. Price updates in real-time during market hours.',
                scenarios: 'Best for investors with Demat accounts who want the absolute lowest cost index exposure. Great for lumpsum investors and those who want intraday flexibility. Nifty Bees and Nifty 50 ETFs are the most liquid.',
                avoid: 'Not ideal for SIP investors (require manual monthly buying). Avoid illiquid ETFs with low trading volumes — bid-ask spread can eat into returns. Not suited for those without a Demat account.',
                example: 'Shivam buys ₹50,000 worth of Nippon India Nifty 50 Bees ETF at ₹220/unit. The expense ratio is 0.05%. Over 10 years at 12% CAGR, his ₹50,000 grows to ₹1.55L — and the tiny 0.05% cost saved him ₹15,000 vs a higher-expense fund.',
                popular: 'Nippon India Nifty 50 Bees ETF, HDFC Nifty 50 ETF, SBI Nifty 50 ETF, Kotak Nifty 50 ETF, Mirae Asset Nifty 50 ETF'
            },
            {
                id: 'sectoral', icon: '🏗️', name: 'Sectoral / Thematic Funds', category: 'equity',
                categoryLabel: 'Equity', categoryColor: '#2563eb', categoryBg: '#eff6ff',
                returns: '12 – 25%+', horizon: '7+ yrs', risk: 5, riskLabel: 'Very High',
                tagline: 'Concentrate bets on one sector — banking, IT, pharma, infra etc.',
                what: 'Sectoral funds invest 80%+ in a specific sector (banking, technology, pharma, infrastructure, consumption, etc.). Thematic funds are broader — they invest in a theme across sectors (like ESG, manufacturing, digital India). Returns can be massive in upcycles but crashes can be brutal.',
                scenarios: 'Only for investors with strong conviction and deep understanding of a particular sector\'s cycle. Can be used as 5–10% tactical allocation for experienced investors. Best entered at sector lows and exited at peaks.',
                avoid: 'Avoid as a core holding. Never put more than 10–15% in any single sectoral fund. Absolutely avoid if you don\'t understand the sector\'s business cycle. Not for SIPs as a long-term strategy.',
                example: 'Deepak invested ₹2,00,000 in Nippon India Pharma Fund in March 2020 (COVID low). Pharma boomed post-COVID. By March 2022, his investment was worth ₹4,40,000 — a 120% return in 2 years! But by 2023 it fell 20% from peak — showing the boom-bust cycle.',
                popular: 'Nippon India Pharma Fund, ICICI Pru Technology Fund, SBI PSU Fund, Mirae Asset Great Consumer Fund, Quant Infrastructure Fund, Kotak Banking ETF'
            },
            {
                id: 'international', icon: '🌍', name: 'International / Global Funds', category: 'others',
                categoryLabel: 'Others', categoryColor: '#0f766e', categoryBg: '#f0fdfa',
                returns: '10 – 18%', horizon: '7+ yrs', risk: 4, riskLabel: 'High',
                tagline: 'Invest in US, China, global markets from your Indian account.',
                what: 'International funds invest in overseas stocks — US tech giants (Apple, Google, Amazon), global index funds, or country-specific funds (US, China, Europe). They provide geographic diversification and rupee depreciation benefit (as INR weakens, USD-denominated assets gain more in INR terms).',
                scenarios: 'Add 10–20% to your portfolio for geographic diversification and USD exposure. Great for benefiting from global tech growth. Useful hedge against INR depreciation for long-term investors.',
                avoid: 'Currently restricted under SEBI — as of 2023, new subscriptions to many overseas funds are paused. Currency risk is a double-edged sword. Avoid if you don\'t understand forex and global macro factors.',
                example: 'Ananya had ₹1,00,000 in Parag Parikh\'s US-tilted flexi cap fund. USD strengthened 10% against INR over 3 years. Even if US stocks returned 12% in USD terms, she made ~22%+ in INR terms — INR depreciation acting as a bonus return.',
                popular: 'Parag Parikh Flexi Cap (US tilt), Motilal Oswal Nasdaq 100 FOF, Mirae Asset NYSE FANG+ ETF FoF, HDFC Developed World Indexes FOF, Franklin India Feeder – Franklin U.S. Opportunities'
            },
            {
                id: 'liquid', icon: '💧', name: 'Liquid Funds', category: 'debt',
                categoryLabel: 'Debt', categoryColor: '#059669', categoryBg: '#ecfdf5',
                returns: '5.5 – 7%', horizon: '1 day – 3 months', risk: 1, riskLabel: 'Very Low',
                tagline: 'Your savings account alternative — better returns, same-day withdrawal.',
                what: 'Liquid funds invest in very short-term debt instruments (treasury bills, commercial paper, CDs) with maturity up to 91 days. They offer better returns than savings accounts (5.5–7% vs 3–4%) with same-day or next-day withdrawal. NAV is updated every day including weekends.',
                scenarios: 'Park your emergency fund here instead of a savings account. Use for short-term parking of money between investments or before a known expense. Businesses use it to park working capital.',
                avoid: 'Not a long-term investment — returns are only marginally better than savings accounts. Avoid if you need money in under 30 minutes (some funds have a 1-hour settlement delay). Don\'t use as a core portfolio holding.',
                example: 'Neha parks ₹2,00,000 in Nippon India Liquid Fund instead of a savings account. After 6 months at 6.5% p.a., she earns ₹6,500 — double the ₹3,000 her savings account would have given. When she needed the money, it arrived in her account by evening.',
                popular: 'Nippon India Liquid Fund, HDFC Liquid Fund, ICICI Prudential Liquid Fund, Axis Liquid Fund, Mirae Asset Cash Management Fund'
            },
            {
                id: 'ultra-short', icon: '⏱️', name: 'Ultra Short Duration Funds', category: 'debt',
                categoryLabel: 'Debt', categoryColor: '#059669', categoryBg: '#ecfdf5',
                returns: '6 – 7.5%', horizon: '3–6 months', risk: 1, riskLabel: 'Very Low',
                tagline: 'Slightly better than liquid funds for 3–6 month parking needs.',
                what: 'Ultra short duration funds invest in debt instruments with a portfolio maturity of 3–6 months. They offer slightly higher returns than liquid funds while maintaining high liquidity. They\'re suitable for medium-short term parking and are less volatile than short duration funds.',
                scenarios: 'Use for parking money you need in 3–6 months — like advance tax payment, insurance premium, or vacation fund. Also a good alternative to 3-month FDs as exit load is usually nil after 30–90 days.',
                avoid: 'Interest rate changes can slightly impact returns — not risk-free like FDs. Avoid if you need money within 1–7 days (use liquid funds). Not suitable for long-term (1+ year) investment.',
                example: 'Raj is saving for his car down payment in 5 months. He parks ₹3,00,000 in Aditya Birla Ultra Short Duration Fund. At 7% p.a. for 5 months, he earns ₹8,750 — better than a savings account and no TDS if returns stay under ₹5,000/year.',
                popular: 'Aditya Birla SL Savings Fund, ICICI Pru Ultra Short Term Fund, SBI Magnum Ultra Short Duration Fund, Kotak Savings Fund, Nippon India Ultra Short Duration Fund'
            },
            {
                id: 'short-duration', icon: '📅', name: 'Short Duration Funds', category: 'debt',
                categoryLabel: 'Debt', categoryColor: '#059669', categoryBg: '#ecfdf5',
                returns: '6.5 – 8%', horizon: '1–3 yrs', risk: 2, riskLabel: 'Low',
                tagline: 'Debt fund equivalent of a 1–3 year FD — but more tax efficient.',
                what: 'Short duration funds invest in bonds and money market instruments with a portfolio duration of 1–3 years. They offer better returns than liquid/ultra short funds and benefit from falling interest rates. Post Finance Act 2023, all debt fund gains (regardless of holding period) are taxed at your income slab rate — no indexation benefit anymore.',
                scenarios: 'Best for 1–3 year goals where you want better returns than FDs with some flexibility. Note: Post Apr 2023, debt MF gains are taxed at your income slab — same as FD interest. For tax efficiency, consider arbitrage funds if you\'re in the 30% bracket.',
                avoid: 'Rising interest rate environments can cause temporary losses (mark-to-market risk). Not for capital-critical goals or investors who cannot tolerate any short-term volatility.',
                example: 'Suresh has ₹5,00,000 for his sister\'s wedding in 2 years. He puts it in HDFC Short Term Debt Fund at 7.5% p.a. After 2 years, he gets ₹5,79,000 — ₹29,000 more than a 2-year FD at 7%. Plus potential tax efficiency.',
                popular: 'HDFC Short Term Debt Fund, ICICI Pru Short Term Fund, Aditya Birla SL Short Term Fund, Axis Short Duration Fund, Nippon India Short Term Fund'
            },
            {
                id: 'gilt', icon: '🏅', name: 'Gilt Funds', category: 'debt',
                categoryLabel: 'Debt', categoryColor: '#059669', categoryBg: '#ecfdf5',
                returns: '7 – 10%', horizon: '3–5+ yrs', risk: 3, riskLabel: 'Medium',
                tagline: 'Zero credit risk — invest only in government bonds. But interest rate sensitive.',
                what: 'Gilt funds invest exclusively in government securities (G-secs) issued by Central or State governments. There is absolutely zero credit/default risk since the government guarantees repayment. However, they are highly sensitive to interest rate changes — when rates fall, gilt prices rise sharply, and vice versa.',
                scenarios: 'Ideal when you believe interest rates are about to fall significantly (like in a rate cut cycle). Can deliver FD-beating returns in falling rate environments. Good for conservative investors wanting government-only exposure.',
                avoid: 'Avoid during rising interest rate cycles — NAV can fall sharply. Don\'t invest if you need capital protection at a specific date — not suitable for short horizons.',
                example: 'In 2019–2020, when RBI cut rates aggressively, Nippon India Gilt Securities Fund delivered 14–18% annual returns! Investors who bought before the rate cut cycle made FD-beating returns from the safest government bonds.',
                popular: 'SBI Magnum Gilt Fund, ICICI Pru Gilt Fund, Nippon India Gilt Securities Fund, DSP Government Securities Fund, HDFC Gilt Fund'
            },
            {
                id: 'credit-risk', icon: '⚠️', name: 'Credit Risk Funds', category: 'debt',
                categoryLabel: 'Debt', categoryColor: '#059669', categoryBg: '#ecfdf5',
                returns: '8 – 10%', horizon: '3+ yrs', risk: 3, riskLabel: 'Medium–High',
                tagline: 'Higher returns from lower-rated corporate bonds — but comes with default risk.',
                what: 'Credit risk funds invest at least 65% in below AA-rated bonds (i.e., BBB to A+ rated corporate bonds). These bonds pay higher interest to compensate for higher default risk. When companies default, the NAV can crash suddenly. The Franklin India Debt Scandal (2020) was a major example.',
                scenarios: 'Only for sophisticated investors who understand credit risk and can hold 3+ years. Can add 5–10% as a satellite to boost portfolio yield. Should only be bought with proper due diligence on fund house credit quality.',
                avoid: 'Avoid entirely if you\'re a conservative investor. Never put large sums here. Avoid if fund house has a history of credit events. Post-Franklin India episode, many investors exited this category entirely.',
                example: 'The Franklin India Ultra Short Bond Fund fiasco in April 2020: the fund house froze 6 schemes due to credit risk in their portfolios. Investors couldn\'t redeem for months! Some eventually recovered their money, but it was a harsh lesson in credit risk.',
                popular: 'ICICI Pru Credit Risk Fund, Nippon India Credit Risk Fund, SBI Credit Risk Fund (Use only after careful research — this category requires extra caution)'
            },
            {
                id: 'aggressive-hybrid', icon: '⚖️', name: 'Aggressive Hybrid Funds', category: 'hybrid',
                categoryLabel: 'Hybrid', categoryColor: '#b45309', categoryBg: '#fffbeb',
                returns: '10 – 13%', horizon: '5+ yrs', risk: 3, riskLabel: 'Medium–High',
                tagline: '65–80% equity + 20–35% debt = smoother equity-like returns.',
                what: 'Aggressive hybrid funds (formerly "balanced funds") invest 65–80% in equities and the rest in debt. This automatic asset allocation smooths out volatility — when equity falls, debt cushions the blow. They auto-rebalance, reducing the behavioural risk of panic-selling.',
                scenarios: 'Perfect for first-time equity investors who want equity returns but with lower volatility. Excellent "single fund" solution for 5–10 year goals. Great for investors 3–5 years from a goal who want to de-risk while maintaining some growth.',
                avoid: 'Returns may lag pure equity funds in strong bull markets. Not ideal if you specifically want to control your own debt-equity allocation. Slightly less tax efficient due to the debt component.',
                example: 'Meena, 45, is 7 years from retirement. She puts ₹15,000/month in ICICI Pru Equity & Debt Fund. In 2020 COVID crash, while Nifty fell 38%, her fund fell only 25%. She didn\'t panic, stayed invested, and her corpus grew steadily to ₹23L over 8 years.',
                popular: 'ICICI Pru Equity & Debt Fund, SBI Equity Hybrid Fund, Mirae Asset Hybrid Equity Fund, Kotak Equity Hybrid Fund, DSP Equity & Bond Fund'
            },
            {
                id: 'conservative-hybrid', icon: '🛡️', name: 'Conservative Hybrid Funds', category: 'hybrid',
                categoryLabel: 'Hybrid', categoryColor: '#b45309', categoryBg: '#fffbeb',
                returns: '7 – 9%', horizon: '2–3+ yrs', risk: 2, riskLabel: 'Low–Medium',
                tagline: '75–90% debt + 10–25% equity — for capital protection with mild growth.',
                what: 'Conservative hybrid funds invest 75–90% in debt (bonds, G-secs) and 10–25% in equity. The small equity portion aims to deliver slightly better returns than pure debt funds, while the large debt allocation ensures capital stability. Less volatile than aggressive hybrid funds.',
                scenarios: 'Ideal for senior citizens, retirees, or conservative investors who want marginally better returns than FDs/debt funds. Good for 2–3 year goals where some equity exposure is acceptable.',
                avoid: 'Not ideal for aggressive growth targets — equity allocation is too small for meaningful wealth creation. Don\'t use as a complete portfolio solution for long-term goals.',
                example: 'Shanta, 60, parks her retirement corpus in ICICI Pru Regular Savings Fund. The 80% debt ensures stability while the 20% equity gives her inflation-beating returns of ~8–9% annually — much better than FDs, without wild swings.',
                popular: 'ICICI Pru Regular Savings Fund, Kotak Debt Hybrid Fund, SBI Conservative Hybrid Fund, HDFC Hybrid Debt Fund, Canara Robeco Conservative Hybrid Fund'
            },
            {
                id: 'arbitrage', icon: '🔀', name: 'Arbitrage Funds', category: 'hybrid',
                categoryLabel: 'Hybrid', categoryColor: '#b45309', categoryBg: '#fffbeb',
                returns: '5.5 – 7%', horizon: '1–3 months', risk: 1, riskLabel: 'Very Low',
                tagline: 'Almost risk-free returns taxed as equity — ideal for high-tax investors.',
                what: 'Arbitrage funds exploit price differences between cash and futures markets. They simultaneously buy in cash market and sell in futures — locking in a nearly risk-free spread. Since they hold 65%+ in equity, they\'re taxed as equity funds (12.5% LTCG after 1 year vs your slab rate for debt/FD — huge benefit for 30% bracket investors).',
                scenarios: 'Perfect for investors in the 30% tax bracket who want to park money for 3 months to 1 year. Better post-tax returns than liquid/ultra-short funds for high earners. Excellent tax-efficient alternative to short-term FDs.',
                avoid: 'Returns are market-spread dependent and can fall when arbitrage opportunities dry up. Not ideal if you\'re in a lower tax bracket (the equity tax advantage disappears). Don\'t expect equity-like returns.',
                example: 'Vivek (30% tax bracket) parks ₹10L for 8 months in ICICI Pru Arbitrage Fund. He earns ~5.8% p.a. — taxed at 20% STCG (equity). After tax he gets ~4.64%. A liquid fund at 6.5% taxed at 30% slab gives only 4.55%. Arbitrage still wins — and holding >1 year cuts tax to just 12.5% LTCG!',
                popular: 'ICICI Pru Arbitrage Fund, Kotak Equity Arbitrage Fund, Nippon India Arbitrage Fund, SBI Arbitrage Opportunities Fund, Axis Arbitrage Fund'
            },
            {
                id: 'fof', icon: '🗂️', name: 'Fund of Funds (FoF)', category: 'others',
                categoryLabel: 'Others', categoryColor: '#0f766e', categoryBg: '#f0fdfa',
                returns: '9 – 14%', horizon: '5+ yrs', risk: 3, riskLabel: 'Varies',
                tagline: 'A fund that invests in other mutual funds — instant diversification.',
                what: 'A Fund of Funds (FoF) invests in other mutual funds rather than directly in stocks or bonds. It provides instant diversification across multiple funds, fund houses, and strategies. They can be domestic FoFs (investing in Indian MFs) or overseas FoFs (investing in global funds).',
                scenarios: 'Great for novice investors who want a complete portfolio in one fund. Overseas FoFs (like Motilal Oswal Nasdaq 100 FoF) are the only way to access international indices without a foreign brokerage account.',
                avoid: 'Double layer of expense ratios eats into returns. Taxed as debt funds (regardless of underlying equity) post 2023 budget changes — tax efficiency is lower than direct equity. Avoid if you want to optimize costs.',
                example: 'Pooja wants Nasdaq 100 exposure. She invests ₹50,000 in Motilal Oswal Nasdaq 100 FOF. The underlying fund tracks NASDAQ — giving her Apple, Microsoft, Google exposure without a US brokerage account. Over 5 years, US tech boomed and her ₹50k grew to ₹1.1L.',
                popular: 'Motilal Oswal Nasdaq 100 FOF, Mirae Asset NYSE FANG+ ETF FoF, ICICI Pru Multi Asset Fund of Funds, Edelweiss Greater China Equity Off-Shore Fund, Kotak Global Innovation FoF'
            },
            {
                id: 'dynamic-bond', icon: '🎛️', name: 'Dynamic Bond Funds', category: 'debt',
                categoryLabel: 'Debt', categoryColor: '#059669', categoryBg: '#ecfdf5',
                returns: '7 – 10%', horizon: '3+ yrs', risk: 3, riskLabel: 'Medium',
                tagline: 'Fund manager actively adjusts duration based on interest rate outlook.',
                what: 'Dynamic bond funds can invest across any duration of debt instruments. The fund manager actively adjusts the portfolio duration (short or long) based on interest rate expectations. When rates are expected to fall, they go long-duration (to maximize capital gains); when rates are expected to rise, they go short.',
                scenarios: 'Ideal for investors who want professional management of interest rate risk without deciding themselves. Good for 3+ year horizons. Best when you believe in the fund manager\'s macro expertise but don\'t want to time rates yourself.',
                avoid: 'Fund manager calls can go wrong — if the manager misjudges rate direction, returns suffer. Not suitable for investors who want predictable, fixed returns. Avoid for short-term goals.',
                example: 'In 2019–2020 rate cut cycle, ICICI Pru All Seasons Bond Fund (dynamic) delivered ~13% returns by going long-duration. In 2022 rate hike cycle, funds that stayed long-duration lost 2–3%. Dynamic funds that shifted short early preserved capital.',
                popular: 'ICICI Pru All Seasons Bond Fund, SBI Dynamic Bond Fund, Axis Dynamic Bond Fund, HDFC Dynamic Debt Fund, Kotak Dynamic Bond Fund'
            },
            {
                id: 'govt-savings', icon: '🏛️', name: 'Govt Small Savings Schemes', category: 'others',
                categoryLabel: 'Govt Schemes', categoryColor: '#059669', categoryBg: '#ecfdf5',
                returns: '7.1 – 8.2%', horizon: '5–15 yrs', risk: 1, riskLabel: 'Very Low',
                tagline: 'Sovereign-guaranteed instruments — highest safe rates in India.',
                what: 'Government small savings schemes are sovereign-guaranteed instruments managed by the Ministry of Finance and distributed via post offices and authorised banks. They offer the highest guaranteed rates available in India for conservative investors — completely safe, zero default risk, and accessible even in remote areas without a bank account or demat. Key schemes: PPF (7.1%, tax-free, 15 yrs), SCSS (8.2%, for 60+, best retiree rate), POMIS (7.4%, monthly income, 5 yrs), NSC (7.7%, 80C, 5 yrs), KVP (7.5%, doubles in ~9.5 yrs), RBI Floating Rate Bonds (7.35%, 7 yrs, rate resets every 6 months).',
                scenarios: 'Ideal for conservative investors, senior citizens, retirees, Tier-2/3 city residents, and anyone who wants sovereign safety over market returns. If you have not maxed PPF and SCSS before looking at debt mutual funds, you are leaving guaranteed superior returns on the table. Especially important for those without demat accounts or those uncomfortable with market instruments.',
                avoid: 'Most schemes have lock-in periods (1–15 years). Interest on most (except PPF) is taxable at slab rate. KVP and RBI FRB do not qualify for 80C. Check eligibility — SCSS is only for 60+ (or 55+ on VRS).',
                example: 'Shyam, 62, retired with ₹50L corpus. He puts ₹30L in SCSS (8.2%, ₹61,500/quarter) + ₹9L in POMIS (7.4%, ₹5,550/month) + ₹11L in PPF. His guaranteed quarterly + monthly income covers living expenses with zero market exposure — a retiree blueprint using only government schemes.',
                popular: 'SCSS (best for 60+), PPF (best long-term tax-free), POMIS (monthly income), NSC (80C, 5yr), KVP (doubles money), RBI Floating Rate Bonds (large corpus, rate-linked)'
            },
            {
                id: 'large-mid-cap', icon: '🏗️', name: 'Large & Mid Cap Funds', category: 'equity',
                categoryLabel: 'Equity', categoryColor: '#2563eb', categoryBg: '#eff6ff',
                returns: '12 – 16%', horizon: '5+ yrs', risk: 4, riskLabel: 'High',
                tagline: 'Mandatory 35% each in large + mid cap — best of both worlds.',
                what: 'Large & Mid Cap funds are mandated by SEBI to invest minimum 35% in top-100 large cap companies and minimum 35% in mid cap companies (ranked 101–250). Unlike flexi cap funds, the fund manager cannot retreat entirely to large caps during volatile times — the mid cap floor ensures meaningful growth exposure at all times.',
                scenarios: 'Ideal for investors who want large cap stability combined with mid cap growth potential in a single fund. A good alternative to managing a large cap + mid cap combo separately. Suitable for 5–8 year wealth-building goals.',
                avoid: 'The mandatory mid cap allocation (35%) means higher volatility than pure large cap funds. Not suitable for investors with less than 5-year horizon or those who cannot stomach 25–35% drawdowns.',
                example: 'Rohit invests ₹10,000/month in Mirae Asset Large & Midcap Fund. The large cap half provided stability during 2022 correction while the mid cap portion delivered superior gains in the 2023–24 bull run. Over 7 years at ~14% CAGR, his ₹8.4L grew to ₹20.1L.',
                popular: 'Mirae Asset Large & Midcap Fund, Canara Robeco Emerging Equities Fund, Kotak Equity Opportunities Fund, DSP Equity Opportunities Fund, SBI Large & Midcap Fund'
            },
            {
                id: 'focused', icon: '🎯', name: 'Focused Funds', category: 'equity',
                categoryLabel: 'Equity', categoryColor: '#2563eb', categoryBg: '#eff6ff',
                returns: '11 – 16%', horizon: '5+ yrs', risk: 4, riskLabel: 'High',
                tagline: 'Max 30 high-conviction stocks — concentrated bets for higher alpha.',
                what: 'Focused funds are equity funds that invest in a concentrated portfolio of maximum 30 stocks (across any market cap). Unlike diversified equity funds with 50–80 stocks, the fund manager bets heavily on their best ideas. This concentration can lead to significant outperformance — or underperformance — compared to the broader market.',
                scenarios: 'Best for investors who believe in active fund management and want a fund manager\'s highest-conviction calls. Can complement a diversified core portfolio as a satellite allocation (10–20%). Best for 5+ year investors who can handle volatility from concentration risk.',
                avoid: 'Avoid if you want safety in diversification. A wrong call on even 2–3 stocks can hurt significantly since each holding is a large percentage of the portfolio. Not suited for conservative investors or short-term goals.',
                example: 'Anand puts ₹5,000/month in SBI Focused Equity Fund. The fund manager\'s concentrated 25-stock portfolio included early bets on Titan and Bajaj Finance. Over 10 years, this focus on quality compounders delivered ~15.5% CAGR vs Nifty\'s ~13% — turning ₹6L into ₹16.9L.',
                popular: 'SBI Focused Equity Fund, Nippon India Focused Equity Fund, HDFC Focused 30 Fund, Axis Focused Fund, Mirae Asset Focused Fund'
            },
            {
                id: 'value-contra', icon: '💎', name: 'Value / Contra Funds', category: 'equity',
                categoryLabel: 'Equity', categoryColor: '#2563eb', categoryBg: '#eff6ff',
                returns: '11 – 16%', horizon: '7+ yrs', risk: 3, riskLabel: 'Medium–High',
                tagline: 'Buy undervalued or out-of-favour stocks — patience rewarded richly.',
                what: 'Value funds follow the Warren Buffett philosophy — buying stocks trading below their intrinsic value (low P/E, P/B ratios) and holding until the market recognises their true worth. Contra funds take a contrarian approach — investing in sectors or stocks currently out of favour with the market crowd. Both require patience as undervalued stocks can remain so for extended periods.',
                scenarios: 'Great for patient, long-term investors (7+ years) who can wait for value unlocking. Historically outperforms during market recoveries after bear markets. Best used as a 15–25% satellite allocation alongside core diversified equity funds.',
                avoid: 'Value traps are real — some cheap stocks are cheap for a reason (poor business fundamentals). These funds can significantly underperform in growth-led bull markets. Not suitable for investors who need consistent year-on-year performance.',
                example: 'Meenakshi bought ₹2,00,000 of Quant Value Fund in early 2020 when PSU and value stocks were deeply out of favour. By 2023, PSU stocks roared back — the fund delivered ~35% CAGR over 3 years. Value investing requires conviction to buy when others are selling.',
                popular: 'Quant Value Fund, ICICI Pru Value Discovery Fund, Nippon India Value Fund, JM Value Fund, UTI Value Opportunities Fund'
            },
            {
                id: 'balanced-advantage', icon: '⚖️', name: 'Balanced Advantage Funds (BAF)', category: 'hybrid',
                categoryLabel: 'Hybrid', categoryColor: '#b45309', categoryBg: '#fffbeb',
                returns: '9 – 12%', horizon: '3+ yrs', risk: 2, riskLabel: 'Low–Medium',
                tagline: 'Automatically buys equity cheap and books profits when expensive.',
                what: 'Balanced Advantage Funds (also called Dynamic Asset Allocation Funds) use quantitative models — based on P/E ratios, P/B ratios, or earnings yield — to automatically shift allocation between equity and debt. When equity is expensive (high P/E), they reduce equity; when cheap, they increase it. This mechanical de-risking removes human emotional bias from asset allocation.',
                scenarios: 'Ideal for investors who want market participation but without managing their own equity-debt rebalancing. Great for investors in their 40s–50s who want growth with downside protection. Excellent "all-weather" fund for new investors uncertain about market timing.',
                avoid: 'The model-driven de-risking can cause underperformance during strong, sustained bull runs (when equity is reduced based on valuation). Returns will lag pure equity funds over very long periods. Not designed to maximise returns — designed to manage drawdowns.',
                example: 'HDFC Balanced Advantage Fund automatically reduced equity from 75% to 30% in 2021 (high valuations), then deployed back to 65%+ in the 2022 correction. Investors enjoyed ~11% CAGR with maximum drawdown of only ~18% vs Nifty\'s ~25% — peace of mind in exchange for slightly lower returns.',
                popular: 'HDFC Balanced Advantage Fund, ICICI Pru Balanced Advantage Fund, Nippon India Balanced Advantage Fund, Edelweiss Balanced Advantage Fund, Kotak Balanced Advantage Fund'
            },
            {
                id: 'multi-asset', icon: '🌈', name: 'Multi Asset Allocation Funds', category: 'hybrid',
                categoryLabel: 'Hybrid', categoryColor: '#b45309', categoryBg: '#fffbeb',
                returns: '9 – 13%', horizon: '3–5+ yrs', risk: 3, riskLabel: 'Medium',
                tagline: 'Equity + Debt + Gold in one fund — true all-weather diversification.',
                what: 'Multi Asset Allocation funds invest in at least 3 asset classes with minimum 10% allocation to each. Typically they hold equity (40–60%), debt (20–30%), and gold or REITs (10–20%). This true multi-asset approach means at least one asset class is usually performing well — cushioning drawdowns while maintaining growth. Gold and equity often move inversely, providing natural hedging.',
                scenarios: 'Excellent "complete portfolio in one fund" solution, especially for investors who want automatic gold + equity + debt rebalancing. Great for 3–5 year goals, investors in their 40s, and those who find portfolio management overwhelming. Also useful as a core holding during uncertain macro environments.',
                avoid: 'The gold/alternative allocation can drag returns during strong equity bull markets. Tax treatment depends on equity allocation — check if the fund qualifies as equity-oriented (65%+ equity) for tax purposes. Not ideal if you want to separately control each asset class allocation.',
                example: 'Nalini, 42, puts ₹12,000/month in ICICI Pru Multi Asset Fund. When equity markets fell 20% in 2022, her portfolio fell only 11% because gold surged 12% in INR terms (USD strengthened). She continued her SIP confidently — her diversified mix delivered ~11% CAGR over 5 years with far less anxiety.',
                popular: 'ICICI Pru Multi Asset Fund, Nippon India Multi Asset Fund, Quant Multi Asset Fund, Tata Multi Asset Opportunities Fund, Axis Multi Asset Allocation Fund'
            },
            {
                id: 'equity-savings', icon: '🏦', name: 'Equity Savings Funds', category: 'hybrid',
                categoryLabel: 'Hybrid', categoryColor: '#b45309', categoryBg: '#fffbeb',
                returns: '7 – 9%', horizon: '1–2+ yrs', risk: 2, riskLabel: 'Low–Medium',
                tagline: 'Equity tax efficiency with debt-like stability — a smart middle ground.',
                what: 'Equity Savings funds split allocation across three buckets: unhedged equity (25–40%, for growth), equity arbitrage (25–35%, for equity taxation without equity risk), and debt (25–35%, for stability). Since they hold 65%+ in equity (including arbitrage), they are taxed as equity funds — giving them a significant tax advantage over pure debt funds for investors in high tax brackets.',
                scenarios: 'Perfect for investors in 20–30% tax brackets who want better post-tax returns than FDs or debt funds for 1–2 year goals. A great step-up from liquid/ultra-short funds for money needed in 12–24 months. Also suitable for retirees who want monthly dividend-like income with lower volatility.',
                avoid: 'Lower upside than aggressive hybrid or equity funds. The arbitrage component means gross returns look lower than pure equity. Not suited for very short term (<1 year) due to exit loads and equity STCG tax applicability.',
                example: 'Suresh (30% tax slab) has ₹5,00,000 to deploy for 18 months. A 1-year FD at 7% gives ₹35,000 interest — taxed at 30% slab, net ₹24,500. Equity Savings Fund returning 8% gives ₹40,000 gain — but taxed at just 12.5% LTCG after 1 year (holding post Apr 2023), net ₹35,000. He keeps ₹10,500 extra!',
                popular: 'HDFC Equity Savings Fund, ICICI Pru Equity Savings Fund, Nippon India Equity Savings Fund, Kotak Equity Savings Fund, SBI Equity Savings Fund'
            },
            {
                id: 'overnight', icon: '🌙', name: 'Overnight Funds', category: 'debt',
                categoryLabel: 'Debt', categoryColor: '#059669', categoryBg: '#ecfdf5',
                returns: '5 – 6%', horizon: '1 day – 1 week', risk: 1, riskLabel: 'Very Low',
                tagline: 'The safest debt fund — money deployed just for one day at a time.',
                what: 'Overnight funds invest exclusively in securities that mature the next business day — primarily TREPS (Tri-party Repo) and CBLOs. The portfolio is completely rolled over every single day. This means zero interest rate risk (duration is literally 1 day) and near-zero credit risk. NAV changes are tiny and predictable — essentially a moving parking lot for cash.',
                scenarios: 'Best for parking money for 1–7 days — like waiting to deploy into equity after receiving salary or a lump sum. Corporates use it for daily cash management. Better than keeping cash idle in a bank savings account for very short periods. Zero exit load in most funds.',
                avoid: 'Returns are slightly lower than liquid funds (no term premium). Not appropriate for anything beyond 1–2 weeks — move to liquid funds for longer. Interest income is taxed at your slab rate — no tax advantage.',
                example: 'Kabir receives his ₹10,00,000 bonus and plans to invest it in an NFO opening in 5 days. He parks it in Nippon India Overnight Fund. At ~5.5% p.a., he earns ₹754 in 5 days instead of earning nothing in his savings account. When the NFO opens, he redeems — credited next morning.',
                popular: 'Nippon India Overnight Fund, HDFC Overnight Fund, ICICI Pru Overnight Fund, SBI Overnight Fund, Aditya Birla SL Overnight Fund'
            },
            {
                id: 'money-market', icon: '💹', name: 'Money Market Funds', category: 'debt',
                categoryLabel: 'Debt', categoryColor: '#059669', categoryBg: '#ecfdf5',
                returns: '6 – 7.5%', horizon: '3–12 months', risk: 1, riskLabel: 'Very Low',
                tagline: 'Higher than liquid funds — invests in T-bills and CDs up to 1 year.',
                what: 'Money Market funds invest in high-quality short-term instruments — Treasury Bills (T-bills), Certificates of Deposit (CDs), Commercial Papers (CPs) — with maturity up to 1 year. They sit between liquid funds (up to 91 days) and ultra-short duration funds (3–6 months) in the risk-return spectrum. Very low credit risk due to focus on government securities and top-rated issuers.',
                scenarios: 'Excellent alternative to 6–12 month FDs with slightly better returns and full liquidity. Use for systematic transfer plans (STP) into equity funds — park a lump sum and STP monthly. Also suitable for businesses managing 3–12 month working capital.',
                avoid: 'Marginally sensitive to interest rate movements (unlike overnight/liquid funds). Gains taxed at income slab — same as FD interest post-2023. Not suitable for goals beyond 12–18 months (use short/medium duration funds).',
                example: 'Pooja receives ₹8,00,000 from matured NSC and plans to invest ₹50,000/month in equity via STP over 16 months. She parks the corpus in HDFC Money Market Fund at ~7% p.a. As she transfers monthly, the remaining corpus keeps earning — better than letting it sit idle in a savings account.',
                popular: 'HDFC Money Market Fund, Nippon India Money Market Fund, ICICI Pru Money Market Fund, Aditya Birla SL Money Manager Fund, UTI Money Market Fund'
            },
            {
                id: 'medium-duration', icon: '📆', name: 'Medium Duration Funds', category: 'debt',
                categoryLabel: 'Debt', categoryColor: '#059669', categoryBg: '#ecfdf5',
                returns: '7 – 9%', horizon: '3–4 yrs', risk: 3, riskLabel: 'Medium',
                tagline: 'FD alternative for 3–4 year money — higher returns, more interest rate risk.',
                what: 'Medium duration funds invest in bonds with portfolio Macaulay duration of 3–4 years. They hold a mix of government bonds, PSU bonds, and corporate bonds of medium maturity. Higher duration than short-duration funds means higher sensitivity to interest rate changes — both on the upside (falling rates boost returns significantly) and downside (rising rates can cause temporary NAV dips).',
                scenarios: 'Best when you expect interest rates to remain stable or fall over the next 3–4 years. A good alternative to 3-year FDs for investors in lower tax brackets. Can benefit from capital appreciation when RBI enters a rate-cutting cycle.',
                avoid: 'Rising interest rate environments (like 2022) can cause meaningful NAV drawdowns due to the longer duration. Not suitable for investors who need capital protection at a specific future date. All gains taxed at slab rate post Apr 2023.',
                example: 'In 2019, Anil parked ₹5,00,000 in ICICI Pru Medium Term Bond Fund expecting the rate cut cycle. As RBI cut rates by 250 bps, his fund delivered ~9.5% annually over 3 years — far better than the ~7% FD he would have locked into. ₹5L became ₹6.57L.',
                popular: 'ICICI Pru Medium Term Bond Fund, Aditya Birla SL Medium Term Plan, SBI Magnum Medium Duration Fund, HDFC Medium Term Debt Fund, Nippon India Strategic Debt Fund'
            },
            {
                id: 'corporate-bond', icon: '🏢', name: 'Corporate Bond Funds', category: 'debt',
                categoryLabel: 'Debt', categoryColor: '#059669', categoryBg: '#ecfdf5',
                returns: '7 – 8.5%', horizon: '1–3 yrs', risk: 2, riskLabel: 'Low',
                tagline: 'Top-rated company bonds only — safety with a yield pickup over gilts.',
                what: 'Corporate Bond funds invest minimum 80% in AA+ or higher-rated corporate bonds — only the highest-quality debt issued by companies like HDFC, TCS, Infosys, NTPC. These funds deliberately avoid lower-rated bonds (unlike credit risk funds) to maintain quality. They typically yield 0.3–0.8% more than government securities of similar maturity, with minimal credit risk.',
                scenarios: 'Good for risk-averse investors who want slightly higher returns than G-sec/gilt funds without taking on meaningful credit risk. Suitable for 1–3 year goals where capital safety is important. Better post-tax alternative to bank FDs for investors in lower tax brackets.',
                avoid: 'Sensitive to interest rate movements — not as safe as liquid/overnight funds during rate hike cycles. Returns are taxed at income slab rate (same as FD). Cannot compete with short/medium duration funds if rates fall sharply.',
                example: 'Kavita parks ₹10,00,000 retirement bonus in ICICI Pru Corporate Bond Fund for 2 years. At 7.8% p.a., she earns ₹1,62,000 over 2 years — ₹12,000 more than a comparable bank FD at 7%. The portfolio holds only AAA/AA+ rated bonds — comparable safety to top-rated FDs.',
                popular: 'ICICI Pru Corporate Bond Fund, Aditya Birla SL Corporate Bond Fund, HDFC Corporate Bond Fund, Kotak Corporate Bond Fund, Nippon India Corporate Bond Fund'
            },
            {
                id: 'banking-psu', icon: '🏦', name: 'Banking & PSU Debt Funds', category: 'debt',
                categoryLabel: 'Debt', categoryColor: '#059669', categoryBg: '#ecfdf5',
                returns: '6.5 – 8%', horizon: '1–3 yrs', risk: 2, riskLabel: 'Low',
                tagline: 'Banks and government-owned company bonds — near-sovereign safety.',
                what: 'Banking & PSU Debt funds invest minimum 80% in bonds issued by banks (SBI, HDFC Bank, ICICI Bank) and Public Sector Undertakings (NTPC, NHAI, RECL, Power Finance). These entities have implicit or explicit government backing — extremely low probability of default. The combination gives safety close to gilts but with higher yields since they\'re corporate issuers.',
                scenarios: 'Ideal for conservative investors who want better returns than pure gilt or liquid funds but cannot tolerate any credit risk. Great for senior citizens, retirees, and institutions parking large funds. Also suitable for 2–3 year goals where capital safety is paramount.',
                avoid: 'Slightly sensitive to interest rate movements (duration typically 2–3 years). Returns lower than corporate bond funds that take on some credit risk. Gains taxed at income slab rate — same limitation as other debt funds post-2023.',
                example: 'An 58-year-old pre-retiree parks ₹15,00,000 in Nippon India Banking & PSU Debt Fund, 3 years before retirement. At 7.5% p.a. over 3 years, the corpus grows to ₹18,64,000 — more than a bank FD, with the comfort that every bond in the portfolio is from a PSU or scheduled bank.',
                popular: 'Nippon India Banking & PSU Debt Fund, HDFC Banking and PSU Debt Fund, Kotak Banking and PSU Debt Fund, Axis Banking & PSU Debt Fund, IDFC Banking & PSU Debt Fund'
            },
            {
                id: 'gold-funds', icon: '🥇', name: 'Gold Funds & Gold ETFs', category: 'others',
                categoryLabel: 'Others', categoryColor: '#0f766e', categoryBg: '#f0fdfa',
                returns: '8 – 12%', horizon: '5+ yrs', risk: 3, riskLabel: 'Medium',
                tagline: 'Digital gold — hedge against inflation, crisis, and INR depreciation.',
                what: 'Gold Funds (Fund of Funds investing in Gold ETFs) and Gold ETFs give you pure gold price exposure without physical storage, making charges, or purity risk. Gold ETFs track domestic gold prices (international price + import duty + INR/USD rate). Gold historically acts as a safe haven during geopolitical crises, equity market crashes, and high inflation — making it a powerful portfolio diversifier.',
                scenarios: 'Allocate 5–15% of your portfolio to gold for diversification and crisis hedging. Gold tends to rise when equity markets fall and during INR depreciation — making it an excellent portfolio stabiliser. Especially useful if you have upcoming foreign travel/education expenses (natural USD hedge). Also superior to buying physical gold (no making charges, theft risk, or impurity).',
                avoid: 'Gold pays no dividends or interest — returns come only from price appreciation. Can underperform for long stretches during equity bull markets (2003–2007, 2014–2018). Gains taxed at slab rate after Finance Act 2023 changes. Don\'t hold more than 15% — it\'s a diversifier, not a growth engine.',
                example: 'During COVID-19 panic in March 2020, Nifty crashed 38% but gold rose 24% in INR terms (global uncertainty + INR weakening). An investor with 10% gold in their portfolio saw overall drawdown of ~28% vs ~38% without gold. After lockdowns ended, equity recovered and gold stabilised — the 10% allocation had done its job.',
                popular: 'Nippon India Gold BeES (Gold ETF), HDFC Gold ETF, SBI Gold ETF, Axis Gold ETF, Kotak Gold ETF — For SIP investors: Nippon India Gold Savings Fund (FoF), SBI Gold Fund, HDFC Gold Fund'
            },
            {
                id: 'solution-oriented', icon: '🎓', name: 'Solution Oriented Funds', category: 'others',
                categoryLabel: 'Others', categoryColor: '#0f766e', categoryBg: '#f0fdfa',
                returns: '10 – 14%', horizon: '5–25 yrs', risk: 4, riskLabel: 'High',
                tagline: 'Retirement and children\'s funds — goal-linked, with mandatory lock-in.',
                what: 'Solution Oriented Funds are SEBI-defined category specifically for two life goals: (1) Retirement Funds — help build a corpus for post-retirement income; (2) Children\'s Gift Funds — build wealth for a child\'s education, marriage, or future. Both have a mandatory lock-in of 5 years or until the investor turns 60 (retirement) / child reaches 18 (children\'s fund). They typically invest in equity-heavy portfolios with automatic glide path (shifting to safer debt as the goal approaches).',
                scenarios: 'Best for investors who want to ring-fence money for a specific long-term goal and prevent premature withdrawals. The lock-in enforces investment discipline — preventing panic-selling during market crashes. If you struggle with staying invested during volatility, the forced lock-in is a feature, not a bug.',
                avoid: 'The mandatory lock-in means you cannot access the money in emergencies. Returns are similar to a diversified equity fund — you are not getting a premium for the lock-in. Pure equity funds with self-imposed discipline may serve the same purpose with more flexibility.',
                example: 'Arjun opens a Nippon India Retirement Fund for his daughter at her birth with ₹5,000/month. Over 25 years at ~12% CAGR (equity-heavy phase), then gradually shifting to debt, his ₹15L total investment becomes ~₹94L by the time she turns 25 — fully funded education + wedding corpus, and he never dipped into it.',
                popular: 'Nippon India Retirement Fund, HDFC Retirement Savings Fund (Equity Plan), ICICI Pru Child Care Plan, Tata Retirement Savings Fund, UTI Retirement Benefit Pension Fund'
            }
        ];

        let _mfCurrentFilter = 'all';
        let _mfRendered = false;
        let _pickerRendered = false;
        let _pickerCurrentFilter = 'all';
        const PICKER_METRIC_CATEGORY = {
            alpha:'returns', beta:'risk', sharpe:'risk', stddev:'risk',
            expense:'cost', sortino:'risk', rsquared:'structure',
            rollingreturn:'returns', aum:'structure', directvsregular:'cost',
            exitloadtax:'cost', aumquickref:'structure'
        };

        // ===== FUND QUALITY METRICS DATA =====
        const MF_METRICS = [
            {
                id: 'alpha',
                icon: '🏆',
                name: 'Alpha (α)',
                tagline: 'How much extra return the fund delivered above its benchmark',
                description: 'Alpha measures the fund manager\'s skill. An Alpha of +2 means the fund returned 2% more than its benchmark after adjusting for risk. A negative Alpha means the manager actually destroyed value — you\'d have been better off in an index fund.',
                goodRange: '> 0 (ideally > 1% consistently)',
                badRange: '< 0 (underperforming the benchmark)',
                goodColor: '#16a34a',
                badColor: '#dc2626',
                goodLabel: 'Positive = Manager adds value',
                badLabel: 'Negative = Stick to index funds',
                tip: 'Look at 3-year and 5-year Alpha, not just 1-year. Any manager can get lucky once.',
                example: 'Nifty 50 returns 12%. A fund with +2 Alpha returned ~14%. One with -1 Alpha returned ~11% — worse than just buying the index.',
                meter: 75,
                meterColor: '#16a34a'
            },
            {
                id: 'beta',
                icon: '📉',
                name: 'Beta (β)',
                tagline: 'How much the fund swings when the market moves',
                description: 'Beta tells you how volatile a fund is relative to the market. A Beta of 1.2 means if the Nifty falls 10%, this fund typically falls 12%. A Beta of 0.8 means it falls only 8%. Higher Beta = higher risk AND higher potential reward.',
                goodRange: '0.8–1.0 for stable funds; <0.8 for conservative',
                badRange: '>1.2 unless you are actively seeking high risk',
                goodColor: '#2563eb',
                badColor: '#ea580c',
                goodLabel: '~1.0 = moves with market',
                badLabel: '>1.2 = amplified swings',
                tip: 'Beta above 1 is fine for aggressive investors with long horizons. Avoid in retirement or short-term goals.',
                example: 'Market falls 20% in a crash. A Beta-1.3 fund falls 26%. A Beta-0.7 fund falls only 14%. Same market, very different impact.',
                meter: 60,
                meterColor: '#2563eb'
            },
            {
                id: 'sharpe',
                icon: '⚖️',
                name: 'Sharpe Ratio',
                tagline: 'Return earned per unit of total risk taken',
                description: 'Sharpe Ratio = (Fund Return − Risk-Free Rate) ÷ Standard Deviation. It answers: "Was the extra return worth the extra risk?" A Sharpe of 1.5 is good; 2+ is excellent. Two funds with 15% returns can have very different Sharpe ratios depending on how bumpy the ride was.',
                goodRange: '> 1.0 (good), > 1.5 (excellent), > 2.0 (outstanding)',
                badRange: '< 0.5 (poor risk-adjusted return)',
                goodColor: '#16a34a',
                badColor: '#dc2626',
                goodLabel: '>1.0 = decent risk-return trade-off',
                badLabel: '<0.5 = too much risk for return',
                tip: 'Use Sharpe to compare two funds in the same category. Never compare equity Sharpe to debt Sharpe.',
                example: 'Fund A returns 18% with Sharpe 0.6. Fund B returns 15% with Sharpe 1.4. Fund B is the smarter pick despite lower returns.',
                meter: 80,
                meterColor: '#16a34a'
            },
            {
                id: 'stddev',
                icon: '📊',
                name: 'Standard Deviation',
                tagline: 'How wildly the fund\'s returns fluctuate month to month',
                description: 'Standard Deviation (SD) measures return volatility. A fund with 15% average return and SD of 5% is stable — returns stay roughly between 10%–20%. The same fund with SD of 20% could return anywhere from -5% to 35%. Low SD = smoother ride.',
                goodRange: 'Equity: <15% preferred; Debt: <3%; Lower is calmer',
                badRange: 'Equity: >25% is very volatile; Debt: >6% is risky',
                goodColor: '#0891b2',
                badColor: '#dc2626',
                goodLabel: 'Lower SD = more predictable',
                badLabel: 'High SD = wild swings in NAV',
                tip: 'Compare SD within the same category. A mid-cap fund\'s SD will naturally be higher than a large-cap fund.',
                example: 'Two large-cap funds: Fund A SD = 10%, Fund B SD = 22%. Fund B feels like a rollercoaster even though it\'s in the same category.',
                meter: 55,
                meterColor: '#0891b2'
            },
            {
                id: 'expense',
                icon: '💸',
                name: 'Expense Ratio',
                tagline: 'Annual fee the fund deducts from your corpus — every single year',
                description: 'Expense Ratio is the annual cost charged by the AMC, deducted from NAV daily. On a ₹10 lakh investment, a 1.5% expense ratio costs ₹15,000/year regardless of performance. Over 20 years, the difference between a 0.5% and 1.5% expense ratio can be lakhs.',
                goodRange: 'Index Funds: <0.3%; Active Equity: <1.0%; Active Debt: <0.7%',
                badRange: 'Active Equity >2%; any fund consistently above category average',
                goodColor: '#16a34a',
                badColor: '#dc2626',
                goodLabel: 'Lower = more returns stay with you',
                badLabel: 'High ratio = silent wealth destroyer',
                tip: 'Compare Direct Plan vs Regular Plan. Regular plans are 0.5%–1% higher — that\'s commission going to the distributor, not you.',
                example: '₹10L growing at 12% for 20 years: 0% expense = ₹96L. 1.5% expense = ₹72L. A ₹24 lakh difference from fees alone.',
                meter: 90,
                meterColor: '#16a34a'
            },
            {
                id: 'sortino',
                icon: '🛡️',
                name: 'Sortino Ratio',
                tagline: 'Like Sharpe, but only penalises downside volatility',
                description: 'Sharpe penalises ALL volatility — including upward swings. Sortino only penalises downside risk (bad days). A fund that shoots up 5% one month and stays flat next month has high Sharpe volatility but zero Sortino downside risk. Sortino is more investor-friendly.',
                goodRange: '> 1.0 (good), > 2.0 (excellent)',
                badRange: '< 0.5 (too much downside for the return)',
                goodColor: '#7c3aed',
                badColor: '#dc2626',
                goodLabel: '>1.0 = good downside protection',
                badLabel: '<0.5 = frequent bad months',
                tip: 'Sortino is especially useful for funds you need to partially redeem (SWP). Low Sortino means your SWP gets hit hard in downturns.',
                example: 'Fund A Sortino 0.4: often drops 3–5% in bad months. Fund B Sortino 1.8: drops rarely and mildly. Both may have same annual return.',
                meter: 70,
                meterColor: '#7c3aed'
            },
            {
                id: 'rsquared',
                icon: '🔗',
                name: 'R-Squared (R²)',
                tagline: 'How closely the fund tracks its benchmark index',
                description: 'R-Squared (0–100%) tells you how much of the fund\'s movement is explained by the benchmark. An R² of 95% means 95% of the fund\'s ups and downs mirror the index. High R² + high expense ratio = you are paying active fees for passive behaviour. That\'s bad.',
                goodRange: 'Active funds: 70–85% (manager is making distinct choices); Passive: >97%',
                badRange: 'Active funds: >95% (closet indexer — why pay active fees?)',
                goodColor: '#0891b2',
                badColor: '#ea580c',
                goodLabel: '~75-85% = manager making real decisions',
                badLabel: '>95% = switch to a cheap index fund',
                tip: 'R² > 95% in an active fund is called "closet indexing." The manager barely deviates from the index but charges you full active fees.',
                example: 'An active large-cap fund with R² = 97% and expense 1.8%. You pay 18x more than a Nifty 50 index fund for virtually the same portfolio.',
                meter: 65,
                meterColor: '#0891b2'
            },
            {
                id: 'rollingreturn',
                icon: '📅',
                name: 'Rolling Returns',
                tagline: 'Consistency of returns across every possible period — not cherry-picked dates',
                description: 'A fund may show "15% returns" — but that depends on exactly when you measure from and to. Rolling Returns calculate the return for every possible start date over a period (e.g., every 3-year window). A fund with a high average rolling return AND low variance is truly consistent, not just lucky timing.',
                goodRange: '3-yr rolling return: consistency matters more than peak; look for % of periods with positive return',
                badRange: 'High average but wide variance = lucky streaks, not skill',
                goodColor: '#16a34a',
                badColor: '#ea580c',
                goodLabel: 'Consistent positive rolling = reliable manager',
                badLabel: 'Huge variance = get lucky or get hurt',
                tip: 'On Groww, Morningstar, or Value Research, check if a fund beats its benchmark in >60% of all rolling 3-year windows.',
                example: 'Fund A: 3-yr rolling average 14%, variance high — 8% to 22%. Fund B: 12%, tight range 10%–14%. Fund B is the safer SIP pick.',
                meter: 72,
                meterColor: '#16a34a'
            },
            {
                id: 'aum',
                icon: '🏦',
                name: 'AUM & Fund Size',
                tagline: 'Too small = risky; too large = harder to outperform',
                description: 'Assets Under Management (AUM) matters differently by category. A tiny AUM (<₹500 Cr) makes a fund vulnerable to redemption pressure — big investors exiting forces the fund to sell holdings at bad prices. But a massive AUM (>₹50,000 Cr) in mid-cap can hurt performance — hard to buy enough small-company shares without moving prices.',
                goodRange: 'Large Cap: ₹5,000–50,000 Cr fine; Mid/Small Cap: ₹500–15,000 Cr sweet spot',
                badRange: 'Any category: <₹100 Cr (too small); Mid/Small Cap: >₹25,000 Cr (too large)',
                goodColor: '#0891b2',
                badColor: '#ea580c',
                goodLabel: 'Right-sized for its category',
                badLabel: 'Too small = fragile; too large = index-like',
                tip: 'A mid-cap fund that\'s grown to ₹30,000 Cr often quietly shifts to large-caps to deploy capital — check the portfolio.',
                example: 'A small-cap fund at ₹50,000 Cr cannot meaningfully hold small-cap stocks — it would move the price just by buying.',
                meter: 58,
                meterColor: '#0891b2'
            },
            {
                id: 'directvsregular',
                icon: '🎯',
                name: 'Direct vs Regular Plan',
                tagline: 'Same fund, same manager — but one silently costs you lakhs more',
                description: 'Every mutual fund offers two plans: Direct (you invest directly with the AMC, no distributor) and Regular (you invest via a broker/distributor who earns a commission). The fund, manager, and strategy are 100% identical — only the expense ratio differs. That small difference in cost compounds massively over a decade.',
                goodRange: 'Direct Plan: 0.5–1.5% lower expense ratio; 1–2% higher annual returns over time',
                badRange: 'Regular Plan: distributor earns 0.5–1.5% trail commission — paid by YOU, every year, forever',
                goodColor: '#16a34a',
                badColor: '#dc2626',
                goodLabel: 'Direct Plan = keep your full alpha',
                badLabel: 'Regular Plan = silent commission drain',
                tip: 'Switch to Direct via Zerodha Coin, Groww Direct, or the AMC website directly. Takes 10 minutes, saves lakhs over 20 years.',
                example: '₹10,000 SIP for 20 years at 13% (Direct) = ₹1.37 Cr. At 11.5% (Regular after 1.5% drag) = ₹1.09 Cr. Regular costs you ₹28 lakh just in commissions.',
                meter: 90,
                meterColor: '#16a34a'
            },
            {
                id: 'exitloadtax',
                icon: '🧾',
                name: 'Exit Load & Taxation',
                tagline: 'What you don\'t know about redemption can cost you dearly',
                description: 'Exit Load is a penalty charged when you redeem a fund within a specified period (usually 1 year for equity funds = 1% exit load). Taxation depends on the holding period and fund type. Post-2023 budget, debt fund gains are taxed as per your income slab — a major change for conservative investors.',
                goodRange: 'Equity (LTCG >1yr): 12.5% on gains above ₹1.25L p.a. | STCG <1yr: 20% flat',
                badRange: 'Debt (post Apr 2023): Gains taxed at your income slab rate regardless of holding period',
                goodColor: '#7c3aed',
                badColor: '#ea580c',
                goodLabel: 'Hold >1yr for equity LTCG benefit',
                badLabel: 'Redeem early = exit load + STCG tax hit',
                tip: 'For debt investing, now consider FDs or direct bond platforms — the indexation benefit on debt MFs was removed in Budget 2023.',
                example: 'Redeeming a ₹5L equity fund after 10 months: pay 1% exit load (₹5,000) + 20% STCG on gains. Waiting just 2 more months saves you both.',
                meter: 75,
                meterColor: '#7c3aed'
            },
            {
                id: 'aumquickref',
                icon: '📐',
                name: 'AUM Size Quick Reference',
                tagline: 'At-a-glance: ideal fund size by category',
                description: 'AUM thresholds aren\'t one-size-fits-all. A ₹50,000 Cr large-cap fund is perfectly fine; the same AUM in a small-cap fund is a performance disaster. Use this quick guide to judge fund size at a glance — the \'Goldilocks Zone\' is where a fund is big enough to be stable but small enough to be nimble.',
                goodRange: 'Liquid/Debt: any size fine | Large Cap: ₹5K–₹80K Cr | Flexi Cap: ₹5K–₹40K Cr | Mid Cap: ₹1K–₹20K Cr | Small Cap: ₹500–₹10K Cr',
                badRange: 'Small/Mid Cap >₹25,000 Cr: fund becomes a closet large-cap | Any category <₹100 Cr: fragile and illiquid',
                goodColor: '#0891b2',
                badColor: '#ea580c',
                goodLabel: 'Goldilocks zone: stable yet nimble',
                badLabel: 'Outside range = structural performance drag',
                tip: 'Check AUM trend, not just current size. A fund doubling AUM in 1 year after strong returns is a warning — performance may not repeat at larger scale.',
                example: 'Quant Small Cap Fund: grew from ₹1,000 Cr to ₹25,000 Cr in 2 years post strong returns. New investors face a structurally different fund than early entrants enjoyed.',
                meter: 62,
                meterColor: '#0891b2'
            }
        ];

        const MF_CHECKLIST = [
            { icon: '📊', question: 'Is Alpha positive for 3+ consecutive years?', pass: 'Manager consistently beats benchmark', fail: 'Consider an index fund instead' },
            { icon: '⚖️', question: 'Is Sharpe Ratio above 1.0?', pass: 'Returns justify the risk you\'re taking', fail: 'You\'re getting poor compensation for volatility' },
            { icon: '💸', question: 'Is Expense Ratio below the category average?', pass: 'More of your return stays with you', fail: 'Silent drag on your compounding — switch to Direct Plan' },
            { icon: '🔗', question: 'For active funds, is R² below 90%?', pass: 'Manager is making genuinely active decisions', fail: 'You\'re paying for active management but getting index-like results' },
            { icon: '📅', question: 'Does the fund beat benchmark in >60% of rolling 3-yr windows?', pass: 'Consistent outperformance, not just lucky timing', fail: 'Returns may be timing-dependent — risky for SIP investors' },
            { icon: '🏦', question: 'Is the fund size right for its category?', pass: 'AUM is appropriate for the fund\'s mandate', fail: 'Too large = forced into different stocks; too small = vulnerable to redemptions' }
        ];

        // AUM category visual data for the quick reference card
        const AUM_CATEGORY_BARS = [
            { label: 'Liquid / Debt', min: 0, good: 500, max: 150000, goodLabel: 'Any size OK', color: '#059669', icon: '🏛️' },
            { label: 'Large Cap',     min: 100, good: 5000, cap: 80000, max: 150000, goodLabel: '₹5K–80K Cr', color: '#2563eb', icon: '📊' },
            { label: 'Flexi Cap',     min: 100, good: 5000, cap: 40000, max: 150000, goodLabel: '₹5K–40K Cr', color: '#7c3aed', icon: '🔄' },
            { label: 'Mid Cap',       min: 100, good: 1000, cap: 20000, max: 150000, goodLabel: '₹1K–20K Cr', color: '#d97706', icon: '📈' },
            { label: 'Small Cap',     min: 100, good: 500,  cap: 10000, max: 150000, goodLabel: '₹500–10K Cr', color: '#dc2626', icon: '🚀' },
        ];

        function renderAUMQuickRefCard() {
            const rows = AUM_CATEGORY_BARS.map(c => {
                const total = 150000;
                const goodStart = Math.round((c.good / total) * 100);
                const goodEnd   = c.cap ? Math.round((c.cap / total) * 100) : 100;
                const goodWidth = goodEnd - goodStart;
                const alertText = c.cap ? `>₹${c.cap>=1000 ? c.cap/1000+'K' : c.cap}Cr ⚠️` : '✅ flexible';
                return `
                <div class="flex items-center gap-2">
                    <span class="text-base w-5 flex-shrink-0">${c.icon}</span>
                    <span class="text-[10px] font-bold text-slate-700 w-20 flex-shrink-0 leading-tight">${c.label}</span>
                    <div class="flex-1 flex flex-col gap-0.5">
                        <div class="relative h-4 bg-slate-200 rounded-full overflow-hidden">
                            <div class="absolute h-full rounded-full" style="left:${goodStart}%;width:${goodWidth}%;background:${c.color};"></div>
                        </div>
                        <span style="font-size:9px;font-weight:700;color:${c.color};padding-left:${goodStart}%;">${c.goodLabel}</span>
                    </div>
                    <span style="font-size:9px;font-weight:700;color:#e11d48;width:60px;flex-shrink:0;text-align:right;line-height:1.2;">${alertText}</span>
                </div>`;
            }).join('');
            return `
            <div class="px-4 py-3 flex flex-col gap-3">
                <p class="text-[11px] text-slate-500 leading-relaxed">Each bar shows the <span class="font-bold text-emerald-700">green zone</span> (ideal AUM range). Anything to the right of the green zone = too large; fund behaviour changes.</p>
                <div class="flex flex-col gap-3">${rows}</div>
                <div class="flex items-center gap-3 mt-1 flex-wrap">
                    <div class="flex items-center gap-1.5"><span class="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span><span class="text-[9px] text-slate-500 font-bold">Sweet spot</span></div>
                    <div class="flex items-center gap-1.5"><span class="w-3 h-3 rounded-full bg-slate-200 inline-block"></span><span class="text-[9px] text-slate-500 font-bold">Caution zone</span></div>
                    <div class="flex items-center gap-1.5"><span class="text-rose-500 text-[9px] font-black">⚠️</span><span class="text-[9px] text-slate-500 font-bold">Too large — changes mandate</span></div>
                </div>
            </div>`;
        }

        function renderMFPickerSection() {
            // Render metric cards
            const grid = document.getElementById('mf-metric-cards');
            if (!grid) return;
            grid.innerHTML = '';
            MF_METRICS.forEach((m, idx) => {
                const isAUMQuickRef     = m.id === 'aumquickref';
                const isDirectVsRegular = m.id === 'directvsregular';
                const directVsRegularBody = `
                    <div class="px-4 py-3 space-y-2.5">
                        <p class="text-[11px] text-slate-600 leading-relaxed">${m.description}</p>
                        <!-- Side-by-side visual comparison -->
                        <div class="grid grid-cols-2 gap-2">
                            <div class="rounded-xl p-3 border-2 border-emerald-200 bg-emerald-50 text-center">
                                <div class="text-lg mb-1">🎯</div>
                                <div class="text-[10px] font-black text-emerald-800 uppercase tracking-wide">Direct Plan</div>
                                <div class="text-xs font-black text-emerald-700 mt-1">₹1.37 Cr</div>
                                <div class="text-[9px] text-emerald-600 font-medium">₹10K SIP × 20 yrs</div>
                                <div class="mt-1.5 text-[9px] font-bold text-emerald-700 bg-emerald-100 rounded-lg px-1.5 py-0.5">You keep 100%</div>
                            </div>
                            <div class="rounded-xl p-3 border-2 border-rose-200 bg-rose-50 text-center">
                                <div class="text-lg mb-1">💸</div>
                                <div class="text-[10px] font-black text-rose-800 uppercase tracking-wide">Regular Plan</div>
                                <div class="text-xs font-black text-rose-700 mt-1">₹1.09 Cr</div>
                                <div class="text-[9px] text-rose-600 font-medium">Same SIP × 20 yrs</div>
                                <div class="mt-1.5 text-[9px] font-bold text-rose-700 bg-rose-100 rounded-lg px-1.5 py-0.5">₹28L lost to fees</div>
                            </div>
                        </div>
                        <div class="bg-blue-50 border border-blue-100 rounded-lg px-2.5 py-1.5">
                            <div class="text-[9px] font-black text-blue-700 uppercase tracking-wider mb-0.5">💡 Pro Tip</div>
                            <p class="text-[10px] text-blue-800 leading-relaxed">${m.tip}</p>
                        </div>
                    </div>`;
                const isExitLoad = m.id === 'exitloadtax';
                const exitLoadBody = `
                    <div class="px-4 py-3 space-y-2.5">
                        <p class="text-[11px] text-slate-600 leading-relaxed">${m.description}</p>
                        <!-- Tax table -->
                        <div class="rounded-xl overflow-hidden border border-[#f5c842]/30">
                            <div class="grid grid-cols-3 bg-slate-100 text-[8px] font-black text-slate-500 uppercase tracking-wide">
                                <div class="px-2 py-1.5">Fund Type</div>
                                <div class="px-2 py-1.5 text-center">Holding</div>
                                <div class="px-2 py-1.5 text-right">Tax Rate</div>
                            </div>
                            <div class="divide-y divide-slate-100 text-[10px]">
                                <div class="grid grid-cols-3 px-2 py-1.5 bg-white">
                                    <span class="font-bold text-slate-700">Equity MF</span>
                                    <span class="text-center text-slate-500">&gt;1 yr</span>
                                    <span class="text-right font-black text-emerald-700">12.5% LTCG</span>
                                </div>
                                <div class="grid grid-cols-3 px-2 py-1.5 bg-slate-50">
                                    <span class="font-bold text-slate-700">Equity MF</span>
                                    <span class="text-center text-slate-500">&lt;1 yr</span>
                                    <span class="text-right font-black text-rose-600">20% STCG</span>
                                </div>
                                <div class="grid grid-cols-3 px-2 py-1.5 bg-white">
                                    <span class="font-bold text-slate-700">Debt MF</span>
                                    <span class="text-center text-slate-500">Any</span>
                                    <span class="text-right font-black text-amber-600">Slab rate</span>
                                </div>
                                <div class="grid grid-cols-3 px-2 py-1.5 bg-slate-50">
                                    <span class="font-bold text-slate-700">ELSS</span>
                                    <span class="text-center text-slate-500">3 yr lock</span>
                                    <span class="text-right font-black text-emerald-700">12.5% LTCG</span>
                                </div>
                            </div>
                        </div>
                        <div class="flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-lg px-2.5 py-1.5">
                            <span class="text-amber-500 font-black text-xs mt-0.5 flex-shrink-0">!</span>
                            <p class="text-[10px] text-amber-800 leading-relaxed">${m.tip}</p>
                        </div>
                    </div>`;
                const bodyContent = isAUMQuickRef ? renderAUMQuickRefCard()
                                  : isDirectVsRegular ? directVsRegularBody
                                  : isExitLoad ? exitLoadBody
                                  : `
                        <div class="px-4 py-3 space-y-2.5">
                            <p class="text-[11px] text-slate-600 leading-relaxed">${m.description}</p>
                            <div class="flex flex-col gap-1.5">
                                <div class="flex items-start gap-2 bg-green-50 border border-green-100 rounded-lg px-2.5 py-1.5">
                                    <span class="text-green-500 font-black text-xs mt-0.5 flex-shrink-0">✓</span>
                                    <div>
                                        <div class="text-[9px] font-black text-green-700 uppercase tracking-wider">Good: ${m.goodLabel}</div>
                                        <div class="text-[10px] text-green-800 font-medium">${m.goodRange}</div>
                                    </div>
                                </div>
                                <div class="flex items-start gap-2 bg-red-50 border border-red-100 rounded-lg px-2.5 py-1.5">
                                    <span class="text-red-500 font-black text-xs mt-0.5 flex-shrink-0">✗</span>
                                    <div>
                                        <div class="text-[9px] font-black text-red-700 uppercase tracking-wider">Watch out: ${m.badLabel}</div>
                                        <div class="text-[10px] text-red-800 font-medium">${m.badRange}</div>
                                    </div>
                                </div>
                            </div>
                            <div class="bg-blue-50 border border-blue-100 rounded-lg px-2.5 py-1.5">
                                <div class="text-[9px] font-black text-blue-700 uppercase tracking-wider mb-0.5">💡 Pro Tip</div>
                                <p class="text-[10px] text-blue-800 leading-relaxed">${m.tip}</p>
                            </div>
                            <div class="bg-slate-50 border border-[#f5c842]/30 rounded-lg px-2.5 py-1.5">
                                <div class="text-[9px] font-black text-slate-500 uppercase tracking-wider mb-0.5">📖 Indian Example</div>
                                <p class="text-[10px] text-slate-700 leading-relaxed">${m.example}</p>
                            </div>
                        </div>`;

                // Highlight the new trio of bonus cards with a subtle "NEW" badge
                const isNewCard = ['directvsregular','exitloadtax','aumquickref'].includes(m.id);
                const newBadge  = isNewCard ? `<span class="text-[8px] font-black px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 uppercase tracking-wide">Must Know</span>` : '';

                grid.insertAdjacentHTML('beforeend', `
                    <div class="bg-white border border-[#f5c842]/30 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                        <div class="px-4 pt-4 pb-3 border-b border-slate-100" style="background: linear-gradient(135deg, ${m.goodColor}0d 0%, ${m.goodColor}05 100%);">
                            <div class="flex items-center gap-2 mb-1 flex-wrap">
                                <span class="text-xl">${m.icon}</span>
                                <span class="text-sm font-black text-slate-800">${m.name}</span>
                                ${newBadge}
                            </div>
                            <p class="text-[11px] text-slate-500 leading-snug">${m.tagline}</p>
                            <!-- Mini meter -->
                            <div class="mt-2.5 flex items-center gap-2">
                                <div class="flex-1 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                    <div class="h-full rounded-full transition-all duration-1000" style="width:${m.meter}%; background:${m.meterColor};"></div>
                                </div>
                                <span class="text-[9px] font-bold text-slate-400 uppercase tracking-wide">importance</span>
                            </div>
                        </div>
                        ${bodyContent}
                    </div>
                `);
            });

            // Render checklist
            const checklist = document.getElementById('mf-checklist');
            if (!checklist) return;
            checklist.innerHTML = '';
            MF_CHECKLIST.forEach((item, i) => {
                checklist.insertAdjacentHTML('beforeend', `
                    <div class="flex flex-col gap-1.5 bg-slate-50 border border-[#f5c842]/30 rounded-xl p-3 h-full">
                        <div class="flex items-start gap-2">
                            <span class="text-base flex-shrink-0 mt-0.5">${item.icon}</span>
                            <span class="text-xs font-black text-slate-800 leading-snug">${item.question}</span>
                        </div>
                        <div class="flex flex-col gap-1 pl-1 flex-1 justify-end">
                            <div class="flex items-start gap-1.5">
                                <span class="text-[10px] font-black text-green-600 flex-shrink-0">✓ YES:</span>
                                <span class="text-[10px] text-green-700 leading-snug">${item.pass}</span>
                            </div>
                            <div class="flex items-start gap-1.5">
                                <span class="text-[10px] font-black text-red-500 flex-shrink-0">✗ NO:</span>
                                <span class="text-[10px] text-red-700 leading-snug">${item.fail}</span>
                            </div>
                        </div>
                    </div>
                `);
            });
        }
