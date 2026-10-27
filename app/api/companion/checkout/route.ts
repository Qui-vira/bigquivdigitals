import { NextRequest, NextResponse } from "next/server";
import { claimCookieOptions } from "@/lib/companion/claim";
import { CLAIM_COOKIE, handleCheckout, originAllowed } from "@/lib/companion/checkout-handler";
import { buildPaymentsDeps } from "@/lib/companion/payments-runtime";
import { env, isProductionEnv, resolveSiteBase } from "@/lib/companion/env";
import { getClientIp, rateLimit } from "@/lib/rate-limit";

// Creates the order with the SERVER price, then a Flutterwave hosted payment
// link. The client never sends an amount. See lib/companion/PAYMENTS.md.
export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req.headers);
    const rl = rateLimit(`tec-checkout:${ip}`, 8, 60_000);
    if (!rl.allowed) {
      return NextResponse.json(
        { ok: false, code: "rate_limited", error: "Too many attempts. Please wait a minute and try again." },
        { status: 429, headers: { "Retry-After": String(rl.retryAfter ?? 60), "Cache-Control": "no-store" } },
      );
    }
    if (!originAllowed(req.headers.get("origin"), req.headers.get("referer"))) {
      return NextResponse.json({ ok: false, code: "forbidden", error: "Forbidden" }, { status: 403 });
    }
    let body: unknown = null;
    try {
      body = await req.json();
    } catch {
      body = null;
    }
    const result = await handleCheckout(buildPaymentsDeps(), {
      body,
      ip: ip === "unknown" ? null : ip,
      siteBase: resolveSiteBase(req.nextUrl.origin, isProductionEnv(), env("VERCEL_URL")),
    });
    const res = NextResponse.json(result.body, { status: result.status, headers: { "Cache-Control": "no-store" } });
    if (result.claimToken) {
      res.cookies.set(CLAIM_COOKIE, result.claimToken, claimCookieOptions(isProductionEnv()));
    }
    return res;
  } catch (e) {
    console.error("[companion] checkout error", e instanceof Error ? e.message : "error");
    return NextResponse.json(
      { ok: false, code: "server_error", error: "Something went wrong on our side. You were not charged. Please try again." },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
