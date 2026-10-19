/**
 * Flutterwave payment confirmation for TEC- orders. Two entry points, one
 * settle function, so the webhook and the return page can arrive in either order
 * and exactly one of them wins (markOrderPaid is a single conditional UPDATE).
 *
 *  - handleCompanionFlutterwaveWebhook: dispatched to by the existing
 *    /api/payment/flutterwave/webhook route for tx_ref starting TEC-.
 *  - settleVerifiedTransaction: also used by the return handler.
 *
 * Trust model: the webhook body is only a hint. We verify the `verif-hash`
 * header (timing safe, fail closed), then RE-QUERY Flutterwave's verify API and
 * judge the verify response against OUR order (wave 1 checkPayment).
 */
import type { PaymentsDeps } from "./deps";
import { verifyTransactionById, type VerifiedTx } from "./flutterwave";
import { verifyFlutterwaveHash } from "./hmac";
import { toMinor } from "./money";
import { applyVerifiedPayment, quote } from "./orders";
import { isAtomicStore } from "./store-extra";
import type { OrderEventActor } from "./types";

export type SettleOutcome =
  | "paid_now" // this caller won; delivery scheduled
  | "already_paid" // replay or the other path won first
  | "underpaid"
  | "flagged"
  | "not_payable"
  | "rejected"
  | "unknown_order";

async function safeAlert(deps: PaymentsDeps, subject: string, text: string) {
  try {
    await deps.alert(subject, text);
  } catch {
    /* alerts never break payment handling */
  }
}

/** Apply a verified (re-queried) transaction. Throws only on real internal errors. */
export async function settleVerifiedTransaction(
  deps: PaymentsDeps,
  tx: VerifiedTx,
  actor: OrderEventActor,
): Promise<SettleOutcome> {
  const ref = typeof tx.txRef === "string" ? tx.txRef : "?";

  // The tier price lock must not outlive the order. An EXPIRED founders order that is
  // paid late is honoured only if the money covers the price that applies NOW.
  // (Real money still never vanishes: the order becomes underpaid and the owner is told.)
  if (typeof tx.txRef === "string" && tx.txRef.startsWith("TEC-") && tx.status === "successful") {
    const o = await deps.store.getOrderByRef(tx.txRef);
    if (o && o.status === "expired" && o.priceTier === "founders") {
      const q = await quote(deps.store, o.productSlug, deps.now());
      const got = toMinor(tx.amount);
      // Conditional: only while the order is still expired. If it changed in between, the normal path below decides.
      if (q && q.tier !== o.priceTier && got !== null && got < q.amountMinor && (await deps.store.setOrderStatus(o.id, "underpaid", ["expired"]))) {
        await deps.store.addEvent(o.id, actor, "underpaid", `late payment on expired founders order; received_minor=${got} current_price_minor=${q.amountMinor}`, deps.now());
        await safeAlert(
          deps,
          "Companion: LATE payment below the current price",
          `Order ${ref} expired, was priced at founders, and was paid late with ${got} kobo; the price now is ${q.amountMinor} kobo. No link was sent. Decide in admin.`,
        );
        return "underpaid";
      }
    }
  }

  const r = await applyVerifiedPayment(deps.store, tx, actor, deps.now());
  switch (r.kind) {
    case "won": {
      // The same buyer already has a PAID order for this product (double click, both paid): keep the
      // money, but do NOT deliver a second time and tell the owner. Only the admin can resend.
      if (isAtomicStore(deps.store) && (await deps.store.hasOtherPaidOrder(r.order.email, r.order.productSlug, r.order.id))) {
        await deps.store.addEvent(r.order.id, "system", "duplicate_payment", "same email already has a paid order for this product; delivery withheld", deps.now());
        await safeAlert(
          deps,
          "Companion: DUPLICATE payment, same buyer paid twice",
          `Order ${ref} was paid, but this buyer already has another paid order for the product. The money arrived (Flutterwave ${tx.providerTxId}). No second email was sent. Refund one in the Flutterwave dashboard, or use Re-send in admin if it is a real second licence.`,
        );
        return "paid_now";
      }
      deps.scheduleDelivery(r.order.id);
      return "paid_now";
    }
    case "already_paid": {
      // A replay of the SAME payment is harmless. A DIFFERENT successful payment on a paid order is a second charge.
      const cur = await deps.store.getOrderByRef(ref);
      if (cur && cur.providerTxId && cur.providerTxId !== String(tx.providerTxId)) {
        await deps.store.addEvent(cur.id, "system", "duplicate_payment", `second successful payment ${tx.providerTxId} on an already paid order`, deps.now());
        await safeAlert(
          deps,
          "Companion: DUPLICATE payment on a paid order (charged twice)",
          `Order ${ref} was already paid (Flutterwave ${cur.providerTxId}). A second successful payment arrived: ${tx.providerTxId}. No second email was sent. Refund the extra payment in the Flutterwave dashboard.`,
        );
      }
      return "already_paid";
    }
    case "underpaid":
      await safeAlert(
        deps,
        "Companion: UNDERPAID order",
        `Order ${ref} received ${r.receivedMinor} kobo, less than the price. No link was sent. Check it in admin.`,
      );
      return "underpaid";
    case "flagged_tx_conflict":
      await safeAlert(deps, "Companion: payment id reused", `Flutterwave payment ${tx.providerTxId} is already attached to another order. Order ${ref} is flagged. Check it in admin.`);
      return "flagged";
    case "not_payable":
      await safeAlert(deps, "Companion: payment on a closed order", `A successful payment arrived for order ${ref} which is ${r.status}. Check it in admin.`);
      return "not_payable";
    case "not_found":
      return "unknown_order";
    case "rejected":
      if (r.reason === "unknown_order") {
        await safeAlert(deps, "Companion: payment for an unknown order", `Flutterwave payment ${tx.providerTxId} references ${ref}, which is not in the orders table.`);
        return "unknown_order";
      }
      if (r.reason !== "status_not_successful" && r.reason !== "bad_ref_prefix") {
        await safeAlert(deps, "Companion: payment rejected", `Order ${ref}, Flutterwave payment ${tx.providerTxId}: ${r.reason}. No link was sent.`);
      }
      return "rejected";
  }
}

export type WebhookResponse = { status: number; body: Record<string, unknown> };

/**
 * Called by the existing webhook route ONLY for payloads whose data.tx_ref
 * starts with TEC-. Returns 200 for everything it handled (including
 * duplicates and rejected payments, where a retry could not help) and 500 only
 * for real internal errors, so Flutterwave retries those.
 */
export async function handleCompanionFlutterwaveWebhook(
  deps: PaymentsDeps,
  input: { verifHash: string | null; event: unknown },
): Promise<WebhookResponse> {
  try {
    if (!verifyFlutterwaveHash(input.verifHash, deps.env.flwSecretHash)) {
      return { status: 401, body: { error: "Invalid signature" } };
    }
    const ev = (input.event && typeof input.event === "object" ? input.event : {}) as Record<string, unknown>;
    const data = (ev.data && typeof ev.data === "object" ? ev.data : {}) as Record<string, unknown>;

    // Only a completed charge can pay an order. Other events: acknowledge.
    if (ev.event !== "charge.completed" || data.status !== "successful") {
      return { status: 200, body: { received: true, handled: false } };
    }
    const id = typeof data.id === "number" || typeof data.id === "string" ? String(data.id) : "";
    if (!/^\d{1,20}$/.test(id)) return { status: 400, body: { error: "Bad payload" } };

    const tx = await verifyTransactionById(deps.fetch, deps.env.flwSecretKey, id);
    if (!tx) {
      // Flutterwave does not know this id. A forged id cannot pay anything.
      return { status: 200, body: { received: true, handled: false } };
    }
    const outcome = await settleVerifiedTransaction(deps, tx, "webhook");
    return { status: 200, body: { received: true, handled: true, outcome } };
  } catch (e) {
    deps.log(`webhook error: ${e instanceof Error ? e.message : "error"}`);
    return { status: 500, body: { error: "Webhook processing failed" } };
  }
}
