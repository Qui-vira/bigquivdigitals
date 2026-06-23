import { verifySession } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { getOutreachSupabaseAdmin } from "@/lib/supabase-outreach-admin";
import type { GraphRunProfile, GraphScanRun } from "@/lib/graph-types";
import RunResultsClient from "./RunResultsClient";

export default async function GraphRunResultsPage({
  params,
  searchParams,
}: {
  params: Promise<{ runId: string }>;
  searchParams: Promise<{ username?: string }>;
}) {
  const session = await verifySession();
  if (!session) redirect("/admin/login");

  const { runId } = await params;
  const { username: initialUsername } = await searchParams;
  const supabase = getOutreachSupabaseAdmin();

  const { data: run } = await supabase
    .from("graph_scan_runs")
    .select("*")
    .eq("id", runId)
    .single();

  if (!run) notFound();

  let profiles: GraphRunProfile[] = [];
  const { data: profileRows, error: profileError } = await supabase
    .from("graph_run_profiles")
    .select("*")
    .eq("scan_run_id", runId)
    .order("result_index", { ascending: true })
    .limit(2000);
  if (!profileError && profileRows) {
    profiles = profileRows as GraphRunProfile[];
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-white">Run results</h1>
      <p className="mt-1 text-sm text-[#888]">
        Every profile Apify returned for this run — including skipped and filtered.
      </p>
      <div className="mt-8">
        {profiles.length === 0 && profileError && (
          <p className="mb-4 text-sm text-yellow-200/90 rounded-lg border border-yellow-600/30 bg-yellow-600/10 px-3 py-2">
            Run result trail not available yet. Apply{" "}
            <code className="text-xs">scripts/graph_leads_schema_v8_cost_run_profiles.sql</code> in Supabase,
            then re-run a scan.
          </p>
        )}
        <RunResultsClient run={run as GraphScanRun} profiles={profiles} initialUsername={initialUsername || ""} />
      </div>
    </div>
  );
}
