import { after, NextRequest, NextResponse } from "next/server";
import { originAllowed } from "@/lib/companion/checkout-handler";
import { handlePurchasesRequest, PURCHASES_SERVER_ERROR } from "@/lib/companion/purchases-handler";
import { purchasesSecret } from "@/lib/companion/purchases-link";
import { getRuntime } from "@/lib/companion/runtime";
import { getClientIp } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// "Email me a sign-in link" for My purchases. The answer is the same whether or not
// the email has orders; the lookup and the email run after the answer is sent.
export async function POST(req: NextRequest) {
  const headers = { "Cache-Control": "no-store" };
  try {
    if (!originAllowed(req.headers.get("origin"), req.headers.get("referer"))) {
      return NextResponse.json({ ok: false, message: "Forbidden" }, { status: 403, headers });
    }
    let body: unknown = null;
    try {
      body = await req.json();
    } catch {
      body = null;
    }
    const out = await handlePurchasesRequest(await getRuntime(), {
      body,
      ip: getClientIp(req.headers),
      secret: purchasesSecret(),
    });
    if (out.background) after(out.background);
    return NextResponse.json(out.body, {
      status: out.status,
      headers: out.retryAfter ? { ...headers, "Retry-After": String(out.retryAfter) } : headers,
    });
  } catch (e) {
    // Never log the body: it holds the email.
    console.error("[companion] purchases request error", e instanceof Error ? e.name : "error");
    return NextResponse.json({ ok: false, message: PURCHASES_SERVER_ERROR }, { status: 500, headers });
  }
}
