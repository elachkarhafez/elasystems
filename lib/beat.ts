// The heartbeat: one clock for everything gold that breathes (the marble veins, the gateways, the core).
// A slow lub-dub every 1.6 s; returns 0..1.
export const BEAT_PERIOD = 1.6;

const pulse = (x: number, at: number, w: number) => Math.exp(-(((x - at) / w) ** 2));

export function beat(seconds: number) {
  const x = seconds % BEAT_PERIOD;
  // lub, dub, and the tail of the previous lub wrapping around
  return Math.min(1, pulse(x, 0.08, 0.075) + 0.62 * pulse(x, 0.34, 0.09) + pulse(x, BEAT_PERIOD + 0.08, 0.075));
}
