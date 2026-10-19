/**
 * The "My purchases" sign-in link. No account table, no password: the buyer asks
 * for a link, we email a signed value that holds the normalised email and an
 * expiry. Whoever holds an unexpired, correctly signed token may see that
 * email's orders for 30 minutes.
 *
 * Format: base64url(JSON {e, x}) + "." + base64url(HMAC-SHA256(secret, "tec-purchases-v1." + payload)).
 * The secret is env var NAME `COMPANION_LINK_SECRET` (at least 32 characters).
 * It is used for nothing else. Missing or short secret = nothing signs and
 * nothing verifies (fail closed).
 */
import { createHmac } from "node:crypto";
import { env } from "./env";
import { safeEqual } from "./hmac";

export const PURCHASES_SECRET_ENV = "COMPANION_LINK_SECRET";
export const PURCHASES_LINK_TTL_MS = 30 * 60 * 1000;
export const PURCHASES_VIEW_PATH = "/my-purchases/view";
const MIN_SECRET_LENGTH = 32;
const MAX_TOKEN_LENGTH = 700;
const DOMAIN = "tec-purchases-v1";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Same normalisation as orders.ts: trimmed, lower case. Returns null when it is not an email. */
export function normaliseEmail(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const e = raw.trim().toLowerCase();
  return e.length <= 254 && EMAIL_RE.test(e) ? e : null;
}

/** The signing secret, or null when it is unset or too short. */
export function purchasesSecret(): string | null {
  const s = env(PURCHASES_SECRET_ENV);
  return s.length >= MIN_SECRET_LENGTH ? s : null;
}

function sign(secret: string, payload: string): string {
  return createHmac("sha256", secret).update(`${DOMAIN}.${payload}`).digest("base64url");
}

/** Throws when the secret is missing: callers check purchasesSecret() first. */
export function signPurchasesToken(email: string, now: Date, secret: string | null): string {
  if (!secret || secret.length < MIN_SECRET_LENGTH) throw new Error("purchases link secret not set");
  const e = normaliseEmail(email);
  if (!e) throw new Error("invalid email");
  const payload = Buffer.from(JSON.stringify({ e, x: now.getTime() + PURCHASES_LINK_TTL_MS })).toString("base64url");
  return `${payload}.${sign(secret, payload)}`;
}

export type PurchasesSession = { email: string; expiresAt: Date };

/** Constant-time signature check, then expiry. Any problem returns null, with no reason given. */
export function verifyPurchasesToken(token: unknown, now: Date, secret: string | null): PurchasesSession | null {
  if (!secret || secret.length < MIN_SECRET_LENGTH) return null;
  if (typeof token !== "string" || token.length < 10 || token.length > MAX_TOKEN_LENGTH) return null;
  const parts = token.split(".");
  if (parts.length !== 2 || !parts[0] || !parts[1]) return null;
  if (!safeEqual(parts[1], sign(secret, parts[0]))) return null;
  let data: unknown;
  try {
    data = JSON.parse(Buffer.from(parts[0], "base64url").toString("utf8"));
  } catch {
    return null;
  }
  if (!data || typeof data !== "object") return null;
  const { e, x } = data as { e?: unknown; x?: unknown };
  const email = normaliseEmail(e);
  if (!email || email !== e) return null;
  if (typeof x !== "number" || !Number.isFinite(x)) return null;
  const t = now.getTime();
  // Expired, or claims a life longer than we ever issue.
  if (x <= t || x > t + PURCHASES_LINK_TTL_MS + 60_000) return null;
  return { email, expiresAt: new Date(x) };
}

export function purchasesViewUrl(baseUrl: string, token: string): string {
  return `${baseUrl.replace(/\/$/, "")}${PURCHASES_VIEW_PATH}?t=${encodeURIComponent(token)}`;
}
