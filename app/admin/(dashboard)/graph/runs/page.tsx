import Link from "next/link";
import { verifySession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getOutreachSupabaseAdmin } from "@/lib/supabase-outreach-admin";
import type { GraphScanRun } from "@/lib/graph-types";
import { formatTargetFilterSummary } from "@/lib/graph-target-filters";
import { formatCostUsd } from "@/lib/graph-cost";

export default async function GraphRunsPage() {
  const session = await verifySession();
  if (!session) redirect("/admin/login");

  const supabase = getOutreachSupabaseAdmin();
  const { data: runs } = await supabase
    .from("graph_scan_runs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  const list = (runs || []) as GraphScanRun[];

  return (
    <div>
      <h1 className="text-2xl font-bold text-white">Graph Scan Runs</h1>
      <p className="mt-1 text-sm text-[#888]">Run history, errors, and duration.</p>

      <div className="mt-8 space-y-3">
        {list.length === 0 && (
          <p className="text-sm text-[#555]">No runs yet.</p>
        )}
        {list.map((run) => {
          const started = run.started_at ? new Date(run.started_at).getTime() : null;
          const ended = run.completed_at ? new Date(run.completed_at).getTime() : null;
          const durationSec =
            started && ended ? Math.round((ended - started) / 1000) : null;

          return (
            <div key={run.id} className="rounded-xl border border-[#222] bg-[#111] p-4">
              <div className="flex flex-wrap gap-3 text-xs">
                <span className="rounded-full bg-[#1a1a1a] px-2 py-0.5 text-white">{run.status}</span>
                <span className="text-[#888]">mode: {run.scan_mode}</span>
                <span className="text-[#888]">Apify: {run.apify_profiles_fetched ?? 0}</span>
                <span className="text-[#888]">stored: {run.profiles_stored ?? run.profiles_collected}</span>
                <span className="text-[#888]">skipped: {run.profiles_skipped ?? 0}</span>
                <span className="text-[#888]">leads: {run.leads_created ?? run.profiles_classified}</span>
                <span className="text-[#888]">est: {formatCostUsd(Number(run.estimated_cost_usd))}</span>
                {(run.actual_cost_usd ?? 0) > 0 && (
                  <span className="text-[#888]">billed: {formatCostUsd(Number(run.actual_cost_usd))}</span>
                )}
                {durationSec !== null && (
                  <span className="text-[#888]">duration: {durationSec}s</span>
                )}
                {run.stopped_reason && (
                  <span className="text-yellow-400">stopped: {run.stopped_reason}</span>
                )}
              </div>
              <p className="mt-1 text-[10px] text-[#555] font-mono break-all">{run.id}</p>
              <div className="mt-2 flex flex-wrap gap-3 text-xs">
                <Link href={`/admin/graph/runs/${run.id}`} className="text-[#E63946] hover:underline">
                  View run results
                </Link>
                <Link href={`/admin/graph/leads?run=${run.id}`} className="text-[#aaa] hover:text-white underline">
                  Leads from this run
                </Link>
              </div>
              {formatTargetFilterSummary(run) && (
                <p className="mt-2 text-[10px] text-[#aaa] border-l-2 border-[#E63946]/40 pl-2">
                  Target filter: {formatTargetFilterSummary(run)}
                </p>
              )}
              {Array.isArray(run.error_log) && run.error_log.length > 0 && (
                <div className="mt-2 rounded-lg bg-[#0d0d0d] p-3 text-xs text-red-300 max-h-40 overflow-y-auto">
                  {run.error_log.map((err, i) => (
                    <div key={i}>
                      {err.at ? `[${err.at}] ` : ""}{err.message}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
