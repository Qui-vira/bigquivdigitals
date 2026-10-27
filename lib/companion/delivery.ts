/**
 * Delivery: mint the link, send the email, record events. Safe to call twice.
 *
 * deliverOrder(orderId) is what coder B calls after markOrderPaid returns "won".
 * The order stays paid whatever happens to the email. A failed email sets the
 * failure flag (email_sent_at stays null, last_email_error is set) and alerts the
 * owner; the thanks page link still works (see issueThanksLink).
 */
import { issueDownloadLink, mintToken, resendLink } from "./tokens";
import { getRuntime, type Runtime } from "./runtime";
import { supportUntil as computeSupportUntil } from "./orders";
import { renderDelivery, renderOwnerEmailFailed, renderOwnerNewOrder } from "./emails/templates";
import type { Order } from "./types";

export type DeliverResult = { ok: boolean; reason?: string };

/** Plan 10.3: up to 3 attempts, backoff 1 s then 5 s. */
export const EMAIL_BACKOFF_MS = [1000, 5000];
const realSleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

const THANKS_TTL_HOURS = 24;
/** Total downloads the thanks page may ever give one order (across all its thanks links). */
export const THANKS_TOTAL_MAX_DOWNLOADS = 2;
/** At most this many thanks links minted per order in a rolling 24 hours. */
export const THANKS_MAX_MINTS_PER_DAY = 3;

export function downloadUrlFor(baseUrl: string, token: string): string {
  return `${baseUrl.replace(/\/$/, "")}/companion/download/${token}`;
}

/** Exact signature coder B depends on. */
export async function deliverOrder(orderId: string): Promise<DeliverResult> {
  return deliverOrderWith(await getRuntime(), orderId);
}

async function sendDelivery(rt: Runtime, order: Order, token: string, expiresAt: Date, maxDownloads: number, resend: boolean) {
  const rendered = renderDelivery({
    order,
    downloadUrl: downloadUrlFor(rt.baseUrl, token),
    linkExpiresAt: expiresAt,
    maxDownloads,
    supportUntil: order.supportUntil ?? computeSupportUntil(order.paidAt ?? rt.now()),
    resend,
  });
  return rt.sender.send({ to: order.email, ...rendered });
}

/**
 * Up to 3 attempts. Before every retry of a first delivery we re-read the
 * email state, so a concurrent attempt that already succeeded is never repeated.
 * An attempt is never aborted by a timeout (an abort could hide a late success
 * and cause a duplicate); we only wait for its answer.
 */
async function sendWithRetry(
  rt: Runtime,
  order: Order,
  link: { token: string; expiresAt: Date; maxDownloads: number },
  resend: boolean,
) {
  const sleep = rt.sleep ?? realSleep;
  let last: Awaited<ReturnType<typeof sendDelivery>> = { ok: false, error: "not attempted" };
  for (let attempt = 0; attempt <= EMAIL_BACKOFF_MS.length; attempt++) {
    if (attempt > 0) {
      await sleep(EMAIL_BACKOFF_MS[attempt - 1]);
      if (!resend && (await rt.store.getEmailState(order.id)).sentAt) return { ok: true } as const;
    }
    last = await sendDelivery(rt, order, link.token, link.expiresAt, link.maxDownloads, resend);
    if (last.ok) return last;
    await rt.store.addEvent(order.id, "system", "email_attempt_failed", `attempt=${attempt + 1} ${last.error}`.slice(0, 200), rt.now());
  }
  return last;
}

async function recordOutcome(rt: Runtime, order: Order, r: { ok: true } | { ok: false; error: string }, resend: boolean) {
  const at = rt.now();
  if (r.ok) {
    await rt.store.recordEmailResult(order.id, { ok: true, at });
    await rt.store.addEvent(order.id, "system", resend ? "resend_email_sent" : "email_sent", "delivery email sent", at);
    return;
  }
  await rt.store.recordEmailResult(order.id, { ok: false, error: r.error, at });
  await rt.store.addEvent(order.id, "system", "email_failed", r.error.slice(0, 200), at);
  const m = renderOwnerEmailFailed(order, r.error);
  await rt.notifier.alertOwner(m.subject, m.text);
}

export async function deliverOrderWith(rt: Runtime, orderId: string): Promise<DeliverResult> {
  const order = await rt.store.getOrderById(orderId);
  if (!order) return { ok: false, reason: "not_found" };
  if (order.status !== "paid") return { ok: false, reason: "not_paid" };
  const product = await rt.store.getProduct(order.productSlug);
  if (!product) return { ok: false, reason: "product_not_found" };

  const state = await rt.store.getEmailState(order.id);
  if (state.sentAt) return { ok: true, reason: "already_delivered" };

  // Owner alert once per order, even when the buyer email fails.
  const alerted = await rt.store.countEvents(order.id, "owner_alerted", new Date(0));
  if (alerted === 0) {
    await rt.store.addEvent(order.id, "system", "owner_alerted", "new order alert", rt.now());
    const m = renderOwnerNewOrder(order);
    await rt.notifier.alertOwner(m.subject, m.text);
  }

  const link = await issueDownloadLink(rt.store, {
    orderId: order.id,
    ttlHours: product.linkTtlHours,
    maxDownloads: product.maxDownloads,
    createdBy: "system",
    now: rt.now(),
  });
  const sent = await sendWithRetry(rt, order, { token: link.token, expiresAt: link.row.expiresAt, maxDownloads: link.row.maxDownloads }, false);
  await recordOutcome(rt, order, sent, false);
  return sent.ok ? { ok: true } : { ok: false, reason: "email_failed" };
}

/**
 * Explicit resend: revokes every old link, mints a new one, emails it.
 * Buyer calls are rate limited by the wave 1 helper, admin calls are not.
 */
export async function resendDeliveryWith(
  rt: Runtime,
  orderId: string,
  by: "buyer" | "admin",
  opts: { revokeAll?: boolean } = {},
): Promise<DeliverResult> {
  const order = await rt.store.getOrderById(orderId);
  if (!order) return { ok: false, reason: "not_found" };
  if (order.status !== "paid") return { ok: false, reason: "not_paid" };
  const product = await rt.store.getProduct(order.productSlug);
  if (!product) return { ok: false, reason: "product_not_found" };
  const res = await resendLink(rt.store, {
    orderId: order.id,
    ttlHours: product.linkTtlHours,
    maxDownloads: product.maxDownloads,
    by,
    now: rt.now(),
    revokeAll: opts.revokeAll,
  });
  if (!res.ok) return { ok: false, reason: res.reason };
  const sent = await sendWithRetry(rt, order, { token: res.link.token, expiresAt: res.link.row.expiresAt, maxDownloads: res.link.row.maxDownloads }, true);
  await recordOutcome(rt, order, sent, true);
  return sent.ok ? { ok: true } : { ok: false, reason: "email_failed" };
}

export async function resendDelivery(orderId: string, by: "buyer" | "admin"): Promise<DeliverResult> {
  return resendDeliveryWith(await getRuntime(), orderId, by);
}

/**
 * A separate link for the thanks page (token kind "thanks"), so the buyer can
 * download even if the email never arrives. It is independent of the emailed
 * link: issuing or resending the email link never revokes it, and minting it
 * never revokes the email link. Bounded: at most THANKS_MAX_MINTS_PER_DAY mints
 * per order per 24 h, one live thanks link at a time, and the thanks page can
 * give at most THANKS_TOTAL_MAX_DOWNLOADS downloads per order in total.
 * Returns null when the bound is hit (the page then relies on the email).
 */
export async function issueThanksLink(rt: Runtime, order: Order): Promise<{ token: string; expiresAt: Date } | null> {
  const now = rt.now();
  const dayAgo = new Date(now.getTime() - 24 * 3600 * 1000);
  if ((await rt.store.countEvents(order.id, "thanks_link", dayAgo)) >= THANKS_MAX_MINTS_PER_DAY) return null;
  const used = await rt.store.countEvents(order.id, "thanks_download", new Date(0));
  const remaining = THANKS_TOTAL_MAX_DOWNLOADS - used;
  if (remaining <= 0) return null;
  await rt.store.revokeTokensForOrder(order.id, now, "thanks");
  const { token, hash } = mintToken();
  const expiresAt = new Date(now.getTime() + THANKS_TTL_HOURS * 3600 * 1000);
  await rt.store.insertToken({
    orderId: order.id,
    tokenHash: hash,
    expiresAt,
    maxDownloads: remaining,
    createdAt: now,
    createdBy: "system",
    kind: "thanks",
  });
  await rt.store.addEvent(order.id, "buyer", "thanks_link", `ttl_hours=${THANKS_TTL_HOURS} max=${remaining}`, now);
  return { token, expiresAt };
}
