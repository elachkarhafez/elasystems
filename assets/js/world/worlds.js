// ProductWorld records — one per REAL client (docs/creative/BRAND.md, WORLD_BIBLE.md).
// Adding a client = adding a record here + its window textures in assets/work/ + an <article> in index.html.
// The engine (timeline.js, storefronts.js) reads only this data.

export const WORLDS = [
  {
    id: 'bakery', label: 'bakery', client: 'Family Bakery', url: 'https://familybakerydetroit.com',
    segment: 'warren', along: 200, setback: 10.2, type: 'brickAwning',
    sign: { text: 'FAMILY BAKERY', font: 'Bebas Neue', weight: 400, fg: '#FFF6E3', bg: '#4A302D', size: 0.78 },
    light: { key: '#FF8A3C', window: '#FFE7C2', temp: 2700, intensity: 26 },
    palette: { accent: '#C85F2A', stripeA: '#F3E3C6', stripeB: '#4A302D', facade: '#3A2019' },
    textures: ['family-bakery-detroit', 'family-bakery-detroit-ar'], swapEvery: 6,
    weight: 1.25,
    cam: { desktop: { lane: 4.6, h: 1.35, fov: 40, before: 15, face: 0.78 }, mobile: { lane: 4.2, h: 1.6, fov: 60, before: 13, face: 0.9 } },
  },
  {
    id: 'barber', label: 'barber', client: 'Creative Style', url: 'https://creativestylewiss.com',
    segment: 'ford', along: 108, setback: 10.2, type: 'glassBox',
    sign: { text: 'Creative Style', font: 'Syne', weight: 800, fg: '#FFFFFF', bg: '#2F6A47', size: 0.62 },
    light: { key: '#CFEFDB', window: '#E6F5EC', temp: 5000, intensity: 22 },
    palette: { accent: '#2F6A47', facade: '#1B2622' },
    textures: ['creative-style-wiss'], weight: 1,
    cam: { desktop: { lane: 4.6, h: 1.2, fov: 40, before: 14, face: 0.78 }, mobile: { lane: 4.2, h: 1.5, fov: 60, before: 12, face: 0.9 } },
  },
  {
    id: 'popup', label: 'popup', client: 'Big Wiss Matcha', url: 'https://bigwissmatcha.com',
    segment: 'dearborn', along: 104, setback: 13, type: 'canopy',
    sign: { text: 'BIG WISS MATCHA', font: 'Montserrat', weight: 800, fg: '#F5F3F0', bg: '#2D5A3D', size: 0.62 },
    light: { key: '#9FE0B8', window: '#E8FFF0', temp: 4200, intensity: 8 },
    palette: { accent: '#7DCEA0', canopy: '#2D5A3D', facade: '#13261A' },
    textures: ['big-wiss-matcha'], weight: 1,
    cam: { desktop: { lane: 4.6, h: 1.8, fov: 42, before: 15, face: 0.74 }, mobile: { lane: 4.2, h: 1.9, fov: 60, before: 13, face: 0.9 } },
  },
  {
    id: 'cafe', label: 'cafe', client: 'The Snug Mug', url: 'https://thesnugmugbyally.com',
    segment: 'middlebelt', along: 112, setback: 10.2, type: 'corner',
    sign: { text: 'THE SNUG MUG', font: 'Anton', weight: 400, fg: '#F6F0E4', bg: '#20120D', size: 0.72 },
    light: { key: '#F2B85A', window: '#FFE6B8', temp: 3000, intensity: 22 },
    palette: { accent: '#B69A3A', facade: '#2A1A12' },
    textures: ['snug-mug'], weight: 1,
    cam: { desktop: { lane: 4.4, h: 1.35, fov: 42, before: 19, face: 0.72 }, mobile: { lane: 4.2, h: 1.55, fov: 60, before: 15, face: 0.9 } },
  },
  {
    id: 'funpark', label: 'funpark', client: 'Bounce It Up', url: 'https://bounceituplivonia.com',
    segment: 'plymouth', along: 108, setback: 26, type: 'bigBox',
    sign: { text: 'Bounce It Up', font: 'Fredoka One', weight: 400, fg: '#F7FBFF', bg: '#06172E', size: 0.7 },
    light: { key: '#27F5FF', window: '#DDFBFF', temp: 6500, intensity: 30, neon: ['#27F5FF', '#FF7A00', '#FFD400'] },
    palette: { accent: '#27F5FF', facade: '#0B1626' },
    textures: ['bounce-it-up'], weight: 1.05,
    cam: { desktop: { lane: 4.2, h: 1.4, fov: 46, before: 24, face: 0.78 }, mobile: { lane: 4.0, h: 1.6, fov: 62, before: 22, face: 0.92 } },
  },
  {
    id: 'billboard', label: 'billboard', client: '313 Apparel', url: 'https://313apparelmi.com',
    segment: 'i75', along: 150, setback: 16, type: 'billboard',
    sign: { text: '313apparelmi.com', font: 'Cormorant Garamond', weight: 600, fg: '#F4EFE7', bg: '#050505', size: 0.6 },
    light: { key: '#FFE9C8', window: '#FFFFFF', temp: 4000, intensity: 34 },
    palette: { accent: '#941018', facade: '#0A0A0A' },
    textures: ['313-apparel'], weight: 0.95, passBy: true,
    cam: { desktop: { lane: 4.9, h: 1.1, fov: 46, before: 34, face: 0.6, lookUp: 6 }, mobile: { lane: 4.9, h: 1.2, fov: 60, before: 34, face: 0.85, lookUp: 6 } },
  },
  {
    id: 'mall', label: 'mall', client: "D'Moda Shoes", url: 'https://dmodashoes.com',
    segment: 'monroe', along: 104, setback: 14, type: 'mall',
    sign: { text: "D'MODA SHOES", font: 'Oswald', weight: 600, fg: '#FFFFFF', bg: '#0B0B0B', size: 0.66 },
    light: { key: '#FFF4E8', window: '#FFFFFF', temp: 5600, intensity: 12, accent: '#D71920' },
    palette: { accent: '#D71920', facade: '#15161A' },
    textures: ['dmoda-shoes'], weight: 1.1,
    cam: { desktop: { lane: 4.4, h: 1.4, fov: 40, before: 26, face: 0.8 }, mobile: { lane: 4.2, h: 1.6, fov: 60, before: 22, face: 0.92 } },
  },
];

// the unnamed dark storefront: hero subject at the start, "your storefront" at the end
export const YOUR_SHOP = {
  id: 'yours', segment: 'warren', along: 78, setback: 10.2, type: 'yours',
  sign: { text: 'YOUR BUSINESS', font: 'Overpass', weight: 800, fg: '#0A0F18', bg: '#E3A02A', size: 0.66 },
  light: { key: '#F4C15A', window: '#FFE3A6', temp: 3200, intensity: 24 },
  palette: { accent: '#E3A02A', facade: '#161B24' },
};
