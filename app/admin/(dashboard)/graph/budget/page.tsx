import { verifySession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getOutreachSupabaseAdmin } from "@/lib/supabase-outreach-admin";
import type { GraphBudgetLog } from "@/lib/graph-types";

export default async function GraphBudgetPage() {
  const session = await verifySession();
  if (!session) redirect("/admin/login");

  const supabase = getOutreachSupabaseAdmin();
  const { data: logs } = await supabase
    .from("graph_budget_logs")
    .select("*")
    .order("logged_at", { ascending: false })
    .limit(100);

  const list = (logs || []) as GraphBudgetLog[];

  return (
    <div>
      <h1 className="text-2xl font-bold text-white">Budget Logs</h1>
      <p className="mt-1 text-sm text-[#888]">Apify cost tracking per batch and run.</p>

      <div className="mt-8 overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-xs">
          <thead>
            <tr className="border-b border-[#222] text-[#666]">
              <th className="py-2 pr-4">Time</th>
              <th className="py-2 pr-4">Provider</th>
              <th className="py-2 pr-4">Run ID</th>
              <th className="py-2 pr-4">Profiles</th>
              <th className="py-2 pr-4">Batch $</th>
              <th className="py-2 pr-4">Cumulative $</th>
              <th className="py-2 pr-4">Stopped</th>
            </tr>
          </thead>
          <tbody>
            {list.map((log) => (
              <tr key={log.id} className="border-b border-[#1a1a1a] text-[#ccc]">
                <td className="py-2 pr-4">
                  {new Date(log.logged_at).toLocaleString()}
                </td>
                <td className="py-2 pr-4">{log.provider}</td>
                <td className="py-2 pr-4 font-mono text-[10px]">
                  {log.scan_run_id?.slice(0, 8) || "—"}
                </td>
                <td className="py-2 pr-4">{log.profiles_collected}</td>
                <td className="py-2 pr-4">${Number(log.estimated_cost_usd).toFixed(4)}</td>
                <td className="py-2 pr-4">${Number(log.cumulative_cost_usd).toFixed(4)}</td>
                <td className="py-2 pr-4">{log.stopped_reason || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {list.length === 0 && (
          <p className="mt-4 text-sm text-[#555]">No budget logs yet.</p>
        )}
      </div>
    </div>
  );
}
