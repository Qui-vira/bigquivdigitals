import type { GraphJobControls } from "./graph-types";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function formatWeeklyDay(day: number) {
  return WEEKDAYS[day] ?? "Mon";
}

export function nextDailyRunUtc(controls: GraphJobControls, now = new Date()): Date | null {
  if (!controls.daily_scan_enabled) return null;
  const hour = controls.daily_scan_hour_utc ?? 3;
  const candidate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), hour, 0, 0));
  if (now.getUTCHours() >= hour) {
    candidate.setUTCDate(candidate.getUTCDate() + 1);
  }
  return candidate;
}

export function nextWeeklyRunUtc(controls: GraphJobControls, now = new Date()): Date | null {
  if (!controls.weekly_scan_enabled) return null;
  const targetDay = controls.weekly_scan_day ?? 0;
  const hour = controls.weekly_scan_hour_utc ?? 3;
  const day = now.getUTCDay();
  const mondayBased = (day + 6) % 7;
  let daysAhead = (targetDay - mondayBased + 7) % 7;
  const candidate = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + daysAhead, hour, 0, 0)
  );
  if (daysAhead === 0 && now.getUTCHours() >= hour) {
    candidate.setUTCDate(candidate.getUTCDate() + 7);
  }
  return candidate;
}

export function sumCostsSince(
  runs: { estimated_cost_usd?: number; created_at?: string }[],
  since: Date
) {
  return runs.reduce((sum, run) => {
    if (!run.created_at) return sum;
    const ts = new Date(run.created_at);
    if (ts >= since) return sum + Number(run.estimated_cost_usd || 0);
    return sum;
  }, 0);
}
