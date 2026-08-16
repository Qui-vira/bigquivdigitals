import type { MetadataRoute } from "next";
import { listArticles } from "@/lib/articles-db";
import { SITE_URL } from "@/lib/site";

export const revalidate = 3600;

/**
 * sitemap.xml — previously 404.
 *
 * Static routes are listed explicitly rather than derived from the filesystem,
 * because "the route exists" and "the route belongs in an index" are different
 * questions. Judgement calls, all deliberate:
 *
 *   - /admin/*        excluded, auth-guarded
 *   - /api/*          excluded, not pages
 *   - /portfolio      excluded, 308-redirects to /work — list the destination
 *   - /pricing        excluded, 308-redirects
 *   - /greatwork      excluded ON PURPOSE. The page is BUILT and works; it is
 *                     unlisted until launch day because a live priced page kills
 *                     the waitlist it exists to convert. It also sets
 *                     robots index:false. Add it here when the launch opens.
 *   - /aimastery      excluded ON PURPOSE, same as above. Also BUILT. This one is
 *                     a re-open rather than a launch — people have already bought
 *                     the material — but it must not go live mid-way through The
 *                     Great Work's 30-day arc. One launch at a time, one audience.
 *                     ⚠ Its price is still a PLACEHOLDER. Set it before listing.
 *   - /waitlist       excluded, a form endpoint rather than a page
 *
 * /drone-signup was removed entirely on 2026-08-16. It was Altara Aerial pilot
 * recruitment living in the wrong codebase, and it belongs on that project's own
 * site. Excluding it from the sitemap only hid it; it was still a live public
 * route on bigquivdigitals.com. The drone_pilot_signups table is left in place
 * and holds one row, which is the owner's own test entry.
 *
 * Article slugs come from Supabase. The fetch swallows its own errors and
 * returns [], so an unreachable backend degrades this to the static routes
 * instead of failing the build.
 */

const STATIC_ROUTES: Array<{ path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] }> = [
  { path: "", priority: 1.0, changeFrequency: "weekly" },
  { path: "/services", priority: 0.9, changeFrequency: "monthly" },
  { path: "/work/peaceway", priority: 0.8, changeFrequency: "monthly" },
  { path: "/work/alpha-plays", priority: 0.8, changeFrequency: "monthly" },
  { path: "/work/content-engine", priority: 0.8, changeFrequency: "monthly" },
  { path: "/about", priority: 0.7, changeFrequency: "monthly" },
  { path: "/articles", priority: 0.7, changeFrequency: "weekly" },
  { path: "/contact", priority: 0.6, changeFrequency: "yearly" },
];

async function articleSlugs(): Promise<Array<{ slug: string; updated: Date }>> {
  try {
    const { articles: data } = await listArticles();
    return data
      .filter((d) => Boolean(d?.slug))
      .map((d) => ({ slug: d.slug, updated: new Date(d.created_at ?? Date.now()) }));
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const statics = STATIC_ROUTES.map((r) => ({
    url: `${SITE_URL}${r.path}`,
    lastModified: now,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));

  const articles = (await articleSlugs()).map((a) => ({
    url: `${SITE_URL}/doc/${a.slug}`,
    lastModified: a.updated,
    changeFrequency: "monthly" as const,
    priority: 0.5,
  }));

  return [...statics, ...articles];
}
