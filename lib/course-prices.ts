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
  /**
   * Optional early-bird price for the first `seats` confirmed seats of the
   * current cohort. `minimums` is then the STANDARD price. Only the server can
   * decide which one applies, because only the server can count the seats
   * (see `classMinimum` below and lib/class-payments.ts).
   */
  earlyBird?: { minimums: Record<string, number>; seats: number };
};

/**
 * The cohort every niche, the combo and coaching is sold for right now.
 *
 * `salesOpenFrom` is what makes "the first 10 seats of THIS cohort" countable
 * without a cohort column on course_purchases: a seat counts toward the
 * early-bird limit only if it was confirmed on or after this instant. When
 * sales open for the next cohort, set `salesOpenFrom` to that moment and
 * update `startsOn`; the early-bird count starts again from zero.
 *
 * Owner, 25 Nov 2026: the first cohort of every niche starts Monday 4 January 2027.
 */
export const CLASS_COHORT = {
  id: "2027-01",
  startsOn: "2027-01-04",
  startsLabel: "Monday 4 January 2027",
  salesOpenFrom: "2026-11-25T00:00:00Z",
} as const;

/**
 * Race window for the early-bird price. Two buyers can open checkout while
 * seat 9 is the last one taken; both see the early price and both pay it. The
 * second one then confirms as seat 11. Rejecting them would take their money
 * and leave them unconfirmed, which is worse than honouring the price.
 *
 * So: a payment of at least the early price is accepted after seat 10 filled
 * if Flutterwave says it was charged no later than 30 minutes after seat 10
 * was confirmed. After that window only the standard price clears.
 */
export const EARLY_BIRD_GRACE_MS = 30 * 60 * 1000;

/** The seven niches, the combo, and the coaching built on each niche. */
export type ClassKind = "niche" | "combo" | "coaching";

export type ClassProduct = {
  slug: string;
  /** The niche key the product belongs to (combo: "combo"). */
  niche: string;
  kind: ClassKind;
  /** Name on the page, in the emails and on My purchases. */
  name: string;
  /**
   * Every Flutterwave tx_ref for this product starts with this. The webhook and
   * the verify route route a payment to its slug by this prefix ALONE. Prefixes
   * are unique and none is a prefix of another (tested).
   */
  refPrefix: string;
  /** Coaching only: length in weeks. */
  weeks?: 2 | 3;
};

/**
 * Prices approved by the owner on 25 Nov 2026 (pop-up), source
 * ContentBrain/30-DAY-CONTENT-SYSTEM/PRICING-PLAN.md. Naira only: these
 * products are sold on Flutterwave and the Blockradar crypto rail is not
 * offered for them, so they carry no USD minimum and a USD payment fails closed.
 */
const NICHES: Array<{ niche: string; name: string; code: string; early: number; standard: number; coach2: number; coach3: number }> = [
  { niche: "editing", name: "AI Video Editing", code: "EDIT", early: 27000, standard: 45000, coach2: 200000, coach3: 300000 },
  { niche: "ugc", name: "AI UGC and Content", code: "UGC", early: 27000, standard: 45000, coach2: 210000, coach3: 315000 },
  { niche: "web3", name: "AI for Web3 and DeFi", code: "WEB3", early: 30000, standard: 50000, coach2: 230000, coach3: 340000 },
  { niche: "video", name: "AI Video Creation", code: "VIDEO", early: 35000, standard: 55000, coach2: 250000, coach3: 380000 },
  { niche: "trading", name: "AI for Trading", code: "TRADE", early: 35000, standard: 55000, coach2: 250000, coach3: 370000 },
  { niche: "coding", name: "Vibe Coding", code: "CODE", early: 40000, standard: 65000, coach2: 275000, coach3: 410000 },
  { niche: "agents", name: "AI Agents", code: "AGENT", early: 40000, standard: 65000, coach2: 290000, coach3: 430000 },
];

const NICHE_SLUG: Record<string, string> = {
  editing: "ai-video-editing",
  ugc: "ai-ugc-content",
  web3: "ai-web3-defi",
  video: "ai-video-creation",
  trading: "ai-trading",
  coding: "vibe-coding",
  agents: "ai-agents",
};

export const EARLY_BIRD_SEATS = 10;

export const COMBO = { slug: "ai-mastery-combo", early: 175000, standard: 280000 } as const;

export const CLASS_PRODUCTS: ClassProduct[] = [
  ...NICHES.map((n) => ({ slug: NICHE_SLUG[n.niche], niche: n.niche, kind: "niche" as const, name: n.name, refPrefix: `CLS-${n.code}-` })),
  { slug: COMBO.slug, niche: "combo", kind: "combo", name: "AI Mastery Combo (all 7 niches)", refPrefix: "CLS-COMBO-" },
  ...NICHES.flatMap((n) =>
    ([2, 3] as const).map((w) => ({
      slug: `coaching-${n.niche}-${w}w`,
      niche: n.niche,
      kind: "coaching" as const,
      name: `${n.name} coaching, ${w} weeks`,
      refPrefix: `CO${w}-${n.code}-`,
      weeks: w,
    })),
  ),
];

const CLASS_PRICES: Record<string, CoursePrice> = Object.fromEntries([
  ...NICHES.map((n) => [
    NICHE_SLUG[n.niche],
    { minimums: { NGN: n.standard }, earlyBird: { minimums: { NGN: n.early }, seats: EARLY_BIRD_SEATS } },
  ]),
  [COMBO.slug, { minimums: { NGN: COMBO.standard }, earlyBird: { minimums: { NGN: COMBO.early }, seats: EARLY_BIRD_SEATS } }],
  ...NICHES.flatMap((n) => [
    [`coaching-${n.niche}-2w`, { minimums: { NGN: n.coach2 } }],
    [`coaching-${n.niche}-3w`, { minimums: { NGN: n.coach3 } }],
  ]),
]);

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
  ...CLASS_PRICES,
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

export function classProduct(slug: string): ClassProduct | undefined {
  return CLASS_PRODUCTS.find((p) => p.slug === slug);
}

/** A buyer-facing tx_ref for a product. Unique enough for Flutterwave: time plus 6 random characters. */
export function newClassTxRef(refPrefix: string): string {
  return `${refPrefix}${Date.now()}-${Math.random().toString(36).slice(2, 8).padEnd(6, "0")}`;
}

/**
 * Where a Flutterwave tx_ref belongs. Both payment routes switch on this, and
 * nothing else decides which product a payment buys.
 *
 *   TEC-      TheEditCompanion (lib/companion), never a course seat
 *   QBOT-     the trading bot list, paid through opportunity-agent's botpay.py
 *             (same Flutterwave account). Acknowledged, never a course seat
 *   CLS-/CO2-/CO3-...  a niche, the combo or coaching: the slug from CLASS_PRODUCTS
 *   QV-       the AI Mastery class (/aimastery and every payment before 25 Nov 2026)
 *   anything else, or not a string: unknown, grants nothing
 */
export type TxRoute =
  | { kind: "companion" }
  | { kind: "bot" }
  | { kind: "class"; product: ClassProduct }
  | { kind: "ai-mastery" }
  | { kind: "unknown" };

export function routeTxRef(ref: unknown): TxRoute {
  if (typeof ref !== "string") return { kind: "unknown" };
  if (ref.startsWith("TEC-")) return { kind: "companion" };
  if (ref.startsWith("QBOT-")) return { kind: "bot" };
  const product = CLASS_PRODUCTS.find((p) => ref.startsWith(p.refPrefix));
  if (product) return { kind: "class", product };
  if (ref.startsWith("QV-")) return { kind: "ai-mastery" };
  return { kind: "unknown" };
}

/** How many early-bird seats are taken in the current cohort, and when the last one filled. */
export type SeatState = {
  /** Confirmed seats for this slug in the current cohort, NOT counting the payment being checked. */
  confirmed: number;
  /** created_at of the seat that filled the early-bird allowance (seat 10), when it is full. */
  filledAt: Date | null;
};

export type ClassPriceCheck =
  | { ok: true; tier: "early" | "standard" | "fixed"; minimum: number }
  | { ok: false; reason: string };

/**
 * The minimum a class payment must clear, decided from the seat count.
 *
 *   fewer than `seats` confirmed  -> the early price
 *   full, paid within the grace   -> the early price (the race described at EARLY_BIRD_GRACE_MS)
 *   full, paid after the grace    -> the standard price
 *   no early-bird (coaching)      -> the fixed price
 *
 * Fails closed exactly like assertPaidEnough: unknown slug, unknown currency,
 * non-numeric amount all reject.
 */
export function checkClassPayment(
  slug: string,
  amount: unknown,
  currency: unknown,
  seats: SeatState,
  paidAt: Date,
): ClassPriceCheck {
  const price = CLASS_PRICES[slug];
  if (!price) return { ok: false, reason: `unknown class "${slug}"` };
  const code = String(currency || "").toUpperCase();
  const standard = price.minimums[code];
  if (standard === undefined) return { ok: false, reason: `unsupported currency "${code}"` };
  const paid = typeof amount === "number" ? amount : Number(amount);
  if (!Number.isFinite(paid)) return { ok: false, reason: `non-numeric amount "${String(amount)}"` };

  const eb = price.earlyBird;
  const early = eb?.minimums[code];
  if (!eb || early === undefined) {
    return paid >= standard ? { ok: true, tier: "fixed", minimum: standard } : { ok: false, reason: `paid ${paid} ${code}, minimum is ${standard}` };
  }

  const open = seats.confirmed < eb.seats;
  const inGrace = !open && seats.filledAt !== null && paidAt.getTime() <= seats.filledAt.getTime() + EARLY_BIRD_GRACE_MS;
  const minimum = open || inGrace ? early : standard;
  if (paid < minimum) return { ok: false, reason: `paid ${paid} ${code}, minimum is ${minimum} (${seats.confirmed} seats taken)` };
  return { ok: true, tier: paid >= standard ? "standard" : "early", minimum };
}

/** What the page shows: the price a buyer pays right now and how many early seats are left. */
export function classPriceNow(slug: string, confirmed: number | null): { amount: number; early: number | null; standard: number; seatsLeft: number | null } {
  const price = CLASS_PRICES[slug];
  if (!price) throw new Error(`unknown class "${slug}"`);
  const standard = price.minimums.NGN;
  const eb = price.earlyBird;
  if (!eb) return { amount: standard, early: null, standard, seatsLeft: null };
  const early = eb.minimums.NGN;
  // Count unknown (database unreachable): charge the standard price. An overpaid
  // buyer is still confirmed; an early price charged after the seats are gone is not.
  if (confirmed === null) return { amount: standard, early, standard, seatsLeft: null };
  const seatsLeft = Math.max(eb.seats - confirmed, 0);
  return { amount: seatsLeft > 0 ? early : standard, early, standard, seatsLeft };
}
