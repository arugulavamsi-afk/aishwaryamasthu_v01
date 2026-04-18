/* ══════════════════════════════════════════════════════════
   FINANCIAL ROADMAP — Guided onboarding for new users
══════════════════════════════════════════════════════════ */
(function () {

    // ── Profile definitions ────────────────────────────────────
    var _RM_PROFILES = {
        earlysaver: {
            name: 'Early Saver', emoji: '🌱',
            tagline: 'Build your financial foundation from scratch',
            color: '#059669', border: '#a7f3d0',
            steps: [
                { mode:'healthscore',  icon:'💗', label:'Financial Health Score' },
                { mode:'emergency',    icon:'🛡️', label:'Emergency Fund'         },
                { mode:'goal',         icon:'🎯', label:'Goal Planner'           },
                { mode:'stepupsip',    icon:'📈', label:'Step-Up SIP'            }
            ]
        },
        taxoptimizer: {
            name: 'Tax Optimizer', emoji: '🧾',
            tagline: 'Stop overpaying — right regime, salary & deductions',
            color: '#b45309', border: '#fde68a',
            steps: [
                { mode:'taxguide',     icon:'🧾', label:'Tax Guide'              },
                { mode:'ctcoptimizer', icon:'💰', label:'CTC & Salary Optimizer' },
                { mode:'hracalc',      icon:'🏠', label:'HRA Calculator'         },
                { mode:'cgcalc',       icon:'💹', label:'Capital Gains Calc'     }
            ]
        },
        homebuyer: {
            name: 'Home Buyer', emoji: '🏠',
            tagline: 'EMI planning, rent vs buy & home loan tax benefits',
            color: '#0891b2', border: '#a5f3fc',
            steps: [
                { mode:'homeloan',  icon:'🏠', label:'Home Loan Advisor' },
                { mode:'taxguide',  icon:'🧾', label:'Tax Guide'         },
                { mode:'goal',      icon:'🎯', label:'Goal Planner'      },
                { mode:'finplan',   icon:'📋', label:'Financial Plan'    }
            ]
        },
        familyplanner: {
            name: 'Family Planner', emoji: '👨‍👩‍👧',
            tagline: 'Protect and grow your family\'s financial future',
            color: '#7c3aed', border: '#ddd6fe',
            steps: [
                { mode:'insure',      icon:'🛡️', label:'Insurance Adequacy'     },
                { mode:'emergency',   icon:'🛡️', label:'Emergency Fund'         },
                { mode:'healthscore', icon:'💗', label:'Financial Health Score' },
                { mode:'finplan',     icon:'📋', label:'Financial Plan'         }
            ]
        },
        retirementplanner: {
            name: 'Retirement Planner', emoji: '🏖️',
            tagline: 'Know your number and build a corpus that lasts',
            color: '#6366f1', border: '#c7d2fe',
            steps: [
                { mode:'retirementhub', icon:'🏖️', label:'Retirement Hub'     },
                { mode:'ppfnps',        icon:'🏛️', label:'PPF & NPS Calc'    },
                { mode:'networth',      icon:'⚖️', label:'Net Worth Tracker'  },
                { mode:'finplan',       icon:'📋', label:'Financial Plan'     }
            ]
        }
    };

    // ── State (persisted to Firestore) ─────────────────────────
    window._rmState = window._rmState || {
        profile:   null,   // profile key string
        visited:   [],     // mode keys the user has opened
        dismissed: false,  // user closed the card entirely
        collapsed: false   // user minimised to chip
    };

    var _rmTempAge = null; // transient — only needed during Q1→Q2 flow

    // ── Goal → Profile mapping ─────────────────────────────────
    function _rmGoalToProfile(goal, age) {
        if (goal === 'tax')    return 'taxoptimizer';
        if (goal === 'home')   return 'homebuyer';
        if (goal === 'family') return 'familyplanner';
        if (goal === 'retire') return 'retirementplanner';
        // 'save': skew older users toward retirement
        if (age === '40s' || age === '50s+') return 'retirementplanner';
        return 'earlysaver';
    }

    // ── Public: mark a step visited (called from switchMode) ───
    function roadmapMarkVisited(mode) {
        var s = window._rmState;
        if (!s.profile || s.dismissed) return;
        var profile = _RM_PROFILES[s.profile];
        if (!profile) return;
        var inRoadmap = profile.steps.some(function (st) { return st.mode === mode; });
        if (!inRoadmap) return;
        if (s.visited.indexOf(mode) === -1) {
            s.visited.push(mode);
            _rmSave();
        }
    }
    window.roadmapMarkVisited = roadmapMarkVisited;

    // ── Save ───────────────────────────────────────────────────
    function _rmSave() {
        if (typeof saveUserData === 'function') saveUserData();
    }

    // ── Main entry: render into #roadmap-card ──────────────────
    function initRoadmap() {
        var container = document.getElementById('roadmap-card');
        if (!container) return;
        var s = window._rmState;
        if (s.dismissed) {
            container.innerHTML =
                '<div style="text-align:right;margin-bottom:6px;">' +
                    '<button onclick="window._rmReset()" ' +
                    'style="font-size:10px;font-weight:700;color:rgba(245,200,66,0.7);background:rgba(245,200,66,0.08);border:1px solid rgba(245,200,66,0.2);border-radius:8px;padding:4px 10px;cursor:pointer;" ' +
                    'onmouseover="this.style.color=\'#f5c842\';this.style.background=\'rgba(245,200,66,0.15)\';" ' +
                    'onmouseout="this.style.color=\'rgba(245,200,66,0.7)\';this.style.background=\'rgba(245,200,66,0.08)\';">🗺️ Restart Journey</button>' +
                '</div>';
            return;
        }
        if (!s.profile)  { _rmRenderSetup(container); }
        else             { _rmRenderMap(container);   }
    }
    window.initRoadmap = initRoadmap;

    // ── Setup card: two-question flow ──────────────────────────
    function _rmRenderSetup(container) {
        container.innerHTML =
            '<div class="shine-header" style="background:linear-gradient(130deg,#e8d5a3 0%,#f5c842 35%,#e8a44a 60%,#c97f3a 80%,#e8d5a3 100%);border:1.5px solid rgba(245,200,66,0.60);border-radius:18px;padding:14px 16px;margin-bottom:14px;box-shadow:0 4px 16px rgba(245,200,66,0.18);">' +
                '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px;margin-bottom:12px;">' +
                    '<div>' +
                        '<div style="font-size:13px;font-weight:900;color:#162a10;">🗺️ Build Your Personal Financial Roadmap</div>' +
                        '<div style="font-size:10px;color:rgba(22,42,16,0.65);margin-top:2px;">2 quick questions · takes 10 seconds · guides you to the right tools</div>' +
                    '</div>' +
                    '<button onclick="window._rmDismiss()" style="font-size:11px;color:rgba(22,42,16,0.45);background:rgba(255,255,255,0.4);border:1px solid rgba(22,42,16,0.15);cursor:pointer;flex-shrink:0;padding:2px 8px;border-radius:6px;font-weight:700;" onmouseover="this.style.background=\'rgba(255,255,255,0.7)\';" onmouseout="this.style.background=\'rgba(255,255,255,0.4)\';">✕ Skip</button>' +
                '</div>' +
                '<div id="rm-q-body">' + _rmQ1Html() + '</div>' +
            '</div>';
    }

    function _rmQ1Html() {
        var ages = ['20s', '30s', '40s', '50s+'];
        var btns = ages.map(function (a) {
            return _rmBtn(a, 'window._rmSelectAge(\'' + a + '\')');
        }).join('');
        return '<div style="font-size:10px;font-weight:700;color:rgba(22,42,16,0.6);text-transform:uppercase;letter-spacing:.04em;margin-bottom:7px;">How old are you?</div>' +
               '<div style="display:flex;gap:7px;flex-wrap:wrap;">' + btns + '</div>';
    }

    function _rmQ2Html() {
        var goals = [
            { key:'save',   icon:'🌱', label:'Save & Grow Money'  },
            { key:'tax',    icon:'🧾', label:'Cut My Tax Bill'    },
            { key:'home',   icon:'🏠', label:'Buy a Home'         },
            { key:'family', icon:'👨‍👩‍👧', label:'Protect My Family'  },
            { key:'retire', icon:'🏖️', label:'Plan Retirement'    }
        ];
        var btns = goals.map(function (g) {
            return _rmBtn(g.icon + ' ' + g.label, 'window._rmSelectGoal(\'' + g.key + '\')');
        }).join('');
        return '<div style="font-size:10px;font-weight:700;color:rgba(22,42,16,0.6);text-transform:uppercase;letter-spacing:.04em;margin-bottom:7px;">What\'s your main financial goal right now?</div>' +
               '<div style="display:flex;gap:7px;flex-wrap:wrap;">' + btns + '</div>';
    }

    function _rmBtn(label, onclick) {
        return '<button onclick="' + onclick + '" ' +
            'style="padding:7px 13px;border-radius:10px;font-size:11px;font-weight:700;border:1.5px solid rgba(22,42,16,0.2);background:rgba(255,255,255,0.55);color:#162a10;cursor:pointer;transition:all .15s;" ' +
            'onmouseover="this.style.background=\'rgba(255,255,255,0.9)\';this.style.borderColor=\'rgba(22,42,16,0.5)\';" ' +
            'onmouseout="this.style.background=\'rgba(255,255,255,0.55)\';this.style.borderColor=\'rgba(22,42,16,0.2)\';">' +
            label + '</button>';
    }

    function _rmSelectAge(age) {
        _rmTempAge = age;
        var body = document.getElementById('rm-q-body');
        if (body) body.innerHTML = _rmQ2Html();
    }
    window._rmSelectAge = _rmSelectAge;

    function _rmSelectGoal(goal) {
        var profileKey = _rmGoalToProfile(goal, _rmTempAge || '20s');
        window._rmState.profile   = profileKey;
        window._rmState.visited   = [];
        window._rmState.collapsed = false;
        _rmSave();
        initRoadmap();
    }
    window._rmSelectGoal = _rmSelectGoal;

    // ── Roadmap card ───────────────────────────────────────────
    function _rmRenderMap(container) {
        var s       = window._rmState;
        var profile = _RM_PROFILES[s.profile];
        if (!profile) { container.innerHTML = ''; return; }

        var visited   = s.visited || [];
        var doneCount = profile.steps.filter(function (st) { return visited.indexOf(st.mode) !== -1; }).length;
        var total     = profile.steps.length;
        var pct       = Math.round(doneCount / total * 100);
        var allDone   = doneCount === total;

        // Collapsed chip
        if (s.collapsed) {
            var next = profile.steps.find(function (st) { return visited.indexOf(st.mode) === -1; });
            container.innerHTML =
                '<div class="shine-header" onclick="window._rmToggleCollapse()" ' +
                'style="display:flex;align-items:center;justify-content:space-between;gap:8px;background:linear-gradient(130deg,#e8d5a3 0%,#f5c842 35%,#e8a44a 60%,#c97f3a 80%,#e8d5a3 100%);border:1.5px solid rgba(245,200,66,0.60);border-radius:14px;padding:8px 14px;margin-bottom:12px;cursor:pointer;box-shadow:0 2px 10px rgba(245,200,66,0.15);" ' +
                'onmouseover="this.style.boxShadow=\'0 4px 16px rgba(245,200,66,0.3)\';" onmouseout="this.style.boxShadow=\'0 2px 10px rgba(245,200,66,0.15)\';">' +
                    '<div style="display:flex;align-items:center;gap:8px;min-width:0;">' +
                        '<span style="font-size:16px;flex-shrink:0;">' + profile.emoji + '</span>' +
                        '<div style="min-width:0;">' +
                            '<span style="font-size:11px;font-weight:800;color:#162a10;">' + profile.name + ' Roadmap</span>' +
                            '<span style="font-size:10px;color:rgba(22,42,16,0.55);margin-left:6px;">' + doneCount + '/' + total + ' done</span>' +
                        '</div>' +
                        (next && !allDone ? '<span style="font-size:10px;color:rgba(22,42,16,0.5);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;"> · Next: ' + next.label + '</span>' : '') +
                        (allDone ? '<span style="font-size:10px;color:#162a10;font-weight:700;"> · 🎉 Complete!</span>' : '') +
                    '</div>' +
                    '<span style="font-size:10px;font-weight:700;color:rgba(22,42,16,0.55);flex-shrink:0;">▼ Show</span>' +
                '</div>';
            return;
        }

        // Step tiles
        var stepTiles = profile.steps.map(function (st, idx) {
            var done = visited.indexOf(st.mode) !== -1;
            var tileBg   = done ? 'linear-gradient(135deg,#0c4a24 0%,#0e5c3a 100%)' : 'linear-gradient(135deg,#0c2340 0%,#1a4a7a 100%)';
            var tileBdr  = done ? 'rgba(34,197,94,0.45)' : 'rgba(245,200,66,0.35)';
            var labelClr = done ? '#86efac' : '#e2e8f0';
            return '<div class="shine-btn" onclick="switchMode(\'' + st.mode + '\')" ' +
                'style="flex:1;min-width:80px;display:flex;flex-direction:column;align-items:center;gap:4px;padding:10px 6px;border-radius:13px;cursor:pointer;text-align:center;transition:all .15s;background:' + tileBg + ';border:1.5px solid ' + tileBdr + ';box-shadow:0 2px 8px rgba(0,0,0,0.18);" ' +
                'onmouseover="this.style.transform=\'translateY(-2px)\';this.style.boxShadow=\'0 6px 18px rgba(0,0,0,0.28)\';" ' +
                'onmouseout="this.style.transform=\'\';this.style.boxShadow=\'0 2px 8px rgba(0,0,0,0.18)\';">' +
                    '<div style="position:relative;display:inline-block;">' +
                        '<span style="font-size:20px;">' + st.icon + '</span>' +
                        (done
                            ? '<span style="position:absolute;top:-4px;right:-7px;font-size:12px;">✅</span>'
                            : '<span style="position:absolute;top:-4px;right:-7px;width:16px;height:16px;border-radius:50%;background:#f5c842;color:#162a10;font-size:9px;font-weight:900;display:flex;align-items:center;justify-content:center;line-height:1;">' + (idx + 1) + '</span>'
                        ) +
                    '</div>' +
                    '<div style="font-size:9px;font-weight:700;line-height:1.3;color:' + labelClr + ';">' + st.label + '</div>' +
            '</div>';
        }).join('<div style="flex-shrink:0;color:rgba(22,42,16,0.4);font-size:13px;align-self:center;padding-top:4px;">›</div>');

        container.innerHTML =
            '<div class="shine-header" style="background:linear-gradient(130deg,#e8d5a3 0%,#f5c842 35%,#e8a44a 60%,#c97f3a 80%,#e8d5a3 100%);border:1.5px solid rgba(245,200,66,0.60);border-radius:18px;padding:14px 16px;margin-bottom:14px;box-shadow:0 4px 16px rgba(245,200,66,0.18);">' +
                // Header row
                '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px;margin-bottom:10px;">' +
                    '<div style="display:flex;align-items:center;gap:8px;">' +
                        '<span style="font-size:20px;">' + profile.emoji + '</span>' +
                        '<div>' +
                            '<div style="font-size:12px;font-weight:900;color:#162a10;">' + profile.name + ' Roadmap</div>' +
                            '<div style="font-size:9px;color:rgba(22,42,16,0.6);margin-top:1px;">' + profile.tagline + '</div>' +
                        '</div>' +
                    '</div>' +
                    '<div style="display:flex;gap:4px;align-items:center;flex-shrink:0;">' +
                        '<button onclick="window._rmToggleCollapse()" style="font-size:9px;color:rgba(22,42,16,0.55);background:rgba(255,255,255,0.45);border:1px solid rgba(22,42,16,0.2);cursor:pointer;padding:3px 7px;border-radius:6px;font-weight:700;" onmouseover="this.style.background=\'rgba(255,255,255,0.75)\';" onmouseout="this.style.background=\'rgba(255,255,255,0.45)\';">▲ Hide</button>' +
                        '<button onclick="window._rmDismiss()" style="font-size:9px;color:rgba(22,42,16,0.55);background:rgba(255,255,255,0.45);border:1px solid rgba(22,42,16,0.2);cursor:pointer;padding:3px 7px;border-radius:6px;font-weight:700;" onmouseover="this.style.background=\'rgba(255,255,255,0.75)\';" onmouseout="this.style.background=\'rgba(255,255,255,0.45)\';">✕</button>' +
                    '</div>' +
                '</div>' +
                // Progress bar
                '<div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">' +
                    '<div style="flex:1;background:rgba(22,42,16,0.15);border-radius:6px;height:6px;overflow:hidden;">' +
                        '<div style="height:100%;width:' + pct + '%;background:' + (allDone ? '#22c55e' : '#0c2340') + ';border-radius:6px;transition:width .4s;"></div>' +
                    '</div>' +
                    '<span style="font-size:10px;font-weight:800;color:#162a10;white-space:nowrap;">' +
                        (allDone ? '🎉 Done!' : doneCount + '/' + total + ' complete') +
                    '</span>' +
                '</div>' +
                // Step tiles
                '<div style="display:flex;gap:5px;align-items:stretch;">' + stepTiles + '</div>' +
                // Footer
                '<div style="margin-top:8px;display:flex;align-items:center;justify-content:space-between;">' +
                    (allDone
                        ? '<span style="font-size:9px;color:#162a10;font-weight:700;">🎉 Great work! Explore all 30+ tools in the categories above.</span>'
                        : '<span style="font-size:9px;color:rgba(22,42,16,0.5);">Click any step above to open the tool and mark it done.</span>') +
                    '<button onclick="window._rmReset()" style="font-size:9px;color:rgba(22,42,16,0.5);background:none;border:none;cursor:pointer;padding:0;font-weight:600;" onmouseover="this.style.color=\'#162a10\';" onmouseout="this.style.color=\'rgba(22,42,16,0.5)\';">↺ Change profile</button>' +
                '</div>' +
            '</div>';
    }

    // ── Controls ───────────────────────────────────────────────
    function _rmDismiss() {
        window._rmState.dismissed = true;
        _rmSave();
        var c = document.getElementById('roadmap-card');
        if (c) c.innerHTML = '';
    }
    window._rmDismiss = _rmDismiss;

    function _rmToggleCollapse() {
        window._rmState.collapsed = !window._rmState.collapsed;
        _rmSave();
        initRoadmap();
    }
    window._rmToggleCollapse = _rmToggleCollapse;

    function _rmReset() {
        window._rmState.profile   = null;
        window._rmState.visited   = [];
        window._rmState.collapsed = false;
        window._rmState.dismissed = false;
        _rmTempAge = null;
        _rmSave();
        initRoadmap();
    }
    window._rmReset = _rmReset;

})();
