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
 * the evidence for it — see app/waitlist. A promise baked in here would follow
 * the form onto every surface it is ever dropped into, including ones where it
 * is not true.
 *
 * `onSuccess` lets a host page take over after the signup lands, which is how
 * /waitlist swaps the form out for the Opportunity Map. When it is passed the
 * built-in confirmation line is skipped, because the host is showing its own.
 */
type State = "idle" | "sending" | "done" | "error";

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
        body: JSON.stringify({ email, source }),
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
        className={`text-base font-medium text-accent ${className}`}
      >
        {message}
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className={`w-full ${className}`} noValidate>
      <label htmlFor={id} className="sr-only">
        Email address
      </label>
      <div className={`flex w-full flex-col gap-3 sm:flex-row ${compact ? "sm:max-w-[430px]" : "sm:max-w-[480px]"}`}>
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
          className="min-w-0 flex-1 rounded-lg border border-border bg-bg-secondary px-4 py-3.5 text-base text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
        />
        <button
          type="submit"
          disabled={state === "sending"}
          className="shrink-0 cursor-pointer rounded-lg bg-accent px-7 py-3.5 text-base font-semibold tracking-wide text-[#0A0806] transition-colors hover:bg-accent-hover disabled:opacity-60"
        >
          {state === "sending" ? "Adding you…" : "Join the waitlist"}
        </button>
      </div>
      {message ? (
        <p
          id={`${id}-msg`}
          role="alert"
          className="mt-3 text-sm text-text-secondary"
        >
          {message}
        </p>
      ) : null}
    </form>
  );
}
