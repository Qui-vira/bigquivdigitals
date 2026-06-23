"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import {
  promotePointerToSeed,
  rejectBdPointer,
  startMicroScanFromPointer,
} from "@/app/admin/actions/graph";
import type { GraphBdPointer, GraphSeedAccount } from "@/lib/graph-types";
import { formatCostUsd } from "@/lib/graph-cost";

const CATEGORY_LABELS: Record<string, string> = {
  confirmed_bd: "Confirmed BD",
  likely_bd: "Likely BD",
  kol_manager: "KOL Manager",
  partnership_lead: "Partnership Lead",
  listing_lead: "Listing Lead",
  growth_lead: "Growth Lead",
  founder_operator: "Founder/Operator",
  weak_crypto_user: "Weak crypto user",
  reject_noise: "Noise",
};

const ACTION_LABELS: Record<string, string> = {
  scan_more: "Scan more",
  following_only: "Following only",
  micro_test: "Micro test first",
  pause_seed: "Pause seed",
  reject_seed: "Reject seed",
};

type SeedRec = Pick<
  GraphSeedAccount,
  | "id"
  | "username"
  | "seed_type"
  | "seed_quality_score"
  | "bd_yield_rate"
  | "cost_per_lead"
  | "bd_leads_found"
  | "recommended_action"
  | "last_quality_note"
  | "enabled"
>;

function priorityScore(p: GraphBdPointer) {
  return p.scan_priority_score ?? p.pointer_score ?? 0;
}

function expansionScore(p: GraphBdPointer) {
  return p.expansion_score ?? 0;
}

function leadScore(p: GraphBdPointer) {
  return p.lead_score ?? p.pointer_score ?? 0;
}

function warnMicroScan(p: GraphBdPointer) {
  const action = p.expansion_action || "";
  return (
    action === "do_not_expand" ||
    action === "pause_seed" ||
    action === "try_later" ||
    (leadScore(p) >= 60 && expansionScore(p) < 35)
  );
}

export default function PointersClient({
  pointers,
  seedRecommendations,
  schemaNote,
}: {
  pointers: GraphBdPointer[];
  seedRecommendations: SeedRec[];
  schemaNote?: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [flash, setFlash] = useState<{ type: "ok" | "err"; message: string } | null>(null);

  const sortedPointers = useMemo(
    () => [...pointers].sort((a, b) => priorityScore(b) - priorityScore(a)),
    [pointers]
  );

  const topScanCandidate =
    sortedPointers.find(
      (p) =>
        p.pointer_status === "candidate" &&
        !warnMicroScan(p) &&
        p.expansion_action !== "do_not_expand" &&
        p.expansion_action !== "pause_seed"
    ) || sortedPointers[0];

  function act(label: string, fn: () => Promise<{ ok: boolean; error?: string; runId?: string }>) {
    startTransition(async () => {
      setFlash(null);
      const result = await fn();
      if (result.ok) {
        setFlash({
          type: "ok",
          message: result.runId
            ? `${label} — scan queued (${result.runId.slice(0, 8)}…)`
            : `${label} succeeded`,
        });
        router.refresh();
      } else {
        setFlash({ type: "err", message: result.error || `${label} failed` });
      }
    });
  }

  return (
    <div className="mt-8 space-y-6">
      {flash && (
        <div
          className={`rounded-xl border p-4 text-sm ${
            flash.type === "ok"
              ? "border-green-600/40 bg-green-600/10 text-green-200"
              : "border-red-600/40 bg-red-600/10 text-red-200"
          }`}
        >
          {flash.message}
        </div>
      )}

      {schemaNote && (
        <p className="text-xs text-yellow-200/80 rounded-lg border border-yellow-600/30 bg-yellow-600/10 px-3 py-2">
          {schemaNote}
        </p>
      )}

      <div className="rounded-xl border border-[#333] bg-[#111] p-5 space-y-2">
        <h2 className="text-sm font-medium text-white">Recommended next paid scan</h2>
        <p className="text-[10px] text-[#666]">
          Ranked by expansion yield (scan_priority_score), not lead quality alone.
        </p>
        {topScanCandidate ? (
          <div className="text-sm text-[#ccc] space-y-1">
            <p>
              <span className="text-white font-medium">@{topScanCandidate.username}</span>
              {" · "}
              priority {priorityScore(topScanCandidate)}
              {" · "}
              lead {leadScore(topScanCandidate)} / expansion {expansionScore(topScanCandidate)}
            </p>
            <p className="text-xs text-yellow-200/90">
              {topScanCandidate.recommendation_label || CATEGORY_LABELS[topScanCandidate.category]}
            </p>
            <p className="text-xs text-[#888]">
              Mode: {topScanCandidate.recommended_scan_mode} · Filter:{" "}
              {topScanCandidate.recommended_target_filter}
            </p>
            {(topScanCandidate.reasons as string[])?.[0] && (
              <p className="text-xs text-[#666]">{(topScanCandidate.reasons as string[])[0]}</p>
            )}
            {warnMicroScan(topScanCandidate) ? (
              <p className="text-xs text-orange-300/90 mt-2">
                This account is a lead, but has not proven useful as a seed.
              </p>
            ) : (
              <button
                type="button"
                disabled={pending}
                onClick={() =>
                  act("Micro scan", () => startMicroScanFromPointer(topScanCandidate.id))
                }
                className="mt-2 rounded-lg bg-[#E63946] px-4 py-2 text-xs font-medium text-white disabled:opacity-50"
              >
                Start micro scan
              </button>
            )}
          </div>
        ) : (
          <p className="text-sm text-[#666]">No scan candidates. Run pointer refresh first.</p>
        )}
      </div>

      <div className="rounded-xl border border-[#222] bg-[#111] overflow-hidden">
        <div className="p-4 border-b border-[#222]">
          <h2 className="text-sm font-medium text-white">BD Pointers ({sortedPointers.length})</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left min-w-[900px]">
            <thead className="text-[#666] border-b border-[#222]">
              <tr>
                <th className="p-3">Account</th>
                <th className="p-3">Priority</th>
                <th className="p-3">Lead</th>
                <th className="p-3">Expansion</th>
                <th className="p-3">Label</th>
                <th className="p-3">Proof history</th>
                <th className="p-3">Scan</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedPointers.map((p) => {
                const reasons = Array.isArray(p.reasons) ? p.reasons : [];
                const warn = warnMicroScan(p);
                return (
                  <tr key={p.id} className="border-b border-[#1a1a1a] hover:bg-[#0d0d0d]">
                    <td className="p-3 text-white">@{p.username}</td>
                    <td className="p-3">{priorityScore(p)}</td>
                    <td className="p-3">{leadScore(p)}</td>
                    <td className="p-3">{expansionScore(p)}</td>
                    <td className="p-3 text-[#888] max-w-[140px]">
                      {p.recommendation_label || "—"}
                    </td>
                    <td className="p-3 text-[#666] max-w-[180px]">
                      {p.micro_scans_run ? (
                        <span>
                          {p.micro_scans_run} scan(s) · {p.proof_profiles_fetched ?? 0} fetched ·{" "}
                          {p.proof_bd_leads_found ?? 0} BD · {formatCostUsd(Number(p.proof_cost_usd ?? 0))}
                          {p.last_expansion_result ? (
                            <span className="block truncate">{p.last_expansion_result}</span>
                          ) : null}
                        </span>
                      ) : (
                        "Not tested"
                      )}
                    </td>
                    <td className="p-3 text-[#888]">
                      {p.recommended_scan_mode} / {p.recommended_target_filter}
                    </td>
                    <td className="p-3 space-x-2 whitespace-nowrap">
                      {warn ? (
                        <span className="text-orange-300/80" title={reasons[0] || ""}>
                          Low expansion
                        </span>
                      ) : (
                        <button
                          type="button"
                          disabled={pending}
                          onClick={() => act("Micro scan", () => startMicroScanFromPointer(p.id))}
                          className="text-[#E63946] hover:underline disabled:opacity-50"
                        >
                          Micro
                        </button>
                      )}
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => act("Promote", () => promotePointerToSeed(p.id))}
                        className="text-green-400 hover:underline disabled:opacity-50"
                      >
                        Promote
                      </button>
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => act("Reject", () => rejectBdPointer(p.id))}
                        className="text-[#666] hover:underline disabled:opacity-50"
                      >
                        Noise
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-xl border border-[#222] bg-[#111] overflow-hidden">
        <div className="p-4 border-b border-[#222] flex justify-between items-center">
          <h2 className="text-sm font-medium text-white">Seed expansion rankings</h2>
          <Link href="/admin/graph/seeds" className="text-xs text-[#E63946] hover:underline">
            Manage seeds →
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="text-[#666] border-b border-[#222]">
              <tr>
                <th className="p-3">Seed</th>
                <th className="p-3">Expansion quality</th>
                <th className="p-3">BD yield</th>
                <th className="p-3">Leads</th>
                <th className="p-3">Cost/lead</th>
                <th className="p-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {seedRecommendations.map((s) => (
                <tr key={s.id} className="border-b border-[#1a1a1a]">
                  <td className="p-3 text-white">@{s.username}</td>
                  <td className="p-3">{s.seed_quality_score ?? 0}</td>
                  <td className="p-3">{((s.bd_yield_rate ?? 0) * 100).toFixed(1)}%</td>
                  <td className="p-3">{s.bd_leads_found ?? 0}</td>
                  <td className="p-3">{formatCostUsd(Number(s.cost_per_lead ?? 0))}</td>
                  <td className="p-3 text-[#888]">
                    {ACTION_LABELS[s.recommended_action || "scan_more"] || s.recommended_action}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
