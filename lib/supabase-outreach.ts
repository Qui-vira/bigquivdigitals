/**
 * supabase-outreach.ts — the graph/outreach lead pipeline, now served by Neon.
 *
 * ⚠ THIS NO LONGER TALKS TO SUPABASE. The name and the export are kept so the
 * 11 call sites (9 admin pages under /admin/graph, /admin/outreach, and
 * app/admin/actions/graph.ts) did not have to change. Rewriting 47 query chains
 * by hand is where a working dashboard gets broken.
 *
 * WHY: the owner moved off Supabase. This was the last thing still on it —
 * 18 objects and 4,363 rows, copied to Neon and row-count verified on
 * 2026-09-08. The course surfaces went the same way on 2026-08-16; see
 * ./neon.ts, which this file mirrors deliberately.
 *
 * ⚠ The repo's scripts/*_schema.sql files were OLDER than the live Supabase
 * tables. The first copy silently dropped 16 columns, 13 of them on graph_leads
 * including email, full_name, website and raw_json. Types were taken from
 * Supabase's own OpenAPI spec instead. Do not trust those .sql files as the
 * schema of record.
 *
 * The builder in ./pg-client supports the query shapes these files use. If you
 * need an operator it does not have, add it there — it throws rather than
 * silently falling back to something wrong.
 *
 * TO ROLL BACK: restore this file and ./supabase-outreach-admin.ts from git.
 * Nothing was deleted from Supabase.
 */
import { createPgClient } from "./pg-client";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LooseClient = any;

let _client: LooseClient | null = null;

export function getOutreachSupabase(): LooseClient {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set (Neon). Add it to .env.local and Vercel.");
  }
  if (!_client) _client = createPgClient();
  return _client;
}
