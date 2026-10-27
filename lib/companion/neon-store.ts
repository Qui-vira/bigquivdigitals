/**
 * Neon (Postgres) implementation of CompanionStore, against
 * drizzle/companion-schema.sql. Uses the `sql.query(text, params)` form of
 * @neondatabase/serverless (positional $1 params, rows returned directly).
 *
 * Every method THROWS on a database error. Nothing here swallows an error.
 *
 * Atomic by construction (single statements, no read-then-write):
 *  - claimOrderPaid       one UPDATE ... WHERE id AND status = ANY(...) RETURNING *
 *  - consumeDownload      one UPDATE ... WHERE count < max AND not revoked AND not expired RETURNING *
 *  - revokeTokensForOrder one UPDATE ... WHERE revoked_at IS NULL RETURNING id
 * The only follow-up SELECT (current status after a missed claim) runs AFTER
 * the single atomic statement has already decided.
 */
import { neon } from "@neondatabase/serverless";
import { env } from "./env";
import { DuplicateOrderRefError, type ClaimResult, type PaidPatch } from "./store";
import type { DownloadToken, NewOrder, Order, OrderEventActor, OrderStatus, Product } from "./types";
import { currentTier } from "./tiers";
import { INFLIGHT_STALE_SECONDS, type AtomicOrderStore, type PlaceOrderArgs, type PlaceResult } from "./store-extra";
import type { DeliveryStore, EmailState, OrderEventRow, OrderListFilter, OrderListRow } from "./runtime";

export type Row = Record<string, unknown>;
/** The one method of the Neon client this adapter needs. Tests pass a recording fake. */
export interface SqlClient {
  query(text: string, params?: unknown[]): Promise<Row[]>;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function date(v: unknown): Date {
  if (v instanceof Date) return v;
  const d = new Date(String(v));
  if (Number.isNaN(d.getTime())) throw new Error("bad timestamp from database");
  return d;
}
const dateOrNull = (v: unknown) => (v === null || v === undefined ? null : date(v));
const num = (v: unknown) => Number(v);
const numOrNull = (v: unknown) => (v === null || v === undefined ? null : Number(v));
const strOrNull = (v: unknown) => (v === null || v === undefined ? null : String(v));

function isUniqueViolation(e: unknown): boolean {
  return typeof e === "object" && e !== null && (e as { code?: unknown }).code === "23505";
}

export function mapProduct(r: Row): Product {
  return {
    slug: String(r.slug),
    name: String(r.name),
    active: Boolean(r.active),
    currencyBase: "NGN",
    foundersMinor: num(r.founders_minor),
    regularMinor: num(r.regular_minor),
    foundersEndsAt: dateOrNull(r.founders_ends_at),
    foundersCap: numOrNull(r.founders_cap),
    displayUsdFoundersMinor: numOrNull(r.display_usd_founders_minor),
    displayUsdRegularMinor: numOrNull(r.display_usd_regular_minor),
    linkTtlHours: num(r.link_ttl_hours),
    maxDownloads: num(r.max_downloads),
    allowManualTransfer: Boolean(r.allow_manual_transfer),
  };
}

export function mapOrder(r: Row): Order {
  return {
    id: String(r.id),
    orderRef: String(r.order_ref),
    productSlug: String(r.product_slug),
    email: String(r.email),
    name: String(r.name),
    status: String(r.status) as OrderStatus,
    method: String(r.method) as Order["method"],
    priceTier: String(r.price_tier) as Order["priceTier"],
    expectedMinor: num(r.expected_minor),
    currency: "NGN",
    supportUntil: dateOrNull(r.support_until),
    providerTxId: strOrNull(r.provider_tx_id),
    providerRef: strOrNull(r.provider_ref),
    amountReceivedMinor: numOrNull(r.amount_received_minor),
    receivedNote: strOrNull(r.received_note),
    consentAt: date(r.consent_at),
    consentVersion: String(r.consent_version),
    consentIpHash: strOrNull(r.consent_ip_hash),
    src: strOrNull(r.src),
    claimHash: String(r.claim_hash),
    createdAt: date(r.created_at),
    paidAt: dateOrNull(r.paid_at),
  };
}

export function mapToken(r: Row): DownloadToken {
  return {
    id: String(r.id),
    orderId: String(r.order_id),
    tokenHash: String(r.token_hash),
    expiresAt: date(r.expires_at),
    maxDownloads: num(r.max_downloads),
    downloadCount: num(r.download_count),
    revokedAt: dateOrNull(r.revoked_at),
    createdAt: date(r.created_at),
    createdBy: String(r.created_by) as DownloadToken["createdBy"],
    kind: r.kind === "thanks" ? "thanks" : "email",
  };
}

/** An unpaid card order (created / awaiting_payment) expires after this long. */
export const CARD_ORDER_EXPIRY_HOURS = 48;
/** An unpaid manual transfer order expires after this long. */
export const TRANSFER_ORDER_EXPIRY_DAYS = 14;
const HOUR = 3600 * 1000;

export function createNeonCompanionStore(sql: SqlClient, clock: () => Date = () => new Date()): DeliveryStore & AtomicOrderStore {
  /**
   * Lazy expiry, enforced when an order is READ. One conditional UPDATE: only an
   * order still unpaid and past its limit flips to 'expired'. A real late payment
   * is still honoured later (expired is in PAYABLE_FROM); the price lock does not
   * outlive expiry because the payment path re-quotes expired orders.
   */
  async function expireIfDue(order: Order): Promise<Order> {
    const now = clock();
    const age = now.getTime() - order.createdAt.getTime();
    const due =
      ((order.status === "created" || order.status === "awaiting_payment") && age >= CARD_ORDER_EXPIRY_HOURS * HOUR) ||
      (order.status === "awaiting_transfer" && age >= TRANSFER_ORDER_EXPIRY_DAYS * 24 * HOUR);
    if (!due) return order;
    const rows = await sql.query(
      `UPDATE companion_orders SET status = 'expired'
        WHERE id = $1 AND status = ANY($2::text[]) AND created_at <= $3
    RETURNING *`,
      [
        order.id,
        order.status === "awaiting_transfer" ? ["awaiting_transfer"] : ["created", "awaiting_payment"],
        new Date(now.getTime() - (order.status === "awaiting_transfer" ? TRANSFER_ORDER_EXPIRY_DAYS * 24 : CARD_ORDER_EXPIRY_HOURS) * HOUR),
      ],
    );
    if (rows[0]) {
      await sql.query(
        "INSERT INTO companion_order_events (order_id, at, actor, kind, detail) VALUES ($1,$2,'system','expired',$3)",
        [order.id, now, `unpaid past limit (${order.status})`],
      );
      return mapOrder(rows[0]);
    }
    // Lost a race (it was paid meanwhile): return the truth.
    const cur = await sql.query("SELECT * FROM companion_orders WHERE id = $1", [order.id]);
    return cur[0] ? mapOrder(cur[0]) : order;
  }

  /** Which unique constraint a Postgres 23505 came from ("" when it is not a unique violation). */
  function violated(e: unknown): string {
    if (!isUniqueViolation(e)) return "";
    const x = e as { constraint?: unknown; message?: unknown };
    return `${String(x.constraint ?? "")} ${String(x.message ?? "")}`;
  }

  const INSERT_ORDER_SQL = `INSERT INTO companion_orders
             (order_ref, product_slug, email, name, status, method, price_tier, expected_minor, currency,
              consent_at, consent_version, consent_ip_hash, src, claim_hash, created_at, founders_slot)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
           RETURNING *`;
  const orderParams = (o: NewOrder, slot: number | null) => [
    o.orderRef, o.productSlug, o.email, o.name, o.status, o.method, o.priceTier, o.expectedMinor,
    o.currency, o.consentAt, o.consentVersion, o.consentIpHash, o.src, o.claimHash, o.createdAt, slot,
  ];

  return {
    async getProduct(slug) {
      const rows = await sql.query("SELECT * FROM companion_products WHERE slug = $1", [slug]);
      return rows[0] ? mapProduct(rows[0]) : null;
    },

    async countFoundersTaken(slug, holdSince) {
      const rows = await sql.query(
        `SELECT count(*)::int AS n FROM companion_orders
          WHERE product_slug = $1 AND price_tier = 'founders'
            AND (status = 'paid'
                 OR (status = 'awaiting_transfer' AND created_at >= $3)
                 OR (status IN ('created','awaiting_payment') AND created_at >= $2))`,
        [slug, holdSince, new Date(clock().getTime() - TRANSFER_ORDER_EXPIRY_DAYS * 24 * HOUR)],
      );
      return Number(rows[0]?.n ?? 0);
    },

    async insertOrder(o: NewOrder) {
      try {
        const rows = await sql.query(INSERT_ORDER_SQL, orderParams(o, null));
        if (!rows[0]) throw new Error("insert returned no row");
        return mapOrder(rows[0]);
      } catch (e) {
        if (isUniqueViolation(e)) throw new DuplicateOrderRefError();
        throw e;
      }
    },

    /**
     * Tier + "one in-flight card order" + insert, with every guard enforced by the DATABASE:
     *  - companion_orders_inflight_uidx  (email, product) where card order, awaiting_payment, no link yet
     *  - companion_orders_founders_slot_uidx (product, slot) when a founders cap is set: each founders
     *    place is a numbered slot; two checkouts cannot claim the same slot, the loser takes the next
     *    free slot or falls to the regular price.
     */
    async placeOrder(a: PlaceOrderArgs): Promise<PlaceResult> {
      const { product, email, method, now } = a;
      const dateOk = product.foundersEndsAt === null || now.getTime() < product.foundersEndsAt.getTime();
      const cap = product.foundersCap;

      if (method === "flutterwave") {
        // A card order whose link was never attached (crash between insert and link) stops blocking.
        await sql.query(
          `UPDATE companion_orders SET status = 'expired', founders_slot = NULL
            WHERE email = $1 AND product_slug = $2 AND method = 'flutterwave' AND status = 'awaiting_payment'
              AND provider_ref IS NULL AND created_at < $3`,
          [email, product.slug, new Date(now.getTime() - INFLIGHT_STALE_SECONDS * 1000)],
        );
      }
      if (dateOk && cap !== null) {
        // Release slots of holds that ended (expired, refunded, unpaid card past the hold, stale transfer).
        await sql.query(
          `UPDATE companion_orders SET founders_slot = NULL
            WHERE product_slug = $1 AND founders_slot IS NOT NULL
              AND (status IN ('expired','refunded')
                   OR (status IN ('created','awaiting_payment') AND created_at < $2)
                   OR (status = 'awaiting_transfer' AND created_at < $3))`,
          [product.slug, a.holdSince, new Date(now.getTime() - TRANSFER_ORDER_EXPIRY_DAYS * 24 * HOUR)],
        );
      }

      for (let attempt = 0; attempt < 6; attempt++) {
        let slot: number | null = null;
        if (dateOk && cap !== null) {
          const used = await sql.query(
            "SELECT founders_slot FROM companion_orders WHERE product_slug = $1 AND founders_slot IS NOT NULL",
            [product.slug],
          );
          const taken = new Set(used.map((r) => Number(r.founders_slot)));
          for (let k = 1; k <= cap; k++) {
            if (!taken.has(k)) {
              slot = k;
              break;
            }
          }
        }
        // Founders iff the date allows and (no cap, or a free slot exists). currentTier does the date math.
        const price = currentTier(product, now, dateOk && cap !== null && slot === null ? cap : 0);
        if (a.shownTier && a.shownTier !== price.tier) return { kind: "price_changed", price };
        const o = a.build(price);
        try {
          const rows = await sql.query(INSERT_ORDER_SQL, orderParams(o, price.tier === "founders" ? slot : null));
          if (!rows[0]) throw new Error("insert returned no row");
          return { kind: "created", order: mapOrder(rows[0]), price };
        } catch (e) {
          const v = violated(e);
          if (!v) throw e;
          if (v.includes("founders_slot")) continue; // someone took this slot first: re-read, take the next
          if (v.includes("inflight")) {
            const ex = await sql.query(
              `SELECT * FROM companion_orders
                WHERE email = $1 AND product_slug = $2 AND method = 'flutterwave' AND status = 'awaiting_payment' AND provider_ref IS NULL
                LIMIT 1`,
              [email, product.slug],
            );
            if (ex[0]) return { kind: "in_flight", order: mapOrder(ex[0]) };
            continue; // its link was attached meanwhile: try again
          }
          throw new DuplicateOrderRefError();
        }
      }
      throw new Error("could not place order after retries");
    },

    async attachPaymentLink(orderId, link) {
      await sql.query("UPDATE companion_orders SET provider_ref = $2 WHERE id = $1 AND provider_ref IS NULL", [orderId, link]);
    },

    /** Fixed hour buckets: claim the first free numbered slot 1..max for (email, hour). Insert-or-skip is atomic. */
    async reserveCheckoutAttempt(email, now, max) {
      const bucket = new Date(Math.floor(now.getTime() / HOUR) * HOUR);
      for (let n = 1; n <= max; n++) {
        const rows = await sql.query(
          "INSERT INTO companion_checkout_attempts (email, bucket, n) VALUES ($1,$2,$3) ON CONFLICT DO NOTHING RETURNING n",
          [email, bucket, n],
        );
        if (rows.length > 0) return true;
      }
      return false;
    },

    async hasOtherPaidOrder(email, productSlug, excludeOrderId) {
      const rows = await sql.query(
        "SELECT 1 AS x FROM companion_orders WHERE email = $1 AND product_slug = $2 AND status = 'paid' AND id <> $3 LIMIT 1",
        [email, productSlug, excludeOrderId],
      );
      return rows.length > 0;
    },

    async findOrdersByBankReference(reference) {
      const rows = await sql.query(
        `SELECT DISTINCT o.id, o.order_ref, o.status
           FROM companion_order_events e JOIN companion_orders o ON o.id = e.order_id
          WHERE e.kind = 'bank_reference' AND e.detail = $1`,
        [reference],
      );
      return rows.map((r) => ({ orderId: String(r.id), orderRef: String(r.order_ref), status: String(r.status) as OrderStatus }));
    },

    async getOrderById(id) {
      if (!UUID_RE.test(id)) return null;
      const rows = await sql.query("SELECT * FROM companion_orders WHERE id = $1", [id]);
      return rows[0] ? expireIfDue(mapOrder(rows[0])) : null;
    },

    async getOrderByRef(ref) {
      const rows = await sql.query("SELECT * FROM companion_orders WHERE order_ref = $1", [ref]);
      return rows[0] ? expireIfDue(mapOrder(rows[0])) : null;
    },

    async claimOrderPaid(orderId: string, allowedFrom: OrderStatus[], patch: PaidPatch): Promise<ClaimResult> {
      if (!UUID_RE.test(orderId)) return { kind: "not_found" };
      let rows: Row[];
      try {
        // ONE conditional UPDATE. Exactly one concurrent caller gets a row back.
        rows = await sql.query(
          `UPDATE companion_orders
              SET status = 'paid', paid_at = $3, provider_tx_id = $4,
                  provider_ref = COALESCE($5, provider_ref),
                  amount_received_minor = $6, received_note = $7, support_until = $8
            WHERE id = $1 AND status = ANY($2::text[])
        RETURNING *`,
          [
            orderId, allowedFrom, patch.paidAt, patch.providerTxId, patch.providerRef ?? null,
            patch.amountReceivedMinor, patch.receivedNote, patch.supportUntil,
          ],
        );
      } catch (e) {
        // companion_orders_provider_tx_uidx: this payment already belongs to another order.
        if (isUniqueViolation(e)) return { kind: "tx_conflict" };
        throw e;
      }
      if (rows[0]) return { kind: "won", order: mapOrder(rows[0]) };
      const cur = await sql.query("SELECT status FROM companion_orders WHERE id = $1", [orderId]);
      if (!cur[0]) return { kind: "not_found" };
      return { kind: "not_claimable", status: String(cur[0].status) as OrderStatus };
    },

    async setOrderStatus(orderId, status) {
      const rows = await sql.query("UPDATE companion_orders SET status = $2 WHERE id = $1 RETURNING id", [orderId, status]);
      if (!rows[0]) throw new Error("order not found");
    },

    async insertToken(t) {
      const rows = await sql.query(
        `INSERT INTO companion_download_tokens (order_id, token_hash, expires_at, max_downloads, created_at, created_by, kind)
         VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
        [t.orderId, t.tokenHash, t.expiresAt, t.maxDownloads, t.createdAt, t.createdBy, t.kind ?? "email"],
      );
      if (!rows[0]) throw new Error("token insert returned no row");
      return mapToken(rows[0]);
    },

    async getTokenByHash(hash) {
      const rows = await sql.query("SELECT * FROM companion_download_tokens WHERE token_hash = $1", [hash]);
      return rows[0] ? mapToken(rows[0]) : null;
    },

    async consumeDownload(tokenId, now) {
      // ONE conditional UPDATE: the count only moves while the link is still usable.
      const rows = await sql.query(
        `UPDATE companion_download_tokens
            SET download_count = download_count + 1
          WHERE id = $1 AND download_count < max_downloads AND revoked_at IS NULL AND expires_at > $2
      RETURNING *`,
        [tokenId, now],
      );
      return rows[0] ? mapToken(rows[0]) : null;
    },

    async revokeTokensForOrder(orderId, now, kind) {
      const rows = kind
        ? await sql.query(
            "UPDATE companion_download_tokens SET revoked_at = $2 WHERE order_id = $1 AND revoked_at IS NULL AND kind = $3 RETURNING id",
            [orderId, now, kind],
          )
        : await sql.query(
            "UPDATE companion_download_tokens SET revoked_at = $2 WHERE order_id = $1 AND revoked_at IS NULL RETURNING id",
            [orderId, now],
          );
      return rows.length;
    },

    async resetDownloadCount(tokenId) {
      await sql.query("UPDATE companion_download_tokens SET download_count = 0 WHERE id = $1", [tokenId]);
    },

    async addEvent(orderId: string, actor: OrderEventActor, kind: string, detail: string, at: Date) {
      await sql.query(
        "INSERT INTO companion_order_events (order_id, at, actor, kind, detail) VALUES ($1,$2,$3,$4,$5)",
        [orderId, at, actor, kind, detail],
      );
    },

    async countEvents(orderId, kind, since) {
      const rows = await sql.query(
        "SELECT count(*)::int AS n FROM companion_order_events WHERE order_id = $1 AND kind = $2 AND at >= $3",
        [orderId, kind, since],
      );
      return Number(rows[0]?.n ?? 0);
    },

    // ---- DeliveryStore extras (coder D's runtime.ts depends on these) ----

    async getEmailState(orderId): Promise<EmailState> {
      const rows = await sql.query(
        "SELECT email_sent_at, email_attempts, last_email_error FROM companion_orders WHERE id = $1",
        [orderId],
      );
      const r = rows[0];
      if (!r) throw new Error("order not found");
      return { sentAt: dateOrNull(r.email_sent_at), attempts: num(r.email_attempts), lastError: strOrNull(r.last_email_error) };
    },

    async recordEmailResult(orderId, r) {
      const rows = r.ok
        ? await sql.query(
            `UPDATE companion_orders
                SET email_sent_at = $2, last_email_error = NULL, email_attempts = email_attempts + 1
              WHERE id = $1 RETURNING id`,
            [orderId, r.at],
          )
        : await sql.query(
            `UPDATE companion_orders
                SET last_email_error = $2, email_attempts = email_attempts + 1
              WHERE id = $1 RETURNING id`,
            [orderId, (r.error ?? "unknown").slice(0, 500)],
          );
      if (!rows[0]) throw new Error("order not found");
    },

    async insertDownloadLog(tokenId, at, ipHash, ua) {
      await sql.query("INSERT INTO companion_download_log (token_id, at, ip_hash, ua) VALUES ($1,$2,$3,$4)", [
        tokenId, at, ipHash, ua ? ua.slice(0, 200) : null,
      ]);
    },

    async listOrders(filter: OrderListFilter): Promise<OrderListRow[]> {
      const limit = Math.min(Math.max(Math.trunc(filter.limit ?? 200), 1), 1000);
      const rows = await sql.query(
        `SELECT o.*,
                COALESCE((SELECT sum(t.download_count) FROM companion_download_tokens t WHERE t.order_id = o.id), 0)::int AS downloads,
                EXISTS (SELECT 1 FROM companion_order_events e WHERE e.order_id = o.id AND e.kind = 'duplicate_payment') AS duplicate_payment
           FROM companion_orders o
          WHERE ($1::text IS NULL OR o.status = $1) AND ($2::text IS NULL OR o.src = $2)
          ORDER BY o.created_at DESC
          LIMIT $3`,
        [filter.status ?? null, filter.src ?? null, limit],
      );
      return rows.map((r) => ({
        order: mapOrder(r),
        downloadCount: num(r.downloads),
        duplicatePayment: r.duplicate_payment === true,
        email: { sentAt: dateOrNull(r.email_sent_at), attempts: num(r.email_attempts), lastError: strOrNull(r.last_email_error) },
      }));
    },

    async listEvents(orderId): Promise<OrderEventRow[]> {
      const rows = await sql.query(
        "SELECT at, actor, kind, detail FROM companion_order_events WHERE order_id = $1 ORDER BY at, id",
        [orderId],
      );
      return rows.map((r) => ({ at: date(r.at), actor: String(r.actor), kind: String(r.kind), detail: String(r.detail) }));
    },
  };
}

// ---- adapter-only helpers (not part of the CompanionStore interface) ----

/** Owner-supplied bank details text, only returned when allow_manual_transfer is on. */
export async function getBankDetails(sql: SqlClient, slug: string): Promise<string | null> {
  const rows = await sql.query(
    "SELECT bank_details FROM companion_products WHERE slug = $1 AND allow_manual_transfer = true",
    [slug],
  );
  const v = rows[0]?.bank_details;
  return typeof v === "string" && v.trim() ? v : null;
}

/** DB-backed limit: orders created for this email since `since`. */
export async function countOrdersByEmailSince(sql: SqlClient, email: string, since: Date): Promise<number> {
  const rows = await sql.query(
    "SELECT count(*)::int AS n FROM companion_orders WHERE email = $1 AND created_at >= $2",
    [email, since],
  );
  return Number(rows[0]?.n ?? 0);
}

let _sql: SqlClient | null = null;
/** Lazy shared Neon client. DATABASE_URL is read with .trim(). */
export function getCompanionSql(): SqlClient {
  if (!_sql) {
    const url = env("DATABASE_URL");
    if (!url) throw new Error("DATABASE_URL is not set (Neon)");
    _sql = neon(url) as unknown as SqlClient;
  }
  return _sql;
}

let _store: DeliveryStore | null = null;
export function getCompanionStore(): DeliveryStore {
  if (!_store) _store = createNeonCompanionStore(getCompanionSql());
  return _store;
}

/** The name coder D's runtime.ts imports. Same shared instance. */
export function createNeonStore(): DeliveryStore {
  return getCompanionStore();
}
