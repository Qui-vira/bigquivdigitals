/**
 * Page checks for /theeditcompanion and the legal pages. No server, no env, no database.
 * Run: npx tsx --import ./tests/css-stub.mjs --test tests/companion/page.test.tsx
 *
 * Proves: one H1; FAQ JSON-LD equals the visible FAQ (and the FAQ in SEO-AND-META.md); no em
 * or en dashes in rendered strings; every sentence on the page exists in the copy files or is
 * on the reviewed allow-list below; no review or rating fields in JSON-LD; metadata lengths;
 * founders line only with a real date; hidden blocks stay hidden; the page needs no database.
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { test } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { CompanionPage } from "@/components/companion/CompanionPage";
import { CONTACTS, FLAGS, INSTALL_STATUS, META, SUPPORT_LINE } from "@/components/companion/content";
import { FAQ } from "@/components/companion/faq";
import { buildCheckoutPayload, interpretCheckoutReply } from "@/components/companion/checkout-client";
import { tierAt } from "@/components/companion/PriceContext";
import { FALLBACK_PRODUCT, loadProduct, metaDescription, priceView } from "@/components/companion/product";
import { generateMetadata } from "@/app/theeditcompanion/page";
import ThanksPage from "@/app/theeditcompanion/thanks/page";
import TermsPage from "@/app/terms/page";
import PrivacyPage from "@/app/privacy/page";
import LicencePage from "@/app/licence/page";

const COPY_DIR = "C:/Projects/ContentBrain/business-blueprint/marketing/sales-page";
const COPY_FILES = ["SALES-PAGE-COPY.md", "SEO-AND-META.md"];
const haveCopy = COPY_FILES.every((f) => existsSync(`${COPY_DIR}/${f}`));

const NOW = new Date("2026-11-01T12:00:00Z");
const view = priceView(FALLBACK_PRODUCT, NOW);
const html = renderToStaticMarkup(<CompanionPage view={view} />);

function decode(s: string): string {
  return s
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

function jsonLdBlocks(h: string): Record<string, unknown>[] {
  const out: Record<string, unknown>[] = [];
  for (const m of h.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    out.push(JSON.parse(m[1].replace(/\\u003c/g, "<")));
  }
  return out;
}

function textNodes(h: string): string[] {
  const noScripts = h.replace(/<script[\s\S]*?<\/script>/g, "").replace(/<!-- -->/g, "");
  return noScripts
    .split(/<[^>]+>/)
    .map((t) => decode(t).replace(/\s+/g, " ").trim())
    .filter((t) => t.length > 0);
}

function visibleText(h: string): string {
  return textNodes(h).join("\n");
}

const norm = (s: string) =>
  s
    .toLowerCase()
    .replace(/[\u2192]/g, " ")
    .replace(/[\s]+/g, " ")
    .replace(/[.,:;!?"`*]/g, "")
    .trim();

test("one H1 on every page", async () => {
  for (const [name, markup] of [
    ["product", html],
    ["thanks", renderToStaticMarkup(await ThanksPage({}))],
    ["terms", renderToStaticMarkup(<TermsPage />)],
    ["privacy", renderToStaticMarkup(<PrivacyPage />)],
    ["licence", renderToStaticMarkup(<LicencePage />)],
  ] as const) {
    assert.equal((markup.match(/<h1[\s>]/g) ?? []).length, 1, `${name} must have exactly one h1`);
  }
});

test("FAQ JSON-LD equals the visible FAQ, word for word", () => {
  const faqLd = jsonLdBlocks(html).find((b) => b["@type"] === "FAQPage") as {
    mainEntity: { name: string; acceptedAnswer: { text: string } }[];
  };
  assert.ok(faqLd, "FAQPage JSON-LD present");
  const qs = [...html.matchAll(/<span data-faq-q="[^"]*">([\s\S]*?)<\/span>/g)].map((m) => decode(m[1]));
  const as = [...html.matchAll(/<p data-faq-a="[^"]*"[^>]*>([\s\S]*?)<\/p>/g)].map((m) => decode(m[1]));
  assert.equal(qs.length, FAQ.length);
  assert.equal(as.length, FAQ.length);
  assert.deepEqual(
    faqLd.mainEntity.map((e) => [e.name, e.acceptedAnswer.text]),
    qs.map((q, i) => [q, as[i]]),
  );
  assert.deepEqual(
    qs.map((q, i) => [q, as[i]]),
    FAQ.map((f) => [f.question, f.answer]),
  );
});

test("FAQ equals the FAQ block in SEO-AND-META.md", { skip: !haveCopy }, () => {
  const seo = readFileSync(`${COPY_DIR}/SEO-AND-META.md`, "utf8");
  const json = seo.match(/```json\s*([\s\S]*?)```/)![1];
  const ld = JSON.parse(json) as { mainEntity: { name: string; acceptedAnswer: { text: string } }[] };
  assert.deepEqual(
    ld.mainEntity.map((e) => [e.name, e.acceptedAnswer.text]),
    FAQ.map((f) => [f.question, f.answer]),
  );
});

test("no review or rating fields in JSON-LD", () => {
  const bad = /review|rating/i;
  const walk = (v: unknown, path: string) => {
    if (Array.isArray(v)) return v.forEach((x, i) => walk(x, `${path}[${i}]`));
    if (v && typeof v === "object") {
      for (const [k, x] of Object.entries(v)) {
        assert.ok(!bad.test(k), `JSON-LD key "${path}.${k}" must not exist`);
        walk(x, `${path}.${k}`);
      }
    }
  };
  const blocks = jsonLdBlocks(html);
  assert.equal(blocks.length, 2);
  blocks.forEach((b, i) => walk(b, `ld${i}`));
  const product = blocks.find((b) => b["@type"] === "Product") as { offers: Record<string, unknown> };
  assert.equal(product.offers.priceCurrency, "NGN");
  assert.equal(product.offers.price, "50000");
  assert.ok(!("priceValidUntil" in product.offers));
});

test("no em dashes or en dashes in any rendered string", async () => {
  const strings = [
    html,
    renderToStaticMarkup(await ThanksPage({})),
    renderToStaticMarkup(<TermsPage />),
    renderToStaticMarkup(<PrivacyPage />),
    renderToStaticMarkup(<LicencePage />),
    JSON.stringify(META),
    JSON.stringify(FAQ),
  ];
  for (const s of strings) assert.ok(!/[\u2014\u2013]/.test(s), "found an em or en dash");
});

test("metadata: lengths, canonical, indexable", async () => {
  // No database here, so read the constants the way the production build does.
  const savedPhase = process.env.NEXT_PHASE;
  process.env.NEXT_PHASE = "phase-production-build";
  const m = await generateMetadata().finally(() => {
    if (savedPhase === undefined) delete process.env.NEXT_PHASE;
    else process.env.NEXT_PHASE = savedPhase;
  });
  assert.equal(String(m.title).length, 59);
  assert.equal(String(m.description).length, 149);
  assert.equal(m.alternates?.canonical, "/theeditcompanion");
  assert.equal(m.robots, undefined, "no noindex");
  assert.equal(m.openGraph?.title, "TheEditCompanion by BigQuiv Digitals");
  assert.equal(m.twitter?.title, "TheEditCompanion by BigQuiv Digitals");
  assert.equal(metaDescription(priceView({ ...FALLBACK_PRODUCT, foundersMinor: 0 }, new Date("2030-01-01"))).includes("$113"), false);
});

test("product read: throws at request time, constants only during the production build", async () => {
  const savedUrl = process.env.DATABASE_URL;
  const savedPhase = process.env.NEXT_PHASE;
  delete process.env.DATABASE_URL;
  try {
    delete process.env.NEXT_PHASE;
    await assert.rejects(() => loadProduct(), "request time: must throw so ISR keeps the last good page");
    process.env.NEXT_PHASE = "phase-development-server";
    await assert.rejects(() => loadProduct());
    process.env.NEXT_PHASE = "phase-production-build";
    const p = await loadProduct();
    assert.equal(p.foundersMinor, 5_000_000);
    assert.equal(p.regularMinor, 15_000_000);
  } finally {
    if (savedUrl !== undefined) process.env.DATABASE_URL = savedUrl;
    if (savedPhase === undefined) delete process.env.NEXT_PHASE;
    else process.env.NEXT_PHASE = savedPhase;
  }
});

test("page renders from a product value without a database; naira prices and dollar reference shown", () => {
  assert.equal(view.amount, "N50,000");
  assert.equal(view.regularAmount, "N150,000");
  const t = visibleText(html);
  assert.ok(t.includes("Get TheEditCompanion for N50,000"));
  assert.ok(t.includes("Pay N50,000"));
  assert.ok(t.includes("$38") && t.includes("$113"), "dollar reference shown");
});

test("live tier: the cached page switches to regular at the founders end instant, never back", () => {
  const end = "2026-11-14T00:00:00.000Z";
  const d = { ssrTier: "founders" as const, endsAtIso: end };
  assert.equal(tierAt(d, Date.parse(end) - 1), "founders");
  assert.equal(tierAt(d, Date.parse(end)), "regular");
  assert.equal(tierAt(d, Date.parse(end) + 86_400_000 * 30), "regular");
  assert.equal(tierAt({ ssrTier: "regular", endsAtIso: end }, 0), "regular");
  assert.equal(tierAt({ ssrTier: "founders", endsAtIso: null }, 9e15), "founders");
  // the end date travels with the cached HTML only as data for the switch, never as a timer on screen
  const datedHtml = renderToStaticMarkup(
    <CompanionPage view={priceView({ ...FALLBACK_PRODUCT, foundersEndsAt: new Date(end) }, NOW)} />,
  );
  assert.ok(!/countdown|timer/i.test(visibleText(datedHtml)));
});

test("checkout sends shownTier and no amount; 409 price_changed shows the new price and does not redirect", () => {
  const body = buildCheckoutPayload({ name: "A", email: "a@b.co", shownTier: "founders", src: "ig-bio" });
  assert.equal(body.shownTier, "founders");
  assert.equal(body.consentFinal, true);
  assert.equal(body.consentImmediate, true);
  assert.equal(body.src, "ig-bio");
  assert.ok(!("amount" in body) && !("amountMinor" in body) && !("price" in body));
  assert.ok(!("src" in buildCheckoutPayload({ name: "A", email: "a@b.co", shownTier: "regular", src: null })));

  const changed = interpretCheckoutReply(
    409,
    { ok: false, code: "price_changed", error: "x", tier: "regular", amountMinor: 12_900_000, currency: "NGN" },
    "fallback",
  );
  assert.equal(changed.kind, "price_changed");
  if (changed.kind === "price_changed") {
    assert.equal(changed.tier, "regular");
    assert.equal(changed.amount, "N129,000");
    assert.match(changed.message, /It is now N129,000\. You were not charged\./);
    assert.match(changed.message, /press Pay again to confirm/);
  }
  const ok = interpretCheckoutReply(200, { ok: true, paymentLink: "https://checkout.flutterwave.com/x" }, "f");
  assert.deepEqual(ok, { kind: "redirect", url: "https://checkout.flutterwave.com/x" });
  assert.equal(interpretCheckoutReply(200, { ok: true, paymentLink: "http://evil" }, "f").kind, "error");
  assert.equal(interpretCheckoutReply(500, null, "fallback").kind, "error");
  assert.equal(interpretCheckoutReply(409, { code: "price_changed", tier: "regular" }, "f").kind, "error");
});

test("privacy page matches the code: two cookies, user agent, Neon, retention", () => {
  const t = visibleText(renderToStaticMarkup(<PrivacyPage />));
  for (const needle of ["tec_claim", "tec_dl", "user-agent", "Neon", "Resend", "Vercel", "Telegram", "Flutterwave", "We do not delete order records automatically"]) {
    assert.ok(t.includes(needle), `privacy page must mention ${needle}`);
  }
  assert.ok(!/one first-party cookie/i.test(t));
});

test("founders end line only when the product row has a date; never a timer or place count", () => {
  assert.ok(!/Founders price until/.test(visibleText(html)), "no date set, so no date line");
  const dated = priceView({ ...FALLBACK_PRODUCT, foundersEndsAt: new Date("2026-11-14T00:00:00Z") }, NOW);
  assert.equal(dated.foundersUntilLine, "Founders price until 14 November 2026");
  const datedHtml = renderToStaticMarkup(<CompanionPage view={dated} />);
  assert.ok(visibleText(datedHtml).includes("Founders price until 14 November 2026"));
  const capped = priceView({ ...FALLBACK_PRODUCT, foundersCap: 10 }, NOW);
  const cappedText = visibleText(renderToStaticMarkup(<CompanionPage view={capped} />));
  for (const t of [html, datedHtml]) {
    assert.ok(!/places? left|spots? left|countdown|hurry|only \d+ left/i.test(visibleText(t)));
  }
  assert.ok(!/places? left|spots? left/i.test(cappedText), "a cap never becomes a visible place count");
  const regular = priceView({ ...FALLBACK_PRODUCT, foundersEndsAt: new Date("2026-10-01T00:00:00Z") }, NOW);
  assert.equal(regular.tier, "regular");
  assert.equal(regular.amount, "N150,000");
});

test("owner-fixed lines and contacts are present, exactly", () => {
  const t = visibleText(html);
  assert.ok(t.includes(INSTALL_STATUS));
  assert.equal(INSTALL_STATUS, "Tested on Windows 11 in a controlled setup. Not yet tested on a brand new computer. Mac is not tested yet.");
  assert.ok(t.includes(SUPPORT_LINE));
  assert.ok(t.includes("Message us to pay by crypto"));
  for (const c of Object.values(CONTACTS)) {
    assert.ok(t.includes(c.display), `${c.label} shown as selectable text`);
    assert.ok(html.includes(`href="${c.href}"`), `${c.label} shown as a link`);
  }
});

test("hidden blocks stay hidden by default", () => {
  assert.equal(FLAGS.expertiseBlock, false);
  assert.equal(FLAGS.proofSlot, false);
  const t = visibleText(html);
  assert.ok(!t.includes("How I use it"));
  assert.ok(!t.includes("One video, and the plan behind it"));
});

test("checkout form posts to the contract route and carries both consent ticks", () => {
  assert.equal((html.match(/type="checkbox"/g) ?? []).length, 2);
  const t = visibleText(html);
  assert.ok(t.includes("all sales are final"));
  assert.ok(t.includes("give up any right to cancel"));
  for (const l of ["/terms", "/privacy", "/licence"]) assert.ok(html.includes(`href="${l}"`));
});

test("every sentence on the page is in the copy files or on the reviewed allow-list", { skip: !haveCopy }, () => {
  const source = norm(COPY_FILES.map((f) => readFileSync(`${COPY_DIR}/${f}`, "utf8")).join("\n"));

  // Owner decisions of 15 Oct 2026 and UI strings. Each is reviewed and reported to the owner.
  const ALLOW = [
    /^n\d[\d,]*( founders price)?$/i, // naira prices
    /^then n\d[\d,]*$/i,
    /^founders price then n\d[\d,]* ?$/i,
    /^get theeditcompanion for n\d[\d,]*$/i,
    /^pay n\d[\d,]*$/i,
    /^theeditcompanion \w+ n\d[\d,]* founders price$/i,
    /^theeditcompanion by bigquiv digitals n\d[\d,]* founders price$/i,
    /^theeditcompanion by bigquiv digitals, n\d[\d,]* founders price$/i,
    /^for international buyers the reference price is \$\d+ founders price then \$\d+ you pay in naira$/i,
    /^updates are not promised$/i,
    /^all sales are final for 30 days after you buy we help you install and run it updates are not promised$/i,
    /^orders are not open yet/i,
    /^contact bigquiv digitals$/i,
    /^install status$/i,
    /^questions people ask$/i,
    /^read the$/i,
    /^terms$/i,
    /^privacy$/i,
    /^licence$/i,
    /^tick both boxes to continue$/i,
    /^need help\?? telegram/i,
    /^your payment did not go through/i,
    /^\d\d$/, // step numbers
    /^[+,]$/,
    /^message us to pay by crypto$/i, // owner decision: crypto is not built
    /^i understand that all sales are final and there are no refunds/i, // CONSENT_FINAL_TEXT (wave 1)
    /^i want my download immediately and i understand i give up any right to cancel/i, // CONSENT_IMMEDIATE_TEXT (wave 1)
  ];

  const unmatched: string[] = [];
  for (const node of textNodes(html)) {
    const n = norm(node);
    if (!/[a-z]/.test(n)) continue;
    if (source.includes(n)) continue;
    if (ALLOW.some((re) => re.test(n) || re.test(node))) continue;
    unmatched.push(node);
  }
  assert.deepEqual(unmatched, [], `sentences not found in the copy files:\n${unmatched.join("\n")}`);
});
