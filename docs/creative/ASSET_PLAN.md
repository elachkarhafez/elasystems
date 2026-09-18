# Asset Plan — ElaSystems v2 "Route 313"

> Medium for every visual. Placeholders are never presented as final. Asset quality gate:
> `~/creative-web-os/core/asset-strategy.md`. **Photorealism is not required by the brief.** The world is a stylized
> night illustration where light carries the story, so no photoreal building assets are needed. The client websites
> are the real "product" imagery.

## Medium decisions

| Visual | World | Medium | Status | Notes |
|---|---|---|---|---|
| Client websites in windows / board / billboard | 2–8 | real captures → WebP → emissive textures (desktop 1024×1280 crop of the top 1800 px; phone 512×1108) | **production** | own portfolio work, captured 2026-09-18 |
| Family Bakery Arabic (RTL) site | 2 | real capture of the Arabic version (toggle ع) | **production** | captured this session |
| Road network, curbs, buildings, storefront architecture, awning, canopy, billboard, mall atrium | all | procedural real-time geometry (boxes, extrusions, tubes) + shader materials | **production (illustrated)** | labeled on the site as illustrated |
| Building windows (background city) | all | procedural shader (hash-lit window grid) | production | no textures |
| Wet asphalt | all | procedural noise + `Reflector` (HIGH) | production | |
| Gold / white traffic trails | all | tube geometry + scrolling-dash shader, additive | production | the mark's speed stripes |
| Client signs, road markings, street-sign blades, gantry, city-limit sign | all | canvas textures drawn with real fonts (client faces, Overpass) | production | text from BRAND.md only |
| Barber pole, string lights, cups, steam, neon tubes, inflatable arch, plinths | 3–8 | procedural geometry / sprite shader | production (illustrated) | |
| ES mark | nav, footer, favicon, "your storefront" | SVG reconstruction (from v1 work, measured from the brand board) | **reconstruction** | replace with the original vector when available |
| Hero poster + per-stop posters (LCP, reduced motion, no-WebGL) | all | stills rendered from the world with Playwright (desktop 1600×900, mobile 780×1560) → WebP | **production** | regenerate after visual changes: `node tools/render-posters.mjs`, then convert (AGENTS.md) |
| OG share image | head | entry poster + the owner's line + reversed mark (1200×630 JPEG) | **production** | `node tools/render-og.mjs` |

## Demo vs production

| Asset | Source | Provenance / license | Demo only? | Replacement |
|---|---|---|---|---|
| Client captures | live client sites built by ElaSystems | own portfolio (owner-confirmed 2026-09-18) | no | recapture when a site changes |
| Overpass, Overpass Mono | Google Fonts, self-hosted subsets | SIL OFL 1.1 | no | — |
| Client faces (Bebas Neue, Syne, Montserrat, Anton, Fredoka One, Oswald, Cormorant Garamond) | Google Fonts subsets (reused from the v1 work) | SIL OFL | no | — |
| three.js 0.186.0 | npm `three` (vendored) | MIT | no | pin; update deliberately |

## Missing assets: specifications (not blocking)

### ASSET: original ES logo vector
Purpose: nav/footer/your-storefront sign. Format: SVG (mark, wordmark, lockup; light + reversed). Status: missing (reconstruction in use).

### ASSET (optional): real storefront photography per client
Purpose: a future "street view" stills row or DOM detail. Night exterior, 35 mm, eye level from the curb, sign lit,
3:2, 3000 px. Client permission required. Status: missing and not needed for the concept (illustrated route).

### ASSET (optional): verified results per client
Numbers + date range + permission, to add to stop panels. Status: missing. Stop panels show only verified features.

## Optimization log

| File | Before | After | Method | Date |
|---|---|---|---|---|
| three.js | vendored module 766 KB (197 KB gz) | bundled chunk 558 KB (143 KB gz) | esbuild bundle + tree-shake (tools/build.mjs) | 2026-09-18 |
| Window textures | 1440×1800 PNG captures | 1024×1280 WebP (31–77 KB) + 512×640 mobile (13–27 KB) | PIL resize, q74 | 2026-09-18 |
| Road-name textures | 512×1024 canvases, 1400 composite ops each (657 ms build at 4× CPU) | 256×640, one shared wear pattern (240 ms) | canvas pattern fill | 2026-09-18 |
| Route sampling | arc-length solve per call (thousands) | 0.5 m lookup table | route.js | 2026-09-18 |
| Posters (20) | — | 523 KB total WebP | rendered from the world (tools/render-posters.mjs) | 2026-09-18 |
| OG image | 507 KB PNG | 93 KB progressive JPEG | tools/render-og.mjs | 2026-09-18 |
