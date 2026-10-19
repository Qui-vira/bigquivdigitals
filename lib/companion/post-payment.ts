/**
 * What runs after an order is won as paid. Pure over injected parts, so it is testable.
 *
 * 1. The owner alert goes FIRST and does not depend on delivery. It is idempotent
 *    through the events table using the same event name coder D's deliverOrder uses
 *    ("owner_alerted"), so the two together send exactly one alert.
 * 2. Then delivery. If it throws or reports not ok, we log loudly, write an event
 *    row ("delivery_failed") and alert the owner again, because Flutterwave already
 *    got its 200 and will not retry.
 */
import type { CompanionStore } from "./store";
import type { Order } from "./types";

export type PostPaymentParts = {
  store: CompanionStore;
  now(): Date;
  deliver(orderId: string): Promise<{ ok: boolean; reason?: string }>;
  alert(subject: string, text: string): Promise<unknown>;
  renderNewOrder(order: Order): { subject: string; text: string };
  error(message: string): void;
};

export async function runPostPayment(p: PostPaymentParts, orderId: string): Promise<void> {
  try {
    const alerted = await p.store.countEvents(orderId, "owner_alerted", new Date(0));
    if (alerted === 0) {
      const order = await p.store.getOrderById(orderId);
      await p.store.addEvent(orderId, "system", "owner_alerted", "new order alert", p.now());
      if (order) {
        const m = p.renderNewOrder(order);
        await p.alert(m.subject, m.text);
      }
    }
  } catch (e) {
    p.error(`owner alert failed for order ${orderId}: ${e instanceof Error ? e.message : "error"}`);
  }

  let failure: string | null = null;
  try {
    const r = await p.deliver(orderId);
    if (!r.ok) failure = `not ok: ${r.reason ?? "unknown"}`;
  } catch (e) {
    failure = `threw: ${e instanceof Error ? e.message : "error"}`;
  }
  if (failure) {
    p.error(`DELIVERY FAILED for paid order ${orderId} (${failure}). The buyer has paid and has no email yet.`);
    try {
      await p.store.addEvent(orderId, "system", "delivery_failed", failure.slice(0, 200), p.now());
    } catch {
      /* the log line above is the fallback */
    }
    try {
      await p.alert("Companion: DELIVERY FAILED for a paid order", `Order id ${orderId}: ${failure}. Use Re-send in admin.`);
    } catch {
      /* never throws out of the job */
    }
  }
}
