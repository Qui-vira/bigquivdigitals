import { verifySession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getOutreachSupabaseAdmin } from "@/lib/supabase-outreach-admin";
import LeadsClient from "./LeadsClient";

type GraphLeadRow = {
  id: string;
  username: string;
  role_keywords_matched: string[] | null;
  exchange_keywords_matched: string[] | null;
  contact_route: string | null;
  source_seed_usernames: string[] | null;
  relationship_types: string[] | null;
  status: string;
  notes: string | null;
  score_reason?: string | null;
  target_filter_type?: string | null;
  match_keywords?: string[] | null;
  match_fields?: string[] | null;
  match_reason?: string | null;
  source_run_id?: string | null;
  first_scored_at?: string | null;
  last_seen_at?: string | null;
  times_found?: number | null;
  best_score?: number | null;
  graph_profiles:
    | { bio?: string; display_name?: string; follower_count?: number }
    | { bio?: string; display_name?: string; follower_count?: number }[]
    | null;
};

export default async function GraphLeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ run?: string }>;
}) {
  const session = await verifySession();
  if (!session) redirect("/admin/login");

  const params = await searchParams;
  const runFilter = params.run || "";

  const supabase = getOutreachSupabaseAdmin();

  const baseSelect = `
    id, username, role_keywords_matched, exchange_keywords_matched,
    contact_route, source_seed_usernames, relationship_types, status, notes,
    source_run_id, first_scored_at, last_seen_at, times_found, best_score,
    graph_profiles ( bio, display_name, follower_count )
  `;

  const leadsWithMatch = await supabase
    .from("graph_leads")
    .select(`${baseSelect}, score_reason, target_filter_type, match_keywords, match_fields, match_reason`)
    .order("updated_at", { ascending: false })
    .limit(200);

  const leadsFallback =
    leadsWithMatch.error?.message?.includes("times_found") ||
    leadsWithMatch.error?.message?.includes("last_seen_at") ||
    leadsWithMatch.error?.message?.includes("match_reason")
      ? await supabase
          .from("graph_leads")
          .select(`${baseSelect}, score_reason, target_filter_type, match_keywords, match_reason`)
          .order("updated_at", { ascending: false })
          .limit(200)
      : null;

  const leads = (leadsFallback?.data ?? leadsWithMatch.data) || [];
  const leadRows = leads as GraphLeadRow[];
  const leadIds = leadRows.map((l) => l.id);
  const scoreMap: Record<string, number> = {};

  if (leadIds.length > 0) {
    const { data: scoreRows } = await supabase
      .from("graph_lead_scores")
      .select("lead_id, score")
      .in("lead_id", leadIds)
      .order("scored_at", { ascending: false });

    for (const row of (scoreRows || []) as { lead_id: string; score: number }[]) {
      if (!scoreMap[row.lead_id]) scoreMap[row.lead_id] = row.score;
    }
  }

  const enriched = leadRows.map((l) => {
    const profileRaw = l.graph_profiles;
    const profile = Array.isArray(profileRaw) ? profileRaw[0] : profileRaw;
    const best = Number(l.best_score || 0);
    const latestScore = scoreMap[l.id];
    return {
      id: l.id,
      username: l.username,
      display_name: profile?.display_name || "",
      role_keywords_matched: l.role_keywords_matched || [],
      exchange_keywords_matched: l.exchange_keywords_matched || [],
      contact_route: l.contact_route || "",
      source_seed_usernames: l.source_seed_usernames || [],
      relationship_types: l.relationship_types || [],
      status: l.status,
      notes: l.notes || "",
      bio: profile?.bio || "",
      follower_count: profile?.follower_count || 0,
      score: best > 0 ? best : latestScore,
      score_reason: l.score_reason || "",
      target_filter_type: l.target_filter_type || "",
      match_keywords: l.match_keywords || [],
      match_fields: l.match_fields || [],
      match_reason: l.match_reason || "",
      source_run_id: l.source_run_id || null,
      first_scored_at: l.first_scored_at || null,
      last_seen_at: l.last_seen_at || null,
      times_found: Number(l.times_found || 1),
    };
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-white">Graph Leads</h1>
      <p className="mt-1 text-sm text-[#888]">
        Outreach pipeline — qualify, export, and track BD/KOL leads from graph scans.
      </p>
      <LeadsClient leads={enriched} initialRunFilter={runFilter} />
    </div>
  );
}
