# ElaSystems — Agent Guide

Concise cross-agent map for this repository (read by Codex directly and by Claude Code via `@AGENTS.md`
in CLAUDE.md). Keep it to 50–120 useful lines; detail lives in `docs/`.

## Project

- ElaSystems (elasystems.com): Detroit studio for websites, apps and advertising. Facts: `docs/creative/BRAND.md`.
- v2 "Route 313" (Mode 4): one persistent three.js night-drive world. Static site, **GitHub Pages from `main`**
  (`CNAME`). Pushing `main` changes the live site.

## Commands

- Serve: `python -m http.server 3002 --bind 127.0.0.1` (`.claude/launch.json` → `elasystems-v2`)
- Build setup (once): `npm install --prefix tools/.build three@0.186.0 esbuild@0.25.10`
- **Build (after any edit in `assets/js/world/`)**: `node tools/build.mjs` → `assets/js/dist/` (committed; the page loads `dist/app.js`)
- QA: `creative-web-qa --url http://127.0.0.1:3002/ --preset full`; label stops: `node tools/stops.mjs "" 1440x900 390x844`
- Probe frames by scene: `node tools/probe.mjs "?debugExperience=1" 1440 900 <label> "0,hold:bakery,mid:collection"`
- Posters (after visual changes): `node tools/render-posters.mjs` then convert `.creative-web/posters-raw/*.png` → `assets/posters/*.webp`
- OG image: `node tools/render-og.mjs` (then PNG → `assets/brand/og.jpg`)
- Boot profile: `node tools/profile-boot.mjs 390 844 4` · slice mode: `?slice=bakery` · debug overlay: `?debugExperience=1` · force static: `?static`

## Important business rules

- "Book a Call" = `sms:+13133006898` (nav + hero + finale + contact); also `tel:` and `mailto:elasystemdesign@gmail.com`.
- Worlds = real clients only, on their published roads; the storefronts must stay labeled as illustrated.
- No unsourced numbers or claims. Never use images from `DESIGNS/`.
- `CNAME` stays at the root; `/ElaSystems.html` redirects to `/`.

## Architecture notes

- `assets/js/world/`: `worlds.js` (ProductWorld records) → `timeline.js` (pure `pose(p)`) → `main.js` (renderer, tiers,
  loop) · `route.js` (roads + lookup table) · `city.js` · `storefronts.js` (one builder per architecture type) ·
  `trails.js` · `post.js` · `dom.js` (scene wrappers, route strip). Adding a client = a `WORLDS` record + an `<article>`
  scene in `index.html` + textures in `assets/work/` + posters.
- Static fallback (`html.is-static`) = reduced motion / no WebGL / `?static`: stacked posters + the same DOM.

## Creative Web OS

This repository uses the global Creative Web OS v2.0.0 (`~/creative-web-os`).
Experience mode: Mode 4 — Immersive Product World.

**Start every session with `docs/creative/HANDOFF.md`** (shared state between Claude Code and Codex),
then as relevant:

| File (docs/creative/) | Holds |
|---|---|
| `BRAND.md` | verified business facts vs design inference, assets, provenance |
| `DESIGN_DNA.md` | persistent visual memory — read, don't reinvent |
| `CREATIVE_BRIEF.md` | the design contract (thesis, mode, hero, narrative) |
| `CONCEPTS.md` / `REFERENCES.md` | concept tournament / reference matrix |
| `WORLD_BIBLE.md` / `STORYBOARD.md` | Mode 4 worlds / scene-by-scene direction |
| `EXPERIENCE_ARCHITECTURE.md` / `MOTION_LANGUAGE.md` | technical strategy / motion tokens |
| `ASSET_PLAN.md` | medium per visual, missing assets, demo vs production |
| `QUALITY_BAR.md` / `VISUAL_QA.md` | definition of done / QA rounds + scores |
| `DECISIONS.md` / `LESSONS.md` | decisions not to undo casually / lessons |

- Use the global creative-web skills; start with `creative-web-orchestrator` for substantial work.
- Project facts override generic global examples. Do not invent business information.
- Preserve existing working functionality; check git status before major changes.
- Run visual QA (`creative-web-qa --url <dev-url>`) and critique rendered output before calling visual work done.
- Update `HANDOFF.md` at the end of each working session.
<!-- CREATIVE-WEB-OS:END -->
