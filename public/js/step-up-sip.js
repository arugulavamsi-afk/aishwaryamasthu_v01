    /* ══════════════════════════════════════════════════════════════
       STEP-UP SIP CALCULATOR
    ══════════════════════════════════════════════════════════════ */

    function initStepUpSIP() {
        // Re-apply colours: grey if default, dark if user value
        var suDefaults = {'su-amount':'5,000','su-rate':'12','su-years':'20','su-stepup':'10'};
        Object.keys(suDefaults).forEach(function(id) {
            var el = document.getElementById(id);
            if (!el) return;
            if (!el.value || el.value === suDefaults[id]) {
                el.classList.add('text-slate-400');
            } else {
                el.classList.remove('text-slate-400');
            }
        });
        stepUpCalc();
    }

    function suNum(id) {
        return parseFloat((document.getElementById(id)?.value || '').replace(/,/g, '')) || 0;
    }

    function suFmt(n) {
        if (n >= 1e7) return '₹' + (n / 1e7).toFixed(2) + ' Cr';
        if (n >= 1e5) return '₹' + (n / 1e5).toFixed(2) + ' L';
        return '₹' + Math.round(n).toLocaleString('en-IN');
    }

    function suFmtFull(n) {
        return '₹' + Math.round(n).toLocaleString('en-IN');
    }

    function suFormat(el) {
        var raw = (el.value || '').replace(/[^0-9]/g, '');
        el.value = raw ? Number(raw).toLocaleString('en-IN') : '';
    }

    function suPreset(amount, rate, years, stepup) {
        var amtEl = document.getElementById('su-amount');
        amtEl.value = Number(amount).toLocaleString('en-IN');
        amtEl.classList.remove('text-slate-400');
        var rEl = document.getElementById('su-rate');
        rEl.value = rate; rEl.classList.remove('text-slate-400');
        var yEl = document.getElementById('su-years');
        yEl.value = years; yEl.classList.remove('text-slate-400');
        var sEl = document.getElementById('su-stepup');
        sEl.value = stepup; sEl.classList.remove('text-slate-400');
        stepUpCalc();
    }

    function suToggleTable() {
        var wrap = document.getElementById('su-table-wrap');
        var btn  = document.getElementById('su-table-btn');
        var hidden = wrap.classList.toggle('hidden');
        btn.textContent = hidden ? _t('common.show.tbl') : _t('common.hide.tbl');
    }

    function resetStepUpSIP() {
        document.getElementById('su-amount').value = '5,000';  document.getElementById('su-amount').classList.add('text-slate-400');
        document.getElementById('su-rate').value   = '12';     document.getElementById('su-rate').classList.add('text-slate-400');
        document.getElementById('su-years').value  = '20';     document.getElementById('su-years').classList.add('text-slate-400');
        document.getElementById('su-stepup').value = '10';     document.getElementById('su-stepup').classList.add('text-slate-400');
        var suLtcgTog = document.getElementById('su-ltcg-toggle');
        if (suLtcgTog) suLtcgTog.checked = false;
        var suLtcgNote = document.getElementById('su-ltcg-note');
        if (suLtcgNote) suLtcgNote.classList.add('hidden');
        stepUpCalc();
        if (typeof saveUserData === 'function') saveUserData();
    }

    function stepUpCalc() {
        var sip    = suNum('su-amount');
        var rate   = suNum('su-rate');
        var years  = Math.round(suNum('su-years'));
        var stepup = suNum('su-stepup');

        if (!sip || !rate || !years) return;

        var mRate = rate / 100 / 12;

        // ── Flat SIP ──────────────────────────────────────────────
        var flatCorpus   = 0;
        var flatInvested = 0;
        var flatData     = []; // year-end corpus values

        for (var yr = 1; yr <= years; yr++) {
            for (var m = 1; m <= 12; m++) {
                flatCorpus = (flatCorpus + sip) * (1 + mRate);
            }
            flatInvested += sip * 12;
            flatData.push({ corpus: flatCorpus, invested: flatInvested });
        }

        // ── Step-Up SIP ───────────────────────────────────────────
        var suCorpus   = 0;
        var suInvested = 0;
        var suData     = [];
        var curSIP     = sip;

        for (var yr = 1; yr <= years; yr++) {
            if (yr > 1) curSIP = curSIP * (1 + stepup / 100);
            for (var m = 1; m <= 12; m++) {
                suCorpus = (suCorpus + curSIP) * (1 + mRate);
            }
            suInvested += curSIP * 12;
            suData.push({ corpus: suCorpus, invested: suInvested, sip: curSIP });
        }

        var finalSIP      = curSIP;
        var extraWealth   = suCorpus - flatCorpus;
        var extraInvested = suInvested - flatInvested;
        var multiplier    = flatCorpus > 0 ? (suCorpus / flatCorpus).toFixed(2) : 0;

        // ── LTCG Tax adjustment ───────────────────────────────────
        var ltcgEnabled = document.getElementById('su-ltcg-toggle') && document.getElementById('su-ltcg-toggle').checked;
        var flatDispCorpus = flatCorpus;
        var suDispCorpus   = suCorpus;

        function applyLTCG(corpus, invested) {
            var gain = Math.max(0, corpus - invested);
            // ₹1.25L/yr exempt — spread over holding years
            var totalExempt = 125000 * years;
            var taxableGain = Math.max(0, gain - totalExempt);
            return corpus - taxableGain * 0.125;
        }

        if (ltcgEnabled) {
            flatDispCorpus = applyLTCG(flatCorpus, flatInvested);
            suDispCorpus   = applyLTCG(suCorpus,   suInvested);
            document.getElementById('su-ltcg-note').classList.remove('hidden');
        } else {
            document.getElementById('su-ltcg-note').classList.add('hidden');
        }

        var dispExtraWealth = suDispCorpus - flatDispCorpus;
        var dispMultiplier  = flatDispCorpus > 0 ? (suDispCorpus / flatDispCorpus).toFixed(2) : 0;

        // ── Update hero cards ─────────────────────────────────────
        document.getElementById('su-flat-corpus').textContent    = suFmt(flatDispCorpus);
        document.getElementById('su-flat-invested').textContent  = suFmt(flatInvested);
        document.getElementById('su-flat-gains').textContent     = suFmt(flatDispCorpus - flatInvested);

        document.getElementById('su-stepup-corpus').textContent   = suFmt(suDispCorpus);
        document.getElementById('su-stepup-invested').textContent = suFmt(suInvested);
        document.getElementById('su-stepup-gains').textContent    = suFmt(suDispCorpus - suInvested);

        document.getElementById('su-extra-wealth').textContent = suFmt(dispExtraWealth);
        document.getElementById('su-multiplier').textContent   = dispMultiplier + 'x the corpus of a flat SIP — with just ' + stepup + '% annual increase' + (ltcgEnabled ? ' (post-tax)' : '');

        document.getElementById('su-extra-invested').textContent = suFmt(extraInvested);
        document.getElementById('su-final-sip').textContent      = suFmt(Math.round(finalSIP));
        document.getElementById('su-xirr').textContent           = '+' + ((dispMultiplier - 1) * 100 / years).toFixed(1) + '% p.a. extra' + (ltcgEnabled ? ' (post-tax)' : '');

        // ── Insight box ───────────────────────────────────────────
        var insightEl = document.getElementById('su-insight');
        insightEl.classList.remove('hidden');
        var extraRatio = dispExtraWealth > 0 ? (dispExtraWealth / (suInvested - flatInvested)).toFixed(1) : 0;
        insightEl.innerHTML =
            '<strong>💡 The Insight:</strong> By stepping up ₹' + Math.round(sip * stepup / 100).toLocaleString('en-IN') +
            ' more every year, you invest an extra ' + suFmt(extraInvested) + ' total over ' + years + ' years — ' +
            'but you earn an additional <strong>' + suFmt(dispExtraWealth) + ' corpus</strong>' + (ltcgEnabled ? ' (post-tax)' : '') + '. ' +
            'Every extra rupee invested via step-up generates ₹' + extraRatio + ' in corpus. ' +
            'Your final monthly SIP of ' + suFmt(Math.round(finalSIP)) + ' still feels affordable — it grows with your salary!';

        // ── Build SVG chart ───────────────────────────────────────
        suRenderChart(flatData, suData, years);

        // ── Year-by-year table ────────────────────────────────────
        var tbody = document.getElementById('su-table-body');
        var rows  = '';
        for (var i = 0; i < years; i++) {
            var bg   = i % 2 === 0 ? 'background:#fffbeb;' : '';
            var gap  = suData[i].corpus - flatData[i].corpus;
            rows += '<tr style="' + bg + '">' +
                '<td class="px-3 py-1.5 font-black text-slate-600">Yr ' + (i+1) + '</td>' +
                '<td class="px-3 py-1.5 text-right font-semibold text-amber-700">' + suFmt(Math.round(suData[i].sip)) + '/mo</td>' +
                '<td class="px-3 py-1.5 text-right text-slate-500">' + suFmt(flatData[i].invested) + '</td>' +
                '<td class="px-3 py-1.5 text-right font-bold text-slate-700">' + suFmt(flatData[i].corpus) + '</td>' +
                '<td class="px-3 py-1.5 text-right text-amber-600">' + suFmt(suData[i].invested) + '</td>' +
                '<td class="px-3 py-1.5 text-right font-bold text-amber-700">' + suFmt(suData[i].corpus) + '</td>' +
                '<td class="px-3 py-1.5 text-right font-black text-emerald-700">' + suFmt(gap) + '</td>' +
            '</tr>';
        }
        tbody.innerHTML = rows;

        if (typeof saveUserData === 'function') saveUserData();
    }

    var _suChart = null;

    function suRenderChart(flatData, suData, years) {
        var canvas = document.getElementById('su-chart-canvas');
        if (!canvas) return;

        var labels = flatData.map(function(_, i) { return 'Yr ' + (i + 1); });

        var flatCorpusData  = flatData.map(function(d) { return Math.round(d.corpus); });
        var suCorpusData    = suData.map(function(d)   { return Math.round(d.corpus); });
        var gapData         = suData.map(function(d, i){ return Math.round(d.corpus - flatData[i].corpus); });

        var INR = function(v) {
            if (v >= 1e7) return '₹' + (v/1e7).toFixed(2) + ' Cr';
            if (v >= 1e5) return '₹' + (v/1e5).toFixed(2) + ' L';
            return '₹' + Math.round(v).toLocaleString('en-IN');
        };

        if (_suChart) { _suChart.destroy(); _suChart = null; }

        _suChart = new Chart(canvas.getContext('2d'), {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Flat SIP',
                        data: flatCorpusData,
                        borderColor: '#94a3b8',
                        backgroundColor: 'rgba(148,163,184,0.08)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.35,
                        pointRadius: 0,
                        pointHoverRadius: 5,
                        pointHoverBackgroundColor: '#94a3b8',
                        pointHoverBorderColor: '#fff',
                        pointHoverBorderWidth: 2,
                        order: 2
                    },
                    {
                        label: 'Step-Up SIP',
                        data: suCorpusData,
                        borderColor: '#f59e0b',
                        backgroundColor: 'rgba(245,158,11,0.10)',
                        borderWidth: 2.5,
                        fill: true,
                        tension: 0.35,
                        pointRadius: 0,
                        pointHoverRadius: 6,
                        pointHoverBackgroundColor: '#f59e0b',
                        pointHoverBorderColor: '#fff',
                        pointHoverBorderWidth: 2,
                        order: 1
                    },
                    {
                        label: 'Extra Wealth (Gap)',
                        data: gapData,
                        borderColor: '#10b981',
                        backgroundColor: 'rgba(16,185,129,0.10)',
                        borderWidth: 1.5,
                        borderDash: [4, 3],
                        fill: false,
                        tension: 0.35,
                        pointRadius: 0,
                        pointHoverRadius: 5,
                        pointHoverBackgroundColor: '#10b981',
                        pointHoverBorderColor: '#fff',
                        pointHoverBorderWidth: 2,
                        order: 3
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: { mode: 'index', intersect: false },
                plugins: {
                    legend: {
                        display: true,
                        position: 'bottom',
                        labels: {
                            boxWidth: 12,
                            boxHeight: 3,
                            font: { size: 10, weight: 'bold' },
                            color: '#64748b',
                            padding: 14,
                            usePointStyle: true,
                            pointStyleWidth: 14
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(15,23,42,0.93)',
                        titleFont: { size: 11, weight: 'bold', family: 'Inter, sans-serif' },
                        bodyFont:  { size: 12, weight: 'bold', family: 'Inter, sans-serif' },
                        padding: 12,
                        cornerRadius: 10,
                        borderColor: 'rgba(245,200,66,0.35)',
                        borderWidth: 1,
                        callbacks: {
                            title: function(items) {
                                return items[0].label;
                            },
                            label: function(ctx) {
                                return ' ' + ctx.dataset.label + ': ' + INR(ctx.raw);
                            },
                            afterBody: function(items) {
                                var yr = items[0].dataIndex;
                                var sipAmt = suData[yr] ? suData[yr].sip : 0;
                                return ['', ' Monthly SIP this year: ' + INR(Math.round(sipAmt))];
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: {
                            font: { size: 9 },
                            color: '#94a3b8',
                            maxTicksLimit: 10,
                            maxRotation: 0
                        }
                    },
                    y: {
                        grid: { color: 'rgba(226,232,240,0.6)', drawBorder: false },
                        ticks: {
                            font: { size: 9 },
                            color: '#94a3b8',
                            callback: function(val) { return INR(val); }
                        }
                    }
                }
            }
        });
    }

