"use client";

import { useEffect, useState, useRef } from "react";
import { Copy, Check, Loader2 } from "lucide-react";

interface BlockradarPaymentProps {
  serviceName: string;
  amount: number;
  onSuccess: () => void;
}

interface PaymentAddress {
  address: string;
  qrCodeUrl: string;
  network: string;
  tokens: string[];
}

export function BlockradarPayment({ serviceName, amount, onSuccess }: BlockradarPaymentProps) {
  const [paymentData, setPaymentData] = useState<PaymentAddress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function createAddress() {
      try {
        const res = await fetch("/api/payment/blockradar/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ serviceName, amount }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to create payment address");
        if (cancelled) return;
        setPaymentData(data);
        startPolling(data.address);
      } catch (e: unknown) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load payment address.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    createAddress();
    return () => {
      cancelled = true;
      if (pollRef.current) clearInterval(pollRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serviceName, amount]);

  function startPolling(address: string) {
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(
          `/api/payment/blockradar/create?address=${encodeURIComponent(address)}&check=true`
        );
        const data = await res.json();
        if (data.confirmed) {
          clearInterval(pollRef.current!);
          onSuccess();
        }
      } catch {
        // ignore transient poll errors
      }
    }, 10000);
  }

  async function copyAddress() {
    if (!paymentData?.address) return;
    await navigator.clipboard.writeText(paymentData.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8" role="status">
        <Loader2 className="h-6 w-6 animate-spin text-gold-deep motion-reduce:animate-none" />
        <span className="ml-2 font-typewriter text-sm text-ink-soft">Generating payment address...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-1 border-[3px] border-ink bg-gold-tint p-4" role="alert">
        <p className="text-sm font-semibold text-ink">{error}</p>
        <p className="text-xs text-ink-soft">
          DM{" "}
          <a href="https://t.me/Quivira_Ophir" target="_blank" rel="noopener noreferrer" className="font-bold text-ink underline">
            @Quivira_Ophir
          </a>{" "}
          to arrange crypto payment directly.
        </p>
      </div>
    );
  }

  if (!paymentData) return null;

  return (
    <div className="space-y-4">
      {/* Network + token badges */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="border-2 border-ink bg-gold px-2.5 py-0.5 font-typewriter text-[12px] font-bold uppercase tracking-[0.06em] text-ink">
          {paymentData.network}
        </span>
        {paymentData.tokens.map((t) => (
          <span key={t} className="border-2 border-ink bg-paper px-2.5 py-0.5 font-typewriter text-[12px] font-bold uppercase tracking-[0.06em] text-ink">
            {t}
          </span>
        ))}
      </div>

      {/* QR Code */}
      <div className="flex justify-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={paymentData.qrCodeUrl}
          alt="Payment QR Code"
          className="h-40 w-40 border-[3px] border-ink bg-white p-1 shadow-brutal-sm"
        />
      </div>

      {/* Amount box */}
      <div className="border-[3px] border-ink bg-paper-alt px-4 py-3 text-center">
        <p className="font-typewriter text-xs uppercase tracking-[0.08em] text-ink-soft">Send exactly</p>
        <p className="font-display text-lg font-bold text-ink">${amount.toLocaleString()} USDC</p>
      </div>

      {/* Address row */}
      <div className="flex items-center gap-2 border-[3px] border-ink bg-paper px-3 py-2">
        <span className="flex-1 truncate font-typewriter text-xs text-ink">{paymentData.address}</span>
        <button
          type="button"
          onClick={copyAddress}
          aria-label={copied ? "Address copied" : "Copy address"}
          className="grid h-11 w-11 shrink-0 cursor-pointer place-items-center text-ink transition-colors hover:bg-gold-tint"
        >
          {copied ? <Check className="h-4 w-4 text-gold-deep" /> : <Copy className="h-4 w-4" />}
        </button>
      </div>

      {/* Polling status */}
      <div className="flex items-center justify-center gap-2 text-sm text-ink-soft" role="status">
        <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" />
        <span>Waiting for payment confirmation...</span>
      </div>

      <p className="text-center text-xs text-ink-soft">
        Only send USDC or BUSD on BNB Chain. Other tokens or chains will result in permanent loss.
      </p>
    </div>
  );
}
