# Concept Tournament — ElaSystems (v2)

> ≥3 structurally different directions. Mode 4 (Immersive Product World) is an explicit user instruction,
> so all three are Mode 4, but they differ in narrative model, world, camera/interaction model and medium.
> ElaSystems' "products" are the client websites it builds (BRAND.md). Each "world" is one real client.

## Direction A — "Route 313" (traffic → system)

- **Visual thesis:** a night drive down real Metro Detroit roads where traffic streams past dark storefronts until
  each one lights up with the website ElaSystems built for it.
- **Built on brand truth:** the owner's line *"Most businesses don't have a traffic problem. They have a system
  problem."*; the logo's gold speed stripes (= light trails); real client addresses on W Warren Ave, Ford Rd,
  Middlebelt Rd, Plymouth Rd, Monroe St; SMS-first conversion.
- **Hero:** low camera at a curb at night. Three gold light trails (the E of the mark) stream past a dark
  storefront. The owner's line is set big on the left. A thin gold slash (a lamp line) stands where the E meets the S.
- **Signature moment:** the storefront **switching on**: the window fills with the client's real site, the sign lights
  in the client's own typeface, and the passing trails slow and turn gold-warm in front of it. Traffic becomes customers.
- **Type & color:** Overpass (open-source descendant of the Highway Gothic road-sign lettering) for road signs,
  road markings and display; Overpass Mono for system labels; client faces only on client signs. Night navy
  ground, ES gold for traffic and CTAs, each client's palette only as *light* inside its world.
- **Motion + camera:** a car-mounted camera, 1.2 m high, 35 mm-ish. Accelerates, brakes and settles at each stop,
  pans to face the storefront. On the highway leg the camera drops and widens for speed. The finale cranes up.
- **Mode:** 4. One persistent real-time world (three.js) with a DOM layer for everything readable.
- **Assets:** client captures exist (real). Architecture, signs and props are procedural (stylized night: light
  does the storytelling, silhouettes hide the lack of modeled detail). Missing: nothing blocking.
- **Conversion:** every stop has "Visit site". The route ends at a dark storefront with the gold sign "Book a call —
  313-300-6898", then services and contact in the DOM.
- **Risks:** procedural architecture looking cheap (mitigate: night, fog, silhouette, emissive-led lighting, wet
  reflections); 3D on phones (dedicated mobile camera and textures); must label storefronts as illustrated.

## Direction B — "Exploded Build" (product anatomy commercial)

- **Visual thesis:** each client website is a physical object, its real sections separated into layers you fly through,
  shot like a product commercial in a dark studio.
- **Built on:** the websites are the product; seven distinct identities.
- **Hero:** a single site slab rotating slowly under a softbox, gold edge light; headline beside it.
- **Signature moment:** the camera dives *through* the layers of Family Bakery's site: header, hero, menu, catering.
- **Type & color:** wide grotesk + mono; black studio; client palettes on the slabs.
- **Motion + camera:** orbit + dolly-through; slabs slice at the slash angle between clients.
- **Mode:** 4 (single hero object per world).
- **Assets:** captures exist; need per-section crops (producible).
- **Conversion:** a shelf of all seven slabs → CTA.
- **Risks:** "floating screenshots in 3D" is a very common agency trope; interchangeable with any web studio
  (fails the 85% test); no local truth; studio-void look drifts toward the generic dark-tech aesthetic.

## Direction C — "The Thread" (the text message as the world)

- **Visual thesis:** a phone on a counter receives a text; each reply opens into the client's world around the phone.
- **Built on:** SMS-first contact from a 313 number.
- **Hero:** a photoreal phone lying on a surface with a text thread "Hey, I need a website".
- **Signature moment:** the room around the phone becomes the bakery counter, then the barber station, then the café.
- **Type & color:** iMessage-like bubbles (risky: platform trade dress); warm interiors.
- **Mode:** 4 (persistent phone object, changing environments).
- **Assets:** **needs seven photoreal interior environments + a photoreal phone.** None exist, can't be produced to a
  premium standard in scope → **asset disqualifier.**
- **Conversion:** strongest: the phone *is* the CTA.
- **Risks:** fake-looking interiors, platform UI imitation, heavy.

## Scores (1–5)

| Criterion | A Route 313 | B Exploded Build | C The Thread |
|---|---|---|---|
| Brand fit | 5 | 3 | 4 |
| Memorability | 5 | 3 | 4 |
| Originality (85% brand-swap test) | 5 | 2 | 3 |
| Asset feasibility | 3 | 4 | 1 |
| Conversion clarity | 4 | 4 | 5 |
| Mobile quality | 3 | 3 | 4 |
| Performance | 3 | 4 | 2 |
| Technical feasibility | 3 | 4 | 2 |
| Longevity | 4 | 2 | 3 |
| Implementation complexity (5 = simplest) | 2 | 3 | 2 |
| **Total** | **37** | **32** | **30** |

## Decision

**Selected: A "Route 313".** It's the only direction whose world is made of facts already in the brand: the
owner's traffic/system line, the logo's speed stripes, real client roads and sites, and the 313 text number.
Swap the brand and ~none of it survives (passes the 85% test).

- **B lost** on originality and brand fit: any web studio could fly through its screenshots.
- **C is disqualified** on assets (seven photoreal interiors + phone don't exist) despite the best conversion idea.
  Its idea survives inside A: the finale is the text CTA.

Structural difference from the v1 redesign (main checkout, "Seven Worlds"): v1 is a 2D editorial page re-skin cut by
a slash. v2 is a single persistent 3D place travelled by a camera, with physical light as the transition device.
