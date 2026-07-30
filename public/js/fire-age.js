// =====================================================================
//  FIRE AGE CALCULATOR
//  Financial Independence, Retire Early — the first age at which the
//  invested corpus can sustain the user's lifestyle under the safe-
//  withdrawal (25x / 4%) rule.
//
//  Two pools are grown together at one expected return: the existing
//  corpus compounds, and the monthly SIP is added each year (annuity).
//  Each year's target is that year's inflation-adjusted expense x the
//  FIRE multiple (100 / safe-withdrawal-rate). FIRE is reached the first
//  year corpus >= target.
//
//  Variants:
//    Lean FIRE  — 70% of today's expenses
//    Regular    — 100%
//    Fat  FIRE  — 150%
//    Coast FIRE — the corpus that, with NO further investing, grows to
//                 the regular target by the target retirement age.
//
//  Inputs are pre-filled from My Profile / the saved Financial Path plan
//  but every field is editable.
// =====================================================================

var _faChart = null;

/* ── formatting ─────────────────────────────────────────────────── */
function faFmt(el) {
    var raw = (el.value || '').replace(/[^0-9]/g, '');
    if (!raw) { el.value = ''; return; }
    var n = parseInt(raw, 10);
    var s = n.toString();
    if (s.length <= 3) { el.value = s; return; }
    el.value = s.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + s.slice(-3);
}

function faNum(id) {
    var el = document.getElementById(id);
    return el ? (parseFloat((el.value || '').replace(/[^0-9.]/g, '')) || 0) : 0;
}

function _faInr(n) {
    if (isNaN(n) || n === null) return '₹0';
    var a = Math.abs(n), s = n < 0 ? '-' : '';
    if (a >= 1e7) return s + '₹' + (a / 1e7).toFixed(2) + ' Cr';
    if (a >= 1e5) return s + '₹' + (a / 1e5).toFixed(2) + ' L';
    return s + '₹' + Math.round(a).toLocaleString('en-IN');
}

// _t returns the key itself when a translation is missing, so fall back to the
// English default in that case (keeps the tool readable before i18n keys exist).
function _faT(key, fb) {
    if (typeof _t === 'function') { var v = _t(key); if (v && v !== key) return v; }
    return fb;
}

/* ── the FIRE engine ────────────────────────────────────────────────
   Grows the corpus year by year; returns the first year the corpus
   covers `multiple` x that year's inflation-adjusted expense.
   expenseFactor scales today's expense (Lean/Regular/Fat).            */
function _faProject(p, expenseFactor, multiple) {
    var annualExpense0 = p.monthlyExpense * 12 * expenseFactor;
    var corpus = p.corpus;
    var series = [];                 // {year, age, corpus, target}
    var hitYear = null, hitTarget = null;
    for (var y = 0; y <= 60; y++) {
        var target = annualExpense0 * Math.pow(1 + p.infl, y) * multiple;
        series.push({ year: y, age: p.age + y, corpus: corpus, target: target });
        if (hitYear === null && corpus >= target) { hitYear = y; hitTarget = target; }
        // grow into next year: existing compounds, a year of SIP is added
        corpus = corpus * (1 + p.r) + p.annualSIP;
    }
    return {
        reached: hitYear !== null,
        years: hitYear,
        age: hitYear !== null ? p.age + hitYear : null,
        target: hitTarget !== null ? hitTarget : (annualExpense0 * multiple),
        series: series
    };
}

/* Coast FIRE — the amount that, invested now with NO further additions,
   grows to the regular FIRE target by the target retirement age.      */
function _faCoast(p, multiple) {
    var yrs = Math.max(0, p.retAge - p.age);
    var annualExpense0 = p.monthlyExpense * 12;
    var targetAtRet = annualExpense0 * Math.pow(1 + p.infl, yrs) * multiple;
    var coastNumber = targetAtRet / Math.pow(1 + p.r, yrs);
    return { years: yrs, targetAtRet: targetAtRet, number: coastNumber, reached: p.corpus >= coastNumber };
}

/* ── main calculate + render ───────────────────────────────────────── */
function faCalc() {
    var resEl = document.getElementById('fa-result');
    if (!resEl) return;
    var chartEl = document.getElementById('fa-chart-card');

    var p = {
        age:          Math.round(faNum('fa-age')),
        retAge:       Math.round(faNum('fa-retage')) || 60,
        monthlyExpense: faNum('fa-expenses'),
        corpus:       faNum('fa-corpus'),
        annualSIP:    faNum('fa-sip') * 12,
        r:            faNum('fa-return') / 100,
        infl:         faNum('fa-inflation') / 100,
        swr:          faNum('fa-swr')
    };
    var multiple = p.swr > 0 ? 100 / p.swr : 25;

    // Live hint under the SWR field
    var swrHint = document.getElementById('fa-swr-hint');
    if (swrHint) {
        swrHint.textContent = p.swr > 0
            ? _faT('hint.fa.swr', 'Target corpus ≈ {x}× your yearly expenses').replace('{x}', multiple.toFixed(1).replace(/\.0$/, ''))
            : '';
    }

    // Need the essentials before projecting
    if (!p.age || p.monthlyExpense <= 0 || p.r <= 0 || p.swr <= 0) {
        resEl.innerHTML = '<p class="text-[11px] text-center py-8 font-semibold" style="color:rgba(255,255,255,0.45);">' +
            _faT('fireage.placeholder', 'Fill in the details on the left to see the age you could reach financial independence.') + '</p>';
        if (chartEl) chartEl.style.display = 'none';
        return;
    }

    var reg  = _faProject(p, 1.0, multiple);
    var lean = _faProject(p, 0.7, multiple);
    var fat  = _faProject(p, 1.5, multiple);
    var coast = _faCoast(p, multiple);

    var h = '';

    // ── Headline (Regular FIRE) ─────────────────────────────────────
    h += '<div class="text-center pt-1 pb-3" style="border-bottom:1px solid rgba(255,255,255,0.08);">';
    h += '<div class="text-[10px] font-black uppercase tracking-widest mb-1" style="color:rgba(255,255,255,0.4);">' + _faT('fa.res.fireage', 'Your FIRE age') + '</div>';
    if (reg.reached) {
        h += '<div class="fa-big" style="color:#f5c842;">' + reg.age + '<span class="fa-big-u"> ' + _faT('fa.res.yrs', 'yrs') + '</span></div>';
        var inYrs = reg.years;
        var chipTxt = inYrs <= 0
            ? _faT('fa.res.already', "You're already financially independent — congratulations!")
            : _faT('fa.res.inyears', 'Financial independence in {n} years').replace('{n}', inYrs);
        var chipCol = inYrs <= 0 ? '#34d399' : (reg.age <= p.retAge ? '#34d399' : '#f5c842');
        h += '<div class="fa-hchip" style="background:rgba(16,185,129,0.14);color:' + chipCol + ';">' + chipTxt + '</div>';
        h += '<div class="text-[11px] mt-2" style="color:rgba(255,255,255,0.6);">' +
             _faT('fa.res.needcorpus', 'Target corpus') + ': <b style="color:#f3e9d2;">' + _faInr(reg.target) + '</b> ' +
             '<span style="color:rgba(255,255,255,0.4);">(' + multiple.toFixed(1).replace(/\.0$/, '') + '× ' + _faT('fa.res.yearlyexp', 'yearly expenses') + ')</span></div>';
    } else {
        h += '<div class="fa-big" style="color:#f87171;">60+<span class="fa-big-u"> ' + _faT('fa.res.yrs', 'yrs') + '</span></div>';
        h += '<div class="fa-hchip" style="background:rgba(248,113,113,0.14);color:#f87171;">' +
             _faT('fa.res.beyond', 'Not reached within 60 years at these numbers') + '</div>';
        h += '<div class="text-[11px] mt-2" style="color:rgba(255,255,255,0.6);">' +
             _faT('fa.res.trymore', 'Try a higher SIP, higher return, or a lower withdrawal rate.') + '</div>';
    }
    h += '</div>';

    // ── FIRE-type cards ─────────────────────────────────────────────
    var typeCard = function(name, sub, res, accent) {
        var val = res.reached ? (res.age + '') : '60+';
        var line = res.reached
            ? (res.years <= 0 ? _faT('fa.type.now', 'Reached') : _faT('fa.type.in', 'in {n}y').replace('{n}', res.years))
            : _faT('fa.type.na', '—');
        return '<div class="fa-tcard">' +
            '<div class="fa-tname" style="color:' + accent + ';">' + name + '</div>' +
            '<div class="fa-tsub">' + sub + '</div>' +
            '<div class="fa-tage">' + val + '<span class="fa-tage-u">' + (res.reached ? ' ' + _faT('fa.res.yrs', 'yrs') : '') + '</span></div>' +
            '<div class="fa-tline">' + line + '</div>' +
            '<div class="fa-ttarget">' + _faInr(res.target) + '</div>' +
        '</div>';
    };
    h += '<div class="grid grid-cols-3 gap-2 mt-3">';
    h += typeCard(_faT('fa.type.lean', 'Lean'),    _faT('fa.type.lean.sub', '70% lifestyle'),  lean, '#6ee7b7');
    h += typeCard(_faT('fa.type.reg', 'Regular'),  _faT('fa.type.reg.sub', 'Same lifestyle'),  reg,  '#f5c842');
    h += typeCard(_faT('fa.type.fat', 'Fat'),      _faT('fa.type.fat.sub', '150% lifestyle'),  fat,  '#fbbf24');
    h += '</div>';

    // ── Coast FIRE ──────────────────────────────────────────────────
    h += '<div class="fa-coast mt-2" style="border-color:' + (coast.reached ? 'rgba(16,185,129,0.35)' : 'rgba(245,200,66,0.28)') + ';">';
    h += '<div class="flex items-center justify-between gap-2">';
    h += '<div class="fa-coast-name">' + _faT('fa.coast.title', 'Coast FIRE') + '</div>';
    h += '<div class="fa-coast-badge" style="background:' + (coast.reached ? 'rgba(16,185,129,0.16)' : 'rgba(245,200,66,0.14)') + ';color:' + (coast.reached ? '#34d399' : '#f5c842') + ';">' +
         (coast.reached ? _faT('fa.coast.yes', 'Reached') : _faT('fa.coast.no', 'Not yet') ) + '</div>';
    h += '</div>';
    h += '<div class="fa-coast-body">';
    if (coast.reached) {
        h += _faT('fa.coast.reached', 'Your corpus can already coast to retirement at {age} with no further investing.').replace('{age}', p.retAge);
    } else {
        var gap = coast.number - p.corpus;
        h += _faT('fa.coast.need', 'Reach {num} invested and you could stop adding money — it would grow to your FIRE target by {age}. About {gap} to go.')
            .replace('{num}', '<b style="color:#f3e9d2;">' + _faInr(coast.number) + '</b>')
            .replace('{age}', p.retAge)
            .replace('{gap}', '<b style="color:#f3e9d2;">' + _faInr(gap) + '</b>');
    }
    h += '</div></div>';

    resEl.innerHTML = h;

    // ── Chart ───────────────────────────────────────────────────────
    if (chartEl) { chartEl.style.display = ''; _faRenderChart(p, reg, multiple); }

    if (typeof saveUserData === 'function') saveUserData();
}

/* ── corpus vs target chart ─────────────────────────────────────────── */
function _faRenderChart(p, reg, multiple) {
    var canvas = document.getElementById('fa-chart');
    if (!canvas || typeof Chart === 'undefined') return;

    // Show up to the FIRE year + a little tail, capped at 40 years.
    var span = reg.reached ? Math.min(60, reg.years + 3) : 40;
    var labels = [], corpusData = [], targetData = [];
    for (var y = 0; y <= span; y++) {
        var s = reg.series[y];
        labels.push(_faT('fa.chart.age', 'Age') + ' ' + s.age);
        corpusData.push(Math.round(s.corpus));
        targetData.push(Math.round(s.target));
    }

    if (_faChart) _faChart.destroy();
    _faChart = new Chart(canvas.getContext('2d'), {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                { label: _faT('fa.chart.corpus', 'Your corpus'), data: corpusData, borderColor: '#34d399', backgroundColor: 'rgba(52,211,153,0.15)', fill: true, tension: 0.3, pointRadius: 0, pointHoverRadius: 5, borderWidth: 2 },
                { label: _faT('fa.chart.target', 'FIRE target'), data: targetData, borderColor: '#f5c842', borderDash: [5, 5], tension: 0.3, fill: false, pointRadius: 0, pointHoverRadius: 5, borderWidth: 2 }
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            plugins: {
                legend: { display: true, position: 'bottom', labels: { boxWidth: 12, color: 'rgba(255,255,255,0.65)', font: { size: 11 } } },
                tooltip: {
                    backgroundColor: 'rgba(8,22,18,0.95)', borderColor: 'rgba(245,200,66,0.3)', borderWidth: 1,
                    titleColor: '#f3e9d2', bodyColor: '#f3e9d2', titleFont: { size: 12 }, bodyFont: { size: 13, weight: 'bold' }, padding: 10,
                    callbacks: { label: function(c) { return (c.dataset.label || '') + ': ' + _faInr(c.raw); } }
                }
            },
            scales: {
                y: { ticks: { color: 'rgba(255,255,255,0.5)', font: { size: 10 }, callback: function(v) { return v >= 1e7 ? '₹' + (v / 1e7).toFixed(1) + 'Cr' : v >= 1e5 ? '₹' + (v / 1e5).toFixed(0) + 'L' : '₹' + (v / 1e3).toFixed(0) + 'k'; } }, grid: { color: 'rgba(255,255,255,0.06)' } },
                x: { ticks: { color: 'rgba(255,255,255,0.5)', font: { size: 10 }, maxTicksLimit: 8, maxRotation: 0 }, grid: { display: false } }
            }
        }
    });
}

/* ── smart defaults from My Profile / saved plan ─────────────────────── */
function _faDefaults() {
    var prof = window._userProfile || {};
    var plan = (window._pathState && window._pathState.active) || {};
    var monthlyExp = parseFloat((prof.expenses || '').replace(/,/g, '')) || 0;
    if (monthlyExp <= 0 && plan.monthlyIncome > 0) monthlyExp = Math.round(plan.monthlyIncome * 0.70);
    return {
        'fa-age':       (plan.age || parseInt(prof.age) || 30) + '',
        'fa-retage':    (plan.retireAge || 60) + '',
        'fa-expenses':  monthlyExp > 0 ? monthlyExp : '',
        'fa-corpus':    (plan.existingCorpus > 0 ? Math.round(plan.existingCorpus) : ''),
        'fa-sip':       (plan.monthlyInvest > 0 ? Math.round(plan.monthlyInvest) : ''),
        'fa-return':    (plan.blendedReturn > 0 ? plan.blendedReturn : 12) + '',
        'fa-inflation': (parseFloat(prof.inflation) > 0 ? parseFloat(prof.inflation) : 6) + '',
        'fa-swr':       '4'
    };
}

function _faSet(id, val) {
    var el = document.getElementById(id);
    if (!el) return;
    if (typeof val === 'number') val = val + '';
    el.value = val;
    // currency fields get grouped digits
    if ((id === 'fa-expenses' || id === 'fa-corpus' || id === 'fa-sip') && val) faFmt(el);
}

// Explicit button — overwrite every field from profile/plan
function faUseProfile() {
    var d = _faDefaults();
    Object.keys(d).forEach(function(id) { _faSet(id, d[id]); });
    faCalc();
}

// First open — fill only blank fields so in-session edits survive nav
function initFireAge() {
    faApplyIcons();
    var d = _faDefaults();
    Object.keys(d).forEach(function(id) {
        var el = document.getElementById(id);
        if (el && !el.value && d[id] !== '') _faSet(id, d[id]);
    });
    faCalc();
}

function resetFireAge() {
    var d = _faDefaults();
    Object.keys(d).forEach(function(id) { _faSet(id, d[id]); });
    faCalc();
}

// Swap [data-faicon] placeholders for the professional line icons
function faApplyIcons() {
    if (!window._svgIcon) return;
    document.querySelectorAll('#fireage-panel [data-faicon]').forEach(function(el) {
        var key = el.getAttribute('data-faicon');
        el.innerHTML = window._svgIcon(key, '');
    });
}
