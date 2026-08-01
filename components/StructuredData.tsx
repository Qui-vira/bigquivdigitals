import { SITE_URL, SITE_NAME } from "@/lib/site";

/**
 * JSON-LD. The site previously emitted none at all, which is what the A5 audit
 * flagged as a P0 — without it a search engine has to infer who this is, what is
 * sold and who to attribute it to, from prose alone.
 *
 * Everything asserted here is already stated publicly on the site or verifiable
 * against a third party. Nothing is added that a visitor cannot also read:
 *
 *   - the CAC registration number is on /about and checkable on the CAC register
 *   - the social profiles are the ones already linked in the footer
 *   - Ophir Digital Education Foundation is named on /about
 *
 * The foundation is modelled as a SEPARATE organisation that the person founded,
 * NOT as part of BigQuiv Digitals. That mirrors the line on /about: the
 * foundation is a non-profit and the paid products are a different entity.
 * Collapsing them here would contradict the page and misrepresent a non-profit.
 */

type Json = Record<string, unknown>;

function Ld({ data }: { data: Json }) {
  return (
    <script
      type="application/ld+json"
      // Next does not serialise JSON-LD for us. The `<` escape prevents a value
      // ever closing the script tag early.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}

const PERSON_ID = `${SITE_URL}/#person`;
const ORG_ID = `${SITE_URL}/#organization`;

export function OrganizationJsonLd() {
  const person: Json = {
    "@type": "Person",
    "@id": PERSON_ID,
    name: "Damilare Samuel",
    alternateName: ["Big Quiv", "Quivira"],
    url: SITE_URL,
    jobTitle: "Founder",
    sameAs: [
      "https://x.com/_Quivira",
      "https://t.me/Quivira_Ophir",
    ],
    founder: {
      "@type": "NGO",
      name: "Ophir Digital Education Foundation",
      identifier: "9071886",
      description:
        "A Nigerian non-profit registered with the Corporate Affairs Commission, teaching Web3 development.",
    },
  };

  const organization: Json = {
    "@type": "Organization",
    "@id": ORG_ID,
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/og-image.webp`,
    description:
      "Growth systems that turn attention into revenue. Website, AI content, community infrastructure, strategy and reporting, built as one system.",
    founder: { "@id": PERSON_ID },
    areaServed: "Worldwide",
    knowsAbout: [
      "Growth systems",
      "Web3 marketing",
      "AI content production",
      "Community infrastructure",
      "Telegram commerce",
    ],
  };

  const website: Json = {
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    url: SITE_URL,
    name: SITE_NAME,
    publisher: { "@id": ORG_ID },
  };

  return <Ld data={{ "@context": "https://schema.org", "@graph": [person, organization, website] }} />;
}

/** Breadcrumbs for any non-home page. */
export function BreadcrumbJsonLd({ items }: { items: Array<{ name: string; path: string }> }) {
  return (
    <Ld
      data={{
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [{ name: "Home", path: "" }, ...items].map((item, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: item.name,
          item: `${SITE_URL}${item.path}`,
        })),
      }}
    />
  );
}
