# Decisions — ElaSystems

> Short, dated records of creative and technical decisions so future sessions don't re-litigate them.

| Date | Decision | Why | Alternatives rejected |
|---|---|---|---|
| 2026-09-18 | Initialized Creative Web OS project docs (v2.0.0) | Shared file-based project knowledge for Claude Code + Codex | — |
| 2026-09-18 | v2 is built in an isolated git worktree `.claude/worktrees/redesign-v2` (branch `redesign-v2`) from the original commit 3758f32 | User asked for a completely new redesign stemming from the ORIGINAL site, to compare against v1, and the v1 redesign is uncommitted work in the main checkout | Overwriting the main checkout (would destroy v1); a sibling folder outside the project |
| 2026-09-18 | Concept: A "Route 313" (traffic → system night drive) | Tournament 37 vs 32 vs 30 (CONCEPTS.md); only direction built entirely from verified brand facts | B Exploded Build (fails 85% swap test); C The Thread (asset disqualifier: 7 photoreal interiors) |
| 2026-09-18 | Experience mode: **4 — Immersive Product World** (explicit user instruction). Selector scores: product visual potential 3, personality 4, range 4 (7 client worlds), assets 3, business goal 2 (lead gen), client expectation 5 (a web studio's own site is its capability demo), mobile 3, time 3, performance 3, storytelling 5 | Explicit instruction; a studio site doubles as proof of craft; a real journey exists (traffic → system → your storefront) | Mode 2 (v1 already explores editorial motion); Mode 3 (no single hero product). **Risks recorded:** lead-gen goal needs the CTA reachable at every point; phones need a dedicated composition; procedural architecture must be art-directed through light |
| 2026-09-18 | Vanilla three.js 0.186 (no React), bundled + tree-shaken with esbuild into `assets/js/dist/` (committed); sources in `assets/js/world/` | The static GitHub Pages site stays static; three payload 197 → 143 KB gz | R3F (needs React + a build pipeline); unbundled vendored modules (larger, extra requests) |
| 2026-09-18 | Camera framing uses lens shift (`setViewOffset`) instead of tilt: subject right of the copy on desktop (x −0.10), above the copy on phones (y +0.13) | Keeps verticals straight; one camera rig serves both layouts | Tilting the camera (keystone) |
| 2026-09-18 | Hero viewpoint = the opposite sidewalk, looking across the traffic at the dark storefront | Traffic literally passes *between* you and the business: the owner's line, staged | The sidewalk beside the shop (a black wall) |
| 2026-09-18 | Lights use physical units (PointLight intensity ×14–22 of the nominal world value) | three r155+ physically-correct lighting; nominal values were ~20× too dark | — |
| 2026-09-18 | Phones (LOW tier) boot the world on first interaction or after 4 s idle; desktop after load + idle | The poster (rendered from the world) shows the same first frame; keeps the load window for LCP/CTA (mobile TBT 1060 → 0 ms) | Booting immediately |
| 2026-09-18 | Reversed ES mark (paper S) on dark UI (`es-mark-reversed.svg`) | The navy S disappears on night backgrounds | — |
| 2026-09-18 | **Shipped v2 to production** (elasystems.com via GitHub Pages `main`) at the owner's explicit request ("ship the change to the main site domain elasystems.com") | User instruction | The v1 redesign stays as uncommitted work in the main checkout (not shipped) |
