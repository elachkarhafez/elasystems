# ElaSystems — Agent Guide

Concise cross-agent map for this repository (read by Codex directly and by Claude Code via `@AGENTS.md`
in CLAUDE.md). Keep it to 50–120 useful lines.

## Project

- ElaSystems (elasystems.com): Detroit studio for websites, apps, custom business software, automation and
  advertising. Static HTML/CSS/JS, **no build step, no npm dependencies**. GitHub Pages from `main`
  (repo `elachkarhafez/elasystems`, custom domain in `CNAME`). Pushing `main` changes the live site.
- Current design: **V Max "TRAFFIC → SYSTEM"** (2026-09-25). Brief, decision, critic rounds and tools live in the
  main checkout's `.creative-web-os/vmax/` (not in git). `docs/creative/` is the superseded v2 "Route 313" record.

## Concept

The owner's line "Most businesses don't have a traffic problem. They have a system problem." Long-exposure night
traffic (Canvas2D light, real road logic) straightens into the three gold bars of the ES mark; a real client site
sits where the S is; then a pinned viewer shows each real client site large, browsed inside the frame, arriving
and leaving as a bar of light in the client's own colour. No city, no storefronts, no 3D.

## Commands

- Serve: `python -m http.server 3021 --bind 127.0.0.1` → http://127.0.0.1:3021/
- Captures: `node <main>/.creative-web-os/vmax/tools/shots.mjs <label> <w> <h> "h:0,h:.5,w:.14,s:#contact"`
  (`h:` hero progress, `w:` work progress, one project ≈ .143; `--reduced`). Keyboard walk: `tools/keys.mjs`.
  Weight: `tools/weight.mjs`. Frame times: `tools/frames.mjs`. Share image: `tools/og.mjs`.
- Review at real browser heights too (1366x657, 1280x689, 1180x640), not only full-screen sizes.

## Important business rules

- Primary CTA is SMS `sms:+13133006898`, labelled "Text 313-300-6898" / "Text us" (never "Book a Call" on an sms:
  link). Also `tel:+13133006898` and `mailto:elasystemdesign@gmail.com`. Never remove.
- Portfolio = "Some of our work": names, screenshots and links only. No counts, "01 / 07" cues, locations,
  feature claims, ratings, results or testimonials. Captions: name + "Visit <domain>".
- No unsourced numbers or claims. Never use images from `DESIGNS/`. Creative Style's default carousel slide shows
  minors: its frame uses the adult slide.
- `CNAME` stays at the root; `/ElaSystems.html` redirects to `/`.

## Architecture

- `index.html`: all content, semantic. Inline SVG symbol `#es` (the mark). JSON-LD ProfessionalService.
- Mode classes set in `<head>` before paint: `is-cine` (≥1180×640, motion allowed: pinned, scrubbed stages),
  otherwise flowing (phones, 900–1179 split + 2-col grid), `is-calm` (reduced motion / `?static`).
- `assets/css/vmax.css`: tokens at `:root`; slant `--slant` (.545, the mark's slash) cuts buttons and bars.
- `assets/js/scroll.js`: the only scroll source (`track(el, update, {sticky})`, rAF-batched, cached measures).
- `assets/js/vmax.js`: director. Every scrubbed value is a pure function of progress (reverse scroll exact).
  Hero: `heroUpdate(p)` (copy out → traffic morph + frame to the E·slash·S lockup → frame to the work rect).
  Work: `workUpdate(p)` (per project: bar enters → opens → browse (`--iy`) → closes → streaks off).
- `assets/js/traffic.js`: Canvas2D traffic → E bars (`morph` 0..1). Runs only while the hero is on screen.
- Work images: `assets/work/v/{slug}-{d|dt|m|mt}-{w}.webp` (+ `manifest.json`). Tall captures load only when
  their project is next. Add a client = one `li.proj` (with `--key` colour) + its four exports.
