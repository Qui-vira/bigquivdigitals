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
 *
 * Styled by the v3-thanks__* rules in components/v3/pages/companion.css (navy stage).
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
    <div className="v3-thanks__status" aria-live="polite">
      {status === "pending" ? (
        <p role="status" className="v3-thanks__working">
          {copy.working}
        </p>
      ) : null}

      {status === "paid" ? (
        <div role="status">
          <h2 className="v3-thanks__paid">Payment received</h2>
          <p className="v3-thanks__line">
            {emailSent
              ? "Your download is ready. We also sent it to your email. Open START-HERE first."
              : "Your download is ready. Use the download button below. We are sending the email too; if it does not arrive, message us and we will send it again. Open START-HERE first."}
          </p>
          {downloadUrl ? (
            <a href={downloadUrl} className="v3-btn v3-btn--lg v3-thanks__download">
              Download now
            </a>
          ) : null}
        </div>
      ) : null}

      {status === "failed" ? (
        <p role="alert" className="v3-thanks__line v3-thanks__alert">
          {copy.errPayment}
        </p>
      ) : null}

      {status === "timeout" ? (
        <p role="alert" className="v3-thanks__line v3-thanks__alert">
          {copy.errNotConfirmed}
        </p>
      ) : null}
    </div>
  );
}
