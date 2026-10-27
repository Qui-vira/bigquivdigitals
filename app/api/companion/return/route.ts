import { NextRequest, NextResponse } from "next/server";
import { buildPaymentsDeps } from "@/lib/companion/payments-runtime";
import { PRODUCT_PAGE_PATH, handleReturn } from "@/lib/companion/return-handler";
import { getClientIp, rateLimit } from "@/lib/rate-limit";

// Flutterwave redirects the buyer here. The query string is never trusted: the
// handler re-queries Flutterwave, settles idempotently, then redirects to the
// thanks page (which reads the real state from the database via the claim cookie).
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams;
  const rl = rateLimit(`tec-return:${getClientIp(req.headers)}`, 30, 60_000);
  let location = "/theeditcompanion/thanks";
  if (rl.allowed) {
    try {
      const r = await handleReturn(buildPaymentsDeps(), {
        status: q.get("status"),
        txRef: q.get("tx_ref"),
        transactionId: q.get("transaction_id"),
      });
      location = r.location;
    } catch (e) {
      console.error("[companion] return error", e instanceof Error ? e.message : "error");
      location = PRODUCT_PAGE_PATH;
    }
  }
  return NextResponse.redirect(new URL(location, req.url), { status: 303, headers: { "Cache-Control": "no-store" } });
}
