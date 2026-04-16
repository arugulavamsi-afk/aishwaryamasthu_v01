// =====================================================================
//  CAPITAL GAINS CALCULATOR — Post-Budget 2024 (Finance Act 2024)
//  Effective date of new rates: July 23, 2024
// =====================================================================

// ── Tax Regime Slabs ─────────────────────────────────────────────────
// New Regime FY 2025-26 (Budget 2025)
var _cgNewSlabs = [
    { upTo: 400000,   rate: 0   , label: '₹0 – ₹4L'       },
    { upTo: 800000,   rate: 0.05, label: '₹4L – ₹8L'      },
    { upTo: 1200000,  rate: 0.10, label: '₹8L – ₹12L'     },
    { upTo: 1600000,  rate: 0.15, label: '₹12L – ₹16L'    },
    { upTo: 2000000,  rate: 0.20, label: '₹16L – ₹20L'    },
    { upTo: 2400000,  rate: 0.25, label: '₹20L – ₹24L'    },
    { upTo: Infinity, rate: 0.30, label: 'Above ₹24L'      }
];
// Old Regime (General category, ₹2.5L basic exemption)
var _cgOldSlabs = [
    { upTo: 250000,   rate: 0   , label: '₹0 – ₹2.5L'     },
    { upTo: 500000,   rate: 0.05, label: '₹2.5L – ₹5L'    },
    { upTo: 1000000,  rate: 0.20, label: '₹5L – ₹10L'     },
    { upTo: Infinity, rate: 0.30, label: 'Above ₹10L'      }
];

// Returns marginal slab rate (0–30) for a given regime + income
function _cgMarginalSlab(regime, income) {
    var slabs = regime === 'old' ? _cgOldSlabs : _cgNewSlabs;
    // For new regime: if income ≤ 12L → 87A makes effective tax 0, but marginal slab still applies to CG
    // We return the slab bracket the last rupee of income falls in
    for (var i = 0; i < slabs.length; i++) {
        if (income <= slabs[i].upTo) return slabs[i].rate * 100;
    }
    return 30;
}

// Renders the slab table + updates the badge — called on regime/income change
function _cgUpdateSlabUI() {
    var regime  = document.getElementById('cg-regime')?.value || 'new';
    var income  = cgNum('cg-income');
    var slab    = _cgMarginalSlab(regime, income);
    var slabs   = regime === 'old' ? _cgOldSlabs : _cgNewSlabs;

    // Badge
    var badge = document.getElementById('cg-slab-display');
    if (badge) {
        badge.textContent = slab + '%';
        if (slab === 0) { badge.style.background = '#f0fdf4'; badge.style.color = '#166534'; badge.style.borderColor = '#86efac'; }
        else if (slab <= 10) { badge.style.background = '#eff6ff'; badge.style.color = '#1d4ed8'; badge.style.borderColor = '#93c5fd'; }
        else if (slab <= 20) { badge.style.background = '#fff7ed'; badge.style.color = '#b45309'; badge.style.borderColor = '#fcd34d'; }
        else { badge.style.background = '#fef2f2'; badge.style.color = '#dc2626'; badge.style.borderColor = '#fca5a5'; }
    }

    // Slab table
    var tbl = document.getElementById('cg-regime-table');
    if (!tbl) return;
    var rows = slabs.map(function(s) {
        var isActive = _cgMarginalSlab(regime, income) === s.rate * 100 &&
                       income > (slabs[slabs.indexOf(s) - 1] ? slabs[slabs.indexOf(s) - 1].upTo : 0);
        var bg = isActive ? 'background:#eff6ff;' : '';
        var fw = isActive ? 'font-bold' : '';
        return '<div class="flex items-center justify-between px-2 py-0.5 text-[9px] border-b border-slate-50 last:border-0 ' + fw + '" style="' + bg + '">' +
               '<span class="text-slate-500">' + s.label + '</span>' +
               '<span class="' + (s.rate === 0 ? 'text-emerald-600' : s.rate >= 0.30 ? 'text-red-600' : 'text-blue-700') + ' font-bold">' + (s.rate * 100) + '%</span>' +
               '</div>';
    }).join('');
    tbl.innerHTML = rows;
}

function cgSetRegime(regime) {
    var hiddenEl = document.getElementById('cg-regime');
    if (hiddenEl) hiddenEl.value = regime;
    var newBtn = document.getElementById('cg-regime-new');
    var oldBtn = document.getElementById('cg-regime-old');
    if (newBtn && oldBtn) {
        if (regime === 'new') {
            newBtn.style.background = '#eff6ff'; newBtn.style.color = '#1d4ed8'; newBtn.style.borderColor = '#3b82f6';
            oldBtn.style.background = '#f8fafc'; oldBtn.style.color = '#64748b'; oldBtn.style.borderColor = '#e2e8f0';
        } else {
            oldBtn.style.background = '#fef9c3'; oldBtn.style.color = '#854d0e'; oldBtn.style.borderColor = '#fde047';
            newBtn.style.background = '#f8fafc'; newBtn.style.color = '#64748b'; newBtn.style.borderColor = '#e2e8f0';
        }
    }
    _cgUpdateSlabUI();
    cgCalc();
}

// Cost Inflation Index (Base Year FY 2001-02 = 100)
var _cgCII = {
    2001:100,2002:105,2003:109,2004:113,2005:117,2006:122,2007:129,
    2008:137,2009:148,2010:167,2011:184,2012:200,2013:220,2014:240,
    2015:254,2016:264,2017:272,2018:280,2019:289,2020:301,2021:317,
    2022:331,2023:348,2024:363,2025:376
};

function _cgFY(dateStr) {
    // Returns FY start year — e.g. 2024 for FY 2024-25 (Apr 2024 – Mar 2025)
    var d = new Date(dateStr);
    return d.getMonth() >= 3 ? d.getFullYear() : d.getFullYear() - 1;
}
function _cgCIIFor(dateStr) {
    return _cgCII[_cgFY(dateStr)] || 363; // fallback to FY24-25
}

function _cgInr(n) {
    if (isNaN(n) || n === null) return '₹0';
    var sign = n < 0 ? '-' : '';
    var abs  = Math.abs(Math.round(n));
    if (abs >= 1e7) return sign + '₹' + (abs / 1e7).toFixed(2) + ' Cr';
    if (abs >= 1e5) return sign + '₹' + (abs / 1e5).toFixed(2) + ' L';
    var s = abs.toString();
    if (s.length <= 3) return sign + '₹' + s;
    return sign + '₹' + s.slice(0,-3).replace(/\B(?=(\d{2})+(?!\d))/g,',') + ',' + s.slice(-3);
}

function cgFmt(el) {
    var raw = (el.value || '').replace(/[^0-9]/g, '');
    if (!raw) { el.value = ''; return; }
    var n = parseInt(raw, 10);
    var s = n.toString();
    if (s.length <= 3) { el.value = s; return; }
    el.value = s.slice(0,-3).replace(/\B(?=(\d{2})+(?!\d))/g,',') + ',' + s.slice(-3);
}

function cgNum(id) {
    var el = document.getElementById(id);
    return el ? (parseFloat((el.value || '').replace(/[^0-9.]/g,'')) || 0) : 0;
}

function cgCalc() {
    var asset      = document.getElementById('cg-asset')?.value    || 'equity';
    var buyStr     = document.getElementById('cg-buy-date')?.value  || '';
    var sellStr    = document.getElementById('cg-sell-date')?.value || '';
    var cost       = cgNum('cg-cost');
    var salePrice  = cgNum('cg-sale');
    var regime     = document.getElementById('cg-regime')?.value   || 'new';
    var income     = cgNum('cg-income');
    var slab       = _cgMarginalSlab(regime, income);
    var ltcgUsed   = cgNum('cg-ltcg-used');
    _cgUpdateSlabUI();

    var resEl = document.getElementById('cg-result');
    if (!resEl) return;

    if (!buyStr || !sellStr || !cost || !salePrice) {
        resEl.innerHTML = '<p class="text-[11px] text-slate-400 text-center py-6 font-semibold">Fill in all fields to calculate your capital gains tax</p>';
        return;
    }

    var buyDate  = new Date(buyStr);
    var sellDate = new Date(sellStr);
    if (isNaN(buyDate) || isNaN(sellDate) || sellDate <= buyDate) {
        resEl.innerHTML = '<p class="text-[11px] text-red-500 text-center py-4 font-semibold">Sale date must be after purchase date</p>';
        return;
    }

    var JUL23_2024 = new Date('2024-07-23');
    var APR1_2023  = new Date('2023-04-01');

    var isPreJul23 = buyDate < JUL23_2024;   // purchase before Finance Act 2024
    var isPreApr23 = buyDate < APR1_2023;    // purchase before Finance Act 2023 (debt MF)

    // Holding period in months (day-accurate)
    var holdMonths = (sellDate.getFullYear() - buyDate.getFullYear()) * 12
                   + (sellDate.getMonth()    - buyDate.getMonth());
    if (sellDate.getDate() < buyDate.getDate()) holdMonths--;
    holdMonths = Math.max(0, holdMonths);

    var holdYr = Math.floor(holdMonths / 12);
    var holdMo = holdMonths % 12;
    var holdLabel = holdYr > 0
        ? holdYr + ' yr' + (holdYr > 1 ? 's' : '') + (holdMo > 0 ? ' ' + holdMo + ' mo' : '')
        : holdMonths + ' month' + (holdMonths !== 1 ? 's' : '');

    var gain = salePrice - cost;

    // ── Per-asset tax computation ─────────────────────────────────────
    var isLTCG    = false;
    var taxType   = 'STCG';
    var section   = '';
    var taxRate   = slab / 100;
    var taxable   = Math.max(0, gain);
    var indexedCost = cost;
    var showIdx   = false;
    var altTax    = null; // {label, tax, idxCost} for pre-Jul23 two-option assets
    var note      = '';
    var ltcgMonths = 12;
    var exempt    = 0;

    switch (asset) {
        // ── Equity / Equity MF / ETF ─────────────────────────────────
        case 'equity':
            ltcgMonths = 12;
            isLTCG = holdMonths >= ltcgMonths;
            if (isLTCG) {
                taxType = 'LTCG'; section = 'Sec 112A';
                var ltcgRate  = sellDate >= JUL23_2024 ? 0.125 : 0.10;
                var ltcgLimit = sellDate >= JUL23_2024 ? 125000 : 100000;
                var remaining = Math.max(0, ltcgLimit - ltcgUsed);
                exempt  = Math.min(Math.max(0, gain), remaining);
                taxable = Math.max(0, gain - exempt);
                taxRate = ltcgRate;
                note = sellDate >= JUL23_2024
                    ? 'LTCG 12.5% (Budget 2024). ₹1.25L/yr exemption, ₹' + remaining.toLocaleString('en-IN') + ' remaining.'
                    : 'LTCG 10% (pre-Jul 23, 2024). ₹1L/yr exemption, ₹' + remaining.toLocaleString('en-IN') + ' remaining.';
            } else {
                taxType = 'STCG'; section = 'Sec 111A';
                taxRate = sellDate >= JUL23_2024 ? 0.20 : 0.15;
                note = sellDate >= JUL23_2024
                    ? 'STCG 20% (raised from 15% on Jul 23, 2024).'
                    : 'STCG 15% (pre-Jul 23, 2024 rate).';
            }
            break;

        // ── Debt MF / International MF (bought after Apr 1, 2023) ────
        case 'debt-new':
            isLTCG  = false;
            taxType = 'Gains (Slab)';
            section = 'Sec 50AA';
            taxRate = slab / 100;
            taxable = Math.max(0, gain);
            note    = 'Debt / Intl MF purchased after Apr 1, 2023: all gains taxed at slab rate, no indexation, no LTCG benefit (Finance Act 2023).';
            break;

        // ── Debt MF — grandfathered (bought before Apr 1, 2023) ──────
        case 'debt-old':
            ltcgMonths = 36;
            isLTCG     = holdMonths >= ltcgMonths;
            if (isLTCG) {
                taxType = 'LTCG'; section = 'Sec 112';
                var bCII = _cgCIIFor(buyStr), sCII = _cgCIIFor(sellStr);
                indexedCost = cost * (sCII / bCII);
                taxable     = Math.max(0, salePrice - indexedCost);
                taxRate     = 0.20;
                showIdx     = true;
                note = 'Grandfathered debt MF (pre Apr 1, 2023): LTCG 20% with indexation. CII Buy ' + bCII + ' → Sell ' + sCII + '.';
            } else {
                taxType = 'STCG'; section = 'Sec 112';
                taxRate = slab / 100;
                note    = 'Debt MF (pre Apr 1, 2023): STCG < 36 months taxed at slab rate.';
            }
            break;

        // ── Physical Gold ─────────────────────────────────────────────
        case 'gold':
            // Holding period threshold depends on sell date (Finance Act 2024 reduced from 36→24)
            ltcgMonths = sellDate >= JUL23_2024 ? 24 : 36;
            isLTCG     = holdMonths >= ltcgMonths;
            if (isLTCG) {
                taxType = 'LTCG'; section = 'Sec 112';
                if (isPreJul23) {
                    // Taxpayer's choice: 12.5% (no idx) vs 20% (with idx)
                    var bCII = _cgCIIFor(buyStr), sCII = _cgCIIFor(sellStr);
                    var idxCost = cost * (sCII / bCII);
                    var t12 = Math.max(0, gain) * 0.125;
                    var t20 = Math.max(0, salePrice - idxCost) * 0.20;
                    showIdx = true;
                    if (t12 <= t20) {
                        taxRate = 0.125; taxable = Math.max(0, gain);
                        altTax  = { label: '20% + indexation', tax: t20, idxCost: idxCost };
                        note    = '12.5% (no indexation) is lower — selected. CII ' + bCII + '→' + sCII + '. You may also opt for 20% with indexation if preferred.';
                    } else {
                        taxRate = 0.20; taxable = Math.max(0, salePrice - idxCost); indexedCost = idxCost;
                        altTax  = { label: '12.5% (no indexation)', tax: t12, idxCost: null };
                        note    = '20% with indexation is lower — selected. CII ' + bCII + '→' + sCII + '.';
                    }
                } else {
                    taxRate = 0.125; taxable = Math.max(0, gain);
                    note    = 'Gold purchased after Jul 23, 2024: LTCG 12.5%, no indexation, 24-month threshold (Finance Act 2024).';
                }
            } else {
                taxType = 'STCG'; section = 'Sec 112'; taxRate = slab / 100;
                note    = 'Gold STCG taxed at income slab rate.';
            }
            break;

        // ── Real Estate / Property ────────────────────────────────────
        case 'realestate':
            ltcgMonths = 24;
            isLTCG     = holdMonths >= ltcgMonths;
            if (isLTCG) {
                taxType = 'LTCG'; section = 'Sec 112';
                if (isPreJul23) {
                    var bCII = _cgCIIFor(buyStr), sCII = _cgCIIFor(sellStr);
                    var idxCost = cost * (sCII / bCII);
                    var t12 = Math.max(0, gain) * 0.125;
                    var t20 = Math.max(0, salePrice - idxCost) * 0.20;
                    showIdx = true;
                    if (t12 <= t20) {
                        taxRate = 0.125; taxable = Math.max(0, gain);
                        altTax  = { label: '20% + indexation', tax: t20, idxCost: idxCost };
                        note    = '12.5% (no indexation) is lower — selected. CII ' + bCII + '→' + sCII + '. Also check Sec 54 / 54EC exemptions for reinvestment.';
                    } else {
                        taxRate = 0.20; taxable = Math.max(0, salePrice - idxCost); indexedCost = idxCost;
                        altTax  = { label: '12.5% (no indexation)', tax: t12, idxCost: null };
                        note    = '20% with indexation is lower — selected. CII ' + bCII + '→' + sCII + '. Also check Sec 54 / 54EC exemptions.';
                    }
                } else {
                    taxRate = 0.125; taxable = Math.max(0, gain);
                    note    = 'Property purchased after Jul 23, 2024: LTCG 12.5%, no indexation. Check Sec 54 / 54EC reinvestment exemptions.';
                }
            } else {
                taxType = 'STCG'; section = 'Sec 112'; taxRate = slab / 100;
                note    = 'Property STCG taxed at slab rate. Sec 54 exemption applies only to LTCG.';
            }
            break;

        // ── Unlisted Shares ───────────────────────────────────────────
        case 'unlisted':
            ltcgMonths = 24;
            isLTCG     = holdMonths >= ltcgMonths;
            if (isLTCG) {
                taxType = 'LTCG'; section = 'Sec 112';
                if (isPreJul23) {
                    var bCII = _cgCIIFor(buyStr), sCII = _cgCIIFor(sellStr);
                    var idxCost = cost * (sCII / bCII);
                    var t12 = Math.max(0, gain) * 0.125;
                    var t20 = Math.max(0, salePrice - idxCost) * 0.20;
                    if (t12 <= t20) {
                        taxRate = 0.125; taxable = Math.max(0, gain);
                        altTax  = { label: '20% + indexation', tax: t20, idxCost: idxCost };
                        note    = '12.5% (no indexation) is lower — selected. Finance Act 2024.';
                    } else {
                        taxRate = 0.20; taxable = Math.max(0, salePrice - idxCost); indexedCost = idxCost; showIdx = true;
                        altTax  = { label: '12.5% (no indexation)', tax: t12, idxCost: null };
                        note    = '20% with indexation is lower — selected.';
                    }
                } else {
                    taxRate = 0.125; taxable = Math.max(0, gain);
                    note    = 'Unlisted shares (post Jul 23, 2024): LTCG 12.5%, no indexation.';
                }
            } else {
                taxType = 'STCG'; section = 'Sec 112'; taxRate = slab / 100;
                note    = 'Unlisted shares STCG taxed at slab rate.';
            }
            break;

        // ── Sovereign Gold Bond (SGB) ─────────────────────────────────
        case 'sgb':
            var holdYearsRaw = holdMonths / 12;
            if (holdYearsRaw >= 8) {
                isLTCG = true; taxType = 'Exempt'; section = 'Sec 10(15)(iv)(h)';
                taxRate = 0; taxable = 0;
                note = 'SGB held to maturity (8 years): capital gains fully exempt for original allottees. Secondary market buyers: equity capital gains treatment applies.';
            } else {
                ltcgMonths = 12;
                isLTCG = holdMonths >= ltcgMonths;
                if (isLTCG) {
                    taxType = 'LTCG'; section = 'Sec 112A';
                    taxRate  = sellDate >= JUL23_2024 ? 0.125 : 0.10;
                    var sgbLimit = sellDate >= JUL23_2024 ? 125000 : 100000;
                    var sgbRemaining = Math.max(0, sgbLimit - ltcgUsed);
                    exempt  = Math.min(Math.max(0, gain), sgbRemaining);
                    taxable = Math.max(0, gain - exempt);
                    note    = 'SGB transferred before maturity: equity LTCG treatment. ' + (taxRate * 100) + '% above ₹' + (sgbLimit / 100000).toFixed(2) + 'L exemption.';
                } else {
                    taxType = 'STCG'; section = 'Sec 111A';
                    taxRate = sellDate >= JUL23_2024 ? 0.20 : 0.15;
                    note    = 'SGB < 12 months: equity STCG at ' + (taxRate * 100) + '%.';
                }
            }
            break;
    }

    var tax       = taxable > 0 ? taxable * taxRate : 0;
    var cess      = tax * 0.04;
    var totalTax  = tax + cess;
    var netProc   = salePrice - totalTax;
    var effRate   = gain > 0 ? (totalTax / gain * 100) : 0;
    var isLoss    = gain < 0;
    var isExempt  = taxType === 'Exempt';

    // ── Build result HTML ────────────────────────────────────────────
    var gainColor = gain >= 0 ? '#059669' : '#dc2626';
    var gainBg    = gain >= 0 ? '#f0fdf4' : '#fef2f2';
    var gainBdr   = gain >= 0 ? '#86efac' : '#fca5a5';
    var ltcgBg    = isLTCG ? '#f5f3ff' : '#fff7ed';
    var ltcgBdr   = isLTCG ? '#ddd6fe' : '#fed7aa';
    var ltcgFg    = isLTCG ? '#6d28d9' : '#b45309';

    var h = '';

    // Row 1: Holding + Gain cards
    h += '<div class="grid grid-cols-2 gap-2 mb-2">';
    h +=   '<div class="rounded-xl px-2.5 py-2 text-center" style="background:' + ltcgBg + ';border:1px solid ' + ltcgBdr + ';">';
    h +=     '<div class="text-[9px] font-black uppercase tracking-wider mb-0.5" style="color:' + ltcgFg + ';">Holding Period</div>';
    h +=     '<div class="text-base font-black" style="color:' + ltcgFg + ';">' + holdLabel + '</div>';
    h +=     '<div class="text-[9px] font-semibold" style="color:' + ltcgFg + ';">' + (isExempt ? 'Exempt at Maturity' : (isLTCG ? 'Long-Term' : (asset === 'debt-new' ? 'Slab Rate' : 'Short-Term'))) + ' · ' + section + '</div>';
    h +=   '</div>';
    h +=   '<div class="rounded-xl px-2.5 py-2 text-center" style="background:' + gainBg + ';border:1px solid ' + gainBdr + ';">';
    h +=     '<div class="text-[9px] font-black uppercase tracking-wider mb-0.5" style="color:' + gainColor + ';">' + (isLoss ? 'Capital Loss' : 'Capital Gain') + '</div>';
    h +=     '<div class="text-base font-black" style="color:' + gainColor + ';">' + _cgInr(gain) + '</div>';
    h +=     '<div class="text-[9px] font-semibold" style="color:' + gainColor + ';">Sale ' + _cgInr(salePrice) + ' − Cost ' + _cgInr(cost) + '</div>';
    h +=   '</div>';
    h += '</div>';

    if (isLoss) {
        h += '<div class="rounded-xl px-3 py-2.5 text-[10px] leading-relaxed" style="background:#fef2f2;border:1px solid #fca5a5;color:#991b1b;">';
        h += '<strong>Capital Loss: ' + _cgInr(Math.abs(gain)) + '</strong> — No tax payable. ';
        h += asset === 'equity'
            ? 'STCG losses offset any CG; LTCG losses only offset LTCG. Both carry forward 8 years.'
            : 'Can be set off against gains of same type. Carry forward up to 8 years (file ITR before due date).';
        h += '</div>';
        if (note) h += '<div class="mt-1.5 text-[9px] leading-relaxed text-slate-400 italic">' + note + '</div>';
        resEl.innerHTML = h; return;
    }

    if (isExempt) {
        h += '<div class="rounded-xl px-3 py-2.5 text-[10px] font-semibold leading-relaxed" style="background:#f0fdf4;border:1px solid #86efac;color:#166534;">';
        h += '✅ <strong>Capital Gain of ' + _cgInr(gain) + ' is fully exempt from tax.</strong> ' + note;
        h += '</div>';
        resEl.innerHTML = h; return;
    }

    // Tax breakdown rows
    h += '<div class="bg-white rounded-xl border border-slate-100 overflow-hidden mb-2">';
    var row = function(label, val, col) {
        col = col || '#374151';
        return '<div class="flex items-center justify-between px-3 py-1.5 border-b border-slate-50 last:border-0">' +
               '<span class="text-[10px] text-slate-500">' + label + '</span>' +
               '<span class="text-[10px] font-bold" style="color:' + col + ';">' + val + '</span>' +
               '</div>';
    };
    h += row('Purchase Cost', _cgInr(cost));
    if (showIdx && indexedCost > cost) {
        h += row('Indexed Cost (CII adj.)', _cgInr(indexedCost), '#7c3aed');
    }
    if (exempt > 0) {
        h += row('Exemption (' + (asset === 'equity' || asset === 'sgb' ? '₹1.25L limit' : '') + ')', '− ' + _cgInr(exempt), '#059669');
    }
    h += row('Taxable Gain', _cgInr(taxable));
    h += row('Tax Rate (' + taxType + ')', (taxRate * 100).toFixed(1) + '%', '#dc2626');
    h += row('Capital Gains Tax', _cgInr(tax), '#dc2626');
    h += row('Health & Edu. Cess (4%)', _cgInr(cess), '#b45309');
    h += '</div>';

    // Bottom 3 summary cards
    h += '<div class="grid grid-cols-3 gap-1.5 mb-2">';
    h +=   '<div class="rounded-xl p-2 text-center" style="background:#fef2f2;border:1px solid #fca5a5;">';
    h +=     '<div class="text-[9px] font-black text-red-600">Total Tax + Cess</div>';
    h +=     '<div class="text-sm font-black text-red-700">' + _cgInr(totalTax) + '</div>';
    h +=     '<div class="text-[9px] text-red-400">' + effRate.toFixed(1) + '% of gain</div>';
    h +=   '</div>';
    h +=   '<div class="rounded-xl p-2 text-center" style="background:#f0fdf4;border:1px solid #86efac;">';
    h +=     '<div class="text-[9px] font-black text-emerald-600">Net Proceeds</div>';
    h +=     '<div class="text-sm font-black text-emerald-700">' + _cgInr(netProc) + '</div>';
    h +=     '<div class="text-[9px] text-emerald-400">after all tax</div>';
    h +=   '</div>';
    h +=   '<div class="rounded-xl p-2 text-center" style="background:#eff6ff;border:1px solid #bfdbfe;">';
    h +=     '<div class="text-[9px] font-black text-blue-600">Post-Tax Profit</div>';
    h +=     '<div class="text-sm font-black text-blue-700">' + _cgInr(gain - totalTax) + '</div>';
    h +=     '<div class="text-[9px] text-blue-400">gain − tax</div>';
    h +=   '</div>';
    h += '</div>';

    // Alternative tax option (pre-Jul23 gold/property/unlisted)
    if (altTax) {
        h += '<div class="rounded-lg px-2.5 py-2 text-[9px] leading-relaxed mb-1.5" style="background:#fffbeb;border:1px solid #fcd34d;color:#92400e;">';
        h += '<strong>Alternative option:</strong> ' + altTax.label + ' = ' + _cgInr(altTax.tax);
        if (altTax.idxCost) h += ' (indexed cost ' + _cgInr(altTax.idxCost) + ')';
        h += '. The calculator auto-selects the lower option. Confirm with your CA before filing.';
        h += '</div>';
    }

    // Rule note
    if (note) {
        h += '<div class="text-[9px] leading-relaxed text-slate-400">' + note + '</div>';
    }

    resEl.innerHTML = h;
    if (typeof saveUserData === 'function') saveUserData();
}

function initCgCalc() {
    var defs = { 'cg-cost': '1,00,000', 'cg-sale': '1,50,000', 'cg-ltcg-used': '0', 'cg-income': '12,00,000' };
    Object.keys(defs).forEach(function(id) {
        var el = document.getElementById(id);
        if (!el) return;
        if (!el.value) { el.value = defs[id]; el.classList.add('text-slate-400'); }
        else if (el.value === defs[id]) { el.classList.add('text-slate-400'); }
        else { el.classList.remove('text-slate-400'); }
    });
    var buyEl = document.getElementById('cg-buy-date');
    var sellEl = document.getElementById('cg-sell-date');
    if (buyEl  && !buyEl.value)  buyEl.value  = '2023-01-15';
    if (sellEl && !sellEl.value) sellEl.value = '2025-01-20';
    // Apply saved regime (default new)
    var savedRegime = document.getElementById('cg-regime')?.value || 'new';
    cgSetRegime(savedRegime);
    cgCalc();
}

function resetCgCalc() {
    var assetEl = document.getElementById('cg-asset');
    if (assetEl) assetEl.value = 'equity';
    var buyEl = document.getElementById('cg-buy-date');
    var sellEl = document.getElementById('cg-sell-date');
    if (buyEl)  buyEl.value  = '2023-01-15';
    if (sellEl) sellEl.value = '2025-01-20';
    var defs = { 'cg-cost': '1,00,000', 'cg-sale': '1,50,000', 'cg-ltcg-used': '0', 'cg-income': '12,00,000' };
    Object.keys(defs).forEach(function(id) {
        var el = document.getElementById(id);
        if (el) { el.value = defs[id]; el.classList.add('text-slate-400'); }
    });
    cgSetRegime('new');
    cgCalc();
    if (typeof saveUserData === 'function') saveUserData();
}
