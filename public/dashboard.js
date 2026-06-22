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

    function initDashboard() {
        var favs = _dashGetFavs() || _dashFavDefaults.slice();
        var ca = document.getElementById('dash-fav-count-arrow');
        if (ca) ca.textContent = _t('pin.count').replace('{n}', favs.length);
        _dashRenderCockpit();
        if (typeof initRoadmap === 'function') initRoadmap();
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

    // ── Cockpit gauge SVG (240° speedometer arc) ─────────────────────────────────
    function _cockpitGaugeSvg(fraction, color) {
        var cx = 60, cy = 65, r = 46;
        var startDeg = 150, sweepDeg = 240;
        fraction = Math.min(1, Math.max(0, fraction || 0));
        function pt(deg) {
            var rad = deg * Math.PI / 180;
            return [(cx + r * Math.cos(rad)).toFixed(1), (cy + r * Math.sin(rad)).toFixed(1)];
        }
        var s = pt(startDeg), e = pt(startDeg + sweepDeg);
        var vDeg = startDeg + sweepDeg * fraction, v = pt(vDeg);
        var vLarge = (sweepDeg * fraction) > 180 ? 1 : 0;
        var track = '<path d="M ' + s[0] + ' ' + s[1] + ' A ' + r + ' ' + r + ' 0 1 1 ' + e[0] + ' ' + e[1] + '" stroke="rgba(255,255,255,0.07)" stroke-width="8" fill="none" stroke-linecap="round"/>';
        var arc   = fraction > 0.01
            ? '<path d="M ' + s[0] + ' ' + s[1] + ' A ' + r + ' ' + r + ' 0 ' + vLarge + ' 1 ' + v[0] + ' ' + v[1] + '" stroke="' + color + '" stroke-width="8" fill="none" stroke-linecap="round" style="filter:drop-shadow(0 0 4px ' + color + ');"/>'
            : '';
        var ticks = [0, 25, 50, 75, 100].map(function(pct) {
            var td = startDeg + sweepDeg * pct / 100, tr = td * Math.PI / 180;
            var ri = 37, ro = 44;
            return '<line x1="' + (cx+ri*Math.cos(tr)).toFixed(1) + '" y1="' + (cy+ri*Math.sin(tr)).toFixed(1) +
                         '" x2="' + (cx+ro*Math.cos(tr)).toFixed(1) + '" y2="' + (cy+ro*Math.sin(tr)).toFixed(1) +
                         '" stroke="rgba(255,255,255,0.18)" stroke-width="1.5" stroke-linecap="round"/>';
        }).join('');
        var dot = fraction > 0.01
            ? '<circle cx="' + v[0] + '" cy="' + v[1] + '" r="4.5" fill="' + color + '" style="filter:drop-shadow(0 0 5px ' + color + ');"/>'
            : '';
        return '<svg viewBox="0 0 120 115" style="width:100%;display:block;">' + track + arc + ticks + dot + '</svg>';
    }

    // ── Unified cockpit renderer ──────────────────────────────────────────────────
    function _dashRenderCockpit() {
        var container = document.getElementById('dash-cockpit');
        if (!container) return;

        var result = window._hsLastResult;
        var prev   = window._hsPrevScore;
        var nw     = window._toolSummaries && window._toolSummaries.netWorth;
        var goals  = window._savedGoals || [];
        var name   = _dashGetUserName();

        // ── Health Score gauge ────────────────────────────────────────────────────
        var hsColor    = result ? (result.arcColor || '#10b981') : 'rgba(255,255,255,0.15)';
        var hsFraction = result ? result.score / 100 : 0;
        var hsSvg      = _cockpitGaugeSvg(hsFraction, hsColor);
        var hsInner = result
            ? '<div style="font-size:20px;font-weight:900;color:#fff;line-height:1;letter-spacing:-1px;">' + result.score + '</div>' +
              '<div style="font-size:8px;color:rgba(255,255,255,0.35);font-weight:700;">/100</div>' +
              '<div style="font-size:10px;font-weight:800;color:' + hsColor + ';margin-top:3px;">' + result.grade + '</div>'
            : '<div style="font-size:10px;color:rgba(255,255,255,0.25);line-height:1.4;text-align:center;">Not<br>set</div>';
        var hsGauge =
            '<div onclick="switchMode(\'healthscore\')" style="display:flex;flex-direction:column;align-items:center;background:rgba(0,0,0,0.35);border:1px solid rgba(255,255,255,0.07);border-radius:14px;padding:10px 6px 8px;cursor:pointer;transition:border-color .2s;" onmouseover="this.style.borderColor=\'rgba(245,200,66,0.35)\'" onmouseout="this.style.borderColor=\'rgba(255,255,255,0.07)\'">' +
                '<div style="font-size:8px;font-weight:800;color:rgba(255,255,255,0.3);text-transform:uppercase;letter-spacing:.1em;margin-bottom:4px;">Health</div>' +
                '<div style="position:relative;width:100%;">' + hsSvg +
                    '<div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;padding-bottom:12px;">' + hsInner + '</div>' +
                '</div>' +
            '</div>';

        // ── Net Worth gauge ───────────────────────────────────────────────────────
        var hasNwData = nw && (nw.totalAssets || nw.totalLiab);
        var nwColor, nwFraction, nwInner;
        if (hasNwData) {
            var assets = nw.totalAssets || 0, liabs = nw.totalLiab || 0, nwVal = nw.netWorth || 0;
            var dRatio = assets > 0 ? liabs / assets : 0;
            nwFraction = Math.max(0, 1 - dRatio);
            nwColor    = dRatio <= 0.3 ? '#10b981' : dRatio <= 0.55 ? '#f59e0b' : '#ef4444';
            nwInner =
                '<div style="font-size:13px;font-weight:900;color:' + (nwVal >= 0 ? '#10b981' : '#ef4444') + ';line-height:1;letter-spacing:-0.5px;">' + _dashFmtNW(nwVal) + '</div>' +
                '<div style="font-size:8px;color:rgba(255,255,255,0.3);font-weight:700;margin-top:2px;">net worth</div>' +
                '<div style="font-size:9px;font-weight:800;color:' + nwColor + ';margin-top:3px;">' + Math.round(nwFraction * 100) + '% equity</div>';
        } else {
            nwColor = 'rgba(255,255,255,0.15)'; nwFraction = 0;
            nwInner = '<div style="font-size:10px;color:rgba(255,255,255,0.25);line-height:1.4;text-align:center;">Add<br>assets</div>';
        }
        var nwGauge =
            '<div onclick="switchMode(\'networth\')" style="display:flex;flex-direction:column;align-items:center;background:rgba(0,0,0,0.35);border:1px solid rgba(255,255,255,0.07);border-radius:14px;padding:10px 6px 8px;cursor:pointer;transition:border-color .2s;" onmouseover="this.style.borderColor=\'rgba(245,200,66,0.35)\'" onmouseout="this.style.borderColor=\'rgba(255,255,255,0.07)\'">' +
                '<div style="font-size:8px;font-weight:800;color:rgba(255,255,255,0.3);text-transform:uppercase;letter-spacing:.1em;margin-bottom:4px;">Net Worth</div>' +
                '<div style="position:relative;width:100%;">' + _cockpitGaugeSvg(nwFraction, nwColor) +
                    '<div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;padding-bottom:12px;">' + nwInner + '</div>' +
                '</div>' +
            '</div>';

        // ── Center HUD ────────────────────────────────────────────────────────────
        var greet = name ? 'Hi ' + name + '! 👋' : 'Welcome! 👋';
        var delta = (prev && result && prev.score !== result.score) ? (result.score - prev.score) : null;
        var deltaHtml = '';
        if (delta !== null) {
            var dColor = delta > 0 ? '#22c55e' : '#ef4444';
            deltaHtml = ' <span style="font-size:9px;font-weight:800;color:' + dColor + ';background:' + dColor + '18;padding:1px 5px;border-radius:5px;">' + (delta > 0 ? '↑+' : '↓') + Math.abs(delta) + '</span>';
        }
        var topAction = result && (result.topActions || []).filter(function(a) {
            return !(hasNwData && a.name === 'Net Worth Readiness');
        })[0];
        var centerContent;
        if (result) {
            centerContent =
                '<div style="font-size:11px;font-weight:900;color:rgba(245,200,66,0.85);margin-bottom:6px;">' + greet + '</div>' +
                '<div style="font-size:20px;line-height:1;">' + result.emoji + '</div>' +
                '<div style="font-size:12px;font-weight:900;color:#fff;margin-top:3px;line-height:1.2;">' + result.grade + deltaHtml + '</div>' +
                '<div style="font-size:9px;color:rgba(255,255,255,0.3);margin-top:2px;margin-bottom:8px;">Financial Health</div>' +
                (topAction
                    ? '<button onclick="switchMode(\'' + topAction.mode + '\')" style="width:100%;padding:7px 4px;border-radius:9px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);cursor:pointer;font-size:10px;font-weight:700;color:rgba(255,255,255,0.75);transition:all .15s;" onmouseover="this.style.background=\'rgba(255,255,255,0.12)\'" onmouseout="this.style.background=\'rgba(255,255,255,0.06)\'">' +
                      topAction.icon + ' ' + _dashActionLabel(topAction.name) + '</button>'
                    : '') +
                '<button onclick="switchMode(\'healthscore\')" style="margin-top:5px;width:100%;padding:6px 4px;border-radius:9px;background:rgba(245,200,66,0.09);border:1px solid rgba(245,200,66,0.22);cursor:pointer;font-size:10px;font-weight:700;color:rgba(245,200,66,0.75);transition:all .15s;" onmouseover="this.style.background=\'rgba(245,200,66,0.16)\'" onmouseout="this.style.background=\'rgba(245,200,66,0.09)\'">↺ Update Score</button>';
        } else {
            centerContent =
                '<div style="font-size:11px;font-weight:900;color:rgba(245,200,66,0.85);margin-bottom:8px;">' + greet + '</div>' +
                '<div style="font-size:10px;color:rgba(255,255,255,0.35);margin-bottom:10px;line-height:1.6;">Complete Indian<br>wealth toolkit</div>' +
                '<button onclick="switchMode(\'healthscore\')" style="width:100%;padding:9px 4px;border-radius:9px;background:rgba(225,29,72,0.15);border:1.5px solid rgba(225,29,72,0.35);cursor:pointer;font-size:11px;font-weight:800;color:#fff;transition:all .15s;" onmouseover="this.style.background=\'rgba(225,29,72,0.25)\'" onmouseout="this.style.background=\'rgba(225,29,72,0.15)\'">💗 Get Score →</button>';
        }
        var centerPanel =
            '<div style="background:rgba(0,0,0,0.22);border:1px solid rgba(255,255,255,0.06);border-radius:14px;padding:12px 10px;text-align:center;display:flex;flex-direction:column;justify-content:center;">' +
                centerContent +
            '</div>';

        // ── Goals strip ───────────────────────────────────────────────────────────
        var goalsHtml;
        if (goals.length > 0) {
            var goalRows = goals.slice(0, 3).map(function(g) {
                var pct = Math.min(100, Math.round(((g.savedAmt||0)/(g.targetAmt||1))*100));
                var bc  = pct >= 75 ? '#10b981' : pct >= 40 ? '#6366f1' : '#f59e0b';
                return '<div style="margin-bottom:7px;">' +
                    '<div style="display:flex;justify-content:space-between;font-size:10px;margin-bottom:3px;">' +
                        '<span style="font-weight:700;color:rgba(255,255,255,0.6);">' + g.emoji + ' ' + g.label + '</span>' +
                        '<span style="font-weight:800;color:rgba(255,255,255,0.4);">' + pct + '%</span>' +
                    '</div>' +
                    '<div style="height:4px;border-radius:99px;background:rgba(255,255,255,0.07);overflow:hidden;">' +
                        '<div style="height:4px;border-radius:99px;background:' + bc + ';width:' + pct + '%;transition:width .5s;"></div>' +
                    '</div>' +
                '</div>';
            }).join('');
            goalsHtml =
                '<div style="margin-top:10px;padding:10px 12px;background:rgba(0,0,0,0.22);border:1px solid rgba(255,255,255,0.06);border-radius:12px;">' +
                    '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">' +
                        '<span style="font-size:8px;font-weight:800;color:rgba(255,255,255,0.3);text-transform:uppercase;letter-spacing:.1em;">🎯 Goals</span>' +
                        '<button onclick="switchMode(\'goaltracker\')" style="font-size:10px;font-weight:700;color:rgba(245,200,66,0.6);background:none;border:none;cursor:pointer;" onmouseover="this.style.color=\'rgba(245,200,66,0.9)\'" onmouseout="this.style.color=\'rgba(245,200,66,0.6)\'">Track all →</button>' +
                    '</div>' +
                    goalRows +
                '</div>';
        } else {
            goalsHtml =
                '<button onclick="switchMode(\'goal\')" style="margin-top:10px;display:flex;align-items:center;gap:10px;width:100%;padding:9px 12px;border-radius:12px;background:rgba(0,0,0,0.2);border:1px solid rgba(255,255,255,0.06);cursor:pointer;transition:all .15s;" onmouseover="this.style.background=\'rgba(255,255,255,0.05)\'" onmouseout="this.style.background=\'rgba(0,0,0,0.2)\'">' +
                    '<span style="font-size:18px;">🎯</span>' +
                    '<div style="flex:1;">' +
                        '<div style="font-size:11px;font-weight:700;color:rgba(255,255,255,0.45);">Set your first financial goal</div>' +
                        '<div style="font-size:9px;color:rgba(255,255,255,0.22);">Education · Home · Retirement · Marriage</div>' +
                    '</div>' +
                    '<span style="color:rgba(255,255,255,0.2);font-size:12px;">→</span>' +
                '</button>';
        }

        // ── Assemble ──────────────────────────────────────────────────────────────
        container.innerHTML =
            '<div style="padding:14px 12px 12px;">' +
                '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">' +
                    '<span style="font-size:8px;font-weight:800;color:rgba(245,200,66,0.45);text-transform:uppercase;letter-spacing:.15em;">⬡ Financial Cockpit</span>' +
                    '<span style="width:7px;height:7px;border-radius:50%;background:#10b981;display:inline-block;box-shadow:0 0 7px #10b981;"></span>' +
                '</div>' +
                '<div style="display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.25fr) minmax(0,1fr);gap:8px;align-items:stretch;">' +
                    hsGauge + centerPanel + nwGauge +
                '</div>' +
                goalsHtml +
            '</div>';
    }

    window._dashUpdateScoreWidget = function() {
        if (window._currentMode === 'dashboard') _dashRenderCockpit();
    };

    function _dashFmtNW(n) {
        var a = Math.abs(n || 0), s = n < 0 ? '-' : '';
        if (a >= 1e7) return s + '₹' + (a/1e7).toFixed(2) + ' Cr';
        if (a >= 1e5) return s + '₹' + (a/1e5).toFixed(1) + ' L';
        return s + '₹' + Math.round(a).toLocaleString('en-IN');
    }

    window._dashUpdateNetWorthWidget = function() {
        if (window._currentMode === 'dashboard') _dashRenderCockpit();
    };

    window._dashUpdateGoalsWidget = function () {
        if (window._currentMode === 'dashboard') _dashRenderCockpit();
    };

        if (!result) {
            // No score yet — show greeting + CTA
            container.innerHTML =
                '<div class="rounded-2xl px-5 py-4 text-white shine-header" style="background:linear-gradient(135deg,#0c2340 0%,#1a4a7a 45%,#0e5c3a 100%);border:1.5px solid rgba(245,200,66,0.35);box-shadow:0 4px 24px rgba(0,0,0,0.3);">' +
                    '<div style="margin-bottom:12px;">' +
                        '<h2 style="font-size:16px;font-weight:900;color:#fff;">' + greetHtml + '🌟 What would you like to do today?</h2>' +
                        '<p style="font-size:11px;color:rgba(147,197,253,0.85);margin-top:3px;">Your complete Indian wealth planning toolkit</p>' +
                    '</div>' +
                    '<button onclick="switchMode(\'healthscore\')" style="display:flex;align-items:center;gap:12px;width:100%;padding:12px 14px;border-radius:12px;background:rgba(225,29,72,0.12);border:1.5px solid rgba(225,29,72,0.35);cursor:pointer;text-align:left;transition:all .15s;" onmouseover="this.style.background=\'rgba(225,29,72,0.22)\'" onmouseout="this.style.background=\'rgba(225,29,72,0.12)\'">' +
                        '<span style="font-size:24px;flex-shrink:0;">💗</span>' +
                        '<div style="flex:1;">' +
                            '<div style="font-size:13px;font-weight:900;color:#fff;">Know Your Financial Health Score</div>' +
                            '<div style="font-size:11px;color:rgba(147,197,253,0.8);margin-top:2px;">2 min · See where you stand · Get your personal action plan</div>' +
                        '</div>' +
                        '<span style="color:rgba(255,255,255,0.4);font-size:13px;flex-shrink:0;">→</span>' +
                    '</button>' +
                '</div>';
            return;
        }

        // Score exists — show score card + delta + top actions
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
        var actionsHtml = '';
        var visibleActions = (result.topActions || []).filter(function(a) {
            return !(_hasNwData && a.name === 'Net Worth Readiness');
        });
        if (visibleActions.length > 0) {
            actionsHtml =
                '<div style="margin-top:12px;padding-top:12px;border-top:1px solid rgba(255,255,255,0.08);">' +
                    '<div style="font-size:9px;font-weight:800;color:rgba(255,255,255,0.4);text-transform:uppercase;letter-spacing:.07em;margin-bottom:7px;">Your Next Actions</div>' +
                    '<div style="display:flex;flex-direction:column;gap:5px;">';
            visibleActions.forEach(function(a) {
                actionsHtml +=
                    '<button onclick="switchMode(\'' + a.mode + '\')" ' +
                    'style="display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:10px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.09);cursor:pointer;text-align:left;transition:all .15s;width:100%;" ' +
                    'onmouseover="this.style.background=\'rgba(255,255,255,0.11)\'" onmouseout="this.style.background=\'rgba(255,255,255,0.05)\'">' +
                        '<span style="font-size:16px;flex-shrink:0;">' + a.icon + '</span>' +
                        '<span style="font-size:12px;font-weight:700;color:rgba(255,255,255,0.85);flex:1;text-align:left;">' + _dashActionLabel(a.name) + '</span>' +
                        '<span style="font-size:11px;color:rgba(255,255,255,0.3);flex-shrink:0;">Open →</span>' +
                    '</button>';
            });
            actionsHtml += '</div></div>';
        }

        container.innerHTML =
            '<div class="rounded-2xl px-5 py-4 text-white shine-header" style="background:linear-gradient(135deg,#0c2340 0%,#1a4a7a 45%,#0e5c3a 100%);border:1.5px solid rgba(245,200,66,0.35);box-shadow:0 4px 24px rgba(0,0,0,0.3);">' +
                '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">' +
                    '<h2 style="font-size:15px;font-weight:900;color:#fff;">' + greetHtml + '🌟 Financial Health</h2>' +
                    '<button onclick="switchMode(\'healthscore\')" style="font-size:10px;font-weight:700;color:rgba(245,200,66,0.8);background:rgba(245,200,66,0.08);border:1px solid rgba(245,200,66,0.25);padding:4px 10px;border-radius:8px;cursor:pointer;white-space:nowrap;" onmouseover="this.style.background=\'rgba(245,200,66,0.15)\'" onmouseout="this.style.background=\'rgba(245,200,66,0.08)\'">Update Score</button>' +
                '</div>' +
                '<div style="display:flex;align-items:center;gap:14px;">' +
                    '<div style="position:relative;flex-shrink:0;">' +
                        '<svg viewBox="0 0 72 72" style="width:66px;height:66px;transform:rotate(-90deg);">' +
                            '<circle cx="36" cy="36" r="28" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="7"/>' +
                            '<circle cx="36" cy="36" r="28" fill="none" stroke="' + arcClr + '" stroke-width="7" stroke-linecap="round" stroke-dasharray="' + c.toFixed(1) + '" stroke-dashoffset="' + off + '" style="transition:stroke-dashoffset 1s ease;"/>' +
                        '</svg>' +
                        '<div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;">' +
                            '<span style="font-size:18px;font-weight:900;color:#fff;line-height:1;">' + result.score + '</span>' +
                            '<span style="font-size:8px;color:rgba(255,255,255,0.35);font-weight:700;">/100</span>' +
                        '</div>' +
                    '</div>' +
                    '<div style="flex:1;min-width:0;">' +
                        '<div style="font-size:18px;line-height:1;">' + result.emoji + '</div>' +
                        '<div style="font-size:14px;font-weight:900;color:#fff;margin-top:3px;line-height:1.2;">' + result.grade + deltaHtml + '</div>' +
                    '</div>' +
                '</div>' +
                actionsHtml +
            '</div>';
    }

    window._dashUpdateScoreWidget = function() {
        if (window._currentMode === 'dashboard') _dashRenderScoreWidget();
    };

    function _dashFmtNW(n) {
        var a = Math.abs(n), s = n < 0 ? '-' : '';
        if (a >= 1e7) return s + '₹' + (a/1e7).toFixed(2) + ' Cr';
        if (a >= 1e5) return s + '₹' + (a/1e5).toFixed(2) + ' L';
        return s + '₹' + Math.round(a).toLocaleString('en-IN');
    }

    function _dashRenderNetWorthWidget() {
        var container = document.getElementById('dash-nw-widget');
        if (!container) return;
        var nw = window._toolSummaries && window._toolSummaries.netWorth;
        var hasData = nw && (nw.totalAssets || nw.totalLiab);

        if (!hasData) {
            container.innerHTML =
                '<button onclick="switchMode(\'networth\')" ' +
                'style="display:flex;align-items:center;gap:12px;width:100%;padding:10px 14px;border-radius:14px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);cursor:pointer;text-align:left;transition:all .15s;" ' +
                'onmouseover="this.style.background=\'rgba(255,255,255,0.08)\'" onmouseout="this.style.background=\'rgba(255,255,255,0.04)\'">' +
                    '<span style="font-size:20px;flex-shrink:0;">⚖️</span>' +
                    '<div style="flex:1;">' +
                        '<div style="font-size:12px;font-weight:800;color:rgba(255,255,255,0.6);">Track your Net Worth</div>' +
                        '<div style="font-size:10px;color:rgba(255,255,255,0.3);margin-top:1px;">Add assets &amp; liabilities to see your complete financial picture</div>' +
                    '</div>' +
                    '<span style="font-size:11px;color:rgba(255,255,255,0.25);">→</span>' +
                '</button>';
            return;
        }

        var nwVal  = nw.netWorth    || 0;
        var assets = nw.totalAssets || 0;
        var liabs  = nw.totalLiab   || 0;
        var nwColor = nwVal >= 0 ? '#10b981' : '#ef4444';
        var dtar = assets > 0 ? (liabs / assets * 100).toFixed(0) : 0;
        var dtarColor = dtar <= 30 ? '#10b981' : dtar <= 50 ? '#f59e0b' : '#ef4444';

        container.innerHTML =
            '<div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.09);border-radius:14px;padding:12px 14px;">' +
                '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">' +
                    '<span style="font-size:10px;font-weight:800;color:rgba(255,255,255,0.4);text-transform:uppercase;letter-spacing:.07em;">⚖️ Net Worth</span>' +
                    '<button onclick="switchMode(\'networth\')" style="font-size:10px;font-weight:700;color:rgba(245,200,66,0.6);background:none;border:none;cursor:pointer;padding:0;" ' +
                    'onmouseover="this.style.color=\'rgba(245,200,66,0.9)\'" onmouseout="this.style.color=\'rgba(245,200,66,0.6)\'">Update →</button>' +
                '</div>' +
                '<div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;">' +
                    '<div>' +
                        '<div style="font-size:24px;font-weight:900;color:' + nwColor + ';line-height:1;">' + _dashFmtNW(nwVal) + '</div>' +
                        '<div style="font-size:9px;color:rgba(255,255,255,0.3);margin-top:2px;font-weight:600;">Total Net Worth</div>' +
                    '</div>' +
                    '<div style="display:flex;gap:14px;">' +
                        '<div style="text-align:right;">' +
                            '<div style="font-size:12px;font-weight:800;color:rgba(255,255,255,0.65);">' + _dashFmtNW(assets) + '</div>' +
                            '<div style="font-size:9px;color:rgba(255,255,255,0.3);font-weight:600;">Assets</div>' +
                        '</div>' +
                        '<div style="width:1px;background:rgba(255,255,255,0.07);"></div>' +
                        '<div style="text-align:right;">' +
                            '<div style="font-size:12px;font-weight:800;color:rgba(255,255,255,0.65);">' + _dashFmtNW(liabs) + '</div>' +
                            '<div style="font-size:9px;color:rgba(255,255,255,0.3);font-weight:600;">Liabilities</div>' +
                        '</div>' +
                        (dtar > 0 ? '<div style="width:1px;background:rgba(255,255,255,0.07);"></div>' +
                        '<div style="text-align:right;">' +
                            '<div style="font-size:12px;font-weight:800;color:' + dtarColor + ';">' + dtar + '%</div>' +
                            '<div style="font-size:9px;color:rgba(255,255,255,0.3);font-weight:600;">Debt Ratio</div>' +
                        '</div>' : '') +
                    '</div>' +
                '</div>' +
            '</div>';
    }

    window._dashUpdateNetWorthWidget = function() {
        if (window._currentMode === 'dashboard') _dashRenderNetWorthWidget();
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

        if (goals.length === 0) {
            container.innerHTML =
                '<button onclick="switchMode(\'goal\')" ' +
                'style="display:flex;align-items:center;gap:12px;width:100%;padding:10px 14px;border-radius:14px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);cursor:pointer;text-align:left;transition:all .15s;" ' +
                'onmouseover="this.style.background=\'rgba(255,255,255,0.08)\'" onmouseout="this.style.background=\'rgba(255,255,255,0.04)\'">' +
                    '<span style="font-size:20px;flex-shrink:0;">🎯</span>' +
                    '<div style="flex:1;">' +
                        '<div style="font-size:12px;font-weight:800;color:rgba(255,255,255,0.6);">Set your first financial goal</div>' +
                        '<div style="font-size:10px;color:rgba(255,255,255,0.3);margin-top:1px;">Education · Home · Retirement · Marriage and more</div>' +
                    '</div>' +
                    '<span style="font-size:11px;color:rgba(255,255,255,0.25);">→</span>' +
                '</button>';
            return;
        }

        var shown = goals.slice(0, 3);
        var rows = shown.map(function (g) {
            var pct = Math.min(100, Math.round(((g.savedAmt || 0) / (g.targetAmt || 1)) * 100));
            var barColor = pct >= 75 ? '#10b981' : pct >= 40 ? '#6366f1' : '#f59e0b';
            return '<div style="margin-bottom:10px;">' +
                '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;">' +
                    '<span style="font-size:11px;font-weight:700;color:rgba(255,255,255,0.7);">' + g.emoji + ' ' + g.label + '</span>' +
                    '<span style="font-size:10px;font-weight:800;color:rgba(255,255,255,0.5);">' +
                        _dashFmtGoal(g.savedAmt || 0) + ' / ' + _dashFmtGoal(g.targetAmt) + ' &nbsp;' + pct + '%' +
                    '</span>' +
                '</div>' +
                '<div style="height:5px;border-radius:99px;background:rgba(255,255,255,0.08);overflow:hidden;">' +
                    '<div style="height:5px;border-radius:99px;background:' + barColor + ';width:' + pct + '%;transition:width .5s ease;"></div>' +
                '</div>' +
            '</div>';
        }).join('');

        var moreLabel = goals.length > 3 ? ' (' + goals.length + ' goals)' : '';

        container.innerHTML =
            '<div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.09);border-radius:14px;padding:12px 14px;">' +
                '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">' +
                    '<span style="font-size:10px;font-weight:800;color:rgba(255,255,255,0.4);text-transform:uppercase;letter-spacing:.07em;">🎯 My Goals' + moreLabel + '</span>' +
                    '<button onclick="switchMode(\'goaltracker\')" style="font-size:10px;font-weight:700;color:rgba(245,200,66,0.6);background:none;border:none;cursor:pointer;padding:0;" ' +
                    'onmouseover="this.style.color=\'rgba(245,200,66,0.9)\'" onmouseout="this.style.color=\'rgba(245,200,66,0.6)\'">Track →</button>' +
                '</div>' +
                rows +
            '</div>';
    }

    window._dashUpdateGoalsWidget = function () {
        if (window._currentMode === 'dashboard') _dashRenderGoalsWidget();
    };

    // Fallback timer — only fires if auth state never resolves (e.g. offline).
    // Normal init is triggered directly from onAuthStateChanged in auth.js.
    window.addEventListener('DOMContentLoaded', function() {
        setTimeout(function() {
            if (window._isExpert) return;          // Expert portal already active
            if (window._authResolved)  return;      // auth.js already called switchMode
            if (typeof switchMode === 'function') switchMode('dashboard');
        }, 2000);
    });
