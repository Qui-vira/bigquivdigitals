/**
 * Everything delivery needs from the outside world, in one injectable bundle.
 * Tests build their own; routes call getRuntime().
 *
 * DeliveryStore extends the sealed wave 1 CompanionStore with the adapter-only
 * operations that INTERFACE.md lists as "not in the interface". Coder B's Neon
 * adapter must implement DeliveryStore and export createNeonStore() from
 * lib/companion/neon-store.ts (see DELIVERY.md).
 */
import type { CompanionStore } from "./store";
import type { Order, OrderEventActor, OrderStatus } from "./types";
import type { FileStore } from "./file-store";
import type { EmailSender } from "./emails/sender";
import type { Notifier } from "./emails/notify";

export type EmailState = { sentAt: Date | null; attempts: number; lastError: string | null };

export type OrderListRow = {
  order: Order;
  downloadCount: number;
  email: EmailState;
  /** True when an order_events row "duplicate_payment" exists (a second charge on a paid order). */
  duplicatePayment?: boolean;
};

export type OrderEventRow = { at: Date; actor: string; kind: string; detail: string };

export type OrderListFilter = { status?: OrderStatus; src?: string; limit?: number };

export interface DeliveryStore extends CompanionStore {
  getEmailState(orderId: string): Promise<EmailState>;
  /** ok: set email_sent_at=at, last_email_error=null. Not ok: last_email_error=error. Both bump email_attempts. */
  recordEmailResult(orderId: string, r: { ok: boolean; error?: string; at: Date }): Promise<void>;
  /** download_log insert. ua already trimmed by the caller. */
  insertDownloadLog(tokenId: string, at: Date, ipHash: string | null, ua: string | null): Promise<void>;
  /** Newest first. Sum of download_count over all of the order's tokens. */
  listOrders(filter: OrderListFilter): Promise<OrderListRow[]>;
  listEvents(orderId: string): Promise<OrderEventRow[]>;
  /** "My purchases": this (normalised) email's orders in the given statuses, newest first, at most `limit`. */
  listOrdersByEmail(email: string, statuses: OrderStatus[], limit: number): Promise<Order[]>;
  /** Optional: the same event on many orders in ONE statement (CSV export audit). Callers fall back to addEvent. */
  addEventForOrders?(orderIds: string[], actor: OrderEventActor, kind: string, detail: string, at: Date): Promise<void>;
}

export type Runtime = {
  store: DeliveryStore;
  files: FileStore;
  sender: EmailSender;
  notifier: Notifier;
  baseUrl: string;
  ipSalt: string;
  now: () => Date;
  /** Backoff between email attempts. Tests inject an instant one; default is a real timer. */
  sleep?: (ms: number) => Promise<void>;
};

let override: Runtime | null = null;

/** Tests only. */
export function setRuntimeForTests(rt: Runtime | null) {
  override = rt;
}

export async function getRuntime(): Promise<Runtime> {
  if (override) return override;
  const { createDefaultFileStore } = await import("./file-store");
  const { createResendSender } = await import("./emails/sender");
  const { createDefaultNotifier } = await import("./emails/notify");
  const { createNeonStore } = await import("./neon-store");
  const { env } = await import("./env");
  return {
    store: createNeonStore(),
    files: createDefaultFileStore(),
    sender: createResendSender(),
    notifier: createDefaultNotifier(),
    baseUrl: env("NEXT_PUBLIC_SITE_URL") || "https://bigquivdigitals.com",
    ipSalt: env("ORDER_IP_SALT"),
    now: () => new Date(),
  };
}
