/**
 * Request logic for the download and order-status routes, kept free of `next`
 * imports so it can be tested with plain Request objects and a fake runtime.
 * The route files are thin wrappers.
 */
import { consumeDownload, inspectToken } from "./tokens";
import { hashIp } from "./consent";
import { claimMatches, CLAIM_COOKIE_NAME, THANKS_COOKIE_NAME } from "./claim";
import { DOWNLOAD_FILENAME, fileKey } from "./file-store";
import { downloadUrlFor, issueThanksLink } from "./delivery";
import { CONTACTS } from "./emails/templates";
import type { Runtime } from "./runtime";
import type { OrderStatus } from "./types";
import { getClientIp, rateLimit } from "../rate-limit";

const NO_STORE = "no-store, max-age=0";

/** ONE page for expired, revoked, over-limit, unknown and malformed links. */
export function unavailableHtml(): string {
  const lines = Object.values(CONTACTS)
    .map((c) => `<li>${c.label}: ${c.value}</li>`)
    .join("");
  return (
    `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="robots" content="noindex">` +
    `<title>Link not available</title></head><body style="font-family:Arial,sans-serif;max-width:560px;margin:48px auto;padding:0 16px;line-height:1.6">` +
    `<h1>This link is not available</h1>` +
    `<p>It may have expired or already been used. Contact us and we will send a new one.</p><ul>${lines}</ul></body></html>`
  );
}

function unavailable(status = 410): Response {
  return new Response(unavailableHtml(), {
    status,
    headers: { "content-type": "text/html; charset=utf-8", "cache-control": NO_STORE, "referrer-policy": "no-referrer" },
  });
}

async function readToken(req: Request): Promise<string | null> {
  const ct = req.headers.get("content-type") ?? "";
  try {
    if (ct.includes("application/json")) {
      const j = (await req.json()) as { token?: unknown };
      return typeof j.token === "string" ? j.token : null;
    }
    const f = await req.formData();
    const t = f.get("token");
    return typeof t === "string" ? t : null;
  } catch {
    return null;
  }
}

export async function handleDownload(rt: Runtime, req: Request): Promise<Response> {
  const ip = getClientIp(req.headers);
  const rl = rateLimit(`companion-dl:${ip}`, 20, 10 * 60 * 1000);
  if (!rl.allowed) {
    return new Response("Too many requests. Try again later.", {
      status: 429,
      headers: { "retry-after": String(rl.retryAfter ?? 60), "cache-control": NO_STORE },
    });
  }
  if (req.headers.has("range")) {
    return new Response("Range requests are not supported.", { status: 416, headers: { "cache-control": NO_STORE, "accept-ranges": "none" } });
  }
  const token = await readToken(req);
  const now = rt.now();
  const seen = await inspectToken(rt.store, token, now);
  if (seen.state !== "valid") return unavailable();

  // Check the file exists BEFORE burning a download.
  const key = fileKey();
  let file = null;
  try {
    file = await rt.files.getStream(key);
  } catch (err) {
    // Not configured or the store is down. Generic 503, nothing consumed.
    console.error("[companion] file store error:", err instanceof Error ? err.message : "unknown");
  }
  if (!file) {
    return new Response("The file is temporarily unavailable. Contact support.", { status: 503, headers: { "cache-control": NO_STORE } });
  }
  const used = await consumeDownload(rt.store, token, now);
  if (!used.ok) {
    await file.stream.cancel().catch(() => undefined);
    return unavailable();
  }
  const ua = (req.headers.get("user-agent") ?? "").slice(0, 200) || null;
  try {
    await rt.store.insertDownloadLog(used.row.id, now, hashIp(ip === "unknown" ? null : ip, rt.ipSalt), ua);
    await rt.store.addEvent(used.row.orderId, "buyer", used.row.kind === "thanks" ? "thanks_download" : "download", `left=${used.downloadsLeft}`, now);
  } catch (err) {
    // The count is already spent; still serve the file rather than lose it.
    console.error("[companion] download log failed:", err instanceof Error ? err.message : "unknown");
  }

  return new Response(file.stream, {
    status: 200,
    headers: {
      "content-type": "application/zip",
      "content-disposition": `attachment; filename="${DOWNLOAD_FILENAME}"`,
      "content-length": String(file.head.size),
      "cache-control": NO_STORE,
      "accept-ranges": "none",
      "x-content-type-options": "nosniff",
      "referrer-policy": "no-referrer",
    },
  });
}

export type CookieJar = { get(name: string): string | undefined };
export type StatusOutcome = {
  status: number;
  body: { status: "pending" | "paid" | "failed"; downloadUrl?: string; emailSent: boolean } | { error: "not_found" };
  setCookie?: { name: string; value: string; maxAgeSeconds: number };
};

function publicStatus(s: OrderStatus): "pending" | "paid" | "failed" {
  if (s === "paid") return "paid";
  if (s === "created" || s === "awaiting_payment" || s === "awaiting_transfer") return "pending";
  return "failed";
}

/** GET /api/companion/order-status?ref=TEC-... with the claim cookie. */
export async function handleOrderStatus(rt: Runtime, req: Request, cookies: CookieJar): Promise<StatusOutcome> {
  const notFound: StatusOutcome = { status: 404, body: { error: "not_found" } };
  const ip = getClientIp(req.headers);
  if (!rateLimit(`companion-status:${ip}`, 120, 10 * 60 * 1000).allowed) return { status: 429, body: { error: "not_found" } };
  const ref = new URL(req.url).searchParams.get("ref");
  if (!ref || ref.length > 64) return notFound;
  const order = await rt.store.getOrderByRef(ref);
  // Unknown ref and wrong cookie look identical.
  if (!order || !claimMatches(order, cookies.get(CLAIM_COOKIE_NAME))) return notFound;

  const status = publicStatus(order.status);
  if (status !== "paid") return { status: 200, body: { status, emailSent: false } };
  // True only when the delivery email was actually sent.
  const emailSent = (await rt.store.getEmailState(order.id)).sentAt !== null;

  const existing = cookies.get(THANKS_COOKIE_NAME);
  if (existing) {
    const seen = await inspectToken(rt.store, existing, rt.now());
    if (seen.state === "valid" && seen.row.orderId === order.id) {
      return { status: 200, body: { status, emailSent, downloadUrl: downloadUrlFor(rt.baseUrl, existing) } };
    }
  }
  const link = await issueThanksLink(rt, order);
  // Bound hit: no thanks link. The buyer relies on the email (emailSent says whether it went).
  if (!link) return { status: 200, body: { status, emailSent } };
  return {
    status: 200,
    body: { status, emailSent, downloadUrl: downloadUrlFor(rt.baseUrl, link.token) },
    setCookie: { name: THANKS_COOKIE_NAME, value: link.token, maxAgeSeconds: 24 * 3600 },
  };
}
