"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import {
  exportGraphLeadsCsv,
  markGraphLeadQualified,
  markGraphLeadReviewed,
  rejectGraphLead,
  saveGraphLeadNotes,
} from "@/app/admin/actions/graph";
import { GRAPH_LEAD_STATUSES } from "@/lib/graph-types";
import { TARGET_FILTER_PRESETS } from "@/lib/graph-target-filters";
import {
  EXCHANGE_AFFILIATIONS,
  buildOutreachMessage,
  graphProfileUrl,
  hasExchangeAffiliation,
  isNewlyFoundLead,
  profileTrailUrl,
  sourceRunUrl,
  targetTypeLabel,
} from "@/lib/graph-leads";

type LeadRow = {
  id: string;
  username: string;
  display_name: string;
  bio: string;
  follower_count: number;
  role_keywords_matched: string[];
  exchange_keywords_matched: string[];
  contact_route: string;
  source_seed_usernames: string[];
  relationship_types: string[];
  status: string;
  notes: string;
  score?: number;
  score_reason?: string;
  target_filter_type?: string;
  match_keywords?: string[];
  match_fields?: string[];
  match_reason?: string;
  source_run_id?: string | null;
  first_scored_at?: string | null;
  last_seen_at?: string | null;
  times_found: number;
};

function fmtDate(iso: string | null | undefined) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "2-digit" });
  } catch {
    return "—";
  }
}

function downloadCsv(csv: string, filename: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function LeadsClient({
  leads,
  initialRunFilter = "",
}: {
  leads: LeadRow[];
  initialRunFilter?: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [statusFilter, setStatusFilter] = useState("all");
  const [minScore, setMinScore] = useState(0);
  const [keyword, setKeyword] = useState("");
  const [seedFilter, setSeedFilter] = useState("");
  const [targetTypeFilter, setTargetTypeFilter] = useState("all");
  const [matchedKeywordFilter, setMatchedKeywordFilter] = useState("");
  const [relationshipFilter, setRelationshipFilter] = useState("all");
  const [exchangeFilter, setExchangeFilter] = useState("all");
  const [newlyFoundOnly, setNewlyFoundOnly] = useState(false);
  const [runFilter, setRunFilter] = useState(initialRunFilter);
  const [noteEdits, setNoteEdits] = useState<Record<string, string>>({});
  const [flash, setFlash] = useState("");

  const filtered = useMemo(() => {
    return leads.filter((l) => {
      if (runFilter && l.source_run_id !== runFilter) return false;
      if (statusFilter !== "all" && l.status !== statusFilter) return false;
      if ((l.score ?? 0) < minScore) return false;
      if (keyword) {
        const hay = `${l.bio} ${l.display_name} ${l.role_keywords_matched.join(" ")} ${l.exchange_keywords_matched.join(" ")}`.toLowerCase();
        if (!hay.includes(keyword.toLowerCase())) return false;
      }
      if (seedFilter && !l.source_seed_usernames.some((s) => s.toLowerCase().includes(seedFilter.toLowerCase()))) {
        return false;
      }
      if (targetTypeFilter !== "all" && l.target_filter_type !== targetTypeFilter) return false;
      if (
        matchedKeywordFilter &&
        !(l.match_keywords || []).some((k) => k.includes(matchedKeywordFilter.toLowerCase()))
      ) {
        return false;
      }
      if (relationshipFilter !== "all" && !(l.relationship_types || []).includes(relationshipFilter)) return false;
      if (exchangeFilter !== "all" && !hasExchangeAffiliation(l, exchangeFilter)) return false;
      if (newlyFoundOnly && !isNewlyFoundLead(l)) return false;
      return true;
    });
  }, [
    leads,
    runFilter,
    statusFilter,
    minScore,
    keyword,
    seedFilter,
    targetTypeFilter,
    matchedKeywordFilter,
    relationshipFilter,
    exchangeFilter,
    newlyFoundOnly,
  ]);

  function handleExport(mode: "all" | "qualified" | "filtered") {
    startTransition(async () => {
      const result = await exportGraphLeadsCsv({
        qualifiedOnly: mode === "qualified",
        targetType: mode === "filtered" ? targetTypeFilter : undefined,
        seed: mode === "filtered" ? seedFilter : undefined,
        runId: runFilter || undefined,
        status: mode === "filtered" ? statusFilter : undefined,
        minScore: mode === "filtered" ? minScore : undefined,
        matchedKeyword: mode === "filtered" ? matchedKeywordFilter : undefined,
        exchange: mode === "filtered" && exchangeFilter !== "all" ? exchangeFilter : undefined,
        relationship: mode === "filtered" ? relationshipFilter : undefined,
        newlyFoundOnly: mode === "filtered" ? newlyFoundOnly : undefined,
      });
      if (result.ok && result.csv) {
        downloadCsv(result.csv, result.filename || "graph-leads.csv");
        setFlash(`Exported ${result.count ?? 0} leads`);
      }
    });
  }

  function copyText(text: string, label: string) {
    navigator.clipboard.writeText(text).then(() => setFlash(`${label} copied`));
  }

  function saveNote(leadId: string) {
    const notes = noteEdits[leadId] ?? "";
    startTransition(async () => {
      await saveGraphLeadNotes(leadId, notes);
      setFlash("Note saved");
    });
  }

  return (
    <div className="mt-8 space-y-4">
      {flash && (
        <p className="rounded-lg border border-green-600/30 bg-green-600/10 px-3 py-2 text-xs text-green-200">
          {flash}
        </p>
      )}

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:flex xl:flex-wrap xl:items-end">
        <label className="text-xs text-[#888]">
          Status
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="mt-1 block w-full rounded-lg border border-[#333] bg-[#0d0d0d] px-2 py-1.5 text-sm text-white">
            <option value="all">All</option>
            {GRAPH_LEAD_STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </label>
        <label className="text-xs text-[#888]">
          Target type
          <select value={targetTypeFilter} onChange={(e) => setTargetTypeFilter(e.target.value)} className="mt-1 block w-full rounded-lg border border-[#333] bg-[#0d0d0d] px-2 py-1.5 text-sm text-white">
            <option value="all">All</option>
            {Object.entries(TARGET_FILTER_PRESETS).map(([value, preset]) => (
              <option key={value} value={value}>{preset.label}</option>
            ))}
            <option value="custom">Custom</option>
          </select>
        </label>
        <label className="text-xs text-[#888]">
          Seed
          <input value={seedFilter} onChange={(e) => setSeedFilter(e.target.value)} placeholder="binance" className="mt-1 block w-full rounded-lg border border-[#333] bg-[#0d0d0d] px-2 py-1.5 text-sm text-white" />
        </label>
        <label className="text-xs text-[#888]">
          Min score
          <input type="number" min={0} max={100} value={minScore} onChange={(e) => setMinScore(Number(e.target.value))} className="mt-1 block w-full rounded-lg border border-[#333] bg-[#0d0d0d] px-2 py-1.5 text-sm text-white" />
        </label>
        <label className="text-xs text-[#888]">
          Matched keyword
          <input value={matchedKeywordFilter} onChange={(e) => setMatchedKeywordFilter(e.target.value)} placeholder="bd, kol…" className="mt-1 block w-full rounded-lg border border-[#333] bg-[#0d0d0d] px-2 py-1.5 text-sm text-white" />
        </label>
        <label className="text-xs text-[#888]">
          Exchange
          <select value={exchangeFilter} onChange={(e) => setExchangeFilter(e.target.value)} className="mt-1 block w-full rounded-lg border border-[#333] bg-[#0d0d0d] px-2 py-1.5 text-sm text-white">
            <option value="all">All</option>
            {EXCHANGE_AFFILIATIONS.map((ex) => (
              <option key={ex} value={ex}>{ex.toUpperCase()}</option>
            ))}
          </select>
        </label>
        <label className="text-xs text-[#888]">
          Relationship
          <select value={relationshipFilter} onChange={(e) => setRelationshipFilter(e.target.value)} className="mt-1 block w-full rounded-lg border border-[#333] bg-[#0d0d0d] px-2 py-1.5 text-sm text-white">
            <option value="all">All</option>
            <option value="follower">Follower</option>
            <option value="following">Following</option>
          </select>
        </label>
        <label className="flex items-center gap-2 self-end pb-2 text-xs text-[#aaa]">
          <input type="checkbox" checked={newlyFoundOnly} onChange={(e) => setNewlyFoundOnly(e.target.checked)} className="rounded" />
          Newly found only
        </label>
        {initialRunFilter && (
          <label className="text-xs text-[#888]">
            Run filter
            <input value={runFilter} onChange={(e) => setRunFilter(e.target.value)} className="mt-1 block w-full rounded-lg border border-[#333] bg-[#0d0d0d] px-2 py-1.5 text-sm text-white font-mono text-[10px]" />
          </label>
        )}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <button type="button" disabled={isPending} onClick={() => handleExport("all")} className="w-full rounded-lg border border-[#333] px-3 py-2 text-xs text-white sm:w-auto">Export all leads</button>
        <button type="button" disabled={isPending} onClick={() => handleExport("qualified")} className="w-full rounded-lg border border-[#333] px-3 py-2 text-xs text-white sm:w-auto">Export qualified</button>
        <button type="button" disabled={isPending} onClick={() => handleExport("filtered")} className="w-full rounded-lg border border-[#E63946]/40 bg-[#E63946]/10 px-3 py-2 text-xs text-[#E63946] sm:w-auto">Export filtered ({filtered.length})</button>
      </div>

      <p className="text-xs text-[#666]">{filtered.length} of {leads.length} leads</p>

      <div className="overflow-x-auto rounded-xl border border-[#222] bg-[#111]">
        <table className="w-full min-w-[1100px] text-left text-xs">
          <thead className="border-b border-[#222] text-[#666]">
            <tr>
              <th className="p-3">Username</th>
              <th className="p-3">Display</th>
              <th className="p-3 max-w-[200px]">Bio</th>
              <th className="p-3">Target</th>
              <th className="p-3">Score</th>
              <th className="p-3">Keywords</th>
              <th className="p-3 max-w-[180px]">Match reason</th>
              <th className="p-3">Seeds</th>
              <th className="p-3">Rel</th>
              <th className="p-3">Seen</th>
              <th className="p-3">Status</th>
              <th className="p-3 min-w-[200px]">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={12} className="p-6 text-center text-[#555]">No leads match filters.</td>
              </tr>
            )}
            {filtered.map((lead) => {
              const profileUrl = graphProfileUrl(lead.username);
              const outreach = buildOutreachMessage(lead);
              const runUrl = sourceRunUrl(lead.source_run_id);
              const trailUrl = profileTrailUrl(lead.source_run_id, lead.username);
              const noteVal = noteEdits[lead.id] ?? lead.notes;

              return (
                <tr key={lead.id} className="border-b border-[#1a1a1a] text-[#ccc] align-top">
                  <td className="p-3">
                    <a href={profileUrl} target="_blank" rel="noopener noreferrer" className="font-medium text-white hover:text-[#E63946] break-all">
                      @{lead.username}
                    </a>
                  </td>
                  <td className="p-3 text-[#888]">{lead.display_name || "—"}</td>
                  <td className="p-3 max-w-[200px] text-[#888]">
                    <span className="line-clamp-3">{lead.bio || "—"}</span>
                  </td>
                  <td className="p-3 text-[#aaa]">{targetTypeLabel(lead.target_filter_type)}</td>
                  <td className="p-3">
                    <span className="text-[#E63946] font-medium">{lead.score ?? "—"}</span>
                  </td>
                  <td className="p-3 text-[10px] text-[#777]">
                    {(lead.match_keywords || []).slice(0, 4).join(", ") || "—"}
                  </td>
                  <td className="p-3 max-w-[180px] text-[10px] text-green-200/80">
                    <span className="line-clamp-3">{lead.match_reason || "—"}</span>
                  </td>
                  <td className="p-3 text-[10px]">
                    {(lead.source_seed_usernames || []).map((s) => `@${s}`).join(", ") || "—"}
                    {lead.times_found > 1 && (
                      <span className="mt-1 block text-[#555]">×{lead.times_found}</span>
                    )}
                  </td>
                  <td className="p-3 text-[10px]">{(lead.relationship_types || []).join(", ") || "—"}</td>
                  <td className="p-3 text-[10px] text-[#555]">
                    <div>{fmtDate(lead.first_scored_at)}</div>
                    <div>{fmtDate(lead.last_seen_at)}</div>
                  </td>
                  <td className="p-3">
                    <span className="rounded-full bg-[#1a1a1a] px-2 py-0.5 text-[10px]">{lead.status}</span>
                  </td>
                  <td className="p-3">
                    <div className="flex min-w-[180px] flex-col gap-1">
                      {lead.status === "new" && (
                        <button type="button" disabled={isPending} onClick={() => startTransition(async () => { await markGraphLeadReviewed(lead.id); })} className="rounded bg-[#333] px-2 py-1 text-[10px] text-white">Reviewed</button>
                      )}
                      {!["qualified", "rejected", "duplicate"].includes(lead.status) && (
                        <button type="button" disabled={isPending} onClick={() => startTransition(async () => { await markGraphLeadQualified(lead.id); })} className="rounded bg-green-600/20 px-2 py-1 text-[10px] text-green-400">Qualified</button>
                      )}
                      {!["rejected", "duplicate"].includes(lead.status) && (
                        <button type="button" disabled={isPending} onClick={() => startTransition(async () => { await rejectGraphLead(lead.id); })} className="rounded bg-red-600/20 px-2 py-1 text-[10px] text-red-400">Reject</button>
                      )}
                      <button type="button" onClick={() => copyText(profileUrl, "Profile link")} className="rounded border border-[#333] px-2 py-1 text-[10px] text-[#aaa]">Copy X link</button>
                      <button type="button" onClick={() => copyText(outreach, "Outreach message")} className="rounded border border-[#333] px-2 py-1 text-[10px] text-[#aaa]">Copy outreach</button>
                      {runUrl && (
                        <Link href={runUrl} className="rounded border border-[#333] px-2 py-1 text-center text-[10px] text-[#E63946] hover:underline">View source run</Link>
                      )}
                      {trailUrl && (
                        <Link href={trailUrl} className="rounded border border-[#333] px-2 py-1 text-center text-[10px] text-[#aaa] hover:text-white">Profile trail</Link>
                      )}
                      <textarea
                        value={noteVal}
                        onChange={(e) => setNoteEdits((prev) => ({ ...prev, [lead.id]: e.target.value }))}
                        placeholder="Notes…"
                        rows={2}
                        className="mt-1 w-full rounded border border-[#333] bg-[#0d0d0d] px-2 py-1 text-[10px] text-white"
                      />
                      <button type="button" disabled={isPending} onClick={() => saveNote(lead.id)} className="rounded bg-[#222] px-2 py-1 text-[10px] text-[#aaa]">Save note</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
