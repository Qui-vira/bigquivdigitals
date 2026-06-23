import { verifySession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getOutreachSupabaseAdmin } from "@/lib/supabase-outreach-admin";
import type {
  GraphCronStatus,
  GraphJobControls,
  GraphScanFilterPreset,
  GraphSeedAccount,
} from "@/lib/graph-types";
import { nextDailyRunUtc, nextWeeklyRunUtc, sumCostsSince } from "@/lib/graph-cron-utils";
import ScanControl from "./ScanControl";

const CONTROL_ROW_ID = "00000000-0000-0000-0000-000000000001";

const RUN_SELECT =
  "id, status, profiles_collected, profiles_classified, edges_created, estimated_cost_usd, actual_cost_usd, apify_profiles_fetched, profiles_stored, profiles_skipped, leads_created, target_filter_enabled, stopped_reason, skip_already_scanned, selected_seed_id, preset_name, run_source, created_at, started_at, completed_at";

export default async function GraphScanPage() {
  const session = await verifySession();
  if (!session) redirect("/admin/login");

  const supabase = getOutreachSupabaseAdmin();
  const { data: enabledSeeds } = await supabase
    .from("graph_seed_accounts")
    .select("id, username, display_name, seed_type, priority, last_scanned_at, enabled")
    .eq("enabled", true)
    .order("priority", { ascending: false });

  const enabledSeedList = (enabledSeeds || []) as GraphSeedAccount[];
  const { data: cursorRows } = await supabase
    .from("graph_seed_cursors")
    .select(
      "seed_account_id, relationship_type, cursor_value, page_number, profiles_fetched, provider_supports_resume, updated_at"
    );
  const cursorsBySeed = new Map<string, GraphSeedAccount["cursors"]>();
  for (const row of cursorRows || []) {
    const list = cursorsBySeed.get(row.seed_account_id) || [];
    list.push({
      relationship_type: row.relationship_type,
      cursor_value: row.cursor_value || "",
      page_number: row.page_number || 0,
      profiles_fetched: row.profiles_fetched || 0,
      provider_supports_resume: row.provider_supports_resume ?? true,
      updated_at: row.updated_at,
    });
    cursorsBySeed.set(row.seed_account_id, list);
  }
  const enabledSeedsWithCursors = enabledSeedList.map((seed) => ({
    ...seed,
    cursors: cursorsBySeed.get(seed.id) || [],
  }));

  const { data: controls } = await supabase
    .from("graph_job_controls")
    .select(
      "id, active_run_id, command, cron_enabled, daily_scan_enabled, weekly_scan_enabled, daily_scan_hour_utc, weekly_scan_day, weekly_scan_hour_utc, max_daily_budget_usd, max_weekly_budget_usd, global_max_cost_usd_per_day, global_max_cost_usd_per_week, depth_2_enabled, last_daily_cron_at, last_weekly_cron_at"
    )
    .eq("id", CONTROL_ROW_ID)
    .single();

  const controlsRow: GraphJobControls = (controls as GraphJobControls | null) || {
    id: CONTROL_ROW_ID,
    active_run_id: null,
    command: "idle",
    cron_enabled: false,
    daily_scan_enabled: false,
    weekly_scan_enabled: false,
    daily_scan_hour_utc: 3,
    weekly_scan_day: 0,
    weekly_scan_hour_utc: 3,
    depth_2_enabled: false,
  };

  const { data: latestRun } = await supabase
    .from("graph_scan_runs")
    .select(RUN_SELECT)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const displayRunId = controlsRow.active_run_id || latestRun?.id;
  const { data: displayRun } = displayRunId
    ? await supabase.from("graph_scan_runs").select(RUN_SELECT).eq("id", displayRunId).single()
    : { data: latestRun };

  let skipBreakdown: Record<string, number> | null = null;
  if (displayRun?.id && displayRun?.status === "completed") {
    const { data: statusRows } = await supabase
      .from("graph_run_profiles")
      .select("status")
      .eq("scan_run_id", displayRun.id)
      .limit(2000);
    if (statusRows && statusRows.length > 0) {
      skipBreakdown = {};
      for (const row of statusRows) {
        skipBreakdown[row.status] = (skipBreakdown[row.status] || 0) + 1;
      }
    }
  }

  let selectedSeedUsername: string | null = null;
  if (displayRun?.selected_seed_id) {
    const { data: seed } = await supabase
      .from("graph_seed_accounts")
      .select("username")
      .eq("id", displayRun.selected_seed_id)
      .maybeSingle();
    selectedSeedUsername = seed?.username ?? null;
  }

  const weekAgo = new Date();
  weekAgo.setUTCDate(weekAgo.getUTCDate() - 8);
  const { data: recentRuns } = await supabase
    .from("graph_scan_runs")
    .select("id, status, estimated_cost_usd, created_at, run_source, cron_kind")
    .gte("created_at", weekAgo.toISOString())
    .order("created_at", { ascending: false })
    .limit(100);

  const runs = recentRuns || [];
  const now = new Date();
  const dayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const weekStart = new Date(dayStart);
  const mondayOffset = (now.getUTCDay() + 6) % 7;
  weekStart.setUTCDate(weekStart.getUTCDate() - mondayOffset);

  const cronRuns = runs.filter(
    (r) => r.run_source === "daily_cron" || r.run_source === "weekly_cron"
  );
  const lastCron = cronRuns[0];

  const workerCronEnvRaw = process.env.GRAPH_WORKER_CRON_ENABLED;
  const { data: savedFilterPresets } = await supabase
    .from("graph_scan_filter_presets")
    .select("id, name, filter_type, keywords, match_mode, min_score, min_followers, verified_filter")
    .order("name", { ascending: true });

  const cronStatus: GraphCronStatus = {
    workerCronEnvKnown: workerCronEnvRaw !== undefined,
    workerCronEnvEnabled: workerCronEnvRaw === "true",
    nextDailyUtc: nextDailyRunUtc(controlsRow, now)?.toISOString() ?? null,
    nextWeeklyUtc: nextWeeklyRunUtc(controlsRow, now)?.toISOString() ?? null,
    lastCronRunId: lastCron?.id ?? null,
    lastCronRunStatus: lastCron?.status ?? null,
    lastCronRunSource: lastCron?.run_source ?? null,
    dailyBudgetUsed: sumCostsSince(runs, dayStart),
    weeklyBudgetUsed: sumCostsSince(runs, weekStart),
    dailyBudgetCap: Number(
      controlsRow.global_max_cost_usd_per_day ??
        controlsRow.max_daily_budget_usd ??
        5
    ),
    weeklyBudgetCap: Number(
      controlsRow.global_max_cost_usd_per_week ??
        controlsRow.max_weekly_budget_usd ??
        20
    ),
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-white">X Graph Scanner</h1>
      <p className="mt-1 text-sm text-[#888]">
        Production graph scanning from the dashboard. Enable automation for scheduled daily or weekly runs.
      </p>
      <ScanControl
        controls={controlsRow as GraphJobControls}
        latestRun={displayRun}
        runSkipBreakdown={skipBreakdown}
        selectedSeedUsername={selectedSeedUsername}
        cronStatus={cronStatus}
        enabledSeeds={enabledSeedsWithCursors}
        savedFilterPresets={(savedFilterPresets || []) as GraphScanFilterPreset[]}
      />
    </div>
  );
}
