import { NextRequest, NextResponse } from "next/server";

const BOT_TOKEN = process.env.OUTREACH_BOT_TOKEN || "";
const WEBHOOK_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET || "";
// Moved off Supabase to Neon on 2026-09-08. This file talked to the Supabase
// REST endpoint directly with fetch, so it never imported getOutreachSupabase
// and a grep for that name missed it in the first sweep. Its twin is
// app/admin/actions/outreach.ts. Both approve the same rows, so both had to move
// together: had this one been left, an approval from Telegram would have landed
// in Supabase while /admin/outreach read Neon, and the draft would sit pending.
import { getOutreachSupabase } from "@/lib/supabase-outreach";

const TABLES: Record<string, string> = {
  al: "altara_outreach_drafts",
  kl: "kol_outreach_drafts",
};

const PIPELINE_LABELS: Record<string, string> = {
  al: "Altara",
  kl: "KOL",
};

async function answerCallback(callbackId: string, text: string) {
  try {
    await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/answerCallbackQuery`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ callback_query_id: callbackId, text }),
      }
    );
  } catch {
    // Silently ignore — callback may have expired
  }
}

async function editMessage(chatId: number, messageId: number, text: string) {
  try {
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/editMessageText`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        message_id: messageId,
        text,
        parse_mode: "HTML",
      }),
    });
  } catch {
    // Silently ignore
  }
}

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-telegram-bot-api-secret-token");
  if (WEBHOOK_SECRET && secret !== WEBHOOK_SECRET) {
    return NextResponse.json({ ok: false }, { status: 403 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: true });
  }

  const callback = body.callback_query;
  if (!callback) {
    return NextResponse.json({ ok: true });
  }

  const data = (callback.data || "") as string;
  const parts = data.split(":");
  if (parts.length !== 3) {
    await answerCallback(callback.id, "Invalid action");
    return NextResponse.json({ ok: true });
  }

  const [action, pipeline, draftId] = parts;
  const table = TABLES[pipeline];
  if (!table) {
    await answerCallback(callback.id, "Unknown pipeline");
    return NextResponse.json({ ok: true });
  }

  if (!process.env.DATABASE_URL) {
    await answerCallback(callback.id, "Database not configured");
    return NextResponse.json({ ok: true });
  }

  // Fetch current draft
  let existing: { status: string; lead_name: string; subject: string } | null =
    null;
  try {
    const { data } = await getOutreachSupabase()
      .from(table)
      .select("status,lead_name,subject")
      .eq("id", draftId)
      .maybeSingle();
    if (data) existing = data;
  } catch {
    await answerCallback(callback.id, "Database error");
    return NextResponse.json({ ok: true });
  }

  if (!existing) {
    await answerCallback(callback.id, "Draft not found");
    return NextResponse.json({ ok: true });
  }

  if (existing.status !== "pending") {
    await answerCallback(callback.id, `Already ${existing.status}`);
    return NextResponse.json({ ok: true });
  }

  const pipelineLabel = PIPELINE_LABELS[pipeline];
  const leadName = existing.lead_name || "Unknown";
  const subject = existing.subject || "";
  const chatId = callback.message?.chat?.id;
  const msgId = callback.message?.message_id;

  if (action === "a") {
    // Approve
    await getOutreachSupabase()
      .from(table)
      .update({ status: "approved", approved_at: new Date().toISOString() })
      .eq("id", draftId);

    await answerCallback(callback.id, `Approved: ${leadName}`);
    if (chatId && msgId) {
      await editMessage(
        chatId,
        msgId,
        `\u2705 <b>APPROVED</b> [${pipelineLabel}] ${leadName}\n<i>${subject}</i>`
      );
    }
  } else if (action === "r") {
    // Reject
    await getOutreachSupabase()
      .from(table)
      .update({ status: "rejected" })
      .eq("id", draftId);

    await answerCallback(callback.id, `Rejected: ${leadName}`);
    if (chatId && msgId) {
      await editMessage(
        chatId,
        msgId,
        `\u274c <b>REJECTED</b> [${pipelineLabel}] ${leadName}\n<s>${subject}</s>`
      );
    }
  } else {
    await answerCallback(callback.id, "Unknown action");
  }

  return NextResponse.json({ ok: true });
}

export async function GET() {
  return NextResponse.json({ status: "Outreach review webhook active" });
}
