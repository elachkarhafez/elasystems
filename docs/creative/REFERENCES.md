# References — ElaSystems (v2)

> Reference quality, never identity. Working captures: `.creative-web/qa/references/` (gitignored).
> Web references inspected 2026-09-18 with Playwright (desktop 1440×900 + mobile 390×844, two scroll stops,
> network log for rendering-method evidence). Non-web references are cited for principle only.

## Reference matrix

| # | Reference | Category | Why useful | Specific technique | What NOT to copy | Implementation (INFERENCE unless noted) | Mobile behavior | Performance |
|---|---|---|---|---|---|---|---|---|
| 1 | igloo.inc | WebGL product world / scroll choreography | One persistent hero object in one lit environment; the scroll moves the camera around it | Monochrome terrain + single subject, mono micro-type pinned to corners, camera-led progression | Igloo/snow identity, their UI, their copy | Real-time WebGL, Draco-compressed meshes (`*.drc` observed) + custom scroll director | Same world, subject re-centered, fewer UI labels | Many small Draco meshes streamed; heavy first load |
| 2 | bruno-simon.com | Same industry (portfolio as world) | A portfolio shown as a *place* you move through, not a grid | Dark ground plane, glowing interaction ring, world objects hold the work | Drivable toy car, diorama toy aesthetic, physics play | Real-time WebGL, ~15 compressed GLBs (`*-compressed.glb`), Draco + Basis transcoders observed | Same scene, click-to-start gate | Physics + many GLBs. Great for play, wrong for a 2-minute business decision |
| 3 | lusion.co | Studio / materials | Material polish: glossy vs matte separation, controlled reflections | Hero object cluster in a framed panel, restrained UI, strong scale contrast | Their abstract jack shapes, blue palette | WebGL + MP4 reels (4–5 MB each) + EXR matcap (observed) | Canvas panel re-framed portrait | Heavy video payload |
| 4 | activetheory.net | Animation / transitions (anti-reference in part) | Loading curtain + one emblem object | Emblem centered in darkness, cinematic reveal | **Particle haze and glowing orbs**: exactly the generic look to avoid | WebGL + KTX2 textures + 18 MB reel (observed) | Same composition, cropped | 18 MB reel is out of budget for us |
| 5 | Edward Hopper, *Nighthawks* (1942, Art Institute of Chicago) | Photography / environment (painting) | The canonical image of a **lit storefront as the only warm light on a dark street** | Single light source from inside the glass, hard window edges, deserted street, diagonal glass line | The diner, the figures, the painting itself | — | — | — |
| 6 | Long-exposure light-trail photography (genre) | Photography / motion | Cars become **streaks of light**, which are the logo's speed stripes | Constant-width streaks converging to a vanishing point, warm (tail) vs white (head) | Any specific photo | Emissive tubes + UV-scrolling gradient in real time | Fewer, thicker trails | Cheap (additive unlit geometry) |
| 7 | FHWA "Highway Gothic" road-sign lettering / Overpass typeface | Typography | Road signs are real-world **spatial typography**: set on panels in 3D space, read at speed | Green sign panels, white condensed caps, route numbers | Actual MDOT sign layouts or shields | **Overpass** (SIL OFL, derived from Highway Gothic) on canvas textures | Signs larger, fewer per frame | Canvas textures ≤ 1024 px |
| 8 | Night-driving cinema (e.g. *Drive*, 2011; *Collateral*, 2004) | Film / grading | Sodium-orange streetlight vs cyan shadow grading, lens-level light flares, calm speed | Split-tone grade, slow dolly at speed, lights passing across the lens as cuts | Titles, pink script type, footage | Tone mapping + fog + grade in the post pass | Grade kept, flares reduced | One cheap grading pass |

Also consulted and **not used**: Detroit agency directories (Clutch, DesignRush) for positioning. They're generic claim-led listings.

## Synthesis

Adopted (each with its ElaSystems translation):
1. **One persistent world, camera-led** (igloo) → one continuous night road. The camera drives it, and nothing resets between clients.
2. **Portfolio as a place** (bruno-simon) → each client is a *lit storefront on its real road*, not a thumbnail. You can't drive a toy car. The scroll is the drive.
3. **Lit window as the story light** (Hopper) → the client's real website is the light source inside each storefront. The street is dark until a system turns it on.
4. **Light trails = speed stripes** (long exposure) → traffic is drawn as the logo's three gold stripes. It literalizes the owner's line "traffic problem vs system problem".
5. **Road signs as spatial typography** (Highway Gothic → Overpass) → real road names from client addresses (W Warren Ave, Ford Rd, Middlebelt Rd, Plymouth Rd, Monroe St) on sign panels in the world.
6. **Sodium/cyan night grade** (night cinema) → warm streetlight pools vs deep navy shadow (the brand navy), gold as the only saturated brand color in the frame.

Rejected:
- Particle haze, glowing orbs, abstract emblem floating in a void (activetheory): generic and meaningless for a web studio.
- Physics play / drivable vehicle (bruno-simon): delays the business decision; can't reverse deterministically.
- Video reels as hero (lusion, activetheory): 4–18 MB, and ElaSystems has no footage.
