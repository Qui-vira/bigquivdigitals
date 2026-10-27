import { NextRequest, NextResponse } from "next/server";
import { CLAIM_COOKIE, originAllowed } from "@/lib/companion/checkout-handler";
import { buildPaymentsDeps } from "@/lib/companion/payments-runtime";
import { handleTransferPaid } from "@/lib/companion/transfer-handler";
import { getClientIp, rateLimit } from "@/lib/rate-limit";

// "I have paid" for a manual bank transfer. Records it and alerts the owner.
// Never marks the order paid. Needs the claim cookie set at checkout.
export async function POST(req: NextRequest) {
  try {
    const rl = rateLimit(`tec-transfer:${getClientIp(req.headers)}`, 6, 60_000);
    if (!rl.allowed) {
      return NextResponse.json(
        { ok: false, error: "Too many requests. Please wait a minute." },
        { status: 429, headers: { "Retry-After": String(rl.retryAfter ?? 60), "Cache-Control": "no-store" } },
      );
    }
    if (!originAllowed(req.headers.get("origin"), req.headers.get("referer"))) {
      return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
    }
    let body: unknown = null;
    try {
      body = await req.json();
    } catch {
      body = null;
    }
    const r = await handleTransferPaid(buildPaymentsDeps(), { body, claimCookie: req.cookies.get(CLAIM_COOKIE)?.value });
    return NextResponse.json(r.body, { status: r.status, headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    console.error("[companion] transfer-paid error", e instanceof Error ? e.message : "error");
    return NextResponse.json({ ok: false, error: "Something went wrong. Please message us." }, { status: 500 });
  }
}
