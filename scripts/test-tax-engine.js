/* Tests for the pure slab functions in public/tax-guide.js (tgTaxOld / tgTaxNew).
   Run: node scripts/test-tax-engine.js — exits 1 on any failure.
   Guards the CLAUDE.md rules: Budget 2025 new-regime slabs, 87A rebate ≤₹12L,
   87A marginal relief above ₹12L, and the 4% cess multiplier callers apply. */
'use strict';
const fs = require('fs'), path = require('path');
const src = fs.readFileSync(path.join(__dirname, '..', 'public', 'tax-guide.js'), 'utf8');

function extract(name) { // pull one top-level function out of the browser script
    const start = src.indexOf('function ' + name + '(');
    if (start === -1) throw new Error(name + ' not found in tax-guide.js');
    for (let j = src.indexOf('{', start), depth = 0; j < src.length; j++) {
        if (src[j] === '{') depth++;
        else if (src[j] === '}' && --depth === 0) return eval('(' + src.slice(start, j + 1) + ')');
    }
}
const tgTaxOld = extract('tgTaxOld'), tgTaxNew = extract('tgTaxNew');

let fails = 0;
function eq(label, actual, expected) {
    if (Math.abs(actual - expected) > 1e-6) { fails++; console.error('FAIL ' + label + ': expected ' + expected + ', got ' + actual); }
}

// ── New regime (FY 2025-26, Budget 2025) ──
eq('new: nil slab boundary (4L)',            tgTaxNew(400000),  0);
eq('new: 87A rebate zeroes tax at 12L',      tgTaxNew(1200000), 0);        // raw slab tax 60,000 → rebated
eq('new: marginal relief ₹1 over 12L',       tgTaxNew(1200001), 1);        // tax capped at income above 12L
eq('new: marginal relief at 12.7L',          tgTaxNew(1270000), 70000);    // slab 70,500 capped to 70,000
eq('new: relief crossover passed (12.8L)',   tgTaxNew(1280000), 72000);    // slab 72,000 < 80,000 cap
eq('new: 16L slab boundary',                 tgTaxNew(1600000), 120000);
eq('new: 20L slab boundary',                 tgTaxNew(2000000), 200000);
eq('new: 24L slab boundary',                 tgTaxNew(2400000), 300000);
eq('new: 30% top slab (30L)',                tgTaxNew(3000000), 480000);

// ── Old regime ──
eq('old: nil at exemption (2.5L)',           tgTaxOld(250000),          0);
eq('old: 87A rebate zeroes tax at 5L',       tgTaxOld(500000),          0); // raw 12,500 → rebated
eq('old: rebate cliff — no relief above 5L', tgTaxOld(500001),          12500.2);
eq('old: 10L boundary',                      tgTaxOld(1000000),         112500);
eq('old: 30% top slab (15L)',                tgTaxOld(1500000),         262500);
eq('old: senior exemption 3L',               tgTaxOld(1000000, 300000), 110000);
eq('old: super senior exemption 5L',         tgTaxOld(1000000, 500000), 100000);

// ── 4% Health & Education Cess — callers must multiply by 1.04 ──
eq('cess: 4% on new-regime tax at 16L',      Math.round(tgTaxNew(1600000) * 1.04), 124800);

if (fails) { console.error(fails + ' test(s) failed'); process.exit(1); }
console.log('tax engine: all tests passed');
