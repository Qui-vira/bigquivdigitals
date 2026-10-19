"use client";

import { useRef, useState } from "react";

/**
 * "Email me a sign-in link" for My purchases. Posts { email } to
 * /api/companion/purchases/request and shows the server's message. The server answers
 * the same neutral message whether or not the email has orders.
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
// v3 look (components/v3/pages/purchases.css); copy and behaviour unchanged.
const inputCls = "v3-pur__input";
const labelCls = "v3-pur__label";
const noteCls = "v3-pur__note";

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
    <form onSubmit={onSubmit} noValidate className="v3-pur__form" aria-busy={busy}>
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
        <p id="purchases-email-help" className="v3-pur__help">
          {REQUEST_FORM_COPY.emailHelp}
        </p>
      </div>
      <button
        type="submit"
        disabled={busy}
        className="v3-btn v3-pur__submit"
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
