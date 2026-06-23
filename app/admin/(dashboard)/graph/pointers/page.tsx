import { getOutreachSupabaseAdmin } from "@/lib/supabase-outreach-admin";
import PointersClient from "./PointersClient";

export const dynamic = "force-dynamic";

export default async function GraphPointersPage() {
  const supabase = getOutreachSupabaseAdmin();

  let pointers: Record<string, unknown>[] = [];
  const { data: ptrData, error: ptrErr } = await supabase
    .from("graph_bd_pointers")
    .select("*")
    .neq("pointer_status", "rejected")
    .order("scan_priority_score", { ascending: false, nullsFirst: false })
    .limit(100);
  if (!ptrErr && ptrData) pointers = ptrData;

  let seeds: Record<string, unknown>[] = [];
  const { data: seedData, error: seedErr } = await supabase
    .from("graph_seed_accounts")
    .select(
      "id,username,seed_type,seed_quality_score,bd_yield_rate,cost_per_lead,bd_leads_found,recommended_action,last_quality_note,enabled,priority,is_high_value"
    )
    .order("priority", { ascending: false })
    .limit(50);
  if (!seedErr && seedData) {
    seeds = seedData;
  } else {
    const { data: fallback } = await supabase
      .from("graph_seed_accounts")
      .select("id,username,seed_type,enabled,priority")
      .order("priority", { ascending: false })
      .limit(50);
    seeds = fallback || [];
  }

  const schemaNote =
    ptrErr || seedErr
      ? "Apply scripts/graph_leads_schema_v10_bd_pointers.sql and v11_expansion_scores.sql in Supabase."
      : null;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
      <h1 className="text-xl font-semibold text-white">BD Pointer Dashboard</h1>
      <p className="mt-1 text-sm text-[#888]">
        High-probability BD scan targets mined from existing graph data — zero Apify cost to score.
      </p>
      <PointersClient
        pointers={(pointers as never[]) || []}
        seedRecommendations={(seeds as never[]) || []}
        schemaNote={schemaNote}
      />
    </div>
  );
}
