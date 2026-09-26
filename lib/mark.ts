// Geometry of the ES mark (viewBox 10 20 660 400), measured from the brand board reconstruction.
// The three bars of the E are the three pillars; the S is what they open into.
export const MARK = { x: 10, y: 20, w: 660, h: 400 };

// bar boxes in mark units + the x of the top-left corner inside the box (the slant), all ends cut ~0.6 run/rise
export const BARS = [
  { x: 26, y: 65, w: 339, h: 60 },
  { x: 26, y: 198, w: 266.5, h: 60 },
  { x: 26, y: 322, w: 199.1, h: 60 },
];

// the slash: centre, length and angle (clockwise from vertical)
export const SLASH = { cx: 295.5, cy: 220, len: 455.6, angle: 28.6, thick: 4 };

// S outline and the bounding box used to cut it into tiles
export const S_PATH =
  'M652 65H426.5A96.5 96.5 0 0 0 426.5 258H548A32 32 0 0 1 548 322H254.9L222.2 382H548A92 92 0 0 0 548 198H426.5A36.5 36.5 0 0 1 426.5 125H605Z';
export const S_BOX = { x: 222, y: 65, w: 430, h: 317 };
export const TILE_COLS = 6;
export const TILE_ROWS = 4;

export type Rect = { x: number; y: number; w: number; h: number };

// place the mark centred in the viewport and return a mapper from mark units to screen px
export function markFrame(vw: number, vh: number) {
  const w = Math.min(vw * (vw < 700 ? 0.78 : 0.44), 640);
  const s = w / MARK.w;
  const h = MARK.h * s;
  const x0 = (vw - w) / 2, y0 = (vh - h) / 2 - vh * 0.04;
  const map = (r: Rect): Rect => ({ x: x0 + (r.x - MARK.x) * s, y: y0 + (r.y - MARK.y) * s, w: r.w * s, h: r.h * s });
  return { x0, y0, w, h, s, map };
}

// the hub: the E's bars become three gateways (same proportions, 1 : .76 : .54), the S becomes the preview window
export function hubFrame(vw: number, vh: number) {
  const mobile = vw < 900;
  if (mobile) {
    const gut = Math.max(18, vw * 0.05);
    const W = vw - gut * 2;
    const H = Math.min(78, vh * 0.1);
    const gap = H * 0.62;
    const top = Math.max(236, vh * 0.3);
    const bars = [1, 0.89, 0.78].map((k, i) => ({ x: gut, y: top + i * (H + gap), w: Math.max(W * k, Math.min(272, W)), h: H }));
    const panel = { x: gut, y: top + 3 * H + 2 * gap + 34, w: W, h: Math.min(vh - (top + 3 * H + 2 * gap + 34) - 110, W * 0.62), lean: 0 };
    return { mobile, bars, panel, slash: null as null | { x0: number; y0: number; x1: number; y1: number } };
  }
  const gut = Math.min(Math.max(28, vw * 0.045), 72);
  const H = Math.round(Math.min(vh * 0.118, 108, vw * 0.07));
  const gap = Math.round(H * 0.72);
  const EH = 3 * H + 2 * gap;
  const top = Math.max(236, (vh - EH) / 2 + 30);
  const k = Math.tan((28.6 * Math.PI) / 180); // the slash: horizontal run per unit of rise
  // as in the mark, the bar ends step back along the slash, so the E's right edge *is* the slash
  const W1 = Math.min(vw * 0.4, 600);
  const bars = [0, 1, 2].map((i) => ({ x: gut, y: top + i * (H + gap), w: W1 - i * (H + gap) * k, h: H }));
  const y0 = top - H * 0.55, y1 = Math.min(top + EH + H * 0.55, vh - 140); // the window stops above the CTA
  const xAt = (y: number) => gut + W1 + 30 - (y - top - H / 2) * k;
  const slash = { x0: xAt(y0), y0, x1: xAt(y1), y1 };
  // the window (where the S was): its left edge runs parallel to the slash
  const inset = 30, pr = vw - gut;
  const px = xAt(y1) + inset;
  const panel = { x: px, y: y0, w: pr - px, h: y1 - y0, lean: (y1 - y0) * k };
  return { mobile, bars, panel, slash };
}
