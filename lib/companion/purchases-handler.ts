/**
 * "My purchases": request a sign-in link, list a buyer's orders, and get a fresh
 * download link for one paid order. Kept free of `next` imports so it can be
 * tested with plain Request objects and a fake runtime. The route files are thin.
 *
 * Rules:
 *  - The request answer never says whether an email has orders. The lookup and
 *    the email run AFTER the answer (the route passes `background` to next/after),
 *    so the timing does not tell either.
 *  - Only paid and refunded orders are shown. Only paid orders can download.
 *  - A download needs the signed token AND an order whose email is the token's
 *    email. It goes through the existing resendLink, so MAX_RESENDS_PER_DAY holds.
 *  - No email address, token or secret is ever logged.
 */
import { createHash } from "node:crypto";
import { MAX_RESENDS_PER_DAY, resendLink } from "./tokens";
import { renderPurchasesLink } from "./emails/templates";
import { normaliseEmail, PURCHASES_LINK_TTL_MS, PURCHASES_VIEW_PATH, purchasesViewUrl, signPurchasesToken, verifyPurchasesToken } from "./purchases-link";
import type { Runtime } from "./runtime";
import type { OrderStatus } from "./types";
import { getClientIp, rateLimit } from "../rate-limit";

export const NO_STORE = "no-store, max-age=0";
export const PURCHASES_NEUTRAL = "If that email has a purchase, a sign-in link is on its way. Check spam too.";
export const PURCHASES_BAD_EMAIL = "Enter a valid email address.";
export const PURCHASES_TOO_MANY = "Too many requests. Please wait a few minutes and try again.";
export const PURCHASES_SERVER_ERROR = "Something went wrong on our side. Please try again later, or contact us.";
export const VISIBLE_STATUSES: OrderStatus[] = ["paid", "refunded"];
const MAX_ORDERS_SHOWN = 50;
const REF_RE = /^TEC-[A-Za-z0-9_-]{1,64}$/;

/** Per IP: 10 link requests per 10 minutes. Per email: 3 per hour (silently ignored above that). */
export const REQUEST_LIMIT_IP = { max: 10, windowMs: 10 * 60 * 1000 };
export const REQUEST_LIMIT_EMAIL = { max: 3, windowMs: 60 * 60 * 1000 };
export const DOWNLOAD_LIMIT_IP = { max: 20, windowMs: 10 * 60 * 1000 };

/** Messages the view page shows after a download attempt that did not go through. Fixed keys only. */
export const PURCHASES_NOTICES = {
  unavailable: "That order is not available here. Contact us and we will help.",
  limit: `You have reached the limit of ${MAX_RESENDS_PER_DAY} new download links for this order today. Try again tomorrow, or contact us.`,
} as const;
export type PurchasesNotice = keyof typeof PURCHASES_NOTICES;

export type RequestOutcome = {
  status: number;
  body: { ok: boolean; message: string };
  retryAfter?: number;
  /** Run after the answer is sent. Never throws. */
  background?: () => Promise<void>;
};

const emailKey = (email: string) => createHash("sha256").update(email).digest("hex");

/** Looks up the orders and, only when there is a paid or refunded one, emails the link. Never throws. */
export async function sendPurchasesLinkIfAny(rt: Runtime, email: string, secret: string): Promise<void> {
  try {
    const orders = await rt.store.listOrdersByEmail(email, VISIBLE_STATUSES, 1);
    if (orders.length === 0) return;
    const token = signPurchasesToken(email, rt.now(), secret);
    const m = renderPurchasesLink(purchasesViewUrl(rt.baseUrl, token), PURCHASES_LINK_TTL_MS / 60_000);
    const r = await rt.sender.send({ to: email, ...m });
    if (!r.ok) console.error("[companion] purchases link email failed");
  } catch (err) {
    console.error("[companion] purchases link failed:", err instanceof Error ? err.name : "unknown");
  }
}

/** POST /api/companion/purchases/request with JSON { email }. */
export async function handlePurchasesRequest(
  rt: Runtime,
  input: { body: unknown; ip: string; secret: string | null },
): Promise<RequestOutcome> {
  const rl = rateLimit(`tec-purchases-ip:${input.ip}`, REQUEST_LIMIT_IP.max, REQUEST_LIMIT_IP.windowMs);
  if (!rl.allowed) return { status: 429, body: { ok: false, message: PURCHASES_TOO_MANY }, retryAfter: rl.retryAfter ?? 60 };

  const raw = input.body && typeof input.body === "object" && !Array.isArray(input.body) ? (input.body as { email?: unknown }).email : null;
  const email = normaliseEmail(raw);
  if (!email) return { status: 400, body: { ok: false, message: PURCHASES_BAD_EMAIL } };

  // Fail closed. The same answer for every email, so it reveals nothing about orders.
  const secret = input.secret;
  if (!secret) {
    console.error("[companion] purchases: link secret is not set");
    return { status: 503, body: { ok: false, message: PURCHASES_SERVER_ERROR } };
  }

  const neutral: RequestOutcome = { status: 200, body: { ok: true, message: PURCHASES_NEUTRAL } };
  // Per email limit: answer the same, just do not send again.
  const perEmail = rateLimit(`tec-purchases-email:${emailKey(email)}`, REQUEST_LIMIT_EMAIL.max, REQUEST_LIMIT_EMAIL.windowMs);
  if (!perEmail.allowed) return neutral;
  return { ...neutral, background: () => sendPurchasesLinkIfAny(rt, email, secret) };
}

export type PurchaseRow = {
  orderRef: string;
  productName: string;
  purchasedAt: Date;
  amountMinor: number;
  status: "paid" | "refunded";
  buyerName: string;
  buyerEmail: string;
};

export type PurchasesView = { ok: true; email: string; expiresAt: Date; orders: PurchaseRow[] } | { ok: false };

/** The view page's data: only this token's email, only paid and refunded orders. */
export async function loadPurchases(rt: Runtime, token: unknown, secret: string | null): Promise<PurchasesView> {
  const session = verifyPurchasesToken(token, rt.now(), secret);
  if (!session) return { ok: false };
  const orders = await rt.store.listOrdersByEmail(session.email, VISIBLE_STATUSES, MAX_ORDERS_SHOWN);
  const names = new Map<string, string>();
  const rows: PurchaseRow[] = [];
  for (const o of orders) {
    // Belt and braces: the store already filtered on these.
    if (o.email !== session.email || (o.status !== "paid" && o.status !== "refunded")) continue;
    if (!names.has(o.productSlug)) names.set(o.productSlug, (await rt.store.getProduct(o.productSlug))?.name ?? o.productSlug);
    rows.push({
      orderRef: o.orderRef,
      productName: names.get(o.productSlug)!,
      purchasedAt: o.paidAt ?? o.createdAt,
      amountMinor: o.amountReceivedMinor ?? o.expectedMinor,
      status: o.status,
      buyerName: o.name,
      buyerEmail: o.email,
    });
  }
  return { ok: true, email: session.email, expiresAt: session.expiresAt, orders: rows };
}

function redirect(location: string): Response {
  return new Response(null, {
    status: 303,
    headers: { location, "cache-control": NO_STORE, "referrer-policy": "no-referrer" },
  });
}

function viewWith(token: string, notice: PurchasesNotice): string {
  return `${PURCHASES_VIEW_PATH}?t=${encodeURIComponent(token)}&m=${notice}`;
}

async function readForm(req: Request): Promise<{ t: string | null; ref: string | null }> {
  try {
    const f = await req.formData();
    const t = f.get("t");
    const ref = f.get("ref");
    return { t: typeof t === "string" ? t : null, ref: typeof ref === "string" ? ref : null };
  } catch {
    return { t: null, ref: null };
  }
}

/**
 * POST /api/companion/purchases/download, form fields t (signed token) and ref (TEC-...).
 * Success: 303 to /companion/download/<new token>. The new link replaces the older emailed one.
 */
export async function handlePurchasesDownload(rt: Runtime, req: Request, secret: string | null): Promise<Response> {
  const ip = getClientIp(req.headers);
  const rl = rateLimit(`tec-purchases-dl:${ip}`, DOWNLOAD_LIMIT_IP.max, DOWNLOAD_LIMIT_IP.windowMs);
  if (!rl.allowed) {
    return new Response(PURCHASES_TOO_MANY, {
      status: 429,
      headers: { "retry-after": String(rl.retryAfter ?? 60), "cache-control": NO_STORE },
    });
  }
  const { t, ref } = await readForm(req);
  const now = rt.now();
  const session = verifyPurchasesToken(t, now, secret);
  if (!session || !t) return redirect(PURCHASES_VIEW_PATH);

  // Unknown ref, another buyer's order and an unpaid order all look the same.
  const order = ref && REF_RE.test(ref) ? await rt.store.getOrderByRef(ref) : null;
  if (!order || order.email !== session.email || order.status !== "paid") return redirect(viewWith(t, "unavailable"));
  const product = await rt.store.getProduct(order.productSlug);
  if (!product) return redirect(viewWith(t, "unavailable"));

  const res = await resendLink(rt.store, {
    orderId: order.id,
    ttlHours: product.linkTtlHours,
    maxDownloads: product.maxDownloads,
    by: "buyer",
    now,
  });
  if (!res.ok) return redirect(viewWith(t, "limit"));
  return redirect(`/companion/download/${res.link.token}`);
}
