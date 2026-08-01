/**
 * The site's canonical origin, in one place.
 *
 * `metadataBase`, `robots.ts` and `sitemap.ts` all need it, and the three
 * drifting apart is exactly how peaceway-online ended up emitting canonical
 * tags and a `Sitemap:` directive pointing at a domain with no DNS. One
 * constant, imported everywhere, means that cannot happen here.
 *
 * No trailing slash — every consumer appends its own path.
 */
export const SITE_URL = "https://bigquivdigitals.com";

export const SITE_NAME = "BigQuiv Digitals";
