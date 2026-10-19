/**
 * Order creation and payment confirmation. Pure logic over CompanionStore.
 * The client NEVER supplies an amount: the price is computed here from the
 * product row and locked on the order at creation.
 */
import { randomBytes } from "node:crypto";
import { checkPayment, isCompanionRef, ORDER_REF_PREFIX, type ProviderTx } from "./confirm";
import { consentGiven, CONSENT_VERSION, hashIp } from "./consent";
import { sanitiseSrc } from "./src";
import { DuplicateOrderRefError, type CompanionStore } from "./store";
import { isAtomicStore } from "./store-extra";
import { currentTier, type TierResult } from "./tiers";
import { hashToken } from "./tokens";
import type { Currency, Order, OrderEventActor, OrderStatus, PayMethod, Product, Tier } from "./types";

export const SUPPORT_DAYS = 30;
/** An unpaid card order holds a founders place this long (matches Flutterwave session_duration). */
export const FOUNDERS_HOLD_MINUTES = 60;

/** Statuses from which a confirmed payment may flip the order to paid. */
export const PAYABLE_FROM: OrderStatus[] = ["created", "awaiting_payment", "awaiting_transfer", "underpaid", "expired"];

/** support_until = purchase date plus 30 days. No update promise. */
export function supportUntil(paidAt: Date): Date {
  return new Date(paidAt.getTime() + SUPPORT_DAYS * 24 * 60 * 60 * 1000);
}

export function newOrderRef(): string {
  // 17 random bytes -> 23 base64url chars; keep 22.
  return ORDER_REF_PREFIX + randomBytes(17).toString("base64url").slice(0, 22);
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type Quote = TierResult & { productSlug: string; active: boolean };

/** Current price for the page and for checkout. Same function both places. */
export async function quote(store: CompanionStore, slug: string, now: Date): Promise<Quote | null> {
  const product = await store.getProduct(slug);
  if (!product) return null;
  const taken = await store.countFoundersTaken(slug, holdSince(now));
  return { ...currentTier(product, now, taken), productSlug: slug, active: product.active };
}

function holdSince(now: Date): Date {
  return new Date(now.getTime() - FOUNDERS_HOLD_MINUTES * 60 * 1000);
}

export type CreateOrderInput = {
  productSlug: string;
  name: unknown;
  email: unknown;
  method: PayMethod;
  consent: { allSalesFinal?: unknown; immediateAccess?: unknown } | null | undefined;
  /** Optional: the tier the page showed. A mismatch returns price_changed. */
  shownTier?: Tier;
  src?: unknown;
  ip?: string | null;
  ipSalt: string;
  now: Date;
};

export type CreateOrderError =
  | { ok: false; code: "product_not_found" | "product_inactive" | "consent_required" | "invalid_email" | "invalid_name" | "method_not_allowed" }
  | { ok: false; code: "price_changed"; tier: Tier; amountMinor: number; currency: Currency };

export type CreateOrderResult =
  | {
      ok: true;
      order: Order;
      /** Plaintext claim cookie value. Set httpOnly. Only the hash is stored. Empty when `reused`. */
      claimToken: string;
      /** A double click: an in-flight card order for this buyer already existed and is returned instead of a new one. */
      reused?: boolean;
    }
  | CreateOrderError;

export async function createOrder(store: CompanionStore, input: CreateOrderInput): Promise<CreateOrderResult> {
  const product: Product | null = await store.getProduct(input.productSlug);
  if (!product) return { ok: false, code: "product_not_found" };
  if (!product.active) return { ok: false, code: "product_inactive" };
  if (!consentGiven(input.consent)) return { ok: false, code: "consent_required" };

  const email = typeof input.email === "string" ? input.email.trim().toLowerCase() : "";
  if (email.length > 254 || !EMAIL_RE.test(email)) return { ok: false, code: "invalid_email" };
  const name = typeof input.name === "string" ? input.name.trim() : "";
  if (name.length < 1 || name.length > 100) return { ok: false, code: "invalid_name" };

  if (input.method === "bank_transfer" && !product.allowManualTransfer) {
    return { ok: false, code: "method_not_allowed" };
  }
  if (!["flutterwave", "blockradar", "bank_transfer"].includes(input.method)) {
    return { ok: false, code: "method_not_allowed" };
  }

  // Atomic path (Neon adapter, MemoryStore): the tier decision, the "one in-flight card order per
  // buyer" rule and the insert happen as ONE step, so concurrent checkouts cannot oversell the
  // founders cap or create two live orders from a double click.
  if (isAtomicStore(store)) {
    const claimToken = randomBytes(32).toString("base64url");
    const status: OrderStatus = input.method === "bank_transfer" ? "awaiting_transfer" : "awaiting_payment";
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const r = await store.placeOrder({
          product,
          email,
          method: input.method,
          now: input.now,
          holdSince: holdSince(input.now),
          shownTier: input.shownTier,
          build: (price) => ({
            orderRef: newOrderRef(),
            productSlug: product.slug,
            email,
            name,
            status,
            method: input.method,
            priceTier: price.tier,
            expectedMinor: price.amountMinor,
            currency: price.currency,
            consentAt: input.now,
            consentVersion: CONSENT_VERSION,
            consentIpHash: hashIp(input.ip, input.ipSalt),
            src: sanitiseSrc(input.src),
            claimHash: hashToken(claimToken),
            createdAt: input.now,
          }),
        });
        if (r.kind === "price_changed") {
          return { ok: false, code: "price_changed", tier: r.price.tier, amountMinor: r.price.amountMinor, currency: r.price.currency };
        }
        if (r.kind === "in_flight") return { ok: true, order: r.order, claimToken: "", reused: true };
        await store.addEvent(r.order.id, "system", "order_created", `tier=${r.price.tier} expected_minor=${r.price.amountMinor}`, input.now);
        return { ok: true, order: r.order, claimToken };
      } catch (e) {
        if (e instanceof DuplicateOrderRefError) continue;
        throw e;
      }
    }
    throw new Error("could not allocate a unique order_ref");
  }

  const taken = await store.countFoundersTaken(product.slug, holdSince(input.now));
  const price = currentTier(product, input.now, taken);
  if (input.shownTier && input.shownTier !== price.tier) {
    return { ok: false, code: "price_changed", tier: price.tier, amountMinor: price.amountMinor, currency: price.currency };
  }

  const claimToken = randomBytes(32).toString("base64url");
  const status: OrderStatus = input.method === "bank_transfer" ? "awaiting_transfer" : "awaiting_payment";

  // A collision on a 22 char random ref is essentially impossible; retry a few times anyway.
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const order = await store.insertOrder({
        orderRef: newOrderRef(),
        productSlug: product.slug,
        email,
        name,
        status,
        method: input.method,
        priceTier: price.tier,
        expectedMinor: price.amountMinor,
        currency: price.currency,
        consentAt: input.now,
        consentVersion: CONSENT_VERSION,
        consentIpHash: hashIp(input.ip, input.ipSalt),
        src: sanitiseSrc(input.src),
        claimHash: hashToken(claimToken),
        createdAt: input.now,
      });
      await store.addEvent(order.id, "system", "order_created", `tier=${price.tier} expected_minor=${price.amountMinor}`, input.now);
      return { ok: true, order, claimToken };
    } catch (e) {
      if (e instanceof DuplicateOrderRefError) continue;
      throw e;
    }
  }
  throw new Error("could not allocate a unique order_ref");
}

export type PaidEvidence = {
  providerTxId: string | null;
  amountReceivedMinor: number;
  note?: string | null;
  actor: OrderEventActor;
};

export type MarkPaidResult =
  /** This caller won. Create the token and send the email. */
  | { kind: "won"; order: Order }
  /** Someone else already confirmed (replay, double webhook). Do nothing, answer 200. */
  | { kind: "already_paid" }
  /** Same provider payment id already attached to another order. The order is flagged. Alert the owner. */
  | { kind: "flagged_tx_conflict" }
  /** Order is refunded or flagged and cannot be paid. Alert the owner. */
  | { kind: "not_payable"; status: OrderStatus }
  | { kind: "not_found" };

/**
 * The single place an order becomes paid. Idempotent: of any number of
 * concurrent or repeated calls, exactly one returns "won".
 * It does NOT check the amount: callers go through applyVerifiedPayment (or the
 * admin path, which has its own amount check).
 */
export async function markOrderPaid(
  store: CompanionStore,
  orderId: string,
  evidence: PaidEvidence,
  now: Date,
): Promise<MarkPaidResult> {
  const res = await store.claimOrderPaid(orderId, PAYABLE_FROM, {
    paidAt: now,
    providerTxId: evidence.providerTxId,
    amountReceivedMinor: evidence.amountReceivedMinor,
    receivedNote: evidence.note ?? null,
    supportUntil: supportUntil(now),
  });
  switch (res.kind) {
    case "won":
      await store.addEvent(orderId, evidence.actor, "paid", `received_minor=${evidence.amountReceivedMinor}`, now);
      return { kind: "won", order: res.order };
    case "tx_conflict":
      await store.setOrderStatus(orderId, "flagged");
      await store.addEvent(orderId, evidence.actor, "flagged", "provider_tx_id already used by another order", now);
      return { kind: "flagged_tx_conflict" };
    case "not_found":
      return { kind: "not_found" };
    case "not_claimable":
      if (res.status === "paid") return { kind: "already_paid" };
      return { kind: "not_payable", status: res.status };
  }
}

export type ApplyResult =
  | MarkPaidResult
  | { kind: "rejected"; reason: string }
  /** Money arrived but less than the price. Order set to underpaid, no link. Alert the owner. */
  | { kind: "underpaid"; receivedMinor: number };

/**
 * Entry point for webhooks and the return page. `tx` MUST come from the
 * provider verify API (re-queried), not from the webhook body. The order is
 * looked up by tx_ref, then every check runs against the ORDER.
 */
export async function applyVerifiedPayment(
  store: CompanionStore,
  tx: ProviderTx & { providerTxId: string | number },
  actor: OrderEventActor,
  now: Date,
): Promise<ApplyResult> {
  if (!isCompanionRef(tx.txRef)) return { kind: "rejected", reason: "bad_ref_prefix" };
  const order = await store.getOrderByRef(tx.txRef);
  if (!order) return { kind: "rejected", reason: "unknown_order" };

  const verdict = checkPayment(order, tx);
  if (!verdict.ok) {
    if (verdict.reason === "amount_underpaid" && order.status !== "paid") {
      // Only an order that could still be paid becomes underpaid. refunded and flagged are
      // terminal: a late short payment must never revive them (underpaid is in PAYABLE_FROM,
      // so it would reopen the order). The UPDATE is conditional, so an order that was paid,
      // refunded or flagged between the read above and this write is not downgraded either.
      const moved = PAYABLE_FROM.includes(order.status) && (await store.setOrderStatus(order.id, "underpaid", PAYABLE_FROM));
      if (moved) {
        await store.addEvent(order.id, actor, "underpaid", `received_minor=${verdict.receivedMinor}`, now);
        return { kind: "underpaid", receivedMinor: verdict.receivedMinor ?? 0 };
      }
      const status = (await store.getOrderById(order.id))?.status ?? order.status;
      if (status === "paid") return { kind: "rejected", reason: verdict.reason };
      // Money arrived on a closed order. Keep the status, record it, and let the caller alert the owner.
      await store.addEvent(order.id, actor, "underpaid_on_closed_order", `status=${status} received_minor=${verdict.receivedMinor}`, now);
      return { kind: "not_payable", status };
    }
    return { kind: "rejected", reason: verdict.reason };
  }
  return markOrderPaid(
    store,
    order.id,
    { providerTxId: String(tx.providerTxId), amountReceivedMinor: verdict.receivedMinor, actor },
    now,
  );
}
