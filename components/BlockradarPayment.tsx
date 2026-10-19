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
      <div className="v3-crypto__wait py-8" role="status">
        <Loader2 className="v3-spin" />
        <span>Generating payment address...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="v3-crypto__err" role="alert">
        <p>{error}</p>
        <p>
          DM{" "}
          <a href="https://t.me/Quivira_Ophir" target="_blank" rel="noopener noreferrer">
            @Quivira_Ophir
          </a>{" "}
          to arrange crypto payment directly.
        </p>
      </div>
    );
  }

  if (!paymentData) return null;

  return (
    <div className="v3-crypto">
      {/* Network + token badges */}
      <div className="v3-crypto__tags">
        <span>
          {paymentData.network}
        </span>
        {paymentData.tokens.map((t) => (
          <span key={t}>
            {t}
          </span>
        ))}
      </div>

      {/* QR Code */}
      <div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={paymentData.qrCodeUrl}
          alt="Payment QR Code"
          className="v3-crypto__qr"
        />
      </div>

      {/* Amount box */}
      <div className="v3-crypto__amt">
        <p>Send exactly</p>
        <b>${amount.toLocaleString()} USDC</b>
      </div>

      {/* Address row */}
      <div className="v3-crypto__addr">
        <span>{paymentData.address}</span>
        <button
          type="button"
          onClick={copyAddress}
          aria-label={copied ? "Address copied" : "Copy address"}
         
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        </button>
      </div>

      {/* Polling status */}
      <div className="v3-crypto__wait" role="status">
        <Loader2 className="v3-spin" />
        <span>Waiting for payment confirmation...</span>
      </div>

      <p className="v3-crypto__fine">
        Only send USDC or BUSD on BNB Chain. Other tokens or chains will result in permanent loss.
      </p>
    </div>
  );
}
