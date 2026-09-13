import { neon } from "@neondatabase/serverless";

/**
 * Articles for /articles, /doc/[slug] and the sitemap. Neon only.
 *
 * ⚠ SUPABASE IS GONE FROM THIS FILE. Owner's decision, 2026-09-13: "i am not
 * using supabase again". This was the last thing in the repo still reading it.
 *
 * Until now Supabase project `bnoqtghdptobbtrssmdj` was the source of truth and
 * Neon was a read-only mirror kept fresh opportunistically. **Neon is now the
 * source of truth.** Verified before the switch: 25 articles on both sides,
 * identical newest timestamp, no slug present on one side and missing from the
 * other. Nothing was lost in the cutover.
 *
 * ⚠ NOTHING HAS PUBLISHED SINCE 2026-05-19. The writer that produced these
 * articles lives outside this repo and wrote to Supabase. It has been silent for
 * roughly four months, which is why cutting the read over is safe today. **If
 * that publisher is ever restarted it must be pointed at Neon**, or it will
 * write somewhere this site no longer reads and the new article will never
 * appear — with no error, because an unseen article and no article look the
 * same from here.
 *
 * ── WHY THE ERROR HANDLING LOOKS PARANOID ───────────────────────────────────
 *
 * On 2026-08-14 Supabase began returning HTTP 402 (egress quota, burned by
 * unrelated trading and scraper tables on the same org). Every article page
 * still returned HTTP 200 with an empty body, because the old code did
 * `const { data } = await ...` then `data ?? []`, discarding the error. All 25
 * articles went dark for days and nothing alerted, because a silent empty list
 * is indistinguishable from "there are no articles".
 *
 * 🛑 SO: A FAILED READ IS NEVER QUIETLY TURNED INTO AN EMPTY LIST. It is logged
 * and reported through `source`, so a caller can tell "nothing published" apart
 * from "could not reach the database". Keep that property in any rewrite.
 *
 * ⚠ `access_code` IS DELIBERATELY NOT SELECTED. `getArticle` used `select("*")`,
 * which pulled that column into a page component for all 25 articles even though
 * nothing renders it. Flagged in the 2026-09-12 security audit. Ask for columns
 * by name; do not reintroduce a star select.
 */

/** Null when DATABASE_URL is absent, so a missing database degrades rather than throws. */
const sql = process.env.DATABASE_URL ? neon(process.env.DATABASE_URL) : null;

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
};

/**
 * Where the data came from. `none` means the read failed.
 *
 * `"mirror"` is kept as the success value rather than renamed to `"neon"` so
 * the two call sites that branch on it keep compiling and keep meaning the same
 * thing: you got articles. Only `"none"` signals trouble.
 */
export type Source = "mirror" | "none";

export async function listArticles(): Promise<{
  articles: ArticleSummary[];
  source: Source;
}> {
  if (!sql) {
    console.error("[articles] DATABASE_URL is not set. Serving nothing.");
    return { articles: [], source: "none" };
  }

  try {
    const rows = await sql`
      select slug, title, cta_keyword, video_title, views, created_at
      from cta_documents
      order by created_at desc`;
    return { articles: rows as ArticleSummary[], source: "mirror" };
  } catch (e) {
    // Logged, never swallowed into an empty list. See the note above.
    console.error("[articles] NEON LIST FAILED:", e);
    return { articles: [], source: "none" };
  }
}

export async function getArticle(
  slug: string
): Promise<{ article: Article | null; source: Source }> {
  if (!sql) {
    console.error("[articles] DATABASE_URL is not set.");
    return { article: null, source: "none" };
  }

  try {
    const rows = await sql`
      select slug, title, content, cta_keyword, video_title, views, created_at
      from cta_documents
      where slug = ${slug}
      limit 1`;
    // A clean miss is a real answer: the caller 404s. Only a thrown query is a
    // failure, and that is the one case that must not look like "no such slug".
    return { article: (rows[0] as Article) ?? null, source: "mirror" };
  } catch (e) {
    console.error(`[articles] NEON READ FAILED for "${slug}":`, e);
    return { article: null, source: "none" };
  }
}
