"use client";

import { useLivePrice } from "@/components/companion/PriceContext";
import { V2_PRICE } from "@/components/companion/content-v2";

/**
 * The v2 sales page's live price lines, in the owner's wording (20 Oct 2026):
 * "Get TheEditCompanion for ₦50,000", "Founders price until November 18, 2026.
 * Regular price: ₦150,000." They follow the live tier, so the cached page
 * switches to the regular price by itself when the founders offer ends.
 */
const naira = (s: string) => s.replace(/^N(?=\d)/, "₦");
const longDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "Africa/Lagos" }) : null;

export function BuyLabel() {
  const p = useLivePrice();
  return <>{`Get TheEditCompanion for ${naira(p.amount)}`}</>;
}

/** "Founders price until November 18, 2026. Regular price: ₦150,000." */
export function FoundersLine() {
  const p = useLivePrice();
  const date = longDate(p.endsAtIso);
  if (p.tier !== "founders") return <>{`Price: ${naira(p.regularAmount)}.`}</>;
  return <>{`${date ? `Founders price until ${date}. ` : ""}Regular price: ${naira(p.regularAmount)}.`}</>;
}

/** The price block: founders title, the big price, the struck regular price, and the end line. */
export function PriceBlock({ children }: { children?: React.ReactNode }) {
  const p = useLivePrice();
  const date = longDate(p.endsAtIso);
  const founders = p.tier === "founders";
  return (
    <div className="v3-sp-price">
      <p className="v3-sp-price__title">{founders ? V2_PRICE.foundersTitle : V2_PRICE.regularTitle}</p>
      <p className="v3-sp-price__amount">{naira(p.amount)}</p>
      {founders ? (
        <p className="v3-sp-price__regular">
          <s>{naira(p.regularAmount)}</s> {V2_PRICE.regularAfter}
        </p>
      ) : null}
      {children}
      {founders && date ? <p className="v3-sp-price__ends">{`Founders offer ends ${date}.`}</p> : null}
    </div>
  );
}
