/** Money helpers. Everything is integer minor units. */

/**
 * Convert a provider amount in MAJOR units (Flutterwave sends 67 or 67.5, or a
 * numeric string) to integer minor units. Returns null for anything that is not
 * a finite, non-negative number with at most 2 decimal places.
 */
export function toMinor(value: unknown): number | null {
  const n = typeof value === "string" ? Number(value.trim()) : value;
  if (typeof n !== "number" || !Number.isFinite(n) || n < 0) return null;
  if (typeof value === "string" && value.trim() === "") return null;
  const scaled = n * 100;
  const rounded = Math.round(scaled);
  // Reject values that are not a clean 2-decimal amount (for example 66.999).
  if (Math.abs(scaled - rounded) > 1e-6) return null;
  return rounded;
}

/** Minor units back to a major-unit number, for sending to a provider. */
export function toMajor(minor: number): number {
  assertMinor(minor);
  return minor / 100;
}

export function assertMinor(minor: unknown): asserts minor is number {
  if (typeof minor !== "number" || !Number.isInteger(minor) || minor < 0) {
    throw new Error("money must be a non-negative integer in minor units");
  }
}

/** "67.00" style string for display. */
export function formatMinor(minor: number): string {
  assertMinor(minor);
  return (minor / 100).toFixed(2);
}
