/** xquik Apify billing: ~$0.015 per profile returned ($0.15 / 1K). */
export const GRAPH_COST_PER_PROFILE = 0.015;

export function estimateApifyCost(profileCount: number): number {
  return Math.round(Math.max(0, profileCount) * GRAPH_COST_PER_PROFILE * 10000) / 10000;
}

export function formatCostUsd(amount: number): string {
  return `$${amount.toFixed(4)}`;
}

export function estimatePresetScanCost(limits: {
  max_followers_per_seed: number;
  max_following_per_seed: number;
  max_total_profiles: number;
  scanMode?: "followers" | "following" | "both";
}): number {
  const mode = limits.scanMode || "both";
  let requested = 0;
  if (mode === "followers" || mode === "both") {
    requested += limits.max_followers_per_seed;
  }
  if (mode === "following" || mode === "both") {
    requested += limits.max_following_per_seed;
  }
  return estimateApifyCost(Math.min(requested, limits.max_total_profiles));
}

export const APIFY_COST_WARNING =
  "Apify charges may be higher than internal estimate. Check Apify usage before large scans.";

export const APIFY_COST_EXAMPLES = [
  { profiles: 10, cost: estimateApifyCost(10) },
  { profiles: 50, cost: estimateApifyCost(50) },
  { profiles: 100, cost: estimateApifyCost(100) },
  { profiles: 500, cost: estimateApifyCost(500) },
];
