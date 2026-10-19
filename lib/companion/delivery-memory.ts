/** Test double: MemoryStore plus the adapter-only DeliveryStore operations. Not for production. */
import { MemoryStore } from "./testing/memory-store";
import type { DeliveryStore, EmailState, OrderEventRow, OrderListFilter, OrderListRow } from "./runtime";

export class DeliveryMemoryStore extends MemoryStore implements DeliveryStore {
  emailState = new Map<string, EmailState>();
  downloadLog: { tokenId: string; at: Date; ipHash: string | null; ua: string | null }[] = [];

  async getEmailState(orderId: string): Promise<EmailState> {
    return { ...(this.emailState.get(orderId) ?? { sentAt: null, attempts: 0, lastError: null }) };
  }

  async recordEmailResult(orderId: string, r: { ok: boolean; error?: string; at: Date }) {
    const cur = this.emailState.get(orderId) ?? { sentAt: null, attempts: 0, lastError: null };
    this.emailState.set(orderId, {
      sentAt: r.ok ? r.at : cur.sentAt,
      attempts: cur.attempts + 1,
      lastError: r.ok ? null : (r.error ?? "error"),
    });
  }

  async insertDownloadLog(tokenId: string, at: Date, ipHash: string | null, ua: string | null) {
    this.downloadLog.push({ tokenId, at, ipHash, ua });
  }

  async listOrders(filter: OrderListFilter): Promise<OrderListRow[]> {
    const rows: OrderListRow[] = [];
    for (const o of this.orders.values()) {
      if (filter.status && o.status !== filter.status) continue;
      if (filter.src && o.src !== filter.src) continue;
      let downloadCount = 0;
      for (const t of this.tokens.values()) if (t.orderId === o.id) downloadCount += t.downloadCount;
      rows.push({
        order: { ...o },
        downloadCount,
        email: await this.getEmailState(o.id),
        duplicatePayment: this.events.some((e) => e.orderId === o.id && e.kind === "duplicate_payment"),
      });
    }
    rows.sort((a, b) => b.order.createdAt.getTime() - a.order.createdAt.getTime());
    return rows.slice(0, filter.limit ?? 300);
  }

  async listEvents(orderId: string): Promise<OrderEventRow[]> {
    return this.events.filter((e) => e.orderId === orderId).map(({ at, actor, kind, detail }) => ({ at, actor, kind, detail }));
  }
}
