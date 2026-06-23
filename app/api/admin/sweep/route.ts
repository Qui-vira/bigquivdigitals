import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import { sendPurchaseConfirmation } from "@/lib/send-purchase-email";

const BOT_TOKEN = process.env.COURSE_BOT_TOKEN || "";
const CHANNEL_ID = process.env.COURSE_CHANNEL_ID || "";

async function tgSend(chatId: string, text: string, pin = false) {
  const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
  });
  const data = await res.json();
  if (pin && data.ok) {
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/pinChatMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, message_id: data.result.message_id }),
    });
  }
  return data;
}

async function kickUser(userId: string) {
  const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/banChatMember`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: CHANNEL_ID, user_id: Number(userId), revoke_messages: true }),
  });
  return (await res.json()).ok;
}

async function revokeAllInviteLinks() {
  // Revoke the primary invite link
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/revokeChatInviteLink`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: CHANNEL_ID, invite_link: "" }),
  }).catch(() => {});
}

export async function POST(req: NextRequest) {
  const session = await verifySession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { phase } = await req.json();
  const supabase = getSupabaseAdmin();

  // PHASE 1: Announce — post verification message, reset sweep timestamps
  if (phase === "announce") {
    // Reset all sweep_verified_at
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from("course_purchases") as any)
      .update({ sweep_verified_at: null })
      .neq("id", "00000000-0000-0000-0000-000000000000"); // update all rows

    // Post announcement in channel
    await tgSend(CHANNEL_ID,
      "<b>VERIFICATION REQUIRED</b>\n\n" +
      "To keep this channel free of unauthorized users, ALL members must verify within <b>24 hours</b>.\n\n" +
      "<b>How to verify:</b>\n" +
      "1. Open a DM with @BigQuivRegistrar_bot\n" +
      "2. Send /verify\n\n" +
      "If your Telegram isn't linked yet, send the bot the email you used to pay.\n\n" +
      "Members who don't verify within 24 hours will be removed. You can always rejoin after verifying.",
      true // pin
    );

    return NextResponse.json({
      success: true,
      message: "Sweep announced and pinned. Verification timestamps reset.",
    });
  }

  // PHASE 2: Check — show verification status
  if (phase === "check") {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: all } = await (supabase.from("course_purchases") as any)
      .select("email, first_name, telegram_username, telegram_user_id, sweep_verified_at")
      .eq("status", "confirmed")
      .order("created_at");

    const verified = (all || []).filter((s: Record<string, unknown>) => s.sweep_verified_at);
    const unverifiedLinked = (all || []).filter(
      (s: Record<string, unknown>) => !s.sweep_verified_at && s.telegram_user_id
    );
    const unverifiedUnlinked = (all || []).filter(
      (s: Record<string, unknown>) => !s.sweep_verified_at && !s.telegram_user_id
    );

    return NextResponse.json({
      total: (all || []).length,
      verified: verified.length,
      unverified_linked: unverifiedLinked,
      unverified_unlinked: unverifiedUnlinked,
    });
  }

  // PHASE 3: Kick — remove unverified users, revoke links, resend emails
  if (phase === "kick") {
    // Get unverified users who have a telegram_user_id (can be kicked)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: unverified } = await (supabase.from("course_purchases") as any)
      .select("id, email, first_name, telegram_username, telegram_user_id")
      .eq("status", "confirmed")
      .is("sweep_verified_at", null)
      .not("telegram_user_id", "is", null);

    const kicked: string[] = [];
    for (const user of unverified || []) {
      const ok = await kickUser(user.telegram_user_id);
      if (ok) {
        kicked.push(`${user.email} (@${user.telegram_username || user.telegram_user_id})`);
        // Unlink their telegram so they must re-register
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase.from("course_purchases") as any)
          .update({ telegram_username: null, telegram_user_id: null, invite_count: 0 })
          .eq("id", user.id);
      }
    }

    // Revoke old invite links
    await revokeAllInviteLinks();

    // Reset invite counts for all students so they can get fresh links
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from("course_purchases") as any)
      .update({ invite_count: 0 })
      .neq("id", "00000000-0000-0000-0000-000000000000");

    // Send fresh emails to kicked students so they can rejoin
    const emailsSent: string[] = [];
    for (const user of unverified || []) {
      try {
        await sendPurchaseConfirmation(user.email, user.first_name || undefined);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase.from("course_purchases") as any)
          .update({ email_sent: true })
          .eq("id", user.id);
        emailsSent.push(user.email);
      } catch {
        // continue
      }
    }

    // Post channel message
    await tgSend(CHANNEL_ID,
      "<b>Verification sweep complete.</b>\n\n" +
      `${kicked.length} unverified member(s) removed. Fresh invite links have been sent to their emails.\n\n` +
      "If you were removed by mistake, check your email or visit bigquivdigitals.com/course-access",
      false
    );

    return NextResponse.json({
      success: true,
      kicked,
      emails_sent: emailsSent,
    });
  }

  return NextResponse.json({ error: "Invalid phase. Use: announce, check, or kick" }, { status: 400 });
}
