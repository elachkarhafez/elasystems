# Creative Brief — ElaSystems (v2 "Route 313")

> The design contract. Written after BRAND.md, REFERENCES.md and CONCEPTS.md, before implementation.
> Change only with a DECISIONS.md entry.

## One-sentence visual thesis

> **The site feels like a night drive down real Metro Detroit roads where traffic streams past until each
> storefront switches on with the website ElaSystems built for it, because what ElaSystems sells is the *system*
> that turns passing traffic into customers, so the visitor watches seven real businesses light up and wants
> theirs to be next.**

## Primary audience

Owner-operated local businesses in Metro Detroit / SE Michigan (bakeries, barbers, cafés, pop-ups, fun centers,
boutiques, apparel brands), mostly on phones, often arriving from a referral or a client's site.

## Primary business goal

A text to 313-300-6898 ("Book a Call" / "Book a Free Consultation"). Secondary: call, email, visit a live client site.

## Emotional target

- First 5 seconds: *"that's my street at night, and that's exactly my problem."* People drive past, nobody stops.
  The mood is calm, confident and local.
- Remembered 5 minutes later: storefronts switching on one by one (the bakery's warm glow, the barber pole, the neon
  fun park), the gold light trails, and the dark storefront at the end with the number on it.

## Experience mode

**Mode 4 — Immersive Product World** (explicit user instruction; DECISIONS.md has the selector scores and risks).
The "products" are the client websites. Each world is one real client, placed on the road it actually publishes as
its address. For a web studio the site is also the capability demo, which makes the spectacle a business asset.

## Hero idea

- **Subject:** a single **dark storefront** on a wet night street (unnamed, representing any business without a
  system), right of center, 3/4 angle. Its window is black and its sign is blank.
- **Camera:** curb height 1.3 m, looking down the road at ~20° off-axis, vertical FOV 40°. The road's vanishing
  point sits at ~62% of the width.
- **Traffic:** three gold light trails (the E of the mark) stream along the far lanes into the vanishing point,
  plus faint cool-white oncoming trails. Streetlight pools recede in rhythm.
- **Type relationship:** the owner's line set large on the dark left third, in two beats:
  **"Most businesses don't have a traffic problem."** (visible on load) → **"They have a system problem."**
  (appears on the first scroll, when the gold trails swing into the camera's lane).
- **First motion:** trails already moving on load (ambient). On first scroll the camera pulls off the curb.
- **CTA:** "Book a Call — 313-300-6898" (original label, `sms:`) under the headline + "Take the drive ↓".
  The nav CTA stays visible throughout.

## Page / world narrative (arc: curiosity → introduction → discovery → transformation → spectacle → choice → action)

0. **Entry**: dark storefront, traffic passing. *Traffic problem.*
1. **System**: line two lands; the gold trails merge into the camera's lane; the drive starts.
2. **W Warren Ave: Family Bakery** (Detroit). The first storefront to switch on: warm oven light, striped
   awning, and a window that alternates the English and Arabic (RTL) versions of their site.
3. **Ford Rd: Creative Style** (Dearborn Heights). Cool fluorescent glass box, spinning barber pole, lookbook in the window.
4. **Dearborn: Big Wiss Matcha**. No building: a pop-up canopy in a lot under string lights, matcha-green glow.
5. **Middlebelt Rd: The Snug Mug** (Garden City). A corner coffee shop, honey-amber light, steam curling past the sign.
6. **Plymouth Rd: Bounce It Up** (Livonia). A big-box building outlined in cyan, orange and yellow neon; the energy peak.
7. **I-75 S → Monroe St: D'Moda Shoes** (Toledo). Spectacle: the highway leg (dense trails, overhead
   "TOLEDO" gantry), then a glossy mall entrance with red retail light.
8. **The 313: 313 Apparel**. Back in Detroit: no store (it's online), a billboard on a brick wall lit from below.
9. **Collection**: the camera cranes up. The whole route appears as a line of lit storefronts in the dark:
   *seven businesses, seven systems.*
10. **Commerce**: the camera drops back to the dark storefront from the hero. It switches on in ES gold:
    "Your storefront's next." The sign becomes the CTA (text / call). The world dims and the DOM takes over:
    services (Websites / Apps / Advertising), the owner's "We don't build things that look good. We build systems that
    work.", and contact.

## Visual language

Night photography rendered in real time: deep navy darkness, wet asphalt, fog, and **light as the only storyteller**.
Buildings are near-silhouettes. What reads is what glows: signs, windows, streetlights, trails. Every client world is
defined by *its* light (color temperature, source type, rhythm), its architecture type, one signature prop and its
own typeface.

## Typography

- **Overpass** (SIL OFL): the open-source descendant of the Highway Gothic road-sign lettering. Used for display
  (800–900, tight) and in-world road signs and road markings. Type is literally part of the road.
- **Overpass Mono**: route metadata (addresses, stop numbers, coordinates of the journey, features).
- **Client faces** (each client's real web font) only on that client's sign and name.
- Signature device: **road-marking type**, elongated white capitals painted on the asphalt (e.g. "W WARREN") that
  the camera drives over.

## Color logic

Ground night navy (from the logo's navy S) · ink warm paper · ES gold reserved for traffic trails, the slash and CTAs ·
sodium-warm streetlight · cool steel shadow fill · client palettes appear only as *emitted light* inside their
world. Details in DESIGN_DNA.md.

## Material language

Wet asphalt (dark, rough, mirrored light streaks), brick and stucco in silhouette, storefront glass (screen light +
faint reflection), painted road markings, enamel street signs, neon tube, canvas awning/canopy.

## Photography / 3D strategy

No stock and no fake photos. The only "photography" is **real captures of the client websites**, used as
emissive window textures. All architecture is procedural and stylized, labeled on-site as *illustrated*
("Illustrated route. The storefronts are drawn; the websites are real."). Posters for reduced motion / no-WebGL are
rendered from the scene itself.

## Motion language (details: MOTION_LANGUAGE.md)

Vehicle physics: accelerate out, cruise, brake, settle. The camera has weight (no snaps, no bounces). Lights switch
on with a short ballast flicker-free ramp (never strobing). Ambient life = traffic, steam, barber pole, string-light
sway, neon cycle, slow window scroll.

## Interaction language

Scroll drives the car. The pointer turns the driver's head slightly (±2.5° yaw/pitch, damped). The route strip
(sat-nav style) jumps to any stop. Storefront links and CTAs are DOM. No custom cursor, no magnetic buttons.

## Mobile approach

Its own composition: taller camera (1.6 m), wider vertical FOV (55°), and at each stop the camera turns fully to face
the storefront so it fills the portrait frame. Windows show the clients' **phone** captures (portrait). The copy docks
to the bottom third. ~65% of the desktop scroll length, no postprocessing, DPR ≤ 1.5.

## Performance strategy

Static site (GitHub Pages compatible), three.js vendored (no CDN), no other libraries. The HTML poster frame is the
LCP; WebGL boots after first paint. Textures stream by route proximity, and all architecture is procedural. Quality
tiers HIGH / MEDIUM / LOW / REDUCED (EXPERIENCE_ARCHITECTURE.md).

## Reference quality bar (REFERENCES.md)

igloo.inc for one-world continuity and restraint; Hopper's *Nighthawks* for storefront light; night-driving cinema for
grade and calm speed. Match their intentionality, not their look.

## Forbidden generic patterns (this project)

- Floating website mockups in a void, browser-chrome cards, laptop/phone mockups as decoration.
- Particles, orbs, bokeh blobs, lens-flare spam, cyberpunk magenta/cyan neon overload.
- Cards/boxes for world content; centered heading+subtitle+button stacks.
- Opacity-only transitions between worlds (worlds change by driving, turning, lighting).
- Any unsourced stat or claim; any implication that the illustrated buildings are photos of the real stores.
- A 3D logo spinning in space.
