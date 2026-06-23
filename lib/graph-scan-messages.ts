export type RunStatusInput = {
  status: string;
  profiles_collected?: number;
  profiles_classified?: number;
  edges_created?: number;
  estimated_cost_usd?: number;
  actual_cost_usd?: number;
  apify_profiles_fetched?: number;
  profiles_stored?: number;
  profiles_skipped?: number;
  leads_created?: number;
  skip_already_scanned?: boolean;
  target_filter_enabled?: boolean;
  stopped_reason?: string;
};

export type RunSkipBreakdown = {
  skipped_already_scanned?: number;
  skipped_target_filter?: number;
  skipped_duplicate?: number;
  skipped_private?: number;
};

export function getRunStatusHint(
  run: RunStatusInput | null,
  command?: string,
  skipBreakdown?: RunSkipBreakdown | null
): string | null {
  if (!run) return null;

  if (run.status === "queued" || (command === "start" && run.status === "queued")) {
    return "Run queued, waiting for graph-worker.";
  }

  if (run.status === "running") {
    return "Scan in progress on graph-worker.";
  }

  if (run.status === "failed") {
    return run.stopped_reason ? `Scan failed: ${run.stopped_reason}` : "Scan failed.";
  }

  if (run.status === "stopped" && run.stopped_reason) {
    if (run.stopped_reason === "low_target_yield") {
      return "Scan stopped early because this seed is producing low-quality BD results.";
    }
    return `Scan stopped: ${run.stopped_reason}`;
  }

  if (run.status !== "completed") return null;

  const fetched = Number(run.apify_profiles_fetched ?? 0);
  const skipped = Number(run.profiles_skipped ?? 0);
  const stored = Number(run.profiles_stored ?? 0);
  const cost = Number(run.actual_cost_usd ?? run.estimated_cost_usd ?? 0);

  if (fetched === 0) {
    if (cost > 0) {
      return "Apify charged this run, but no profiles were stored. Check Apify run details.";
    }
    return "Scan completed, but Apify returned 0 profiles.";
  }

  if (skipped >= fetched && stored === 0) {
    const alreadyScanned = Number(skipBreakdown?.skipped_already_scanned ?? 0);
    const targetFiltered = Number(skipBreakdown?.skipped_target_filter ?? 0);

    if (targetFiltered > 0 && targetFiltered >= alreadyScanned) {
      return "Profiles were fetched but did not match the target filter.";
    }
    if (alreadyScanned > 0) {
      return "All fetched profiles were already scanned.";
    }
    if (run.target_filter_enabled) {
      return "Profiles were fetched but did not match the target filter.";
    }
    if (run.skip_already_scanned) {
      return "All fetched profiles were already scanned.";
    }
    return "Scan completed, but all fetched profiles were skipped.";
  }

  return null;
}
