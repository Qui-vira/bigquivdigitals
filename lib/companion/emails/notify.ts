/**
 * Owner alerts: email plus Telegram. Telegram follows the existing pattern in
 * app/api/telegram/course-gate/route.ts (bot token COURSE_BOT_TOKEN, chat id
 * TELEGRAM_ADMIN_CHAT_ID; env var NAMES only). Alerts never carry a download token.
 */
import type { EmailSender } from "./sender";
import { env } from "../env";

export interface Notifier {
  /** Never throws. Returns whether at least one channel accepted it. */
  alertOwner(subject: string, text: string): Promise<boolean>;
}

export const OWNER_EMAIL_DEFAULT = "contact@bigquivdigitals.com";

export function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export function createDefaultNotifier(sender?: EmailSender): Notifier {
  return {
    async alertOwner(subject, text) {
      let ok = false;
      try {
        const s = sender ?? (await import("./sender")).createResendSender();
        const to = env("COMPANION_OWNER_EMAIL") || OWNER_EMAIL_DEFAULT;
        const r = await s.send({
          to,
          subject,
          text,
          html: `<pre style="font-family:inherit;white-space:pre-wrap">${escapeHtml(text)}</pre>`,
        });
        ok = r.ok || ok;
      } catch {
        /* ignore */
      }
      try {
        const bot = env("COURSE_BOT_TOKEN");
        const chat = env("TELEGRAM_ADMIN_CHAT_ID");
        if (bot && chat) {
          const res = await fetch(`https://api.telegram.org/bot${bot}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            signal: AbortSignal.timeout(4000),
            body: JSON.stringify({ chat_id: chat, text: `${subject}\n\n${text}`.slice(0, 3500) }),
          });
          ok = res.ok || ok;
        }
      } catch {
        /* ignore */
      }
      return ok;
    },
  };
}
