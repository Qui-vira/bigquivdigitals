import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Graph/outreach tables are not in generated Database types yet.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _adminClient: SupabaseClient<any> | null = null;

/**
 * Service-role Supabase client for outreach/graph tables.
 * Server-only — never import from client components.
 * Requires OUTREACH_SUPABASE_SERVICE_ROLE_KEY (no NEXT_PUBLIC_ prefix).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getOutreachSupabaseAdmin(): SupabaseClient<any> {
  if (!_adminClient) {
    const url = process.env.OUTREACH_SUPABASE_URL;
    const key = process.env.OUTREACH_SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      throw new Error(
        "OUTREACH_SUPABASE_URL and OUTREACH_SUPABASE_SERVICE_ROLE_KEY must be set (server only)"
      );
    }
    _adminClient = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return _adminClient;
}
