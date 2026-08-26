import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";
import { getNeonAdmin } from "@/lib/neon";
import { sendPurchaseConfirmation } from "@/lib/send-purchase-email";

// Blockradar pings this with GET to validate the URL
export async function GET() {
  return NextResponse.json({ status: "ok", webhook: "blockradar" });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get("x-blockradar-signature") || "";
    const webhookSecret = process.env.BLOCKRADAR_WEBHOOK_SECRET;

    // Verify HMAC signature if secret is configured
    if (webhookSecret) {
      const expected = createHmac("sha256", webhookSecret).update(body).digest("hex");
      if (signature !== expected) {
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }
    }

    const event = JSON.parse(body) as Record<string, unknown>;
    const eventType = (event.event || event.type) as string;

    if (eventType === "transaction.confirmed" || eventType === "deposit.confirmed") {
      const txData = (event.data || {}) as Record<string, unknown>;
      const amount = Number(txData.amount) || 0;
      const token = (txData.token as string) || "USDC";
      const txHash = (txData.hash as string) || "";
      const metadata = (txData.metadata || {}) as Record<string, unknown>;
      const email = ((metadata.email as string) || "").toLowerCase().trim();

      console.log("[Blockradar] Payment confirmed:", {
        address: txData.address,
        amount,
        token,
        txHash,
        email,
        timestamp: new Date().toISOString(),
      });

      const supabase = getNeonAdmin();

      if (email) {
        // Record purchase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase.from("course_purchases") as any).upsert(
          {
            email,
            course_slug: "ai-content-mastery",
            amount,
            currency: token,
            payment_method: "blockradar",
            transaction_ref: txHash,
            status: "confirmed",
          },
          { onConflict: "email,course_slug" }
        );

        // Add buyer to email list
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase.from("prospects") as any).upsert(
          { email },
          { onConflict: "email" }
        );

        // Send confirmation email with course access link
        try {
          await sendPurchaseConfirmation(email);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (supabase.from("course_purchases") as any)
            .update({ email_sent: true })
            .eq("transaction_ref", txHash);
        } catch (emailErr) {
          console.error(`[Blockradar] Email send failed for ${email}:`, emailErr);
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("[Blockradar] Webhook error:", err);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
