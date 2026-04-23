    var _DASH_FAV_KEY = 'aw_dash_favs';
    var _dashFavDefaults = ['healthscore'];
    var _dashAllTools = {
        growth:       { icon:'📈', title:'Growth Calculator',            color:'#10b981' },
        goal:         { icon:'🎯', title:'Goal Planner',                 color:'#6366f1' },
        emergency:    { icon:'🛡️', title:'Emergency Fund',               color:'#f59e0b' },
        homeloan:     { icon:'🏠', title:'Home Loan Advisor',             color:'#3b82f6' },
        stepupsip:    { icon:'📈', title:'Step-Up SIP Calculator',        color:'#f59e0b' },
        epfcalc:      { icon:'🏦', title:'EPF Corpus Projector',          color:'#0891b2' },
        ppfnps:       { icon:'🏛️', title:'PPF & NPS Calculator',          color:'#059669' },
        insure:       { icon:'🛡️', title:'Insurance Adequacy',            color:'#dc2626' },
        mfexplorer:   { icon:'🔭', title:'MF Explorer',                   color:'#0891b2' },
        mfkit:        { icon:'💼', title:'MF Kit',                        color:'#7c3aed' },
        fundpicker:   { icon:'🔬', title:'Fund Picker Guide',             color:'#059669' },
        coffeecan:    { icon:'☕', title:'The Coffee Can',                color:'#7c4a00' },
        finplan:      { icon:'📋', title:'Financial Plan',                color:'#dc2626' },
        taxguide:     { icon:'🧾', title:'Tax Guide',                     color:'#b45309' },
        healthscore:  { icon:'💗', title:'Financial Health Score',        color:'#e11d48' },
        ssaplanner:   { icon:'👧', title:'SSA + Child Education Planner', color:'#ec4899' },
        ctcoptimizer: { icon:'💰', title:'CTC & Salary Optimizer',        color:'#7c3aed' },
        gratuity:     { icon:'🏅', title:'Gratuity Calculator',           color:'#b45309' },
        debtplan:     { icon:'⚡', title:'Loan Prepayment Planner',       color:'#dc2626' },
        jointplan:    { icon:'👨‍👩‍👧', title:'Joint Family Planner',          color:'#0891b2' },
        cibil:        { icon:'🏦', title:'CIBIL Score Tracker',           color:'#7c3aed' },
        fincal:       { icon:'📅', title:'Financial Calendar',            color:'#0891b2' },
        selfempl:     { icon:'🧾', title:'Self-Employed & Business',      color:'#059669' },
        goldcomp:     { icon:'🥇', title:'Gold Comparator',              color:'#b45309' },
        networth:     { icon:'⚖️', title:'Net Worth Tracker',            color:'#059669' },
        ulipcheck:    { icon:'🔍', title:'ULIP / Policy Analyzer',       color:'#dc2626' },
        fixedincome:    { icon:'🏦', title:'Fixed Income Tools',           color:'#0369a1' },
        retirementhub:  { icon:'🏖️', title:'Retirement Hub + Drawdown',    color:'#7c3aed' },
        cgcalc:       { icon:'💹', title:'Capital Gains Calculator',     color:'#7c3aed' },
        hracalc:      { icon:'🏠', title:'HRA Calculator',              color:'#0891b2' },
        nomtrack:     { icon:'📜', title:'Nomination Tracker & Will',   color:'#7c3aed' },
        budgettrack:  { icon:'📊', title:'Budget & Expense Tracker',    color:'#0891b2' },
        mymfs:        { icon:'★',  title:'My Mutual Funds',             color:'#f5c842' },
    };

    function _dashGetFavs() {
        try { var s = localStorage.getItem(_DASH_FAV_KEY); return s ? JSON.parse(s) : null; } catch(e) { return null; }
    }
    function _dashSaveFavs(f) {
        try { localStorage.setItem(_DASH_FAV_KEY, JSON.stringify(f)); } catch(e) {}
    }
    function dashToggleFav(modeKey, btn) {
        var favs = _dashGetFavs() || _dashFavDefaults.slice();
        var idx  = favs.indexOf(modeKey);
        if (idx === -1) { favs.push(modeKey); }
        else            { favs.splice(idx, 1); }
        _dashSaveFavs(favs);
        var ca = document.getElementById('dash-fav-count-arrow');
        if (ca) ca.textContent = _t('pin.count').replace('{n}', favs.length);
    }
    function initDashFav() {
        var favs  = _dashGetFavs() || _dashFavDefaults.slice();
        var grid  = document.getElementById('dashcat-fav-grid');
        if (!grid) return;
        if (favs.length === 0) {
            grid.innerHTML = '<div style="text-align:center;color:rgba(255,255,255,0.4);padding:32px 0;font-size:13px;">' + _t('pin.empty') + '</div>';
            return;
        }
        grid.innerHTML = '';
        favs.forEach(function(k) {
            var t = _dashAllTools[k]; if (!t) return;
            var btn = document.createElement('button');
            btn.className = 'dash-card group';
            btn.setAttribute('data-color', t.color);
            btn.innerHTML =
                '<div class="dash-card-icon">' + t.icon + '</div>' +
                '<div class="dash-card-title">' + t.title + '</div>' +
                '<div class="dash-card-unpin">' +
                    '<span onclick="event.stopPropagation();dashToggleFav(\'' + k + '\',this);initDashFav();" ' +
                    'style="cursor:pointer;">' + _t('pin.active.tap') + '</span>' +
                '</div>';
            btn.onclick = function() { switchMode(k); };
            grid.appendChild(btn);
        });
    }

    // Inject ☆ Pin / ★ Pinned buttons into category sub-panel cards
    function _dashInjectPinBtns(panelId) {
        var panel = document.getElementById(panelId);
        if (!panel) return;
        var favs = _dashGetFavs() || _dashFavDefaults.slice();
        panel.querySelectorAll('.dash-card[data-color]').forEach(function(card) {
            var oc = card.getAttribute('onclick') || '';
            var m  = (oc.match(/switchMode\('([^']+)'\)/) || [])[1];
            if (!m || m.indexOf('dashcat') === 0 || m === 'dashboard') return;
            var old = card.querySelector('.dash-pin-btn');
            if (old) old.remove();
            var isPinned = favs.indexOf(m) !== -1;
            var span = document.createElement('span');
            span.className = 'dash-pin-btn';
            span.style.cssText = 'display:inline-flex;align-items:center;gap:3px;font-size:10px;font-weight:800;cursor:pointer;margin-top:auto;padding:3px 8px;border-radius:8px;transition:all 0.2s;' + (isPinned ? 'color:#f5c842;background:rgba(245,200,66,0.18);border:1px solid rgba(245,200,66,0.4);' : 'color:rgba(255,255,255,0.6);background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.2);');
            span.textContent = isPinned ? _t('pin.active') : _t('pin.inactive');
            span.onclick = function(e) {
                e.stopPropagation();
                dashToggleFav(m, null);
                _dashInjectPinBtns(panelId);
            };
            var arrow = card.querySelector('.dash-card-arrow');
            if (arrow) card.insertBefore(span, arrow); else card.appendChild(span);
        });
    }
    function initDashboard() {
        var greetEl = document.getElementById('dash-user-greeting');
        if (greetEl && window._fbAuth && window._fbAuth.currentUser) {
            var name = (window._fbAuth.currentUser.displayName || '').split(' ')[0];
            if (name) greetEl.textContent = _t('dash.greeting').replace('{n}', name);
        }
        var favs = _dashGetFavs() || _dashFavDefaults.slice();
        var ca = document.getElementById('dash-fav-count-arrow');
        if (ca) ca.textContent = _t('pin.count').replace('{n}', favs.length);
        if (typeof initRoadmap === 'function') initRoadmap();
    }
    // Call on first load after auth
    window.addEventListener('DOMContentLoaded', function() {
        // Small delay to let auth resolve
        setTimeout(function() {
            if (typeof switchMode === 'function') switchMode('dashboard');
        }, 100);
    });
