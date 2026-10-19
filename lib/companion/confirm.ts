/**
 * The payment-confirmation predicate. Pure. Compare a provider transaction
 * (already re-queried from the provider verify API, never the raw webhook body)
 * against OUR order. The order is the source of truth, never the request.
 *
 * Rules (Flutterwave docs, "Always verify critical transaction data"):
 * status successful, tx_ref equal, currency equal, amount >= expected.
 */
import { toMinor } from "./money";
import type { Order } from "./types";

export const ORDER_REF_PREFIX = "TEC-";

export type ProviderTx = {
  txRef: unknown;
  status: unknown;
  currency: unknown;
  /** Provider amount in MAJOR units (naira), number or numeric string. */
  amount: unknown;
};

export type ConfirmResult =
  | { ok: true; receivedMinor: number }
  | {
      ok: false;
      reason:
        | "bad_ref_prefix"
        | "ref_mismatch"
        | "status_not_successful"
        | "currency_mismatch"
        | "amount_invalid"
        | "amount_underpaid";
      /** Set for amount_underpaid so the caller can record it. */
      receivedMinor?: number;
    };

export function isCompanionRef(ref: unknown): ref is string {
  return typeof ref === "string" && ref.startsWith(ORDER_REF_PREFIX);
}

export function checkPayment(order: Order, tx: ProviderTx): ConfirmResult {
  if (!isCompanionRef(tx.txRef)) return { ok: false, reason: "bad_ref_prefix" };
  if (tx.txRef !== order.orderRef) return { ok: false, reason: "ref_mismatch" };
  if (tx.status !== "successful") return { ok: false, reason: "status_not_successful" };
  if (typeof tx.currency !== "string" || tx.currency.toUpperCase() !== order.currency) {
    return { ok: false, reason: "currency_mismatch" };
  }
  const received = toMinor(tx.amount);
  if (received === null) return { ok: false, reason: "amount_invalid" };
  if (received < order.expectedMinor) {
    return { ok: false, reason: "amount_underpaid", receivedMinor: received };
  }
  return { ok: true, receivedMinor: received };
}
