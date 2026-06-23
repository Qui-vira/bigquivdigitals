import { Resend } from "resend";

const BOT_TOKEN = () => process.env.COURSE_BOT_TOKEN || "";
const CHANNEL_ID = () => process.env.COURSE_CHANNEL_ID || "";

/** Generate a single-use Telegram invite link (auto-expires after 1 join) */
export async function createSingleUseInvite(label: string): Promise<string | null> {
  const token = BOT_TOKEN();
  const chatId = CHANNEL_ID();
  if (!token || !chatId) {
    console.error("[telegram] COURSE_BOT_TOKEN or COURSE_CHANNEL_ID not set");
    return null;
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/createChatInviteLink`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        member_limit: 1,
        name: label.slice(0, 32),
        expire_date: Math.floor(Date.now() / 1000) + 86400, // 24 hours
      }),
    });
    const data = await res.json();
    if (data.ok) {
      console.log(`[telegram] Created single-use invite for ${label}: ${data.result.invite_link}`);
      return data.result.invite_link as string;
    }
    console.error("[telegram] Failed to create invite:", data);
    return null;
  } catch (err) {
    console.error("[telegram] Invite creation error:", err);
    return null;
  }
}

export async function sendPurchaseConfirmation(email: string, firstName?: string) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("[email] RESEND_API_KEY not set, skipping confirmation email");
    return;
  }

  // Generate invite link for the email
  const inviteLink = await createSingleUseInvite(`email:${email}`);

  const resend = new Resend(apiKey);
  const name = firstName || "there";

  const linkSection = inviteLink
    ? `<p style="text-align:center;margin:24px 0">
    <a href="${inviteLink}" style="display:inline-block;padding:14px 28px;background:#E63946;color:#fff;text-decoration:none;border-radius:8px;font-weight:bold;font-size:16px">Join the Course Channel &rarr;</a>
  </p>
  <p style="font-size:13px;color:#888;text-align:center">This link works once — tap it to join the private Telegram channel.</p>`
    : `<p>Go to <a href="https://bigquivdigitals.com/course-access">bigquivdigitals.com/course-access</a> and enter this email to get your invite link.</p>`;

  const { error } = await resend.emails.send({
    from: "Big Quiv <contact@bigquivdigitals.com>",
    to: email,
    subject: "You're in! AI Content Mastery - Access Inside",
    html: `
<div style="font-family:sans-serif;font-size:16px;line-height:1.7;color:#222;max-width:600px;margin:0 auto;padding:20px">
  <p>Hey ${name},</p>
  <p>Payment confirmed. You're officially in <strong>AI Content Mastery: Zero to Pro in 2 Weeks</strong>.</p>
  <p>Here's your private access to the course channel:</p>
  ${linkSection}
  <p>Live classes are happening inside the channel. Join now so you don't miss anything.</p>
  <p>If you have any questions, reply to this email or DM me on <a href="https://t.me/Quivira_Ophir">Telegram</a>.</p>
  <br>
  <p>Let's build,<br><strong>Quiv</strong></p>
  <p style="font-size:13px;color:#888;margin-top:24px">You're receiving this because you purchased AI Content Mastery on bigquivdigitals.com</p>
</div>`,
  });

  if (error) {
    console.error(`[email] Failed to send confirmation to ${email}:`, error);
    throw new Error(`Email send failed: ${error.message}`);
  }
  console.log(`[email] Purchase confirmation sent to ${email}`);
}
