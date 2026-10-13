// Fig 2: a push-type version of the same solenoid driving a locking pin into a lock ring
// (a stand-in for a differential-lock ring). Built by build.mjs, animated by live2.js.
import * as k from "./kit/iso-kit.mjs";
import * as G from "./kit/lathe.mjs";
import { tubePieces, tubeSvg } from "./kit/tube.mjs";
import * as M from "./model.mjs";
import * as PT from "./parts.mjs";

export function buildFig2() {
  const W = 760, H = 470;
  const ZS = 50; // shaft axis height
  const RBC = M.LOCK.rbc * 1e3; // hole bolt circle radius (mm)
  const ZP = ZS + RBC; // pin and solenoid axis height
  const XS = 46; // solenoid back face (its pole end faces the ring)
  const RING = { x0: 0, x1: 10, r: 46 };
  const BENCH = { x: -146, y: -42, w: 290, d: 84, r: 6 };
  const PLATE = { x: XS - 5, y: -9, w: 5, d: 18, r: 1.2 };
  const D2 = { ...PT.DIMS, ZA: ZP, pole: XS + 18, lip: XS + 41.2 };
  const P = k.fitProjection([...k.boxCorners(BENCH, -12, 0), [RING.x0, 0, ZS + RING.r], [XS + 40, 0, ZP + 17], [XS + 96, 0, ZP], [-136, 0, ZS + 17]], W, H, { pad: 18, azimuth: 50, elevation: 24 });
  const at = (p) => k.iso(p, P);
  const KS = k.cameraOf(P).k;
  const S = (paths, cls, extra = {}) => k.solidSvg(paths, { tone: "hi", className: cls, ...extra });
  const L = (d, style) => k.lineSvg(d, style);
  const Dots = (pts, style) => k.dotsSvg(pts, style);
  const AXS = (x = 0) => PT.axisFrame(G, x, ZS);
  const AXP = (x = 0) => PT.axisFrame(G, x, ZP);
  const byDepth = (pts) => [...pts].sort((a, b) => k.depthOf([a[0], a[1], 0], P) - k.depthOf([b[0], b[1], 0], P));
  const part = (name, body) => `<g data-part="${name}">${body}</g>`;

  function bench() {
    const out = [`<path class="iso-halo" d="${k.haloOf(BENCH, -12, 12, P)}"/>`];
    for (const [x, y] of byDepth(k.corners(BENCH, 14))) out.push(S(k.cylinder(x, y, 6, -12, 4, P, 24), "m-rubber"));
    out.push(S(k.slabOf(BENCH, -8, 8, P, 8, 1.2), "m-stand", { inner: L(k.sideSeam(BENCH, -3, P, 8), { tone: "faint" }) }));
    out.push(L(k.planOutline(k.insetPlan(BENCH, 4), 0, P), { tone: "faint" }));
    const screws = k.corners(BENCH, 8);
    out.push(L(screws.map(([x, y]) => k.ring(x, y, 1.8, 0, P, 16)).join(""), { tone: "lo" }));
    out.push(Dots(screws.map(([x, y]) => at([x, y, 0])), { size: 0.5 }));
    // T-slots along the bench
    for (const y of [-26, 26]) out.push(L(k.planOutline({ x: BENCH.x + 10, y: y - 1.5, w: BENCH.w - 20, d: 3, r: 1.5 }, 0, P, 3), { tone: "lo" }));
    return out.join("");
  }
  function drive() {
    const out = [];
    // motor on a foot, gearbox, coupling
    out.push(S(k.slabOf({ x: -138, y: -16, w: 40, d: 32, r: 2 }, 0, 6, P, 3, 0.4), "m-bracket"));
    out.push(S(k.slabOf({ x: -134, y: -6, w: 32, d: 12, r: 1 }, 6, ZS - 22, P, 3, 0.3), "m-bracket"));
    out.push(S(G.disc(-138, -134, 15, AXS(), P), "m-dark"));
    out.push(S(G.disc(-134, -102, 17, AXS(), P), "m-red", { inner: L([-128, -122, -116, -110].map((s) => G.arcOf(AXS(), s, 17, P)).join(""), { tone: "faint" }) }));
    out.push(S(k.slabOf({ x: -102, y: -19, w: 26, d: 38, r: 3 }, ZS - 22, 42, P, 4, 0.6), "m-iron-dk", { inner: L(k.sideSeam({ x: -102, y: -19, w: 26, d: 38, r: 3 }, ZS + 4, P, 4), { tone: "faint" }) }));
    out.push(S(k.slabOf({ x: -104, y: -21, w: 30, d: 42, r: 2 }, 0, 6, P, 3, 0.4), "m-bracket"));
    for (const y of [-12, 8]) out.push(S(k.slabOf({ x: -98, y, w: 18, d: 4, r: 0.8 }, 6, ZS - 28, P, 2, 0.3), "m-bracket"));
    out.push(Dots([at([-80, 18.4, ZS + 14]), at([-98, 18.4, ZS + 14]), at([-80, 18.4, ZS - 18]), at([-98, 18.4, ZS - 18])], { size: 0.55 }));
    out.push(S(G.disc(-76, -72, 6, AXS(), P), "m-zinc"));
    out.push(S(G.disc(-72, -64, 12, AXS(), P), "m-brass", { inner: L(G.arcOf(AXS(), -68, 12, P), { tone: "faint" }) }));
    return out.join("");
  }
  function pillow(x0) {
    const out = [];
    out.push(S(k.slabOf({ x: x0 - 2, y: -24, w: 16, d: 48, r: 2 }, 0, 6, P, 3, 0.4), "m-iron-dk"));
    for (const y of [-19, 19]) { out.push(S(k.cylinder(x0 + 6, y, 2.6, 6, 1.6, P, 6), "m-zinc")); }
    out.push(S(k.slabOf({ x: x0, y: -14, w: 12, d: 28, r: 2 }, 6, ZS - 6, P, 3, 0.4), "m-iron-dk"));
    out.push(S(G.disc(x0, x0 + 12, 16, AXS(), P), "m-iron-dk", { inner: L(G.arcOf(AXS(), x0 + 6, 16, P), { tone: "faint" }) }));
    out.push(S(k.cylinder(x0 + 6, 0, 2, ZS + 15.6, 3, P, 12), "m-brass"));
    return out.join("");
  }
  const shaft = (a, b) => S(G.disc(a, b, 9, AXS(), P), "m-zinc");
  function ring() {
    const out = [];
    out.push(S(G.disc(-10, 0, 17, AXS(), P), "m-iron"));
    out.push(S(G.disc(RING.x0, RING.x1, RING.r, AXS(), P), "m-iron", { inner: "" }));
    out.push(`<g data-part="teeth"></g>`);
    out.push(L(G.circleOf(AXS(), RING.x1, RING.r - 4, P) + G.circleOf(AXS(), RING.x1, RBC + 7.5, P) + G.circleOf(AXS(), RING.x1, RBC - 7.5, P), { tone: "faint" }));
    out.push(`<g data-part="holes" data-mech="pin"></g>`);
    out.push(S(G.disc(RING.x1, RING.x1 + 4, 17, AXS(), P), "m-iron-dk"));
    out.push(Dots(G.dotsOf(AXS(), RING.x1 + 4, 13, 6, P, { all: true }), { size: 0.6, tone: "hi" }));
    return out.join("");
  }
  // the dog clutch's fixed splined hub stands on this pedestal (dog mechanism only)
  function dogPedestal() {
    return S(k.slabOf({ x: 31, y: -13, w: 10, d: 26, r: 1.4 }, 0, 4, P, 3, 0.4), "m-bracket") + S(k.slabOf({ x: 33, y: -9, w: 7, d: 18, r: 1 }, 4, ZS - 22 - 4, P, 3, 0.4), "m-bracket") + Dots([at([32.4, -11, 4]), at([39.6, 11, 4])], { size: 0.55 });
  }
  function mount() {
    const out = [];
    out.push(S(k.slabOf({ x: PLATE.x - 4, y: PLATE.y - 6, w: 30, d: PLATE.d + 12, r: 1.6 }, 0, 4, P, 3, 0.4), "m-bracket"));
    for (const y of [-11, 11]) { out.push(S(k.cylinder(PLATE.x + 18, y, 2.2, 4, 1.4, P, 6), "m-zinc")); }
    const gus = (y) => S(G.prismOf(G.frameOf([0, y, 0], [0, 1, 0], [1, 0, 0], [0, 0, 1]), [[PLATE.x + PLATE.w + 16, 4], [PLATE.x + PLATE.w, 4], [PLATE.x + PLATE.w, 30]], 0, 2, P), "m-bracket");
    out.push(S(k.slabOf(PLATE, 4, ZP + 12, P, 3, 0.5), "m-bracket"));
    out.push(gus(PLATE.y), gus(PLATE.y + PLATE.d - 2));
    return out.join("");
  }
  function solenoid() {
    const out = [];
    out.push(part("can2", S(G.disc(XS, XS + 40, 17, AXP(), P), "m-iron", { inner: L(G.arcOf(AXP(), XS + 1.2, 17, P) + G.arcOf(AXP(), XS + 38.8, 17, P), { tone: "faint" }) })));
    out.push(L(G.circleOf(AXP(), XS + 40, 15, P), { tone: "lo" }));
    out.push(Dots(G.dotsOf(AXP(), XS + 40, 12.4, 4, P, { all: true, phase: Math.PI / 4 }), { size: 0.5, tone: "mid" }));
    out.push(S(G.disc(XS + 40, XS + 41.2, 12, AXP(), P), "m-brass"));
    return out.join("");
  }
  // harness: grommet on top of the can to a two-pin connector on the bench
  const gN = [0, -Math.sin(0.7), Math.cos(0.7)];
  const gAt = (s) => [XS + 9, gN[1] * (17 + s), ZP + gN[2] * (17 + s)];
  const CONN = { x: XS + 6, y: -36, w: 12, d: 9, r: 1 };
  function harness() {
    const F = G.frameOf(gAt(0), gN, [1, 0, 0], G.cross3(gN, [1, 0, 0]));
    let out = S(G.disc(-0.6, 1.6, 3.2, F, P), "m-rubber") + S(G.disc(1.6, 3.4, 2.4, F, P), "m-rubber");
    const lead = (o, cls) => {
      const route = G.fillet([G.add3(gAt(3.4), [o, 0, 0]), G.add3(gAt(7), [o, 0, 0]), [XS + 9 + o, -21, ZP + 4], [XS + 9 + o, -23, 14], [CONN.x + 6 + o, -28, 14], [CONN.x + 6 + o, CONN.y + CONN.d, 5.5]], 4, 7, { P, tube: 0.75 });
      return tubePieces(route, 0.75, P, { maxLength: 16 }).map((p) => `<g class="${cls}">${tubeSvg(p, { tone: "hi" })}</g>`).join("");
    };
    out += lead(-1.2, "w-red") + lead(1.2, "w-black");
    out += S(k.slabOf(CONN, 0, 9, P, 2, 0.4), "m-dark") + S(k.slabOf({ x: CONN.x - 2, y: CONN.y + 1, w: 16, d: 7, r: 0.6 }, 0, 2, P, 2), "m-dark");
    out += L(k.planOutline({ x: CONN.x + 2, y: CONN.y + 2, w: 8, d: 5, r: 0.8 }, 9, P, 2), { tone: "mid" });
    return out;
  }

  const body = [
    `<g data-layer="bench">${bench()}</g>`,
    `<g data-layer="drive">${drive()}</g>`,
    shaft(-64, -60), pillow(-60), shaft(-48, -34), pillow(-34), shaft(-22, -10),
    `<g data-layer="ring" data-part="ring">${ring()}</g>`,
    `<g data-mech="dog">${dogPedestal()}</g>`,
    `<g data-dyn2="dog" data-mech="dog"></g>`,
    shaft(14, 18),
    `<g data-layer="harness">${harness()}</g>`,
    `<g data-dyn2="pin" data-mech="pin"></g>`,
    `<g data-layer="mount" data-part="mount">${mount()}</g>`,
    `<g data-layer="sol2">${solenoid()}</g>`,
    `<g data-dyn2="a"></g>`,
    `<g data-dyn2="c"></g>`,
  ].join("");
  const svg = k.figureSvg({ width: W, height: H, label: "The same solenoid in push form on a bench: its pin points at a lock ring with eight holes, which a gear motor turns slowly on a shaft in two pillow blocks.", body, className: "lock-svg" });
  const DATA2 = { P, W, H, D2, ZS, ZP, XS, RBC, RING, PLATE_X: PLATE.x, KS };
  return { svg, DATA2 };
}
