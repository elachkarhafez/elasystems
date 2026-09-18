# Visual QA Log — ElaSystems v2 "Route 313"

> One entry per capture → critique round (visual-critic skill). Scores from rendered captures only,
> using `~/creative-web-os/core/design-rubric.md`. Newest round on top.

## Round 2 — 2026-09-18 — full build — captures: `.creative-web/qa/2026-09-18-15-34-14-final-full` (7 viewports × 11 stops, fwd + rev, reduced motion), `…-15-38-59-final-recheck`, per-world holds `full-probe3`, `full-probe3m`, `transitions1`, `static-*.png`, `grayscale-worlds.png`
Stage: final. Score: **84/100** (brand 14/15, composition 10/12, type 8/10, assets 9/12, motion 10/12, interaction 6/8,
tech 7/8, mobile 7/8, perf 4/6, a11y/seo 4/4, conversion 5/5) → strong production quality.
Forward/reverse coherent: yes. Composition is identical at every stop. The remaining pixel diff (≤ 11/255) is the ambient
layer only (the client's site scrolling inside its window, trail pulses, EN↔AR swap). Reduced motion: designed static
layout with world-rendered posters. Console/page errors: 0. HTTP errors: 0. Horizontal overflow: none (fixed at 360).
Mode 4: no-webpage-feel PASS (one camera, one road, no resets; turns, brakes and the crane are the transitions); worlds
distinct in grayscale PASS (silhouette + light layout differ for all 7); commerce handoff PASS (your storefront → CTA →
services → contact); anti-generic static scan: 0 flags.

Fixed since round 1: hero storefront framing (it now sits right of the copy under its own streetlight, traffic reflected
in its glass); every stop camera re-framed with the slice formula (3/4 view, 14–26 m back); physical light units (spill
×14–22); pop-up string lights and board orientation; mall blow-out; aerial route line + beacons; lens shift for
desktop/mobile composition; halos never a disc near the camera; route strip moved bottom-left; solid nav over the DOM
sections; CLS 1.0 → 0; chunked boot + async shader compile; three.js tree-shaken bundle; phones boot on first interaction.

Remaining (next highest leverage):
1. [all @ drive segments] The drives between stops look alike (road, lights, trails). Add one landmark per road
   (a bus shelter, a closed shop's shutter, a parked-car silhouette) (+1 composition).
2. [1440 @ mall] Plinth light still reads as a white hotspot → reduce the uplight to 1.2 and keep only the floor reflection (+1 assets).
3. [mobile Lighthouse] 71 on an uncompressed local server; re-measure on GitHub Pages (gzip) and verify LCP ≤ 2.5 s.
4. Replace the reconstructed ES vector with the original artwork when available.

## Round 1 — 2026-09-18 — vertical slice — captures: `.creative-web/qa/2026-09-18-11-15-51-slice-r1-desktop`, `…-11-16-23-slice-r1-mobile`
Stage: vertical slice (entry → system → bakery), `?slice=bakery`. Stops = storyboard labels (tools/stops.mjs).
Score: **72/100** (brand 13/15, composition 8/12, type 7/10, assets 8/12, motion 8/12, interaction 5/8, tech 6/8,
mobile 6/8, perf 4/6, a11y/seo 3/4, conversion 4/5)
Forward/reverse coherent: yes. Composition is identical per stop; mean pixel diff 0.5–7/255 comes only from the
time-based ambient layer (trail pulses, window pan, EN↔AR swap). Reduced motion: layout OK, **posters missing**.
Console errors: only the 404s for posters not yet rendered.

What works (keep): the owner's line over a night road; traffic streaming *between* the viewer and the dark storefront;
the bakery switching on (brick lit by its own window light, awning, the real site swapping EN↔AR in the window, sign in
Bebas Neue); wet-road reflections; lens-shifted mobile framing (storefront above the copy).

Top fixes (highest leverage first):
1. [1440×900 @ entry] The dark storefront is cropped by the right edge and reads as a black box → hero face 0.66 → 0.5,
   d −13 → −17; move the lamp to the curb in front of it (local 1.0, 5.8, 5.2); add traffic light sweeping across its
   dark glass (the traffic it never catches) (+3 composition, +1 brand).
2. [390×844 @ all] Lamp halos read as flat brown disks on LOW tier (no bloom) → exponential radial falloff, halo scale
   1.1 → 2.2, opacity 0.5 → 0.3 (+1 assets, +1 mobile).
3. [1440×900 @ bakery.hold] Brick reads toy-like: uniform brick values → per-brick value jitter ±12%, soot gradient
   darker toward the cornice (+1 assets).
4. [all @ reduced motion] No posters → render per-scene posters from the world after the full build (hard gate).

Hard-gate failures: reduced-motion posters missing (tracked; resolved in the full build).
Decision: the slice's visual language holds (light-led night world, real sites, owner's line). **Proceed to the
full build** after fixes 1–3.
