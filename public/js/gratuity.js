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
        var _gt = function(k) { var v = typeof _t === 'function' ? _t(k) : null; return v && v !== k ? v : null; };
        document.getElementById('grat-tax').textContent           = taxOnExcess > 0 ? gratFmt(taxOnExcess) : (_gt('gratuity.work.exempt') || '₹0 (fully exempt)');
        document.getElementById('grat-per-year').textContent      = gratFmt(perYear);
        document.getElementById('grat-pct').textContent           = pctOfAnnual.toFixed(1) + '%';

        // Step-by-step workings
        var w = document.getElementById('grat-workings');
        if (w) {
            var rows = [
                [_gt('gratuity.work.basic') || 'Last Basic + DA salary', gratFmt(basic) + '/mo'],
                [_gt('gratuity.work.entered') || 'Years of service entered', years + ' yrs ' + (months > 0 ? months + ' mo' : '')],
                [_gt('gratuity.work.partial') || 'Partial year rule (>6 mo → +1)', months > 6
                    ? (_gt('gratuity.work.rounded_up') || '{m} months > 6 → count as {n} yrs').replace('{m}', months).replace('{n}', serviceCounted)
                    : (_gt('gratuity.work.no_rounding') || '{m} months ≤ 6 → no rounding').replace('{m}', months)],
                [_gt('gratuity.work.counted') || 'Service counted for gratuity', serviceCounted + ' years'],
                [_gt('gratuity.work.formula') || 'Formula', formula + ' × ₹' + Number(basic).toLocaleString('en-IN') + ' × ' + serviceCounted],
                [_gt('gratuity.work.gross') || 'Gross gratuity', gratFmt(grossGratuity)],
                [_gt('gratuity.work.taxfree_limit') || 'Tax-free limit u/s 10(10)', gratFmt(taxFreeLimit)],
                [_gt('gratuity.work.taxable') || 'Taxable amount', taxableAmt > 0 ? gratFmt(taxableAmt) : (_gt('gratuity.work.nil') || 'Nil (within ₹25L limit)')],
                [(_gt('gratuity.work.incometax') || 'Income tax @ {pct}%').replace('{pct}', (slabPct * 100).toFixed(0)), taxOnExcess > 0 ? '−' + gratFmt(taxOnExcess) : '₹0'],
                [_gt('gratuity.work.net') || 'Net gratuity in hand', gratFmt(netGratuity)]
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
                tips.push((_gt('gratuity.ins.under5') || '⚠ You need <strong>at least 5 years</strong> of continuous service to be eligible for gratuity under the Payment of Gratuity Act. Currently you have {n} year(s).').replace('{n}', serviceCounted));
            } else {
                tips.push((_gt('gratuity.ins.after') || 'After <strong>{n} years</strong> of service, your gross gratuity is <strong>{amt}</strong>.').replace('{n}', serviceCounted).replace('{amt}', gratFmt(grossGratuity)));
                if (months > 6) tips.push((_gt('gratuity.ins.round') || 'Your {m} extra months round up to a full year, adding <strong>{amt}</strong> to your payout.').replace('{m}', months).replace('{amt}', gratFmt(perYear)));
                if (grossGratuity >= taxFreeLimit) {
                    tips.push((_gt('gratuity.ins.taxable') || 'Your gratuity exceeds the ₹25L tax-free limit — <strong>{amt}</strong> is taxable at {pct}% slab. Consider whether you can stagger the payout across financial years.').replace('{amt}', gratFmt(taxableAmt)).replace('{pct}', (slabPct*100).toFixed(0)));
                } else {
                    tips.push(_gt('gratuity.ins.taxfree') || 'Your entire gratuity is <strong>fully tax-free</strong> under Sec 10(10) — no TDS, no income tax.');
                }
                tips.push(_gt('gratuity.ins.pay30') || 'Employer must pay within 30 days of resignation. If delayed, they owe 10% p.a. simple interest.');
            }
            ins.innerHTML = '<strong>' + (_gt('gratuity.ins.summary') || '💡 Gratuity Summary:') + '</strong> ' + tips.join(' ');
        }

        if (typeof saveUserData === 'function') saveUserData();
    }
