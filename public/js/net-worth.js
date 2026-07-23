    /* ══════════════════════════════════════════════════════════
       NET WORTH TRACKER — Wealth Cockpit (royal-dark glass)
    ══════════════════════════════════════════════════════════ */

    function _nw(key, fallback) {
        if (typeof _t === 'function') { var v = _t(key); if (v && v !== key) return v; }
        return fallback;
    }

    // Pro-set icon helper (js/icons.js). Falls back to empty string.
    function _nwIco(mode) {
        return (typeof window._svgIcon === 'function') ? window._svgIcon(mode, '') : '';
    }

    var _nwGauge      = null;
    var _nwDials      = { debt: null, inv: null, liq: null };
    var _nwCockTrend  = null;
    var _nwTrendChart = null;
    var _nwHistory    = []; // [{m:'YYYY-MM', nw:N, a:N, l:N}, ...]

    var _nwAssetFields = [
        'nw-savings','nw-fd',
        'nw-stocks','nw-eq-mf',
        'nw-epf','nw-ppf','nw-nps',
        'nw-debt-mf',
        'nw-home','nw-property',
        'nw-gold-phys','nw-gold-paper',
        'nw-crypto','nw-ins-sv','nw-other-assets'
    ];
    var _nwLiabFields = [
        'nw-liab-home','nw-liab-car',
        'nw-liab-pl','nw-liab-edu',
        'nw-liab-cc','nw-liab-other'
    ];
    var _nwAllFields = _nwAssetFields.concat(_nwLiabFields);

    function nwFmt(n) {
        var a = Math.abs(n), s = n < 0 ? '-' : '';
        if (a >= 1e7) return s + '₹' + (a / 1e7).toFixed(2) + ' Cr';
        if (a >= 1e5) return s + '₹' + (a / 1e5).toFixed(2) + ' L';
        return s + '₹' + Math.round(a).toLocaleString('en-IN');
    }

    function nwNum(id) {
        return parseFloat((document.getElementById(id)?.value || '').replace(/,/g, '')) || 0;
    }

    function nwFmtInput(el) {
        var raw = (el.value || '').replace(/[^0-9]/g, '');
        el.value = raw ? Number(raw).toLocaleString('en-IN') : '';
    }

    // Swap [data-nwicon] placeholders for the professional SVG icon set.
    function nwApplyIcons() {
        var nodes = document.querySelectorAll('#networth-panel [data-nwicon]');
        for (var i = 0; i < nodes.length; i++) {
            var key = nodes[i].getAttribute('data-nwicon');
            var svg = _nwIco(key);
            if (svg) nodes[i].innerHTML = svg;
        }
    }

    function initNetWorth() {
        nwApplyIcons();
        _nwAllFields.forEach(function(id) {
            var el = document.getElementById(id);
            if (!el) return;
            if (!el.value || el.value === '0') {
                el.value = '0';
                el.classList.add('text-slate-400');
            } else {
                el.classList.remove('text-slate-400');
            }
        });
        nwCalc();
    }

    function resetNetWorth() {
        _nwAllFields.forEach(function(id) {
            var el = document.getElementById(id);
            if (!el) return;
            el.value = '0';
            el.classList.add('text-slate-400');
        });
        nwCalc();
        if (typeof saveUserData === 'function') saveUserData();
    }

    function nwCalc() {
        var savings   = nwNum('nw-savings');
        var fd        = nwNum('nw-fd');
        var stocks    = nwNum('nw-stocks');
        var eqMf      = nwNum('nw-eq-mf');
        var epf       = nwNum('nw-epf');
        var ppf       = nwNum('nw-ppf');
        var nps       = nwNum('nw-nps');
        var debtMf    = nwNum('nw-debt-mf');
        var home      = nwNum('nw-home');
        var property  = nwNum('nw-property');
        var goldPhys  = nwNum('nw-gold-phys');
        var goldPaper = nwNum('nw-gold-paper');
        var crypto    = nwNum('nw-crypto');
        var insSv     = nwNum('nw-ins-sv');
        var other     = nwNum('nw-other-assets');

        var liabHome  = nwNum('nw-liab-home');
        var liabCar   = nwNum('nw-liab-car');
        var liabPl    = nwNum('nw-liab-pl');
        var liabEdu   = nwNum('nw-liab-edu');
        var liabCc    = nwNum('nw-liab-cc');
        var liabOther = nwNum('nw-liab-other');

        var catLiquid = savings + fd;
        var catEquity = stocks + eqMf;
        var catRetire = epf + ppf + nps + debtMf;
        var catRealty = home + property;
        var catGold   = goldPhys + goldPaper;
        var catOther  = crypto + insSv + other;

        var totalAssets = catLiquid + catEquity + catRetire + catRealty + catGold + catOther;
        var totalLiab   = liabHome + liabCar + liabPl + liabEdu + liabCc + liabOther;
        var netWorth    = totalAssets - totalLiab;

        if (totalAssets > 0 || totalLiab > 0) {
            if (typeof window.saveToolSummary === 'function')
                window.saveToolSummary('netWorth', {
                    totalAssets: totalAssets, totalLiab: totalLiab, netWorth: netWorth,
                    // Category breakdown — lets other tools (e.g. FinHealth Score) auto-fill
                    // from tracked net worth without needing the panel loaded in the DOM.
                    equity: stocks + eqMf, debtMf: debtMf, retiral: epf + ppf + nps,
                    realty: home + property, gold: goldPhys + goldPaper,
                    other: crypto + insSv + other,
                    // Granular per-instrument values — lets Financial Plan map each asset
                    // back into its own "existing investment" bucket without the NW panel
                    // being in the DOM. Backward-compatible: aggregate fields above unchanged.
                    detail: {
                        fd: fd, stocks: stocks, eqMf: eqMf, debtMf: debtMf,
                        epf: epf, ppf: ppf, nps: nps,
                        home: home, property: property,
                        goldPhys: goldPhys, goldPaper: goldPaper,
                        crypto: crypto, insSv: insSv
                    }
                });
        }

        // ── Hero net worth + summary cards ──
        var nwEl = document.getElementById('nw-net-worth');
        if (nwEl) {
            nwEl.textContent = nwFmt(netWorth);
            nwEl.style.color = netWorth >= 0 ? '#34d399' : '#f87171';
        }
        var astEl = document.getElementById('nw-total-assets');
        if (astEl) astEl.textContent = nwFmt(totalAssets);
        var lbEl = document.getElementById('nw-total-liab');
        if (lbEl) lbEl.textContent = nwFmt(totalLiab);

        // ── Ratios ──
        var dtar   = totalAssets > 0 ? (totalLiab / totalAssets * 100) : 0;
        var invPct = totalAssets > 0 ? ((catEquity + catRetire) / totalAssets * 100) : 0;
        var liqPct = totalAssets > 0 ? (catLiquid / totalAssets * 100) : 0;

        var dtarEl = document.getElementById('nw-dtar');
        if (dtarEl) dtarEl.textContent = dtar.toFixed(0) + '%';
        var invEl = document.getElementById('nw-inv-ratio');
        if (invEl) invEl.textContent = invPct.toFixed(0) + '%';
        var liqEl = document.getElementById('nw-liq-ratio');
        if (liqEl) liqEl.textContent = liqPct.toFixed(0) + '%';

        // ── Gauge + dials ──
        var dtarColor = dtar <= 30 ? '#34d399' : dtar <= 50 ? '#fbbf24' : '#f87171';
        nwRenderGauge(netWorth, totalAssets, totalLiab);
        nwRenderDial('debt', dtar,   dtarColor);
        nwRenderDial('inv',  invPct, '#60a5fa');
        nwRenderDial('liq',  liqPct, '#a78bfa');

        // ── Allocation tiles ──
        nwRenderTiles([
            { label: _nw('nw.bk.realty', 'Real Estate'), val: catRealty, color: '#3b82f6', icon: 'nw.realestate' },
            { label: _nw('nw.bk.equity', 'Equity'),      val: catEquity, color: '#34d399', icon: 'nw.equity' },
            { label: _nw('nw.bk.retire', 'Retirement'),  val: catRetire, color: '#a78bfa', icon: 'nw.retire' },
            { label: _nw('nw.bk.liquid', 'Liquid'),      val: catLiquid, color: '#22d3ee', icon: 'nw.liquid' },
            { label: _nw('nw.bk.gold',   'Gold'),        val: catGold,   color: '#eab308', icon: 'nw.gold' },
            { label: _nw('nw.bk.other',  'Other'),       val: catOther,  color: '#94a3b8', icon: 'ctcoptimizer' }
        ], totalAssets);

        // ── Milestone + insight ──
        nwRenderMilestone(netWorth);
        nwRenderInsight(dtar, liqPct, invPct, catGold + catOther, crypto, insSv, totalAssets);

        // ── History snapshot + trend charts ──
        nwSnapshotMonth(totalAssets, totalLiab, netWorth);
        nwRenderCockpitTrend();
        nwRenderTrend();

        if (typeof saveUserData === 'function') saveUserData();
    }

    // ── Central gauge: share of assets you own vs owe ────────────────
    function nwRenderGauge(nw, assets, liab) {
        var c = document.getElementById('nw-gauge');
        if (!c) return;
        if (_nwGauge) { _nwGauge.destroy(); _nwGauge = null; }
        var owned = Math.max(nw, 0);
        var data  = assets > 0 ? [owned, liab] : [0, 1];
        var col   = nw >= 0 ? '#34d399' : '#f87171';
        _nwGauge = new Chart(c.getContext('2d'), {
            type: 'doughnut',
            data: { datasets: [{ data: data, backgroundColor: [col, 'rgba(255,255,255,0.08)'], borderWidth: 0 }] },
            options: {
                responsive: true, maintainAspectRatio: false, cutout: '78%',
                plugins: { legend: { display: false }, tooltip: { enabled: false } }
            }
        });
    }

    // ── Ratio dial (0–100 progress ring) ─────────────────────────────
    function nwRenderDial(which, pct, color) {
        var c = document.getElementById('nw-dial-' + which);
        if (!c) return;
        if (_nwDials[which]) { _nwDials[which].destroy(); _nwDials[which] = null; }
        var v = Math.max(0, Math.min(pct, 100));
        _nwDials[which] = new Chart(c.getContext('2d'), {
            type: 'doughnut',
            data: { datasets: [{ data: [v, 100 - v], backgroundColor: [color, 'rgba(255,255,255,0.10)'], borderWidth: 0 }] },
            options: {
                responsive: true, maintainAspectRatio: false, cutout: '72%',
                plugins: { legend: { display: false }, tooltip: { enabled: false } }
            }
        });
    }

    // ── Asset-class tiles ────────────────────────────────────────────
    function nwRenderTiles(cats, total) {
        var wrap = document.getElementById('nw-tiles');
        if (!wrap) return;
        var totalEl = document.getElementById('nw-tiles-total');
        if (totalEl) totalEl.textContent = nwFmt(total);

        var shown = cats.filter(function(c) { return c.val > 0; });
        if (total <= 0 || shown.length === 0) {
            wrap.innerHTML = '<div class="nwc-col-full text-[10px] text-center py-4" style="color:rgba(242,245,240,.4);">' +
                _nw('nw.bk.empty', 'Enter your assets below to see allocation') + '</div>';
            return;
        }
        wrap.innerHTML = shown.map(function(c) {
            var pct = Math.round(c.val / total * 100);
            return '<div class="nwc-tile">' +
                '<div class="flex items-center justify-between">' +
                    '<span class="nwc-tile-ico" style="color:' + c.color + ';">' + _nwIco(c.icon) + '</span>' +
                    '<span class="text-[10px] font-black" style="color:' + c.color + ';">' + pct + '%</span>' +
                '</div>' +
                '<div class="text-[10px] font-bold mt-1" style="color:rgba(242,245,240,.6);">' + c.label + '</div>' +
                '<div class="text-sm font-black text-white">' + nwFmt(c.val) + '</div>' +
                '<div class="nwc-bar mt-1.5"><div class="h-full rounded-full" style="width:' + pct + '%;background:' + c.color + ';"></div></div>' +
            '</div>';
        }).join('');
    }

    // ── Milestone ladder ─────────────────────────────────────────────
    function nwRenderMilestone(nw) {
        var textEl = document.getElementById('nw-milestone-text');
        var barEl  = document.getElementById('nw-milestone-bar');
        var subEl  = document.getElementById('nw-milestone-sub');
        if (!textEl || !barEl || !subEl) return;

        if (nw <= 0) {
            textEl.textContent = _nw('nw.milestone.empty', 'Add your assets to track your next milestone.');
            barEl.style.width = '0%';
            subEl.textContent = '';
            return;
        }
        var ladder = [500000,1000000,2500000,5000000,7500000,10000000,15000000,20000000,30000000,50000000,75000000,100000000,150000000,200000000,300000000,500000000,1000000000];
        var target = ladder.find(function(t) { return t > nw; }) || (Math.ceil(nw / 1e7) + 1) * 1e7;
        var pct    = Math.min(Math.round(nw / target * 100), 100);
        var remain = target - nw;
        textEl.innerHTML = _nw('nw.milestone.progress', "You're <strong>{pct}%</strong> to <strong>{target}</strong>")
            .replace('{pct}', pct).replace('{target}', nwFmt(target));
        barEl.style.width = pct + '%';
        subEl.textContent = nwFmt(remain) + ' ' + _nw('nw.milestone.togo', 'to go');
    }

    // ── Insight box ──────────────────────────────────────────────────
    function nwRenderInsight(dtar, liqPct, invPct, goldOther, crypto, insSv, totalAssets) {
        var insEl = document.getElementById('nw-insight');
        if (!insEl) return;
        if (totalAssets === 0) { insEl.classList.add('hidden'); return; }
        insEl.classList.remove('hidden');

        var insights = [];
        if (dtar > 50)      insights.push(_nw('nw.insight.dtar.high', '⚠️ Debt-to-asset ratio is <strong>{pct}</strong> — above 50% is a financial risk. Prioritise paying down high-interest loans first.').replace('{pct}', dtar.toFixed(0) + '%'));
        else if (dtar > 30) insights.push(_nw('nw.insight.dtar.mid', '🟡 Debt-to-asset ratio is <strong>{pct}</strong>. Aim to get this below 30% for financial resilience.').replace('{pct}', dtar.toFixed(0) + '%'));
        else if (dtar > 0)  insights.push(_nw('nw.insight.dtar.ok', '✅ Debt-to-asset ratio is a healthy <strong>{pct}</strong>. Keep liabilities under 30% of assets.').replace('{pct}', dtar.toFixed(0) + '%'));
        if (liqPct < 5)               insights.push(_nw('nw.insight.liq.low', '⚠️ Liquid assets are only <strong>{pct}</strong> of total. Keep at least 3–6 months of expenses in liquid form.').replace('{pct}', liqPct.toFixed(0) + '%'));
        if (invPct < 20)              insights.push(_nw('nw.insight.inv.low', '💡 Only <strong>{pct}</strong> is in wealth-creating investments. Try to grow equity + retirement assets to at least 40% over time.').replace('{pct}', invPct.toFixed(0) + '%'));
        if (goldOther > 0 && crypto > goldOther * 0.5) insights.push(_nw('nw.insight.crypto', '⚠️ Crypto is >50% of your "gold & other" assets. High volatility — keep crypto under 5% of total net worth.'));
        if (insSv > 0)                insights.push(_nw('nw.insight.ulip', '💡 Your LIC/ULIP surrender value is {val}. If its IRR is below 6%, term insurance + MF investment is likely superior.').replace('{val}', nwFmt(insSv)));
        if (insights.length === 0)    insights.push(_nw('nw.insight.ok', '✅ Your financial snapshot looks balanced. Update this quarterly to track your net worth journey!'));

        insEl.innerHTML = '<div class="font-black mb-1" style="color:#f5c842;">' + _nw('nw.insight.title', '💡 Snapshot Insights') + '</div>' +
            '<ul class="space-y-1">' + insights.map(function(i){ return '<li class="leading-relaxed">' + i + '</li>'; }).join('') + '</ul>';
    }

    // ── Monthly history ──────────────────────────────────────────────
    function nwSnapshotMonth(assets, liab, nw) {
        if (assets <= 0 && liab <= 0) return;
        var d   = new Date();
        var key = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
        var idx = _nwHistory.findIndex(function(h) { return h.m === key; });
        var entry = { m: key, nw: Math.round(nw), a: Math.round(assets), l: Math.round(liab) };
        if (idx === -1) { _nwHistory.push(entry); }
        else            { _nwHistory[idx] = entry; }
        _nwHistory.sort(function(a, b) { return a.m < b.m ? -1 : 1; });
        if (_nwHistory.length > 36) _nwHistory = _nwHistory.slice(-36);
    }

    var _NW_MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    function _nwFmtLabel(m) { var p = m.split('-'); return _NW_MONTHS[parseInt(p[1]) - 1] + " '" + p[0].slice(2); }
    function _nwFmtLong(m)  { var p = m.split('-'); return _NW_MONTHS[parseInt(p[1]) - 1] + ' ' + p[0]; }

    // ── Cockpit trajectory (net-worth-only sparkline) ────────────────
    function nwRenderCockpitTrend() {
        var c        = document.getElementById('nw-cockpit-trend');
        var emptyEl  = document.getElementById('nw-trend-empty');
        var ytdEl    = document.getElementById('nw-ytd');
        var momEl    = document.getElementById('nw-mom');
        if (!c) return;

        var hist = _nwHistory.slice().sort(function(a, b) { return a.m < b.m ? -1 : 1; });

        // MoM delta near the gauge
        if (momEl) {
            if (hist.length >= 2) {
                var chg = hist[hist.length - 1].nw - hist[hist.length - 2].nw;
                momEl.textContent = (chg >= 0 ? '▲ ' : '▼ ') + nwFmt(Math.abs(chg));
                momEl.style.color = chg >= 0 ? '#34d399' : '#f87171';
            } else { momEl.textContent = ''; }
        }

        if (hist.length < 2) {
            if (_nwCockTrend) { _nwCockTrend.destroy(); _nwCockTrend = null; }
            if (emptyEl) emptyEl.style.display = 'flex';
            if (ytdEl) ytdEl.textContent = '';
            return;
        }
        if (emptyEl) emptyEl.style.display = 'none';

        // YTD-style change (earliest → latest in window)
        if (ytdEl) {
            var first = hist[0].nw, last = hist[hist.length - 1].nw;
            if (first !== 0) {
                var pct = Math.round((last - first) / Math.abs(first) * 100);
                ytdEl.textContent = (pct >= 0 ? '+' : '') + pct + '% ' + _nw('nw.traj.period', 'so far');
                ytdEl.style.color = pct >= 0 ? '#34d399' : '#f87171';
            } else { ytdEl.textContent = ''; }
        }

        if (_nwCockTrend) { _nwCockTrend.destroy(); _nwCockTrend = null; }
        _nwCockTrend = new Chart(c.getContext('2d'), {
            type: 'line',
            data: {
                labels: hist.map(function(h) { return _nwFmtLabel(h.m); }),
                datasets: [{
                    data: hist.map(function(h) { return h.nw; }),
                    borderColor: '#34d399',
                    backgroundColor: 'rgba(52,211,153,0.16)',
                    fill: true, tension: 0.4, borderWidth: 2.5,
                    pointRadius: 3, pointBackgroundColor: '#f5c842'
                }]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: { callbacks: { label: function(c) { return ' ' + nwFmt(c.parsed.y); } } }
                },
                scales: {
                    x: { ticks: { font: { size: 9 }, color: 'rgba(242,245,240,.5)' }, grid: { display: false } },
                    y: { ticks: { font: { size: 9 }, color: 'rgba(242,245,240,.5)', callback: function(v) { return nwFmt(v); } }, grid: { color: 'rgba(255,255,255,0.06)' } }
                }
            }
        });
    }

    // ── History section: MoM summary + full table + multi-line chart ─
    function nwRenderTrend() {
        var section = document.getElementById('nw-trend-section');
        if (!section) return;

        if (_nwHistory.length === 0) {
            section.innerHTML =
                '<div class="flex flex-col items-center justify-center py-8 gap-2">' +
                '<span class="nwc-ico-lg" style="color:rgba(245,200,66,.4);">' + _nwIco('nw.history') + '</span>' +
                '<div class="text-xs font-semibold" style="color:rgba(242,245,240,.55);">' + _nw('nw.hist.none.title', 'No history yet') + '</div>' +
                '<div class="text-[10px] text-center max-w-xs leading-relaxed" style="color:rgba(242,245,240,.4);">' + _nw('nw.hist.none.sub', 'Enter your assets and liabilities above — your net worth will be recorded here automatically each month.') + '</div>' +
                '</div>';
            return;
        }

        var hist = _nwHistory.slice().sort(function(a, b) { return a.m < b.m ? -1 : 1; });

        var latest    = hist[hist.length - 1];
        var prevEntry = hist.length > 1 ? hist[hist.length - 2] : null;
        var momChange = prevEntry ? latest.nw - prevEntry.nw : null;
        var momColor  = momChange === null ? '' : (momChange >= 0 ? '#34d399' : '#f87171');
        var momArrow  = momChange === null ? '' : (momChange >= 0 ? '▲' : '▼');

        var momHtml = momChange !== null
            ? '<span class="text-[10px] font-black px-2 py-0.5 rounded-full" style="background:' + momColor + '22;color:' + momColor + ';">' +
              momArrow + ' ' + nwFmt(Math.abs(momChange)) + ' vs ' + _nwFmtLong(prevEntry.m) + '</span>'
            : '<span class="text-[10px] italic" style="color:rgba(242,245,240,.4);">' + _nw('nw.hist.first', 'First month recorded — check back next month for trend') + '</span>';

        var tableRows = hist.slice().reverse().map(function(h, i, arr) {
            var prevH  = arr[i + 1];
            var change = prevH !== undefined ? h.nw - prevH.nw : null;
            var chg    = '';
            if (change !== null) {
                var cc = change >= 0 ? '#34d399' : '#f87171';
                chg = '<span style="color:' + cc + ';font-weight:700;">' + (change >= 0 ? '+' : '') + nwFmt(change) + '</span>';
            }
            return '<tr style="border-bottom:1px solid rgba(255,255,255,0.06);">' +
                '<td class="py-1.5 px-3 text-[11px] font-semibold" style="color:rgba(242,245,240,.75);">' + _nwFmtLong(h.m) + '</td>' +
                '<td class="py-1.5 px-3 text-[11px] text-right" style="color:#93c5fd;">' + nwFmt(h.a) + '</td>' +
                '<td class="py-1.5 px-3 text-[11px] text-right" style="color:#fca5a5;">' + (h.l > 0 ? nwFmt(h.l) : '<span style="color:rgba(242,245,240,.3);">—</span>') + '</td>' +
                '<td class="py-1.5 px-3 text-[11px] text-right font-black" style="color:' + (h.nw >= 0 ? '#6ee7b7' : '#fca5a5') + ';">' + nwFmt(h.nw) + '</td>' +
                '<td class="py-1.5 px-3 text-[11px] text-right">' + (chg || '<span style="color:rgba(242,245,240,.3);">—</span>') + '</td>' +
                '</tr>';
        }).join('');

        var th = 'py-1.5 px-3 text-[9px] font-black uppercase tracking-wider';
        section.innerHTML =
            '<div class="flex items-start justify-between gap-3 mb-3 flex-wrap">' +
                '<div>' +
                    '<div class="text-sm font-black text-white">' + nwFmt(latest.nw) +
                        '<span class="text-[10px] font-normal ml-1.5" style="color:rgba(242,245,240,.4);">as of ' + _nwFmtLong(latest.m) + '</span>' +
                    '</div>' +
                    '<div class="mt-1">' + momHtml + '</div>' +
                '</div>' +
                '<div class="text-[9px] text-right leading-relaxed" style="color:rgba(242,245,240,.4);">' +
                    hist.length + ' ' + _nw('nw.hist.tracked', 'months tracked') + '<br>' + _nw('nw.hist.auto', 'auto-updated on every save') +
                '</div>' +
            '</div>' +
            (hist.length >= 2
                ? '<div style="position:relative;height:150px;" class="mb-3"><canvas id="nw-trend-chart"></canvas></div>'
                : '') +
            '<div class="overflow-x-auto rounded-xl" style="border:1px solid rgba(255,255,255,0.08);">' +
                '<table class="w-full">' +
                    '<thead><tr style="background:rgba(255,255,255,0.04);">' +
                        '<th class="' + th + ' text-left"  style="color:rgba(242,245,240,.45);">' + _nw('nw.hist.th.month',  'Month')       + '</th>' +
                        '<th class="' + th + ' text-right" style="color:rgba(242,245,240,.45);">' + _nw('nw.hist.th.assets', 'Assets')      + '</th>' +
                        '<th class="' + th + ' text-right" style="color:rgba(242,245,240,.45);">' + _nw('nw.hist.th.liab',   'Liabilities') + '</th>' +
                        '<th class="' + th + ' text-right" style="color:rgba(242,245,240,.45);">' + _nw('nw.hist.th.nw',     'Net Worth')   + '</th>' +
                        '<th class="' + th + ' text-right" style="color:rgba(242,245,240,.45);">' + _nw('nw.hist.th.mom',    'MoM Change')  + '</th>' +
                    '</tr></thead>' +
                    '<tbody>' + tableRows + '</tbody>' +
                '</table>' +
            '</div>';

        if (hist.length >= 2) {
            if (_nwTrendChart) { _nwTrendChart.destroy(); _nwTrendChart = null; }
            var ctx = document.getElementById('nw-trend-chart');
            if (!ctx) return;
            _nwTrendChart = new Chart(ctx.getContext('2d'), {
                type: 'line',
                data: {
                    labels: hist.map(function(h) { return _nwFmtLabel(h.m); }),
                    datasets: [
                        { label: 'Net Worth', data: hist.map(function(h){return h.nw;}), borderColor: '#34d399', backgroundColor: 'rgba(52,211,153,0.10)', borderWidth: 2.5, pointRadius: 4, pointBackgroundColor: '#34d399', fill: true, tension: 0.35 },
                        { label: 'Assets',    data: hist.map(function(h){return h.a;}),  borderColor: '#60a5fa', backgroundColor: 'transparent', borderWidth: 1.5, pointRadius: 3, pointBackgroundColor: '#60a5fa', borderDash: [5,3], fill: false, tension: 0.35 },
                        { label: 'Liabilities', data: hist.map(function(h){return h.l;}), borderColor: '#f87171', backgroundColor: 'transparent', borderWidth: 1.5, pointRadius: 3, pointBackgroundColor: '#f87171', borderDash: [5,3], fill: false, tension: 0.35 }
                    ]
                },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    plugins: {
                        legend: { display: true, position: 'top', labels: { font: { size: 9 }, boxWidth: 18, padding: 8, color: 'rgba(242,245,240,.7)' } },
                        tooltip: { callbacks: { label: function(c) { return ' ' + c.dataset.label + ': ' + nwFmt(c.parsed.y); } } }
                    },
                    scales: {
                        x: { ticks: { font: { size: 9 }, maxRotation: 30, color: 'rgba(242,245,240,.5)' }, grid: { display: false } },
                        y: { ticks: { font: { size: 9 }, color: 'rgba(242,245,240,.5)', callback: function(v) { return nwFmt(v); } }, grid: { color: 'rgba(255,255,255,0.06)' } }
                    }
                }
            });
        }
    }
