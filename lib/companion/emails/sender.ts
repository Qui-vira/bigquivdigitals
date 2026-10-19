/** Email sending behind an interface. Tests inject a fake; never send in tests. */
import { Resend } from "resend";
import { env } from "../env";

export type OutgoingEmail = { to: string; subject: string; html: string; text: string; replyTo?: string };
export type SendResult = { ok: true } | { ok: false; error: string };

export interface EmailSender {
  send(msg: OutgoingEmail): Promise<SendResult>;
}

/** Same sender identity as the existing purchase email helper. Env var NAME: RESEND_API_KEY. */
export function createResendSender(): EmailSender {
  return {
    async send(msg) {
      const apiKey = env("RESEND_API_KEY");
      if (!apiKey) return { ok: false, error: "RESEND_API_KEY not set" };
      try {
        const resend = new Resend(apiKey);
        const { error } = await resend.emails.send({
          from: "Big Quiv <contact@bigquivdigitals.com>",
          to: msg.to,
          subject: msg.subject,
          html: msg.html,
          text: msg.text,
          replyTo: msg.replyTo ?? "contact@bigquivdigitals.com",
        });
        if (error) return { ok: false, error: String(error.message ?? "send failed").slice(0, 300) };
        return { ok: true };
      } catch (err) {
        return { ok: false, error: (err instanceof Error ? err.message : "send failed").slice(0, 300) };
      }
    },
  };
}
