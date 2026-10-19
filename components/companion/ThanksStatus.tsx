"use client";

import { useEffect, useState } from "react";

/**
 * Polls the order status after the hosted payment page sends the buyer back.
 *
 * Contract (lib/companion/DELIVERY.md): GET /api/companion/order-status?ref=TEC-... with the
 * httpOnly claim cookie tec_claim. Reply { status: "pending" | "paid" | "failed", downloadUrl? }.
 * downloadUrl comes only when paid and the cookie matches. A wrong cookie or unknown ref gives
 * 404 { error: "not_found" }, which is retried and ends in the "could not confirm" message.
 * emailSent (added by D): the "we also sent it to your email" line shows only when it is true.
 * The download button is only what the response provides (a separate 24 h, 2 download link
 * that the server also keeps in the httpOnly cookie tec_dl).
 */

type Status = "pending" | "paid" | "failed";
type Reply = { status?: Status; downloadUrl?: string; emailSent?: boolean };

type Copy = {
  working: string;
  errPayment: string;
  errNotConfirmed: string;
};

/** Accept a relative path or a same-origin absolute URL only. */
function safeDownloadUrl(u: unknown): string | null {
  if (typeof u !== "string" || !u) return null;
  if (u.startsWith("/") && !u.startsWith("//")) return u;
  try {
    const parsed = new URL(u);
    return parsed.origin === window.location.origin ? parsed.toString() : null;
  } catch {
    return null;
  }
}

const INTERVAL_MS = 3000;
const MAX_TRIES = 40; // about 2 minutes

export function ThanksStatus({ copy, orderRef }: { copy: Copy; orderRef: string | null }) {
  const [status, setStatus] = useState<Status | "timeout">(orderRef ? "pending" : "timeout");
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);

  useEffect(() => {
    if (!orderRef) return;
    const ref: string = orderRef;
    let stopped = false;
    let tries = 0;
    let paidPolls = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;

    async function tick() {
      tries += 1;
      try {
        const res = await fetch(`/api/companion/order-status?ref=${encodeURIComponent(ref)}`, {
          cache: "no-store",
          credentials: "same-origin",
        });
        const data = (await res.json()) as Reply;
        if (stopped) return;
        if (data.status === "paid") {
          const url = safeDownloadUrl(data.downloadUrl);
          setDownloadUrl(url);
          setEmailSent(data.emailSent === true);
          setStatus("paid");
          // Keep polling a little longer so the email line and the link stay current.
          paidPolls += 1;
          if (data.emailSent === true || paidPolls >= 10) return;
          timer = setTimeout(tick, INTERVAL_MS);
          return;
        }
        if (data.status === "failed") {
          setStatus("failed");
          return;
        }
      } catch {
        /* network blip: try again */
      }
      if (stopped) return;
      if (paidPolls > 0) return; // paid already shown; never replace it with a timeout
      if (tries >= MAX_TRIES) {
        setStatus("timeout");
        return;
      }
      timer = setTimeout(tick, INTERVAL_MS);
    }

    tick();
    return () => {
      stopped = true;
      if (timer) clearTimeout(timer);
    };
  }, [orderRef]);

  return (
    <div className="border-[3px] border-ink bg-paper p-6 shadow-brutal sm:p-8" aria-live="polite">
      {status === "pending" ? (
        <p role="status" className="font-display text-[22px] font-bold text-ink">
          {copy.working}
        </p>
      ) : null}

      {status === "paid" ? (
        <div role="status">
          <h2 className="font-didone text-[clamp(1.9rem,4vw,2.75rem)] font-semibold leading-tight text-ink">
            Payment received
          </h2>
          <p className="mt-3 max-w-[60ch] text-[17px] leading-relaxed text-ink-soft">
            {emailSent
              ? "Your download is ready. We also sent it to your email. Open START-HERE first."
              : "Your download is ready. Use the download button below. We are sending the email too; if it does not arrive, message us and we will send it again. Open START-HERE first."}
          </p>
          {downloadUrl ? (
            <a
              href={downloadUrl}
              className="paper-focus mt-5 inline-flex min-h-[52px] items-center justify-center border-[3px] border-ink bg-gold px-6 font-display text-base font-bold text-ink shadow-brutal-gold hover:bg-gold-hover"
            >
              Download now
            </a>
          ) : null}
        </div>
      ) : null}

      {status === "failed" ? (
        <p role="alert" className="max-w-[60ch] text-[17px] font-semibold leading-relaxed text-ink">
          {copy.errPayment}
        </p>
      ) : null}

      {status === "timeout" ? (
        <p role="alert" className="max-w-[60ch] text-[17px] font-semibold leading-relaxed text-ink">
          {copy.errNotConfirmed}
        </p>
      ) : null}
    </div>
  );
}
