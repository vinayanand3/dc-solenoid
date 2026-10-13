
// ---------- Fig 2 runtime: the lock pin ----------
const DATA2 = __DATA2__;
(() => {
  const { P: P2, D2, ZS, ZP, RBC, RING, PLATE_X } = DATA2;
  const svg2 = document.querySelector(".lock-svg");
  if (!svg2) return;
  const stage2 = svg2.closest(".iso-stage");
  const plate2 = stage2.closest(".iso-plate");
  const d2 = (n) => svg2.querySelector(`[data-dyn2="${n}"]`);
  const AXS = (x = 0) => axisFrame(G, x, ZS);
  const AXP = (x = 0) => axisFrame(G, x, ZP);
  const PITCH = (Math.PI * 2) / LOCK.holes;
  const C0 = LOCK.c0 * 1e3;
  const DOG = GEO.dog, DPITCH = (Math.PI * 2) / DOG.count;
  const geo = () => GEO[st.mech];
  const pitchOf = () => (st.mech === "dog" ? DPITCH : PITCH);
  const BASE = { ...DEFAULTS, N: 700, R: 6, Fload: 0, Fpre: 3, k: 1.0, m: 60, sat: true, peakHold: false, g0: +((LOCK.c0 + LOCK.depth + CONST.gStop) * 1e3).toFixed(2) };
  const st = { raw: { ...BASE }, fault: "none", speed: 1 / 12, playing: true, events: [], visible: false, mech: "pin" };
  let q2 = resolve(st.raw, st.fault), s2 = newState(), L2 = newLock();
  const TR = { t: [], depth: [], err: [], span: 0.6 };
  let trNext = 0;

  function holesSvg() {
    let defs = "", out = "";
    for (let j = 0; j < LOCK.holes; j++) {
      const phi = L2.theta + j * PITCH;
      const cy = -RBC * Math.sin(phi), cz = ZS + RBC * Math.cos(phi);
      const ring = (x, r) => pathOf(Array.from({ length: 28 }, (_, n) => { const t = (n / 28) * Math.PI * 2; return iso([x, cy + r * Math.sin(t), cz + r * Math.cos(t)], P2); }), true);
      const face = ring(RING.x1, LOCK.holeR * 1e3);
      defs += `<clipPath id="h2-${j}"><path d="${face}"/></clipPath>`;
      out += `<path class="hole-wall" d="${face}"/><path class="hole-floor" clip-path="url(#h2-${j})" d="${ring(RING.x1 - 5, LOCK.holeR * 1e3)}"/><path class="iso-line" data-tone="hi" d="${face}"/>`;
    }
    return `<defs>${defs}</defs>` + out;
  }
  function pinSvg(tipX) {
    const prof = [[tipX, 2.1], [tipX + 0.9, 3.0], [PLATE_X - 2, 3.0]];
    const pin = solidSvg(G.solidOf(prof, AXP(), P2), { tone: "hi", className: "m-pin", lit: true });
    const bush = solidSvg(G.disc(PLATE_X - 2, PLATE_X, 6, AXP(), P2), { tone: "hi", className: "m-brass" });
    return `<g data-part="pin">${pin}</g><g data-part="bush">${bush}</g>`;
  }
  // dog clutch: 12 teeth on the ring's face, 12 on a collar splined to a fixed hub; the fork slides the collar
  const tooth = (phi, r0, r1, w, s0, s1, cls) => {
    const c = [[r0, phi - w / 2], [r1, phi - w / 2], [r1, phi + w / 2], [r0, phi + w / 2]].map(([r, a]) => [r * Math.cos(a), r * Math.sin(a)]);
    const mid = iso([s0, 0, 0], P2);
    return { depth: G.dot3([(s0 + s1) / 2, ((r0 + r1) / 2) * Math.sin(phi), ZS + ((r0 + r1) / 2) * Math.cos(phi)], G.viewOf(P2)), svg: solidSvg(G.prismOf(AXS(), c, s0, s1, P2), { tone: "hi", className: cls }) };
  };
  function dogSvg(shift) {
    const w = DOG.tooth * DPITCH, tipR = RING.x1 + 4, c0 = DOG.c0 * 1e3, h = 4;
    const ct0 = tipR + c0 - shift, cb0 = ct0 + h, cb1 = cb0 + 8;
    const teeth = [];
    for (let j = 0; j < DOG.count; j++) teeth.push(tooth(L2.theta + j * DPITCH, 29, 40, w, RING.x1, tipR, "m-iron-dk"));
    for (let j = 0; j < DOG.count; j++) teeth.push(tooth((j + 0.5) * DPITCH, 29, 40, w, ct0, cb0, "m-plunger"));
    teeth.sort((a, b) => a.depth - b.depth);
    const S2 = (paths, cls, extra = {}) => solidSvg(paths, { tone: "hi", className: cls, ...extra });
    let out = S2(G.disc(RING.x1 + 4, cb0, 22, AXS(), P2), "m-zinc", { inner: lineSvg(G.ribsOf(AXS(), RING.x1 + 4, cb0, 22, 18, P2), { tone: "lo" }) });
    out += `<g data-part="teeth2">${teeth.map((t) => t.svg).join("")}</g>`;
    out += `<g data-part="collar">` + S2(G.disc(cb0, cb0 + 3, 42, AXS(), P2), "m-plunger", { lit: true }) + S2(G.disc(cb0 + 3, cb0 + 5.5, 38.5, AXS(), P2), "m-plunger");
    // fork shoe riding in the collar's groove, then the near flange of the groove
    const fx = cb0 + 3.4;
    out += S2(slabOf({ x: fx, y: -7, w: 1.7, d: 14, r: 0.3 }, ZS + 38, 23, P2, 2, 0.2), "m-zinc");
    out += S2(G.disc(cb0 + 5.5, cb1, 42, AXS(), P2), "m-plunger", { lit: true, inner: lineSvg(G.circleOf(AXS(), cb1, 26, P2), { tone: "faint" }) }) + `</g>`;
    out += S2(G.disc(cb1, 41, 22, AXS(), P2), "m-zinc", { inner: lineSvg(G.ribsOf(AXS(), cb1, 41, 22, 18, P2), { tone: "lo" }) });
    // fork arm back to the push rod's head
    const head = 30 - shift;
    out += `<g data-part="fork">` + S2(slabOf({ x: fx, y: -2, w: head + 4 - fx, d: 4, r: 0.4 }, ZS + 60 - 2, 3, P2, 2, 0.3), "m-zinc");
    out += S2(slabOf({ x: head, y: -4, w: 4, d: 8, r: 0.6 }, ZP - 4, ZS + 61 - (ZP - 4), P2, 2, 0.3), "m-zinc");
    out += S2(G.disc(head + 4, PLATE_X - 2, 2.4, AXP(), P2), "m-pin", { lit: true }) + `</g>`;
    out += solidSvg(G.disc(PLATE_X - 2, PLATE_X, 6, AXP(), P2), { tone: "hi", className: "m-brass" });
    return out;
  }
  let lastKey2 = "";
  function draw2() {
    const key = s2.x.toFixed(6) + "|" + L2.theta.toFixed(5) + st.mech;
    if (key === lastKey2) return;
    lastKey2 = key;
    svg2.querySelector('[data-part="teeth"]').innerHTML = lineSvg(G.ribsOf(AXS(), RING.x0 + 0.4, RING.x1 - 0.4, RING.r, 60, P2, { phase: L2.theta }), { tone: "lo" });
    if (st.mech === "pin") {
      svg2.querySelector('[data-part="holes"]').innerHTML = holesSvg();
      d2("pin").innerHTML = pinSvg(RING.x1 + C0 - s2.x * 1e3);
      d2("dog").innerHTML = "";
    } else {
      svg2.querySelector('[data-part="holes"]').innerHTML = "";
      d2("pin").innerHTML = "";
      d2("dog").innerHTML = dogSvg(s2.x * 1e3);
    }
    const xi = innerOf(D2, (q2.g0 - s2.x) * 1e3);
    const pl = plungerSvg(K, G, P2, D2, xi, { cut: false });
    const sp = springSvg(K, P2, D2, D2.lip, xi + D2.collar[0]);
    d2("a").innerHTML = `<g data-part="spring">${lineSvg(sp.back, { tone: "lo", className: "spring spring-back" })}</g><g data-part="plunger">${pl.body}</g>`;
    d2("c").innerHTML = `<g data-part="spring">${lineSvg(sp.front, { tone: "hi", className: "spring", free: "start" })}</g>` + solidSvg(G.disc(xi + D.plungerLen, xi + D.plungerLen + 2.4, 6.5, AXP(), P2), { tone: "hi", className: "m-rubber" });
  }

  // ---------- sim ----------
  function advance2(simDt) {
    const n = Math.min(40000, Math.max(1, Math.round(simDt / 5e-6)));
    const dt = simDt / n;
    for (let i = 0; i < n; i++) {
      while (st.events.length && st.events[0].at <= s2.t) st.events.shift().fn();
      const ex = stepLock(L2, s2, q2, dt, geo());
      step(s2, q2, dt, ex);
      if (s2.t >= trNext) {
        trNext = s2.t + 5e-4;
        TR.t.push(s2.t); TR.depth.push((s2.x - geo().c0) * 1e3); TR.err.push(Math.abs(L2.err) * 1e3);
        while (TR.t.length && TR.t[0] < s2.t - TR.span) { TR.t.shift(); TR.depth.shift(); TR.err.shift(); }
      }
    }
  }
  function reset2(theta = PITCH / 2) {
    s2 = newState(); L2 = newLock(); L2.theta = theta; L2.mu = +st.mu; L2.omega = st.omega; L2.torque = st.torque;
    TR.t.length = TR.depth.length = TR.err.length = 0; trNext = 0; st.events = []; lastKey2 = "";
  }
  const rpm = (w) => (w * 60) / (Math.PI * 2);
  const WORD = { pin: { part: "pin", slot: "hole", face: "the face between holes", load: "pin and ring carry the torque in shear" }, dog: { part: "collar", slot: "tooth gap", face: "tooth tips (tooth-on-tooth)", load: "dog teeth carry the torque on their flanks" } };
  function state2() {
    const g = geo(), w = WORD[st.mech];
    if (L2.inHole && L2.locked && L2.shear > 0 && !s2.on && s2.x > g.c0) return ["bad", `Trapped: friction μ·F on the ${w.part} exceeds the spring force; relieve the torque to release`];
    if (L2.inHole && L2.locked && L2.shear > 0) return ["ok", `Locked: the ${w.load}; the solenoid only holds the ${w.part} in place`];
    if (L2.inHole && s2.x >= q2.xMax - 1e-7) return ["ok", `${w.part[0].toUpperCase() + w.part.slice(1)} fully engaged`];
    if (L2.inHole && s2.on) return ["move", `Engaging: ${w.part} entering the ${w.slot}`];
    if (L2.inHole) return ["move", "Withdrawing"];
    if (L2.blocked && s2.on) return ["bad", `Blocked: ${w.part} on ${w.face}, waiting for a ${w.slot}`];
    if (s2.on && !actuation(q2).ok && s2.i > 0.95 * steadyCurrent(q2)) return ["bad", `Insufficient electromagnetic force: the ${w.part} does not move`];
    if (s2.on && s2.stuck) return ["bad", "Stuck: friction holds the plunger"];
    if (s2.on && s2.x < g.c0) return ["rise", `Energized: current rising, ${w.part} moving toward the ring`];
    if (!s2.on && s2.i > 1e-4) return ["rise", "De-energized: current decaying"];
    return ["rest", `Disengaged: spring holds the ${w.part} clear of the ring`];
  }
  const R2 = Object.fromEntries([...document.querySelectorAll("[data-r2]")].map((e) => [e.dataset.r2, e]));
  let said2 = "";
  function readouts2() {
    const [kind, text] = state2();
    if (text !== said2) { said2 = text; const el = document.querySelector(".status2"); el.dataset.status = kind; el.querySelector("span:last-child").textContent = text; stage2.querySelector(".sol-phase").textContent = text.split(":")[0]; }
    const set = (k2, v) => { if (R2[k2] && R2[k2].textContent !== v) R2[k2].textContent = v; };
    const depth = (s2.x - geo().c0) * 1e3;
    set("pin", (s2.x * 1e3).toFixed(2) + " mm"); set("depth", depth > 0 ? depth.toFixed(2) + " mm in" : (-depth).toFixed(2) + " mm clear");
    set("err", (Math.abs(L2.err) * 1e3).toFixed(2) + " mm"); set("ring", (L2.locked || (L2.inHole && Math.abs(L2.err) >= geo().clear - 1e-9) ? 0 : rpm(L2.omega)).toFixed(0) + " rpm");
    set("shear", (L2.shear / 1000).toFixed(2) + " kN"); set("fric", (L2.mu * L2.shear).toFixed(0) + " N"); set("spring", (q2.Fpre + q2.k * s2.x).toFixed(1) + " N"); set("i", s2.i.toFixed(2) + " A");
    const ro = (s2.on ? "ON" : "OFF") + " · " + WORD[st.mech].part + " " + (s2.x * 1e3).toFixed(2) + " mm · offset " + (Math.abs(L2.err) * 1e3).toFixed(1) + " mm";
    const rd = plate2.querySelector("[data-readout]");
    if (rd.textContent !== ro) rd.textContent = ro;
    svg2.toggleAttribute("data-torque", L2.locked && L2.shear > 0);
    const b = document.querySelector('[data-act2="energize"]');
    b.setAttribute("aria-pressed", s2.on ? "true" : "false"); b.querySelector(".lbl").textContent = s2.on ? "De-energize lock" : "Energize lock";
  }
  const plot2 = document.querySelector(".plot2");
  function drawPlot2() {
    const L0 = 46, R0 = 408, T0 = 12, B0 = 150;
    const t0 = TR.t[0] || 0, span = TR.span * 1e3;
    const X = (t) => L0 + (((t - t0) * 1e3) / span) * (R0 - L0);
    const lo = -1.6, hi = 9;
    const Y = (v) => B0 - ((clamp(v, lo, hi) - lo) / (hi - lo)) * (B0 - T0);
    let h = `<rect class="pbg" x="${L0}" y="${T0}" width="${R0 - L0}" height="${B0 - T0}"/>`;
    for (const v of [0, 2, 4, 6, 8]) h += `<line class="pgrid" x1="${L0}" x2="${R0}" y1="${Y(v)}" y2="${Y(v)}"/><text class="ptick" x="${L0 - 6}" y="${Y(v) + 3.5}" text-anchor="end">${v}</text>`;
    for (let t = 0; t <= span + 1e-6; t += 100) h += `<line class="pgrid" x1="${L0 + (t / span) * (R0 - L0)}" x2="${L0 + (t / span) * (R0 - L0)}" y1="${T0}" y2="${B0}"/><text class="ptick" x="${L0 + (t / span) * (R0 - L0)}" y="${B0 + 13}" text-anchor="middle">${t}</text>`;
    const capY = geo().capture * 1e3;
    h += `<line class="ph pref" x1="${L0}" x2="${R0}" y1="${Y(capY)}" y2="${Y(capY)}"/><text class="plab" x="${R0 - 4}" y="${Y(capY) - 4}" text-anchor="end">capture window ${capY.toFixed(1)} mm</text>`;
    h += `<line class="ph pzero" x1="${L0}" x2="${R0}" y1="${Y(0)}" y2="${Y(0)}"/><text class="plab" x="${L0 + 4}" y="${Y(0) + 11}">ring face</text>`;
    const line = (arr, cls) => arr.length > 1 ? `<path class="pline ${cls}" d="${arr.map((v, n) => (n ? "L" : "M") + X(TR.t[n]).toFixed(1) + " " + Y(v).toFixed(1)).join("")}"/>` : "";
    h += line(TR.err, "s-f") + line(TR.depth, "s-x");
    h += `<line class="paxis" x1="${L0}" x2="${R0}" y1="${B0}" y2="${B0}"/><line class="paxis" x1="${L0}" x2="${L0}" y1="${T0}" y2="${B0}"/>`;
    h += `<text class="pxl" x="${(L0 + R0) / 2}" y="${B0 + 28}" text-anchor="middle">time (ms)</text><text class="pyl" transform="translate(12 ${(T0 + B0) / 2}) rotate(-90)" text-anchor="middle">mm</text>`;
    plot2.innerHTML = h;
  }

  // ---------- controls and scenarios ----------
  st.omega = 0; st.torque = 0; st.mu = 0.12;
  const sync = () => {
    for (const el of document.querySelectorAll("[data-p2]")) {
      const k2 = el.dataset.p2;
      const v = k2 === "rpm" ? rpm(st.omega) : k2 === "torque" ? st.torque : k2 === "mu" ? st.mu : st.raw.V;
      el.value = String(+v.toFixed(2));
      const o = document.querySelector(`[data-v2="${k2}"]`);
      if (o) o.textContent = k2 === "rpm" ? v.toFixed(0) + " rpm" : k2 === "torque" ? v.toFixed(0) + " N·m" : k2 === "mu" ? v.toFixed(2) : v.toFixed(1) + " V";
    }
  };
  document.querySelectorAll("[data-p2]").forEach((el) => el.addEventListener("input", () => {
    const k2 = el.dataset.p2, v = +el.value;
    if (k2 === "rpm") { st.omega = (v * Math.PI * 2) / 60; L2.omega = st.omega; }
    if (k2 === "torque") { st.torque = v; L2.torque = v; }
    if (k2 === "mu") { st.mu = v; L2.mu = v; }
    if (k2 === "V") { st.raw.V = v; q2 = resolve(st.raw, st.fault); }
    sync();
  }));
  const at = (dt, fn) => st.events.push({ at: s2.t + dt, fn });
  const SCEN = {
    aligned: { t: "Aligned: engage", d: "A hole sits under the pin and the ring is still. Energize: the pin pushes in. Then the drive torque comes on and the ring tries to turn: the pin takes it in shear and the ring stops. The solenoid itself carries none of that torque; it only holds the pin in place.", go: () => { st.fault = "none"; st.raw.V = 12; st.omega = 0; st.torque = 0; q2 = resolve(st.raw, st.fault); reset2(0); at(0.02, () => { s2.on = true; }); at(0.12, () => { L2.torque = st.torque = 250; L2.omega = st.omega = 2.5; sync(); }); } },
    misaligned: { t: "Misaligned: blocked, then engages", d: "The ring is turning (the wheels are slipping at different speeds) and the pin lands on the face between two holes. It can't go in: it rubs, pressed by the magnetic force minus the spring. When the next hole comes round within the chamfer's capture window, the pin drops in and the ring locks. No amount of current can push it through solid metal.", go: () => { st.fault = "none"; st.raw.V = 12; st.omega = 2.5; st.torque = 250; q2 = resolve(st.raw, st.fault); reset2(pitchOf() * 0.42); at(0.02, () => { s2.on = true; }); } },
    trapped: { t: "Release under torque: trapped", d: "With torque on the ring, the pin is clamped sideways by thousands of newtons. Its axial friction, μ·F_shear, dwarfs the few newtons of return spring, so switching off does nothing: the pin stays in. This is why lockers usually need the torque relieved, by easing off or turning the wheel slightly, before they disengage.", go: () => { if (!(L2.inHole && L2.shear > 0)) { st.fault = "none"; st.raw.V = 12; st.omega = 2.5; st.torque = 250; q2 = resolve(st.raw, st.fault); reset2(0); s2.on = true; advance2(0.12); } at(0.03, () => { s2.on = false; }); } },
    relieve: { t: "Relieve torque: release", d: "Drop the drive torque to zero. The shear force and its friction vanish, the spring pulls the pin out, and the ring is free to turn again.", go: () => { if (!(L2.inHole && L2.shear > 0) || s2.on) { st.fault = "none"; st.raw.V = 12; st.omega = 2.5; st.torque = 250; q2 = resolve(st.raw, st.fault); reset2(0); s2.on = true; advance2(0.12); s2.on = false; advance2(0.06); } at(0.03, () => { L2.torque = st.torque = 0; sync(); }); } },
    lowV: { t: "Low voltage: no engagement", d: "At 6.5 V the coil current and the force (about the square of the current) fall below what the spring preload and friction need at the open gap. The pin never moves, even with a hole perfectly aligned. A locker that works on the bench but not with a tired battery is this case.", go: () => { st.fault = "none"; st.raw.V = 6.5; st.omega = 0; st.torque = 0; q2 = resolve(st.raw, st.fault); reset2(0); at(0.02, () => { s2.on = true; }); } },
    dirty: { t: "Contaminated pin bore", d: "Grit or corrosion in the bore raises static friction to 7 N. The available force can't break it free, so the pin stays out and the lock never engages, though the coil draws its full current. The current trace shows no motion dip.", go: () => { st.fault = "sticky"; st.raw.V = 12; st.omega = 0; st.torque = 0; q2 = resolve(st.raw, st.fault); reset2(0); at(0.02, () => { s2.on = true; }); } },
  };
  const scWrap = document.querySelector(".scen");
  scWrap.innerHTML = Object.entries(SCEN).map(([k2, v]) => `<button type="button" data-scen="${k2}">${v.t}</button>`).join("");
  const scText = document.querySelector(".scen-text");
  document.querySelectorAll("[data-scen]").forEach((b) => b.addEventListener("click", () => {
    document.querySelectorAll("[data-scen]").forEach((x) => x.setAttribute("aria-pressed", x === b ? "true" : "false"));
    SCEN[b.dataset.scen].go(); sync(); scText.innerHTML = `<p>${SCEN[b.dataset.scen].d}</p>`; st.playing = true;
  }));
  document.querySelector('[data-act2="energize"]').addEventListener("click", () => { st.events = []; s2.on = !s2.on; });
  document.querySelector('[data-act2="reset"]').addEventListener("click", () => { st.fault = "none"; st.raw = { ...BASE }; q2 = resolve(st.raw, st.fault); st.omega = 0; st.torque = 0; reset2(pitchOf() / 2); sync(); });
  function setMech(m) {
    st.mech = m;
    svg2.dataset.mech = m;
    document.querySelectorAll("[data-mech-btn]").forEach((b) => b.setAttribute("aria-pressed", b.dataset.mechBtn === m ? "true" : "false"));
    document.querySelectorAll("[data-l2]").forEach((e) => { e.textContent = e.dataset[m === "dog" ? "dog" : "pin"]; });
    lastKey2 = ""; said2 = "";
    const cur = document.querySelector('[data-scen][aria-pressed="true"]');
    (cur ? SCEN[cur.dataset.scen] : SCEN.misaligned).go(); sync();
  }
  document.querySelectorAll("[data-mech-btn]").forEach((b) => b.addEventListener("click", () => setMech(b.dataset.mechBtn)));
  const sp2 = document.querySelector('[data-act2="speed"]');
  sp2.addEventListener("change", () => { st.speed = +sp2.value; });

  // ---------- loop ----------
  new IntersectionObserver((e) => { st.visible = e[e.length - 1].isIntersecting; }, { rootMargin: "100px 0px" }).observe(stage2);
  let last2 = 0, plotT = 0;
  function frame2(now) {
    const real = last2 ? Math.min(0.05, (now - last2) / 1000) : 0;
    last2 = now;
    if (st.visible || real === 0) {
      if (st.playing && !reduce.matches && real > 0) advance2(real * st.speed);
      draw2();
      readouts2();
      plotT -= real;
      if (plotT <= 0) { plotT = 0.08; drawPlot2(); }
    }
    requestAnimationFrame(frame2);
  }
  sync();
  reset2(pitchOf() / 2);
  if (reduce.matches) { SCEN.misaligned.go(); advance2(0.4); }
  else SCEN.misaligned.go();
  document.querySelector('[data-scen="misaligned"]').setAttribute("aria-pressed", "true");
  scText.innerHTML = `<p>${SCEN.misaligned.d}</p>`;
  window.__lock = { SCEN, advance2, get s() { return s2; }, get L() { return L2; }, st };
  requestAnimationFrame(frame2);
})();
