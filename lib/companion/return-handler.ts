/**
 * GET /api/companion/return: Flutterwave sends the buyer back with
 * ?status=&tx_ref=&transaction_id=. NOTHING in that query string is trusted:
 * we re-query Flutterwave's verify API and judge the result against our order.
 * Idempotent with the webhook: whichever settles first wins, the other no-ops.
 * Never throws; on any error the buyer still lands on the thanks page, which
 * reads the true order state from the database (the webhook settles it).
 */
import { THANKS_PATH } from "./checkout-handler";
import { isCompanionRef } from "./confirm";
import type { PaymentsDeps } from "./deps";
import { verifyTransactionById, verifyTransactionByRef, type VerifiedTx } from "./flutterwave";
import { settleVerifiedTransaction } from "./flutterwave-handler";

export const PRODUCT_PAGE_PATH = "/theeditcompanion";

export async function handleReturn(
  deps: PaymentsDeps,
  q: { status: string | null; txRef: string | null; transactionId: string | null },
): Promise<{ location: string }> {
  if (!isCompanionRef(q.txRef)) return { location: PRODUCT_PAGE_PATH };
  try {
    let tx: VerifiedTx | null = null;
    if (q.transactionId && /^\d{1,20}$/.test(q.transactionId)) {
      tx = await verifyTransactionById(deps.fetch, deps.env.flwSecretKey, q.transactionId);
    } else if (q.status === "successful" || q.status === "completed") {
      tx = await verifyTransactionByRef(deps.fetch, deps.env.flwSecretKey, q.txRef);
    }
    // The id must belong to the order the query claims. A mismatch is ignored, not settled.
    if (tx && tx.txRef === q.txRef) {
      await settleVerifiedTransaction(deps, tx, "buyer");
    }
  } catch (e) {
    deps.log(`return verify error: ${e instanceof Error ? e.message : "error"}`);
  }
  // The thanks page + order-status need the ref (the store has no lookup by claim hash).
  // The ref is random and useless without the claim cookie; reject odd characters anyway.
  return { location: /^TEC-[A-Za-z0-9_-]{1,64}$/.test(q.txRef) ? `${THANKS_PATH}?ref=${q.txRef}` : THANKS_PATH };
}
