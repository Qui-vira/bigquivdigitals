import { NextRequest, NextResponse } from "next/server";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { getNeonAdmin } from "@/lib/neon";
import { sendPurchaseConfirmation } from "@/lib/send-purchase-email";
import { assertPaidEnough } from "@/lib/course-prices";

const COURSE_SLUG = "ai-content-mastery";

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

    // Origin check. Unconditional, and host-exact.
    //
    // This read `if (origin && ...)` with `.includes("bigquivdigitals.com")`,
    // which failed twice over: omitting the Origin and Referer headers skipped
    // it entirely, and "bigquivdigitals.com.attacker.tld" passed the substring
    // test. It is defence in depth, not the real control (the amount check
    // below is), but a check that any curl can walk past is worse than none
    // because it reads as protection.
    const ALLOWED_HOSTS = new Set(["bigquivdigitals.com", "www.bigquivdigitals.com", "localhost"]);
    const originHeader = req.headers.get("origin") || req.headers.get("referer") || "";
    let originHost = "";
    try {
      originHost = new URL(originHeader).hostname;
    } catch {
      originHost = "";
    }
    if (!ALLOWED_HOSTS.has(originHost)) {
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

      // 🛑 A SUCCESSFUL PAYMENT IS NOT A SUFFICIENT PAYMENT.
      // Flutterwave confirms that money moved, never that the right amount did.
      // The amount was set in the browser, so without this a ₦100 charge became
      // a confirmed seat plus a Telegram invite. Never write the purchase row
      // before this passes.
      const priced = assertPaidEnough(COURSE_SLUG, amount, currency);
      if (!priced.ok) {
        console.error(`[Flutterwave] Underpaid or unpriced purchase rejected, tx ${txRef}: ${priced.reason}`);
        return NextResponse.json(
          { success: false, error: "Payment amount does not match the course price" },
          { status: 400 }
        );
      }

      if (email) {
        const supabase = getNeonAdmin();

        // Record purchase
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

      // Deliberately returns nothing about the buyer. This endpoint takes a
      // transaction id and nothing else, so echoing email and amount turned any
      // guessed or observed id into a lookup for someone else's address.
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, error: "Payment not verified" }, { status: 400 });
  } catch {
    return NextResponse.json({ success: false, error: "Verification failed" }, { status: 500 });
  }
}
