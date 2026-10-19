/**
 * Atomic operations added after the wave 3 end-to-end tests (S7, S12c, S14, S15).
 * They are OPTIONAL on a store: the sealed wave 1 CompanionStore is unchanged and
 * createOrder / the handlers use these only when the store provides them
 * (the Neon adapter and MemoryStore both do).
 */
import type { CompanionStore } from "./store";
import type { TierResult } from "./tiers";
import type { NewOrder, Order, OrderStatus, PayMethod, Product, Tier } from "./types";

export type PlaceOrderArgs = {
  product: Product;
  email: string;
  method: PayMethod;
  now: Date;
  /** Unpaid card holds older than this no longer hold a founders place. */
  holdSince: Date;
  shownTier?: Tier;
  /** Called by the store AFTER it has fixed the tier, so the price is decided atomically with the insert. */
  build(price: TierResult): NewOrder;
};

export type PlaceResult =
  | { kind: "created"; order: Order; price: TierResult }
  /** A card order for this buyer is still being created (no payment link yet): reuse it. */
  | { kind: "in_flight"; order: Order }
  | { kind: "price_changed"; price: TierResult };

export interface AtomicOrderStore {
  /**
   * Decide the tier, enforce "one in-flight card order per buyer", and insert, as ONE atomic step.
   * Throws DuplicateOrderRefError when build() produced an order_ref that already exists.
   */
  placeOrder(args: PlaceOrderArgs): Promise<PlaceResult>;
  /** Remember the Flutterwave link on the order. Ends the "in flight" state. */
  attachPaymentLink(orderId: string, link: string): Promise<void>;
  /** Atomically count and record a checkout attempt. false = limit reached. */
  reserveCheckoutAttempt(email: string, now: Date, max: number): Promise<boolean>;
  /** True when this buyer already has another PAID order for the product. */
  hasOtherPaidOrder(email: string, productSlug: string, excludeOrderId: string): Promise<boolean>;
  /** Orders that carry this (normalised) bank reference. Non-unique lookup. */
  findOrdersByBankReference(reference: string): Promise<{ orderId: string; orderRef: string; status: OrderStatus }[]>;
}

export function isAtomicStore(s: CompanionStore): s is CompanionStore & AtomicOrderStore {
  const a = s as Partial<AtomicOrderStore>;
  return typeof a.placeOrder === "function" && typeof a.reserveCheckoutAttempt === "function" && typeof a.attachPaymentLink === "function";
}

/** Stale in-flight card orders (link never attached) stop blocking after this long. */
export const INFLIGHT_STALE_SECONDS = 120;
/** "Per hour" attempt limit. */
export const MAX_ATTEMPTS_PER_HOUR = 5;

export function normaliseBankReference(raw: string): string {
  return raw.trim().replace(/\s+/g, " ").toLowerCase().slice(0, 120);
}
