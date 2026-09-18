# Brand — ElaSystems (v2)

> Maintained with the `brand-intelligence` skill. VERIFIED FACTS carry a source and date. DESIGN INFERENCES
> are in their own section. Unknowns are listed, never guessed. Accessed 2026-09-18 unless noted.
> Carried forward from the v1 research (main checkout, `docs/creative/BRAND.md`) and re-verified today.

## Verified facts

| Fact | Value | Source | Confidence |
|---|---|---|---|
| Business name | ElaSystems (wordmark "ELΛ SYSTEMS", A drawn as Λ) | `logo.png`, `uploads/pasted-1776816378543-0.png` | High |
| Earlier/alternate name | "ELA Design" | `uploads/pasted-1776813609530-0.png`, email `elasystemdesign@gmail.com` | Medium (probably the earlier name) |
| What they sell | Websites, apps, advertising | brand board; original site services section | High |
| Tagline (brand board) | "We build digital systems that grow businesses." | `uploads/pasted-1776816378543-0.png` | High |
| Original site headline | "Digital Systems That Actually Grow Your Business" | `index.html` (commit 3758f32) | High |
| Owner's core line | "Most businesses don't have a **traffic problem**. They have a **system problem**." | original `index.html` intro | High |
| Location | Detroit, MI (city only) | original footer | High |
| Phone / SMS | 313-300-6898. Every CTA is `sms:+13133006898` ("Book a Call", "Book a Free Consultation") | original nav, hero, CTA, footer | High |
| Email | elasystemdesign@gmail.com | original footer | High |
| Hosting | GitHub Pages (`CNAME` elasystems.com, repo `elachkarhafez/elasystems`); A records 185.199.108–111.153 | repo, nslookup | High |
| HTTPS | **Broken**: certificate name mismatch on `https://elasystems.com` (re-checked today: curl 000); HTTP 200 serves the original site | curl 2026-09-18 | High |
| Hours | UNKNOWN | — | — |
| Social profiles | none found (web search 2026-09-18, twice) | WebSearch | — |

## The "products": seven live client sites (owner-confirmed as their work)

Captured from the live sites 2026-09-18 (`.creative-web/research/work/report.json` in the main checkout).
Addresses are **as published on each client's own site**.

| # | Client | Domain | Category (their words) | Published location | Their headline | Built into the site | Heading font | Palette sampled |
|---|---|---|---|---|---|---|---|---|
| 1 | Family Bakery | familybakerydetroit.com | Lebanese bakery & restaurant, "since 1995" | **17032 W Warren Ave, Detroit, MI 48228** | "Detroit's family-owned Middle Eastern bakery" | menu, online ordering, catering requests, gallery, full Arabic RTL version (verified by toggling) | Bebas Neue | #FFF6E3 cream · #4A302D brown · #C85F2A orange · #D99A24 saffron |
| 2 | Creative Style | creativestylewiss.com | Premium barber | **22140 Ford Rd, Dearborn Heights, MI 48127** | "What a Fade. Big Love finish." | lookbook, services, hours, location, call, book | Syne | #FCFBF8 · #0F1E16 · #2F6A47 green |
| 3 | Big Wiss Matcha | bigwissmatcha.com | "Founder-led premium matcha pop-up", event catering | **Dearborn, MI** (pop-up; "Dearborn & SE Michigan", no fixed address) | "Big energy. Real matcha." | flavors, event booking, Instagram feed | Montserrat | #0A1A11 · #2D5A3D · #7DCEA0 matcha · #C4A57B |
| 4 | The Snug Mug | thesnugmugbyally.com | Coffee shop | **6659 Middlebelt Rd, Garden City, MI 48135** | "Your new corner coffee shop" | menu, pastries, catering, story, directions, call; Honey Bear Latte | Anton | #F6F0E4 · #20120D espresso · #B69A3A gold |
| 5 | Bounce It Up | bounceituplivonia.com | Indoor fun center | **30276 Plymouth Rd, Livonia, MI 48150** | "Livonia's Favorite Indoor Adventure Park" | party booking, online waiver, open-play pricing, memberships, gallery, FAQ | Fredoka One | #0B0F14 · #06172E · #27F5FF cyan · #FF7A00 orange · #FFD400 |
| 6 | D'Moda Shoes | dmodashoes.com | Boutique women's footwear | **5001 Monroe St, Toledo, OH 43623** (Franklin Park Mall) | "Every outfit begins at the shoes" | online store: categories, cart, promotions, in-store pickup | Oswald | #F7F3EE · #1A1A1A · #D71920 red · #D9B36C |
| 7 | 313 Apparel | 313apparelmi.com | Shia streetwear | online only; city UNKNOWN ("mi" in domain) | "Shia Streetwear Built With Purpose" | store (48 designs), limited drop, custom commissions, cart | Cormorant Garamond | #050505 · #F4EFE7 · #941018 red · #B89840 gold |

Client ratings, review counts and prices on those sites are **client facts**, never reused as ElaSystems claims.
Additional projects exist in the owner's Vercel account (e.g. glycobay, andalus grill, express poultry fish, le belal
pastry, several "-demo" builds). They're not public portfolio pieces as far as I know, so they're **not used**.

## Booking / conversion flow (must keep working)

- Primary: **text 313-300-6898** (`sms:` links). Original labels: "Book a Call", "Book a Free Consultation", "Book Your Free Consultation".
- Secondary: call (`tel:+13133006898`), email (`mailto:elasystemdesign@gmail.com`).
- Explore: every portfolio item links to its live site (new tab).
- No forms, no backend, no analytics found in the original.

## Audience & conversion

- Primary customer (from the client list): owner-operated local businesses in Metro Detroit and nearby
  (bakery, barber, café, pop-up, fun center, boutique, apparel brand). Several Arab-American-owned (Dearborn,
  W Warren Ave, Arabic RTL site).
- Visit context (INFERENCE): phone, from a referral or a client-site footer link; they decide by seeing real work,
  then text.

## Differentiation (verified from the work, not from claims)

- No house template: seven sites, seven palettes, seven heading typefaces (computed styles).
- Features fit each business model (ordering/catering, waivers/party booking, stores/carts, event booking, bilingual RTL).
- Local and physical: five of the seven clients publish a street address on a named Metro Detroit / Toledo road.

## Visual identity (observed)

| Element | Observation | Source |
|---|---|---|
| Logo mark | "ES". The E is **three slanted gold bars** (speed stripes). A thin **gold slash** separates it from a **navy S** built from the same three strokes. Bar ends are cut parallel to the slash (~27.5° from vertical, slope 0.52). | `logo.png`, brand board |
| Wordmark | "ELΛ SYSTEMS": wide light geometric caps, generous tracking. ELΛ navy, SYSTEMS gold | `logo.png` |
| Logo files | PNG only (547×261; 1254² brand board), white background, **no vector** | repo |
| Colors | navy S #081830 → #102848; ELA ink #000820; gold wordmark #E0A020–#E8A028; bar shading #704810 → #B08038 → light near the slash | pixel-sampled `logo.png` |
| Original site look | white/ivory + navy + gold; Sora + Plus Jakarta Sans; three.js particle hero; fake 3D laptop; rocket path | `index.html` 3758f32 |
| Photography | none (no people, workspace or product photos) | repo |

## Brand vocabulary (the owner's words, original site)

*systems*, *traffic problem / system problem*, *turn attention into customers*, *every touchpoint — from first click
to final conversion*, *doesn't just exist online, it scales*, *We don't build things that look good. We build systems
that work.*, *Book a Call*, *Quick call. No pressure. Just clarity on how to grow your business.*

Unsourced claims on the original ("50+ projects", "247% avg. conversion lift", "5 stars", "100% on-time",
"sub-second load times") → **not reused** until the owner confirms them.

## DESIGN INFERENCES (not stated by the business)

- "ELA" may derive from the owner's surname. Not stated → not used.
- Small founder-led studio (gmail, no team page). Not stated → not used.
- The logo's gold "speed stripes" read as **motion / light trails**. Detroit is the Motor City. The owner's own
  metaphor is **traffic**. These line up visually (inference, but built only on verified pieces).

## Five visual truths

1. **Speed stripes + slash.** The mark is three gold motion bars cut by a thin gold slash, then a navy S.
2. **Traffic vs system.** The owner's defining line contrasts *traffic* (attention passing by) with a *system* (what turns it into customers).
3. **Real places on real roads.** Clients publish addresses on W Warren Ave, Ford Rd, Middlebelt Rd, Plymouth Rd and Monroe St, and one pop-up in Dearborn.
4. **Seven lit identities.** Seven live sites, each with its own palette and typeface (Bebas Neue, Syne, Montserrat, Anton, Fredoka One, Oswald, Cormorant Garamond), including a full Arabic RTL version.
5. **Text-first conversion from a 313 number.** Every call to action is an SMS to 313-300-6898.

## Assets & provenance

| Asset | Path / URL | Owner | License | Quality | Use |
|---|---|---|---|---|---|
| Logo PNG | `logo.png` | ElaSystems | owned | low-res raster, white bg | favicon fallback, measuring |
| Brand board (ES) | `uploads/pasted-1776816378543-0.png` | ElaSystems | owned | 1254² | measured → SVG reconstruction |
| Client site captures (desktop tall 1440×3600, mobile 390×844@2x) | main checkout `.creative-web/research/work/*.png` | ElaSystems' own portfolio work | owned work, captured 2026-09-18 | high | textures for the storefront windows (production) |
| `DESIGNS/` images | main checkout | third parties | **unlicensed** | — | never use |

## Competitors / category (positioning only)

Detroit agency listings (Clutch, DesignRush, Expertise) are generic "top agency" directories; the agencies there
lead with claims. ElaSystems' edge is showable local work.

## Unknowns & replacement needs

- Original vector logo. Founder name/photo/story (owner's choice). Verified results per client.
- App and advertising case studies. 313 Apparel city. Business hours / typical reply time. Social profiles.
- Permission note: showing client storefronts as *illustrated* 3D buildings is a depiction, not a photo of the
  real building. It must be labeled as illustrative on the site.
