"use client";

import { useEffect, useState } from "react";
import { formatPrice } from "@/lib/format-price";

declare global {
  interface Window {
    FlutterwaveCheckout: (config: Record<string, unknown>) => void;
  }
}

interface FlutterwaveButtonProps {
  email: string;
  amount: number;
  currency: string;
  serviceName: string;
  onValidate: () => boolean;
  onSuccess: () => void;
}

export function FlutterwaveButton({
  email,
  amount,
  currency,
  serviceName,
  onValidate,
  onSuccess,
}: FlutterwaveButtonProps) {
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined" && typeof window.FlutterwaveCheckout === "function") {
      // Payment logic left exactly as it was (paper redesign is visual only).
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setScriptLoaded(true);
      return;
    }
    const existing = document.querySelector('script[src="https://checkout.flutterwave.com/v3.js"]');
    if (existing) {
      existing.addEventListener("load", () => setScriptLoaded(true));
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.flutterwave.com/v3.js";
    script.async = true;
    script.onload = () => setScriptLoaded(true);
    document.head.appendChild(script);
  }, []);

  async function handlePay() {
    if (!onValidate()) return;
    if (!scriptLoaded) {
      setError("Payment system loading, please try again.");
      return;
    }

    const publicKey = process.env.NEXT_PUBLIC_FLW_PUBLIC_KEY;
    if (!publicKey) {
      setError("Card payments not yet configured. Contact us directly to pay.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      window.FlutterwaveCheckout({
        public_key: publicKey,
        tx_ref: `QV-${Date.now()}`,
        amount,
        currency,
        payment_options: "card,banktransfer,ussd",
        customer: {
          email,
          name: email.split("@")[0],
        },
        customizations: {
          title: "BigQuiv Digitals",
          description: serviceName,
          logo: "https://bigquivdigitals.com/logo.png",
        },
        callback: async (data: Record<string, unknown>) => {
          if (data.status === "successful") {
            try {
              const res = await fetch("/api/payment/flutterwave/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ transaction_id: data.transaction_id }),
              });
              const result = await res.json();
              if (result.success) {
                onSuccess();
              } else {
                setError("Payment verification failed. DM @Quivira_Ophir with your transaction ID: " + data.transaction_id);
              }
            } catch {
              setError("Verification error. DM @Quivira_Ophir with transaction ID: " + data.transaction_id);
            }
          } else {
            setError("Payment was not completed.");
          }
          setLoading(false);
        },
        onclose: () => setLoading(false),
      });
    } catch {
      setError("Payment failed to launch. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={handlePay}
        disabled={loading}
        className="min-h-[52px] w-full cursor-pointer border-[3px] border-ink bg-gold px-4 py-3 font-display text-base font-bold text-ink shadow-brutal transition-[translate,box-shadow,background-color] duration-150 ease-out hover:-translate-x-[2px] hover:-translate-y-[2px] hover:bg-gold-hover hover:shadow-[8px_8px_0_0_#111111] active:translate-x-[5px] active:translate-y-[5px] active:shadow-[1px_1px_0_0_#111111] disabled:pointer-events-none disabled:opacity-60"
      >
        {loading ? "Processing..." : `Pay ${formatPrice(amount, currency)} with Card / Bank`}
      </button>
      {error && <p role="alert" className="border-2 border-ink bg-gold-tint px-2.5 py-1.5 text-sm font-semibold text-ink">{error}</p>}
    </div>
  );
}
