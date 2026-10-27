/**
 * Called by the existing /api/payment/flutterwave/webhook route for payloads
 * whose data.tx_ref starts with TEC-. Wraps the pure handler with the real deps
 * and ALWAYS returns a Response (never throws), so a companion problem can only
 * affect TEC- events.
 */
import { NextResponse } from "next/server";
import { handleCompanionFlutterwaveWebhook } from "./flutterwave-handler";
import { buildPaymentsDeps } from "./payments-runtime";

export async function dispatchCompanionFlutterwave(verifHash: string | null, event: unknown): Promise<Response> {
  try {
    const r = await handleCompanionFlutterwaveWebhook(buildPaymentsDeps(), { verifHash, event });
    return NextResponse.json(r.body, { status: r.status });
  } catch (e) {
    console.error("[companion] webhook dispatch error", e instanceof Error ? e.message : "error");
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
