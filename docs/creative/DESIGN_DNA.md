# Design DNA — ElaSystems (v2)

> The persistent visual memory. Derived from BRAND.md observations (logo, owner's copy, client facts), not taste.
> Change only with a DECISIONS.md entry.

## Visual personality

**Nocturnal · precise · local · kinetic · warm-in-the-dark.**
It is NOT: sci-fi/cyberpunk, a SaaS dashboard, a "tech" gradient, an agency flexing abstract 3D, or a mockup gallery.

## Color logic (roles)

| Role | Value | Source | Use / never use |
|---|---|---|---|
| Ground (night) | `#050B16` → sky `#0A1628` at horizon | logo navy S #081830, darkened | the world and DOM ground. Never pure black |
| Ink | `#F2EFE8` (warm paper) | brand board light background | DOM text on night; in-world road markings |
| Signature accent (ES gold) | `#E3A02A` · light `#F4CD72` · deep `#8A5A12` | SYSTEMS wordmark, bar shading | **only** traffic trails, the slash, CTAs, active route dot, your storefront. Never decorative fills |
| Material tone (sodium street) | `#FFC98A` light, pool `#FF9F4A` @ low alpha | night-street reference | streetlights and their pools |
| Support (shadow fill) | `#6F8FB8` @ low intensity | moonlight/cinema split-tone | fill light, fog tint, secondary DOM text `#9DB0C8` |
| Client palettes | per BRAND.md | client sites (sampled) | **only as emitted light inside that client's world** (window, sign, spill). Never in the frame UI |

## Typographic personality

- **Display + in-world: Overpass** (SIL OFL, variable wght 100–900, self-hosted). It descends from FHWA Highway Gothic,
  the lettering of American road signs. Headlines 800, tracking −0.02em, line-height 0.95. Road markings: 800,
  condensed by transform (scaleY 2.4 on the asphalt for perspective legibility).
- **System labels: Overpass Mono** (SIL OFL): addresses, stop numbers, features, route strip. Uppercase, +0.08em tracking.
- **Client faces** (their real web fonts, subset): only on their own sign and name.
- Scale contrast: hero H1 clamp(44px, 6.4vw, 108px) vs body 17px (≈6×). Panel client names 44–84px.
- **Signature device:** type lives *in the road*. Road names are painted on the asphalt and shown on green street-sign
  blades; the DOM mirrors them in the route strip.

## Composition style

Cinematic 2.39-ish reading of a 16:9 frame. The subject (storefront) is placed on the right third, copy on the dark
left third, and the vanishing point sits at ~60% width. Overlays are typographic (no boxes). They sit on a soft
left-side scrim (night gradient), never in cards.

## Spacing / density

Sparse in-world (one subject per frame), dense and precise in mono metadata. DOM sections after the world are
editorial: a big number or a big line, then tight columns.

## Image style

The only raster imagery is **real client website captures**, shown as light inside windows (emissive, slightly bloomed,
with faint glass reflection), never as floating cards. Posters for reduced motion are frames rendered from the world.
Never: stock photos, mockup devices, people, fake storefront photos.

## Material language

Wet asphalt (dark, rough, mirrored streaks) · brick and stucco in near-silhouette · storefront glass (screen light +
faint diagonal reflection) · painted road markings (white, slightly worn) · enamel sign blades (green #0E5B3A, white type)
· neon tube · canvas awning / canopy fabric · steel billboard legs · polished mall floor.

## Shape language

- **The slash** at the mark's angle (27.5° from vertical, slope 0.52): used for the gold lamp line, CTA edges and
  DOM rules.
- **Road geometry:** dashes (3 m on, 9 m off), stop bars, lane lines. DOM separators are dashed rules, not boxes.
- **Sign panels:** small radius (4% of height), like real street signs. It's the only radius in the system. Buttons
  are square-cut with one slashed edge.

## Motion personality

Heavy, well-tuned car: accelerate, cruise, brake, settle, and lights switch on cleanly. → MOTION_LANGUAGE.md

## Camera personality

Car-mounted and curb-parked. Eye level 1.3 m (1.1 low / 1.8 high variations per world). Lenses 38–46° vFOV in town,
52° on the highway, 58° on mobile. Pans to face storefronts at stops (55–80°). No orbiting. The one crane move is the
collection reveal. The horizon is always level except a brake dip ≤ 0.5° and the billboard look-up (12°).

## Interaction personality

- **Response:** damped (λ 3–6.5 /s), never springy.
- **Budget:** pointer → camera look ±2.5° yaw / ±1.5° pitch (driver's head). Nothing else in the world reacts to the pointer.
- **Interactive elements:** scroll (drives), route strip stops (jump to a stop), storefront "Visit site" links (DOM),
  Book a Call / Call / Email (DOM), nav.
- **Touch:** no pointer look; tap route stops; native scroll. **Keyboard:** all links focusable in order; focusing a
  stop's link scrolls the car to that stop; route strip is a list of links.

## Environment personality

Metro Detroit west side at night, stylized: low-rise buildings, wide roads, streetlight rhythm, fog off the road,
one lit business at a time. Honest, not glamorous. It's dark because the point is who's lit.

## DO

- Let light tell the story. Keep one subject per frame.
- Use real road names and real client sites only.
- Keep the CTA reachable at every moment (nav CTA + route end).
- Label the illustrated storefronts as illustrated.

## DON'T

- Floating screenshots, device mockups, particles, orbs, magenta neon, glass cards, rounded pill UI.
- Brand gold outside its roles; client colors outside their worlds.
- Claims or numbers not in BRAND.md.
