/**
 * Admin operations. Every function takes an `authorize` callback and awaits it
 * FIRST, before reading arguments or touching the store. The server actions and
 * the CSV route pass requireAdmin(). Nothing here relies on a page being hidden.
 */
import { markOrderPaid } from "./orders";
import { toMinor, formatMinor } from "./money";
import { revokeLinks } from "./tokens";
import { isAtomicStore, normaliseBankReference } from "./store-extra";
import { deliverOrderWith, resendDeliveryWith, type DeliverResult } from "./delivery";
import type { OrderEventRow, OrderListFilter, OrderListRow, Runtime } from "./runtime";
import type { OrderStatus } from "./types";

export type Authorize = () => Promise<unknown>;

/** Statuses an admin may mark as paid. Never paid, refunded or flagged. */
const MARKABLE_FROM: OrderStatus[] = ["awaiting_payment", "awaiting_transfer", "underpaid", "expired"];

export async function adminListOrders(rt: Runtime, authorize: Authorize, filter: OrderListFilter): Promise<OrderListRow[]> {
  await authorize();
  return rt.store.listOrders(filter);
}

export async function adminListEvents(rt: Runtime, authorize: Authorize, orderId: string): Promise<OrderEventRow[]> {
  await authorize();
  return rt.store.listEvents(orderId);
}

export type TransferInput = {
  orderId: string;
  amount: string;
  reference: string;
  note?: string;
  force?: boolean;
  /** Tick "this bank reference was already used on another order, mark paid anyway". Needs a note. */
  overrideReference?: boolean;
};

/**
 * Other PAID orders already released with the same bank reference (case and space
 * insensitive). The reference is stored separately as an order event (kind
 * "bank_reference") with a NON-unique lookup, so legitimate reuse never corrupts an
 * order. Falls back to scanning the payment ids on stores without the lookup.
 */
export async function findReferenceUse(rt: Runtime, reference: string, exceptOrderId: string): Promise<string[]> {
  const want = normaliseBankReference(reference);
  if (!want) return [];
  if (isAtomicStore(rt.store)) {
    const rows = await rt.store.findOrdersByBankReference(want);
    return rows.filter((r) => r.orderId !== exceptOrderId && r.status === "paid").map((r) => r.orderRef);
  }
  const rows = await rt.store.listOrders({ limit: 1000 });
  const used: string[] = [];
  for (const { order } of rows) {
    if (order.id === exceptOrderId || !order.providerTxId?.startsWith("bank:")) continue;
    const ref = order.providerTxId.split(":").slice(2).join(":").trim().toLowerCase();
    if (ref === want) used.push(order.orderRef);
  }
  return used;
}

/**
 * For the admin page: is this bank reference already on another paid order?
 * `warning` is ready-to-show text (null when the reference is unused).
 */
export async function checkReferenceUse(
  rt: Runtime,
  authorize: Authorize,
  reference: string,
  exceptOrderId = "",
): Promise<{ used: boolean; orders: string[]; warning: string | null }> {
  await authorize();
  const orders = await findReferenceUse(rt, reference, exceptOrderId);
  return {
    used: orders.length > 0,
    orders,
    warning:
      orders.length > 0
        ? `This bank reference was already used to release ${orders.join(", ")}. Check the bank app: one transfer should not pay for two orders. To release this order anyway, tick the override box and write a note.`
        : null,
  };
}

export type TransferResult =
  | { ok: true; delivery: DeliverResult }
  | { ok: false; reason: "bad_amount" | "reference_required" | "not_found" | "not_transfer" | "underpaid" | "already_paid" | "not_payable" | "wrong_status" | "flagged" | "reference_used" | "override_needs_note" }
  & { usedBy?: string[] };

export async function adminMarkTransferPaid(rt: Runtime, authorize: Authorize, input: TransferInput): Promise<TransferResult> {
  await authorize();
  const order = await rt.store.getOrderById(input.orderId);
  if (!order) return { ok: false, reason: "not_found" };
  if (order.method !== "bank_transfer") return { ok: false, reason: "not_transfer" };
  if (order.status === "paid") return { ok: false, reason: "already_paid" };
  if (!MARKABLE_FROM.includes(order.status)) return { ok: false, reason: "wrong_status" };
  const reference = (input.reference ?? "").trim().slice(0, 120);
  if (!reference) return { ok: false, reason: "reference_required" };
  const received = toMinor(input.amount);
  if (received === null || received <= 0) return { ok: false, reason: "bad_amount" };
  const now = rt.now();
  const note = (input.note ?? "").trim().slice(0, 300);
  const usedBy = await findReferenceUse(rt, reference, order.id);
  if (usedBy.length > 0) {
    if (!input.overrideReference) return { ok: false, reason: "reference_used", usedBy };
    if (!note) return { ok: false, reason: "override_needs_note", usedBy };
    await rt.store.addEvent(order.id, "admin", "reference_override", `reference also on ${usedBy.join(",")}; note=${note}`.slice(0, 300), now);
  }
  if (received < order.expectedMinor && !(input.force && note)) {
    // Conditional UPDATE so a double click, a second tab or a webhook cannot have this
    // downgrade an order that was paid (or refunded, or flagged) a moment ago.
    if (!(await rt.store.setOrderStatus(order.id, "underpaid", MARKABLE_FROM))) {
      const fresh = await rt.store.getOrderById(order.id);
      return { ok: false, reason: fresh?.status === "paid" ? "already_paid" : "wrong_status" };
    }
    await rt.store.addEvent(order.id, "admin", "underpaid", `received_minor=${received} expected_minor=${order.expectedMinor}`, now);
    return { ok: false, reason: "underpaid" };
  }
  const res = await markOrderPaid(
    rt.store,
    order.id,
    { providerTxId: `bank:${order.orderRef}:${reference}`, amountReceivedMinor: received, note: note ? `${reference} | ${note}` : reference, actor: "admin" },
    now,
  );
  switch (res.kind) {
    case "won":
      // Store the reference on its own (non-unique) so a later order with the same reference is caught.
      await rt.store.addEvent(order.id, "admin", "bank_reference", normaliseBankReference(reference), now);
      return { ok: true, delivery: await deliverOrderWith(rt, order.id) };
    case "already_paid":
      return { ok: false, reason: "already_paid" };
    case "flagged_tx_conflict":
      return { ok: false, reason: "flagged" };
    case "not_payable":
      return { ok: false, reason: "not_payable" };
    case "not_found":
      return { ok: false, reason: "not_found" };
  }
}

export async function adminResend(rt: Runtime, authorize: Authorize, orderId: string, opts: { revokeAll?: boolean } = {}): Promise<DeliverResult> {
  await authorize();
  return resendDeliveryWith(rt, orderId, "admin", opts);
}

export async function adminRevoke(rt: Runtime, authorize: Authorize, orderId: string): Promise<number> {
  await authorize();
  return revokeLinks(rt.store, orderId, rt.now());
}

// ---- CSV ----

/** Neutralise spreadsheet formulas, then quote per RFC 4180. */
export function csvCell(value: unknown): string {
  let s = value === null || value === undefined ? "" : value instanceof Date ? value.toISOString() : String(value);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  if (/[",\r\n]/.test(s)) s = `"${s.replace(/"/g, '""')}"`;
  return s;
}

export const CSV_HEADER = [
  "order_ref", "created_at", "paid_at", "status", "tier", "method", "amount_ngn", "email", "name", "src", "support_until", "downloads", "email_sent_at", "email_error",
];

export function ordersToCsv(rows: OrderListRow[]): string {
  const lines = [CSV_HEADER.join(",")];
  for (const r of rows) {
    const o = r.order;
    lines.push(
      [
        o.orderRef, o.createdAt, o.paidAt, o.status, o.priceTier, o.method,
        formatMinor(o.amountReceivedMinor ?? o.expectedMinor), o.email, o.name, o.src, o.supportUntil,
        r.downloadCount, r.email.sentAt, r.email.lastError,
      ].map(csvCell).join(","),
    );
  }
  return lines.join("\r\n") + "\r\n";
}

export async function adminExportCsv(rt: Runtime, authorize: Authorize, filter: OrderListFilter): Promise<string> {
  await authorize();
  const rows = await rt.store.listOrders({ ...filter, limit: filter.limit ?? 5000 });
  // Audit (review M11): every exported order gets a csv_export event BEFORE the data leaves.
  // If the audit write fails, the export fails too. The detail holds no email or name.
  const ids = rows.map((r) => r.order.id);
  const detail = `rows=${ids.length} status=${filter.status ?? "all"} src=${filter.src ?? "all"}`.slice(0, 300);
  const at = rt.now();
  if (rt.store.addEventForOrders) await rt.store.addEventForOrders(ids, "admin", "csv_export", detail, at);
  else for (const id of ids) await rt.store.addEvent(id, "admin", "csv_export", detail, at);
  return ordersToCsv(rows);
}

export const ORDER_STATUSES: OrderStatus[] = ["created", "awaiting_payment", "awaiting_transfer", "underpaid", "paid", "refunded", "expired", "flagged"];
