import type { GraphSeedAccount } from "./graph-types";

export function formatSeedOptionLabel(seed: GraphSeedAccount) {
  const user = seed.username.startsWith("@") ? seed.username : `@${seed.username}`;
  const name = seed.display_name ? ` — ${seed.display_name}` : "";
  const type = seed.seed_type ? ` (${seed.seed_type})` : "";
  const priority = ` · P${seed.priority}`;
  const last = seed.last_scanned_at
    ? ` · last ${new Date(seed.last_scanned_at).toLocaleDateString("en-GB", { timeZone: "UTC" })}`
    : " · never scanned";
  return `${user}${name}${type}${priority}${last}`;
}
