import type { Currency, Product, Tier } from "./types";

export type TierResult = {
  tier: Tier;
  amountMinor: number;
  currency: Currency;
  /** Real places left, only when the owner set a cap. Else null. */
  foundersPlacesLeft: number | null;
  /** Real end instant, only when the owner set one and the window is open. Else null. */
  countdownTo: Date | null;
};

/**
 * Decide the tier. Founders applies when BOTH conditions hold:
 *  - no end date set, or now is strictly before it
 *  - no cap set, or founders places taken is below the cap
 * With neither set the founders price stays on and no counter is shown (no fake
 * scarcity). `foundersTaken` comes from the store (real rows).
 */
export function currentTier(product: Product, now: Date, foundersTaken: number): TierResult {
  const dateOk = product.foundersEndsAt === null || now.getTime() < product.foundersEndsAt.getTime();
  const capOk = product.foundersCap === null || foundersTaken < product.foundersCap;
  const founders = dateOk && capOk;
  return {
    tier: founders ? "founders" : "regular",
    amountMinor: founders ? product.foundersMinor : product.regularMinor,
    currency: product.currencyBase,
    foundersPlacesLeft:
      founders && product.foundersCap !== null ? Math.max(0, product.foundersCap - foundersTaken) : null,
    countdownTo: founders && product.foundersEndsAt !== null ? product.foundersEndsAt : null,
  };
}
