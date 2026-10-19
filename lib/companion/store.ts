/**
 * The database interface. The pure logic in this module only talks to this.
 * Wave 2 writes a Neon adapter; tests use testing/memory-store.ts.
 *
 * ATOMICITY CONTRACT (the adapter MUST honour these, they are the whole point):
 *  - claimOrderPaid: one conditional UPDATE ... WHERE id=$1 AND status = ANY($allowedFrom)
 *    RETURNING *. Exactly one concurrent caller gets "won".
 *  - consumeDownload: one conditional UPDATE that increments download_count only
 *    when download_count < max_downloads AND revoked_at IS NULL AND expires_at > now.
 *  - insertOrder must throw DuplicateOrderRefError on a unique violation of order_ref.
 *  - Every method THROWS on a database error. Never swallow errors (the AI class
 *    code did, and money was lost). Callers turn a throw into HTTP 500 so the
 *    provider retries.
 */
import type { DownloadToken, TokenKind, NewOrder, Order, OrderEventActor, OrderStatus, Product } from "./types";

export class DuplicateOrderRefError extends Error {
  constructor() {
    super("duplicate order_ref");
    this.name = "DuplicateOrderRefError";
  }
}

export type PaidPatch = {
  paidAt: Date;
  providerTxId: string | null;
  providerRef?: string | null;
  amountReceivedMinor: number;
  receivedNote: string | null;
  supportUntil: Date;
};

export type ClaimResult =
  | { kind: "won"; order: Order }
  /** The order was not in an allowed status (already paid, refunded, flagged...). */
  | { kind: "not_claimable"; status: OrderStatus }
  /** provider_tx_id already belongs to another order (unique index). */
  | { kind: "tx_conflict" }
  | { kind: "not_found" };

export interface CompanionStore {
  getProduct(slug: string): Promise<Product | null>;
  /**
   * Founders places in use: orders with price_tier='founders' and status in
   * ('paid','awaiting_transfer'), plus status in ('created','awaiting_payment')
   * with created_at >= holdSince (unpaid card holds expire).
   */
  countFoundersTaken(slug: string, holdSince: Date): Promise<number>;
  insertOrder(order: NewOrder): Promise<Order>;
  getOrderById(id: string): Promise<Order | null>;
  getOrderByRef(ref: string): Promise<Order | null>;
  claimOrderPaid(orderId: string, allowedFrom: OrderStatus[], patch: PaidPatch): Promise<ClaimResult>;
  /**
   * Without allowedFrom: unconditional, throws when the order does not exist, returns true.
   * With allowedFrom: ONE conditional UPDATE ... WHERE id AND status = ANY(allowedFrom).
   * Returns false (no throw) when the order is missing or no longer in an allowed status,
   * so a read-then-write cannot downgrade an order that changed in between (paid, refunded).
   */
  setOrderStatus(orderId: string, status: OrderStatus, allowedFrom?: OrderStatus[]): Promise<boolean>;

  insertToken(token: Omit<DownloadToken, "id" | "downloadCount" | "revokedAt" | "kind"> & { kind?: TokenKind }): Promise<DownloadToken>;
  getTokenByHash(hash: string): Promise<DownloadToken | null>;
  /** Atomic. Returns the updated row, or null when not allowed (revoked, expired, exhausted). */
  consumeDownload(tokenId: string, now: Date): Promise<DownloadToken | null>;
  /** Revoke every not-yet-revoked token of the order. Returns how many were revoked. */
  /** kind omitted = revoke every kind (admin revoke-all). */
  revokeTokensForOrder(orderId: string, now: Date, kind?: TokenKind): Promise<number>;
  resetDownloadCount(tokenId: string): Promise<void>;

  addEvent(orderId: string, actor: OrderEventActor, kind: string, detail: string, at: Date): Promise<void>;
  countEvents(orderId: string, kind: string, since: Date): Promise<number>;
}
