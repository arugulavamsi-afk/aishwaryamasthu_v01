(function () {
    'use strict';

    function _ug_t(key, fallback) {
        if (typeof _t !== 'function') return fallback;
        var v = _t(key);
        return (v === key) ? fallback : v;
    }

    var _sections = [
        {
            id: 'getting-started', emoji: '🚀', title: 'Getting Started', titleKey: 'ug.sec.start', tools: null
        },
        {
            id: 'calculators', emoji: '⚡', title: 'Calculators', titleKey: 'ug.sec.calc',
            tools: ['growth','goal','homeloan','stepupsip','retirementhub','epfcalc','ppfnps','insure','hracalc']
        },
        {
            id: 'mutual-funds', emoji: '📊', title: 'Mutual Funds & Coffee Can', titleKey: 'ug.sec.mf',
            tools: ['mfexplorer','mymfs','mfkit','fundpicker','coffeecan']
        },
        {
            id: 'planning-tax', emoji: '🗺️', title: 'Planning & Tax', titleKey: 'ug.sec.plan',
            tools: ['finplan','finpath','healthscore','networth','taxguide','ctcoptimizer','cgcalc','fixedincome','ulipcheck','debtplan','ssaplanner','jointplan','cibil','fincal','selfempl','goldcomp','nomtrack','budgettrack','gratuity']
        },
        {
            id: 'account', emoji: '👤', title: 'Account & Your Data', titleKey: 'ug.sec.account', tools: null
        }
    ];

    var _meta = {
        growth:        { emoji:'📈', title:'Growth Calculator',                 titleKey:'card.growth.title' },
        goal:          { emoji:'🎯', title:'Goal Planner',                      titleKey:'card.goal.title' },
        homeloan:      { emoji:'🏠', title:'Home Loan Advisor',                 titleKey:'card.hl.title' },
        stepupsip:     { emoji:'🪜', title:'Step-Up SIP Calculator',            titleKey:'card.su.title' },
        retirementhub: { emoji:'🏖️', title:'Retirement Hub',                   titleKey:'card.rethub.title' },
        epfcalc:       { emoji:'🏦', title:'EPF Corpus Projector',              titleKey:'card.epf.title' },
        ppfnps:        { emoji:'🏛️', title:'PPF & NPS Calculator',             titleKey:'card.ppfnps.title' },
        insure:        { emoji:'🛡️', title:'Insurance Adequacy',               titleKey:'card.insure.title' },
        hracalc:       { emoji:'🏠', title:'HRA Calculator',                    titleKey:'card.hra.title' },
        mfexplorer:    { emoji:'🔭', title:'MF Explorer',                       titleKey:'card.mfe.title' },
        mymfs:         { emoji:'⭐', title:'My Mutual Funds',                   titleKey:'card.mymfs.title' },
        mfkit:         { emoji:'💼', title:'MF Kit',                            titleKey:'card.mfk.title' },
        fundpicker:    { emoji:'🔬', title:'Fund Picker Guide',                 titleKey:'card.fp.title' },
        coffeecan:     { emoji:'☕', title:'Coffee Can Investing',              titleKey:'card.coffeecan.title' },
        fixedincome:   { emoji:'🏦', title:'Fixed Income Tools',                titleKey:'card.fixedincome.title' },
        ulipcheck:     { emoji:'🔍', title:'ULIP / LIC Policy Analyzer',       titleKey:'card.ulip.title' },
        networth:      { emoji:'⚖️', title:'Net Worth Tracker',                titleKey:'card.networth.title' },
        finplan:       { emoji:'📋', title:'Financial Plan',                   titleKey:'card.finplan.title' },
        taxguide:      { emoji:'🧾', title:'Tax Guide',                        titleKey:'card.tax.title' },
        healthscore:   { emoji:'💗', title:'Financial Health Score',            titleKey:'card.hs.title' },
        ssaplanner:    { emoji:'👧', title:'SSA + Child Education Planner',     titleKey:'card.ssa.title' },
        ctcoptimizer:  { emoji:'💰', title:'CTC & Salary Optimizer',            titleKey:'card.ctc.title' },
        gratuity:      { emoji:'🏅', title:'Gratuity Calculator',               titleKey:'card.gratuity.title' },
        debtplan:      { emoji:'⚡', title:'Loan Prepayment Planner',           titleKey:'card.debt.title' },
        jointplan:     { emoji:'👨‍👩‍👧', title:'Joint Family Financial Planner', titleKey:'card.joint.title' },
        cibil:         { emoji:'📊', title:'CIBIL Score Tracker',               titleKey:'card.cibil.title' },
        fincal:        { emoji:'📅', title:'Financial Calendar',                titleKey:'card.fincal.title' },
        selfempl:      { emoji:'🧑‍💻', title:'Self-Employed & Business Planner', titleKey:'card.selfempl.title' },
        goldcomp:      { emoji:'🥇', title:'Gold Investment Comparator',        titleKey:'card.gold.title' },
        cgcalc:        { emoji:'📉', title:'Capital Gains Calculator',          titleKey:'card.cgcalc.title' },
        nomtrack:      { emoji:'📜', title:'Nomination Tracker',                titleKey:'card.nomtrack.title' },
        budgettrack:   { emoji:'📊', title:'Budget & Expense Tracker',          titleKey:'card.budget.title' },
        finpath:       { emoji:'🧭', title:'Your Financial Path',               titleKey:'card.finpath.title' }
    };

    function _getHu(mode) {
        var base = 'howto.' + mode + '.';
        var what = _ug_t(base + 'what', null);
        if (!what) {
            return window._howToUseData ? (window._howToUseData[mode] || null) : null;
        }
        var steps = [], i = 1;
        for (; i <= 8; i++) {
            var sv = _ug_t(base + 'step' + i, null);
            if (!sv) break;
            steps.push(sv);
        }
        var tip = _ug_t(base + 'tip', null);
        return { what: what, steps: steps, tip: tip };
    }

    function _toolCard(mode) {
        var m = _meta[mode];
        if (!m) return '';
        var hu = _getHu(mode);
        if (!hu) return '';
        var title = m.titleKey ? _ug_t(m.titleKey, m.title) : m.title;
        var steps = (hu.steps || []).map(function(s) {
            return '<li style="padding:5px 0;border-bottom:1px solid rgba(255,255,255,0.05);font-size:11px;color:rgba(255,255,255,0.7);line-height:1.5;">' + s + '</li>';
        }).join('');
        var tip = hu.tip
            ? '<div style="margin-top:10px;padding:9px 11px;background:rgba(245,200,66,0.07);border-left:3px solid rgba(245,200,66,0.45);border-radius:0 8px 8px 0;">' +
              '<div style="font-size:9px;font-weight:800;color:#f5c842;text-transform:uppercase;letter-spacing:.05em;margin-bottom:3px;">' + _ug_t('howto.protip', 'Pro Tip') + '</div>' +
              '<div style="font-size:10.5px;color:rgba(255,255,255,0.6);line-height:1.55;">' + hu.tip + '</div>' +
              '</div>'
            : '';
        return '<div class="ug-tool-card" data-mode="' + mode + '" style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.09);border-radius:12px;margin-bottom:8px;overflow:hidden;">' +
            '<div style="display:flex;align-items:flex-start;gap:10px;padding:12px 14px;cursor:pointer;" onclick="_ugToggleTool(this)">' +
                '<span style="font-size:20px;flex-shrink:0;margin-top:1px;">' + m.emoji + '</span>' +
                '<div style="flex:1;min-width:0;">' +
                    '<div style="font-size:12px;font-weight:800;color:#fff;">' + title + '</div>' +
                    '<div style="font-size:10.5px;color:rgba(255,255,255,0.45);margin-top:3px;line-height:1.4;">' + hu.what + '</div>' +
                '</div>' +
                '<div style="display:flex;align-items:center;gap:8px;flex-shrink:0;margin-top:1px;">' +
                    '<button onclick="event.stopPropagation();_closeUserMenu&&_closeUserMenu();switchMode(\'' + mode + '\')" ' +
                        'style="font-size:10px;font-weight:700;color:rgba(245,200,66,0.8);background:rgba(245,200,66,0.08);border:1px solid rgba(245,200,66,0.25);padding:4px 9px;border-radius:7px;cursor:pointer;white-space:nowrap;" ' +
                        'onmouseover="this.style.background=\'rgba(245,200,66,0.16)\'" onmouseout="this.style.background=\'rgba(245,200,66,0.08)\'">' + _ug_t('ug.open', 'Open →') + '</button>' +
                    '<span class="ug-arrow" style="font-size:10px;color:rgba(255,255,255,0.3);transition:transform .2s;">▼</span>' +
                '</div>' +
            '</div>' +
            '<div class="ug-tool-body" style="display:none;padding:0 14px 14px 14px;">' +
                '<ul style="list-style:none;padding:0;margin:0;">' + steps + '</ul>' +
                tip +
            '</div>' +
        '</div>';
    }

    function _gettingStarted() {
        return '<div style="font-size:11px;color:rgba(255,255,255,0.6);line-height:1.75;margin-bottom:14px;">' + _ug_t('ug.gs.intro', 'AishwaryaMasthu is a free, all-in-one personal finance toolkit built for Indians — SIPs, home loans, tax planning, retirement, and more. Everything saves to your account and works across devices.') + '</div>' +
        '<div style="margin-bottom:14px;">' +
            '<div style="font-size:11px;font-weight:800;color:rgba(245,200,66,0.85);margin-bottom:7px;">' + _ug_t('ug.gs.dash.h', '📊 Your Dashboard') + '</div>' +
            '<ul style="list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:5px;">' +
                _li(_ug_t('ug.gs.dash.li1', '<strong>Financial Health Score</strong> — an honest report card across 6 areas of your money life. Run it first.')) +
                _li(_ug_t('ug.gs.dash.li2', '<strong>Net Worth</strong> — total assets minus liabilities, updated every time you use the Net Worth Tracker.')) +
                _li(_ug_t('ug.gs.dash.li3', '<strong>My Goals</strong> — a live snapshot of every financial goal and how much progress you\'ve made.')) +
            '</ul>' +
        '</div>' +
        '<div style="margin-bottom:14px;">' +
            '<div style="font-size:11px;font-weight:800;color:rgba(245,200,66,0.85);margin-bottom:7px;">' + _ug_t('ug.gs.find.h', '🎯 Finding the Right Tool') + '</div>' +
            '<ul style="list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:5px;">' +
                _li(_ug_t('ug.gs.find.li1', '<strong>What\'s on your mind?</strong> — 10 life-situation chips (buying a house, retiring, paying off debt…) take you straight to the right tools.')) +
                _li(_ug_t('ug.gs.find.li2', '<strong>Search bar</strong> — type anything plain (“home loan”, “SIP”, “tax saving”, “gold”) to instantly find matching tools.')) +
                _li(_ug_t('ug.gs.find.li3', '<strong>4 category tiles</strong> — browse all tools organised by type: Calculators, Mutual Funds, Planning & Tax, Favourites.')) +
            '</ul>' +
        '</div>' +
        '<div>' +
            '<div style="font-size:11px;font-weight:800;color:rgba(245,200,66,0.85);margin-bottom:7px;">' + _ug_t('ug.gs.steps.h', '✅ Recommended First Steps') + '</div>' +
            '<ol style="list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:5px;">' +
                _li(_ug_t('ug.gs.steps.li1', '1. Open <strong>My Profile</strong> (account menu top-right) and fill in your details — auto-fills 11 tools.')) +
                _li(_ug_t('ug.gs.steps.li2', '2. Run the <strong>Financial Health Score</strong> — 2 minutes, tells you exactly where to focus first.')) +
                _li(_ug_t('ug.gs.steps.li3', '3. Tap the situation chip that matches your biggest goal right now.')) +
            '</ol>' +
        '</div>';
    }

    function _accountSection() {
        return '<div style="display:flex;flex-direction:column;gap:14px;font-size:11px;color:rgba(255,255,255,0.6);line-height:1.7;">' +
            _infoBlock(
                _ug_t('ug.acc.prof.h', '👤 My Profile — Set Once, Use Everywhere'),
                _ug_t('ug.acc.prof.body', 'Fill in your monthly income, age, family situation, and risk level. Once saved, 11 tools auto-fill these values — no re-entering numbers every time you open a new tool.')) +
            _infoBlock(
                _ug_t('ug.acc.sync.h', '☁️ Your Data is Synced Across Devices'),
                _ug_t('ug.acc.sync.body', 'All inputs, goals, and saved results are stored securely in Firestore and tied to your account. Sign in on any device and your data is right there.')) +
            _infoBlock(
                _ug_t('ug.acc.goal.h', '🎯 Goal Planning + Tracking Flow'),
                '<ol style="list-style:none;padding:0;margin:4px 0 0 0;display:flex;flex-direction:column;gap:3px;">' +
                _li(_ug_t('ug.acc.goal.li1', '1. Use <strong>Goal Planner</strong> to set a goal — target amount, timeline, and type.')) +
                _li(_ug_t('ug.acc.goal.li2', '2. Save it — it appears in <strong>Goal Tracker</strong> and on your dashboard.')) +
                _li(_ug_t('ug.acc.goal.li3', '3. Log your actual savings monthly in Goal Tracker — it tells you if you\'re ahead or behind.')) +
                '</ol>') +
            _infoBlock(
                _ug_t('ug.acc.reset.h', '🗑 Reset My Data'),
                _ug_t('ug.acc.reset.body', 'Clears all saved inputs and goals from your account. This is <strong style="color:rgba(248,113,113,0.9);">irreversible</strong> — your calculated results will be gone. Your sign-in account itself is not affected.')) +
        '</div>';
    }

    function _li(text) {
        return '<li style="font-size:11px;color:rgba(255,255,255,0.65);padding:4px 0 4px 10px;border-left:2px solid rgba(245,200,66,0.25);">' + text + '</li>';
    }

    function _infoBlock(heading, body) {
        return '<div>' +
            '<div style="font-size:11px;font-weight:800;color:rgba(245,200,66,0.85);margin-bottom:6px;">' + heading + '</div>' +
            '<div style="font-size:11px;color:rgba(255,255,255,0.6);line-height:1.7;">' + body + '</div>' +
        '</div>';
    }

    function _buildSection(sec, open) {
        var secTitle = sec.titleKey ? _ug_t(sec.titleKey, sec.title) : sec.title;
        var count = sec.tools ? ' <span style="font-size:9px;font-weight:700;color:rgba(255,255,255,0.35);background:rgba(255,255,255,0.08);padding:1px 7px;border-radius:10px;margin-left:5px;">' + sec.tools.length + '</span>' : '';
        var body = sec.tools
            ? sec.tools.map(function(m) { return _toolCard(m); }).join('')
            : (sec.id === 'getting-started' ? _gettingStarted() : _accountSection());

        return '<div class="ug-section" data-sec="' + sec.id + '" style="margin-bottom:8px;">' +
            '<button onclick="_ugToggleSection(this)" ' +
                'style="display:flex;align-items:center;justify-content:space-between;width:100%;padding:12px 16px;border-radius:13px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);cursor:pointer;text-align:left;" ' +
                'onmouseover="this.style.background=\'rgba(255,255,255,0.1)\'" onmouseout="this.style.background=\'rgba(255,255,255,0.06)\'">' +
                '<span style="font-size:12px;font-weight:800;color:#fff;">' + sec.emoji + ' ' + secTitle + count + '</span>' +
                '<span class="ug-sec-arrow" style="font-size:11px;color:rgba(255,255,255,0.35);transition:transform .2s;">' + (open ? '▲' : '▼') + '</span>' +
            '</button>' +
            '<div class="ug-section-body" style="' + (open ? '' : 'display:none;') + 'padding:10px 2px 4px;">' + body + '</div>' +
        '</div>';
    }

    window._ugToggleSection = function(btn) {
        var body  = btn.parentElement.querySelector('.ug-section-body');
        var arrow = btn.querySelector('.ug-sec-arrow');
        var open  = body.style.display !== 'none';
        body.style.display = open ? 'none' : 'block';
        if (arrow) arrow.textContent = open ? '▼' : '▲';
    };

    window._ugToggleTool = function(header) {
        var body  = header.parentElement.querySelector('.ug-tool-body');
        var arrow = header.querySelector('.ug-arrow');
        var open  = body.style.display !== 'none';
        body.style.display = open ? 'none' : 'block';
        if (arrow) arrow.style.transform = open ? '' : 'rotate(180deg)';
    };

    window._ugSearch = function(q) {
        q = (q || '').trim().toLowerCase();
        var cards    = document.querySelectorAll('#userguide-panel .ug-tool-card');
        var sections = document.querySelectorAll('#userguide-panel .ug-section');
        if (!q) {
            cards.forEach(function(c) { c.style.display = ''; });
            sections.forEach(function(s) {
                var open  = s.getAttribute('data-sec') === 'getting-started';
                var body  = s.querySelector('.ug-section-body');
                var arrow = s.querySelector('.ug-sec-arrow');
                body.style.display = open ? 'block' : 'none';
                if (arrow) arrow.textContent = open ? '▲' : '▼';
            });
            return;
        }
        cards.forEach(function(c) {
            c.style.display = c.textContent.toLowerCase().indexOf(q) >= 0 ? '' : 'none';
        });
        sections.forEach(function(s) {
            var id      = s.getAttribute('data-sec');
            var visible = s.querySelectorAll('.ug-tool-card:not([style*="display: none"])').length;
            var show    = visible > 0 || id === 'getting-started' || id === 'account';
            var body    = s.querySelector('.ug-section-body');
            var arrow   = s.querySelector('.ug-sec-arrow');
            body.style.display = show ? 'block' : 'none';
            if (arrow) arrow.textContent = show ? '▲' : '▼';
        });
    };

    window.initUserGuide = function() {
        var panel = document.getElementById('userguide-panel');
        if (!panel) return;
        var curLang = (typeof localStorage !== 'undefined' && localStorage.getItem('aw_lang')) || 'en';
        if (panel.getAttribute('data-ug-built') === curLang) return;
        panel.setAttribute('data-ug-built', curLang);

        panel.innerHTML =
            '<div style="max-width:820px;margin:0 auto;">' +
                '<div class="rounded-2xl px-4 py-3 mb-4 text-white flex items-center justify-between gap-3 flex-wrap shine-header" ' +
                    'style="background:linear-gradient(135deg,#0c2340 0%,#1a4a7a 45%,#0e5c3a 100%);border:2px solid rgba(245,200,66,0.4);box-shadow:0 4px 18px rgba(0,0,0,0.25);">' +
                    '<div>' +
                        '<h2 class="text-base font-black">' + _ug_t('ug.title', '📖 User Guide') + '</h2>' +
                        '<p class="text-blue-200 text-[11px] mt-0.5">' + _ug_t('ug.subtitle', 'Everything you need to get the most from AishwaryaMasthu — all 33 tools explained') + '</p>' +
                    '</div>' +
                    '<button onclick="switchMode(\'dashboard\')" class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all" style="background:rgba(245,200,66,0.15);color:#f5c842;border:1px solid rgba(245,200,66,0.3);">' + _ug_t('ug.back', '⬅ Back') + '</button>' +
                '</div>' +
                '<div style="margin-bottom:14px;position:relative;">' +
                    '<span style="position:absolute;left:11px;top:50%;transform:translateY(-50%);font-size:13px;pointer-events:none;opacity:0.4;">🔍</span>' +
                    '<input type="text" autocomplete="off" ' +
                        'placeholder="' + _ug_t('ug.search.ph', 'Search guide…') + '" ' +
                        'oninput="_ugSearch(this.value)" ' +
                        'style="width:100%;padding:10px 12px 10px 34px;border-radius:12px;background:rgba(255,255,255,0.06);border:1.5px solid rgba(255,255,255,0.12);color:#fff;font-size:12px;font-weight:600;font-family:\'Inter\',sans-serif;outline:none;box-sizing:border-box;" ' +
                        'onfocus="this.style.borderColor=\'rgba(245,200,66,0.5)\'" ' +
                        'onblur="this.style.borderColor=\'rgba(255,255,255,0.12)\'" />' +
                '</div>' +
                _sections.map(function(s, i) { return _buildSection(s, i === 0); }).join('') +
            '</div>';
    };

})();
