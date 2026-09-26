# ElaSystems — Agent Guide

Concise cross-agent map for this repository (read by Codex directly and by Claude Code via `@AGENTS.md`
in CLAUDE.md). Keep it to 50–120 useful lines.

## Project

- ElaSystems (elasystems.com): Detroit studio for websites, apps and business systems.
- **Flagship build (branch `flagship`)**: Next.js 16 (App Router, Turbopack) + React 19 + GSAP/ScrollTrigger + Lenis.
  No WebGL: depth is CSS 3D. The previous static V Max site is live on GitHub Pages from `main` (commit 42f4881).
- The contact form needs a server route (`/api/contact`), so this build must be hosted on a Node platform
  (e.g. Vercel), not GitHub Pages. Moving the domain is an owner decision; never deploy production unasked.

## Concept

The ES mark is the interface. The E's three bars ARE the three pillars. Intro: the mark in 3D, "Scroll to open
the system". Opening: the S breaks into tiles that turn over mid-flight (their backs are slices of
`public/brand/hub-preview.webp`) and assemble the preview window where the S was; the bars travel out to become
the gateways Websites / Apps / Systems; the slash stays as the divider. Hub: hover/focus previews a world.
Click: the bar's face opens into the world (portal) with a camera push. Worlds: Websites (paper), Apps (sand,
concept work), Systems (graphite, sample data), Contact ("the core", dark + gold). Back = history / Escape.

## Commands

- Dev: `npm run dev` → **http://localhost:3030** (127.0.0.1 does not hydrate: Next blocks cross-origin dev assets).
- Build: `npx next build`. Typecheck: `npx tsc --noEmit -p .`
- QA captures: `URL=http://localhost:3030/ node tools/shots.mjs <label> <w> <h> "<plan>" [--reduced]`
  (plan: intro, open:ms, wait:ms, hover:i, enter:world, y:fraction, px:y, back, shot:name; `HASH=#apps` deep links).
- Client captures: `tools/capture.mjs`, `tools/capture-story.mjs` → `.captures/` → WebP in `public/work/`.
- Tile-back art: `node tools/hub-preview.mjs`. Share image: `node tools/og.mjs` → `public/brand/og.jpg`.

## Important business rules

- Primary CTA is SMS `sms:+13133006898`, labelled "Text 313-300-6898" / "Text us" (never "Book a Call" on an sms:
  link). Also `tel:+13133006898` and `mailto:elasystemdesign@gmail.com`. Never remove.
- Portfolio: names, screenshots and links only. No counts or numbering, ratings, results or testimonials.
- App screens are labelled concept work; dashboards are "recreated for illustration, sample data". Client
  products/prices shown are the client's own published facts. Never bypass the Bounce staff passcode.
- No unsourced numbers or claims. Never use images from `DESIGNS/`. `public/CNAME` keeps the domain.
- Secrets only in env (`.env.example`): RESEND_API_KEY, CONTACT_EMAIL, CONTACT_FROM, TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN, TWILIO_FROM, PHONE_NUMBER. Without them the form returns 503 and shows the SMS fallback.

## Architecture

- `app/layout.tsx`: fonts (next/font/local), metadata, JSON-LD, head script setting `data-motion` / `data-deep`.
- `components/Experience.tsx`: the controller (phases intro → opening → hub → entering → world → leaving),
  geometry from `lib/mark.ts` (`markFrame`, `hubFrame`), portal, history/hash routing (`#websites` etc.).
- `components/worlds/*World.tsx` + `*-world.css`: one dynamic chunk per world; `lib/useWorld.ts` gives Lenis
  (desktop fine pointers), a gsap context, tone triggers (`[data-tone]` → `html[data-tone]`) and arrivals.
- Scroll states are functions of progress (pinned, scrubbed timelines; class toggles, no React state per frame).
- `components/devices.tsx` (Display/Phone), `components/apps/screens.tsx`, `components/systems/consoles.tsx`.
- `app/api/contact/route.ts`: validation, honeypot, rate limit, Resend email + optional Twilio SMS.
- Copy and client data: `lib/content.ts`. Reduced motion: static states, labelled hub, crossfade portal.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
