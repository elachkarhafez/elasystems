// Motion tokens — docs/creative/MOTION_LANGUAGE.md. "A calm night drive in a heavy, well-tuned car."
export const MOTION = {
  camDamp: 6.5,        // /s exponential damping of camera position + target toward the scroll pose
  fovDamp: 4,
  lookYaw: 2.5,        // deg, pointer "driver's head" budget
  lookPitch: 1.5,
  lookDamp: 3,
  switchRamp: 0.012,   // progress span of a storefront switching on
  signLag: 0.004,      // sign follows the window
  trailCruise: 14,     // m/s
  trailStop: 0.35,     // × near a stop
  trailHighway: 2.2,   // × on I-75
  brakeDip: 0.5,       // deg nose-dip at the end of a drive
};

export const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const smooth = (t) => t * t * (3 - 2 * t);
export const smoothstep = (a, b, v) => smooth(clamp((v - a) / (b - a)));
export const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
export const easeOutQuart = (t) => 1 - Math.pow(1 - t, 4);
// accelerate out of a stop, brake into the next: cubic in-out with a quart settle blended into the last 8%
export const drive = (t) => {
  const a = easeInOutCubic(t);
  const w = smoothstep(0.92, 1, t);
  return lerp(a, easeOutQuart(t), w * 0.35);
};
export const damp = (current, target, lambda, dt) => lerp(current, target, 1 - Math.exp(-lambda * dt));
