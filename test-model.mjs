// Physics QA: run with `node test-model.mjs`. Exits non-zero on any failed check.
import * as M from "./model.mjs";
let fails = 0;
const check = (ok, msg) => { console.log((ok ? "ok   " : "FAIL ") + msg); if (!ok) fails++; };
function run(raw, fault = "none", { on = 0.08, off = 0.12, dt = 5e-6, log = false } = {}) {
  const q = M.resolve(raw, fault);
  const s = M.newState();
  const tr = [];
  let pullAt = null, seatAt = null, releaseAt = null, backAt = null, iMin = Infinity, dipSeen = false, iPrev = 0, rising = true, maxX = 0, minGap = Infinity;
  for (let t = 0; t < on + off; t += dt) {
    s.on = t < on;
    M.step(s, q, dt);
    maxX = Math.max(maxX, s.x);
    if (s.on && pullAt === null && s.x > 1e-6) pullAt = t;
    if (s.on && seatAt === null && s.seated) seatAt = t;
    if (s.on && pullAt !== null && seatAt === null && s.i < iPrev) dipSeen = true;
    if (!s.on && releaseAt === null && s.x < q.xMax - 1e-6) releaseAt = t;
    if (!s.on && backAt === null && releaseAt !== null && s.x <= 0) backAt = t;
    iPrev = s.i;
    if (log && Math.round(t / dt) % 2000 === 0) tr.push([+(t * 1e3).toFixed(1), +s.i.toFixed(3), +(s.x * 1e3).toFixed(3), +s.F.toFixed(2), +s.B.toFixed(3)]);
  }
  return { q, s, pullAt, seatAt, releaseAt, backAt, dipSeen, maxX, tr };
}
const D = M.DEFAULTS;
const r = run(D, "none", { log: true });
console.table(r.tr.slice(0, 30));
const act = M.actuation(r.q);
console.log("defaults: I_ss", act.i.toFixed(3), "A  F(g0)", act.F0.toFixed(2), "N need", act.need.toFixed(2), "N  pull-in starts", (r.pullAt * 1e3).toFixed(2), "ms  seated", (r.seatAt * 1e3).toFixed(2), "ms  release", (r.releaseAt * 1e3 - 80).toFixed(2), "ms after off  back", (r.backAt * 1e3 - 80).toFixed(2), "ms after off");
check(r.pullAt > 0 && r.seatAt > r.pullAt, "1. plunger moves toward the pole (x increases, gap closes) when energized");
check(r.backAt !== null && r.s.x === 0, "2. spring returns the plunger to rest after de-energizing");
check(r.s.i === 0 && r.s.lam === 0 && r.s.B === 0, "4. no current or flux at steady OFF");
check(r.maxX <= r.q.xMax + 1e-12, "7. plunger never passes the stop washer (max x " + (r.maxX * 1e3).toFixed(4) + " mm, limit " + (r.q.xMax * 1e3).toFixed(4) + ")");
check(r.dipSeen, "current dips while the plunger moves (motional back-EMF)");
// force trends
const q = r.q;
check(M.forceAt(1, 1e-3, q) > M.forceAt(1, 2e-3, q), "6. force rises as the gap closes");
check(M.forceAt(2, 1e-3, q) > M.forceAt(1, 1e-3, q), "6. force rises with current");
const lin = M.forceAt(1, 1e-3, q), ideal = (M.MU0 * q.N ** 2 * 1 * q.A) / (2 * M.gEff(1e-3) ** 2);
check(Math.abs(lin - ideal) / ideal < 1e-9, "linear force equals μ0N²I²A/(2g_eff²)");
const qs = M.resolve({ ...D, sat: true, V: 24, R: 2 });
check(M.bOf(12, M.CONST.gStop, qs) < M.CONST.Bs, "saturation caps B below Bs (" + M.bOf(12, M.CONST.gStop, qs).toFixed(3) + " T)");
// insufficient force
const weak = run({ ...D, Fpre: 20, Fload: 20 });
check(weak.maxX === 0 && !M.actuation(weak.q).ok, "insufficient force: plunger stays put and actuation() says so");
// flyback comparison
const fd = run(D, "none"), fc = run({ ...D, flyback: "clamp" }), fn = run(D, "flyback");
console.log("release after off: diode", (fd.releaseAt * 1e3 - 80).toFixed(2), "ms · clamp", (fc.releaseAt * 1e3 - 80).toFixed(2), "ms · none", (fn.releaseAt * 1e3 - 80).toFixed(2), "ms");
check(fc.releaseAt < fd.releaseAt, "clamp releases faster than a plain diode");
// faults
for (const f of Object.keys(M.FAULTS)) {
  const x = run(D, f);
  console.log(f.padEnd(9), "moved", (x.maxX * 1e3).toFixed(2), "mm · seat", x.seatAt ? (x.seatAt * 1e3).toFixed(1) + " ms" : "never", "· I_ss", M.steadyCurrent(x.q).toFixed(2), "A");
}
check(run(D, "open").maxX === 0, "open winding: no motion");
check(run(D, "sticky").maxX === 0 || run(D, "sticky").seatAt > fd.seatAt, "contamination: slower or no pull-in");
// rapid switching
{
  const q2 = M.resolve(D), s = M.newState(); let bad = false;
  for (let t = 0, n = 0; t < 0.2; t += 5e-6, n++) {
    s.on = Math.floor(t / 0.0017) % 2 === 0; M.step(s, q2, 5e-6);
    if (!(s.x >= 0 && s.x <= q2.xMax + 1e-12 && Number.isFinite(s.i) && s.i >= 0)) bad = true;
  }
  check(!bad, "8. rapid ON/OFF switching stays bounded and finite");
}
// extreme sliders stay finite
for (const V of [6, 24]) for (const N of [200, 1200]) for (const R of [2, 30]) for (const g0 of [1, 10]) for (const sat of [false, true]) {
  const x = run({ ...D, V, N, R, g0, sat, m: 10, k: 10, Fpre: 0 }, "none", { on: 0.03, off: 0.03, dt: 5e-6 });
  if (!Number.isFinite(x.s.x) || x.maxX > x.q.xMax + 1e-12) { check(false, "extreme " + JSON.stringify({ V, N, R, g0, sat })); }
}
check(true, "extreme slider corners finite");
// Fig 2 lock
{
  const q2 = M.resolve({ ...D, N: 700, R: 6, Fload: 0, sat: true, g0: (M.LOCK.c0 + M.LOCK.depth + M.CONST.gStop) * 1e3 });
  console.log("fig2 actuation", M.actuation(q2));
  const s = M.newState(), L = M.newLock();
  L.theta = (Math.PI * 2) / M.LOCK.holes / 2; // pin between holes
  L.omega = 2; L.torque = 250;
  let blockedSeen = false, engagedAt = null;
  for (let t = 0; t < 0.6; t += 5e-6) {
    s.on = t < 0.4;
    const ex = M.stepLock(L, s, q2, 5e-6);
    M.step(s, q2, 5e-6, ex);
    if (L.blocked) blockedSeen = true;
    if (engagedAt === null && L.locked) engagedAt = t;
  }
  check(blockedSeen && engagedAt !== null, "Fig 2: misaligned pin is blocked first, then engages when a hole comes round (" + (engagedAt * 1e3).toFixed(0) + " ms)");
  check(L.inHole && L.locked, "Fig 2: pin stays trapped under torque after de-energizing (shear " + L.shear.toFixed(0) + " N)");
  L.torque = 0; L.omega = 0;
  for (let t = 0; t < 0.2; t += 5e-6) { const ex = M.stepLock(L, s, q2, 5e-6); M.step(s, q2, 5e-6, ex); }
  check(!L.inHole && s.x === 0, "Fig 2: pin withdraws once torque is relieved");
}
// energy balance
{
  const e = r.s.E;
  const out = e.copper + e.flyback + e.friction + e.impact + e.damping + e.load + e.spring + e.mag;
  console.log("energy (mJ): supply", (e.supply * 1e3).toFixed(2), "copper", (e.copper * 1e3).toFixed(2), "flyback", (e.flyback * 1e3).toFixed(2), "load", (e.load * 1e3).toFixed(3), "spring", (e.spring * 1e3).toFixed(3), "fric", (e.friction * 1e3).toFixed(3), "impact", (e.impact * 1e3).toFixed(3), "damp", (e.damping * 1e3).toFixed(3), "mag", (e.mag * 1e3).toFixed(3));
  check(Math.abs(out - e.supply) / e.supply < 0.02, "energy ledger balances within 2% (" + ((out / e.supply - 1) * 100).toFixed(2) + "%)");
}
// cone pole faces flatten the force-stroke curve
{
  const flat = M.resolve({ ...D, face: "flat" }), cone = M.resolve({ ...D, face: "cone45" });
  const ratio = (q) => M.forceAt(1, 0.5e-3, q) / M.forceAt(1, 4e-3, q);
  check(M.forceAt(1, 4e-3, cone) > M.forceAt(1, 4e-3, flat) && ratio(cone) < ratio(flat), "cone pole: more force at long stroke, flatter curve (end/start " + ratio(cone).toFixed(1) + " vs " + ratio(flat).toFixed(1) + ")");
  const r = run({ ...D, face: "cone45" });
  check(r.seatAt > 0 && r.maxX <= r.q.xMax + 1e-12, "cone pole: pulls in and stops on the washer");
}
// self-heating: temperature rises toward Ta + P·Rth and a hot coil loses its pull-in
{
  let T = 20; for (let t = 0; t < 3000; t += 1) T = M.heatStep(T, 12, 20, 1);
  check(Math.abs(T - (20 + 12 * M.CONST.Rth)) < 0.5, "self-heating settles at T_amb + P·R_th (" + T.toFixed(1) + " °C)");
  check(M.actuation(M.resolve({ ...D, T: 20 })).ok && !M.actuation(M.resolve({ ...D, T: 110 })).ok, "a coil that pulls in cold fails at 110 °C");
}
// dog clutch geometry: blocked on tooth tips, then engages and locks
{
  const q2 = M.resolve({ ...D, N: 700, R: 6, Fload: 0, Fpre: 3, sat: true, g0: (M.GEO.dog.c0 + M.GEO.dog.depth + M.CONST.gStop) * 1e3 });
  const s = M.newState(), L = M.newLock(); L.theta = (Math.PI * 2) / 12 * 0.42; L.omega = 2.5; L.torque = 250;
  let blocked = false, locked = false;
  for (let t = 0; t < 0.4; t += 5e-6) { s.on = true; const ex = M.stepLock(L, s, q2, 5e-6, M.GEO.dog); M.step(s, q2, 5e-6, ex); blocked ||= L.blocked; locked ||= L.locked; }
  check(blocked && locked, "dog clutch: tooth-on-tooth block, then engagement and lock");
}
console.log(fails ? fails + " FAILED" : "all checks passed");
process.exit(fails ? 1 : 0);
