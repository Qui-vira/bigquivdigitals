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

/** faqItems: the FAQ the page actually shows (FAQPage data must match what is visible). */
export function CompanionJsonLd({
  view,
  description,
  faqItems = FAQ,
}: {
  view: PriceView;
  description: string;
  faqItems?: readonly { question: string; answer: string }[];
}) {
  return (
    <>
      {faqItems.length ? <Ld data={faqJsonLd(faqItems)} /> : null}
      <Ld data={productJsonLd(view, description)} />
    </>
  );
}
