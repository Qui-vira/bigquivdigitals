/**
 * /classes markup for the three seat states, rendered without a database:
 * seats left (early price), full (standard price) and count unknown (standard
 * price, no seat line). Also: listed in the sitemap, no noindex.
 *
 * Run: npx tsx --import ./tests/css-stub.mjs --test tests/classes/classes-page.test.tsx
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { ClassesClient, type ClassCard } from "../../components/v3/pages/ClassesClient";
import { CLASS_PRODUCTS, classPriceNow, classProduct } from "../../lib/course-prices";
import { NICHE_CONTENT } from "../../lib/classes";

function render(counts: Record<string, number> | null) {
  const cards: ClassCard[] = NICHE_CONTENT.map((c) => ({
    product: classProduct(c.slug)!,
    content: c,
    price: classPriceNow(c.slug, counts ? (counts[c.slug] ?? 0) : null),
  }));
  const combo = classProduct("ai-mastery-combo")!;
  // React separates adjacent text with <!-- -->; drop it so the text reads as a person sees it.
  return renderToStaticMarkup(
    <ClassesClient
      cards={cards}
      combo={{ product: combo, line: "x", price: classPriceNow(combo.slug, counts ? (counts[combo.slug] ?? 0) : null), standardSum: 380000, names: [] }}
      coaching={[{ niche: "AI Agents", options: CLASS_PRODUCTS.filter((p) => p.slug.startsWith("coaching-agents")).map((p) => ({ product: p, amount: classPriceNow(p.slug, null).amount })) }]}
      cohortLabel="Monday 4 January 2027"
    />,
  ).replace(/<!-- -->/g, "");
}

function card(html: string, slug: string): string {
  const start = html.indexOf(`data-slug="${slug}"`);
  assert.ok(start > 0, slug);
  // Up to the next product (the cards hold lists of their own, so not the first </li>).
  const next = html.indexOf("data-slug=", start + 10);
  return html.slice(start, next === -1 ? undefined : next);
}

test("seats left: the early price, the seats left and the price after", () => {
  const html = render({ "ai-video-editing": 7, "ai-mastery-combo": 0 });
  const c = card(html, "ai-video-editing");
  assert.ok(c.includes("Pay ₦27,000"));
  assert.ok(c.includes("first 10 seats"));
  assert.match(c, /3<\/span> of 10 early seats left\. Then ₦45,000\./);
  assert.ok(html.includes("Pay ₦175,000"));
});

test("full: the standard price, the early seats are gone", () => {
  const html = render({ "ai-video-editing": 10, "ai-agents": 12 });
  const c = card(html, "ai-video-editing");
  assert.ok(c.includes("Pay ₦45,000") && !c.includes("Pay ₦27,000"));
  assert.ok(c.includes("The 10 early seats are gone."));
  assert.ok(card(html, "ai-agents").includes("Pay ₦65,000"));
});

test("count unknown: the standard price and no seat count", () => {
  const html = render(null);
  const c = card(html, "ai-trading");
  assert.ok(c.includes("Pay ₦55,000"));
  assert.ok(!c.includes("early seats left"));
  assert.ok(html.includes("Pay ₦280,000"));
});

test("coaching buttons, the cohort date, the class rules, light sections only, no em dashes", () => {
  const html = render({});
  assert.ok(html.includes("2 weeks · ₦290,000") && html.includes("3 weeks · ₦430,000"));
  assert.ok(html.includes("Starts Monday 4 January 2027"));
  assert.ok(card(html, "ai-trading").includes("No financial advice and no profit claims."));
  assert.ok(card(html, "ai-web3-defi").includes("No financial advice and no profit claims."));
  assert.ok(!html.includes("v3-section--navy"), "light only");
  assert.ok(!html.includes("—"), "no em dash");
});

test("/classes is in the sitemap, the nav and the footer, and the page sets no noindex", async () => {
  const sitemap = (await import("../../app/sitemap")).default;
  const urls = (await sitemap()).map((e) => e.url);
  assert.ok(urls.includes("https://bigquivdigitals.com/classes"));
  const { metadata } = await import("../../app/classes/page");
  assert.equal((metadata as { robots?: unknown }).robots, undefined);
  assert.equal((metadata.alternates as { canonical: string }).canonical, "/classes");
  const { readFileSync } = await import("node:fs");
  assert.match(readFileSync("components/Navbar.tsx", "utf8"), /href: "\/classes"/);
  assert.match(readFileSync("components/FooterClient.tsx", "utf8"), /href: "\/classes"/);
});

test("My purchases view: a buyer with only class seats sees them, with no download button", async () => {
  const { default: MyPurchasesViewPage } = await import("../../app/my-purchases/view/page");
  const { PURCHASES_SECRET_ENV, signPurchasesToken } = await import("../../lib/companion/purchases-link");
  const { setRuntimeForTests } = await import("../../lib/companion/runtime");
  const { DeliveryMemoryStore } = await import("../../lib/companion/delivery-memory");
  const SECRET = "classes-test-secret-classes-test-secret-0123";
  const NOW = new Date("2026-12-01T12:00:00Z");
  process.env[PURCHASES_SECRET_ENV] = SECRET;
  const asked: string[] = [];
  setRuntimeForTests({
    store: new DeliveryMemoryStore(),
    files: {} as never,
    sender: { send: async () => ({ ok: true }) },
    notifier: { alertOwner: async () => true },
    baseUrl: "https://example.test",
    ipSalt: "salt",
    now: () => NOW,
    courses: {
      async listByEmail(email: string) {
        asked.push(email);
        return [
          { slug: "coaching-agents-3w", amount: 430000, currency: "NGN", txRef: "CO3-AGENT-1", createdAt: NOW },
          { slug: "ai-video-editing", amount: 27000, currency: "NGN", txRef: "CLS-EDIT-1", createdAt: NOW },
          { slug: "ai-content-mastery", amount: 27000, currency: "NGN", txRef: "QV-1", createdAt: new Date("2026-05-01T10:00:00Z") },
        ];
      },
    },
  });
  try {
    const t = signPurchasesToken("ada@example.com", NOW, SECRET);
    const html = renderToStaticMarkup(await MyPurchasesViewPage({ searchParams: Promise.resolve({ t }) })).replace(/<!-- -->/g, "");
    assert.deepEqual(asked, ["ada@example.com"]);
    assert.ok(html.includes("AI Agents coaching, 3 weeks") && html.includes("N430,000") && html.includes("CO3-AGENT-1"));
    assert.ok(html.includes("We contact you within 24 hours of payment to book your sessions."));
    assert.ok(html.includes("AI Video Editing") && html.includes("Seat confirmed") && html.includes("Monday 4 January 2027"));
    assert.ok(html.includes("AI Mastery") && html.includes("1 May 2026"));
    assert.ok(!html.includes("We found no orders"));
    assert.ok(!html.includes("/api/companion/purchases/download"), "nothing to download for a class");
  } finally {
    setRuntimeForTests(null);
  }
});
