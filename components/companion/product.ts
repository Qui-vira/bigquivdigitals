import { cache } from "react";
import type { Product } from "@/lib/companion/types";
import { currentTier } from "@/lib/companion/tiers";
import { formatNairaMinor } from "./format";
import { PAGE_PATH, META, PRODUCT_NAME, PRODUCT_SLUG } from "./content";

/**
 * Fallback product, used whenever the product row cannot be read. Values are the owner's
 * decisions of 19 Oct 2026: N50,000 founders, then N150,000, with $38 and $113 shown as a
 * reference. No end date, no cap: the founders price stays on, no counter is shown.
 */
export const FALLBACK_PRODUCT: Product = {
  slug: PRODUCT_SLUG,
  name: PRODUCT_NAME,
  active: true,
  currencyBase: "NGN",
  foundersMinor: 5_000_000,
  regularMinor: 15_000_000,
  foundersEndsAt: null,
  foundersCap: null,
  displayUsdFoundersMinor: 3800,
  displayUsdRegularMinor: 11300,
  linkTtlHours: 168,
  maxDownloads: 5,
  allowManualTransfer: false,
};

const LOAD_TIMEOUT_MS = 4000;

/**
 * Read the product row from the Neon store.
 *
 * At REQUEST time (ISR regeneration) any failure or timeout THROWS. A thrown regeneration is
 * not cached: Next keeps serving the last good page (Next 16 ISR guide, error handling).
 * Returning constants there would cache a page with a possibly wrong price or an enabled
 * Pay button on a closed product.
 *
 * The constants are used ONLY while `next build` prerenders the page, when the database or the
 * tables may not exist yet. Next sets NEXT_PHASE to "phase-production-build" for that step.
 * That first page is replaced by the first regeneration after 60 s.
 *
 * `cache()` shares one read between generateMetadata and the page body.
 */
export const loadProduct = cache(async (): Promise<Product> => {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const read = (async () => {
      // Dynamic import keeps the database driver out of anything that cannot reach it.
      const { getCompanionStore } = await import("@/lib/companion/neon-store");
      return getCompanionStore().getProduct(PRODUCT_SLUG);
    })();
    read.catch(() => {}); // a late failure after the timeout must not become unhandled
    const row = await Promise.race([
      read,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error("product read timed out")), LOAD_TIMEOUT_MS);
      }),
    ]);
    if (!row) throw new Error("product row not found");
    return row;
  } catch (err) {
    if (process.env.NEXT_PHASE === "phase-production-build") return FALLBACK_PRODUCT;
    throw err;
  } finally {
    if (timer) clearTimeout(timer);
  }
});

export const formatNaira = formatNairaMinor;

function formatUsd(minor: number | null): string | null {
  if (minor === null) return null;
  return `$${Math.floor(minor / 100)}`;
}

export type PriceView = {
  tier: "founders" | "regular";
  /** What is charged now, e.g. "N50,000". */
  amount: string;
  foundersAmount: string;
  regularAmount: string;
  /** USD reference for the current tier, display only. */
  usdNow: string | null;
  usdFounders: string | null;
  usdRegular: string | null;
  /** "Founders price until 14 November 2026" only when the product row has an end date and it is open. */
  foundersUntilLine: string | null;
  /** ISO instant the founders window ends (row value), for the live tier switch. Null when none. */
  endsAtIso: string | null;
  active: boolean;
};

export function priceView(product: Product, now: Date = new Date()): PriceView {
  // Places taken are not read here: no cap is shown on the page (owner: never a place count).
  const t = currentTier(product, now, 0);
  const usdFounders = formatUsd(product.displayUsdFoundersMinor);
  const usdRegular = formatUsd(product.displayUsdRegularMinor);
  const foundersUntilLine =
    t.tier === "founders" && t.countdownTo
      ? `Founders price until ${t.countdownTo.toLocaleDateString("en-GB", {
          day: "numeric",
          month: "long",
          year: "numeric",
          timeZone: "UTC",
        })}`
      : null;
  return {
    tier: t.tier,
    amount: formatNaira(t.amountMinor),
    foundersAmount: formatNaira(product.foundersMinor),
    regularAmount: formatNaira(product.regularMinor),
    usdNow: t.tier === "founders" ? usdFounders : usdRegular,
    usdFounders,
    usdRegular,
    foundersUntilLine,
    endsAtIso: product.foundersEndsAt ? product.foundersEndsAt.toISOString() : null,
    active: product.active,
  };
}

export function metaDescription(view: PriceView): string {
  return view.tier === "founders" ? META.descriptionFounders : META.descriptionRegular;
}

export const CANONICAL_PATH = PAGE_PATH;
