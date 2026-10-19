"use client";

import { useId, useRef, useState } from "react";
import "@/components/v3/pages/course.css";

/**
 * Email capture for The Great Work waitlist.
 *
 * Email only. Anything else is friction on a form whose single job is to hold
 * a place, and every extra field is one more reason to close the tab.
 *
 * This component makes no promise of its own about price, dates or refunds.
 * Where a promise is made it is made by the surrounding page, in copy, next to
 * the evidence for it — see app/greatwork-waitlist. A promise baked in here would follow
 * the form onto every surface it is ever dropped into, including ones where it
 * is not true.
 *
 * `onSuccess` lets a host page take over after the signup lands, which is how
 * /greatwork-waitlist swaps the form out for the Opportunity Map. When it is passed the
 * built-in confirmation line is skipped, because the host is showing its own.
 */
type State = "idle" | "sending" | "done" | "error";

/**
 * Channel tag, read off `?src=` at submit time.
 *
 * WHY THIS EXISTS
 * Every Great Work signup in the database says `waitlist-page`, and every AI class
 * one says `aimastery-waitlist`. Those are the page they landed on, not where they
 * came from — Instagram, WhatsApp, TikTok and X all wrote the same value. So on
 * 2026-09-02 the question "did WhatsApp Status convert better than the reel" could
 * only be answered by lining signup timestamps up against posting times by hand.
 *
 * Read at submit rather than on mount, so there is no hydration mismatch and no
 * effect to run.
 *
 * The result is `base:channel`, e.g. `waitlist-page:whatsapp`. The base is kept in
 * front on purpose: the API routes to the right Resend segment with
 * `source.startsWith("aimastery")`, and the reporting queries use
 * `source ILIKE 'aimastery%'`. Both keep working untouched, and rows written before
 * today stay directly comparable.
 *
 * Sanitised hard, because this string is written to the database: lowercase, only
 * letters, digits and hyphens, 24 characters max. Anything else is dropped and the
 * signup still saves — a lost tag is a nuisance, a lost signup is not.
 */
function channelTag(): string {
  if (typeof window === "undefined") return "";
  try {
    const raw = new URLSearchParams(window.location.search).get("src") ?? "";
    const clean = raw.toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 24);
    return clean ? `:${clean}` : "";
  } catch {
    return "";
  }
}

export function WaitlistForm({
  source = "homepage",
  className = "",
  compact = false,
  onSuccess,
}: {
  source?: string;
  className?: string;
  compact?: boolean;
  onSuccess?: () => void;
}) {
  const id = useId();
  const [state, setState] = useState<State>("idle");
  const [message, setMessage] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const email = inputRef.current?.value.trim() ?? "";
    setState("sending");
    setMessage("");
    try {
      const r = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source: source + channelTag() }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) {
        setState("error");
        setMessage(data.error || "Could not save that. Try again in a moment.");
        return;
      }
      setState("done");
      setMessage("You're on the list. You'll hear from me before anyone else.");
      onSuccess?.();
    } catch {
      setState("error");
      setMessage("Could not reach the server. Try again in a moment.");
    }
  }

  if (state === "done") {
    // The host is rendering its own confirmation. Showing this one too would
    // say the same thing twice.
    if (onSuccess) return null;
    return (
      <p role="status" className={`v3-wl__done ${className}`}>
        <span aria-hidden="true" className="v3-wl__tick">
          <svg viewBox="0 0 20 20" fill="none">
            <path d="M4 10.5 8.2 14.5 16 5.5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="square" />
          </svg>
        </span>
        {message}
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className={`v3-wl ${className}`} noValidate>
      <label htmlFor={id} className="sr-only">
        Email address
      </label>
      <div className={`v3-wl__row ${compact ? "v3-wl__row--compact" : "v3-wl__row--wide"}`}>
        <input
          ref={inputRef}
          id={id}
          type="email"
          name="email"
          required
          autoComplete="email"
          inputMode="email"
          placeholder="your email"
          aria-describedby={message ? `${id}-msg` : undefined}
          aria-invalid={state === "error" || undefined}
          className="v3-input"
        />
        {/* The single most important control on the site during a launch.
            v3 button: gold fill, presses to 97%. While sending it dims and
            stops taking presses, so the press reads as registered. */}
        <button
          type="submit"
          disabled={state === "sending"}
          data-variant="primary"
          className="v3-btn v3-wl__btn"
        >
          {state === "sending" ? "Adding you…" : "Join the waitlist"}
        </button>
      </div>
      {message ? (
        <p
          id={`${id}-msg`}
          role="alert"
          className="v3-wl__msg"
        >
          {message}
        </p>
      ) : null}
    </form>
  );
}
