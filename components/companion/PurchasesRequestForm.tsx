"use client";

import { useRef, useState } from "react";

/**
 * "Email me a sign-in link" for My purchases. Posts { email } to
 * /api/companion/purchases/request and shows the server's message. The server answers
 * the same neutral message whether or not the email has orders.
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const inputCls =
  "min-h-[48px] w-full border-[3px] border-ink bg-paper px-3.5 py-2.5 text-base text-ink placeholder:text-ink-muted";
const labelCls = "mb-2 block font-typewriter text-[12px] font-bold uppercase tracking-[0.08em] text-ink";
const noteCls = "mt-4 inline-block border-2 border-ink bg-gold-tint px-2 py-0.5 text-[15px] font-semibold text-ink";

export const REQUEST_FORM_COPY = {
  emailLabel: "Your email",
  emailHelp: "Use the email you bought with.",
  button: "Email me a sign-in link",
  working: "Sending...",
  errEmail: "This email does not look right. Check it and try again.",
  errNetwork: "We could not send your request. Check your connection and try again.",
} as const;

export function PurchasesRequestForm() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const inFlight = useRef(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (inFlight.current) return;
    setNote(null);
    const clean = email.trim();
    if (!EMAIL_RE.test(clean)) return setNote({ kind: "error", text: REQUEST_FORM_COPY.errEmail });
    inFlight.current = true;
    setBusy(true);
    try {
      const res = await fetch("/api/companion/purchases/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ email: clean }),
      });
      let data: { ok?: unknown; message?: unknown } | null = null;
      try {
        data = await res.json();
      } catch {
        data = null;
      }
      const text = typeof data?.message === "string" && data.message ? data.message : REQUEST_FORM_COPY.errNetwork;
      setNote({ kind: data?.ok === true ? "ok" : "error", text });
    } catch {
      setNote({ kind: "error", text: REQUEST_FORM_COPY.errNetwork });
    }
    inFlight.current = false;
    setBusy(false);
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4" aria-busy={busy}>
      <div>
        <label htmlFor="purchases-email" className={labelCls}>
          {REQUEST_FORM_COPY.emailLabel}
        </label>
        <input
          id="purchases-email"
          type="email"
          name="email"
          autoComplete="email"
          inputMode="email"
          required
          maxLength={254}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputCls}
          aria-describedby="purchases-email-help"
        />
        <p id="purchases-email-help" className="mt-2 text-[14px] text-ink-soft">
          {REQUEST_FORM_COPY.emailHelp}
        </p>
      </div>
      <button
        type="submit"
        disabled={busy}
        className="paper-focus relative inline-flex min-h-[52px] w-full cursor-pointer select-none items-center justify-center border-[3px] border-ink bg-gold px-6 font-display text-base font-bold text-ink shadow-brutal-gold transition-[translate,box-shadow,background-color] duration-150 hover:bg-gold-hover active:translate-x-[5px] active:translate-y-[5px] active:shadow-[1px_1px_0_0_#E8A33D] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
      >
        {busy ? REQUEST_FORM_COPY.working : REQUEST_FORM_COPY.button}
      </button>
      {note ? (
        <p role={note.kind === "error" ? "alert" : "status"} className={noteCls}>
          {note.text}
        </p>
      ) : null}
    </form>
  );
}
