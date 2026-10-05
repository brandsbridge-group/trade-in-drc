import type { MetadataRoute } from "next";
import { SITE_URL } from "@/app/sitemap";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Authenticated and privileged areas must never be indexed. Pages live
      // under a locale prefix (/fr/dashboard), hence the /*/ variants; /admin
      // is the pre-2026-09-30 name of /console, kept until links age out.
      disallow: [
        "/dashboard",
        "/*/dashboard",
        "/console",
        "/*/console",
        "/admin",
        "/*/admin",
        "/api",
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
