"use client";

import { useEffect, useId, useState } from "react";

/**
 * The code-word gate for a /doc page whose row has an `access_code`.
 *
 * The page HTML carries no body for these articles. The body comes back from
 * POST /api/doc-unlock only after the server has checked the code. The code the
 * reader typed is kept in localStorage, so a refresh re-asks the server quietly
 * and the page stays open. If the stored code stops working (the code word was
 * changed), it is dropped and the form shows again.
 */
const WRONG = "That's not it. Watch the video again, the code word is in it.";

export default function DocGate({ slug }: { slug: string }) {
  const id = useId();
  const key = `doc-unlock:${slug}`;
  const [code, setCode] = useState("");
  const [html, setHtml] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  // True until the stored code (if any) has been tried, so the form does not flash.
  const [restoring, setRestoring] = useState(true);

  async function unlock(word: string): Promise<boolean> {
    const res = await fetch("/api/doc-unlock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, code: word }),
    });
    if (res.ok) {
      const data = (await res.json()) as { html: string };
      setHtml(data.html);
      try {
        localStorage.setItem(key, word.trim());
      } catch {
        // Storage blocked (private mode, some in-app browsers): it still opens, just not across a refresh.
      }
      return true;
    }
    if (res.status === 401) {
      setError(WRONG);
    } else {
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      setError(data?.error && data.error !== "wrong-code" ? data.error : "Something went wrong. Try again.");
    }
    return false;
  }

  useEffect(() => {
    let saved: string | null = null;
    try {
      saved = localStorage.getItem(key);
    } catch {
      saved = null;
    }
    if (!saved) {
      setRestoring(false);
      return;
    }
    unlock(saved)
      .then((ok) => {
        if (!ok) {
          setError(null);
          try {
            localStorage.removeItem(key);
          } catch {}
        }
      })
      .catch(() => {})
      .finally(() => setRestoring(false));
    // Runs once per slug on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim() || busy) return;
    setBusy(true);
    setError(null);
    try {
      await unlock(code);
    } catch {
      setError("Something went wrong. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  if (html !== null) {
    return <article className="doc-page mx-auto" dangerouslySetInnerHTML={{ __html: html }} />;
  }

  if (restoring) {
    return (
      <div className="doc-page mx-auto" aria-busy="true">
        <p className="font-typewriter text-[13px] font-bold uppercase tracking-[0.08em] text-ink-muted">Opening…</p>
      </div>
    );
  }

  return (
    <div className="doc-page mx-auto">
      <form
        onSubmit={onSubmit}
        noValidate
        className="border-[3px] border-ink bg-paper p-5 shadow-brutal sm:p-7"
      >
        <label htmlFor={id} className="block font-display text-xl font-bold text-ink sm:text-2xl">
          Enter the code word from the video
        </label>
        <p className="mt-2 text-base text-ink-muted">It opens the full workflow and every prompt.</p>
        <div className="mt-5 flex w-full flex-col gap-4 sm:flex-row sm:gap-3">
          <input
            id={id}
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            placeholder="Code word"
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? `${id}-err` : undefined}
            className="min-h-[56px] min-w-0 flex-1 border-[3px] border-ink bg-paper px-4 py-3 text-base text-ink shadow-[inset_3px_3px_0_0_rgba(17,17,17,0.06)] placeholder:text-ink-muted"
          />
          <button
            type="submit"
            disabled={busy}
            className="min-h-[56px] shrink-0 cursor-pointer whitespace-nowrap border-[3px] border-ink bg-gold px-7 py-3 font-display text-base font-bold text-ink shadow-brutal transition-[translate,box-shadow,background-color] duration-150 ease-out hover:-translate-x-[2px] hover:-translate-y-[2px] hover:bg-gold-hover hover:shadow-[8px_8px_0_0_#111111] active:translate-x-[5px] active:translate-y-[5px] active:shadow-[1px_1px_0_0_#111111] disabled:pointer-events-none disabled:translate-x-[3px] disabled:translate-y-[3px] disabled:shadow-[2px_2px_0_0_#111111] disabled:opacity-70"
          >
            {busy ? "Checking…" : "Open it"}
          </button>
        </div>
        {error && (
          <p
            id={`${id}-err`}
            role="alert"
            className="mt-4 inline-block border-2 border-ink bg-gold-tint px-3 py-1.5 text-sm font-semibold text-ink"
          >
            {error}
          </p>
        )}
      </form>
    </div>
  );
}
