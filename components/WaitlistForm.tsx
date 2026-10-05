"use client";

import { useId, useRef, useState } from "react";

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
      <p
        role="status"
        className={`inline-flex items-center gap-3 border-[3px] border-ink bg-gold-tint px-4 py-3 text-base font-semibold text-ink shadow-brutal-sm ${className}`}
      >
        <span aria-hidden="true" className="grid h-7 w-7 shrink-0 place-items-center rounded-full border-2 border-ink bg-gold text-sm font-bold">
          ✓
        </span>
        {message}
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className={`w-full ${className}`} noValidate>
      <label htmlFor={id} className="sr-only">
        Email address
      </label>
      <div className={`flex w-full flex-col gap-4 sm:flex-row sm:gap-3 ${compact ? "sm:max-w-[460px]" : "sm:max-w-[540px]"}`}>
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
          className="min-h-[56px] min-w-0 flex-1 border-[3px] border-ink bg-paper px-4 py-3 text-base text-ink shadow-[inset_3px_3px_0_0_rgba(17,17,17,0.06)] placeholder:text-ink-muted"
        />
        {/* The single most important control on the site during a launch.
            Paper button: hard shadow, lifts on hover, pushes in on press.
            While sending it stops advertising itself, so the press reads as
            registered. */}
        <button
          type="submit"
          disabled={state === "sending"}
          data-variant="primary"
          className="min-h-[56px] shrink-0 cursor-pointer whitespace-nowrap border-[3px] border-ink bg-gold px-7 py-3 font-display text-base font-bold text-ink shadow-brutal transition-[translate,box-shadow,background-color] duration-150 ease-out hover:-translate-x-[2px] hover:-translate-y-[2px] hover:bg-gold-hover hover:shadow-[8px_8px_0_0_#111111] active:translate-x-[5px] active:translate-y-[5px] active:shadow-[1px_1px_0_0_#111111] disabled:pointer-events-none disabled:translate-x-[3px] disabled:translate-y-[3px] disabled:shadow-[2px_2px_0_0_#111111] disabled:opacity-70"
        >
          {state === "sending" ? "Adding you…" : "Join the waitlist"}
        </button>
      </div>
      {message ? (
        <p
          id={`${id}-msg`}
          role="alert"
          className="mt-4 inline-block border-2 border-ink bg-gold-tint px-3 py-1.5 text-sm font-semibold text-ink"
        >
          {message}
        </p>
      ) : null}
    </form>
  );
}
