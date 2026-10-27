/**
 * POST /api/companion/transfer-paid: the buyer taps "I have paid" on a manual
 * bank-transfer order. It records an event and alerts the owner. It NEVER marks
 * the order paid and never releases a link: only the owner does, after the money
 * shows in the bank app (admin "Mark paid").
 * Identified by the claim cookie (hash compare), not by the order ref alone.
 */
import { claimMatches } from "./claim";
import type { PaymentsDeps } from "./deps";
import { formatMinor } from "./money";
import { renderTransferReceived } from "./emails/templates";

export const MAX_TRANSFER_CLAIMS_PER_DAY = 3;

export type TransferResult = { status: number; body: Record<string, unknown> };

const clean = (v: unknown, max: number) =>
  typeof v === "string" ? v.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, max) : "";

export async function handleTransferPaid(
  deps: PaymentsDeps,
  input: { body: unknown; claimCookie: string | undefined },
): Promise<TransferResult> {
  const b = (input.body && typeof input.body === "object" ? input.body : {}) as Record<string, unknown>;
  const ref = typeof b.orderRef === "string" ? b.orderRef : "";
  // One uniform answer for unknown ref, wrong cookie or wrong method: no enumeration.
  const notFound: TransferResult = { status: 404, body: { ok: false, error: "We could not find this order." } };
  if (!ref.startsWith("TEC-")) return notFound;

  const order = await deps.store.getOrderByRef(ref);
  if (!order || !claimMatches(order, input.claimCookie) || order.method !== "bank_transfer") return notFound;

  if (order.status === "paid") return { status: 200, body: { ok: true, state: "paid" } };
  if (order.status !== "awaiting_transfer" && order.status !== "underpaid") {
    return { status: 409, body: { ok: false, error: "This order cannot take a payment notice. Message us and we will help." } };
  }

  const now = deps.now();
  const recent = await deps.store.countEvents(order.id, "transfer_claimed", new Date(now.getTime() - 24 * 60 * 60 * 1000));
  if (recent >= MAX_TRANSFER_CLAIMS_PER_DAY) {
    return { status: 429, body: { ok: false, error: "We already have your notice. We are checking. Message us if it is urgent." } };
  }

  const sender = clean(b.senderName, 80);
  const note = clean(b.note, 140);
  await deps.store.addEvent(order.id, "buyer", "transfer_claimed", `sender=${sender || "-"}; note=${note || "-"}`, now);

  try {
    await deps.alert(
      "Companion: buyer says they paid by transfer",
      `Order ${order.orderRef}\nExpected: NGN ${formatMinor(order.expectedMinor)}\nSender name: ${sender || "(not given)"}\nNote: ${note || "(none)"}\n\nCheck the bank app, then use Mark paid in admin. A screenshot is not proof.`,
    );
  } catch {
    /* the claim is recorded; an alert failure must not fail the buyer */
  }
  // First notice only: tell the buyer we have it and are checking (no link yet).
  if (recent === 0 && deps.sendBuyerEmail) {
    try {
      await deps.sendBuyerEmail({ to: order.email, ...renderTransferReceived(order) });
      await deps.store.addEvent(order.id, "system", "transfer_received_email", "order received email sent", now);
    } catch {
      /* the claim is recorded; a mail failure must not fail the buyer */
    }
  }
  return { status: 200, body: { ok: true, state: "awaiting_transfer" } };
}
