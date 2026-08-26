import { NextRequest, NextResponse } from "next/server";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { getNeonAdmin } from "@/lib/neon";
import { sendPurchaseConfirmation } from "@/lib/send-purchase-email";

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req.headers);
    const rl = rateLimit(`flw-verify:${ip}`, 10, 60_000);
    if (!rl.allowed) {
      return NextResponse.json(
        { success: false, error: "Too many requests" },
        { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }
      );
    }

    // Origin check — only allow requests from our own domain
    const origin = req.headers.get("origin") || req.headers.get("referer") || "";
    if (origin && !origin.includes("bigquivdigitals.com") && !origin.includes("localhost")) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const { transaction_id } = await req.json();

    if (!transaction_id) {
      return NextResponse.json({ success: false, error: "Missing transaction_id" }, { status: 400 });
    }

    const secretKey = process.env.FLW_SECRET_KEY;
    if (!secretKey) {
      return NextResponse.json({ success: false, error: "Payment not configured" }, { status: 503 });
    }

    const res = await fetch(`https://api.flutterwave.com/v3/transactions/${transaction_id}/verify`, {
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      return NextResponse.json({ success: false, error: "Flutterwave API error" }, { status: 502 });
    }

    const data = await res.json();

    if (data.status === "success" && data.data?.status === "successful") {
      const email = (data.data.customer?.email || "").toLowerCase().trim();
      const customerName = data.data.customer?.name || "";
      const amount = data.data.amount;
      const currency = data.data.currency || "NGN";
      const txRef = data.data.tx_ref || String(transaction_id);

      if (email) {
        const supabase = getNeonAdmin();

        // Record purchase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase.from("course_purchases") as any).upsert(
          {
            email,
            first_name: customerName.split(" ")[0] || null,
            course_slug: "ai-content-mastery",
            amount,
            currency,
            payment_method: "flutterwave",
            transaction_ref: txRef,
            status: "confirmed",
          },
          { onConflict: "email,course_slug" }
        );

        // Add to email list
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase.from("prospects") as any).upsert(
          {
            email,
            first_name: customerName.split(" ")[0] || null,
          },
          { onConflict: "email" }
        );

        // Send confirmation email
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

      return NextResponse.json({
        success: true,
        email,
        amount,
        currency,
      });
    }

    return NextResponse.json({ success: false, error: "Payment not verified" }, { status: 400 });
  } catch {
    return NextResponse.json({ success: false, error: "Verification failed" }, { status: 500 });
  }
}
