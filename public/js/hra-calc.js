    /* ══════════════════════════════════════════════════════════
       HRA CALCULATOR
    ══════════════════════════════════════════════════════════ */
    function hraFmt(n) { return '₹' + Math.round(n).toLocaleString('en-IN'); }
    function hraNum(id) {
        var el = document.getElementById(id);
        return el ? (parseFloat(el.value.replace(/[^0-9.]/g, '')) || 0) : 0;
    }
    function hraFormatInput(el) {
        var raw = el.value.replace(/[^0-9]/g, '');
        if (raw) el.value = parseInt(raw).toLocaleString('en-IN');
    }

    var _hraDefs = {
        'hra-basic': '50,000',
        'hra-received': '20,000',
        'hra-rent': '15,000'
    };

    function initHraCalc() {
        Object.entries(_hraDefs).forEach(function(kv) {
            var el = document.getElementById(kv[0]); if (!el) return;
            if (!el.value || el.value === kv[1]) el.classList.add('text-slate-400');
            else el.classList.remove('text-slate-400');
        });
        // Inject rules section via JS (lazy-loaded panels need JS-rendered static content)
        var rulesEl = document.getElementById('hra-rules-section');
        if (rulesEl && !rulesEl.dataset.rendered) {
            rulesEl.dataset.rendered = '1';
            rulesEl.innerHTML =
                '<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:16px;padding:12px;">' +
                  '<div style="font-size:10px;font-weight:900;color:#64748b;text-transform:uppercase;letter-spacing:.06em;margin-bottom:8px;">' + _t('hra.rules') + '</div>' +
                  '<div style="display:flex;flex-wrap:wrap;gap:8px;">' +
                    '<div style="flex:1 1 45%;background:#dcfce7;border:1px solid #86efac;border-radius:10px;padding:8px;min-width:140px;">' +
                      '<div style="font-size:12px;font-weight:900;color:#166534;margin-bottom:4px;">' + _t('hra.rule.elig.h') + '</div>' +
                      '<div style="font-size:11px;color:#166534;line-height:1.5;">' + _t('hra.rule.elig.b') + '</div>' +
                    '</div>' +
                    '<div style="flex:1 1 45%;background:#dbeafe;border:1px solid #93c5fd;border-radius:10px;padding:8px;min-width:140px;">' +
                      '<div style="font-size:12px;font-weight:900;color:#1e3a8a;margin-bottom:4px;">' + _t('hra.rule.metro.h') + '</div>' +
                      '<div style="font-size:11px;color:#1e3a8a;line-height:1.5;">' + _t('hra.rule.metro.b') + '</div>' +
                    '</div>' +
                    '<div style="flex:1 1 45%;background:#fef9c3;border:1px solid #f59e0b;border-radius:10px;padding:8px;min-width:140px;">' +
                      '<div style="font-size:12px;font-weight:900;color:#713f12;margin-bottom:4px;">' + _t('hra.rule.receipt.h') + '</div>' +
                      '<div style="font-size:11px;color:#713f12;line-height:1.5;">' + _t('hra.rule.receipt.b') + '</div>' +
                    '</div>' +
                    '<div style="flex:1 1 45%;background:#f3e8ff;border:1px solid #a78bfa;border-radius:10px;padding:8px;min-width:140px;">' +
                      '<div style="font-size:12px;font-weight:900;color:#4c1d95;margin-bottom:4px;">' + _t('hra.rule.homeloan.h') + '</div>' +
                      '<div style="font-size:11px;color:#4c1d95;line-height:1.5;">' + _t('hra.rule.homeloan.b') + '</div>' +
                    '</div>' +
                  '</div>' +
                '</div>';
        }
        hraCalc();
    }

    function resetHraCalc() {
        Object.entries(_hraDefs).forEach(function(kv) {
            var el = document.getElementById(kv[0]); if (!el) return;
            el.value = kv[1]; el.classList.add('text-slate-400');
        });
        var cityEl = document.getElementById('hra-city');
        if (cityEl) { cityEl.value = 'metro'; }
        var regimeEl = document.getElementById('hra-regime');
        if (regimeEl) { regimeEl.value = 'old'; }
        var slabEl = document.getElementById('hra-slab');
        if (slabEl) { slabEl.value = '20'; }
        hraCalc();
        if (typeof saveUserData === 'function') saveUserData();
    }

    function hraCalc() {
        var basic    = hraNum('hra-basic');
        var received = hraNum('hra-received');
        var rent     = hraNum('hra-rent');
        var city     = (document.getElementById('hra-city') || {value:'metro'}).value;
        var regime   = (document.getElementById('hra-regime') || {value:'old'}).value;
        var slab     = parseFloat((document.getElementById('hra-slab') || {value:'20'}).value) || 0;

        function set(id, v) { var e = document.getElementById(id); if (e) e.textContent = v; }
        function html(id, v) { var e = document.getElementById(id); if (e) e.innerHTML = v; }

        // New regime: HRA exemption not available
        var newRegimeAlert = document.getElementById('hra-new-regime-alert');
        if (newRegimeAlert) newRegimeAlert.classList.toggle('hidden', regime !== 'new');

        var metaPct  = city === 'metro' ? 0.50 : 0.40;
        var metaLabel = city === 'metro' ? '50%' : '40%';

        // Three components (monthly)
        var compA = received;                         // actual HRA received
        var compB = Math.max(0, rent - basic * 0.10); // rent paid - 10% of basic
        var compC = basic * metaPct;                  // 50%/40% of basic

        var hraExempt = regime === 'new' ? 0 : Math.min(compA, compB, compC);
        var hraTaxable = Math.max(0, received - hraExempt);

        // Annual figures
        var annualExempt   = hraExempt * 12;
        var annualTaxable  = hraTaxable * 12;
        var annualTaxSaved = annualExempt * (slab / 100);

        // Limiting factor (translated)
        var limiting = '';
        if (regime !== 'new') {
            if (hraExempt === compA) limiting = _t('hra.limit.a');
            else if (hraExempt === compB) limiting = _t('hra.limit.b');
            else limiting = metaLabel + _t('hra.limit.ofbasic') + ' (' + (city === 'metro' ? _t('hra.limit.metro') : _t('hra.limit.nonmetro')) + ')';
        }

        // DOM updates
        set('hra-exempt-mo',   hraFmt(hraExempt) + '/mo');
        set('hra-taxable-mo',  hraFmt(hraTaxable) + '/mo');
        set('hra-tax-saved',   hraFmt(annualTaxSaved) + '/yr');

        set('hra-comp-a',  hraFmt(compA) + '/mo');
        set('hra-comp-b',  hraFmt(compB) + '/mo');
        set('hra-comp-c',  hraFmt(compC) + '/mo');
        set('hra-comp-c-label', metaLabel + _t('hra.limit.ofbasic'));
        set('hra-limiting', regime === 'new' ? _t('hra.na.new') : (limiting || '—'));

        // Annual summary row
        set('hra-annual-exempt',  hraFmt(annualExempt));
        set('hra-annual-taxable', hraFmt(annualTaxable));

        // Workings
        var wLines = [];
        wLines.push(_t('hra.work.basic') + ': ' + hraFmt(basic));
        wLines.push(_t('hra.work.received') + ': ' + hraFmt(received));
        wLines.push(_t('hra.work.rent') + ': ' + hraFmt(rent));
        wLines.push('');
        wLines.push(_t('hra.work.compa') + ': <strong>' + hraFmt(compA) + '</strong>');
        wLines.push(_t('hra.work.compb') + ' (' + hraFmt(basic * 0.10) + '): <strong>' + hraFmt(compB) + '</strong>');
        wLines.push(_t('hra.work.compc') + ' — ' + metaLabel + _t('hra.limit.ofbasic') + ' (' + (city === 'metro' ? _t('hra.limit.metro') : _t('hra.limit.nonmetro')) + '): <strong>' + hraFmt(compC) + '</strong>');
        wLines.push('');
        if (regime === 'new') {
            wLines.push(_t('hra.work.new.regime.html'));
        } else {
            wLines.push(_t('hra.work.exempt.html').replace('{exempt}', hraFmt(hraExempt)).replace('{limiting}', limiting));
            wLines.push(_t('hra.work.taxable.html').replace('{taxable}', hraFmt(hraTaxable)));
            if (annualTaxSaved > 0)
                wLines.push(_t('hra.work.taxsaved.html').replace('{exempt}', hraFmt(annualExempt)).replace('{slab}', slab).replace('{taxsaved}', hraFmt(annualTaxSaved)));
        }

        html('hra-workings', wLines.map(function(l) {
            return l === '' ? '<div class="my-1"></div>' : '<div>' + l + '</div>';
        }).join(''));

        // Insight
        var insEl = document.getElementById('hra-insight');
        if (insEl) {
            var lines = [];
            if (regime === 'new') {
                lines.push(_t('hra.insight.new.regime'));
            } else {
                if (hraExempt === 0 && rent === 0) {
                    lines.push(_t('hra.insight.no_rent'));
                } else if (hraExempt === 0 && rent > 0 && rent <= basic * 0.10) {
                    lines.push(_t('hra.insight.low_rent.html').replace('{rent}', hraFmt(rent)).replace('{basic10pct}', hraFmt(basic * 0.10)));
                } else {
                    if (annualTaxSaved > 0)
                        lines.push(_t('hra.insight.save.html').replace('{taxsaved}', hraFmt(annualTaxSaved)).replace('{exempt}', hraFmt(annualExempt)));
                    if (limiting !== _t('hra.limit.b')) {
                        var optimalRent = Math.min(compA, compC) + basic * 0.10;
                        if (optimalRent > rent)
                            lines.push(_t('hra.insight.increase.html').replace('{optrent}', hraFmt(Math.round(optimalRent))).replace('{limiting}', limiting));
                    }
                    if (limiting === _t('hra.limit.a'))
                        lines.push(_t('hra.insight.negotiate'));
                }
            }
            insEl.innerHTML = lines.map(function(l) { return '<p style="margin-bottom:4px">' + l + '</p>'; }).join('');
            insEl.classList.toggle('hidden', lines.length === 0);
        }

        if (typeof saveUserData === 'function') saveUserData();
    }
