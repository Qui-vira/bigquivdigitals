"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { FlutterwaveButton } from "./FlutterwaveButton";
import { formatPrice } from "@/lib/format-price";
import { BlockradarPayment } from "./BlockradarPayment";

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
    <div
      className="paper-scope fixed inset-0 z-[9999] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pay-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-ink/55"
        onClick={onClose}
      />

      {/* Modal: a framed sheet of paper with a hard shadow. */}
      <div className="relative z-10 max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto border-[3px] border-ink bg-paper p-6 text-ink shadow-[10px_10px_0_0_#E8A33D] motion-safe:animate-[paper-drop_0.4s_cubic-bezier(0.16,1,0.3,1)_both] sm:p-7">
        {/* Header */}
        <div className="mb-6 flex items-start justify-between gap-4 border-b-2 border-dashed border-ink/40 pb-5">
          <div>
            <p className="font-typewriter text-[12px] font-bold uppercase tracking-[0.1em] text-ink-soft">Complete your purchase</p>
            <h3 id="pay-title" className="mt-1.5 font-display text-lg font-bold tracking-[-0.01em] text-ink">{serviceName}</h3>
            <p className="mt-1 font-didone text-[2.75rem] font-semibold leading-none text-ink tabular-nums">
              {formatPrice(amount, currency)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid h-11 w-11 shrink-0 cursor-pointer place-items-center border-[3px] border-ink bg-paper text-ink shadow-brutal-sm transition-[background-color,translate,box-shadow] duration-150 hover:bg-gold-tint active:translate-x-[3px] active:translate-y-[3px] active:shadow-none"
          >
            <X className="h-5 w-5" strokeWidth={2.5} />
          </button>
        </div>

        {paymentStatus === "success" ? (
          /* Success state */
          <div className="py-8 text-center" role="status">
            <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full border-[3px] border-ink bg-gold text-3xl font-bold text-ink shadow-brutal-sm">✓</div>
            <p className="font-display text-xl font-bold text-ink">Payment Confirmed!</p>
            <p className="mt-2 text-sm text-ink-soft">
              {calPaidUrl
                ? "Opening your booking link in a moment..."
                : "Check your email for next steps."}
            </p>
          </div>
        ) : (
          <>
            {/* Email input */}
            <div className="mb-5">
              <label htmlFor="pay-email" className="mb-2 block font-typewriter text-[12px] font-bold uppercase tracking-[0.08em] text-ink">
                Your Email <span className="normal-case tracking-normal text-ink-soft">(for receipt + access)</span>
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
                className="min-h-[48px] w-full border-[3px] border-ink bg-paper px-3.5 py-2.5 text-base text-ink placeholder:text-ink-muted"
              />
              {emailError && (
                <p id="pay-email-error" role="alert" className="mt-2 inline-block border-2 border-ink bg-gold-tint px-2 py-0.5 text-sm font-semibold text-ink">
                  {emailError}
                </p>
              )}
            </div>

            {/* Tab switcher */}
            <div className="mb-5 flex gap-2">
              <button
                type="button"
                onClick={() => setTab("fiat")}
                aria-pressed={tab === "fiat"}
                className={`min-h-[44px] flex-1 cursor-pointer border-[3px] border-ink px-4 py-2 font-typewriter text-[13px] font-bold uppercase tracking-[0.06em] transition-colors ${
                  tab === "fiat"
                    ? "bg-ink text-paper"
                    : "bg-paper text-ink hover:bg-gold-tint"
                }`}
              >
                Card / Bank
              </button>
              {cryptoAvailable && (
                <button
                  type="button"
                  onClick={() => setTab("crypto")}
                  aria-pressed={tab === "crypto"}
                  className={`min-h-[44px] flex-1 cursor-pointer border-[3px] border-ink px-4 py-2 font-typewriter text-[13px] font-bold uppercase tracking-[0.06em] transition-colors ${
                    tab === "crypto"
                      ? "bg-ink text-paper"
                      : "bg-paper text-ink hover:bg-gold-tint"
                  }`}
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

            <p className="mt-5 text-center font-typewriter text-[12px] text-ink-muted">
              Secured by Flutterwave &amp; Blockradar · 256-bit SSL
            </p>
          </>
        )}
      </div>
    </div>
  );
}
