# World Bible — ElaSystems v2 "Route 313"

> Mode 4 source of truth. Worlds are the **real clients** from BRAND.md, placed on the roads they publish as their
> address. Nothing is invented: no fake clients, no fake addresses, no fake claims. Architecture is illustrated
> (stylized) and labeled as such on the site. Code: `assets/js/world/worlds.js` (records) + preset registries.
> Units: meters. Driving on the right. One persistent scene. The scroll drives the camera along one route curve.

## Route (one continuous road network, stylized, not to scale)

| Seg | Road (sign text) | From → To (x, z) | Heading | Stop on the right |
|---|---|---|---|---|
| A | W WARREN AVE | (0, 0) → (0, −260) | −Z | dark storefront @ z −20 · **Family Bakery** @ z −170 |
| B | FORD RD | (0, −260) → (220, −260) | +X | **Creative Style** @ x 120 |
| C | DEARBORN (city sign, no street: pop-up) | (220, −260) → (220, −470) | −Z | **Big Wiss Matcha** lot @ z −370 |
| D | MIDDLEBELT RD | (220, −470) → (440, −470) | +X | **The Snug Mug** @ x 340 |
| E | PLYMOUTH RD | (440, −470) → (440, −680) | −Z | **Bounce It Up** @ z −580 (set back) |
| F | I-75 S (highway) | (440, −680) → (900, −680) | +X | **313 Apparel** billboard @ x 560 · gantry "TOLEDO" @ x 760 |
| G | MONROE ST | (900, −680) → (900, −860) | −Z | **D'Moda Shoes** mall entrance @ z −780 |

Corners are rounded (radius 16). Every road name and place comes from a client address (BRAND.md), except "I-75 S"
(the real interstate from Detroit to Toledo) and "DEARBORN" (Big Wiss publishes the city, not a street).

## Arc and editing timeline (desktop; mobile compresses holds, see STORYBOARD.md)

| # | World / scene (code label) | Progress | Arc stage | Transition out (physical event) |
|---|---|---|---|---|
| 0 | `entry`: dark storefront, traffic | 0.000–0.040 | curiosity | camera pulls off the curb into the lane |
| 1 | `system`: gold trails merge, drive starts | 0.040–0.085 | introduction | acceleration down W Warren |
| 2 | `bakery`: Family Bakery switches on | 0.085–0.190 | discovery | right turn at the Ford Rd light |
| 3 | `barber`: Creative Style | 0.190–0.300 | discovery | left turn, city-limit sign DEARBORN |
| 4 | `popup`: Big Wiss Matcha | 0.300–0.405 | discovery | right turn onto Middlebelt |
| 5 | `cafe`: The Snug Mug | 0.405–0.510 | transformation (warmth → energy) | left turn onto Plymouth |
| 6 | `funpark`: Bounce It Up | 0.510–0.610 | transformation (energy peak) | on-ramp: camera drops, FOV widens |
| 7 | `billboard`: 313 Apparel on I-75 | 0.610–0.700 | spectacle (speed) | trails thicken; the gantry passes overhead |
| 8 | `mall`: D'Moda Shoes, Toledo | 0.700–0.800 | spectacle (arrival) | the camera cranes up out of the street |
| 9 | `collection`: aerial route | 0.800–0.890 | choice | aerial glide back to W Warren, descent |
| 10 | `commerce`: your storefront switches on | 0.890–1.000 | action | the world dims under the DOM services/contact |

## Continuity plan

- **The three gold light trails** (the mark's speed stripes = traffic) persist from `entry` to `commerce`. They run
  the entire route, slow near every stop (dash speed ×0.35) and speed up on I-75 (×2.2). In `collection` they read as
  one gold line tracing the route from above.
- **The road** never ends. Turns happen at intersections with a working traffic light (green for us).
- **The dark storefront** from `entry` returns in `commerce`, the same object, now switched on in ES gold. It's the bookend.
- **Light rig**: one warm key + one sign light travel with the active world and re-tint. Only the active ±1 worlds
  are lit, so the street behind returns to darkness (the system is the light).

## Worlds

Common to every client world: the storefront switches on as the camera brakes (window 0 → 1 over ~0.012
progress, a short ramp, **no strobing**); the client's site pans slowly inside the window; the name sits on the sign
in the client's own typeface; the road name is painted on the asphalt before the stop (road-marking type);
the DOM panel shows address, what was built, and "Visit site".

### World 0/1: `entry` + `system`
| Field | Desktop | Mobile |
|---|---|---|
| Story role | the problem: traffic passes, nobody stops | same |
| Emotion | quiet recognition | same |
| Palette | night navy #050B16, sodium streetlight #FFC98A pools, ES gold trails #E3A02A | same |
| Hero object | unnamed dark storefront (blank sign, black glass) at z −20 | same |
| Foreground | curb edge, wet reflections | curb, cropped |
| Midground | the dark storefront, right of center, 3/4 view | storefront fills the lower half |
| Background | streetlight rhythm into fog, trails into the vanishing point | same, fewer lights |
| Lighting | streetlights only (warm), moon fill (steel blue, 0.08) | same |
| Camera | parked at the curb (5.2, 1.3, 2) → target (1.5, 2.0, −55), vFOV 40 → pulls into lane (1.8 offset) and drives | (4.6, 1.6, 4) → vFOV 58, storefront lower-right |
| Typography | DOM H1 two beats (owner's line) on the left third | H1 top third, left |
| Transition out | acceleration; trails swing into our lane | same |
| Ambient | trails flow, puddle shimmer | trails only |
| Tech | realtime | realtime, no reflector |

### World 2: `bakery` (Family Bakery, 17032 W Warren Ave, Detroit)
| Field | Desktop | Mobile |
|---|---|---|
| Story role | first system switching on: warmth, family, since 1995 | same |
| Emotion | warmth, appetite | same |
| Palette | cream #FFF6E3 window glow, oven orange #C85F2A key, brown #4A302D awning stripe | same |
| Architecture | two-story brick storefront, striped canvas awning, wide window | same model |
| Signature prop | awning (stripes cream/brown); oven-warm interior glow breathing ±6% over 5 s | same |
| Window content | site capture, **alternating English ↔ Arabic (RTL) versions** every 6 s (real feature) | phone captures EN/AR |
| Sign | "FAMILY BAKERY" in Bebas Neue, cream on brown | same |
| Lighting | key 2700 K orange from the window spilling onto the sidewalk; streetlights dim | same |
| Camera | brakes 12 m before, pans right 62°, slight push-in, vFOV 38 | pans 80°, window fills 70% width |
| Typography | road marking "W WARREN" on asphalt; DOM panel left | panel bottom |
| Transition in / out | brake / accelerate → right turn under a green light | same |
| Tech | realtime; 2 textures (EN, AR) | 2 phone textures |

### World 3: `barber` (Creative Style, 22140 Ford Rd, Dearborn Heights)
Glass-box single-story unit with a tall clear window, **cool 5000 K fluorescent** interior (greenish-white, #DDEBE2),
green #2F6A47 sign band, "Creative Style" in **Syne**, and a **barber pole** spinning beside the door (the ambient
signature). Window: the lookbook site. Camera pans right 58°, lower angle (1.1 m) for a bolder glass box. Out: left
turn; a green "DEARBORN" city-limit sign passes.

### World 4: `popup` (Big Wiss Matcha, Dearborn pop-up)
No building: an **open lot with a pop-up canopy** (deep green #2D5A3D fabric), **string lights** in a catenary
(warm bulbs, gentle 0.6° sway), a folding table with three matcha-green cups (#7DCEA0 emissive), and the site on an
**easel display board**. Banner "BIG WISS MATCHA" in **Montserrat 800**. Light: soft green-warm mix, low contrast.
Camera: slower brake, pans 70°, rises to 1.8 m (looking slightly down on the table). Out: right turn onto Middlebelt.

### World 5: `cafe` (The Snug Mug, 6659 Middlebelt Rd, Garden City)
**Corner coffee shop** with a rounded corner and windows on two faces, **honey-amber** light (#B69A3A → #F2C46A), sign
"THE SNUG MUG" in **Anton**, **steam** curling up past the sign (soft animated noise sprite). Espresso-dark trim
(#20120D). Camera pans 55° and holds wider to show the corner. Out: left onto Plymouth, with rising energy.

### World 6: `funpark` (Bounce It Up, 30276 Plymouth Rd, Livonia)
**Big-box building set back** behind a parking apron, **neon outline tubes** in cyan #27F5FF / orange #FF7A00 /
yellow #FFD400 along the roofline and an **inflatable arch** silhouette at the entrance. The neon cycles slowly
(one hue step every 1.6 s, never flashing). Big glass entrance showing the site. Sign "Bounce It Up" in **Fredoka One**.
The camera stays back (wide 46°) to show scale. Out: on-ramp. The camera drops to 1.0 m, FOV widens to 52°, speed up.

### World 7: `billboard` (313 Apparel, online store)
Honest to the business: **no storefront** (it's online). A **freeway billboard** on steel legs beside I-75, lit from
below by two hard floodlights, showing their site (black/cream, the red drop). Label "313apparelmi.com" on the
billboard's lower bar in **Cormorant Garamond**. Speed: trails ×2.2, dense oncoming. The camera looks up 12° as it
passes (low-angle hero, monumental). Out: the "TOLEDO" gantry sign passes overhead, then the exit ramp.

### World 8: `mall` (D'Moda Shoes, Franklin Park Mall, 5001 Monroe St, Toledo)
Arrival spectacle: a **mall entrance**, tall glass atrium, **polished floor** (strongest reflections), crisp white
retail light with **red #D71920** accent uplights on two display plinths, and a black sign band "D'MODA SHOES" in
**Oswald 600**. Window: the online store. The camera glides in slowly and centers symmetrically (the only symmetric
frame of the route). Out: the camera cranes up 40 m.

### World 9: `collection` (aerial)
Top-down-ish (pitch −58°) view of the whole route: dark city blocks, the gold trail tracing every road, seven lit
storefronts as warm points with their names (DOM labels) → *seven businesses, seven systems*. The camera glides back
toward W Warren and descends. Mobile: steeper pitch (−70°), route framed vertically.

### World 10: `commerce` (your storefront)
The dark storefront from `entry`. It **switches on in ES gold**: sign "YOUR BUSINESS" (Overpass 800), window showing a
typographic card "Your storefront's next — Book a Call 313-300-6898" rendered in-world, plus the DOM CTA (text / call /
email). Then the world dims to 25% under the DOM sections (services, why, contact). The trails keep flowing behind.

## Commerce handoff

Pull-back (collection) → the route lines up as a single lit line → the environment simplifies (fog up, lights of past
worlds off) → your storefront → informational type (DOM) → **Book a Call (sms), Call, Email** → services list → footer.
Every link exists in semantic HTML regardless of WebGL.

## World distinctness check (beyond palette, ≥5 each)

| World | Architecture | Light character | Signature prop / ambient | Camera | Type face | Atmosphere |
|---|---|---|---|---|---|---|
| bakery | 2-story brick + awning | 2700 K oven warmth | EN↔AR window swap, glow breathing | pan 62°, eye level | Bebas Neue | warm haze |
| barber | glass box | 5000 K fluorescent | spinning barber pole | low 1.1 m | Syne | crisp, clear |
| popup | open lot + canopy | bulbs + green | string-light sway, cups | high 1.8 m, look down | Montserrat | soft, open sky |
| cafe | rounded corner shop | honey amber | steam | wide corner framing | Anton | steam |
| funpark | set-back big box | neon cycle | neon + inflatable arch | wide 46°, far | Fredoka One | colored glow |
| billboard | freeway billboard | hard floods from below | speed, dense trails | low-angle, looking up | Cormorant Garamond | speed streaks |
| mall | glass atrium | crisp white + red uplights | polished-floor reflections | symmetric glide | Oswald | clean, glossy |

Grayscale test at QA: each hold frame must be identifiable without color (silhouette + light layout).
