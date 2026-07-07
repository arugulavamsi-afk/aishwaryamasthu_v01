(function () {
    'use strict';

    // ── i18n helper ─────────────────────────────────────────────────────────

    function _gtT(k, fb) { return (typeof _t === 'function') ? _t(k) : (fb !== undefined ? fb : k); }

    // ── Formatting helpers ───────────────────────────────────────────────────

    function _fmt(n) {
        var a = Math.abs(n || 0);
        if (a >= 1e7) return '₹' + (a / 1e7).toFixed(2) + ' Cr';
        if (a >= 1e5) return '₹' + (a / 1e5).toFixed(1) + ' L';
        return '₹' + Math.round(a).toLocaleString('en-IN');
    }

    function _monthsAgo(isoDate) {
        if (!isoDate) return 0;
        return Math.floor((Date.now() - new Date(isoDate).getTime()) / (1000 * 60 * 60 * 24 * 30.44));
    }

    function _relTime(isoDate) {
        if (!isoDate) return _gtT('gt.rel.never', 'Never');
        var days = Math.floor((Date.now() - new Date(isoDate).getTime()) / (1000 * 60 * 60 * 24));
        if (days === 0) return _gtT('gt.rel.today', 'Today');
        if (days === 1) return _gtT('gt.rel.yesterday', 'Yesterday');
        if (days < 30) return _gtT('gt.rel.daysago', '{n} days ago').replace('{n}', days);
        var mo = Math.floor(days / 30.44);
        return mo === 1
            ? _gtT('gt.rel.1moago', '1 month ago')
            : _gtT('gt.rel.mosago', '{n} months ago').replace('{n}', mo);
    }

    function _fmtDate(isoDate) {
        return new Date(isoDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    }

    // ── On-track status ──────────────────────────────────────────────────────

    function _status(goal) {
        var saved  = goal.savedAmt  || 0;
        var target = goal.targetAmt || 1;
        var pct    = saved / target * 100;

        if (pct >= 100) return { label: _gtT('gt.status.reached', 'Goal reached!'), icon: '🏆', color: '#f59e0b' };

        if (!goal.createdAt) return { label: _gtT('gt.status.notstarted', 'Not started'), icon: '📝', color: '#94a3b8' };

        var monthsTotal   = (goal.years || 1) * 12;
        var monthsElapsed = _monthsAgo(goal.createdAt);

        if (monthsElapsed < 2) return { label: _gtT('gt.status.juststarted', 'Just started'), icon: '🌱', color: '#6366f1' };

        var expectedPct = Math.min(100, monthsElapsed / monthsTotal * 100);
        if (pct >= expectedPct)        return { label: _gtT('gt.status.ontrack', 'On track'),               icon: '✅', color: '#10b981' };
        if (pct >= expectedPct * 0.75) return { label: _gtT('gt.status.slightlybehind', 'Slightly behind'), icon: '⚠️', color: '#f59e0b' };
        return { label: _gtT('gt.status.behind', 'Behind'), icon: '🔴', color: '#ef4444' };
    }

    // ── Card rendering ───────────────────────────────────────────────────────

    function _renderCard(g, i) {
        var saved  = g.savedAmt  || 0;
        var target = g.targetAmt || 1;
        var pct    = Math.min(100, Math.round(saved / target * 100));
        var remaining = Math.max(0, target - saved);
        var st = _status(g);

        var barColor = pct >= 75 ? '#10b981' : pct >= 40 ? '#6366f1' : '#f59e0b';

        var lastUpdatedLabel = (g.checkIns && g.checkIns.length > 0)
            ? _gtT('gt.card.updated', 'Updated {rel}').replace('{rel}', _relTime(g.checkIns[g.checkIns.length - 1].ts))
            : _gtT('gt.card.noupdates', 'No updates yet');

        var targetLabel = g.years === 1
            ? _gtT('gt.card.target', 'Target {amt} · {n} yr').replace('{amt}', _fmt(target)).replace('{n}', g.years)
            : _gtT('gt.card.targets', 'Target {amt} · {n} yrs').replace('{amt}', _fmt(target)).replace('{n}', g.years);

        // Recent check-in history (last 3, newest first)
        var histHtml = '';
        if (g.checkIns && g.checkIns.length > 0) {
            var recent = g.checkIns.slice(-3).reverse();
            histHtml =
                '<div style="margin-top:12px;padding-top:12px;border-top:1px solid #f1f5f9;">' +
                    '<div style="font-size:10px;font-weight:800;color:#94a3b8;text-transform:uppercase;letter-spacing:.06em;margin-bottom:6px;">' + _gtT('gt.card.checkins', 'Recent Check-ins') + '</div>' +
                    recent.map(function (c) {
                        return '<div style="display:flex;align-items:center;justify-content:space-between;padding:3px 0;font-size:11px;">' +
                            '<span style="color:#94a3b8;">' + _fmtDate(c.ts) + '</span>' +
                            (c.note ? '<span style="color:#cbd5e1;font-style:italic;flex:1;margin:0 8px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + window.esc(c.note) + '</span>' : '<span style="flex:1;"></span>') +
                            '<span style="font-weight:800;color:#334155;">' + _fmt(c.amt) + '</span>' +
                        '</div>';
                    }).join('') +
                '</div>';
        }

        return '<div class="bg-white rounded-2xl shadow-sm" id="gt-card-' + i + '" ' +
            'style="border:1px solid #e2e8f0;padding:18px 20px;margin-bottom:16px;">' +

            // ── Top row: emoji + name + status badge + delete
            '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:14px;">' +
                '<div style="display:flex;align-items:center;gap:12px;">' +
                    '<div style="width:44px;height:44px;border-radius:12px;background:#f8fafc;display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0;">' + g.emoji + '</div>' +
                    '<div>' +
                        '<div style="font-size:14px;font-weight:900;color:#1e293b;">' + window.esc(g.label) + '</div>' +
                        '<div style="font-size:11px;color:#94a3b8;margin-top:2px;">' + targetLabel + '</div>' +
                    '</div>' +
                '</div>' +
                '<div style="display:flex;align-items:center;gap:6px;flex-shrink:0;">' +
                    '<span style="font-size:10px;font-weight:700;padding:4px 9px;border-radius:20px;white-space:nowrap;' +
                        'background:' + st.color + '18;color:' + st.color + ';">' + st.icon + ' ' + st.label + '</span>' +
                    '<button onclick="gtDeleteGoal(' + i + ')" title="' + _gtT('gt.btn.delete', 'Delete goal') + '" ' +
                    'style="width:26px;height:26px;border-radius:8px;border:none;background:#fff1f2;color:#f43f5e;font-size:13px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:background .15s;" ' +
                    'onmouseover="this.style.background=\'#ffe4e6\'" onmouseout="this.style.background=\'#fff1f2\'">🗑</button>' +
                '</div>' +
            '</div>' +

            // ── Progress bar section
            '<div>' +
                '<div style="display:flex;justify-content:space-between;font-size:11px;margin-bottom:5px;">' +
                    '<span style="font-weight:700;color:#475569;">' + _gtT('gt.card.saved', '{amt} saved').replace('{amt}', _fmt(saved)) + '</span>' +
                    '<span style="font-weight:900;color:#1e293b;">' + pct + '%</span>' +
                '</div>' +
                '<div style="width:100%;background:#f1f5f9;border-radius:99px;height:10px;overflow:hidden;">' +
                    '<div style="height:10px;border-radius:99px;background:' + barColor + ';width:' + pct + '%;transition:width .6s ease;"></div>' +
                '</div>' +
                '<div style="display:flex;justify-content:space-between;font-size:10px;color:#94a3b8;margin-top:4px;">' +
                    '<span>' + lastUpdatedLabel + '</span>' +
                    '<span>' + _gtT('gt.card.remaining', '{amt} remaining').replace('{amt}', _fmt(remaining)) + '</span>' +
                '</div>' +
            '</div>' +

            histHtml +

            // ── Update button / form placeholder
            '<div id="gt-form-' + i + '">' +
                '<button onclick="gtShowUpdateForm(' + i + ')" ' +
                'style="margin-top:12px;width:100%;padding:9px;border-radius:12px;font-size:13px;font-weight:700;color:#6366f1;background:rgba(99,102,241,0.06);border:1.5px dashed #c7d2fe;cursor:pointer;transition:all .15s;" ' +
                'onmouseover="this.style.background=\'rgba(99,102,241,0.12)\'" onmouseout="this.style.background=\'rgba(99,102,241,0.06)\'">' +
                _gtT('gt.btn.update', '+ Update Progress') +
                '</button>' +
            '</div>' +

        '</div>';
    }

    // ── Public: init & render ────────────────────────────────────────────────

    function initGoalTracker() {
        _renderAll();
    }
    window.initGoalTracker = initGoalTracker;

    function _renderAll() {
        var container = document.getElementById('gt-goals-container');
        if (!container) return;
        var goals = window._savedGoals || [];

        if (goals.length === 0) {
            container.innerHTML =
                '<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:60px 20px;text-align:center;">' +
                    '<div style="font-size:52px;margin-bottom:12px;">🎯</div>' +
                    '<div style="font-size:15px;font-weight:800;color:#334155;margin-bottom:6px;">' + _gtT('gt.empty.title', 'No goals saved yet') + '</div>' +
                    '<div style="font-size:12px;color:#94a3b8;margin-bottom:20px;">' + _gtT('gt.empty.sub', 'Use the Goal Planner to set up your goals, then track them here.') + '</div>' +
                    '<button onclick="switchMode(\'goal\')" ' +
                    'style="padding:10px 22px;border-radius:12px;background:#6366f1;color:#fff;font-size:13px;font-weight:700;border:none;cursor:pointer;">' +
                    _gtT('gt.empty.cta', 'Open Goal Planner →') +
                    '</button>' +
                '</div>';
            return;
        }

        container.innerHTML = goals.map(function (g, i) { return _renderCard(g, i); }).join('');
    }

    // ── Update form ──────────────────────────────────────────────────────────

    function gtShowUpdateForm(idx) {
        var g = (window._savedGoals || [])[idx];
        if (!g) return;
        var formDiv = document.getElementById('gt-form-' + idx);
        if (!formDiv) return;

        formDiv.innerHTML =
            '<div style="margin-top:12px;padding:14px;border-radius:14px;background:#f8fafc;border:1.5px solid #e2e8f0;">' +
                '<div style="font-size:11px;font-weight:600;color:#64748b;margin-bottom:10px;">' +
                    _gtT('gt.form.label', 'Total saved toward {name} so far:').replace('{name}', '<strong style="color:#1e293b;">' + window.esc(g.label) + '</strong>') +
                '</div>' +
                '<div style="position:relative;margin-bottom:8px;">' +
                    '<span style="position:absolute;left:11px;top:50%;transform:translateY(-50%);font-weight:800;color:#94a3b8;font-size:14px;pointer-events:none;">₹</span>' +
                    '<input type="text" id="gt-amt-' + idx + '" inputmode="numeric" placeholder="' + _gtT('gt.form.amtph', 'e.g. 1,50,000') + '" ' +
                    'style="width:100%;box-sizing:border-box;padding:9px 12px 9px 28px;border:1.5px solid #e2e8f0;border-radius:10px;font-size:14px;font-weight:700;color:#1e293b;outline:none;transition:border .15s;" ' +
                    'onfocus="this.style.borderColor=\'#6366f1\'" onblur="this.style.borderColor=\'#e2e8f0\'" ' +
                    'oninput="gtFmtInput(this)" value="' + (g.savedAmt > 0 ? Number(g.savedAmt).toLocaleString('en-IN') : '') + '">' +
                '</div>' +
                '<input type="text" id="gt-note-' + idx + '" placeholder="' + _gtT('gt.form.noteph', 'Note (optional) — e.g. Added FD maturity proceeds') + '" ' +
                'style="width:100%;box-sizing:border-box;padding:8px 12px;border:1.5px solid #e2e8f0;border-radius:10px;font-size:12px;color:#334155;outline:none;margin-bottom:10px;transition:border .15s;" ' +
                'onfocus="this.style.borderColor=\'#6366f1\'" onblur="this.style.borderColor=\'#e2e8f0\'">' +
                '<div style="display:flex;gap:8px;">' +
                    '<button onclick="gtSaveCheckIn(' + idx + ')" ' +
                    'style="flex:1;padding:9px;border-radius:10px;background:#6366f1;color:#fff;font-size:13px;font-weight:700;border:none;cursor:pointer;">' + _gtT('gt.btn.savecheckin', 'Save Check-in') + '</button>' +
                    '<button onclick="gtCancelUpdate(' + idx + ')" ' +
                    'style="padding:9px 16px;border-radius:10px;background:#f1f5f9;color:#64748b;font-size:13px;font-weight:600;border:none;cursor:pointer;">' + _gtT('gt.btn.cancel', 'Cancel') + '</button>' +
                '</div>' +
            '</div>';

        var amtEl = document.getElementById('gt-amt-' + idx);
        if (amtEl) amtEl.focus();
    }
    window.gtShowUpdateForm = gtShowUpdateForm;

    function gtFmtInput(el) {
        var raw = (el.value || '').replace(/[^0-9]/g, '');
        el.value = raw ? Number(raw).toLocaleString('en-IN') : '';
    }
    window.gtFmtInput = gtFmtInput;

    function gtSaveCheckIn(idx) {
        var goals = window._savedGoals;
        if (!goals) return;
        var g = goals[idx];
        if (!g) return;

        var amtRaw = (document.getElementById('gt-amt-' + idx)?.value || '').replace(/[^0-9]/g, '');
        var amt = parseInt(amtRaw, 10) || 0;
        if (amt <= 0) {
            var el = document.getElementById('gt-amt-' + idx);
            if (el) { el.style.borderColor = '#ef4444'; el.focus(); }
            return;
        }

        var note = (document.getElementById('gt-note-' + idx)?.value || '').trim();
        var entry = { amt: amt, ts: new Date().toISOString() };
        if (note) entry.note = note;

        g.savedAmt  = amt;
        g.checkIns  = g.checkIns || [];
        g.checkIns.push(entry);

        window._savedGoalsTs = new Date().toISOString();
        if (typeof saveUserData === 'function') saveUserData();

        // Re-render just this card
        var card = document.getElementById('gt-card-' + idx);
        if (card) {
            var tmp = document.createElement('div');
            tmp.innerHTML = _renderCard(g, idx);
            card.replaceWith(tmp.firstElementChild);
        }

        // Refresh dashboard goals widget if visible
        if (typeof _dashUpdateGoalsWidget === 'function') _dashUpdateGoalsWidget();
    }
    window.gtSaveCheckIn = gtSaveCheckIn;

    function gtCancelUpdate(idx) {
        var g = (window._savedGoals || [])[idx];
        if (!g) return;
        var card = document.getElementById('gt-card-' + idx);
        if (card) {
            var tmp = document.createElement('div');
            tmp.innerHTML = _renderCard(g, idx);
            card.replaceWith(tmp.firstElementChild);
        }
    }
    window.gtCancelUpdate = gtCancelUpdate;

    function gtDeleteGoal(idx) {
        var card = document.getElementById('gt-card-' + idx);
        if (!card) return;
        var g = (window._savedGoals || [])[idx];
        if (!g) return;

        // Replace card content with inline confirmation
        card.innerHTML =
            '<div style="display:flex;align-items:center;gap:14px;flex-wrap:wrap;">' +
                '<div style="font-size:22px;flex-shrink:0;">' + g.emoji + '</div>' +
                '<div style="flex:1;min-width:0;">' +
                    '<div style="font-size:13px;font-weight:800;color:#1e293b;margin-bottom:2px;">' + _gtT('gt.del.confirm', 'Remove {name}?').replace('{name}', '<em>' + window.esc(g.label) + '</em>') + '</div>' +
                    '<div style="font-size:11px;color:#94a3b8;">' + _gtT('gt.del.sub', 'This will delete the goal and all check-in history.') + '</div>' +
                '</div>' +
                '<div style="display:flex;gap:8px;flex-shrink:0;">' +
                    '<button onclick="gtConfirmDelete(' + idx + ')" ' +
                    'style="padding:7px 14px;border-radius:10px;background:#ef4444;color:#fff;font-size:12px;font-weight:700;border:none;cursor:pointer;">' + _gtT('gt.btn.confirmdelete', 'Delete') + '</button>' +
                    '<button onclick="gtCancelDelete(' + idx + ')" ' +
                    'style="padding:7px 14px;border-radius:10px;background:#f1f5f9;color:#64748b;font-size:12px;font-weight:600;border:none;cursor:pointer;">' + _gtT('gt.btn.cancel', 'Cancel') + '</button>' +
                '</div>' +
            '</div>';
    }
    window.gtDeleteGoal = gtDeleteGoal;

    function gtConfirmDelete(idx) {
        var goals = window._savedGoals;
        if (!goals) return;
        goals.splice(idx, 1);
        window._savedGoalsTs = new Date().toISOString();
        if (typeof saveUserData === 'function') saveUserData();
        if (typeof gpRenderSavedGoalsBanner === 'function') gpRenderSavedGoalsBanner();
        if (typeof _dashUpdateGoalsWidget === 'function') _dashUpdateGoalsWidget();
        _renderAll();
    }
    window.gtConfirmDelete = gtConfirmDelete;

    function gtCancelDelete(idx) {
        var g = (window._savedGoals || [])[idx];
        if (!g) return;
        var card = document.getElementById('gt-card-' + idx);
        if (card) {
            var tmp = document.createElement('div');
            tmp.innerHTML = _renderCard(g, idx);
            card.replaceWith(tmp.firstElementChild);
        }
    }
    window.gtCancelDelete = gtCancelDelete;

    // Allow dashboard to trigger a re-render after goals load from Firestore
    window._gtRefreshIfOpen = function () {
        if (window._currentMode === 'goaltracker') _renderAll();
    };

    // Called by applyLang() when language changes while goaltracker is open
    window._gtRefreshAll = function () {
        if (window._currentMode === 'goaltracker') _renderAll();
    };

})();
