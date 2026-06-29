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
            'ctc-hra-hint':   _isNew ? _t('ctc.hint.hra.new') : _t('ctc.hint.hra.old'),
            'ctc-lta-hint':   _isNew ? _t('ctc.hint.lta.new') : _t('ctc.hint.lta.old'),
            'ctc-food-hint':  _isNew ? _t('ctc.hint.food.new') : _t('ctc.hint.food.old'),
            'ctc-phone-hint': _isNew ? _t('ctc.hint.phone.new') : _t('ctc.hint.phone.old')
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
        document.getElementById('ctc-current-annual').textContent    = _t('ctc.annual.prefix') + ' ' + ctcFmt(takeHome * 12);
        document.getElementById('ctc-optimized-takehome').textContent = ctcFmt(takeHomeOpt) + '/mo';
        document.getElementById('ctc-savings-banner').textContent    = monthlySaved > 0
            ? _t('ctc.optimized.more').replace('{n}', Math.round(monthlySaved).toLocaleString('en-IN'))
            : _t('ctc.optimized.already');
        document.getElementById('ctc-tax-current').textContent       = ctcFmt(taxCurrent) + '/yr';
        document.getElementById('ctc-tax-optimized').textContent     = ctcFmt(taxOpt) + '/yr';
        document.getElementById('ctc-eff-rate').textContent          = effRate.toFixed(1) + '%';
        document.getElementById('ctc-monthly-tax-saved').textContent = ctcFmt(Math.round((taxCurrent - taxOpt) / 12)) + '/mo';

        // ── Breakup table ─────────────────────────────────────────
        var isNew = regime === 'new';
        var rows = [
            {name:_t('ctc.row.basic'),          mo: basicMo,            taxable:true},
            {name:_t('ctc.row.hra'),            mo: hraMo,              taxable:isNew,
             note: isNew ? _t('ctc.note.hra.new')
                         : _t('ctc.note.hra.old').replace('{amount}', ctcFmt(Math.round(hraExempt/12)))},
            {name:_t('ctc.row.special'),        mo: specialMo,          taxable:true},
            {name:_t('ctc.row.lta'),            mo: Math.round(ltaAnnual/12), taxable:isNew,
             note: isNew ? _t('ctc.note.lta.new') : _t('ctc.note.lta.old')},
            {name:_t('ctc.row.food'),           mo: foodMo,             taxable:isNew,
             note: isNew ? _t('ctc.note.food.new') : _t('ctc.note.food.old')},
            {name:_t('ctc.row.phone'),          mo: phoneMo,            taxable:isNew,
             note: isNew ? _t('ctc.note.phone.new') : _t('ctc.note.phone.old')},
            {sep:true},
            {name:_t('ctc.row.gross'),          mo: Math.round(grossAnnual/12), taxable:true,  bold:true},
            {sep:true},
            {name:_t('ctc.row.epf'),            mo: -emplEpfMo,         taxable:false, note:_t('ctc.note.epf')},
            {name:_t('ctc.row.empnps'),         mo: empNpsMo > 0 ? 0 : 0, taxable:false, note: empNpsMo > 0 ? _t('ctc.note.nps.active').replace('{amount}', ctcFmt(empNpsMo)) : _t('ctc.note.nps.inactive')},
            {name:_t('ctc.row.tds'),            mo: -tdsPerMo,          taxable:false, note: regime === 'new' ? _t('ctc.note.regime.new') : _t('ctc.note.regime.old')},
            {name:_t('ctc.row.proftax'),        mo: -200,               taxable:false, note:'~₹200/mo'},
            {sep:true},
            {name:_t('ctc.row.takehome'),       mo: takeHome,           taxable:false, bold:true, green:true}
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
                '<td class="px-2 py-1 text-right">' + (r.bold || r.sep ? '' : (r.taxable ? '<span class="ctc-breakup-row-tax">'+_t('ctc.row.taxable')+'</span>' : '<span class="ctc-breakup-row-exempt">'+_t('ctc.row.exempt')+'</span>')) + '</td>' +
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
        if (empNpsPct < 0.10) cards.push({icon:'🏛️', title:_t('ctc.card.nps.title'),
            saving: Math.round(basicAnnual * (0.10 - empNpsPct) * marginalRate * 1.04 / 12),
            desc: _t('ctc.card.nps.desc').replace('{pct}', Math.round((0.10-empNpsPct)*100)).replace('{amount}', ctcFmt(Math.round(basicAnnual*(0.10-empNpsPct)/12))),
            bg:'#eff6ff', bdr:'#93c5fd', clr:'#1e3a5f'});

        if (regime === 'old') {
            // Old Regime-only optimizations
            if (foodMo < 2200) cards.push({icon:'🍱', title:_t('ctc.card.food.title'),
                saving: Math.round((2200 - foodMo) * marginalRate * 1.04),
                desc: _t('ctc.card.food.desc').replace('{amount}', (2200-foodMo).toLocaleString('en-IN')),
                bg:'#f0fdf4', bdr:'#86efac', clr:'#14532d'});
            if (phoneMo < 1200) cards.push({icon:'📱', title:_t('ctc.card.phone.title'),
                saving: Math.round((1200 - phoneMo) * marginalRate * 1.04),
                desc: _t('ctc.card.phone.desc').replace('{amount}', (1200-phoneMo).toLocaleString('en-IN')),
                bg:'#fdf4ff', bdr:'#e9d5ff', clr:'#581c87'});
            if (hraMo > 0 && rentMo < basicMo * 0.1 + 1) cards.push({icon:'🏠', title:_t('ctc.card.hra.title'),
                saving: Math.round(basicMo * 0.1 * marginalRate * 1.04),
                desc: _t('ctc.card.hra.desc').replace('{amount}', Math.round(basicMo*0.12).toLocaleString('en-IN')),
                bg:'#fff7ed', bdr:'#fed7aa', clr:'#7c2d12'});
            if (ltaAnnual > 0) cards.push({icon:'✈️', title:_t('ctc.card.lta.title'),
                saving: Math.round(ltaAnnual * marginalRate * 1.04 / 24),
                desc: _t('ctc.card.lta.desc').replace('{amount}', ltaAnnual.toLocaleString('en-IN')),
                bg:'#f0f9ff', bdr:'#bae6fd', clr:'#0c4a6e'});
            if (invest80c < 150000) cards.push({icon:'💼', title:_t('ctc.card.80c.title'),
                saving: Math.round((150000-invest80c)*marginalRate*1.04/12),
                desc: _t('ctc.card.80c.desc').replace('{headroom}', (150000-invest80c).toLocaleString('en-IN')).replace('{saves}', Math.round((150000-invest80c)*marginalRate*1.04).toLocaleString('en-IN')),
                bg:'#fef9c3', bdr:'#fde047', clr:'#713f12'});
        } else {
            // New Regime: no allowance exemptions — inform the user clearly
            cards.push({icon:'ℹ️', title:_t('ctc.card.newregime.title'),
                saving: 0,
                desc: _t('ctc.card.newregime.desc'),
                bg:'#fef9c3', bdr:'#fde047', clr:'#713f12'});
        }

        if (cards.length === 0 || (cards.length === 1 && cards[0].icon === 'ℹ️' && empNpsPct >= 0.10)) {
            cards = [{icon:'✅', title:_t('ctc.card.optimized.title'), saving:0,
                desc: regime === 'new' ? _t('ctc.card.optimized.new') : _t('ctc.card.optimized.old'),
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
            {label:_t('ctc.reg.old'), tax:taxOldR, th:thOld, key:'old'},
            {label:_t('ctc.reg.new'), tax:taxNewR, th:thNew, key:'new'}
        ].map(function(r) {
            var best = r.key === bestRegime;
            return '<div class="rounded-xl p-3" style="background:'+(best?'#f0fdf4':'#f8fafc')+';border:2px solid '+(best?'#22c55e':'#e2e8f0')+';">' +
                '<div class="text-[10px] font-black '+(best?'text-emerald-800':'text-slate-600')+' uppercase mb-1">' + r.label + (best?' '+_t('ctc.reg.better'):'') + '</div>' +
                '<div class="text-xl font-black '+(best?'text-emerald-700':'text-slate-600')+'">' + ctcFmt(r.th) + '/mo take-home</div>' +
                '<div class="text-[9px] text-slate-500 mt-0.5">' + _t('res.ctc.annual_tax') + ': ' + ctcFmt(r.tax) + ' · ' +
                (r.key==='old'?_t('ctc.reg.old.sub'):_t('ctc.reg.new.sub')) + '</div>' +
                (best && diff > 0 ? '<div class="text-[9px] font-black text-emerald-700 mt-0.5">'+_t('ctc.reg.saves').replace('{amount}', diff.toLocaleString('en-IN'))+'</div>' : '') +
                '</div>';
        }).join('');

        // ── Insight ────────────────────────────────────────────────
        var ins = document.getElementById('ctc-insight');
        if (ins) {
            ins.classList.remove('hidden');
            var optDesc = '';
            if (monthlySaved > 0) {
                optDesc = regime === 'new'
                    ? _t('ctc.ins.nps.opt').replace('{opt}', '<strong>'+ctcFmt(takeHomeOpt)+'</strong>').replace('{saved}', '<strong>₹'+Math.round(monthlySaved).toLocaleString('en-IN')+'</strong>')
                    : _t('ctc.ins.old.opt').replace('{opt}', '<strong>'+ctcFmt(takeHomeOpt)+'</strong>').replace('{saved}', '<strong>₹'+Math.round(monthlySaved).toLocaleString('en-IN')+'</strong>').replace('{savedyr}', Math.round(monthlySaved*12).toLocaleString('en-IN'));
            } else {
                optDesc = regime === 'new' ? _t('ctc.ins.new.noopt') : _t('ctc.ins.old.noopt');
            }
            ins.innerHTML = '<strong>'+_t('ctc.ins.prefix')+'</strong> ' +
                _t('ctc.ins.ctc').replace('{ctc}', '<strong>'+ctcFmt(annualCTC)+'</strong>').replace('{takehome}', '<strong>'+ctcFmt(takeHome)+'</strong>').replace('{pct}', (takeHome*12/annualCTC*100).toFixed(0)) + ' ' +
                optDesc + ' ' +
                _t('ctc.ins.effrate').replace('{rate}', '<strong>'+effRate.toFixed(1)+'</strong>') + ' ' +
                (bestRegime !== regime ? '⚠ <strong>' + _t('ctc.ins.switch').replace('{regime}', bestRegime==='old'?_t('ctc.ins.old'):_t('ctc.ins.new')).replace('{diff}', diff.toLocaleString('en-IN')) + '</strong>' : '') +
                '<div style="margin-top:8px;padding-top:8px;border-top:1px solid #bae6fd;font-size:9px;color:#0c4a6e;">' + _t('ctc.disclaimer') + '</div>';
        }

        if (typeof saveUserData === 'function') saveUserData();
    }
