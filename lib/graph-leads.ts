import { TARGET_FILTER_PRESETS } from "@/lib/graph-target-filters";
import type { GraphLeadStatus } from "@/lib/graph-types";

export const GRAPH_LEAD_PIPELINE_STATUSES: GraphLeadStatus[] = [
  "new",
  "reviewed",
  "qualified",
  "contacted",
  "replied",
  "rejected",
  "duplicate",
];

/** Legacy statuses kept for existing rows */
export const GRAPH_LEAD_LEGACY_STATUSES: GraphLeadStatus[] = [
  "approved",
  "exported",
  "do_not_contact",
];

export const EXCHANGE_AFFILIATIONS = [
  "mexc",
  "lbank",
  "binance",
  "bybit",
  "okx",
  "bitget",
  "gate",
  "kucoin",
  "bingx",
  "bitmart",
  "htx",
  "coinex",
  "bitunix",
  "weex",
  "coinw",
] as const;

export const CSV_EXPORT_HEADERS = [
  "username",
  "display_name",
  "profile_url",
  "bio",
  "target_type",
  "confidence_score",
  "matched_keywords",
  "match_reason",
  "source_seeds",
  "relationship_type",
  "status",
  "notes",
  "first_seen",
  "last_seen",
] as const;

export type GraphLeadExportRow = {
  username: string;
  display_name?: string;
  bio?: string;
  target_filter_type?: string;
  confidence_score?: number;
  match_keywords?: string[];
  match_reason?: string;
  source_seed_usernames?: string[];
  relationship_types?: string[];
  status?: string;
  notes?: string;
  first_scored_at?: string | null;
  last_seen_at?: string | null;
  updated_at?: string | null;
};

const LOCKED_STATUSES = new Set([
  "qualified",
  "contacted",
  "replied",
  "rejected",
  "duplicate",
  "do_not_contact",
  "exported",
]);

export function graphProfileUrl(username: string): string {
  const handle = username.replace(/^@/, "").trim();
  return handle ? `https://x.com/${handle}` : "";
}

export function targetTypeLabel(type: string | undefined | null): string {
  if (!type) return "—";
  if (type === "custom") return "Custom";
  const preset = TARGET_FILTER_PRESETS[type as keyof typeof TARGET_FILTER_PRESETS];
  return preset?.label || type;
}

export function pickStrongestMatchReason(existing: string, incoming: string): string {
  const a = (existing || "").trim();
  const b = (incoming || "").trim();
  if (!a) return b;
  if (!b) return a;
  if (b.toLowerCase().includes("exchange affiliation") && !a.toLowerCase().includes("exchange affiliation")) {
    return b;
  }
  return b.length > a.length ? b : a;
}

export function mergeLeadSources(
  existingSeeds: string[] | null | undefined,
  existingRels: string[] | null | undefined,
  newSeeds: string[],
  newRel: string
): { seeds: string[]; relationships: string[] } {
  const seeds = [...new Set([...(existingSeeds || []), ...newSeeds])];
  const relationships = [...new Set([...(existingRels || []), newRel])];
  return { seeds, relationships };
}

export function mergeLeadUpdate(
  existing: {
    source_seed_usernames?: string[] | null;
    relationship_types?: string[] | null;
    times_found?: number;
    best_score?: number;
    match_reason?: string | null;
    match_keywords?: string[] | null;
    exchange_keywords_matched?: string[] | null;
    status?: string;
  },
  incoming: {
    newSeeds: string[];
    newRelationship: string;
    newScore: number;
    newMatchReason?: string;
    newMatchKeywords?: string[];
    newExchangeKeywords?: string[];
  }
): {
  source_seed_usernames: string[];
  relationship_types: string[];
  times_found: number;
  best_score: number;
  match_reason: string;
  match_keywords: string[];
  exchange_keywords_matched: string[];
  status: string;
} {
  const { seeds, relationships } = mergeLeadSources(
    existing.source_seed_usernames,
    existing.relationship_types,
    incoming.newSeeds,
    incoming.newRelationship
  );
  const times = (existing.times_found || 1) + 1;
  const bestScore = Math.max(existing.best_score || 0, incoming.newScore);
  const matchReason = pickStrongestMatchReason(
    existing.match_reason || "",
    incoming.newMatchReason || ""
  );

  const matchKeywords = [...(existing.match_keywords || [])];
  for (const kw of incoming.newMatchKeywords || []) {
    if (!matchKeywords.includes(kw)) matchKeywords.push(kw);
  }

  const exchangeKeywords = [...(existing.exchange_keywords_matched || [])];
  for (const kw of incoming.newExchangeKeywords || []) {
    if (!exchangeKeywords.includes(kw)) exchangeKeywords.push(kw);
  }

  let status = existing.status || "new";
  if (!LOCKED_STATUSES.has(status) && status === "new" && times > 1) {
    status = "reviewed";
  }

  return {
    source_seed_usernames: seeds,
    relationship_types: relationships,
    times_found: times,
    best_score: bestScore,
    match_reason: matchReason,
    match_keywords: matchKeywords,
    exchange_keywords_matched: exchangeKeywords,
    status,
  };
}

export function hasExchangeAffiliation(
  lead: { match_keywords?: string[]; exchange_keywords_matched?: string[] },
  exchange: string
): boolean {
  const q = exchange.toLowerCase().trim();
  if (!q) return true;
  const inMatch = (lead.match_keywords || []).some((k) => k.toLowerCase().includes(q));
  const inExchange = (lead.exchange_keywords_matched || []).some((k) => k.toLowerCase().includes(q));
  return inMatch || inExchange;
}

export function isNewlyFoundLead(lead: {
  times_found?: number;
  first_scored_at?: string | null;
  last_seen_at?: string | null;
}): boolean {
  if ((lead.times_found ?? 1) <= 1) return true;
  const first = lead.first_scored_at ? new Date(lead.first_scored_at).getTime() : 0;
  const last = lead.last_seen_at ? new Date(lead.last_seen_at).getTime() : 0;
  if (!first || !last) return false;
  return last - first < 48 * 60 * 60 * 1000;
}

export function buildOutreachMessage(lead: {
  username: string;
  target_filter_type?: string;
  match_reason?: string;
  match_keywords?: string[];
}): string {
  const handle = lead.username.startsWith("@") ? lead.username : `@${lead.username}`;
  const target = targetTypeLabel(lead.target_filter_type);
  const keywords = (lead.match_keywords || []).slice(0, 3).join(", ");
  const signal = keywords || (lead.match_reason || "").split("|")[0]?.trim() || "your profile";
  return `Hi ${handle}, I came across your work (${target}) — ${signal}. Would love to connect about a potential partnership.`;
}

function escapeCsv(value: string): string {
  return `"${String(value).replace(/"/g, '""')}"`;
}

export function leadToCsvRow(lead: GraphLeadExportRow): Record<string, string> {
  const username = lead.username || "";
  return {
    username,
    display_name: lead.display_name || "",
    profile_url: graphProfileUrl(username),
    bio: (lead.bio || "").replace(/\n/g, " "),
    target_type: lead.target_filter_type || "",
    confidence_score: String(lead.confidence_score ?? ""),
    matched_keywords: (lead.match_keywords || []).join(";"),
    match_reason: (lead.match_reason || "").replace(/\n/g, " "),
    source_seeds: (lead.source_seed_usernames || []).join(";"),
    relationship_type: (lead.relationship_types || []).join(";"),
    status: lead.status || "",
    notes: (lead.notes || "").replace(/\n/g, " "),
    first_seen: lead.first_scored_at || "",
    last_seen: lead.last_seen_at || lead.updated_at || "",
  };
}

export function leadsToCsv(leads: GraphLeadExportRow[]): string {
  const header = CSV_EXPORT_HEADERS.join(",");
  const rows = leads.map((lead) => {
    const row = leadToCsvRow(lead);
    return CSV_EXPORT_HEADERS.map((h) => escapeCsv(row[h] || "")).join(",");
  });
  return [header, ...rows].join("\n");
}

export type LeadExportFilter = {
  qualifiedOnly?: boolean;
  targetType?: string;
  seed?: string;
  status?: string;
  minScore?: number;
  matchedKeyword?: string;
  exchange?: string;
  relationship?: string;
  newlyFoundOnly?: boolean;
  runId?: string;
};

export function filterLeadsForExport<T extends GraphLeadExportRow & {
  source_run_id?: string | null;
  times_found?: number;
  exchange_keywords_matched?: string[];
}>(
  leads: T[],
  filter: LeadExportFilter
): T[] {
  return leads.filter((l) => {
    if (filter.qualifiedOnly && l.status !== "qualified" && l.status !== "approved") return false;
    if (filter.runId && l.source_run_id !== filter.runId) return false;
    if (filter.targetType && filter.targetType !== "all" && l.target_filter_type !== filter.targetType) {
      return false;
    }
    if (filter.seed && !(l.source_seed_usernames || []).some((s) => s.toLowerCase().includes(filter.seed!.toLowerCase()))) {
      return false;
    }
    if (filter.status && filter.status !== "all" && l.status !== filter.status) return false;
    if ((filter.minScore ?? 0) > 0 && (l.confidence_score ?? 0) < filter.minScore!) return false;
    if (
      filter.matchedKeyword &&
      !(l.match_keywords || []).some((k) => k.toLowerCase().includes(filter.matchedKeyword!.toLowerCase()))
    ) {
      return false;
    }
    if (filter.exchange && !hasExchangeAffiliation(l, filter.exchange)) return false;
    if (
      filter.relationship &&
      filter.relationship !== "all" &&
      !(l.relationship_types || []).includes(filter.relationship)
    ) {
      return false;
    }
    if (filter.newlyFoundOnly && !isNewlyFoundLead(l)) return false;
    return true;
  });
}

export function sourceRunUrl(runId: string | null | undefined): string | null {
  if (!runId) return null;
  return `/admin/graph/runs/${runId}`;
}

export function profileTrailUrl(runId: string | null | undefined, username: string): string | null {
  if (!runId) return null;
  const q = encodeURIComponent(username.replace(/^@/, ""));
  return `/admin/graph/runs/${runId}?username=${q}`;
}
