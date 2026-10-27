/**
 * Webhook signature helpers.
 *
 * FLUTTERWAVE: per https://developer.flutterwave.com/docs/webhooks (read 2026-10-15)
 * the webhook is NOT an HMAC. Flutterwave sends the secret hash you set in the
 * dashboard, as is, in the `verif-hash` header. You compare it to your stored
 * secret and discard the request if it is missing or different. The docs' own
 * Node example uses a length check plus crypto.timingSafeEqual and fails closed
 * when the secret is unset. Always re-query the verify API afterwards (see
 * confirm.ts). Use `verifyFlutterwaveHash`.
 *
 * BLOCKRADAR: the signature is a real HMAC (plan says SHA512, header
 * x-blockradar-signature). Wave 2 must confirm the algorithm and encoding in
 * the current Blockradar docs before use. `verifyHmac` is generic (any
 * algorithm node supports, hex digest).
 */
import { createHmac, timingSafeEqual } from "node:crypto";

/** Constant-time string compare that is safe for unequal lengths. */
export function safeEqual(a: unknown, b: unknown): boolean {
  if (typeof a !== "string" || typeof b !== "string") return false;
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}

/** Fails closed: an unset or empty secret never verifies. */
export function verifyFlutterwaveHash(headerValue: unknown, secretHash: string | undefined | null): boolean {
  const secret = (secretHash ?? "").trim();
  if (!secret) return false;
  if (typeof headerValue !== "string") return false;
  return safeEqual(headerValue.trim(), secret);
}

export function computeHmacHex(algorithm: string, secret: string, rawBody: string | Buffer): string {
  return createHmac(algorithm, secret).update(rawBody).digest("hex");
}

/**
 * Verify a hex HMAC over the RAW body. Fails closed on empty secret or missing
 * signature. Comparison is timing safe and length safe. Case-insensitive hex.
 */
export function verifyHmac(opts: {
  algorithm: string;
  secret: string | undefined | null;
  rawBody: string | Buffer;
  signature: unknown;
}): boolean {
  const secret = (opts.secret ?? "").trim();
  if (!secret || typeof opts.signature !== "string" || opts.signature.length === 0) return false;
  const expected = computeHmacHex(opts.algorithm, secret, opts.rawBody);
  return safeEqual(opts.signature.trim().toLowerCase(), expected);
}
