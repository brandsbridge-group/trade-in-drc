import type { MetadataRoute } from "next";
import { SITE_URL } from "@/app/sitemap";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Authenticated and privileged areas must never be indexed.
      disallow: ["/dashboard", "/admin", "/api"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
