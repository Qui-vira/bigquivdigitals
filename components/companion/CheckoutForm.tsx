"use client";

import { useEffect, useRef, useState } from "react";
import { sanitiseSrc } from "@/lib/companion/src";
import { buildCheckoutPayload, interpretCheckoutReply, type ShownTier } from "./checkout-client";
import { CONTACTS, CRYPTO_LINE } from "./content";
import { useLivePrice } from "./PriceContext";

/**
 * The checkout form. The only client component on the product page.
 *
 * It sends NO amount: the server reads price, tier and currency from the product row.
 * Contract with coder B's route (PAYMENTS.md will confirm):
 *   POST /api/companion/checkout
 *   body  { name, email, consentFinal: true, consentImmediate: true, src?: string }
 *   reply { ok: true, paymentLink: string } | { ok: false, error: string }
 * B's handler also returns ref (TEC-...); Flutterwave redirects back to the thanks page with it.
 *
 * The consent wording comes in as props from the server component (lib/companion/consent.ts
 * imports node:crypto, so a client file must not import it).
 */

type Copy = {
  heading: string;
  nameLabel: string;
  emailLabel: string;
  emailHelp: string;
  payChoice: string;
  optionFlutterwave: string;
  working: string;
  errMissing: string;
  errEmail: string;
  errConsent: string;
  errPayment: string;
  errNotConfirmed: string;
  helpLine: string;
};

type Props = {
  productName: string;
  active: boolean;
  finalText: string;
  immediateText: string;
  copy: Copy;
  legalLinks: { href: string; label: string }[];
  supportLine: string;
};

const SRC_KEY = "tec_src";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function readSrc(): string | null {
  let fromUrl: string | null = null;
  try {
    fromUrl = sanitiseSrc(new URLSearchParams(window.location.search).get("src"));
  } catch {
    /* ignore */
  }
  try {
    if (fromUrl) {
      window.sessionStorage.setItem(SRC_KEY, fromUrl);
      return fromUrl;
    }
    return sanitiseSrc(window.sessionStorage.getItem(SRC_KEY));
  } catch {
    return fromUrl;
  }
}

const inputCls =
  "min-h-[48px] w-full border-[3px] border-ink bg-paper px-3.5 py-2.5 text-base text-ink placeholder:text-ink-muted";
const labelCls = "mb-2 block font-typewriter text-[12px] font-bold uppercase tracking-[0.08em] text-ink";
const errCls = "mt-2 inline-block border-2 border-ink bg-gold-tint px-2 py-0.5 text-sm font-semibold text-ink";

export function CheckoutForm({
  productName,
  active,
  finalText,
  immediateText,
  copy,
  legalLinks,
  supportLine,
}: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [consentFinal, setConsentFinal] = useState(false);
  const [consentImmediate, setConsentImmediate] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const inFlight = useRef(false);
  const live = useLivePrice();
  // Set when the server answers 409 price_changed: the buyer must see and confirm the new price.
  const [changed, setChanged] = useState<{ tier: ShownTier; amount: string } | null>(null);
  const shownTier: ShownTier = changed?.tier ?? live.tier;
  const amountLabel = changed?.amount ?? live.amount;
  const tierLabel = changed ? (changed.tier === "founders" ? "founders price" : "price") : live.tierLabel;

  // Capture ?src= on arrival and keep it in sessionStorage, so a buyer who browses and comes
  // back still carries the tag. It is read again at submit time. No state is set here.
  useEffect(() => {
    readSrc();
  }, []);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (inFlight.current) return; // double click guard
    setError("");

    const cleanName = name.trim();
    const cleanEmail = email.trim();
    if (!cleanName || !cleanEmail) return setError(copy.errMissing);
    if (!EMAIL_RE.test(cleanEmail)) return setError(copy.errEmail);
    if (!consentFinal || !consentImmediate) return setError(copy.errConsent);

    const src = readSrc();
    inFlight.current = true;
    setBusy(true);
    try {
      const res = await fetch("/api/companion/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(buildCheckoutPayload({ name: cleanName, email: cleanEmail, shownTier, src })),
      });
      let data: unknown = null;
      try {
        data = await res.json();
      } catch {
        data = null;
      }
      const outcome = interpretCheckoutReply(res.status, data, copy.errPayment);
      if (outcome.kind === "redirect") {
        // Leave the busy state on: the browser is leaving for the hosted payment page.
        window.location.assign(outcome.url);
        return;
      }
      if (outcome.kind === "price_changed") {
        setChanged({ tier: outcome.tier, amount: outcome.amount });
      }
      setError(outcome.message);
    } catch {
      setError(copy.errNotConfirmed);
    }
    inFlight.current = false;
    setBusy(false);
  }

  return (
    <div className="border-[3px] border-ink bg-paper p-5 shadow-brutal sm:p-8">
      <h3 className="font-didone text-[clamp(1.9rem,4vw,2.5rem)] font-semibold leading-tight text-ink">
        {copy.heading}
      </h3>
      <p className="mt-2 text-[16px] text-ink-soft">
        {productName}, {amountLabel} {tierLabel}
      </p>

      {!active ? (
        <p role="status" className="mt-4 text-[16px] font-semibold text-ink">
          Orders are not open yet. {copy.helpLine}
        </p>
      ) : null}

      <form onSubmit={onSubmit} noValidate className="mt-6 space-y-5" aria-busy={busy}>
        <div>
          <label htmlFor="tec-name" className={labelCls}>
            {copy.nameLabel}
          </label>
          <input
            id="tec-name"
            name="name"
            type="text"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={120}
            className={inputCls}
            disabled={busy || !active}
          />
        </div>

        <div>
          <label htmlFor="tec-email" className={labelCls}>
            {copy.emailLabel}
          </label>
          <input
            id="tec-email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            maxLength={254}
            aria-describedby="tec-email-help"
            className={inputCls}
            disabled={busy || !active}
          />
          <p id="tec-email-help" className="mt-2 text-[14px] text-ink-soft">
            {copy.emailHelp}
          </p>
        </div>

        <fieldset className="space-y-2">
          <legend className={labelCls}>{copy.payChoice}</legend>
          <label className="flex min-h-[48px] items-center gap-3 border-[3px] border-ink bg-gold-tint px-3.5 py-2 text-[16px] font-semibold text-ink">
            <input type="radio" name="method" value="flutterwave" checked readOnly className="h-5 w-5 accent-[#111111]" />
            <span>{copy.optionFlutterwave}</span>
          </label>
          <p className="text-[15px] text-ink-soft">
            <a
              href={CONTACTS.telegram.href}
              target="_blank"
              rel="noopener noreferrer"
              className="paper-link font-semibold text-ink"
            >
              {CRYPTO_LINE}
            </a>
          </p>
        </fieldset>

        <div className="space-y-3">
          <label className="flex min-h-[48px] cursor-pointer items-start gap-3 text-[15px] leading-relaxed text-ink">
            <input
              type="checkbox"
              checked={consentFinal}
              onChange={(e) => setConsentFinal(e.target.checked)}
              disabled={busy || !active}
              className="mt-1 h-5 w-5 shrink-0 accent-[#111111]"
            />
            <span>{finalText}</span>
          </label>
          <label className="flex min-h-[48px] cursor-pointer items-start gap-3 text-[15px] leading-relaxed text-ink">
            <input
              type="checkbox"
              checked={consentImmediate}
              onChange={(e) => setConsentImmediate(e.target.checked)}
              disabled={busy || !active}
              className="mt-1 h-5 w-5 shrink-0 accent-[#111111]"
            />
            <span>{immediateText}</span>
          </label>
          <p className="text-[14px] text-ink-soft">
            {legalLinks.map((l, i) => (
              <span key={l.href}>
                {i > 0 ? ", " : "Read the "}
                <a href={l.href} target="_blank" rel="noopener noreferrer" className="paper-link font-semibold text-ink">
                  {l.label}
                </a>
              </span>
            ))}
            .
          </p>
        </div>

        {error ? (
          <p role="alert" className={errCls}>
            {error}
          </p>
        ) : null}

        <div>
          <p className="mb-3 text-[16px] font-semibold text-ink">{supportLine}</p>
          <button
            type="submit"
            disabled={busy || !active}
            className="paper-focus relative inline-flex min-h-[60px] w-full cursor-pointer select-none items-center justify-center border-[3px] border-ink bg-gold px-7 font-display text-lg font-bold text-ink shadow-brutal-gold transition-[translate,box-shadow,background-color] duration-150 hover:bg-gold-hover active:translate-x-[5px] active:translate-y-[5px] active:shadow-[1px_1px_0_0_#E8A33D] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            {busy ? "Processing..." : `Pay ${amountLabel}`}
          </button>
          {busy ? (
            <p role="status" className="mt-3 text-[15px] font-semibold text-ink">
              {copy.working}
            </p>
          ) : null}
        </div>
      </form>

      <p className="mt-6 text-[14px] leading-relaxed text-ink-soft">{copy.helpLine}</p>
    </div>
  );
}
