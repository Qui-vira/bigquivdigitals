/**
 * supabase.ts — the content-engine course surfaces, now served by Neon.
 *
 * ⚠ THESE NO LONGER TALK TO SUPABASE. The names are kept so the call sites
 * (both payment webhooks, flutterwave verify, the Telegram course gate, waitlist,
 * admin sweep, update-student, the students page) did not have to change.
 * Rewriting payment webhooks by hand is where money gets lost.
 *
 * There were nine. The ninth was /api/drone-signup, removed on 2026-08-16 —
 * Altara Aerial pilot recruitment that had no business on this site.
 *
 * WHY: content-engine shares a Supabase org with the trading and scraper tables,
 * so its egress quota gets burned by unrelated work. When it trips, the REST API
 * returns 402 and every course surface fails at once — and because a blocked read
 * and an empty table look identical through `data ?? []`, it fails silently.
 * Neon carries the same rows; counts verified identical on 2026-08-16
 * (course_purchases 40, course_waitlist 1, drone_pilot_signups 1, prospects 42).
 *
 * The builder in ./pg-client supports exactly the query shapes those files use.
 * If you need an operator it does not have, add it there — it throws rather than
 * silently falling back to something wrong.
 *
 * TO ROLL BACK: restore this one file from git. Nothing else changed.
 */
import { createPgClient } from "./pg-client";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LooseClient = any;

let _client: LooseClient | null = null;

function client(): LooseClient {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set (Neon). Add it to .env.local and Vercel.");
  }
  if (!_client) _client = createPgClient();
  return _client;
}

export function getSupabase(): LooseClient {
  return client();
}

/**
 * Server-only. Kept as a separate export so call sites read the way they did,
 * but both reach the same Neon connection — Postgres does not split credentials
 * by role the way Supabase anon/service keys do.
 */
export function getSupabaseAdmin(): LooseClient {
  return client();
}
