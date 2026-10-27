/**
 * POST /api/companion/checkout, as a pure function over PaymentsDeps.
 * The route (app/api/companion/checkout/route.ts) does rate limit, origin check
 * and cookie; everything decidable lives here so it is testable without a network.
 *
 * The client NEVER sends an amount. Price, tier and currency come from the
 * product row (createOrder) and are locked on the order.
 */
import { CLAIM_COOKIE_NAME } from "./claim";
import type { PaymentsDeps } from "./deps";
import { consentGiven } from "./consent";
import { createHostedPayment } from "./flutterwave";
import { isAtomicStore } from "./store-extra";
import { createOrder } from "./orders";
import type { PayMethod, Tier } from "./types";
import { SITE_URL } from "../site";
import { hostAllowed, isProductionEnv } from "./env";

export const PRODUCT_SLUG = "theeditcompanion";
/** Where Flutterwave sends the buyer back. This route verifies, then redirects to THANKS_PATH. */
export const RETURN_PATH = "/api/companion/return";
export const THANKS_PATH = "/theeditcompanion/thanks";
export const CLAIM_COOKIE = CLAIM_COOKIE_NAME;
export const MAX_ORDERS_PER_EMAIL_PER_HOUR = 5;
export const FLW_SESSION_MINUTES = 60;

export type CheckoutResult = {
  status: number;
  body: Record<string, unknown>;
  /** Set as the httpOnly claim cookie by the route. Only present on success. */
  claimToken?: string;
};

const fail = (status: number, code: string, error: string, extra: Record<string, unknown> = {}): CheckoutResult => ({
  status,
  body: { ok: false, code, error, ...extra },
});

/** Fixed salt used ONLY outside production when ORDER_IP_SALT is not set. */
export const DEV_TEST_SALT = "dev-only-test-salt";

/**
 * Host-exact (never a substring) check of Origin, falling back to Referer. Missing = refused.
 * Production allows the two site hosts only. Outside production the Vercel Preview
 * host (*.vercel.app) and localhost are allowed too, so checkout can be tested on a Preview.
 */
export function originAllowed(origin: string | null, referer: string | null, production: boolean = isProductionEnv()): boolean {
  const raw = origin || referer || "";
  try {
    return hostAllowed(new URL(raw).hostname, production);
  } catch {
    return false;
  }
}

function pickConsent(b: Record<string, unknown>) {
  if (b.consent && typeof b.consent === "object") return b.consent as { allSalesFinal?: unknown; immediateAccess?: unknown };
  // Flat form used by the checkout UI.
  return { allSalesFinal: b.consentFinal, immediateAccess: b.consentImmediate };
}

export async function handleCheckout(
  deps: PaymentsDeps,
  input: { body: unknown; ip: string | null; /** Base for the Flutterwave redirect_url. Route resolves it; default is SITE_URL. */ siteBase?: string },
): Promise<CheckoutResult> {
  const b = input.body;
  if (!b || typeof b !== "object" || Array.isArray(b)) return fail(400, "invalid", "Something went wrong. Please check the form and try again.");
  const body = b as Record<string, unknown>;

  // Honeypot: real people leave it empty.
  if (typeof body.hp === "string" && body.hp.length > 0) return fail(400, "invalid", "Something went wrong. Please try again.");

  const method: PayMethod = body.method === undefined ? "flutterwave" : (body.method as PayMethod);
  if (method !== "flutterwave" && method !== "bank_transfer") {
    // Crypto is not built for this product. The page offers "message us to pay by crypto".
    return fail(400, "method_not_allowed", "That payment method is not available. Message us and we will help you pay.");
  }

  // Never hash IPs with an empty salt (a bare IPv4 hash is brute-forceable in seconds).
  let ipSalt = deps.env.ipSalt;
  if (!ipSalt) {
    if (deps.env.production) {
      deps.log("FATAL: ORDER_IP_SALT is not set in production; refusing to create orders");
      return fail(500, "server_error", "Something went wrong on our side. You were not charged. Please message us.");
    }
    ipSalt = DEV_TEST_SALT;
  }

  const now = deps.now();
  const rawEmail = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (rawEmail && rawEmail.length <= 254) {
    if (isAtomicStore(deps.store)) {
      // Atomic "N attempts per email per hour": count and record in ONE step, so a burst cannot slip past.
      // Only well-formed submissions use up an attempt (a forgotten tick box must not lock the buyer out).
      const nameOk = typeof body.name === "string" && body.name.trim().length >= 1 && body.name.trim().length <= 100;
      if (nameOk && consentGiven(pickConsent(body)) && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rawEmail)) {
        const ok = await deps.store.reserveCheckoutAttempt(rawEmail, now, MAX_ORDERS_PER_EMAIL_PER_HOUR);
        if (!ok) return fail(429, "rate_limited", "Too many attempts for this email. Please wait a little and try again, or message us.");
      }
    } else {
      const recent = await deps.countOrdersByEmailSince(rawEmail, new Date(now.getTime() - 60 * 60 * 1000));
      if (recent >= MAX_ORDERS_PER_EMAIL_PER_HOUR) {
        return fail(429, "rate_limited", "Too many attempts for this email. Please wait a little and try again, or message us.");
      }
    }
  }

  if (method === "bank_transfer") {
    const details = await deps.getBankDetails(PRODUCT_SLUG);
    if (!details) return fail(400, "method_not_allowed", "Bank transfer is not available right now. Pay by card or bank on the next screen, or message us.");
  }

  const shownTier = body.shownTier === "founders" || body.shownTier === "regular" ? (body.shownTier as Tier) : undefined;
  const res = await createOrder(deps.store, {
    productSlug: typeof body.productSlug === "string" && body.productSlug ? body.productSlug : PRODUCT_SLUG,
    name: body.name,
    email: body.email,
    method,
    consent: pickConsent(body),
    shownTier,
    src: body.src,
    ip: input.ip,
    ipSalt,
    now,
  });

  if (!res.ok) {
    switch (res.code) {
      case "product_not_found":
        return fail(404, res.code, "We could not find this product.");
      case "product_inactive":
        return fail(409, res.code, "Orders are not open yet.");
      case "consent_required":
        return fail(400, res.code, "Tick both boxes to continue.");
      case "invalid_email":
        return fail(400, res.code, "Enter a valid email address.");
      case "invalid_name":
        return fail(400, res.code, "Enter your name.");
      case "method_not_allowed":
        return fail(400, res.code, "That payment method is not available.");
      case "price_changed":
        return fail(409, res.code, "The price changed. Please check the new price and try again.", {
          tier: res.tier,
          amountMinor: res.amountMinor,
          currency: res.currency,
        });
    }
  }

  const { order, claimToken } = res;
  const reused = res.reused === true;
  const summary = { ref: order.orderRef, orderRef: order.orderRef, tier: order.priceTier, amountMinor: order.expectedMinor, currency: order.currency };

  if (method === "bank_transfer") {
    const details = await deps.getBankDetails(order.productSlug);
    return {
      status: 200,
      claimToken,
      body: { ok: true, method, ...summary, bankDetails: details, narration: order.orderRef },
    };
  }

  if (reused) {
    // Double click: another request is creating this buyer's payment link. Wait briefly, then return that same link.
    for (let i = 0; i < 12; i++) {
      const cur = await deps.store.getOrderById(order.id);
      if (cur?.providerRef) {
        return { status: 200, body: { ok: true, method, ...summary, link: cur.providerRef, paymentLink: cur.providerRef } };
      }
      if (!cur || cur.status !== "awaiting_payment") break;
      await new Promise((r) => setTimeout(r, 250));
    }
    return fail(409, "order_in_progress", "Your payment page is still opening. Please wait a moment and try once more.");
  }

  try {
    const link = await createHostedPayment({
      fetch: deps.fetch,
      secretKey: deps.env.flwSecretKey,
      txRef: order.orderRef,
      amountMinor: order.expectedMinor,
      currency: "NGN",
      redirectUrl: `${input.siteBase ?? SITE_URL}${RETURN_PATH}`,
      email: order.email,
      name: order.name,
      orderId: order.id,
      title: "TheEditCompanion",
      sessionMinutes: FLW_SESSION_MINUTES,
    });
    if (isAtomicStore(deps.store)) await deps.store.attachPaymentLink(order.id, link);
    await deps.store.addEvent(order.id, "system", "payment_link_created", "flutterwave hosted link", now);
    return { status: 200, claimToken, body: { ok: true, method, ...summary, link, paymentLink: link } };
  } catch (e) {
    // The buyer was not sent to pay. Free the founders place and tell them.
    deps.log(`create payment failed for ${order.orderRef}: ${e instanceof Error ? e.message : "error"}`);
    try {
      await deps.store.setOrderStatus(order.id, "expired");
      await deps.store.addEvent(order.id, "system", "provider_error", "could not create flutterwave link", now);
    } catch (e2) {
      deps.log(`could not expire order ${order.orderRef}: ${e2 instanceof Error ? e2.message : "error"}`);
    }
    return fail(502, "provider_error", "We could not open the payment page. You were not charged. Please try again or message us.");
  }
}
