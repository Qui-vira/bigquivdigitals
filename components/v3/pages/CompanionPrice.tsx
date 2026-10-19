"use client";

import { useLivePrice } from "@/components/companion/PriceContext";
import { PriceAnchorStack } from "@/components/v3/fx/PriceAnchorStack";

/**
 * The price block on TheEditCompanion, v3: the live tier from the checkout's
 * own PriceContext (display only; the server recomputes every charge), set as
 * a Price Anchor Stack (#25). Only real prices appear: the regular price card
 * drops first, the founders card lands on top. Outside the founders window
 * there is one card, the price.
 */
export function CompanionPrice({ product }: { product: string }) {
  const p = useLivePrice();
  return (
    <PriceAnchorStack className="v3-cpn-price">
      {p.tier === "founders" ? (
        <>
          <div className="v3-cpn-price__card v3-cpn-price__card--then" data-anchor-card>
            <p className="v3-cpn-price__then">Then {p.regularAmount}</p>
          </div>
          <div className="v3-cpn-price__card v3-cpn-price__card--offer" data-anchor-card>
            <p className="v3-cpn-price__product">{product}</p>
            <p className="v3-cpn-price__amount">
              <span>{p.foundersAmount}</span> founders price
            </p>
            {p.foundersUntilLine ? <p className="v3-cpn-price__until">{p.foundersUntilLine}</p> : null}
            {p.usdRef ? <p className="v3-cpn-price__usd">{p.usdRef}</p> : null}
          </div>
        </>
      ) : (
        <div className="v3-cpn-price__card v3-cpn-price__card--offer" data-anchor-card>
          <p className="v3-cpn-price__product">{product}</p>
          <p className="v3-cpn-price__amount">
            <span>{p.regularAmount}</span>
          </p>
          {p.usdRef ? <p className="v3-cpn-price__usd">{p.usdRef}</p> : null}
        </div>
      )}
    </PriceAnchorStack>
  );
}
