/**
 * Intrinsic pixel size of every evidence screenshot used in app/work/*.
 *
 * Measured with sharp on 2026-10-05. <Evidence> used to assume 1200x800 for
 * every file, which reserved the wrong box for the 590x1280 phone captures and
 * shifted the page as each one loaded. With the true size the print reserves
 * exactly its own shape, and the layout can tell a phone screenshot from a
 * desktop one.
 *
 * Adding a new screenshot to a case study: add its size here. If you forget,
 * <Evidence> falls back to its width/height props, so nothing breaks; it just
 * guesses the shape.
 */
export const EVIDENCE_DIMS: Record<string, [number, number]> = {
  "/proof/content/13k-haleem-post.webp": [590, 1280],
  "/proof/content/car-post.webp": [590, 1280],
  "/proof/content/pinned-post-2.webp": [590, 1280],
  "/proof/nbci/01-powerbi-what-is-changing.webp": [733, 530],
  "/proof/nbci/02-powerbi-fuel-and-power.webp": [733, 530],
  "/proof/nbci/03-powerbi-where-costs-differ.webp": [733, 530],
  "/proof/nbci/04-powerbi-validation.webp": [733, 530],
  "/proof/nbci/05-excel-what-is-changing.webp": [1082, 588],
  "/proof/nbci/06-excel-can-and-cannot.webp": [1082, 588],
  "/proof/peaceway/01-homepage-problem-framing.webp": [1360, 718],
  "/proof/peaceway/02-three-portals.webp": [1360, 718],
  "/proof/peaceway/06-request-urgency-options.webp": [1360, 718],
  "/proof/peaceway/07-medication-reminders.webp": [1360, 718],
  "/proof/peaceway/09b-telegram-inventory-search.webp": [604, 516],
  "/proof/peaceway/12-telegram-order-confirmation.webp": [604, 516],
  "/proof/quivira/result-btc-partials.webp": [590, 1280],
  "/proof/quivira/result-daily-pnl-543k.webp": [590, 1280],
  "/proof/quivira/result-eth-setup-85pct.webp": [590, 1280],
  "/proof/quivira/result-eth-short-267pct.webp": [590, 1280],
  "/proof/technical/admin-leads-blurred.webp": [1280, 439],
  "/proof/technical/articles-page.webp": [1019, 3682],
  "/proof/technical/railway-dashboard.webp": [1280, 638],
};
