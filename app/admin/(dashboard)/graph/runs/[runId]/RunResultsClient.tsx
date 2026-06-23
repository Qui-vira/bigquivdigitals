"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { exportRunProfilesCsv } from "@/app/admin/actions/graph";
import type { GraphRunProfile, GraphRunProfileStatus, GraphScanRun } from "@/lib/graph-types";
import { formatCostUsd } from "@/lib/graph-cost";

const STATUS_OPTIONS: { value: GraphRunProfileStatus | "all"; label: string }[] = [
  { value: "all", label: "All statuses" },
  { value: "stored", label: "Stored" },
  { value: "classified_as_lead", label: "Leads" },
  { value: "skipped_already_scanned", label: "Already scanned" },
  { value: "skipped_target_filter", label: "Target filter skip" },
  { value: "skipped_duplicate", label: "Duplicate" },
  { value: "skipped_private", label: "Private" },
  { value: "error", label: "Error" },
];

export default function RunResultsClient({
  run,
  profiles,
  initialUsername = "",
}: {
  run: GraphScanRun;
  profiles: GraphRunProfile[];
  initialUsername?: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<GraphRunProfileStatus | "all">("all");
  const [relationship, setRelationship] = useState<"all" | "follower" | "following">("all");
  const [keyword, setKeyword] = useState(initialUsername);
  const [minFollowers, setMinFollowers] = useState(0);
  const [view, setView] = useState<"all" | "leads" | "skipped" | "stored">("all");

  const filtered = useMemo(() => {
    return profiles.filter((p) => {
      if (status !== "all" && p.status !== status) return false;
      if (relationship !== "all" && p.relationship_type !== relationship) return false;
      if (minFollowers > 0 && p.follower_count < minFollowers) return false;
      if (keyword.trim()) {
        const q = keyword.toLowerCase();
        const hay = `${p.username} ${p.bio} ${p.display_name} ${(p.matched_keywords || []).join(" ")}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (view === "leads" && p.status !== "classified_as_lead") return false;
      if (view === "skipped" && !p.status.startsWith("skipped_")) return false;
      if (view === "stored" && p.status !== "stored" && p.status !== "classified_as_lead") return false;
      return true;
    });
  }, [profiles, status, relationship, keyword, minFollowers, view]);

  const estimate = Number(run.estimated_cost_usd || 0);
  const actual = Number(run.actual_cost_usd || 0);
  const costMismatch = actual > 0 && Math.abs(actual - estimate) > 0.0001;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3 text-sm">
        <Link href="/admin/graph/runs" className="text-[#E63946] hover:underline text-xs">
          ← All runs
        </Link>
        <Link href={`/admin/graph/leads?run=${run.id}`} className="text-[#aaa] hover:text-white text-xs underline">
          Leads from this run
        </Link>
      </div>

      <div className="rounded-xl border border-[#222] bg-[#111] p-5 space-y-3">
        <h2 className="text-sm font-medium text-white">Run summary</h2>
        <div className="flex flex-wrap gap-4 text-xs">
          <span className="text-[#888]">Status: <span className="text-white">{run.status}</span></span>
          <span className="text-[#888]">Apify fetched: <span className="text-white">{run.apify_profiles_fetched ?? 0}</span></span>
          <span className="text-[#888]">Stored: <span className="text-white">{run.profiles_stored ?? run.profiles_collected}</span></span>
          <span className="text-[#888]">Skipped: <span className="text-white">{run.profiles_skipped ?? 0}</span></span>
          <span className="text-[#888]">Leads: <span className="text-white">{run.leads_created ?? run.profiles_classified}</span></span>
          <span className="text-[#888]">Edges: <span className="text-white">{run.edges_created}</span></span>
        </div>
        <div className="flex flex-wrap gap-4 text-xs">
          <span className="text-[#888]">Est. cost: <span className="text-white">{formatCostUsd(estimate)}</span></span>
          <span className="text-[#888]">Apify billed: <span className="text-white">{actual > 0 ? formatCostUsd(actual) : "pending"}</span></span>
        </div>
        {costMismatch && (
          <p className="text-xs text-yellow-200/90 rounded-lg border border-yellow-600/30 bg-yellow-600/10 px-3 py-2">
            Estimate ({formatCostUsd(estimate)}) differs from Apify billed ({formatCostUsd(actual)}).
          </p>
        )}
        <p className="text-[10px] text-[#555] font-mono break-all">{run.id}</p>
      </div>

      <div className="rounded-xl border border-[#222] bg-[#111] p-5 space-y-3">
        <h2 className="text-sm font-medium text-white">Filters</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-5">
          <label className="text-xs text-[#888]">
            View
            <select value={view} onChange={(e) => setView(e.target.value as typeof view)} className="mt-1 w-full rounded-lg border border-[#333] bg-[#0d0d0d] px-2 py-1.5 text-white">
              <option value="all">All</option>
              <option value="leads">Leads only</option>
              <option value="skipped">Skipped only</option>
              <option value="stored">Stored only</option>
            </select>
          </label>
          <label className="text-xs text-[#888]">
            Status
            <select value={status} onChange={(e) => setStatus(e.target.value as typeof status)} className="mt-1 w-full rounded-lg border border-[#333] bg-[#0d0d0d] px-2 py-1.5 text-white">
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </label>
          <label className="text-xs text-[#888]">
            Relationship
            <select value={relationship} onChange={(e) => setRelationship(e.target.value as typeof relationship)} className="mt-1 w-full rounded-lg border border-[#333] bg-[#0d0d0d] px-2 py-1.5 text-white">
              <option value="all">All</option>
              <option value="follower">Followers</option>
              <option value="following">Following</option>
            </select>
          </label>
          <label className="text-xs text-[#888]">
            Keyword
            <input value={keyword} onChange={(e) => setKeyword(e.target.value)} className="mt-1 w-full rounded-lg border border-[#333] bg-[#0d0d0d] px-2 py-1.5 text-white" placeholder="bio, keyword…" />
          </label>
          <label className="text-xs text-[#888]">
            Min followers
            <input type="number" min={0} value={minFollowers} onChange={(e) => setMinFollowers(Number(e.target.value))} className="mt-1 w-full rounded-lg border border-[#333] bg-[#0d0d0d] px-2 py-1.5 text-white" />
          </label>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-[#666]">Showing {filtered.length} of {profiles.length} Apify results</p>
          <button
            type="button"
            disabled={isPending || profiles.length === 0}
            onClick={() =>
              startTransition(async () => {
                const result = await exportRunProfilesCsv(run.id);
                if (result.ok && result.csv) {
                  const blob = new Blob([result.csv], { type: "text/csv" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = result.filename || "run-results.csv";
                  a.click();
                  URL.revokeObjectURL(url);
                }
              })
            }
            className="w-full rounded-lg border border-[#333] px-3 py-2 text-xs text-white sm:w-auto"
          >
            Export CSV
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-[#222] bg-[#111]">
        <table className="w-full min-w-[700px] text-left text-xs">
          <thead className="text-[#666] border-b border-[#222]">
            <tr>
              <th className="p-3">#</th>
              <th className="p-3">User</th>
              <th className="p-3">Status</th>
              <th className="p-3">Seed / rel</th>
              <th className="p-3">Followers</th>
              <th className="p-3">Skip / match</th>
              <th className="p-3">Apify run</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id} className="border-b border-[#1a1a1a] hover:bg-[#0d0d0d]">
                <td className="p-3 text-[#555]">{p.result_index}</td>
                <td className="p-3">
                  <div className="text-white font-medium break-all">@{p.username}</div>
                  <div className="text-[#666] truncate max-w-xs">{p.display_name}</div>
                  <div className="text-[#555] truncate max-w-md">{p.bio}</div>
                  {p.linked_profile_id && (
                    <Link href={`/admin/graph/profiles?q=${encodeURIComponent(p.username)}`} className="text-[#E63946] hover:underline">
                      View profile
                    </Link>
                  )}
                </td>
                <td className="p-3">
                  <span className="rounded bg-[#1a1a1a] px-2 py-0.5 text-white">{p.status}</span>
                </td>
                <td className="p-3 text-[#888]">@{p.seed_username} · {p.relationship_type}</td>
                <td className="p-3 text-[#888]">{p.follower_count.toLocaleString()}</td>
                <td className="p-3 text-[#888] max-w-xs">
                  {p.skip_reason && <div>{p.skip_reason}</div>}
                  {(p.matched_keywords || []).length > 0 && (
                    <div className="text-[#aaa]">kw: {p.matched_keywords.join(", ")}</div>
                  )}
                  {p.match_reason && <div className="text-[#555] truncate">{p.match_reason}</div>}
                </td>
                <td className="p-3 font-mono text-[10px] text-[#555] break-all">{p.apify_run_id || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <p className="p-6 text-sm text-[#555]">No profiles match filters.</p>
        )}
      </div>
    </div>
  );
}
