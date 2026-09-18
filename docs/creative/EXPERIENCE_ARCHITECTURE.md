# Experience Architecture — ElaSystems v2 "Route 313"

## Experience mode & stack

| Layer | Choice | Version | Why |
|---|---|---|---|
| Framework | Static HTML/CSS + native ES modules, **no build step** | — | Hosting is GitHub Pages from `main` (CNAME). Keeps deploy identical to today |
| Scroll | native | — | Camera damping gives the weight. Lenis adds a dependency for no story gain |
| Timeline | custom `ExperienceDirector`: progress → route keys (pure functions) | — | One pinned track, one progress value. GSAP not needed for scrubbed math |
| 3D | **three.js vanilla**, vendored (`assets/vendor/three/`) via an `importmap` | 0.186.0 (pinned) | No React in the project, so R3F would force a build step. Vanilla three keeps the static architecture |
| State | one plain mutable object `exp` (`assets/js/world/state.js`) | — | directors read it every frame |
| Post | three/addons `EffectComposer` + `UnrealBloomPass` + grade `ShaderPass` + `OutputPass` (HIGH/MEDIUM only) | 0.186.0 | emissive storytelling needs bloom on desktop |
| Reflections | three/addons `Reflector` (ground plane, 0.35× res, custom wet-asphalt shader) — HIGH only | 0.186.0 | wet street = the material moment of this world |

## Data flow

```
native scroll → track progress p (0..1) → ExperienceDirector.pose(p)  [pure: route distance, look-blend, lane, FOV, world weights]
   → exp { p, d, camPos, camTarget, fov, worldWeights[], activeWorld, trailSpeed }
   → CameraDirector (damped toward pose + pointer look) · LightDirector (active ±1 worlds) · WorldDirector (switch-on, ambient)
   → TrailDirector (shader time/speed) · DomDirector (panel opacity vars, route strip, hero beats)
   → ONE persistent WebGLRenderer canvas (fixed, behind DOM)
```

## Persistent canvas

`<canvas id="world">` fixed full-viewport under the DOM from first paint to the footer. It isn't remounted. After the
track ends it keeps rendering the commerce frame at 25% brightness (DOM scrim) and pauses when the footer covers it
(IntersectionObserver).

## Master timeline labels (= WORLD_BIBLE)

| Label | Progress (desktop) | Route distance d / stop |
|---|---|---|
| entry | 0.000 | parked at curb, d = 0 |
| system | 0.040 | pull out |
| bakery | 0.085–0.190 | stop @ W Warren z −170 |
| barber | 0.190–0.300 | stop @ Ford Rd x 120 |
| popup | 0.300–0.405 | stop @ Dearborn z −370 |
| cafe | 0.405–0.510 | stop @ Middlebelt x 340 |
| funpark | 0.510–0.610 | stop @ Plymouth z −580 |
| billboard | 0.610–0.700 | I-75 x 560 (moving past, slow-down) |
| mall | 0.700–0.800 | stop @ Monroe z −780 |
| collection | 0.800–0.890 | crane/aerial |
| commerce | 0.890–1.000 | your storefront (z −20) |

Keys live in `assets/js/world/timeline.js` as data. Adding a world = a record in `worlds.js` + a stop key.

## Rendering split

| Element | Real-time | Sequence/video | DOM | Shader |
|---|---|---|---|---|
| Road, buildings, storefronts, props, lights | ✓ (procedural) | | | building windows, wet ground, trails, steam |
| Client websites | ✓ as window textures (real captures) | | ✓ links + text | window pan (UV) |
| Signs / road markings / street blades | ✓ canvas textures (real fonts) | | mirrored in DOM text | |
| Copy, CTAs, services, contact, nav, route strip | | | ✓ | |
| Reduced-motion / no-WebGL posters | | ✓ (stills rendered from the world) | ✓ | |

## Quality profiles

| | HIGH (desktop, capable GPU) | MEDIUM (laptop/tablet) | LOW (phones) | REDUCED MOTION / no WebGL |
|---|---|---|---|---|
| DPR | min(dpr, 1.75) | min(dpr, 1.4) | min(dpr, 1.5), no post | — |
| Reflections | Reflector 0.35× | off (fake streak decals) | off | — |
| Bloom | 0.5× res | 0.5× res, fewer mips | off (additive glow sprites carry the glow) | — |
| Textures | desktop captures 1024w | desktop 768w | phone captures 512w | posters |
| Background buildings | full | full | 60% | — |
| Ambient | all | all | steam/string lights reduced | none |
| Camera | desktop keys | desktop keys | mobile keys (portrait) | none (stacked posters) |

Tier choice: `LOW` if coarse pointer or width < 900. Otherwise HIGH, dropping to MEDIUM when the measured frame time
is > 22 ms over 45 frames (a runtime monitor steps down once, never up).

## Loading strategy

1. Critical: HTML, CSS, Overpass (preloaded), **hero poster** `assets/posters/entry-*.webp` as `<img>` behind the canvas (LCP).
2. `type="module"` app → three (≈ 170 KB gz) → build the procedural world (no network) → load window textures for
   `bakery` + `barber` first, the rest on idle in route order (ImageBitmapLoader).
3. First WebGL frame rendered → poster cross-fades out (400 ms).
4. Client fonts (sign faces) load via the FontFace API before their sign canvases are drawn (sign drawn blank-then-lit if late).

## Fallbacks

- WebGL unavailable / context lost → `html.no-webgl`: canvas hidden, posters + stacked DOM stops, all links present.
- `prefers-reduced-motion: reduce` → same stacked layout with posters (no camera motion).
- No JS → stacked layout with posters (the default HTML state; JS upgrades to the world).

## Debug mode

`?debugExperience=1`: progress, label, route d, camera pos/target/FOV, tier, DPR, FPS, draw calls, triangles,
active world, textures loaded. Never on by default.
