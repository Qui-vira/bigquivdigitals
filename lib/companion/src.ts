/** Sanitise the ?src= tag: lowercase, [a-z0-9:_-] only, max 40 chars. Empty becomes null. */
export const SRC_MAX = 40;

export function sanitiseSrc(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const cleaned = raw.toLowerCase().replace(/[^a-z0-9:_-]/g, "").slice(0, SRC_MAX);
  return cleaned.length > 0 ? cleaned : null;
}
