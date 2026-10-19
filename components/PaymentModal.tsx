"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { FlutterwaveButton } from "./FlutterwaveButton";
import { formatPrice } from "@/lib/format-price";
import { BlockradarPayment } from "./BlockradarPayment";
import "@/components/v3/pages/course.css";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  serviceName: string;
  amount: number;
  currency?: string;
  calPaidUrl?: string;
  /**
   * The price in USD, for the crypto tab only.
   *
   * ⚠ THIS EXISTS BECAUSE THE CRYPTO RAIL IS USD-ONLY AND THIS MODAL WAS NOT.
   * `BlockradarPayment` renders whatever number it is handed as `$N USDC`.
   * Until 2026-08-16 the modal passed `amount` straight through regardless of
   * `currency`, so the first non-USD product to use it — The Great Work at
   * ₦15,000 — would have asked a crypto buyer for **15,000 USDC**, roughly a
   * thousand times the price.
   *
   * So when `currency` is not USD, the crypto tab appears only if a real USD
   * figure is supplied here. No figure, no crypto tab. It is never guessed and
   * never converted at a rate baked into the code: NGN/USD moves, and a stale
   * constant is how you undercharge for a year without noticing. Pull live FX,
   * set the number, revisit when it drifts.
   */
  cryptoAmountUsd?: number;
}

export function PaymentModal({
  isOpen,
  onClose,
  serviceName,
  amount,
  currency = "USD",
  calPaidUrl,
  cryptoAmountUsd,
}: PaymentModalProps) {
  const [tab, setTab] = useState<"fiat" | "crypto">("fiat");
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [paymentStatus, setPaymentStatus] = useState<"idle" | "success">("idle");

  // Lock body scroll when open, reset state on close
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      // Payment logic left exactly as it was (paper redesign is visual only).
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTab("fiat");
      setEmail("");
      setEmailError("");
      setPaymentStatus("idle");
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // The crypto rail prices in USD only. Show it when the product is priced in
  // USD, or when an explicit USD figure was supplied for it. Otherwise hide the
  // tab entirely rather than show a wrong number.
  const cryptoUsd = currency.toUpperCase() === "USD" ? amount : cryptoAmountUsd;
  const cryptoAvailable = typeof cryptoUsd === "number" && cryptoUsd > 0;

  if (!isOpen) return null;

  function validateEmail(): boolean {
    const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!valid) {
      setEmailError("A valid email is required for your receipt.");
      return false;
    }
    setEmailError("");
    return true;
  }

  function handleSuccess() {
    setPaymentStatus("success");
    if (calPaidUrl) {
      setTimeout(() => {
        window.open(calPaidUrl, "_blank");
        onClose();
      }, 2500);
    }
  }

  return (
    <div className="v3-pay" role="dialog" aria-modal="true" aria-labelledby="pay-title">
      {/* Backdrop */}
      <div className="v3-pay__backdrop" onClick={onClose} />

      {/* Modal: a paper sheet on a navy veil (v3 rebuild, visual only). */}
      <div className="v3-pay__sheet">
        {/* Header */}
        <div className="v3-pay__head">
          <div>
            <p className="v3-pay__kicker">Complete your purchase</p>
            <h3 id="pay-title" className="v3-pay__name">{serviceName}</h3>
            <p className="v3-pay__amount">{formatPrice(amount, currency)}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="v3-pay__close">
            <X className="h-5 w-5" strokeWidth={2.25} />
          </button>
        </div>

        {paymentStatus === "success" ? (
          /* Success state */
          <div className="v3-pay__ok" role="status">
            <div className="v3-pay__ok-mark" aria-hidden="true">
              <svg viewBox="0 0 20 20" fill="none">
                <path d="M4 10.5 8.2 14.5 16 5.5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="square" />
              </svg>
            </div>
            <p className="v3-pay__ok-h">Payment Confirmed!</p>
            <p className="v3-pay__ok-p">
              {calPaidUrl
                ? "Opening your booking link in a moment..."
                : "Check your email for next steps."}
            </p>
          </div>
        ) : (
          <>
            {/* Email input */}
            <div className="mb-5">
              <label htmlFor="pay-email" className="v3-pay__label">
                Your Email <span>(for receipt + access)</span>
              </label>
              <input
                id="pay-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setEmailError(""); }}
                placeholder="you@example.com"
                aria-invalid={emailError ? true : undefined}
                aria-describedby={emailError ? "pay-email-error" : undefined}
                className="v3-input w-full"
              />
              {emailError && (
                <p id="pay-email-error" role="alert" className="v3-pay__err">
                  {emailError}
                </p>
              )}
            </div>

            {/* Tab switcher */}
            <div className="v3-tabs">
              <button
                type="button"
                onClick={() => setTab("fiat")}
                aria-pressed={tab === "fiat"}
              >
                Card / Bank
              </button>
              {cryptoAvailable && (
                <button
                  type="button"
                  onClick={() => setTab("crypto")}
                  aria-pressed={tab === "crypto"}
                >
                  Crypto (USDC/BUSD)
                </button>
              )}
            </div>

            {/* Payment panel */}
            {tab === "fiat" || !cryptoAvailable ? (
              <FlutterwaveButton
                email={email}
                amount={amount}
                currency={currency}
                serviceName={serviceName}
                onValidate={validateEmail}
                onSuccess={handleSuccess}
              />
            ) : (
              /* cryptoUsd, never `amount`. Blockradar prices in USD only. */
              <BlockradarPayment
                serviceName={serviceName}
                amount={cryptoUsd as number}
                onSuccess={handleSuccess}
              />
            )}

            <p className="v3-pay__foot">
              Secured by Flutterwave &amp; Blockradar · 256-bit SSL
            </p>
          </>
        )}
      </div>
    </div>
  );
}
