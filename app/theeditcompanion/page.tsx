import type { Metadata } from "next";
import { CompanionPage } from "@/components/companion/CompanionPage";
import { META, PAGE_PATH } from "@/components/companion/content";
import { loadProduct, metaDescription, priceView } from "@/components/companion/product";

/**
 * /theeditcompanion: the TheEditCompanion product page. LISTED and indexable (owner, 15 Oct):
 * in the sitemap, canonical set, no noindex. Follows the live paper design.
 *
 * The price shown here is display only. The charged price is recomputed on the server at
 * order creation. If the product row cannot be read, loadProduct() falls back to constants
 * and the page still renders.
 */
export const revalidate = 60;

const OG_IMAGE = "/og-image.webp";

export async function generateMetadata(): Promise<Metadata> {
  const view = priceView(await loadProduct());
  const description = metaDescription(view);
  return {
    title: META.title,
    description,
    alternates: { canonical: PAGE_PATH },
    openGraph: {
      title: META.ogTitle,
      description: META.ogDescription,
      url: PAGE_PATH,
      type: "website",
      // A child openGraph replaces the root one wholesale, so the default image is repeated.
      // IMAGE NEEDED: swap for a real 1200x630 screenshot once one exists (SEO-AND-META.md section 6).
      images: [{ url: OG_IMAGE, width: 1456, height: 816, alt: "BigQuiv Digitals" }],
    },
    twitter: {
      card: "summary_large_image",
      title: META.ogTitle,
      description: META.twitterDescription,
      images: [OG_IMAGE],
    },
  };
}

export default async function TheEditCompanionPage() {
  const view = priceView(await loadProduct());
  return <CompanionPage view={view} />;
}
