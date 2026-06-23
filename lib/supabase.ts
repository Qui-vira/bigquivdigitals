import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let _supabase: SupabaseClient | null = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _supabaseAdmin: SupabaseClient<any> | null = null;

export function getSupabase() {
  if (!_supabase) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_ANON_KEY;
    if (!url || !key) {
      throw new Error("SUPABASE_URL and SUPABASE_ANON_KEY must be set in .env.local");
    }
    _supabase = createClient(url, key);
  }
  return _supabase;
}

/**
 * Service-role client for content-engine Supabase (course purchases, admin).
 * Server-only — never import from client components.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getSupabaseAdmin(): SupabaseClient<any> {
  if (!_supabaseAdmin) {
    const url = process.env.SUPABASE_URL;
    const key =
      process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
      process.env.SUPABASE_KEY?.trim();
    if (!url || !key) {
      throw new Error(
        "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_KEY) must be set (server only)"
      );
    }
    _supabaseAdmin = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return _supabaseAdmin;
}
