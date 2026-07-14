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

    // ── Custom category management ─────────────────────────────
    function _btAddCustomCat() {
        var nameEl = document.getElementById('bt-new-cat-name');
        var name = (nameEl ? nameEl.value : '').trim();
        if (!name) { if (nameEl) { nameEl.focus(); nameEl.style.borderColor = '#ef4444'; } return; }
        // Dedup check (case-insensitive)
        var allKeys = _btAllCats().map(function (c) { return c.key.toLowerCase(); });
        if (allKeys.indexOf(name.toLowerCase()) !== -1) {
            if (nameEl) { nameEl.style.borderColor = '#f59e0b'; nameEl.placeholder = _btT('bt.cat.exists','Already exists!'); }
            return;
        }
        window._btCustomCats.push({ key: name, icon: '📌' });
        if (nameEl) { nameEl.value = ''; nameEl.style.borderColor = ''; nameEl.placeholder = _btT('bt.cat.placeholder','Category name…'); }
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
        if (window._btQaCat === key) window._btQaCat = null;
        _btRefreshAll();
        _btTouchAndSave();
    }
    window._btDeleteCustomCat = _btDeleteCustomCat;

    // Allow Enter key in the add-category input to confirm
    function _btNewCatKeydown(e) {
        if (e.key === 'Enter') { e.preventDefault(); _btAddCustomCat(); }
        var nameEl = document.getElementById('bt-new-cat-name');
        if (nameEl) nameEl.style.borderColor = '';
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
    function _btMakeDiffHtml(budget, actual) {
        var over = budget > 0 && actual > budget;
        var diff = budget - actual;
        if (budget === 0 && actual === 0) return '<span style="color:#94a3b8;font-size:10px;">—</span>';
        if (over) return '<span style="color:#ef4444;font-weight:700;font-size:10px;">⚠ +₹' + _btFmt(Math.abs(diff)) + '</span>';
        if (budget > 0) return '<span style="color:#16a34a;font-size:10px;">✓ ₹' + (diff === 0 ? '0' : _btFmt(diff)) + ' ' + _btT('bt.status.left','left') + '</span>';
        return '<span style="color:#94a3b8;font-size:10px;">' + _btT('bt.status.nobudget','no budget') + '</span>';
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
                '<td style="padding:5px 8px;border-bottom:1px solid #f1f5f9;">' +
                    '<div style="display:flex;align-items:center;gap:5px;">' +
                        '<span style="font-size:14px;flex-shrink:0;">' + cat.icon + '</span>' +
                        '<div style="flex:1;min-width:0;">' +
                            '<div style="font-size:11px;font-weight:700;color:#1e293b;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + _btEsc(cat.key) + '</div>' +
                            '<div style="font-size:9px;color:#94a3b8;">' + _btT('bt.cat.custom','Custom') + '</div>' +
                        '</div>' +
                        // key goes into an onclick JS string inside an HTML attribute:
                        // JS-escape first, then HTML-escape the result
                        '<button onclick="window._btDeleteCustomCat(\'' + _btEsc(String(cat.key).replace(/\\/g, '\\\\').replace(/'/g, "\\'")) + '\')" title="' + _btEsc(_btT('bt.cat.remove','Remove category')) + '" ' +
                            'style="flex-shrink:0;padding:2px 5px;border-radius:5px;font-size:10px;font-weight:900;color:#94a3b8;background:transparent;border:1px solid #e2e8f0;cursor:pointer;line-height:1;" ' +
                            'onmouseover="this.style.color=\'#ef4444\';this.style.borderColor=\'#fca5a5\';" ' +
                            'onmouseout="this.style.color=\'#94a3b8\';this.style.borderColor=\'#e2e8f0\';">×</button>' +
                    '</div>' +
                '</td>';
        } else {
            catCell =
                '<td style="padding:5px 8px;white-space:nowrap;border-bottom:1px solid #f1f5f9;">' +
                    '<div style="display:flex;align-items:center;gap:5px;">' +
                        '<span style="font-size:14px;flex-shrink:0;">' + cat.icon + '</span>' +
                        '<div>' +
                            '<div style="font-size:11px;font-weight:700;color:#1e293b;">' + _btCatLabel(cat) + '</div>' +
                            '<div style="font-size:9px;color:#94a3b8;line-height:1.2;">' + _btCatHint(cat) + '</div>' +
                        '</div>' +
                    '</div>' +
                '</td>';
        }

        var tr = document.createElement('tr');
        tr.style.cssText = over ? 'background:#fef2f2;' : '';
        tr.setAttribute('data-cat-row', cat.key);
        tr.innerHTML =
            catCell +
            '<td style="padding:5px 4px;border-bottom:1px solid #f1f5f9;">' +
                '<div style="position:relative;">' +
                    '<span style="position:absolute;left:7px;top:50%;transform:translateY(-50%);font-size:10px;color:#94a3b8;pointer-events:none;font-weight:700;">₹</span>' +
                    '<input type="text" inputmode="numeric"' +
                    ' data-cat="' + _btEsc(cat.key) + '" data-field="b"' +
                    ' value="' + bStr + '" placeholder="' + _btEsc(_btT('bt.input.budget','Budget')) + '"' +
                    ' class="bt-num-inp' + (bStr ? '' : ' text-slate-400') + '"' +
                    ' onfocus="window._btInputFocus(this)" oninput="window._btInputChange(this)" onblur="window._btInputBlur(this)">' +
                '</div>' +
            '</td>' +
            '<td style="padding:5px 4px;border-bottom:1px solid #f1f5f9;">' +
                '<div class="bt-spent-cell">' +
                    '<span class="bt-spent-val' + (actual ? '' : ' bt-spent-zero') + '" data-spent-cat="' + _btEsc(cat.key) + '">' +
                        (actual ? '₹' + aStr : '—') +
                    '</span>' +
                    '<button class="bt-row-add" onclick="window._btRowAdd(\'' + _btEsc(String(cat.key).replace(/\\/g, '\\\\').replace(/'/g, "\\'")) + '\')" ' +
                        'title="' + _btEsc(_btT('bt.row.addtx','Add expense')) + '">+</button>' +
                '</div>' +
            '</td>' +
            '<td style="padding:5px 8px;text-align:right;border-bottom:1px solid #f1f5f9;">' + _btMakeDiffHtml(budget, actual) + '</td>';
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
            '<td colspan="4" style="padding:6px 8px;border-top:2px dashed #e2e8f0;">' +
                '<div style="display:flex;align-items:center;gap:6px;">' +
                    '<span style="font-size:14px;">📌</span>' +
                    '<input id="bt-new-cat-name" type="text" maxlength="30" placeholder="' + _btEsc(_btT('bt.cat.placeholder','Category name…')) + '" ' +
                        'style="flex:1;padding:5px 8px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:7px;font-size:11px;font-weight:600;color:#1e293b;outline:none;" ' +
                        'onkeydown="window._btNewCatKeydown(event)" ' +
                        'onfocus="this.style.borderColor=\'#6366f1\';" ' +
                        'onblur="this.style.borderColor=\'#e2e8f0\';">' +
                    '<button onclick="window._btAddCustomCat()" ' +
                        'style="padding:5px 12px;border-radius:7px;font-size:11px;font-weight:700;background:#6366f1;color:#fff;border:none;cursor:pointer;white-space:nowrap;flex-shrink:0;" ' +
                        'onmouseover="this.style.background=\'#4f46e5\';" onmouseout="this.style.background=\'#6366f1\';">' + _btT('bt.cat.add','+ Add') + '</button>' +
                '</div>' +
                '<div style="font-size:9px;color:#94a3b8;margin-top:3px;margin-left:22px;">' + _btT('bt.cat.hint','Type your category name and press Enter or click Add') + '</div>' +
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

        row.style.background = over ? '#fef2f2' : '';

        var tds    = row.querySelectorAll('td');
        var diffTd = tds[tds.length - 1];
        if (diffTd) diffTd.innerHTML = _btMakeDiffHtml(budget, actual);
    }

    window._btInputFocus  = _btInputFocus;
    window._btInputChange = _btInputChange;
    window._btInputBlur   = _btInputBlur;

    // ── Quick-add expense bar ──────────────────────────────────
    window._btQaCat = window._btQaCat || null;   // selected category chip
    var _btQaEditId = null;                      // tx id being edited (null = adding)

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
            var b = document.createElement('button');
            b.type = 'button';
            b.className = 'bt-chip' + (window._btQaCat === cat.key ? ' bt-chip-on' : '');
            b.textContent = cat.icon + ' ' + (cat.custom ? cat.key : _btCatLabel(cat));
            b.onclick = function () { _btPickQaCat(cat.key); };
            wrap.appendChild(b);
        });
    }

    function _btPickQaCat(key) {
        window._btQaCat = key;
        _btRenderQaCats();
        var wrap = document.getElementById('bt-qa-cats');
        if (wrap) wrap.classList.remove('bt-qa-flash');
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
        if (card)   card.classList.toggle('bt-qa-editing', editing);
        if (btn)    btn.textContent = editing ? _btT('bt.qa.update', '✓ Update') : _btT('bt.qa.add', '+ Add');
        if (cancel) cancel.style.display = editing ? '' : 'none';
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
            tx.push(t);
        }

        _btRecalcMonth(data);
        if (amtEl)  amtEl.value = '';
        if (noteEl) noteEl.value = '';
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
            var name = cat.custom || !cat.tkey ? cat.key : _btCatLabel(cat);
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

    // ── Render: summary cards ──────────────────────────────────
    function _btRenderSummary() {
        var t   = _btGetTotals();
        var pct = t.budget > 0 ? Math.round(t.actual / t.budget * 100) : 0;

        var bEl = document.getElementById('bt-sum-budget');
        if (bEl) bEl.textContent = t.budget ? '₹' + _btFmt(t.budget) : '—';

        var aEl = document.getElementById('bt-sum-actual');
        if (aEl) {
            aEl.textContent = t.actual ? '₹' + _btFmt(t.actual) : '—';
            aEl.style.color = (t.budget > 0 && t.actual > t.budget) ? '#dc2626' : '#16a34a';
        }

        var diff = t.budget - t.actual;
        var dEl  = document.getElementById('bt-sum-diff');
        if (dEl) {
            if (t.budget === 0) {
                dEl.textContent = '—'; dEl.style.color = '#94a3b8';
            } else if (diff >= 0) {
                dEl.textContent = '₹' + _btFmt(diff) + ' ' + _btT('bt.sum.diff.saved','saved'); dEl.style.color = '#16a34a';
            } else {
                dEl.textContent = '₹' + _btFmt(Math.abs(diff)) + ' ' + _btT('bt.sum.diff.over','over'); dEl.style.color = '#dc2626';
            }
        }

        var oEl = document.getElementById('bt-sum-outliers');
        if (oEl) {
            oEl.textContent = t.over > 0
                ? t.over + (t.over === 1 ? _btT('bt.status.over.single',' category over budget') : _btT('bt.status.over.plural',' categories over budget'))
                : t.budget > 0 ? _btT('bt.sum.allok','All categories within budget ✓') : _btT('bt.sum.empty','Set budgets to track spending');
            oEl.style.color = t.over > 0 ? '#dc2626' : t.budget > 0 ? '#16a34a' : '#94a3b8';
        }

        var barEl = document.getElementById('bt-bar-fill');
        if (barEl) {
            barEl.style.width      = Math.min(pct, 100) + '%';
            barEl.style.background = pct > 100 ? '#ef4444' : pct > 80 ? '#f59e0b' : '#22c55e';
        }
        var pctEl = document.getElementById('bt-bar-pct');
        if (pctEl) pctEl.textContent = t.budget > 0 ? pct + _btT('bt.pct.used','% of budget used') : '';

        _btRenderEF();
    }

    // ── Render: chart ──────────────────────────────────────────
    function _btSetChartType(type) {
        window._btChartType = type;
        ['bar', 'line', 'donut'].forEach(function (t) {
            var btn = document.getElementById('bt-tab-' + t);
            if (!btn) return;
            var active = t === type;
            btn.style.background  = active ? 'rgba(99,102,241,0.2)' : 'transparent';
            btn.style.borderColor = active ? 'rgba(99,102,241,0.6)' : 'rgba(255,255,255,0.12)';
            btn.style.color       = active ? '#c7d2fe'              : 'rgba(255,255,255,0.45)';
            btn.style.fontWeight  = active ? '700' : '500';
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
            if (!btn) return;
            var active = n === m;
            btn.style.background   = active ? '#fbbf24' : 'transparent';
            btn.style.borderColor  = active ? '#fbbf24' : '#e2e8f0';
            btn.style.color        = '#78350f';
        });
        _btRenderEF();
    }
    window._btSetEFMonths = _btSetEFMonths;

    function _btRenderEF() {
        var t = _btGetTotals();
        var monthly = t.actual > 0 ? t.actual : t.budget;
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

        var basisKey = t.actual > 0 ? 'bt.ef.basis.actual' : 'bt.ef.basis.budgeted';
        var basisFb  = t.actual > 0 ? 'Based on actual spend of {amount} / month' : 'Based on budgeted amount of {amount} / month';
        if (basisEl) basisEl.textContent = _btT(basisKey, basisFb).replace('{amount}', fmt(monthly));

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
        _btRenderTable();
        _btRenderSummary();
        _btRenderTxList();
        _btSetChartType(window._btChartType || 'bar');
    }

    // ── Public init ────────────────────────────────────────────
    function initBudgetTracker() {
        if (!window._btMonth) window._btMonth = _btNow();
        _btMigrate();
        _btRefreshAll();
    }
    window.initBudgetTracker = initBudgetTracker;

})();
