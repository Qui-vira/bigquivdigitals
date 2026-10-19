"use client";

import { createContext, useContext, useSyncExternalStore } from "react";
import { BrutalFrame } from "@/components/ui-paper/BrutalFrame";
import type { ShownTier } from "./checkout-client";

/**
 * Live price display.
 *
 * The page is cached (ISR). A cached page can be older than the end of the founders window,
 * so the server-rendered tier is only the starting value. The founders END DATE travels with
 * the page, and the browser switches founders to regular at that instant, with no network
 * call and no timer on screen. Server render and hydration use the server tier (the
 * getServerSnapshot argument), so there is no hydration mismatch.
 *
 * This is display only. The charge is always recomputed on the server, and the checkout form
 * sends the tier the buyer saw (shownTier), so any remaining disagreement (an owner edit, a
 * wrong device clock) becomes a 409 price_changed and no charge, never a silent different charge.
 */
export type PriceData = {
  ssrTier: ShownTier;
  /** ISO instant the founders window ends, only when the product row has one. */
  endsAtIso: string | null;
  foundersAmount: string;
  regularAmount: string;
  /** "Founders price until 14 November 2026", only when the row has an end date and the window was open at render. */
  foundersUntilLine: string | null;
  usdRef: string | null;
};

const Ctx = createContext<PriceData | null>(null);

export function PriceProvider({ data, children }: { data: PriceData; children: React.ReactNode }) {
  return <Ctx.Provider value={data}>{children}</Ctx.Provider>;
}

const MAX_TIMEOUT = 2_147_483_647;

/** The tier to show at a given instant. Pure, so it can be tested. */
export function tierAt(d: Pick<PriceData, "ssrTier" | "endsAtIso">, nowMs: number): ShownTier {
  if (d.ssrTier === "regular") return "regular";
  if (d.endsAtIso && nowMs >= Date.parse(d.endsAtIso)) return "regular";
  return "founders";
}

export type LivePrice = {
  tier: ShownTier;
  amount: string;
  tierLabel: string;
  foundersAmount: string;
  regularAmount: string;
  foundersUntilLine: string | null;
  usdRef: string | null;
};

export function useLivePrice(): LivePrice {
  const d = useContext(Ctx);
  if (!d) throw new Error("PriceProvider missing");
  const tier = useSyncExternalStore(
    (cb) => {
      if (!d.endsAtIso || d.ssrTier === "regular") return () => {};
      const end = Date.parse(d.endsAtIso);
      let timer: ReturnType<typeof setTimeout> | undefined;
      const arm = () => {
        const left = end - Date.now();
        if (left <= 0) return;
        timer = setTimeout(() => {
          cb();
          arm();
        }, Math.min(left, MAX_TIMEOUT));
      };
      arm();
      return () => {
        if (timer) clearTimeout(timer);
      };
    },
    () => tierAt(d, Date.now()),
    () => d.ssrTier,
  );
  return {
    tier,
    amount: tier === "founders" ? d.foundersAmount : d.regularAmount,
    tierLabel: tier === "founders" ? "founders price" : "price",
    foundersAmount: d.foundersAmount,
    regularAmount: d.regularAmount,
    foundersUntilLine: tier === "founders" ? d.foundersUntilLine : null,
    usdRef: d.usdRef,
  };
}

/** Text that follows the live tier. */
export function LiveText({ kind }: { kind: "buyLabel" | "heroLine" }) {
  const p = useLivePrice();
  if (kind === "buyLabel") return <>{`Get TheEditCompanion for ${p.amount}`}</>;
  return (
    <>
      {p.tier === "founders" ? `Founders price. Then ${p.regularAmount}.` : `Price ${p.regularAmount}.`}
      {p.foundersUntilLine ? ` ${p.foundersUntilLine}.` : ""}
    </>
  );
}

/** The gold price panel in the price section. */
export function LivePriceBlock({ product }: { product: string }) {
  const p = useLivePrice();
  return (
    <BrutalFrame tone="gold" shadow="lg" className="mt-8 p-6 sm:p-8">
      <p className="font-display text-[20px] font-bold text-ink">{product}</p>
      {p.tier === "founders" ? (
        <>
          <p className="mt-3 font-didone text-[clamp(2.4rem,7vw,3.6rem)] font-semibold leading-none text-ink">
            {p.foundersAmount} founders price
          </p>
          <p className="mt-2 text-[18px] font-semibold text-ink">Then {p.regularAmount}</p>
        </>
      ) : (
        <p className="mt-3 font-didone text-[clamp(2.4rem,7vw,3.6rem)] font-semibold leading-none text-ink">
          {p.regularAmount}
        </p>
      )}
      {p.foundersUntilLine ? <p className="mt-2 text-[16px] font-semibold text-ink">{p.foundersUntilLine}</p> : null}
      {p.usdRef ? <p className="mt-3 text-[15px] text-ink-soft">{p.usdRef}</p> : null}
    </BrutalFrame>
  );
}
