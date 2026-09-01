import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
  images: {
    // SVGs are only used for locally-generated company monogram logos under
    // /seed-images/companies/ — see scripts/seed-images/build-logos.ts.
    // CSP below prevents any inline scripts in the rare case a different SVG slips in.
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
};

export default withNextIntl(nextConfig);
