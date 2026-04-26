/* ══════════════════════════════════════════════════════════
   BUDGET & EXPENSE TRACKER
══════════════════════════════════════════════════════════ */
(function () {
    var _MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

    var _BT_CATS = [
        { key:'Housing',      icon:'🏠', hint:'Rent · EMI · Maintenance' },
        { key:'Food',         icon:'🍽️', hint:'Groceries · Dining · Delivery' },
        { key:'Transport',    icon:'🚌', hint:'Fuel · Cab · Public transport' },
        { key:'EMIs & Loans', icon:'💳', hint:'Personal loan · Credit card' },
        { key:'Entertainment',icon:'🎬', hint:'OTT · Movies · Outings' },
        { key:'Health',       icon:'💊', hint:'Doctor · Medicines · Gym' },
        { key:'Shopping',     icon:'🛍️', hint:'Clothes · Electronics · Gifts' },
        { key:'Utilities',    icon:'⚡', hint:'Electricity · Water · Internet' },
        { key:'Education',    icon:'📚', hint:'School · Courses · Books' },
        { key:'Others',       icon:'💸', hint:'Miscellaneous expenses' }
    ];

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

    function _btFmt(n) { return n ? n.toLocaleString('en-IN') : ''; }

    function _btFormatInput(el) {
        var raw = (el.value || '').replace(/[^0-9]/g, '');
        el.value = raw ? parseInt(raw, 10).toLocaleString('en-IN') : '';
    }

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
            if (nameEl) { nameEl.style.borderColor = '#f59e0b'; nameEl.placeholder = 'Already exists!'; }
            return;
        }
        window._btCustomCats.push({ key: name, icon: '📌' });
        if (nameEl) { nameEl.value = ''; nameEl.style.borderColor = ''; nameEl.placeholder = 'Category name…'; }
        _btRenderTable();
        _btRenderSummary();
        _btRenderChart();
        if (typeof saveUserData === 'function') saveUserData();
    }
    window._btAddCustomCat = _btAddCustomCat;

    function _btDeleteCustomCat(key) {
        window._btCustomCats = window._btCustomCats.filter(function (c) { return c.key !== key; });
        // Also wipe from all months so chart data is clean
        Object.keys(window._btData).forEach(function (m) { delete window._btData[m][key]; });
        _btRenderTable();
        _btRenderSummary();
        _btRenderChart();
        if (typeof saveUserData === 'function') saveUserData();
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
    }

    // ── Render: category table ─────────────────────────────────
    function _btMakeDiffHtml(budget, actual) {
        var over = budget > 0 && actual > budget;
        var diff = budget - actual;
        if (budget === 0 && actual === 0) return '<span style="color:#94a3b8;font-size:10px;">—</span>';
        if (over) return '<span style="color:#ef4444;font-weight:700;font-size:10px;">⚠ +₹' + _btFmt(Math.abs(diff)) + '</span>';
        if (budget > 0) return '<span style="color:#16a34a;font-size:10px;">✓ ₹' + (diff === 0 ? '0' : _btFmt(diff)) + ' left</span>';
        return '<span style="color:#94a3b8;font-size:10px;">no budget</span>';
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
                            '<div style="font-size:9px;color:#94a3b8;">Custom</div>' +
                        '</div>' +
                        '<button onclick="window._btDeleteCustomCat(' + JSON.stringify(cat.key) + ')" title="Remove category" ' +
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
                            '<div style="font-size:11px;font-weight:700;color:#1e293b;">' + cat.key + '</div>' +
                            '<div style="font-size:9px;color:#94a3b8;line-height:1.2;">' + cat.hint + '</div>' +
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
                    ' value="' + bStr + '" placeholder="Budget"' +
                    ' class="bt-num-inp' + (bStr ? '' : ' text-slate-400') + '"' +
                    ' onfocus="window._btInputFocus(this)" oninput="window._btInputChange(this)" onblur="window._btInputBlur(this)">' +
                '</div>' +
            '</td>' +
            '<td style="padding:5px 4px;border-bottom:1px solid #f1f5f9;">' +
                '<div style="position:relative;">' +
                    '<span style="position:absolute;left:7px;top:50%;transform:translateY(-50%);font-size:10px;color:#94a3b8;pointer-events:none;font-weight:700;">₹</span>' +
                    '<input type="text" inputmode="numeric"' +
                    ' data-cat="' + _btEsc(cat.key) + '" data-field="a"' +
                    ' value="' + aStr + '" placeholder="Spent"' +
                    ' class="bt-num-inp' + (aStr ? '' : ' text-slate-400') + '"' +
                    ' onfocus="window._btInputFocus(this)" oninput="window._btInputChange(this)" onblur="window._btInputBlur(this)">' +
                '</div>' +
            '</td>' +
            '<td style="padding:5px 8px;text-align:right;border-bottom:1px solid #f1f5f9;">' + _btMakeDiffHtml(budget, actual) + '</td>';
        return tr;
    }

    function _btEsc(s) {
        return String(s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
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
                    '<input id="bt-new-cat-name" type="text" maxlength="30" placeholder="Category name…" ' +
                        'style="flex:1;padding:5px 8px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:7px;font-size:11px;font-weight:600;color:#1e293b;outline:none;" ' +
                        'onkeydown="window._btNewCatKeydown(event)" ' +
                        'onfocus="this.style.borderColor=\'#6366f1\';" ' +
                        'onblur="this.style.borderColor=\'#e2e8f0\';">' +
                    '<button onclick="window._btAddCustomCat()" ' +
                        'style="padding:5px 12px;border-radius:7px;font-size:11px;font-weight:700;background:#6366f1;color:#fff;border:none;cursor:pointer;white-space:nowrap;flex-shrink:0;" ' +
                        'onmouseover="this.style.background=\'#4f46e5\';" onmouseout="this.style.background=\'#6366f1\';">+ Add</button>' +
                '</div>' +
                '<div style="font-size:9px;color:#94a3b8;margin-top:3px;margin-left:22px;">Type your category name and press Enter or click Add</div>' +
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
        if (typeof saveUserData === 'function') saveUserData();
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
                dEl.textContent = '₹' + _btFmt(diff) + ' saved'; dEl.style.color = '#16a34a';
            } else {
                dEl.textContent = '₹' + _btFmt(Math.abs(diff)) + ' over'; dEl.style.color = '#dc2626';
            }
        }

        var oEl = document.getElementById('bt-sum-outliers');
        if (oEl) {
            oEl.textContent = t.over > 0
                ? t.over + ' categor' + (t.over === 1 ? 'y' : 'ies') + ' over budget'
                : t.budget > 0 ? 'All categories within budget ✓' : 'Set budgets to track spending';
            oEl.style.color = t.over > 0 ? '#dc2626' : t.budget > 0 ? '#16a34a' : '#94a3b8';
        }

        var barEl = document.getElementById('bt-bar-fill');
        if (barEl) {
            barEl.style.width      = Math.min(pct, 100) + '%';
            barEl.style.background = pct > 100 ? '#ef4444' : pct > 80 ? '#f59e0b' : '#22c55e';
        }
        var pctEl = document.getElementById('bt-bar-pct');
        if (pctEl) pctEl.textContent = t.budget > 0 ? pct + '% of budget used' : '';

        _btRenderEF();
    }

    // ── Render: chart ──────────────────────────────────────────
    var _BT_CHART_DESC = {
        bar:   'Budget vs Actual spend per category this month',
        line:  'Total monthly spend over the last 12 months',
        donut: 'Actual spend split by category this month'
    };

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
        var descEl = document.getElementById('bt-chart-desc');
        if (descEl) descEl.textContent = _BT_CHART_DESC[type] || '';
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
                        { label:'Budget', data:budgets, backgroundColor:'rgba(99,102,241,0.55)', borderColor:'#6366f1', borderWidth:1, borderRadius:4 },
                        { label:'Actual', data:actuals,
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
                        { label:'Actual Spend', data:totals, borderColor:'#6366f1', backgroundColor:'rgba(99,102,241,0.12)', pointBackgroundColor:'#a5b4fc', pointRadius:4, fill:true, tension:0.35 },
                        { label:'Budget',       data:budgetLines, borderColor:'#f59e0b', backgroundColor:'transparent', borderDash:[4,3], pointRadius:3, pointBackgroundColor:'#fbbf24', fill:false, tension:0.35 }
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
                ctx.fillText('Enter actual spend to see breakdown', canvas.width/2, canvas.height/2);
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
            if (lblEl) lblEl.textContent = 'Fill in your monthly expenses above to see your target';
            if (basisEl) basisEl.textContent = 'Based on your monthly expenses';
            if (el3)  el3.textContent  = '—';
            if (el6)  el6.textContent  = '—';
            if (el12) el12.textContent = '—';
            return;
        }

        var source = t.actual > 0 ? 'actual spend' : 'budgeted amount';
        if (basisEl) basisEl.textContent = 'Based on ' + source + ' of ' + fmt(monthly) + ' / month';

        var target = monthly * _btEFMonths;
        resEl.textContent = fmt(target);
        if (lblEl) lblEl.textContent = _btEFMonths + '-month emergency corpus target';
        if (typeof window.saveToolSummary === 'function')
            window.saveToolSummary('budgetTracker', { efTarget: target, efMonths: _btEFMonths, monthlyExpenses: monthly });

        if (el3)  el3.textContent  = fmt(monthly * 3);
        if (el6)  el6.textContent  = fmt(monthly * 6);
        if (el12) el12.textContent = fmt(monthly * 12);
    }

    // ── Refresh all ────────────────────────────────────────────
    function _btRefreshAll() {
        _btRenderMonthDisplay();
        _btRenderTable();
        _btRenderSummary();
        _btSetChartType(window._btChartType || 'bar');
    }

    // ── Public init ────────────────────────────────────────────
    function initBudgetTracker() {
        if (!window._btMonth) window._btMonth = _btNow();
        _btRefreshAll();
    }
    window.initBudgetTracker = initBudgetTracker;

})();
