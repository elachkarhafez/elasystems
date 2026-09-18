# Lessons — ElaSystems

> Written with the `post-project-learning` skill. Every lesson is tagged PROJECT-SPECIFIC or GLOBAL-CANDIDATE.
> Global candidates contain no client facts and may become Creative Web OS updates after the safe
> self-improvement procedure (not applied this session: they need the owner's go-ahead).

## 2026-09-18 — v2 "Route 313" (Mode 4)

- **GLOBAL-CANDIDATE: Lens shift beats camera tilt for DOM/WebGL composition.** When copy occupies one side (desktop) or the
  bottom (mobile), `camera.setViewOffset` moves the subject out from under the copy without keystoning. It fixed the hero
  and every stop on phones at once. → camera-director / mobile-cinematography-director.
- **GLOBAL-CANDIDATE: three.js ≥ r155 lights are in physical units.** Point lights tuned "by feel" came out ~20× too dark;
  budget in candela from the start. → product-lighting-director.
- **GLOBAL-CANDIDATE: IntersectionObserver never fires for a fully clip-path-hidden element (Chrome).** Observe the parent
  for clip-path reveals. (Seen in v1 and relevant to any slash/mask reveal.) → motion-language-director.
- **GLOBAL-CANDIDATE: Absolutely positioned scroll-scene wrappers cause CLS ≈ 1 before JS positions them.** Keep non-hero
  scenes `visibility: hidden` until laid out. → scroll-choreographer / performance-director.
- **GLOBAL-CANDIDATE: Render posters from the world itself.** The same stills serve as the LCP image, the reduced-motion /
  no-WebGL experience and the OG image, and they always match the art direction. → cinematic-qa / performance-director.
- **GLOBAL-CANDIDATE: Boot heavy worlds on first interaction on phones** when the poster equals the first frame (mobile TBT
  1060 → 0 ms). → performance-director.
- **GLOBAL-CANDIDATE: Precompute arc-length lookup tables** for any path sampled thousands of times (city/trail/marking
  builders); canvas-texture "wear" should be one pattern fill, not thousands of draw calls.
- **GLOBAL-CANDIDATE: creative-web-qa percent stops don't map to scroll-story scenes.** A small script that converts
  storyboard labels to stops (`tools/stops.mjs`) made QA frames land on real beats.
- **PROJECT-SPECIFIC:** the strongest concept came from the owner's own copy ("traffic problem / system problem") plus the logo's
  speed stripes, not from the portfolio alone. Read the original site's copy before concepting.
- **PROJECT-SPECIFIC:** hero viewpoint from across the street (traffic between the viewer and the business) was the move that
  made the thesis legible; the first two viewpoints failed.
