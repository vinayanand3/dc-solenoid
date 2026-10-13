# Inside a Solenoid: From Electricity to Mechanical Motion

**Live:** [the full page](https://vinayanand3.github.io/dc-solenoid/) · [the electrical view (gallery figure)](https://vinayanand3.github.io/dc-solenoid/electrical.html)

An interactive engineering figure made with the [Anatomy](https://github.com/wheresryan22/anatomy) skill. A spring-return DC pull solenoid on a test bench, drawn as an isometric half-section in colour, with one physical model behind every motion, number and plot. Fig 2 shows the same solenoid in push form driving a locking pin into a lock ring (a stand-in for a differential lock).

## Build

Needs Node.js 20.10 or newer. No packages to install.

```sh
node build.mjs              # writes solenoid.html (the full page) and electrical.html (the gallery figure: electrical view only)
node build.mjs --gallery    # writes electrical.html only
cp solenoid.html index.html # the page GitHub Pages serves
node build.mjs --artifact   # also writes artifact.html (the same page without its own document skeleton)
node test-model.mjs         # physics QA checks; exits non-zero on any failure
```

Headless checks (optional, need Chrome or Chromium; set `CHROME_PATH`):

```sh
node scripts/capture.mjs solenoid.html --out shot.png
node scripts/lines.mjs solenoid.html --out lines.png    # every drawn line must end on something
```

## Files

| File | What it is |
|---|---|
| `model.mjs` | The physics: lumped magnetic circuit, flux-linkage electrical model, flyback paths, PWM, spring/load/friction dynamics with hard stops, energy ledger, faults, and the Fig 2 pin-and-hole contact. Pure functions, inlined into the page. |
| `parts.mjs` | Geometry of the moving parts (plunger, spring, clevis, stop screw, ribbon), shared by the build and the page. |
| `build.mjs` | Fig 1 geometry (bench, supply, driver board, bracket, solenoid whole and cut, exploded layout, flux paths, camera presets) and page assembly. |
| `fig2.mjs` | Fig 2 geometry: gear motor, pillow blocks, lock ring, mounting plate, push-type solenoid, harness. |
| `live.js`, `live2.js` | Page runtime for Fig 1 and Fig 2: simulation clock, controls, plots, schematic, tooltips, learning steps. |
| `page.html`, `fig2.html`, `style.css` | Page text, layout and the colour materials (each material redefines the kit's tone tokens). |
| `page-electrical.html` | Layout of the gallery figure: the electrical view with the see-through can, drive controls, schematic and current plot. |
| `test-model.mjs` | QA: motion direction, spring return, zero current at rest, stop never passed, force trends, saturation cap, insufficient-force case, flyback comparison, every fault, rapid switching, extreme sliders, Fig 2 blocked/engaged/trapped/released, energy balance. |
| `kit/`, `scripts/` | The Anatomy kit and check scripts, copied from the skill (MIT). |

## The model, in brief

- **Electrical (exact principle).** `V = R·i + dλ/dt`, integrated on flux linkage λ with implicit Euler at 5 µs. Current comes from the magnetic circuit, so inductance that changes with the gap, the motional back-EMF dip and saturation all fall out without a separate L.
- **Magnetic circuit (idealized).** `N·i = B·(g + g_air)/μ0 + ℓ_iron·H_iron(B)`. One uniform working gap, a fixed 0.30 mm parasitic gap, one effective area round the loop, no leakage or fringing. Linear iron by default (`μr = 2500`); optional saturation with `B = Bs·tanh(μ0·μr·H/Bs)`, `Bs = 1.6 T`.
- **Force (idealized).** `F = B²·A/(2μ0)`, which equals `μ0·N²·i²·A/(2·g_eff²)` for linear iron and equals `−∂W/∂g` at constant λ in general.
- **Mechanics.** `m·ẍ = F_mag − (F_pre + k·x) − F_load − friction − c·ẋ`, Coulomb friction (0.4 N static, 0.3 N sliding), `c = 2 N·s/m`, hard stops with restitution 0.2. The plunger seats on a 0.25 mm nonmagnetic stop washer.
- **Drive.** MOSFET low-side switch; flyback by diode (−0.8 V), diode + 33 V clamp, or none (drain avalanches at 60 V). PWM duty is averaged; peak-and-hold applies it only after the plunger seats.
- **Pole face.** Flat, 60° or 45° cone. A cone of half-angle α acts like a flat gap of g·sin²α and gives sin²α of that force (Roters' approximation, valid while the cones overlap): more pull at long stroke, less at the end.
- **Self-heating.** One lumped thermal node, C·dT/dt = i²R − (T − T_amb)/R_th, R_th = 8 K/W, C = 25 J/K, time-lapsed so 1 s is 2 minutes; copper resistance rises 0.39 %/K. The hot-coil demo holds the coil on until it passes the temperature at which pull-in fails, then lets the auto cycle try again.
- **Fig 2.** The pin enters a hole only within a capture window (hole clearance + chamfer, 2.2 mm). Once in, ring torque loads it in shear (`F = T/r`), and its axial friction `μ·F` can trap it until the torque is relieved. A dog-clutch option replaces the pin with a 12-tooth collar on a splined fixed hub, slid by a shift fork; its teeth fill 40 % of the pitch, giving a 2.8 mm capture window.

**Illustrative only, not simulated:** flux lines are schematic paths whose opacity follows the computed B (not FEA); fringing arcs at the gap; current-flow dots on the wires; wire ends in the cut winding are drawn larger than real wire; force arrows use a log length scale; the drawing keeps the Ø16 mm geometry when another pole area is selected; the constant-force drum's inertia and the ring's dynamics are ignored. No numbers are measured data or a real part's specification.

## Gallery

The electrical view is submitted to the [Anatomy community gallery](https://github.com/wheresryan22/anatomy-community) as `figures/vinayanand3/dc-solenoid-electrical` (auto cycle on, playback ×1/95). Its validation passes: schema, safety, deterministic build, still pose under reduced motion, and a clean line check.

License: MIT.
