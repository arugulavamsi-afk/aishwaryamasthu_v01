/* ══════════════════════════════════════════════════════════
   BUDGET & EXPENSE TRACKER
══════════════════════════════════════════════════════════ */
(function () {
    var _MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

    var _BT_CATS = [
        { key:'Housing',      tkey:'Housing',       icon:'🏠', hint:'Rent · EMI · Maintenance' },
        { key:'Food',         tkey:'Food',          icon:'🍽️', hint:'Groceries · Dining · Delivery' },
        { key:'Transport',    tkey:'Transport',     icon:'🚌', hint:'Fuel · Cab · Public transport' },
        { key:'EMIs & Loans', tkey:'EMIs',          icon:'💳', hint:'Personal loan · Credit card' },
        { key:'Entertainment',tkey:'Entertainment', icon:'🎬', hint:'OTT · Movies · Outings' },
        { key:'Health',       tkey:'Health',        icon:'💊', hint:'Doctor · Medicines · Gym' },
        { key:'Shopping',     tkey:'Shopping',      icon:'🛍️', hint:'Clothes · Electronics · Gifts' },
        { key:'Utilities',    tkey:'Utilities',     icon:'⚡', hint:'Electricity · Water · Internet' },
        { key:'Education',    tkey:'Education',     icon:'📚', hint:'School · Courses · Books' },
        { key:'Others',       tkey:'Others',        icon:'💸', hint:'Miscellaneous expenses' }
    ];

    function _btT(k, fb) { return (typeof _t === 'function') ? _t(k) : (fb !== undefined ? fb : k); }
    function _btCatLabel(cat) { return cat.tkey ? _btT('bt.cat.' + cat.tkey, cat.key) : cat.key; }
    function _btCatHint(cat)  { return cat.tkey ? _btT('bt.hint.' + cat.tkey, cat.hint) : (cat.hint || ''); }

    var _BT_COLORS = ['#6366f1','#22c55e','#f59e0b','#ef4444','#a78bfa',
                      '#06b6d4','#ec4899','#f97316','#84cc16','#8b5cf6',
                      '#14b8a6','#f43f5e','#0ea5e9','#a16207','#7c3aed'];

    // ── State ──────────────────────────────────────────────────
    window._btData       = window._btData       || {};  // { 'YYYY-MM': { CatKey: { b:0, a:0 } } }
    window._btCustomCats = window._btCustomCats  || [];  // [{ key, icon }]
    window._btChartInst  = null;
    window._btChartType  = window._btChartType  || 'bar';

    function _btNow() {
        var d = new Date();
        return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
    }
    window._btMonth = window._btMonth || _btNow();

    // Returns all categories: fixed + custom
    function _btAllCats() {
        return _BT_CATS.concat(window._btCustomCats.map(function (c) {
            return { key: c.key, icon: c.icon || '📌', hint: 'Custom category', custom: true };
        }));
    }

    // ── Helpers ────────────────────────────────────────────────
    function _btMonthData() {
        if (!window._btData[window._btMonth]) window._btData[window._btMonth] = {};
        return window._btData[window._btMonth];
    }

    // ── Transaction engine ─────────────────────────────────────
    // Each month object holds a reserved '_tx' array alongside category
    // entries: { i: id, d: 'YYYY-MM-DD', a: amount, c: catKey, n: note, m: 1 }
    // (m flags a synthetic tx migrated from the old lump-sum 'a' value).
    // Category 'a' values are a derived cache so dashboard.js / consult.js
    // keep reading totals without knowing about transactions.
    function _btTxOf(data) {
        if (!Array.isArray(data._tx)) data._tx = [];
        return data._tx;
    }

    function _btTxId() {
        return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    }

    function _btRecalcMonth(data) {
        Object.keys(data).forEach(function (k) {
            if (k !== '_tx' && data[k]) data[k].a = 0;
        });
        (data._tx || []).forEach(function (t) {
            if (!data[t.c]) data[t.c] = { b: 0, a: 0 };
            data[t.c].a = (data[t.c].a || 0) + (t.a || 0);
        });
    }

    // One-time migration: months saved before the transaction engine have
    // lump-sum 'a' values and no '_tx' — convert each into one synthetic tx.
    function _btMigrate() {
        Object.keys(window._btData).forEach(function (mk) {
            var m = window._btData[mk];
            if (!m || typeof m !== 'object') return;
            if (Array.isArray(m._tx)) { _btRecalcMonth(m); return; }
            m._tx = [];
            Object.keys(m).forEach(function (cat) {
                if (cat === '_tx') return;
                var a = (m[cat] || {}).a || 0;
                if (a > 0) m._tx.push({ i: 'mig-' + mk + '-' + cat, d: mk + '-01', a: a, c: cat, m: 1 });
            });
        });
    }

    function _btTouchAndSave() {
        window._btLastUpdated = new Date().toISOString();
        if (typeof saveUserData === 'function') saveUserData();
        if (typeof _dashUpdateBudgetWidget === 'function') _dashUpdateBudgetWidget();
    }

    function _btFmt(n) { return n ? n.toLocaleString('en-IN') : ''; }

    function _btFormatInput(el) {
        var raw = (el.value || '').replace(/[^0-9]/g, '');
        el.value = raw ? parseInt(raw, 10).toLocaleString('en-IN') : '';
    }
    window._btFormatInput = _btFormatInput;   // used by the quick-add amount input

    function _btGetTotals() {
        var data = _btMonthData();
        var budget = 0, actual = 0, overCount = 0;
        _btAllCats().forEach(function (cat) {
            var e = data[cat.key] || { b: 0, a: 0 };
            budget += (e.b || 0);
            actual += (e.a || 0);
            if ((e.b || 0) > 0 && (e.a || 0) > (e.b || 0)) overCount++;
        });
        return { budget: budget, actual: actual, over: overCount };
    }

    // Totals for an arbitrary month key (not the viewed month)
    function _btMonthTotals(mk) {
        var data = window._btData[mk] || {};
        var budget = 0, actual = 0;
        _btAllCats().forEach(function (cat) {
            var e = data[cat.key] || {};
            budget += (e.b || 0);
            actual += (e.a || 0);
        });
        return { budget: budget, actual: actual };
    }

    // ── Custom category management ─────────────────────────────
    function _btAddCustomCat() {
        var nameEl = document.getElementById('bt-new-cat-name');
        var name = (nameEl ? nameEl.value : '').trim();
        if (!name) { if (nameEl) { nameEl.focus(); nameEl.classList.add('bt-inp-err'); } return; }
        // Dedup check (case-insensitive)
        var allKeys = _btAllCats().map(function (c) { return c.key.toLowerCase(); });
        if (allKeys.indexOf(name.toLowerCase()) !== -1) {
            if (nameEl) { nameEl.classList.add('bt-inp-warn'); nameEl.placeholder = _btT('bt.cat.exists','Already exists!'); }
            return;
        }
        window._btCustomCats.push({ key: name, icon: '📌' });
        if (nameEl) { nameEl.value = ''; nameEl.classList.remove('bt-inp-err', 'bt-inp-warn'); nameEl.placeholder = _btT('bt.cat.placeholder','Category name…'); }
        _btRenderTable();
        _btRenderSummary();
        _btRenderChart();
        _btRenderQaCats();
        _btTouchAndSave();
    }
    window._btAddCustomCat = _btAddCustomCat;

    function _btDeleteCustomCat(key) {
        window._btCustomCats = window._btCustomCats.filter(function (c) { return c.key !== key; });
        // Also wipe from all months (incl. transactions) so chart data is clean
        Object.keys(window._btData).forEach(function (m) {
            delete window._btData[m][key];
            if (Array.isArray(window._btData[m]._tx)) {
                window._btData[m]._tx = window._btData[m]._tx.filter(function (t) { return t.c !== key; });
            }
        });
        // Recurring rules and learned keywords pointing at the category go too
        window._btRecurring = (window._btRecurring || []).filter(function (r) { return r.c !== key; });
        Object.keys(window._btKeyMap || {}).forEach(function (w) {
            if (window._btKeyMap[w] === key) delete window._btKeyMap[w];
        });
        if (window._btQaCat === key) window._btQaCat = null;
        _btRefreshAll();
        _btTouchAndSave();
    }
    window._btDeleteCustomCat = _btDeleteCustomCat;

    // Allow Enter key in the add-category input to confirm
    function _btNewCatKeydown(e) {
        if (e.key === 'Enter') { e.preventDefault(); _btAddCustomCat(); }
        var nameEl = document.getElementById('bt-new-cat-name');
        if (nameEl) nameEl.classList.remove('bt-inp-err', 'bt-inp-warn');
    }
    window._btNewCatKeydown = _btNewCatKeydown;

    // ── Navigation ─────────────────────────────────────────────
    function _btNavMonth(delta) {
        var parts = window._btMonth.split('-');
        var d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1 + delta, 1);
        window._btMonth = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
        _btRefreshAll();
    }

    function _btGoToToday() {
        window._btMonth = _btNow();
        _btRefreshAll();
    }

    window._btNavMonth  = _btNavMonth;
    window._btGoToToday = _btGoToToday;

    // ── Clear month (two-tap confirm) ──────────────────────────
    // Wipes the VIEWED month's budgets + transactions. Recurring rules are
    // global and survive; a cleared current month is not re-posted because
    // each rule's `last` already points at it.
    var _btClearArmed = null;

    function _btResetClearBtn() {
        var btn = document.getElementById('bt-clear-btn');
        if (_btClearArmed) { clearTimeout(_btClearArmed); _btClearArmed = null; }
        if (btn) {
            btn.textContent = _btT('bt.btn.clear', '🗑 Clear month');
            btn.classList.remove('bt-hdr-armed');
        }
    }

    function _btClearMonth() {
        var btn = document.getElementById('bt-clear-btn');
        if (!_btClearArmed) {
            if (btn) {
                btn.textContent = _btT('bt.btn.clear.confirm', 'Sure? Tap again');
                btn.classList.add('bt-hdr-armed');
            }
            _btClearArmed = setTimeout(_btResetClearBtn, 4000);
            return;
        }
        delete window._btData[window._btMonth];
        _btResetClearBtn();
        _btRefreshAll();
        _btTouchAndSave();
    }
    window._btClearMonth = _btClearMonth;

    // ── Render: month display ──────────────────────────────────
    function _btRenderMonthDisplay() {
        var parts = window._btMonth.split('-');
        var label = _MONTHS_SHORT[parseInt(parts[1], 10) - 1] + ' ' + parts[0];
        var el = document.getElementById('bt-month-disp');
        if (el) el.textContent = label;
        var todayBtn = document.getElementById('bt-today-btn');
        if (todayBtn) todayBtn.style.display = (window._btMonth === _btNow()) ? 'none' : '';

        var copyBtn = document.getElementById('bt-copy-prev-btn');
        if (copyBtn) {
            var d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 2, 1);
            var prevKey = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
            var prevData = window._btData[prevKey] || {};
            var hasPrevBudget = _btAllCats().some(function (cat) { return (prevData[cat.key] || {}).b > 0; });
            var prevLabel = _MONTHS_SHORT[d.getMonth()] + ' ' + d.getFullYear();
            copyBtn.textContent = _btT('bt.copy.prev', 'Copy {mon} budgets').replace('{mon}', prevLabel);
            copyBtn.style.display = hasPrevBudget ? '' : 'none';
        }

        _btUpdateClearBtn();
    }

    // Visibility tracks whether the viewed month has anything to clear;
    // any re-render disarms a pending confirm (stale "Sure?" is worse than
    // asking twice).
    function _btUpdateClearBtn() {
        var clearBtn = document.getElementById('bt-clear-btn');
        if (!clearBtn) return;
        var md = window._btData[window._btMonth] || {};
        var hasData = Object.keys(md).some(function (k) {
            if (k === '_tx') return Array.isArray(md._tx) && md._tx.length > 0;
            var e = md[k] || {};
            return (e.b || 0) > 0 || (e.a || 0) > 0;
        });
        clearBtn.style.display = hasData ? '' : 'none';
        _btResetClearBtn();
    }

    // ── Copy budget from previous month ───────────────────────
    function _btCopyBudgetFromPrev() {
        var parts = window._btMonth.split('-');
        var d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 2, 1);
        var prevKey = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
        var prevData = window._btData[prevKey];
        if (!prevData) return;
        var curData = _btMonthData();
        _btAllCats().forEach(function (cat) {
            var prevEntry = prevData[cat.key];
            if (prevEntry && prevEntry.b > 0) {
                if (!curData[cat.key]) curData[cat.key] = { b: 0, a: 0 };
                curData[cat.key].b = prevEntry.b;
            }
        });
        _btRefreshAll();
        _btTouchAndSave();
    }
    window._btCopyBudgetFromPrev = _btCopyBudgetFromPrev;

    // ── Render: category table ─────────────────────────────────
    function _btMakeDiffHtml(budget, actual, catKey) {
        var over = budget > 0 && actual > budget;
        var diff = budget - actual;
        if (budget === 0 && actual === 0) return '<span class="bt-diff-none">—</span>';
        if (over) return '<span class="bt-diff-over">⚠ +₹' + _btFmt(Math.abs(diff)) + '</span>';
        if (budget > 0) {
            // Within budget so far — but is the run-rate on course to blow it?
            var pace = _btPaceData();
            if (pace && pace.day >= _BT_PACE_MIN_DAY && catKey && (pace.proj[catKey] || 0) > budget) {
                return '<span class="bt-diff-pace">⏱ ' + _btT('bt.status.pace', 'pace ~{amt}').replace('{amt}', '₹' + _btFmt(pace.proj[catKey])) + '</span>';
            }
            return '<span class="bt-diff-ok">✓ ₹' + (diff === 0 ? '0' : _btFmt(diff)) + ' ' + _btT('bt.status.left','left') + '</span>';
        }
        return '<span class="bt-diff-none">' + _btT('bt.status.nobudget','no budget') + '</span>';
    }

    function _btMakeRow(cat, data) {
        var entry  = data[cat.key] || { b: 0, a: 0 };
        var budget = entry.b || 0;
        var actual = entry.a || 0;
        var over   = budget > 0 && actual > budget;
        var bStr   = budget ? _btFmt(budget) : '';
        var aStr   = actual ? _btFmt(actual) : '';

        var catCell;
        if (cat.custom) {
            // Custom row: show delete button
            catCell =
                '<td class="bt-td bt-td-cat">' +
                    '<div class="bt-cat-wrap">' +
                        '<span class="bt-cat-icon">' + cat.icon + '</span>' +
                        '<div class="bt-cat-txt">' +
                            '<div class="bt-cat-name bt-cat-name-custom">' + _btEsc(cat.key) + '</div>' +
                            '<div class="bt-cat-hint">' + _btT('bt.cat.custom','Custom') + '</div>' +
                        '</div>' +
                        // key goes into an onclick JS string inside an HTML attribute:
                        // JS-escape first, then HTML-escape the result
                        '<button class="bt-cat-del" onclick="window._btDeleteCustomCat(\'' + _btEsc(String(cat.key).replace(/\\/g, '\\\\').replace(/'/g, "\\'")) + '\')" title="' + _btEsc(_btT('bt.cat.remove','Remove category')) + '">×</button>' +
                    '</div>' +
                '</td>';
        } else {
            catCell =
                '<td class="bt-td bt-td-cat bt-td-nowrap">' +
                    '<div class="bt-cat-wrap">' +
                        '<span class="bt-cat-icon">' + cat.icon + '</span>' +
                        '<div>' +
                            '<div class="bt-cat-name">' + _btCatLabel(cat) + '</div>' +
                            '<div class="bt-cat-hint">' + _btCatHint(cat) + '</div>' +
                        '</div>' +
                    '</div>' +
                '</td>';
        }

        var tr = document.createElement('tr');
        if (over) tr.className = 'bt-row-over';
        tr.setAttribute('data-cat-row', cat.key);
        tr.innerHTML =
            catCell +
            '<td class="bt-td bt-td-inp">' +
                '<div class="bt-inp-wrap">' +
                    '<span class="bt-inp-rupee">₹</span>' +
                    '<input type="text" inputmode="numeric"' +
                    ' data-cat="' + _btEsc(cat.key) + '" data-field="b"' +
                    ' value="' + bStr + '" placeholder="' + _btEsc(_btT('bt.input.budget','Budget')) + '"' +
                    ' class="bt-num-inp' + (bStr ? '' : ' text-slate-400') + '"' +
                    ' onfocus="window._btInputFocus(this)" oninput="window._btInputChange(this)" onblur="window._btInputBlur(this)">' +
                '</div>' +
            '</td>' +
            '<td class="bt-td bt-td-inp">' +
                '<div class="bt-spent-cell">' +
                    '<span class="bt-spent-val' + (actual ? '' : ' bt-spent-zero') + '" data-spent-cat="' + _btEsc(cat.key) + '">' +
                        (actual ? '₹' + aStr : '—') +
                    '</span>' +
                    '<button class="bt-row-add" onclick="window._btRowAdd(\'' + _btEsc(String(cat.key).replace(/\\/g, '\\\\').replace(/'/g, "\\'")) + '\')" ' +
                        'title="' + _btEsc(_btT('bt.row.addtx','Add expense')) + '">+</button>' +
                '</div>' +
            '</td>' +
            '<td class="bt-td bt-td-status">' + _btMakeDiffHtml(budget, actual, cat.key) + '</td>';
        return tr;
    }

    function _btEsc(s) {
        return window.esc(s);   // shared escape helper from auth.js
    }

    function _btRenderTable() {
        var tbody = document.getElementById('bt-tbody');
        if (!tbody) return;
        var data = _btMonthData();
        tbody.innerHTML = '';

        _btAllCats().forEach(function (cat) {
            tbody.appendChild(_btMakeRow(cat, data));
        });

        // ── Add-category row ──────────────────────────────────
        var addTr = document.createElement('tr');
        addTr.innerHTML =
            '<td colspan="4" class="bt-addrow-td">' +
                '<div class="bt-addrow-wrap">' +
                    '<span class="bt-cat-icon">📌</span>' +
                    '<input id="bt-new-cat-name" type="text" maxlength="30" class="bt-addrow-inp" placeholder="' + _btEsc(_btT('bt.cat.placeholder','Category name…')) + '" ' +
                        'onkeydown="window._btNewCatKeydown(event)">' +
                    '<button class="bt-addrow-btn" onclick="window._btAddCustomCat()">' + _btT('bt.cat.add','+ Add') + '</button>' +
                '</div>' +
                '<div class="bt-addrow-hint">' + _btT('bt.cat.hint','Type your category name and press Enter or click Add') + '</div>' +
            '</td>';
        tbody.appendChild(addTr);
    }

    // ── Input handlers ─────────────────────────────────────────
    function _btInputFocus(el) {
        el.classList.remove('text-slate-400');
    }

    function _btInputChange(el) {
        _btFormatInput(el);
        if (!el.value) el.classList.add('text-slate-400');
        else el.classList.remove('text-slate-400');

        var cat   = el.getAttribute('data-cat');
        var field = el.getAttribute('data-field');
        var val   = parseInt((el.value || '').replace(/[^0-9]/g, ''), 10) || 0;
        var data  = _btMonthData();
        if (!data[cat]) data[cat] = { b: 0, a: 0 };
        data[cat][field] = val;

        _btUpdateRowFromInput(el);
        _btRenderSummary();
        _btRenderChart();
        _btTouchAndSave();
    }

    function _btInputBlur(el) {
        if (!el.value) el.classList.add('text-slate-400');
    }

    function _btUpdateRowFromInput(el) {
        var row = el.closest('tr');
        if (!row) return;
        var cat    = el.getAttribute('data-cat');
        var data   = _btMonthData();
        var entry  = data[cat] || { b: 0, a: 0 };
        var budget = entry.b || 0;
        var actual = entry.a || 0;
        var over   = budget > 0 && actual > budget;

        row.classList.toggle('bt-row-over', over);

        var tds    = row.querySelectorAll('td');
        var diffTd = tds[tds.length - 1];
        if (diffTd) diffTd.innerHTML = _btMakeDiffHtml(budget, actual, cat);
    }

    window._btInputFocus  = _btInputFocus;
    window._btInputChange = _btInputChange;
    window._btInputBlur   = _btInputBlur;

    // ── Quick-add expense bar ──────────────────────────────────
    window._btQaCat = window._btQaCat || null;   // selected category chip
    var _btQaEditId = null;                      // tx id being edited (null = adding)
    var _btQaCatManual = false;                  // chip tapped by hand since last add
                                                 // (suggestions never override a manual pick)

    function _btPad2(n) { return String(n).padStart(2, '0'); }

    function _btTodayISO() {
        var d = new Date();
        return d.getFullYear() + '-' + _btPad2(d.getMonth() + 1) + '-' + _btPad2(d.getDate());
    }

    // Clamp the date picker to the viewed month; default to today when
    // viewing the current month, else the 1st of that month.
    function _btSyncQaDate() {
        var el = document.getElementById('bt-qa-date');
        if (!el) return;
        var parts   = window._btMonth.split('-');
        var lastDay = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10), 0).getDate();
        el.min = window._btMonth + '-01';
        el.max = window._btMonth + '-' + _btPad2(lastDay);
        if (!el.value || el.value.slice(0, 7) !== window._btMonth) {
            var today = _btTodayISO();
            el.value = today.slice(0, 7) === window._btMonth ? today : window._btMonth + '-01';
        }
    }

    function _btRenderQaCats() {
        var wrap = document.getElementById('bt-qa-cats');
        if (!wrap) return;
        wrap.innerHTML = '';
        _btAllCats().forEach(function (cat) {
            var label = cat.custom ? cat.key : _btCatLabel(cat);
            var b = document.createElement('button');
            b.type = 'button';
            b.className = 'bt-tile' + (window._btQaCat === cat.key ? ' bt-tile-on' : '');
            b.title = label;   // full name for tiles whose label ellipsizes
            var ic = document.createElement('span');
            ic.className = 'bt-tile-icon';
            ic.textContent = cat.icon;
            var lb = document.createElement('span');
            lb.className = 'bt-tile-lbl';
            lb.textContent = label;
            b.appendChild(ic);
            b.appendChild(lb);
            b.onclick = function () { _btPickQaCat(cat.key); };
            wrap.appendChild(b);
        });
    }

    function _btPickQaCat(key) {
        window._btQaCat = key;
        _btQaCatManual = true;
        _btRenderQaCats();
        var wrap = document.getElementById('bt-qa-cats');
        if (wrap) wrap.classList.remove('bt-qa-flash');
        var sugEl = document.getElementById('bt-qa-sugg');
        if (sugEl) sugEl.textContent = '';
    }
    window._btPickQaCat = _btPickQaCat;

    // Per-row "+" in the category table: pre-select the category and jump
    // to the quick-add bar for a 1-tap entry.
    function _btRowAdd(key) {
        _btPickQaCat(key);
        var card = document.getElementById('bt-qa-card');
        if (card) card.scrollIntoView({ behavior: 'smooth', block: 'center' });
        var amtEl = document.getElementById('bt-qa-amt');
        if (amtEl) setTimeout(function () { amtEl.focus(); }, 250);
    }
    window._btRowAdd = _btRowAdd;

    function _btQaKeydown(e) {
        if (e.key === 'Enter') { e.preventDefault(); _btQuickAdd(); }
    }
    window._btQaKeydown = _btQaKeydown;

    function _btQaSetEditingUI(editing) {
        var card   = document.getElementById('bt-qa-card');
        var btn    = document.getElementById('bt-qa-btn');
        var cancel = document.getElementById('bt-qa-cancel');
        var repLbl = document.getElementById('bt-qa-repeat-lbl');
        if (card)   card.classList.toggle('bt-qa-editing', editing);
        if (btn)    btn.textContent = editing ? _btT('bt.qa.update', '✓ Update') : _btT('bt.qa.add', '+ Add');
        if (cancel) cancel.style.display = editing ? '' : 'none';
        if (repLbl) repLbl.style.display = editing ? 'none' : '';   // rules are created on add only
    }

    function _btQuickAdd() {
        var amtEl  = document.getElementById('bt-qa-amt');
        var noteEl = document.getElementById('bt-qa-note');
        var dateEl = document.getElementById('bt-qa-date');
        var amt = parseInt(((amtEl ? amtEl.value : '') || '').replace(/[^0-9]/g, ''), 10) || 0;

        if (!amt) {
            if (amtEl) { amtEl.classList.add('bt-qa-err'); amtEl.focus(); setTimeout(function () { amtEl.classList.remove('bt-qa-err'); }, 900); }
            return;
        }
        if (!window._btQaCat) {
            var wrap = document.getElementById('bt-qa-cats');
            if (wrap) { wrap.classList.add('bt-qa-flash'); setTimeout(function () { wrap.classList.remove('bt-qa-flash'); }, 900); }
            return;
        }

        var d = (dateEl && dateEl.value && dateEl.value.slice(0, 7) === window._btMonth)
            ? dateEl.value
            : (_btTodayISO().slice(0, 7) === window._btMonth ? _btTodayISO() : window._btMonth + '-01');
        var note = ((noteEl ? noteEl.value : '') || '').trim();

        var data = _btMonthData();
        var tx   = _btTxOf(data);

        if (_btQaEditId) {
            for (var i = 0; i < tx.length; i++) {
                if (tx[i].i === _btQaEditId) {
                    tx[i].a = amt; tx[i].c = window._btQaCat; tx[i].d = d;
                    if (note) tx[i].n = note; else delete tx[i].n;
                    delete tx[i].m;   // edited by hand — no longer a migrated lump sum
                    break;
                }
            }
            _btQaEditId = null;
            _btQaSetEditingUI(false);
        } else {
            var t = { i: _btTxId(), d: d, a: amt, c: window._btQaCat };
            if (note) t.n = note;
            var repEl = document.getElementById('bt-qa-repeat');
            if (repEl && repEl.checked) {
                t.r = 1;
                var rule = { i: _btTxId(), a: amt, c: window._btQaCat, day: parseInt(d.split('-')[2], 10) || 1, last: window._btMonth };
                if (note) rule.n = note;
                window._btRecurring.push(rule);
                repEl.checked = false;
                _btRenderRecurring();
            }
            tx.push(t);
        }

        _btLearn(note, window._btQaCat);
        _btRecalcMonth(data);
        if (amtEl)  amtEl.value = '';
        if (noteEl) noteEl.value = '';
        _btQaCatManual = false;
        var sugEl = document.getElementById('bt-qa-sugg');
        if (sugEl) sugEl.textContent = '';
        _btRenderTable();
        _btRenderSummary();
        _btRenderChart();
        _btRenderTxList();
        _btTouchAndSave();
        if (amtEl) amtEl.focus();   // keep the flow going for rapid entry
    }
    window._btQuickAdd = _btQuickAdd;

    function _btQaCancelEdit() {
        _btQaEditId = null;
        _btQaSetEditingUI(false);
        var amtEl  = document.getElementById('bt-qa-amt');
        var noteEl = document.getElementById('bt-qa-note');
        if (amtEl)  amtEl.value = '';
        if (noteEl) noteEl.value = '';
        _btRenderTxList();
    }
    window._btQaCancelEdit = _btQaCancelEdit;

    function _btEditTx(id) {
        var tx = _btTxOf(_btMonthData());
        var t = null;
        for (var i = 0; i < tx.length; i++) if (tx[i].i === id) { t = tx[i]; break; }
        if (!t) return;
        _btQaEditId = id;
        window._btQaCat = t.c;
        _btQaCatManual = true;   // don't let note suggestions fight the edit
        var amtEl  = document.getElementById('bt-qa-amt');
        var noteEl = document.getElementById('bt-qa-note');
        var dateEl = document.getElementById('bt-qa-date');
        if (amtEl)  amtEl.value = _btFmt(t.a);
        if (noteEl) noteEl.value = t.n || '';
        if (dateEl && t.d && t.d.slice(0, 7) === window._btMonth) dateEl.value = t.d;
        _btRenderQaCats();
        _btQaSetEditingUI(true);
        _btRenderTxList();
        var card = document.getElementById('bt-qa-card');
        if (card) card.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    window._btEditTx = _btEditTx;

    function _btDeleteTx(id) {
        var data = _btMonthData();
        data._tx = _btTxOf(data).filter(function (t) { return t.i !== id; });
        if (_btQaEditId === id) _btQaCancelEdit();
        _btRecalcMonth(data);
        _btRenderTable();
        _btRenderSummary();
        _btRenderChart();
        _btRenderTxList();
        _btTouchAndSave();
    }
    window._btDeleteTx = _btDeleteTx;

    // ── Render: transactions list ──────────────────────────────
    function _btRenderTxList() {
        var listEl  = document.getElementById('bt-tx-list');
        var countEl = document.getElementById('bt-tx-count');
        if (!listEl) return;

        var tx = _btTxOf(_btMonthData());
        if (countEl) {
            countEl.textContent = tx.length === 0 ? ''
                : tx.length === 1 ? _btT('bt.tx.count.one', '1 entry')
                : _btT('bt.tx.count', '{n} entries').replace('{n}', tx.length);
        }

        if (tx.length === 0) {
            listEl.innerHTML = '<div class="bt-tx-empty">' + _btEsc(_btT('bt.tx.empty', 'No expenses logged for this month yet — add your first one above.')) + '</div>';
            return;
        }

        // Newest date first; within a date, latest entry first
        var sorted = tx.map(function (t, i) { return { t: t, i: i }; }).sort(function (x, y) {
            var c = String(y.t.d || '').localeCompare(String(x.t.d || ''));
            return c !== 0 ? c : y.i - x.i;
        });

        var catByKey = {};
        _btAllCats().forEach(function (c) { catByKey[c.key] = c; });

        var today = _btTodayISO();
        var yd    = new Date(); yd.setDate(yd.getDate() - 1);
        var yesterday = yd.getFullYear() + '-' + _btPad2(yd.getMonth() + 1) + '-' + _btPad2(yd.getDate());

        var html = '', lastDate = null;
        sorted.forEach(function (w) {
            var t = w.t;
            if (t.d !== lastDate) {
                lastDate = t.d;
                var parts = String(t.d || '').split('-');
                var label = parts.length === 3 ? parseInt(parts[2], 10) + ' ' + _MONTHS_SHORT[parseInt(parts[1], 10) - 1] : (t.d || '');
                if (t.d === today)     label += ' · ' + _btT('bt.tx.today', 'Today');
                if (t.d === yesterday) label += ' · ' + _btT('bt.tx.yesterday', 'Yesterday');
                html += '<div class="bt-tx-day">' + _btEsc(label) + '</div>';
            }
            var cat  = catByKey[t.c] || { key: t.c, icon: '📌' };
            var name = (cat.custom || !cat.tkey ? cat.key : _btCatLabel(cat)) + (t.r ? ' 🔁' : '');
            var sub  = t.n ? _btEsc(t.n) : (t.m ? '<em>' + _btEsc(_btT('bt.tx.migrated', 'Earlier spends (before itemised tracking)')) + '</em>' : '');
            var idArg = _btEsc(String(t.i).replace(/\\/g, '\\\\').replace(/'/g, "\\'"));
            html +=
                '<div class="bt-tx-row' + (_btQaEditId === t.i ? ' bt-tx-editing' : '') + '">' +
                    '<span class="bt-tx-icon">' + cat.icon + '</span>' +
                    '<div class="bt-tx-info">' +
                        '<div class="bt-tx-cat">' + _btEsc(name) + '</div>' +
                        (sub ? '<div class="bt-tx-note">' + sub + '</div>' : '') +
                    '</div>' +
                    '<span class="bt-tx-amt">₹' + _btFmt(t.a) + '</span>' +
                    '<button class="bt-tx-btn" onclick="window._btEditTx(\'' + idArg + '\')" title="' + _btEsc(_btT('bt.tx.edit', 'Edit')) + '">✎</button>' +
                    '<button class="bt-tx-btn bt-tx-del" onclick="window._btDeleteTx(\'' + idArg + '\')" title="' + _btEsc(_btT('bt.tx.delete', 'Delete')) + '">×</button>' +
                '</div>';
        });
        listEl.innerHTML = html;
    }

    // ── Recurring expenses ─────────────────────────────────────
    // Rules: { i: id, a: amount, c: catKey, n: note, day: 1-31, last: 'YYYY-MM' }
    // 'last' is the most recent month the rule was posted into — auto-post
    // is idempotent and a user-deleted auto-tx is NOT re-posted.
    window._btRecurring = window._btRecurring || [];

    function _btAutoPostRecurring() {
        var rules = window._btRecurring || [];
        if (!rules.length) return;
        var cur = _btNow();
        var parts = cur.split('-');
        var lastDay = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10), 0).getDate();
        var posted = false;
        rules.forEach(function (r) {
            if (r.last === cur) return;
            if (!window._btData[cur]) window._btData[cur] = {};
            var tx = _btTxOf(window._btData[cur]);
            var id = 'rec-' + r.i + '-' + cur;
            if (!tx.some(function (t) { return t.i === id; })) {
                var t = { i: id, d: cur + '-' + _btPad2(Math.min(r.day || 1, lastDay)), a: r.a, c: r.c, r: 1 };
                if (r.n) t.n = r.n;
                tx.push(t);
            }
            r.last = cur;
            posted = true;
        });
        if (posted) {
            _btRecalcMonth(window._btData[cur]);
            _btTouchAndSave();
        }
    }

    function _btDeleteRecurring(id) {
        window._btRecurring = (window._btRecurring || []).filter(function (r) { return r.i !== id; });
        _btRenderRecurring();
        _btRenderForecast();   // rule amounts feed the 3-month outlook
        _btTouchAndSave();
    }
    window._btDeleteRecurring = _btDeleteRecurring;

    function _btRenderRecurring() {
        var card = document.getElementById('bt-rec-card');
        var list = document.getElementById('bt-rec-list');
        if (!card || !list) return;
        var rules = window._btRecurring || [];
        card.style.display = rules.length ? '' : 'none';
        list.innerHTML = '';
        var catByKey = {};
        _btAllCats().forEach(function (c) { catByKey[c.key] = c; });
        rules.forEach(function (r) {
            var cat = catByKey[r.c] || { key: r.c, icon: '📌' };
            var row = document.createElement('div');
            row.className = 'bt-rec-row';

            var icon = document.createElement('span');
            icon.className = 'bt-rec-icon';
            icon.textContent = cat.icon;

            var info = document.createElement('div');
            info.className = 'bt-rec-info';
            var name = document.createElement('div');
            name.className = 'bt-rec-name';
            name.textContent = r.n || (cat.custom || !cat.tkey ? cat.key : _btCatLabel(cat));
            var day = document.createElement('div');
            day.className = 'bt-rec-daylbl';
            day.textContent = _btT('bt.rec.day', 'day {d}').replace('{d}', r.day || 1);
            info.appendChild(name);
            info.appendChild(day);

            var amt = document.createElement('span');
            amt.className = 'bt-rec-amt';
            amt.textContent = '₹' + _btFmt(r.a);

            var del = document.createElement('button');
            del.className = 'bt-tx-btn bt-tx-del';
            del.title = _btT('bt.rec.remove', 'Stop recurring');
            del.textContent = '×';
            del.onclick = function () { _btDeleteRecurring(r.i); };

            row.appendChild(icon);
            row.appendChild(info);
            row.appendChild(amt);
            row.appendChild(del);
            list.appendChild(row);
        });
    }

    // ── Keyword → category suggestions ─────────────────────────
    // Learned map (persisted) wins over the built-in merchant map.
    window._btKeyMap = window._btKeyMap || {};

    var _BT_KEYWORDS = {
        swiggy:'Food', zomato:'Food', zepto:'Food', blinkit:'Food', bigbasket:'Food',
        instamart:'Food', grocery:'Food', groceries:'Food', restaurant:'Food', dining:'Food',
        dominos:'Food', kfc:'Food', lunch:'Food', dinner:'Food', breakfast:'Food',
        uber:'Transport', ola:'Transport', rapido:'Transport', petrol:'Transport', diesel:'Transport',
        fuel:'Transport', fastag:'Transport', metro:'Transport', cab:'Transport', bus:'Transport',
        train:'Transport', irctc:'Transport', parking:'Transport', toll:'Transport',
        rent:'Housing', maintenance:'Housing', society:'Housing',
        emi:'EMIs & Loans', loan:'EMIs & Loans',
        netflix:'Entertainment', hotstar:'Entertainment', spotify:'Entertainment', prime:'Entertainment',
        bookmyshow:'Entertainment', movie:'Entertainment', cinema:'Entertainment', pvr:'Entertainment',
        doctor:'Health', medicine:'Health', medicines:'Health', pharmacy:'Health', apollo:'Health',
        '1mg':'Health', pharmeasy:'Health', gym:'Health', hospital:'Health', dentist:'Health',
        amazon:'Shopping', flipkart:'Shopping', myntra:'Shopping', ajio:'Shopping', nykaa:'Shopping',
        electricity:'Utilities', water:'Utilities', wifi:'Utilities', broadband:'Utilities',
        jio:'Utilities', airtel:'Utilities', recharge:'Utilities', gas:'Utilities', cylinder:'Utilities',
        internet:'Utilities', mobile:'Utilities', dth:'Utilities',
        school:'Education', college:'Education', course:'Education', udemy:'Education',
        books:'Education', tuition:'Education', fees:'Education'
    };

    var _BT_KEYMAP_MAX = 300;

    function _btTokens(s) {
        return (s || '').toLowerCase().split(/[^a-z0-9]+/).filter(function (w) { return w.length >= 3; });
    }

    function _btLookupCat(note) {
        var known = {};
        _btAllCats().forEach(function (c) { known[c.key] = 1; });
        var toks = _btTokens(note), i;
        for (i = 0; i < toks.length; i++) {
            var m = window._btKeyMap[toks[i]];
            if (m && known[m]) return m;
        }
        for (i = 0; i < toks.length; i++) {
            var b = _BT_KEYWORDS[toks[i]];
            if (b && known[b]) return b;
        }
        return null;
    }

    function _btLearn(note, cat) {
        if (!note) return;
        _btTokens(note).slice(0, 4).forEach(function (w) {
            if (/^\d+$/.test(w)) return;
            delete window._btKeyMap[w];          // re-insert to refresh recency
            window._btKeyMap[w] = cat;
        });
        var keys = Object.keys(window._btKeyMap);
        while (keys.length > _BT_KEYMAP_MAX) delete window._btKeyMap[keys.shift()];
    }

    function _btNoteInput(el) {
        var sugEl = document.getElementById('bt-qa-sugg');
        if (_btQaCatManual) { if (sugEl) sugEl.textContent = ''; return; }
        var cat = _btLookupCat(el.value);
        if (cat) {
            if (window._btQaCat !== cat) { window._btQaCat = cat; _btRenderQaCats(); }
            if (sugEl) {
                var catByKey = {};
                _btAllCats().forEach(function (c) { catByKey[c.key] = c; });
                var co = catByKey[cat];
                var label = co && co.tkey ? _btCatLabel(co) : cat;
                sugEl.textContent = _btT('bt.qa.sugg', 'Suggested: {cat} ✨').replace('{cat}', label);
            }
        } else if (sugEl) sugEl.textContent = '';
    }
    window._btNoteInput = _btNoteInput;

    // ── Pace projection ────────────────────────────────────────
    // Month-end projection for the CURRENT month only. Recurring (r:1) and
    // migrated (m:1) txs are one-shot amounts, not a daily run-rate — so
    // projection = fixed + variable/dayOfMonth × daysInMonth. Otherwise rent
    // posted on the 1st would "project" to 31 rents.
    var _BT_PACE_MIN_DAY = 5;   // projections are noise before this

    // Projection for the current CALENDAR month — independent of which month
    // the panel is viewing (the EF basis needs it even from a past month).
    function _btProjectCurrentMonth() {
        var m = window._btData[_btNow()];
        var now    = new Date();
        var day    = now.getDate();
        var daysIn = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        var fixed = {}, vari = {};
        ((m && m._tx) || []).forEach(function (t) {
            var bucket = (t.r || t.m) ? fixed : vari;
            bucket[t.c] = (bucket[t.c] || 0) + (t.a || 0);
        });
        var proj = {}, projVar = {}, totalProj = 0, totalProjVar = 0;
        _btAllCats().forEach(function (c) {
            var pv = Math.round((vari[c.key] || 0) / day * daysIn);
            var p  = (fixed[c.key] || 0) + pv;
            proj[c.key] = p;       totalProj    += p;
            projVar[c.key] = pv;   totalProjVar += pv;
        });
        return { day: day, daysIn: daysIn, proj: proj, totalProj: totalProj,
                 projVar: projVar, totalProjVar: totalProjVar };
    }

    // Pace UI data — only when the panel is viewing the current month.
    function _btPaceData() {
        if (window._btMonth !== _btNow()) return null;
        return _btProjectCurrentMonth();
    }

    function _btRenderPace() {
        var card = document.getElementById('bt-pace-card');
        var mark = document.getElementById('bt-bar-today');
        if (!card) return;
        var t    = _btGetTotals();
        var pace = _btPaceData();
        if (!pace || t.budget <= 0) {
            card.style.display = 'none';
            if (mark) mark.style.display = 'none';
            return;
        }
        card.style.display = '';
        if (mark) {
            mark.style.display = '';
            mark.style.left = (pace.day / pace.daysIn * 100).toFixed(1) + '%';
        }

        var dayEl = document.getElementById('bt-pace-day');
        if (dayEl) dayEl.textContent = _btT('bt.pace.day', 'Day {d} of {n}').replace('{d}', pace.day).replace('{n}', pace.daysIn);

        var vEl = document.getElementById('bt-pace-verdict');
        if (!vEl) return;
        vEl.classList.remove('bt-pos', 'bt-neg', 'bt-mut');
        var inr = function (v) { return '₹' + v.toLocaleString('en-IN'); };
        if (t.actual === 0) {
            vEl.textContent = _btT('bt.pace.nospend', 'No spends logged yet this month');
            vEl.classList.add('bt-mut');
        } else if (pace.day < _BT_PACE_MIN_DAY) {
            vEl.textContent = _btT('bt.pace.early', 'Early days — projections firm up after day 5');
            vEl.classList.add('bt-mut');
        } else if (pace.totalProj <= t.budget) {
            vEl.textContent = _btT('bt.pace.ontrack', 'On track — projected {proj} of {bud} budget')
                .replace('{proj}', inr(pace.totalProj)).replace('{bud}', inr(t.budget));
            vEl.classList.add('bt-pos');
        } else {
            vEl.textContent = _btT('bt.pace.over', 'Overspending — projected {proj}, {over} over budget')
                .replace('{proj}', inr(pace.totalProj)).replace('{over}', inr(pace.totalProj - t.budget));
            vEl.classList.add('bt-neg');
        }
    }

    // ── 3-month outlook ────────────────────────────────────────
    // Forecast for the next 3 calendar months: recurring rules are
    // deterministic fixed spend; variable spend is the average of the
    // last ≤3 completed months (≤6 months old), tilted by a clamped
    // linear trend. Calendar-anchored like the EF basis — never the
    // viewed month. One-offs (festivals, annual fees) are NOT covered.
    function _btForecastData() {
        var recCat = {}, recTotal = 0;
        (window._btRecurring || []).forEach(function (r) {
            recCat[r.c] = (recCat[r.c] || 0) + (r.a || 0);
            recTotal += (r.a || 0);
        });

        var cur = _btNow();
        var cd = new Date();
        cd.setMonth(cd.getMonth() - 6);
        var cutoff = cd.getFullYear() + '-' + _btPad2(cd.getMonth() + 1);
        var months = Object.keys(window._btData)
            .filter(function (k) { return /^\d{4}-\d{2}$/.test(k) && k < cur && k >= cutoff; })
            .sort()
            .reverse();

        // Variable-spend history: txs that are neither recurring (r) nor
        // migrated lump-sums (m) — a month qualifies only if it has any,
        // so pre-transaction-engine months never skew the average to zero.
        var hist = [], histCats = [];
        for (var i = 0; i < months.length && hist.length < 3; i++) {
            var tx = (window._btData[months[i]] || {})._tx || [];
            var tot = 0, cats = {};
            tx.forEach(function (t) {
                if (t.r || t.m) return;
                tot += (t.a || 0);
                cats[t.c] = (cats[t.c] || 0) + (t.a || 0);
            });
            if (tot > 0) { hist.push(tot); histCats.push(cats); }
        }
        hist.reverse(); histCats.reverse();          // oldest → newest

        var kind = null, varAvg = 0, varCat = {}, slope = 0, n = hist.length;
        if (n) {
            kind = 'avg';
            varAvg = hist.reduce(function (a, b) { return a + b; }, 0) / n;
            histCats.forEach(function (cats) {
                Object.keys(cats).forEach(function (c) { varCat[c] = (varCat[c] || 0) + cats[c] / n; });
            });
            if (n >= 2) {
                // Least-squares slope, clamped to ±20% of the average so a
                // couple of noisy months can't run the forecast away.
                var tBar = (n - 1) / 2, num = 0, den = 0;
                hist.forEach(function (v, t) { num += (t - tBar) * (v - varAvg); den += (t - tBar) * (t - tBar); });
                slope = den ? num / den : 0;
                var cap = varAvg * 0.2;
                slope = Math.max(-cap, Math.min(cap, slope));
            }
        } else {
            var curTot = _btMonthTotals(cur);
            var p = _btProjectCurrentMonth();
            if (curTot.actual > 0 && p.day >= _BT_PACE_MIN_DAY && p.totalProjVar > 0) {
                kind = 'proj'; varAvg = p.totalProjVar; varCat = p.projVar;
            } else if (curTot.budget > 0) {
                kind = 'budget';
                var mData = window._btData[cur] || {};
                _btAllCats().forEach(function (c) {
                    var v = Math.max(0, ((mData[c.key] || {}).b || 0) - (recCat[c.key] || 0));
                    if (v > 0) varCat[c.key] = v;
                    varAvg += v;
                });
            } else if (recTotal > 0) {
                kind = 'rec';
            } else {
                return null;                          // nothing to go on yet
            }
        }

        var out = [], grand = 0, nowD = new Date();
        for (var k = 1; k <= 3; k++) {
            var d = new Date(nowD.getFullYear(), nowD.getMonth() + k, 1);
            var total = Math.round(recTotal + Math.max(0, varAvg + slope * k));
            grand += total;
            out.push({ label: _MONTHS_SHORT[d.getMonth()] + ' ' + d.getFullYear(), total: total });
        }
        return {
            kind: kind, n: n, months: out, grand: grand,
            recTotal: Math.round(recTotal), varAvg: Math.round(varAvg),
            slope: Math.round(slope), recCat: recCat, varCat: varCat
        };
    }

    function _btRenderForecast() {
        var card = document.getElementById('bt-fc-card');
        if (!card) return;
        var fc = _btForecastData();
        if (!fc) { card.style.display = 'none'; return; }
        card.style.display = '';
        var inr = function (v) { return '₹' + v.toLocaleString('en-IN'); };

        var basisEl = document.getElementById('bt-fc-basis');
        if (basisEl) {
            var bt;
            if (fc.kind === 'avg') {
                bt = fc.n === 1
                    ? _btT('bt.fc.basis.avg1', "Recurring expenses + last month's variable spend")
                    : _btT('bt.fc.basis.avg', 'Recurring expenses + average variable spend over the last {n} months').replace('{n}', fc.n);
            } else if (fc.kind === 'proj') {
                bt = _btT('bt.fc.basis.proj', "Recurring expenses + this month's spending pace");
            } else if (fc.kind === 'budget') {
                bt = _btT('bt.fc.basis.budget', "Recurring expenses + this month's budget");
            } else {
                bt = _btT('bt.fc.basis.rec', 'Your recurring expenses only — log daily spends to sharpen this');
            }
            basisEl.textContent = bt;
        }

        // Trend badge — rising variable spend is a warning, falling is good
        var trendEl = document.getElementById('bt-fc-trend');
        if (trendEl) {
            var minSlope = Math.max(500, fc.varAvg * 0.05);
            if (fc.kind === 'avg' && Math.abs(fc.slope) >= minSlope) {
                trendEl.style.display = '';
                trendEl.textContent = (fc.slope > 0
                    ? _btT('bt.fc.trend.up', '▲ Variable spend rising ~{amt}/month')
                    : _btT('bt.fc.trend.down', '▼ Variable spend falling ~{amt}/month'))
                    .replace('{amt}', inr(Math.abs(fc.slope)));
                trendEl.classList.toggle('bt-fc-trend-up', fc.slope > 0);
            } else trendEl.style.display = 'none';
        }

        var grid = document.getElementById('bt-fc-grid');
        if (grid) {
            grid.innerHTML = '';
            fc.months.forEach(function (m) {
                var cell = document.createElement('div');
                cell.className = 'bt-fc-cell';
                var lbl = document.createElement('div');
                lbl.className = 'bt-fc-cell-lbl';
                lbl.textContent = m.label;
                var val = document.createElement('div');
                val.className = 'bt-fc-cell-val';
                val.textContent = inr(m.total);
                cell.appendChild(lbl);
                cell.appendChild(val);
                grid.appendChild(cell);
            });
        }

        var splitEl = document.getElementById('bt-fc-split');
        if (splitEl) splitEl.textContent = _btT('bt.fc.split', '🔁 Fixed {fixed} + variable {vari} / month')
            .replace('{fixed}', inr(fc.recTotal)).replace('{vari}', inr(fc.varAvg));
        var totEl = document.getElementById('bt-fc-total');
        if (totEl) totEl.textContent = _btT('bt.fc.total', '3-month total: {amount}').replace('{amount}', inr(fc.grand));

        // Top-5 categories of a typical forecast month (recurring + variable)
        var catsEl = document.getElementById('bt-fc-cats');
        if (catsEl) {
            var typ = {};
            Object.keys(fc.recCat).forEach(function (c) { typ[c] = (typ[c] || 0) + fc.recCat[c]; });
            Object.keys(fc.varCat).forEach(function (c) { typ[c] = (typ[c] || 0) + fc.varCat[c]; });
            var catByKey = {};
            _btAllCats().forEach(function (c) { catByKey[c.key] = c; });
            var top = Object.keys(typ)
                .map(function (c) { return { key: c, amt: Math.round(typ[c]) }; })
                .filter(function (e) { return e.amt > 0; })
                .sort(function (a, b) { return b.amt - a.amt; })
                .slice(0, 5);
            catsEl.innerHTML = '';
            top.forEach(function (e) {
                var co = catByKey[e.key] || { key: e.key, icon: '📌' };
                var chip = document.createElement('span');
                chip.className = 'bt-fc-chip';
                var name = (co.custom || !co.tkey) ? co.key : _btCatLabel(co);
                chip.textContent = co.icon + ' ' + name + ' ' + inr(e.amt);
                catsEl.appendChild(chip);
            });
            var wrap = document.getElementById('bt-fc-catwrap');
            if (wrap) wrap.style.display = top.length ? '' : 'none';
        }
    }

    // ── Render: summary cards ──────────────────────────────────
    function _btSetTone(el, tone) {   // tone: 'pos' | 'neg' | 'mut' | null
        el.classList.remove('bt-pos', 'bt-neg', 'bt-mut');
        if (tone) el.classList.add('bt-' + tone);
    }

    function _btRenderSummary() {
        var t   = _btGetTotals();
        var pct = t.budget > 0 ? Math.round(t.actual / t.budget * 100) : 0;

        var bEl = document.getElementById('bt-sum-budget');
        if (bEl) bEl.textContent = t.budget ? '₹' + _btFmt(t.budget) : '—';

        var aEl = document.getElementById('bt-sum-actual');
        if (aEl) {
            aEl.textContent = t.actual ? '₹' + _btFmt(t.actual) : '—';
            _btSetTone(aEl, (t.budget > 0 && t.actual > t.budget) ? 'neg' : 'pos');
        }

        var diff = t.budget - t.actual;
        var dEl  = document.getElementById('bt-sum-diff');
        if (dEl) {
            if (t.budget === 0) {
                dEl.textContent = '—'; _btSetTone(dEl, 'mut');
            } else if (diff >= 0) {
                dEl.textContent = '₹' + _btFmt(diff) + ' ' + _btT('bt.sum.diff.saved','saved'); _btSetTone(dEl, 'pos');
            } else {
                dEl.textContent = '₹' + _btFmt(Math.abs(diff)) + ' ' + _btT('bt.sum.diff.over','over'); _btSetTone(dEl, 'neg');
            }
        }

        var oEl = document.getElementById('bt-sum-outliers');
        if (oEl) {
            oEl.textContent = t.over > 0
                ? t.over + (t.over === 1 ? _btT('bt.status.over.single',' category over budget') : _btT('bt.status.over.plural',' categories over budget'))
                : t.budget > 0 ? _btT('bt.sum.allok','All categories within budget ✓') : _btT('bt.sum.empty','Set budgets to track spending');
            _btSetTone(oEl, t.over > 0 ? 'neg' : t.budget > 0 ? 'pos' : 'mut');
        }

        var barEl = document.getElementById('bt-bar-fill');
        if (barEl) {
            barEl.style.width = Math.min(pct, 100) + '%';
            barEl.classList.remove('bt-fill-green', 'bt-fill-amber', 'bt-fill-red');
            barEl.classList.add(pct > 100 ? 'bt-fill-red' : pct > 80 ? 'bt-fill-amber' : 'bt-fill-green');
        }
        var pctEl = document.getElementById('bt-bar-pct');
        if (pctEl) pctEl.textContent = t.budget > 0 ? pct + _btT('bt.pct.used','% of budget used') : '';

        _btUpdateClearBtn();
        _btRenderPace();
        _btRenderEF();
        _btRenderForecast();
    }

    // ── Render: chart ──────────────────────────────────────────
    function _btSetChartType(type) {
        window._btChartType = type;
        ['bar', 'line', 'donut'].forEach(function (t) {
            var btn = document.getElementById('bt-tab-' + t);
            if (btn) btn.classList.toggle('on', t === type);
        });
        var _btChartDescs = {
            bar:   _btT('bt.chart.bar',   'Budget vs Actual spend per category this month'),
            line:  _btT('bt.chart.line',  'Total monthly spend over the last 12 months'),
            donut: _btT('bt.chart.donut', 'Actual spend split by category this month')
        };
        var descEl = document.getElementById('bt-chart-desc');
        if (descEl) descEl.textContent = _btChartDescs[type] || '';
        _btRenderChart();
    }
    window._btSetChartType = _btSetChartType;

    function _btRenderChart() {
        var canvas = document.getElementById('bt-chart-canvas');
        if (!canvas || typeof Chart === 'undefined') return;
        if (window._btChartInst) { window._btChartInst.destroy(); window._btChartInst = null; }
        var ctx    = canvas.getContext('2d');
        var type   = window._btChartType || 'bar';
        var data   = _btMonthData();
        var allCats = _btAllCats();

        var gridColor   = 'rgba(255,255,255,0.06)';
        var tickColor   = 'rgba(255,255,255,0.45)';
        var legendColor = 'rgba(255,255,255,0.65)';
        function yFmt(v) { return v >= 100000 ? '₹' + (v/100000).toFixed(1) + 'L' : v >= 1000 ? '₹' + (v/1000).toFixed(0) + 'K' : '₹' + v; }

        if (type === 'bar') {
            var labels  = allCats.map(function (c) { return c.key.split(' ')[0]; });
            var budgets = allCats.map(function (c) { return (data[c.key] || {}).b || 0; });
            var actuals = allCats.map(function (c) { return (data[c.key] || {}).a || 0; });
            window._btChartInst = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [
                        { label:_btT('bt.chart.legend.budget','Budget'), data:budgets, backgroundColor:'rgba(99,102,241,0.55)', borderColor:'#6366f1', borderWidth:1, borderRadius:4 },
                        { label:_btT('bt.chart.legend.actual','Actual'), data:actuals,
                          backgroundColor: actuals.map(function(a,i){ return budgets[i]>0 && a>budgets[i] ? 'rgba(239,68,68,0.7)' : 'rgba(34,197,94,0.65)'; }),
                          borderColor:     actuals.map(function(a,i){ return budgets[i]>0 && a>budgets[i] ? '#ef4444' : '#22c55e'; }),
                          borderWidth:1, borderRadius:4 }
                    ]
                },
                options: {
                    responsive:true, maintainAspectRatio:false,
                    plugins: {
                        legend: { labels:{ color:legendColor, font:{size:10} } },
                        tooltip: { callbacks:{ label:function(c){ return c.dataset.label+': ₹'+(c.parsed.y||0).toLocaleString('en-IN'); } } }
                    },
                    scales: {
                        x: { ticks:{color:tickColor,font:{size:8}}, grid:{color:gridColor} },
                        y: { ticks:{color:tickColor,font:{size:8},callback:yFmt}, grid:{color:gridColor} }
                    }
                }
            });

        } else if (type === 'line') {
            var months = [], totals = [], budgetLines = [];
            var now = new Date();
            for (var i = 11; i >= 0; i--) {
                var md  = new Date(now.getFullYear(), now.getMonth() - i, 1);
                var key = md.getFullYear() + '-' + String(md.getMonth() + 1).padStart(2, '0');
                months.push(_MONTHS_SHORT[md.getMonth()] + ' \'' + String(md.getFullYear()).slice(2));
                var mdata = window._btData[key] || {};
                var tot = 0, bud = 0;
                // Use all known cats (fixed + any custom cats defined NOW)
                allCats.forEach(function(cat){ tot += (mdata[cat.key]||{}).a||0; bud += (mdata[cat.key]||{}).b||0; });
                totals.push(tot);
                budgetLines.push(bud);
            }
            window._btChartInst = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: months,
                    datasets: [
                        { label:_btT('bt.chart.legend.actual2','Actual Spend'), data:totals, borderColor:'#6366f1', backgroundColor:'rgba(99,102,241,0.12)', pointBackgroundColor:'#a5b4fc', pointRadius:4, fill:true, tension:0.35 },
                        { label:_btT('bt.chart.legend.budget','Budget'),        data:budgetLines, borderColor:'#f59e0b', backgroundColor:'transparent', borderDash:[4,3], pointRadius:3, pointBackgroundColor:'#fbbf24', fill:false, tension:0.35 }
                    ]
                },
                options: {
                    responsive:true, maintainAspectRatio:false,
                    plugins: {
                        legend: { labels:{color:legendColor,font:{size:10}} },
                        tooltip: { callbacks:{ label:function(c){ return c.dataset.label+': ₹'+(c.parsed.y||0).toLocaleString('en-IN'); } } }
                    },
                    scales: {
                        x: { ticks:{color:tickColor,font:{size:8}}, grid:{color:gridColor} },
                        y: { ticks:{color:tickColor,font:{size:8},callback:yFmt}, grid:{color:gridColor} }
                    }
                }
            });

        } else if (type === 'donut') {
            var cats = [], vals = [], bgColors = [];
            allCats.forEach(function(cat, idx) {
                var actual = (data[cat.key]||{}).a || 0;
                if (actual > 0) { cats.push(cat.icon+' '+cat.key); vals.push(actual); bgColors.push(_BT_COLORS[idx % _BT_COLORS.length]); }
            });
            if (vals.length === 0) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.fillStyle = 'rgba(255,255,255,0.3)';
                ctx.font = '12px Inter, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(_btT('bt.chart.donut.empty','Enter actual spend to see breakdown'), canvas.width/2, canvas.height/2);
                return;
            }
            window._btChartInst = new Chart(ctx, {
                type: 'doughnut',
                data: { labels:cats, datasets:[{ data:vals, backgroundColor:bgColors, borderColor:'rgba(0,0,0,0.25)', borderWidth:2 }] },
                options: {
                    responsive:true, maintainAspectRatio:false, cutout:'52%',
                    plugins: {
                        legend: { position:'bottom', labels:{color:legendColor,font:{size:9},padding:6} },
                        tooltip: { callbacks:{ label:function(c){
                            var total = c.dataset.data.reduce(function(a,b){return a+b;},0);
                            var pct   = total>0 ? Math.round(c.parsed/total*100) : 0;
                            return c.label+': ₹'+c.parsed.toLocaleString('en-IN')+' ('+pct+'%)';
                        } } }
                    }
                }
            });
        }
    }

    // ── Emergency Fund section ─────────────────────────────────
    var _btEFMonths = 3;

    function _btSetEFMonths(m) {
        _btEFMonths = m;
        [3, 6, 12].forEach(function (n) {
            var btn = document.getElementById('bt-ef-btn-' + n);
            if (btn) btn.classList.toggle('on', n === m);
        });
        _btRenderEF();
    }
    window._btSetEFMonths = _btSetEFMonths;

    // Full-month expense estimate for the EF target — anchored to the
    // calendar, never to the viewed month. Mid-month "actual so far" is NOT a
    // month's expenses, so the basis prefers, in order:
    //   1. average of the last ≤3 completed months with spends (≤6 months old)
    //   2. current month's pace projection (fixed + variable run-rate), day ≥5
    //   3. current month's budget
    //   4. current month's actual so far (floor, better than nothing)
    function _btEFBasis() {
        var cur = _btNow();
        var cd = new Date();
        cd.setMonth(cd.getMonth() - 6);
        var cutoff = cd.getFullYear() + '-' + _btPad2(cd.getMonth() + 1);

        var months = Object.keys(window._btData)
            .filter(function (k) { return /^\d{4}-\d{2}$/.test(k) && k < cur && k >= cutoff; })
            .sort()
            .reverse();
        var sums = [];
        for (var i = 0; i < months.length && sums.length < 3; i++) {
            var tot = _btMonthTotals(months[i]).actual;
            if (tot > 0) sums.push(tot);
        }
        if (sums.length) {
            var avg = Math.round(sums.reduce(function (a, b) { return a + b; }, 0) / sums.length);
            return { monthly: avg, kind: 'avg', n: sums.length };
        }

        var curTot = _btMonthTotals(cur);
        var p = _btProjectCurrentMonth();
        if (curTot.actual > 0 && p.day >= _BT_PACE_MIN_DAY) return { monthly: p.totalProj, kind: 'proj' };
        if (curTot.budget > 0) return { monthly: curTot.budget, kind: 'budget' };
        if (curTot.actual > 0) return { monthly: curTot.actual, kind: 'actual' };
        return { monthly: 0 };
    }

    function _btRenderEF() {
        var basis   = _btEFBasis();
        var monthly = basis.monthly;
        var fmt = function (v) {
            return '₹' + v.toLocaleString('en-IN');
        };

        var basisEl = document.getElementById('bt-ef-basis');
        var resEl   = document.getElementById('bt-ef-result');
        var lblEl   = document.getElementById('bt-ef-result-label');
        var el3     = document.getElementById('bt-ef-3m');
        var el6     = document.getElementById('bt-ef-6m');
        var el12    = document.getElementById('bt-ef-12m');
        if (!resEl) return;

        if (monthly === 0) {
            resEl.textContent = '—';
            if (lblEl) lblEl.textContent = _btT('bt.ef.empty','Fill in your monthly expenses above to see your target');
            if (basisEl) basisEl.textContent = _btT('bt.ef.basis.default','Based on your monthly expenses');
            if (el3)  el3.textContent  = '—';
            if (el6)  el6.textContent  = '—';
            if (el12) el12.textContent = '—';
            return;
        }

        if (basisEl) {
            var basisTxt;
            if (basis.kind === 'avg') {
                basisTxt = basis.n === 1
                    ? _btT('bt.ef.basis.avg1', "Based on last month's spend of {amount}")
                    : _btT('bt.ef.basis.avg', 'Based on your average spend of {amount}/month over the last {n} months').replace('{n}', basis.n);
            } else if (basis.kind === 'proj') {
                basisTxt = _btT('bt.ef.basis.proj', "Based on this month's projected spend of {amount}");
            } else if (basis.kind === 'budget') {
                basisTxt = _btT('bt.ef.basis.budgeted', 'Based on budgeted amount of {amount} / month');
            } else {
                basisTxt = _btT('bt.ef.basis.actual', 'Based on actual spend of {amount} / month');
            }
            basisEl.textContent = basisTxt.replace('{amount}', fmt(monthly));
        }

        var target = monthly * _btEFMonths;
        resEl.textContent = fmt(target);
        if (lblEl) lblEl.textContent = _btT('bt.ef.target','{n}-month emergency corpus target').replace('{n}', _btEFMonths);
        if (typeof window.saveToolSummary === 'function')
            window.saveToolSummary('budgetTracker', { efTarget: target, efMonths: _btEFMonths, monthlyExpenses: monthly });

        if (el3)  el3.textContent  = fmt(monthly * 3);
        if (el6)  el6.textContent  = fmt(monthly * 6);
        if (el12) el12.textContent = fmt(monthly * 12);
    }

    // ── Refresh all ────────────────────────────────────────────
    function _btRefreshAll() {
        _btRenderMonthDisplay();
        _btRenderQaCats();
        _btSyncQaDate();
        _btRenderRecurring();
        _btRenderTable();
        _btRenderSummary();
        _btRenderTxList();
        _btSetChartType(window._btChartType || 'bar');
    }

    // ── Public init ────────────────────────────────────────────
    function initBudgetTracker() {
        if (!window._btMonth) window._btMonth = _btNow();
        _btMigrate();
        _btAutoPostRecurring();
        _btRefreshAll();
    }
    window.initBudgetTracker = initBudgetTracker;

})();
