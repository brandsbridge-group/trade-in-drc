import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
  // The staff back-office moved from /admin to /console (2026-09-30) so "admin"
  // is free to mean a company owner. Old bookmarks and links keep working.
  async redirects() {
    return [
      {
        source: "/:locale(en|fr|tr|es|zh)/admin/:path*",
        destination: "/:locale/console/:path*",
        permanent: true,
      },
      { source: "/admin/:path*", destination: "/console/:path*", permanent: true },
    ];
  },
  images: {
    // SVGs are only used for locally-generated company monogram logos under
    // /seed-images/companies/ — see scripts/seed-images/build-logos.ts.
    // CSP below prevents any inline scripts in the rare case a different SVG slips in.
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    // Marketing photos hosted on the project's Vercel Blob store (marketplace
    // direction cards). One exact host — no wildcard.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "gkhs3jykmxksb2uk.public.blob.vercel-storage.com",
        pathname: "/**",
      },
    ],
  },
};

export default withNextIntl(nextConfig);
