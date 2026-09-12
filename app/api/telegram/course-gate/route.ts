import { NextRequest, NextResponse } from "next/server";
import { getNeonAdmin } from "@/lib/neon";

const BOT_TOKEN = process.env.COURSE_BOT_TOKEN || "";
const CHANNEL_ID = process.env.COURSE_CHANNEL_ID || "";

async function tgSend(chatId: number | string, text: string) {
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
  });
}

async function kickUser(userId: number) {
  const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/banChatMember`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: CHANNEL_ID,
      user_id: userId,
      revoke_messages: true,
    }),
  });
  const data = await res.json();
  // Stay banned until they register via the bot — no immediate unban
  return data.ok;
}

async function unbanUser(userId: number) {
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/unbanChatMember`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: CHANNEL_ID,
      user_id: userId,
      only_if_banned: true,
    }),
  });
}

async function notifyAdmin(text: string) {
  const adminChatId = process.env.TELEGRAM_ADMIN_CHAT_ID;
  if (adminChatId) await tgSend(adminChatId, text);
}

// --- DM Registration Handler ---
async function handleDirectMessage(message: Record<string, unknown>) {
  const chat = message.chat as Record<string, unknown>;
  const from = message.from as Record<string, unknown>;
  const text = ((message.text as string) || "").trim();
  const chatId = chat.id as number;
  const userId = from.id as number;
  const username = (from.username as string) || null;

  // Handle /start
  if (text === "/start") {
    await tgSend(chatId,
      "Welcome to the <b>Big Quiv AI CLASS</b> registrar bot.\n\n" +
      "To verify your access, send me the <b>email address</b> you used to pay for the course.\n\n" +
      "Example: <code>youremail@gmail.com</code>"
    );
    return;
  }

  // Handle /verify — re-verification during sweep
  if (text === "/verify") {
    const supabase = getNeonAdmin();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase.from("course_purchases") as any)
      .select("id, first_name")
      .eq("telegram_user_id", String(userId))
      .eq("status", "confirmed")
      .maybeSingle();

    if (data) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from("course_purchases") as any)
        .update({ sweep_verified_at: new Date().toISOString() })
        .eq("id", data.id);
      await tgSend(chatId, `Verified! You're safe, ${data.first_name || "there"}. No action needed.`);
    } else {
      await tgSend(chatId,
        "Your Telegram account isn't linked to a purchase yet.\n\n" +
        "Send me the <b>email address</b> you used to pay, and I'll link you + verify you.\n\n" +
        "Example: <code>youremail@gmail.com</code>"
      );
    }
    return;
  }

  // Check if message looks like an email
  const emailMatch = text.match(/[^\s@]+@[^\s@]+\.[^\s@]+/);
  if (!emailMatch) {
    await tgSend(chatId,
      "Please send the <b>email address</b> you used to pay for the course.\n\n" +
      "Example: <code>youremail@gmail.com</code>"
    );
    return;
  }

  const email = emailMatch[0].toLowerCase().trim();
  const supabase = getNeonAdmin();

  // Look up purchase by email
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase.from("course_purchases") as any)
    .select("id, first_name, telegram_username, telegram_user_id")
    .eq("email", email)
    .eq("status", "confirmed")
    .maybeSingle();

  if (!data) {
    await tgSend(chatId,
      "No purchase found for <b>" + email + "</b>.\n\n" +
      "Make sure you're using the exact email you paid with. If you haven't purchased yet, go to <b>bigquivdigitals.com</b> to enroll."
    );
    return;
  }

  // Already registered with a different user
  if (data.telegram_user_id && data.telegram_user_id !== String(userId)) {
    await tgSend(chatId,
      "This email is already linked to a different Telegram account. DM @Quivira_Ophir if this is an error."
    );
    await notifyAdmin(`⚠️ Duplicate claim: user_id:${userId} (@${username || "no_username"}) tried to claim ${email} — already linked to user_id:${data.telegram_user_id}`);
    return;
  }

  // Register their telegram username and user_id + mark sweep verified
  const updateData: Record<string, string> = {
    telegram_user_id: String(userId),
    sweep_verified_at: new Date().toISOString(),
  };
  if (username) {
    updateData.telegram_username = username;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase.from("course_purchases") as any)
    .update(updateData)
    .eq("id", data.id);

  // Unban in case they were previously kicked by the gate
  await unbanUser(userId);

  const name = data.first_name || "there";
  await tgSend(chatId,
    "✅ <b>Verified!</b>\n\n" +
    `Hey ${name}, your Telegram account is now linked to your purchase. You're safe from the auto-kick.\n\n` +
    "If you need a new invite link to the course channel, go to <b>bigquivdigitals.com/course-access</b>"
  );

  await notifyAdmin(`✅ Registered: @${username || "no_username"} (user_id:${userId}) → ${email}`);
}

// --- Channel Gate Handler ---
async function handleChatMember(update: Record<string, unknown>) {
  const newMember = update.new_chat_member as Record<string, unknown>;
  const newStatus = newMember?.status as string;
  const user = newMember?.user as Record<string, unknown>;

  if (!user || !["member", "restricted"].includes(newStatus)) return;
  if (user.is_bot) return;

  const userId = user.id as number;
  const username = (user.username as string) || null;
  const supabase = getNeonAdmin();

  let found = false;

  // Check by telegram_username
  if (username) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase.from("course_purchases") as any)
      .select("id")
      .ilike("telegram_username", username)
      .eq("status", "confirmed")
      .limit(1);
    if (data && data.length > 0) found = true;
  }

  // Check by telegram_user_id
  if (!found) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase.from("course_purchases") as any)
      .select("id")
      .eq("telegram_user_id", String(userId))
      .eq("status", "confirmed")
      .limit(1);
    if (data && data.length > 0) found = true;
  }

  const label = username ? `@${username}` : `user_id:${userId}`;

  if (!found) {
    await kickUser(userId);
    await notifyAdmin(`🚪 KICKED (no purchase): ${label}`);
  } else {
    // Save user_id for future lookups
    if (username) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from("course_purchases") as any)
        .update({ telegram_user_id: String(userId) })
        .ilike("telegram_username", username);
    }
    await notifyAdmin(`✅ ALLOWED: ${label}`);
  }
}

/**
 * ⚠ THIS ROUTE HAD NO AUTHENTICATION AT ALL UNTIL 2026-09-12, and it was live.
 *
 * Everything it acts on comes from the request body: the Telegram user id, the
 * chat id and the message text. With no check, anyone on the internet could
 *
 *   1. POST a buyer's email and have their paid seat re-linked to their own
 *      Telegram id, sweep-verified and unbanned, locking the real buyer out via
 *      the duplicate-claim branch,
 *   2. use the attacker-chosen chat id to read the reply, turning
 *      "No purchase found" vs "Verified!" into a yes/no oracle on whether any
 *      given email belongs to a paying student,
 *   3. forge a chat_member update and get real students banned from the channel.
 *
 * `proxy.ts` only matches /admin/:path*, so nothing upstream covered this.
 *
 * 🛑 THE CHECK IS UNCONDITIONAL ON PURPOSE. Do not rewrite it as
 * `if (SECRET && header !== SECRET)`. That is the shape the outreach webhook
 * used, and because its secret was never set in production the guard silently
 * did nothing. A missing secret must fail closed, never open.
 *
 * The value is registered with Telegram via setWebhook's `secret_token`, so
 * Telegram sends it on every delivery. If you rotate it, set it on BOTH sides:
 * call setWebhook again first, then update the env var, or the bot goes deaf.
 */
const GATE_SECRET = process.env.COURSE_GATE_WEBHOOK_SECRET || "";

export async function POST(req: NextRequest) {
  try {
    if (!GATE_SECRET || req.headers.get("x-telegram-bot-api-secret-token") !== GATE_SECRET) {
      return NextResponse.json({ ok: false }, { status: 403 });
    }

    const body = await req.json();

    // DM to bot
    if (body.message && body.message.chat?.type === "private") {
      await handleDirectMessage(body.message);
      return NextResponse.json({ ok: true });
    }

    // Channel member join/leave
    if (body.chat_member) {
      await handleChatMember(body.chat_member);
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[course-gate] Error:", err);
    return NextResponse.json({ ok: true });
  }
}

export async function GET() {
  return NextResponse.json({ status: "Course gate webhook active" });
}
