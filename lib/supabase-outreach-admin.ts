/**
 * supabase-outreach-admin.ts — service-role client for the graph/outreach tables.
 *
 * ⚠ NO LONGER SUPABASE. See ./supabase-outreach.ts for the full note on the
 * 2026-09-08 move to Neon, why the filename is unchanged, and how to roll back.
 *
 * Both exports reach the same Neon connection. Postgres does not split
 * credentials by role the way Supabase anon and service keys did, so there is
 * no separate admin path to keep — the distinction survives only in the name,
 * to keep the call sites reading the way they did.
 *
 * Still server-only in intent: never import from a client component.
 */
import { getOutreachSupabase } from "./supabase-outreach";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getOutreachSupabaseAdmin(): any {
  return getOutreachSupabase();
}
