// All copy and facts in one place. Client lines are their own published words (captured 2026-09-24/25);
// app and system concepts are labelled as concepts / illustrative data wherever they appear.

export type WorldId = 'websites' | 'apps' | 'systems' | 'contact';

export const CONTACT = {
  phone: '313-300-6898',
  sms: 'sms:+13133006898',
  tel: 'tel:+13133006898',
  email: 'elasystemdesign@gmail.com',
  city: 'Detroit, Michigan',
};

export const PILLARS: { id: Exclude<WorldId, 'contact'>; word: string; line: string; enter: string }[] = [
  { id: 'websites', word: 'Websites', line: 'What your customers see first.', enter: 'Enter websites' },
  { id: 'apps', word: 'Apps', line: 'What they keep in their pocket.', enter: 'Enter apps' },
  { id: 'systems', word: 'Systems', line: 'What runs the business behind it.', enter: 'Enter systems' },
];

export type Site = {
  slug: string;
  name: string;
  kind: string;           // what it is, in plain words
  line: string;           // the client's own headline
  url?: string;           // public domain (only custom domains are linked)
  tint: string;           // scene tint, sampled from the client's site
  ink: string;            // readable accent on the paper world
  story?: boolean;        // scroll-story capture (frames) rather than a tall page
};

export const SITES: Site[] = [
  { slug: 'fudge-fix', name: 'The Fudge Fix', kind: 'Dessert bar & events', line: 'Build your plate.', tint: '#2A1712', ink: '#7A2E2A', story: true },
  { slug: 'dmoda-shoes', name: 'D’Moda Shoes', kind: 'Boutique footwear, online store', line: 'Every outfit begins at the shoes.', url: 'https://dmodashoes.com', tint: '#D71920', ink: '#B3141A' },
  { slug: 'rise', name: 'Rise', kind: 'Coffee, brewed by Detroit Perk', line: 'Coffee. Community. Rise.', tint: '#1A1712', ink: '#8C6A1E', story: true },
  { slug: 'snug-mug', name: 'The Snug Mug', kind: 'Corner coffee shop', line: 'Your new corner coffee shop.', url: 'https://thesnugmugbyally.com', tint: '#B69A3A', ink: '#7C6421' },
  { slug: 'family-bakery', name: 'Family Bakery', kind: 'Middle Eastern bakery, English & Arabic', line: 'Detroit’s family-owned Middle Eastern bakery.', url: 'https://familybakerydetroit.com', tint: '#C85F2A', ink: '#9E4719' },
];

export const MORE_SITES = [
  { slug: 'bounce-it-up', name: 'Bounce It Up', url: 'https://bounceituplivonia.com' },
  { slug: '313-apparel', name: '313 Apparel', url: 'https://313apparelmi.com' },
  { slug: 'big-wiss-matcha', name: 'Big Wiss Matcha', url: 'https://bigwissmatcha.com' },
  { slug: 'creative-style', name: 'Creative Style', url: 'https://creativestylewiss.com' },
];

export const WORLD_COPY = {
  websites: {
    kicker: 'Websites',
    title: 'Designed for the screen it’s opened on.',
    lede: 'Every site is composed twice: for the desk, and for the phone in someone’s hand. Same brand, two different compositions.',
  },
  apps: {
    kicker: 'Apps · concept work',
    title: 'The brand, in their pocket.',
    lede: 'Ordering, drops, loyalty. Three concepts showing how we design apps customers come back to.',
    note: 'Concept work. Screens designed by ElaSystems to show our approach; not shipped apps.',
  },
  systems: {
    kicker: 'Systems',
    title: 'Most businesses don’t have a traffic problem. They have a system problem.',
    lede: 'Behind every good storefront is a system: the dashboards, operations tools and automations that run the business quietly behind the site.',
    note: 'Interfaces recreated for illustration. All figures are sample data.',
  },
  contact: {
    kicker: 'Start here',
    title: 'Start with a message.',
    lede: 'Tell us what the business does and what isn’t working. Quick call, no pressure. Just clarity on how to grow your business.',
  },
};
