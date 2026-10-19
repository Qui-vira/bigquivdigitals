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
        <p className="v3-gate__opening">Opening…</p>
      </div>
    );
  }

  return (
    <div className="doc-page mx-auto">
      <form
        onSubmit={onSubmit}
        noValidate
        className="v3-gate"
      >
        <label htmlFor={id} className="v3-gate__label">
          Enter the code word from the video
        </label>
        <p className="v3-gate__sub">It opens the full workflow and every prompt.</p>
        <div className="v3-gate__row">
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
            className="v3-gate__input"
          />
          <button
            type="submit"
            disabled={busy}
            className="v3-btn v3-btn--lg v3-gate__btn"
          >
            {busy ? "Checking…" : "Open it"}
          </button>
        </div>
        {error && (
          <p
            id={`${id}-err`}
            role="alert"
            className="v3-gate__err"
          >
            {error}
          </p>
        )}
      </form>
    </div>
  );
}
