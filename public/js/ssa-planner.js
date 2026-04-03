    /* ══════════════════════════════════════════════════════════
       SSA + CHILD EDUCATION DUAL PLANNER
    ══════════════════════════════════════════════════════════ */

    var _ssaChart    = null;
    var _ssaYearData = [];
    var _ssaView     = 'both';

    var SSA_RATE = 0.082;   // 8.2% p.a. (current FY25)
    var SSA_MATURITY_AGE = 21;

    function ssaFormat(el) {
        var raw = (el.value || '').replace(/[^0-9]/g, '');
        el.value = raw ? Number(raw).toLocaleString('en-IN') : '';
    }

    function ssaNum(id) {
        return parseFloat((document.getElementById(id)?.value || '').replace(/,/g, '')) || 0;
    }

    function ssaFmt(n) {
        if (n >= 1e7) return '₹' + (n/1e7).toFixed(2) + ' Cr';
        if (n >= 1e5) return '₹' + (n/1e5).toFixed(2) + ' L';
        return '₹' + Math.round(n).toLocaleString('en-IN');
    }

    function initSSAPlanner() {
        var curYear = new Date().getFullYear();
        var defs = {
            'ssa-dob-year':    String(curYear - 5),
            'ssa-annual':      '1,50,000',
            'ssa-tenure':      '15',
            'ssa-elss-sip':    '5,000',
            'ssa-elss-return': '12',
            'ssa-inflation':   '8',
            'ssa-goal-edu':    '25,00,000',
            'ssa-goal-marr':   '30,00,000'
        };
        Object.keys(defs).forEach(function(id) {
            var el = document.getElementById(id);
            if (!el) return;
            if (!el.value || el.value === defs[id]) { el.classList.add('text-slate-400'); }
            else { el.classList.remove('text-slate-400'); }
        });
        ssaCalc();
    }

    function ssaPreset(dobYear, annual, tenure, elssSip, elssReturn, inflation, goalEdu, goalMarr) {
        var fields = {
            'ssa-dob-year':    String(dobYear),
            'ssa-annual':      Number(annual).toLocaleString('en-IN'),
            'ssa-tenure':      String(tenure),
            'ssa-elss-sip':    Number(elssSip).toLocaleString('en-IN'),
            'ssa-elss-return': String(elssReturn),
            'ssa-inflation':   String(inflation),
            'ssa-goal-edu':    Number(goalEdu).toLocaleString('en-IN'),
            'ssa-goal-marr':   Number(goalMarr).toLocaleString('en-IN')
        };
        Object.entries(fields).forEach(function([id, val]) {
            var el = document.getElementById(id);
            if (!el) return;
            el.value = val;
            el.classList.remove('text-slate-400');
        });
        ssaCalc();
    }

    function resetSSAPlanner() {
        var curYear = new Date().getFullYear();
        ssaPreset(curYear - 5, 150000, 15, 5000, 12, 8, 2500000, 3000000);
        ['ssa-dob-year','ssa-annual','ssa-tenure','ssa-elss-sip','ssa-elss-return','ssa-inflation','ssa-goal-edu','ssa-goal-marr']
            .forEach(function(id) { var el=document.getElementById(id); if(el) el.classList.add('text-slate-400'); });
        if (typeof saveUserData === 'function') saveUserData();
    }

    function ssaToggleTable() {
        var wrap = document.getElementById('ssa-table-wrap');
        var btn  = document.getElementById('ssa-table-btn');
        wrap.classList.toggle('hidden');
        btn.textContent = wrap.classList.contains('hidden') ? _t('common.show') : _t('common.hide');
    }

    function ssaChartView(view) {
        _ssaView = view;
        ['both','ssa','annual'].forEach(function(v) {
            var btn = document.getElementById('ssa-btn-' + v);
            if (btn) btn.classList.toggle('ssa-chart-btn-active', v === view);
        });
        ssaRenderChart(_ssaYearData);
    }

    function ssaCalc() {
        var dobYear    = Math.round(ssaNum('ssa-dob-year'));
        var annual     = ssaNum('ssa-annual');
        var tenure     = Math.min(Math.round(ssaNum('ssa-tenure')), 15);
        var elssSip    = ssaNum('ssa-elss-sip');
        var elssReturn = ssaNum('ssa-elss-return') / 100;
        var inflation  = ssaNum('ssa-inflation')   / 100;
        var goalEduToday  = ssaNum('ssa-goal-edu');
        var goalMarrToday = ssaNum('ssa-goal-marr');

        var curYear = new Date().getFullYear();
        var curAge  = curYear - dobYear;
        var yearsToMaturity = SSA_MATURITY_AGE - curAge;
        var yearsToEdu      = 18 - curAge;

        // Show age eligibility warning — SSA can only be opened for child below age 10
        var ageWarn = document.getElementById('ssa-age-warn');
        var ageDisp = document.getElementById('ssa-age-display');
        var isIneligible = false;
        if (ageWarn && ageDisp && dobYear > 2000) {
            if (curAge >= 10) {
                ageDisp.textContent = curAge + _t('common.years.old');
                ageWarn.classList.remove('hidden');
                isIneligible = true;
            } else {
                ageWarn.classList.add('hidden');
            }
        }

        if (!dobYear || !annual || yearsToMaturity <= 0) return;
        if (isIneligible) return;  // SSA cannot be opened for child aged 10+

        // Inflation-adjusted future goal costs
        var yrsToEduActual  = Math.max(yearsToEdu,  1);
        var yrsToMarrActual = Math.max(yearsToMaturity, 1);
        var goalEduFuture   = goalEduToday  * Math.pow(1 + inflation, yrsToEduActual);
        var goalMarrFuture  = goalMarrToday * Math.pow(1 + inflation, yrsToMarrActual);

        // ── SSA + ELSS calculation ────────────────────────────────────
        var ssaBalance       = 0;
        var ssaInvested      = 0;
        var ssaInterestTotal = 0;
        var elssCorpus       = 0;
        var elssInvested     = 0;
        var elssMonthRate    = elssReturn / 12;
        var depositYears     = Math.min(tenure, yearsToMaturity);
        var yearData         = [];

        for (var yr = 1; yr <= yearsToMaturity; yr++) {
            var deposit  = (yr <= depositYears) ? annual : 0;
            var interest = (ssaBalance + deposit) * SSA_RATE;
            ssaBalance       += deposit + interest;
            ssaInvested      += deposit;
            ssaInterestTotal += interest;

            for (var m = 0; m < 12; m++) {
                elssCorpus = (elssCorpus + elssSip) * (1 + elssMonthRate);
            }
            elssInvested += elssSip * 12;

            // Inflation-adjusted goal at this year
            var yrsFromNow  = yr;
            var inflGoal    = (yrsFromNow <= yrsToEduActual)
                ? goalEduToday * Math.pow(1 + inflation, yrsFromNow)
                : goalMarrToday * Math.pow(1 + inflation, yrsFromNow);

            yearData.push({
                year:        curYear + yr,
                age:         curAge  + yr,
                deposit:     Math.round(deposit),
                ssaInterest: Math.round(interest),
                ssaBalance:  Math.round(ssaBalance),
                elssCorpus:  Math.round(elssCorpus),
                combined:    Math.round(ssaBalance + elssCorpus),
                inflGoal:    Math.round(inflGoal)
            });
        }

        _ssaYearData = yearData;

        var totalCorpus = ssaBalance + elssCorpus;
        var elssGains   = elssCorpus - elssInvested;
        var tax80C      = Math.min(ssaInvested, 150000 * depositYears) * 0.30;

        // Corpus available at education age
        var eduYrIdx    = Math.max(0, Math.min(yearsToEdu - 1, yearData.length - 1));
        var corpusAtEdu = yearData[eduYrIdx] ? yearData[eduYrIdx].combined : 0;

        // ── Timeline bar ──────────────────────────────────────────────
        var tbarEl = document.getElementById('ssa-timeline-bar');
        if (tbarEl) {
            if (curAge > 10) {
                tbarEl.style.background = '#fff7ed'; tbarEl.style.borderColor = '#fed7aa'; tbarEl.style.color = '#92400e';
                tbarEl.innerHTML = '⚠️ SSA can only be opened for daughters aged 0–10. Your daughter is currently ' + curAge + '. Showing ELSS-only projection.';
            } else {
                tbarEl.style.background = '#fdf2f8'; tbarEl.style.borderColor = '#fbcfe8'; tbarEl.style.color = '#9d174d';
                tbarEl.innerHTML = '👧 Age <strong>' + curAge + '</strong> · <strong>' + depositYears + ' deposit years</strong> · Matures in <strong>' + yearsToMaturity + ' yrs</strong> · Inflation applied: <strong>' + (inflation*100).toFixed(1) + '%/yr</strong>';
            }
        }

        // ── Hero cards ────────────────────────────────────────────────
        document.getElementById('ssa-maturity-val').textContent = ssaFmt(ssaBalance);
        document.getElementById('ssa-elss-val').textContent     = ssaFmt(elssCorpus);
        document.getElementById('ssa-total-val').textContent    = ssaFmt(totalCorpus);

        // ── Inflation-adjusted goal panel ─────────────────────────────
        document.getElementById('ssa-edu-inflated').textContent  = ssaFmt(goalEduFuture);
        document.getElementById('ssa-edu-todaycost').textContent = 'today: ' + ssaFmt(goalEduToday);
        document.getElementById('ssa-marr-inflated').textContent  = ssaFmt(goalMarrFuture);
        document.getElementById('ssa-marr-todaycost').textContent = 'today: ' + ssaFmt(goalMarrToday);

        // ── Stats ─────────────────────────────────────────────────────
        document.getElementById('ssa-invested').textContent   = ssaFmt(ssaInvested);
        document.getElementById('ssa-interest').textContent   = ssaFmt(ssaInterestTotal);
        document.getElementById('ssa-elss-gains').textContent = ssaFmt(elssGains);
        document.getElementById('ssa-taxsaved').textContent   = ssaFmt(tax80C);

        // ── Goal bars (vs inflation-adjusted costs) ───────────────────
        function setGoalBar(barId, labelId, noteId, corpus, goalFuture, goalToday, yrsAway) {
            var pct  = goalFuture > 0 ? Math.min((corpus / goalFuture) * 100, 100) : 0;
            var bar  = document.getElementById(barId);
            var lbl  = document.getElementById(labelId);
            var note = document.getElementById(noteId);
            if (bar)  bar.style.width = pct.toFixed(1) + '%';
            if (lbl)  lbl.textContent = ssaFmt(corpus) + ' / ' + ssaFmt(goalFuture) + ' (' + pct.toFixed(0) + '%)';
            if (note) {
                var shortfall = goalFuture - corpus;
                note.textContent = shortfall > 0
                    ? '⚠ Shortfall ₹' + ssaFmt(shortfall).replace('₹','') + ' — need ~' + ssaFmt(Math.ceil(shortfall / Math.max(yrsAway * 12, 1))) + '/mo extra ELSS'
                    : '✅ Goal covered! Surplus: ' + ssaFmt(-shortfall);
                note.style.color = shortfall > 0 ? '#dc2626' : '#059669';
            }
        }
        setGoalBar('ssa-edu-bar',  'ssa-edu-label',  'ssa-edu-note',  corpusAtEdu, goalEduFuture,  goalEduToday,  yrsToEduActual);
        setGoalBar('ssa-marr-bar', 'ssa-marr-label', 'ssa-marr-note', totalCorpus, goalMarrFuture, goalMarrToday, yrsToMarrActual);

        // ── Insight ───────────────────────────────────────────────────
        var ins = document.getElementById('ssa-insight');
        ins.classList.remove('hidden');
        ins.innerHTML =
            '<strong>💡 Inflation Reality:</strong> Your education goal of ' + ssaFmt(goalEduToday) + ' today will cost <strong>' + ssaFmt(goalEduFuture) + '</strong> in ' + yrsToEduActual + ' yrs at ' + (inflation*100).toFixed(0) + '% inflation. ' +
            'Marriage goal of ' + ssaFmt(goalMarrToday) + ' becomes <strong>' + ssaFmt(goalMarrFuture) + '</strong>. ' +
            'Your SSA gives <strong>' + ssaFmt(ssaInterestTotal) + ' tax-free</strong> guaranteed return. Combined corpus: <strong>' + ssaFmt(totalCorpus) + '</strong>. ' +
            '80C deduction saves ~' + ssaFmt(tax80C) + ' in taxes.';

        // ── Table ─────────────────────────────────────────────────────
        var rows = '';
        yearData.forEach(function(d, i) {
            var bg = i % 2 === 0 ? 'background:#fdf2f8;' : '';
            var ms = d.age === 18 ? ' 🎓' : d.age === 21 ? ' 🎉' : '';
            rows += '<tr style="' + bg + '">' +
                '<td class="px-2 py-1 font-black text-slate-600">' + d.year + ms + '</td>' +
                '<td class="px-2 py-1 text-right text-slate-500">'  + d.age + '</td>' +
                '<td class="px-2 py-1 text-right text-pink-600">'   + (d.deposit ? ssaFmt(d.deposit) : '—') + '</td>' +
                '<td class="px-2 py-1 text-right text-emerald-600 font-bold">' + ssaFmt(d.ssaInterest) + '</td>' +
                '<td class="px-2 py-1 text-right font-black text-pink-800">'  + ssaFmt(d.ssaBalance)  + '</td>' +
                '<td class="px-2 py-1 text-right font-bold text-blue-700">'   + ssaFmt(d.elssCorpus)  + '</td>' +
                '<td class="px-2 py-1 text-right text-amber-600">'            + ssaFmt(d.inflGoal)    + '</td>' +
                '<td class="px-2 py-1 text-right font-black text-purple-800">' + ssaFmt(d.combined)   + '</td>' +
            '</tr>';
        });
        document.getElementById('ssa-table-body').innerHTML = rows;

        ssaRenderChart(yearData);
        if (typeof saveUserData === 'function') saveUserData();
    }

    function ssaRenderChart(yearData) {
        if (!yearData || yearData.length === 0) return;
        var canvas = document.getElementById('ssa-chart-canvas');
        if (!canvas) return;
        if (_ssaChart) { _ssaChart.destroy(); _ssaChart = null; }

        var labels   = yearData.map(function(d) { return 'Age ' + d.age; });
        var INR      = function(v) {
            if (v >= 1e7) return '₹' + (v/1e7).toFixed(2) + ' Cr';
            if (v >= 1e5) return '₹' + (v/1e5).toFixed(2) + ' L';
            return '₹' + Math.round(v).toLocaleString('en-IN');
        };

        var datasets = [];
        var chartType = 'line';

        if (_ssaView === 'both') {
            datasets = [
                { label: 'SSA Balance',    data: yearData.map(function(d){return d.ssaBalance;}),  borderColor:'#ec4899', backgroundColor:'rgba(236,72,153,0.10)', fill:true,  tension:0.35, borderWidth:2.5, pointRadius:0, pointHoverRadius:5 },
                { label: 'ELSS Corpus',    data: yearData.map(function(d){return d.elssCorpus;}),  borderColor:'#3b82f6', backgroundColor:'rgba(59,130,246,0.08)', fill:true,  tension:0.35, borderWidth:2,   pointRadius:0, pointHoverRadius:5 },
                { label: 'Combined Total', data: yearData.map(function(d){return d.combined;}),    borderColor:'#22c55e', backgroundColor:'rgba(34,197,94,0.06)',  fill:false, tension:0.35, borderWidth:2,   pointRadius:0, pointHoverRadius:5, borderDash:[5,3] }
            ];
        } else if (_ssaView === 'ssa') {
            var cumDep = [], cumInt = [];
            var cd = 0, ci = 0;
            yearData.forEach(function(d) {
                cd += d.deposit; ci += d.ssaInterest;
                cumDep.push(cd); cumInt.push(ci);
            });
            datasets = [
                { label: 'SSA Balance',           data: yearData.map(function(d){return d.ssaBalance;}), borderColor:'#ec4899', backgroundColor:'rgba(236,72,153,0.10)', fill:true, tension:0.35, borderWidth:2.5, pointRadius:0, pointHoverRadius:5 },
                { label: 'Cum. Deposits (cost)',  data: cumDep, borderColor:'#94a3b8', backgroundColor:'rgba(148,163,184,0.08)', fill:true, tension:0.35, borderWidth:1.5, pointRadius:0, pointHoverRadius:4, borderDash:[4,3] },
                { label: 'Cum. Interest (free!)', data: cumInt, borderColor:'#22c55e', backgroundColor:'rgba(34,197,94,0.08)', fill:true, tension:0.35, borderWidth:1.5, pointRadius:0, pointHoverRadius:4 }
            ];
        } else {
            chartType = 'bar';
            datasets = [
                { label: 'SSA Annual Deposit', data: yearData.map(function(d){return d.deposit;}),     backgroundColor:'rgba(236,72,153,0.75)', borderRadius:4 },
                { label: 'SSA Interest',        data: yearData.map(function(d){return d.ssaInterest;}), backgroundColor:'rgba(34,197,94,0.75)',  borderRadius:4 }
            ];
        }

        _ssaChart = new Chart(canvas.getContext('2d'), {
            type: chartType,
            data: { labels: labels, datasets: datasets },
            options: {
                responsive: true, maintainAspectRatio: false,
                interaction: { mode: 'index', intersect: false },
                plugins: {
                    legend: {
                        display: true, position: 'bottom',
                        labels: { boxWidth:12, boxHeight:3, font:{size:10,weight:'bold'}, color:'#64748b', padding:12, usePointStyle:true }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(12,35,64,0.93)',
                        titleFont: { size:11, weight:'bold', family:'Inter, sans-serif' },
                        bodyFont:  { size:12, weight:'bold', family:'Inter, sans-serif' },
                        padding:12, cornerRadius:10,
                        borderColor:'rgba(245,200,66,0.35)', borderWidth:1,
                        callbacks: {
                            title: function(items) {
                                var idx = items[0].dataIndex;
                                var d   = _ssaYearData[idx];
                                return items[0].label + (d && d.age === 21 ? ' 🎉 Maturity' : d && d.age === 18 ? ' 🎓 College' : '');
                            },
                            label: function(ctx) {
                                return ' ' + ctx.dataset.label + ': ' + INR(ctx.raw);
                            },
                            afterBody: function(items) {
                                var idx = items[0].dataIndex;
                                var d   = _ssaYearData[idx];
                                if (!d) return [];
                                return ['', ' Combined: ' + INR(d.combined)];
                            }
                        }
                    }
                },
                scales: {
                    x: { grid:{display:false}, ticks:{font:{size:9}, color:'#94a3b8', maxTicksLimit:10, maxRotation:0} },
                    y: { grid:{color:'rgba(226,232,240,0.6)'}, ticks:{font:{size:9}, color:'#94a3b8', callback:function(v){return INR(v);}} }
                }
            }
        });
    }

