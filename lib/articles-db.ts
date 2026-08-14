import { createClient } from "@supabase/supabase-js";
import { neon } from "@neondatabase/serverless";

/**
 * Articles for /articles, /doc/[slug] and the sitemap.
 *
 * ── WHY THERE ARE TWO DATABASES ─────────────────────────────────────────────
 *
 * Supabase project `bnoqtghdptobbtrssmdj` (the bots project) is the SOURCE OF
 * TRUTH. Whatever publishes these articles writes there and lives outside this
 * repo, so this file must never stop reading it or new articles would silently
 * never appear.
 *
 * Neon is a READ-ONLY MIRROR, used only when Supabase will not answer.
 *
 * On 2026-08-14 Supabase started returning:
 *
 *   HTTP 402 — Service for this project is restricted due to the following
 *   violations: exceed_egress_quota
 *
 * The quota is ORG level, so both Supabase projects fail together, and it was
 * burned by trading and scraper tables unrelated to the website. Every article
 * page kept returning HTTP 200 with an empty body, because the old code did
 * `const { data } = await ...` and then `data ?? []`, discarding the error. All
 * 25 articles — including the 30 Free Ads series, which are lead magnets with
 * CTA keywords attached — were dark, and nothing alerted, because a silent
 * empty list is indistinguishable from "there are no articles".
 *
 * Two rules follow, and both matter more than the fallback itself:
 *
 *   1. A failed read is never quietly turned into an empty list. It is logged
 *      as an error and reported through `source`, so a caller can tell
 *      "nothing published" apart from "could not reach the database".
 *   2. The mirror is refreshed opportunistically from live Supabase reads, so
 *      it cannot rot into serving year-old copies.
 *
 * To force a full refresh: node scripts/mirror-articles-to-neon.mjs
 */

const SUPABASE_URL = "https://bnoqtghdptobbtrssmdj.supabase.co";
/** Anon key. Public by design, and already in the client bundle. */
const SUPABASE_ANON =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJub3F0Z2hkcHRvYmJ0cnNzbWRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM1OTYwMjQsImV4cCI6MjA4OTE3MjAyNH0.-Jl2_r83rEmKiyWAJOY5MCqPIiateTYYWlcW8bvYTLY";

export const articlesDb = createClient(SUPABASE_URL, SUPABASE_ANON);

/** Null when DATABASE_URL is absent, so a missing mirror degrades rather than throws. */
const mirror = process.env.DATABASE_URL
  ? neon(process.env.DATABASE_URL)
  : null;

export type ArticleSummary = {
  slug: string;
  title: string;
  cta_keyword: string | null;
  video_title: string | null;
  views: number | null;
  created_at: string;
};

export type Article = ArticleSummary & {
  content: string;
  access_code: string | null;
};

/** Where the data actually came from. `none` means BOTH stores failed. */
export type Source = "supabase" | "mirror" | "none";

const LIST_COLUMNS = "slug, title, cta_keyword, video_title, views, created_at";

/* ──────────────────────────────────────────────────────────────────────────
   Listing
   ────────────────────────────────────────────────────────────────────────── */

export async function listArticles(): Promise<{
  articles: ArticleSummary[];
  source: Source;
}> {
  try {
    const { data, error } = await articlesDb
      .from("cta_documents")
      .select(LIST_COLUMNS)
      .order("created_at", { ascending: false });

    if (!error && data) {
      // Metadata only — the list query does not fetch `content`, so this
      // refreshes titles and view counts without touching article bodies.
      void refreshMirrorMetadata(data as ArticleSummary[]);
      return { articles: data as ArticleSummary[], source: "supabase" };
    }
    console.error(
      `[articles] supabase list failed: ${error?.message ?? "no data"} — falling back to mirror`
    );
  } catch (e) {
    console.error("[articles] supabase list threw, falling back to mirror:", e);
  }

  if (!mirror) {
    console.error("[articles] NO MIRROR: DATABASE_URL is not set. Serving nothing.");
    return { articles: [], source: "none" };
  }

  try {
    const rows = await mirror`
      select slug, title, cta_keyword, video_title, views, created_at
      from cta_documents
      order by created_at desc`;
    console.warn(`[articles] served ${rows.length} articles from the Neon mirror`);
    return { articles: rows as ArticleSummary[], source: "mirror" };
  } catch (e) {
    console.error("[articles] MIRROR ALSO FAILED:", e);
    return { articles: [], source: "none" };
  }
}

/* ──────────────────────────────────────────────────────────────────────────
   Single article
   ────────────────────────────────────────────────────────────────────────── */

export async function getArticle(
  slug: string
): Promise<{ article: Article | null; source: Source }> {
  try {
    const { data, error } = await articlesDb
      .from("cta_documents")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();

    if (!error) {
      // A clean "no such slug" is a real answer, not a failure. Return it
      // rather than falling through, so a deleted article 404s instead of
      // being resurrected from the mirror forever.
      if (data) void refreshMirrorArticle(data as Article);
      return { article: (data as Article) ?? null, source: "supabase" };
    }
    console.error(
      `[articles] supabase read of "${slug}" failed: ${error.message} — falling back to mirror`
    );
  } catch (e) {
    console.error(`[articles] supabase read of "${slug}" threw:`, e);
  }

  if (!mirror) {
    console.error("[articles] NO MIRROR: DATABASE_URL is not set.");
    return { article: null, source: "none" };
  }

  try {
    const rows = await mirror`select * from cta_documents where slug = ${slug} limit 1`;
    if (rows.length) console.warn(`[articles] served "${slug}" from the Neon mirror`);
    return { article: (rows[0] as Article) ?? null, source: "mirror" };
  } catch (e) {
    console.error(`[articles] MIRROR ALSO FAILED for "${slug}":`, e);
    return { article: null, source: "none" };
  }
}

/* ──────────────────────────────────────────────────────────────────────────
   Mirror upkeep. Never throws, never blocks a response.
   ────────────────────────────────────────────────────────────────────────── */

async function refreshMirrorMetadata(rows: ArticleSummary[]) {
  if (!mirror || rows.length === 0) return;
  try {
    for (const r of rows) {
      await mirror`
        update cta_documents
        set title = ${r.title},
            cta_keyword = ${r.cta_keyword},
            video_title = ${r.video_title},
            views = ${r.views}
        where slug = ${r.slug}`;
    }
  } catch {
    // A stale mirror is survivable; a request that fails because the mirror
    // could not be updated is not.
  }
}

async function refreshMirrorArticle(a: Article) {
  if (!mirror) return;
  try {
    await mirror`
      insert into cta_documents
        (slug, title, content, cta_keyword, video_title, views, created_at, updated_at, access_code)
      values
        (${a.slug}, ${a.title}, ${a.content}, ${a.cta_keyword}, ${a.video_title},
         ${a.views}, ${a.created_at}, now(), ${a.access_code})
      on conflict (slug) do update set
        title = excluded.title,
        content = excluded.content,
        cta_keyword = excluded.cta_keyword,
        video_title = excluded.video_title,
        views = excluded.views,
        updated_at = excluded.updated_at,
        access_code = excluded.access_code`;
  } catch {
    /* see above */
  }
}
