/**
 * The buyer's claim cookie. createOrder returns a random `claimToken`; only its
 * sha256 is stored on the order (`order.claimHash`). Whoever holds the cookie
 * is the buyer. Coder B (checkout) sets it; order-status reads it.
 */
import { safeEqual } from "./hmac";
import { hashToken } from "./tokens";
import type { Order } from "./types";

export const CLAIM_COOKIE_NAME = "tec_claim";
/** Short-lived cookie that holds the thanks-page download token (never stored server side). */
export const THANKS_COOKIE_NAME = "tec_dl";

export function claimCookieOptions(production: boolean) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: production,
    path: "/",
    maxAge: 60 * 60 * 24 * 14,
  };
}

export function claimMatches(order: Pick<Order, "claimHash">, cookieValue: unknown): boolean {
  if (typeof cookieValue !== "string" || cookieValue.length < 20 || cookieValue.length > 200) return false;
  return safeEqual(hashToken(cookieValue), order.claimHash);
}
