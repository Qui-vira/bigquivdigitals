export type GraphSeedType =
  | "exchange"
  | "kol"
  | "bd"
  | "founder"
  | "competitor"
  | "custom";

export type GraphScanMode = "followers" | "following" | "both";

export type GraphScanPreset = "test" | "micro" | "small" | "medium" | "large";

export type GraphRunStatus =
  | "queued"
  | "running"
  | "paused"
  | "completed"
  | "stopped"
  | "failed"
  | "budget_exceeded";

export type GraphLeadStatus =
  | "new"
  | "reviewed"
  | "qualified"
  | "approved"
  | "exported"
  | "contacted"
  | "replied"
  | "rejected"
  | "duplicate"
  | "do_not_contact";

export type GraphSeedCursor = {
  relationship_type: "follower" | "following";
  cursor_value: string;
  page_number: number;
  profiles_fetched: number;
  provider_supports_resume: boolean;
  updated_at: string;
};

export type GraphSeedAccount = {
  id: string;
  username: string;
  x_user_id: string;
  seed_type: GraphSeedType;
  display_name: string;
  priority: number;
  enabled: boolean;
  is_high_value: boolean;
  notes: string;
  last_scanned_at: string | null;
  seed_quality_score?: number;
  bd_yield_rate?: number;
  cost_per_lead?: number;
  total_scan_cost?: number;
  bd_leads_found?: number;
  profiles_fetched_total?: number;
  skipped_target_filter_total?: number;
  last_quality_note?: string;
  recommended_action?: GraphSeedRecommendedAction;
  created_at: string;
  updated_at: string;
  cursors?: GraphSeedCursor[];
};

export type GraphSeedRecommendedAction =
  | "scan_more"
  | "following_only"
  | "micro_test"
  | "pause_seed"
  | "reject_seed";

export type GraphBdPointerCategory =
  | "confirmed_bd"
  | "likely_bd"
  | "kol_manager"
  | "partnership_lead"
  | "listing_lead"
  | "growth_lead"
  | "founder_operator"
  | "weak_crypto_user"
  | "reject_noise";

export type GraphBdPointer = {
  id: string;
  username: string;
  display_name: string;
  bio: string;
  pointer_score: number;
  lead_score?: number;
  expansion_score?: number;
  scan_priority_score?: number;
  category: GraphBdPointerCategory;
  recommendation_label?: string;
  expansion_action?: string;
  reasons: string[];
  source_usernames: string[];
  recommended_scan_mode: GraphScanMode;
  recommended_target_filter: string;
  pointer_status: "candidate" | "promoted" | "rejected";
  bd_lead_count?: number;
  cost_per_lead?: number;
  seed_yield_rate?: number;
  micro_scans_run?: number;
  proof_profiles_fetched?: number;
  proof_bd_leads_found?: number;
  proof_cost_usd?: number;
  proof_cost_per_lead?: number;
  last_scan_result?: string;
  last_expansion_result?: string;
  bd_network_followers?: number;
  bd_network_following?: number;
  notes?: string;
  updated_at: string;
};

export type GraphScanFilterPreset = {
  id: string;
  name: string;
  filter_type: string;
  keywords: string[];
  match_mode: "any" | "all";
  min_score: number;
  min_followers: number;
  verified_filter: "any" | "verified_only" | "exclude_verified";
};

export type GraphScanRun = {
  id: string;
  status: GraphRunStatus;
  scan_mode: GraphScanMode;
  depth: number;
  preset_name?: string;
  selected_seed_id?: string | null;
  target_filter_enabled?: boolean;
  target_filter_type?: string;
  target_keywords?: string[];
  target_match_mode?: "any" | "all";
  target_min_score?: number;
  target_min_followers?: number;
  target_verified_filter?: "any" | "verified_only" | "exclude_verified";
  target_filter_preset_name?: string;
  max_seed_accounts: number;
  max_followers_per_seed: number;
  max_following_per_seed: number;
  max_total_profiles: number;
  max_cost_usd: number;
  skip_already_scanned: boolean;
  seeds_processed: number;
  profiles_collected: number;
  profiles_classified: number;
  edges_created: number;
  apify_profiles_fetched?: number;
  profiles_stored?: number;
  profiles_skipped?: number;
  leads_created?: number;
  estimated_cost_usd: number;
  actual_cost_usd?: number;
  error_log: { at?: string; message: string }[];
  stopped_reason: string;
  /**
   * Which trigger started the run: "daily_cron", "weekly_cron", or manual.
   * A real text column on graph_scan_runs, read by the scan page to work out
   * when the crons last fired. It was missing from this type until 2026-09-08 —
   * Supabase's untyped client hid the gap, and moving to Neon surfaced it.
   */
  run_source?: string;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
};

export type GraphProfile = {
  id: string;
  username: string;
  display_name: string;
  bio: string;
  follower_count: number;
  following_count: number;
  verified: boolean;
  location: string;
  website: string;
  last_seen_at: string;
};

export type GraphLead = {
  id: string;
  profile_id: string;
  username: string;
  role_keywords_matched: string[];
  exchange_keywords_matched: string[];
  contact_route: string;
  source_seed_usernames: string[];
  relationship_types: string[];
  status: GraphLeadStatus;
  notes: string;
  score_reason?: string;
  is_junk?: boolean;
  source_run_id?: string | null;
  target_filter_type?: string;
  match_keywords?: string[];
  match_fields?: string[];
  match_reason?: string;
  bio?: string;
  display_name?: string;
  follower_count?: number;
  score?: number;
  times_found?: number;
  best_score?: number;
  first_scored_at?: string | null;
  last_seen_at?: string | null;
};

export type GraphBudgetLog = {
  id: string;
  scan_run_id: string | null;
  provider: string;
  actor_id: string;
  apify_run_id: string;
  profiles_collected: number;
  estimated_cost_usd: number;
  cumulative_cost_usd: number;
  stopped_reason: string;
  logged_at: string;
};

export type GraphJobControls = {
  id: string;
  active_run_id: string | null;
  command: "idle" | "start" | "pause" | "resume" | "stop";
  cron_enabled: boolean;
  daily_scan_enabled?: boolean;
  weekly_scan_enabled?: boolean;
  daily_scan_hour_utc?: number;
  weekly_scan_day?: number;
  weekly_scan_hour_utc?: number;
  max_daily_budget_usd?: number;
  max_weekly_budget_usd?: number;
  global_max_cost_usd_per_day?: number;
  global_max_cost_usd_per_week?: number;
  depth_2_enabled?: boolean;
  last_daily_cron_at?: string | null;
  last_weekly_cron_at?: string | null;
};

export type GraphCronStatus = {
  workerCronEnvKnown: boolean;
  workerCronEnvEnabled: boolean;
  nextDailyUtc: string | null;
  nextWeeklyUtc: string | null;
  lastCronRunId: string | null;
  lastCronRunStatus: string | null;
  lastCronRunSource: string | null;
  dailyBudgetUsed: number;
  weeklyBudgetUsed: number;
  dailyBudgetCap: number;
  weeklyBudgetCap: number;
};

export type GraphRunProfileStatus =
  | "fetched"
  | "stored"
  | "skipped_duplicate"
  | "skipped_already_scanned"
  | "skipped_target_filter"
  | "skipped_private"
  | "classified_as_lead"
  | "error";

export type GraphRunProfile = {
  id: string;
  scan_run_id: string;
  seed_account_id: string | null;
  seed_username: string;
  relationship_type: "follower" | "following";
  username: string;
  x_user_id: string;
  display_name: string;
  bio: string;
  follower_count: number;
  following_count: number;
  verified: boolean;
  website: string;
  location: string;
  apify_run_id: string;
  result_index: number;
  status: GraphRunProfileStatus;
  skip_reason: string;
  matched_keywords: string[];
  matched_fields: string[];
  match_reason: string;
  linked_profile_id: string | null;
  created_at: string;
};

export const SCAN_PRESETS: Record<
  GraphScanPreset,
  {
    label: string;
    max_followers_per_seed: number;
    max_following_per_seed: number;
    max_total_profiles: number;
    max_cost_usd: number;
    disabled?: boolean;
  }
> = {
  test: {
    label: "Test",
    max_followers_per_seed: 10,
    max_following_per_seed: 10,
    max_total_profiles: 20,
    max_cost_usd: 0.3,
  },
  small: {
    label: "Small",
    max_followers_per_seed: 25,
    max_following_per_seed: 25,
    max_total_profiles: 50,
    max_cost_usd: 0.75,
  },
  micro: {
    label: "Micro (BD test)",
    max_followers_per_seed: 0,
    max_following_per_seed: 20,
    max_total_profiles: 20,
    max_cost_usd: 0.3,
  },
  medium: {
    label: "Medium",
    max_followers_per_seed: 50,
    max_following_per_seed: 50,
    max_total_profiles: 100,
    max_cost_usd: 1.5,
  },
  large: {
    label: "Large (disabled)",
    max_followers_per_seed: 1000,
    max_following_per_seed: 1000,
    max_total_profiles: 2000,
    max_cost_usd: 30.0,
    disabled: true,
  },
};

export const PRESET_DESCRIPTIONS: Record<GraphScanPreset, string> = {
  test: "10 followers + 10 following, 20 max profiles, ~$0.30 cap",
  micro: "Following only, 20 max profiles, stop-loss ON — test BD seed yield",
  small: "25 followers + 25 following, 50 max profiles, ~$0.75 cap",
  medium: "50 followers + 50 following, 100 max profiles, ~$1.50 cap",
  large: "Disabled until approved — contact admin",
};

export const ENABLED_SCAN_PRESETS: GraphScanPreset[] = ["test", "micro", "small", "medium"];

export const MAX_SEEDS_PER_RUN = 5;
export const DEFAULT_PRESET: GraphScanPreset = "micro";

export const BD_SCAN_DEFAULTS = {
  scanMode: "following" as GraphScanMode,
  targetFilterEnabled: true,
  targetFilterType: "bd" as const,
  matchMode: "any" as const,
  targetMinScore: 0,
  stopLossEnabled: true,
};

/** @deprecated use SCAN_PRESETS.test */
export const PHASE1_LIMITS = {
  max_seed_accounts: 1,
  max_followers_per_seed: SCAN_PRESETS.test.max_followers_per_seed,
  max_following_per_seed: SCAN_PRESETS.test.max_following_per_seed,
  max_total_profiles: SCAN_PRESETS.test.max_total_profiles,
  max_cost_usd: SCAN_PRESETS.test.max_cost_usd,
  depth: 1,
} as const;

export const GRAPH_LEAD_STATUSES: GraphLeadStatus[] = [
  "new",
  "reviewed",
  "qualified",
  "contacted",
  "replied",
  "rejected",
  "duplicate",
  "approved",
  "exported",
  "do_not_contact",
];
