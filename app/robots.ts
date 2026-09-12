import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/**
 * robots.txt — previously 404, which meant crawlers had no sitemap pointer at all.
 *
 * `/admin` and `/api` are disallowed because neither belongs in an index: admin
 * is behind an auth guard and the API returns JSON. Note this is a crawl hint,
 * not a security control — the auth guard is what protects /admin.
 *
 * `/pricing` redirects to services. `/portfolio` is a public page and is
 * included in the sitemap.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/admin/", "/api/"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
