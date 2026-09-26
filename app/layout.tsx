import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import './globals.css';
import './styles/stage.css';
import './styles/websites.css';
import './styles/apps.css';
import './styles/systems.css';

const archivo = localFont({
  src: '../public/fonts/archivo-var-latin.woff2',
  variable: '--font-archivo',
  weight: '100 900',
  display: 'swap',
  declarations: [{ prop: 'font-stretch', value: '62% 125%' }],
});
const mono = localFont({
  src: '../public/fonts/jetbrains-mono-var-latin.woff2',
  variable: '--font-mono',
  weight: '100 800',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://elasystems.com'),
  alternates: { canonical: '/' },
  title: 'ElaSystems — Websites, Apps & Systems · Detroit',
  description:
    'A Detroit studio that builds the website your customers see, the apps they carry, and the systems that run the business behind them.',
  openGraph: {
    type: 'website',
    siteName: 'ElaSystems',
    title: 'ElaSystems — Websites. Apps. Systems.',
    description: 'The website your customers see, and the system your business runs on. Detroit, MI.',
    images: [{ url: '/brand/og.jpg', width: 1200, height: 630, alt: 'ElaSystems: the ES mark opening into Websites, Apps and Systems' }],
  },
  twitter: { card: 'summary_large_image' },
  icons: { icon: [{ url: '/favicon.ico' }, { url: '/brand/favicon.svg', type: 'image/svg+xml' }], apple: '/brand/apple-touch-icon.png' },
};

export const viewport: Viewport = { themeColor: '#070B14', width: 'device-width', initialScale: 1, viewportFit: 'cover' };

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'ProfessionalService',
  name: 'ElaSystems',
  url: 'https://elasystems.com/',
  slogan: 'We build digital systems that grow businesses.',
  description: 'Websites, apps and business systems. Detroit, MI.',
  telephone: '+1-313-300-6898',
  email: 'elasystemdesign@gmail.com',
  address: { '@type': 'PostalAddress', addressLocality: 'Detroit', addressRegion: 'MI', addressCountry: 'US' },
  hasOfferCatalog: {
    '@type': 'OfferCatalog',
    name: 'Services',
    itemListElement: ['Websites', 'Apps', 'Business systems'].map((name) => ({ '@type': 'Offer', itemOffered: { '@type': 'Service', name } })),
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${archivo.variable} ${mono.variable}`} suppressHydrationWarning>
      <head>
        {/* motion preference + deep link decided before paint, so the intro never flashes for returning links */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var h=document.documentElement,r=matchMedia('(prefers-reduced-motion: reduce)').matches;h.dataset.motion=r?'reduced':'full';var w=(location.hash||'').slice(1);if(/^(websites|apps|systems|contact)$/.test(w))h.dataset.deep=w;})();`,
          }}
        />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
