/* ══════════════════════════════════════════════════════════
   ROYAL DARK ICON SET
   Consistent 24×24 line icons (1.8 stroke, round caps) for
   dashboard/category tiles and situation chips — replaces
   emoji icons app-wide.
   - window._svgIcon(mode, fallback) → svg string (or fallback)
   - Static .dash-card tiles are upgraded automatically on load.
   ══════════════════════════════════════════════════════════ */
(function() {
    'use strict';

    var OPEN  = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">';
    var CLOSE = '</svg>';

    var I = {
        /* growth — trending up */
        growth:       '<polyline points="3 17 9 11 13 15 21 7"/><polyline points="15 7 21 7 21 13"/>',
        /* goal — target */
        goal:         '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none"/>',
        /* returns — magnifier over trend */
        returnscalc:  '<circle cx="11" cy="11" r="7"/><path d="M16.5 16.5L21 21"/><polyline points="8 12.5 10.5 10 12 11.5 14.5 8.5"/>',
        /* home loan / HRA — house */
        homeloan:     '<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-5h4v5"/>',
        hracalc:      '<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/><path d="M9 14h6"/><path d="M9 17h6"/>',
        /* step-up SIP — rising stairs */
        stepupsip:    '<path d="M4 20h4v-4h4v-4h4V8h4V4"/>',
        /* retirement hub — umbrella */
        retirementhub:'<path d="M12 3a9 9 0 0 1 9 9H3a9 9 0 0 1 9-9z"/><path d="M12 12v6a2 2 0 0 0 4 0"/>',
        /* EPF — landmark bank */
        epfcalc:      '<path d="M3 9l9-6 9 6"/><line x1="4" y1="21" x2="20" y2="21"/><line x1="6" y1="21" x2="6" y2="12"/><line x1="10" y1="21" x2="10" y2="12"/><line x1="14" y1="21" x2="14" y2="12"/><line x1="18" y1="21" x2="18" y2="12"/>',
        /* PPF & NPS — coins */
        ppfnps:       '<circle cx="9" cy="9" r="5.5"/><path d="M6.5 14.9A5.5 5.5 0 1 0 14.9 6.5"/><path d="M9 6.5v5"/><path d="M6.5 9h5"/>',
        /* insurance — shield */
        insure:       '<path d="M12 3l8 3v6c0 4.5-3.4 7.8-8 9-4.6-1.2-8-4.5-8-9V6l8-3z"/><path d="M9 12l2 2 4-4"/>',
        /* MF explorer — chart magnifier */
        mfexplorer:   '<circle cx="11" cy="11" r="7"/><path d="M16.5 16.5L21 21"/><line x1="8.5" y1="13.5" x2="8.5" y2="11"/><line x1="11" y1="13.5" x2="11" y2="8.5"/><line x1="13.5" y1="13.5" x2="13.5" y2="10"/>',
        /* my MFs — bookmark (personal watchlist) */
        mymfs:        '<path d="M6 3h12v18l-6-4.2L6 21V3z"/><line x1="9" y1="8" x2="15" y2="8"/>',
        /* MF kit — briefcase */
        mfkit:        '<rect x="3" y="8" width="18" height="12" rx="2"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/><path d="M3 13h18"/>',
        /* fund picker — sliders */
        fundpicker:   '<line x1="5" y1="7" x2="19" y2="7"/><circle cx="9" cy="7" r="1.8"/><line x1="5" y1="12" x2="19" y2="12"/><circle cx="15" cy="12" r="1.8"/><line x1="5" y1="17" x2="19" y2="17"/><circle cx="11" cy="17" r="1.8"/>',
        /* coffee can — cup */
        coffeecan:    '<path d="M4 9h12v7a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4V9z"/><path d="M16 10h2a3 3 0 0 1 0 6h-2"/><line x1="7" y1="4" x2="7" y2="6"/><line x1="11" y1="3" x2="11" y2="6"/>',
        /* fixed income — percent circle */
        fixedincome:  '<circle cx="12" cy="12" r="9"/><line x1="9" y1="15" x2="15" y2="9"/><circle cx="9.3" cy="9.3" r="1" fill="currentColor" stroke="none"/><circle cx="14.7" cy="14.7" r="1" fill="currentColor" stroke="none"/>',
        /* ULIP check — document search */
        ulipcheck:    '<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9l-6-6z"/><path d="M14 3v6h6"/><circle cx="11" cy="14" r="2.5"/><path d="M13 16l2.5 2.5"/>',
        /* net worth — scales */
        networth:     '<path d="M12 4v16"/><path d="M5 7h14"/><path d="M5 7l-2.5 5.5a3 3 0 0 0 5 0L5 7z"/><path d="M19 7l-2.5 5.5a3 3 0 0 0 5 0L19 7z"/><path d="M8 20h8"/>',
        /* financial plan — clipboard */
        finplan:      '<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4a3 3 0 0 1 6 0"/><line x1="9" y1="11" x2="15" y2="11"/><line x1="9" y1="15" x2="15" y2="15"/><line x1="9" y1="18" x2="13" y2="18"/>',
        /* financial path — compass */
        finpath:      '<circle cx="12" cy="12" r="9"/><polygon points="14.8 9.2 13 13 9.2 14.8 11 11 14.8 9.2"/>',
        /* tax guide — receipt */
        taxguide:     '<path d="M6 3h12v18l-2-1.5L14 21l-2-1.5L10 21l-2-1.5L6 21V3z"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="9" y1="12" x2="15" y2="12"/>',
        /* health score — heart pulse */
        healthscore:  '<path d="M12 20s-7.5-4.8-9.3-9.3A5.2 5.2 0 0 1 12 6.5a5.2 5.2 0 0 1 9.3 4.2C19.5 15.2 12 20 12 20z"/><polyline points="7 12 10 12 11.5 9.5 13 14 14.5 12 17 12"/>',
        /* SSA planner — graduation cap */
        ssaplanner:   '<path d="M2 9l10-5 10 5-10 5L2 9z"/><path d="M6 11.5V16c0 1.6 2.7 3 6 3s6-1.4 6-3v-4.5"/>',
        /* CTC optimizer — wallet */
        ctcoptimizer: '<path d="M20 7H6a2 2 0 0 1 0-4h12v4"/><path d="M4 5v14a2 2 0 0 0 2 2h15V7"/><circle cx="16.5" cy="14" r="1.2" fill="currentColor" stroke="none"/>',
        /* gratuity — medal */
        gratuity:     '<circle cx="12" cy="9" r="5"/><path d="M9.5 13.4L8 21l4-2.2L16 21l-1.5-7.6"/>',
        /* debt prepayment — debt curve trending down to zero */
        debtplan:     '<polyline points="3 5 8 11 12 8 21 17"/><polyline points="21 11 21 17 15 17"/><line x1="3" y1="20" x2="21" y2="20"/>',
        /* joint plan — users */
        jointplan:    '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><circle cx="17" cy="9" r="2.7"/><path d="M16 14.6a5.5 5.5 0 0 1 5.5 5.4"/>',
        /* CIBIL — gauge */
        cibil:        '<path d="M4 16a8 8 0 0 1 16 0"/><line x1="12" y1="16" x2="16.5" y2="11"/><circle cx="12" cy="16" r="1.2" fill="currentColor" stroke="none"/><path d="M4 20h16"/>',
        /* financial calendar */
        fincal:       '<rect x="4" y="5" width="16" height="16" rx="2"/><line x1="4" y1="10" x2="20" y2="10"/><line x1="8" y1="3" x2="8" y2="7"/><line x1="16" y1="3" x2="16" y2="7"/><circle cx="12" cy="15" r="1" fill="currentColor" stroke="none"/>',
        /* self-employed & business — storefront */
        selfempl:     '<path d="M5 4h14l2 5H3l2-5z"/><path d="M4 9v11h16V9"/><path d="M9.5 20v-5.5h5V20"/>',
        /* gold comparator — stacked gold bars */
        goldcomp:     '<path d="M8.5 10h7l1.2 4H7.3l1.2-4z"/><path d="M3.5 15h7l1.2 4H2.3l1.2-4z"/><path d="M13.5 15h7l1.2 4h-9.4l1.2-4z"/>',
        /* capital gains — bar chart */
        cgcalc:       '<line x1="4" y1="20" x2="20" y2="20"/><rect x="5" y="12" width="3" height="6"/><rect x="10.5" y="7" width="3" height="11"/><rect x="16" y="10" width="3" height="8"/>',
        /* nomination tracker — document */
        nomtrack:     '<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9l-6-6z"/><path d="M14 3v6h6"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="14" y2="17"/>',
        /* budget tracker — pie */
        budgettrack:  '<path d="M12 3a9 9 0 1 0 9 9h-9V3z"/><path d="M15 3.5A9 9 0 0 1 20.5 9H15V3.5z"/>',
        /* situation chips — "What's on your mind?" */
        'sit.job':      '<rect x="3" y="8" width="18" height="12" rx="2"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/><path d="M3 13h18"/>',
        'sit.house':    '<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-5h4v5"/>',
        'sit.grow':     '<polyline points="3 17 9 11 13 15 21 7"/><polyline points="15 7 21 7 21 13"/>',
        'sit.goals':    '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none"/>',
        'sit.retire':   '<circle cx="12" cy="10" r="4"/><line x1="12" y1="3" x2="12" y2="4.5"/><line x1="5.5" y1="10" x2="7" y2="10"/><line x1="17" y1="10" x2="18.5" y2="10"/><line x1="6.8" y1="4.8" x2="7.8" y2="5.8"/><line x1="16.2" y1="4.8" x2="17.2" y2="5.8"/><line x1="3" y1="20" x2="21" y2="20"/>',
        'sit.loans':    '<rect x="3" y="6" width="18" height="13" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="6" y1="15" x2="10" y2="15"/>',
        'sit.tax':      '<path d="M6 3h12v18l-2-1.5L14 21l-2-1.5L10 21l-2-1.5L6 21V3z"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="9" y1="12" x2="15" y2="12"/>',
        'sit.protect':  '<path d="M12 3l8 3v6c0 4.5-3.4 7.8-8 9-4.6-1.2-8-4.5-8-9V6l8-3z"/><path d="M9 12l2 2 4-4"/>',
        'sit.track':    '<line x1="4" y1="20" x2="20" y2="20"/><rect x="5" y="12" width="3" height="6"/><rect x="10.5" y="7" width="3" height="11"/><rect x="16" y="10" width="3" height="8"/>',
        'sit.business': '<path d="M5 4h14l2 5H3l2-5z"/><path d="M4 9v11h16V9"/><path d="M9.5 20v-5.5h5V20"/>',
        /* categories */
        'dashcat-calc': '<rect x="5" y="3" width="14" height="18" rx="2"/><line x1="8.5" y1="7.5" x2="15.5" y2="7.5"/><circle cx="9" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="15" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="9" cy="16" r="1" fill="currentColor" stroke="none"/><circle cx="12" cy="16" r="1" fill="currentColor" stroke="none"/><circle cx="15" cy="16" r="1" fill="currentColor" stroke="none"/>',
        'dashcat-mf':   '<path d="M12 3l9 5-9 5-9-5 9-5z"/><path d="M3 13l9 5 9-5"/><path d="M3 17l9 5 9-5"/>',
        'dashcat-tax':  '<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9l-6-6z"/><path d="M14 3v6h6"/><line x1="9.5" y1="17" x2="15" y2="11.5"/><circle cx="10" cy="12" r="1.1" fill="currentColor" stroke="none"/><circle cx="14.5" cy="16.5" r="1.1" fill="currentColor" stroke="none"/>',
        'dashcat-fav':  '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1L3.2 9.5l6.1-.9L12 3z"/>',
        /* ── Budget-tracker categories (keyed by category tkey) ── */
        'cat.Housing':      '<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-5h4v5"/>',
        'cat.Food':         '<path d="M5 3v7a2 2 0 0 0 4 0V3"/><line x1="7" y1="10" x2="7" y2="21"/><path d="M16 3c-1.5 0-2.5 1.8-2.5 4s1 4 2.5 4v10"/>',
        'cat.Transport':    '<path d="M5 16V7a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v9"/><path d="M4 16h16v2a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1v-1H7v1a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-2z"/><line x1="5" y1="10" x2="19" y2="10"/><circle cx="7.5" cy="13" r="0.8" fill="currentColor" stroke="none"/><circle cx="16.5" cy="13" r="0.8" fill="currentColor" stroke="none"/>',
        'cat.EMIs':         '<rect x="3" y="6" width="18" height="12" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="6.5" y1="14.5" x2="10" y2="14.5"/>',
        'cat.Entertainment':'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M10 9l5 3-5 3V9z" fill="currentColor" stroke="none"/>',
        'cat.Health':       '<path d="M4.5 7.5a3.5 3.5 0 0 1 6-2.4l1.5 1.5 1.5-1.5a3.5 3.5 0 1 1 5 4.9L12 18 4.5 10a3.5 3.5 0 0 1 0-2.5z"/><path d="M8 11h2l1-2 1.5 3 1-1.5H16"/>',
        'cat.Shopping':     '<path d="M6 8h12l-1 12H7L6 8z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
        'cat.Utilities':    '<polygon points="13 2 4 14 11 14 10 22 20 9 13 9 13 2"/>',
        'cat.Education':    '<path d="M2 9l10-5 10 5-10 5L2 9z"/><path d="M6 11.5V16c0 1.6 2.7 3 6 3s6-1.4 6-3v-4.5"/><line x1="22" y1="9" x2="22" y2="14"/>',
        'cat.Others':       '<circle cx="5" cy="12" r="1.6" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none"/><circle cx="19" cy="12" r="1.6" fill="currentColor" stroke="none"/>',
        /* custom / user-created category — price tag */
        'cat.custom':       '<path d="M3 5.5A2.5 2.5 0 0 1 5.5 3H11a2 2 0 0 1 1.4.6l7 7a2 2 0 0 1 0 2.8l-5.5 5.5a2 2 0 0 1-2.8 0l-7-7A2 2 0 0 1 3 10.5v-5z"/><circle cx="7.5" cy="7.5" r="1.4" fill="currentColor" stroke="none"/>',
        /* UI — back arrow */
        'ui.back':          '<line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>',
        /* ── Net Worth Tracker sections ── */
        'nw.assets':        '<circle cx="12" cy="12" r="9"/><path d="M12 16V8"/><path d="M8.5 11.5 12 8l3.5 3.5"/>',
        'nw.liab':          '<circle cx="12" cy="12" r="9"/><path d="M12 8v8"/><path d="M8.5 12.5 12 16l3.5-3.5"/>',
        'nw.liquid':        '<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2.6"/><line x1="6" y1="12" x2="6.01" y2="12"/><line x1="18" y1="12" x2="18.01" y2="12"/>',
        'nw.equity':        '<polyline points="3 17 9 11 13 15 21 7"/><polyline points="15 7 21 7 21 13"/>',
        'nw.retire':        '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
        'nw.realestate':    '<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-5h4v5"/>',
        'nw.gold':          '<ellipse cx="12" cy="6" rx="7" ry="3"/><path d="M5 6v6c0 1.7 3.1 3 7 3s7-1.3 7-3V6"/><path d="M5 12v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6"/>',
        'nw.ratios':        '<path d="M4 20h16"/><path d="M7 20V10"/><path d="M12 20V4"/><path d="M17 20v-7"/>',
        'nw.alloc':         '<path d="M12 3a9 9 0 1 0 9 9h-9V3z"/><path d="M14 3.2A9 9 0 0 1 20.8 10H14V3.2z"/>',
        'nw.history':       '<polyline points="3 17 9 11 13 15 21 7"/><polyline points="15 7 21 7 21 13"/>',
        'hs.income': '<path d="M20 7H6a2 2 0 0 1 0-4h12v4"/><path d="M4 5v14a2 2 0 0 0 2 2h15V7"/><circle cx="16.5" cy="14" r="1.2" fill="currentColor" stroke="none"/>',
        'hs.protect': '<path d="M12 3l8 3v6c0 4.5-3.4 7.8-8 9-4.6-1.2-8-4.5-8-9V6l8-3z"/><path d="M9 12l2 2 4-4"/>',
        'hs.portfolio': '<path d="M12 3a9 9 0 1 0 9 9h-9V3z"/><path d="M14 3.2A9 9 0 0 1 20.8 10H14V3.2z"/>',
        'hs.cashflow': '<path d="M12 3a9 9 0 1 0 9 9h-9V3z"/><path d="M15 3.5A9 9 0 0 1 20.5 9H15V3.5z"/>',
        'hs.wpmix': '<line x1="4" y1="20" x2="20" y2="20"/><rect x="5" y="12" width="3" height="6"/><rect x="10.5" y="7" width="3" height="11"/><rect x="16" y="10" width="3" height="8"/>',
        'hs.action': '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none"/>',
        'hs.savings': '<circle cx="9" cy="9" r="5.5"/><path d="M6.5 14.9A5.5 5.5 0 1 0 14.9 6.5"/><path d="M9 6.5v5"/><path d="M6.5 9h5"/>',
        'hs.debt': '<polyline points="3 5 8 11 12 8 21 17"/><polyline points="21 11 21 17 15 17"/><line x1="3" y1="20" x2="21" y2="20"/>',
        'hs.health': '<path d="M12 20s-7.5-4.8-9.3-9.3A5.2 5.2 0 0 1 12 6.5a5.2 5.2 0 0 1 9.3 4.2C19.5 15.2 12 20 12 20z"/><polyline points="7 12 10 12 11.5 9.5 13 14 14.5 12 17 12"/>',
        'hs.term': '<path d="M12 3l8 3v6c0 4.5-3.4 7.8-8 9-4.6-1.2-8-4.5-8-9V6l8-3z"/><circle cx="12" cy="10" r="2.2"/><path d="M9 15.5a3 3 0 0 1 6 0"/>',
        'hs.emergency': '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3.5"/><line x1="12" y1="3" x2="12" y2="8.5"/><line x1="12" y1="15.5" x2="12" y2="21"/><line x1="3" y1="12" x2="8.5" y2="12"/><line x1="15.5" y1="12" x2="21" y2="12"/>',
        'hs.spend': '<circle cx="9" cy="20" r="1.4"/><circle cx="17" cy="20" r="1.4"/><path d="M3 4h2l2.2 11.2a1 1 0 0 0 1 .8h8.4a1 1 0 0 0 1-.8L20 8H6"/>',
        'hs.age': '<circle cx="12" cy="12" r="9"/><path d="M12 7.5V12l3 2"/>',
        'hs.nw': '<path d="M12 4v16"/><path d="M5 7h14"/><path d="M5 7l-2.5 5.5a3 3 0 0 0 5 0L5 7z"/><path d="M19 7l-2.5 5.5a3 3 0 0 0 5 0L19 7z"/><path d="M8 20h8"/>',
        'hs.pct': '<line x1="4" y1="20" x2="20" y2="20"/><rect x="5" y="12" width="3" height="6"/><rect x="10.5" y="7" width="3" height="11"/><rect x="16" y="10" width="3" height="8"/>',
        'hs.user': '<circle cx="12" cy="8" r="4"/><path d="M4 20a8 8 0 0 1 16 0"/>',
        'hs.empty': '<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4a3 3 0 0 1 6 0"/><line x1="9" y1="11" x2="15" y2="11"/><line x1="9" y1="15" x2="15" y2="15"/><line x1="9" y1="18" x2="13" y2="18"/>',
        'hs.pie': '<path d="M12 3a9 9 0 1 0 9 9h-9V3z"/><path d="M14 3.2A9 9 0 0 1 20.8 10H14V3.2z"/>',
        'hs.coins': '<circle cx="9" cy="9" r="5.5"/><path d="M6.5 14.9A5.5 5.5 0 1 0 14.9 6.5"/><path d="M9 6.5v5"/><path d="M6.5 9h5"/>',
        'hs.tasks': '<line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><circle cx="4" cy="6" r="1.2" fill="currentColor" stroke="none"/><circle cx="4" cy="12" r="1.2" fill="currentColor" stroke="none"/><circle cx="4" cy="18" r="1.2" fill="currentColor" stroke="none"/>',
        'hs.pf.equity': '<polyline points="3 17 9 11 13 15 21 7"/><polyline points="15 7 21 7 21 13"/>',
        'hs.pf.debt': '<path d="M3 9l9-6 9 6"/><line x1="4" y1="21" x2="20" y2="21"/><line x1="6" y1="21" x2="6" y2="12"/><line x1="10" y1="21" x2="10" y2="12"/><line x1="14" y1="21" x2="14" y2="12"/><line x1="18" y1="21" x2="18" y2="12"/>',
        'hs.pf.realty': '<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-5h4v5"/>',
        'hs.pf.gold': '<path d="M8.5 10h7l1.2 4H7.3l1.2-4z"/><path d="M3.5 15h7l1.2 4H2.3l1.2-4z"/><path d="M13.5 15h7l1.2 4h-9.4l1.2-4z"/>',
        'hs.pf.retiral': '<path d="M12 3a9 9 0 0 1 9 9H3a9 9 0 0 1 9-9z"/><path d="M12 12v6a2 2 0 0 0 4 0"/>',
        'hs.pf.other': '<rect x="3" y="8" width="18" height="12" rx="2"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/><path d="M3 13h18"/>',
        'hs.g.rockstar': '<circle cx="12" cy="9" r="5"/><path d="M9.5 13.4L8 21l4-2.2L16 21l-1.5-7.6"/>',
        'hs.g.builder': '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1L3.2 9.5l6.1-.9L12 3z"/>',
        'hs.g.track': '<polyline points="3 17 9 11 13 15 21 7"/><polyline points="15 7 21 7 21 13"/>',
        'hs.g.gettingthere': '<path d="M5 15c-1 1-1.4 4-1.4 4s3-.4 4-1.4"/><path d="M9 15l-3-3c1-4 4.5-8.5 9.5-9.5C16.5 7.5 13 12 9 15z"/><circle cx="14.5" cy="9.5" r="1.3"/>',
        'hs.g.wakeup': '<polygon points="13 2 4 14 11 14 10 22 20 9 13 9 13 2"/>',
        'hs.g.sos': '<path d="M12 4l9 16H3l9-16z"/><line x1="12" y1="10" x2="12" y2="15"/><circle cx="12" cy="18" r="1" fill="currentColor" stroke="none"/>',
        'hs.g.emergency': '<circle cx="12" cy="12" r="9"/><line x1="12" y1="7.5" x2="12" y2="13"/><circle cx="12" cy="16.5" r="1.1" fill="currentColor" stroke="none"/>',
    };

    window._svgIcon = function(mode, fallback) {
        var body = I[mode];
        return body ? OPEN + body + CLOSE : (fallback || '');
    };

    /* Upgrade static .dash-card tiles (index.html markup keeps its emoji as
       a no-JS fallback; we swap it for the SVG at runtime). */
    window._applyTileIcons = function(root) {
        var cards = (root || document).querySelectorAll('.dash-card');
        for (var i = 0; i < cards.length; i++) {
            var m = (cards[i].getAttribute('onclick') || '').match(/switchMode\('([^']+)'\)/);
            if (!m || !I[m[1]]) continue;
            var ic = cards[i].querySelector('.dash-card-icon');
            if (ic) ic.innerHTML = OPEN + I[m[1]] + CLOSE;
        }
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() { window._applyTileIcons(); });
    } else {
        window._applyTileIcons();
    }
})();
