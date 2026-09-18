# Handoff — ElaSystems

> Shared truth between agents (Claude Code, Codex) and sessions. Update at the end of every working
> session. Read FIRST at the start of every session. Neither agent can invoke the other — this file is the channel.

**Updated:** 2026-09-18 by Claude Code (Opus 5)

## Current state

v2 "Route 313" is built, QA'd and **shipped to production** (elasystems.com, GitHub Pages `main`) at the owner's request.
It was developed on branch `redesign-v2` from the original site (3758f32). The earlier v1 redesign ("Seven Worlds",
editorial) was never shipped; it exists only as uncommitted work in the main checkout.

## Experience mode

Mode 4: Immersive Product World (explicit user instruction). The "products" are the seven client websites. Each world
is one real client on the road it publishes as its address.

## Creative direction

A night drive where traffic streams past dark storefronts until each one switches on with the website ElaSystems built
for it. It stages the owner's line "Most businesses don't have a traffic problem. They have a system problem." →
`CREATIVE_BRIEF.md`, `WORLD_BIBLE.md`.

## Implemented

- One persistent three.js world (`assets/js/world/*`, bundled to `assets/js/dist/` by `node tools/build.mjs`).
- Entry (dark storefront, traffic between you and it), system beat, 7 client worlds (bakery, barber, pop-up, café,
  fun park, billboard, mall), aerial collection, commerce finale (your storefront switches on), then DOM services / why /
  contact.
- Real client captures as window textures (+ Family Bakery's Arabic RTL version swapping in).
- Quality tiers (HIGH with Reflector + bloom; LOW for phones), lens-shift framing, posters for reduced motion / no WebGL,
  route strip (sat-nav) with keyboard/stop jumps.

## Current visual problems

- The drive segments between stops look alike (see VISUAL_QA Round 2, remaining #1).
- The mall plinth uplight reads as a white hotspot (remaining #2).

## Technical issues

- `https://elasystems.com` serves a certificate for the wrong name (GitHub Pages custom-domain cert). Owner action:
  GitHub → repo Settings → Pages → confirm the custom domain, wait for the certificate, tick **Enforce HTTPS**.
- Mobile Lighthouse 71 was measured on an uncompressed local server; re-measure on the live site.

## Asset blockers

- The original vector logo is missing (ES mark is a reconstruction). Optional: verified per-client results, founder story.

## Next highest-leverage task

1. Owner: fix HTTPS in GitHub Pages settings (above).
2. Add one landmark per road segment so the drives between stops differ (bus shelter / shutter / parked car silhouette).
3. Re-measure Lighthouse on the live (gzip) site; if mobile LCP > 2.5 s, preload the entry-m poster and inline critical CSS.

## Do not change

- The concept and its facts (DECISIONS.md 2026-09-18): owner's line, real roads/addresses, real client sites, illustrated-
  storefront label, `sms:+13133006898` "Book a Call" always in the nav.
- Lens shift framing, the opposite-sidewalk hero, physical light units, pure `pose(p)` (reverse-scroll exactness).
- Never commit `assets/js/world/*` edits without running `node tools/build.mjs` (the site loads `assets/js/dist/app.js`).

## Last QA result

Round 2: **84/100**, 2026-09-18, `.creative-web/qa/2026-09-18-15-34-14-final-full` (+ recheck). All hard gates PASS.
Lighthouse desktop 86/100/100/100, mobile 71/100/100/100 (local, uncompressed).

## Last screenshots

- `.creative-web/qa/2026-09-18-15-34-14-final-full/index.html` (contact sheet, 7 viewports, fwd + rev, reduced motion)
- `.creative-web/qa/grayscale-worlds.png`, `.creative-web/qa/static-d.png`, `.creative-web/qa/static-m.png`
