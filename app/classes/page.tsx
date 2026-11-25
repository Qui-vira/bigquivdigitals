import type { Metadata } from "next";
import { ClassesClient, type ClassCard, type CoachingRow } from "@/components/v3/pages/ClassesClient";
import { CLASS_COHORT, CLASS_PRODUCTS, COMBO, classPriceNow } from "@/lib/course-prices";
import { NICHE_CONTENT, COMBO_CONTENT } from "@/lib/classes";
import { classSql, cohortSeatCounts } from "@/lib/class-payments";

/**
 * /classes: the seven AI niches, the combo and one-on-one coaching. LISTED and
 * indexable (owner, 25 Nov 2026): nav, footer, sitemap, canonical, no noindex.
 *
 * WHY "/classes". It is the word the page itself uses ("seven classes"), it is
 * plural because it sells many products, and it does not collide with the two
 * single-course routes that already exist: /aimastery (the original AI class,
 * still unlisted and unchanged) and /greatwork. "/course" was avoided because
 * the repo CLAUDE.md reserves it for a different, not-yet-built page.
 *
 * PRICES. The page shows what the server will accept right now: the early price
 * while fewer than 10 seats are confirmed for that product in the current
 * cohort, then the standard price. The count is read here (revalidated every 60
 * seconds) and again by the payment routes, which are the ones that decide. If
 * the count cannot be read the page charges the STANDARD price and hides the
 * seat count: an overpaying buyer is still confirmed, an early price charged
 * after the seats are gone would not be.
 */
export const revalidate = 60;

export const metadata: Metadata = {
  title: "AI Classes | BigQuiv Digitals",
  description: `Seven AI classes: video editing, UGC, Web3 and DeFi, video creation, trading, vibe coding and agents. Every class starts ${CLASS_COHORT.startsLabel}. The first 10 seats in each are cheaper.`,
  alternates: { canonical: "/classes" },
  openGraph: {
    title: "AI Classes | BigQuiv Digitals",
    description: `Seven AI classes, one combo and one-on-one coaching. First cohort ${CLASS_COHORT.startsLabel}.`,
    url: "/classes",
    type: "website",
    images: [{ url: "/og-image.webp", width: 1456, height: 816, alt: "BigQuiv Digitals" }],
  },
};

async function seatCounts(): Promise<Record<string, number> | null> {
  try {
    return await cohortSeatCounts(classSql());
  } catch (err) {
    console.error("[classes] seat count unavailable:", err instanceof Error ? err.name : "unknown");
    return null;
  }
}

export default async function ClassesPage() {
  const counts = await seatCounts();
  const byNiche = new Map(CLASS_PRODUCTS.map((p) => [p.slug, p]));

  const cards: ClassCard[] = NICHE_CONTENT.map((c) => {
    const p = byNiche.get(c.slug)!;
    return { product: p, content: c, price: classPriceNow(p.slug, counts ? (counts[p.slug] ?? 0) : null) };
  });

  const combo = byNiche.get(COMBO.slug)!;
  const standardSum = cards.reduce((s, c) => s + c.price.standard, 0);
  const comboCard = {
    product: combo,
    line: COMBO_CONTENT.line,
    price: classPriceNow(combo.slug, counts ? (counts[combo.slug] ?? 0) : null),
    standardSum,
    names: cards.map((c) => c.product.name),
  };

  const coaching: CoachingRow[] = cards.map((c) => {
    const two = CLASS_PRODUCTS.find((p) => p.kind === "coaching" && p.niche === c.product.niche && p.weeks === 2)!;
    const three = CLASS_PRODUCTS.find((p) => p.kind === "coaching" && p.niche === c.product.niche && p.weeks === 3)!;
    return {
      niche: c.product.name,
      options: [
        { product: two, amount: classPriceNow(two.slug, null).amount },
        { product: three, amount: classPriceNow(three.slug, null).amount },
      ],
    };
  });

  return <ClassesClient cards={cards} combo={comboCard} coaching={coaching} cohortLabel={CLASS_COHORT.startsLabel} />;
}
