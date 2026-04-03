    /* ══════════════════════════════════════════════════════════
       NET WORTH TRACKER
    ══════════════════════════════════════════════════════════ */

    var _nwChart = null;

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

    function initNetWorth() {
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

        var catLiquid    = savings + fd;
        var catEquity    = stocks + eqMf;
        var catRetire    = epf + ppf + nps + debtMf;
        var catRealty    = home + property;
        var catGoldOther = goldPhys + goldPaper + crypto + insSv + other;

        var totalAssets = catLiquid + catEquity + catRetire + catRealty + catGoldOther;
        var totalLiab   = liabHome + liabCar + liabPl + liabEdu + liabCc + liabOther;
        var netWorth    = totalAssets - totalLiab;

        // Summary cards
        var nwEl = document.getElementById('nw-net-worth');
        if (nwEl) {
            nwEl.textContent = nwFmt(netWorth);
            nwEl.style.color = netWorth >= 0 ? '#10b981' : '#ef4444';
        }
        var astEl = document.getElementById('nw-total-assets');
        if (astEl) astEl.textContent = nwFmt(totalAssets);
        var lbEl = document.getElementById('nw-total-liab');
        if (lbEl) lbEl.textContent = nwFmt(totalLiab);

        // Ratios
        var dtar = totalAssets > 0 ? (totalLiab / totalAssets * 100) : 0;
        var dtarEl = document.getElementById('nw-dtar');
        if (dtarEl) {
            dtarEl.textContent = dtar.toFixed(1) + '%';
            dtarEl.style.color = dtar <= 30 ? '#10b981' : dtar <= 50 ? '#f59e0b' : '#ef4444';
        }

        var invAssets = catEquity + catRetire;
        var invPct = totalAssets > 0 ? (invAssets / totalAssets * 100) : 0;
        var invEl = document.getElementById('nw-inv-ratio');
        if (invEl) invEl.textContent = invPct.toFixed(1) + '%';

        var liqPct = totalAssets > 0 ? (catLiquid / totalAssets * 100) : 0;
        var liqEl = document.getElementById('nw-liq-ratio');
        if (liqEl) liqEl.textContent = liqPct.toFixed(1) + '%';

        // Insight
        var insEl = document.getElementById('nw-insight');
        if (insEl) {
            var insights = [];
            if (totalAssets === 0) {
                insEl.classList.add('hidden');
            } else {
                insEl.classList.remove('hidden');
                if (dtar > 50) insights.push('⚠️ Debt-to-asset ratio is <strong>' + dtar.toFixed(0) + '%</strong> — above 50% is a financial risk. Prioritise paying down high-interest loans first.');
                else if (dtar > 30) insights.push('🟡 Debt-to-asset ratio is <strong>' + dtar.toFixed(0) + '%</strong>. Aim to get this below 30% for financial resilience.');
                else if (dtar > 0) insights.push('✅ Debt-to-asset ratio is a healthy <strong>' + dtar.toFixed(0) + '%</strong>. Keep liabilities under 30% of assets.');
                if (liqPct < 5) insights.push('⚠️ Liquid assets are only <strong>' + liqPct.toFixed(0) + '%</strong> of total. Keep at least 3–6 months of expenses in liquid form.');
                if (invPct < 20 && totalAssets > 0) insights.push('💡 Only <strong>' + invPct.toFixed(0) + '%</strong> is in wealth-creating investments. Try to grow equity + retirement assets to at least 40% over time.');
                if (catGoldOther > 0 && crypto > catGoldOther * 0.5) insights.push('⚠️ Crypto is >50% of your "gold & other" assets. High volatility — keep crypto under 5% of total net worth.');
                if (insSv > 0) insights.push('💡 Your LIC/ULIP surrender value is ₹' + nwFmt(insSv) + '. Consider: if the IRR is below 6%, term insurance + MF investment is likely superior. Use the "ULIP Analyzer" for a full comparison.');
                if (insights.length === 0) insights.push('✅ Your financial snapshot looks balanced. Update this quarterly to track your net worth journey!');
                insEl.innerHTML = '<strong>💡 Snapshot Insights:</strong><ul class="mt-1 space-y-1">' + insights.map(function(i){ return '<li class="leading-relaxed">' + i + '</li>'; }).join('') + '</ul>';
            }
        }

        // Render chart
        nwRenderChart(catLiquid, catEquity, catRetire, catRealty, catGoldOther, totalAssets);

        // Breakdown rows
        var bkEl = document.getElementById('nw-breakdown');
        if (bkEl && totalAssets > 0) {
            var rows = [
                { label: '💵 Liquid (Cash + FD)',          val: catLiquid,    color: '#0ea5e9' },
                { label: '📈 Equity (Stocks + MF)',         val: catEquity,    color: '#10b981' },
                { label: '🔒 Retirement (EPF+PPF+NPS+Debt)',val: catRetire,    color: '#8b5cf6' },
                { label: '🏠 Real Estate',                  val: catRealty,    color: '#f59e0b' },
                { label: '🥇 Gold, Crypto & Other',         val: catGoldOther, color: '#b45309' }
            ];
            bkEl.innerHTML = rows.filter(function(r){ return r.val > 0; }).map(function(r) {
                var pct = (r.val / totalAssets * 100).toFixed(1);
                return '<div class="flex items-center gap-2 py-1.5 border-b border-slate-100 last:border-0">' +
                    '<div style="width:8px;height:8px;border-radius:50%;background:' + r.color + ';flex-shrink:0;"></div>' +
                    '<div class="text-[10px] text-slate-600 flex-1">' + r.label + '</div>' +
                    '<div class="text-[10px] font-black text-slate-400">' + pct + '%</div>' +
                    '<div class="text-[11px] font-black text-slate-700">' + nwFmt(r.val) + '</div>' +
                    '</div>';
            }).join('');
        } else if (bkEl) {
            bkEl.innerHTML = '<div class="text-[10px] text-slate-400 text-center py-4">Enter your assets above to see breakdown</div>';
        }

        if (typeof saveUserData === 'function') saveUserData();
    }

    function nwRenderChart(liquid, equity, retire, realty, goldOther, total) {
        var canvas = document.getElementById('nw-chart-canvas');
        if (!canvas) return;
        if (_nwChart) { _nwChart.destroy(); _nwChart = null; }
        if (total <= 0) return;

        var labels = ['Liquid', 'Equity', 'Retirement', 'Real Estate', 'Gold & Other'];
        var vals   = [liquid, equity, retire, realty, goldOther];
        var colors = ['#0ea5e9','#10b981','#8b5cf6','#f59e0b','#b45309'];

        // Filter out zero-value segments
        var filtLabels = [], filtVals = [], filtColors = [];
        vals.forEach(function(v, i) {
            if (v > 0) { filtLabels.push(labels[i]); filtVals.push(v); filtColors.push(colors[i]); }
        });
        if (filtVals.length === 0) return;

        _nwChart = new Chart(canvas.getContext('2d'), {
            type: 'doughnut',
            data: {
                labels: filtLabels,
                datasets: [{
                    data: filtVals,
                    backgroundColor: filtColors,
                    borderColor: '#ffffff',
                    borderWidth: 2,
                    hoverOffset: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '60%',
                plugins: {
                    legend: {
                        display: true,
                        position: 'bottom',
                        labels: { boxWidth: 10, boxHeight: 10, font: { size: 9, weight: 'bold' }, color: '#64748b', padding: 8 }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(15,23,42,0.93)',
                        titleFont: { size: 11, weight: 'bold' },
                        bodyFont: { size: 12, weight: 'bold' },
                        padding: 10,
                        cornerRadius: 8,
                        callbacks: {
                            label: function(ctx) {
                                var pct = (ctx.raw / total * 100).toFixed(1);
                                return ' ' + ctx.label + ': ' + nwFmt(ctx.raw) + ' (' + pct + '%)';
                            }
                        }
                    }
                }
            }
        });
    }
