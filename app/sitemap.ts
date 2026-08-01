import type { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";
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
 *   - /course         excluded, currently 404s (A6 not built)
 *   - /drone-signup   excluded, an unrelated project living in this codebase
 *   - /waitlist       excluded, a form endpoint rather than a page
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
    const supabase = createClient(
      process.env.SUPABASE_URL ?? "https://bnoqtghdptobbtrssmdj.supabase.co",
      process.env.SUPABASE_ANON_KEY ?? ""
    );
    const { data, error } = await supabase
      .from("cta_documents")
      .select("slug, created_at")
      .order("created_at", { ascending: false });
    if (error || !data) return [];
    return data
      .filter((d): d is { slug: string; created_at: string } => Boolean(d?.slug))
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
