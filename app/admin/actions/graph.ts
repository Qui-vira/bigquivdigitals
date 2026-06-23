"use server";

import { revalidatePath } from "next/cache";
import { verifySession } from "@/lib/auth";
import { getOutreachSupabaseAdmin } from "@/lib/supabase-outreach-admin";
import type { GraphLeadStatus, GraphScanMode, GraphScanPreset, GraphSeedType } from "@/lib/graph-types";
import {
  DEFAULT_PRESET,
  MAX_SEEDS_PER_RUN,
  ENABLED_SCAN_PRESETS,
  SCAN_PRESETS,
} from "@/lib/graph-types";
import {
  parseCustomKeywordsInput,
  TARGET_FILTER_PRESETS,
  type GraphTargetFilterType,
  type GraphTargetMatchMode,
  type GraphVerifiedFilter,
} from "@/lib/graph-target-filters";

const CONTROL_ROW_ID = "00000000-0000-0000-0000-000000000001";

const GRAPH_PATHS = [
  "/admin/graph/seeds",
  "/admin/graph/scan",
  "/admin/graph/pointers",
  "/admin/graph/runs",
  // dynamic run results — revalidated on scan start
  "/admin/graph/profiles",
  "/admin/graph/leads",
  "/admin/graph/budget",
  "/admin/graph/network",
];

async function requireAdmin() {
  const session = await verifySession();
  if (!session) throw new Error("Unauthorized");
  return session;
}

function revalidateGraph() {
  for (const p of GRAPH_PATHS) revalidatePath(p);
}

function normalizeUsername(username: string) {
  return username.replace(/^@/, "").trim().toLowerCase();
}

type ScanLimits = {
  preset_name: GraphScanPreset;
  max_seed_accounts: number;
  max_followers_per_seed: number;
  max_following_per_seed: number;
  max_total_profiles: number;
  max_cost_usd: number;
};

function resolvePresetLimits(formData: FormData, forceSingleSeed = false): ScanLimits {
  const preset = (String(formData.get("preset") || DEFAULT_PRESET) as GraphScanPreset) || DEFAULT_PRESET;
  if (preset === "large" || SCAN_PRESETS[preset]?.disabled) {
    throw new Error("Large preset is disabled until approved");
  }
  if (!ENABLED_SCAN_PRESETS.includes(preset)) {
    throw new Error("Selected preset is not enabled");
  }
  const base = SCAN_PRESETS[preset] || SCAN_PRESETS.test;
  const maxSeeds = forceSingleSeed
    ? 1
    : Math.min(Math.max(1, Number(formData.get("max_seed_accounts") || 1)), MAX_SEEDS_PER_RUN);
  return {
    preset_name: preset,
    max_seed_accounts: maxSeeds,
    max_followers_per_seed: Math.min(
      Number(formData.get("max_followers_per_seed") || base.max_followers_per_seed),
      base.max_followers_per_seed
    ),
    max_following_per_seed: Math.min(
      Number(formData.get("max_following_per_seed") || base.max_following_per_seed),
      base.max_following_per_seed
    ),
    max_total_profiles: Math.min(
      Number(formData.get("max_total_profiles") || base.max_total_profiles),
      base.max_total_profiles
    ),
    max_cost_usd: Math.min(Number(formData.get("max_cost_usd") || base.max_cost_usd), base.max_cost_usd),
  };
}

type TargetFilterInput = {
  enabled: boolean;
  filterType: GraphTargetFilterType;
  customKeywords: string[];
  matchMode: GraphTargetMatchMode;
  minScore: number;
  minFollowers: number;
  verifiedFilter: GraphVerifiedFilter;
  presetName?: string;
  savePresetName?: string;
};

function parseTargetFilterFromForm(formData: FormData): TargetFilterInput | null {
  if (formData.get("target_filter_enabled") !== "on") return null;
  const filterType = (String(formData.get("target_filter_type") || "bd") as GraphTargetFilterType) || "bd";
  const customKeywords = parseCustomKeywordsInput(String(formData.get("target_custom_keywords") || ""));
  const matchMode = (String(formData.get("target_match_mode") || "any") as GraphTargetMatchMode) || "any";
  const verifiedFilter =
    (String(formData.get("target_verified_filter") || "any") as GraphVerifiedFilter) || "any";
  const savePresetName =
    formData.get("save_filter_preset") === "on"
      ? String(formData.get("target_preset_name") || "").trim()
      : "";

  if (filterType === "custom" && customKeywords.length === 0) {
    return null;
  }

  return {
    enabled: true,
    filterType,
    customKeywords,
    // "all" mode only makes sense for custom keyword lists; presets are
    // variants of one role and can never match all keywords at once.
    matchMode: filterType !== "custom" ? "any" : matchMode === "all" ? "all" : "any",
    minScore: Math.min(100, Math.max(0, Number(formData.get("target_min_score") || 0))),
    minFollowers: Math.max(0, Number(formData.get("target_min_followers") || 0)),
    verifiedFilter,
    presetName: savePresetName || undefined,
    savePresetName: savePresetName || undefined,
  };
}

function resolveTargetKeywords(filter: TargetFilterInput): string[] {
  if (filter.filterType === "custom") return filter.customKeywords;
  return TARGET_FILTER_PRESETS[filter.filterType]?.keywords || [];
}

async function saveTargetFilterPreset(
  supabase: ReturnType<typeof getOutreachSupabaseAdmin>,
  filter: TargetFilterInput
) {
  if (!filter.savePresetName) return;
  const keywords = filter.filterType === "custom" ? filter.customKeywords : resolveTargetKeywords(filter);
  await supabase.from("graph_scan_filter_presets").upsert(
    {
      name: filter.savePresetName,
      filter_type: filter.filterType,
      keywords,
      match_mode: filter.matchMode,
      min_score: filter.minScore,
      min_followers: filter.minFollowers,
      verified_filter: filter.verifiedFilter,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "name" }
  );
}

async function createGraphScanRun(options: {
  scanMode: GraphScanMode;
  limits: ScanLimits;
  depth: number;
  depth2Confirmed: boolean;
  skipAlreadyScanned: boolean;
  selectedSeedId?: string | null;
  resumeFromCursor?: boolean;
  targetFilter?: TargetFilterInput | null;
  stopLossEnabled?: boolean;
}) {
  const supabase = getOutreachSupabaseAdmin();
  const { data: controls } = await supabase
    .from("graph_job_controls")
    .select("command, active_run_id")
    .eq("id", CONTROL_ROW_ID)
    .single();

  if (controls?.command === "start" || controls?.command === "resume") {
    return { ok: false as const, error: "A scan is already active" };
  }

  if (options.depth === 2) {
    if (!options.depth2Confirmed) return { ok: false as const, error: "Depth 2 requires explicit confirmation" };
    const { data: depthControls } = await supabase
      .from("graph_job_controls")
      .select("depth_2_enabled")
      .eq("id", CONTROL_ROW_ID)
      .single();
    if (!depthControls?.depth_2_enabled) {
      return { ok: false as const, error: "Depth 2 is disabled in settings" };
    }
  }

  if (options.selectedSeedId) {
    const { data: seed } = await supabase
      .from("graph_seed_accounts")
      .select("id, enabled")
      .eq("id", options.selectedSeedId)
      .single();
    if (!seed) return { ok: false as const, error: "Selected seed not found" };
    if (!seed.enabled) return { ok: false as const, error: "Selected seed is disabled" };
  }

  const runPayload: Record<string, unknown> = {
    status: "queued",
    scan_mode: options.scanMode,
    depth: options.depth === 2 ? 2 : 1,
    depth_2_confirmed: options.depth2Confirmed,
    skip_already_scanned: options.skipAlreadyScanned,
    resume_from_cursor: options.resumeFromCursor !== false,
    run_source: "manual",
    ...options.limits,
  };

  if (options.selectedSeedId) {
    runPayload.selected_seed_id = options.selectedSeedId;
    runPayload.max_seed_accounts = 1;
  }

  if (options.targetFilter?.enabled) {
    const tf = options.targetFilter;
    runPayload.target_filter_enabled = true;
    runPayload.target_filter_type = tf.filterType;
    runPayload.target_keywords = tf.filterType === "custom" ? tf.customKeywords : resolveTargetKeywords(tf);
    runPayload.target_match_mode = tf.matchMode;
    runPayload.target_min_score = tf.minScore;
    runPayload.target_min_followers = tf.minFollowers;
    runPayload.target_verified_filter = tf.verifiedFilter;
    if (tf.presetName) runPayload.target_filter_preset_name = tf.presetName;
  }

  runPayload.stop_loss_enabled = options.stopLossEnabled !== false;
  runPayload.stop_loss_sample_size = 20;
  runPayload.stop_loss_min_matches = 1;

  let runResult = await supabase.from("graph_scan_runs").insert(runPayload).select("id").single();
  if (
    runResult.error?.message?.includes("depth_2_confirmed") ||
    runResult.error?.message?.includes("preset_name") ||
    runResult.error?.message?.includes("run_source") ||
    runResult.error?.message?.includes("selected_seed_id") ||
    runResult.error?.message?.includes("resume_from_cursor") ||
    runResult.error?.message?.includes("target_filter")
  ) {
    const {
      preset_name: _p,
      depth_2_confirmed: _d,
      run_source: _r,
      selected_seed_id: _s,
      resume_from_cursor: _rf,
      target_filter_enabled: _tfe,
      target_filter_type: _tft,
      target_keywords: _tk,
      target_match_mode: _tmm,
      target_min_score: _tms,
      target_min_followers: _tmf,
      target_verified_filter: _tvf,
      target_filter_preset_name: _tpn,
      ...legacyPayload
    } = runPayload;
    if (options.depth === 2 || options.selectedSeedId || options.targetFilter?.enabled) {
      const msg = runResult.error?.message || "";
      return {
        ok: false as const,
        error: msg.includes("target_filter")
          ? "Apply scripts/graph_leads_schema_v7_target_filters.sql for target filters"
          : msg.includes("selected_seed_id")
            ? "Apply scripts/graph_leads_schema_v5_selected_seed.sql for seed-specific scans"
            : "Depth 2 or schema fields require migration",
      };
    }
    runResult = await supabase.from("graph_scan_runs").insert(legacyPayload).select("id").single();
  }

  const { data: run, error: runError } = runResult;
  if (runError || !run) return { ok: false as const, error: runError?.message || "Failed to create run" };

  if (options.targetFilter?.savePresetName) {
    try {
      await saveTargetFilterPreset(supabase, options.targetFilter);
    } catch {
      // preset save is optional; run still proceeds
    }
  }

  const { error: ctrlError } = await supabase
    .from("graph_job_controls")
    .update({ command: "start", active_run_id: run.id, updated_by: "dashboard" })
    .eq("id", CONTROL_ROW_ID);

  revalidateGraph();
  return { ok: !ctrlError, runId: run.id, error: ctrlError?.message };
}

export async function createSeed(formData: FormData) {
  await requireAdmin();
  const supabase = getOutreachSupabaseAdmin();
  const username = normalizeUsername(String(formData.get("username") || ""));
  if (!username) return { ok: false, error: "Username required" };

  const { error } = await supabase.from("graph_seed_accounts").insert({
    username,
    seed_type: (formData.get("seed_type") as GraphSeedType) || "custom",
    display_name: String(formData.get("display_name") || ""),
    priority: Number(formData.get("priority") || 50),
    enabled: formData.get("enabled") === "on",
    is_high_value: formData.get("is_high_value") === "on",
    notes: String(formData.get("notes") || ""),
  });
  revalidateGraph();
  return { ok: !error, error: error?.message };
}

export async function updateSeed(seedId: string, formData: FormData) {
  await requireAdmin();
  const supabase = getOutreachSupabaseAdmin();
  const { error } = await supabase
    .from("graph_seed_accounts")
    .update({
      username: normalizeUsername(String(formData.get("username") || "")),
      seed_type: (formData.get("seed_type") as GraphSeedType) || "custom",
      display_name: String(formData.get("display_name") || ""),
      priority: Number(formData.get("priority") || 50),
      enabled: formData.get("enabled") === "on",
      is_high_value: formData.get("is_high_value") === "on",
      notes: String(formData.get("notes") || ""),
    })
    .eq("id", seedId);
  revalidateGraph();
  return { ok: !error, error: error?.message };
}

export async function toggleSeed(seedId: string, enabled: boolean) {
  await requireAdmin();
  const supabase = getOutreachSupabaseAdmin();
  const { error } = await supabase.from("graph_seed_accounts").update({ enabled }).eq("id", seedId);
  revalidateGraph();
  return { ok: !error, error: error?.message };
}

export async function startGraphScan(formData: FormData) {
  await requireAdmin();
  const scanMode = (formData.get("scan_mode") as GraphScanMode) || "both";
  const seedSelection = String(formData.get("seed_account_id") || "auto");
  const selectedSeedId = seedSelection !== "auto" ? seedSelection : null;
  let limits: ScanLimits;
  try {
    limits = resolvePresetLimits(formData, Boolean(selectedSeedId));
  } catch (err) {
    return { ok: false as const, error: err instanceof Error ? err.message : "Invalid preset" };
  }
  const depth = Number(formData.get("depth") || 1);

  const targetFilter = parseTargetFilterFromForm(formData);
  if (formData.get("target_filter_enabled") === "on" && !targetFilter) {
    return { ok: false as const, error: "Target filter enabled but custom keywords are empty" };
  }

  return createGraphScanRun({
    scanMode,
    limits,
    depth,
    depth2Confirmed: formData.get("depth_2_confirmed") === "on",
    skipAlreadyScanned: formData.get("skip_already_scanned") !== "off",
    selectedSeedId,
    resumeFromCursor: formData.get("resume_mode") !== "restart",
    targetFilter,
    stopLossEnabled: formData.get("stop_loss_enabled") !== "off",
  });
}

export async function startGraphScanForSeed(seedId: string, preset: GraphScanPreset = "test") {
  await requireAdmin();
  const base = SCAN_PRESETS[preset] || SCAN_PRESETS.test;
  return createGraphScanRun({
    scanMode: "both",
    limits: {
      preset_name: preset,
      max_seed_accounts: 1,
      max_followers_per_seed: base.max_followers_per_seed,
      max_following_per_seed: base.max_following_per_seed,
      max_total_profiles: base.max_total_profiles,
      max_cost_usd: base.max_cost_usd,
    },
    depth: 1,
    depth2Confirmed: false,
    skipAlreadyScanned: true,
    selectedSeedId: seedId,
    resumeFromCursor: true,
  });
}

export async function updateGraphCronSettings(formData: FormData) {
  await requireAdmin();
  const supabase = getOutreachSupabaseAdmin();
  const payload: Record<string, unknown> = {
    cron_enabled: formData.get("cron_enabled") === "on",
    daily_scan_enabled: formData.get("daily_scan_enabled") === "on",
    weekly_scan_enabled: formData.get("weekly_scan_enabled") === "on",
    depth_2_enabled: formData.get("depth_2_enabled") === "on",
    daily_scan_hour_utc: Number(formData.get("daily_scan_hour_utc") ?? 3),
    weekly_scan_day: Number(formData.get("weekly_scan_day") ?? 0),
    weekly_scan_hour_utc: Number(formData.get("weekly_scan_hour_utc") ?? 3),
    updated_by: "dashboard",
  };
  const dailyBudget = formData.get("global_max_cost_usd_per_day");
  const weeklyBudget = formData.get("global_max_cost_usd_per_week");
  if (dailyBudget) {
    const daily = Number(dailyBudget);
    payload.global_max_cost_usd_per_day = daily;
    payload.max_daily_budget_usd = daily;
  }
  if (weeklyBudget) {
    const weekly = Number(weeklyBudget);
    payload.max_weekly_budget_usd = weekly;
    payload.global_max_cost_usd_per_week = weekly;
  }

  let { error } = await supabase.from("graph_job_controls").update(payload).eq("id", CONTROL_ROW_ID);
  if (error?.message?.includes("global_max_cost_usd_per_week")) {
    const { global_max_cost_usd_per_week: _w, ...fallback } = payload;
    ({ error } = await supabase.from("graph_job_controls").update(fallback).eq("id", CONTROL_ROW_ID));
  }
  revalidateGraph();
  return { ok: !error, error: error?.message };
}

export async function pauseGraphScan() {
  await requireAdmin();
  const supabase = getOutreachSupabaseAdmin();
  const { error } = await supabase
    .from("graph_job_controls")
    .update({ command: "pause", updated_by: "dashboard" })
    .eq("id", CONTROL_ROW_ID);
  revalidateGraph();
  return { ok: !error, error: error?.message };
}

export async function resumeGraphScan() {
  await requireAdmin();
  const supabase = getOutreachSupabaseAdmin();
  const { error } = await supabase
    .from("graph_job_controls")
    .update({ command: "resume", updated_by: "dashboard" })
    .eq("id", CONTROL_ROW_ID);
  revalidateGraph();
  return { ok: !error, error: error?.message };
}

export async function stopGraphScan() {
  await requireAdmin();
  const supabase = getOutreachSupabaseAdmin();
  const { error } = await supabase
    .from("graph_job_controls")
    .update({ command: "stop", updated_by: "dashboard" })
    .eq("id", CONTROL_ROW_ID);
  revalidateGraph();
  return { ok: !error, error: error?.message };
}

export async function updateGraphLeadStatus(leadId: string, status: GraphLeadStatus) {
  await requireAdmin();
  const supabase = getOutreachSupabaseAdmin();
  const { error } = await supabase.from("graph_leads").update({ status }).eq("id", leadId);
  revalidateGraph();
  return { ok: !error, error: error?.message };
}

export async function approveGraphLead(leadId: string) {
  return updateGraphLeadStatus(leadId, "approved");
}

export async function rejectGraphLead(leadId: string) {
  return updateGraphLeadStatus(leadId, "rejected");
}

export async function markGraphLeadReviewed(leadId: string) {
  return updateGraphLeadStatus(leadId, "reviewed");
}

export async function markGraphLeadQualified(leadId: string) {
  return updateGraphLeadStatus(leadId, "qualified");
}

export async function saveGraphLeadNotes(leadId: string, notes: string) {
  await requireAdmin();
  const supabase = getOutreachSupabaseAdmin();
  const { error } = await supabase.from("graph_leads").update({ notes }).eq("id", leadId);
  revalidateGraph();
  return { ok: !error, error: error?.message };
}

type LeadExportOptions = {
  qualifiedOnly?: boolean;
  approvedOnly?: boolean;
  targetType?: string;
  seed?: string;
  runId?: string;
  status?: string;
  minScore?: number;
  matchedKeyword?: string;
  exchange?: string;
  relationship?: string;
  newlyFoundOnly?: boolean;
};

async function fetchLeadsForExport() {
  const supabase = getOutreachSupabaseAdmin();
  const select = `
    id, username, status, notes, source_run_id, is_junk,
    target_filter_type, match_keywords, match_reason, match_fields,
    source_seed_usernames, relationship_types, exchange_keywords_matched,
    first_scored_at, last_seen_at, updated_at, times_found, best_score,
    graph_profiles ( username, display_name, bio )
  `;
  const { data, error } = await supabase
    .from("graph_leads")
    .select(select)
    .order("updated_at", { ascending: false })
    .limit(500);
  if (error?.message?.includes("times_found") || error?.message?.includes("best_score")) {
    const fallback = await supabase
      .from("graph_leads")
      .select(
        `id, username, status, notes, source_run_id, is_junk,
        target_filter_type, match_keywords, match_reason,
        source_seed_usernames, relationship_types, exchange_keywords_matched,
        first_scored_at, updated_at,
        graph_profiles ( username, display_name, bio )`
      )
      .order("updated_at", { ascending: false })
      .limit(500);
    return (fallback.data || []) as Record<string, unknown>[];
  }
  return (data || []) as Record<string, unknown>[];
}

export async function exportGraphLeadsCsv(options: LeadExportOptions = {}) {
  await requireAdmin();
  const { filterLeadsForExport, leadsToCsv } = await import("@/lib/graph-leads");
  const supabase = getOutreachSupabaseAdmin();

  const raw = await fetchLeadsForExport();
  const leadIds = raw.map((r) => r.id as string);
  const scoreMap: Record<string, number> = {};
  if (leadIds.length) {
    const { data: scores } = await supabase
      .from("graph_lead_scores")
      .select("lead_id, score")
      .in("lead_id", leadIds)
      .order("scored_at", { ascending: false });
    for (const row of scores || []) {
      if (!scoreMap[row.lead_id]) scoreMap[row.lead_id] = row.score;
    }
  }

  const enriched = raw
    .filter((r) => r.is_junk !== true)
    .map((r) => {
      const profileRaw = r.graph_profiles as
        | { display_name?: string; bio?: string }
        | { display_name?: string; bio?: string }[]
        | null;
      const profile = Array.isArray(profileRaw) ? profileRaw[0] : profileRaw;
      const best = Number(r.best_score || 0);
      const score = best > 0 ? best : scoreMap[r.id as string];
      return {
        username: r.username as string,
        display_name: profile?.display_name || "",
        bio: profile?.bio || "",
        target_filter_type: (r.target_filter_type as string) || "",
        confidence_score: score,
        match_keywords: (r.match_keywords as string[]) || [],
        match_reason: (r.match_reason as string) || "",
        source_seed_usernames: (r.source_seed_usernames as string[]) || [],
        relationship_types: (r.relationship_types as string[]) || [],
        exchange_keywords_matched: (r.exchange_keywords_matched as string[]) || [],
        status: r.status as string,
        notes: (r.notes as string) || "",
        first_scored_at: (r.first_scored_at as string) || "",
        last_seen_at: (r.last_seen_at as string) || (r.updated_at as string) || "",
        updated_at: (r.updated_at as string) || "",
        times_found: Number(r.times_found || 1),
        source_run_id: (r.source_run_id as string) || null,
      };
    });

  let filtered = filterLeadsForExport(enriched, {
    qualifiedOnly: options.qualifiedOnly || options.approvedOnly,
    targetType: options.targetType,
    seed: options.seed,
    runId: options.runId,
    status: options.status,
    minScore: options.minScore,
    matchedKeyword: options.matchedKeyword,
    exchange: options.exchange,
    relationship: options.relationship,
    newlyFoundOnly: options.newlyFoundOnly,
  });

  if (!options.qualifiedOnly && !options.approvedOnly && !options.status) {
    filtered = filtered.filter((l) => !["rejected", "duplicate", "do_not_contact"].includes(l.status || ""));
  }

  const csv = leadsToCsv(filtered);
  const tag = options.qualifiedOnly
    ? "qualified"
    : options.targetType && options.targetType !== "all"
      ? options.targetType
      : options.seed
        ? `seed-${options.seed}`
        : options.runId
          ? `run-${options.runId.slice(0, 8)}`
          : "all";

  if (options.approvedOnly && filtered.length) {
    await supabase
      .from("graph_leads")
      .update({ status: "exported" })
      .in(
        "id",
        raw.filter((r) => filtered.some((f) => f.username === r.username)).map((r) => r.id as string)
      );
    revalidateGraph();
  }

  return {
    ok: true,
    csv,
    count: filtered.length,
    filename: `graph-leads-${tag}-${new Date().toISOString().slice(0, 10)}.csv`,
  };
}

/** @deprecated Use exportGraphLeadsCsv */
export async function exportGraphLeads(approvedOnly = false) {
  return exportGraphLeadsCsv({ approvedOnly });
}

export async function exportRunProfilesCsv(runId: string) {
  await requireAdmin();
  const { leadsToCsv } = await import("@/lib/graph-leads");
  const supabase = getOutreachSupabaseAdmin();

  const { data: profiles } = await supabase
    .from("graph_run_profiles")
    .select(
      "username, display_name, bio, status, match_keywords, match_reason, seed_username, relationship_type, created_at"
    )
    .eq("scan_run_id", runId)
    .in("status", ["classified_as_lead", "stored"])
    .order("result_index", { ascending: true });

  const { data: run } = await supabase
    .from("graph_scan_runs")
    .select("target_filter_type")
    .eq("id", runId)
    .maybeSingle();

  const rows = (profiles || []).map((p) => ({
    username: p.username,
    display_name: p.display_name || "",
    bio: p.bio || "",
    target_filter_type: run?.target_filter_type || "",
    confidence_score: undefined,
    match_keywords: p.match_keywords || [],
    match_reason: p.match_reason || "",
    source_seed_usernames: p.seed_username ? [p.seed_username] : [],
    relationship_types: p.relationship_type ? [p.relationship_type] : [],
    status: p.status,
    notes: "",
    first_scored_at: p.created_at,
    last_seen_at: p.created_at,
  }));

  return {
    ok: true,
    csv: leadsToCsv(rows),
    count: rows.length,
    filename: `run-results-${runId.slice(0, 8)}-${new Date().toISOString().slice(0, 10)}.csv`,
  };
}

export async function promoteGraphLeadToKol(leadId: string) {
  await requireAdmin();
  const supabase = getOutreachSupabaseAdmin();

  const { data: lead } = await supabase.from("graph_leads").select("*").eq("id", leadId).single();

  if (!lead) return { ok: false, error: "Lead not found" };

  const { data: profile } = await supabase
    .from("graph_profiles")
    .select("bio, website, follower_count")
    .eq("id", lead.profile_id)
    .maybeSingle();

  const { data: scoreRow } = await supabase
    .from("graph_lead_scores")
    .select("score, score_reason")
    .eq("lead_id", leadId)
    .order("scored_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const handle = lead.username.startsWith("@") ? lead.username : `@${lead.username}`;
  const notes = [
    `source=x_graph_scanner`,
    `graph_run_id=${lead.source_run_id || ""}`,
    `seeds=${(lead.source_seed_usernames || []).join(",")}`,
    `relationships=${(lead.relationship_types || []).join(",")}`,
    `score=${scoreRow?.score ?? ""}`,
    `score_reason=${scoreRow?.score_reason || lead.score_reason || ""}`,
  ].join(" | ");

  const { data: kolLead, error: kolError } = await supabase
    .from("kol_leads")
    .upsert(
      {
        lead_type: "new_exchange",
        project_name: lead.username,
        twitter_handle: handle,
        website: profile?.website || lead.contact_route || "",
        description: profile?.bio || "",
        score: scoreRow?.score || 0,
        priority: (scoreRow?.score || 0) >= 60 ? "high" : "normal",
        source: "x_graph_scanner",
        notes,
        outreach_status: "not_contacted",
      },
      { onConflict: "project_name,lead_type" }
    )
    .select("id")
    .single();

  if (kolError || !kolLead) return { ok: false, error: kolError?.message || "KOL promote failed" };

  await supabase
    .from("graph_leads")
    .update({ status: "exported", promoted_kol_lead_id: kolLead.id })
    .eq("id", leadId);

  revalidateGraph();
  revalidatePath("/admin/outreach");
  return { ok: true, kolLeadId: kolLead.id };
}

export async function promotePointerToSeed(pointerId: string) {
  await requireAdmin();
  const supabase = getOutreachSupabaseAdmin();
  const { data: ptr } = await supabase
    .from("graph_bd_pointers")
    .select("*")
    .eq("id", pointerId)
    .single();
  if (!ptr) return { ok: false, error: "Pointer not found" };

  const username = normalizeUsername(ptr.username);
  const { data: existing } = await supabase
    .from("graph_seed_accounts")
    .select("id")
    .eq("username", username)
    .maybeSingle();

  if (existing?.id) {
    const { error } = await supabase
      .from("graph_seed_accounts")
      .update({
        seed_type: "bd",
        priority: 85,
        enabled: true,
        is_high_value: true,
        notes: `Promoted from BD pointer (score ${ptr.pointer_score})`,
      })
      .eq("id", existing.id);
    if (error) return { ok: false, error: error.message };
  } else {
    const { error } = await supabase.from("graph_seed_accounts").insert({
      username,
      seed_type: "bd",
      display_name: ptr.display_name || "",
      priority: 85,
      enabled: true,
      is_high_value: true,
      notes: `Promoted from BD pointer (score ${ptr.pointer_score})`,
    });
    if (error) return { ok: false, error: error.message };
  }

  await supabase
    .from("graph_bd_pointers")
    .update({ pointer_status: "promoted", updated_at: new Date().toISOString() })
    .eq("id", pointerId);

  revalidateGraph();
  return { ok: true };
}

export async function rejectBdPointer(pointerId: string) {
  await requireAdmin();
  const supabase = getOutreachSupabaseAdmin();
  const { error } = await supabase
    .from("graph_bd_pointers")
    .update({ pointer_status: "rejected", updated_at: new Date().toISOString() })
    .eq("id", pointerId);
  revalidateGraph();
  return { ok: !error, error: error?.message };
}

export async function startMicroScanFromPointer(pointerId: string) {
  await requireAdmin();
  const supabase = getOutreachSupabaseAdmin();
  const { data: ptr } = await supabase
    .from("graph_bd_pointers")
    .select("*")
    .eq("id", pointerId)
    .single();
  if (!ptr) return { ok: false as const, error: "Pointer not found" };

  const expansionAction = ptr.expansion_action || "";
  if (expansionAction === "do_not_expand" || expansionAction === "pause_seed") {
    return {
      ok: false as const,
      error:
        "This account is a lead, but has not proven useful as a seed. Try a higher expansion-score pointer.",
    };
  }

  const username = normalizeUsername(ptr.username);
  let seedId: string | null = null;
  const { data: existing } = await supabase
    .from("graph_seed_accounts")
    .select("id")
    .eq("username", username)
    .maybeSingle();
  if (existing?.id) {
    seedId = existing.id;
  } else {
    const { data: created, error: createErr } = await supabase
      .from("graph_seed_accounts")
      .insert({
        username,
        seed_type: "bd",
        display_name: ptr.display_name || "",
        priority: 80,
        enabled: true,
        is_high_value: (ptr.lead_score ?? ptr.pointer_score) >= 60,
        notes: `Micro scan from BD pointer (expansion ${ptr.expansion_score ?? ptr.pointer_score})`,
      })
      .select("id")
      .single();
    if (createErr || !created) return { ok: false as const, error: createErr?.message || "Failed to create seed" };
    seedId = created.id;
  }

  const micro = SCAN_PRESETS.micro || SCAN_PRESETS.test;
  const filterType = (ptr.recommended_target_filter || "bd") as GraphTargetFilterType;

  return createGraphScanRun({
    scanMode: (ptr.recommended_scan_mode as GraphScanMode) || "following",
    limits: {
      preset_name: "micro",
      max_seed_accounts: 1,
      max_followers_per_seed: micro.max_followers_per_seed,
      max_following_per_seed: micro.max_following_per_seed,
      max_total_profiles: micro.max_total_profiles,
      max_cost_usd: micro.max_cost_usd,
    },
    depth: 1,
    depth2Confirmed: false,
    skipAlreadyScanned: true,
    selectedSeedId: seedId,
    resumeFromCursor: true,
    stopLossEnabled: true,
    targetFilter: {
      enabled: true,
      filterType,
      customKeywords: [],
      matchMode: "any",
      minScore: 0,
      minFollowers: 0,
      verifiedFilter: "any",
    },
  });
}
