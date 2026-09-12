/**
 * course-prices.ts — the price of every course, on the server.
 *
 * ⚠ THIS EXISTS BECAUSE THE PRICE USED TO LIVE ONLY IN THE BROWSER.
 * `PRICE_NGN` was declared in AiMasteryClient, passed into PaymentModal, and
 * handed to `window.FlutterwaveCheckout`. The verify route and the webhook both
 * copied whatever amount came back from Flutterwave straight into
 * `course_purchases` and marked the row `confirmed` without ever asking what the
 * course actually costs.
 *
 * So anyone could open the page, call FlutterwaveCheckout themselves with the
 * publishable key out of the bundle and `amount: 100`, pay ₦100, and be a
 * confirmed buyer with the Telegram invite in their inbox. Found 2026-09-12.
 *
 * 🛑 THE SERVER DECIDES THE PRICE. The client may display it; it may never
 * determine what counts as paid. Every write path that confirms a purchase has
 * to call `assertPaidEnough` before it writes.
 *
 * Amounts are the MINIMUM acceptable payment. Paying over is fine and is
 * recorded as-is: Flutterwave fees, FX drift and rounding all land slightly
 * above, and a buyer who overpays should not be rejected.
 */

export type CoursePrice = {
  /** Minimum acceptable payment, per currency, in that currency's major unit. */
  minimums: Record<string, number>;
};

export const COURSE_PRICES: Record<string, CoursePrice> = {
  /**
   * ₦27,000 is the price the owner set on 2026-08-18, at $20 on the official
   * NFEM rate of ₦1,354/$. The naira figure is authoritative because the buyers
   * are Nigerian; the dollar figure drifts with FX.
   *
   * The USD minimum is deliberately 18 rather than 20. Blockradar prices the
   * crypto rail in dollars and a payment can settle a little under on FX and
   * network fees. Below 18 is not rounding, it is someone choosing their own
   * price.
   */
  "ai-content-mastery": { minimums: { NGN: 27000, USD: 18 } },
};

/** The naira price, so the sales page and the server cannot disagree. */
export const AI_MASTERY_PRICE_NGN = COURSE_PRICES["ai-content-mastery"].minimums.NGN;

export type PriceCheck = { ok: true } | { ok: false; reason: string };

/**
 * True only when `amount` in `currency` clears the minimum for `slug`.
 *
 * Fails closed on everything it does not recognise: an unknown course, an
 * unknown currency, a non-finite amount. A payment we cannot price is a payment
 * we cannot confirm.
 */
export function assertPaidEnough(slug: string, amount: unknown, currency: unknown): PriceCheck {
  const price = COURSE_PRICES[slug];
  if (!price) return { ok: false, reason: `unknown course "${slug}"` };

  const code = String(currency || "").toUpperCase();
  const minimum = price.minimums[code];
  if (minimum === undefined) return { ok: false, reason: `unsupported currency "${code}"` };

  const paid = typeof amount === "number" ? amount : Number(amount);
  if (!Number.isFinite(paid)) return { ok: false, reason: `non-numeric amount "${String(amount)}"` };

  if (paid < minimum) return { ok: false, reason: `paid ${paid} ${code}, minimum is ${minimum}` };
  return { ok: true };
}
