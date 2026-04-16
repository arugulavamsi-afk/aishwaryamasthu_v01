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
                  '<div style="font-size:10px;font-weight:900;color:#64748b;text-transform:uppercase;letter-spacing:.06em;margin-bottom:8px;">📌 HRA Rules Every Salaried Employee Must Know</div>' +
                  '<div style="display:flex;flex-wrap:wrap;gap:8px;">' +
                    '<div style="flex:1 1 45%;background:#dcfce7;border:1px solid #86efac;border-radius:10px;padding:8px;min-width:140px;">' +
                      '<div style="font-size:12px;font-weight:900;color:#166534;margin-bottom:4px;">✅ Eligibility</div>' +
                      '<div style="font-size:11px;color:#166534;line-height:1.5;">Old Regime only. Must be salaried and actually paying rent. Cannot claim if living in own property.</div>' +
                    '</div>' +
                    '<div style="flex:1 1 45%;background:#dbeafe;border:1px solid #93c5fd;border-radius:10px;padding:8px;min-width:140px;">' +
                      '<div style="font-size:12px;font-weight:900;color:#1e3a8a;margin-bottom:4px;">🏙️ Metro vs Non-Metro</div>' +
                      '<div style="font-size:11px;color:#1e3a8a;line-height:1.5;">Delhi, Mumbai, Kolkata, Chennai = 50% of basic. All other cities (Bangalore, Pune, Hyderabad) = 40%.</div>' +
                    '</div>' +
                    '<div style="flex:1 1 45%;background:#fef9c3;border:1px solid #f59e0b;border-radius:10px;padding:8px;min-width:140px;">' +
                      '<div style="font-size:12px;font-weight:900;color:#713f12;margin-bottom:4px;">🧾 Rent Receipts</div>' +
                      '<div style="font-size:11px;color:#713f12;line-height:1.5;">Landlord PAN required if rent exceeds ₹1L/yr. Keep receipts as proof. Rent paid to family is allowed if genuine.</div>' +
                    '</div>' +
                    '<div style="flex:1 1 45%;background:#f3e8ff;border:1px solid #a78bfa;border-radius:10px;padding:8px;min-width:140px;">' +
                      '<div style="font-size:12px;font-weight:900;color:#4c1d95;margin-bottom:4px;">💡 Home Loan + HRA</div>' +
                      '<div style="font-size:11px;color:#4c1d95;line-height:1.5;">Both HRA and home loan deductions (Sec 24b/80C) can be claimed simultaneously if renting in one city and owning in another.</div>' +
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

        // Limiting factor
        var limiting = '';
        if (regime !== 'new') {
            if (hraExempt === compA) limiting = 'Actual HRA received';
            else if (hraExempt === compB) limiting = 'Rent − 10% of Basic';
            else limiting = metaLabel + ' of Basic (' + (city === 'metro' ? 'Metro' : 'Non-Metro') + ')';
        }

        // DOM updates
        set('hra-exempt-mo',   hraFmt(hraExempt) + '/mo');
        set('hra-taxable-mo',  hraFmt(hraTaxable) + '/mo');
        set('hra-tax-saved',   hraFmt(annualTaxSaved) + '/yr');

        set('hra-comp-a',  hraFmt(compA) + '/mo');
        set('hra-comp-b',  hraFmt(compB) + '/mo');
        set('hra-comp-c',  hraFmt(compC) + '/mo');
        set('hra-comp-c-label', metaLabel + ' of Basic');
        set('hra-limiting', regime === 'new' ? 'N/A (New Regime)' : (limiting || '—'));

        // Annual summary row
        set('hra-annual-exempt',  hraFmt(annualExempt));
        set('hra-annual-taxable', hraFmt(annualTaxable));

        // Workings
        var wLines = [];
        wLines.push('Basic Salary (monthly): ' + hraFmt(basic));
        wLines.push('HRA Received (monthly): ' + hraFmt(received));
        wLines.push('Rent Paid (monthly): ' + hraFmt(rent));
        wLines.push('');
        wLines.push('Component A — Actual HRA received: <strong>' + hraFmt(compA) + '</strong>');
        wLines.push('Component B — Rent − 10% of Basic (' + hraFmt(basic * 0.10) + '): <strong>' + hraFmt(compB) + '</strong>');
        wLines.push('Component C — ' + metaLabel + ' of Basic (' + city + '): <strong>' + hraFmt(compC) + '</strong>');
        wLines.push('');
        if (regime === 'new') {
            wLines.push('<span style="color:#991b1b;font-weight:700">HRA exemption = ₹0</span> — not available under New Regime (Budget 2020+).');
        } else {
            wLines.push('HRA Exempt = min(A, B, C) = <strong>' + hraFmt(hraExempt) + '/mo</strong> [limited by: ' + limiting + ']');
            wLines.push('HRA Taxable = HRA Received − HRA Exempt = <strong>' + hraFmt(hraTaxable) + '/mo</strong>');
            if (annualTaxSaved > 0)
                wLines.push('Annual Tax Saved = ' + hraFmt(annualExempt) + ' × ' + slab + '% = <strong>' + hraFmt(annualTaxSaved) + '</strong>');
        }

        html('hra-workings', wLines.map(function(l) {
            return l === '' ? '<div class="my-1"></div>' : '<div>' + l + '</div>';
        }).join(''));

        // Insight
        var insEl = document.getElementById('hra-insight');
        if (insEl) {
            var lines = [];
            if (regime === 'new') {
                lines.push('⚠️ Under the <strong>New Tax Regime</strong>, HRA exemption is <strong>not available</strong> regardless of rent paid. Switch to Old Regime to claim the HRA benefit.');
            } else {
                if (hraExempt === 0 && rent === 0) {
                    lines.push('Enter rent paid per month to calculate your HRA exemption.');
                } else if (hraExempt === 0 && rent > 0 && rent <= basic * 0.10) {
                    lines.push('⚠️ Your rent (' + hraFmt(rent) + '/mo) is less than or equal to 10% of your basic (' + hraFmt(basic * 0.10) + '/mo). No HRA exemption applies — Component B = ₹0.');
                } else {
                    if (annualTaxSaved > 0)
                        lines.push('✅ You save <strong>' + hraFmt(annualTaxSaved) + ' annually</strong> in income tax by claiming HRA exemption of ' + hraFmt(annualExempt) + '/yr.');
                    // Breakeven rent advice
                    if (limiting !== 'Rent − 10% of Basic') {
                        var optimalRent = Math.min(compA, compC) + basic * 0.10;
                        if (optimalRent > rent)
                            lines.push('💡 Increase rent to <strong>' + hraFmt(Math.round(optimalRent)) + '/mo</strong> to maximise the HRA exemption (currently limited by ' + limiting + ').');
                    }
                    if (limiting === 'Actual HRA received')
                        lines.push('💡 Negotiate a higher HRA component in your CTC structure to claim more exemption — your rent qualifies for more.');
                }
            }
            insEl.innerHTML = lines.map(function(l) { return '<p style="margin-bottom:4px">' + l + '</p>'; }).join('');
            insEl.classList.toggle('hidden', lines.length === 0);
        }

        if (typeof saveUserData === 'function') saveUserData();
    }
