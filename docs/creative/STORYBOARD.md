# Storyboard — ElaSystems v2 "Route 313"

> Scene-level direction. World details live in WORLD_BIBLE.md; timings/labels match `assets/js/world/timeline.js`.
> Scroll length: desktop track = 1400 vh, mobile = 900 vh (64%). Same labels, same progress keys.

## Overview

| # | Scene (label) | Progress | Purpose | Rendering |
|---|---|---|---|---|
| 0 | entry | 0.000–0.040 | the problem | realtime + DOM H1 beat 1 (poster = LCP) |
| 1 | system | 0.040–0.085 | ElaSystems = the system | realtime + H1 beat 2 |
| 2–8 | bakery → mall | 0.085–0.800 | the seven lit businesses | realtime + DOM stop panels |
| 9 | collection | 0.800–0.890 | range, choice | realtime aerial + DOM line |
| 10 | commerce | 0.890–1.000 | action | realtime + DOM CTA, then DOM sections |

## Scene 0: entry
| Field | Desktop | Mobile |
|---|---|---|
| Visitor emotion | recognition | same |
| Eye path | H1 (left third) → dark storefront (right third) → gold trails into the vanishing point → CTA | H1 (top) → storefront (middle) → CTA (bottom) |
| Object state | storefront dark, sign blank; trails flowing | same |
| Camera | parked curb (5.2, 1.3, 4) → target (1.2, 2.1, −60), vFOV 40 | (4.6, 1.6, 6) → target (3.0, 2.2, −40), vFOV 58 |
| Text | eyebrow "ElaSystems · Websites, apps & advertising · Detroit"; H1 "Most businesses don't have a traffic problem."; CTA "Book a Call — 313-300-6898" + "Take the drive" | same, H1 wraps to 4 lines |
| Transition out | scroll 0→0.04: nothing moves but beat 2 prepares; at 0.04 the camera pulls out | same |
| Reverse | exact: pose is a pure function of p | same |
| Reduced motion | poster `entry` + H1 both beats visible | poster `entry-m` |

## Scene 1: system
Beat 2 "They have a system problem." rises (700 ms, masked) when p ≥ 0.02. The camera leaves the curb (lateral 5.2 → 1.8
by p 0.07) and accelerates. The gold trails pass the camera on the right. The hero CTA fades by p 0.06 (the nav CTA stays).

## Scenes 2–8: stops (common grammar)
- **Drive in** (first 45% of the scene range): easeInOutCubic along the route; road marking with the road name passes under the camera.
- **Brake + switch-on** (at 45–55%): the window ramps on, the sign follows, and the light pool spreads on the sidewalk. The camera
  pans to face the storefront (weight 0 → 1) and shifts toward the curb (lane 1.8 → 3.4).
- **Hold** (55–85%): the DOM panel is visible (opacity by progress), ambient runs, the site pans in the window.
- **Drive out** (85–100%): the pan weight returns to 0 and the car accelerates into the turn.
- Mobile: pan weight 1 means the camera faces the storefront square-on, and the window (phone capture) fills ~70% of the width.

## Scene 9: collection
Crane: the camera rises to ~140 m over the route midpoint and pitches −58° (mobile −70°). Past worlds relight at 60%
so the route reads as seven warm points on one gold line. DOM: "Seven businesses. Seven systems." with stop labels.

## Scene 10: commerce
Descent to the hero curb pose, now facing your storefront (the entry object). The gold switch-on and the in-world
window card "Your storefront's next." appear. The DOM CTA block appears: Book a Call (sms), Call, Email. After p = 1 the DOM
sections (services, why, contact, footer) scroll over the dimmed world.

## Reverse-scroll rule
No scene holds hidden state: switch-on, pan weight, FOV, lane offset, route distance and panel opacity are all
functions of p. Time-based ambient (trails, steam, pole) is the only non-deterministic layer and never changes the
composition.
