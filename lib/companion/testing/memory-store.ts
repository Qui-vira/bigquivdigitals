/**
 * In-memory CompanionStore for tests. Mirrors the atomicity contract in
 * ../store.ts. Every method yields to the event loop first so that tests with
 * Promise.all really interleave; the check-and-set itself is synchronous, like
 * a single conditional UPDATE in Postgres.
 */
import { randomUUID } from "node:crypto";
import { DuplicateOrderRefError, type ClaimResult, type CompanionStore, type PaidPatch } from "../store";
import { currentTier } from "../tiers";
import { INFLIGHT_STALE_SECONDS, type AtomicOrderStore, type PlaceOrderArgs, type PlaceResult } from "../store-extra";
import type { DownloadToken, TokenKind, NewOrder, Order, OrderEventActor, OrderStatus, Product } from "../types";

const tick = () => new Promise<void>((r) => setImmediate(r));

export class MemoryStore implements CompanionStore, AtomicOrderStore {
  products = new Map<string, Product>();
  orders = new Map<string, Order>();
  tokens = new Map<string, DownloadToken>();
  events: { orderId: string; actor: OrderEventActor; kind: string; detail: string; at: Date }[] = [];

  async getProduct(slug: string) {
    await tick();
    return this.products.get(slug) ?? null;
  }

  private foundersTakenSync(slug: string, holdSince: Date) {
    let n = 0;
    for (const o of this.orders.values()) {
      if (o.productSlug !== slug || o.priceTier !== "founders") continue;
      if (o.status === "paid" || o.status === "awaiting_transfer") n++;
      else if ((o.status === "created" || o.status === "awaiting_payment") && o.createdAt >= holdSince) n++;
    }
    return n;
  }

  async countFoundersTaken(slug: string, holdSince: Date) {
    await tick();
    return this.foundersTakenSync(slug, holdSince);
  }

  // ---- atomic operations (see store-extra.ts). Each does ONE tick, then a synchronous check-and-set. ----
  attempts = new Map<string, Date[]>();

  async placeOrder(a: PlaceOrderArgs): Promise<PlaceResult> {
    await tick();
    if (a.method === "flutterwave") {
      const stale = a.now.getTime() - INFLIGHT_STALE_SECONDS * 1000;
      for (const o of this.orders.values()) {
        if (o.email !== a.email || o.productSlug !== a.product.slug || o.method !== "flutterwave") continue;
        if (o.status !== "awaiting_payment" || o.providerRef) continue;
        if (o.createdAt.getTime() < stale) o.status = "expired";
        else return { kind: "in_flight", order: { ...o } };
      }
    }
    const price = currentTier(a.product, a.now, this.foundersTakenSync(a.product.slug, a.holdSince));
    if (a.shownTier && a.shownTier !== price.tier) return { kind: "price_changed", price };
    const n = a.build(price);
    for (const x of this.orders.values()) if (x.orderRef === n.orderRef) throw new DuplicateOrderRefError();
    const order: Order = { ...n, id: randomUUID(), supportUntil: null, providerTxId: null, providerRef: null, amountReceivedMinor: null, receivedNote: null, paidAt: null };
    this.orders.set(order.id, order);
    return { kind: "created", order: { ...order }, price };
  }

  async attachPaymentLink(orderId: string, link: string) {
    await tick();
    const o = this.orders.get(orderId);
    if (o && !o.providerRef) o.providerRef = link;
  }

  async reserveCheckoutAttempt(email: string, now: Date, max: number) {
    await tick();
    const since = now.getTime() - 3600 * 1000;
    const list = (this.attempts.get(email) ?? []).filter((t) => t.getTime() > since);
    if (list.length >= max) {
      this.attempts.set(email, list);
      return false;
    }
    list.push(now);
    this.attempts.set(email, list);
    return true;
  }

  async hasOtherPaidOrder(email: string, productSlug: string, excludeOrderId: string) {
    await tick();
    for (const o of this.orders.values()) {
      if (o.id !== excludeOrderId && o.email === email && o.productSlug === productSlug && o.status === "paid") return true;
    }
    return false;
  }

  async findOrdersByBankReference(reference: string) {
    await tick();
    const out: { orderId: string; orderRef: string; status: OrderStatus }[] = [];
    for (const e of this.events) {
      if (e.kind !== "bank_reference" || e.detail !== reference) continue;
      const o = this.orders.get(e.orderId);
      if (o) out.push({ orderId: o.id, orderRef: o.orderRef, status: o.status });
    }
    return out;
  }

  async insertOrder(o: NewOrder) {
    await tick();
    for (const x of this.orders.values()) if (x.orderRef === o.orderRef) throw new DuplicateOrderRefError();
    const order: Order = {
      ...o,
      id: randomUUID(),
      supportUntil: null,
      providerTxId: null,
      providerRef: null,
      amountReceivedMinor: null,
      receivedNote: null,
      paidAt: null,
    };
    this.orders.set(order.id, order);
    return { ...order };
  }

  async getOrderById(id: string) {
    await tick();
    const o = this.orders.get(id);
    return o ? { ...o } : null;
  }

  async getOrderByRef(ref: string) {
    await tick();
    for (const o of this.orders.values()) if (o.orderRef === ref) return { ...o };
    return null;
  }

  async claimOrderPaid(orderId: string, allowedFrom: OrderStatus[], patch: PaidPatch): Promise<ClaimResult> {
    await tick();
    const o = this.orders.get(orderId);
    if (!o) return { kind: "not_found" };
    if (!allowedFrom.includes(o.status)) return { kind: "not_claimable", status: o.status };
    if (patch.providerTxId !== null) {
      for (const x of this.orders.values()) {
        if (x.id !== orderId && x.providerTxId === patch.providerTxId) return { kind: "tx_conflict" };
      }
    }
    o.status = "paid";
    o.paidAt = patch.paidAt;
    o.providerTxId = patch.providerTxId;
    if (patch.providerRef !== undefined) o.providerRef = patch.providerRef;
    o.amountReceivedMinor = patch.amountReceivedMinor;
    o.receivedNote = patch.receivedNote;
    o.supportUntil = patch.supportUntil;
    return { kind: "won", order: { ...o } };
  }

  async setOrderStatus(orderId: string, status: OrderStatus, allowedFrom?: OrderStatus[]) {
    await tick();
    const o = this.orders.get(orderId);
    if (allowedFrom) {
      if (!o || !allowedFrom.includes(o.status)) return false;
      o.status = status;
      return true;
    }
    if (!o) throw new Error("order not found");
    o.status = status;
    return true;
  }

  async insertToken(t: Omit<DownloadToken, "id" | "downloadCount" | "revokedAt" | "kind"> & { kind?: TokenKind }) {
    await tick();
    for (const x of this.tokens.values()) if (x.tokenHash === t.tokenHash) throw new Error("duplicate token hash");
    const row: DownloadToken = { ...t, kind: t.kind ?? "email", id: randomUUID(), downloadCount: 0, revokedAt: null };
    this.tokens.set(row.id, row);
    return { ...row };
  }

  async getTokenByHash(hash: string) {
    await tick();
    for (const t of this.tokens.values()) if (t.tokenHash === hash) return { ...t };
    return null;
  }

  async consumeDownload(tokenId: string, now: Date) {
    await tick();
    const t = this.tokens.get(tokenId);
    if (!t || t.revokedAt || t.expiresAt.getTime() <= now.getTime() || t.downloadCount >= t.maxDownloads) return null;
    t.downloadCount += 1;
    return { ...t };
  }

  async revokeTokensForOrder(orderId: string, now: Date, kind?: TokenKind) {
    await tick();
    let n = 0;
    for (const t of this.tokens.values()) {
      if (t.orderId === orderId && !t.revokedAt && (kind === undefined || t.kind === kind)) {
        t.revokedAt = now;
        n++;
      }
    }
    return n;
  }

  async resetDownloadCount(tokenId: string) {
    await tick();
    const t = this.tokens.get(tokenId);
    if (t) t.downloadCount = 0;
  }

  async addEvent(orderId: string, actor: OrderEventActor, kind: string, detail: string, at: Date) {
    await tick();
    this.events.push({ orderId, actor, kind, detail, at });
  }

  async countEvents(orderId: string, kind: string, since: Date) {
    await tick();
    return this.events.filter((e) => e.orderId === orderId && e.kind === kind && e.at >= since).length;
  }
}

export function sampleProduct(over: Partial<Product> = {}): Product {
  return {
    slug: "theeditcompanion",
    name: "TheEditCompanion",
    active: true,
    currencyBase: "NGN",
    foundersMinor: 8_900_000,
    regularMinor: 12_900_000,
    foundersEndsAt: null,
    foundersCap: null,
    displayUsdFoundersMinor: 6700,
    displayUsdRegularMinor: 9700,
    linkTtlHours: 168,
    maxDownloads: 5,
    allowManualTransfer: false,
    ...over,
  };
}
