import { formatNairaMinor } from "./format";

/**
 * Pure request and reply logic for the checkout form, kept out of the component so it can be
 * tested without a browser. The form sends NO amount, but it DOES send shownTier: the tier the
 * buyer saw. The server answers 409 price_changed when that differs from what it would charge
 * (lib/companion/orders.ts), and nothing is charged.
 */
export type ShownTier = "founders" | "regular";

export function buildCheckoutPayload(i: { name: string; email: string; shownTier: ShownTier; src: string | null }) {
  return {
    name: i.name,
    email: i.email,
    consentFinal: true as const,
    consentImmediate: true as const,
    shownTier: i.shownTier,
    ...(i.src ? { src: i.src } : {}),
  };
}

export type CheckoutOutcome =
  | { kind: "redirect"; url: string }
  | { kind: "price_changed"; tier: ShownTier; amount: string; message: string }
  | { kind: "error"; message: string };

export function interpretCheckoutReply(
  httpStatus: number,
  data: unknown,
  fallbackError: string,
): CheckoutOutcome {
  const d = (data && typeof data === "object" ? data : {}) as Record<string, unknown>;
  if (d.ok === true && typeof d.paymentLink === "string" && /^https:\/\//.test(d.paymentLink)) {
    return { kind: "redirect", url: d.paymentLink };
  }
  if (httpStatus === 409 && d.code === "price_changed" && (d.tier === "founders" || d.tier === "regular")) {
    const amount = typeof d.amountMinor === "number" && d.amountMinor >= 0 ? formatNairaMinor(d.amountMinor) : null;
    if (amount) {
      return {
        kind: "price_changed",
        tier: d.tier,
        amount,
        message: `The price has changed. It is now ${amount}. You were not charged. Check the new price, then press Pay again to confirm.`,
      };
    }
  }
  return { kind: "error", message: typeof d.error === "string" && d.error ? d.error : fallbackError };
}
