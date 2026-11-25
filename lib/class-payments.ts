/**
 * Confirming a /classes payment (a niche, the combo or coaching).
 *
 * Called by BOTH Flutterwave routes, after each has done its own
 * authentication (the webhook's verif-hash, the verify route's server-side
 * call to Flutterwave). Whichever arrives first records the seat; the second
 * finds the row and does nothing, so the buyer gets one email and the owner one
 * alert.
 *
 * 🛑 THE SERVER DECIDES THE PRICE. The amount came from the browser. The
 * minimum is worked out here from the seat count in course_purchases
 * (checkClassPayment in lib/course-prices.ts) and the row is never written
 * before it passes.
 *
 * Writes go to course_purchases, the table the AI class already uses. Its
 * unique key (email, course_slug) is per product, so one buyer can hold any
 * number of niches, the combo and coaching at once. A second payment by the same
 * buyer for the same product does NOT overwrite the first row (the AI class
 * upsert does); it is left alone and the owner is told, so no payment record is
 * ever lost.
 */
import { neon } from "@neondatabase/serverless";
import { CLASS_COHORT, checkClassPayment, EARLY_BIRD_SEATS, CLASS_PRODUCTS, type ClassProduct, type SeatState } from "./course-prices";
import { renderClassConfirmation, renderOwnerSale, naira } from "./class-emails";
import type { EmailSender } from "./companion/emails/sender";
import type { Notifier } from "./companion/emails/notify";

export type Row = Record<string, unknown>;
export interface SqlClient {
  query(text: string, params?: unknown[]): Promise<Row[]>;
}

export type ClassDeps = {
  sql: SqlClient;
  sender: EmailSender;
  notifier: Notifier;
  now: () => Date;
};

let override: ClassDeps | null = null;
/** Tests only. */
export function setClassDepsForTests(d: ClassDeps | null) {
  override = d;
}

let _sql: SqlClient | null = null;
function defaultSql(): SqlClient {
  if (!_sql) {
    const url = (process.env.DATABASE_URL ?? "").trim();
    if (!url) throw new Error("DATABASE_URL is not set (Neon)");
    _sql = neon(url) as unknown as SqlClient;
  }
  return _sql;
}

/** The database client alone (the sales page only reads seat counts). */
export function classSql(): SqlClient {
  return override ? override.sql : defaultSql();
}

export async function getClassDeps(): Promise<ClassDeps> {
  if (override) return override;
  const { createResendSender } = await import("./companion/emails/sender");
  const { createDefaultNotifier } = await import("./companion/emails/notify");
  return { sql: defaultSql(), sender: createResendSender(), notifier: createDefaultNotifier(), now: () => new Date() };
}

/**
 * Seats already confirmed for `slug` in the current cohort, leaving out this
 * buyer's own row (so the webhook arriving after verify does not count the
 * buyer against themselves), plus when the early-bird allowance filled.
 */
export async function seatState(sql: SqlClient, slug: string, buyerEmail: string, seats = EARLY_BIRD_SEATS): Promise<SeatState> {
  const rows = await sql.query(
    `WITH s AS (
       SELECT id, created_at FROM course_purchases
        WHERE course_slug = $1 AND status = 'confirmed' AND created_at >= $2::timestamptz AND email <> $3
     )
     SELECT (SELECT count(*)::int FROM s) AS n,
            (SELECT created_at FROM s ORDER BY created_at, id OFFSET $4 LIMIT 1) AS filled_at`,
    [slug, CLASS_COHORT.salesOpenFrom, buyerEmail, Math.max(seats - 1, 0)],
  );
  const r = rows[0] ?? {};
  const n = Number(r.n ?? 0);
  const filled = r.filled_at ? new Date(String(r.filled_at instanceof Date ? r.filled_at.toISOString() : r.filled_at)) : null;
  return { confirmed: Number.isFinite(n) ? n : 0, filledAt: filled && !Number.isNaN(filled.getTime()) ? filled : null };
}

/** Confirmed seats per niche and combo in the current cohort, for the sales page. Throws on a database error. */
export async function cohortSeatCounts(sql: SqlClient): Promise<Record<string, number>> {
  const slugs = CLASS_PRODUCTS.filter((p) => p.kind !== "coaching").map((p) => p.slug);
  const rows = await sql.query(
    `SELECT course_slug, count(*)::int AS n FROM course_purchases
      WHERE course_slug = ANY($1::text[]) AND status = 'confirmed' AND created_at >= $2::timestamptz
      GROUP BY course_slug`,
    [slugs, CLASS_COHORT.salesOpenFrom],
  );
  const out: Record<string, number> = Object.fromEntries(slugs.map((s) => [s, 0]));
  for (const r of rows) out[String(r.course_slug)] = Number(r.n ?? 0);
  return out;
}

export type ClassPaymentInput = {
  product: ClassProduct;
  txRef: string;
  amount: unknown;
  currency: string;
  email: string;
  name: string;
  /** When Flutterwave says the charge happened (data.created_at). Falls back to now. */
  chargedAt: unknown;
  /** Only the webhook raises owner alerts for problems, so verify + webhook never alert twice. */
  source: "webhook" | "verify";
};

export type ClassPaymentResult =
  | { ok: true; created: boolean }
  | { ok: false; reason: string };

function chargeTime(v: unknown, now: Date): Date {
  if (typeof v === "string" || v instanceof Date) {
    const d = new Date(v);
    if (!Number.isNaN(d.getTime())) return d;
  }
  return now;
}

export async function confirmClassPayment(deps: ClassDeps, i: ClassPaymentInput): Promise<ClassPaymentResult> {
  const email = i.email.toLowerCase().trim();
  if (!email) return { ok: false, reason: "no buyer email" };
  const now = deps.now();
  const paidAt = chargeTime(i.chargedAt, now);
  const currency = (i.currency || "NGN").toUpperCase();
  const { product } = i;

  const seats: SeatState = product.kind === "coaching" ? { confirmed: 0, filledAt: null } : await seatState(deps.sql, product.slug, email);
  const priced = checkClassPayment(product.slug, i.amount, currency, seats, paidAt);
  if (!priced.ok) {
    console.error(`[classes] payment rejected, tx ${i.txRef}: ${priced.reason}`);
    if (i.source === "webhook") {
      await deps.notifier.alertOwner(
        `Payment NOT confirmed: ${product.name}`,
        [
          `A payment came in but was not accepted, so no seat was given.`,
          `Reason: ${priced.reason}`,
          `Buyer: ${email}`,
          `Reference: ${i.txRef}`,
          "Action: contact the buyer and either take the balance or refund them.",
        ].join("\n"),
      );
    }
    return { ok: false, reason: priced.reason };
  }

  const amount = Number(i.amount);
  const first = i.name.trim().split(/\s+/)[0] || null;
  const inserted = await deps.sql.query(
    `INSERT INTO course_purchases (email, first_name, course_slug, amount, currency, payment_method, transaction_ref, status)
     VALUES ($1, $2, $3, $4, $5, 'flutterwave', $6, 'confirmed')
     ON CONFLICT (email, course_slug) DO NOTHING
     RETURNING id`,
    [email, first, product.slug, amount, currency, i.txRef],
  );

  if (inserted.length === 0) {
    // The row exists. Same reference: the other route got here first, nothing to do.
    const existing = await deps.sql.query(
      "SELECT transaction_ref, status FROM course_purchases WHERE email = $1 AND course_slug = $2",
      [email, product.slug],
    );
    const ref = existing[0]?.transaction_ref;
    if (ref !== i.txRef && i.source === "webhook") {
      await deps.notifier.alertOwner(
        `Second payment: ${product.name}`,
        [
          `${email} already holds ${product.name} (reference ${String(ref ?? "none")}, status ${String(existing[0]?.status ?? "unknown")}).`,
          `A second payment of ${currency === "NGN" ? naira(amount) : `${amount} ${currency}`} just came in, reference ${i.txRef}.`,
          "It was NOT written over the first one. Action: contact the buyer and refund it or move it to another product.",
        ].join("\n"),
      );
    }
    return { ok: true, created: false };
  }

  // The buyer joins the email list the same way the AI class buyers do.
  await deps.sql.query(
    "INSERT INTO prospects (email, first_name) VALUES ($1, $2) ON CONFLICT (email) DO NOTHING",
    [email, first || email.split("@")[0]],
  );

  const mail = renderClassConfirmation({ product, name: i.name, amount, currency, txRef: i.txRef });
  const sent = await deps.sender.send({ to: email, ...mail });
  if (sent.ok) {
    await deps.sql.query("UPDATE course_purchases SET email_sent = true WHERE email = $1 AND course_slug = $2", [email, product.slug]);
  } else {
    console.error(`[classes] confirmation email failed, tx ${i.txRef}`);
  }

  const alert = renderOwnerSale({
    product,
    email,
    amount,
    currency,
    txRef: i.txRef,
    tier: priced.tier,
    seatNumber: product.kind === "coaching" ? null : seats.confirmed + 1,
    emailSent: sent.ok,
  });
  await deps.notifier.alertOwner(alert.subject, alert.text);

  return { ok: true, created: true };
}

/** One course_purchases row as My purchases shows it. */
export type CourseSeatRow = {
  slug: string;
  amount: number;
  currency: string;
  txRef: string | null;
  createdAt: Date;
};

export interface CourseSeatReader {
  /** Confirmed course_purchases rows for this (normalised) email, newest first, at most `limit`. */
  listByEmail(email: string, limit: number): Promise<CourseSeatRow[]>;
}

/**
 * Read side for /my-purchases. Matches on lower(email) because rows written by
 * hand (payment_method "manual") were not always lowercased.
 */
export function createCourseSeatReader(sql: SqlClient): CourseSeatReader {
  return {
    async listByEmail(email, limit) {
      const n = Math.min(Math.max(Math.trunc(limit), 1), 200);
      const rows = await sql.query(
        `SELECT course_slug, amount, currency, transaction_ref, created_at FROM course_purchases
          WHERE lower(email) = $1 AND status = 'confirmed'
          ORDER BY created_at DESC LIMIT $2`,
        [email.toLowerCase().trim(), n],
      );
      return rows.map((r) => ({
        slug: String(r.course_slug),
        amount: Number(r.amount),
        currency: String(r.currency ?? "NGN"),
        txRef: r.transaction_ref === null || r.transaction_ref === undefined ? null : String(r.transaction_ref),
        createdAt: r.created_at instanceof Date ? r.created_at : new Date(String(r.created_at)),
      }));
    },
  };
}
