// =====================================================================
//  RETURNS CALCULATOR — reverse of the Growth Calculator
//  Invested amount + current value + years → actual annualized return.
//  Lumpsum: closed-form CAGR. SIP/Annual: bisection on the same
//  annuity-due FV formula calcGrowthOrInflation() uses, so the solved
//  rate reproduces the Growth Calculator's FV exactly. SIP results are
//  quoted as EFFECTIVE annual ((1+i)^12−1, the XIRR convention MF apps
//  use), not the nominal rate the Growth Calculator takes as input.
// =====================================================================

var _rcChart = null;

function rcFmt(el) {
    var raw = (el.value || '').replace(/[^0-9]/g, '');
    if (!raw) { el.value = ''; return; }
    var n = parseInt(raw, 10);
    var s = n.toString();
    if (s.length <= 3) { el.value = s; return; }
    el.value = s.slice(0,-3).replace(/\B(?=(\d{2})+(?!\d))/g,',') + ',' + s.slice(-3);
}

function rcNum(id) {
    var el = document.getElementById(id);
    return el ? (parseFloat((el.value || '').replace(/[^0-9.]/g,'')) || 0) : 0;
}

function _rcInrFull(n) {
    if (isNaN(n) || n === null) return '₹0';
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
}

// FV of an annuity-due: P invested at the START of each of n periods, rate i per period.
// Same formula as the Growth Calculator's SIP/annual projection.
function _rcAnnuityFV(P, i, n) {
    if (Math.abs(i) < 1e-10) return P * n;
    return P * ((Math.pow(1 + i, n) - 1) / i) * (1 + i);
}

// Solve the periodic rate i such that _rcAnnuityFV(P, i, n) === target.
// FV is monotonically increasing in i for i > -1, so plain bisection is robust.
function _rcSolveRate(P, n, target) {
    var lo = -0.99, hi = 5;
    if (_rcAnnuityFV(P, lo, n) >= target) return lo;
    if (_rcAnnuityFV(P, hi, n) <= target) return hi;
    for (var k = 0; k < 200; k++) {
        var mid = (lo + hi) / 2;
        if (_rcAnnuityFV(P, mid, n) < target) lo = mid; else hi = mid;
    }
    return (lo + hi) / 2;
}

// The first amount input means different things per type: a one-time total for
// lumpsum, but a per-installment amount for SIP/annual — the user shouldn't have
// to work out "₹10,000 × 60 months" themselves, so we do that multiplication.
// All three defaults describe the same ₹6,00,000 total over the default 5 years,
// so switching type doesn't move the worked example.
var RC_AMT_DEFAULTS = { lumpsum: '6,00,000', sip: '10,000', annually: '1,20,000' };

function _rcType() {
    return document.getElementById('rc-type')?.value || 'sip';
}

function _rcAmtDefault() {
    return RC_AMT_DEFAULTS[_rcType()] || RC_AMT_DEFAULTS.lumpsum;
}

// Placeholder handling lives here rather than inline in the panel HTML because
// the "untouched example" value now changes with the selected type.
function rcFocusAmt(el) {
    if (el.value === _rcAmtDefault()) el.value = '';
    el.classList.remove('text-slate-400');
}

function rcBlurAmt(el) {
    if (el.value) { el.classList.remove('text-slate-400'); return; }
    el.value = _rcAmtDefault();
    el.classList.add('text-slate-400');
    rcCalc();
}

function _rcUpdateAmtLabel() {
    var T = function(key, fb) { return (typeof _t === 'function') ? _t(key) : fb; };
    var el = document.getElementById('rc-amt-label');
    if (!el) return;
    var type = _rcType();
    var key = type === 'sip'      ? 'lbl.rc.amt.sip'
            : type === 'annually' ? 'lbl.rc.amt.annual'
            :                       'lbl.rc.invested';
    var fb  = type === 'sip'      ? 'Monthly SIP Amount (₹)'
            : type === 'annually' ? 'Yearly Investment Amount (₹)'
            :                       'Total Amount Invested (₹)';
    // Keep data-i18n in sync so a later applyLang() re-translates to the same label
    el.setAttribute('data-i18n', key);
    el.textContent = T(key, fb);
}

// Total actually put in, derived from the per-installment amount for SIP/annual.
// 'annually' multiplies by fractional years so that perYear in rcCalc() divides
// back to exactly the entered amount — the solved rate stays true to the input.
function _rcTotalInvested(type, amount, months) {
    if (!amount || !months) return 0;
    if (type === 'sip')      return amount * months;
    if (type === 'annually') return amount * (months / 12);
    return amount;
}

function rcTypeChange() {
    var el = document.getElementById('rc-invested');
    // Still showing the untouched example — swap it for the new type's equivalent
    if (el && el.classList.contains('text-slate-400')) el.value = _rcAmtDefault();
    _rcUpdateAmtLabel();
    rcCalc();
}

function rcUnitChange() {
    var input = document.getElementById('rc-years');
    if (input) input.max = document.getElementById('rc-unit')?.value === 'months' ? 720 : 60;
    rcCalc();
}

// Reads the time-period input + unit selector → total months
function _rcGetMonths() {
    var v = parseInt(document.getElementById('rc-years')?.value) || 0;
    var unit = document.getElementById('rc-unit')?.value || 'years';
    return unit === 'months' ? v : v * 12;
}

// "5 yrs" / "30 months" — in the unit the user chose
function _rcDurStr() {
    var T = function(key, fb) { return (typeof _t === 'function') ? _t(key) : fb; };
    var v = parseInt(document.getElementById('rc-years')?.value) || 0;
    var unit = document.getElementById('rc-unit')?.value || 'years';
    return unit === 'months'
        ? T('rc.dur.months', '{n} months').replace('{n}', v)
        : T('rc.dur.yrs', '{n} yrs').replace('{n}', v);
}

// Shows the total we worked out from the per-installment amount, so the number
// the results are based on is visible without the user having to compute it.
function _rcUpdateInstHint(type, amount, months, invested) {
    var T = function(key, fb) { return (typeof _t === 'function') ? _t(key) : fb; };
    var el = document.getElementById('rc-inst-hint');
    if (!el) return;
    if (!amount || !months || type === 'lumpsum') { el.style.display = 'none'; return; }
    el.style.display = 'block';
    if (type === 'sip') {
        el.textContent = T('rc.total.sip', 'Total invested: {amt} — {n} monthly installments of {each}')
            .replace('{amt}', _rcInrFull(invested))
            .replace('{n}', months)
            .replace('{each}', _rcInrFull(amount));
    } else {
        el.textContent = T('rc.total.annual', 'Total invested: {amt} — {n} yearly installments of {each}')
            .replace('{amt}', _rcInrFull(invested))
            .replace('{n}', Math.round((months / 12) * 100) / 100)
            .replace('{each}', _rcInrFull(amount));
    }
}

function _rcRenderChart(type, invested, months, annRate) {
    var canvas = document.getElementById('rc-chart');
    if (!canvas || typeof Chart === 'undefined') return;
    var T = function(key, fb) { return (typeof _t === 'function') ? _t(key) : fb; };

    // Sample points in months: monthly granularity for short periods,
    // yearly beyond that, always ending exactly at the entered period.
    var pts = [];
    if (months <= 60) {
        for (var p = 0; p <= months; p++) pts.push(p);
    } else {
        for (var y = 0; y * 12 < months; y++) pts.push(y * 12);
        pts.push(months);
    }

    var labels = [], dataValue = [], dataInvested = [];
    var r = annRate;                              // effective annual rate
    var mRate = Math.pow(1 + r, 1 / 12) - 1;      // equivalent monthly rate
    var perMonth = invested / months;
    var perYear  = invested / (months / 12);
    pts.forEach(function(mi) {
        labels.push(mi % 12 === 0 ? 'Yr ' + (mi / 12) : 'Mo ' + mi);
        var t = mi / 12, val = 0, prin = 0;
        if (type === 'sip') {
            prin = perMonth * mi;
            val  = mi === 0 ? 0 : _rcAnnuityFV(perMonth, mRate, mi);
        } else if (type === 'annually') {
            prin = invested * (mi / months);
            val  = mi === 0 ? 0 : _rcAnnuityFV(perYear, r, t);
        } else {
            prin = invested;
            val  = invested * Math.pow(1 + r, t);
        }
        dataValue.push(val);
        dataInvested.push(prin);
    });

    if (_rcChart) _rcChart.destroy();
    _rcChart = new Chart(canvas.getContext('2d'), {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                { label: T('chart.totalvalue', 'Total Value'), data: dataValue, borderColor: '#10b981', backgroundColor: 'rgba(16,185,129,0.15)', fill: true, tension: 0.3, pointRadius: 2, pointHoverRadius: 6 },
                { label: T('chart.amtinvested', 'Amount Invested'), data: dataInvested, borderColor: '#64748b', borderDash: [5, 5], tension: 0, fill: false, pointRadius: 0, pointHoverRadius: 5 }
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            plugins: {
                legend: { display: true, position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } },
                tooltip: {
                    backgroundColor: 'rgba(15,23,42,0.9)', titleFont: { size: 12, family: 'Inter' }, bodyFont: { size: 13, family: 'Inter', weight: 'bold' }, padding: 10,
                    callbacks: { label: function(c) { return (c.dataset.label || '') + ': ' + _rcInrFull(c.raw); } }
                }
            },
            scales: { y: { ticks: { callback: function(val) { return '₹' + (val >= 10000000 ? (val/10000000).toFixed(1)+'Cr' : val >= 100000 ? (val/100000).toFixed(1)+'L' : (val/1000).toFixed(0)+'k'); }, font: { size: 10 } } }, x: { grid: { display: false }, ticks: { font: { size: 10 }, maxTicksLimit: 13, maxRotation: 0 } } }
        }
    });
}

function rcCalc() {
    var T = function(key, fb) { return (typeof _t === 'function') ? _t(key) : fb; };

    var type     = _rcType();
    var amount   = rcNum('rc-invested');  // per-installment for SIP/annual, total for lumpsum
    var value    = rcNum('rc-value');
    var months   = _rcGetMonths();
    var invested = _rcTotalInvested(type, amount, months);

    _rcUpdateInstHint(type, amount, months, invested);

    var resEl   = document.getElementById('rc-result');
    var chartEl = document.getElementById('rc-chart-card');
    if (!resEl) return;

    if (!invested || !value || !months) {
        resEl.innerHTML = '<p class="text-[11px] text-slate-400 text-center py-6 font-semibold">' + T('rc.placeholder', 'Fill in all fields to see your actual annualized return') + '</p>';
        if (chartEl) chartEl.style.display = 'none';
        return;
    }
    if (months < 1 || months > 720) {
        resEl.innerHTML = '<p class="text-[11px] text-red-500 text-center py-4 font-semibold">' + T('rc.err.years', 'Time Period must be between 1 month and 60 years.') + '</p>';
        if (chartEl) chartEl.style.display = 'none';
        return;
    }

    // ── Solve the annualized return ──────────────────────────────────
    var t = months / 12;    // period in (possibly fractional) years
    var annRate, metricLabel, assumeNote = '';
    if (type === 'lumpsum') {
        annRate = Math.pow(value / invested, 1 / t) - 1;
        metricLabel = T('rc.res.cagr', 'CAGR — Annualized Return');
    } else if (type === 'sip') {
        var perMonth = invested / months;
        var mRate = _rcSolveRate(perMonth, months, value);
        annRate = Math.pow(1 + mRate, 12) - 1;
        metricLabel = T('rc.res.xirr', 'Annualized Return (XIRR-equivalent)');
        assumeNote = T('rc.hint.sip', '≈ {amt} per month for {dur} — we assume equal monthly installments')
            .replace('{amt}', _rcInrFull(perMonth)).replace('{dur}', _rcDurStr());
    } else {
        var perYear = invested / t;
        annRate = _rcSolveRate(perYear, t, value);
        metricLabel = T('rc.res.xirr', 'Annualized Return (XIRR-equivalent)');
        assumeNote = T('rc.hint.annual', '≈ {amt} per year for {dur} — we assume equal yearly installments')
            .replace('{amt}', _rcInrFull(perYear)).replace('{dur}', _rcDurStr());
    }
    annRate = Math.max(-0.99, annRate);
    var annPct = annRate * 100;

    var gain     = value - invested;
    var multiple = value / invested;
    var isLoss   = gain < 0;

    // ── Verdict tier ─────────────────────────────────────────────────
    var verdict, vBg, vBdr, vFg, vIcon;
    if (isLoss) {
        verdict = T('rc.verdict.loss', 'Your investment lost money — the value is below what you put in.');
        vBg = '#fef2f2'; vBdr = '#fca5a5'; vFg = '#991b1b'; vIcon = '📉';
    } else if (annPct < 6) {
        verdict = T('rc.verdict.belowinfl', 'Below typical inflation (~6%) — the money grew, but lost purchasing power.');
        vBg = '#fff7ed'; vBdr = '#fed7aa'; vFg = '#9a3412'; vIcon = '⚠️';
    } else if (annPct < 7.5) {
        verdict = T('rc.verdict.belowfd', 'Beats inflation, but a bank FD (~7%) would have earned about the same with zero risk.');
        vBg = '#fffbeb'; vBdr = '#fde68a'; vFg = '#92400e'; vIcon = '🏦';
    } else if (annPct < 12) {
        verdict = T('rc.verdict.solid', 'Solid return — comfortably beats inflation and FD rates.');
        vBg = '#f0fdf4'; vBdr = '#86efac'; vFg = '#166534'; vIcon = '✅';
    } else {
        verdict = T('rc.verdict.great', 'Excellent — beats the long-term Nifty 50 average (~12% p.a.).');
        vBg = '#ecfdf5'; vBdr = '#6ee7b7'; vFg = '#065f46'; vIcon = '🏆';
    }

    var pctColor = isLoss ? '#dc2626' : '#059669';
    var pctStr   = (annPct >= 0 ? '+' : '') + annPct.toFixed(2) + '%';

    var h = '';

    // Headline %
    h += '<div class="text-center pt-1 pb-2">';
    h +=   '<div class="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">' + metricLabel + '</div>';
    h +=   '<div id="rc-main-pct" class="text-4xl sm:text-5xl font-black break-all" style="color:' + pctColor + ';">' + pctStr + '</div>';
    h +=   '<div class="text-[10px] text-slate-400 font-semibold mt-0.5">' + T('rc.res.peryear', 'per year') + '</div>';
    if (assumeNote) h += '<div class="text-[9px] text-slate-400 mt-1 italic">' + assumeNote + '</div>';
    h += '</div>';

    // Warning for implausibly high returns
    if (annPct > 50) {
        h += '<div class="rounded-lg px-3 py-2 mb-2 text-[10px] font-semibold" style="background:#fffbeb;border:1px solid #fcd34d;color:#92400e;">⚡ ' + T('rc.warn.high', 'A return above 50%/yr is extremely rare — double-check your amounts and time period.') + '</div>';
    }

    // Verdict banner
    h += '<div class="rounded-xl px-3 py-2.5 mb-2 text-[11px] font-semibold leading-relaxed" style="background:' + vBg + ';border:1px solid ' + vBdr + ';color:' + vFg + ';">' + vIcon + ' ' + verdict + '</div>';

    // Summary cards
    h += '<div class="grid grid-cols-2 gap-2 mb-2">';
    var card = function(label, val, col) {
        return '<div class="rounded-xl px-2.5 py-2 text-center" style="background:#f8fafc;border:1px solid #e2e8f0;">' +
               '<div class="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-0.5">' + label + '</div>' +
               '<div class="text-base font-black break-all" style="color:' + (col || '#0f172a') + ';">' + val + '</div>' +
               '</div>';
    };
    h += card(T('rc.res.invested', 'Total Invested'), '<span id="rc-share-inv">' + _rcInrFull(invested) + '</span>');
    h += card(T('rc.res.value', 'Final Value'), '<span id="rc-share-val">' + _rcInrFull(value) + '</span>');
    h += card(T('rc.res.gain', 'Wealth Gained'), (isLoss ? '−' : '+') + _rcInrFull(Math.abs(gain)), isLoss ? '#dc2626' : '#059669');
    h += card(T('rc.res.multiple', 'Growth Multiple'), multiple.toFixed(2) + '×');
    h += '</div>';

    // Benchmark comparison
    var benches = [
        { label: T('rc.bench.you',   'Your return'),             pct: annPct, you: true  },
        { label: T('rc.bench.infl',  'Inflation (avg)'),         pct: 6,      you: false },
        { label: T('rc.bench.fd',    'Bank FD'),                 pct: 7,      you: false },
        { label: T('rc.bench.nifty', 'Nifty 50 long-term avg'),  pct: 12,     you: false }
    ];
    var maxPct = Math.max(annPct, 12) * 1.15;
    h += '<div class="rounded-xl px-3 py-2.5" style="background:#f8fafc;border:1px solid #e2e8f0;">';
    h += '<div class="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-2">' + T('rc.bench.title', 'How it compares (per year)') + '</div>';
    benches.forEach(function(b) {
        var w = Math.max(0, Math.min(100, b.pct / maxPct * 100));
        var barCol = b.you ? (isLoss ? '#dc2626' : '#10b981') : '#94a3b8';
        h += '<div class="flex items-center gap-2 mb-1.5">';
        h +=   '<div class="text-[10px] font-semibold text-slate-600 flex-shrink-0" style="width:40%;">' + b.label + '</div>';
        h +=   '<div class="flex-1 h-1.5 rounded-full overflow-hidden" style="background:#e2e8f0;"><div style="width:' + w.toFixed(1) + '%;height:100%;border-radius:9999px;background:' + barCol + ';"></div></div>';
        h +=   '<div class="text-[10px] font-black flex-shrink-0 text-right" style="width:52px;color:' + (b.you ? pctColor : '#64748b') + ';">' + (b.pct >= 0 ? '' : '−') + Math.abs(b.pct).toFixed(b.you ? 2 : 0) + '%</div>';
        h += '</div>';
    });
    h += '</div>';

    resEl.innerHTML = h;

    if (chartEl) chartEl.style.display = '';
    _rcRenderChart(type, invested, months, annRate);

    if (typeof saveUserData === 'function') saveUserData();
}

function initReturnsCalc() {
    var defs = { 'rc-invested': _rcAmtDefault(), 'rc-value': '9,00,000', 'rc-years': '5' };
    Object.keys(defs).forEach(function(id) {
        var el = document.getElementById(id);
        if (!el) return;
        if (!el.value) { el.value = defs[id]; el.classList.add('text-slate-400'); }
        else if (el.value === defs[id]) { el.classList.add('text-slate-400'); }
        else { el.classList.remove('text-slate-400'); }
    });
    _rcUpdateAmtLabel();
    rcUnitChange();
}

function resetReturnsCalc() {
    var typeEl = document.getElementById('rc-type');
    if (typeEl) typeEl.value = 'sip';
    var unitEl = document.getElementById('rc-unit');
    if (unitEl) unitEl.value = 'years';
    // _rcAmtDefault() reads rc-type, which was just reset to 'sip' above
    var defs = { 'rc-invested': _rcAmtDefault(), 'rc-value': '9,00,000', 'rc-years': '5' };
    Object.keys(defs).forEach(function(id) {
        var el = document.getElementById(id);
        if (el) { el.value = defs[id]; el.classList.add('text-slate-400'); }
    });
    _rcUpdateAmtLabel();
    rcUnitChange();
    if (typeof saveUserData === 'function') saveUserData();
}
