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
    <div className="v3-checkout__card">
      <h3 className="v3-checkout__title">{copy.heading}</h3>
      <p className="v3-checkout__product">
        {productName}, {amountLabel} {tierLabel}
      </p>

      {!active ? (
        <p role="status" className="v3-checkout__closed">
          Orders are not open yet. {copy.helpLine}
        </p>
      ) : null}

      <form onSubmit={onSubmit} noValidate className="v3-checkout__form" aria-busy={busy}>
        <div>
          <label htmlFor="tec-name" className="v3-checkout__label">
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
            className="v3-checkout__input"
            disabled={busy || !active}
          />
        </div>

        <div>
          <label htmlFor="tec-email" className="v3-checkout__label">
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
            className="v3-checkout__input"
            disabled={busy || !active}
          />
          <p id="tec-email-help" className="v3-checkout__help">
            {copy.emailHelp}
          </p>
        </div>

        <fieldset className="v3-checkout__methods">
          <legend className="v3-checkout__label">{copy.payChoice}</legend>
          <label className="v3-checkout__method">
            <input type="radio" name="method" value="flutterwave" checked readOnly />
            <span>{copy.optionFlutterwave}</span>
          </label>
          <p className="v3-checkout__crypto">
            <a href={CONTACTS.telegram.href} target="_blank" rel="noopener noreferrer" className="v3-checkout__link">
              {CRYPTO_LINE}
            </a>
          </p>
        </fieldset>

        <div className="v3-checkout__consents">
          <label className="v3-checkout__consent">
            <input
              type="checkbox"
              checked={consentFinal}
              onChange={(e) => setConsentFinal(e.target.checked)}
              disabled={busy || !active}
            />
            <span>{finalText}</span>
          </label>
          <label className="v3-checkout__consent">
            <input
              type="checkbox"
              checked={consentImmediate}
              onChange={(e) => setConsentImmediate(e.target.checked)}
              disabled={busy || !active}
            />
            <span>{immediateText}</span>
          </label>
          <p className="v3-checkout__legal">
            {legalLinks.map((l, i) => (
              <span key={l.href}>
                {i > 0 ? ", " : "Read the "}
                <a href={l.href} target="_blank" rel="noopener noreferrer" className="v3-checkout__link">
                  {l.label}
                </a>
              </span>
            ))}
            .
          </p>
        </div>

        {error ? (
          <p role="alert" className="v3-checkout__error">
            {error}
          </p>
        ) : null}

        <div>
          <p className="v3-checkout__support">{supportLine}</p>
          <button type="submit" disabled={busy || !active} className="v3-btn v3-btn--lg v3-checkout__pay">
            {busy ? "Processing..." : `Pay ${amountLabel}`}
          </button>
          {busy ? (
            <p role="status" className="v3-checkout__working">
              {copy.working}
            </p>
          ) : null}
        </div>
      </form>

      <p className="v3-checkout__foot">{copy.helpLine}</p>
    </div>
  );
}
