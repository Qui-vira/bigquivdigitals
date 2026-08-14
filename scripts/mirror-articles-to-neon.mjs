/**
 * Copy `cta_documents` from Supabase into the Neon mirror.
 *
 * WHY THIS EXISTS
 *
 * The articles behind /articles and /doc/[slug] live in the Supabase project
 * `bnoqtghdptobbtrssmdj` (the bots project). On 2026-08-14 that project's REST
 * API started returning:
 *
 *   HTTP 402 — Service for this project is restricted due to the following
 *   violations: exceed_egress_quota
 *
 * The quota is ORG level, so both Supabase projects go down together, and it
 * was burned by trading and scraper tables that have nothing to do with the
 * website. Every article page kept returning HTTP 200 with an empty body,
 * because the page code discarded the query error and rendered `[]`. Twenty
 * five articles — including the 30 Free Ads series, which are lead magnets
 * with CTA keywords attached — were silently dark and nothing alerted.
 *
 * Supabase remains the SOURCE OF TRUTH and the write target, because whatever
 * publishes these articles writes there and lives outside this repo. Neon is a
 * read-only mirror the site falls back to when Supabase will not answer.
 *
 * The site also refreshes the mirror itself on every successful Supabase read,
 * so in normal operation this script is not needed. Run it to seed the mirror,
 * or to force a refresh after a long outage.
 *
 *   node scripts/mirror-articles-to-neon.mjs
 */
import { readFileSync } from "node:fs";
import { neon } from "@neondatabase/serverless";
import { createClient } from "@supabase/supabase-js";

function envVar(name) {
  const line = readFileSync(".env.local", "utf8")
    .split("\n")
    .find((l) => l.startsWith(`${name}=`));
  if (!line) throw new Error(`${name} missing from .env.local`);
  return line.slice(name.length + 1).trim().replace(/^"|"$/g, "");
}

const SUPABASE_URL = "https://bnoqtghdptobbtrssmdj.supabase.co";
const SUPABASE_ANON =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJub3F0Z2hkcHRvYmJ0cnNzbWRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM1OTYwMjQsImV4cCI6MjA4OTE3MjAyNH0.-Jl2_r83rEmKiyWAJOY5MCqPIiateTYYWlcW8bvYTLY";

const sql = neon(envVar("DATABASE_URL"));

await sql`
  create table if not exists cta_documents (
    id uuid primary key default gen_random_uuid(),
    slug text not null unique,
    title text not null,
    content text not null,
    cta_keyword text not null,
    video_title text,
    views integer default 0,
    created_at timestamptz default now(),
    updated_at timestamptz default now(),
    access_code text
  )`;
console.log("neon: cta_documents table ready");

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON);
const { data, error } = await supabase.from("cta_documents").select("*");

if (error) {
  const before = await sql`select count(*)::int as n from cta_documents`;
  console.error(`supabase read failed: ${error.message}`);
  console.error(`mirror left untouched, holding ${before[0].n} articles`);
  process.exit(1);
}

for (const a of data) {
  await sql`
    insert into cta_documents
      (id, slug, title, content, cta_keyword, video_title, views, created_at, updated_at, access_code)
    values
      (${a.id}, ${a.slug}, ${a.title}, ${a.content}, ${a.cta_keyword},
       ${a.video_title}, ${a.views}, ${a.created_at}, ${a.updated_at}, ${a.access_code})
    on conflict (slug) do update set
      title = excluded.title,
      content = excluded.content,
      cta_keyword = excluded.cta_keyword,
      video_title = excluded.video_title,
      views = excluded.views,
      updated_at = excluded.updated_at,
      access_code = excluded.access_code`;
}

const after = await sql`select count(*)::int as n from cta_documents`;
console.log(`mirrored ${data.length} articles, neon now holds ${after[0].n}`);
