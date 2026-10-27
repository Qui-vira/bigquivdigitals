/**
 * Dependencies the payment handlers take. Handlers are pure over this, so tests
 * inject fakes (MemoryStore, fake fetch, recording alert) and nothing real runs.
 * runtime.ts builds the real thing for the routes.
 */
import type { CompanionStore } from "./store";

export type PaymentsDeps = {
  store: CompanionStore;
  now(): Date;
  fetch: typeof fetch;
  /** Trimmed env values. Empty string when unset. */
  env: { flwSecretKey: string; flwSecretHash: string; ipSalt: string; production: boolean };
  /** Start delivery for an order this caller just won. Must not throw. */
  scheduleDelivery(orderId: string): void;
  /** Best effort owner alert (Telegram + email). Must not throw. */
  alert(subject: string, text: string): Promise<void>;
  log(message: string): void;
  /** Optional: email the buyer (the "order received" mail after "I have paid"). Must not throw. */
  sendBuyerEmail?(msg: { to: string; subject: string; html: string; text: string }): Promise<unknown>;
  /** Adapter-only reads. */
  getBankDetails(slug: string): Promise<string | null>;
  countOrdersByEmailSince(email: string, since: Date): Promise<number>;
};
