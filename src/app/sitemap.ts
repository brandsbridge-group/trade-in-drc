import type { MetadataRoute } from "next";
import { locales, defaultLocale } from "@/config/locales";

const DEFAULT_SITE_URL = "https://tradeindrc.com";

/**
 * Canonical absolute origin for the portal, used by sitemap, robots, and
 * per-locale metadata alternates. Configure via NEXT_PUBLIC_SITE_URL in the
 * deployment environment; falls back to the production domain.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? DEFAULT_SITE_URL
).replace(/\/$/, "");

// Public, statically-known routes that should be indexed. Dynamic detail
// pages (companies/[id], products/[id], data-hub reports) are intentionally
// excluded here — they are best surfaced via on-page links and can be added
// to a dedicated dynamic sitemap later if needed.
const PUBLIC_PATHS = [
  "",
  "about",
  "products",
  "companies",
  "opportunities",
  "sectors",
  "news",
  "events",
  "contact",
  "faq",
  "blog",
  "data-hub",
  "terms",
  "privacy",
  "cookies",
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return PUBLIC_PATHS.flatMap((path) =>
    locales.map((locale) => {
      const suffix = path ? `/${path}` : "";
      return {
        url: `${SITE_URL}/${locale}${suffix}`,
        lastModified,
        alternates: {
          languages: Object.fromEntries([
            ...locales.map((l) => [l, `${SITE_URL}/${l}${suffix}`]),
            ["x-default", `${SITE_URL}/${defaultLocale}${suffix}`],
          ]),
        },
      };
    }),
  );
}
