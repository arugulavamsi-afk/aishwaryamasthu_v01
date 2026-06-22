    var _DASH_FAV_KEY = 'aw_dash_favs';
    var _dashFavDefaults = ['healthscore'];
    var _dashAllTools = {
        growth:       { icon:'📈', title:'Growth Calculator',            color:'#10b981' },
        goal:         { icon:'🎯', title:'Goal Planner',                 color:'#6366f1' },
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
    function _consultProfileComplete() {
        var p = window._userProfile || {};
        var name = (p.name || '').trim();
        var age  = parseInt(p.age, 10);
        var occ  = (p.occupation || '').trim();
        var dep  = p.dependents;
        return name.length > 0
            && !isNaN(age) && age >= 18 && age <= 85
            && occ.length > 0
            && dep !== '' && dep !== undefined && dep !== null;
    }

    function consultUpdateTile() {
        var btn = document.getElementById('consult-tile-btn');
        var tip = document.getElementById('consult-tile-tip');
        if (!btn) return;
        var ok = _consultProfileComplete();
        btn.style.opacity       = ok ? '1' : '0.45';
        btn.style.pointerEvents = ok ? 'auto' : 'none';
        btn.style.cursor        = ok ? 'pointer' : 'default';
        if (tip) tip.style.display = ok ? 'none' : 'flex';
    }

    // ── Smart discovery: all tools index ──
    var _allTools = [
        { mode:'growth',       emoji:'📈', title:'Growth Calculator',              desc:'SIP, lumpsum, compound interest, inflation' },
        { mode:'goal',         emoji:'🎯', title:'Goal Planner',                   desc:'Education, marriage, retirement, goal corpus targets' },
        { mode:'homeloan',     emoji:'🏠', title:'Home Loan Advisor',              desc:'EMI, rent vs buy, prepayment, home loan tax saving' },
        { mode:'stepupsip',    emoji:'🪜', title:'Step-Up SIP Calculator',         desc:'Annual SIP increase, flat vs step-up, corpus gap' },
        { mode:'retirementhub',emoji:'🏖️', title:'Retirement Hub',                desc:'EPF PPF NPS SIP retirement corpus, SWP drawdown income' },
        { mode:'epfcalc',      emoji:'🏦', title:'EPF Corpus Projector',           desc:'EPF retirement corpus, basic salary, employer contribution' },
        { mode:'ppfnps',       emoji:'🏛️', title:'PPF & NPS Calculator',          desc:'PPF NPS 80C 80CCD tax deductions, lock-in corpus' },
        { mode:'insure',       emoji:'🛡️', title:'Insurance Adequacy',            desc:'Term life insurance, health insurance, HLV, underinsurance check' },
        { mode:'hracalc',      emoji:'🏠', title:'HRA Calculator',                 desc:'HRA tax exemption, rent paid, metro non-metro, Sec 10(13A)' },
        { mode:'mfexplorer',   emoji:'🔭', title:'MF Explorer',                    desc:'Mutual fund NAV, fund scoring, compare 1000+ funds' },
        { mode:'mymfs',        emoji:'⭐', title:'My Mutual Funds',                desc:'Personal MF watchlist, saved ratings, track your funds' },
        { mode:'mfkit',        emoji:'💼', title:'MF Kit',                         desc:'Which mutual fund type suits me, equity debt hybrid explained' },
        { mode:'fundpicker',   emoji:'🔬', title:'Fund Picker Guide',              desc:'Alpha Sharpe Sortino expense ratio, how to pick the right fund' },
        { mode:'coffeecan',    emoji:'☕', title:'Coffee Can Investing',           desc:'Quality stocks, ROCE revenue CAGR, debt-free companies, long-term' },
        { mode:'fixedincome',  emoji:'🏦', title:'Fixed Income Tools',             desc:'FD calculator, SCSS POMIS NSC KVP, safe investments for seniors' },
        { mode:'ulipcheck',    emoji:'🔍', title:'ULIP / LIC Policy Analyzer',     desc:'LIC ULIP surrender value, IRR, buy term + invest the difference' },
        { mode:'networth',     emoji:'⚖️', title:'Net Worth Tracker',              desc:'Assets liabilities, balance sheet, debt ratio, financial picture' },
        { mode:'finplan',      emoji:'📋', title:'Financial Plan',                 desc:'Personalised SIP plan, goals, risk profile, existing investments' },
        { mode:'taxguide',     emoji:'🧾', title:'Tax Guide',                      desc:'Old vs new tax regime, capital gains, crypto tax, which regime saves more' },
        { mode:'healthscore',  emoji:'💗', title:'Financial Health Score',         desc:'Honest money score, insurance check, emergency fund, savings rate' },
        { mode:'ssaplanner',   emoji:'👧', title:'SSA + Child Education Planner',  desc:'Sukanya Samriddhi, daughter education marriage corpus, ELSS SIP' },
        { mode:'ctcoptimizer', emoji:'💰', title:'CTC & Salary Optimizer',         desc:'CTC to take-home, HRA NPS food coupons, increase in-hand salary' },
        { mode:'gratuity',     emoji:'🏅', title:'Gratuity Calculator',            desc:'Gratuity on resignation retirement, 15/26 rule, tax-free limit ₹25L' },
        { mode:'debtplan',     emoji:'⚡', title:'Loan Prepayment Planner',        desc:'Avalanche snowball method, credit card loan, save interest, debt-free date' },
        { mode:'jointplan',    emoji:'👨‍👩‍👧', title:'Joint Family Financial Planner', desc:'Dual income couple planning, combined goals, split tax benefits' },
        { mode:'cibil',        emoji:'📊', title:'CIBIL Score Tracker',            desc:'Credit score 750+, EMI savings, credit utilisation, how to improve score' },
        { mode:'fincal',       emoji:'📅', title:'Financial Calendar',             desc:'ITR advance tax deadline, PPF ELSS SGB EPF, never miss a date' },
        { mode:'selfempl',     emoji:'🧑‍💻', title:'Self-Employed & Business Planner', desc:'44AD 44ADA presumptive tax, GST cashflow, freelancer quarterly advance tax' },
        { mode:'goldcomp',     emoji:'🥇', title:'Gold Investment Comparator',     desc:'Gold ETF vs MF vs physical gold, true cost GST making charges' },
        { mode:'cgcalc',       emoji:'📉', title:'Capital Gains Calculator',       desc:'LTCG STCG equity debt gold, Budget 2024, indexation, tax on sale' },
        { mode:'nomtrack',     emoji:'📜', title:'Nomination Tracker',             desc:'Nominee for EPF bank MF insurance demat, will checklist, estate readiness' },
        { mode:'budgettrack',  emoji:'📊', title:'Budget & Expense Tracker',       desc:'Monthly budget, spending categories, where is my money going' },
        { mode:'goaltracker',  emoji:'🎯', title:'Goal Tracker',                   desc:'Track savings progress toward goals, monthly check-ins, on-track status' },
    ];

    var _situations = [
        { emoji:'💼', label:'I just got a job or a raise',
          intro:'Decode your salary, benefits, and get your finances right from day one.',
          modes:['ctcoptimizer','hracalc','epfcalc','gratuity','taxguide','insure','healthscore','fincal'] },
        { emoji:'🏠', label:'I want to buy a house',
          intro:'Plan the biggest purchase of your life — EMI, down payment, tax savings.',
          modes:['homeloan','cibil','hracalc','debtplan'] },
        { emoji:'📈', label:'I want to grow my savings',
          intro:'Put your money to work — from SIPs and FDs to gold and stocks.',
          modes:['mfkit','mfexplorer','fundpicker','growth','stepupsip','fixedincome','goldcomp','coffeecan'] },
        { emoji:'🎯', label:'I have big goals — home, education, travel',
          intro:'Every goal is reachable with the right plan and the right SIP amount.',
          modes:['goal','goaltracker','finplan','ssaplanner','jointplan'] },
        { emoji:'🏖️', label:'I want to retire comfortably',
          intro:'Build the corpus you need and know exactly when you can stop working.',
          modes:['retirementhub','epfcalc','ppfnps','finplan','goal'] },
        { emoji:'💳', label:'I have loans I want to clear fast',
          intro:'Get out of debt faster and save lakhs in interest with a clear plan.',
          modes:['debtplan','homeloan','cibil'] },
        { emoji:'🧾', label:'I want to pay less tax legally',
          intro:'Every rupee saved in tax is a rupee earned — know every option.',
          modes:['taxguide','ctcoptimizer','cgcalc','hracalc','fixedincome','fincal','selfempl'] },
        { emoji:'🛡️', label:'Is my family financially protected?',
          intro:'Make sure your family is covered — insurance, nominees, and a safety net.',
          modes:['insure','ulipcheck','ssaplanner','nomtrack'] },
        { emoji:'📊', label:'I want to track where my money goes',
          intro:'See the full picture — spending, net worth, goals, and what to fix.',
          modes:['budgettrack','networth','goaltracker','mymfs','healthscore','fincal'] },
        { emoji:'🧑‍💻', label:'I run my own business or freelance',
          intro:'Tax, GST, cashflow — tools built for self-employed Indians.',
          modes:['selfempl','taxguide','cgcalc','fixedincome','budgettrack'] },
    ];

    function _dashRenderSmartSection() {
        var container = document.getElementById('dash-smart-section');
        if (!container) return;

        var chipsHtml = _situations.map(function(s, i) {
            return '<button onclick="dashOpenSituation(' + i + ')" ' +
                'style="display:flex;align-items:center;gap:9px;padding:10px 12px;border-radius:13px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.09);cursor:pointer;text-align:left;transition:all .15s;width:100%;" ' +
                'onmouseover="this.style.background=\'rgba(255,255,255,0.1)\';this.style.borderColor=\'rgba(245,200,66,0.3)\'" ' +
                'onmouseout="this.style.background=\'rgba(255,255,255,0.05)\';this.style.borderColor=\'rgba(255,255,255,0.09)\'">' +
                    '<span style="font-size:20px;flex-shrink:0;">' + s.emoji + '</span>' +
                    '<span style="font-size:11px;font-weight:700;color:rgba(255,255,255,0.8);line-height:1.35;">' + s.label + '</span>' +
                '</button>';
        }).join('');

        container.innerHTML =
            '<div style="margin-bottom:12px;position:relative;">' +
                '<span style="position:absolute;left:11px;top:50%;transform:translateY(-50%);font-size:13px;pointer-events:none;opacity:0.5;">🔍</span>' +
                '<input id="dash-search-input" type="text" autocomplete="off" ' +
                    'placeholder="Search all tools — try \'home loan\', \'SIP\', \'tax\', \'gold\'…" ' +
                    'oninput="dashHandleSearch(this.value)" ' +
                    'style="width:100%;padding:10px 12px 10px 34px;border-radius:12px;background:rgba(255,255,255,0.06);border:1.5px solid rgba(255,255,255,0.12);color:#fff;font-size:12px;font-weight:600;font-family:\'Inter\',sans-serif;outline:none;box-sizing:border-box;" ' +
                    'onfocus="this.style.borderColor=\'rgba(245,200,66,0.5)\'" ' +
                    'onblur="this.style.borderColor=\'rgba(255,255,255,0.12)\'" />' +
            '</div>' +
            '<div id="dash-search-results" style="display:none;"></div>' +
            '<div id="dash-chips-view">' +
                '<div style="font-size:10px;font-weight:800;color:rgba(255,255,255,0.35);text-transform:uppercase;letter-spacing:.08em;margin-bottom:10px;">What\'s on your mind?</div>' +
                '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">' + chipsHtml + '</div>' +
            '</div>';
    }

    window.dashHandleSearch = function(query) {
        var resultsEl  = document.getElementById('dash-search-results');
        var chipsView  = document.getElementById('dash-chips-view');
        var situView   = document.getElementById('dash-situation-view');
        if (!resultsEl) return;
        var q = (query || '').trim().toLowerCase();
        if (!q) {
            resultsEl.style.display = 'none';
            if (chipsView) chipsView.style.display = 'block';
            return;
        }
        if (chipsView) chipsView.style.display = 'none';
        if (situView)  situView.style.display  = 'none';
        var matches = _allTools.filter(function(t) {
            return (t.title + ' ' + t.desc).toLowerCase().indexOf(q) >= 0;
        });
        if (matches.length === 0) {
            resultsEl.innerHTML =
                '<div style="text-align:center;padding:24px 0;font-size:12px;color:rgba(255,255,255,0.3);">' +
                    'No tools found for <strong style="color:rgba(255,255,255,0.5);">"' + query + '"</strong>' +
                '</div>';
        } else {
            resultsEl.innerHTML =
                '<div style="font-size:10px;font-weight:800;color:rgba(255,255,255,0.35);text-transform:uppercase;letter-spacing:.08em;margin-bottom:10px;">' +
                    matches.length + ' tool' + (matches.length > 1 ? 's' : '') + ' found' +
                '</div>' +
                '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">' +
                matches.map(function(t) {
                    return '<button onclick="switchMode(\'' + t.mode + '\')" class="dash-card group">' +
                        '<div class="dash-card-icon">' + t.emoji + '</div>' +
                        '<div class="dash-card-title">' + t.title + '</div>' +
                        '<div class="dash-card-desc">' + t.desc + '</div>' +
                        '<div class="dash-card-arrow">→</div>' +
                    '</button>';
                }).join('') +
                '</div>';
        }
        resultsEl.style.display = 'block';
    };

    window.dashOpenSituation = function(idx) {
        var s = _situations[idx];
        if (!s) return;
        var panel = document.getElementById('dashcat-situation-panel');
        if (!panel) return;
        var tools = _allTools.filter(function(t) { return s.modes.indexOf(t.mode) >= 0; });
        tools.sort(function(a, b) { return s.modes.indexOf(a.mode) - s.modes.indexOf(b.mode); });
        panel.innerHTML =
            '<div style="max-width:820px;margin:0 auto;">' +
                '<div class="rounded-2xl px-4 py-3 mb-4 text-white flex items-center justify-between gap-3 flex-wrap shine-header" style="background:linear-gradient(135deg,#0c2340 0%,#1a4a7a 45%,#0e5c3a 100%);border:2px solid rgba(245,200,66,0.4);box-shadow:0 4px 18px rgba(0,0,0,0.25);">' +
                    '<div>' +
                        '<h2 class="text-base font-black">' + s.emoji + ' ' + s.label + '</h2>' +
                        '<p class="text-blue-200 text-[11px] mt-0.5">' + s.intro + '</p>' +
                    '</div>' +
                    '<button onclick="switchMode(\'dashboard\')" class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all" style="background:rgba(245,200,66,0.15);color:#f5c842;border:1px solid rgba(245,200,66,0.3);">⬅ Back</button>' +
                '</div>' +
                '<div class="dash-grid">' +
                tools.map(function(t) {
                    return '<button onclick="switchMode(\'' + t.mode + '\')" class="dash-card group">' +
                        '<div class="dash-card-icon">' + t.emoji + '</div>' +
                        '<div class="dash-card-title">' + t.title + '</div>' +
                        '<div class="dash-card-desc">' + t.desc + '</div>' +
                        '<div class="dash-card-arrow">→</div>' +
                    '</button>';
                }).join('') +
                '</div>' +
            '</div>';
        if (typeof switchMode === 'function') switchMode('dashcat-situation');
    };

    function initDashboard() {
        var favs = _dashGetFavs() || _dashFavDefaults.slice();
        var ca = document.getElementById('dash-fav-count-arrow');
        if (ca) ca.textContent = _t('pin.count').replace('{n}', favs.length);
        _dashRenderUnifiedWidget();
        _dashRenderSmartSection();
        consultUpdateTile();
        if (typeof consultWatchUnread === 'function') consultWatchUnread();
    }

    function _dashGetUserName() {
        if (window._fbAuth && window._fbAuth.currentUser) {
            return (window._fbAuth.currentUser.displayName || '').split(' ')[0] || '';
        }
        return '';
    }

    function _dashActionLabel(name) {
        var labels = {
            'Savings Rate':        'Boost your monthly SIP',
            'Debt Burden':         'Plan loan prepayment',
            'Health Insurance':    'Check insurance coverage',
            'Term Insurance':      'Check insurance coverage',
            'Emergency Fund':      'Build your emergency fund',
            'Spending Control':    'Track your expenses',
            'Age Readiness':       'Review your financial plan',
            'Net Worth Readiness': 'Track your net worth'
        };
        return labels[name] || name;
    }

    function _dashRenderScoreWidget() {
        var container = document.getElementById('dash-score-widget');
        if (!container) return;
        var result = window._hsLastResult;
        var prev   = window._hsPrevScore;
        var name   = _dashGetUserName();
        var greetHtml = name
            ? '<span style="color:rgba(245,200,66,0.95);font-weight:900;">Hi ' + name + '!</span> '
            : '';

        var _CARD = 'class="rounded-2xl px-3 py-2 text-white shine-header" style="background:linear-gradient(135deg,#0c2340 0%,#1a4a7a 45%,#0e5c3a 100%);border:1.5px solid rgba(245,200,66,0.35);box-shadow:0 4px 24px rgba(0,0,0,0.3);"';
        var _HDR  = 'style="display:flex;align-items:center;justify-content:space-between;margin-bottom:7px;"';
        var _LBL  = 'style="font-size:12px;font-weight:800;color:rgba(255,255,255,0.7);"';
        var _ACTBTN = 'style="font-size:10px;font-weight:700;color:rgba(245,200,66,0.8);background:rgba(245,200,66,0.08);border:1px solid rgba(245,200,66,0.25);padding:4px 10px;border-radius:8px;cursor:pointer;white-space:nowrap;" onmouseover="this.style.background=\'rgba(245,200,66,0.15)\'" onmouseout="this.style.background=\'rgba(245,200,66,0.08)\'"';

        if (!result) {
            container.innerHTML =
                '<div ' + _CARD + '>' +
                    '<div ' + _HDR + '><span ' + _LBL + '>💗 Financial Health</span></div>' +
                    '<button onclick="switchMode(\'healthscore\')" style="display:flex;align-items:center;gap:10px;width:100%;padding:10px;border-radius:10px;background:rgba(225,29,72,0.12);border:1.5px solid rgba(225,29,72,0.35);cursor:pointer;text-align:left;transition:all .15s;" onmouseover="this.style.background=\'rgba(225,29,72,0.22)\'" onmouseout="this.style.background=\'rgba(225,29,72,0.12)\'">' +
                        '<span style="font-size:22px;flex-shrink:0;">💗</span>' +
                        '<div style="flex:1;">' +
                            '<div style="font-size:12px;font-weight:900;color:#fff;">' + greetHtml + 'Know Your Financial Health Score</div>' +
                            '<div style="font-size:10px;color:rgba(147,197,253,0.75);margin-top:2px;">2 min · See where you stand · Get your action plan</div>' +
                        '</div>' +
                        '<span style="color:rgba(255,255,255,0.4);font-size:13px;flex-shrink:0;">→</span>' +
                    '</button>' +
                '</div>';
            return;
        }

        var delta = (prev && prev.score !== undefined && prev.score !== result.score) ? (result.score - prev.score) : null;
        var deltaHtml = '';
        if (delta !== null) {
            var dColor = delta > 0 ? '#22c55e' : '#ef4444';
            var dSign  = delta > 0 ? '↑ +' : '↓ ';
            deltaHtml = '<span style="font-size:10px;font-weight:800;color:' + dColor + ';background:' + dColor + '20;padding:2px 7px;border-radius:7px;margin-left:7px;vertical-align:middle;">' + dSign + Math.abs(delta) + ' pts</span>';
        }

        var c = 2 * Math.PI * 28;
        var off = (c * (1 - result.score / 100)).toFixed(1);
        var arcClr = result.arcColor || '#10b981';

        var _hasNwData = window._toolSummaries && window._toolSummaries.netWorth &&
                         (window._toolSummaries.netWorth.totalAssets || window._toolSummaries.netWorth.totalLiab);
        var topAction = (result.topActions || []).filter(function(a) {
            return !(_hasNwData && a.name === 'Net Worth Readiness');
        })[0];
        var actionHtml = topAction
            ? '<div style="margin-top:7px;padding-top:7px;border-top:1px solid rgba(255,255,255,0.08);">' +
                  '<button onclick="switchMode(\'' + topAction.mode + '\')" style="display:flex;align-items:center;gap:8px;width:100%;padding:5px 8px;border-radius:9px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.09);cursor:pointer;transition:all .15s;" onmouseover="this.style.background=\'rgba(255,255,255,0.11)\'" onmouseout="this.style.background=\'rgba(255,255,255,0.05)\'">' +
                      '<span style="font-size:13px;flex-shrink:0;">' + topAction.icon + '</span>' +
                      '<span style="font-size:10.5px;font-weight:700;color:rgba(255,255,255,0.8);flex:1;text-align:left;">' + _dashActionLabel(topAction.name) + '</span>' +
                      '<span style="font-size:10px;color:rgba(255,255,255,0.3);">→</span>' +
                  '</button>' +
              '</div>'
            : '';

        var _TS = 'style="margin-top:8px;padding-top:7px;border-top:1px solid rgba(255,255,255,0.07);font-size:9px;color:rgba(255,255,255,0.3);font-weight:600;"';
        var hsTsLine = result.ts ? '<div ' + _TS + '>Updated ' + _dashFmtTs(result.ts) + '</div>' : '';

        container.innerHTML =
            '<div ' + _CARD + '>' +
                '<div ' + _HDR + '>' +
                    '<span ' + _LBL + '>💗 Financial Health</span>' +
                    '<button onclick="switchMode(\'healthscore\')" ' + _ACTBTN + '>Update Score</button>' +
                '</div>' +
                '<div style="display:flex;align-items:center;gap:10px;">' +
                    '<div style="position:relative;flex-shrink:0;">' +
                        '<svg viewBox="0 0 72 72" style="width:50px;height:50px;transform:rotate(-90deg);">' +
                            '<circle cx="36" cy="36" r="28" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="7"/>' +
                            '<circle cx="36" cy="36" r="28" fill="none" stroke="' + arcClr + '" stroke-width="7" stroke-linecap="round" stroke-dasharray="' + c.toFixed(1) + '" stroke-dashoffset="' + off + '" style="transition:stroke-dashoffset 1s ease;"/>' +
                        '</svg>' +
                        '<div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;">' +
                            '<span style="font-size:14px;font-weight:900;color:#fff;line-height:1;">' + result.score + '</span>' +
                            '<span style="font-size:7px;color:rgba(255,255,255,0.35);font-weight:700;">/100</span>' +
                        '</div>' +
                    '</div>' +
                    '<div style="flex:1;min-width:0;">' +
                        '<div style="font-size:14px;line-height:1;">' + result.emoji + '</div>' +
                        '<div style="font-size:12px;font-weight:900;color:#fff;margin-top:2px;line-height:1.2;">' + result.grade + deltaHtml + '</div>' +
                    '</div>' +
                '</div>' +
                actionHtml +
                hsTsLine +
            '</div>';
    }

    function _dashFmtNW(n) {
        var a = Math.abs(n), s = n < 0 ? '-' : '';
        if (a >= 1e7) return s + '₹' + (a/1e7).toFixed(2) + ' Cr';
        if (a >= 1e5) return s + '₹' + (a/1e5).toFixed(2) + ' L';
        return s + '₹' + Math.round(a).toLocaleString('en-IN');
    }

    function _dashFmtTs(iso) {
        if (!iso) return '';
        var d = new Date(iso);
        if (isNaN(d)) return '';
        return d.toLocaleString('en-IN', { day:'numeric', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit', hour12:true });
    }

    function _dashRenderNetWorthWidget() {
        var container = document.getElementById('dash-nw-widget');
        if (!container) return;
        var nw = window._toolSummaries && window._toolSummaries.netWorth;
        var hasData = nw && (nw.totalAssets || nw.totalLiab);

        var _NW_CARD = 'class="rounded-2xl px-3 py-2 text-white shine-header" style="background:linear-gradient(135deg,#0c2340 0%,#1a4a7a 45%,#0e5c3a 100%);border:1.5px solid rgba(245,200,66,0.35);box-shadow:0 4px 24px rgba(0,0,0,0.3);"';
        var _NW_ACTBTN = 'style="font-size:10px;font-weight:700;color:rgba(245,200,66,0.8);background:rgba(245,200,66,0.08);border:1px solid rgba(245,200,66,0.25);padding:4px 10px;border-radius:8px;cursor:pointer;" onmouseover="this.style.background=\'rgba(245,200,66,0.15)\'" onmouseout="this.style.background=\'rgba(245,200,66,0.08)\'"';

        if (!hasData) {
            container.innerHTML =
                '<div ' + _NW_CARD + '>' +
                    '<div style="display:flex;align-items:center;margin-bottom:10px;">' +
                        '<span style="font-size:12px;font-weight:800;color:rgba(255,255,255,0.7);">⚖️ Net Worth</span>' +
                    '</div>' +
                    '<button onclick="switchMode(\'networth\')" style="display:flex;align-items:center;gap:10px;width:100%;padding:10px;border-radius:10px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);cursor:pointer;text-align:left;transition:all .15s;" onmouseover="this.style.background=\'rgba(255,255,255,0.11)\'" onmouseout="this.style.background=\'rgba(255,255,255,0.06)\'">' +
                        '<span style="font-size:20px;flex-shrink:0;">⚖️</span>' +
                        '<div style="flex:1;">' +
                            '<div style="font-size:12px;font-weight:800;color:#fff;">Track your Net Worth</div>' +
                            '<div style="font-size:10px;color:rgba(147,197,253,0.75);margin-top:1px;">Assets · Liabilities · Debt ratio</div>' +
                        '</div>' +
                        '<span style="color:rgba(255,255,255,0.4);font-size:13px;flex-shrink:0;">→</span>' +
                    '</button>' +
                '</div>';
            return;
        }

        var nwVal  = nw.netWorth    || 0;
        var assets = nw.totalAssets || 0;
        var liabs  = nw.totalLiab   || 0;
        var nwColor = nwVal >= 0 ? '#10b981' : '#ef4444';
        var dtar = assets > 0 ? (liabs / assets * 100).toFixed(0) : 0;
        var dtarColor = dtar <= 30 ? '#10b981' : dtar <= 50 ? '#f59e0b' : '#ef4444';
        var _NW_TS = 'style="margin-top:8px;padding-top:7px;border-top:1px solid rgba(255,255,255,0.07);font-size:9px;color:rgba(255,255,255,0.3);font-weight:600;"';
        var nwTsLine = nw.updatedAt ? '<div ' + _NW_TS + '>Updated ' + _dashFmtTs(nw.updatedAt) + '</div>' : '';

        container.innerHTML =
            '<div ' + _NW_CARD + '>' +
                '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:7px;">' +
                    '<span style="font-size:12px;font-weight:800;color:rgba(255,255,255,0.7);">⚖️ Net Worth</span>' +
                    '<button onclick="switchMode(\'networth\')" ' + _NW_ACTBTN + '>Update</button>' +
                '</div>' +
                '<div style="display:flex;align-items:center;gap:10px;">' +
                    '<div>' +
                        '<div style="font-size:18px;font-weight:900;color:' + nwColor + ';line-height:1;">' + _dashFmtNW(nwVal) + '</div>' +
                        '<div style="font-size:9px;color:rgba(255,255,255,0.35);margin-top:2px;font-weight:600;">Total Net Worth</div>' +
                    '</div>' +
                    '<div style="margin-left:auto;display:flex;gap:12px;">' +
                        '<div style="text-align:right;">' +
                            '<div style="font-size:11px;font-weight:800;color:rgba(255,255,255,0.7);">' + _dashFmtNW(assets) + '</div>' +
                            '<div style="font-size:9px;color:rgba(255,255,255,0.35);font-weight:600;">Assets</div>' +
                        '</div>' +
                        '<div style="width:1px;background:rgba(255,255,255,0.1);"></div>' +
                        '<div style="text-align:right;">' +
                            '<div style="font-size:11px;font-weight:800;color:rgba(255,255,255,0.7);">' + _dashFmtNW(liabs) + '</div>' +
                            '<div style="font-size:9px;color:rgba(255,255,255,0.35);font-weight:600;">Liabilities</div>' +
                        '</div>' +
                        (dtar > 0 ? '<div style="width:1px;background:rgba(255,255,255,0.1);"></div>' +
                        '<div style="text-align:right;">' +
                            '<div style="font-size:11px;font-weight:800;color:' + dtarColor + ';">' + dtar + '%</div>' +
                            '<div style="font-size:9px;color:rgba(255,255,255,0.35);font-weight:600;">Debt Ratio</div>' +
                        '</div>' : '') +
                    '</div>' +
                '</div>' +
                nwTsLine +
            '</div>';
    }

    window._dashUpdateNetWorthWidget = function() {
        if (window._currentMode === 'dashboard') _dashRenderUnifiedWidget();
    };

    function _dashFmtGoal(n) {
        var a = Math.abs(n || 0);
        if (a >= 1e7) return '₹' + (a / 1e7).toFixed(1) + 'Cr';
        if (a >= 1e5) return '₹' + (a / 1e5).toFixed(1) + 'L';
        return '₹' + Math.round(a).toLocaleString('en-IN');
    }

    function _dashRenderGoalsWidget() {
        var container = document.getElementById('dash-goals-widget');
        if (!container) return;
        var goals = window._savedGoals || [];

        var _GT_CARD = 'class="rounded-2xl px-3 py-2 text-white shine-header" style="background:linear-gradient(135deg,#0c2340 0%,#1a4a7a 45%,#0e5c3a 100%);border:1.5px solid rgba(245,200,66,0.35);box-shadow:0 4px 24px rgba(0,0,0,0.3);"';
        var _GT_ACTBTN = 'style="font-size:10px;font-weight:700;color:rgba(245,200,66,0.8);background:rgba(245,200,66,0.08);border:1px solid rgba(245,200,66,0.25);padding:4px 10px;border-radius:8px;cursor:pointer;" onmouseover="this.style.background=\'rgba(245,200,66,0.15)\'" onmouseout="this.style.background=\'rgba(245,200,66,0.08)\'"';

        if (goals.length === 0) {
            container.innerHTML =
                '<div ' + _GT_CARD + '>' +
                    '<div style="display:flex;align-items:center;margin-bottom:10px;">' +
                        '<span style="font-size:12px;font-weight:800;color:rgba(255,255,255,0.7);">🎯 My Goals</span>' +
                    '</div>' +
                    '<button onclick="switchMode(\'goal\')" style="display:flex;align-items:center;gap:10px;width:100%;padding:10px;border-radius:10px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);cursor:pointer;text-align:left;transition:all .15s;" onmouseover="this.style.background=\'rgba(255,255,255,0.11)\'" onmouseout="this.style.background=\'rgba(255,255,255,0.06)\'">' +
                        '<span style="font-size:20px;flex-shrink:0;">🎯</span>' +
                        '<div style="flex:1;">' +
                            '<div style="font-size:12px;font-weight:800;color:#fff;">Set your first financial goal</div>' +
                            '<div style="font-size:10px;color:rgba(147,197,253,0.75);margin-top:1px;">Education · Home · Retirement · Marriage</div>' +
                        '</div>' +
                        '<span style="color:rgba(255,255,255,0.4);font-size:13px;flex-shrink:0;">→</span>' +
                    '</button>' +
                '</div>';
            return;
        }

        var shown = goals.slice(0, 3);
        var rows = shown.map(function (g) {
            var pct = Math.min(100, Math.round(((g.savedAmt || 0) / (g.targetAmt || 1)) * 100));
            var barColor = pct >= 75 ? '#10b981' : pct >= 40 ? '#6366f1' : '#f59e0b';
            return '<div style="margin-bottom:5px;">' +
                '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;">' +
                    '<span style="font-size:11px;font-weight:700;color:rgba(255,255,255,0.8);">' + g.emoji + ' ' + g.label + '</span>' +
                    '<span style="font-size:10px;font-weight:800;color:rgba(255,255,255,0.5);">' + pct + '%</span>' +
                '</div>' +
                '<div style="height:4px;border-radius:99px;background:rgba(255,255,255,0.1);overflow:hidden;">' +
                    '<div style="height:4px;border-radius:99px;background:' + barColor + ';width:' + pct + '%;transition:width .5s ease;"></div>' +
                '</div>' +
            '</div>';
        }).join('');

        var moreLabel = goals.length > 3 ? ' <span style="font-size:10px;color:rgba(255,255,255,0.4);font-weight:600;">+' + (goals.length - 3) + ' more</span>' : '';

        var goalsTs = goals.reduce(function(max, g) {
            var lastCi = (g.checkIns && g.checkIns.length) ? g.checkIns[g.checkIns.length - 1].ts : '';
            var best = lastCi > (g.createdAt || '') ? lastCi : (g.createdAt || '');
            return best > max ? best : max;
        }, '');
        var _GT_TS = 'style="margin-top:8px;padding-top:7px;border-top:1px solid rgba(255,255,255,0.07);font-size:9px;color:rgba(255,255,255,0.3);font-weight:600;"';
        var gtTsLine = goalsTs ? '<div ' + _GT_TS + '>Updated ' + _dashFmtTs(goalsTs) + '</div>' : '';

        container.innerHTML =
            '<div ' + _GT_CARD + '>' +
                '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:7px;">' +
                    '<span style="font-size:12px;font-weight:800;color:rgba(255,255,255,0.7);">🎯 My Goals' + moreLabel + '</span>' +
                    '<button onclick="switchMode(\'goaltracker\')" ' + _GT_ACTBTN + '>Track →</button>' +
                '</div>' +
                rows +
                gtTsLine +
            '</div>';
    }

    window._dashUpdateGoalsWidget = function () {
        if (window._currentMode === 'dashboard') _dashRenderUnifiedWidget();
    };

    function _dashRenderBudgetWidget() {
        var container = document.getElementById('dash-budget-widget');
        if (!container) return;

        var CARD   = 'class="rounded-2xl px-3 py-2 text-white shine-header" style="background:linear-gradient(135deg,#0c2340 0%,#1a4a7a 45%,#0e5c3a 100%);border:1.5px solid rgba(245,200,66,0.35);box-shadow:0 4px 24px rgba(0,0,0,0.3);"';
        var ACTBTN = 'style="font-size:10px;font-weight:700;color:rgba(245,200,66,0.8);background:rgba(245,200,66,0.08);border:1px solid rgba(245,200,66,0.25);padding:4px 10px;border-radius:8px;cursor:pointer;white-space:nowrap;" onmouseover="this.style.background=\'rgba(245,200,66,0.15)\'" onmouseout="this.style.background=\'rgba(245,200,66,0.08)\'"';

        var _CAT_ICONS = {
            'Housing':'🏠','Food':'🍽️','Transport':'🚌','EMIs & Loans':'💳',
            'Entertainment':'🎬','Health':'💊','Shopping':'🛍️','Utilities':'⚡',
            'Education':'📚','Others':'💸'
        };

        var now = new Date();
        var curMon    = now.toISOString().slice(0, 7);
        var monthLabel = now.toLocaleString('en-IN', { month: 'long', year: 'numeric' });
        var monthData  = (window._btData && window._btData[curMon]) ? window._btData[curMon] : null;
        var hasAnyEntry = monthData && Object.keys(monthData).some(function(k) {
            var e = monthData[k]; return (e.b || 0) > 0 || (e.a || 0) > 0;
        });

        // ── No data ──────────────────────────────────────────────
        if (!hasAnyEntry) {
            container.innerHTML =
                '<div ' + CARD + '>' +
                    '<div style="display:flex;align-items:center;margin-bottom:7px;">' +
                        '<span style="font-size:12px;font-weight:800;color:rgba(255,255,255,0.7);">📊 Budget · ' + monthLabel + '</span>' +
                    '</div>' +
                    '<button onclick="switchMode(\'budgettrack\')" style="display:flex;align-items:center;gap:10px;width:100%;padding:8px 10px;border-radius:10px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);cursor:pointer;text-align:left;transition:all .15s;" onmouseover="this.style.background=\'rgba(255,255,255,0.11)\'" onmouseout="this.style.background=\'rgba(255,255,255,0.06)\'">' +
                        '<span style="font-size:20px;flex-shrink:0;">📊</span>' +
                        '<div style="flex:1;">' +
                            '<div style="font-size:12px;font-weight:800;color:#fff;">Set up ' + monthLabel + ' budget</div>' +
                            '<div style="font-size:10px;color:rgba(147,197,253,0.75);margin-top:1px;">Track spending · Find where your money goes</div>' +
                        '</div>' +
                        '<span style="color:rgba(255,255,255,0.4);font-size:13px;flex-shrink:0;">→</span>' +
                    '</button>' +
                '</div>';
            return;
        }

        // ── Compute totals ───────────────────────────────────────
        var totalBudget = 0, totalActual = 0;
        var overCats = [];
        Object.keys(monthData).forEach(function(key) {
            var e = monthData[key] || {};
            var b = e.b || 0, a = e.a || 0;
            totalBudget += b;
            totalActual += a;
            if (b > 0 && a > b) overCats.push({ key: key, icon: _CAT_ICONS[key] || '📌', over: a - b });
        });
        overCats.sort(function(x, y) { return y.over - x.over; });

        var pct      = totalBudget > 0 ? Math.min(110, Math.round(totalActual / totalBudget * 100)) : 0;
        var barPct   = Math.min(100, pct);
        var barColor = pct <= 75 ? '#10b981' : pct <= 100 ? '#f59e0b' : '#ef4444';
        var _TS      = 'style="margin-top:7px;padding-top:6px;border-top:1px solid rgba(255,255,255,0.07);font-size:9px;color:rgba(255,255,255,0.3);font-weight:600;"';

        // ── Status line ──────────────────────────────────────────
        var statusHtml;
        if (totalActual === 0) {
            statusHtml = '<div style="font-size:10px;color:rgba(147,197,253,0.7);margin-top:5px;">Budget set — start logging your actual spend</div>';
        } else if (overCats.length > 0) {
            var top = overCats[0];
            statusHtml = '<div style="font-size:10px;color:rgba(248,113,113,0.85);margin-top:5px;">' +
                '⚠ ' + (top.icon) + ' ' + top.key + ' ₹' + _dashFmtNW(top.over) + ' over budget' +
                (overCats.length > 1 ? ' · ' + overCats.length + ' categories' : '') +
            '</div>';
        } else {
            statusHtml = '<div style="font-size:10px;color:rgba(52,211,153,0.85);margin-top:5px;">✓ All categories within budget</div>';
        }

        // ── Spent / Budget numbers ───────────────────────────────
        var spentLabel  = totalBudget > 0
            ? _dashFmtNW(totalActual) + ' of ' + _dashFmtNW(totalBudget)
            : _dashFmtNW(totalActual) + ' spent';

        container.innerHTML =
            '<div ' + CARD + '>' +
                '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:7px;">' +
                    '<span style="font-size:12px;font-weight:800;color:rgba(255,255,255,0.7);">📊 Budget · ' + monthLabel + '</span>' +
                    '<button onclick="switchMode(\'budgettrack\')" ' + ACTBTN + '>Update →</button>' +
                '</div>' +
                (totalBudget > 0
                    ? '<div style="height:5px;border-radius:99px;background:rgba(255,255,255,0.1);overflow:hidden;margin-bottom:6px;">' +
                          '<div style="height:5px;border-radius:99px;background:' + barColor + ';width:' + barPct + '%;transition:width .5s ease;"></div>' +
                      '</div>'
                    : '') +
                '<div style="display:flex;align-items:baseline;justify-content:space-between;">' +
                    '<div style="font-size:16px;font-weight:900;color:#fff;line-height:1;">' + spentLabel + '</div>' +
                    (totalBudget > 0 ? '<div style="font-size:11px;font-weight:800;color:' + barColor + ';">' + pct + '%</div>' : '') +
                '</div>' +
                statusHtml +
                (totalBudget > 0 ? '<div ' + _TS + '>Budget set for ' + monthLabel + '</div>' : '') +
            '</div>';
    }

    window._dashUpdateBudgetWidget = function() {
        if (window._currentMode === 'dashboard') _dashRenderUnifiedWidget();
    };

    window._dashUpdateScoreWidget = function() {
        if (window._currentMode === 'dashboard') _dashRenderUnifiedWidget();
    };

    function _dashRenderUnifiedWidget() {
        var container = document.getElementById('dash-unified-widget');
        if (!container) return;

        var CS  = 'background:linear-gradient(135deg,#0c2340 0%,#1a4a7a 50%,#0e5c3a 100%);border:1.5px solid rgba(245,200,66,0.3);box-shadow:0 3px 16px rgba(0,0,0,0.28);border-radius:14px;padding:12px;display:flex;flex-direction:column;cursor:pointer;transition:border-color .18s,box-shadow .18s;';
        var LBL = 'style="font-size:10.5px;font-weight:800;color:rgba(245,200,66,0.9);letter-spacing:.05em;text-transform:uppercase;"';
        var TS  = 'style="font-size:8.5px;color:rgba(255,255,255,0.28);font-weight:600;margin-top:6px;padding-top:7px;border-top:1px solid rgba(255,255,255,0.07);"';

        function _noData(emoji, text) {
            return '<div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:5px;min-height:72px;">' +
                '<span style="font-size:22px;">' + emoji + '</span>' +
                '<div style="font-size:9.5px;font-weight:800;color:rgba(255,255,255,0.45);text-align:center;line-height:1.4;">' + text + '</div>' +
                '<div style="font-size:8.5px;font-weight:700;color:rgba(245,200,66,0.55);margin-top:3px;">Tap to open →</div>' +
            '</div>';
        }

        function _tsLine(ts) {
            return ts ? 'Updated ' + _dashFmtTs(ts) : 'Not yet updated';
        }

        // ── Health Score ─────────────────────────────────────
        var hs = window._hsLastResult;
        var healthContent, healthTs;
        if (!hs) {
            healthContent = _noData('💗', 'Run Health Score');
            healthTs = 'Not yet run';
        } else {
            var c2pi   = 2 * Math.PI * 28;
            var arcOff = (c2pi * (1 - hs.score / 100)).toFixed(1);
            var arcClr = hs.arcColor || '#10b981';
            var prev   = window._hsPrevScore;
            var delta  = (prev && prev.score !== undefined && prev.score !== hs.score) ? (hs.score - prev.score) : null;
            var deltaHtml = delta !== null
                ? ' <span style="font-size:9px;font-weight:800;color:' + (delta > 0 ? '#22c55e' : '#ef4444') + ';">' + (delta > 0 ? '↑+' : '↓') + Math.abs(delta) + '</span>'
                : '';
            var _hsAge = parseInt((window._userProfile && window._userProfile.age) || '0', 10);
            var _hsAgeStr = _hsAge >= 56 ? ' aged 56+' : _hsAge >= 46 ? ' aged 46–55' : _hsAge >= 36 ? ' aged 36–45' : _hsAge >= 26 ? ' aged 26–35' : _hsAge >= 18 ? ' aged 18–25' : '';
            var _hsPct = hs.score >= 90 ? 95 : hs.score >= 80 ? 82 : hs.score >= 70 ? 68 : hs.score >= 60 ? 52 : hs.score >= 50 ? 38 : 0;
            var _hsPercentileLine = _hsPct > 0
                ? '<div style="font-size:8.5px;font-weight:700;color:rgba(245,200,66,0.85);margin-top:6px;line-height:1.35;">Better than ' + _hsPct + '% of Indians' + _hsAgeStr + '</div>'
                : '';

            healthContent =
                '<div style="flex:1;display:flex;align-items:center;justify-content:space-between;">' +
                    '<div>' +
                        '<div style="font-size:12px;font-weight:900;color:#fff;line-height:1.3;">' + hs.grade + deltaHtml + '</div>' +
                        '<div style="font-size:15px;margin-top:5px;">' + hs.emoji + '</div>' +
                        _hsPercentileLine +
                    '</div>' +
                    '<div style="position:relative;flex-shrink:0;">' +
                        '<svg viewBox="0 0 72 72" style="width:56px;height:56px;transform:rotate(-90deg);">' +
                            '<circle cx="36" cy="36" r="28" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="8"/>' +
                            '<circle cx="36" cy="36" r="28" fill="none" stroke="' + arcClr + '" stroke-width="8" stroke-linecap="round" stroke-dasharray="' + c2pi.toFixed(1) + '" stroke-dashoffset="' + arcOff + '"/>' +
                        '</svg>' +
                        '<div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;">' +
                            '<span style="font-size:18px;font-weight:900;color:#fff;line-height:1;">' + hs.score + '</span>' +
                            '<span style="font-size:7px;color:rgba(255,255,255,0.35);font-weight:600;">/100</span>' +
                        '</div>' +
                    '</div>' +
                '</div>';
            healthTs = _tsLine(hs.ts);
        }

        // ── Net Worth ─────────────────────────────────────────
        var nw    = window._toolSummaries && window._toolSummaries.netWorth;
        var hasNw = nw && (nw.totalAssets || nw.totalLiab);
        var nwContent, nwTs;
        if (!hasNw) {
            nwContent = _noData('⚖️', 'Track Net Worth');
            nwTs = 'Not yet tracked';
        } else {
            var nwVal   = nw.netWorth    || 0;
            var assets  = nw.totalAssets || 0;
            var liabs   = nw.totalLiab   || 0;
            var nwCol   = nwVal >= 0 ? '#34d399' : '#f87171';
            var dtar    = assets > 0 ? Math.round(liabs / assets * 100) : 0;
            var dtarCol = dtar <= 30 ? '#34d399' : dtar <= 50 ? '#fbbf24' : '#f87171';
            nwContent =
                '<div style="flex:1;">' +
                    '<div style="font-size:20px;font-weight:900;color:' + nwCol + ';line-height:1;margin-bottom:8px;">' + _dashFmtNW(nwVal) + '</div>' +
                    '<div style="display:flex;flex-direction:column;gap:3px;">' +
                        '<div style="display:flex;justify-content:space-between;">' +
                            '<span style="font-size:9px;color:rgba(255,255,255,0.4);font-weight:600;">Assets</span>' +
                            '<span style="font-size:9.5px;font-weight:800;color:rgba(255,255,255,0.8);">' + _dashFmtNW(assets) + '</span>' +
                        '</div>' +
                        '<div style="display:flex;justify-content:space-between;">' +
                            '<span style="font-size:9px;color:rgba(255,255,255,0.4);font-weight:600;">Liabilities</span>' +
                            '<span style="font-size:9.5px;font-weight:800;color:rgba(255,255,255,0.8);">' + _dashFmtNW(liabs) + '</span>' +
                        '</div>' +
                        (dtar > 0 ?
                        '<div style="display:flex;justify-content:space-between;">' +
                            '<span style="font-size:9px;color:rgba(255,255,255,0.4);font-weight:600;">Debt ratio</span>' +
                            '<span style="font-size:9.5px;font-weight:800;color:' + dtarCol + ';">' + dtar + '%</span>' +
                        '</div>' : '') +
                    '</div>' +
                '</div>';
            nwTs = _tsLine(nw.updatedAt);
        }

        // ── Goals ─────────────────────────────────────────────
        var goals = window._savedGoals || [];
        var goalsContent, goalsTs;
        if (goals.length === 0) {
            goalsContent = _noData('🎯', 'Set Your Goals');
            goalsTs = 'No goals yet';
        } else {
            goalsContent =
                '<div style="flex:1;display:flex;flex-direction:column;justify-content:center;gap:7px;">' +
                goals.slice(0, 3).map(function(g) {
                    var pct = Math.min(100, Math.round(((g.savedAmt || 0) / (g.targetAmt || 1)) * 100));
                    var bc  = pct >= 75 ? '#34d399' : pct >= 40 ? '#818cf8' : '#fbbf24';
                    return '<div>' +
                        '<div style="display:flex;justify-content:space-between;margin-bottom:3px;">' +
                            '<span style="font-size:9.5px;font-weight:700;color:rgba(255,255,255,0.85);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:75%;">' + (g.emoji||'') + ' ' + (g.label||'') + '</span>' +
                            '<span style="font-size:9px;font-weight:900;color:' + bc + ';flex-shrink:0;">' + pct + '%</span>' +
                        '</div>' +
                        '<div style="height:4px;border-radius:99px;background:rgba(255,255,255,0.1);">' +
                            '<div style="height:4px;border-radius:99px;background:' + bc + ';width:' + pct + '%;transition:width .6s;"></div>' +
                        '</div>' +
                    '</div>';
                }).join('') +
                (goals.length > 3 ? '<div style="font-size:9px;color:rgba(255,255,255,0.3);font-weight:600;">+' + (goals.length - 3) + ' more</div>' : '') +
                '</div>';
            var gTs = window._savedGoalsTs;
            if (!gTs) {
                var latestTs = null;
                goals.forEach(function(g) {
                    if (g.createdAt && (!latestTs || g.createdAt > latestTs)) latestTs = g.createdAt;
                    (g.checkIns || []).forEach(function(ci) {
                        if (ci.date && (!latestTs || ci.date > latestTs)) latestTs = ci.date;
                    });
                });
                gTs = latestTs;
            }
            goalsTs = _tsLine(gTs);
        }

        // ── Budget ─────────────────────────────────────────────
        var _CI   = {'Housing':'🏠','Food':'🍽️','Transport':'🚌','EMIs & Loans':'💳','Entertainment':'🎬','Health':'💊','Shopping':'🛍️','Utilities':'⚡','Education':'📚','Others':'💸'};
        var curMon   = new Date().toISOString().slice(0, 7);
        var monLabel = new Date().toLocaleString('en-IN', { month: 'short', year: 'numeric' });
        var md       = window._btData && window._btData[curMon];
        var hasBt    = md && Object.keys(md).some(function(k) { var e=md[k]; return (e.b||0)>0||(e.a||0)>0; });
        var budgetContent, budgetTs;
        if (!hasBt) {
            budgetContent = _noData('📊', 'Set Up Budget');
            budgetTs = 'No data yet';
        } else {
            var tb=0, ta=0, oc=[];
            Object.keys(md).forEach(function(k) { var e=md[k]||{},b=e.b||0,a=e.a||0; tb+=b; ta+=a; if(b>0&&a>b) oc.push({key:k,icon:_CI[k]||'📌',over:a-b}); });
            oc.sort(function(x,y) { return y.over-x.over; });
            var pctB = tb>0 ? Math.min(110,Math.round(ta/tb*100)) : 0;
            var bpct = Math.min(100, pctB);
            var bcol = pctB<=75?'#34d399':pctB<=100?'#fbbf24':'#f87171';
            var stL  = ta===0
                ? '<div style="font-size:9px;color:rgba(147,197,253,0.7);">No spend logged yet</div>'
                : oc.length>0
                    ? '<div style="font-size:9px;color:#f87171;">⚠ ' + oc[0].icon + ' ' + oc[0].key + ' over</div>'
                    : '<div style="font-size:9px;color:#34d399;">✓ Within budget</div>';
            budgetContent =
                '<div style="flex:1;display:flex;flex-direction:column;justify-content:center;">' +
                    '<div style="font-size:9px;color:rgba(255,255,255,0.4);font-weight:700;margin-bottom:5px;">' + monLabel + '</div>' +
                    (tb>0 ? '<div style="height:5px;border-radius:99px;background:rgba(255,255,255,0.1);overflow:hidden;margin-bottom:7px;">' +
                        '<div style="height:5px;border-radius:99px;background:' + bcol + ';width:' + bpct + '%;transition:width .5s;"></div></div>' : '') +
                    '<div style="display:flex;align-items:baseline;justify-content:space-between;margin-bottom:4px;">' +
                        '<div style="font-size:13px;font-weight:900;color:#fff;">' + _dashFmtNW(ta) + '</div>' +
                        (tb>0 ? '<div style="font-size:11px;font-weight:900;color:' + bcol + ';">' + pctB + '%</div>' : '') +
                    '</div>' +
                    (tb>0 ? '<div style="font-size:8.5px;color:rgba(255,255,255,0.3);margin-bottom:4px;">of ' + _dashFmtNW(tb) + ' budgeted</div>' : '') +
                    stL +
                '</div>';
            budgetTs = _tsLine(window._btLastUpdated);
        }

        // ── Assemble ───────────────────────────────────────────
        function _card(mode, icon, label, content, ts) {
            return '<div onclick="switchMode(\'' + mode + '\')" style="' + CS + '" ' +
                   'onmouseover="this.style.borderColor=\'rgba(245,200,66,0.65)\';this.style.boxShadow=\'0 6px 24px rgba(0,0,0,0.4)\'" ' +
                   'onmouseout="this.style.borderColor=\'rgba(245,200,66,0.3)\';this.style.boxShadow=\'0 3px 16px rgba(0,0,0,0.28)\'">' +
                '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">' +
                    '<span ' + LBL + '>' + icon + ' ' + label + '</span>' +
                    '<span style="font-size:12px;color:rgba(245,200,66,0.45);font-weight:700;">→</span>' +
                '</div>' +
                content +
                '<div ' + TS + '>' + ts + '</div>' +
            '</div>';
        }

        container.innerHTML =
            '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">' +
                _card('healthscore', '💗', 'Your FinHealth Score', healthContent, healthTs) +
                _card('networth',    '⚖️', 'Your Net Worth', nwContent, nwTs) +
                _card('goaltracker', '🎯', 'Status of Your Goals', goalsContent, goalsTs) +
                _card('budgettrack', '📊', 'Your Budget Plan', budgetContent, budgetTs) +
            '</div>';
    }

    // Fallback timer — only fires if auth state never resolves (e.g. offline).
    // Normal init is triggered directly from onAuthStateChanged in auth.js.
    window.addEventListener('DOMContentLoaded', function() {
        setTimeout(function() {
            if (window._isExpert) return;          // Expert portal already active
            if (window._authResolved)  return;      // auth.js already called switchMode
            if (typeof switchMode === 'function') switchMode('dashboard');
        }, 2000);
    });
