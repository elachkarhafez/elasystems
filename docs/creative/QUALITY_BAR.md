# Quality Bar — ElaSystems v2 "Route 313"

> What "done" means for THIS project. PASS / FAIL / NOT MEASURED — never PASS unchecked.
> Standards: `~/creative-web-os/core/quality-gates.md`; scoring: `design-rubric.md` (< 72 = not premium final).

## Project-specific definition of done

- Every client world shows the client's REAL site in its window, the sign in the client's real typeface, the real published address. **PASS**
- Storefronts are labeled as illustrated on the page (collection note + footer). **PASS**
- "Book a Call" (`sms:+13133006898`) is reachable at every scroll position (nav) + hero + finale + contact. **PASS**
- The hero storefront is readable on 1440×900 and 390×844 without overlapping the copy. **PASS** (lens shift)
- Reverse scroll: identical composition at every stop. **PASS**
- Worlds distinguishable in grayscale. **PASS** (`.creative-web/qa/grayscale-worlds.png`)
- No horizontal overflow at 360 px. **PASS**
- Reduced motion / no WebGL: complete, designed, poster-led. **PASS**

## Hard gates

| Gate | Status | Evidence |
|---|---|---|
| Brand specificity (85% brand-swap test) | PASS | the owner's traffic/system line, the logo's speed stripes as traffic, real client roads/sites/fonts, the 313 number. Swapping the brand keeps ~0% |
| Visual QA performed (fwd + rev) | PASS | `.creative-web/qa/2026-09-18-15-34-14-final-full` + recheck; VISUAL_QA.md rounds 1–2 |
| Vertical slice validated | PASS | Round 1 (72) → fixes → proceed decision |
| Asset honesty | PASS | ASSET_PLAN.md: sites real, architecture illustrated + labeled, ES mark marked as a reconstruction |
| Conversion paths | PASS | sms/tel/mailto links preserved; 7 live-site links; keyboard walkthrough drives to each stop |
| Accessibility floor + reduced motion | PASS | Lighthouse a11y 100 (mobile + desktop); semantic content; static mode |
| Build, console, overflow, functionality | PASS | `node tools/build.mjs` OK; 0 console/page/HTTP errors across 125 captures; no overflow |
| Mode 4: no-webpage-feel | PASS | continuous camera/road; transitions are driving, braking, turning, crane |

## Latest score

**84 / 100** (VISUAL_QA.md Round 2)

## Budgets & measurements (local server, 2026-09-18)

| Metric | Budget | Measured | Tool |
|---|---|---|---|
| LCP (desktop) | ≤ 2.5 s | 1.1 s | Lighthouse 12 desktop |
| LCP (mobile) | ≤ 2.5 s | 5.5 s simulated (slow 4G, 4× CPU, **uncompressed local server**); real first paint 0.6 s at 4× throttle | Lighthouse 12 / tools/profile-boot.mjs. Re-measure on GitHub Pages |
| CLS | ≤ 0.1 | 0 (mobile + desktop) | Lighthouse |
| TBT | ≤ 200 ms | mobile 0 ms (world boots on interaction); desktop 290 ms | Lighthouse |
| Initial JS | ≤ 300 KB gz | ~170 KB gz (app 21 KB + three chunk 143 KB + small chunks) | build output |
| 3D payload desktop / mobile | ≤ 6 / 3 MB | textures 0.5 MB (desktop 1024 w) / 0.2 MB (mobile 512 w); geometry procedural | assets/work |
| Page weight | — | desktop 1.30 MB, mobile 0.80 MB (uncompressed) | Lighthouse |
| Frame rate | 60 fps desktop | NOT MEASURED on other hardware (this dev GPU: 120 fps in the debug overlay) | ?debugExperience=1 |
| Draw calls | ≤ 150 / 80 | ~170–270 desktop HIGH (the Reflector renders the scene twice); ~120 LOW | debug overlay |
| Lighthouse (local) | — | desktop 86 / 100 / 100 / 100 · mobile 71 / 100 / 100 / 100 | 2026-09-18 |
| **Lighthouse (LIVE elasystems.com, gzip)** | — | mobile **80** / 100 / 79 / 100 (LCP 3.9 s sim., TBT 10 ms, CLS 0, 328 KB) · desktop **81** / 100 / 79 / 100 (LCP 0.7 s). Best-practices 79 = no HTTPS (owner: enable in GitHub Pages) + source maps (added after this run) | 2026-09-18 |
