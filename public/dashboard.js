    var _DASH_FAV_KEY = 'aw_dash_favs';
    var _dashFavDefaults = ['healthscore'];
    var _dashAllTools = {
        growth:       { icon:'📈', title:'Growth Calculator',            color:'#10b981' },
        goal:         { icon:'🎯', title:'Goal Planner',                 color:'#6366f1' },
        emergency:    { icon:'🛡️', title:'Emergency Fund',               color:'#f59e0b' },
        homeloan:     { icon:'🏠', title:'Home Loan Advisor',             color:'#3b82f6' },
        stepupsip:    { icon:'📈', title:'Step-Up SIP Calculator',        color:'#f59e0b' },
        epfcalc:      { icon:'🏦', title:'EPF Corpus Projector',          color:'#0891b2' },
        drawdown:     { icon:'🏖️', title:'Retirement Drawdown',           color:'#ea580c' },
        ppfnps:       { icon:'🏛️', title:'PPF & NPS Calculator',          color:'#059669' },
        insure:       { icon:'🛡️', title:'Insurance Adequacy',            color:'#dc2626' },
        mfexplorer:   { icon:'🔭', title:'MF Explorer',                   color:'#0891b2' },
        mfkit:        { icon:'💼', title:'MF Kit',                        color:'#7c3aed' },
        fundpicker:   { icon:'🔬', title:'Fund Picker Guide',             color:'#059669' },
        finplan:      { icon:'📋', title:'Financial Plan',                color:'#dc2626' },
        taxguide:     { icon:'🧾', title:'Tax Guide',                     color:'#b45309' },
        healthscore:  { icon:'💗', title:'Financial Health Score',        color:'#e11d48' },
        ssaplanner:   { icon:'👧', title:'SSA + Child Education Planner', color:'#ec4899' },
        ctcoptimizer: { icon:'💰', title:'CTC & Salary Optimizer',        color:'#7c3aed' },
        gratuity:     { icon:'🏅', title:'Gratuity Calculator',           color:'#b45309' },
        debtplan:     { icon:'⚡', title:'Loan Prepayment Planner',       color:'#dc2626' },
        jointplan:    { icon:'👨‍👩‍👧', title:'Joint Family Planner',          color:'#0891b2' },
        cibil:        { icon:'🏦', title:'CIBIL Score Tracker',           color:'#7c3aed' },
        fincal:       { icon:'📅', title:'Financial Calendar',            color:'#0891b2' },
        selfempl:     { icon:'🧾', title:'Self-Employed & Business',      color:'#059669' },
        goldcomp:     { icon:'🥇', title:'Gold Comparator',              color:'#b45309' },
    };

    function _dashGetFavs() {
        try { var s = localStorage.getItem(_DASH_FAV_KEY); return s ? JSON.parse(s) : null; } catch(e) { return null; }
    }
    function _dashSaveFavs(f) {
        try { localStorage.setItem(_DASH_FAV_KEY, JSON.stringify(f)); } catch(e) {}
    }
    function dashToggleFav(modeKey, btn) {
        var favs = _dashGetFavs() || _dashFavDefaults.slice();
        var idx  = favs.indexOf(modeKey);
        if (idx === -1) { favs.push(modeKey); }
        else            { favs.splice(idx, 1); }
        _dashSaveFavs(favs);
        var ca = document.getElementById('dash-fav-count-arrow');
        if (ca) ca.textContent = favs.length + ' pinned →';
    }
    function initDashFav() {
        var favs  = _dashGetFavs() || _dashFavDefaults.slice();
        var grid  = document.getElementById('dashcat-fav-grid');
        if (!grid) return;
        if (favs.length === 0) {
            grid.innerHTML = '<div style="text-align:center;color:rgba(255,255,255,0.4);padding:32px 0;font-size:13px;">No tools pinned yet. Open a category and click ☆ Pin on any tool.</div>';
            return;
        }
        grid.innerHTML = '';
        favs.forEach(function(k) {
            var t = _dashAllTools[k]; if (!t) return;
            var btn = document.createElement('button');
            btn.className = 'dash-card group';
            btn.setAttribute('data-color', t.color);
            btn.innerHTML =
                '<div class="dash-card-icon">' + t.icon + '</div>' +
                '<div class="dash-card-title">' + t.title + '</div>' +
                '<div class="dash-card-desc" style="margin-top:4px;">' +
                    '<span onclick="event.stopPropagation();dashToggleFav(\'' + k + '\',this);initDashFav();" ' +
                    'style="cursor:pointer;font-size:10px;font-weight:800;color:#f5c842;">★ Pinned — tap to unpin</span>' +
                '</div>' +
                '<div class="dash-card-arrow">→</div>';
            btn.onclick = function() { switchMode(k); };
            grid.appendChild(btn);
        });
    }

    // Inject ☆ Pin / ★ Pinned buttons into category sub-panel cards
    function _dashInjectPinBtns(panelId) {
        var panel = document.getElementById(panelId);
        if (!panel) return;
        var favs = _dashGetFavs() || _dashFavDefaults.slice();
        panel.querySelectorAll('.dash-card[data-color]').forEach(function(card) {
            var oc = card.getAttribute('onclick') || '';
            var m  = (oc.match(/switchMode\('([^']+)'\)/) || [])[1];
            if (!m || m.indexOf('dashcat') === 0 || m === 'dashboard') return;
            var old = card.querySelector('.dash-pin-btn');
            if (old) old.remove();
            var isPinned = favs.indexOf(m) !== -1;
            var span = document.createElement('span');
            span.className = 'dash-pin-btn';
            span.style.cssText = 'display:inline-flex;align-items:center;gap:3px;font-size:10px;font-weight:800;cursor:pointer;margin-top:6px;padding:3px 8px;border-radius:8px;transition:all 0.2s;' + (isPinned ? 'color:#f5c842;background:rgba(245,200,66,0.18);border:1px solid rgba(245,200,66,0.4);' : 'color:rgba(255,255,255,0.6);background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.2);');
            span.textContent = isPinned ? '★ Pinned' : '☆ Pin';
            span.onclick = function(e) {
                e.stopPropagation();
                dashToggleFav(m, null);
                _dashInjectPinBtns(panelId);
            };
            var arrow = card.querySelector('.dash-card-arrow');
            if (arrow) card.insertBefore(span, arrow);
        });
    }
    function initDashboard() {
        var greetEl = document.getElementById('dash-user-greeting');
        if (greetEl && window._fbAuth && window._fbAuth.currentUser) {
            var name = (window._fbAuth.currentUser.displayName || '').split(' ')[0];
            if (name) greetEl.textContent = 'Welcome back, ' + name + '! 👋';
        }
        var favs = _dashGetFavs() || _dashFavDefaults.slice();
        var ca = document.getElementById('dash-fav-count-arrow');
        if (ca) ca.textContent = favs.length + ' pinned →';
    }
    // Call on first load after auth
    window.addEventListener('DOMContentLoaded', function() {
        // Small delay to let auth resolve
        setTimeout(function() {
            if (typeof switchMode === 'function') switchMode('dashboard');
        }, 100);
    });

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
        btn.textContent = hidden ? 'Show table ▾' : 'Hide table ▴';
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
        btn.textContent = hidden ? 'Show ▾' : 'Hide ▴';
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
        btn.textContent = wrap.classList.contains('hidden') ? 'Show ▾' : 'Hide ▴';
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
                ageDisp.textContent = curAge + ' years old';
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
        var defs = {'dd-corpus':'1,00,00,000','dd-ret-age':'60','dd-expenses':'60,000','dd-inflation':'6','dd-return':'8','dd-other-income':''};
        Object.keys(defs).forEach(function(id) {
            var el = document.getElementById(id);
            if (!el) return;
            if (!el.value || el.value === defs[id]) el.classList.add('text-slate-400');
            else el.classList.remove('text-slate-400');
        });
        drawdownCalc();
    }

    function resetDrawdown() {
        var fields = {'dd-corpus':'1,00,00,000','dd-ret-age':'60','dd-expenses':'60,000','dd-inflation':'6','dd-return':'8','dd-other-income':''};
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
        var retAge      = Math.round(ddNum('dd-ret-age')) || 60;
        var expToday    = ddNum('dd-expenses');
        var inflation   = (ddNum('dd-inflation') || 6) / 100;
        var returnRate  = (ddNum('dd-return') || 8) / 100;
        var otherIncome = ddNum('dd-other-income'); // monthly, today's ₹

        if (!corpus || !expToday) return;

        var MAX_AGE  = 100;
        var planYears = MAX_AGE - retAge;

        var yearData      = [];
        var balance       = corpus;
        var depletionAge  = null;

        for (var yr = 1; yr <= planYears; yr++) {
            var age         = retAge + yr - 1;
            var inflFactor  = Math.pow(1 + inflation, yr - 1);
            var monthlyExp  = expToday * inflFactor;
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
            deplLabel.textContent = '⚠ Runs out ' + shortfall + ' years before age 100!';
            deplLabel.style.color = '#fbbf24';
            surpDefEl.textContent = '⚠ SHORTFALL of ' + shortfall + ' years vs age 100';
            surpDefEl.style.color = '#fbbf24';
        } else {
            deplLabel.textContent = '✅ Corpus survives to age 100+';
            deplLabel.style.color = '#86efac';
            surpDefEl.textContent = '✅ Corpus sufficient for 100+ age';
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
        btn.textContent = hidden ? 'Show ▾' : 'Hide ▴';
    }

    /* ══════════════════════════════════════════════════════════
       CTC BREAKUP & SALARY OPTIMIZER
    ══════════════════════════════════════════════════════════ */

    function ctcFormat(el) {
        var raw = (el.value || '').replace(/[^0-9]/g, '');
        el.value = raw ? Number(raw).toLocaleString('en-IN') : '';
    }
    function ctcNum(id) {
        return parseFloat((document.getElementById(id)?.value || '').replace(/,/g, '')) || 0;
    }
    function ctcFmt(n) {
        if (!n && n !== 0) return '—';
        var a = Math.abs(n), s = n < 0 ? '-' : '';
        if (a >= 1e7) return s + '₹' + (a/1e7).toFixed(2) + ' Cr';
        if (a >= 1e5) return s + '₹' + (a/1e5).toFixed(2) + ' L';
        return s + '₹' + Math.round(a).toLocaleString('en-IN');
    }

    function initCtcOptimizer() { ctcCalc(); }

    function resetCtcOptimizer() {
        var defs = {'ctc-annual':'12,00,000','ctc-basic':'40,000','ctc-hra':'20,000',
                    'ctc-rent':'15,000','ctc-city':'metro','ctc-lta':'20,000',
                    'ctc-food':'0','ctc-phone':'0','ctc-emp-nps':'0',
                    'ctc-80c':'1,50,000','ctc-regime':'new'};
        Object.entries(defs).forEach(function([id, val]) {
            var el = document.getElementById(id); if (!el) return;
            el.value = val; el.classList.add('text-slate-400');
        });
        ctcCalc();
        if (typeof saveUserData === 'function') saveUserData();
    }

    function ctcPreset(annualCTC) {
        var basic = Math.round(annualCTC * 0.4 / 12);
        var hra   = Math.round(basic * 0.5);
        var lta   = Math.round(annualCTC * 0.02);
        var f = {
            'ctc-annual': Number(annualCTC).toLocaleString('en-IN'),
            'ctc-basic':  Number(basic).toLocaleString('en-IN'),
            'ctc-hra':    Number(hra).toLocaleString('en-IN'),
            'ctc-rent':   Number(Math.round(hra * 0.75)).toLocaleString('en-IN'),
            'ctc-lta':    Number(lta).toLocaleString('en-IN'),
            'ctc-food':   '0', 'ctc-phone': '0', 'ctc-emp-nps': '0',
            'ctc-80c':    '1,50,000', 'ctc-regime': 'new', 'ctc-city': 'metro'
        };
        Object.entries(f).forEach(function([id, val]) {
            var el = document.getElementById(id); if (!el) return;
            el.value = val; el.classList.remove('text-slate-400');
        });
        ctcCalc();
    }

    function ctcAutoFill() {
        var annual = ctcNum('ctc-annual');
        if (!annual) return;
        var basic = Math.round(annual * 0.4 / 12);
        var hra   = Math.round(basic * 0.5);
        var lta   = Math.round(annual * 0.02);
        var fields = {'ctc-basic': basic, 'ctc-hra': hra, 'ctc-rent': Math.round(hra*0.75), 'ctc-lta': lta};
        Object.entries(fields).forEach(function([id, val]) {
            var el = document.getElementById(id); if (!el) return;
            el.value = Number(val).toLocaleString('en-IN');
            el.classList.remove('text-slate-400');
        });
    }

    function _calcTax(taxable, regime) {
        if (taxable <= 0) return 0;
        var tax = 0;
        if (regime === 'new') {
            // FY 2025-26 (Budget 2025) New Regime slabs
            // 0-4L=0%, 4-8L=5%, 8-12L=10%, 12-16L=15%, 16-20L=20%, 20-24L=25%, >24L=30%
            var prev = 400000;
            var bands = [[800000,0.05],[1200000,0.10],[1600000,0.15],[2000000,0.20],[2400000,0.25],[Infinity,0.30]];
            if (taxable > 400000) {
                for (var i = 0; i < bands.length; i++) {
                    if (taxable <= prev) break;
                    var chunk = Math.min(taxable, bands[i][0]) - prev;
                    if (chunk > 0) tax += chunk * bands[i][1];
                    prev = bands[i][0];
                }
            }
            if (taxable <= 1200000) tax = 0; // 87A rebate: full rebate if taxable ≤₹12L (Budget 2025)
        } else {
            // Old regime slabs: 0-2.5L=0%, 2.5-5L=5%, 5-10L=20%, >10L=30%
            if (taxable <= 250000) tax = 0;
            else if (taxable <= 500000) tax = (taxable - 250000) * 0.05;
            else if (taxable <= 1000000) tax = 12500 + (taxable - 500000) * 0.20;
            else tax = 112500 + (taxable - 1000000) * 0.30;
            if (taxable <= 500000) tax = 0; // 87A rebate old regime ≤₹5L
        }
        // Surcharge
        if (taxable > 10000000) tax *= 1.15;
        else if (taxable > 5000000) tax *= 1.10;
        return Math.round(tax * 1.04); // 4% cess
    }

    function _hraExemption(basicAnnual, hraAnnual, rentAnnual, city) {
        if (!rentAnnual) return 0;
        var cityPct = city === 'metro' ? 0.5 : 0.4;
        return Math.max(0, Math.min(hraAnnual, rentAnnual - basicAnnual * 0.1, basicAnnual * cityPct));
    }

    function ctcCalc() {
        var annualCTC  = ctcNum('ctc-annual');
        var basicMo    = ctcNum('ctc-basic');
        var hraMo      = ctcNum('ctc-hra');
        var rentMo     = ctcNum('ctc-rent');
        var city       = document.getElementById('ctc-city')?.value || 'metro';
        var ltaAnnual  = ctcNum('ctc-lta');
        var foodMo     = Math.min(ctcNum('ctc-food'), 2200);
        var phoneMo    = ctcNum('ctc-phone');
        var empNpsPct  = (ctcNum('ctc-emp-nps') || 0) / 100;
        var invest80c  = Math.min(ctcNum('ctc-80c'), 150000);
        var regime     = document.getElementById('ctc-regime')?.value || 'new';

        if (!annualCTC || !basicMo) return;

        // Show/hide Old Regime-only fields
        var _isNew = regime === 'new';
        ['ctc-rent-wrap','ctc-city-wrap','ctc-80c-wrap'].forEach(function(id) {
            var el = document.getElementById(id);
            if (el) el.classList.toggle('hidden', _isNew);
        });
        var _hints = {
            'ctc-hra-hint':   _isNew ? 'Part of CTC — fully taxable in New Regime (no HRA exemption)' : '50% basic (metro), 40% (others)',
            'ctc-lta-hint':   _isNew ? 'Part of CTC — fully taxable in New Regime (no LTA exemption)' : 'Leave Travel Allowance/yr — exempt with travel proof',
            'ctc-food-hint':  _isNew ? 'Part of CTC — fully taxable in New Regime' : 'Tax-free up to ₹2,200/mo (Old Regime)',
            'ctc-phone-hint': _isNew ? 'Part of CTC — fully taxable in New Regime' : 'Exempt with actual bills (Old Regime)'
        };
        Object.entries(_hints).forEach(function([id, text]) {
            var el = document.getElementById(id); if (el) el.textContent = text;
        });

        var basicAnnual   = basicMo * 12;
        var hraAnnual     = hraMo * 12;
        var empNpsAnnual  = Math.round(basicAnnual * empNpsPct);
        var empNpsMo      = Math.round(empNpsAnnual / 12);
        var emplEpfMo     = Math.round(Math.min(basicMo, 15000) * 0.12); // EPF on wage ceiling
        var empEpfMo      = emplEpfMo; // employer matches
        var foodAnnual    = foodMo * 12;
        var phoneAnnual   = phoneMo * 12;

        // Special allowance fills the remaining CTC
        var knownComponents = basicAnnual + hraAnnual + ltaAnnual + foodAnnual + phoneAnnual
                            + empNpsAnnual + empEpfMo * 12 + emplEpfMo * 12;
        var specialAnnual = Math.max(0, annualCTC - knownComponents);
        var specialMo     = Math.round(specialAnnual / 12);

        // Gross in-hand (before TDS, after employer deductions removed)
        var grossAnnual = basicAnnual + hraAnnual + ltaAnnual + foodAnnual + phoneAnnual + specialAnnual;

        var hraExempt  = Math.round(_hraExemption(basicAnnual, hraAnnual, rentMo * 12, city));
        var ltaUsed    = Math.round(ltaAnnual * 0.5); // avg: claim once per 2-yr block
        var profTax    = 2400;
        var stdDeductOld = 50000;
        var stdDeductNew = 75000;

        // Taxable income per regime (CURRENT structure)
        // Old Regime: Standard ₹50K + HRA + LTA + Food + Phone + EPF + 80C + Employer NPS + Prof Tax
        var taxableOld = grossAnnual - stdDeductOld - hraExempt - ltaUsed - foodAnnual - phoneAnnual
                       - emplEpfMo * 12 - invest80c - empNpsAnnual - profTax;
        // New Regime: ONLY Standard ₹75K + Employer NPS 80CCD(2) + Prof Tax
        // No HRA, LTA, food coupons, phone, 80C — all fully taxable under New Regime
        var taxableNew = grossAnnual - stdDeductNew - empNpsAnnual - profTax;

        var taxCurrent = _calcTax(Math.max(0, regime === 'old' ? taxableOld : taxableNew), regime);
        var tdsPerMo   = Math.round(taxCurrent / 12);
        var takeHome   = Math.round(grossAnnual / 12) - emplEpfMo - tdsPerMo - Math.round(profTax / 12);

        // OPTIMIZED structure
        var optFood    = 2200;
        var optPhone   = 1200;
        var optEmpNps  = Math.round(basicAnnual * 0.10); // 80CCD(2) max 10%
        var optLtaUsed = ltaAnnual; // full claim

        var taxableOptOld = grossAnnual - stdDeductOld - hraExempt - optLtaUsed - optFood*12 - optPhone*12
                          - emplEpfMo*12 - invest80c - optEmpNps - profTax;
        // New Regime optimized: only Employer NPS helps — food/phone/LTA/80C don't apply
        var taxableOptNew = grossAnnual - stdDeductNew - optEmpNps - profTax;

        var taxOpt       = _calcTax(Math.max(0, regime === 'old' ? taxableOptOld : taxableOptNew), regime);
        var takeHomeOpt  = Math.round(grossAnnual / 12) - emplEpfMo - Math.round(taxOpt/12) - Math.round(profTax/12);
        var monthlySaved = takeHomeOpt - takeHome;

        var effRate = grossAnnual > 0 ? (taxCurrent / grossAnnual * 100) : 0;

        // Both regime comparison
        var taxOldR = _calcTax(Math.max(0, taxableOld), 'old');
        var taxNewR = _calcTax(Math.max(0, taxableNew), 'new');
        var thOld   = Math.round(grossAnnual/12) - emplEpfMo - Math.round(taxOldR/12) - Math.round(profTax/12);
        var thNew   = Math.round(grossAnnual/12) - emplEpfMo - Math.round(taxNewR/12) - Math.round(profTax/12);

        // ── DOM updates ───────────────────────────────────────────
        document.getElementById('ctc-current-takehome').textContent  = ctcFmt(takeHome) + '/mo';
        document.getElementById('ctc-current-annual').textContent    = 'Annual: ' + ctcFmt(takeHome * 12);
        document.getElementById('ctc-optimized-takehome').textContent = ctcFmt(takeHomeOpt) + '/mo';
        document.getElementById('ctc-savings-banner').textContent    = monthlySaved > 0
            ? '▲ ₹' + Math.round(monthlySaved).toLocaleString('en-IN') + '/mo more — restructure now!'
            : 'Already well-optimized ✅';
        document.getElementById('ctc-tax-current').textContent       = ctcFmt(taxCurrent) + '/yr';
        document.getElementById('ctc-tax-optimized').textContent     = ctcFmt(taxOpt) + '/yr';
        document.getElementById('ctc-eff-rate').textContent          = effRate.toFixed(1) + '%';
        document.getElementById('ctc-monthly-tax-saved').textContent = ctcFmt(Math.round((taxCurrent - taxOpt) / 12)) + '/mo';

        // ── Breakup table ─────────────────────────────────────────
        var isNew = regime === 'new';
        var rows = [
            {name:'Basic Salary',           mo: basicMo,            taxable:true},
            {name:'HRA',                    mo: hraMo,              taxable:isNew,
             note: isNew ? 'Fully taxable in New Regime — no HRA exemption available'
                         : 'Exempt: '+ctcFmt(Math.round(hraExempt/12))+'/mo (least of: actual HRA, rent−10% basic, 50/40% basic)'},
            {name:'Special Allowance',      mo: specialMo,          taxable:true},
            {name:'LTA',                    mo: Math.round(ltaAnnual/12), taxable:isNew,
             note: isNew ? 'Fully taxable in New Regime — LTA exemption not available'
                         : 'Exempt with travel proof — claim once per 2-yr block'},
            {name:'Food Coupons',           mo: foodMo,             taxable:isNew,
             note: isNew ? 'Fully taxable in New Regime — meal perquisite exemption not available'
                         : 'Tax-free up to ₹2,200/mo'},
            {name:'Phone/Internet',         mo: phoneMo,            taxable:isNew,
             note: isNew ? 'Fully taxable in New Regime — reimbursement exemption not available'
                         : 'Exempt with actual bills'},
            {sep:true},
            {name:'Gross Monthly Pay',      mo: Math.round(grossAnnual/12), taxable:true,  bold:true},
            {sep:true},
            {name:'Employee EPF (12%)',     mo: -emplEpfMo,         taxable:false, note:'Deducted, qualifies for 80C'},
            {name:'Employer NPS 80CCD(2)',  mo: empNpsMo > 0 ? 0 : 0, taxable:false, note: empNpsMo > 0 ? ctcFmt(empNpsMo)+'/mo — tax-free u/s 80CCD(2)' : 'Not active — ask HR to add!'},
            {name:'Income Tax (TDS)',       mo: -tdsPerMo,          taxable:false, note: regime === 'new' ? 'New Regime' : 'Old Regime'},
            {name:'Professional Tax',       mo: -200,               taxable:false, note:'~₹200/mo'},
            {sep:true},
            {name:'NET TAKE-HOME',          mo: takeHome,           taxable:false, bold:true, green:true}
        ];
        var tbody = '';
        rows.forEach(function(r, i) {
            if (r.sep) { tbody += '<tr><td colspan="4" style="padding:2px;background:#f8fafc;"></td></tr>'; return; }
            var bg  = (i % 2 === 0) ? '' : 'background:#fafafa;';
            var moS = r.green ? 'color:#16a34a;font-weight:900;' : r.mo < 0 ? 'color:#dc2626;' : '';
            var bS  = r.bold ? 'font-weight:900;' : '';
            tbody += '<tr style="' + bg + bS + '">' +
                '<td class="px-2 py-1 text-slate-700">' + r.name + (r.note ? '<div class="text-[8px] text-slate-400 font-normal leading-tight mt-0.5">' + r.note + '</div>' : '') + '</td>' +
                '<td class="px-2 py-1 text-right" style="' + moS + '">' + (r.mo ? ctcFmt(Math.abs(r.mo)) + (r.mo < 0 ? ' ↓' : '') : '—') + '</td>' +
                '<td class="px-2 py-1 text-right text-slate-400">' + (r.mo ? ctcFmt(Math.abs(r.mo * 12)) : '—') + '</td>' +
                '<td class="px-2 py-1 text-right">' + (r.bold || r.sep ? '' : (r.taxable ? '<span class="ctc-breakup-row-tax">Taxable</span>' : '<span class="ctc-breakup-row-exempt">Exempt</span>')) + '</td>' +
            '</tr>';
        });
        document.getElementById('ctc-breakup-body').innerHTML = tbody;

        // ── Optimizer cards ───────────────────────────────────────
        // Determine marginal rate for savings estimate
        var marginalRate = regime === 'new'
            ? (taxableNew > 2400000 ? 0.30 : taxableNew > 2000000 ? 0.25 : taxableNew > 1600000 ? 0.20
               : taxableNew > 1200000 ? 0.15 : taxableNew > 800000 ? 0.10 : taxableNew > 400000 ? 0.05 : 0)
            : (taxableOld > 1000000 ? 0.30 : taxableOld > 500000 ? 0.20 : taxableOld > 250000 ? 0.05 : 0);

        var cards = [];

        // Employer NPS 80CCD(2) — valid in BOTH regimes
        if (empNpsPct < 0.10) cards.push({icon:'🏛️', title:'Employer NPS 80CCD(2)',
            saving: Math.round(basicAnnual * (0.10 - empNpsPct) * marginalRate * 1.04 / 12),
            desc: 'Ask HR to contribute ' + Math.round((0.10-empNpsPct)*100) + '% of basic (' + ctcFmt(Math.round(basicAnnual*(0.10-empNpsPct)/12)) + '/mo) to NPS u/s 80CCD(2). The only salary restructuring that saves tax in BOTH regimes.',
            bg:'#eff6ff', bdr:'#93c5fd', clr:'#1e3a5f'});

        if (regime === 'old') {
            // Old Regime-only optimizations
            if (foodMo < 2200) cards.push({icon:'🍱', title:'Food Coupons / Meal Vouchers',
                saving: Math.round((2200 - foodMo) * marginalRate * 1.04),
                desc: 'Add ₹' + (2200-foodMo).toLocaleString('en-IN') + '/mo more in food coupons (max ₹2,200/mo tax-free as meal perquisite). Simple HR form — zero cost to employer.',
                bg:'#f0fdf4', bdr:'#86efac', clr:'#14532d'});
            if (phoneMo < 1200) cards.push({icon:'📱', title:'Phone / Internet Reimbursement',
                saving: Math.round((1200 - phoneMo) * marginalRate * 1.04),
                desc: 'Add ₹' + (1200-phoneMo).toLocaleString('en-IN') + '/mo phone/internet allowance. Fully exempt with actual bills — submit monthly receipts to HR.',
                bg:'#fdf4ff', bdr:'#e9d5ff', clr:'#581c87'});
            if (hraMo > 0 && rentMo < basicMo * 0.1 + 1) cards.push({icon:'🏠', title:'Increase Rent to Maximize HRA',
                saving: Math.round(basicMo * 0.1 * marginalRate * 1.04),
                desc: 'Rent below 10% of basic — HRA exemption = rent minus 10% of basic (currently ₹0). Consider paying ₹' + Math.round(basicMo*0.12).toLocaleString('en-IN') + '/mo to parents with receipt.',
                bg:'#fff7ed', bdr:'#fed7aa', clr:'#7c2d12'});
            if (ltaAnnual > 0) cards.push({icon:'✈️', title:'Claim LTA Every 2 Years',
                saving: Math.round(ltaAnnual * marginalRate * 1.04 / 24),
                desc: 'LTA of ₹' + ltaAnnual.toLocaleString('en-IN') + '/yr is tax-free. Claim once per 2-year block with domestic rail/air tickets. Don\'t leave this on the table.',
                bg:'#f0f9ff', bdr:'#bae6fd', clr:'#0c4a6e'});
            if (invest80c < 150000) cards.push({icon:'💼', title:'Max 80C — ₹1.5L',
                saving: Math.round((150000-invest80c)*marginalRate*1.04/12),
                desc: '₹' + (150000-invest80c).toLocaleString('en-IN') + ' headroom left in 80C. Use ELSS SIP, PPF, NSC, or NPS. Saves ₹' + Math.round((150000-invest80c)*marginalRate*1.04).toLocaleString('en-IN') + '/yr.',
                bg:'#fef9c3', bdr:'#fde047', clr:'#713f12'});
        } else {
            // New Regime: no allowance exemptions — inform the user clearly
            cards.push({icon:'ℹ️', title:'New Regime — No Allowance Exemptions',
                saving: 0,
                desc: 'HRA, LTA, food coupons, phone, and 80C deductions are NOT available in the New Regime. The only levers are: (1) Employer NPS 80CCD(2) — deductible in both regimes, and (2) switching to Old Regime if deductions exceed ~₹3.75L.',
                bg:'#fef9c3', bdr:'#fde047', clr:'#713f12'});
        }

        if (cards.length === 0 || (cards.length === 1 && cards[0].icon === 'ℹ️' && empNpsPct >= 0.10)) {
            cards = [{icon:'✅', title:'Fully Optimized!', saving:0,
                desc: regime === 'new'
                    ? 'Employer NPS is maxed and New Regime has no further allowance exemptions. Consider whether Old Regime saves more if you have large deductions.'
                    : 'Your salary structure is already maximally tax-efficient. Review again if CTC or deductions change.',
                bg:'#f0fdf4', bdr:'#86efac', clr:'#14532d'}];
        }

        var grid = document.getElementById('ctc-optimizer-grid');
        if (grid) grid.innerHTML = cards.map(function(c) {
            return '<div class="ctc-opt-card" style="background:'+c.bg+';border:1.5px solid '+c.bdr+';color:'+c.clr+';">' +
                '<div class="flex items-center gap-1.5 mb-1">' +
                '<span class="text-base">' + c.icon + '</span>' +
                '<span class="font-black text-[10px] uppercase tracking-wide flex-1">' + c.title + '</span>' +
                (c.saving > 0 ? '<span class="text-[9px] font-black text-emerald-700 whitespace-nowrap">+₹'+c.saving.toLocaleString('en-IN')+'/mo</span>' : '') +
                '</div><div class="text-[9px] leading-relaxed">' + c.desc + '</div></div>';
        }).join('');

        // ── Regime comparison ─────────────────────────────────────
        var bestRegime = taxOldR <= taxNewR ? 'old' : 'new';
        var diff = Math.abs(thOld - thNew);
        var regDiv = document.getElementById('ctc-regime-compare');
        if (regDiv) regDiv.innerHTML = [
            {label:'Old Regime', tax:taxOldR, th:thOld, key:'old'},
            {label:'New Regime (Default)', tax:taxNewR, th:thNew, key:'new'}
        ].map(function(r) {
            var best = r.key === bestRegime;
            return '<div class="rounded-xl p-3" style="background:'+(best?'#f0fdf4':'#f8fafc')+';border:2px solid '+(best?'#22c55e':'#e2e8f0')+';">' +
                '<div class="text-[10px] font-black '+(best?'text-emerald-800':'text-slate-600')+' uppercase mb-1">' + r.label + (best?' ✅ Better for you':'') + '</div>' +
                '<div class="text-xl font-black '+(best?'text-emerald-700':'text-slate-600')+'">' + ctcFmt(r.th) + '/mo take-home</div>' +
                '<div class="text-[9px] text-slate-500 mt-0.5">Annual tax: ' + ctcFmt(r.tax) + ' · ' +
                (r.key==='old'?'80C + HRA + LTA deductions · Standard ₹50K deduct':'No deductions · Standard ₹75K deduct · Simpler ITR') + '</div>' +
                (best && diff > 0 ? '<div class="text-[9px] font-black text-emerald-700 mt-0.5">Saves ₹' + diff.toLocaleString('en-IN') + '/yr vs other regime</div>' : '') +
                '</div>';
        }).join('');

        // ── Insight ────────────────────────────────────────────────
        var ins = document.getElementById('ctc-insight');
        if (ins) {
            ins.classList.remove('hidden');
            var optDesc = '';
            if (monthlySaved > 0) {
                optDesc = regime === 'new'
                    ? 'By maximizing employer NPS 80CCD(2) to 10% of basic, take-home rises to <strong>' + ctcFmt(takeHomeOpt) + '/mo</strong> — <strong>₹' + Math.round(monthlySaved).toLocaleString('en-IN') + '/mo more</strong> without any CTC change.'
                    : 'By optimizing food coupons, employer NPS, phone allowance, and fully claiming LTA, take-home rises to <strong>' + ctcFmt(takeHomeOpt) + '/mo</strong> — <strong>₹' + Math.round(monthlySaved).toLocaleString('en-IN') + '/mo more</strong> (₹' + Math.round(monthlySaved*12).toLocaleString('en-IN') + '/yr) without any CTC change.';
            } else {
                optDesc = regime === 'new'
                    ? 'New Regime has no salary restructuring levers beyond employer NPS. Your structure is optimized for this regime.'
                    : 'Your salary structure is already optimally configured.';
            }
            ins.innerHTML = '<strong>💡 Take-home Insight:</strong> On CTC of <strong>' + ctcFmt(annualCTC) + '</strong>, you receive <strong>' + ctcFmt(takeHome) + '/mo</strong> (' + (takeHome*12/annualCTC*100).toFixed(0) + '% of CTC). ' +
                optDesc +
                ' Effective tax rate: <strong>' + effRate.toFixed(1) + '%</strong>. ' +
                (bestRegime !== regime ? '⚠ <strong>' + (bestRegime==='old'?'Old':'New') + ' Regime saves ₹' + diff.toLocaleString('en-IN') + '/yr more</strong> for your income — consider switching.' : '');
        }

        if (typeof saveUserData === 'function') saveUserData();
    }

    /* ══════════════════════════════════════════════════════════
       INSURANCE ADEQUACY CALCULATOR
    ══════════════════════════════════════════════════════════ */

    function insFormat(el) {
        var raw = (el.value || '').replace(/[^0-9]/g, '');
        el.value = raw ? Number(raw).toLocaleString('en-IN') : '';
    }
    function insNum(id) {
        return parseFloat((document.getElementById(id)?.value || '').replace(/,/g, '')) || 0;
    }
    function insFmt(n) {
        if (!n && n !== 0) return '—';
        var a = Math.abs(n), s = n < 0 ? '-' : '';
        if (a >= 1e7) return s + '₹' + (a/1e7).toFixed(2) + ' Cr';
        if (a >= 1e5) return s + '₹' + (a/1e5).toFixed(2) + ' L';
        return s + '₹' + Math.round(a).toLocaleString('en-IN');
    }

    function initInsure() { insureCalc(); }

    function resetInsure() {
        var defs = {'ins-income':'12,00,000','ins-age':'30','ins-dependents':'2',
                    'ins-loans':'0','ins-term-current':'0','ins-health-current':'0',
                    'ins-monthly-exp':'50,000','ins-family':'2'};
        Object.entries(defs).forEach(function([id, val]) {
            var el = document.getElementById(id); if (!el) return;
            el.value = val; el.classList.add('text-slate-400');
        });
        insureCalc();
        if (typeof saveUserData === 'function') saveUserData();
    }

    function insPreset(income, age, dependents, loans, termCurrent, healthCurrent, expenses, family) {
        var f = {
            'ins-income':         Number(income).toLocaleString('en-IN'),
            'ins-age':            String(age),
            'ins-dependents':     String(dependents),
            'ins-loans':          Number(loans).toLocaleString('en-IN'),
            'ins-term-current':   Number(termCurrent).toLocaleString('en-IN'),
            'ins-health-current': Number(healthCurrent).toLocaleString('en-IN'),
            'ins-monthly-exp':    Math.round(Number(expenses) / 12).toLocaleString('en-IN'),
            'ins-family':         String(family)
        };
        Object.entries(f).forEach(function([id, val]) {
            var el = document.getElementById(id); if (!el) return;
            el.value = val; el.classList.remove('text-slate-400');
        });
        insureCalc();
    }

    function insureCalc() {
        var income       = insNum('ins-income');
        var age          = Math.round(insNum('ins-age')) || 30;
        var dependents   = Math.round(insNum('ins-dependents'));
        var loans        = insNum('ins-loans');
        var termCurrent  = insNum('ins-term-current');
        var healthCurrent= insNum('ins-health-current');
        var monthlyExp   = insNum('ins-monthly-exp');
        var expenses     = monthlyExp * 12;
        var hintEl = document.getElementById('ins-exp-annual-hint');
        if (hintEl) hintEl.textContent = monthlyExp > 0 ? '= ' + insFmt(expenses) + '/yr' : '= ₹0/yr';
        var familySize   = Math.max(1, Math.round(parseFloat(document.getElementById('ins-family')?.value) || 2));

        if (!income) return;

        var retireAge  = 60;
        var yearsLeft  = Math.max(0, retireAge - age);

        // ── TERM INSURANCE: HLV Method ────────────────────────────
        // HLV = PV of future income stream at ~6% discount, adjusted for expenses
        // Simplified: income × years × 0.6 (net of personal expenses ~40% of income)
        // Then add outstanding loans, subtract existing assets (none input here)
        var hlvMultiple  = age <= 35 ? 15 : age <= 45 ? 12 : 10;
        var hlvBase      = income * hlvMultiple;
        var termNeeded   = Math.round(hlvBase + loans);
        // Cap at reasonable max
        termNeeded       = Math.max(termNeeded, income * 10); // at least 10x

        var termGap      = Math.max(0, termNeeded - termCurrent);

        // ── HEALTH INSURANCE ──────────────────────────────────────
        // Base floater per family size
        var baseFloater  = familySize <= 2 ? 1000000 : familySize <= 3 ? 1500000 : 2000000;
        // Super top-up: ₹25L above ₹5L deductible — fixed recommendation post-COVID
        var superTopUp   = 2500000;
        var healthNeeded = baseFloater + superTopUp;
        var healthGap    = Math.max(0, healthNeeded - healthCurrent);

        // ── Estimated term premium (rough — ₹8/L/yr at 30, increases with age) ──
        var ratePerLakh  = age <= 30 ? 8 : age <= 35 ? 10 : age <= 40 ? 14 : age <= 45 ? 20 : 30;
        var termPremium  = Math.round((termGap / 100000) * ratePerLakh * 100); // per year

        // ── DOM Updates ──────────────────────────────────────────
        document.getElementById('ins-term-needed').textContent = insFmt(termNeeded);
        document.getElementById('ins-health-needed').textContent = insFmt(healthNeeded);
        document.getElementById('ins-hlv-multiple').textContent = hlvMultiple + 'x';
        document.getElementById('ins-term-premium').textContent = termPremium > 0 ? insFmt(termPremium) + '/yr' : '—';
        document.getElementById('ins-term-gap-pill').textContent = termGap > 0 ? insFmt(termGap) : '✅ Adequate';
        document.getElementById('ins-health-gap-pill').textContent = healthGap > 0 ? insFmt(healthGap) : '✅ Adequate';

        var tGapEl = document.getElementById('ins-term-gap');
        if (termGap > 0) {
            tGapEl.textContent = '⚠ Gap: ' + insFmt(termGap) + ' — buy more term';
            tGapEl.style.color = '#fbbf24';
        } else {
            tGapEl.textContent = '✅ Coverage is adequate';
            tGapEl.style.color = '#86efac';
        }

        var hGapEl = document.getElementById('ins-health-gap');
        if (healthGap > 0) {
            hGapEl.textContent = '⚠ Gap: ' + insFmt(healthGap) + ' — add floater/top-up';
            hGapEl.style.color = '#fbbf24';
        } else {
            hGapEl.textContent = '✅ Coverage is adequate';
            hGapEl.style.color = '#86efac';
        }

        // ── Term workings ────────────────────────────────────────
        var tw = document.getElementById('ins-term-workings');
        if (tw) tw.innerHTML =
            '<div class="flex justify-between py-0.5 border-b border-slate-100"><span>Annual income</span><span class="font-bold">' + insFmt(income) + '</span></div>' +
            '<div class="flex justify-between py-0.5 border-b border-slate-100"><span>HLV multiple (age ' + age + ')</span><span class="font-bold">× ' + hlvMultiple + '</span></div>' +
            '<div class="flex justify-between py-0.5 border-b border-slate-100"><span>HLV base</span><span class="font-bold">' + insFmt(Math.round(income * hlvMultiple)) + '</span></div>' +
            (loans > 0 ? '<div class="flex justify-between py-0.5 border-b border-slate-100"><span>+ Outstanding loans</span><span class="font-bold">' + insFmt(loans) + '</span></div>' : '') +
            '<div class="flex justify-between py-1 font-black text-blue-700"><span>= Total term needed</span><span>' + insFmt(termNeeded) + '</span></div>' +
            '<div class="flex justify-between py-0.5 border-b border-slate-100"><span>− Existing cover</span><span class="font-bold">' + insFmt(termCurrent) + '</span></div>' +
            '<div class="flex justify-between py-1 font-black ' + (termGap > 0 ? 'text-red-600' : 'text-emerald-600') + '"><span>' + (termGap > 0 ? '⚠ Gap to fill' : '✅ No gap') + '</span><span>' + (termGap > 0 ? insFmt(termGap) : 'Covered') + '</span></div>';

        // ── Health workings ───────────────────────────────────────
        var hw = document.getElementById('ins-health-workings');
        var familyLabel = ['','Self only','Self + Spouse','Family of 3','Family of 4','Family + Parents'];
        if (hw) hw.innerHTML =
            '<div class="flex justify-between py-0.5 border-b border-slate-100"><span>Family (' + (familyLabel[familySize] || 'Family') + ')</span><span class="font-bold">Base floater</span></div>' +
            '<div class="flex justify-between py-0.5 border-b border-slate-100"><span>Base floater (min ₹10L)</span><span class="font-bold">' + insFmt(baseFloater) + '</span></div>' +
            '<div class="flex justify-between py-0.5 border-b border-slate-100"><span>+ Super top-up (₹25L above ₹5L)</span><span class="font-bold">' + insFmt(superTopUp) + '</span></div>' +
            '<div class="flex justify-between py-1 font-black text-emerald-700"><span>= Total health cover needed</span><span>' + insFmt(healthNeeded) + '</span></div>' +
            '<div class="flex justify-between py-0.5 border-b border-slate-100"><span>− Existing cover</span><span class="font-bold">' + insFmt(healthCurrent) + '</span></div>' +
            '<div class="flex justify-between py-1 font-black ' + (healthGap > 0 ? 'text-red-600' : 'text-emerald-600') + '"><span>' + (healthGap > 0 ? '⚠ Gap to fill' : '✅ No gap') + '</span><span>' + (healthGap > 0 ? insFmt(healthGap) : 'Covered') + '</span></div>' +
            '<div class="mt-2 text-[9px] text-slate-500">ICU costs post-COVID: ₹40K–80K/day. A ₹25L top-up costs only ₹4,000–8,000/yr.</div>';

        // ── Insight ───────────────────────────────────────────────
        var ins = document.getElementById('ins-insight');
        if (ins) {
            ins.classList.remove('hidden');
            var msgs = [];
            if (termGap > 0) msgs.push('Your term cover has a <strong>' + insFmt(termGap) + ' gap</strong>. Buy a pure online term plan to close it — at age ' + age + ' it costs ~₹' + ratePerLakh.toLocaleString('en-IN') + '/L/yr.');
            else msgs.push('Your term cover looks adequate ✅ — review annually as income grows.');
            if (healthGap > 0) msgs.push('Your health cover has a <strong>' + insFmt(healthGap) + ' gap</strong>. Add a ₹10L family floater + ₹25L super top-up (costs ~₹15,000–25,000/yr combined).');
            else msgs.push('Your health cover meets the post-COVID ₹35L baseline ✅.');
            ins.innerHTML = '<strong>💡 Adequacy Summary:</strong> ' + msgs.join(' ');
        }

        if (typeof saveUserData === 'function') saveUserData();
    }

    /* ══════════════════════════════════════════════════════════
       GRATUITY CALCULATOR
    ══════════════════════════════════════════════════════════ */

    function gratFormat(el) {
        var raw = (el.value || '').replace(/[^0-9]/g, '');
        el.value = raw ? Number(raw).toLocaleString('en-IN') : '';
    }
    function gratNum(id) {
        return parseFloat((document.getElementById(id)?.value || '').replace(/,/g, '')) || 0;
    }
    function gratFmt(n) {
        if (!n && n !== 0) return '—';
        var a = Math.abs(n), s = n < 0 ? '-' : '';
        if (a >= 1e7) return s + '₹' + (a/1e7).toFixed(2) + ' Cr';
        if (a >= 1e5) return s + '₹' + (a/1e5).toFixed(2) + ' L';
        return s + '₹' + Math.round(a).toLocaleString('en-IN');
    }

    function initGratuity() { gratCalc(); }

    function resetGratuity() {
        var defs = {'grat-basic':'50,000','grat-years':'7','grat-months':'0',
                    'grat-type':'covered','grat-slab':'20'};
        Object.entries(defs).forEach(function([id, val]) {
            var el = document.getElementById(id); if (!el) return;
            el.value = val; el.classList.add('text-slate-400');
        });
        gratCalc();
        if (typeof saveUserData === 'function') saveUserData();
    }

    function gratPreset(basic, years, months, type, slab) {
        var f = {
            'grat-basic':  Number(basic).toLocaleString('en-IN'),
            'grat-years':  String(years),
            'grat-months': String(months),
            'grat-type':   type,
            'grat-slab':   String(slab)
        };
        Object.entries(f).forEach(function([id, val]) {
            var el = document.getElementById(id); if (!el) return;
            el.value = val; el.classList.remove('text-slate-400');
        });
        gratCalc();
    }

    function gratCalc() {
        var basic      = gratNum('grat-basic');
        var years      = Math.floor(gratNum('grat-years')) || 0;
        var months     = Math.floor(gratNum('grat-months')) || 0;
        var type       = document.getElementById('grat-type')?.value || 'covered';
        var slabPct    = (parseInt(document.getElementById('grat-slab')?.value || '20')) / 100;

        if (!basic) return;

        // Clamp months 0-11
        months = Math.min(11, Math.max(0, months));

        // Rounding rule: >6 months in final year → round up to next full year
        var serviceCounted = years + (months > 6 ? 1 : 0);
        var serviceLabel   = years + ' yr' + (years !== 1 ? 's' : '') +
                             (months > 0 ? ' ' + months + ' mo' : '') +
                             (months > 6 ? ' → rounded up to ' + serviceCounted + ' yrs' : '');

        // Gratuity formula
        // Covered under Act: 15/26 × Basic × Years of service
        // Not covered: 15/30 × Basic × Years (ex-gratia convention)
        var formula, denominator;
        if (type === 'covered') {
            denominator = 26;
            formula = '15/26';
        } else {
            denominator = 30;
            formula = '15/30';
        }

        var grossGratuity = Math.round((15 / denominator) * basic * serviceCounted);

        // Tax-free limit: ₹25,00,000 u/s 10(10)
        var taxFreeLimit = 2500000;
        var taxFreeAmt   = Math.min(grossGratuity, taxFreeLimit);
        var taxableAmt   = Math.max(0, grossGratuity - taxFreeLimit);
        var taxOnExcess  = Math.round(taxableAmt * slabPct);
        var netGratuity  = grossGratuity - taxOnExcess;

        // Per year value and % of annual basic
        var perYear      = serviceCounted > 0 ? Math.round(grossGratuity / serviceCounted) : 0;
        var annualBasic  = basic * 12;
        var pctOfAnnual  = annualBasic > 0 ? ((grossGratuity / (annualBasic * serviceCounted)) * 100) : 0;

        // DOM updates
        document.getElementById('grat-gross').textContent         = gratFmt(grossGratuity);
        document.getElementById('grat-taxfree').textContent       = gratFmt(taxFreeAmt);
        document.getElementById('grat-net').textContent           = gratFmt(netGratuity);
        document.getElementById('grat-service-counted').textContent = serviceCounted + ' yrs';
        document.getElementById('grat-tax').textContent           = taxOnExcess > 0 ? gratFmt(taxOnExcess) : '₹0 (fully exempt)';
        document.getElementById('grat-per-year').textContent      = gratFmt(perYear);
        document.getElementById('grat-pct').textContent           = pctOfAnnual.toFixed(1) + '%';

        // Step-by-step workings
        var w = document.getElementById('grat-workings');
        if (w) {
            var rows = [
                ['Last Basic + DA salary', gratFmt(basic) + '/mo'],
                ['Years of service entered', years + ' yrs ' + (months > 0 ? months + ' mo' : '')],
                ['Partial year rule (>6 mo → +1)', months > 6 ? months + ' months > 6 → count as ' + serviceCounted + ' yrs' : months + ' months ≤ 6 → no rounding'],
                ['Service counted for gratuity', serviceCounted + ' years'],
                ['Formula', formula + ' × ₹' + Number(basic).toLocaleString('en-IN') + ' × ' + serviceCounted],
                ['Gross gratuity', gratFmt(grossGratuity)],
                ['Tax-free limit u/s 10(10)', gratFmt(taxFreeLimit)],
                ['Taxable amount', taxableAmt > 0 ? gratFmt(taxableAmt) : 'Nil (within ₹25L limit)'],
                ['Income tax @ ' + (slabPct * 100).toFixed(0) + '%', taxOnExcess > 0 ? '−' + gratFmt(taxOnExcess) : '₹0'],
                ['Net gratuity in hand', gratFmt(netGratuity)]
            ];
            w.innerHTML = rows.map(function(r, i) {
                var isFinal = i === rows.length - 1;
                var isKey   = i === 5 || isFinal;
                return '<div class="flex justify-between py-0.5' + (i < rows.length - 1 ? ' border-b border-slate-100' : '') +
                       (isKey ? ' font-black' : '') + '">' +
                       '<span class="' + (isFinal ? 'text-emerald-700' : 'text-slate-500') + '">' + r[0] + '</span>' +
                       '<span class="' + (isFinal ? 'text-emerald-700 font-black' : 'font-semibold') + '">' + r[1] + '</span></div>';
            }).join('');
        }

        // Insight
        var ins = document.getElementById('grat-insight');
        if (ins) {
            ins.classList.remove('hidden');
            var tips = [];
            if (serviceCounted < 5) {
                tips.push('⚠ You need <strong>at least 5 years</strong> of continuous service to be eligible for gratuity under the Payment of Gratuity Act. Currently you have ' + serviceCounted + ' year(s).');
            } else {
                tips.push('After <strong>' + serviceCounted + ' years</strong> of service, your gross gratuity is <strong>' + gratFmt(grossGratuity) + '</strong>.');
                if (months > 6) tips.push('Your ' + months + ' extra months round up to a full year, adding <strong>' + gratFmt(perYear) + '</strong> to your payout.');
                if (grossGratuity >= taxFreeLimit) {
                    tips.push('Your gratuity exceeds the ₹25L tax-free limit — <strong>' + gratFmt(taxableAmt) + '</strong> is taxable at ' + (slabPct*100).toFixed(0) + '% slab. Consider whether you can stagger the payout across financial years.');
                } else {
                    tips.push('Your entire gratuity is <strong>fully tax-free</strong> under Sec 10(10) — no TDS, no income tax.');
                }
                tips.push('Employer must pay within 30 days of resignation. If delayed, they owe 10% p.a. simple interest.');
            }
            ins.innerHTML = '<strong>💡 Gratuity Summary:</strong> ' + tips.join(' ');
        }

        if (typeof saveUserData === 'function') saveUserData();
    }

    /* ══════════════════════════════════════════════════════════
       LOAN PREPAYMENT PLANNER (DEBT AVALANCHE / SNOWBALL)
    ══════════════════════════════════════════════════════════ */
    var _debtMethod = 'avalanche';
    var _debtLoans  = [];  // [{name, balance, rate, emi, id}]
    var _debtLoanId = 0;

    function debtFormat(el) {
        var raw = (el.value || '').replace(/[^0-9]/g, '');
        el.value = raw ? Number(raw).toLocaleString('en-IN') : '';
    }
    function debtNum(str) {
        return parseFloat((str || '').replace(/,/g, '')) || 0;
    }
    function debtFmt(n) {
        if (!n && n !== 0) return '—';
        var a = Math.abs(n), s = n < 0 ? '-' : '';
        if (a >= 1e7) return s + '₹' + (a/1e7).toFixed(2) + ' Cr';
        if (a >= 1e5) return s + '₹' + (a/1e5).toFixed(2) + ' L';
        return s + '₹' + Math.round(a).toLocaleString('en-IN');
    }

    function initDebtPlan() {
        if (_debtLoans.length === 0) {
            // Default: typical Indian portfolio
            debtScenario('typical');
        } else {
            debtRenderLoans();
            debtCalc();
        }
    }

    // =====================================================================
    //  JOINT / FAMILY FINANCIAL PLANNER
    // =====================================================================

    function initJointPlan() {
        // Wire up goal toggle checkboxes
        ['jp-goal-edu','jp-goal-home','jp-goal-retire'].forEach(function(id) {
            var chk = document.getElementById(id);
            if (!chk) return;
            var inputId = id === 'jp-goal-edu' ? 'jp-edu-inputs' : id === 'jp-goal-home' ? 'jp-home-inputs' : 'jp-retire-inputs';
            var track = chk.parentElement.querySelector('.jp-toggle-track');
            var thumb = chk.parentElement.querySelector('.jp-toggle-thumb');
            // Sync visual state on init
            _jpSyncToggle(chk, track, thumb, inputId);
            chk.addEventListener('change', function() {
                _jpSyncToggle(chk, track, thumb, inputId);
                jointPlanCalc();
            });
        });
        jointPlanCalc();
    }

    function _jpSyncToggle(chk, track, thumb, inputId) {
        var on = chk.checked;
        if (track) track.style.background = on ? '#0ea5e9' : '#e2e8f0';
        if (thumb) thumb.style.transform = on ? 'translateX(16px)' : 'translateX(0)';
        var inp = document.getElementById(inputId);
        if (inp) inp.classList.toggle('hidden', !on);
    }

    function jpFmt(el) {
        var raw = el.value.replace(/[^0-9]/g, '');
        if (!raw) return;
        el.value = jpComma(parseInt(raw, 10));
        el.classList.remove('text-slate-400');
    }

    function jpComma(n) {
        if (isNaN(n)) return '';
        var s = Math.round(n).toString();
        if (s.length <= 3) return s;
        var last3 = s.slice(-3);
        var rest = s.slice(0, -3);
        return rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + last3;
    }

    function jpParseMoney(id) {
        var el = document.getElementById(id);
        if (!el) return 0;
        var v = parseFloat(el.value.replace(/[^0-9.]/g, '')) || 0;
        return v;
    }

    function jpInrFmt(n) {
        if (n >= 1e7) return '₹' + (n / 1e7).toFixed(2) + ' Cr';
        if (n >= 1e5) return '₹' + (n / 1e5).toFixed(2) + ' L';
        return '₹' + jpComma(Math.round(n));
    }

    function jointPlanCalc() {
        // Read partner values
        var p1Income    = jpParseMoney('jp-p1-income') * 12;    // annual
        var p2Income    = jpParseMoney('jp-p2-income') * 12;
        var p1Invest    = jpParseMoney('jp-p1-invest');          // monthly
        var p2Invest    = jpParseMoney('jp-p2-invest');
        var p1Portfolio = jpParseMoney('jp-p1-portfolio');
        var p2Portfolio = jpParseMoney('jp-p2-portfolio');
        var p1Slab      = parseInt(document.getElementById('jp-p1-slab').value) || 20;
        var p2Slab      = parseInt(document.getElementById('jp-p2-slab').value) || 20;
        var retRate     = (parseFloat(document.getElementById('jp-return').value) || 12) / 100;

        var combinedMonthly = p1Invest + p2Invest;
        var combinedAnnualIncome = p1Income + p2Income;
        var totalPortfolio = p1Portfolio + p2Portfolio;
        var savingsRate = combinedAnnualIncome > 0 ? (combinedMonthly * 12 / combinedAnnualIncome * 100) : 0;

        // Update summary card
        document.getElementById('jp-res-income').textContent = jpInrFmt(combinedAnnualIncome / 12) + '/mo';
        document.getElementById('jp-res-invest').textContent = jpInrFmt(combinedMonthly) + '/mo';
        document.getElementById('jp-res-rate').textContent = savingsRate.toFixed(1) + '%';
        document.getElementById('jp-res-portfolio').textContent = jpInrFmt(totalPortfolio);

        // LTCG calculations — ₹1.25L exemption per person per year
        // Assumption: portfolio returns ~12%, of which LTCG = ~8-10% gains
        var ltcgExemption = 125000;
        var p1GainRate = 0.10;  // assumed annual gain % of portfolio
        var p2GainRate = 0.10;
        var p1AnnualGains = p1Portfolio * p1GainRate;
        var p2AnnualGains = p2Portfolio * p2GainRate;

        // Tax saved = min(gains, exemption) * tax_rate / 100
        // If gains > exemption, harvesting saves: exemption * rate
        // If gains < exemption, saves: gains * rate (all tax-free)
        var p1LtcgSave = Math.min(p1AnnualGains, ltcgExemption) * (p1Slab / 100) + (p1AnnualGains > ltcgExemption ? (p1AnnualGains - ltcgExemption) * 0.125 - p1AnnualGains * 0.125 : 0);
        // Simplified: benefit of harvesting = gains_up_to_1.25L taxed at 0 instead of 12.5%
        p1LtcgSave = Math.min(p1AnnualGains, ltcgExemption) * 0.125;
        var p2LtcgSave = Math.min(p2AnnualGains, ltcgExemption) * 0.125;
        var totalLtcgSave = p1LtcgSave + p2LtcgSave;

        document.getElementById('jp-ltcg-p1-save').textContent = jpInrFmt(p1LtcgSave) + '/yr';
        document.getElementById('jp-ltcg-p2-save').textContent = jpInrFmt(p2LtcgSave) + '/yr';
        document.getElementById('jp-ltcg-total-save').textContent = jpInrFmt(totalLtcgSave) + '/yr';
        document.getElementById('jp-ltcg-10yr').textContent = jpInrFmt(totalLtcgSave * 10);

        // Investment split advice
        var p1Name = document.getElementById('jp-p1-name').value.trim() || 'Partner 1';
        var p2Name = document.getElementById('jp-p2-name').value.trim() || 'Partner 2';
        var splitHtml = '';
        if (combinedMonthly > 0) {
            // Higher LTCG potential goes to higher portfolio holder
            // More equity to lower slab
            var higherSlabName = p1Slab >= p2Slab ? p1Name : p2Name;
            var lowerSlabName  = p1Slab < p2Slab  ? p1Name : p2Name;
            var higherSlabPct  = Math.max(p1Slab, p2Slab);
            var lowerSlabPct   = Math.min(p1Slab, p2Slab);
            var p1Pct = Math.round((p1Invest / (combinedMonthly || 1)) * 100);
            var p2Pct = 100 - p1Pct;

            splitHtml += '<div class="flex justify-between items-center py-1 border-b border-slate-100">';
            splitHtml += '<span class="text-slate-600">' + p1Name + ' (' + p1Slab + '% slab)</span>';
            splitHtml += '<span class="font-black text-slate-800">' + jpInrFmt(p1Invest) + '/mo (' + p1Pct + '%)</span></div>';
            splitHtml += '<div class="flex justify-between items-center py-1 border-b border-slate-100">';
            splitHtml += '<span class="text-slate-600">' + p2Name + ' (' + p2Slab + '% slab)</span>';
            splitHtml += '<span class="font-black text-slate-800">' + jpInrFmt(p2Invest) + '/mo (' + p2Pct + '%)</span></div>';

            if (p1Slab !== p2Slab) {
                splitHtml += '<div class="mt-2 px-2 py-1.5 rounded-lg text-[9px] leading-relaxed" style="background:#fffbeb;border:1px solid #fde68a;color:#78350f;">';
                splitHtml += '💡 Route FD/debt instruments through <strong>' + lowerSlabName + '</strong> (' + lowerSlabPct + '% slab) to save ';
                splitHtml += (higherSlabPct - lowerSlabPct) + '% tax on interest income.</div>';
            }

            // 80C advice
            var p1_80c_used = jpParseMoney('jp-p1-80c');
            var p2_80c_used = jpParseMoney('jp-p2-80c');
            var p1_80c_left = Math.max(0, 150000 - p1_80c_used);
            var p2_80c_left = Math.max(0, 150000 - p2_80c_used);
            if (p1_80c_left > 0 || p2_80c_left > 0) {
                splitHtml += '<div class="mt-2 px-2 py-1.5 rounded-lg text-[9px] leading-relaxed" style="background:#f0fdf4;border:1px solid #86efac;color:#14532d;">';
                if (p1_80c_left > 0) splitHtml += '✅ ' + p1Name + ': ₹' + jpComma(p1_80c_left) + ' 80C room left. ';
                if (p2_80c_left > 0) splitHtml += '✅ ' + p2Name + ': ₹' + jpComma(p2_80c_left) + ' 80C room left. ';
                splitHtml += 'ELSS SIP counts toward 80C.</div>';
            }
        } else {
            splitHtml = '<div class="text-slate-400 text-[10px]">Enter monthly investment amounts to see split recommendations</div>';
        }
        document.getElementById('jp-split-content').innerHTML = splitHtml;

        // Goals calculation
        var goalHtml = '';
        var eduActive    = document.getElementById('jp-goal-edu').checked;
        var homeActive   = document.getElementById('jp-goal-home').checked;
        var retireActive = document.getElementById('jp-goal-retire').checked;

        function sipNeeded(fv, r, n) {
            // Monthly SIP for FV = SIP * [((1+r/12)^n - 1) / (r/12)] * (1+r/12)
            var rm = r / 12;
            var months = n * 12;
            if (rm === 0) return fv / months;
            return fv * rm / (Math.pow(1 + rm, months) - 1) / (1 + rm);
        }

        function goalCard(emoji, label, todayCost, years, inflRate, color, border) {
            var eduInfl = inflRate / 100;
            var fv = todayCost * Math.pow(1 + eduInfl, years);
            var sip = sipNeeded(fv, retRate, years);
            var combinedCorpus = p1Portfolio + p2Portfolio;
            var existingGrowth = combinedCorpus * Math.pow(1 + retRate, years);
            var sipAfterExisting = Math.max(0, sipNeeded(Math.max(0, fv - existingGrowth), retRate, years));

            return '<div class="rounded-2xl p-3" style="background:' + color + ';border:1px solid ' + border + ';">' +
                '<div class="flex items-center gap-1.5 mb-2"><span class="text-base">' + emoji + '</span>' +
                '<span class="text-[10px] font-black text-slate-700 uppercase tracking-wider">' + label + '</span></div>' +
                '<div class="grid grid-cols-3 gap-1.5 text-center">' +
                '<div><div class="text-[8px] text-slate-500 uppercase font-bold">Future Cost</div><div class="text-sm font-black text-slate-800">' + jpInrFmt(fv) + '</div></div>' +
                '<div><div class="text-[8px] text-slate-500 uppercase font-bold">Monthly SIP</div><div class="text-sm font-black text-emerald-700">' + jpInrFmt(sip) + '</div></div>' +
                '<div><div class="text-[8px] text-slate-500 uppercase font-bold">Adjusted SIP</div><div class="text-sm font-black text-sky-700">' + jpInrFmt(sipAfterExisting) + '</div><div class="text-[8px] text-slate-400">after existing corpus</div></div>' +
                '</div></div>';
        }

        if (eduActive) {
            var eduCost  = jpParseMoney('jp-edu-cost')  || 2000000;
            var eduYears = parseFloat(document.getElementById('jp-edu-years').value) || 15;
            goalHtml += goalCard('🎓', "Child's Education", eduCost, eduYears, 10, '#f0f9ff', '#bae6fd');
        }
        if (homeActive) {
            var homeCost  = jpParseMoney('jp-home-cost')  || 6000000;
            var homeYears = parseFloat(document.getElementById('jp-home-years').value) || 5;
            goalHtml += goalCard('🏠', 'Home Purchase (Down Payment)', homeCost, homeYears, 6, '#f0fdf4', '#86efac');
        }
        if (retireActive) {
            var retireAge     = parseFloat(document.getElementById('jp-retire-age').value) || 35;
            var retireMonthly = jpParseMoney('jp-retire-monthly') || 100000;
            var yearsToRetire = Math.max(1, 60 - retireAge);
            // Corpus = (monthly * 12 / 0.04) — 4% SWR
            var retireCorpus  = retireMonthly * 12 / 0.04;
            goalHtml += goalCard('🌅', 'Joint Retirement Corpus', retireCorpus, yearsToRetire, 7, '#fdf4ff', '#e9d5ff');
        }

        var goalsDiv = document.getElementById('jp-goals-results');
        goalsDiv.className = 'grid grid-cols-1 sm:grid-cols-' + ([eduActive, homeActive, retireActive].filter(Boolean).length || 1) + ' gap-2';
        if (goalHtml) {
            goalsDiv.innerHTML = goalHtml;
            goalsDiv.classList.remove('hidden');
        } else {
            goalsDiv.classList.add('hidden');
        }

        // Insight strip
        var insight = document.getElementById('jp-insight');
        if (combinedMonthly > 0) {
            var monthsToDouble = Math.round(72 / ((retRate * 100))) ;
            var insights = [];
            if (savingsRate >= 30) insights.push('🌟 Your household savings rate of <strong>' + savingsRate.toFixed(1) + '%</strong> is excellent — well above the recommended 20%.');
            else if (savingsRate >= 15) insights.push('👍 Your combined savings rate of <strong>' + savingsRate.toFixed(1) + '%</strong> is on track. Aim for 25–30% for faster financial independence.');
            else insights.push('⚠️ Savings rate of <strong>' + savingsRate.toFixed(1) + '%</strong> is below 15%. Try to cut discretionary spend and increase SIPs.');
            if (totalLtcgSave > 0) insights.push('💰 By harvesting LTCG yearly, your family saves <strong>' + jpInrFmt(totalLtcgSave) + ' per year</strong> — that\'s <strong>' + jpInrFmt(totalLtcgSave * 10) + ' over 10 years</strong> entirely legally.');
            if (combinedMonthly > 0) insights.push('📈 At ' + (retRate * 100).toFixed(0) + '% p.a., your combined ₹' + jpInrFmt(combinedMonthly) + '/mo SIP becomes <strong>' + jpInrFmt(combinedMonthly * 12 * ((Math.pow(1 + retRate / 12, 120) - 1) / (retRate / 12))) + ' in 10 years</strong>.');
            insight.innerHTML = insights.join(' &nbsp;·&nbsp; ');
            insight.classList.remove('hidden');
        } else {
            insight.classList.add('hidden');
        }
        if (typeof saveUserData === 'function') saveUserData();
    }

    function resetJointPlan() {
        var defaults = {
            'jp-p1-name': '', 'jp-p2-name': '',
            'jp-p1-income': '1,20,000', 'jp-p2-income': '90,000',
            'jp-p1-invest': '25,000',  'jp-p2-invest': '18,000',
            'jp-p1-portfolio': '5,00,000', 'jp-p2-portfolio': '2,50,000',
            'jp-p1-80c': '1,50,000',   'jp-p2-80c': '1,50,000',
            'jp-edu-cost': '20,00,000', 'jp-edu-years': '15',
            'jp-home-cost': '60,00,000', 'jp-home-years': '5',
            'jp-retire-age': '35', 'jp-retire-monthly': '1,00,000',
            'jp-return': '12'
        };
        Object.keys(defaults).forEach(function(id) {
            var el = document.getElementById(id);
            if (el) { el.value = defaults[id]; el.classList.add('text-slate-400'); }
        });
        document.getElementById('jp-p1-slab').value = '20';
        document.getElementById('jp-p2-slab').value = '30';
        document.getElementById('jp-goal-edu').checked    = true;
        document.getElementById('jp-goal-home').checked   = false;
        document.getElementById('jp-goal-retire').checked = false;
        initJointPlan();
    }

    function jpPreset(name) {
        var p = {
            starter:    { p1i:'80,000',   p2i:'60,000',   p1inv:'15,000', p2inv:'10,000', p1port:'1,50,000', p2port:'75,000',   p1s:10, p2s:5,  ret:12 },
            midcareer:  { p1i:'1,20,000', p2i:'90,000',   p1inv:'25,000', p2inv:'18,000', p1port:'5,00,000', p2port:'2,50,000', p1s:20, p2s:20, ret:12 },
            senior:     { p1i:'2,50,000', p2i:'1,80,000', p1inv:'60,000', p2inv:'40,000', p1port:'40,00,000',p2port:'25,00,000',p1s:30, p2s:30, ret:12 }
        };
        var d = p[name];
        if (!d) return;
        var map = {
            'jp-p1-income': d.p1i, 'jp-p2-income': d.p2i,
            'jp-p1-invest': d.p1inv, 'jp-p2-invest': d.p2inv,
            'jp-p1-portfolio': d.p1port, 'jp-p2-portfolio': d.p2port,
            'jp-return': d.ret
        };
        Object.keys(map).forEach(function(id) {
            var el = document.getElementById(id);
            if (el) { el.value = map[id]; el.classList.remove('text-slate-400'); }
        });
        document.getElementById('jp-p1-slab').value = d.p1s;
        document.getElementById('jp-p2-slab').value = d.p2s;
        document.getElementById('jp-goal-edu').checked  = true;
        document.getElementById('jp-goal-home').checked = name === 'senior';
        initJointPlan();
    }

    // =====================================================================
    //  CIBIL SCORE EDUCATION & IMPROVEMENT TRACKER
    // =====================================================================

    function cibilFmtMoney(el) {
        var raw = el.value.replace(/[^0-9]/g, '');
        if (!raw) return;
        var n = parseInt(raw, 10);
        var s = Math.round(n).toString();
        if (s.length <= 3) { el.value = s; }
        else {
            var last3 = s.slice(-3);
            var rest  = s.slice(0, -3);
            el.value  = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + last3;
        }
        el.classList.remove('text-slate-400');
    }

    function _cibilComma(n) {
        if (isNaN(n)) return '0';
        var s = Math.round(n).toString();
        if (s.length <= 3) return s;
        var last3 = s.slice(-3), rest = s.slice(0, -3);
        return rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + last3;
    }

    function _cibilInr(n) {
        if (n >= 1e7) return '₹' + (n / 1e7).toFixed(2) + ' Cr';
        if (n >= 1e5) return '₹' + (n / 1e5).toFixed(2) + ' L';
        return '₹' + _cibilComma(Math.round(n));
    }

    // Approximate home-loan interest rate lookup by score band
    function _cibilRate(score) {
        if (score >= 800) return 8.40;
        if (score >= 775) return 8.55;
        if (score >= 750) return 8.70;
        if (score >= 725) return 9.00;
        if (score >= 700) return 9.35;
        if (score >= 675) return 9.75;
        if (score >= 650) return 10.25;
        if (score >= 625) return 10.90;
        if (score >= 600) return 11.50;
        return 12.50; // below 600 — high risk / likely rejected
    }

    function _cibilEMI(principal, annualRate, tenureYears) {
        var r  = annualRate / 12 / 100;
        var n  = tenureYears * 12;
        if (r === 0) return principal / n;
        return principal * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1);
    }

    function _cibilGrade(score) {
        if (score >= 800) return { label: 'Excellent 🌟', color: '#059669' };
        if (score >= 750) return { label: 'Great 😊',     color: '#10b981' };
        if (score >= 700) return { label: 'Good 🙂',      color: '#eab308' };
        if (score >= 650) return { label: 'Fair 😐',      color: '#f59e0b' };
        if (score >= 600) return { label: 'Poor 😟',      color: '#ef4444' };
        return { label: 'Very Poor 😰', color: '#b91c1c' };
    }

    function cibilCalc() {
        var score    = parseInt(document.getElementById('cibil-score').value)      || 720;
        var util     = parseFloat(document.getElementById('cibil-util').value)     || 35;
        var missed   = parseInt(document.getElementById('cibil-missed').value)     || 0;
        var age      = parseFloat(document.getElementById('cibil-age').value)      || 4;
        var cards    = parseInt(document.getElementById('cibil-cards').value)      || 2;
        var enq      = parseInt(document.getElementById('cibil-enquiries').value)  || 1;
        var loanAmt  = parseFloat((document.getElementById('cibil-loan-amt').value || '5000000').replace(/[^0-9]/g, '')) || 5000000;
        var tenure   = parseInt(document.getElementById('cibil-loan-tenure').value) || 20;

        score = Math.min(900, Math.max(300, score));

        // Score display + gauge
        var grade = _cibilGrade(score);
        document.getElementById('cibil-score-display').textContent = score;
        var gradeEl = document.getElementById('cibil-grade-label');
        gradeEl.textContent = grade.label;
        gradeEl.style.color = grade.color;
        var gaugeW = Math.round(((score - 300) / 600) * 100);
        var gaugeEl = document.getElementById('cibil-gauge-fill');
        if (gaugeEl) { gaugeEl.style.width = gaugeW + '%'; gaugeEl.style.background = 'linear-gradient(90deg,' + grade.color + '88,' + grade.color + ')'; }

        // Rates & EMI
        var myRate   = _cibilRate(score);
        var bestRate = 8.40;
        var myEMI    = _cibilEMI(loanAmt, myRate, tenure);
        var bestEMI  = _cibilEMI(loanAmt, bestRate, tenure);
        var emiSave  = myEMI - bestEMI;
        var totalIntMine = myEMI  * tenure * 12 - loanAmt;
        var totalIntBest = bestEMI * tenure * 12 - loanAmt;
        var totalSaved   = totalIntMine - totalIntBest;

        document.getElementById('cibil-rate-display').textContent = myRate.toFixed(2) + '%';
        document.getElementById('cibil-emi-save').textContent     = score >= 750 ? '₹0 (best rate!)' : (_cibilInr(emiSave) + '/mo');
        document.getElementById('cibil-total-saved').textContent  = score >= 750 ? '₹0 — you already have the best rate!' : _cibilInr(Math.max(0, totalSaved));

        // Factor bars
        var utilScore  = util <= 10 ? 100 : util <= 30 ? 80 : util <= 50 ? 55 : util <= 75 ? 30 : 10;
        var payScore   = missed === 0 ? 100 : missed === 1 ? 50 : missed <= 3 ? 25 : 5;
        var ageScore   = age >= 7 ? 100 : age >= 5 ? 80 : age >= 3 ? 55 : age >= 1 ? 30 : 10;
        var enqScore   = enq === 0 ? 100 : enq === 1 ? 80 : enq <= 3 ? 55 : enq <= 5 ? 30 : 10;
        var mixScore   = cards >= 1 && cards <= 4 ? 85 : cards === 0 ? 40 : 65;

        var factors = [
            { label: 'Payment History (35%)',   pct: payScore,  color: '#10b981', tip: missed > 0 ? 'Missed EMIs are the #1 score killer — set auto-pay immediately.' : 'Perfect — keep it up!' },
            { label: 'Credit Utilisation (30%)', pct: utilScore, color: '#3b82f6', tip: util > 30 ? 'Reduce to below 30%. Quick fix: request a credit limit increase or pay twice/month.' : util > 10 ? 'Good — aim for below 10% for an extra boost.' : 'Excellent — below 10% is the sweet spot.' },
            { label: 'Credit Age (15%)',         pct: ageScore,  color: '#eab308', tip: age < 3 ? 'Young history — time heals this. Never close old accounts.' : 'Healthy age — avoid closing old accounts.' },
            { label: 'New Enquiries (10%)',      pct: enqScore,  color: '#f97316', tip: enq > 3 ? 'Too many applications signal desperation. Pause new applications for 6 months.' : enq <= 1 ? 'Good — space out applications by 6+ months.' : 'Moderate — avoid new applications for 3 months.' },
            { label: 'Credit Mix (10%)',         pct: mixScore,  color: '#8b5cf6', tip: cards === 0 ? 'No credit card — a secured card or credit-builder loan helps.' : cards > 4 ? 'Too many cards can hurt. Consolidate and close newest ones.' : 'Good mix — maintain responsibly.' },
        ];

        var factorsHtml = '';
        factors.forEach(function(f) {
            factorsHtml += '<div>' +
                '<div class="flex justify-between items-center mb-0.5">' +
                '<span class="text-[10px] font-bold text-slate-700">' + f.label + '</span>' +
                '<span class="text-[10px] font-black" style="color:' + f.color + '">' + f.pct + '/100</span>' +
                '</div>' +
                '<div class="h-2 rounded-full bg-slate-100">' +
                '<div class="h-full rounded-full transition-all duration-700" style="width:' + f.pct + '%;background:' + f.color + ';"></div>' +
                '</div>' +
                '<div class="text-[9px] text-slate-500 mt-0.5">' + f.tip + '</div>' +
                '</div>';
        });
        document.getElementById('cibil-factors').innerHTML = factorsHtml;

        // 90-day action plan
        var actions = [];
        if (missed > 0)   actions.push({ week: 'Week 1', icon: '🔴', text: 'Set auto-pay for ALL EMIs & credit card bills today. One missed payment can cost 80–100 points.', urgent: true });
        if (util > 30)    actions.push({ week: 'Week 1–2', icon: '🔵', text: 'Pay down credit card balance to below 30% of limit. If balance is ₹' + _cibilComma(Math.round(loanAmt * 0.001)) + ', your target is ₹' + _cibilComma(Math.round(loanAmt * 0.0003)) + '.', urgent: util > 60 });
        if (enq > 3)      actions.push({ week: 'Week 2', icon: '🟠', text: 'Stop all new loan/card applications for at least 6 months. Each hard enquiry drops score by 5–10 points.', urgent: true });
        if (age < 3)      actions.push({ week: 'Month 1', icon: '🟡', text: 'Never close your oldest credit card — even if unused. Keep it active with 1 small purchase/month.', urgent: false });
        if (cards === 0)  actions.push({ week: 'Month 1', icon: '🟣', text: 'Apply for 1 secured credit card (against FD). Use it for ≤10% of limit and pay in full each month.', urgent: false });
        if (util <= 30 && missed === 0 && enq <= 2) actions.push({ week: 'Month 2', icon: '✅', text: 'Request credit limit increase from your card issuer — this reduces utilisation ratio without extra spending.', urgent: false });
        actions.push({ week: 'Month 3', icon: '📋', text: 'Pull your free CIBIL report and dispute any errors at cibil.com/dispute. Errors corrected = instant score boost.', urgent: false });
        if (score >= 750) actions.push({ week: 'Now', icon: '🎯', text: 'Your score is excellent! Apply for your home loan now to lock the best interest rate (≈' + bestRate.toFixed(2) + '%).', urgent: false });

        var planHtml = '';
        actions.forEach(function(a) {
            planHtml += '<div class="flex gap-2 items-start rounded-xl p-2" style="background:' + (a.urgent ? '#fef2f2' : '#f8fafc') + ';border:1px solid ' + (a.urgent ? '#fecaca' : '#e2e8f0') + ';">' +
                '<span class="text-sm flex-shrink-0">' + a.icon + '</span>' +
                '<div><div class="text-[9px] font-black text-slate-400 uppercase">' + a.week + '</div>' +
                '<div class="text-[10px] text-slate-700 leading-relaxed">' + a.text + '</div></div></div>';
        });
        document.getElementById('cibil-action-plan').innerHTML = planHtml;

        // Improvement timeline
        var timelineItems = [];
        if (score < 750) {
            var projected30  = Math.min(900, score + (util > 30 ? 25 : 10));
            var projected90  = Math.min(900, score + (util > 30 ? 50 : 20) + (missed === 0 ? 10 : 0));
            var projected180 = Math.min(900, score + (util > 30 ? 70 : 30) + (enq > 2 ? 15 : 5));
            timelineItems = [
                { period: '30 days',  score: projected30,  action: 'Pay down utilisation + auto-pay setup' },
                { period: '90 days',  score: projected90,  action: 'Consistent payments + enquiry freeze' },
                { period: '6 months', score: projected180, action: 'Clean history building + dispute errors' },
            ];
        } else {
            timelineItems = [{ period: 'Now', score: score, action: '🎯 You\'re in the best rate band! Apply for credit now.' }];
        }
        var tlHtml = '';
        timelineItems.forEach(function(t) {
            var tGrade = _cibilGrade(t.score);
            tlHtml += '<div class="flex items-center gap-2">' +
                '<div class="text-[9px] font-black text-slate-400 w-16 flex-shrink-0">' + t.period + '</div>' +
                '<div class="h-2 flex-1 rounded-full bg-slate-100">' +
                '<div class="h-full rounded-full" style="width:' + Math.round(((t.score-300)/600)*100) + '%;background:' + tGrade.color + ';transition:width .7s;"></div></div>' +
                '<div class="text-[10px] font-black w-10 flex-shrink-0" style="color:' + tGrade.color + '">' + t.score + '</div>' +
                '</div>' +
                '<div class="text-[9px] text-slate-400 ml-18 mb-1 pl-16">' + t.action + '</div>';
        });
        document.getElementById('cibil-timeline').innerHTML = tlHtml;

        // Score band comparison table
        var bands = [
            { range: '800–900', grade: 'Excellent', rate: 8.40 },
            { range: '775–799', grade: 'Excellent', rate: 8.55 },
            { range: '750–774', grade: 'Great',     rate: 8.70 },
            { range: '725–749', grade: 'Good',      rate: 9.00 },
            { range: '700–724', grade: 'Good',      rate: 9.35 },
            { range: '650–699', grade: 'Fair',      rate: 10.25 },
            { range: '600–649', grade: 'Poor',      rate: 11.50 },
            { range: '<600',    grade: 'Very Poor', rate: 12.50 },
        ];
        var bestBandEMI  = _cibilEMI(loanAmt, 8.40, tenure);
        var bestBandInt  = bestBandEMI * tenure * 12 - loanAmt;
        var tblHtml = '';
        bands.forEach(function(b) {
            var bEMI = _cibilEMI(loanAmt, b.rate, tenure);
            var bInt = bEMI * tenure * 12 - loanAmt;
            var diff = bInt - bestBandInt;
            var isYours = myRate === b.rate;
            var rowBg   = isYours ? 'background:#fef3c7;' : '';
            tblHtml += '<tr style="' + rowBg + 'border-bottom:1px solid #f1f5f9;">' +
                '<td class="py-1.5 font-bold ' + (isYours ? 'text-amber-800' : 'text-slate-700') + '">' + b.range + (isYours ? ' ← You' : '') + '</td>' +
                '<td class="py-1.5 text-slate-600">' + b.grade + '</td>' +
                '<td class="py-1.5 font-bold text-slate-800">' + b.rate.toFixed(2) + '%</td>' +
                '<td class="py-1.5 font-bold text-slate-800">₹' + _cibilComma(Math.round(bEMI)) + '</td>' +
                '<td class="py-1.5 text-slate-700">' + _cibilInr(bInt) + '</td>' +
                '<td class="py-1.5 font-bold ' + (diff > 0 ? 'text-red-600' : 'text-emerald-600') + '">' + (diff > 0 ? '+' + _cibilInr(diff) : '—') + '</td>' +
                '</tr>';
        });
        document.getElementById('cibil-table-body').innerHTML = tblHtml;

        // Insight
        var insightEl = document.getElementById('cibil-insight');
        var insightMsg = '';
        if (score >= 800) insightMsg = '🌟 <strong>Elite status.</strong> You\'ll get the absolute best rates. No lender can turn you down. Apply with confidence — and check for pre-approved offers from your bank.';
        else if (score >= 750) insightMsg = '😊 <strong>Great score!</strong> You qualify for the best home loan rates (~8.4–8.7%). Even a small improvement toward 800 won\'t change your rate much — focus on maintaining rather than chasing.';
        else if (score >= 700) insightMsg = '🙂 <strong>Good, but improvable.</strong> At ' + score + ', you\'re paying ~' + myRate + '% vs ' + bestRate + '% possible — that\'s ' + _cibilInr(totalSaved) + ' extra over ' + tenure + ' years. Focus on utilisation and payments for 90 days.';
        else if (score >= 650) insightMsg = '😐 <strong>Fair — action needed.</strong> Lenders see you as moderate risk. Reducing utilisation below 30% and 6 months of clean payments can lift you 40–60 points. Wait 90 days before applying for a major loan.';
        else insightMsg = '😟 <strong>Poor — delay major loan applications.</strong> Most banks will reject or charge 11%+ rates. Spend 6–12 months on: zero missed payments, reduce credit card balance, freeze new applications. Your score CAN recover fully.';
        insightEl.innerHTML = insightMsg;
        if (typeof saveUserData === 'function') saveUserData();
    }

    function initCibil() { cibilCalc(); }

    // =====================================================================
    //  FINANCIAL CALENDAR & SMART REMINDERS
    // =====================================================================

    var _fcActiveFilter = 'all';
    var _fcViewMonth    = null; // Date object for current calendar month view

    function fcFmt(el) {
        var raw = el.value.replace(/[^0-9]/g, '');
        if (!raw) return;
        var n = parseInt(raw, 10);
        var s = Math.round(n).toString();
        if (s.length <= 3) { el.value = s; return; }
        var last3 = s.slice(-3), rest = s.slice(0, -3);
        el.value = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + last3;
        el.classList.remove('text-slate-400');
    }

    // Build all events for current FY (Apr–Mar) + next 12 months
    function _fcBuildEvents() {
        var today   = new Date();
        var regime  = (document.getElementById('fc-regime')?.value) || 'new';
        var hasPPF  = (document.getElementById('fc-ppf')?.value)   === 'yes';
        var hasELSS = (document.getElementById('fc-elss')?.value)  === 'yes';
        var hasSGB  = (document.getElementById('fc-sgb')?.value)   === 'yes';
        var hasEPF  = (document.getElementById('fc-epf')?.value)   === 'yes';
        var ccDay   = parseInt(document.getElementById('fc-cc-date')?.value) || 5;
        var incomeRaw = (document.getElementById('fc-income')?.value || '1200000').replace(/[^0-9]/g,'');
        var income  = parseInt(incomeRaw) || 1200000;

        // Current financial year: Apr 1 of this or last year
        var fyStart = today.getMonth() >= 3
            ? new Date(today.getFullYear(), 3, 1)
            : new Date(today.getFullYear() - 1, 3, 1);
        var fyEnd   = new Date(fyStart.getFullYear() + 1, 2, 31);
        var fy      = fyStart.getFullYear(); // e.g. 2025 for FY2025-26

        var events = [];

        function addEv(dateArr, title, desc, cat, icon, penalty) {
            // dateArr: [year, month0based, day]
            var d = new Date(dateArr[0], dateArr[1], dateArr[2]);
            events.push({ date: d, title: title, desc: desc, cat: cat, icon: icon, penalty: penalty || '' });
        }

        // ── TAX EVENTS ──────────────────────────────────────────────────
        // Advance Tax (only if income > 10L or business income)
        if (income > 500000) {
            addEv([fy,5,15],  '🟡 Advance Tax — 1st Instalment (15%)',
                'Pay 15% of estimated annual tax. Miss this → 1% interest/month under Sec 234C.',
                'tax','💸','1% interest/month on shortfall (Sec 234C)');
            addEv([fy,8,15],  '🟠 Advance Tax — 2nd Instalment (45%)',
                'Cumulative 45% of estimated tax due. Common cause of surprise penalties in December.',
                'tax','💸','1% interest/month on shortfall');
            addEv([fy,11,15], '🔴 Advance Tax — 3rd Instalment (75%)',
                'Cumulative 75% of estimated tax due. Most salaried people forget this one.',
                'tax','💸','1% interest/month on shortfall');
            addEv([fy+1,2,15],'🔴 Advance Tax — 4th Instalment (100%)',
                'Final 100% advance tax due. After this any shortfall attracts Sec 234B interest.',
                'tax','💸','1% interest/month under Sec 234B');
        }

        // ITR Deadlines
        addEv([fy+1,6,31], '📋 ITR Filing Deadline — Salaried (Jul 31)',
            'File your income tax return for FY' + fy + '-' + (fy-1999) + '. Late filing fee: ₹1,000–₹5,000 + 1% interest/month. Losses cannot be carried forward if filed late.',
            'tax','📋','₹5,000 late fee + 1% interest/month (Sec 234A)');
        addEv([fy+1,9,31], '⚠️ Belated ITR Deadline (Oct 31)',
            'Last date for belated or revised ITR. After this, you cannot file for FY' + fy + '-' + (fy-1999) + ' at all.',
            'tax','⚠️','₹5,000 penalty + cannot file after this');
        addEv([fy+1,11,31],'🔴 Final Belated Return — Dec 31',
            'Absolute last chance to file a belated return for FY' + fy + '-' + (fy-1999) + '. Miss this and you permanently lose the ability to file.',
            'tax','🚨','Permanently cannot file — all refunds forfeited');

        // Form 16 receipt
        addEv([fy+1,5,15], '📄 Form 16 Due from Employer',
            'Your employer must issue Form 16 by June 15. If you haven\'t received it, follow up immediately — you need it to file ITR accurately.',
            'tax','📄','');

        // TDS refund check
        addEv([fy+1,7,15], '💰 Check TDS Refund Status',
            'If excess TDS was deducted, track your refund status on incometax.gov.in. Most refunds arrive within 4–6 weeks of ITR processing.',
            'tax','💰','');

        // ── INVESTMENT EVENTS ────────────────────────────────────────────
        if (hasPPF) {
            // PPF: deposit before 5th of each month for interest. Special: April 5
            addEv([fy,3,4],   '🏛️ PPF April 5 Deadline',
                'Deposit before April 5 to earn interest on the FULL amount for April. Depositing on Apr 6 means you lose one month of 7.1% interest on up to ₹1.5L.',
                'invest','🏛️','Lose 1 month interest on ₹1.5L = ~₹888');
            addEv([fy,2,31],  '🏛️ PPF Annual Maximum — March 31',
                'Invest up to ₹1.5L in PPF before March 31 to claim 80C deduction and maximise EEE tax-free corpus.',
                'invest','🏛️','Miss 80C deduction: ₹4,500–₹45,000 tax lost (5%–30% slab)');
            // Monthly PPF reminder (5th of each month)
            for (var m = 0; m < 12; m++) {
                var evDate = new Date(fy, m + 3, 4);
                if (evDate >= fyStart && evDate <= new Date(fyEnd.getFullYear(), fyEnd.getMonth() + 3, 0)) {
                    if (m === 0) continue; // Already added April 5 above
                    addEv([evDate.getFullYear(), evDate.getMonth(), 4],
                        '🏛️ PPF Monthly Contribution (before 5th)',
                        'Deposit this month\'s PPF contribution before the 5th to earn interest for this month.',
                        'invest','🏛️','');
                }
            }
        }

        if (hasELSS && regime === 'old') {
            addEv([fy+1,0,15], '📈 ELSS — Invest by January 15',
                'Invest in ELSS before Jan 15 to avoid the March server crash. Units allotted in Jan count for this FY\'s 80C. Don\'t wait till March — mutual fund sites crash.',
                'invest','📈','Miss 80C: ₹4,500–₹45,000 tax lost');
            addEv([fy+1,1,28], '📈 ELSS — Final Warning (Feb 28)',
                'ELSS investments made in March often fail due to server overload. This is your last safe date to invest for this FY\'s 80C.',
                'invest','📈','Server failure risk → units not allotted in time');
            addEv([fy+1,2,28], '⚠️ ELSS Last Date — March 28 (risky)',
                'Technically March 31 is the deadline but MF servers crash. Only invest today if absolutely necessary. 3-year lock-in from allotment date.',
                'invest','⚠️','Units may not be allotted before Mar 31 due to server overload');
        }

        if (hasSGB) {
            // SGB windows typically open 4–6 times/year. Use approximate typical dates.
            addEv([fy,4,22],  '🥇 SGB Window — Check RBI Notification',
                'Sovereign Gold Bond subscription windows open periodically. Check RBI website for exact dates. SGB earns 2.5% p.a. interest + gold price appreciation. No making charges.',
                'invest','🥇','Miss window → wait 2–3 months for next');
            addEv([fy,7,19],  '🥇 SGB Window — Check RBI Notification',
                'Check RBI notification for Sovereign Gold Bond subscription. Lock in gold price today. 8-year tenure, premature exit after 5 years.',
                'invest','🥇','');
            addEv([fy,10,18], '🥇 SGB Window — Check RBI Notification',
                'SGB series typically available in Q3. Issue price set by RBI based on average gold price. ₹50/gram discount on digital payments.',
                'invest','🥇','');
            addEv([fy+1,1,16],'🥇 SGB Window — Check RBI Notification',
                'Q4 SGB series. Final opportunity this financial year. Check rbi.org.in for exact subscription dates.',
                'invest','🥇','');
        }

        // NPS — March 31 (always relevant for salaried)
        addEv([fy+1,2,31], '🏛️ NPS — 80CCD(1B) Contribution by March 31',
            'Additional ₹50,000 NPS deduction under 80CCD(1B) over and above 80C limit. Under old regime this saves ₹5,000–₹15,000 in tax.',
            'invest','🏛️', regime === 'old' ? '₹5,000–₹15,000 tax saving forfeited' : 'Check if applicable under your regime');

        // ── CREDIT CARD EVENTS ──────────────────────────────────────────
        var dueDayCC = ccDay + 20 > 28 ? (ccDay + 20 - 28) : ccDay + 20;
        // Add monthly for next 3 months
        for (var cm = 0; cm < 3; cm++) {
            var stmtMo = new Date(today.getFullYear(), today.getMonth() + cm, ccDay);
            var dueDate = new Date(today.getFullYear(), today.getMonth() + cm, dueDayCC);
            addEv([stmtMo.getFullYear(), stmtMo.getMonth(), ccDay],
                '💳 Credit Card Statement Generated',
                'Your statement is generated today. Log in and check for any fraudulent charges or billing errors. Dispute window: 30 days.',
                'credit','💳','');
            addEv([dueDate.getFullYear(), dueDate.getMonth(), dueDayCC],
                '🔴 Credit Card Payment Due',
                'Pay the FULL statement amount to avoid 36–42% p.a. interest. Even paying ₹1 short triggers interest on the entire balance. Set auto-pay today.',
                'credit','🔴','36–42% p.a. interest on entire balance if not paid in full');
        }

        // ── EPF EVENTS ──────────────────────────────────────────────────
        if (hasEPF) {
            addEv([fy,3,30],  '🏢 EPF — Update Nomination (April 30)',
                'Update/verify your EPF e-Nomination at epfindia.gov.in. Without active nomination, your family cannot claim EPF corpus easily.',
                'epf','🏢','Family faces 6–12 months of paperwork without nomination');
            addEv([fy,5,30],  '🏢 Check EPF Passbook — Annual Statement',
                'Download your EPF passbook from epfindia.gov.in. Verify employer contributions, interest credited, and any discrepancies. Raises must be reported within 2 years.',
                'epf','🏢','Undetected errors go unresolved after 2 years');
            addEv([fy,11,31], '🏢 EPF Interest Credited — Dec 31',
                'EPF interest (currently 8.25% p.a.) is credited by December 31 for the previous financial year. Check your passbook to confirm.',
                'epf','🏢','');
            addEv([fy+1,2,31],'🏢 EPF VPF — Last Date for FY Contribution',
                'Voluntary Provident Fund contributions above 12% are tax-deductible under 80C. Increase VPF via your employer before March 31.',
                'epf','🏢','');
        }

        // ── GENERAL COMPLIANCE ───────────────────────────────────────────
        addEv([fy+1,2,31], '📋 80C Investments — Final Date (March 31)',
            'Last date for all 80C investments (PPF, ELSS, LIC premium, NSC, tuition fees, home loan principal). Maximum deduction ₹1.5L under old regime.',
            'tax','📋', regime === 'old' ? 'Miss: ₹4,500–₹45,000 tax lost' : 'Not applicable under new regime');
        addEv([fy,8,30],   '📑 HRA Claim — Collect Rent Receipts',
            'If you claim HRA, collect rent receipts from your landlord for Apr–Sep. Keep rent agreement handy. Landlord PAN required if rent > ₹1L/year.',
            'tax','📑','');
        addEv([fy,11,31],  '📑 HRA Claim — Collect Rent Receipts (Oct–Mar)',
            'Collect rent receipts for Oct–Mar. Submit to employer before February to ensure TDS is adjusted.',
            'tax','📑','');
        addEv([fy+1,0,31], '📊 Investment Declarations to Employer (Jan 31)',
            'Submit final investment proof to your employer for TDS calculation. Include all 80C investments, HRA proofs, home loan certificate.',
            'tax','📊','Excess TDS deducted if not submitted; claim refund in ITR');
        addEv([fy,8,15],   '🔒 Free Annual Credit Report Check',
            'Check your free CIBIL report at cibil.com (1 free per year per bureau). Also check Experian, Equifax. Errors corrected = instant score boost.',
            'credit','🔒','');

        // Sort by date
        events.sort(function(a, b) { return a.date - b.date; });
        return events;
    }

    function _fcDaysFromNow(d) {
        var today = new Date(); today.setHours(0,0,0,0);
        var t = new Date(d); t.setHours(0,0,0,0);
        return Math.round((t - today) / 86400000);
    }

    function finCalRender() {
        var events  = _fcBuildEvents();
        var today   = new Date(); today.setHours(0,0,0,0);
        var filter  = _fcActiveFilter;

        // Count buckets
        var critical = 0, soon = 0, upcoming = 0;
        var nextEv   = null;
        events.forEach(function(ev) {
            var diff = _fcDaysFromNow(ev.date);
            if (diff < 0) return;
            if (diff <= 7)           critical++;
            else if (diff <= 30)     soon++;
            else if (diff <= 90)     upcoming++;
            if (!nextEv && diff >= 0) nextEv = ev;
        });
        document.getElementById('fc-count-critical').textContent = critical;
        document.getElementById('fc-count-soon').textContent     = soon;
        document.getElementById('fc-count-upcoming').textContent = upcoming;

        // Next banner
        if (nextEv) {
            var diff0 = _fcDaysFromNow(nextEv.date);
            document.getElementById('fc-next-icon').textContent  = nextEv.icon;
            document.getElementById('fc-next-title').textContent = nextEv.title;
            document.getElementById('fc-next-days').textContent  = diff0 === 0 ? 'TODAY' : diff0;
            var banEl = document.getElementById('fc-next-banner');
            if (diff0 <= 7)  banEl.style.background = 'linear-gradient(90deg,#7f1d1d,#991b1b)';
            else if (diff0 <= 30) banEl.style.background = 'linear-gradient(90deg,#78350f,#92400e)';
            else banEl.style.background = 'linear-gradient(90deg,#064e3b,#065f46)';
        }

        // Events list
        var catColors = { tax:'#ef4444', invest:'#f59e0b', credit:'#3b82f6', epf:'#8b5cf6', general:'#10b981' };
        var html = '';
        var shown = 0;
        events.forEach(function(ev) {
            if (filter !== 'all' && ev.cat !== filter) return;
            var diff = _fcDaysFromNow(ev.date);
            var urgBg, urgText, diffLabel;
            if (diff < 0)       { urgBg='#f8fafc'; urgText='#94a3b8'; diffLabel = Math.abs(diff) + 'd ago'; }
            else if (diff === 0){ urgBg='#fef2f2'; urgText='#b91c1c'; diffLabel = 'TODAY'; }
            else if (diff <= 7) { urgBg='#fef2f2'; urgText='#dc2626'; diffLabel = diff + 'd'; }
            else if (diff <= 30){ urgBg='#fffbeb'; urgText='#b45309'; diffLabel = diff + 'd'; }
            else                { urgBg='#f8fafc'; urgText='#475569'; diffLabel = diff + 'd'; }
            var dot = catColors[ev.cat] || '#10b981';
            var dateStr = ev.date.toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' });
            html += '<div class="flex items-start gap-2 rounded-xl px-2.5 py-2" style="background:' + urgBg + ';border:1px solid ' + (diff <= 7 && diff >= 0 ? '#fecaca' : '#e2e8f0') + ';">' +
                '<div class="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style="background:' + dot + ';"></div>' +
                '<div class="flex-1 min-w-0">' +
                '<div class="flex items-start justify-between gap-2">' +
                '<div class="text-[10px] font-black text-slate-800 leading-snug">' + ev.title + '</div>' +
                '<div class="text-[9px] font-black flex-shrink-0 px-1.5 py-0.5 rounded-md" style="color:' + urgText + ';background:' + urgBg + ';">' + diffLabel + '</div>' +
                '</div>' +
                '<div class="text-[9px] text-slate-500 mt-0.5">' + dateStr + ' · ' + ev.desc.slice(0,90) + (ev.desc.length > 90 ? '…' : '') + '</div>' +
                (ev.penalty ? '<div class="text-[8px] font-bold mt-0.5" style="color:#dc2626;">⚠️ ' + ev.penalty + '</div>' : '') +
                '</div></div>';
            shown++;
        });
        if (shown === 0) html = '<div class="text-[10px] text-slate-400 text-center py-4">No events for this filter.</div>';
        document.getElementById('fc-events-list').innerHTML = html;

        // Render calendar
        _fcRenderCalendar(events);
        if (typeof saveUserData === 'function') saveUserData();
    }

    function _fcRenderCalendar(events) {
        if (!_fcViewMonth) {
            var n = new Date();
            _fcViewMonth = new Date(n.getFullYear(), n.getMonth(), 1);
        }
        var yr = _fcViewMonth.getFullYear();
        var mo = _fcViewMonth.getMonth();
        var months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
        document.getElementById('fc-month-label').textContent = months[mo] + ' ' + yr;

        // Build a set: dateStr → [cats]
        var dayMap = {};
        events.forEach(function(ev) {
            if (ev.date.getFullYear() === yr && ev.date.getMonth() === mo) {
                var key = ev.date.getDate();
                if (!dayMap[key]) dayMap[key] = [];
                if (dayMap[key].indexOf(ev.cat) === -1) dayMap[key].push(ev.cat);
            }
        });

        var catColors = { tax:'#ef4444', invest:'#f59e0b', credit:'#3b82f6', epf:'#8b5cf6', general:'#10b981' };
        var firstDay = new Date(yr, mo, 1).getDay(); // 0=Sun
        // Convert to Mon=0
        var startOffset = (firstDay + 6) % 7;
        var daysInMonth = new Date(yr, mo + 1, 0).getDate();
        var today = new Date(); today.setHours(0,0,0,0);

        var html = '';
        // Empty cells before first day
        for (var i = 0; i < startOffset; i++) {
            html += '<div class="aspect-square"></div>';
        }
        for (var d = 1; d <= daysInMonth; d++) {
            var isToday = (today.getFullYear()===yr && today.getMonth()===mo && today.getDate()===d);
            var cats    = dayMap[d] || [];
            var hasDots = cats.length > 0;
            var dateObj = new Date(yr, mo, d);
            var isPast  = dateObj < today;
            var bg = isToday ? 'background:#1a5276;' : hasDots ? 'background:#f0f9ff;' : '';
            var border = isToday ? 'border:1.5px solid #f5c842;' : hasDots ? 'border:1px solid #bae6fd;' : 'border:1px solid transparent;';
            html += '<div class="aspect-square rounded-lg flex flex-col items-center justify-center p-0.5 cursor-default transition-all" style="' + bg + border + (isPast && !isToday ? 'opacity:0.45;' : '') + '">' +
                '<span class="text-[9px] font-bold ' + (isToday ? 'text-white' : 'text-slate-700') + '">' + d + '</span>' +
                (hasDots ? '<div class="flex gap-0.5 mt-0.5">' + cats.slice(0,3).map(function(c){ return '<div class="w-1 h-1 rounded-full" style="background:' + (catColors[c]||'#10b981') + ';"></div>'; }).join('') + '</div>' : '') +
                '</div>';
        }
        document.getElementById('fc-cal-grid').innerHTML = html;
    }

    function fcMonthNav(dir) {
        if (!_fcViewMonth) {
            var n = new Date();
            _fcViewMonth = new Date(n.getFullYear(), n.getMonth(), 1);
        }
        _fcViewMonth = new Date(_fcViewMonth.getFullYear(), _fcViewMonth.getMonth() + dir, 1);
        var events = _fcBuildEvents();
        _fcRenderCalendar(events);
    }

    function fcFilter(cat) {
        _fcActiveFilter = cat;
        // Update button styles
        ['all','tax','invest','credit','epf'].forEach(function(c) {
            var btn = document.getElementById('fc-btn-' + c);
            if (!btn) return;
            if (c === cat) {
                btn.className = 'fc-filter-btn fc-filter-active';
            } else {
                btn.className = 'fc-filter-btn';
            }
        });
        finCalRender();
    }

    // =====================================================================
    //  SELF-EMPLOYED & BUSINESS OWNER PLANNER
    // =====================================================================

    function seFmt(el) {
        var raw = el.value.replace(/[^0-9]/g,'');
        if (!raw) return;
        var n = parseInt(raw,10), s = n.toString();
        if (s.length <= 3) { el.value = s; el.classList.remove('text-slate-400'); return; }
        var last3 = s.slice(-3), rest = s.slice(0,-3);
        el.value = rest.replace(/\B(?=(\d{2})+(?!\d))/g,',') + ',' + last3;
        el.classList.remove('text-slate-400');
    }
    function _seComma(n) {
        var s = Math.round(n).toString();
        if (s.length <= 3) return s;
        return s.slice(0,-3).replace(/\B(?=(\d{2})+(?!\d))/g,',') + ',' + s.slice(-3);
    }
    function _seInr(n) {
        if (n >= 1e7) return '₹' + (n/1e7).toFixed(2) + ' Cr';
        if (n >= 1e5) return '₹' + (n/1e5).toFixed(2) + ' L';
        return '₹' + _seComma(Math.round(n));
    }
    function _seParse(id) {
        var el = document.getElementById(id);
        return el ? (parseFloat(el.value.replace(/[^0-9.]/g,'')) || 0) : 0;
    }
    // Indian income tax slab (New Regime FY25-26)
    function _seNewTax(income) {
        if (income <= 400000)  return 0;
        if (income <= 800000)  return (income - 400000) * 0.05;
        if (income <= 1200000) return 20000 + (income - 800000) * 0.10;
        if (income <= 1600000) return 60000 + (income - 1200000) * 0.15;
        if (income <= 2000000) return 120000 + (income - 1600000) * 0.20;
        if (income <= 2400000) return 200000 + (income - 2000000) * 0.25;
        return 300000 + (income - 2400000) * 0.30;
    }
    // Old regime (basic slab)
    function _seOldTax(income, deductions) {
        var taxable = Math.max(0, income - deductions);
        var tax = 0;
        if (taxable <= 250000)  tax = 0;
        else if (taxable <= 500000)  tax = (taxable - 250000) * 0.05;
        else if (taxable <= 1000000) tax = 12500 + (taxable - 500000) * 0.20;
        else tax = 112500 + (taxable - 1000000) * 0.30;
        // Surcharge
        if (taxable > 5000000 && taxable <= 10000000) tax *= 1.10;
        else if (taxable > 10000000) tax *= 1.15;
        return tax;
    }

    function seTab(tab) {
        ['tax','bef','gst','adv'].forEach(function(t) {
            var panel = document.getElementById('se-panel-' + t);
            var btn   = document.getElementById('se-tab-' + t);
            if (!panel || !btn) return;
            if (t === tab) { panel.classList.remove('hidden'); btn.className = 'se-tab-btn se-tab-active'; }
            else           { panel.classList.add('hidden');    btn.className = 'se-tab-btn se-tab-inactive'; }
        });
        if (tab === 'tax') seCalcTax();
        if (tab === 'bef') seCalcBEF();
        if (tab === 'gst') seCalcGST();
        if (tab === 'adv') seCalcAdv();
    }

    function seCalcTax() {
        var bizType  = document.getElementById('se-biz-type')?.value || '44AD_digital';
        var turnover = _seParse('se-turnover');
        var regime   = document.getElementById('se-tax-regime')?.value || 'new';
        var otherInc = _seParse('se-other-income');
        var c80      = Math.min(_seParse('se-80c'), 150000);
        var nps      = Math.min(_seParse('se-nps'), 50000);

        // Show/hide actual profit input
        var aprRow = document.getElementById('se-actual-profit-row');
        if (aprRow) aprRow.classList.toggle('hidden', bizType !== 'regular');
        var oldDedRow = document.getElementById('se-old-deductions');
        if (oldDedRow) oldDedRow.classList.toggle('hidden', regime !== 'old');

        // Compute presumptive profit
        var pctLabel = '';
        var profit = 0;
        if (bizType === '44AD_digital')  { profit = turnover * 0.06; pctLabel = '6% of turnover (44AD digital)'; }
        else if (bizType === '44AD_cash'){ profit = turnover * 0.08; pctLabel = '8% of turnover (44AD cash)'; }
        else if (bizType === '44ADA')    { profit = turnover * 0.50; pctLabel = '50% of receipts (44ADA)'; }
        else { profit = _seParse('se-actual-profit'); pctLabel = 'actual profit (regular books)'; }

        var totalIncome = profit + otherInc;

        // Compute tax
        var tax = 0, deductions = 0;
        if (regime === 'new') {
            tax = _seNewTax(totalIncome);
            // Rebate u/s 87A if income ≤ 12L (new regime)
            if (totalIncome <= 1200000) tax = 0;
        } else {
            deductions = 50000 + c80 + nps; // std deduction 50K for professionals
            tax = _seOldTax(totalIncome, deductions);
            if (totalIncome - deductions <= 500000) tax = 0; // 87A rebate
        }
        var cess = tax * 0.04;
        var totalTax = tax + cess;
        var effRate = turnover > 0 ? (totalTax / turnover * 100) : 0;

        document.getElementById('se-res-profit').textContent    = _seInr(profit);
        document.getElementById('se-res-profit-pct').textContent = pctLabel;
        document.getElementById('se-res-taxable').textContent   = _seInr(Math.max(0, regime === 'new' ? totalIncome : totalIncome - deductions));
        document.getElementById('se-res-tax').textContent       = _seInr(totalTax);
        document.getElementById('se-res-effrate').textContent   = effRate.toFixed(2) + '%';
        document.getElementById('se-res-monthly-setaside').textContent = _seInr(totalTax / 12) + '/mo';
        document.getElementById('se-res-advance-tax').textContent      = _seInr(totalTax / 4);

        // Workings
        var w = '';
        w += '• Gross turnover / receipts: ' + _seInr(turnover) + '<br>';
        w += '• Presumptive profit (' + pctLabel + '): ' + _seInr(profit) + '<br>';
        if (otherInc) w += '• Other income: ' + _seInr(otherInc) + '<br>';
        if (regime === 'old' && deductions) w += '• Deductions (std + 80C + NPS): ' + _seInr(deductions) + '<br>';
        w += '• Taxable income: ' + _seInr(Math.max(0, regime === 'new' ? totalIncome : totalIncome - deductions)) + '<br>';
        w += '• Income tax: ' + _seInr(tax) + '<br>';
        w += '• Health & Education Cess (4%): ' + _seInr(cess) + '<br>';
        w += '• <strong>Total tax + cess: ' + _seInr(totalTax) + '</strong>';
        document.getElementById('se-tax-workings').innerHTML = w;

        // Comparison table: presumptive vs regular (assume regular profit = 15% margin)
        var regProfit15 = turnover * 0.15;
        var regTax15 = regime === 'new' ? _seNewTax(regProfit15 + otherInc) * 1.04 : _seOldTax(regProfit15 + otherInc, deductions) * 1.04;
        var rows = [
            { label: bizType === '44ADA' ? '44ADA (50% deemed)' : '44AD (6%/8% deemed)', profit: profit, tax: totalTax },
            { label: 'Regular books (15% margin)', profit: regProfit15, tax: regTax15 },
            { label: 'Regular books (25% margin)', profit: turnover*0.25, tax: (regime==='new'?_seNewTax(turnover*0.25+otherInc)*1.04:_seOldTax(turnover*0.25+otherInc,deductions)*1.04) },
        ];
        var tbl = '<table class="w-full text-[10px]"><thead><tr class="text-left"><th class="pb-1 font-black text-slate-500">Method</th><th class="pb-1 font-black text-slate-500">Profit</th><th class="pb-1 font-black text-slate-500">Tax + Cess</th><th class="pb-1 font-black text-slate-500">Saving vs 44AD</th></tr></thead><tbody>';
        rows.forEach(function(r, idx) {
            var saving = rows[0].tax - r.tax;
            var isBase = idx === 0;
            tbl += '<tr style="border-bottom:1px solid #f1f5f9;' + (isBase?'background:#f0f9ff;':'') + '">' +
                '<td class="py-1.5 font-bold text-slate-700">' + r.label + (isBase?' ← current':'') + '</td>' +
                '<td class="py-1.5">' + _seInr(r.profit) + '</td>' +
                '<td class="py-1.5 font-bold ' + (r.tax <= rows[0].tax ? 'text-emerald-700' : 'text-red-600') + '">' + _seInr(r.tax) + '</td>' +
                '<td class="py-1.5 font-bold ' + (saving > 0 ? 'text-red-500' : saving < 0 ? 'text-emerald-600' : 'text-slate-400') + '">' +
                (isBase ? '—' : (saving > 0 ? '+' + _seInr(saving) + ' saved' : saving < 0 ? _seInr(-saving) + ' more tax' : '—')) + '</td></tr>';
        });
        tbl += '</tbody></table>';
        document.getElementById('se-comparison-table').innerHTML = tbl;

        // Auto-populate advance tax tab
        var advEl = document.getElementById('se-adv-tax');
        if (advEl && !advEl.dataset.userEdited) {
            advEl.value = _seComma(Math.round(totalTax));
            advEl.classList.remove('text-slate-400');
            seCalcAdv();
        }
        if (typeof saveUserData === 'function') saveUserData();
    }

    function seCalcBEF() {
        var sal  = _seParse('se-bef-salaries');
        var rent = _seParse('se-bef-rent');
        var tools= _seParse('se-bef-tools');
        var loans= _seParse('se-bef-loans');
        var util = _seParse('se-bef-utilities');
        var inv  = _seParse('se-bef-inventory');
        var pers = _seParse('se-bef-personal');
        var months = parseInt(document.getElementById('se-bef-months')?.value) || 6;
        var current= _seParse('se-bef-current');

        var bizBurn  = sal + rent + tools + loans + util + inv;
        var totalBurn= bizBurn + pers;
        var target   = totalBurn * months;
        var shortfall= Math.max(0, target - current);

        document.getElementById('se-bef-burn').textContent       = _seInr(totalBurn) + '/mo';
        document.getElementById('se-bef-target').textContent     = _seInr(target);
        document.getElementById('se-bef-target-sub').textContent = months + ' months of total burn';
        document.getElementById('se-bef-shortfall').textContent  = shortfall > 0 ? _seInr(shortfall) : '✅ Fully funded';
        document.getElementById('se-bef-sip-6').textContent      = shortfall > 0 ? _seInr(shortfall/6) + '/mo' : '—';
        document.getElementById('se-bef-sip-12').textContent     = shortfall > 0 ? _seInr(shortfall/12) + '/mo' : '—';

        // Breakdown bars
        var items = [
            { label:'Salaries',    val: sal,  color:'#ef4444' },
            { label:'Rent/Office', val: rent, color:'#f59e0b' },
            { label:'Tools/SaaS',  val: tools,color:'#3b82f6' },
            { label:'Loan EMIs',   val: loans,color:'#8b5cf6' },
            { label:'Utilities',   val: util, color:'#10b981' },
            { label:'Inventory',   val: inv,  color:'#f97316' },
            { label:'Personal',    val: pers, color:'#ec4899' },
        ].filter(function(x){ return x.val > 0; });
        var html = '';
        items.forEach(function(x) {
            var pct = totalBurn > 0 ? Math.round(x.val/totalBurn*100) : 0;
            html += '<div class="flex items-center gap-2">' +
                '<div class="text-[9px] text-slate-600 w-20 flex-shrink-0">' + x.label + '</div>' +
                '<div class="flex-1 h-2 rounded-full bg-slate-100"><div class="h-full rounded-full" style="width:' + pct + '%;background:' + x.color + ';"></div></div>' +
                '<div class="text-[9px] font-bold text-slate-700 w-16 text-right">' + _seInr(x.val) + ' (' + pct + '%)</div>' +
                '</div>';
        });
        document.getElementById('se-bef-breakdown').innerHTML = html || '<div class="text-[10px] text-slate-400">Enter costs above</div>';
    }

    function seCalcGST() {
        var type     = document.getElementById('se-gst-type')?.value || 'regular';
        var revenue  = _seParse('se-gst-revenue');
        var rateOut  = parseFloat(document.getElementById('se-gst-rate-out')?.value) || 18;
        var purchases= _seParse('se-gst-purchases');
        var rateIn   = parseFloat(document.getElementById('se-gst-rate-in')?.value) || 18;
        var delay    = parseInt(document.getElementById('se-gst-delay')?.value) || 45;

        var regInputs = document.getElementById('se-gst-regular-inputs');
        if (regInputs) regInputs.style.display = type === 'regular' ? '' : 'none';

        if (type !== 'regular') {
            document.getElementById('se-gst-out').textContent     = '—';
            document.getElementById('se-gst-itc').textContent     = '—';
            document.getElementById('se-gst-net').textContent     = '—';
            document.getElementById('se-gst-cashgap').textContent = '—';
            var insEl = document.getElementById('se-gst-insight');
            if (insEl) insEl.innerHTML = type === 'composition'
                ? '📋 <strong>Composition Scheme:</strong> Pay 1% (traders) / 2% (manufacturers) / 5% (restaurants) on turnover. Cannot collect GST from customers. Cannot claim ITC. Simpler compliance — ideal if turnover ₹40L–₹1.5Cr.'
                : '✅ You are unregistered. GST registration mandatory if turnover exceeds ₹40L (goods) or ₹20L (services) per year.';
            return;
        }

        var gstOut  = revenue * rateOut / 100;
        var itc     = purchases * rateIn / 100;
        var netGST  = Math.max(0, gstOut - itc);
        // Cash gap: GST collected but client hasn't paid yet
        var cashGap = gstOut * (delay / 30); // proportion of monthly GST tied up in delay

        document.getElementById('se-gst-out').textContent     = _seInr(gstOut);
        document.getElementById('se-gst-itc').textContent     = _seInr(itc);
        document.getElementById('se-gst-net').textContent     = _seInr(netGST);
        document.getElementById('se-gst-cashgap').textContent = _seInr(cashGap);

        var insEl = document.getElementById('se-gst-insight');
        if (insEl) {
            var msg = '📊 You collect <strong>' + _seInr(gstOut) + '</strong> GST monthly and can reclaim <strong>' + _seInr(itc) + '</strong> ITC. ' +
                'Net GST payable by 20th: <strong>' + _seInr(netGST) + '</strong>. ';
            if (delay > 30) msg += '⚠️ With clients paying after <strong>' + delay + ' days</strong>, you have ~<strong>' + _seInr(cashGap) + '</strong> in GST float — money you\'ve collected from clients but not yet received in your bank. Set aside net GST on the day you raise the invoice, not when client pays.';
            else msg += '✅ Your collection cycle (' + delay + ' days) is reasonable. Still, maintain a dedicated GST account to avoid mixing.';
            insEl.innerHTML = msg;
        }
    }

    function seCalcAdv() {
        var totalTax = _seParse('se-adv-tax');
        var today    = new Date();
        var fy       = today.getMonth() >= 3 ? today.getFullYear() : today.getFullYear() - 1;
        var instalments = [
            { date: new Date(fy,5,15),  pct: 15, label: '1st — June 15' },
            { date: new Date(fy,8,15),  pct: 45, label: '2nd — September 15' },
            { date: new Date(fy,11,15), pct: 75, label: '3rd — December 15' },
            { date: new Date(fy+1,2,15),pct: 100,label: '4th — March 15' },
        ];
        var html = '';
        var prevPct = 0;
        instalments.forEach(function(ins) {
            var amount   = totalTax * (ins.pct - prevPct) / 100;
            var diff     = Math.round((ins.date - today) / 86400000);
            var isPast   = diff < 0;
            var isNear   = diff >= 0 && diff <= 30;
            var bg       = isPast ? '#f8fafc' : isNear ? '#fef2f2' : '#f0f9ff';
            var border   = isPast ? '#e2e8f0' : isNear ? '#fecaca' : '#bae6fd';
            var badgeClr = isPast ? '#94a3b8' : isNear ? '#dc2626' : '#1a5276';
            var badge    = isPast ? 'Done / Past' : diff === 0 ? 'TODAY' : diff + ' days';
            html += '<div class="rounded-xl px-3 py-2 flex items-center justify-between gap-3" style="background:' + bg + ';border:1px solid ' + border + ';">' +
                '<div>' +
                '<div class="text-[10px] font-black text-slate-800">' + ins.label + ' <span class="text-[8px] font-bold text-slate-400">(cumulative ' + ins.pct + '%)</span></div>' +
                '<div class="text-[9px] text-slate-500">' + ins.date.toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'}) + ' — pay this instalment</div>' +
                '</div>' +
                '<div class="text-right flex-shrink-0">' +
                '<div class="text-base font-black text-slate-800">' + _seInr(amount) + '</div>' +
                '<div class="text-[9px] font-bold px-1.5 py-0.5 rounded-md" style="color:' + badgeClr + ';background:' + bg + ';">' + badge + '</div>' +
                '</div></div>';
            prevPct = ins.pct;
        });
        document.getElementById('se-adv-schedule').innerHTML = html;
    }

    function initSelfEmpl() {
        seTab('tax');
        seCalcTax();
        seCalcBEF();
        seCalcGST();
        seCalcAdv();
    }

    function resetSelfEmpl() {
        var defs = {
            'se-turnover':'25,00,000','se-actual-profit':'8,00,000','se-other-income':'0',
            'se-80c':'1,50,000','se-nps':'50,000',
            'se-bef-salaries':'80,000','se-bef-rent':'25,000','se-bef-tools':'10,000',
            'se-bef-loans':'15,000','se-bef-utilities':'5,000','se-bef-inventory':'0',
            'se-bef-personal':'60,000','se-bef-current':'0',
            'se-gst-revenue':'8,00,000','se-gst-purchases':'3,00,000','se-gst-delay':'45',
            'se-adv-tax':'1,80,000'
        };
        Object.keys(defs).forEach(function(id) {
            var el = document.getElementById(id);
            if (el) { el.value = defs[id]; el.classList.add('text-slate-400'); }
        });
        var selDefs = {'se-biz-type':'44AD_digital','se-tax-regime':'new','se-bef-months':'6','se-gst-type':'regular','se-gst-rate-out':'18','se-gst-rate-in':'18'};
        Object.keys(selDefs).forEach(function(id) {
            var el = document.getElementById(id);
            if (el) el.value = selDefs[id];
        });
        seTab('tax');
    }

    function sePreset(name) {
        var p = {
            freelancer: { type:'44ADA',      turnover:'30,00,000', regime:'new' },
            doctor:     { type:'44ADA',      turnover:'60,00,000', regime:'new' },
            trader:     { type:'44AD_cash',  turnover:'80,00,000', regime:'new' },
            msme:       { type:'44AD_digital',turnover:'1,50,00,000',regime:'new' },
        };
        var d = p[name]; if (!d) return;
        var bizEl = document.getElementById('se-biz-type'); if (bizEl) bizEl.value = d.type;
        var turnEl = document.getElementById('se-turnover'); if (turnEl) { turnEl.value = d.turnover; turnEl.classList.remove('text-slate-400'); }
        var regEl = document.getElementById('se-tax-regime'); if (regEl) regEl.value = d.regime;
        seCalcTax();
    }

    // =====================================================================
    //  GOLD INVESTMENT COMPARATOR
    // =====================================================================

    function gcFmt(el) {
        var raw = el.value.replace(/[^0-9]/g, '');
        if (!raw) return;
        var n = parseInt(raw, 10), s = n.toString();
        if (s.length <= 3) { el.value = s; el.classList.remove('text-slate-400'); return; }
        var last3 = s.slice(-3), rest = s.slice(0, -3);
        el.value = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + last3;
        el.classList.remove('text-slate-400');
    }
    function _gcComma(n) {
        if (isNaN(n) || n < 0) return '0';
        var s = Math.round(n).toString();
        if (s.length <= 3) return s;
        return s.slice(0,-3).replace(/\B(?=(\d{2})+(?!\d))/g,',') + ',' + s.slice(-3);
    }
    function _gcInr(n) {
        if (n >= 1e7) return '₹' + (n/1e7).toFixed(2) + ' Cr';
        if (n >= 1e5) return '₹' + (n/1e5).toFixed(2) + ' L';
        return '₹' + _gcComma(Math.round(n));
    }
    function _gcParse(id) {
        var el = document.getElementById(id);
        return el ? (parseFloat(el.value.replace(/[^0-9.]/g,'')) || 0) : 0;
    }

    function goldCalc() {
        var amount   = _gcParse('gc-amount') || 100000;
        var years    = parseInt(document.getElementById('gc-years')?.value) || 5;
        var retPct   = parseFloat(document.getElementById('gc-return')?.value) || 10;
        var slab     = parseFloat(document.getElementById('gc-slab')?.value) || 20;
        var making   = parseFloat(document.getElementById('gc-making')?.value) || 12;
        var lockerYr = _gcParse('gc-locker') || 2000;
        var ret      = retPct / 100;

        // ── GOLD ETF ───────────────────────────────────────────────────
        // Entry cost: ~0 (brokerage ≈ 0.01-0.05%, negligible; treat as 0)
        var etfExpenseRatio = 0.005; // 0.50% p.a.
        var etfEffReturn    = ret - etfExpenseRatio;
        var etfFV           = amount * Math.pow(1 + etfEffReturn, years);
        var etfGain         = etfFV - amount;
        var etfTax          = years >= 1 ? etfGain * 0.125 : etfGain * (slab / 100);
        var etfNet          = etfFV - etfTax;
        var etfEffRet       = Math.pow(etfNet / amount, 1/years) - 1;

        // ── GOLD MF / FoF ──────────────────────────────────────────────
        // Expense ratio ~0.15% (lower than ETF as direct plan, but double-layer)
        var mfExpenseRatio  = 0.0040; // ~0.40% total (ETF expense + FoF layer)
        var mfEffReturn     = ret - mfExpenseRatio;
        var mfFV            = amount * Math.pow(1 + mfEffReturn, years);
        var mfGain          = mfFV - amount;
        // Gold MF: slab rate regardless of holding period (since Finance Act 2023)
        var mfTax           = mfGain * (slab / 100);
        var mfNet           = mfFV - mfTax;
        var mfEffRet        = Math.pow(mfNet / amount, 1/years) - 1;

        // ── PHYSICAL GOLD ──────────────────────────────────────────────
        // 3% GST + making charges (on original amount)
        var gstAmt     = amount * 0.03;
        var makingAmt  = amount * (making / 100);
        var totalLockerCost = lockerYr * years;
        // Effective gold units purchased = amount net of GST and making
        var physEffective   = amount - gstAmt - makingAmt;
        // Gold grows on the units purchased
        var physFV          = physEffective * Math.pow(1 + ret, years);
        // Physical gold LTCG after 2yr = 20% with indexation benefit
        // Simplified indexation: assume ~5% inflation → indexed cost
        var indexedCost     = years >= 2 ? physEffective * Math.pow(1.05, years) : physEffective;
        var physGainTaxable = Math.max(0, physFV - indexedCost);
        var physTax         = years >= 2 ? physGainTaxable * 0.20 : Math.max(0, physFV - physEffective) * (slab / 100);
        var physNet         = physFV - physTax - totalLockerCost;
        var physEffRet      = amount > 0 ? Math.pow(physNet / amount, 1/years) - 1 : 0;

        // ── UPDATE CARDS ──────────────────────────────────────────────
        var sEl = function(id, val) { var e = document.getElementById(id); if(e) e.textContent = val; };

        sEl('gc-etf-entry',   '~₹0 (brokerage only)');
        sEl('gc-etf-netval',  _gcInr(etfNet));
        sEl('gc-etf-gain',    'Gain: ' + _gcInr(etfGain) + ' → Tax: ' + _gcInr(etfTax));
        sEl('gc-etf-effret',  (etfEffRet * 100).toFixed(2) + '% p.a. post-tax');

        sEl('gc-mf-entry',   '~₹0 (no demat fees)');
        sEl('gc-mf-netval',  _gcInr(mfNet));
        sEl('gc-mf-gain',    'Gain: ' + _gcInr(mfGain) + ' → Tax: ' + _gcInr(mfTax));
        sEl('gc-mf-effret',  (mfEffRet * 100).toFixed(2) + '% p.a. post-tax');

        sEl('gc-phys-entry',  '₹' + _gcComma(Math.round(gstAmt)) + ' GST upfront');
        sEl('gc-phys-making', _gcInr(makingAmt) + ' (' + making + '%)');
        sEl('gc-phys-locker', _gcInr(lockerYr) + '/yr = ' + _gcInr(totalLockerCost) + ' total');
        sEl('gc-phys-netval', _gcInr(physNet));
        sEl('gc-phys-gain',   'Net after all costs: ' + _gcInr(physNet));
        sEl('gc-phys-effret', (physEffRet * 100).toFixed(2) + '% p.a. post-tax');

        // ── COST DRAG ─────────────────────────────────────────────────
        sEl('gc-cd-gst',     _gcInr(gstAmt) + ' (3%)');
        sEl('gc-cd-making',  _gcInr(makingAmt) + ' (' + making + '%)');
        sEl('gc-cd-locker',  _gcInr(totalLockerCost) + ' over ' + years + 'yr');
        sEl('gc-cd-tax',     _gcInr(physTax));
        sEl('gc-cd-total',   _gcInr(gstAmt + makingAmt + totalLockerCost + physTax));

        // ── WINNER ────────────────────────────────────────────────────
        var nets = [
            { name: 'Gold ETF',    net: etfNet,  eff: etfEffRet,  key: 'etf' },
            { name: 'Gold MF/FoF', net: mfNet,   eff: mfEffRet,   key: 'mf'  },
            { name: 'Physical Gold', net: physNet,eff: physEffRet, key: 'phys'},
        ];
        nets.sort(function(a,b){ return b.net - a.net; });
        var winner = nets[0];
        var worst  = nets[2];
        sEl('gc-winner-name', winner.name);
        sEl('gc-winner-years', years);
        sEl('gc-winner-vs-phys', _gcInr(Math.max(0, winner.net - physNet)));
        sEl('gc-winner-annualised', (winner.eff * 100).toFixed(2) + '% p.a. net');

        var reasonMap = {
            etf:  'Gold ETFs win for demat holders. 12.5% LTCG tax (after 1yr) beats slab-rate Gold MF for 20–30% taxpayers, and zero GST/making charges beats Physical Gold by a wide margin.',
            mf:   'Gold MF/FoF is best if you don\'t have a demat account. No entry cost, SIP from ₹500/mo. Slab-rate tax is a disadvantage vs ETF for high earners, but beats the GST+making drag of physical gold.',
            phys: 'Physical gold wins only in this scenario due to your low making charge assumption. In real life, jewellery making charges of 8–25% mean physical gold almost never wins financially — only emotionally.'
        };
        sEl('gc-winner-reason', reasonMap[winner.key] || '');

        // ── BREAKEVEN ─────────────────────────────────────────────────
        var breakevenEl = document.getElementById('gc-breakeven');
        if (breakevenEl) {
            // Find year where physNet > etfNet
            var breakevenYr = null;
            for (var y = 1; y <= 30; y++) {
                var eN = amount * Math.pow(1 + etfEffReturn, y) - (amount * Math.pow(1 + etfEffReturn, y) - amount) * (y >= 1 ? 0.125 : slab/100);
                var pEff = amount - gstAmt - makingAmt;
                var pFV  = pEff * Math.pow(1 + ret, y);
                var pIdx  = y >= 2 ? pEff * Math.pow(1.05, y) : pEff;
                var pTax  = y >= 2 ? Math.max(0,pFV-pIdx)*0.20 : Math.max(0,pFV-pEff)*(slab/100);
                var pN   = pFV - pTax - (lockerYr * y);
                if (pN > eN && breakevenYr === null) { breakevenYr = y; }
            }
            if (breakevenYr) {
                breakevenEl.innerHTML = '📅 Physical gold overtakes Gold ETF only after <strong>' + breakevenYr + ' years</strong> of holding — and only if the making charge is very low (coins/bars). Jewellery with high making charges may <strong>never break even</strong> vs Gold ETF.';
            } else {
                breakevenEl.innerHTML = '❌ <strong>Physical gold does not break even vs Gold ETF within 30 years</strong> at your current making charge (' + making + '%). The upfront cost drag from GST + making charges is too large to recover, especially with slab-rate taxation.';
            }
        }

        if (typeof saveUserData === 'function') saveUserData();
    }

    function initGoldComp() { goldCalc(); }

    function resetGoldComp() {
        var defs = {
            'gc-amount':'1,00,000','gc-years':'5','gc-return':'10','gc-making':'12','gc-locker':'2,000'
        };
        Object.keys(defs).forEach(function(id) {
            var el = document.getElementById(id);
            if (el) { el.value = defs[id]; el.classList.add('text-slate-400'); }
        });
        document.getElementById('gc-slab').value = '20';
        goldCalc();
    }

    function gcPreset(name) {
        var p = {
            sip:      { amount: '5,000',    years: '10', ret: '10', making: '5',  locker: '0' },
            lumpsum:  { amount: '1,00,000', years: '5',  ret: '10', making: '12', locker: '2,000' },
            wedding:  { amount: '5,00,000', years: '3',  ret: '10', making: '18', locker: '3,000' },
            longterm: { amount: '2,00,000', years: '10', ret: '11', making: '5',  locker: '2,000' }
        };
        var d = p[name]; if (!d) return;
        var map = { 'gc-amount': d.amount, 'gc-years': d.years, 'gc-return': d.ret, 'gc-making': d.making, 'gc-locker': d.locker };
        Object.keys(map).forEach(function(id) {
            var el = document.getElementById(id);
            if (el) { el.value = map[id]; el.classList.remove('text-slate-400'); }
        });
        goldCalc();
    }

    function initFinCal() {
        _fcViewMonth = null;
        finCalRender();
    }

    function resetFinCal() {
        var el;
        el = document.getElementById('fc-regime');    if (el) el.value = 'new';
        el = document.getElementById('fc-ppf');       if (el) el.value = 'yes';
        el = document.getElementById('fc-elss');      if (el) el.value = 'yes';
        el = document.getElementById('fc-sgb');       if (el) el.value = 'yes';
        el = document.getElementById('fc-epf');       if (el) el.value = 'yes';
        el = document.getElementById('fc-cc-date');   if (el) { el.value = '5'; el.classList.add('text-slate-400'); }
        el = document.getElementById('fc-income');    if (el) { el.value = '12,00,000'; el.classList.add('text-slate-400'); }
        _fcActiveFilter = 'all';
        _fcViewMonth    = null;
        finCalRender();
    }

    function resetCibil() {
        var defaults = { 'cibil-score': '720', 'cibil-util': '35', 'cibil-missed': '0', 'cibil-age': '4', 'cibil-cards': '2', 'cibil-enquiries': '1', 'cibil-loan-amt': '50,00,000', 'cibil-loan-tenure': '20' };
        Object.keys(defaults).forEach(function(id) {
            var el = document.getElementById(id);
            if (el) { el.value = defaults[id]; el.classList.add('text-slate-400'); }
        });
        cibilCalc();
    }

    function cibilPreset(name) {
        var p = {
            poor:  { score: '580', util: '78', missed: '3', age: '1', cards: '1', enq: '5', loan: '30,00,000', tenure: '20' },
            fair:  { score: '650', util: '48', missed: '1', age: '3', cards: '2', enq: '2', loan: '40,00,000', tenure: '20' },
            good:  { score: '720', util: '32', missed: '0', age: '5', cards: '2', enq: '1', loan: '50,00,000', tenure: '20' },
            great: { score: '780', util: '12', missed: '0', age: '8', cards: '3', enq: '0', loan: '75,00,000', tenure: '20' },
        };
        var d = p[name]; if (!d) return;
        var map = { 'cibil-score': d.score, 'cibil-util': d.util, 'cibil-missed': d.missed, 'cibil-age': d.age, 'cibil-cards': d.cards, 'cibil-enquiries': d.enq, 'cibil-loan-amt': d.loan, 'cibil-loan-tenure': d.tenure };
        Object.keys(map).forEach(function(id) {
            var el = document.getElementById(id);
            if (el) { el.value = map[id]; el.classList.remove('text-slate-400'); }
        });
        cibilCalc();
    }

    function resetDebtPlan() {
        _debtLoans = [];
        _debtLoanId = 0;
        var c = document.getElementById('debt-loans-container');
        if (c) c.innerHTML = '';
        var ex = document.getElementById('debt-extra');
        if (ex) { ex.value = '5,000'; ex.classList.add('text-slate-400'); }
        debtScenario('typical');
        if (typeof saveUserData === 'function') saveUserData();
    }

    function debtScenario(name) {
        _debtLoans = [];
        _debtLoanId = 0;
        var c = document.getElementById('debt-loans-container');
        if (c) c.innerHTML = '';
        var ex = document.getElementById('debt-extra');

        if (name === 'typical') {
            if (ex) { ex.value = '5,000'; ex.classList.add('text-slate-400'); }
            debtAddLoan('Home Loan',     '35,00,000', '8.5',  '31,500');
            debtAddLoan('Car Loan',      '5,00,000',  '10',   '10,600');
            debtAddLoan('Personal Loan', '2,00,000',  '14',   '7,000');
        } else if (name === 'heavy') {
            if (ex) { ex.value = '10,000'; ex.classList.add('text-slate-400'); }
            debtAddLoan('Home Loan',     '50,00,000', '8.75', '44,000');
            debtAddLoan('Car Loan',      '7,00,000',  '10',   '14,800');
            debtAddLoan('Personal Loan', '4,00,000',  '16',   '16,000');
            debtAddLoan('Credit Card',   '80,000',    '36',   '4,000');
        } else if (name === 'cc') {
            if (ex) { ex.value = '15,000'; ex.classList.add('text-slate-400'); }
            debtAddLoan('Credit Card 1', '1,20,000', '36', '6,000');
            debtAddLoan('Credit Card 2', '60,000',   '42', '3,000');
            debtAddLoan('Personal Loan', '2,00,000', '18', '8,000');
        } else if (name === 'homeloan') {
            if (ex) { ex.value = '20,000'; ex.classList.add('text-slate-400'); }
            debtAddLoan('Home Loan', '40,00,000', '8.5', '35,500');
            debtAddLoan('Car Loan',  '6,00,000',  '10',  '12,700');
        }
    }

    function debtAddLoan(name, balance, rate, emi) {
        var id = ++_debtLoanId;
        _debtLoans.push({ id: id, name: name || '', balance: balance || '', rate: rate || '', emi: emi || '' });
        debtRenderLoans();
        debtCalc();
        if (typeof saveUserData === 'function') saveUserData();
    }

    function debtRemoveLoan(id) {
        _debtLoans = _debtLoans.filter(function(l) { return l.id !== id; });
        debtRenderLoans();
        debtCalc();
        if (typeof saveUserData === 'function') saveUserData();
    }

    function debtUpdateLoan(id, field, val) {
        var loan = _debtLoans.find(function(l) { return l.id === id; });
        if (loan) { loan[field] = val; }
        debtCalc();
        if (typeof saveUserData === 'function') saveUserData();
    }

    function debtRenderLoans() {
        var c = document.getElementById('debt-loans-container');
        if (!c) return;

        var typeColors = { 'home':'#dbeafe','car':'#dcfce7','personal':'#fef3c7','credit':'#fee2e2','education':'#f3e8ff' };

        c.innerHTML = _debtLoans.map(function(l) {
            var color = '#f8fafc';
            var lname = (l.name || '').toLowerCase();
            Object.keys(typeColors).forEach(function(k){ if(lname.indexOf(k)>=0) color=typeColors[k]; });

            // Ensure balance and EMI are formatted with Indian commas
            var rawBal = (l.balance || '').replace(/,/g,'');
            var rawEmi = (l.emi || '').replace(/,/g,'');
            var balFmt = rawBal ? Number(rawBal).toLocaleString('en-IN') : '';
            var emiFmt = rawEmi ? Number(rawEmi).toLocaleString('en-IN') : '';
            var rate   = l.rate || '';

            // Compact single-row: [Name] [₹Balance] [Rate%] [₹EMI] [✕]
            return '<div class="debt-loan-row" style="background:' + color + ';border-radius:8px;padding:5px 7px;">' +
                '<div class="flex items-center gap-1" style="min-width:0;">' +

                // Name — no grey (it's real text); no debtRenderLoans on oninput to avoid focus loss
                '<input class="debt-loan-input" style="flex:1;min-width:0;" value="' + (l.name||'') + '" placeholder="Loan name" ' +
                'oninput="debtUpdateLoan(' + l.id + ',\'name\',this.value);debtCalc();">' +

                // Balance
                '<div class="relative flex-shrink-0" style="width:90px;">' +
                '<span style="position:absolute;left:6px;top:50%;transform:translateY(-50%);font-size:10px;color:#94a3b8;font-weight:700;pointer-events:none;z-index:1;">₹</span>' +
                '<input class="debt-loan-input pl-4 text-slate-400" style="width:100%;" value="' + balFmt + '" placeholder="Balance" inputmode="numeric" ' +
                'onfocus="if(this.classList.contains(\'text-slate-400\')){this.value=\'\';this.classList.remove(\'text-slate-400\');}" ' +
                'onblur="if(!this.value){this.value=\'' + balFmt + '\';this.classList.add(\'text-slate-400\');}else{this.classList.remove(\'text-slate-400\');}" ' +
                'oninput="var r=this.value.replace(/[^0-9]/g,\'\');this.value=r?Number(r).toLocaleString(\'en-IN\'):\'\';this.classList.remove(\'text-slate-400\');debtUpdateLoan(' + l.id + ',\'balance\',this.value);">' +
                '</div>' +

                // Rate
                '<input class="debt-loan-input text-slate-400" style="width:46px;flex-shrink:0;text-align:center;" value="' + rate + '" placeholder="%" type="number" step="0.1" min="0" max="100" ' +
                'onfocus="if(this.classList.contains(\'text-slate-400\')){this.select();this.classList.remove(\'text-slate-400\');}" ' +
                'onblur="if(!this.value){this.classList.add(\'text-slate-400\');}else{this.classList.remove(\'text-slate-400\');}" ' +
                'oninput="this.classList.remove(\'text-slate-400\');debtUpdateLoan(' + l.id + ',\'rate\',this.value);">' +

                // EMI
                '<div class="relative flex-shrink-0" style="width:90px;">' +
                '<span style="position:absolute;left:6px;top:50%;transform:translateY(-50%);font-size:10px;color:#94a3b8;font-weight:700;pointer-events:none;z-index:1;">₹</span>' +
                '<input class="debt-loan-input pl-4 text-slate-400" style="width:100%;" value="' + emiFmt + '" placeholder="EMI/mo" inputmode="numeric" ' +
                'onfocus="if(this.classList.contains(\'text-slate-400\')){this.value=\'\';this.classList.remove(\'text-slate-400\');}" ' +
                'onblur="if(!this.value){this.value=\'' + emiFmt + '\';this.classList.add(\'text-slate-400\');}else{this.classList.remove(\'text-slate-400\');}" ' +
                'oninput="var r=this.value.replace(/[^0-9]/g,\'\');this.value=r?Number(r).toLocaleString(\'en-IN\'):\'\';this.classList.remove(\'text-slate-400\');debtUpdateLoan(' + l.id + ',\'emi\',this.value);">' +
                '</div>' +

                // Remove
                '<button onclick="debtRemoveLoan(' + l.id + ')" class="flex-shrink-0 text-red-400 hover:text-red-600 font-black text-sm leading-none px-0.5" title="Remove">✕</button>' +
                '</div>' +
                '</div>';
        }).join('');
    }

    function debtTab(method) {
        _debtMethod = method;
        var tabAv = document.getElementById('debt-tab-avalanche');
        var tabSn = document.getElementById('debt-tab-snowball');
        if (method === 'avalanche') {
            if (tabAv) { tabAv.style.background='#fef2f2'; tabAv.style.color='#991b1b'; tabAv.style.border='2px solid #fca5a5'; }
            if (tabSn) { tabSn.style.background='#f8fafc'; tabSn.style.color='#64748b'; tabSn.style.border='2px solid #e2e8f0'; }
        } else {
            if (tabSn) { tabSn.style.background='#eff6ff'; tabSn.style.color='#1e3a5f'; tabSn.style.border='2px solid #93c5fd'; }
            if (tabAv) { tabAv.style.background='#f8fafc'; tabAv.style.color='#64748b'; tabAv.style.border='2px solid #e2e8f0'; }
        }
        debtCalc();
    }

    function debtCalc() {
        if (_debtLoans.length === 0) return;

        var extraMonthly = debtNum(document.getElementById('debt-extra')?.value);

        // Build loan objects
        var loans = _debtLoans.map(function(l) {
            return {
                id:      l.id,
                name:    l.name || 'Loan',
                balance: debtNum(l.balance),
                rate:    parseFloat(l.rate) || 0,
                emi:     debtNum(l.emi)
            };
        }).filter(function(l) { return l.balance > 0 && l.rate > 0; });

        if (loans.length === 0) return;

        // Sort for priority display
        var sorted;
        if (_debtMethod === 'avalanche') {
            sorted = loans.slice().sort(function(a, b) { return b.rate - a.rate; });
        } else {
            sorted = loans.slice().sort(function(a, b) { return a.balance - b.balance; });
        }

        // Total debt
        var totalBal = loans.reduce(function(s, l) { return s + l.balance; }, 0);
        var totalEmi = loans.reduce(function(s, l) { return s + l.emi; }, 0);

        // Simulate payoff WITH extra prepayment
        function simulate(loanList, extra) {
            var ls = loanList.map(function(l) {
                return { name: l.name, bal: l.balance, rate: l.rate / 100 / 12, minEmi: l.emi || Math.round(l.balance * (l.rate/100/12) / (1 - Math.pow(1+l.rate/100/12, -120))) };
            });
            var months = 0, totalInt = 0;
            var MAX = 600;
            while (ls.some(function(l) { return l.bal > 0; }) && months < MAX) {
                months++;
                var leftover = extra;
                // Pay interest + minimum on all
                ls.forEach(function(l) {
                    if (l.bal <= 0) return;
                    var int = l.bal * l.rate;
                    totalInt += int;
                    var prin = Math.min(l.bal, l.minEmi - int);
                    l.bal = Math.max(0, l.bal - prin);
                });
                // Apply leftover to target (first in priority order)
                var target = ls.find(function(l) { return l.bal > 0; });
                if (target && leftover > 0) {
                    target.bal = Math.max(0, target.bal - leftover);
                }
            }
            return { months: months, interest: Math.round(totalInt) };
        }

        // Simulate without extra to get baseline
        function simulateNoExtra(loanList) {
            var ls = loanList.map(function(l) {
                return { bal: l.balance, rate: l.rate / 100 / 12, minEmi: l.emi || Math.round(l.balance * (l.rate/100/12) / (1 - Math.pow(1+l.rate/100/12, -120))) };
            });
            var months = 0, totalInt = 0, MAX = 600;
            while (ls.some(function(l) { return l.bal > 0; }) && months < MAX) {
                months++;
                ls.forEach(function(l) {
                    if (l.bal <= 0) return;
                    var int = l.bal * l.rate;
                    totalInt += int;
                    l.bal = Math.max(0, l.bal - Math.min(l.bal, l.minEmi - int));
                });
            }
            return { months: months, interest: Math.round(totalInt) };
        }

        var withExtra  = simulate(sorted, extraMonthly);
        var withoutExtra = simulateNoExtra(loans);
        var interestSaved = Math.max(0, withoutExtra.interest - withExtra.interest);

        // DOM updates
        document.getElementById('debt-total-bal').textContent       = debtFmt(totalBal);
        document.getElementById('debt-interest-saved').textContent  = debtFmt(interestSaved);
        var mo = withExtra.months;
        document.getElementById('debt-payoff-months').textContent   =
            mo >= 12 ? Math.floor(mo/12) + 'y ' + (mo%12) + 'm' : mo + ' mo';

        // Priority list
        var colors = ['#dc2626','#ea580c','#d97706','#16a34a','#0891b2','#7c3aed','#db2777'];
        var icons  = { 'avalanche': '🔥 Pay off first (highest rate)', 'snowball': '❄️ Pay off first (smallest balance)' };
        var pLabel = document.getElementById('debt-priority-label');
        if (pLabel) pLabel.textContent = _debtMethod === 'avalanche' ? '🎯 Avalanche Order (Highest Rate First)' : '🎯 Snowball Order (Smallest Balance First)';

        var list = document.getElementById('debt-priority-list');
        if (list) {
            list.innerHTML = sorted.map(function(l, i) {
                var color = colors[i % colors.length];
                var badge = i === 0 ? ' 🎯 Attack Now' : i === 1 ? ' ⏭ Next' : '';
                return '<div class="flex items-center gap-2 rounded-lg px-2.5 py-2" style="background:#f8fafc;border:1px solid #e2e8f0;">' +
                    '<div class="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black text-white flex-shrink-0" style="background:' + color + ';">' + (i+1) + '</div>' +
                    '<div class="flex-1 min-w-0">' +
                    '<div class="text-[10px] font-black text-slate-700">' + l.name + badge + '</div>' +
                    '<div class="text-[9px] text-slate-400">' + debtFmt(l.balance) + ' @ ' + l.rate + '% · EMI ' + debtFmt(l.emi) + '/mo</div>' +
                    '</div>' +
                    '<div class="text-[10px] font-black flex-shrink-0" style="color:' + color + ';">' + l.rate.toFixed(1) + '%</div>' +
                    '</div>';
            }).join('');
        }

        // Insight
        var ins = document.getElementById('debt-insight');
        if (ins) {
            ins.classList.remove('hidden');
            var topLoan = sorted[0];
            var monthsSaved = withoutExtra.months - withExtra.months;
            ins.innerHTML = '<strong>💡 Strategy:</strong> ' +
                (_debtMethod === 'avalanche'
                    ? 'Attack <strong>' + topLoan.name + '</strong> (' + topLoan.rate + '%) first — it costs you the most in interest.'
                    : 'Clear <strong>' + topLoan.name + '</strong> (' + debtFmt(topLoan.balance) + ') first — quick win builds momentum.') +
                ' With ₹' + Number(extraMonthly).toLocaleString('en-IN') + '/mo extra, you save <strong>' + debtFmt(interestSaved) + ' in interest</strong>' +
                (monthsSaved > 0 ? ' and become debt-free <strong>' + (monthsSaved >= 12 ? Math.floor(monthsSaved/12) + ' yr ' + (monthsSaved%12) + ' mo' : monthsSaved + ' months') + ' sooner</strong>.' : '.');
        }

        if (typeof saveUserData === 'function') saveUserData();
    }

    /* ══════════════════════════════════════════════════════════
       WHATSAPP SHARE
    ══════════════════════════════════════════════════════════ */
    var _waUrl = 'https://aishwaryamasthu-66c6f.web.app';

    function _waFmt(el) {
        return el ? (el.textContent || el.innerText || '').trim() : '—';
    }

    /* ══════════════════════════════════════════════════════════
       PPF & NPS CALCULATOR
    ══════════════════════════════════════════════════════════ */
    var _ppfNpsTab = 'ppf';

    function ppfFormat(el) {
        var raw = (el.value || '').replace(/[^0-9]/g, '');
        el.value = raw ? Number(raw).toLocaleString('en-IN') : '';
    }

    function ppfNum(id) {
        return parseFloat((document.getElementById(id)?.value || '').replace(/,/g, '')) || 0;
    }

    function ppfFmt(n) {
        if (!n && n !== 0) return '—';
        var abs = Math.abs(n); var sign = n < 0 ? '-' : '';
        if (abs >= 1e7) return sign + '₹' + (abs/1e7).toFixed(2) + ' Cr';
        if (abs >= 1e5) return sign + '₹' + (abs/1e5).toFixed(2) + ' L';
        return sign + '₹' + Math.round(abs).toLocaleString('en-IN');
    }

    function initPPFNPS() {
        ppfCalc();
        npsCalc();
    }

    function resetPPFNPS() {
        // PPF defaults
        var ppfDefs = {'ppf-annual':'1,50,000','ppf-balance':'0','ppf-years-done':'0','ppf-rate':'7.1','ppf-extend':'0'};
        Object.entries(ppfDefs).forEach(function([id, val]) {
            var el = document.getElementById(id); if (!el) return;
            el.value = val; el.classList.add('text-slate-400');
        });
        // NPS defaults
        var npsDefs = {'nps-monthly':'5,000','nps-age':'30','nps-balance':'0','nps-return':'10','nps-annuity-rate':'6','nps-slab':'20'};
        Object.entries(npsDefs).forEach(function([id, val]) {
            var el = document.getElementById(id); if (!el) return;
            el.value = val; el.classList.add('text-slate-400');
        });
        ppfnpsTab('ppf');
        ppfCalc(); npsCalc();
        if (typeof saveUserData === 'function') saveUserData();
    }

    function ppfnpsTab(tab) {
        _ppfNpsTab = tab;
        var ppfS  = document.getElementById('ppf-section');
        var npsS  = document.getElementById('nps-section');
        var ppfR  = document.getElementById('ppf-rules-section');
        var npsR  = document.getElementById('nps-rules-section');
        var ppfT  = document.getElementById('ppf-table-section');
        var tabPPF = document.getElementById('ppfnps-tab-ppf');
        var tabNPS = document.getElementById('ppfnps-tab-nps');
        if (!ppfS) return;
        if (tab === 'ppf') {
            ppfS.classList.remove('hidden'); if (ppfR) ppfR.classList.remove('hidden'); if (ppfT) ppfT.classList.remove('hidden');
            if (npsS) npsS.classList.add('hidden'); if (npsR) npsR.classList.add('hidden');
            if (tabPPF) { tabPPF.style.background='#f0fdf4'; tabPPF.style.color='#166534'; tabPPF.style.border='2px solid #86efac'; }
            if (tabNPS) { tabNPS.style.background='#f8fafc'; tabNPS.style.color='#64748b'; tabNPS.style.border='2px solid #e2e8f0'; }
        } else {
            if (npsS) npsS.classList.remove('hidden'); if (npsR) npsR.classList.remove('hidden');
            ppfS.classList.add('hidden'); if (ppfR) ppfR.classList.add('hidden'); if (ppfT) ppfT.classList.add('hidden');
            if (tabNPS) { tabNPS.style.background='#eff6ff'; tabNPS.style.color='#1e3a5f'; tabNPS.style.border='2px solid #93c5fd'; }
            if (tabPPF) { tabPPF.style.background='#f8fafc'; tabPPF.style.color='#64748b'; tabPPF.style.border='2px solid #e2e8f0'; }
        }
    }

    function ppfPreset(annual, balance, yearsDone, rate, extend) {
        var f = {'ppf-annual': Number(annual).toLocaleString('en-IN'),
                 'ppf-balance': Number(balance).toLocaleString('en-IN'),
                 'ppf-years-done': String(yearsDone),
                 'ppf-rate': String(rate),
                 'ppf-extend': String(extend)};
        Object.entries(f).forEach(function([id, val]) {
            var el = document.getElementById(id); if (!el) return;
            el.value = val; el.classList.remove('text-slate-400');
        });
        ppfCalc();
    }

    function npsPreset(monthly, age, balance, ret, annuityRate, slab) {
        var f = {'nps-monthly': Number(monthly).toLocaleString('en-IN'),
                 'nps-age': String(age),
                 'nps-balance': Number(balance).toLocaleString('en-IN'),
                 'nps-return': String(ret),
                 'nps-annuity-rate': String(annuityRate),
                 'nps-slab': String(slab)};
        Object.entries(f).forEach(function([id, val]) {
            var el = document.getElementById(id); if (!el) return;
            el.value = val; el.classList.remove('text-slate-400');
        });
        npsCalc();
    }

    function ppfToggleTable() {
        var wrap = document.getElementById('ppf-table-wrap');
        var btn  = document.getElementById('ppf-table-btn');
        var hidden = wrap.classList.toggle('hidden');
        btn.textContent = hidden ? 'Show ▾' : 'Hide ▴';
    }

    function ppfCalc() {
        var annual    = ppfNum('ppf-annual');
        var balance   = ppfNum('ppf-balance');
        var yearsDone = Math.round(ppfNum('ppf-years-done')) || 0;
        var rate      = (ppfNum('ppf-rate') || 7.1) / 100;
        var extendYrs = parseInt(document.getElementById('ppf-extend')?.value || '0');

        if (!annual) return;

        // PPF: interest calculated on minimum balance between 5th and last day of month
        // Simplified: interest on opening balance + contributions, credited annually
        var totalYears = 15 + extendYrs;
        var remainYears = Math.max(0, totalYears - yearsDone);

        var corpus   = balance;
        var totalInvested = balance;
        var totalInterest = 0;
        var yearData = [];

        for (var yr = 1; yr <= remainYears; yr++) {
            var actualYear = yearsDone + yr;
            var openBal   = corpus;
            // PPF interest: on minimum balance between 5th & end of month → simplified as annual compounding
            var interest  = (openBal + annual) * rate;
            corpus = openBal + annual + interest;
            totalInvested += annual;
            totalInterest += interest;

            // Partial withdrawal: from Year 7, up to 50% of balance at end of (yr-4) or (yr-2) whichever lower
            var partialLimit = 0;
            if (actualYear >= 7 && actualYear <= 15) {
                var balYr4  = yearData.length >= 4 ? yearData[yearData.length - 4].closeBal : 0;
                var balYrN2 = yearData.length >= 2 ? yearData[yearData.length - 2].closeBal : 0;
                partialLimit = Math.round(Math.min(balYr4, balYrN2) * 0.5);
            }
            // Loan: Year 3–6, up to 25% of balance at end of (yr-2)
            var loanLimit = 0;
            if (actualYear >= 3 && actualYear <= 6) {
                var balYr2 = yearData.length >= 2 ? yearData[yearData.length - 2].closeBal : balance;
                loanLimit = Math.round(balYr2 * 0.25);
            }

            yearData.push({ year: actualYear, openBal: Math.round(openBal), contribution: Math.round(annual),
                interest: Math.round(interest), closeBal: Math.round(corpus),
                partial: partialLimit, loan: loanLimit });
        }

        var maturity = Math.round(corpus);
        var cagr = totalInvested > 0 ? (Math.pow(maturity / totalInvested, 1 / remainYears) - 1) * 100 : 0;
        var multiple = totalInvested > 0 ? (maturity / totalInvested) : 0;

        // Partial withdrawal available now (Year 7+)
        var partialNow = 0;
        if ((yearsDone + 1) >= 7 && yearData.length >= 4) {
            partialNow = Math.round(Math.min(yearData[yearData.length - 4]?.closeBal || 0,
                                             yearData[yearData.length - 2]?.closeBal || 0) * 0.5);
        }
        // Loan now (Year 3–6)
        var loanNow = 0;
        if (yearsDone >= 3 && yearsDone <= 6 && yearData.length >= 2) {
            loanNow = Math.round((yearData[yearData.length - 2]?.closeBal || 0) * 0.25);
        }

        // DOM
        document.getElementById('ppf-maturity').textContent  = ppfFmt(maturity);
        document.getElementById('ppf-interest').textContent  = ppfFmt(Math.round(totalInterest));
        document.getElementById('ppf-invested').textContent  = ppfFmt(Math.round(totalInvested));
        document.getElementById('ppf-cagr').textContent      = cagr.toFixed(1) + '%';
        document.getElementById('ppf-multiple').textContent  = multiple.toFixed(2) + 'x';
        document.getElementById('ppf-partial').textContent   = partialNow > 0 ? ppfFmt(partialNow) : 'Not yet eligible';
        document.getElementById('ppf-loan').textContent      = loanNow > 0 ? ppfFmt(loanNow) : 'Not in loan window';

        // Insight
        var ins = document.getElementById('ppf-insight');
        ins.classList.remove('hidden');
        ins.innerHTML = '<strong>💡 PPF Insight:</strong> Investing ₹' + Number(annual).toLocaleString('en-IN') +
            '/yr for <strong>' + remainYears + ' years</strong> at ' + (rate*100).toFixed(1) + '% grows to <strong>' + ppfFmt(maturity) +
            '</strong> — a <strong>' + multiple.toFixed(2) + 'x</strong> multiple on your investment. ' +
            'Interest of <strong>' + ppfFmt(Math.round(totalInterest)) + '</strong> is completely tax-free under Sec 10. ' +
            (extendYrs > 0 ? 'Extension of ' + extendYrs + ' years adds significant compounding benefit. ' : '') +
            'Annual 80C deduction: ₹' + Math.min(150000, annual).toLocaleString('en-IN') + '.';

        // Year-by-year table
        var rows = '';
        yearData.forEach(function(d, i) {
            var bg = i % 2 === 0 ? 'background:#f0fdf4;' : '';
            var highlight = d.year === 15 ? 'font-weight:900;' : '';
            rows += '<tr style="' + bg + highlight + '">' +
                '<td class="px-2 py-1 font-black text-slate-600">' + d.year + (d.year === 15 ? ' ★' : '') + '</td>' +
                '<td class="px-2 py-1 text-right text-slate-500">' + ppfFmt(d.openBal) + '</td>' +
                '<td class="px-2 py-1 text-right text-slate-600">' + ppfFmt(d.contribution) + '</td>' +
                '<td class="px-2 py-1 text-right text-emerald-700 font-bold">' + ppfFmt(d.interest) + '</td>' +
                '<td class="px-2 py-1 text-right font-black text-blue-700">' + ppfFmt(d.closeBal) + '</td>' +
                '<td class="px-2 py-1 text-right text-orange-600">' + (d.partial > 0 ? ppfFmt(d.partial) : '—') + '</td>' +
                '<td class="px-2 py-1 text-right text-sky-600">' + (d.loan > 0 ? ppfFmt(d.loan) : '—') + '</td>' +
            '</tr>';
        });
        document.getElementById('ppf-table-body').innerHTML = rows;

        if (typeof saveUserData === 'function') saveUserData();
    }

    function npsCalc() {
        var monthly     = ppfNum('nps-monthly');
        var age         = Math.round(ppfNum('nps-age')) || 30;
        var balance     = ppfNum('nps-balance');
        var returnRate  = (ppfNum('nps-return') || 10) / 100;
        var annuityRate = (ppfNum('nps-annuity-rate') || 6) / 100;
        var slab        = (parseInt(document.getElementById('nps-slab')?.value || '20')) / 100;
        var regime      = document.getElementById('nps-regime')?.value || 'new';

        if (!monthly && !balance) return;

        var retireAge   = 60;
        var years       = Math.max(0, retireAge - age);
        var monthlyRate = returnRate / 12;

        // Future value of existing balance + monthly SIP
        var corpusBalance = balance * Math.pow(1 + returnRate, years);
        var corpusSIP = monthly > 0 && monthlyRate > 0
            ? monthly * ((Math.pow(1 + monthlyRate, years * 12) - 1) / monthlyRate) * (1 + monthlyRate)
            : monthly * years * 12;
        var totalCorpus = Math.round(corpusBalance + corpusSIP);

        // Split
        var lumpsum        = Math.round(totalCorpus * 0.6);
        var annuityCorpus  = Math.round(totalCorpus * 0.4);
        var monthlyPension = Math.round((annuityCorpus * annuityRate) / 12);

        // Total invested
        var totalInvested = Math.round(balance + monthly * years * 12);

        // Tax deduction availability:
        // Old regime: 80C (up to ₹1.5L) + 80CCD(1B) (up to ₹50K) = ₹2L/yr
        // New regime: 80C and 80CCD(1B) are NOT available.
        //             Only 80CCD(2) employer contribution is allowed (handled separately).
        var annualContrib = monthly * 12;
        var annualDeduction, sec80c, sec80ccd, totalTaxSaved, regimeNote;
        if (regime === 'old') {
            sec80c          = Math.min(annualContrib, 150000);
            sec80ccd        = Math.min(Math.max(0, annualContrib - 150000), 50000);
            annualDeduction = sec80c + sec80ccd;
            totalTaxSaved   = Math.round(annualDeduction * slab * years);
            regimeNote      = '';
        } else {
            sec80c          = 0;
            sec80ccd        = 0;
            annualDeduction = 0;
            totalTaxSaved   = 0;
            regimeNote      = '<div style="margin-top:8px;padding:8px 10px;border-radius:8px;background:#fff7ed;border:1px solid #fed7aa;font-size:10px;color:#92400e;">' +
                              '<strong>⚠ New Regime:</strong> 80C and 80CCD(1B) deductions are <strong>not available</strong>. ' +
                              'Employer NPS contribution (80CCD(2), up to 10% of basic) is still deductible in both regimes. ' +
                              'Switch to Old Regime above to see the full deduction benefit.</div>';
        }

        // DOM
        document.getElementById('nps-total-corpus').textContent  = ppfFmt(totalCorpus);
        document.getElementById('nps-lumpsum').textContent       = ppfFmt(lumpsum);
        document.getElementById('nps-pension').textContent       = ppfFmt(monthlyPension) + '/mo';
        document.getElementById('nps-annuity-corpus').textContent= ppfFmt(annuityCorpus);
        document.getElementById('nps-tax-saved').textContent     = regime === 'new' ? '₹0 (New Regime)' : ppfFmt(totalTaxSaved);
        document.getElementById('nps-years').textContent         = years + ' yrs';
        document.getElementById('nps-invested').textContent      = ppfFmt(totalInvested);

        // Insight
        var ins = document.getElementById('nps-insight');
        ins.classList.remove('hidden');
        if (regime === 'old') {
            ins.innerHTML = '<strong>💡 NPS Insight:</strong> ₹' + Number(monthly).toLocaleString('en-IN') +
                '/mo for <strong>' + years + ' years</strong> at ' + (returnRate*100).toFixed(0) + '% builds a corpus of <strong>' + ppfFmt(totalCorpus) +
                '</strong>. You get <strong>' + ppfFmt(lumpsum) + ' tax-free</strong> as lumpsum and a monthly pension of <strong>' + ppfFmt(monthlyPension) +
                '</strong>. Total tax saved over career: <strong>' + ppfFmt(totalTaxSaved) + '</strong> (80C ₹' + ppfFmt(Math.round(sec80c)) +
                ' + 80CCD(1B) ₹' + ppfFmt(Math.round(sec80ccd)) + ' × ' + (slab*100).toFixed(0) + '% slab). ' +
                '<span style="color:#b45309;"><strong>⚠ Remember:</strong> Monthly annuity pension is taxable at your slab rate in retirement.</span>';
        } else {
            ins.innerHTML = '<strong>💡 NPS Insight:</strong> ₹' + Number(monthly).toLocaleString('en-IN') +
                '/mo for <strong>' + years + ' years</strong> at ' + (returnRate*100).toFixed(0) + '% builds a corpus of <strong>' + ppfFmt(totalCorpus) +
                '</strong>. You get <strong>' + ppfFmt(lumpsum) + ' tax-free</strong> as lumpsum and a monthly pension of <strong>' + ppfFmt(monthlyPension) +
                '</strong>. ' + regimeNote +
                '<span style="color:#b45309;"><strong>⚠ Remember:</strong> Monthly annuity pension is taxable at your slab rate in retirement.</span>';
        }

        if (typeof saveUserData === 'function') saveUserData();
    }

    /* ══════════════════════════════════════════════════════════
       WHATSAPP SHARE
    ══════════════════════════════════════════════════════════ */
    function waShare(page) {
        var msg = '';
        var url = _waUrl;

        if (page === 'growth' || page === 'goal') {
            var result = _waFmt(document.getElementById('main-result'));
            var mode   = typeof currentMode !== 'undefined' ? currentMode : 'growth';
            if (mode === 'goal') {
                var years  = document.getElementById('years')?.value || '';
                var goal   = _waFmt(document.getElementById('amount-words'));
                msg = '🎯 I calculated my *Goal Planner* on Aishwaryamasthu!\n' +
                      'Target corpus: *' + result + '*' + (years ? ' in ' + years + ' years' : '') + '\n' +
                      (goal && goal !== 'Zero' ? '(' + goal + ')\n' : '') +
                      '\nCalculate yours 👇';
            } else {
                var rate  = document.getElementById('rate')?.value || '';
                var years2 = document.getElementById('years')?.value || '';
                msg = '📈 I just calculated my *wealth growth* on Aishwaryamasthu!\n' +
                      'Future corpus: *' + result + '*' + (years2 ? ' in ' + years2 + ' years' : '') +
                      (rate ? ' at ' + rate + '% return' : '') + '\n' +
                      '\nCalculate yours 👇';
            }
        }

        else if (page === 'emergency') {
            var total  = _waFmt(document.getElementById('ef-total-result'));
            var months = typeof efMonths !== 'undefined' ? efMonths : '';
            msg = '🛡️ I calculated my *Emergency Fund* on Aishwaryamasthu!\n' +
                  'I need *' + total + '*' + (months ? ' (' + months + ' months of expenses)' : '') + '\n' +
                  'Most Indians are 1 emergency away from debt. Are you covered?\n' +
                  '\nCheck yours 👇';
        }

        else if (page === 'homeloan') {
            var emi    = document.querySelector('#hl-emi-result .text-3xl')?.textContent?.trim() || '';
            var amount = document.getElementById('hl-amount')?.value || '';
            var rate   = document.getElementById('hl-rate')?.value || '';
            var tenure = document.getElementById('hl-tenure')?.value || '';
            if (!emi) emi = 'calculated';
            msg = '🏠 I calculated my *Home Loan EMI* on Aishwaryamasthu!\n' +
                  (amount ? 'Loan: ₹' + amount : '') +
                  (rate   ? ' @ ' + rate + '%' : '') +
                  (tenure ? ' for ' + tenure + ' yrs' : '') + '\n' +
                  'Monthly EMI: *' + emi + '*\n' +
                  '\nCalculate yours 👇';
        }

        else if (page === 'prepay') {
            var ppAmount   = document.getElementById('pp-amount')?.value || '';
            var ppRate     = document.getElementById('pp-rate')?.value || '';
            var ppTenure   = document.getElementById('pp-tenure')?.value || '';
            var ppLump     = document.getElementById('pp-lump')?.value || '';
            var ppAfter    = document.getElementById('pp-after')?.value || '';
            var intSaved   = document.querySelector('#hl-prepay-result .text-emerald-600')?.textContent?.trim() || '';
            var yrsSaved   = document.querySelector('#hl-prepay-result .text-blue-600')?.textContent?.trim() || '';
            msg = '💰 I calculated my *Prepayment Benefit* on Aishwaryamasthu!\n' +
                  (ppAmount ? 'Loan: ₹' + ppAmount : '') +
                  (ppRate   ? ' @ ' + ppRate + '%' : '') +
                  (ppTenure ? ' for ' + ppTenure + ' yrs' : '') + '\n' +
                  (ppLump   ? 'Lump-sum prepayment: ₹' + ppLump + (ppAfter ? ' after ' + ppAfter + ' yrs\n' : '\n') : '') +
                  (intSaved ? 'Interest saved: *' + intSaved + '*\n' : '') +
                  (yrsSaved ? 'Tenure reduced by: *' + yrsSaved + '*\n' : '') +
                  'A smart prepayment can save lakhs in interest!\n' +
                  '\nCalculate yours 👇';
        }

        else if (page === 'rentvsbuy') {
            var rvbPrice   = document.getElementById('rvb-price')?.value || '';
            var rvbDown    = document.getElementById('rvb-down')?.value || '';
            var rvbRate    = document.getElementById('rvb-rate')?.value || '';
            var rvbRent    = document.getElementById('rvb-rent')?.value || '';
            var rvbYears   = document.getElementById('rvb-years')?.value || '20';
            var verdict    = document.querySelector('#hl-rvb-result .font-black.text-base, #hl-rvb-result .font-black.text-lg')?.textContent?.trim() || '';
            msg = '⚖️ I ran a *Rent vs Buy analysis* on Aishwaryamasthu!\n' +
                  (rvbPrice ? 'Property: ₹' + rvbPrice : '') +
                  (rvbDown  ? ' | Down payment: ₹' + rvbDown : '') + '\n' +
                  (rvbRent  ? 'Current rent: ₹' + rvbRent + '/mo\n' : '') +
                  (rvbYears ? 'Horizon: ' + rvbYears + ' years\n' : '') +
                  (verdict  ? 'Verdict: *' + verdict + '*\n' : '') +
                  'Renting vs Buying — the math might surprise you!\n' +
                  '\nCalculate yours 👇';
        }

        else if (page === 'tax24b') {
            var txAmount   = document.getElementById('tx-amount')?.value || '';
            var txRate     = document.getElementById('tx-rate')?.value || '';
            var txTenure   = document.getElementById('tx-tenure')?.value || '';
            var txSlab     = document.getElementById('tx-slab')?.value || '';
            var taxSaved   = document.querySelector('#hl-tax-result .text-emerald-600, #hl-tax-result .font-black.text-2xl')?.textContent?.trim() || '';
            msg = '🧾 I calculated my *Section 24(b) Tax Saving* on Aishwaryamasthu!\n' +
                  (txAmount ? 'Loan: ₹' + txAmount : '') +
                  (txRate   ? ' @ ' + txRate + '%' : '') +
                  (txTenure ? ' for ' + txTenure + ' yrs' : '') + '\n' +
                  (txSlab   ? 'Tax slab: ' + txSlab + '%\n' : '') +
                  (taxSaved ? 'Tax saved under Sec 24(b): *' + taxSaved + '*\n' : '') +
                  'Home loan interest deduction — are you claiming yours?\n' +
                  '\nCalculate yours 👇';
        }

        else if (page === 'stepupsip') {
            var flatC  = _waFmt(document.getElementById('su-flat-corpus'));
            var stepC  = _waFmt(document.getElementById('su-stepup-corpus'));
            var extra  = _waFmt(document.getElementById('su-extra-wealth'));
            var mult   = _waFmt(document.getElementById('su-xirr'));
            var sip    = document.getElementById('su-amount')?.value || '';
            var stepup = document.getElementById('su-stepup')?.value || '10';
            msg = '📈 This changed how I think about SIPs! (*Aishwaryamasthu*)\n' +
                  (sip ? '₹' + sip + '/mo flat SIP → *' + flatC + '*\n' : '') +
                  (sip ? '₹' + sip + '/mo with ' + stepup + '% annual step-up → *' + stepC + '*\n' : '') +
                  (extra !== '—' ? 'Extra wealth from step-up: *' + extra + '* 🤯\n' : '') +
                  '\nSee the staggering difference 👇';
        }

        else if (page === 'epf') {
            var corpus  = _waFmt(document.getElementById('epf-total-corpus'));
            var age     = document.getElementById('epf-retire')?.value || '60';
            var pension = _waFmt(document.getElementById('epf-pension'));
            msg = '🏦 My *EPF corpus at retirement* — India\'s invisible number!\n' +
                  'Total EPF at age ' + age + ': *' + corpus + '*\n' +
                  (pension !== '—' ? 'Monthly EPS pension: *' + pension + '*\n' : '') +
                  'Most salaried Indians don\'t even know this number. Do you?\n' +
                  '\nCalculate yours 👇';
        }

        else if (page === 'ssa') {
            var ssaVal   = _waFmt(document.getElementById('ssa-maturity-val'));
            var elssVal  = _waFmt(document.getElementById('ssa-elss-val'));
            var total    = _waFmt(document.getElementById('ssa-total-val'));
            var dobYear  = document.getElementById('ssa-dob-year')?.value || '';
            msg = '👧 I planned my *daughter\'s education & marriage corpus* on Aishwaryamasthu!\n' +
                  'Sukanya Samriddhi: *' + ssaVal + '* (8.2% tax-free, Govt guaranteed)\n' +
                  'ELSS SIP: *' + elssVal + '*\n' +
                  'Combined at age 21: *' + total + '*\n' +
                  '\nPlan for your daughter 👇';
        }

        else if (page === 'drawdown') {
            var depAge   = document.getElementById('dd-depletion-age')?.textContent?.trim() || '';
            var yrsLast  = document.getElementById('dd-years-last')?.textContent?.trim() || '';
            var swpStart = document.getElementById('dd-swp-start')?.textContent?.trim() || '';
            var ddCorpus = document.getElementById('dd-corpus')?.value || '';
            msg = '🏖️ I just planned my *Retirement Drawdown* on Aishwaryamasthu!\n' +
                  (ddCorpus ? 'Corpus: ₹' + ddCorpus + '\n' : '') +
                  (swpStart ? 'First month SWP: *' + swpStart + '*\n' : '') +
                  (depAge   ? 'Corpus lasts until age: *' + depAge + '* (' + yrsLast + ')\n' : '') +
                  'Bucket strategy: Liquid 1yr · Debt 2–4yr · Equity rest\n' +
                  '\nPlan your retirement income 👇';
        }

        else if (page === 'ppf') {
            var ppfMaturity  = document.getElementById('ppf-maturity')?.textContent?.trim() || '';
            var ppfInterest  = document.getElementById('ppf-interest')?.textContent?.trim() || '';
            var ppfAnnual    = document.getElementById('ppf-annual')?.value || '';
            var ppfMultiple  = document.getElementById('ppf-multiple')?.textContent?.trim() || '';
            msg = '🏛️ I calculated my *PPF maturity* on Aishwaryamasthu!\n' +
                  (ppfAnnual ? 'Annual contribution: ₹' + ppfAnnual + '\n' : '') +
                  (ppfMaturity ? 'Maturity value (tax-free): *' + ppfMaturity + '*\n' : '') +
                  (ppfInterest ? 'Total interest earned: *' + ppfInterest + '*\n' : '') +
                  (ppfMultiple ? 'Wealth multiple: *' + ppfMultiple + '*\n' : '') +
                  'PPF: 7.1% tax-free · EEE status · 80C deductible\n' +
                  '\nCalculate yours 👇';
        }

        else if (page === 'nps') {
            var npsCorpus   = document.getElementById('nps-total-corpus')?.textContent?.trim() || '';
            var npsLumpsum  = document.getElementById('nps-lumpsum')?.textContent?.trim() || '';
            var npsPension  = document.getElementById('nps-pension')?.textContent?.trim() || '';
            var npsTaxSaved = document.getElementById('nps-tax-saved')?.textContent?.trim() || '';
            msg = '🏛️ I projected my *NPS retirement corpus* on Aishwaryamasthu!\n' +
                  (npsCorpus  ? 'Total NPS corpus at 60: *' + npsCorpus + '*\n' : '') +
                  (npsLumpsum ? 'Tax-free lumpsum (60%): *' + npsLumpsum + '*\n' : '') +
                  (npsPension ? 'Monthly pension: *' + npsPension + '*\n' : '') +
                  (npsTaxSaved ? 'Total tax saved: *' + npsTaxSaved + '*\n' : '') +
                  '80C + 80CCD(1B) deductions · Most tax-efficient retirement tool\n' +
                  '\nProject yours 👇';
        }

        else if (page === 'ctc') {
            var ctcTakeHome  = document.getElementById('ctc-current-takehome')?.textContent?.trim() || '';
            var ctcOptimized = document.getElementById('ctc-optimized-takehome')?.textContent?.trim() || '';
            var ctcBanner    = document.getElementById('ctc-savings-banner')?.textContent?.trim() || '';
            var ctcAnnual    = document.getElementById('ctc-annual')?.value || '';
            msg = '💰 I just optimized my *CTC & Salary* on Aishwaryamasthu!\n' +
                  (ctcAnnual ? 'Annual CTC: ₹' + ctcAnnual + '\n' : '') +
                  (ctcTakeHome ? 'Current take-home: *' + ctcTakeHome + '*\n' : '') +
                  (ctcOptimized ? 'Optimized take-home: *' + ctcOptimized + '*\n' : '') +
                  (ctcBanner && ctcBanner.includes('▲') ? ctcBanner + '\n' : '') +
                  'HRA · NPS 80CCD(2) · Food coupons · LTA restructuring\n' +
                  '\nFind your hidden salary savings 👇';
        }

        else if (page === 'insure') {
            var insTermNeeded  = document.getElementById('ins-term-needed')?.textContent?.trim() || '';
            var insHealthNeeded= document.getElementById('ins-health-needed')?.textContent?.trim() || '';
            var insTermGap     = document.getElementById('ins-term-gap-pill')?.textContent?.trim() || '';
            var insHealthGap   = document.getElementById('ins-health-gap-pill')?.textContent?.trim() || '';
            var insIncome      = document.getElementById('ins-income')?.value || '';
            msg = '🛡️ I checked my *Insurance Adequacy* on Aishwaryamasthu!\n' +
                  (insIncome ? 'Annual income: ₹' + insIncome + '\n' : '') +
                  (insTermNeeded ? 'Required term cover: *' + insTermNeeded + '*\n' : '') +
                  (insTermGap ? 'Term gap: *' + insTermGap + '*\n' : '') +
                  (insHealthNeeded ? 'Required health cover: *' + insHealthNeeded + '*\n' : '') +
                  (insHealthGap ? 'Health gap: *' + insHealthGap + '*\n' : '') +
                  'HLV method · ₹10L floater + ₹25L super top-up · Stop underinsurance\n' +
                  '\nCheck your coverage 👇';
        }

        else if (page === 'gratuity') {
            var gratGross   = document.getElementById('grat-gross')?.textContent?.trim() || '';
            var gratNet     = document.getElementById('grat-net')?.textContent?.trim() || '';
            var gratService = document.getElementById('grat-service-counted')?.textContent?.trim() || '';
            var gratBasic   = document.getElementById('grat-basic')?.value || '';
            var gratTax     = document.getElementById('grat-tax')?.textContent?.trim() || '';
            msg = '🏅 I just calculated my *Gratuity* on Aishwaryamasthu!\n' +
                  (gratBasic   ? 'Basic + DA salary: ₹' + gratBasic + '/mo\n' : '') +
                  (gratService ? 'Service counted: *' + gratService + '*\n' : '') +
                  (gratGross   ? 'Gross gratuity: *' + gratGross + '*\n' : '') +
                  (gratNet     ? 'Net in-hand: *' + gratNet + '*\n' : '') +
                  'Formula: 15/26 × Basic × Years · Tax-free up to ₹25L\n' +
                  '\nCalculate yours before you resign 👇';
        }

        else if (page === 'debtplan') {
            var debtTotalBal  = document.getElementById('debt-total-bal')?.textContent?.trim() || '';
            var debtIntSaved  = document.getElementById('debt-interest-saved')?.textContent?.trim() || '';
            var debtPayoff    = document.getElementById('debt-payoff-months')?.textContent?.trim() || '';
            var debtExtra     = document.getElementById('debt-extra')?.value || '';
            var debtPriority  = document.querySelector('#debt-priority-list .font-black.text-slate-700')?.textContent?.trim() || '';
            msg = '⚡ I just planned my *Loan Prepayment* on Aishwaryamasthu!\n' +
                  (debtTotalBal ? 'Total outstanding debt: *' + debtTotalBal + '*\n' : '') +
                  (debtExtra ? 'Extra monthly prepayment: ₹' + debtExtra + '\n' : '') +
                  (debtIntSaved ? 'Interest saved: *' + debtIntSaved + '*\n' : '') +
                  (debtPayoff ? 'Debt-free in: *' + debtPayoff + '*\n' : '') +
                  'Avalanche (high rate first) & Snowball (small balance first) methods\n' +
                  '\nPlan your debt freedom 👇';
        }

        else if (page === 'taxguide') {
            var surplus = document.getElementById('tg-surplus-content')?.textContent?.trim() || '';
            var regime  = document.querySelector('#tg-result-section .font-black')?.textContent?.trim() || 'calculated';
            msg = '🧾 I checked my *tax saving* on Aishwaryamasthu!\n' +
                  'Old vs New regime comparison done ✅\n' +
                  'Are you maximising your 80C, HRA and NPS deductions?\n' +
                  '\nCheck your tax saving 👇';
        }

        else if (page === 'healthscore') {
            var score = _waFmt(document.getElementById('hs-score-display'));
            var grade = _waFmt(document.getElementById('hs-grade-title'));
            msg = '💗 I just checked my *Financial Health Score* on Aishwaryamasthu!\n' +
                  'My score: *' + score + '/100* — ' + grade + '\n' +
                  'Insurance ✓  Emergency Fund ✓  Investments ✓  Debt ✓\n' +
                  '\nCheck your honest score 👇';
        }

        else if (page === 'finplan') {
            var monthly = document.querySelector('#fp-result-header .text-2xl')?.textContent?.trim() || '';
            msg = '📋 I just got my *personalised investment plan* on Aishwaryamasthu!\n' +
                  (monthly ? 'My recommended monthly SIP: *' + monthly + '*\n' : '') +
                  'It covers: goals, risk profile, EPF, insurance gaps & asset allocation.\n' +
                  '\nGet your free plan 👇';
        }

        else if (page === 'fundcompare') {
            var chips = document.querySelectorAll('.mfc-chip span');
            var names = Array.from(chips).map(function(s){ return s.textContent.trim(); }).filter(Boolean);
            var fundList = names.length ? names.join(' vs ') : 'multiple funds';
            msg = '⚖️ I just compared *' + fundList + '* on Aishwaryamasthu!\n' +
                  'Side-by-side: CAGR · Alpha · Sharpe · Beta · Standard Deviation\n' +
                  'The numbers tell a very different story than the ads.\n' +
                  '\nCompare your funds 👇';
        }

        else if (page === 'cibil') {
            var cScore = document.getElementById('cibil-score')?.value || '';
            var cGrade = document.getElementById('cibil-grade-label')?.textContent?.trim() || '';
            var cSaved = document.getElementById('cibil-total-saved')?.textContent?.trim() || '';
            msg = '🏦 I just checked my *CIBIL Score* on Aishwaryamasthu!\n' +
                  (cScore ? 'My score: *' + cScore + '* — ' + cGrade + '\n' : '') +
                  (cSaved && cSaved !== '—' ? 'Potential interest saved by improving score: *' + cSaved + '*\n' : '') +
                  'Score 750+ can save ₹6L+ on a home loan 🏠\n' +
                  '\nCheck your CIBIL impact 👇';
        }

        else if (page === 'fincal') {
            var fcNext = document.getElementById('fc-next-title')?.textContent?.trim() || '';
            var fcCrit = document.getElementById('fc-count-critical')?.textContent?.trim() || '0';
            msg = '📅 I just checked my *Financial Calendar* on Aishwaryamasthu!\n' +
                  (parseInt(fcCrit) > 0 ? '🔴 ' + fcCrit + ' critical deadline(s) within 7 days!\n' : '') +
                  (fcNext ? 'Next deadline: *' + fcNext + '*\n' : '') +
                  'Advance tax · ITR · PPF · ELSS · SGB · EPF — all in one place\n' +
                  '\nNever miss a financial deadline again 👇';
        }

        else if (page === 'selfempl') {
            var seProfit = document.getElementById('se-res-profit')?.textContent?.trim() || '';
            var seTax    = document.getElementById('se-res-tax')?.textContent?.trim() || '';
            var seRate   = document.getElementById('se-res-effrate')?.textContent?.trim() || '';
            msg = '🧾 I just calculated my *Self-Employed Tax* on Aishwaryamasthu!\n' +
                  (seProfit ? 'Presumptive profit: *' + seProfit + '*\n' : '') +
                  (seTax    ? 'Tax + cess: *' + seTax + '*\n' : '') +
                  (seRate   ? 'Effective rate on turnover: *' + seRate + '*\n' : '') +
                  '44AD/44ADA presumptive tax · Business emergency fund · GST timing\n' +
                  '\nCalculate your self-employed tax 👇';
        }

        else if (page === 'goldcomp') {
            var gcWinner = document.getElementById('gc-winner-name')?.textContent?.trim() || '';
            var gcAmt    = document.getElementById('gc-amount')?.value || '';
            var gcYrs    = document.getElementById('gc-years')?.value || '5';
            msg = '🥇 I just compared *Gold Investment Options* on Aishwaryamasthu!\n' +
                  (gcAmt  ? 'Investment: ₹' + gcAmt + ' for ' + gcYrs + ' years\n' : '') +
                  (gcWinner ? '🏆 Best option: *' + gcWinner + '*\n' : '') +
                  '⚠️ Digital Gold (PhonePe/Paytm) = UNREGULATED — SEBI has flagged it!\n' +
                  'ETF vs Gold MF vs Physical Gold — full cost + tax comparison\n' +
                  '\nCheck before Akshaya Tritiya / Dhanteras 👇';
        }

        if (!msg) {
            msg = '📊 Check out *Aishwaryamasthu* — India\'s best free financial planning tool!\n\n' +
                  'SIP calculator · Goal planner · EPF projector · SSA planner · Tax guide & more 👇';
        }

        var fullMsg = msg + '\n' + url;
        var waLink  = 'https://wa.me/?text=' + encodeURIComponent(fullMsg);
        window.open(waLink, '_blank') || (location.href = waLink);
    }




    /* ══════════════════════════════════════════════════════════
       MULTILINGUAL  (EN / HI / TE / TA)
       Architecture: data-i18n attributes on static HTML +
       _t(key) calls for dynamically generated content.
    ══════════════════════════════════════════════════════════ */

    var _lang = 'en';
    try { _lang = localStorage.getItem('aw_lang') || 'en'; } catch(e) {}

    /* Current Indian financial year label, e.g. "FY 2026-27" — recomputes every April */
    var _fyStr = (function() {
        var t = new Date();
        var y = t.getMonth() >= 3 ? t.getFullYear() : t.getFullYear() - 1;
        return 'FY ' + y + '-' + String(y - 1999).padStart(2, '0');
    })();

    /* ── Translation table ─────────────────────────────────── */
    var _T = {
      en: {
        /* Nav */
        'tagline':              'GROW AND MAKE INDIA GROW',
        'nav.back':             '⬅ Dashboard',
        'nav.resetData':        '🗑 Reset My Data',
        'nav.signOut':          'Sign Out',
        /* Dashboard */
        'dash.welcome.h':       '🌟 What would you like to do today?',
        'dash.welcome.p':       'Your complete Indian wealth planning toolkit — pick a module to get started',
        'dash.cat.calc':        '⚡ Calculators',
        'dash.cat.mf':          '📊 Mutual Funds',
        'dash.cat.plan':        '🗺️ Planning & Tax',
        'dash.tip':             'New to investing? Start here',
        /* Dashboard cards */
        'card.growth.title':    'Growth Calculator',
        'card.growth.desc':     'Compound interest · Lumpsum · SIP · Inflation adjust',
        'card.goal.title':      'Goal Planner',
        'card.goal.desc':       'Education · Marriage · Retirement · Category inflation presets',
        'card.ef.title':        'Emergency Fund',
        'card.ef.desc':         'How much safety net you really need · 3–12 month calculator',
        'card.hl.title':        'Home Loan Advisor',
        'card.hl.desc':         'EMI · Prepayment benefit · Rent vs Buy · Sec 24(b) tax saving',
        'card.su.title':        'Step-Up SIP Calculator',
        'card.su.desc':         'Flat SIP vs 10% annual step-up · See the staggering corpus gap',
        'card.epf.title':       'EPF Corpus Projector',
        'card.epf.desc':        "Basic salary · Employer match · Retirement corpus · India's invisible retirement number",
        'card.mfe.title':       'MF Explorer',
        'card.mfe.desc':        'Live NAV · Signal scoring · Fund comparator · 1000+ funds',
        'card.mfk.title':       'MF Kit',
        'card.mfk.desc':        'Which fund type suits you · Equity · Debt · Hybrid explained',
        'card.fp.title':        'Fund Picker Guide',
        'card.fp.desc':         'Alpha · Sharpe · Sortino · Expense ratio · How to read metrics',
        'card.finplan.title':   'Financial Plan',
        'card.finplan.desc':    'Personalised SIP plan · Goals · Risk profile · EPF · Existing wealth',
        'card.tax.title':       'Tax Guide',
        'card.tax.desc':        'Old vs New regime · MF capital gains · Crypto tax · Surplus calc',
        'card.hs.title':        'Financial Health Score',
        'card.hs.desc':         'Get an honest score for your money life · Insurance · EF · Savings',
        'card.ssa.title':       'SSA + Child Education Planner',
        'card.ssa.desc':        "Sukanya Samriddhi 8.2% · ELSS SIP top-up · Daughter's education & marriage corpus",
        /* Page headers */
        'page.growth.h':        'Growth Calculator',
        'page.growth.sub':      'Project how your money grows over time with compound interest.',
        'page.goal.h':          'Goal Planner',
        'page.goal.sub':        'Calculate how much to invest monthly to reach your financial goals.',
        'page.ef.h':            'Emergency Fund Calculator',
        'page.ef.sub':          'Enter your monthly expenses to calculate the recommended emergency corpus.',
        'page.mfkit.h':         '💼 Mutual Fund Kit',
        'page.mfkit.sub':       'Tap any fund type to learn what it is, when to use it, and see a real-world Indian example.',
        'page.funder.h':        '🔬 How to Pick a Quality Mutual Fund',
        'page.funder.sub':      'These metrics tell you if a fund is doing its job well. Use them before putting your money in.',
        'page.hs.h':            'Financial Health Score',
        'page.hs.sub':          "Enter your financial details below and we'll give you an honest score — no sugar-coating. Think of it as a report card for your money life. 📋",
        'page.fp.h':            'Financial Plan Builder',
        'page.fp.sub':          'Answer a few questions. Get a personalised portfolio allocation built for you.',
        'page.mfe.h':           '🔭 Indian MF Explorer',
        'page.mfe.sub':         'Live NAV from AMFI · Auto-scored per category · Top AMCs · 3+ year funds only',
        'page.tg.h':            '🧾 Indian Tax Guide',
        'page.tg.sub':          'Old vs New Regime · MF Capital Gains · Crypto Tax · ELSS · Small Savings — rates kept current',
        'page.hl.h':            '🏠 Home Loan Advisor',
        'page.hl.sub':          'EMI Calculator · Prepayment Benefit · Rent vs Buy · Section 24(b) Tax Saving',
        'page.su.h':            '📈 Step-Up SIP Calculator',
        'page.su.sub':          'Increase your SIP 10–15% every year. See the corpus gap it creates.',
        'page.epf.h':           '🏦 EPF Corpus Projector',
        'page.epf.sub':         "India's most important (and invisible) retirement number. Employee + Employer 12% match, 8.15% EPFO interest, compounded to retirement.",
        'page.ssa.h':           '👧 SSA + Child Education Dual Planner',
        'page.ssa.sub':         "Sukanya Samriddhi (8.2% tax-free, Sec 80C) + ELSS SIP · Inflation-adjusted goals · Daughter's education & marriage corpus.",

        /* Growth/Goal labels */
        'lbl.gr.goal':          "What's Your Goal?",
        'lbl.gr.todaycost':     "Today's Cost (₹) — in today's money",
        'lbl.gr.amount':        'Amount',
        'lbl.gr.years':         'Time Period (Years)',
        'lbl.gr.expinfl':       'Expected Inflation (%)',
        'lbl.gr.custom':        'Custom Target Return (%)',
        'res.gr.projhead':      'Projection Results',
        'res.gr.goalhead':      'Goal Results',
        'res.gr.invested':      'Total Invested',
        'res.gr.reqinv':        'Required Investment to Reach Target',
        'res.gr.recominv':      'Recommended Indian Investments',
        /* Home Loan labels */
        'lbl.hl.amount':        'Loan Amount (₹)',
        'lbl.hl.rate':          'Annual Interest Rate (%)',
        'lbl.hl.tenure':        'Loan Tenure (Years)',
        'lbl.hl.month':         'Start Month (optional)',
        'lbl.hl.origamt':       'Original Loan Amount (₹)',
        'lbl.hl.ratepа':        'Interest Rate (% p.a.)',
        'lbl.hl.origten':       'Original Tenure (Years)',
        'lbl.hl.prepay':        'Lump-sum Prepayment Amount (₹)',
        'lbl.hl.prepayafter':   'Prepayment After (Years into loan)',
        'lbl.hl.proprice':      'Property Price (₹)',
        'lbl.hl.down':          'Down Payment (₹)',
        'lbl.hl.loanrate':      'Loan Interest Rate (% p.a.)',
        'lbl.hl.propapp':       'Property Appreciation (% p.a.)',
        'lbl.hl.maint':         'Annual Maintenance + Tax (₹)',
        'lbl.hl.rent':          'Monthly Rent (₹)',
        'lbl.hl.rentinc':       'Annual Rent Increase (%)',
        'lbl.hl.investret':     'Investment Return on Saved Capital (% p.a.)',
        'lbl.hl.horizon':       'Comparison Horizon (Years)',
        'lbl.hl.taxamt':        'Home Loan Amount (₹)',
        'lbl.hl.taxslab':       'Your Tax Slab (%)',
        'lbl.hl.proptype':      'Property Type',
        /* Splash */
        'splash.tagline':       'Indian Wealth Generation Calculator',
        'splash.login':         '🔑  Login',
        'splash.signup':        '✨  Sign Up',
        'splash.email':         'Email Address',
        'splash.password':      'Password',
        'splash.confirmpassword': 'Confirm Password',
        'splash.fname':         'First Name',
        'splash.lname':         'Last Name',
        'splash.enterdash':     'Enter the Dashboard →',
        'splash.createaccount': 'Create My Account →',
        'mf.returns':'Returns','mf.horizon':'Horizon','mf.details':'Details',
        /* Tax Guide dynamic */
        'tg.win.new':        'New Regime saves you more',
        'tg.win.old':        'Old Regime saves you more',
        'tg.win.equal':      'Both regimes give same tax',
        'tg.win.save':       'save',
        'tg.regime.new':     'New Regime',
        'tg.regime.old':     'Old Regime',
        'tg.regime.either':  'Either',
        'tg.res.best':       'Best regime',
        'tg.res.effrate':    'Effective tax rate',
        'tg.res.marginal':   'Marginal slab',
        'tg.res.annual':     'Annual take-home',
        'tg.res.monthly':    'Monthly take-home',
        'tg.res.cessnote':   'Cess 4% included. 87A rebate applied. Surcharge not shown.',
        'tg.res.rebate87a':  '87A Rebate: Full tax waived — income up to ₹12L (Budget 2025)',
        'tg.res.notax':      'No tax applicable',
        'tg.card.gross':     'Gross',
        'tg.card.ded':       'Deductions',
        'tg.card.taxable':   'Taxable',
        'tg.card.tax':       'Tax',
        'tg.card.cess':      'Cess (4%)',
        'tg.card.total':     'Total Tax',
        'tg.card.takehome':  'Take-home',
        'tg.sur.posttax':    'Post-Tax Take-Home',
        'tg.sur.grossvia':   'gross, via',
        'tg.sur.cashinhand': 'Cash-in-Hand',
        'tg.sur.expenses':   'Monthly Expenses',
        'tg.sur.asentered':  'as entered',
        'tg.sur.investable': 'Monthly Investable Surplus',
        'tg.sur.savrate':    'Savings rate',
        'tg.sur.ofcash':     'of cash-in-hand',
        'tg.sur.overspend':  'Expenses exceed cash-in-hand. Review your budget.',
        'tg.sur.free':       'Free surplus',
        'tg.epf.note1':      'EPF deducted:',
        'tg.epf.of':         'of',
        'tg.epf.note2':      'Employer also adds',
        'tg.epf.note3':      'to your corpus.',
        'tg.epf.corpus1':    '+ EPF builds',
        'tg.epf.corpus2':    'in your corpus',
        'tg.epf.corpus3':    'you + employer',
        'tg.epf.each':       'each',
        'tg.lbl.empnps':     'Employer NPS Contribution 80CCD(2)',
        'tg.hint.empnps':    "Your employer's NPS contribution (up to 10% of basic). Deductible u/s 80CCD(2) — not limited by the ₹1.5L 80C cap.",
        'tg.btn.reset':      'Reset Tax Guide',
        'tg.tbl.lockinyrs':  '3 yr lock-in',
        /* Tax dates & tips */
        'tg.date1':  '📌 <strong>31 Mar</strong> — Last date to invest for 80C deductions this FY',
        'tg.date2':  '📌 <strong>31 Jul</strong> — ITR filing deadline (salaried, no audit)',
        'tg.date3':  '📌 <strong>15 Mar</strong> — Advance tax 4th instalment due',
        'tg.date4':  '📌 <strong>31 Oct</strong> — ITR with audit, or revised return deadline',
        'tg.tip1':   '✅ Book ₹1.25L LTCG every year tax-free (equity MF)',
        'tg.tip2':   '✅ Use ELSS for 80C — shortest lock-in + equity returns',
        'tg.tip3':   '✅ NPS adds ₹50K extra deduction under 80CCD(1B)',
        'tg.tip4':   '✅ Arbitrage funds: 12.5% LTCG vs 30% on FD interest',
        'tg.tip5':   '✅ Rebate u/s 87A: Zero tax up to ₹12L under new regime (Budget 2025)',
        /* CG table fund names & holding */
        'tg.fund.equity':   'Equity MF / ETF',
        'tg.fund.elss':     'ELSS',
        'tg.fund.arb':      'Arbitrage Fund',
        'tg.fund.debt':     'Debt MF / FoF',
        'tg.fund.liquid':   'Liquid / Ultra-Short',
        'tg.fund.gold':     'Gold ETF / Gold FoF',
        'tg.fund.intl':     'International Fund',
        'tg.hold.gt1':      '> 1 year',
        'tg.hold.lt1':      '< 1 year',
        'tg.hold.any':      'Any',
        /* Tax Guide */
        'tg.opt.title':      '⚖️ Old Regime vs New Regime Tax Optimizer',
        'tg.opt.sub':        'Enter income + deductions → instantly see which regime saves more + investable surplus',
        'tg.opt.badge':      _fyStr + ' rates',
        'tg.lbl.salary':     'Annual Gross Salary / CTC (₹)',
        'tg.lbl.other':      'Other Income (FD interest, rent…)',
        'tg.lbl.oldded':     'Old Regime Deductions',
        'tg.lbl.oldded.note':'(only relevant if old regime wins)',
        'tg.lbl.80c':        '80C',
        'tg.lbl.hra':        'HRA Exemption',
        'tg.lbl.nps':        'NPS 80CCD(1B)',
        'tg.lbl.hl':         'Home Loan 24(b)',
        'tg.lbl.80d':        '80D Health Ins.',
        'tg.lbl.otherded':   'Other Deductions',
        'tg.hint.80c':       'ELSS, PPF, LIC, EPF',
        'tg.hint.hra':       'Metro 50%, Non-metro 40%',
        'tg.hint.nps':       'Extra ₹50K beyond 80C',
        'tg.hint.hl':        'Self-occupied property',
        'tg.hint.80d':       'Self ₹25K + Parents ₹50K',
        'tg.hint.otherded':  'LTA, Prof Tax, 80E, 80G…',
        'tg.lbl.exp':        'Monthly Living Expenses (₹)',
        'tg.lbl.exp.note':   '— for surplus calculation',
        'tg.hint.exp':       'Rent + groceries + EMIs + lifestyle — enter to see exactly how much you can invest each month',
        'tg.lbl.epf':        'Monthly Basic Salary (₹)',
        'tg.lbl.epf.note':   '— for EPF deduction',
        'tg.hint.epf':       "Employee EPF = 12% of basic, deducted from take-home. EPS (pension) is part of employer's 12% — not deducted from your salary.",
        'tg.placeholder':    'Enter your salary above to see the comparison',
        'tg.slab.title':     '📊 Tax Slab Breakdown (Winning Regime)',
        'tg.surplus.title':  '💰 Your Investable Surplus',
        'tg.btn.sendplan':   '→ Send Surplus to Financial Plan as Monthly Investment',
        'tg.disclaimer':     '* Std deduction ₹75K (new) / ₹50K (old). 4% cess included. 87A rebate applied. Surcharge not shown. Estimate only — consult a CA before filing.',
        'tg.cg.title':       '📊 MF Capital Gains — Current Rates',
        'tg.tbl.type':       'Fund Type',
        'tg.tbl.holding':    'Holding Period',
        'tg.tbl.taxtype':    'Tax Type',
        'tg.tbl.rate':       'Rate',
        'tg.tbl.exempt':     'Exemption',
        'tg.tbl.exempt125':  '₹1.25L/year exempt',
        'tg.tbl.noexempt':   'No exemption',
        'tg.tbl.nobenefit':  'No benefit. Same as FD.',
        'tg.tbl.nobenefit2': 'No benefit',
        'tg.tbl.intl':       'Treated as debt post-2023',
        'tg.cg.note':        'Finance Act 2023 removed indexation for debt MFs entirely. Finance Act 2024 raised STCG to 20% and LTCG to 12.5% while raising the LTCG exemption threshold from ₹1L to ₹1.25L. Always verify current rates before filing.',
        'tg.crypto.title':   '₿ Crypto / VDA Taxation — Budget 2022 Rules',
        'tg.crypto.flat':    'Flat Tax on ALL Gains',
        'tg.crypto.flat.desc':'No holding period benefit. Gains taxed at 30% regardless of short-term or long-term. No basic exemption limit applies to VDA income.',
        'tg.crypto.tds':     'Deducted on Every Trade',
        'tg.crypto.tds.desc':'1% TDS deducted at source on every crypto transaction above ₹10,000 (₹50,000 for specified persons). TDS can be claimed as credit while filing.',
        'tg.crypto.nooffset':'Losses Cannot Be Set Off',
        'tg.crypto.nooffset.desc':'Crypto losses cannot be set off against any other income — not even other crypto gains. Each VDA is treated separately. No carry-forward of losses either.',
        'tg.dates.title':    '📅 Key Tax Dates & Tips for Investors',
        'tg.dates.deadlines':'Tax Saving Deadlines',
        'tg.dates.smartmoves':'Smart Tax Moves',
        /* MF Modal labels */
        'mf.modal.ret':      'Typical Returns',
        'mf.modal.hor':      'Min Horizon',
        'mf.modal.risk':     'Risk Level',
        'mf.modal.what':     'What is it?',
        'mf.modal.when':     '✅ When to Use / Best Scenarios',
        'mf.modal.avoid':    '⚠️ When NOT to Use',
        'mf.modal.eg':       '💡 Real Indian Example',
        /* Fund Picker labels */
        'picker.good':       'Good',
        'picker.watchout':   'Watch out',
        'picker.protip':     '💡 Pro Tip',
        'picker.eg':         '📖 Indian Example',
        'picker.mustknow':   'Must Know',
        'picker.importance': 'Importance',
        'picker.cat.returns':'Returns',
        'picker.cat.risk':   'Risk',
        'picker.cat.cost':   'Cost & Tax',
        'picker.cat.structure':'Structure',
        /* Common */
        'common.presets':       'Quick Presets',
        'ssh.params':           'Parameters',
        'ssh.epfdetails':       'Your EPF Details',
        'ssh.ssa':              '🏦 Sukanya Samriddhi Account',
        'ssh.elss':             '📈 ELSS SIP Top-Up',
        'ssh.goals':            "🎯 Goals (Today's Cost — inflation-adjusted automatically)",
        /* Growth/Goal inputs */
        'lbl.gr.type':          'Investment Type',
        'lbl.gr.rate':          'Expected Return (%)',
        'lbl.gr.inflation':     'Adjust for Inflation',
        'res.gr.title':         'Projected Future Value',
        'res.gr.interest':      'Total Interest',
        /* Step-Up SIP inputs & results */
        'lbl.su.amount':        'Monthly SIP (₹)',
        'lbl.su.rate':          'Annual Return (%)',
        'lbl.su.years':         'Period (Years)',
        'lbl.su.stepup':        'Step-Up (%/yr)',
        'res.su.flat':          '📉 Flat SIP Corpus',
        'res.su.stepup':        '⚡ Step-Up Corpus',
        'res.su.extra':         'Extra Wealth from Step-Up',
        'res.su.extrainv':      'Extra Invested',
        'res.su.finalsip':      'Final SIP/mo',
        'res.su.mult':          'Corpus Multiplier',
        'res.su.combined':      'Total Combined',
        /* EPF inputs & results */
        'lbl.epf.basic':        'Basic + DA Salary (₹/mo)',
        'lbl.epf.balance':      'Current EPF Balance (₹)',
        'lbl.epf.age':          'Current Age (yrs)',
        'lbl.epf.retire':       'Retirement Age (yrs)',
        'lbl.epf.growth':       'Salary Growth (%/yr)',
        'lbl.epf.rate':         'EPF Interest Rate (%)',
        'res.epf.corpus':       'EPF Corpus at Retirement',
        'res.epf.interest':     'Total Interest Earned',
        'res.epf.contrib':      'Total Contributions',
        'res.epf.monthly':      'Equivalent Monthly Contribution (Current)',
        'res.epf.years':        'Years to Retire',
        'res.epf.mult':         'Interest Multiple',
        'res.epf.salary':       'Final Basic Salary',
        'res.epf.pension':      'Pension (EPS)',
        'res.epf.table':        'Year-by-Year EPF Passbook',
        /* SSA inputs & results */
        'lbl.ssa.dobyear':      "Daughter's Birth Year",
        'lbl.ssa.annual':       'Annual SSA Deposit (₹)',
        'lbl.ssa.tenure':       'Deposit for (Years)',
        'lbl.ssa.inflation':    'Education Inflation (%/yr)',
        'lbl.ssa.elss':         'Monthly ELSS SIP (₹)',
        'lbl.ssa.elssret':      'ELSS Return (%/yr)',
        'lbl.ssa.edu':          'Education Goal (₹ today)',
        'lbl.ssa.marr':         'Marriage Goal (₹ today)',
        'res.ssa.maturity':     'SSA Maturity',
        'res.ssa.elss':         'ELSS Corpus',
        'res.ssa.total':        'Total Combined',
        'res.ssa.inflcosts':    '📊 Inflation-Adjusted Future Costs',
        'res.ssa.goaltitle':    'Goal Coverage vs Inflation-Adjusted Cost',
        'res.ssa.invested':     'SSA Invested',
        'res.ssa.interest':     'SSA Interest',
        'res.ssa.elssgins':     'ELSS Gains',
        'res.ssa.tax80c':       '80C Saved',
        'res.ssa.table':        'Year-by-Year SSA Passbook',
        /* Health Score inputs */
        'lbl.hs.income':        'Monthly Take-Home Income',
        'lbl.hs.emi':           'Monthly EMIs / Loan Repayments',
        'lbl.hs.exp':           'Monthly Living Expenses',
        'lbl.hs.sav':           'Monthly Savings & Investments',
        'lbl.hs.health':        'Health Insurance Coverage (Total)',
        'lbl.hs.term':          'Term Life Insurance Coverage',
        'lbl.hs.ef':            'Emergency Fund Saved (Total)',
        /* Health Score grades */
        'hs.grade.rockstar':    'Financial Rockstar 🤘',
        'hs.desc.rockstar':     "Warren Buffett has entered the chat. Your finances are in elite shape. Go flex (responsibly).",
        'hs.grade.builder':     'Wealth Builder',
        'hs.desc.builder':      "You're doing things right. A few tweaks and you'll be unstoppable. Keep stacking those chips!",
        'hs.grade.track':       'On the Right Track',
        'hs.desc.track':        "Solid foundation! A few gaps need attention but you're clearly thinking ahead. Nice work.",
        'hs.grade.getting':     'Getting There',
        'hs.desc.getting':      "You're aware, which is step one. Now close those gaps — one action at a time!",
        'hs.grade.wakeup':      'Wake-Up Call',
        'hs.desc.wakeup':       "Your money needs a serious pep talk. The good news? You're reading this — so the healing begins now.",
        'hs.grade.sos':         'SOS Mode',
        'hs.desc.sos':          "Houston, we have a problem. But every financial superhero has an origin story. Yours starts today.",
        'hs.grade.emergency':   'Financial Emergency',
        'hs.desc.emergency':    "Okay, time for some real talk. The gap is big but closable. Start with just ONE action below.",
        'hs.notscored':         'Not scored yet',
        'hs.crushing':          "🎉 You're crushing it! No urgent actions needed.",
        /* Health Score action category names */
        'hs.cat.savings':       'Savings Rate',
        'hs.cat.debt':          'Debt Burden',
        'hs.cat.health':        'Health Insurance',
        'hs.cat.term':          'Term Insurance',
        'hs.cat.ef':            'Emergency Fund',
        'hs.cat.spend':         'Spending Control',
        'hs.cat.age':           'Age Readiness',
        /* Pie chart labels */
        'hs.pie.savings':       'Savings & Investments',
        'hs.pie.emi':           'EMIs / Loans',
        'hs.pie.exp':           'Living Expenses',
        'hs.pie.cash':          'Free Cash',
      },

      hi: {
        'tagline':              'बढ़ो और भारत को बढ़ाओ',
        'nav.back':             '⬅ डैशबोर्ड',
        'nav.resetData':        '🗑 डेटा रीसेट करें',
        'nav.signOut':          'साइन आउट',
        'dash.welcome.h':       '🌟 आज आप क्या करना चाहेंगे?',
        'dash.welcome.p':       'भारत का पूर्ण वित्तीय नियोजन टूल — कोई भी मॉड्यूल चुनें',
        'dash.cat.calc':        '⚡ कैलकुलेटर',
        'dash.cat.mf':          '📊 म्यूचुअल फंड',
        'dash.cat.plan':        '🗺️ योजना और कर',
        'dash.tip':             'निवेश में नए हैं? यहाँ से शुरू करें',
        'card.growth.title':    'ग्रोथ कैलकुलेटर',
        'card.growth.desc':     'चक्रवृद्धि ब्याज · एकमुश्त · SIP · महंगाई समायोजन',
        'card.goal.title':      'लक्ष्य योजनाकार',
        'card.goal.desc':       'शिक्षा · विवाह · सेवानिवृत्ति · श्रेणी महंगाई प्रीसेट',
        'card.ef.title':        'आपातकालीन निधि',
        'card.ef.desc':         'आपको कितना सुरक्षा जाल चाहिए · 3–12 माह कैलकुलेटर',
        'card.hl.title':        'गृह ऋण सलाहकार',
        'card.hl.desc':         'EMI · प्रीपेमेंट लाभ · किराया vs खरीद · धारा 24(b) कर बचत',
        'card.su.title':        'स्टेप-अप SIP कैलकुलेटर',
        'card.su.desc':         'फ्लैट SIP बनाम 10% वार्षिक स्टेप-अप · भारी अंतर देखें',
        'card.epf.title':       'EPF कोष प्रोजेक्टर',
        'card.epf.desc':        'मूल वेतन · नियोक्ता योगदान · सेवानिवृत्ति कोष',
        'card.mfe.title':       'MF एक्सप्लोरर',
        'card.mfe.desc':        'लाइव NAV · सिग्नल स्कोरिंग · फंड तुलनाकर्ता · 1000+ फंड',
        'card.mfk.title':       'MF किट',
        'card.mfk.desc':        'कौन सा फंड आपके लिए उपयुक्त · इक्विटी · डेब्ट · हाइब्रिड',
        'card.fp.title':        'फंड पिकर गाइड',
        'card.fp.desc':         'अल्फा · शार्प · सॉर्टिनो · व्यय अनुपात · मेट्रिक्स कैसे पढ़ें',
        'card.finplan.title':   'वित्तीय योजना',
        'card.finplan.desc':    'व्यक्तिगत SIP योजना · लक्ष्य · जोखिम प्रोफाइल · EPF',
        'card.tax.title':       'कर मार्गदर्शिका',
        'card.tax.desc':        'पुरानी बनाम नई व्यवस्था · MF पूंजीगत लाभ · क्रिप्टो कर',
        'card.hs.title':        'वित्तीय स्वास्थ्य स्कोर',
        'card.hs.desc':         'अपने धन जीवन के लिए ईमानदार स्कोर पाएं',
        'card.ssa.title':       'SSA + बाल शिक्षा योजनाकार',
        'card.ssa.desc':        'सुकन्या समृद्धि 8.2% · ELSS SIP · बेटी की शिक्षा और विवाह',
        'page.growth.h':        'ग्रोथ कैलकुलेटर',
        'page.growth.sub':      'चक्रवृद्धि ब्याज के साथ आपका पैसा कैसे बढ़ता है, देखें।',
        'page.goal.h':          'लक्ष्य योजनाकार',
        'page.goal.sub':        'अपने वित्तीय लक्ष्यों तक पहुंचने के लिए कितना निवेश करें।',
        'page.ef.h':            'आपातकालीन निधि कैलकुलेटर',
        'page.ef.sub':          'अनुशंसित आपातकालीन कोष जानने के लिए मासिक खर्च दर्ज करें।',
        'page.mfkit.h':         '💼 म्यूचुअल फंड किट',
        'page.mfkit.sub':       'किसी भी फंड प्रकार पर टैप करें और जानें इसे कब उपयोग करें।',
        'page.funder.h':        '🔬 अच्छा म्यूचुअल फंड कैसे चुनें',
        'page.funder.sub':      'ये मेट्रिक्स बताते हैं कि फंड अपना काम अच्छे से कर रहा है या नहीं।',
        'page.hs.h':            'वित्तीय स्वास्थ्य स्कोर',
        'page.hs.sub':          'अपनी वित्तीय जानकारी दर्ज करें और ईमानदार स्कोर पाएं। 📋',
        'page.fp.h':            'वित्तीय योजना निर्माता',
        'page.fp.sub':          'कुछ सवालों के जवाब दें। आपके लिए व्यक्तिगत पोर्टफोलियो पाएं।',
        'page.mfe.h':           '🔭 भारतीय MF एक्सप्लोरर',
        'page.mfe.sub':         'AMFI से लाइव NAV · स्वचालित स्कोरिंग · शीर्ष AMC',
        'page.tg.h':            '🧾 भारतीय कर मार्गदर्शिका',
        'page.tg.sub':          'पुरानी बनाम नई व्यवस्था · MF पूंजीगत लाभ · क्रिप्टो कर · ELSS',
        'page.hl.h':            '🏠 गृह ऋण सलाहकार',
        'page.hl.sub':          'EMI कैलकुलेटर · प्रीपेमेंट लाभ · किराया vs खरीद · धारा 24(b)',
        'page.su.h':            '📈 स्टेप-अप SIP कैलकुलेटर',
        'page.su.sub':          'हर साल SIP 10–15% बढ़ाएं। देखें यह कितना बड़ा अंतर लाता है।',
        'page.epf.h':           '🏦 EPF कोष प्रोजेक्टर',
        'page.epf.sub':         'भारत का सबसे महत्वपूर्ण सेवानिवृत्ति नंबर। कर्मचारी + नियोक्ता 12%, 8.15% ब्याज।',
        'page.ssa.h':           '👧 SSA + बाल शिक्षा योजनाकार',
        'page.ssa.sub':         'सुकन्या समृद्धि (8.2% कर-मुक्त, धारा 80C) + ELSS SIP · महंगाई-समायोजित लक्ष्य।',
        'common.presets':       'त्वरित प्रीसेट',
        'ssh.params':           'मापदंड',
        'ssh.epfdetails':       'आपकी EPF जानकारी',
        'ssh.ssa':              '🏦 सुकन्या समृद्धि खाता',
        'ssh.elss':             '📈 ELSS SIP टॉप-अप',
        'ssh.goals':            '🎯 लक्ष्य (आज का मूल्य — महंगाई स्वचालित रूप से समायोजित)',
        /* Splash */
        'splash.tagline':       'भारतीय धन सृजन कैलकुलेटर',
        'splash.login':         '🔑  लॉगिन',
        'splash.signup':        '✨  साइन अप',
        'splash.email':         'ईमेल पता',
        'splash.password':      'पासवर्ड',
        'splash.confirmpassword': 'पासवर्ड की पुष्टि करें',
        'splash.fname':         'पहला नाम',
        'splash.lname':         'अंतिम नाम',
        'splash.enterdash':     'डैशबोर्ड में प्रवेश करें →',
        'splash.createaccount': 'मेरा खाता बनाएं →',
        'mf.returns':'रिटर्न','mf.horizon':'अवधि','mf.details':'विवरण',
        /* MF Modal labels */
        'mf.modal.ret':      'सामान्य रिटर्न',
        'mf.modal.hor':      'न्यूनतम अवधि',
        'mf.modal.risk':     'जोखिम स्तर',
        'mf.modal.what':     'यह क्या है?',
        'mf.modal.when':     '✅ कब उपयोग करें / सर्वोत्तम परिदृश्य',
        'mf.modal.avoid':    '⚠️ कब उपयोग न करें',
        'mf.modal.eg':       '💡 भारतीय उदाहरण',
        /* Fund Picker labels */
        'picker.good':       'अच्छा',
        'picker.watchout':   'सावधान',
        'picker.protip':     '💡 प्रो टिप',
        'picker.eg':         '📖 भारतीय उदाहरण',
        'picker.mustknow':   'ज़रूर जानें',
        'picker.importance': 'महत्व',
        'picker.cat.returns':'रिटर्न',
        'picker.cat.risk':   'जोखिम',
        'picker.cat.cost':   'लागत और कर',
        'picker.cat.structure':'संरचना',
        /* CG table fund names & holding */
        'tg.fund.equity':   'इक्विटी MF / ETF',
        'tg.fund.elss':     'ELSS',
        'tg.fund.arb':      'आर्बिट्राज फंड',
        'tg.fund.debt':     'डेब्ट MF / FoF',
        'tg.fund.liquid':   'लिक्विड / अल्ट्रा-शॉर्ट',
        'tg.fund.gold':     'गोल्ड ETF / गोल्ड FoF',
        'tg.fund.intl':     'अंतर्राष्ट्रीय फंड',
        'tg.hold.gt1':      '> 1 वर्ष',
        'tg.hold.lt1':      '< 1 वर्ष',
        'tg.hold.any':      'कोई भी',
        /* Tax Guide */
        'tg.opt.title':      '⚖️ पुरानी बनाम नई व्यवस्था कर अनुकूलक',
        'tg.opt.sub':        'आय + कटौती दर्ज करें → तुरंत देखें कौन सी व्यवस्था अधिक बचाती है',
        'tg.opt.badge':      _fyStr + ' दरें',
        'tg.lbl.salary':     'वार्षिक सकल वेतन / CTC (₹)',
        'tg.lbl.other':      'अन्य आय (FD ब्याज, किराया…)',
        'tg.lbl.oldded':     'पुरानी व्यवस्था कटौतियां',
        'tg.lbl.oldded.note':'(केवल तभी प्रासंगिक जब पुरानी व्यवस्था जीते)',
        'tg.lbl.80c':        '80C',
        'tg.lbl.hra':        'HRA छूट',
        'tg.lbl.nps':        'NPS 80CCD(1B)',
        'tg.lbl.hl':         'गृह ऋण 24(b)',
        'tg.lbl.80d':        '80D स्वास्थ्य बीमा',
        'tg.lbl.otherded':   'अन्य कटौतियां',
        'tg.hint.80c':       'ELSS, PPF, LIC, EPF',
        'tg.hint.hra':       'मेट्रो 50%, गैर-मेट्रो 40%',
        'tg.hint.nps':       '80C से परे अतिरिक्त ₹50K',
        'tg.hint.hl':        'स्व-अधिकृत संपत्ति',
        'tg.hint.80d':       'स्वयं ₹25K + माता-पिता ₹50K',
        'tg.hint.otherded':  'LTA, प्रोफेशन टैक्स, 80E, 80G…',
        'tg.lbl.exp':        'मासिक जीवन व्यय (₹)',
        'tg.lbl.exp.note':   '— अधिशेष गणना के लिए',
        'tg.hint.exp':       'किराया + किराना + EMI + जीवनशैली — देखें प्रति माह कितना निवेश कर सकते हैं',
        'tg.lbl.epf':        'मासिक मूल वेतन (₹)',
        'tg.lbl.epf.note':   '— EPF कटौती के लिए',
        'tg.hint.epf':       'कर्मचारी EPF = मूल का 12%, टेक-होम से काटा जाता है। EPS (पेंशन) नियोक्ता के 12% का हिस्सा है — आपके वेतन से नहीं काटा जाता।',
        'tg.placeholder':    'तुलना देखने के लिए ऊपर अपना वेतन दर्ज करें',
        'tg.slab.title':     '📊 कर स्लैब विवरण (विजेता व्यवस्था)',
        'tg.surplus.title':  '💰 आपका निवेश योग्य अधिशेष',
        'tg.btn.sendplan':   '→ अधिशेष को वित्तीय योजना में मासिक निवेश के रूप में भेजें',
        'tg.disclaimer':     '* मानक कटौती ₹75K (नई) / ₹50K (पुरानी)। 4% उपकर शामिल। 87A छूट लागू। अधिभार नहीं दिखाया। केवल अनुमान — दाखिल करने से पहले CA से परामर्श करें।',
        'tg.cg.title':       '📊 MF पूंजीगत लाभ — वर्तमान दरें',
        'tg.tbl.type':       'फंड प्रकार',
        'tg.tbl.holding':    'होल्डिंग अवधि',
        'tg.tbl.taxtype':    'कर प्रकार',
        'tg.tbl.rate':       'दर',
        'tg.tbl.exempt':     'छूट',
        'tg.tbl.exempt125':  '₹1.25L/वर्ष छूट',
        'tg.tbl.noexempt':   'कोई छूट नहीं',
        'tg.tbl.nobenefit':  'कोई लाभ नहीं। FD के समान।',
        'tg.tbl.nobenefit2': 'कोई लाभ नहीं',
        'tg.tbl.intl':       '2023 के बाद डेब्ट की तरह माना जाता है',
        'tg.cg.note':        'वित्त अधिनियम 2023 ने डेब्ट MF पर इंडेक्सेशन पूरी तरह हटा दिया। वित्त अधिनियम 2024 ने STCG 20% और LTCG 12.5% किया, LTCG छूट ₹1L से ₹1.25L की। दाखिल करने से पहले वर्तमान दरें सत्यापित करें।',
        'tg.crypto.title':   '₿ क्रिप्टो / VDA कर — बजट 2022 नियम',
        'tg.crypto.flat':    'सभी लाभों पर एकमुश्त कर',
        'tg.crypto.flat.desc':'होल्डिंग अवधि का कोई लाभ नहीं। लाभ पर 30% कर, चाहे अल्पकालिक या दीर्घकालिक। VDA आय पर मूल छूट सीमा लागू नहीं।',
        'tg.crypto.tds':     'हर ट्रेड पर काटा जाता है',
        'tg.crypto.tds.desc':'₹10,000 से ऊपर हर क्रिप्टो लेनदेन पर 1% TDS स्रोत पर काटा जाता है। TDS को ITR दाखिल करते समय क्रेडिट के रूप में दावा किया जा सकता है।',
        'tg.crypto.nooffset':'नुकसान सेट-ऑफ नहीं हो सकता',
        'tg.crypto.nooffset.desc':'क्रिप्टो नुकसान किसी अन्य आय के विरुद्ध सेट-ऑफ नहीं हो सकता। प्रत्येक VDA अलग से माना जाता है। नुकसान का कैरी-फॉरवर्ड भी नहीं।',
        'tg.dates.title':    '📅 निवेशकों के लिए मुख्य कर तिथियां और सुझाव',
        'tg.dates.deadlines':'कर बचत की अंतिम तिथियां',
        'tg.dates.smartmoves':'स्मार्ट कर चाल',
        /* Tax Guide dynamic */
        'tg.win.new':        'नई व्यवस्था अधिक बचाती है',
        'tg.win.old':        'पुरानी व्यवस्था अधिक बचाती है',
        'tg.win.equal':      'दोनों व्यवस्थाएं समान कर देती हैं',
        'tg.win.save':       'बचत',
        'tg.regime.new':     'नई व्यवस्था',
        'tg.regime.old':     'पुरानी व्यवस्था',
        'tg.regime.either':  'कोई भी',
        'tg.res.best':       'सर्वोत्तम व्यवस्था',
        'tg.res.effrate':    'प्रभावी कर दर',
        'tg.res.marginal':   'सीमांत स्लैब',
        'tg.res.annual':     'वार्षिक टेक-होम',
        'tg.res.monthly':    'मासिक टेक-होम',
        'tg.res.cessnote':   'उपकर 4% शामिल। 87A छूट लागू। अधिभार नहीं दिखाया।',
        'tg.res.rebate87a':  '87A छूट: ₹12L तक की आय पर पूरा कर माफ (बजट 2025)',
        'tg.res.notax':      'कोई कर लागू नहीं',
        'tg.card.gross':     'सकल',
        'tg.card.ded':       'कटौतियां',
        'tg.card.taxable':   'कर योग्य',
        'tg.card.tax':       'कर',
        'tg.card.cess':      'उपकर (4%)',
        'tg.card.total':     'कुल कर',
        'tg.card.takehome':  'टेक-होम',
        'tg.sur.posttax':    'कर-पश्चात टेक-होम',
        'tg.sur.grossvia':   'सकल, के माध्यम से',
        'tg.sur.cashinhand': 'हाथ में नकद',
        'tg.sur.expenses':   'मासिक व्यय',
        'tg.sur.asentered':  'दर्ज अनुसार',
        'tg.sur.investable': 'मासिक निवेश योग्य अधिशेष',
        'tg.sur.savrate':    'बचत दर',
        'tg.sur.ofcash':     'हाथ में नकद का',
        'tg.sur.overspend':  'व्यय नकद से अधिक है। बजट की समीक्षा करें।',
        'tg.sur.free':       'मुक्त अधिशेष',
        'tg.epf.note1':      'EPF काटा गया:',
        'tg.epf.of':         'का',
        'tg.epf.note2':      'नियोक्ता भी जोड़ता है',
        'tg.epf.note3':      'आपके कोष में।',
        'tg.epf.corpus1':    '+ EPF बनाता है',
        'tg.epf.corpus2':    'आपके कोष में',
        'tg.epf.corpus3':    'आप + नियोक्ता',
        'tg.epf.each':       'प्रत्येक',
        'tg.lbl.empnps':     'नियोक्ता NPS योगदान 80CCD(2)',
        'tg.hint.empnps':    'आपके नियोक्ता का NPS योगदान (मूल वेतन का अधिकतम 10%)। धारा 80CCD(2) के तहत कटौती — ₹1.5L 80C सीमा से बाहर।',
        'tg.btn.reset':      'टैक्स गाइड रीसेट करें',
        'tg.tbl.lockinyrs':  '3 साल लॉक-इन',
        'tg.date1':  '📌 <strong>31 मार्च</strong> — इस FY के लिए 80C निवेश की अंतिम तिथि',
        'tg.date2':  '📌 <strong>31 जुलाई</strong> — ITR दाखिल करने की अंतिम तिथि (वेतनभोगी)',
        'tg.date3':  '📌 <strong>15 मार्च</strong> — अग्रिम कर 4th किस्त देय',
        'tg.date4':  '📌 <strong>31 अक्टूबर</strong> — ऑडिट के साथ ITR की अंतिम तिथि',
        'tg.tip1':   '✅ हर साल ₹1.25L LTCG कर-मुक्त बुक करें (इक्विटी MF)',
        'tg.tip2':   '✅ 80C के लिए ELSS — सबसे कम लॉक-इन + इक्विटी रिटर्न',
        'tg.tip3':   '✅ NPS 80CCD(1B) के तहत ₹50K अतिरिक्त कटौती देता है',
        'tg.tip4':   '✅ आर्बिट्राज फंड: FD ब्याज पर 30% के बजाय 12.5% LTCG',
        'tg.tip5':   '✅ धारा 87A छूट: नई व्यवस्था में ₹12L तक शून्य कर (बजट 2025)',
        'lbl.gr.type':          'निवेश प्रकार',
        /* Growth/Goal */
        'lbl.gr.goal':          'आपका लक्ष्य क्या है?',
        'lbl.gr.todaycost':     'आज की लागत (₹) — आज के मूल्य में',
        'lbl.gr.amount':        'राशि',
        'lbl.gr.years':         'समय अवधि (वर्ष)',
        'lbl.gr.expinfl':       'अपेक्षित महंगाई (%)',
        'lbl.gr.custom':        'कस्टम लक्ष्य रिटर्न (%)',
        'res.gr.projhead':      'अनुमानित परिणाम',
        'res.gr.goalhead':      'लक्ष्य परिणाम',
        'res.gr.invested':      'कुल निवेश',
        'res.gr.reqinv':        'लक्ष्य तक पहुंचने के लिए आवश्यक निवेश',
        'res.gr.recominv':      'अनुशंसित भारतीय निवेश',
        /* Home Loan */
        'lbl.hl.amount':        'ऋण राशि (₹)',
        'lbl.hl.rate':          'वार्षिक ब्याज दर (%)',
        'lbl.hl.tenure':        'ऋण अवधि (वर्ष)',
        'lbl.hl.month':         'शुरुआत माह (वैकल्पिक)',
        'lbl.hl.origamt':       'मूल ऋण राशि (₹)',
        'lbl.hl.ratepа':        'ब्याज दर (% प्रति वर्ष)',
        'lbl.hl.origten':       'मूल अवधि (वर्ष)',
        'lbl.hl.prepay':        'एकमुश्त प्रीपेमेंट राशि (₹)',
        'lbl.hl.prepayafter':   'प्रीपेमेंट (ऋण में वर्षों के बाद)',
        'lbl.hl.proprice':      'संपत्ति मूल्य (₹)',
        'lbl.hl.down':          'डाउन पेमेंट (₹)',
        'lbl.hl.loanrate':      'ऋण ब्याज दर (% प्रति वर्ष)',
        'lbl.hl.propapp':       'संपत्ति वृद्धि (% प्रति वर्ष)',
        'lbl.hl.maint':         'वार्षिक रखरखाव + कर (₹)',
        'lbl.hl.rent':          'मासिक किराया (₹)',
        'lbl.hl.rentinc':       'वार्षिक किराया वृद्धि (%)',
        'lbl.hl.investret':     'बचाई पूंजी पर निवेश रिटर्न (%)',
        'lbl.hl.horizon':       'तुलना क्षितिज (वर्ष)',
        'lbl.hl.taxamt':        'गृह ऋण राशि (₹)',
        'lbl.hl.taxslab':       'आपका कर स्लैब (%)',
        'lbl.hl.proptype':      'संपत्ति प्रकार',
        'lbl.gr.rate':          'अपेक्षित रिटर्न (%)',
        'lbl.gr.inflation':     'महंगाई के लिए समायोजित करें',
        'res.gr.title':         'अनुमानित भविष्य मूल्य',
        'res.gr.interest':      'कुल ब्याज',
        'lbl.su.amount':        'मासिक SIP (₹)',
        'lbl.su.rate':          'वार्षिक रिटर्न (%)',
        'lbl.su.years':         'अवधि (वर्ष)',
        'lbl.su.stepup':        'स्टेप-अप (%/वर्ष)',
        'res.su.flat':          '📉 फ्लैट SIP कोष',
        'res.su.stepup':        '⚡ स्टेप-अप कोष',
        'res.su.extra':         'स्टेप-अप से अतिरिक्त धन',
        'res.su.extrainv':      'अतिरिक्त निवेश',
        'res.su.finalsip':      'अंतिम SIP/माह',
        'res.su.mult':          'कोष गुणक',
        'res.su.combined':      'कुल संयुक्त',
        'lbl.epf.basic':        'मूल + DA वेतन (₹/माह)',
        'lbl.epf.balance':      'वर्तमान EPF बैलेंस (₹)',
        'lbl.epf.age':          'वर्तमान आयु (वर्ष)',
        'lbl.epf.retire':       'सेवानिवृत्ति आयु (वर्ष)',
        'lbl.epf.growth':       'वेतन वृद्धि (%/वर्ष)',
        'lbl.epf.rate':         'EPF ब्याज दर (%)',
        'res.epf.corpus':       'सेवानिवृत्ति पर EPF कोष',
        'res.epf.interest':     'कुल अर्जित ब्याज',
        'res.epf.contrib':      'कुल योगदान',
        'res.epf.monthly':      'समतुल्य मासिक योगदान',
        'res.epf.years':        'सेवानिवृत्ति तक वर्ष',
        'res.epf.mult':         'ब्याज गुणक',
        'res.epf.salary':       'अंतिम मूल वेतन',
        'res.epf.pension':      'पेंशन (EPS)',
        'res.epf.table':        'वर्षवार EPF पासबुक',
        'lbl.ssa.dobyear':      'बेटी का जन्म वर्ष',
        'lbl.ssa.annual':       'वार्षिक SSA जमा (₹)',
        'lbl.ssa.tenure':       'जमा अवधि (वर्ष)',
        'lbl.ssa.inflation':    'शिक्षा महंगाई (%/वर्ष)',
        'lbl.ssa.elss':         'मासिक ELSS SIP (₹)',
        'lbl.ssa.elssret':      'ELSS रिटर्न (%/वर्ष)',
        'lbl.ssa.edu':          'शिक्षा लक्ष्य (₹ आज)',
        'lbl.ssa.marr':         'विवाह लक्ष्य (₹ आज)',
        'res.ssa.maturity':     'SSA परिपक्वता',
        'res.ssa.elss':         'ELSS कोष',
        'res.ssa.total':        'कुल संयुक्त',
        'res.ssa.inflcosts':    '📊 महंगाई-समायोजित भविष्य लागत',
        'res.ssa.goaltitle':    'महंगाई-समायोजित लागत के सापेक्ष लक्ष्य कवरेज',
        'res.ssa.invested':     'SSA निवेश',
        'res.ssa.interest':     'SSA ब्याज',
        'res.ssa.elssgins':     'ELSS लाभ',
        'res.ssa.tax80c':       '80C बचत',
        'res.ssa.table':        'वर्षवार SSA पासबुक',
        'lbl.hs.income':        'मासिक टेक-होम आय',
        'lbl.hs.emi':           'मासिक EMI / ऋण भुगतान',
        'lbl.hs.exp':           'मासिक जीवन व्यय',
        'lbl.hs.sav':           'मासिक बचत और निवेश',
        'lbl.hs.health':        'स्वास्थ्य बीमा कवरेज (कुल)',
        'lbl.hs.term':          'टर्म जीवन बीमा कवरेज',
        'lbl.hs.ef':            'आपातकालीन निधि (कुल)',
        'hs.grade.rockstar':    'वित्तीय सुपरस्टार 🤘',
        'hs.desc.rockstar':     'आपकी वित्त स्थिति शानदार है! वॉरेन बफेट को टक्कर दे सकते हैं।',
        'hs.grade.builder':     'धन निर्माता',
        'hs.desc.builder':      'आप सही रास्ते पर हैं। थोड़े बदलाव और आप अजेय होंगे!',
        'hs.grade.track':       'सही राह पर',
        'hs.desc.track':        'अच्छी नींव! कुछ कमियाँ हैं — आगे बढ़ते रहें।',
        'hs.grade.getting':     'सुधार की ओर',
        'hs.desc.getting':      'आप जागरूक हैं — यही पहला कदम है। एक-एक करके खामियाँ दूर करें!',
        'hs.grade.wakeup':      'जागो अब!',
        'hs.desc.wakeup':       'आपके पैसे को गंभीर बातचीत की ज़रूरत है। आप यह पढ़ रहे हैं — बदलाव शुरू!',
        'hs.grade.sos':         'SOS मोड',
        'hs.desc.sos':          'समस्या बड़ी है, लेकिन हर वित्तीय सुपरहीरो की एक शुरुआत होती है। आपकी आज।',
        'hs.grade.emergency':   'वित्तीय आपातकाल',
        'hs.desc.emergency':    'अंतर बड़ा है लेकिन पाटा जा सकता है। नीचे दिए सिर्फ एक काम से शुरू करें।',
        'hs.notscored':         'अभी स्कोर नहीं',
        'hs.crushing':          '🎉 आप शानदार कर रहे हैं! कोई तत्काल कार्रवाई ज़रूरी नहीं।',
        'hs.cat.savings':       'बचत दर',
        'hs.cat.debt':          'कर्ज का बोझ',
        'hs.cat.health':        'स्वास्थ्य बीमा',
        'hs.cat.term':          'टर्म बीमा',
        'hs.cat.ef':            'आपातकालीन निधि',
        'hs.cat.spend':         'खर्च नियंत्रण',
        'hs.cat.age':           'आयु तैयारी',
        'hs.pie.savings':       'बचत और निवेश',
        'hs.pie.emi':           'EMI / ऋण',
        'hs.pie.exp':           'जीवन व्यय',
        'hs.pie.cash':          'मुक्त नकद',
      },

      te: {
        'tagline':              'పెరగండి మరియు భారత్ ను పెంచండి',
        'nav.back':             '⬅ డాష్‌బోర్డ్',
        'nav.resetData':        '🗑 నా డేటా రీసెట్',
        'nav.signOut':          'సైన్ అవుట్',
        'dash.welcome.h':       '🌟 మీరు నేడు ఏమి చేయాలనుకుంటున్నారు?',
        'dash.welcome.p':       'భారత్ యొక్క పూర్తి ఆర్థిక నియోజన సాధనం — ఏదైనా మాడ్యూల్ ఎంచుకోండి',
        'dash.cat.calc':        '⚡ కాలిక్యులేటర్లు',
        'dash.cat.mf':          '📊 మ్యూచువల్ ఫండ్లు',
        'dash.cat.plan':        '🗺️ ప్లానింగ్ & పన్ను',
        'dash.tip':             'పెట్టుబడిలో కొత్తవారా? ఇక్కడ మొదలుపెట్టండి',
        'card.growth.title':    'గ్రోత్ కాలిక్యులేటర్',
        'card.growth.desc':     'చక్రవడ్డీ · ఒకేసారి · SIP · ద్రవ్యోల్బణ సర్దుబాటు',
        'card.goal.title':      'లక్ష్య నిర్దేశకుడు',
        'card.goal.desc':       'విద్య · వివాహం · పదవీ విరమణ · వర్గ ద్రవ్యోల్బణ ప్రీసెట్లు',
        'card.ef.title':        'అత్యవసర నిధి',
        'card.ef.desc':         'మీకు ఎంత భద్రతా వల అవసరం · 3–12 నెలల కాలిక్యులేటర్',
        'card.hl.title':        'గృహ రుణ సలహాదారు',
        'card.hl.desc':         'EMI · ముందస్తు చెల్లింపు · అద్దె vs కొనుగోలు · Sec 24(b)',
        'card.su.title':        'స్టెప్-అప్ SIP కాలిక్యులేటర్',
        'card.su.desc':         'ఫ్లాట్ SIP vs 10% వార్షిక స్టెప్-అప్ · భారీ తేడా చూడండి',
        'card.epf.title':       'EPF కార్పస్ ప్రొజెక్టర్',
        'card.epf.desc':        'బేసిక్ జీతం · యాజమాన్యం వాటా · రిటైర్‌మెంట్ కార్పస్',
        'card.mfe.title':       'MF ఎక్స్‌ప్లోరర్',
        'card.mfe.desc':        'లైవ్ NAV · సిగ్నల్ స్కోరింగ్ · ఫండ్ పోల్పాటు · 1000+ ఫండ్లు',
        'card.mfk.title':       'MF కిట్',
        'card.mfk.desc':        'మీకు ఏ ఫండ్ నప్పుతుంది · ఈక్విటీ · డెట్ · హైబ్రిడ్',
        'card.fp.title':        'ఫండ్ పికర్ గైడ్',
        'card.fp.desc':         'ఆల్ఫా · షార్పే · సార్టినో · వ్యయ నిష్పత్తి · మెట్రిక్స్',
        'card.finplan.title':   'ఆర్థిక ప్రణాళిక',
        'card.finplan.desc':    'వ్యక్తిగత SIP ప్లాన్ · లక్ష్యాలు · రిస్క్ ప్రొఫైల్',
        'card.tax.title':       'పన్ను మార్గదర్శి',
        'card.tax.desc':        'పాత vs కొత్త విధానం · MF మూలధన లాభాలు · క్రిప్టో పన్ను',
        'card.hs.title':        'ఆర్థిక ఆరోగ్య స్కోర్',
        'card.hs.desc':         'మీ ధన జీవితానికి నిజాయితీగా స్కోర్ పొందండి',
        'card.ssa.title':       'SSA + బాలికా విద్య ప్లానర్',
        'card.ssa.desc':        'సుకన్య సమృద్ధి 8.2% · ELSS SIP · అమ్మాయి చదువు & వివాహం',
        'page.growth.h':        'గ్రోత్ కాలిక్యులేటర్',
        'page.growth.sub':      'చక్రవడ్డీతో మీ డబ్బు ఎలా పెరుగుతుందో చూడండి.',
        'page.goal.h':          'లక్ష్య నిర్దేశకుడు',
        'page.goal.sub':        'మీ ఆర్థిక లక్ష్యాలు చేరుకోవడానికి నెలవారీ ఎంత పెట్టుబడి పెట్టాలో.',
        'page.ef.h':            'అత్యవసర నిధి కాలిక్యులేటర్',
        'page.ef.sub':          'మీ నెలవారీ ఖర్చులు నమోదు చేసి సిఫారసు చేయబడిన నిధి తెలుసుకోండి.',
        'page.mfkit.h':         '💼 మ్యూచువల్ ఫండ్ కిట్',
        'page.mfkit.sub':       'ఏదైనా ఫండ్ రకాన్ని నొక్కండి మరియు దాన్ని ఎప్పుడు ఉపయోగించాలో తెలుసుకోండి.',
        'page.funder.h':        '🔬 నాణ్యమైన మ్యూచువల్ ఫండ్ ఎలా ఎంచుకోవాలి',
        'page.funder.sub':      'ఈ మెట్రిక్స్ ఫండ్ తన పనిని సరిగ్గా చేస్తుందో లేదో చెప్తాయి.',
        'page.hs.h':            'ఆర్థిక ఆరోగ్య స్కోర్',
        'page.hs.sub':          'మీ ఆర్థిక వివరాలు నమోదు చేసి నిజాయితీగా స్కోర్ పొందండి. 📋',
        'page.fp.h':            'ఆర్థిక ప్రణాళిక నిర్మాత',
        'page.fp.sub':          'కొన్ని ప్రశ్నలకు సమాధానమివ్వండి. మీకోసం వ్యక్తిగతీకరించిన పోర్ట్‌ఫోలియో పొందండి.',
        'page.mfe.h':           '🔭 భారతీయ MF ఎక్స్‌ప్లోరర్',
        'page.mfe.sub':         'AMFI నుండి లైవ్ NAV · స్వయంచాలక స్కోరింగ్ · టాప్ AMC',
        'page.tg.h':            '🧾 భారత పన్ను మార్గదర్శి',
        'page.tg.sub':          'పాత vs కొత్త విధానం · MF మూలధన లాభాలు · క్రిప్టో పన్ను · ELSS',
        'page.hl.h':            '🏠 గృహ రుణ సలహాదారు',
        'page.hl.sub':          'EMI కాలిక్యులేటర్ · ముందస్తు చెల్లింపు లాభం · అద్దె vs కొనుగోలు',
        'page.su.h':            '📈 స్టెప్-అప్ SIP కాలిక్యులేటర్',
        'page.su.sub':          'ప్రతి సంవత్సరం SIP 10–15% పెంచండి. భారీ తేడా చూడండి.',
        'page.epf.h':           '🏦 EPF కార్పస్ ప్రొజెక్టర్',
        'page.epf.sub':         'భారత్ లో అత్యంత ముఖ్యమైన రిటైర్‌మెంట్ నంబర్. ఉద్యోగి + యాజమాన్యం 12%, 8.15% వడ్డీ.',
        'page.ssa.h':           '👧 SSA + బాలికా విద్య ప్లానర్',
        'page.ssa.sub':         'సుకన్య సమృద్ధి (8.2% పన్ను రహిత, Sec 80C) + ELSS SIP · ద్రవ్యోల్బణ సర్దుబాటు లక్ష్యాలు.',
        'common.presets':       'శీఘ్ర ప్రీసెట్లు',
        'ssh.params':           'మాపదండాలు',
        'ssh.epfdetails':       'మీ EPF వివరాలు',
        'ssh.ssa':              '🏦 సుకన్య సమృద్ధి ఖాతా',
        'ssh.elss':             '📈 ELSS SIP టాప్-అప్',
        'ssh.goals':            '🎯 లక్ష్యాలు (నేటి వ్యయం — ద్రవ్యోల్బణం స్వయంచాలకంగా సర్దుబాటు)',
        /* Splash */
        'splash.tagline':       'భారతీయ సంపద నిర్మాణ కాలిక్యులేటర్',
        'splash.login':         '🔑  లాగిన్',
        'splash.signup':        '✨  సైన్ అప్',
        'splash.email':         'ఇమెయిల్ చిరునామా',
        'splash.password':      'పాస్‌వర్డ్',
        'splash.confirmpassword': 'పాస్‌వర్డ్ నిర్ధారించండి',
        'splash.fname':         'మొదటి పేరు',
        'splash.lname':         'చివరి పేరు',
        'splash.enterdash':     'డాష్‌బోర్డ్‌లోకి ప్రవేశించండి →',
        'splash.createaccount': 'నా ఖాతా సృష్టించండి →',
        'mf.returns':'రాబడి','mf.horizon':'కాలం','mf.details':'వివరాలు',
        /* MF Modal labels */
        'mf.modal.ret':      'సాధారణ రాబడి',
        'mf.modal.hor':      'కనీస కాలం',
        'mf.modal.risk':     'రిస్క్ స్థాయి',
        'mf.modal.what':     'ఇది ఏమిటి?',
        'mf.modal.when':     '✅ ఎప్పుడు ఉపయోగించాలి / ఉత్తమ సందర్భాలు',
        'mf.modal.avoid':    '⚠️ ఎప్పుడు ఉపయోగించకూడదు',
        'mf.modal.eg':       '💡 భారతీయ ఉదాహరణ',
        /* Fund Picker labels */
        'picker.good':       'మంచిది',
        'picker.watchout':   'జాగ్రత్త',
        'picker.protip':     '💡 ప్రో టిప్',
        'picker.eg':         '📖 భారతీయ ఉదాహరణ',
        'picker.mustknow':   'తప్పక తెలుసుకోండి',
        'picker.importance': 'ప్రాముఖ్యత',
        'picker.cat.returns':'రాబడి',
        'picker.cat.risk':   'రిస్క్',
        'picker.cat.cost':   'ఖర్చు & పన్ను',
        'picker.cat.structure':'నిర్మాణం',
        /* CG table fund names & holding */
        'tg.fund.equity':   'ఈక్విటీ MF / ETF',
        'tg.fund.elss':     'ELSS',
        'tg.fund.arb':      'ఆర్బిట్రేజ్ ఫండ్',
        'tg.fund.debt':     'డెట్ MF / FoF',
        'tg.fund.liquid':   'లిక్విడ్ / అల్ట్రా-షార్ట్',
        'tg.fund.gold':     'గోల్డ్ ETF / గోల్డ్ FoF',
        'tg.fund.intl':     'అంతర్జాతీయ ఫండ్',
        'tg.hold.gt1':      '> 1 సంవత్సరం',
        'tg.hold.lt1':      '< 1 సంవత్సరం',
        'tg.hold.any':      'ఏదైనా',
        /* Tax Guide */
        'tg.opt.title':      '⚖️ పాత vs కొత్త విధానం పన్ను అనుకూలకుడు',
        'tg.opt.sub':        'ఆదాయం + మినహాయింపులు నమోదు చేయండి → ఏ విధానం ఎక్కువ ఆదా చేస్తుందో తక్షణం చూడండి',
        'tg.opt.badge':      _fyStr + ' రేట్లు',
        'tg.lbl.salary':     'వార్షిక మొత్తం జీతం / CTC (₹)',
        'tg.lbl.other':      'ఇతర ఆదాయం (FD వడ్డీ, అద్దె…)',
        'tg.lbl.oldded':     'పాత విధానం మినహాయింపులు',
        'tg.lbl.oldded.note':'(పాత విధానం గెలిచినప్పుడు మాత్రమే వర్తిస్తుంది)',
        'tg.lbl.80c':        '80C',
        'tg.lbl.hra':        'HRA మినహాయింపు',
        'tg.lbl.nps':        'NPS 80CCD(1B)',
        'tg.lbl.hl':         'గృహ రుణం 24(b)',
        'tg.lbl.80d':        '80D ఆరోగ్య బీమా',
        'tg.lbl.otherded':   'ఇతర మినహాయింపులు',
        'tg.hint.80c':       'ELSS, PPF, LIC, EPF',
        'tg.hint.hra':       'మెట్రో 50%, నాన్-మెట్రో 40%',
        'tg.hint.nps':       '80C కి అదనంగా ₹50K',
        'tg.hint.hl':        'స్వంత నివాసం',
        'tg.hint.80d':       'స్వంత ₹25K + తల్లిదండ్రులు ₹50K',
        'tg.hint.otherded':  'LTA, వృత్తి పన్ను, 80E, 80G…',
        'tg.lbl.exp':        'నెలవారీ జీవన ఖర్చులు (₹)',
        'tg.lbl.exp.note':   '— మిగులు గణన కోసం',
        'tg.hint.exp':       'అద్దె + కిరాణా + EMI + జీవనశైలి — నెలకు ఎంత పెట్టుబడి పెట్టగలరో చూడండి',
        'tg.lbl.epf':        'నెలవారీ మూల జీతం (₹)',
        'tg.lbl.epf.note':   '— EPF కోత కోసం',
        'tg.hint.epf':       'ఉద్యోగి EPF = మూల జీతంలో 12%, టేక్-హోమ్ నుండి తీసివేయబడుతుంది. EPS (పెన్షన్) యాజమాన్యం 12% లో భాగం — మీ జీతం నుండి తీసివేయబడదు.',
        'tg.placeholder':    'పోలిక చూడడానికి పైన మీ జీతం నమోదు చేయండి',
        'tg.slab.title':     '📊 పన్ను స్లాబ్ వివరణ (విజయ విధానం)',
        'tg.surplus.title':  '💰 మీ పెట్టుబడి యోగ్యమైన మిగులు',
        'tg.btn.sendplan':   '→ మిగులును నెలవారీ పెట్టుబడిగా ఆర్థిక ప్రణాళికకు పంపండి',
        'tg.disclaimer':     '* ప్రమాణ మినహాయింపు ₹75K (కొత్త) / ₹50K (పాత). 4% సెస్ పరిగణించబడింది. 87A రిబేట్ వర్తించబడింది. అధిభారం చూపబడలేదు. అంచనా మాత్రమే — దాఖలు చేయడానికి ముందు CA ని సంప్రదించండి.',
        'tg.cg.title':       '📊 MF మూలధన లాభాలు — ప్రస్తుత రేట్లు',
        'tg.tbl.type':       'ఫండ్ రకం',
        'tg.tbl.holding':    'హోల్డింగ్ కాలం',
        'tg.tbl.taxtype':    'పన్ను రకం',
        'tg.tbl.rate':       'రేటు',
        'tg.tbl.exempt':     'మినహాయింపు',
        'tg.tbl.exempt125':  '₹1.25L/సంవత్సరం మినహాయింపు',
        'tg.tbl.noexempt':   'మినహాయింపు లేదు',
        'tg.tbl.nobenefit':  'లాభం లేదు. FD కి సమానం.',
        'tg.tbl.nobenefit2': 'లాభం లేదు',
        'tg.tbl.intl':       '2023 తర్వాత డెట్‌గా పరిగణించబడుతుంది',
        'tg.cg.note':        'FA 2023 డెట్ MF ల ఇండెక్సేషన్‌ను పూర్తిగా తొలగించింది. FA 2024 STCG 20% మరియు LTCG 12.5% పెంచింది, LTCG మినహాయింపు ₹1L నుండి ₹1.25L కి. దాఖలు చేయడానికి ముందు ప్రస్తుత రేట్లు ధృవీకరించండి.',
        'tg.crypto.title':   '₿ క్రిప్టో / VDA పన్ను — బడ్జెట్ 2022 నిబంధనలు',
        'tg.crypto.flat':    'అన్ని లాభాలపై ఫ్లాట్ పన్ను',
        'tg.crypto.flat.desc':'హోల్డింగ్ కాలం ప్రయోజనం లేదు. లాభాలు స్వల్పకాలికమైనా దీర్ఘకాలికమైనా 30% పన్ను. VDA ఆదాయంపై మూల మినహాయింపు వర్తించదు.',
        'tg.crypto.tds':     'ప్రతి ట్రేడ్‌పై తీసివేయబడుతుంది',
        'tg.crypto.tds.desc':'₹10,000 పైన ప్రతి క్రిప్టో లావాదేవీపై మూలం వద్ద 1% TDS తీసివేయబడుతుంది. ITR దాఖలు చేసేటప్పుడు TDS క్రెడిట్‌గా క్లెయిమ్ చేయవచ్చు.',
        'tg.crypto.nooffset':'నష్టాలు సెట్-ఆఫ్ కాలేవు',
        'tg.crypto.nooffset.desc':'క్రిప్టో నష్టాలు వేరే ఆదాయానికి వ్యతిరేకంగా సెట్-ఆఫ్ కాలేవు. ప్రతి VDA వేర్వేరుగా పరిగణించబడుతుంది. నష్టాల క్యారీ-ఫార్వర్డ్ కూడా లేదు.',
        'tg.dates.title':    '📅 పెట్టుబడిదారులకు ముఖ్యమైన పన్ను తేదీలు మరియు చిట్కాలు',
        'tg.dates.deadlines':'పన్ను ఆదా గడువు తేదీలు',
        'tg.dates.smartmoves':'స్మార్ట్ పన్ను చర్యలు',
        /* Tax Guide dynamic */
        'tg.win.new':        'కొత్త విధానం ఎక్కువ ఆదా చేస్తుంది',
        'tg.win.old':        'పాత విధానం ఎక్కువ ఆదా చేస్తుంది',
        'tg.win.equal':      'రెండు విధానాలు సమాన పన్ను విధిస్తాయి',
        'tg.win.save':       'ఆదా',
        'tg.regime.new':     'కొత్త విధానం',
        'tg.regime.old':     'పాత విధానం',
        'tg.regime.either':  'ఏదైనా',
        'tg.res.best':       'ఉత్తమ విధానం',
        'tg.res.effrate':    'సమర్థమైన పన్ను రేటు',
        'tg.res.marginal':   'అంచు స్లాబ్',
        'tg.res.annual':     'వార్షిక టేక్-హోమ్',
        'tg.res.monthly':    'నెలవారీ టేక్-హోమ్',
        'tg.res.cessnote':   'సెస్ 4% పరిగణించబడింది. 87A రిబేట్ వర్తించబడింది. అధిభారం చూపబడలేదు.',
        'tg.res.rebate87a':  '87A రిబేట్: ₹12L వరకు ఆదాయంపై పూర్తి పన్ను మాఫీ (బడ్జెట్ 2025)',
        'tg.res.notax':      'పన్ను వర్తించదు',
        'tg.card.gross':     'మొత్తం',
        'tg.card.ded':       'మినహాయింపులు',
        'tg.card.taxable':   'పన్ను విధించదగినది',
        'tg.card.tax':       'పన్ను',
        'tg.card.cess':      'సెస్ (4%)',
        'tg.card.total':     'మొత్తం పన్ను',
        'tg.card.takehome':  'టేక్-హోమ్',
        'tg.sur.posttax':    'పన్ను తర్వాత టేక్-హోమ్',
        'tg.sur.grossvia':   'మొత్తం, ద్వారా',
        'tg.sur.cashinhand': 'చేతిలో నగదు',
        'tg.sur.expenses':   'నెలవారీ ఖర్చులు',
        'tg.sur.asentered':  'నమోదు చేసినట్లు',
        'tg.sur.investable': 'నెలవారీ పెట్టుబడి యోగ్యమైన మిగులు',
        'tg.sur.savrate':    'పొదుపు రేటు',
        'tg.sur.ofcash':     'చేతిలో నగదు యొక్క',
        'tg.sur.overspend':  'ఖర్చులు చేతిలో నగదును మించాయి. బడ్జెట్ సమీక్షించండి.',
        'tg.sur.free':       'స్వేచ్ఛా మిగులు',
        'tg.epf.note1':      'EPF తగ్గింపు:',
        'tg.epf.of':         'యొక్క',
        'tg.epf.note2':      'యాజమాన్యం కూడా జోడిస్తుంది',
        'tg.epf.note3':      'మీ కార్పస్‌కు.',
        'tg.epf.corpus1':    '+ EPF నిర్మిస్తుంది',
        'tg.epf.corpus2':    'మీ కార్పస్‌లో',
        'tg.epf.corpus3':    'మీరు + యాజమాన్యం',
        'tg.epf.each':       'ప్రతీ',
        'tg.lbl.empnps':     'యాజమాన్యం NPS సహకారం 80CCD(2)',
        'tg.hint.empnps':    'మీ యాజమాన్యం NPS సహకారం (మూల జీతంలో గరిష్టంగా 10%). Sec 80CCD(2) కింద మినహాయింపు — ₹1.5L 80C పరిమితికి వెలుపల.',
        'tg.btn.reset':      'పన్ను గైడ్ రీసెట్ చేయండి',
        'tg.tbl.lockinyrs':  '3 సంవత్సరాల లాక్-ఇన్',
        'tg.date1':  '📌 <strong>31 మార్చి</strong> — ఈ FY కి 80C పెట్టుబడి చివరి తేదీ',
        'tg.date2':  '📌 <strong>31 జులై</strong> — ITR దాఖలు గడువు (వేతనజీవులు)',
        'tg.date3':  '📌 <strong>15 మార్చి</strong> — అడ్వాన్స్ పన్ను 4వ వాయిదా',
        'tg.date4':  '📌 <strong>31 అక్టోబర్</strong> — ఆడిట్ తో ITR గడువు',
        'tg.tip1':   '✅ ప్రతి సంవత్సరం ₹1.25L LTCG పన్ను రహితంగా బుక్ చేయండి (ఈక్విటీ MF)',
        'tg.tip2':   '✅ 80C కి ELSS — అత్యల్ప లాక్-ఇన్ + ఈక్విటీ రాబడి',
        'tg.tip3':   '✅ NPS 80CCD(1B) కింద ₹50K అదనపు మినహాయింపు ఇస్తుంది',
        'tg.tip4':   '✅ ఆర్బిట్రేజ్ ఫండ్లు: FD వడ్డీపై 30% కాదు 12.5% LTCG',
        'tg.tip5':   '✅ Sec 87A రిబేట్: కొత్త విధానంలో ₹12L వరకు సున్నా పన్ను (బడ్జెట్ 2025)',
        'lbl.gr.type':          'పెట్టుబడి రకం',
        /* Growth/Goal */
        'lbl.gr.goal':          'మీ లక్ష్యం ఏమిటి?',
        'lbl.gr.todaycost':     'నేటి వ్యయం (₹) — నేటి మూల్యంలో',
        'lbl.gr.amount':        'మొత్తం',
        'lbl.gr.years':         'కాల వ్యవధి (సంవత్సరాలు)',
        'lbl.gr.expinfl':       'అంచనా ద్రవ్యోల్బణం (%)',
        'lbl.gr.custom':        'కస్టమ్ లక్ష్య రాబడి (%)',
        'res.gr.projhead':      'అంచనా ఫలితాలు',
        'res.gr.goalhead':      'లక్ష్య ఫలితాలు',
        'res.gr.invested':      'మొత్తం పెట్టుబడి',
        'res.gr.reqinv':        'లక్ష్యం చేరుకోవడానికి అవసరమైన పెట్టుబడి',
        'res.gr.recominv':      'సిఫారసు చేయబడిన భారతీయ పెట్టుబడులు',
        /* Home Loan */
        'lbl.hl.amount':        'రుణ మొత్తం (₹)',
        'lbl.hl.rate':          'వార్షిక వడ్డీ రేటు (%)',
        'lbl.hl.tenure':        'రుణ కాలం (సంవత్సరాలు)',
        'lbl.hl.month':         'ప్రారంభ నెల (ఐచ్ఛికం)',
        'lbl.hl.origamt':       'అసలు రుణ మొత్తం (₹)',
        'lbl.hl.ratepа':        'వడ్డీ రేటు (% వార్షిక)',
        'lbl.hl.origten':       'అసలు కాలం (సంవత్సరాలు)',
        'lbl.hl.prepay':        'ఒకేసారి ముందస్తు చెల్లింపు (₹)',
        'lbl.hl.prepayafter':   'ముందస్తు చెల్లింపు తర్వాత (రుణంలో సంవత్సరాలు)',
        'lbl.hl.proprice':      'ఆస్తి ధర (₹)',
        'lbl.hl.down':          'డౌన్ పేమెంట్ (₹)',
        'lbl.hl.loanrate':      'రుణ వడ్డీ రేటు (% వార్షిక)',
        'lbl.hl.propapp':       'ఆస్తి మెచ్చుకోలు (% వార్షిక)',
        'lbl.hl.maint':         'వార్షిక నిర్వహణ + పన్ను (₹)',
        'lbl.hl.rent':          'నెలవారీ అద్దె (₹)',
        'lbl.hl.rentinc':       'వార్షిక అద్దె పెరుగుదల (%)',
        'lbl.hl.investret':     'ఆదా చేసిన మూలధనంపై పెట్టుబడి రాబడి (%)',
        'lbl.hl.horizon':       'పోలిక వ్యవధి (సంవత్సరాలు)',
        'lbl.hl.taxamt':        'గృహ రుణ మొత్తం (₹)',
        'lbl.hl.taxslab':       'మీ పన్ను స్లాబ్ (%)',
        'lbl.hl.proptype':      'ఆస్తి రకం',
        'lbl.gr.rate':          'అంచనా రాబడి (%)',
        'lbl.gr.inflation':     'ద్రవ్యోల్బణానికి సర్దుబాటు చేయండి',
        'res.gr.title':         'అంచనా భవిష్యత్ విలువ',
        'res.gr.interest':      'మొత్తం వడ్డీ',
        'lbl.su.amount':        'నెలవారీ SIP (₹)',
        'lbl.su.rate':          'వార్షిక రాబడి (%)',
        'lbl.su.years':         'కాలం (సంవత్సరాలు)',
        'lbl.su.stepup':        'స్టెప్-అప్ (%/సంవత్సరం)',
        'res.su.flat':          '📉 ఫ్లాట్ SIP కార్పస్',
        'res.su.stepup':        '⚡ స్టెప్-అప్ కార్పస్',
        'res.su.extra':         'స్టెప్-అప్ నుండి అదనపు సంపద',
        'res.su.extrainv':      'అదనపు పెట్టుబడి',
        'res.su.finalsip':      'చివరి SIP/నెల',
        'res.su.mult':          'కార్పస్ గుణకం',
        'res.su.combined':      'మొత్తం కలిపి',
        'lbl.epf.basic':        'బేసిక్ + DA జీతం (₹/నెల)',
        'lbl.epf.balance':      'ప్రస్తుత EPF నిల్వ (₹)',
        'lbl.epf.age':          'ప్రస్తుత వయసు (సంవత్సరాలు)',
        'lbl.epf.retire':       'రిటైర్‌మెంట్ వయసు (సంవత్సరాలు)',
        'lbl.epf.growth':       'జీతం వృద్ధి (%/సంవత్సరం)',
        'lbl.epf.rate':         'EPF వడ్డీ రేటు (%)',
        'res.epf.corpus':       'రిటైర్‌మెంట్ వద్ద EPF కార్పస్',
        'res.epf.interest':     'మొత్తం అర్జించిన వడ్డీ',
        'res.epf.contrib':      'మొత్తం సహకారం',
        'res.epf.monthly':      'సమతుల్య నెలవారీ సహకారం',
        'res.epf.years':        'రిటైర్‌మెంట్‌కు సంవత్సరాలు',
        'res.epf.mult':         'వడ్డీ గుణకం',
        'res.epf.salary':       'చివరి బేసిక్ జీతం',
        'res.epf.pension':      'పెన్షన్ (EPS)',
        'res.epf.table':        'సంవత్సరవారీ EPF పాస్‌బుక్',
        'lbl.ssa.dobyear':      'అమ్మాయి జన్మ సంవత్సరం',
        'lbl.ssa.annual':       'వార్షిక SSA జమ (₹)',
        'lbl.ssa.tenure':       'జమ కాలం (సంవత్సరాలు)',
        'lbl.ssa.inflation':    'విద్య ద్రవ్యోల్బణం (%/సంవత్సరం)',
        'lbl.ssa.elss':         'నెలవారీ ELSS SIP (₹)',
        'lbl.ssa.elssret':      'ELSS రాబడి (%/సంవత్సరం)',
        'lbl.ssa.edu':          'విద్య లక్ష్యం (₹ నేడు)',
        'lbl.ssa.marr':         'వివాహ లక్ష్యం (₹ నేడు)',
        'res.ssa.maturity':     'SSA మెచ్యూరిటీ',
        'res.ssa.elss':         'ELSS కార్పస్',
        'res.ssa.total':        'మొత్తం కలిపి',
        'res.ssa.inflcosts':    '📊 ద్రవ్యోల్బణ-సర్దుబాటు భవిష్యత్ ఖర్చులు',
        'res.ssa.goaltitle':    'ద్రవ్యోల్బణ-సర్దుబాటు వ్యయంతో లక్ష్య కవరేజ్',
        'res.ssa.invested':     'SSA పెట్టుబడి',
        'res.ssa.interest':     'SSA వడ్డీ',
        'res.ssa.elssgins':     'ELSS లాభాలు',
        'res.ssa.tax80c':       '80C ఆదా',
        'res.ssa.table':        'సంవత్సరవారీ SSA పాస్‌బుక్',
        'lbl.hs.income':        'నెలవారీ టేక్-హోమ్ ఆదాయం',
        'lbl.hs.emi':           'నెలవారీ EMI / రుణ చెల్లింపులు',
        'lbl.hs.exp':           'నెలవారీ జీవన ఖర్చులు',
        'lbl.hs.sav':           'నెలవారీ పొదుపులు & పెట్టుబడులు',
        'lbl.hs.health':        'ఆరోగ్య బీమా కవరేజ్ (మొత్తం)',
        'lbl.hs.term':          'టెర్మ్ లైఫ్ ఇన్సూరెన్స్ కవరేజ్',
        'lbl.hs.ef':            'అత్యవసర నిధి (మొత్తం)',
        'hs.grade.rockstar':    'ఆర్థిక సూపర్‌స్టార్ 🤘',
        'hs.desc.rockstar':     'మీ ఆర్థిక స్థితి అద్భుతంగా ఉంది! గర్విగా ఉండండి.',
        'hs.grade.builder':     'సంపద నిర్మాత',
        'hs.desc.builder':      'మీరు సరైన మార్గంలో ఉన్నారు. కొన్ని మార్పులతో మీరు ఆపలేనివారు అవుతారు!',
        'hs.grade.track':       'సరైన దారిలో',
        'hs.desc.track':        'గట్టి పునాది! కొన్ని అంతరాలు పూడ్చాలి కానీ మీరు ముందుకు ఆలోచిస్తున్నారు.',
        'hs.grade.getting':     'మెరుగవుతున్నారు',
        'hs.desc.getting':      'మీకు అవగాహన ఉంది — అదే మొదటి అడుగు. ఒక్కో చర్యతో అంతరాలు పూడ్చండి!',
        'hs.grade.wakeup':      'మేల్కొలుపు!',
        'hs.desc.wakeup':       'మీ డబ్బుకు తీవ్రమైన చర్చ అవసరం. మంచి వార్త? మీరు ఇది చదువుతున్నారు!',
        'hs.grade.sos':         'SOS మోడ్',
        'hs.desc.sos':          'సమస్య పెద్దది, కానీ ప్రతి ఆర్థిక సూపర్‌హీరో ఒక మూలం నుండి మొదలవుతారు.',
        'hs.grade.emergency':   'ఆర్థిక అత్యవసరం',
        'hs.desc.emergency':    'అంతరం పెద్దది కానీ పూడ్చదగినది. దిగువ ఒక చర్యతో మొదలుపెట్టండి.',
        'hs.notscored':         'ఇంకా స్కోర్ కాలేదు',
        'hs.crushing':          '🎉 మీరు అద్భుతంగా చేస్తున్నారు! తక్షణ చర్యలు అవసరం లేదు.',
        'hs.cat.savings':       'పొదుపు రేటు',
        'hs.cat.debt':          'అప్పు భారం',
        'hs.cat.health':        'ఆరోగ్య బీమా',
        'hs.cat.term':          'టర్మ్ బీమా',
        'hs.cat.ef':            'అత్యవసర నిధి',
        'hs.cat.spend':         'వ్యయ నియంత్రణ',
        'hs.cat.age':           'వయసు సంసిద్ధత',
        'hs.pie.savings':       'పొదుపులు & పెట్టుబడులు',
        'hs.pie.emi':           'EMI / రుణాలు',
        'hs.pie.exp':           'జీవన వ్యయాలు',
        'hs.pie.cash':          'స్వేచ్ఛా నగదు',
      },

      ta: {
        'tagline':              'வளருங்கள் மற்றும் இந்தியாவை வளர்க்குங்கள்',
        'nav.back':             '⬅ டாஷ்போர்டு',
        'nav.resetData':        '🗑 என் தரவை மீட்டமை',
        'nav.signOut':          'வெளியேறு',
        'dash.welcome.h':       '🌟 இன்று நீங்கள் என்ன செய்ய விரும்புகிறீர்கள்?',
        'dash.welcome.p':       'இந்தியாவின் முழுமையான நிதி திட்டமிடல் கருவி — எந்த தொகுதியையும் தேர்ந்தெடுக்கவும்',
        'dash.cat.calc':        '⚡ கணிப்பான்கள்',
        'dash.cat.mf':          '📊 மியூச்சுவல் ஃபண்டுகள்',
        'dash.cat.plan':        '🗺️ திட்டமிடல் & வரி',
        'dash.tip':             'முதலீட்டில் புதியவரா? இங்கிருந்து தொடங்குங்கள்',
        'card.growth.title':    'வளர்ச்சி கணிப்பான்',
        'card.growth.desc':     'கூட்டு வட்டி · மொத்தத் தொகை · SIP · பணவீக்க சரிசெய்',
        'card.goal.title':      'இலக்கு திட்டமிடுபவர்',
        'card.goal.desc':       'கல்வி · திருமணம் · ஓய்வூதியம் · வகை பணவீக்க அமைவுகள்',
        'card.ef.title':        'அவசரகால நிதி',
        'card.ef.desc':         'உங்களுக்கு எவ்வளவு பாதுகாப்பு தேவை · 3–12 மாத கணிப்பான்',
        'card.hl.title':        'வீட்டு கடன் ஆலோசகர்',
        'card.hl.desc':         'EMI · முன்கூட்டிய செலுத்துகை · வாடகை vs வாங்குதல்',
        'card.su.title':        'ஸ்டெப்-அப் SIP கணிப்பான்',
        'card.su.desc':         'தட்டையான SIP vs 10% வருடாந்திர ஸ்டெப்-அப் · பெரிய வித்தியாசம்',
        'card.epf.title':       'EPF கார்பஸ் திட்டமிடுபவர்',
        'card.epf.desc':        'அடிப்படை சம்பளம் · முதலாளி பங்கு · ஓய்வூதிய கார்பஸ்',
        'card.mfe.title':       'MF எக்ஸ்ப்ளோரர்',
        'card.mfe.desc':        'நேரடி NAV · சிக்னல் மதிப்பெண்ணிடல் · ஃபண்ட் ஒப்பீடு',
        'card.mfk.title':       'MF கிட்',
        'card.mfk.desc':        'உங்களுக்கு எந்த ஃபண்ட் பொருந்தும் · ஈக்விட்டி · கடன் · ஹைப்ரிட்',
        'card.fp.title':        'ஃபண்ட் பிக்கர் வழிகாட்டி',
        'card.fp.desc':         'ஆல்பா · ஷார்ப் · சார்டினோ · செலவு விகிதம்',
        'card.finplan.title':   'நிதி திட்டம்',
        'card.finplan.desc':    'தனிப்பயனாக்கப்பட்ட SIP திட்டம் · இலக்குகள் · இடர் சுயவிவரம்',
        'card.tax.title':       'வரி வழிகாட்டி',
        'card.tax.desc':        'பழைய vs புதிய திட்டம் · MF மூலதன ஆதாயங்கள் · கிரிப்டோ வரி',
        'card.hs.title':        'நிதி ஆரோக்கிய மதிப்பெண்',
        'card.hs.desc':         'உங்கள் பண வாழ்க்கைக்கு நேர்மையான மதிப்பெண் பெறுங்கள்',
        'card.ssa.title':       'SSA + குழந்தை கல்வி திட்டமிடுபவர்',
        'card.ssa.desc':        'சுகன்யா சம்ரிதி 8.2% · ELSS SIP · மகளின் கல்வி & திருமணம்',
        'page.growth.h':        'வளர்ச்சி கணிப்பான்',
        'page.growth.sub':      'கூட்டு வட்டியுடன் உங்கள் பணம் எப்படி வளருகிறது என்று பாருங்கள்.',
        'page.goal.h':          'இலக்கு திட்டமிடுபவர்',
        'page.goal.sub':        'உங்கள் நிதி இலக்குகளை அடைய மாதாந்திர எவ்வளவு முதலீடு செய்ய வேண்டும்.',
        'page.ef.h':            'அவசரகால நிதி கணிப்பான்',
        'page.ef.sub':          'உங்கள் மாதாந்திர செலவுகளை உள்ளிட்டு பரிந்துரைக்கப்பட்ட நிதியை அறியுங்கள்.',
        'page.mfkit.h':         '💼 மியூச்சுவல் ஃபண்ட் கிட்',
        'page.mfkit.sub':       'எந்த ஃபண்ட் வகையையும் தொட்டு அதை எப்போது பயன்படுத்துவது என்று தெரியுங்கள்.',
        'page.funder.h':        '🔬 தரமான மியூச்சுவல் ஃபண்டை எவ்வாறு தேர்வு செய்வது',
        'page.funder.sub':      'இந்த அளவீடுகள் ஃபண்ட் தன் வேலையை சரியாக செய்கிறதா என்று சொல்கின்றன.',
        'page.hs.h':            'நிதி ஆரோக்கிய மதிப்பெண்',
        'page.hs.sub':          'உங்கள் நிதி விவரங்களை உள்ளிட்டு நேர்மையான மதிப்பெண் பெறுங்கள். 📋',
        'page.fp.h':            'நிதி திட்ட உருவாக்கி',
        'page.fp.sub':          'சில கேள்விகளுக்கு பதிலளிக்கவும். உங்களுக்கான தனிப்பயனாக்கப்பட்ட போர்ட்ஃபோலியோ பெறுங்கள்.',
        'page.mfe.h':           '🔭 இந்திய MF எக்ஸ்ப்ளோரர்',
        'page.mfe.sub':         'AMFI இலிருந்து நேரடி NAV · தானியங்கி மதிப்பெண்ணிடல் · முதல் AMC',
        'page.tg.h':            '🧾 இந்திய வரி வழிகாட்டி',
        'page.tg.sub':          'பழைய vs புதிய திட்டம் · MF மூலதன ஆதாயங்கள் · கிரிப்டோ வரி · ELSS',
        'page.hl.h':            '🏠 வீட்டு கடன் ஆலோசகர்',
        'page.hl.sub':          'EMI கணிப்பான் · முன்கூட்டிய செலுத்துகை நன்மை · வாடகை vs வாங்குதல்',
        'page.su.h':            '📈 ஸ்டெப்-அப் SIP கணிப்பான்',
        'page.su.sub':          'ஒவ்வொரு ஆண்டும் SIP ஐ 10–15% அதிகரிக்கவும். பெரிய வித்தியாசம் பாருங்கள்.',
        'page.epf.h':           '🏦 EPF கார்பஸ் திட்டமிடுபவர்',
        'page.epf.sub':         'இந்தியாவில் மிக முக்கியமான ஓய்வூதிய எண். ஊழியர் + முதலாளி 12%, 8.15% வட்டி.',
        'page.ssa.h':           '👧 SSA + குழந்தை கல்வி திட்டமிடுபவர்',
        'page.ssa.sub':         'சுகன்யா சம்ரிதி (8.2% வரி இல்லாத, Sec 80C) + ELSS SIP · பணவீக்க சரிசெய்யப்பட்ட இலக்குகள்.',
        'common.presets':       'விரைவு அமைவுகள்',
        'ssh.params':           'அளவுருக்கள்',
        'ssh.epfdetails':       'உங்கள் EPF விவரங்கள்',
        'ssh.ssa':              '🏦 சுகன்யா சம்ரிதி கணக்கு',
        'ssh.elss':             '📈 ELSS SIP டாப்-அப்',
        'ssh.goals':            '🎯 இலக்குகள் (இன்றைய விலை — பணவீக்கம் தானாக சரிசெய்யப்படும்)',
        /* Splash */
        'splash.tagline':       'இந்திய செல்வம் உருவாக்கும் கணிப்பான்',
        'splash.login':         '🔑  உள்நுழைய',
        'splash.signup':        '✨  பதிவு செய்ய',
        'splash.email':         'மின்னஞ்சல் முகவரி',
        'splash.password':      'கடவுச்சொல்',
        'splash.confirmpassword': 'கடவுச்சொல்லை உறுதிப்படுத்தவும்',
        'splash.fname':         'முதல் பெயர்',
        'splash.lname':         'கடைசி பெயர்',
        'splash.enterdash':     'டாஷ்போர்டில் நுழைக →',
        'splash.createaccount': 'என் கணக்கை உருவாக்கு →',
        'mf.returns':'வருமானம்','mf.horizon':'காலம்','mf.details':'விவரங்கள்',
        /* MF Modal labels */
        'mf.modal.ret':      'வழக்கமான வருமானம்',
        'mf.modal.hor':      'குறைந்தபட்ச காலம்',
        'mf.modal.risk':     'ஆபத்து நிலை',
        'mf.modal.what':     'இது என்ன?',
        'mf.modal.when':     '✅ எப்போது பயன்படுத்தலாம் / சிறந்த சூழ்நிலைகள்',
        'mf.modal.avoid':    '⚠️ எப்போது பயன்படுத்தக்கூடாது',
        'mf.modal.eg':       '💡 இந்திய உதாரணம்',
        /* Fund Picker labels */
        'picker.good':       'நல்லது',
        'picker.watchout':   'கவனம்',
        'picker.protip':     '💡 நிபுணர் ஆலோசனை',
        'picker.eg':         '📖 இந்திய உதாரணம்',
        'picker.mustknow':   'அவசியம் தெரியவேண்டியது',
        'picker.importance': 'முக்கியத்துவம்',
        'picker.cat.returns':'வருமானம்',
        'picker.cat.risk':   'ஆபத்து',
        'picker.cat.cost':   'செலவு & வரி',
        'picker.cat.structure':'அமைப்பு',
        /* CG table fund names & holding */
        'tg.fund.equity':   'ஈக்விட்டி MF / ETF',
        'tg.fund.elss':     'ELSS',
        'tg.fund.arb':      'ஆர்பிட்ரேஜ் ஃபண்ட்',
        'tg.fund.debt':     'கடன் MF / FoF',
        'tg.fund.liquid':   'லிக்விட் / அல்ட்ரா-ஷார்ட்',
        'tg.fund.gold':     'கோல்ட் ETF / கோல்ட் FoF',
        'tg.fund.intl':     'சர்வதேச ஃபண்ட்',
        'tg.hold.gt1':      '> 1 ஆண்டு',
        'tg.hold.lt1':      '< 1 ஆண்டு',
        'tg.hold.any':      'எதுவும்',
        /* Tax Guide */
        'tg.opt.title':      '⚖️ பழைய vs புதிய திட்டம் வரி உகப்பாக்கி',
        'tg.opt.sub':        'வருமானம் + விலக்குகளை உள்ளிடவும் → எந்த திட்டம் அதிகம் சேமிக்கிறது என்று உடனே காணவும்',
        'tg.opt.badge':      _fyStr + ' விகிதங்கள்',
        'tg.lbl.salary':     'வருடாந்திர மொத்த சம்பளம் / CTC (₹)',
        'tg.lbl.other':      'மற்ற வருமானம் (FD வட்டி, வாடகை…)',
        'tg.lbl.oldded':     'பழைய திட்டம் விலக்குகள்',
        'tg.lbl.oldded.note':'(பழைய திட்டம் வெல்லும்போது மட்டும் பொருந்தும்)',
        'tg.lbl.80c':        '80C',
        'tg.lbl.hra':        'HRA விலக்கு',
        'tg.lbl.nps':        'NPS 80CCD(1B)',
        'tg.lbl.hl':         'வீட்டு கடன் 24(b)',
        'tg.lbl.80d':        '80D உடல்நல காப்பீடு',
        'tg.lbl.otherded':   'மற்ற விலக்குகள்',
        'tg.hint.80c':       'ELSS, PPF, LIC, EPF',
        'tg.hint.hra':       'மெட்ரோ 50%, மெட்ரோ அல்லாத 40%',
        'tg.hint.nps':       '80C க்கு அப்பால் கூடுதல் ₹50K',
        'tg.hint.hl':        'சொந்த வீடு',
        'tg.hint.80d':       'தனக்கு ₹25K + பெற்றோர் ₹50K',
        'tg.hint.otherded':  'LTA, தொழில் வரி, 80E, 80G…',
        'tg.lbl.exp':        'மாதாந்திர வாழ்க்கை செலவுகள் (₹)',
        'tg.lbl.exp.note':   '— உபரி கணக்கீட்டிற்கு',
        'tg.hint.exp':       'வாடகை + கிரோசரி + EMI + வாழ்க்கை முறை — மாதம் எவ்வளவு முதலீடு செய்யலாம் என்று காணவும்',
        'tg.lbl.epf':        'மாதாந்திர அடிப்படை சம்பளம் (₹)',
        'tg.lbl.epf.note':   '— EPF கழிவுக்கு',
        'tg.hint.epf':       'ஊழியர் EPF = அடிப்படையில் 12%, டேக்-ஹோமிலிருந்து கழிக்கப்படும். EPS (ஓய்வூதியம்) முதலாளியின் 12% பகுதி — உங்கள் சம்பளத்திலிருந்து கழிக்கப்படாது.',
        'tg.placeholder':    'ஒப்பீட்டைக் காண மேலே உங்கள் சம்பளத்தை உள்ளிடவும்',
        'tg.slab.title':     '📊 வரி தட்டு விவரம் (வெற்றி திட்டம்)',
        'tg.surplus.title':  '💰 உங்கள் முதலீட்டுக்கு உரிய உபரி',
        'tg.btn.sendplan':   '→ உபரியை நிதி திட்டத்திற்கு மாதாந்திர முதலீடாக அனுப்புக',
        'tg.disclaimer':     '* நிலையான விலக்கு ₹75K (புதிய) / ₹50K (பழைய). 4% செஸ் சேர்க்கப்பட்டது. 87A தள்ளுபடி பயன்படுத்தப்பட்டது. சர்சார்ஜ் காட்டப்படவில்லை. மதிப்பீடு மட்டும் — தாக்கல் செய்வதற்கு முன் CA ஐ கலந்தாலோசிக்கவும்.',
        'tg.cg.title':       '📊 MF மூலதன ஆதாயங்கள் — தற்போதைய விகிதங்கள்',
        'tg.tbl.type':       'ஃபண்ட் வகை',
        'tg.tbl.holding':    'வைத்திருக்கும் காலம்',
        'tg.tbl.taxtype':    'வரி வகை',
        'tg.tbl.rate':       'விகிதம்',
        'tg.tbl.exempt':     'விலக்கு',
        'tg.tbl.exempt125':  '₹1.25L/ஆண்டு விலக்கு',
        'tg.tbl.noexempt':   'விலக்கு இல்லை',
        'tg.tbl.nobenefit':  'நன்மை இல்லை. FD போன்றது.',
        'tg.tbl.nobenefit2': 'நன்மை இல்லை',
        'tg.tbl.intl':       '2023 க்குப் பிறகு கடனாக கருதப்படுகிறது',
        'tg.cg.note':        'FA 2023 கடன் MF களுக்கான குறியீட்டு முறையை முற்றிலும் நீக்கியது. FA 2024 STCG 20% மற்றும் LTCG 12.5% ஆக்கியது, LTCG விலக்கு ₹1L லிருந்து ₹1.25L ஆனது. தாக்கல் செய்வதற்கு முன் தற்போதைய விகிதங்களை சரிபார்க்கவும்.',
        'tg.crypto.title':   '₿ கிரிப்டோ / VDA வரி — பட்ஜெட் 2022 விதிகள்',
        'tg.crypto.flat':    'அனைத்து ஆதாயங்களிலும் தட்டையான வரி',
        'tg.crypto.flat.desc':'வைத்திருக்கும் காலம் நன்மை இல்லை. குறுகிய அல்லது நீண்ட காலத்தைப் பொருட்படுத்தாமல் ஆதாயங்கள் 30% வரி. VDA வருமானத்திற்கு அடிப்படை விலக்கு வரம்பு பொருந்தாது.',
        'tg.crypto.tds':     'ஒவ்வொரு வர்த்தகத்திலும் கழிக்கப்படுகிறது',
        'tg.crypto.tds.desc':'₹10,000 க்கு மேல் ஒவ்வொரு கிரிப்டோ பரிவர்த்தனையிலும் 1% TDS மூலத்தில் கழிக்கப்படுகிறது. ITR தாக்கல் செய்யும்போது TDS கடன் கோரலாம்.',
        'tg.crypto.nooffset':'நட்டங்களை சரிக்கட்ட முடியாது',
        'tg.crypto.nooffset.desc':'கிரிப்டோ நட்டங்களை வேறு எந்த வருமானத்தோடும் சரிக்கட்ட முடியாது. ஒவ்வொரு VDA தனித்தனியாக கருதப்படுகிறது. நட்டங்களை முன்னால் எடுத்துச் செல்வதும் இல்லை.',
        'tg.dates.title':    '📅 முதலீட்டாளருக்கான முக்கிய வரி தேதிகள் & குறிப்புகள்',
        'tg.dates.deadlines':'வரி சேமிப்பு இறுதி தேதிகள்',
        'tg.dates.smartmoves':'சிறந்த வரி நடவடிக்கைகள்',
        /* Tax Guide dynamic */
        'tg.win.new':        'புதிய திட்டம் அதிகம் சேமிக்கிறது',
        'tg.win.old':        'பழைய திட்டம் அதிகம் சேமிக்கிறது',
        'tg.win.equal':      'இரண்டு திட்டங்களும் சம வரி விதிக்கின்றன',
        'tg.win.save':       'சேமிப்பு',
        'tg.regime.new':     'புதிய திட்டம்',
        'tg.regime.old':     'பழைய திட்டம்',
        'tg.regime.either':  'எதுவும்',
        'tg.res.best':       'சிறந்த திட்டம்',
        'tg.res.effrate':    'பயனுள்ள வரி விகிதம்',
        'tg.res.marginal':   'விளிம்பு தட்டு',
        'tg.res.annual':     'வருடாந்திர டேக்-ஹோம்',
        'tg.res.monthly':    'மாதாந்திர டேக்-ஹோம்',
        'tg.res.cessnote':   'செஸ் 4% சேர்க்கப்பட்டது. 87A தள்ளுபடி பயன்படுத்தப்பட்டது. சர்சார்ஜ் காட்டப்படவில்லை.',
        'tg.res.rebate87a':  '87A தள்ளுபடி: ₹12L வரை வருமானத்திற்கு முழு வரி தள்ளுபடி (பட்ஜெட் 2025)',
        'tg.res.notax':      'வரி பொருந்தாது',
        'tg.card.gross':     'மொத்தம்',
        'tg.card.ded':       'விலக்குகள்',
        'tg.card.taxable':   'வரிக்குட்பட்டது',
        'tg.card.tax':       'வரி',
        'tg.card.cess':      'செஸ் (4%)',
        'tg.card.total':     'மொத்த வரி',
        'tg.card.takehome':  'டேக்-ஹோம்',
        'tg.sur.posttax':    'வரிக்குப் பின் டேக்-ஹோம்',
        'tg.sur.grossvia':   'மொத்தம், வழியாக',
        'tg.sur.cashinhand': 'கையில் பணம்',
        'tg.sur.expenses':   'மாதாந்திர செலவுகள்',
        'tg.sur.asentered':  'உள்ளிட்டபடி',
        'tg.sur.investable': 'மாதாந்திர முதலீட்டுக்கு உரிய உபரி',
        'tg.sur.savrate':    'சேமிப்பு விகிதம்',
        'tg.sur.ofcash':     'கையில் பணத்தில்',
        'tg.sur.overspend':  'செலவுகள் கையில் பணத்தை மிஞ்சுகின்றன. பட்ஜெட்டை மதிப்பாய்வு செய்யுங்கள்.',
        'tg.sur.free':       'இலவச உபரி',
        'tg.epf.note1':      'EPF கழிக்கப்பட்டது:',
        'tg.epf.of':         'இல்',
        'tg.epf.note2':      'முதலாளியும் சேர்க்கிறார்',
        'tg.epf.note3':      'உங்கள் கார்பஸில்.',
        'tg.epf.corpus1':    '+ EPF உருவாக்குகிறது',
        'tg.epf.corpus2':    'உங்கள் கார்பஸில்',
        'tg.epf.corpus3':    'நீங்கள் + முதலாளி',
        'tg.epf.each':       'தலா',
        'tg.lbl.empnps':     'முதலாளி NPS பங்களிப்பு 80CCD(2)',
        'tg.hint.empnps':    'உங்கள் முதலாளியின் NPS பங்களிப்பு (அடிப்படையில் அதிகபட்சம் 10%). Sec 80CCD(2) கீழ் விலக்கு — ₹1.5L 80C வரம்புக்கு அப்பால்.',
        'tg.btn.reset':      'வரி வழிகாட்டியை மீட்டமை',
        'tg.tbl.lockinyrs':  '3 ஆண்டு பூட்டுதல்',
        'tg.date1':  '📌 <strong>31 மார்ச்</strong> — இந்த FY க்கு 80C முதலீட்டின் கடைசி நாள்',
        'tg.date2':  '📌 <strong>31 ஜூலை</strong> — ITR தாக்கல் கடைசி நாள் (சம்பளதாரர்கள்)',
        'tg.date3':  '📌 <strong>15 மார்ச்</strong> — முன்கூட்டிய வரி 4வது தவணை',
        'tg.date4':  '📌 <strong>31 அக்டோபர்</strong> — தணிக்கையுடன் ITR கடைசி நாள்',
        'tg.tip1':   '✅ ஒவ்வொரு ஆண்டும் ₹1.25L LTCG வரி இல்லாமல் பதிவு செய்யுங்கள் (ஈக்விட்டி MF)',
        'tg.tip2':   '✅ 80C க்கு ELSS — குறைந்தபட்ச பூட்டுதல் + ஈக்விட்டி வருமானம்',
        'tg.tip3':   '✅ NPS 80CCD(1B) கீழ் ₹50K கூடுதல் விலக்கு சேர்க்கிறது',
        'tg.tip4':   '✅ ஆர்பிட்ரேஜ் ஃபண்டுகள்: FD வட்டியில் 30% பதிலாக 12.5% LTCG',
        'tg.tip5':   '✅ Sec 87A தள்ளுபடி: புதிய திட்டத்தில் ₹12L வரை சூன்ய வரி (பட்ஜெட் 2025)',
        'lbl.gr.type':          'முதலீட்டு வகை',
        /* Growth/Goal */
        'lbl.gr.goal':          'உங்கள் இலக்கு என்ன?',
        'lbl.gr.todaycost':     'இன்றைய செலவு (₹) — இன்றைய பணத்தில்',
        'lbl.gr.amount':        'தொகை',
        'lbl.gr.years':         'கால அளவு (ஆண்டுகள்)',
        'lbl.gr.expinfl':       'எதிர்பார்க்கப்படும் பணவீக்கம் (%)',
        'lbl.gr.custom':        'விருப்பமான இலக்கு வருமானம் (%)',
        'res.gr.projhead':      'அனுமான முடிவுகள்',
        'res.gr.goalhead':      'இலக்கு முடிவுகள்',
        'res.gr.invested':      'மொத்த முதலீடு',
        'res.gr.reqinv':        'இலக்கை அடைய தேவையான முதலீடு',
        'res.gr.recominv':      'பரிந்துரைக்கப்பட்ட இந்திய முதலீடுகள்',
        /* Home Loan */
        'lbl.hl.amount':        'கடன் தொகை (₹)',
        'lbl.hl.rate':          'வருடாந்திர வட்டி விகிதம் (%)',
        'lbl.hl.tenure':        'கடன் காலம் (ஆண்டுகள்)',
        'lbl.hl.month':         'தொடக்க மாதம் (விருப்பமானது)',
        'lbl.hl.origamt':       'அசல் கடன் தொகை (₹)',
        'lbl.hl.ratepа':        'வட்டி விகிதம் (% வருடாந்திர)',
        'lbl.hl.origten':       'அசல் காலம் (ஆண்டுகள்)',
        'lbl.hl.prepay':        'மொத்த முன்கூட்டிய செலுத்துகை (₹)',
        'lbl.hl.prepayafter':   'முன்கூட்டிய செலுத்துகை பிறகு (கடனில் ஆண்டுகள்)',
        'lbl.hl.proprice':      'சொத்து விலை (₹)',
        'lbl.hl.down':          'முன்பணம் (₹)',
        'lbl.hl.loanrate':      'கடன் வட்டி விகிதம் (% வருடாந்திர)',
        'lbl.hl.propapp':       'சொத்து மதிப்பேற்றம் (% வருடாந்திர)',
        'lbl.hl.maint':         'வருடாந்திர பராமரிப்பு + வரி (₹)',
        'lbl.hl.rent':          'மாதாந்திர வாடகை (₹)',
        'lbl.hl.rentinc':       'வருடாந்திர வாடகை அதிகரிப்பு (%)',
        'lbl.hl.investret':     'சேமித்த மூலதனத்தில் முதலீட்டு வருமானம் (%)',
        'lbl.hl.horizon':       'ஒப்பீட்டு அடிவானம் (ஆண்டுகள்)',
        'lbl.hl.taxamt':        'வீட்டு கடன் தொகை (₹)',
        'lbl.hl.taxslab':       'உங்கள் வரி தட்டு (%)',
        'lbl.hl.proptype':      'சொத்து வகை',
        'lbl.gr.rate':          'எதிர்பார்க்கப்படும் வருமானம் (%)',
        'lbl.gr.inflation':     'பணவீக்கத்திற்கு சரிசெய்யவும்',
        'res.gr.title':         'அனுமானிக்கப்பட்ட எதிர்கால மதிப்பு',
        'res.gr.interest':      'மொத்த வட்டி',
        'lbl.su.amount':        'மாதாந்திர SIP (₹)',
        'lbl.su.rate':          'வருடாந்திர வருமானம் (%)',
        'lbl.su.years':         'காலம் (ஆண்டுகள்)',
        'lbl.su.stepup':        'ஸ்டெப்-அப் (%/ஆண்டு)',
        'res.su.flat':          '📉 தட்டையான SIP கார்பஸ்',
        'res.su.stepup':        '⚡ ஸ்டெப்-அப் கார்பஸ்',
        'res.su.extra':         'ஸ்டெப்-அப்பிலிருந்து கூடுதல் செல்வம்',
        'res.su.extrainv':      'கூடுதல் முதலீடு',
        'res.su.finalsip':      'இறுதி SIP/மாதம்',
        'res.su.mult':          'கார்பஸ் பெருக்கி',
        'res.su.combined':      'மொத்தம் சேர்ந்து',
        'lbl.epf.basic':        'அடிப்படை + DA சம்பளம் (₹/மாதம்)',
        'lbl.epf.balance':      'தற்போதைய EPF இருப்பு (₹)',
        'lbl.epf.age':          'தற்போதைய வயது (ஆண்டுகள்)',
        'lbl.epf.retire':       'ஓய்வூதிய வயது (ஆண்டுகள்)',
        'lbl.epf.growth':       'சம்பள வளர்ச்சி (%/ஆண்டு)',
        'lbl.epf.rate':         'EPF வட்டி விகிதம் (%)',
        'res.epf.corpus':       'ஓய்வில் EPF கார்பஸ்',
        'res.epf.interest':     'மொத்தம் சம்பாதித்த வட்டி',
        'res.epf.contrib':      'மொத்த பங்களிப்புகள்',
        'res.epf.monthly':      'சமான மாதாந்திர பங்களிப்பு',
        'res.epf.years':        'ஓய்வுக்கு ஆண்டுகள்',
        'res.epf.mult':         'வட்டி பெருக்கி',
        'res.epf.salary':       'இறுதி அடிப்படை சம்பளம்',
        'res.epf.pension':      'ஓய்வூதியம் (EPS)',
        'res.epf.table':        'ஆண்டுவாரி EPF பாஸ்புக்',
        'lbl.ssa.dobyear':      'மகளின் பிறந்த ஆண்டு',
        'lbl.ssa.annual':       'வருடாந்திர SSA வைப்பு (₹)',
        'lbl.ssa.tenure':       'வைப்பு காலம் (ஆண்டுகள்)',
        'lbl.ssa.inflation':    'கல்வி பணவீக்கம் (%/ஆண்டு)',
        'lbl.ssa.elss':         'மாதாந்திர ELSS SIP (₹)',
        'lbl.ssa.elssret':      'ELSS வருமானம் (%/ஆண்டு)',
        'lbl.ssa.edu':          'கல்வி இலக்கு (₹ இன்று)',
        'lbl.ssa.marr':         'திருமண இலக்கு (₹ இன்று)',
        'res.ssa.maturity':     'SSA முதிர்வு',
        'res.ssa.elss':         'ELSS கார்பஸ்',
        'res.ssa.total':        'மொத்தம் சேர்ந்து',
        'res.ssa.inflcosts':    '📊 பணவீக்க சரிசெய்யப்பட்ட எதிர்கால செலவுகள்',
        'res.ssa.goaltitle':    'பணவீக்க சரிசெய்யப்பட்ட செலவுக்கு எதிரான இலக்கு கவரேஜ்',
        'res.ssa.invested':     'SSA முதலீடு',
        'res.ssa.interest':     'SSA வட்டி',
        'res.ssa.elssgins':     'ELSS லாபங்கள்',
        'res.ssa.tax80c':       '80C சேமிப்பு',
        'res.ssa.table':        'ஆண்டுவாரி SSA பாஸ்புக்',
        'lbl.hs.income':        'மாதாந்திர வருமானம்',
        'lbl.hs.emi':           'மாதாந்திர EMI / கடன் செலுத்துகைகள்',
        'lbl.hs.exp':           'மாதாந்திர வாழ்க்கை செலவுகள்',
        'lbl.hs.sav':           'மாதாந்திர சேமிப்புகள் & முதலீடுகள்',
        'lbl.hs.health':        'உடல்நல காப்பீடு கவரேஜ் (மொத்தம்)',
        'lbl.hs.term':          'டெர்ம் லைஃப் காப்பீடு கவரேஜ்',
        'lbl.hs.ef':            'அவசரகால நிதி சேமிப்பு (மொத்தம்)',
        'hs.grade.rockstar':    'நிதி சூப்பர்ஸ்டார் 🤘',
        'hs.desc.rockstar':     'உங்கள் நிதி நிலை அரிய தரத்தில் உள்ளது! பெருமைப்படுங்கள்.',
        'hs.grade.builder':     'செல்வம் கட்டுபவர்',
        'hs.desc.builder':      'நீங்கள் சரியான பாதையில் இருக்கிறீர்கள். சில திருத்தங்களுடன் தடுக்க முடியாதவராவீர்கள்!',
        'hs.grade.track':       'சரியான பாதையில்',
        'hs.desc.track':        'உறுதியான அடித்தளம்! சில இடைவெளிகளை கவனிக்க வேண்டும். நல்ல வேலை.',
        'hs.grade.getting':     'முன்னேறி வருகிறீர்கள்',
        'hs.desc.getting':      'நீங்கள் விழிப்புடன் இருக்கிறீர்கள் — இதுவே முதல் படி. ஒவ்வொரு நடவடிக்கையாக இடைவெளிகளை மூடுங்கள்!',
        'hs.grade.wakeup':      'விழிப்பு அழைப்பு!',
        'hs.desc.wakeup':       'உங்கள் பணத்திற்கு தீவிர ஆலோசனை தேவை. நல்ல செய்தி? நீங்கள் இதை படிக்கிறீர்கள்!',
        'hs.grade.sos':         'SOS முறை',
        'hs.desc.sos':          'சிக்கல் பெரியது, ஆனால் ஒவ்வொரு நிதி சூப்பர்ஹீரோவும் ஒரு ஆரம்பத்திலிருந்து வருகிறார்கள்.',
        'hs.grade.emergency':   'நிதி அவசரநிலை',
        'hs.desc.emergency':    'இடைவெளி பெரியது ஆனால் மூடக்கூடியது. கீழே ஒரே ஒரு நடவடிக்கையுடன் தொடங்குங்கள்.',
        'hs.notscored':         'இன்னும் மதிப்பெண் இல்லை',
        'hs.crushing':          '🎉 நீங்கள் அருமையாக செய்கிறீர்கள்! உடனடி நடவடிக்கைகள் தேவையில்லை.',
        'hs.cat.savings':       'சேமிப்பு விகிதம்',
        'hs.cat.debt':          'கடன் சுமை',
        'hs.cat.health':        'உடல்நல காப்பீடு',
        'hs.cat.term':          'டெர்ம் காப்பீடு',
        'hs.cat.ef':            'அவசரகால நிதி',
        'hs.cat.spend':         'செலவு கட்டுப்பாடு',
        'hs.cat.age':           'வயது தயார்நிலை',
        'hs.pie.savings':       'சேமிப்புகள் & முதலீடுகள்',
        'hs.pie.emi':           'EMI / கடன்கள்',
        'hs.pie.exp':           'வாழ்க்கை செலவுகள்',
        'hs.pie.cash':          'இலவச பணம்',
      }
    };

    /* ── Core helpers ─────────────────────────────────────── */
    function _t(key) {
        var d = _T[_lang] || _T.en;
        return (d[key] !== undefined ? d[key] : (_T.en[key] || key));
    }



    /* ── MF Kit translation helpers ─────────────────────────── */
    var _MF_NAMES = {
        en: {
            'large-cap':'Large Cap Funds','mid-cap':'Mid Cap Funds','small-cap':'Small Cap Funds',
            'flexi-cap':'Flexi Cap Funds','multicap':'Multi Cap Funds','elss':'ELSS (Tax Saving)',
            'index':'Index Funds','etf':'ETFs (Exchange Traded Funds)','sectoral':'Sectoral / Thematic Funds',
            'international':'International / Global Funds','liquid':'Liquid Funds',
            'ultra-short':'Ultra Short Duration Funds','short-duration':'Short Duration Funds',
            'gilt':'Gilt Funds','credit-risk':'Credit Risk Funds',
            'aggressive-hybrid':'Aggressive Hybrid Funds','conservative-hybrid':'Conservative Hybrid Funds',
            'arbitrage':'Arbitrage Funds','fof':'Fund of Funds (FoF)',
            'dynamic-bond':'Dynamic Bond Funds','govt-savings':'Govt Small Savings Schemes'
        },
        hi: {
            'large-cap':'लार्ज कैप फंड','mid-cap':'मिड कैप फंड','small-cap':'स्मॉल कैप फंड',
            'flexi-cap':'फ्लेक्सी कैप फंड','multicap':'मल्टी कैप फंड','elss':'ELSS (कर बचत)',
            'index':'इंडेक्स फंड','etf':'ETF (एक्सचेंज ट्रेडेड फंड)','sectoral':'सेक्टोरल / थीमेटिक फंड',
            'international':'अंतर्राष्ट्रीय / वैश्विक फंड','liquid':'लिक्विड फंड',
            'ultra-short':'अल्ट्रा शॉर्ट ड्यूरेशन फंड','short-duration':'शॉर्ट ड्यूरेशन फंड',
            'gilt':'गिल्ट फंड','credit-risk':'क्रेडिट रिस्क फंड',
            'aggressive-hybrid':'आक्रामक हाइब्रिड फंड','conservative-hybrid':'रक्षात्मक हाइब्रिड फंड',
            'arbitrage':'आर्बिट्राज फंड','fof':'फंड ऑफ फंड्स (FoF)',
            'dynamic-bond':'डायनेमिक बॉन्ड फंड','govt-savings':'सरकारी लघु बचत योजनाएं'
        },
        te: {
            'large-cap':'లార్జ్ క్యాప్ ఫండ్లు','mid-cap':'మిడ్ క్యాప్ ఫండ్లు','small-cap':'స్మాల్ క్యాప్ ఫండ్లు',
            'flexi-cap':'ఫ్లెక్సీ క్యాప్ ఫండ్లు','multicap':'మల్టీ క్యాప్ ఫండ్లు','elss':'ELSS (పన్ను ఆదా)',
            'index':'ఇండెక్స్ ఫండ్లు','etf':'ETF లు (ఎక్స్ఛేంజ్ ట్రేడెడ్ ఫండ్లు)','sectoral':'సెక్టోరల్ / థీమాటిక్ ఫండ్లు',
            'international':'అంతర్జాతీయ / గ్లోబల్ ఫండ్లు','liquid':'లిక్విడ్ ఫండ్లు',
            'ultra-short':'అల్ట్రా షార్ట్ డ్యూరేషన్ ఫండ్లు','short-duration':'షార్ట్ డ్యూరేషన్ ఫండ్లు',
            'gilt':'గిల్ట్ ఫండ్లు','credit-risk':'క్రెడిట్ రిస్క్ ఫండ్లు',
            'aggressive-hybrid':'అగ్రెసివ్ హైబ్రిడ్ ఫండ్లు','conservative-hybrid':'కన్జర్వేటివ్ హైబ్రిడ్ ఫండ్లు',
            'arbitrage':'ఆర్బిట్రేజ్ ఫండ్లు','fof':'ఫండ్ ఆఫ్ ఫండ్స్ (FoF)',
            'dynamic-bond':'డైనమిక్ బాండ్ ఫండ్లు','govt-savings':'ప్రభుత్వ చిన్న పొదుపు పథకాలు'
        },
        ta: {
            'large-cap':'லார்ஜ் கேப் ஃபண்டுகள்','mid-cap':'மிட் கேப் ஃபண்டுகள்','small-cap':'ஸ்மால் கேப் ஃபண்டுகள்',
            'flexi-cap':'ஃப்லெக்சி கேப் ஃபண்டுகள்','multicap':'மல்டி கேப் ஃபண்டுகள்','elss':'ELSS (வரி சேமிப்பு)',
            'index':'இண்டெக்ஸ் ஃபண்டுகள்','etf':'ETF கள் (பரிவர்த்தனை வர்த்தக ஃபண்டுகள்)','sectoral':'துறை / தீமாடிக் ஃபண்டுகள்',
            'international':'சர்வதேச / உலகளாவிய ஃபண்டுகள்','liquid':'லிக்விட் ஃபண்டுகள்',
            'ultra-short':'அல்ட்ரா ஷார்ட் டுரேஷன் ஃபண்டுகள்','short-duration':'ஷார்ட் டுரேஷன் ஃபண்டுகள்',
            'gilt':'கில்ட் ஃபண்டுகள்','credit-risk':'கிரெடிட் ரிஸ்க் ஃபண்டுகள்',
            'aggressive-hybrid':'ஆக்கிரமிப்பு ஹைப்ரிட் ஃபண்டுகள்','conservative-hybrid':'பழமைவாத ஹைப்ரிட் ஃபண்டுகள்',
            'arbitrage':'ஆர்பிட்ரேஜ் ஃபண்டுகள்','fof':'ஃபண்ட் ஆஃப் ஃபண்ட்ஸ் (FoF)',
            'dynamic-bond':'டைனமிக் பாண்ட் ஃபண்டுகள்','govt-savings':'அரசு சிறு சேமிப்பு திட்டங்கள்'
        }
    };
    var _MF_TAGS = {
        en: {
            'large-cap':"Invest in India's top 100 companies by market cap.",
            'mid-cap':"Bet on tomorrow's large caps — companies ranked 101–250.",
            'small-cap':'High octane growth — companies ranked 251 and below.',
            'flexi-cap':'Fund manager picks the best across all market caps dynamically.',
            'multicap':'Mandated 25% each in large, mid & small cap — true diversification.',
            'elss':'Save up to ₹46,800 tax annually + earn equity returns.',
            'index':'Track Nifty 50 / Sensex at rock-bottom costs. No fund manager needed.',
            'etf':'Like index funds but traded on stock exchanges like shares.',
            'sectoral':'Concentrate bets on one sector — banking, IT, pharma, infra etc.',
            'international':'Invest in US, China, global markets from your Indian account.',
            'liquid':'Your savings account alternative — better returns, same-day withdrawal.',
            'ultra-short':'Slightly better than liquid funds for 3–6 month parking needs.',
            'short-duration':'Debt fund equivalent of a 1–3 year FD — but more tax efficient.',
            'gilt':'Zero credit risk — invest only in government bonds. But interest rate sensitive.',
            'credit-risk':'Higher returns from lower-rated corporate bonds — but comes with default risk.',
            'aggressive-hybrid':'65–80% equity + 20–35% debt = smoother equity-like returns.',
            'conservative-hybrid':'75–90% debt + 10–25% equity — for capital protection with mild growth.',
            'arbitrage':'Almost risk-free returns taxed as equity — ideal for high-tax investors.',
            'fof':'A fund that invests in other mutual funds — instant diversification.',
            'dynamic-bond':'Fund manager actively adjusts duration based on interest rate outlook.',
            'govt-savings':'Sovereign-guaranteed instruments — highest safe rates in India.'
        },
        hi: {
            'large-cap':'भारत की शीर्ष 100 मार्केट कैप कंपनियों में निवेश।',
            'mid-cap':'कल के लार्ज कैप में दांव — 101–250 रैंक की कंपनियां।',
            'small-cap':'तेज विकास — 251 और उससे नीचे रैंक की कंपनियां।',
            'flexi-cap':'फंड मैनेजर सभी मार्केट कैप में से सर्वश्रेष्ठ चुनता है।',
            'multicap':'लार्ज, मिड और स्मॉल कैप में 25-25% — सच्चा विविधीकरण।',
            'elss':'सालाना ₹46,800 तक कर बचाएं + इक्विटी रिटर्न कमाएं।',
            'index':'Nifty 50/Sensex को बेहद कम लागत पर ट्रैक करें।',
            'etf':'इंडेक्स फंड जैसे लेकिन शेयरों की तरह एक्सचेंज पर ट्रेड होते हैं।',
            'sectoral':'एक सेक्टर पर दांव — बैंकिंग, IT, फार्मा, इंफ्रा आदि।',
            'international':'भारतीय खाते से US, चीन, वैश्विक बाजारों में निवेश।',
            'liquid':'बचत खाते का बेहतर विकल्प — अधिक रिटर्न, उसी दिन निकासी।',
            'ultra-short':'3–6 माह की पार्किंग के लिए लिक्विड से थोड़ा बेहतर।',
            'short-duration':'1–3 साल के FD का डेब्ट फंड विकल्प — पर अधिक कर कुशल।',
            'gilt':'शून्य क्रेडिट जोखिम — केवल सरकारी बॉन्ड में निवेश।',
            'credit-risk':'कम रेटिंग वाले बॉन्ड से अधिक रिटर्न — लेकिन डिफॉल्ट जोखिम के साथ।',
            'aggressive-hybrid':'65–80% इक्विटी + 20–35% डेब्ट = सुचारु इक्विटी रिटर्न।',
            'conservative-hybrid':'75–90% डेब्ट + 10–25% इक्विटी — पूंजी सुरक्षा के साथ।',
            'arbitrage':'लगभग जोखिम-मुक्त रिटर्न, इक्विटी के रूप में कर — उच्च कर वालों के लिए।',
            'fof':'अन्य म्यूचुअल फंड में निवेश करने वाला फंड — तत्काल विविधीकरण।',
            'dynamic-bond':'फंड मैनेजर ब्याज दर के आधार पर अवधि सक्रिय रूप से समायोजित करता है।',
            'govt-savings':'सरकारी गारंटी — भारत में सर्वोच्च सुरक्षित दरें।'
        },
        te: {
            'large-cap':'భారత్ లో మార్కెట్ క్యాప్ ద్వారా టాప్ 100 కంపెనీలలో పెట్టుబడి.',
            'mid-cap':'రేపటి లార్జ్ క్యాప్ లపై పందెం — 101–250 రాంక్ కంపెనీలు.',
            'small-cap':'అధిక వృద్ధి — 251 మరియు అంతకు తక్కువ రాంక్ కంపెనీలు.',
            'flexi-cap':'ఫండ్ మేనేజర్ అన్ని మార్కెట్ క్యాప్ లలో అత్యుత్తమంగా ఎంపిక చేస్తాడు.',
            'multicap':'లార్జ్, మిడ్ & స్మాల్ లో 25% చొప్పున నిర్బంధం — నిజమైన వైవిధ్యం.',
            'elss':'సంవత్సరానికి ₹46,800 వరకు పన్ను ఆదా + ఈక్విటీ రాబడి.',
            'index':'Nifty 50/Sensex ను చాలా తక్కువ ఖర్చుతో ట్రాక్ చేయండి.',
            'etf':'ఇండెక్స్ ఫండ్ లాంటివి కానీ స్టాక్ ఎక్స్ఛేంజ్ లో షేర్ లలా ట్రేడ్ అవుతాయి.',
            'sectoral':'ఒక సెక్టార్ పై దృష్టి — బ్యాంకింగ్, IT, ఫార్మా, ఇన్‌ఫ్రా మొదలైనవి.',
            'international':'భారతీయ ఖాతా నుండి US, చైనా, గ్లోబల్ మార్కెట్లలో పెట్టుబడి.',
            'liquid':'మీ సేవింగ్స్ అకౌంట్ కంటే మెరుగు — అదే రోజు ఉపసంహరణ.',
            'ultra-short':'3–6 నెలల పార్కింగ్ అవసరాలకు లిక్విడ్ కంటే కొంచెం మెరుగు.',
            'short-duration':'1–3 సంవత్సరాల FD కి సమానమైన డెట్ ఫండ్ — మరింత పన్ను సమర్థమైనది.',
            'gilt':'శూన్య క్రెడిట్ రిస్క్ — కేవలం ప్రభుత్వ బాండ్లలో పెట్టుబడి.',
            'credit-risk':'తక్కువ రేటింగ్ బాండ్ల నుండి అధిక రాబడి — కానీ డిఫాల్ట్ రిస్క్ తో.',
            'aggressive-hybrid':'65–80% ఈక్విటీ + 20–35% డెట్ = సుగమంగా ఈక్విటీ రాబడి.',
            'conservative-hybrid':'75–90% డెట్ + 10–25% ఈక్విటీ — మూలధన రక్షణతో.',
            'arbitrage':'దాదాపు రిస్క్ రహిత రాబడి, ఈక్విటీగా పన్ను — అధిక పన్ను చెల్లింపుదారులకు.',
            'fof':'ఇతర మ్యూచువల్ ఫండ్లలో పెట్టుబడి పెట్టే ఫండ్ — తక్షణ వైవిధ్యం.',
            'dynamic-bond':'వడ్డీ రేటు అంచనాను బట్టి ఫండ్ మేనేజర్ కాలవ్యవధిని సర్దుబాటు చేస్తాడు.',
            'govt-savings':'సార్వభౌమ హామీ పెట్టుబడులు — భారత్ లో అత్యధిక సురక్షిత రేట్లు.'
        },
        ta: {
            'large-cap':'இந்தியாவின் சந்தை மூலதனத்தில் முதல் 100 நிறுவனங்களில் முதலீடு.',
            'mid-cap':'நாளைய லார்ஜ் கேப்களில் பந்தயம் — 101–250 தரவரிசை நிறுவனங்கள்.',
            'small-cap':'அதிவேக வளர்ச்சி — 251 மற்றும் அதற்கு கீழே தரவரிசை நிறுவனங்கள்.',
            'flexi-cap':'ஃபண்ட் மேனேஜர் அனைத்து சந்தை மூலதனங்களிலும் சிறந்ததை தேர்வு செய்கிறார்.',
            'multicap':'லார்ஜ், மிட் & ஸ்மால் கேப்பில் 25% கட்டாயம் — உண்மையான பல்வகைப்படுத்தல்.',
            'elss':'வருடாந்திர ₹46,800 வரை வரி சேமிப்பு + ஈக்விட்டி வருமானம்.',
            'index':'Nifty 50/Sensex ஐ மிகக் குறைந்த செலவில் கண்காணிக்கவும்.',
            'etf':'இண்டெக்ஸ் ஃபண்டுகள் போன்றது ஆனால் பங்குகள் போல் பரிவர்த்தனையில் வர்த்தகம்.',
            'sectoral':'ஒரு துறையில் முதலீடு — வங்கி, IT, ஃபார்மா, இன்ஃப்ரா போன்றவை.',
            'international':'இந்திய கணக்கிலிருந்து US, சீனா, உலக சந்தைகளில் முதலீடு.',
            'liquid':'உங்கள் சேமிப்பு கணக்கு மாற்று — அதிக வருமானம், அதே நாள் திரும்பப் பெறுதல்.',
            'ultra-short':'3–6 மாத நிறுத்தல் தேவைகளுக்கு லிக்விட்டை விட சற்று சிறந்தது.',
            'short-duration':'1–3 ஆண்டு FD க்கு சமான கடன் ஃபண்ட் — மிகவும் வரி திறனுள்ளது.',
            'gilt':'பூஜ்யம் கடன் ஆபத்து — அரசு பத்திரங்களில் மட்டும் முதலீடு.',
            'credit-risk':'குறைந்த தரம் கொண்ட பத்திரங்களிலிருந்து அதிக வருமானம் — இயல்புநிலை அபாயத்துடன்.',
            'aggressive-hybrid':'65–80% ஈக்விட்டி + 20–35% கடன் = சீரான ஈக்விட்டி வருமானம்.',
            'conservative-hybrid':'75–90% கடன் + 10–25% ஈக்விட்டி — மூலதன பாதுகாப்புடன்.',
            'arbitrage':'கிட்டத்தட்ட ஆபத்தற்ற வருமானம், ஈக்விட்டியாக வரி — அதிக வரி செலுத்துவோருக்கு.',
            'fof':'மற்ற மியூச்சுவல் ஃபண்டுகளில் முதலீடு செய்யும் ஃபண்ட் — உடனடி பல்வகைப்படுத்தல்.',
            'dynamic-bond':'வட்டி விகித கண்ணோட்டத்தின் அடிப்படையில் ஃபண்ட் மேனேஜர் காலத்தை சரிசெய்கிறார்.',
            'govt-savings':'இறையாண்மை உத்தரவாதமான கருவிகள் — இந்தியாவில் மிக உயர்ந்த பாதுகாப்பான விகிதங்கள்.'
        }
    };
    var _MF_CATS = {
        en:{'Equity':'Equity','Tax Saving':'Tax Saving','Passive':'Passive','Hybrid':'Hybrid','Debt':'Debt','Others':'Others','Govt Schemes':'Govt Schemes'},
        hi:{'Equity':'इक्विटी','Tax Saving':'कर बचत','Passive':'पैसिव','Hybrid':'हाइब्रिड','Debt':'डेब्ट','Others':'अन्य','Govt Schemes':'सरकारी योजना'},
        te:{'Equity':'ఈక్విటీ','Tax Saving':'పన్ను ఆదా','Passive':'పాసివ్','Hybrid':'హైబ్రిడ్','Debt':'డెట్','Others':'ఇతర','Govt Schemes':'ప్రభుత్వ పథకాలు'},
        ta:{'Equity':'ஈக்விட்டி','Tax Saving':'வரி சேமிப்பு','Passive':'பாசிவ்','Hybrid':'ஹைப்ரிட்','Debt':'கடன்','Others':'மற்றவை','Govt Schemes':'அரசு திட்டங்கள்'}
    };
    var _MF_RISKS = {
        en:{'Very Low':'Very Low Risk','Low':'Low Risk','Low–Medium':'Low–Medium Risk','Medium':'Medium Risk','Medium–High':'Medium–High Risk','High':'High Risk','Very High':'Very High Risk','Varies':'Varies'},
        hi:{'Very Low':'बहुत कम जोखिम','Low':'कम जोखिम','Low–Medium':'कम-मध्यम जोखिम','Medium':'मध्यम जोखिम','Medium–High':'मध्यम-उच्च जोखिम','High':'उच्च जोखिम','Very High':'बहुत उच्च जोखिम','Varies':'भिन्न'},
        te:{'Very Low':'చాలా తక్కువ రిస్క్','Low':'తక్కువ రిస్క్','Low–Medium':'తక్కువ-మధ్యస్థ రిస్క్','Medium':'మధ్యస్థ రిస్క్','Medium–High':'మధ్యస్థ-అధిక రిస్క్','High':'అధిక రిస్క్','Very High':'చాలా అధిక రిస్క్','Varies':'మారుతుంది'},
        ta:{'Very Low':'மிகவும் குறைந்த ஆபத்து','Low':'குறைந்த ஆபத்து','Low–Medium':'குறைந்த-நடுத்தர ஆபத்து','Medium':'நடுத்தர ஆபத்து','Medium–High':'நடுத்தர-அதிக ஆபத்து','High':'அதிக ஆபத்து','Very High':'மிகவும் அதிக ஆபத்து','Varies':'மாறுகிறது'}
    };
    function _mfName(id, fallback) { var d=_MF_NAMES[_lang]||_MF_NAMES.en; return d[id]||fallback; }
    function _mfTag(id, fallback)  { var d=_MF_TAGS[_lang]||_MF_TAGS.en;  return d[id]||fallback; }
    function _mfCat(label)         { var d=_MF_CATS[_lang]||_MF_CATS.en;  return d[label]||label; }
    function _mfRisk(label)        { var d=_MF_RISKS[_lang]||_MF_RISKS.en; return d[label]||(label+' Risk'); }


    /* ── Fund Picker Metric translation helpers ─────────────────── */
    var _MM_NAMES = {
        en: { alpha:'Alpha (α)', beta:'Beta (β)', sharpe:'Sharpe Ratio', stddev:'Standard Deviation',
              expense:'Expense Ratio', sortino:'Sortino Ratio', rsquared:'R-Squared (R²)',
              rollingreturn:'Rolling Returns', aum:'AUM & Fund Size', directvsregular:'Direct vs Regular Plan',
              exitloadtax:'Exit Load & Taxation', aumquickref:'AUM Size Quick Reference' },
        hi: { alpha:'अल्फा (α)', beta:'बीटा (β)', sharpe:'शार्प रेशियो', stddev:'मानक विचलन',
              expense:'व्यय अनुपात', sortino:'सॉर्टिनो रेशियो', rsquared:'R-स्क्वेयर्ड (R²)',
              rollingreturn:'रोलिंग रिटर्न', aum:'AUM और फंड आकार', directvsregular:'डायरेक्ट बनाम रेगुलर प्लान',
              exitloadtax:'एग्जिट लोड और कर', aumquickref:'AUM आकार त्वरित संदर्भ' },
        te: { alpha:'ఆల్ఫా (α)', beta:'బీటా (β)', sharpe:'షార్పే నిష్పత్తి', stddev:'ప్రామాణిక విచలనం',
              expense:'వ్యయ నిష్పత్తి', sortino:'సార్టినో నిష్పత్తి', rsquared:'R-స్క్వేర్డ్ (R²)',
              rollingreturn:'రోలింగ్ రాబడులు', aum:'AUM & ఫండ్ పరిమాణం', directvsregular:'డైరెక్ట్ vs రెగ్యులర్ ప్లాన్',
              exitloadtax:'ఎగ్జిట్ లోడ్ & పన్ను', aumquickref:'AUM పరిమాణం శీఘ్ర సూచన' },
        ta: { alpha:'ஆல்பா (α)', beta:'பீட்டா (β)', sharpe:'ஷார்ப் விகிதம்', stddev:'நிலையான விலகல்',
              expense:'செலவு விகிதம்', sortino:'சார்டினோ விகிதம்', rsquared:'R-ஸ்க்வேர்ட் (R²)',
              rollingreturn:'ரோலிங் வருமானங்கள்', aum:'AUM & ஃபண்ட் அளவு', directvsregular:'டைரக்ட் vs ரெகுலர் திட்டம்',
              exitloadtax:'வெளியேற்ற சுமை & வரி', aumquickref:'AUM அளவு விரைவு குறிப்பு' }
    };
    var _MM_TAGS = {
        en: { alpha:'How much extra return the fund delivered above its benchmark',
              beta:'How much the fund swings when the market moves',
              sharpe:'Return earned per unit of total risk taken',
              stddev:"How wildly the fund's returns fluctuate month to month",
              expense:'Annual fee the fund deducts from your corpus — every single year',
              sortino:'Like Sharpe, but only penalises downside volatility',
              rsquared:'How closely the fund tracks its benchmark index',
              rollingreturn:'Consistency of returns across every possible period — not cherry-picked dates',
              aum:'Too small = risky; too large = harder to outperform',
              directvsregular:'Same fund, same manager — but one silently costs you lakhs more',
              exitloadtax:"What you don't know about redemption can cost you dearly",
              aumquickref:'At-a-glance: ideal fund size by category' },
        hi: { alpha:'फंड ने अपने बेंचमार्क से कितना अतिरिक्त रिटर्न दिया',
              beta:'बाजार हिलने पर फंड कितना झूलता है',
              sharpe:'कुल जोखिम की प्रति इकाई पर अर्जित रिटर्न',
              stddev:'फंड का रिटर्न महीने-दर-महीने कितना बदलता है',
              expense:'फंड हर साल आपके कोष से काटता है — हर एक साल',
              sortino:'शार्प जैसा, लेकिन केवल नकारात्मक उतार-चढ़ाव को दंडित करता है',
              rsquared:'फंड अपने बेंचमार्क इंडेक्स को कितनी बारीकी से ट्रैक करता है',
              rollingreturn:'हर संभव अवधि में रिटर्न की स्थिरता — चुनी हुई तारीखें नहीं',
              aum:'बहुत छोटा = जोखिम; बहुत बड़ा = बेहतर प्रदर्शन कठिन',
              directvsregular:'एक ही फंड, एक ही मैनेजर — लेकिन एक चुपचाप लाखों अधिक खर्च करता है',
              exitloadtax:'रिडेम्पशन के बारे में अनजानी बातें आपको महंगी पड़ सकती हैं',
              aumquickref:'एक नजर में: श्रेणी के अनुसार आदर्श फंड आकार' },
        te: { alpha:'ఫండ్ తన బెంచ్‌మార్క్ కంటే ఎంత అదనపు రాబడి ఇచ్చింది',
              beta:'మార్కెట్ కదిలినప్పుడు ఫండ్ ఎంత హెచ్చుతగ్గులు చెందుతుంది',
              sharpe:'మొత్తం రిస్క్ యొక్క ప్రతి యూనిట్‌కు సంపాదించిన రాబడి',
              stddev:'ఫండ్ రాబడులు నెలవారీ ఎంత హెచ్చుతగ్గులు చెందుతాయి',
              expense:'ఫండ్ ప్రతి సంవత్సరం మీ కార్పస్ నుండి తీసుకునే వార్షిక రుసుము',
              sortino:'షార్పే లాంటిది కానీ కేవలం నష్టల ఒడిదుడుకులను మాత్రమే శిక్షిస్తుంది',
              rsquared:'ఫండ్ తన బెంచ్‌మార్క్ ఇండెక్స్‌ను ఎంత దగ్గరగా ట్రాక్ చేస్తుంది',
              rollingreturn:'ప్రతి సాధ్యమైన కాలం పెట్టుబడిలో రాబడుల స్థిరత్వం',
              aum:'చాలా చిన్నది = రిస్క్; చాలా పెద్దది = మెరుగైన పనితీరు కష్టం',
              directvsregular:'అదే ఫండ్, అదే మేనేజర్ — కానీ ఒకటి చాలా ఎక్కువ ఖర్చవుతుంది',
              exitloadtax:'రిడెంప్షన్ గురించి తెలియకపోవడం మీకు చాలా ఖర్చు అవుతుంది',
              aumquickref:'ఒక చూపులో: వర్గం వారీగా ఆదర్శ ఫండ్ పరిమాణం' },
        ta: { alpha:'ஃபண்ட் அதன் பெஞ்ச்மார்க்கை விட எவ்வளவு கூடுதல் வருமானம் அளித்தது',
              beta:'சந்தை நகரும்போது ஃபண்ட் எவ்வளவு ஊசலாடுகிறது',
              sharpe:'மொத்த ஆபத்தின் ஒவ்வொரு அலகிலும் சம்பாதித்த வருமானம்',
              stddev:'ஃபண்டின் வருமானம் மாதந்தோறும் எவ்வளவு மாறுகிறது',
              expense:'ஃபண்ட் ஒவ்வொரு ஆண்டும் உங்கள் கார்பஸில் இருந்து கழிக்கும் கட்டணம்',
              sortino:'ஷார்ப் போன்றது ஆனால் கீழ்நோக்கிய ஏற்ற இறக்கத்தை மட்டுமே தண்டிக்கிறது',
              rsquared:'ஃபண்ட் அதன் பெஞ்ச்மார்க் இண்டெக்ஸை எவ்வளவு நெருக்கமாக கண்காணிக்கிறது',
              rollingreturn:'சாத்தியமான ஒவ்வொரு காலகட்டத்திலும் வருமான நிலைத்தன்மை',
              aum:'மிகவும் சிறியது = ஆபத்தானது; மிகவும் பெரியது = சிறந்த செயல்திறன் கஷ்டம்',
              directvsregular:'அதே ஃபண்ட், அதே மேனேஜர் — ஆனால் ஒன்று அதிகமாக செலவாகிறது',
              exitloadtax:'மீட்பு பற்றி தெரியாமல் இருப்பது உங்களுக்கு விலையுயர்ந்ததாக இருக்கும்',
              aumquickref:'ஒரே பார்வையில்: வகையின்படி சிறந்த ஃபண்ட் அளவு' }
    };
    var _MM_GOODLABEL = {
        hi: { alpha:'सकारात्मक = प्रबंधक मूल्य जोड़ता है', beta:'~1.0 = बाजार के साथ चलता है',
              sharpe:'>1.0 = अच्छा जोखिम-रिटर्न संतुलन', stddev:'कम SD = अधिक अनुमानित',
              expense:'कम = आपके पास अधिक रिटर्न', sortino:'>1.0 = अच्छी हानि सुरक्षा',
              rsquared:'~75-85% = प्रबंधक सक्रिय निर्णय ले रहा है',
              rollingreturn:'सुसंगत सकारात्मक = विश्वसनीय प्रबंधक',
              aum:'श्रेणी के लिए सही आकार', directvsregular:'डायरेक्ट प्लान = पूरा अल्फा रखें',
              exitloadtax:'>1yr रखें इक्विटी LTCG लाभ के लिए',
              aumquickref:'गोल्डीलॉक्स जोन: स्थिर फिर भी चुस्त' },
        te: { alpha:'సానుకూలం = మేనేజర్ విలువ జోడిస్తాడు', beta:'~1.0 = మార్కెట్‌తో కదులుతుంది',
              sharpe:'>1.0 = మంచి రిస్క్-రాబడి సమతుల్యత', stddev:'తక్కువ SD = మరింత అంచనా',
              expense:'తక్కువ = మీకు ఎక్కువ రాబడి', sortino:'>1.0 = మంచి నష్ట రక్షణ',
              rsquared:'~75-85% = మేనేజర్ నిజమైన నిర్ణయాలు తీసుకుంటున్నారు',
              rollingreturn:'స్థిరమైన సానుకూలం = నమ్మకమైన మేనేజర్',
              aum:'దాని వర్గానికి సరైన పరిమాణం', directvsregular:'డైరెక్ట్ ప్లాన్ = పూర్తి ఆల్ఫా',
              exitloadtax:'ఈక్విటీ LTCG లాభం కోసం >1yr ఉంచండి',
              aumquickref:'గోల్డీలాక్స్ జోన్: స్థిరంగా అయినా చురుగ్గా' },
        ta: { alpha:'நேர்மறை = மேனேஜர் மதிப்பை சேர்க்கிறார்', beta:'~1.0 = சந்தையுடன் நகர்கிறது',
              sharpe:'>1.0 = சிறந்த ஆபத்து-வருமான சமன்பாடு', stddev:'குறைந்த SD = கணிக்கக்கூடியது',
              expense:'குறைவானது = உங்களுக்கு அதிக வருமானம்', sortino:'>1.0 = சிறந்த கீழ்நோக்கிய பாதுகாப்பு',
              rsquared:'~75-85% = மேனேஜர் உண்மையான முடிவுகள் எடுக்கிறார்',
              rollingreturn:'நிலையான நேர்மறை = நம்பகமான மேனேஜர்',
              aum:'அதன் வகைக்கு சரியான அளவு', directvsregular:'டைரக்ட் திட்டம் = முழு ஆல்பா',
              exitloadtax:'ஈக்விட்டி LTCG நன்மைக்கு >1yr வைக்கவும்',
              aumquickref:'கோல்டிலாக்ஸ் மண்டலம்: நிலையான ஆனால் சுறுசுறுப்பான' }
    };
    var _MM_BADLABEL = {
        hi: { alpha:'नकारात्मक = इंडेक्स फंड पर स्विच करें', beta:'>1.2 = बढ़े हुए उतार-चढ़ाव',
              sharpe:'<0.5 = रिटर्न के लिए अत्यधिक जोखिम', stddev:'उच्च SD = NAV में जंगली झूले',
              expense:'उच्च अनुपात = मूक धन नाशक', sortino:'<0.5 = लगातार बुरे महीने',
              rsquared:'>95% = सस्ते इंडेक्स फंड पर स्विच करें',
              rollingreturn:'उच्च भिन्नता = भाग्यशाली या नुकसान',
              aum:'बहुत छोटा = नाजुक; बहुत बड़ा = इंडेक्स जैसा',
              directvsregular:'रेगुलर प्लान = मूक कमीशन नुकसान',
              exitloadtax:'जल्दी भुनाएं = एग्जिट लोड + STCG कर',
              aumquickref:'दायरे से बाहर = संरचनात्मक प्रदर्शन बाधा' },
        te: { alpha:'ప్రతికూలం = ఇండెక్స్ ఫండ్‌కు మారండి', beta:'>1.2 = వర్ధిల్లిన ఊగిసలాటలు',
              sharpe:'<0.5 = రాబడికి అధిక రిస్క్', stddev:'అధిక SD = NAV లో తీవ్ర హెచ్చుతగ్గులు',
              expense:'అధిక నిష్పత్తి = మూక సంపద నాశకం', sortino:'<0.5 = తరచుగా చెడు నెలలు',
              rsquared:'>95% = చౌక ఇండెక్స్ ఫండ్‌కు మారండి',
              rollingreturn:'అధిక వ్యత్యాసం = అదృష్టం లేదా హాని',
              aum:'చాలా చిన్నది = బలహీనం; చాలా పెద్దది = ఇండెక్స్ లాంటిది',
              directvsregular:'రెగ్యులర్ ప్లాన్ = మూక కమిషన్ నష్టం',
              exitloadtax:'త్వరగా రీడీమ్ = ఎగ్జిట్ లోడ్ + STCG పన్ను',
              aumquickref:'పరిధి వెలుపల = నిర్మాణపరమైన పనితీరు అడ్డంకి' },
        ta: { alpha:'எதிர்மறை = இண்டெக்ஸ் ஃபண்டுக்கு மாறுங்கள்', beta:'>1.2 = பெரிதாக்கப்பட்ட ஊசலாட்டங்கள்',
              sharpe:'<0.5 = வருமானத்திற்கு அதிக ஆபத்து', stddev:'அதிக SD = NAV இல் கடுமையான மாற்றங்கள்',
              expense:'அதிக விகிதம் = அமைதியான செல்வம் அழிப்பான்', sortino:'<0.5 = அடிக்கடி மோசமான மாதங்கள்',
              rsquared:'>95% = மலிவான இண்டெக்ஸ் ஃபண்டுக்கு மாறுங்கள்',
              rollingreturn:'அதிக மாறுபாடு = அதிர்ஷ்டம் அல்லது தொல்லை',
              aum:'மிகவும் சிறியது = பலவீனமானது; மிகவும் பெரியது = இண்டெக்ஸ் போன்றது',
              directvsregular:'ரெகுலர் திட்டம் = அமைதியான கமிஷன் இழப்பு',
              exitloadtax:'விரைவாக மீட்கவும் = வெளியேற்ற சுமை + STCG வரி',
              aumquickref:'வரம்பிற்கு வெளியே = கட்டமைப்பு செயல்திறன் தடை' }
    };

    /* Fund body translations for modal */
    var _MF_BODY = {
        hi: {
            'large-cap': { what:'लार्ज कैप फंड भारत की शीर्ष 100 कंपनियों (रिलायंस, TCS, HDFC बैंक) में कम से कम 80% निवेश करते हैं। ये उद्योग के नेता हैं जिनके पास मजबूत बैलेंस शीट है।', scenarios:'पहली बार इक्विटी निवेशकों के लिए आदर्श। 5-7 साल के लक्ष्यों के लिए उपयुक्त।', avoid:'3 साल से कम की अवधि या बाजार से बेहतर रिटर्न की उम्मीद रखने वालों के लिए नहीं।', example:'रोहन ₹10,000/माह SIP करता है। 10 साल में ~11% CAGR पर ₹12L बढ़कर ~₹21.9L हो जाता है।' },
            'mid-cap': { what:'मिड कैप फंड बाजार पूंजी के अनुसार 101-250 रैंक की कंपनियों में कम से कम 65% निवेश करते हैं — भविष्य के लार्ज कैप।', scenarios:'7-10+ साल के निवेशकों के लिए। लार्ज कैप फंड के साथ 20-30% सैटेलाइट आवंटन के रूप में।', avoid:'आपातकाल, अल्पकालिक लक्ष्य, या 30-40% गिरावट पर घबराने वालों के लिए नहीं।', example:'प्रिया ₹5,000/माह कोटक इमर्जिंग फंड में। 12 साल में ~15% CAGR पर ₹7.2L → ~₹22.5L।' },
            'small-cap': { what:'स्मॉल कैप 251 और उससे नीचे रैंक की कंपनियों में कम से कम 65% निवेश — उच्च जोखिम, उच्च रिटर्न।', scenarios:'10+ साल के अनुभवी निवेशकों के लिए। SIP के माध्यम से पोर्टफोलियो का 10-15%।', avoid:'7-10 साल से कम किसी भी लक्ष्य के लिए बिल्कुल नहीं। 50-60% गिरावट संभव।', example:'आर्यन ₹3,000/माह SBI स्मॉल कैप में। 15 साल में ~18% CAGR पर ₹5.4L → ~₹31.2L।' },
            'flexi-cap': { what:'फ्लेक्सी कैप लार्ज, मिड या स्मॉल किसी भी आकार में निवेश कर सकता है। मैनेजर बाजार स्थितियों के अनुसार बदलाव करता है।', scenarios:'एक ही फंड में इक्विटी समाधान चाहने वालों के लिए। 5-10 साल के SIP निवेशकों के लिए।', avoid:'यदि आप अपने मार्केट कैप आवंटन पर नियंत्रण चाहते हैं।', example:'सुनीता ₹15,000/माह पराग पारिख फंड में। 7 साल में ₹12.6L → ₹24L+।' },
            'multicap': { what:'मल्टी कैप SEBI नियमानुसार लार्ज, मिड और स्मॉल कैप में 25-25% अनिवार्य निवेश — पारदर्शी विविधीकरण।', scenarios:'एक फंड में सभी मार्केट कैप में विविधीकरण चाहने वालों के लिए। 7+ साल।', avoid:'रूढ़िवादी निवेशकों के लिए नहीं — अनिवार्य स्मॉल कैप एक्सपोजर।', example:'विक्रम ₹8,000/माह। 10 साल में ~14% पर ₹9.6L → ₹24.3L।' },
            'elss': { what:'ELSS धारा 80C के तहत ₹1.5L तक कर कटौती। 3 साल लॉक-इन के साथ इक्विटी फंड। सबसे कम लॉक-इन।', scenarios:'कर बचाने वाले इक्विटी निवेशकों के लिए #1 विकल्प। प्रभावी रिटर्न 30% स्लैब पर 20%+ हो सकता है।', avoid:'3 साल में तरलता चाहिए तो नहीं।', example:'काव्या (30% स्लैब) ₹1.5L/साल। 10 साल में → ₹28.5L। हर साल ₹46,800 कर बचत।' },
            'index': { what:'इंडेक्स फंड Nifty 50 जैसे इंडेक्स को दोहराते हैं। कोई स्टॉक पिकिंग नहीं। अल्ट्रा-लो खर्च (0.05-0.20%)।', scenarios:'शुरुआती निवेशकों के लिए आदर्श। "लगाओ और भूल जाओ।" दीर्घकालिक संपत्ति निर्माण।', avoid:'बाजार से बेहतर रिटर्न की उम्मीद रखने वालों के लिए नहीं।', example:'रितु ₹5,000/माह UTI Nifty 50 में। 20 साल में 12% CAGR पर ₹12L → ₹49.9L।' },
            'etf': { what:'ETF स्टॉक एक्सचेंज पर शेयरों की तरह ट्रेड होते हैं। इंडेक्स फंड से भी कम खर्च (0.02-0.05%)।', scenarios:'Demat खाते वाले निवेशकों के लिए। एकमुश्त और इंट्राडे लचीलेपन के लिए।', avoid:'SIP निवेशकों के लिए नहीं (मासिक खरीदारी मैन्युअल)।', example:'शिवम ₹50,000 Nippon Nifty Bees ETF। 10 साल में ₹50K → ₹1.55L।' },
            'sectoral': { what:'सेक्टोरल फंड एक सेक्टर (बैंकिंग, IT, फार्मा) में 80%+ निवेश। उच्च रिटर्न लेकिन उच्च जोखिम।', scenarios:'केवल सेक्टर के गहरे जानकारों के लिए। 5-10% टैक्टिकल आवंटन।', avoid:'कोर होल्डिंग के रूप में नहीं। किसी एकल सेक्टर में 10-15% से अधिक नहीं।', example:'दीपक ने मार्च 2020 में फार्मा फंड में ₹2L निवेश किया। 2022 तक ₹4.4L — 120% रिटर्न।' },
            'international': { what:'अंतर्राष्ट्रीय फंड विदेशी शेयरों में निवेश — US, चीन। रुपये की कमजोरी से लाभ।', scenarios:'भौगोलिक विविधीकरण के लिए 10-20%। USD एक्सपोजर।', avoid:'वर्तमान में SEBI प्रतिबंध। मुद्रा जोखिम।', example:'अनन्या का US-झुका फंड। USD 10% मजबूत हुआ → INR में 22%+ रिटर्न।' },
            'liquid': { what:'लिक्विड फंड 91 दिनों तक के अल्पकालिक ऋण साधनों में निवेश। बचत खाते से बेहतर।', scenarios:'आपातकालीन निधि पार्किंग। ज्ञात खर्च से पहले।', avoid:'दीर्घकालिक निवेश के लिए नहीं।', example:'नेहा ₹2L Nippon Liquid Fund में। 6 माह में ₹6,500 — बचत खाते के दोगुने।' },
            'ultra-short': { what:'अल्ट्रा शॉर्ट ड्यूरेशन 3-6 महीने की परिपक्वता। लिक्विड से थोड़ा अधिक रिटर्न।', scenarios:'3-6 महीने में पैसा चाहिए — अग्रिम कर, बीमा प्रीमियम।', avoid:'1-7 दिन में पैसा चाहिए तो नहीं।', example:'राज कार डाउन पेमेंट के लिए ₹3L। 5 महीने में ₹8,750 — बचत खाते से बेहतर।' },
            'short-duration': { what:'शॉर्ट ड्यूरेशन 1-3 साल की अवधि के बॉन्ड। FD का म्यूचुअल फंड विकल्प।', scenarios:'1-3 साल के लक्ष्यों के लिए FD से बेहतर रिटर्न।', avoid:'ब्याज दर बढ़ने पर अस्थायी नुकसान संभव।', example:'सुरेश बहन की शादी के लिए ₹5L। 2 साल में ₹5.79L — FD से ₹29,000 अधिक।' },
            'gilt': { what:'गिल्ट फंड सरकारी प्रतिभूतियों में निवेश। शून्य क्रेडिट जोखिम, लेकिन ब्याज दर संवेदनशील।', scenarios:'ब्याज दर गिरने पर FD से बेहतर रिटर्न। रूढ़िवादी निवेशकों के लिए।', avoid:'ब्याज दर बढ़ने पर NAV तेजी से गिर सकता है।', example:'2019-20 में RBI के दर कटौती के दौरान Nippon Gilt Fund ने 14-18% रिटर्न दिया।' },
            'credit-risk': { what:'क्रेडिट रिस्क फंड AA से कम रेटिंग वाले बॉन्ड में 65%+ निवेश। उच्च रिटर्न, उच्च जोखिम।', scenarios:'3+ साल के अनुभवी निवेशकों के लिए। केवल 5-10% सैटेलाइट।', avoid:'रूढ़िवादी निवेशकों के लिए बिल्कुल नहीं।', example:'फ्रैंकलिन इंडिया 2020 — 6 स्कीम फ्रीज। क्रेडिट रिस्क की कठिन सीख।' },
            'aggressive-hybrid': { what:'65-80% इक्विटी + 20-35% डेब्ट। स्वचालित एसेट आवंटन। अस्थिरता कम।', scenarios:'पहली बार इक्विटी निवेशकों के लिए। 5-10 साल के एकल फंड समाधान।', avoid:'मजबूत बुल मार्केट में शुद्ध इक्विटी से पिछड़ सकता है।', example:'मीना ₹15,000/माह ICICI Eq&Debt Fund। COVID में 25% ही गिरा (Nifty 38% गिरा)।' },
            'conservative-hybrid': { what:'75-90% डेब्ट + 10-25% इक्विटी। FD से बेहतर, कम अस्थिरता।', scenarios:'वरिष्ठ नागरिकों, सेवानिवृत्तों के लिए। 2-3 साल के लक्ष्यों के लिए।', avoid:'दीर्घकालिक लक्ष्यों के लिए पूर्ण समाधान नहीं।', example:'शांता ICICI Regular Savings Fund में। 80% डेब्ट + 20% इक्विटी से ~8-9% वार्षिक।' },
            'arbitrage': { what:'आर्बिट्राज फंड कैश और फ्यूचर्स मार्केट के बीच मूल्य अंतर का फायदा उठाता है। इक्विटी कर लाभ।', scenarios:'30% टैक्स ब्रैकेट वालों के लिए। 3 महीने-1 साल। FD से बेहतर कर दक्षता।', avoid:'कम टैक्स ब्रैकेट में इक्विटी टैक्स लाभ कम।', example:'विवेक (30%) ₹10L आर्बिट्राज में 8 महीने। 5.8% — FD + कर के बाद से बेहतर।' },
            'fof': { what:'FoF अन्य म्यूचुअल फंड में निवेश करता है। एक ही फंड में तत्काल विविधीकरण।', scenarios:'नौसिखिए निवेशकों के लिए। विदेशी इंडेक्स (Nasdaq 100) तक पहुंच।', avoid:'दोहरी खर्च परतें। इक्विटी के बावजूद डेब्ट कर।', example:'पूजा Motilal Nasdaq 100 FOF में ₹50K। 5 साल में → ₹1.1L।' },
            'dynamic-bond': { what:'डायनेमिक बॉन्ड फंड ब्याज दर अनुमान के आधार पर अवधि सक्रिय रूप से बदलता है।', scenarios:'3+ साल, ब्याज दर जोखिम का पेशेवर प्रबंधन चाहने वालों के लिए।', avoid:'मैनेजर के गलत अनुमान से नुकसान।', example:'2019-20 में ICICI All Seasons Bond ने ~13% दिया। 2022 में जो लॉन्ग रहे वो नुकसान में।' },
            'govt-savings': { what:'PPF (7.1%, कर-मुक्त), SCSS (8.2%, 60+), POMIS (7.4%), NSC (7.7%), KVP। सरकारी गारंटी।', scenarios:'रूढ़िवादी निवेशकों, वरिष्ठ नागरिकों के लिए। Tier-2/3 शहरों में। Demat के बिना।', avoid:'1-15 साल लॉक-इन। PPF छोड़कर ब्याज कर योग्य।', example:'श्याम ₹30L SCSS + ₹9L POMIS + ₹11L PPF। सभी जीवन-यापन खर्च बिना बाजार जोखिम।' }
        },
        te: {
            'large-cap': { what:'లార్జ్ క్యాప్ ఫండ్లు భారత టాప్ 100 కంపెనీలలో 80%+ పెట్టుబడి పెడతాయి. పరిశ్రమ నాయకులు.', scenarios:'మొదటిసారి ఈక్విటీ పెట్టుబడిదారులకు ఆదర్శం. 5-7 సంవత్సరాల లక్ష్యాలకు.', avoid:'3 సంవత్సరాల కంటే తక్కువ కాలానికి లేదా అధిక రాబడి ఆశించేవారికి కాదు.', example:'రోహన్ ₹10,000/నెల. 10 సంవత్సరాలలో ₹12L → ~₹21.9L.' },
            'mid-cap': { what:'మిడ్ క్యాప్ ఫండ్లు 101-250 రాంక్ కంపెనీలలో 65%+ పెట్టుబడి — రేపటి లార్జ్ క్యాప్లు.', scenarios:'7-10+ సంవత్సరాల పెట్టుబడిదారులకు. లార్జ్ క్యాప్‌తో పాటు 20-30% శాటిలైట్.', avoid:'అత్యవసర నిధి, స్వల్పకాలిక లక్ష్యాలకు కాదు.', example:'ప్రియ ₹5,000/నెల కోటక్ ఎమర్జింగ్ ఫండ్‌లో. 12 సంవత్సరాలలో ₹7.2L → ~₹22.5L.' },
            'small-cap': { what:'స్మాల్ క్యాప్ 251+ రాంక్ కంపెనీలలో 65%+ పెట్టుబడి. అధిక వృద్ధి, అధిక రిస్క్.', scenarios:'10+ సంవత్సరాల అనుభవజ్ఞుల కోసం. SIP ద్వారా పోర్ట్‌ఫోలియోలో 10-15%.', avoid:'7-10 సంవత్సరాల కంటే తక్కువ ఏ లక్ష్యానికైనా అసలే కాదు. 50-60% పతనం సాధ్యం.', example:'ఆర్యన్ ₹3,000/నెల SBI స్మాల్ క్యాప్‌లో. 15 సంవత్సరాలలో ₹5.4L → ~₹31.2L.' },
            'flexi-cap': { what:'ఫ్లెక్సీ క్యాప్ ఏ పరిమాణంలోనైనా పెట్టుబడి పెట్టవచ్చు. మేనేజర్ మార్కెట్ పరిస్థితుల ఆధారంగా నిర్ణయిస్తాడు.', scenarios:'ఒకే ఫండ్‌లో ఈక్విటీ పరిష్కారం కోసం. 5-10 సంవత్సరాల SIP పెట్టుబడిదారులకు.', avoid:'మార్కెట్ క్యాప్ కేటాయింపుపై నియంత్రణ కావాలంటే కాదు.', example:'సునీత ₹15,000/నెల పరాగ్ పారిఖ్‌లో. 7 సంవత్సరాలలో ₹12.6L → ₹24L+.' },
            'multicap': { what:'మల్టీ క్యాప్ SEBI నిబంధన ప్రకారం లార్జ్, మిడ్, స్మాల్ లో 25-25% తప్పనిసరి — వైవిధ్యం.', scenarios:'ఒకే ఫండ్‌లో అన్ని మార్కెట్ క్యాప్‌లలో వైవిధ్యం కోసం. 7+ సంవత్సరాలు.', avoid:'రక్షణాత్మక పెట్టుబడిదారులకు కాదు — తప్పనిసరి స్మాల్ క్యాప్ ఎక్స్పోజర్.', example:'విక్రమ్ ₹8,000/నెల. 10 సంవత్సరాలలో ~14% CAGR లో ₹9.6L → ₹24.3L.' },
            'elss': { what:'ELSS Sec 80C కింద ₹1.5L వరకు పన్ను మినహాయింపు. 3 సంవత్సరాల లాక్-ఇన్. అత్యల్ప లాక్-ఇన్.', scenarios:'పన్ను ఆదా చేస్తూ ఈక్విటీ రిస్క్ భరించేవారికి #1 ఎంపిక.', avoid:'3 సంవత్సరాలలో వెనక్కి తీసుకోవాల్సిన వారికి కాదు.', example:'కావ్య (30% స్లాబ్) ₹1.5L/సంవత్సరం. 10 సంవత్సరాలలో → ₹28.5L. ప్రతి సంవత్సరం ₹46,800 పన్ను ఆదా.' },
            'index': { what:'ఇండెక్స్ ఫండ్లు Nifty 50 లాంటి ఇండెక్స్‌ను నకలు చేస్తాయి. అల్ట్రా-తక్కువ ఖర్చు (0.05-0.20%).', scenarios:'ప్రారంభ పెట్టుబడిదారులకు ఆదర్శం. "పెట్టి మర్చిపో." దీర్ఘకాలిక సంపద నిర్మాణం.', avoid:'మార్కెట్‌ను అధిగమించాలంటే కాదు.', example:'రితు ₹5,000/నెల UTI Nifty 50లో. 20 సంవత్సరాలలో 12% CAGR లో ₹12L → ₹49.9L.' },
            'etf': { what:'ETF లు స్టాక్ ఎక్స్ఛేంజ్‌లో షేర్ల మాదిరి వర్తకం చేస్తాయి. చాలా తక్కువ ఖర్చు (0.02-0.05%).', scenarios:'డీమ్యాట్ ఖాతా ఉన్న పెట్టుబడిదారులకు. ఒకేసారి పెట్టుబడికి.', avoid:'SIP పెట్టుబడిదారులకు కాదు (నెలవారీ మాన్యువల్ కొనుగోలు).', example:'శివం ₹50,000 Nippon Nifty Bees ETF. 10 సంవత్సరాలలో ₹50K → ₹1.55L.' },
            'sectoral': { what:'సెక్టోరల్ ఫండ్లు ఒక సెక్టార్‌లో (బ్యాంకింగ్, IT, ఫార్మా) 80%+ పెట్టుబడి. అధిక రిటర్న్, అధిక రిస్క్.', scenarios:'సెక్టార్‌పై లోతైన అవగాహన ఉన్నవారికి మాత్రమే. 5-10% టాక్టికల్ కేటాయింపు.', avoid:'కోర్ హోల్డింగ్‌గా కాదు. ఒకే సెక్టార్‌లో 10-15%కి మించి వద్దు.', example:'దీపక్ మార్చి 2020 లో ఫార్మా ఫండ్‌లో ₹2L. 2022 నాటికి ₹4.4L — 120% రిటర్న్.' },
            'international': { what:'అంతర్జాతీయ ఫండ్లు విదేశీ స్టాక్స్‌లో పెట్టుబడి — US, చైనా. రూపాయి తగ్గుదల నుండి లాభం.', scenarios:'భౌగోళిక వైవిధ్యం కోసం 10-20%. USD ఎక్స్పోజర్.', avoid:'ప్రస్తుతం SEBI ఆంక్షలు. కరెన్సీ రిస్క్.', example:'అనన్య US-మొగ్గు ఫండ్‌లో. USD 10% బలపడింది → INR లో 22%+ రిటర్న్.' },
            'liquid': { what:'లిక్విడ్ ఫండ్లు 91 రోజుల వరకు స్వల్పకాలిక సాధనాల్లో పెట్టుబడి. సేవింగ్స్ అకౌంట్ కంటే మెరుగు.', scenarios:'అత్యవసర నిధి పార్కింగ్. తెలిసిన ఖర్చుకు ముందు.', avoid:'దీర్ఘకాలిక పెట్టుబడికి కాదు.', example:'నేహా ₹2L Nippon Liquid Fund లో. 6 నెలల్లో ₹6,500 — సేవింగ్స్ అకౌంట్ రెట్టింపు.' },
            'ultra-short': { what:'అల్ట్రా షార్ట్ డ్యూరేషన్ 3-6 నెలల పోర్ట్‌ఫోలియో. లిక్విడ్ కంటే కొంచెం ఎక్కువ రాబడి.', scenarios:'3-6 నెలల్లో నిధులు అవసరం — అడ్వాన్స్ పన్ను, బీమా ప్రీమియం.', avoid:'1-7 రోజుల్లో నిధులు అవసరమైతే లిక్విడ్ ఫండ్ వాడండి.', example:'రాజ్ కారు డౌన్ పేమెంట్ కోసం ₹3L. 5 నెలల్లో ₹8,750 — సేవింగ్స్ అకౌంట్ కంటే మెరుగు.' },
            'short-duration': { what:'షార్ట్ డ్యూరేషన్ 1-3 సంవత్సరాల అవధి బాండ్లు. FD కి మ్యూచువల్ ఫండ్ ప్రత్యామ్నాయం.', scenarios:'1-3 సంవత్సరాల లక్ష్యాలకు FD కంటే మెరుగైన రాబడి.', avoid:'వడ్డీ రేట్లు పెరిగినప్పుడు తాత్కాలిక నష్టాలు సాధ్యం.', example:'సురేష్ చెల్లెలి పెళ్లికి ₹5L. 2 సంవత్సరాలలో ₹5.79L — FD కంటే ₹29,000 అధికం.' },
            'gilt': { what:'గిల్ట్ ఫండ్లు ప్రభుత్వ సెక్యూరిటీల్లో పెట్టుబడి. శూన్య క్రెడిట్ రిస్క్, కానీ వడ్డీ రేట్ సెన్సిటివ్.', scenarios:'వడ్డీ రేట్లు పడిపోతాయని నమ్మినప్పుడు. FD కంటే మెరుగైన రాబడి.', avoid:'వడ్డీ రేట్లు పెరుగుతున్న సమయంలో NAV తీవ్రంగా పడిపోవచ్చు.', example:'2019-20లో RBI రేట్లు తగ్గించినప్పుడు Nippon Gilt Fund 14-18% ఇచ్చింది.' },
            'credit-risk': { what:'క్రెడిట్ రిస్క్ AA కంటే తక్కువ రేటింగ్ బాండ్లలో 65%+ పెట్టుబడి. అధిక రాబడి, అధిక రిస్క్.', scenarios:'3+ సంవత్సరాల అనుభవజ్ఞుల కోసం. కేవలం 5-10% శాటిలైట్.', avoid:'రక్షణాత్మక పెట్టుబడిదారులకు అసలే వద్దు.', example:'ఫ్రాంక్లిన్ ఇండియా 2020 — 6 స్కీమ్లు ఫ్రీజ్ అయ్యాయి. క్రెడిట్ రిస్క్ యొక్క కఠినమైన పాఠం.' },
            'aggressive-hybrid': { what:'65-80% ఈక్విటీ + 20-35% డెట్. స్వయంచాలక ఆస్తి కేటాయింపు. తక్కువ అస్థిరత.', scenarios:'మొదటిసారి ఈక్విటీ పెట్టుబడిదారులకు. 5-10 సంవత్సరాల ఒకే ఫండ్ పరిష్కారం.', avoid:'బులిష్ మార్కెట్లో స్వచ్ఛమైన ఈక్విటీ ఫండ్ కంటే వెనకబడవచ్చు.', example:'మీన ₹15,000/నెల ICICI Eq&Debt Fund. COVID లో 25% మాత్రమే పడింది (Nifty 38% పడింది).' },
            'conservative-hybrid': { what:'75-90% డెట్ + 10-25% ఈక్విటీ. FD కంటే మెరుగు, తక్కువ అస్థిరత.', scenarios:'వృద్ధులు, రిటైర్డ్ వ్యక్తులకు. 2-3 సంవత్సరాల లక్ష్యాలకు.', avoid:'దీర్ఘకాలిక లక్ష్యాలకు పూర్తి పరిష్కారం కాదు.', example:'శాంత ICICI Regular Savings Fund లో. 80% డెట్ + 20% ఈక్విటీ → ~8-9% వార్షికం.' },
            'arbitrage': { what:'ఆర్బిట్రేజ్ ఫండ్ కాష్ మరియు ఫ్యూచర్స్ మార్కెట్ మధ్య ధర వ్యత్యాసాన్ని ఉపయోగిస్తుంది. ఈక్విటీ పన్ను ప్రయోజనం.', scenarios:'30% పన్ను స్లాబ్ వారికి. 3 నెలలు-1 సంవత్సరం. FD కంటే పన్ను సమర్థత.', avoid:'తక్కువ పన్ను స్లాబ్‌లో ఈక్విటీ పన్ను ప్రయోజనం తక్కువ.', example:'వివేక్ (30%) ₹10L ఆర్బిట్రేజ్‌లో 8 నెలలు. 5.8% — FD + పన్ను కంటే మెరుగు.' },
            'fof': { what:'FoF ఇతర మ్యూచువల్ ఫండ్లలో పెట్టుబడి పెడుతుంది. ఒకే ఫండ్‌లో తక్షణ వైవిధ్యం.', scenarios:'నవ్యులైన పెట్టుబడిదారులకు. విదేశీ ఇండెక్స్‌లకు (Nasdaq 100) ప్రవేశం.', avoid:'రెండు పొరల ఖర్చులు. ఈక్విటీ అయినా డెట్ పన్ను.', example:'పూజ Motilal Nasdaq 100 FOF లో ₹50K. 5 సంవత్సరాలలో → ₹1.1L.' },
            'dynamic-bond': { what:'డైనమిక్ బాండ్ ఫండ్ వడ్డీ రేట్ అంచనాల ఆధారంగా కాలవ్యవధిని చురుగ్గా సర్దుబాటు చేస్తుంది.', scenarios:'3+ సంవత్సరాలు, వడ్డీ రేట్ రిస్క్ నిర్వహణ కోసం.', avoid:'మేనేజర్ తప్పు అంచనా వేస్తే నష్టాలు.', example:'2019-20లో ICICI All Seasons Bond ~13% ఇచ్చింది. 2022లో లాంగ్ ఉన్నవారికి నష్టం.' },
            'govt-savings': { what:'PPF (7.1%, పన్ను రహిత), SCSS (8.2%, 60+), POMIS, NSC. ప్రభుత్వ హామీ సాధనాలు.', scenarios:'రక్షణాత్మక పెట్టుబడిదారులకు, వృద్ధులకు, Tier-2/3 నగరాలకు.', avoid:'1-15 సంవత్సరాల లాక్-ఇన్. PPF మినహా వడ్డీ పన్ను పాత్రం.', example:'శ్యామ్ ₹30L SCSS + ₹9L POMIS + ₹11L PPF. మార్కెట్ రిస్క్ లేకుండా జీవన ఖర్చులు.' }
        },
        ta: {
            'large-cap': { what:'லார்ஜ் கேப் ஃபண்டுகள் இந்தியாவின் டாப் 100 நிறுவனங்களில் 80%+ முதலீடு. துறை தலைவர்கள்.', scenarios:'முதல்முறை ஈக்விட்டி முதலீட்டாளருக்கு சிறந்தது. 5-7 ஆண்டு இலக்குகளுக்கு.', avoid:'3 ஆண்டுகளுக்கும் குறைவான காலம் அல்லது சந்தையை மிஞ்சும் எதிர்பார்ப்புக்கு இல்லை.', example:'ரோஹன் ₹10,000/மாதம். 10 ஆண்டுகளில் ₹12L → ~₹21.9L.' },
            'mid-cap': { what:'மிட் கேப் 101-250 தரவரிசை நிறுவனங்களில் 65%+ முதலீடு — நாளைய லார்ஜ் கேப்கள்.', scenarios:'7-10+ ஆண்டு முதலீட்டாளருக்கு. லார்ஜ் கேப்புடன் 20-30% செயட்டலைட் கேட்டாயிப்பு.', avoid:'அவசரகால நிதி, குறுகிய கால இலக்குகளுக்கு இல்லை.', example:'ப்ரியா ₹5,000/மாதம் கோடக் எமர்ஜிங் ஃபண்டில். 12 ஆண்டுகளில் ₹7.2L → ~₹22.5L.' },
            'small-cap': { what:'ஸ்மால் கேப் 251+ தரவரிசை நிறுவனங்களில் 65%+ — அதிக வளர்ச்சி, அதிக ஆபத்து.', scenarios:'10+ ஆண்டு அனுபவமுள்ள முதலீட்டாளருக்கு. SIP மூலம் 10-15%.', avoid:'7-10 ஆண்டுகளுக்கும் குறைவான எந்த இலக்குக்கும் இல்லை. 50-60% வீழ்ச்சி சாத்தியம்.', example:'ஆர்யன் ₹3,000/மாதம் SBI ஸ்மால் கேப்பில். 15 ஆண்டுகளில் ₹5.4L → ~₹31.2L.' },
            'flexi-cap': { what:'ஃப்லெக்சி கேப் எந்த அளவிலும் முதலீடு செய்யலாம். மேனேஜர் சந்தை நிலைமைகளுக்கு ஏற்ப மாற்றுகிறார்.', scenarios:'ஒரே ஃபண்டில் ஈக்விட்டி தீர்வு. 5-10 ஆண்டு SIP முதலீட்டாளருக்கு.', avoid:'சந்தை மூலதன கேட்டாயிப்பை நீங்களே கட்டுப்படுத்த விரும்பினால் இல்லை.', example:'சுனிதா ₹15,000/மாதம் பரக் பரிக்கில். 7 ஆண்டுகளில் ₹12.6L → ₹24L+.' },
            'multicap': { what:'மல்டி கேப் SEBI விதிப்படி லார்ஜ், மிட், ஸ்மால்லில் 25-25% கட்டாயம் — வெளிப்படையான பல்வகைப்படுத்தல்.', scenarios:'ஒரே ஃபண்டில் அனைத்து மார்க்கெட் கேப்களிலும் பல்வகைப்படுத்தல் விரும்புவோருக்கு.', avoid:'பழமைவாத முதலீட்டாளருக்கு இல்லை — கட்டாய ஸ்மால் கேப் வெளிப்பாடு.', example:'விக்ரம் ₹8,000/மாதம். 10 ஆண்டுகளில் ~14% CAGR லில் ₹9.6L → ₹24.3L.' },
            'elss': { what:'ELSS Sec 80C கீழ் ₹1.5L வரை வரி விலக்கு. 3 ஆண்டு பூட்டுதல். குறைந்தபட்ச பூட்டுதல்.', scenarios:'வரி சேமிக்கும் ஈக்விட்டி முதலீட்டாளருக்கு #1 தேர்வு.', avoid:'3 ஆண்டுகளில் பணம் தேவைப்படுவோருக்கு இல்லை.', example:'காவ்யா (30% தட்டு) ₹1.5L/ஆண்டு. 10 ஆண்டுகளில் → ₹28.5L. ஆண்டுதோறும் ₹46,800 வரி சேமிப்பு.' },
            'index': { what:'இண்டெக்ஸ் ஃபண்டுகள் Nifty 50 போன்ற இண்டெக்ஸை நகலெடுக்கின்றன. மிகவும் குறைந்த செலவு.', scenarios:'தொடக்க முதலீட்டாளருக்கு சிறந்தது. "பணம் போட்டு மறந்து போ." நீண்டகால செல்வ கட்டமைப்பு.', avoid:'சந்தையை மிஞ்சும் எதிர்பார்ப்பிற்கு இல்லை.', example:'ரிது ₹5,000/மாதம் UTI Nifty 50 இல். 20 ஆண்டுகளில் 12% CAGR லில் ₹12L → ₹49.9L.' },
            'etf': { what:'ETF கள் பங்குச் சந்தையில் பங்குகள் போல் வர்த்தகம் செய்யப்படுகின்றன. மிகவும் குறைந்த செலவு.', scenarios:'டீமேட் கணக்கு உள்ள முதலீட்டாளருக்கு. ஒரு தடவை முதலீட்டுக்கு.', avoid:'SIP முதலீட்டாளருக்கு இல்லை (மாதாந்திர கைமுறை வாங்குதல்).', example:'சிவம் ₹50,000 Nippon Nifty Bees ETF. 10 ஆண்டுகளில் ₹50K → ₹1.55L.' },
            'sectoral': { what:'சதுரல் ஃபண்டுகள் ஒரு துறையில் (வங்கி, IT, ஃபார்மா) 80%+ முதலீடு. அதிக வருமானம், அதிக ஆபத்து.', scenarios:'துறையில் ஆழமான புரிதல் உள்ளவருக்கு மட்டுமே. 5-10% தந்திரோபாய கேட்டாயிப்பு.', avoid:'முக்கிய வைத்திருப்பாக இல்லை. ஒரே துறையில் 10-15% மேல் வேண்டாம்.', example:'தீபக் மார்ச் 2020 இல் ஃபார்மா ஃபண்டில் ₹2L. 2022 வரை ₹4.4L — 120% வருமானம்.' },
            'international': { what:'சர்வதேச ஃபண்டுகள் வெளிநாட்டு பங்குகளில் — US, சீனா. ரூபாய் தேய்மானத்தில் லாபம்.', scenarios:'புவியியல் பல்வகைப்படுத்தலுக்கு 10-20%. USD வெளிப்பாடு.', avoid:'தற்போது SEBI கட்டுப்பாடுகள். நாணய ஆபத்து.', example:'அனன்யாவின் US சாய்வு ஃபண்டு. USD 10% வலுவடைந்தது → INR இல் 22%+ வருமானம்.' },
            'liquid': { what:'லிக்விட் ஃபண்டுகள் 91 நாட்கள் வரை கடன் கருவிகளில் முதலீடு. சேமிப்பு கணக்கை விட சிறந்தது.', scenarios:'அவசரகால நிதி நிறுத்தல். தெரிந்த செலவுகளுக்கு முன்பு.', avoid:'நீண்டகால முதலீட்டுக்கு இல்லை.', example:'நேஹா ₹2L Nippon Liquid Fund இல். 6 மாதத்தில் ₹6,500 — சேமிப்பு கணக்கை விட இரட்டிப்பு.' },
            'ultra-short': { what:'அல்ட்ரா ஷார்ட் டுரேஷன் 3-6 மாத போர்ட்ஃபோலியோ. லிக்விட்டை விட சற்று அதிக வருமானம்.', scenarios:'3-6 மாதத்தில் பணம் தேவை — முன்கூட்டிய வரி, காப்பீட்டு பிரீமியம்.', avoid:'1-7 நாட்களில் பணம் தேவை என்றால் லிக்விட் ஃபண்ட் பயன்படுத்துங்கள்.', example:'ராஜ் கார் டவுன் பேமெண்ட்டுக்கு ₹3L. 5 மாதத்தில் ₹8,750 — சேமிப்பு கணக்கை விட சிறந்தது.' },
            'short-duration': { what:'ஷார்ட் டுரேஷன் 1-3 ஆண்டு கடன் பத்திரங்கள். FD க்கு மியூச்சுவல் ஃபண்ட் மாற்றீடு.', scenarios:'1-3 ஆண்டு இலக்குகளுக்கு FD ஐ விட சிறந்த வருமானம்.', avoid:'வட்டி விகிதம் உயரும்போது தற்காலிக நஷ்டங்கள் சாத்தியம்.', example:'சுரேஷ் தங்கை திருமணத்திற்கு ₹5L. 2 ஆண்டுகளில் ₹5.79L — FD ஐ விட ₹29,000 அதிகம்.' },
            'gilt': { what:'கில்ட் ஃபண்டுகள் அரசு பத்திரங்களில் முதலீடு. பூஜ்ய கடன் ஆபத்து, ஆனால் வட்டி விகித உணர்திறன்.', scenarios:'வட்டி விகிதம் குறையும் என்று நம்பும்போது. FD ஐ விட சிறந்த வருமானம்.', avoid:'வட்டி விகிதம் உயரும் சுழற்சியில் NAV கூர்மையாக குறையலாம்.', example:'2019-20 இல் RBI விகிதம் குறைத்தபோது Nippon Gilt Fund 14-18% அளித்தது.' },
            'credit-risk': { what:'கிரெடிட் ரிஸ்க் AA க்கும் குறைவான தரமதிப்பு பத்திரங்களில் 65%+ முதலீடு. அதிக வருமானம், அதிக ஆபத்து.', scenarios:'3+ ஆண்டு அனுபவமுள்ளவர்களுக்கு. கேவலம் 5-10% செயட்டலைட்.', avoid:'பழமைவாத முதலீட்டாளருக்கு முற்றிலும் வேண்டாம்.', example:'ஃபிராங்க்லின் இந்தியா 2020 — 6 திட்டங்கள் உறைந்தன. கிரெடிட் ரிஸ்க்கின் கடினமான பாடம்.' },
            'aggressive-hybrid': { what:'65-80% ஈக்விட்டி + 20-35% கடன். தானியங்கி சொத்து கேட்டாயிப்பு. குறைந்த ஏற்ற இறக்கம்.', scenarios:'முதல்முறை ஈக்விட்டி முதலீட்டாளருக்கு. 5-10 ஆண்டு ஒரே ஃபண்ட் தீர்வு.', avoid:'பலமான காளை சந்தையில் தூய ஈக்விட்டி ஃபண்டை விட பின்தங்கலாம்.', example:'மீனா ₹15,000/மாதம் ICICI Eq&Debt Fund. COVID இல் 25% மட்டுமே குறைந்தது (Nifty 38% குறைந்தது).' },
            'conservative-hybrid': { what:'75-90% கடன் + 10-25% ஈக்விட்டி. FD ஐ விட சிறந்தது, குறைந்த ஏற்ற இறக்கம்.', scenarios:'மூத்த குடிமக்கள், ஓய்வுபெற்றவர்களுக்கு. 2-3 ஆண்டு இலக்குகளுக்கு.', avoid:'நீண்டகால இலக்குகளுக்கு முழுமையான தீர்வு இல்லை.', example:'சாந்தா ICICI Regular Savings Fund இல். 80% கடன் + 20% ஈக்விட்டி → ~8-9% வருடாந்திரம்.' },
            'arbitrage': { what:'ஆர்பிட்ரேஜ் ஃபண்ட் பண மற்றும் ஃப்யூச்சர்ஸ் சந்தை இடையே விலை வித்தியாசத்தை பயன்படுத்துகிறது. ஈக்விட்டி வரி நன்மை.', scenarios:'30% வரி தட்டினருக்கு. 3 மாதம்-1 ஆண்டு. FD ஐ விட வரி திறனுள்ளது.', avoid:'குறைந்த வரி தட்டில் ஈக்விட்டி வரி நன்மை குறைவு.', example:'விவேக் (30%) ₹10L ஆர்பிட்ரேஜில் 8 மாதங்கள். 5.8% — FD + வரிக்கு பிறகு விட சிறந்தது.' },
            'fof': { what:'FoF மற்ற மியூச்சுவல் ஃபண்டுகளில் முதலீடு செய்கிறது. ஒரே ஃபண்டில் உடனடி பல்வகைப்படுத்தல்.', scenarios:'தொடக்கநிலை முதலீட்டாளருக்கு. வெளிநாட்டு இண்டெக்ஸ்களுக்கு (Nasdaq 100) அணுகல்.', avoid:'இரட்டை செலவு அடுக்குகள். ஈக்விட்டியாக இருந்தாலும் கடன் வரி.', example:'பூஜா Motilal Nasdaq 100 FOF இல் ₹50K. 5 ஆண்டுகளில் → ₹1.1L.' },
            'dynamic-bond': { what:'டைனமிக் பாண்ட் ஃபண்ட் வட்டி விகித அவுட்லுக் அடிப்படையில் காலத்தை தீவிரமாக சரிசெய்கிறது.', scenarios:'3+ ஆண்டுகள், வட்டி விகித ஆபத்து நிர்வாகம் விரும்புவோருக்கு.', avoid:'மேனேஜர் தவறான அனுமானம் வைத்தால் நஷ்டங்கள்.', example:'2019-20 இல் ICICI All Seasons Bond ~13% அளித்தது. 2022 இல் நீளமாக இருந்தவர்களுக்கு நஷ்டம்.' },
            'govt-savings': { what:'PPF (7.1%, வரி இல்லாத), SCSS (8.2%, 60+), POMIS, NSC. இறையாண்மை உத்தரவாதம்.', scenarios:'பழமைவாத முதலீட்டாளர், மூத்த குடிமக்கள், Tier-2/3 நகர வாசிகளுக்கு.', avoid:'1-15 ஆண்டு பூட்டுதல். PPF தவிர வட்டி வரிக்குட்பட்டது.', example:'சியாம் ₹30L SCSS + ₹9L POMIS + ₹11L PPF. சந்தை ஆபத்தில்லாமல் வாழ்க்கை செலவுகள்.' }
        }
    };

    function _mfWhat(id, fallback)     { var d=(_MF_BODY[_lang]||{})[id]; return d?d.what:fallback; }
    function _mfScenarios(id, fallback){ var d=(_MF_BODY[_lang]||{})[id]; return d?d.scenarios:fallback; }
    function _mfAvoid(id, fallback)    { var d=(_MF_BODY[_lang]||{})[id]; return d?d.avoid:fallback; }
    function _mfExampleModal(id, fb)   { return fb; } /* keep examples in EN — fund names/numbers */

    function _mMetricName(id, fallback)     { var d=(_MM_NAMES[_lang]||_MM_NAMES.en); return d[id]||fallback; }
    function _mMetricTagline(id, fallback)  { var d=(_MM_TAGS[_lang]||_MM_TAGS.en);   return d[id]||fallback; }
    function _mMetricGoodLabel(id, fallback){ var d=(_MM_GOODLABEL[_lang]||{}); return d[id]||fallback; }
    function _mMetricBadLabel(id, fallback) { var d=(_MM_BADLABEL[_lang]||{}); return d[id]||fallback; }
    function _mMetricGoodRange(id, fb) { return fb; }   /* keep ranges in EN — concise technical */
    function _mMetricBadRange(id, fb)  { return fb; }
    function _mMetricDesc(id, fallback) {
        var descMap = {
            hi: {
                alpha:'अल्फा फंड मैनेजर के कौशल को मापता है। +2 अल्फा = बेंचमार्क से 2% अधिक। नकारात्मक अल्फा = इंडेक्स फंड बेहतर होता।',
                beta:'बीटा बाजार के सापेक्ष फंड की अस्थिरता बताता है। 1.2 बीटा = Nifty 10% गिरे तो फंड 12% गिरेगा। उच्च बीटा = उच्च जोखिम और पुरस्कार।',
                sharpe:'शार्प रेशियो = (फंड रिटर्न − जोखिम-मुक्त दर) ÷ मानक विचलन। "क्या अतिरिक्त रिटर्न अतिरिक्त जोखिम के लायक था?" 1.5 अच्छा; 2+ उत्कृष्ट।',
                stddev:'मानक विचलन रिटर्न की अस्थिरता मापता है। 15% रिटर्न और 5% SD स्थिर है। वही फंड 20% SD के साथ -5% से 35% तक जा सकता है।',
                expense:'व्यय अनुपात AMC द्वारा लिया जाने वाला वार्षिक शुल्क है। ₹10L पर 1.5% = ₹15,000/साल। 20 साल में 0.5% और 1.5% का अंतर लाखों में।',
                sortino:'शार्प सभी अस्थिरता को दंडित करता है। सॉर्टिनो केवल नकारात्मक जोखिम को। ऊपर जाने वाले झूले के लिए दंड नहीं — अधिक निवेशक-अनुकूल।',
                rsquared:'R² बताता है कि फंड की गति का कितना % बेंचमार्क से मेल खाता है। R² 95%+ और उच्च व्यय = आप सक्रिय शुल्क पर निष्क्रिय प्रदर्शन पा रहे हैं।',
                rollingreturn:'रोलिंग रिटर्न हर संभव शुरुआत तारीख पर रिटर्न की गणना करता है। उच्च औसत + कम भिन्नता = वास्तव में सुसंगत।',
                aum:'AUM श्रेणी के अनुसार मायने रखता है। ₹500 Cr से कम = कमजोर। मिड-स्मॉल में ₹50,000 Cr+ = प्रदर्शन कठिन। "गोल्डीलॉक्स जोन" खोजें।',
                directvsregular:'हर फंड दो प्लान देता है: डायरेक्ट (AMC से सीधे) और रेगुलर (दलाल के माध्यम से)। फंड, मैनेजर, रणनीति 100% समान — केवल व्यय अनुपात अलग।',
                exitloadtax:'एग्जिट लोड = एक विशेष अवधि के भीतर भुनाने पर जुर्माना। इक्विटी LTCG (>1 साल): ₹1.25L से ऊपर 12.5%। STCG (<1 साल): 20%।',
                aumquickref:'AUM सीमाएं सभी के लिए एक नहीं हैं। लार्ज कैप में ₹50,000 Cr ठीक है; स्मॉल कैप में प्रदर्शन की आपदा। श्रेणी के अनुसार "गोल्डीलॉक्स जोन" खोजें।'
            },
            te: {
                alpha:'ఆల్ఫా ఫండ్ మేనేజర్ నైపుణ్యాన్ని కొలుస్తుంది. +2 ఆల్ఫా = బెంచ్‌మార్క్ కంటే 2% ఎక్కువ. నెగటివ్ ఆల్ఫా = ఇండెక్స్ ఫండ్ మెరుగు.',
                beta:'బీటా మార్కెట్‌కు సంబంధించి ఫండ్ అస్థిరతను తెలియజేస్తుంది. 1.2 బీటా = Nifty 10% పడితే ఫండ్ 12% పడుతుంది. అధిక బీటా = అధిక రిస్క్ మరియు రివార్డ్.',
                sharpe:'షార్పే నిష్పత్తి = (ఫండ్ రాబడి − రిస్క్-ఫ్రీ రేట్) ÷ ప్రామాణిక విచలనం. "అదనపు రాబడి అదనపు రిస్క్ కు విలువైనదా?" 1.5 మంచిది; 2+ అద్భుతం.',
                stddev:'ప్రామాణిక విచలనం రాబడి అస్థిరతను కొలుస్తుంది. 15% రాబడి మరియు 5% SD స్థిరంగా ఉంటుంది. అదే ఫండ్ 20% SD తో -5% నుండి 35% వరకు వెళ్ళవచ్చు.',
                expense:'వ్యయ నిష్పత్తి AMC వసూలు చేసే వార్షిక రుసుము. ₹10L పై 1.5% = ₹15,000/సంవత్సరం. 20 సంవత్సరాలలో 0.5% మరియు 1.5% వ్యత్యాసం లక్షలలో ఉంటుంది.',
                sortino:'షార్పే అన్ని అస్థిరతను శిక్షిస్తుంది. సార్టినో కేవలం నష్టాల రిస్క్‌నే. పైకి వెళ్ళడానికి శిక్ష లేదు — పెట్టుబడిదారుకు అనుకూలం.',
                rsquared:'R² ఫండ్ కదలిక ఎంత % బెంచ్‌మార్క్‌కు సరిపోతుందో చెప్తుంది. R² 95%+ మరియు అధిక ఖర్చు = సక్రియ రుసుముకు నిష్క్రియ ప్రవర్తన.',
                rollingreturn:'రోలింగ్ రాబడులు ప్రతి సాధ్యమైన ప్రారంభ తేదీన రాబడిని లెక్కిస్తాయి. అధిక సగటు + తక్కువ వ్యత్యాసం = నిజంగా స్థిరమైనది.',
                aum:'AUM వర్గానికి అనుగుణంగా ముఖ్యం. ₹500 Cr కంటే తక్కువ = బలహీనం. మిడ్-స్మాల్‌లో ₹50,000 Cr+ = పనితీరు కష్టం. "గోల్డీలాక్స్ జోన్" వెతకండి.',
                directvsregular:'ప్రతి ఫండ్ రెండు ప్లాన్లు ఇస్తుంది: డైరెక్ట్ (AMC నుండి నేరుగా) మరియు రెగ్యులర్ (బ్రోకర్ ద్వారా). ఫండ్, మేనేజర్, వ్యూహం 100% ఒకటే — కేవలం వ్యయ నిష్పత్తి వేరు.',
                exitloadtax:'ఎగ్జిట్ లోడ్ = నిర్దిష్ట కాలంలో రీడీమ్ చేసినప్పుడు జరిమానా. ఈక్విటీ LTCG (>1 సంవత్సరం): ₹1.25L పై 12.5%. STCG (<1 సంవత్సరం): 20%.',
                aumquickref:'AUM పరిమితులు అన్ని వర్గాలకు ఒకే విధంగా ఉండవు. లార్జ్ క్యాప్‌లో ₹50,000 Cr మంచిది; స్మాల్ క్యాప్‌లో పనితీరు విపత్తు. వర్గానికి అనుగుణంగా "గోల్డీలాక్స్ జోన్" వెతకండి.'
            },
            ta: {
                alpha:'ஆல்பா ஃபண்ட் மேனேஜரின் திறனை அளவிடுகிறது. +2 ஆல்பா = பெஞ்ச்மார்க்கை விட 2% அதிகம். எதிர்மறை ஆல்பா = இண்டெக்ஸ் ஃபண்ட் சிறந்தது.',
                beta:'பீட்டா சந்தையுடன் ஒப்பிடும்போது ஃபண்டின் நிலையற்ற தன்மையை கூறுகிறது. 1.2 பீட்டா = Nifty 10% குறைந்தால் ஃபண்ட் 12% குறையும். அதிக பீட்டா = அதிக ஆபத்து மற்றும் வெகுமதி.',
                sharpe:'ஷார்ப் விகிதம் = (ஃபண்ட் வருமானம் − ஆபத்தில்லா விகிதம்) ÷ நிலையான விலகல். "கூடுதல் வருமானம் கூடுதல் ஆபத்துக்கு மதிப்புள்ளதா?" 1.5 நல்லது; 2+ சிறப்பானது.',
                stddev:'நிலையான விலகல் வருமான ஏற்ற இறக்கத்தை அளவிடுகிறது. 15% வருமானம் மற்றும் 5% SD நிலையானது. அதே ஃபண்ட் 20% SD உடன் -5% முதல் 35% வரை செல்லலாம்.',
                expense:'செலவு விகிதம் AMC வசூலிக்கும் வருடாந்திர கட்டணம். ₹10L மீது 1.5% = ₹15,000/ஆண்டு. 20 ஆண்டுகளில் 0.5% மற்றும் 1.5% வித்தியாசம் லட்சங்களில்.',
                sortino:'ஷார்ப் அனைத்து ஏற்ற இறக்கத்தையும் தண்டிக்கிறது. சார்டினோ கீழ்நோக்கிய ஆபத்தை மட்டுமே. மேல்நோக்கிய ஊஞ்சலுக்கு தண்டனை இல்லை — முதலீட்டாளருக்கு நட்பானது.',
                rsquared:'R² ஃபண்டின் இயக்கத்தில் எவ்வளவு % பெஞ்ச்மார்க்குடன் பொருந்துகிறது என்று கூறுகிறது. R² 95%+ மற்றும் அதிக செலவு = செயல்முறை கட்டணத்திற்கு செயலற்ற நடவடிக்கை.',
                rollingreturn:'ரோலிங் வருமானங்கள் ஒவ்வொரு சாத்தியமான தொடக்க தேதியிலும் வருமானத்தை கணக்கிடுகின்றன. அதிக சராசரி + குறைந்த மாறுபாடு = உண்மையிலேயே நிலையானது.',
                aum:'AUM வகையைப் பொறுத்து முக்கியம். ₹500 Cr கீழ் = பலவீனமானது. மிட்-ஸ்மால்லில் ₹50,000 Cr+ = செயல்திறன் கஷ்டம். "கோல்டிலாக்ஸ் மண்டலம்" தேடுங்கள்.',
                directvsregular:'ஒவ்வொரு ஃபண்டும் இரண்டு திட்டங்கள் வழங்குகிறது: டைரக்ட் (AMC யிடம் நேரடியாக) மற்றும் ரெகுலர் (தரகர் மூலம்). ஃபண்ட், மேனேஜர், உத்தி 100% ஒன்றே — செலவு விகிதம் மட்டும் வேறு.',
                exitloadtax:'வெளியேற்ற சுமை = குறிப்பிட்ட காலத்திற்குள் மீட்கும்போது அபராதம். ஈக்விட்டி LTCG (>1 ஆண்டு): ₹1.25L மேல் 12.5%. STCG (<1 ஆண்டு): 20%.',
                aumquickref:'AUM வரம்புகள் அனைத்து வகைகளுக்கும் ஒரே மாதிரி இல்லை. லார்ஜ் கேப்பில் ₹50,000 Cr நல்லது; ஸ்மால் கேப்பில் செயல்திறன் பேரழிவு. "கோல்டிலாக்ஸ் மண்டலம்" தேடுங்கள்.'
            }
        };
        if (_lang === 'en') return fallback;
        var d = (descMap[_lang]||{}); return d[id]||fallback;
    }
    function _mMetricTip(id, fallback) { return fallback; }    /* technical tips — keep EN */
    function _mMetricExample(id, fb)   { return fb; }          /* examples have fund names — keep EN */

    function setSplashLang(lang) {
        // Update both the splash buttons and the nav buttons
        _lang = lang;
        try { localStorage.setItem('aw_lang', lang); } catch(e) {}
        ['en','hi','te','ta'].forEach(function(l) {
            var sb = document.getElementById('slt-' + l);
            if (sb) sb.classList.toggle('splash-lang-active', l === lang);
            var nb = document.getElementById('lt-' + l);
            if (nb) nb.classList.toggle('lang-btn-active', l === lang);
        });
        // applyLang() works on all data-i18n elements including splash
        applyLang();
    }

    function setLang(lang) {
        _lang = lang;
        try { localStorage.setItem('aw_lang', lang); } catch(e) {}
        ['en','hi','te','ta'].forEach(function(l) {
            var b = document.getElementById('lt-' + l);
            if (b) b.classList.toggle('lang-btn-active', l === lang);
            var sb = document.getElementById('slt-' + l);
            if (sb) sb.classList.toggle('splash-lang-active', l === lang);
        });
        applyLang();
    }

    function applyLang() {
        /* 1. Translate all static data-i18n elements */
        document.querySelectorAll('[data-i18n]').forEach(function(el) {
            var key = el.getAttribute('data-i18n');
            var val = _t(key);
            if (val && val !== key) el.textContent = val;
        });
        /* 1b. Translate elements with HTML content (data-i18n-html) */
        document.querySelectorAll('[data-i18n-html]').forEach(function(el) {
            var key = el.getAttribute('data-i18n-html');
            var val = _t(key);
            if (val && val !== key) el.innerHTML = val;
        });

        /* 2. Patch "New Regime" dropdown option labels with current FY year */
        ['tx-regime','nps-regime','ctc-regime','grat-regime','gc-regime'].forEach(function(id) {
            var sel = document.getElementById(id);
            if (sel && sel.options[0]) {
                sel.options[0].text = 'New Regime (' + _fyStr + ')';
            }
        });

        /* 3. WhatsApp share buttons (contain SVG child) */
        var waLabel = _lang === 'hi' ? 'WhatsApp पर शेयर करें'
                    : _lang === 'te' ? 'WhatsApp లో షేర్ చేయండి'
                    : _lang === 'ta' ? 'WhatsApp இல் பகிர்'
                    : 'Share on WhatsApp';
        document.querySelectorAll('.wa-share-btn').forEach(function(btn) {
            var svg = btn.querySelector('svg');
            if (!svg) return;
            btn.innerHTML = '';
            btn.appendChild(svg);
            btn.appendChild(document.createTextNode(' ' + waLabel));
        });

        /* 3. Health Score — re-translate live grade if already scored */
        var gradeEl = document.getElementById('hs-grade-title');
        if (gradeEl && gradeEl.dataset.gradeKey) {
            gradeEl.textContent = _t('hs.grade.' + gradeEl.dataset.gradeKey);
            var descEl = document.getElementById('hs-grade-desc');
            if (descEl) descEl.textContent = _t('hs.desc.' + gradeEl.dataset.gradeKey);
            var badgeEl = document.getElementById('hs-grade-badge');
            if (badgeEl) badgeEl.textContent = _t('hs.grade.' + gradeEl.dataset.gradeKey);
        }
        /* 4. "Not scored yet" badge */
        var badge = document.getElementById('hs-grade-badge');
        if (badge && (!badge.textContent.trim() || badge.textContent === _T.en['hs.notscored'] ||
            badge.textContent === _T.hi['hs.notscored'] || badge.textContent === _T.te['hs.notscored'] ||
            badge.textContent === _T.ta['hs.notscored'])) {
            badge.textContent = _t('hs.notscored');
        }

        /* Reset MF Kit and Fund Picker so they re-render with new language */
        if (typeof _mfRendered !== 'undefined') {
            _mfRendered = false;
            _pickerRendered = false;
            var _mfGrid = document.getElementById('mf-tiles-grid');
            if (_mfGrid && _mfGrid.children.length > 0) {
                renderMFKit();
            }
            var _pkGrid = document.getElementById('picker-metric-cards');
            if (_pkGrid && _pkGrid.children.length > 0) {
                renderFundPickerPage();
            }
        }
    }

    /* ── HS grade key map (English grade → short key) ─────── */
    var _HS_GRADE_KEYS = {
        'Financial Rockstar 🤘': 'rockstar',
        'Wealth Builder':        'builder',
        'On the Right Track':    'track',
        'Getting There':         'getting',
        'Wake-Up Call':          'wakeup',
        'SOS Mode':              'sos',
        'Financial Emergency':   'emergency'
    };

    /* ── HS category key map (English name → short key) ──── */
    var _HS_CAT_KEYS = {
        'Savings Rate':    'savings',
        'Debt Burden':     'debt',
        'Health Insurance':'health',
        'Term Insurance':  'term',
        'Emergency Fund':  'ef',
        'Spending Control':'spend',
        'Age Readiness':   'age'
    };

    /* ── Startup ─────────────────────────────────────────── */
    document.addEventListener('DOMContentLoaded', function() {
        try { _lang = localStorage.getItem('aw_lang') || 'en'; } catch(e) {}
        ['en','hi','te','ta'].forEach(function(l) {
            var b = document.getElementById('lt-' + l);
            if (b) b.classList.toggle('lang-btn-active', l === _lang);
            var sb = document.getElementById('slt-' + l);
            if (sb) sb.classList.toggle('splash-lang-active', l === _lang);
        });
        if (_lang !== 'en') applyLang();
    });