/**
 * Download tokens. 32 random bytes, base64url. ONLY the sha256 hash is stored.
 * The plaintext exists in the email and the browser only.
 */
import { createHash, randomBytes } from "node:crypto";
import type { CompanionStore } from "./store";
import type { DownloadToken } from "./types";

export const MAX_RESENDS_PER_DAY = 3;
const DAY_MS = 24 * 60 * 60 * 1000;

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function mintToken(): { token: string; hash: string } {
  const token = randomBytes(32).toString("base64url");
  return { token, hash: hashToken(token) };
}

export type IssuedLink = { token: string; row: DownloadToken };

/**
 * Create a fresh link for an order and REVOKE every older one first
 * (a re-send always kills the old link). Returns the plaintext token once.
 */
export async function issueDownloadLink(
  store: CompanionStore,
  opts: {
    orderId: string;
    ttlHours: number;
    maxDownloads: number;
    createdBy: "system" | "admin";
    now: Date;
    /** Admin "revoke all": also kills a live thanks-page link. Default: only older email links. */
    revokeAll?: boolean;
  },
): Promise<IssuedLink> {
  await store.revokeTokensForOrder(opts.orderId, opts.now, opts.revokeAll ? undefined : "email");
  const { token, hash } = mintToken();
  const row = await store.insertToken({
    orderId: opts.orderId,
    tokenHash: hash,
    expiresAt: new Date(opts.now.getTime() + opts.ttlHours * 3600 * 1000),
    maxDownloads: opts.maxDownloads,
    createdAt: opts.now,
    createdBy: opts.createdBy,
    kind: "email",
  });
  await store.addEvent(opts.orderId, opts.createdBy === "admin" ? "admin" : "system", "link_issued", `ttl_hours=${opts.ttlHours} max=${opts.maxDownloads}`, opts.now);
  return { token, row };
}

export type TokenState =
  | { state: "valid"; row: DownloadToken; downloadsLeft: number }
  | { state: "invalid" | "revoked" | "expired" | "exhausted" };

/**
 * Read-only check for the landing page. Does NOT consume anything, so email
 * scanners that prefetch the link cannot burn the count. The page must show one
 * generic message for every non-valid state.
 */
export async function inspectToken(store: CompanionStore, token: unknown, now: Date): Promise<TokenState> {
  if (typeof token !== "string" || token.length < 20 || token.length > 200) return { state: "invalid" };
  const row = await store.getTokenByHash(hashToken(token));
  if (!row) return { state: "invalid" };
  if (row.revokedAt) return { state: "revoked" };
  if (row.expiresAt.getTime() <= now.getTime()) return { state: "expired" };
  if (row.downloadCount >= row.maxDownloads) return { state: "exhausted" };
  return { state: "valid", row, downloadsLeft: row.maxDownloads - row.downloadCount };
}

export type ConsumeResult = { ok: true; row: DownloadToken; downloadsLeft: number } | { ok: false; reason: "invalid" | "revoked" | "expired" | "exhausted" };

/** Called by the POST download route. Counts exactly one download, atomically. */
export async function consumeDownload(store: CompanionStore, token: unknown, now: Date): Promise<ConsumeResult> {
  const seen = await inspectToken(store, token, now);
  if (seen.state !== "valid") return { ok: false, reason: seen.state };
  const updated = await store.consumeDownload(seen.row.id, now);
  if (!updated) {
    // Lost a race (another request used the last download, or it was revoked).
    return { ok: false, reason: "exhausted" };
  }
  return { ok: true, row: updated, downloadsLeft: updated.maxDownloads - updated.downloadCount };
}

export type ResendResult =
  | { ok: true; link: IssuedLink }
  | { ok: false; reason: "rate_limited" };

/**
 * Re-send: a buyer is limited to MAX_RESENDS_PER_DAY per order per rolling 24 h.
 * An admin is not limited. Revokes older links. Caller then sends the email.
 */
export async function resendLink(
  store: CompanionStore,
  opts: { orderId: string; ttlHours: number; maxDownloads: number; by: "buyer" | "admin"; now: Date; revokeAll?: boolean },
): Promise<ResendResult> {
  if (opts.by === "buyer") {
    const since = new Date(opts.now.getTime() - DAY_MS);
    const used = await store.countEvents(opts.orderId, "resend", since);
    if (used >= MAX_RESENDS_PER_DAY) return { ok: false, reason: "rate_limited" };
  }
  const link = await issueDownloadLink(store, {
    orderId: opts.orderId,
    ttlHours: opts.ttlHours,
    maxDownloads: opts.maxDownloads,
    createdBy: opts.by === "admin" ? "admin" : "system",
    now: opts.now,
    revokeAll: opts.by === "admin" && opts.revokeAll === true,
  });
  await store.addEvent(opts.orderId, opts.by === "admin" ? "admin" : "buyer", "resend", "new link issued, old links revoked", opts.now);
  return { ok: true, link };
}

/** Admin: revoke all links of an order. */
export async function revokeLinks(store: CompanionStore, orderId: string, now: Date): Promise<number> {
  const n = await store.revokeTokensForOrder(orderId, now);
  await store.addEvent(orderId, "admin", "links_revoked", `count=${n}`, now);
  return n;
}
