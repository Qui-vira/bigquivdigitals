"use server";

/**
 * Outreach draft approval. Moved off Supabase to Neon on 2026-09-08.
 *
 * ⚠ This file called the Supabase REST endpoint directly with fetch, which is
 * why it survived the first sweep of the migration: it never imported
 * getOutreachSupabase, so grepping for that name did not find it. Its twin is
 * app/api/telegram/webhook/route.ts, which approved the same rows the same way.
 * Leaving either behind would have meant approvals writing to Supabase while
 * /admin/outreach read Neon, and a draft looking pending forever.
 *
 * It also depended on OUTREACH_SUPABASE_ANON_KEY, which is blank in .env.local
 * and is what made `npm run build` fail on this route.
 */

import { revalidatePath } from "next/cache";
import { getOutreachSupabase } from "@/lib/supabase-outreach";

const TABLES: Record<string, string> = {
  altara: "altara_outreach_drafts",
  kol: "kol_outreach_drafts",
};

function fail(e: unknown) {
  return `Error: ${e instanceof Error ? e.message : String(e)}`;
}

export async function approveDraft(pipeline: string, draftId: string) {
  const table = TABLES[pipeline];
  if (!table) return "Invalid pipeline";

  try {
    await getOutreachSupabase()
      .from(table)
      .update({ status: "approved", approved_at: new Date().toISOString() })
      .eq("id", draftId);
  } catch (e) {
    return fail(e);
  }

  revalidatePath("/admin/outreach");
  return "Approved";
}

export async function rejectDraft(pipeline: string, draftId: string) {
  const table = TABLES[pipeline];
  if (!table) return "Invalid pipeline";

  try {
    await getOutreachSupabase()
      .from(table)
      .update({ status: "rejected" })
      .eq("id", draftId);
  } catch (e) {
    return fail(e);
  }

  revalidatePath("/admin/outreach");
  return "Rejected";
}

export async function approveAll(pipeline: string) {
  const table = TABLES[pipeline];
  if (!table) return "Invalid pipeline";

  try {
    await getOutreachSupabase()
      .from(table)
      .update({ status: "approved", approved_at: new Date().toISOString() })
      .eq("status", "pending");
  } catch (e) {
    return fail(e);
  }

  revalidatePath("/admin/outreach");
  return "All approved";
}
