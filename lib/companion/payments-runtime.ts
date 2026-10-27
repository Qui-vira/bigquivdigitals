/**
 * Builds the real PaymentsDeps for the payment routes. Server only. Tests do
 * not import this file. (runtime.ts is coder D's delivery runtime, a different thing.)
 * Delivery is coder D's function: deliverOrder(orderId) in ./delivery.
 */
import { after } from "next/server";
import type { PaymentsDeps } from "./deps";
import { createDefaultNotifier } from "./emails/notify";
import { renderOwnerNewOrder } from "./emails/templates";
import { env, isProductionEnv } from "./env";
import { countOrdersByEmailSince, getBankDetails, getCompanionSql, getCompanionStore } from "./neon-store";
import { runPostPayment } from "./post-payment";

export function buildPaymentsDeps(): PaymentsDeps {
  const notifier = createDefaultNotifier();
  const store = getCompanionStore();
  const run = (orderId: string) =>
    runPostPayment(
      {
        store,
        now: () => new Date(),
        deliver: async (id) => (await import("./delivery")).deliverOrder(id),
        alert: (s, t) => notifier.alertOwner(s, t),
        renderNewOrder: renderOwnerNewOrder,
        error: (m) => console.error(`[companion] ${m}`),
      },
      orderId,
    );
  return {
    store,
    now: () => new Date(),
    fetch: (...a) => fetch(...a),
    env: {
      flwSecretKey: env("FLW_SECRET_KEY"),
      flwSecretHash: env("FLW_SECRET_HASH"),
      ipSalt: env("ORDER_IP_SALT"),
      production: isProductionEnv(),
    },
    scheduleDelivery(orderId) {
      try {
        after(() => run(orderId));
      } catch {
        void run(orderId);
      }
    },
    async alert(subject, text) {
      await notifier.alertOwner(subject, text);
    },
    log: (m) => console.log(`[companion] ${m}`),
    async sendBuyerEmail(msg) {
      const { createResendSender } = await import("./emails/sender");
      return createResendSender().send(msg);
    },
    getBankDetails: (slug) => getBankDetails(getCompanionSql(), slug),
    countOrdersByEmailSince: (email, since) => countOrdersByEmailSince(getCompanionSql(), email, since),
  };
}
