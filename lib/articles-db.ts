import { createClient } from "@supabase/supabase-js";

/**
 * The Supabase project that holds `cta_documents` — the articles behind
 * /articles and /doc/[slug].
 *
 * NOTE: this is the BOTS project (`bnoqtghdptobbtrssmdj`), not the website's
 * own Turso database and not the content-engine Supabase project. Check which
 * one you are pointed at before running anything against it.
 *
 * The URL and anon key are hardcoded rather than read from the environment
 * because `app/articles/page.tsx` and `app/doc/[slug]/page.tsx` already do
 * exactly that, and the sitemap silently produced zero article URLs when it
 * tried `process.env` instead — those vars are not set in the Vercel
 * production environment. An anon key is public by design; it is already in
 * the client bundle.
 *
 * KNOWN DUPLICATION: the same literals still sit inline in the two page files.
 * Folding them onto this module is a tidy-up worth doing, but it touches two
 * working pages and was left out of the SEO change deliberately.
 */
export const articlesDb = createClient(
  "https://bnoqtghdptobbtrssmdj.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJub3F0Z2hkcHRvYmJ0cnNzbWRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM1OTYwMjQsImV4cCI6MjA4OTE3MjAyNH0.-Jl2_r83rEmKiyWAJOY5MCqPIiateTYYWlcW8bvYTLY"
);
