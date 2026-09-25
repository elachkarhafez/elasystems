# Handoff — ElaSystems

> Shared truth between agents (Claude Code, Codex) and sessions. Update at the end of every working
> session. Read FIRST at the start of every session. Neither agent can invoke the other — this file is the channel.

**Updated:** 2026-09-24 by Claude Code (Opus 5.5)

## Current state

v2 "Route 313" is built, QA'd and **shipped to production** (elasystems.com, GitHub Pages `main`) at the owner's request.
It was developed on branch `redesign-v2` from the original site (3758f32). The earlier v1 redesign ("Seven Worlds",
editorial) was never shipped; it exists only as uncommitted work in the main checkout.

## 2026-09-24: v2.1 "Route 313, cinematic" (live again)

The owner asked to bring back v2, make it more cinematic and animated, and publish it. This replaced the
Studio V10 site (9b3180e) on `main`; V10 stays in git history.

Added (all ambient: driven by the camera's measured motion or by time, never by scroll position, so `pose(p)`
stays pure and reverse scroll is unchanged):
- Opening crane: 4.4 s from 26 m above W Warren down onto the dark storefront (desktop/tablet; `?nointro` skips).
- Rain (`rain.js`, one GPU draw call, leans with speed), exposure "iris" settle on load.
- Post (`post.js`): speed zoom-blur toward the vanishing point, anamorphic light streaks, switch-on flash,
  film grain + edge fringe. Phones (LOW, no post) get CSS grain (`assets/brand/grain.png`).
- Camera: FOV widens with speed, banks into corners, nose-dips under braking, subtle handheld drift.
- Storefronts switch on with a neon stutter. Scope bars (`--lb`) close while driving, open at stops.
- DOM: title rise on load, stop panels cascade line by line from `--o`, sections rise in after the drive.
- Fixes: aerial climb/descent is a crane (height leads, ground follows) and fog/rain/blur follow altitude;
  the mall hotspot was a specular on the curtain-wall glass (now matte); lamp halos read texture alpha (the
  disc on phones). Posters re-rendered from the new look.
- Checks: `node tools/cine.mjs <label> <w> <h> [plan]`, `URL=… node tools/verify-cine.mjs`.

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
- Live mobile Lighthouse 80 (LCP 3.9 s simulated). Next lever: preload the entry-m poster + inline critical CSS.

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
Lighthouse LIVE (elasystems.com): mobile 80/100/79/100, desktop 81/100/79/100 (best-practices held back by missing HTTPS).
Comparison preview (v2 / v1 / original): https://elasystems-compare.vercel.app

## Last screenshots

- `.creative-web/qa/2026-09-18-15-34-14-final-full/index.html` (contact sheet, 7 viewports, fwd + rev, reduced motion)
- `.creative-web/qa/grayscale-worlds.png`, `.creative-web/qa/static-d.png`, `.creative-web/qa/static-m.png`
