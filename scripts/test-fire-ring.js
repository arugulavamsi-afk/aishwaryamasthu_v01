/* Tests the two percentages behind the Dashboard FIRE Age twin ring.
   Run after ANY change to _dashFireAge (dashboard.js) or the projection
   engine (public/js/fire-age.js):  node scripts/test-fire-ring.js        */
var fs = require('fs'), path = require('path'), vm = require('vm');

// Load the REAL engine — never a copy, or the tile and the tool can drift.
var src = fs.readFileSync(path.join(__dirname, '../public/js/fire-age.js'), 'utf8');
// Stubbed DOM so the browser file evaluates unmodified — patching the
// source here would mean testing something other than what ships.
var ctx = {
    window: {}, Math: Math, parseFloat: parseFloat, isNaN: isNaN, console: console,
    document: { getElementById: function () { return null; },
                querySelectorAll: function () { return []; } }
};
ctx.globalThis = ctx;
vm.createContext(ctx);
vm.runInContext(src, ctx);
var _faProject = ctx.window._faProject, _faCoast = ctx.window._faCoast;
if (typeof _faProject !== 'function' || typeof _faCoast !== 'function') {
    console.log('FAIL: fire-age.js no longer exports _faProject / _faCoast on window');
    process.exit(1);
}

var fails = 0, runs = 0;
function ok(cond, name, extra) {
    runs++;
    if (!cond) { fails++; console.log('  FAIL  ' + name + (extra ? '  — ' + extra : '')); }
    else console.log('  pass  ' + name);
}

// Mirrors the ring math in dashboard.js _dashFireAge / _fireRing.
function pcts(p) {
    var multiple = p.swr > 0 ? 100 / p.swr : 25;
    var reg = _faProject(p, 1.0, multiple);
    var t0  = (reg.series && reg.series[0]) ? reg.series[0].target : 0;
    var co  = _faCoast(p, multiple);
    return {
        fire:  t0 > 0 ? (p.corpus / t0) * 100 : 0,
        coast: co && co.number > 0 ? (p.corpus / co.number) * 100 : 0,
        age:   reg.age, reached: reg.reached
    };
}
function clamp(n) { return Math.max(0, Math.min(100, Math.round(n || 0))); }

var base = { age:33, retAge:60, monthlyExpense:60000, corpus:2500000,
             annualSIP:600000, r:0.11, infl:0.06, swr:4 };

console.log('\n— relationship between the two arcs —');
var b = pcts(base);
ok(b.coast > b.fire, 'return > inflation: inner (Coast) leads outer (FIRE)',
   'fire=' + b.fire.toFixed(1) + '% coast=' + b.coast.toFixed(1) + '%');

var inv = pcts(Object.assign({}, base, { r: 0.05, infl: 0.08 }));
ok(inv.coast < inv.fire, 'return < inflation: the arcs legitimately cross over',
   'fire=' + inv.fire.toFixed(1) + '% coast=' + inv.coast.toFixed(1) + '%');

console.log('\n— both percentages are real, bounded values —');
ok(b.fire > 0 && b.fire < 100, 'mid-journey FIRE % is strictly between 0 and 100');
var zero = pcts(Object.assign({}, base, { corpus: 0 }));
ok(clamp(zero.fire) === 0 && clamp(zero.coast) === 0, 'zero corpus renders empty arcs, not NaN');
var rich = pcts(Object.assign({}, base, { corpus: 500000000 }));
ok(clamp(rich.fire) === 100 && clamp(rich.coast) === 100, 'already-FI corpus clamps to 100, never overshoots');

console.log('\n— the arcs stay in step with the age the tile prints —');
var early = pcts(Object.assign({}, base, { corpus: 15000000 }));
ok(early.age < b.age && early.fire > b.fire,
   'a bigger corpus moves the age earlier AND fills the ring further',
   'age ' + b.age + '->' + early.age);

console.log('\n— stroke-dashoffset geometry (must land inside the track) —');
[[47, 6.5], [39, 3]].forEach(function (ring) {
    var c = 2 * Math.PI * ring[0];
    [0, 34, 100].forEach(function (pct) {
        var off = c * (1 - pct / 100);
        ok(off >= -0.01 && off <= c + 0.01, 'r=' + ring[0] + ' at ' + pct + '% -> offset in [0,' + c.toFixed(1) + ']');
    });
    ok(ring[0] + ring[1] / 2 <= 55, 'r=' + ring[0] + ' stroke stays inside the 110 viewBox');
});
ok((47 - 6.5 / 2) - (39 + 3 / 2) >= 2, 'gap between the two arcs is at least 2 units');

console.log('\n' + (fails ? fails + ' of ' + runs + ' FAILED' : 'all ' + runs + ' passed'));
process.exit(fails ? 1 : 0);
