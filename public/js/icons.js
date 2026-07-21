/* ══════════════════════════════════════════════════════════
   ROYAL DARK ICON SET
   Consistent 24×24 line icons (1.8 stroke, round caps) for
   dashboard/category tiles — replaces emoji tile icons.
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
        /* categories */
        'dashcat-calc': '<rect x="5" y="3" width="14" height="18" rx="2"/><line x1="8.5" y1="7.5" x2="15.5" y2="7.5"/><circle cx="9" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="15" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="9" cy="16" r="1" fill="currentColor" stroke="none"/><circle cx="12" cy="16" r="1" fill="currentColor" stroke="none"/><circle cx="15" cy="16" r="1" fill="currentColor" stroke="none"/>',
        'dashcat-mf':   '<path d="M12 3l9 5-9 5-9-5 9-5z"/><path d="M3 13l9 5 9-5"/><path d="M3 17l9 5 9-5"/>',
        'dashcat-tax':  '<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9l-6-6z"/><path d="M14 3v6h6"/><line x1="9.5" y1="17" x2="15" y2="11.5"/><circle cx="10" cy="12" r="1.1" fill="currentColor" stroke="none"/><circle cx="14.5" cy="16.5" r="1.1" fill="currentColor" stroke="none"/>',
        'dashcat-fav':  '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1L3.2 9.5l6.1-.9L12 3z"/>'
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
