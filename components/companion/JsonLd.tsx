import { SITE_NAME, SITE_URL } from "@/lib/site";
import { PAGE_PATH, PRODUCT_NAME } from "./content";
import { FAQ, faqJsonLd } from "./faq";
import type { PriceView } from "./product";

/** Same escaped-`<` pattern as components/StructuredData.tsx. */
function Ld({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}

/**
 * Product JSON-LD. Offer is in naira (what is charged). NO review, NO aggregateRating
 * (no reviews exist), NO priceValidUntil (only the product row's own end date could justify it).
 */
export function productJsonLd(view: PriceView, description: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: `${PRODUCT_NAME} by ${SITE_NAME}`,
    brand: { "@type": "Brand", name: SITE_NAME },
    description,
    url: `${SITE_URL}${PAGE_PATH}`,
    offers: {
      "@type": "Offer",
      price: view.amount.replace(/[^0-9]/g, ""),
      priceCurrency: "NGN",
      availability: view.active ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      url: `${SITE_URL}${PAGE_PATH}`,
    },
  };
}

export function CompanionJsonLd({ view, description }: { view: PriceView; description: string }) {
  return (
    <>
      <Ld data={faqJsonLd(FAQ)} />
      <Ld data={productJsonLd(view, description)} />
    </>
  );
}
