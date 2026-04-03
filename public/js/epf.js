    /* ══════════════════════════════════════════════════════════
       EPF CORPUS PROJECTOR
    ══════════════════════════════════════════════════════════ */

    var _epfChart    = null;
    var _epfYearData = [];   // cached for chart view switching
    var _epfView     = 'corpus';

    function epfFormat(el) {
        var raw = (el.value || '').replace(/[^0-9]/g, '');
        el.value = raw ? Number(raw).toLocaleString('en-IN') : '';
    }

    function epfNum(id) {
        return parseFloat((document.getElementById(id)?.value || '').replace(/,/g, '')) || 0;
    }

    function epfFmt(n) {
        if (n >= 1e7) return '₹' + (n / 1e7).toFixed(2) + ' Cr';
        if (n >= 1e5) return '₹' + (n / 1e5).toFixed(2) + ' L';
        return '₹' + Math.round(n).toLocaleString('en-IN');
    }

    function initEPFCalc() {
        var defs = {'epf-basic':'50,000','epf-balance':'2,00,000','epf-age':'30','epf-retire':'60','epf-growth':'8','epf-rate':'8.15'};
        Object.keys(defs).forEach(function(id) {
            var el = document.getElementById(id);
            if (!el) return;
            if (!el.value || el.value === defs[id]) { el.classList.add('text-slate-400'); }
            else { el.classList.remove('text-slate-400'); }
        });
        epfCalc();
    }

    function epfPreset(basic, balance, age, retire, growth, rate) {
        var fields = {
            'epf-basic':   Number(basic).toLocaleString('en-IN'),
            'epf-balance': Number(balance).toLocaleString('en-IN'),
            'epf-age':     String(age),
            'epf-retire':  String(retire),
            'epf-growth':  String(growth),
            'epf-rate':    String(rate)
        };
        Object.entries(fields).forEach(function([id, val]) {
            var el = document.getElementById(id);
            if (!el) return;
            el.value = val;
            el.classList.remove('text-slate-400');
        });
        epfCalc();
    }

    function resetEPFCalc() {
        epfPreset(50000, 200000, 30, 60, 8, 8.15);
        // Re-grey defaults
        var defs = {'epf-basic':'50,000','epf-balance':'2,00,000','epf-age':'30','epf-retire':'60','epf-growth':'8','epf-rate':'8.15'};
        Object.keys(defs).forEach(function(id) {
            var el = document.getElementById(id);
            if (el) el.classList.add('text-slate-400');
        });
        if (typeof saveUserData === 'function') saveUserData();
    }

    function epfToggleTable() {
        var wrap = document.getElementById('epf-table-wrap');
        var btn  = document.getElementById('epf-table-btn');
        var hidden = wrap.classList.toggle('hidden');
        btn.textContent = hidden ? _t('common.show') : _t('common.hide');
    }

    function epfChartView(view) {
        _epfView = view;
        ['corpus','contrib','salary'].forEach(function(v) {
            var btn = document.getElementById('epf-btn-' + v);
            if (btn) {
                btn.classList.toggle('epf-chart-btn-active', v === view);
            }
        });
        epfRenderChart(_epfYearData);
    }

    function epfCalc() {
        var basic   = epfNum('epf-basic');
        var balance = epfNum('epf-balance');
        var age     = Math.round(epfNum('epf-age'));
        var retire  = Math.round(epfNum('epf-retire'));
        var growth  = epfNum('epf-growth') / 100;
        var iRate   = epfNum('epf-rate')   / 100;

        if (!basic || !age || !retire || age >= retire) return;

        var years = retire - age;

        // EPF rules:
        // Employee contribution: 12% of Basic+DA → full to EPF
        // Employer contribution: 12% of Basic+DA → 8.33% to EPS (capped ₹15k basic → max ₹1250/mo) + rest to EPF
        // EPS wage ceiling: ₹15,000/mo

        var corpus        = balance;
        var totalEmpC     = 0;
        var totalErC      = 0;   // employer EPF only (not EPS)
        var totalInterest = 0;
        var totalEPS      = 0;   // EPS contributions (not in EPF balance)
        var yearData      = [];
        var curBasic      = basic;
        var EPS_CEILING   = 15000;
        var EPS_RATE      = 0.0833;   // 8.33%
        var EPF_RATE      = 0.12;     // 12%

        for (var yr = 1; yr <= years; yr++) {
            if (yr > 1) curBasic = curBasic * (1 + growth);

            var empMonthly  = curBasic * EPF_RATE;           // 12% employee → EPF
            var epsBase     = Math.min(curBasic, EPS_CEILING);
            var epsMonthly  = epsBase * EPS_RATE;             // EPS (pension fund)
            var erEPFMonthly = (curBasic * EPF_RATE) - epsMonthly; // Employer to EPF = 12% - EPS

            var empAnnual  = empMonthly  * 12;
            var erEPFAnnual = erEPFMonthly * 12;
            var epsAnnual  = epsMonthly  * 12;

            totalEmpC += empAnnual;
            totalErC  += erEPFAnnual;
            totalEPS  += epsAnnual;

            // Interest on opening balance + contributions (simplification: add contribs mid-year)
            var openingBal = corpus;
            var annualContrib = empAnnual + erEPFAnnual;
            var interest   = (openingBal + annualContrib / 2) * iRate;
            corpus += annualContrib + interest;
            totalInterest += interest;

            yearData.push({
                age:        age + yr,
                basic:      Math.round(curBasic),
                empC:       Math.round(empAnnual),
                erC:        Math.round(erEPFAnnual),
                epsC:       Math.round(epsAnnual),
                interest:   Math.round(interest),
                balance:    Math.round(corpus)
            });
        }

        _epfYearData = yearData;

        var totalContrib = balance + totalEmpC + totalErC;
        var mult = totalContrib > 0 ? (corpus / totalContrib).toFixed(2) : 0;

        // EPS pension (simplified): 15-yr avg pensionable salary × service / 70
        // Pensionable salary = min(basic, 15000) at retirement; service = years
        var lastBasic    = curBasic;
        var pensionSalary = Math.min(lastBasic, EPS_CEILING);
        var monthlyPension = Math.round((pensionSalary * Math.min(years, 35)) / 70);

        // Monthly contribution currently
        var curEmpC = basic * EPF_RATE;
        var curEPS  = Math.min(basic, EPS_CEILING) * EPS_RATE;
        var curErC  = (basic * EPF_RATE) - curEPS;
        var curTotal = curEmpC + curErC;

        // Final year
        var finalYr = yearData[yearData.length - 1];

        // ── DOM updates ──────────────────────────────────────────
        document.getElementById('epf-total-corpus').textContent  = epfFmt(corpus);
        document.getElementById('epf-total-interest').textContent = epfFmt(totalInterest);
        document.getElementById('epf-total-contrib').textContent  = epfFmt(totalContrib);
        document.getElementById('epf-monthly-contrib').textContent = epfFmt(Math.round(curTotal)) + '/mo';
        document.getElementById('epf-final-contrib').textContent   = epfFmt(Math.round((finalYr.empC + finalYr.erC) / 12)) + '/mo';
        document.getElementById('epf-years-left').textContent    = years + ' yrs';
        document.getElementById('epf-interest-mult').textContent  = mult + 'x';
        document.getElementById('epf-final-salary').textContent   = epfFmt(Math.round(lastBasic));
        document.getElementById('epf-pension').textContent        = epfFmt(monthlyPension) + '/mo';
        // Pension formula sub-note: (pensionSalary × service) / 70
        document.getElementById('epf-pension-formula').textContent =
            '(' + epfFmt(pensionSalary) + ' × ' + Math.min(years, 35) + ' yrs) ÷ 70';

        // Insight
        var ins = document.getElementById('epf-insight');
        ins.classList.remove('hidden');
        var curEPSMonthly = Math.min(basic, EPS_CEILING) * EPS_RATE;
        var curErEPFMonthly = (basic * EPF_RATE) - curEPSMonthly;
        ins.innerHTML =
            '<strong>💡 Insight:</strong> Your EPF is an <strong>automatic, compulsory, tax-free</strong> retirement fund. ' +
            'Employee + employer together contribute ' + epfFmt(Math.round(curTotal)) + '/mo today ' +
            '(you: ' + epfFmt(Math.round(curEmpC)) + ' + employer EPF: ' + epfFmt(Math.round(curErEPFMonthly)) + ' + EPS pension: ' + epfFmt(Math.round(curEPSMonthly)) + '). ' +
            'At ' + iRate * 100 + '% compounded for ' + years + ' years, interest alone adds ' + epfFmt(totalInterest) + ' — ' +
            '<strong>' + mult + 'x your total contributions</strong>. ' +
            'You\'ll also receive an EPS pension of ~' + epfFmt(monthlyPension) + '/mo after retirement, calculated as ' +
            '(' + epfFmt(pensionSalary) + ' × ' + Math.min(years, 35) + ' yrs) ÷ 70. ' +
            '<span style="color:#b91c1c;"><strong>⚠ Tax reminder:</strong> Withdrawing before 5 years of service makes the entire amount taxable at your slab rate with 10% TDS (u/s 192A) if &gt;₹50K. After 5 years it is fully tax-free.</span>';

        // Table
        var rows = '';
        yearData.forEach(function(d, i) {
            var bg = i % 2 === 0 ? 'background:#f0f9ff;' : '';
            rows += '<tr style="' + bg + '">' +
                '<td class="px-2 py-1 font-black text-slate-600">' + d.age + '</td>' +
                '<td class="px-2 py-1 text-right text-slate-600">' + epfFmt(d.basic) + '/mo</td>' +
                '<td class="px-2 py-1 text-right text-slate-500">' + epfFmt(d.empC) + '</td>' +
                '<td class="px-2 py-1 text-right text-blue-600">' + epfFmt(d.erC) + '</td>' +
                '<td class="px-2 py-1 text-right text-emerald-600 font-bold">' + epfFmt(d.interest) + '</td>' +
                '<td class="px-2 py-1 text-right font-black text-blue-800">' + epfFmt(d.balance) + '</td>' +
            '</tr>';
        });
        document.getElementById('epf-table-body').innerHTML = rows;

        // Chart
        epfRenderChart(yearData);

        if (typeof saveUserData === 'function') saveUserData();
    }

    function epfRenderChart(yearData) {
        if (!yearData || yearData.length === 0) return;
        var canvas = document.getElementById('epf-chart-canvas');
        if (!canvas) return;

        if (_epfChart) { _epfChart.destroy(); _epfChart = null; }

        var labels = yearData.map(function(d) { return 'Age ' + d.age; });

        var INR = function(v) {
            if (v >= 1e7) return '₹' + (v/1e7).toFixed(2) + ' Cr';
            if (v >= 1e5) return '₹' + (v/1e5).toFixed(2) + ' L';
            return '₹' + Math.round(v).toLocaleString('en-IN');
        };

        var datasets = [];

        if (_epfView === 'corpus') {
            // Running balance + cumulative interest stacked
            var cumEmp  = [], cumEr = [], cumInt = [], runBal = [];
            var ce = 0, cer = 0;
            yearData.forEach(function(d) {
                ce  += d.empC;
                cer += d.erC;
                cumEmp.push(ce);
                cumEr.push(cer);
                cumInt.push(d.balance - ce - cer - epfNum('epf-balance'));
                runBal.push(d.balance);
            });
            datasets = [
                { label: 'EPF Balance',        data: runBal, borderColor: '#0ea5e9', backgroundColor: 'rgba(14,165,233,0.12)', fill: true,  tension: 0.35, borderWidth: 2.5, pointRadius: 0, pointHoverRadius: 5 },
                { label: 'Employee Contrib (cum)', data: cumEmp, borderColor: '#6366f1', backgroundColor: 'rgba(99,102,241,0.08)', fill: true, tension: 0.35, borderWidth: 1.5, pointRadius: 0, pointHoverRadius: 4, borderDash: [4,3] },
                { label: 'Employer Contrib (cum)', data: cumEr,  borderColor: '#22c55e', backgroundColor: 'rgba(34,197,94,0.06)', fill: true, tension: 0.35, borderWidth: 1.5, pointRadius: 0, pointHoverRadius: 4, borderDash: [4,3] }
            ];
        } else if (_epfView === 'contrib') {
            // Annual contributions bar chart
            datasets = [
                { type: 'bar', label: 'Employee Annual',  data: yearData.map(function(d){return d.empC;}), backgroundColor: 'rgba(99,102,241,0.75)', borderRadius: 4, order: 2 },
                { type: 'bar', label: 'Employer Annual',  data: yearData.map(function(d){return d.erC;}),  backgroundColor: 'rgba(34,197,94,0.75)',  borderRadius: 4, order: 2 },
                { type: 'bar', label: 'Interest Earned',  data: yearData.map(function(d){return d.interest;}), backgroundColor: 'rgba(245,158,11,0.75)', borderRadius: 4, order: 2 }
            ];
        } else {
            // Salary track line
            datasets = [
                { label: 'Basic Salary/mo', data: yearData.map(function(d){return d.basic;}),            borderColor: '#f59e0b', backgroundColor: 'rgba(245,158,11,0.10)', fill: true, tension: 0.35, borderWidth: 2.5, pointRadius: 0, pointHoverRadius: 5 },
                { label: 'Employee EPF/mo', data: yearData.map(function(d){return Math.round(d.empC/12);}), borderColor: '#6366f1', backgroundColor: 'rgba(99,102,241,0.08)', fill: true, tension: 0.35, borderWidth: 1.5, pointRadius: 0, pointHoverRadius: 4 },
                { label: 'Employer EPF/mo', data: yearData.map(function(d){return Math.round(d.erC/12);}),  borderColor: '#22c55e', backgroundColor: 'rgba(34,197,94,0.06)',  fill: true, tension: 0.35, borderWidth: 1.5, pointRadius: 0, pointHoverRadius: 4 }
            ];
        }

        _epfChart = new Chart(canvas.getContext('2d'), {
            type: _epfView === 'contrib' ? 'bar' : 'line',
            data: { labels: labels, datasets: datasets },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: { mode: 'index', intersect: false },
                plugins: {
                    legend: {
                        display: true, position: 'bottom',
                        labels: { boxWidth: 12, boxHeight: 3, font: { size: 10, weight: 'bold' }, color: '#64748b', padding: 12, usePointStyle: true }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(12,35,64,0.93)',
                        titleFont: { size: 11, weight: 'bold', family: 'Inter, sans-serif' },
                        bodyFont:  { size: 12, weight: 'bold', family: 'Inter, sans-serif' },
                        padding: 12, cornerRadius: 10,
                        borderColor: 'rgba(245,200,66,0.35)', borderWidth: 1,
                        callbacks: {
                            title: function(items) { return items[0].label; },
                            label: function(ctx) {
                                return ' ' + ctx.dataset.label + ': ' + INR(ctx.raw);
                            },
                            afterBody: function(items) {
                                var i = items[0].dataIndex;
                                var d = _epfYearData[i];
                                if (!d) return [];
                                return ['', ' Monthly SIP equiv: ' + INR(Math.round((d.empC + d.erC) / 12))];
                            }
                        }
                    }
                },
                scales: {
                    x: { stacked: _epfView === 'contrib', grid: { display: false }, ticks: { font: { size: 9 }, color: '#94a3b8', maxTicksLimit: 10, maxRotation: 0 } },
                    y: {
                        stacked: false,
                        grid: { color: 'rgba(226,232,240,0.6)' },
                        ticks: { font: { size: 9 }, color: '#94a3b8', callback: function(v) { return INR(v); } }
                    }
                }
            }
        });
    }

