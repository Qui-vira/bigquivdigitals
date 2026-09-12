import { NextRequest, NextResponse } from "next/server";
import { getNeonAdmin } from "@/lib/neon";
import { sendPurchaseConfirmation } from "@/lib/send-purchase-email";
import { assertPaidEnough } from "@/lib/course-prices";

const COURSE_SLUG = "ai-content-mastery";

export async function POST(req: NextRequest) {
  try {
    // Flutterwave verifies webhooks via a secret hash header, not HMAC
    const signature = req.headers.get("verif-hash");
    const secretHash = process.env.FLW_SECRET_HASH;

    // Unconditional. This read `if (secretHash && ...)`, so an empty
    // FLW_SECRET_HASH turned the only authentication on a purchase-granting
    // endpoint into a no-op. Same shape that left the Telegram webhooks open.
    if (!secretHash || signature !== secretHash) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const event = await req.json() as Record<string, unknown>;
    const eventType = event.event as string;
    const data = (event.data || {}) as Record<string, unknown>;

    if (eventType === "charge.completed" && data.status === "successful") {
      const customer = (data.customer || {}) as Record<string, unknown>;
      const email = (customer.email as string || "").toLowerCase().trim();
      const amount = data.amount as number;
      const currency = data.currency as string || "NGN";
      const txRef = data.tx_ref as string;
      const customerName = customer.name as string || "";

      // The same rule as the verify route: successful is not sufficient. A
      // webhook carrying a real signature still reports whatever amount was
      // charged, and the amount originated in the browser.
      const priced = assertPaidEnough(COURSE_SLUG, amount, currency);
      if (!priced.ok) {
        console.error(`[Flutterwave] Webhook rejected, tx ${txRef}: ${priced.reason}`);
        return NextResponse.json({ received: true, recorded: false });
      }

      console.log("[Flutterwave] Payment confirmed:", {
        txRef,
        txId: data.id,
        amount,
        currency,
        email,
        timestamp: new Date().toISOString(),
      });

      const supabase = getNeonAdmin();

      // Record purchase (ignore conflict if already exists)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from("course_purchases") as any).upsert(
        {
          email,
          first_name: customerName.split(" ")[0] || null,
          course_slug: COURSE_SLUG,
          amount,
          currency,
          payment_method: "flutterwave",
          transaction_ref: txRef,
          status: "confirmed",
        },
        { onConflict: "email,course_slug" }
      );

      // Add buyer to email list (prospects)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from("prospects") as any).upsert(
        {
          email,
          first_name: customerName.split(" ")[0] || null,
        },
        { onConflict: "email" }
      );

      // Send confirmation email with course access link
      if (email) {
        try {
          await sendPurchaseConfirmation(email, customerName.split(" ")[0] || undefined);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (supabase.from("course_purchases") as any)
            .update({ email_sent: true })
            .eq("transaction_ref", txRef);
        } catch (emailErr) {
          console.error(`[Flutterwave] Email send failed for ${email}:`, emailErr);
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("[Flutterwave] Webhook error:", err);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
