import type { GraphSeedAccount, GraphSeedCursor } from "@/lib/graph-types";

export const PROVIDER_CURSOR_WARNING =
  "This provider may refetch earlier profiles. Use higher limits or fresh seeds.";

export function getSeedCursor(
  seed: GraphSeedAccount,
  relationship: "follower" | "following"
): GraphSeedCursor | undefined {
  return seed.cursors?.find((c) => c.relationship_type === relationship);
}

export function formatCursorSnippet(cursor: GraphSeedCursor | undefined): string {
  if (!cursor) return "none";
  if (cursor.cursor_value) {
    const short =
      cursor.cursor_value.length > 24
        ? `${cursor.cursor_value.slice(0, 24)}…`
        : cursor.cursor_value;
    return `page ${cursor.page_number} · cursor ${short}`;
  }
  if (cursor.page_number > 0 || cursor.profiles_fetched > 0) {
    return `page ${cursor.page_number} · end of list`;
  }
  return "none";
}

export function seedLastScannedLabel(seed: GraphSeedAccount): string | null {
  const times = [
    seed.last_scanned_at,
    ...(seed.cursors || []).map((c) => c.updated_at),
  ].filter(Boolean) as string[];
  if (!times.length) return null;
  const latest = times.sort().at(-1)!;
  return new Date(latest).toLocaleString();
}
