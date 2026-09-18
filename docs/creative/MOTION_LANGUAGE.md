# Motion Language — ElaSystems v2 "Route 313"

## Personality

**"Motion feels like a calm night drive in a heavy, well-tuned car, because the product is a dependable system:
things accelerate smoothly, brake with weight, settle without bounce, and lights switch on cleanly."**
Heavy/tactile + precise. Never playful-elastic, never twitchy.

## Tokens (CSS `:root` in `assets/css/site.css` + `MOTION` in `assets/js/world/motion.js`)

| Token | Value | Notes |
|---|---|---|
| Duration: micro | 120 ms | button press / focus |
| Duration: short | 260 ms | hover, route-strip highlight |
| Duration: medium | 700 ms | DOM text reveals (hero beats, panels) |
| Duration: camera | scroll-scrubbed | camera never time-animates except the ≤2.5° pointer look |
| Ease: DOM enter | `cubic-bezier(.2, .8, .2, 1)` | smooth arrival |
| Ease: DOM exit | `cubic-bezier(.6, 0, .9, .3)` | quick, clean exit |
| Ease: drive (JS) | `easeInOutCubic` between route keys | accelerate out of a stop, brake into the next |
| Ease: brake settle | final 8% of a drive uses `easeOutQuart` blended in | the car "sits down" at the stop |
| Camera damping | position/target λ = 6.5 /s (exponential), FOV λ = 4 /s | weight; converges to the exact scroll pose |
| Pointer look | ±2.5° yaw, ±1.5° pitch, λ = 3 /s | driver's head turn; off on touch |
| Light switch-on | 0 → 1 across 0.012 progress with `smoothstep`, sign 60 ms after window | ballast-like, **no flicker/strobe** |
| Trail speed | 14 m/s cruise, ×0.35 at stops, ×2.2 on I-75 | ambient, time-based |
| Ambient amplitudes | glow breathing ±6% / 5 s; string lights 0.6° / 3.2 s; barber pole 0.5 rev/s; neon hue step 1.6 s; steam rise 0.35 m/s; window site-pan 9 px/s | alive, not busy |
| Stagger (DOM lines) | 90 ms | hero beats, panel lines |

## Grammar per significant motion

| Motion | Anticipation | Action | Impact | Settle | Persistence | Transition | Ambient |
|---|---|---|---|---|---|---|---|
| Camera drive | none | ease-in-out travel | brake: 0.5° nose-dip pitch | damped, no overshoot | road continues | turn at the intersection | pointer look |
| Storefront switch-on | trails slow | window ramps on, sign follows | light spills onto the sidewalk (pool fades in) | glow settles to base | stays lit while in range | dims as the camera leaves (active ±1 rule) | breathing / prop loop |
| Hero line 2 | trails swing into lane | masked line rise | — | — | stays until scrolled | fades as the drive starts | — |
| Crane to collection | brief pitch up | rise + pitch down | — | slow settle | trails remain | descent to your storefront | trails |

## Behaviors by role

| Role | Behavior | Reduced-motion equivalent |
|---|---|---|
| Display type (DOM) | masked line rise, 700 ms, 90 ms stagger, only on hero beats | static |
| Panel text | opacity + 12 px rise tied to scroll progress (not time) | static, always visible in stacked layout |
| Camera | scroll-scrubbed + damped; turns at intersections | no camera: static poster per world |
| Storefront light | scroll-driven switch-on | lit poster |
| Traffic trails | continuous, speed by context | frozen (a long-exposure still) |
| UI hover | underline draw / gold fill 260 ms | instant |
| Route strip | active stop dot fills gold | same |

## Never

- Strobing or flashing (>3 per second), hard light flicker.
- Bouncy springs/overshoot, camera shake beyond the 0.5° brake dip.
- Idle camera orbit; random parallax; fade-up on every element.
- Time-based camera moves that fight the scroll.
