/** @type {import('next').NextConfig} */
// STATIC_EXPORT=1: a static build for GitHub Pages (elasystems.com). The contact API route (route.ts) is left out
// (pageExtensions) and the form hands the written message to SMS / email instead (NEXT_PUBLIC_FORM=handoff).
const staticExport = process.env.STATIC_EXPORT === '1';
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: { unoptimized: true },
  ...(staticExport
    ? { output: 'export', pageExtensions: ['tsx'], env: { NEXT_PUBLIC_FORM: 'handoff' } }
    : {
        async headers() {
          return [{ source: '/work/:path*', headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }] }];
        },
      }),
};
export default nextConfig;
