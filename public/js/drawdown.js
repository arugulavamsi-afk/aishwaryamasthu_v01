    /* ══════════════════════════════════════════════════════════
       RETIREMENT DRAWDOWN PLANNER
    ══════════════════════════════════════════════════════════ */
    var _ddYearData = [];
    var _ddView = 'corpus';
    var _ddChart = null;

    function ddFormat(el) {
        var raw = (el.value || '').replace(/[^0-9]/g, '');
        el.value = raw ? Number(raw).toLocaleString('en-IN') : '';
    }


    function ddNum(id) {
        return parseFloat((document.getElementById(id)?.value || '').replace(/,/g, '')) || 0;
    }

    function ddFmt(n) {
        if (n === null || n === undefined || isNaN(n)) return '—';
        var abs = Math.abs(n);
        var sign = n < 0 ? '-' : '';
        if (abs >= 1e7) return sign + '₹' + (abs / 1e7).toFixed(2) + ' Cr';
        if (abs >= 1e5) return sign + '₹' + (abs / 1e5).toFixed(2) + ' L';
        return sign + '₹' + Math.round(abs).toLocaleString('en-IN');
    }

    function initDrawdown() {
        var defs = {'dd-corpus':'1,00,00,000','dd-current-age':'30','dd-ret-age':'60','dd-expenses':'60,000','dd-inflation':'6','dd-return':'8','dd-other-income':''};
        Object.keys(defs).forEach(function(id) {
            var el = document.getElementById(id);
            if (!el) return;
            if (!el.value || el.value === defs[id]) el.classList.add('text-slate-400');
            else el.classList.remove('text-slate-400');
        });
        drawdownCalc();
    }

    function resetDrawdown() {
        var fields = {'dd-corpus':'1,00,00,000','dd-current-age':'30','dd-ret-age':'60','dd-expenses':'60,000','dd-inflation':'6','dd-return':'8','dd-other-income':''};
        Object.entries(fields).forEach(function([id, val]) {
            var el = document.getElementById(id);
            if (!el) return;
            el.value = val;
            if (val) el.classList.add('text-slate-400');
            else el.classList.remove('text-slate-400');
        });
        drawdownCalc();
        if (typeof saveUserData === 'function') saveUserData();
    }

    function ddPreset(corpus, retAge, expenses, inflation, ret, otherIncome) {
        var fields = {
            'dd-corpus':      Number(corpus).toLocaleString('en-IN'),
            'dd-ret-age':     String(retAge),
            'dd-expenses':    Number(expenses).toLocaleString('en-IN'),
            'dd-inflation':   String(inflation),
            'dd-return':      String(ret),
            'dd-other-income': otherIncome ? Number(otherIncome).toLocaleString('en-IN') : ''
        };
        Object.entries(fields).forEach(function([id, val]) {
            var el = document.getElementById(id);
            if (!el) return;
            el.value = val;
            el.classList.remove('text-slate-400');
        });
        drawdownCalc();
    }

    function drawdownCalc() {
        var corpus      = ddNum('dd-corpus');
        var currentAge  = Math.round(ddNum('dd-current-age')) || 30;
        var retAge      = Math.round(ddNum('dd-ret-age')) || 60;
        var expToday    = ddNum('dd-expenses');
        var inflation   = (ddNum('dd-inflation') || 6) / 100;
        var returnRate  = (ddNum('dd-return') || 8) / 100;
        var otherIncome = ddNum('dd-other-income'); // monthly, today's ₹

        if (!corpus || !expToday) return;

        // Inflate today's expenses to retirement date
        var yearsToRetire   = Math.max(0, retAge - currentAge);
        var expAtRetirement = expToday * Math.pow(1 + inflation, yearsToRetire);

        // Show hint
        var hint = document.getElementById('dd-future-exp-hint');
        if (hint) {
            hint.textContent = yearsToRetire > 0
                ? '→ At retirement (' + yearsToRetire + ' yrs): ₹' + Math.round(expAtRetirement).toLocaleString('en-IN') + '/mo'
                : '→ Retiring now — expenses used as-is';
        }

        var MAX_AGE  = 100;
        var planYears = MAX_AGE - retAge;

        var yearData      = [];
        var balance       = corpus;
        var depletionAge  = null;

        for (var yr = 1; yr <= planYears; yr++) {
            var age         = retAge + yr - 1;
            // yr=1 = first year of retirement; inflation compounds from expAtRetirement
            var inflFactor  = Math.pow(1 + inflation, yr - 1);
            var monthlyExp  = expAtRetirement * inflFactor;
            var monthlyOth  = otherIncome * inflFactor;
            var netMonthly  = Math.max(0, monthlyExp - monthlyOth);
            var annualWithd = netMonthly * 12;

            var openBal  = balance;
            var returns  = openBal * returnRate;
            balance      = openBal + returns - annualWithd;
            var closeBal = Math.max(0, balance);

            yearData.push({
                age:        age,
                openBal:    Math.round(openBal),
                monthly:    Math.round(monthlyExp),
                netMonthly: Math.round(netMonthly),
                annualW:    Math.round(annualWithd),
                otherInc:   Math.round(monthlyOth * 12),
                returns:    Math.round(returns),
                closeBal:   Math.round(closeBal)
            });

            if (balance <= 0 && depletionAge === null) {
                depletionAge = age + 1;
                balance = 0;
            }
        }

        _ddYearData = yearData;

        // Key metrics
        var realReturn = ((1 + returnRate) / (1 + inflation) - 1) * 100;
        var swr30 = (realReturn > 0)
            ? (realReturn / 100 * Math.pow(1 + realReturn / 100, 30)) / (Math.pow(1 + realReturn / 100, 30) - 1) * 100
            : (1 / 30 * 100);
        var swrDisplay  = Math.min(swr30, 6).toFixed(1) + '%';
        var yearsLast   = depletionAge ? (depletionAge - retAge) : (MAX_AGE - retAge + '+');
        var deplAgeDisp = depletionAge ? String(depletionAge) : '100+';
        var swpStart    = yearData.length > 0 ? yearData[0].netMonthly : 0;

        var age85idx    = 85 - retAge;
        var corpusAt85  = (age85idx >= 0 && age85idx < yearData.length) ? yearData[age85idx].closeBal : 0;
        var age75idx    = 75 - retAge;
        var swpAt75     = (age75idx > 0 && age75idx < yearData.length) ? yearData[age75idx].netMonthly : 0;

        // Bucket allocation (in today's corpus)
        var b1 = yearData.length > 0 ? yearData[0].annualW : 0;
        var b2 = 0;
        for (var i = 1; i <= 3 && i < yearData.length; i++) b2 += yearData[i].annualW / Math.pow(1.075, i);
        b2 = Math.round(b2);
        var b3 = Math.max(0, corpus - b1 - b2);

        // DOM updates
        document.getElementById('dd-depletion-age').textContent  = deplAgeDisp;
        document.getElementById('dd-years-last').textContent     = yearsLast + ' yrs';
        document.getElementById('dd-swp-start').textContent      = ddFmt(swpStart) + '/mo';
        document.getElementById('dd-real-return').textContent    = realReturn.toFixed(1) + '%';
        document.getElementById('dd-swr').textContent            = swrDisplay;
        document.getElementById('dd-corpus-at-85').textContent   = ddFmt(corpusAt85);
        document.getElementById('dd-swp-75').textContent         = ddFmt(swpAt75) + '/mo';

        var deplLabel = document.getElementById('dd-depletion-label');
        var surpDefEl = document.getElementById('dd-surplus-deficit');
        if (depletionAge) {
            var shortfall = MAX_AGE - depletionAge;
            deplLabel.textContent = _t('dd.runsout').replace('{n}', shortfall);
            deplLabel.style.color = '#fbbf24';
            surpDefEl.textContent = _t('dd.shortfall').replace('{n}', shortfall);
            surpDefEl.style.color = '#fbbf24';
        } else {
            deplLabel.textContent = _t('dd.survives');
            deplLabel.style.color = '#86efac';
            surpDefEl.textContent = _t('dd.sufficient');
            surpDefEl.style.color = '#86efac';
        }

        document.getElementById('dd-b1-amount').textContent = ddFmt(b1) + '/yr';
        document.getElementById('dd-b2-amount').textContent = ddFmt(b2);
        document.getElementById('dd-b3-amount').textContent = ddFmt(b3);

        var ins = document.getElementById('dd-insight');
        ins.classList.remove('hidden');
        var corpusPct = corpus > 0 ? ((swpStart * 12 / corpus) * 100).toFixed(1) : 0;
        ins.innerHTML =
            '<strong>💡 Insight:</strong> Your first-year withdrawal rate is <strong>' + corpusPct + '%</strong> of corpus. ' +
            (depletionAge
                ? '⚠ At current spending &amp; returns, corpus depletes at age <strong>' + depletionAge + '</strong>. To stretch to 90+, reduce withdrawal ~10–15%, increase return by 1–2%, or add other income.'
                : '✅ Your corpus is projected to last <strong>beyond age 100</strong> — you\'re in great shape. Consider leaving a legacy or increasing spending in early retirement when health is best.') +
            ' Real return after inflation: <strong>' + realReturn.toFixed(1) + '%</strong>. ' +
            'Bucket 1 (liquid, 1yr): <strong>' + ddFmt(b1) + '</strong> · ' +
            'Bucket 2 (debt, 3yr): <strong>' + ddFmt(b2) + '</strong> · ' +
            'Bucket 3 (equity, rest): <strong>' + ddFmt(b3) + '</strong>.';

        // Table
        var rows = '';
        yearData.forEach(function(d, i) {
            if (i > 0 && yearData[i-1].closeBal === 0 && d.openBal === 0) return;
            var bg  = i % 2 === 0 ? 'background:#fff7ed;' : '';
            var clr = d.closeBal === 0 ? 'color:#dc2626;font-weight:900;' : '';
            rows += '<tr style="' + bg + '">' +
                '<td class="px-2 py-1 font-black text-slate-600">' + d.age + '</td>' +
                '<td class="px-2 py-1 text-right text-slate-600">' + ddFmt(d.openBal) + '</td>' +
                '<td class="px-2 py-1 text-right text-orange-600">' + ddFmt(d.netMonthly) + '/mo</td>' +
                '<td class="px-2 py-1 text-right text-slate-500">' + ddFmt(d.annualW) + '</td>' +
                '<td class="px-2 py-1 text-right text-emerald-600">' + (d.otherInc > 0 ? ddFmt(d.otherInc) : '—') + '</td>' +
                '<td class="px-2 py-1 text-right text-emerald-700 font-bold">' + ddFmt(d.returns) + '</td>' +
                '<td class="px-2 py-1 text-right font-black" style="' + clr + '">' + (d.closeBal > 0 ? ddFmt(d.closeBal) : '₹0 (depleted)') + '</td>' +
            '</tr>';
        });
        document.getElementById('dd-table-body').innerHTML = rows;

        ddRenderChart(yearData);
        if (typeof saveUserData === 'function') saveUserData();
    }

    function ddRenderChart(yearData) {
        if (!yearData || yearData.length === 0) return;
        var canvas = document.getElementById('dd-chart-canvas');
        if (!canvas) return;
        if (_ddChart) { try { _ddChart.destroy(); } catch(e){} _ddChart = null; }
        var isCorpus = (_ddView === 'corpus');
        var labels   = yearData.map(function(d){ return 'Age ' + d.age; });
        var datasets;
        if (isCorpus) {
            datasets = [
                { label:'Corpus Balance', data: yearData.map(function(d){ return d.closeBal; }),
                  borderColor:'#ea580c', backgroundColor:'rgba(234,88,12,0.12)', borderWidth:2.5,
                  fill:true, tension:0.35, pointRadius: yearData.length > 35 ? 0 : 3, pointHoverRadius:5 },
                { label:'Annual Returns', data: yearData.map(function(d){ return d.returns; }),
                  borderColor:'#16a34a', backgroundColor:'rgba(22,163,74,0.08)', borderWidth:1.5,
                  fill:false, tension:0.3, pointRadius:0, pointHoverRadius:4 }
            ];
        } else {
            datasets = [
                { label:'Monthly SWP (Net)', data: yearData.map(function(d){ return d.netMonthly; }),
                  borderColor:'#ea580c', backgroundColor:'rgba(234,88,12,0.15)', borderWidth:2.5,
                  fill:true, tension:0.35, pointRadius: yearData.length > 35 ? 0 : 3, pointHoverRadius:5 },
                { label:'Monthly Expenses (Gross)', data: yearData.map(function(d){ return d.monthly; }),
                  borderColor:'#9333ea', backgroundColor:'rgba(147,51,234,0.05)', borderWidth:1.5,
                  borderDash:[4,3], fill:false, tension:0.3, pointRadius:0, pointHoverRadius:4 }
            ];
        }
        _ddChart = new Chart(canvas.getContext('2d'), {
            type: 'line',
            data: { labels: labels, datasets: datasets },
            options: {
                responsive: true, maintainAspectRatio: false,
                interaction: { mode:'index', intersect:false },
                plugins: {
                    legend: { display:true, position:'top', labels:{ boxWidth:10, font:{ size:10, weight:'700' } } },
                    tooltip: { callbacks: { label: function(ctx) {
                        var v = ctx.raw;
                        if (v >= 1e7) return ctx.dataset.label + ': ₹' + (v/1e7).toFixed(2) + ' Cr';
                        if (v >= 1e5) return ctx.dataset.label + ': ₹' + (v/1e5).toFixed(2) + ' L';
                        return ctx.dataset.label + ': ₹' + Math.round(v).toLocaleString('en-IN');
                    }}}
                },
                scales: {
                    x: { grid:{display:false}, ticks:{ font:{size:9}, maxTicksLimit:15,
                        callback: function(val, idx){ var d=yearData[idx]; return d ? 'Age '+d.age : ''; } } },
                    y: { grid:{color:'rgba(0,0,0,0.05)'}, ticks:{ font:{size:9},
                        callback: function(v){ if(v>=1e7) return '₹'+(v/1e7).toFixed(1)+'Cr'; if(v>=1e5) return '₹'+(v/1e5).toFixed(1)+'L'; if(v>=1e3) return '₹'+(v/1e3).toFixed(0)+'K'; return '₹'+v; } } }
                }
            }
        });
    }

    function ddChartView(view) {
        _ddView = view;
        ['corpus','monthly'].forEach(function(v) {
            var btn = document.getElementById('dd-btn-' + v);
            if (btn) btn.classList.toggle('dd-chart-btn-active', v === view);
        });
        ddRenderChart(_ddYearData);
    }

    function ddToggleTable() {
        var wrap = document.getElementById('dd-table-wrap');
        var btn  = document.getElementById('dd-table-btn');
        var hidden = wrap.classList.toggle('hidden');
        btn.textContent = hidden ? _t('common.show') : _t('common.hide');
    }
