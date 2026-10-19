/**
 * Page checks for /my-purchases and /my-purchases/view, plus the "My purchases" links on the
 * thanks page, in the delivery email and in the footer. Fake runtime, no database, no network.
 * Run: npx tsx --test tests/companion/purchases-page.test.tsx
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import MyPurchasesPage from "@/app/my-purchases/page";
import MyPurchasesViewPage from "@/app/my-purchases/view/page";
import ThanksPage from "@/app/theeditcompanion/thanks/page";
import PrivacyPage from "@/app/privacy/page";
import { FooterClient } from "@/components/FooterClient";
import { receiptLines } from "@/components/companion/ReceiptButton";
import { DeliveryMemoryStore } from "@/lib/companion/delivery-memory";
import { renderDelivery } from "@/lib/companion/emails/templates";
import { createNeonCompanionStore, type Row } from "@/lib/companion/neon-store";
import { PURCHASES_SECRET_ENV, signPurchasesToken } from "@/lib/companion/purchases-link";
import { setRuntimeForTests, type Runtime } from "@/lib/companion/runtime";
import { sampleProduct } from "@/lib/companion/testing/memory-store";
import type { OrderStatus } from "@/lib/companion/types";

const SECRET = "page-test-secret-page-test-secret-0123456789";
const NOW = new Date("2026-11-01T12:00:00Z");
const decode = (s: string) => s.replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
const h1Count = (h: string) => (h.match(/<h1[\s>]/g) ?? []).length;

async function setup() {
  process.env[PURCHASES_SECRET_ENV] = SECRET;
  const store = new DeliveryMemoryStore();
  store.products.set("theeditcompanion", sampleProduct());
  const rt: Runtime = {
    store,
    files: { getStream: async () => null } as unknown as Runtime["files"],
    sender: { send: async () => ({ ok: true }) },
    notifier: { alertOwner: async () => true },
    baseUrl: "https://example.test",
    ipSalt: "salt",
    now: () => NOW,
  };
  setRuntimeForTests(rt);
  let n = 0;
  async function order(email: string, status: OrderStatus) {
    const o = await store.insertOrder({
      orderRef: `TEC-PAGE${++n}`, productSlug: "theeditcompanion", email, name: "Ada Buyer", status, method: "flutterwave",
      priceTier: "founders", expectedMinor: 8_900_000, currency: "NGN", consentAt: NOW, consentVersion: "v1", consentIpHash: null,
      src: null, claimHash: "h".repeat(64), createdAt: NOW,
    });
    const row = store.orders.get(o.id)!;
    row.paidAt = new Date("2026-10-30T09:00:00Z");
    row.amountReceivedMinor = 8_900_000;
    return row;
  }
  return { store, order };
}

const view = async (q: Record<string, string>) =>
  decode(renderToStaticMarkup(await MyPurchasesViewPage({ searchParams: Promise.resolve(q) })));

test("request page: one h1, the form button, no dashes", () => {
  const html = decode(renderToStaticMarkup(<MyPurchasesPage />));
  assert.equal(h1Count(html), 1);
  assert.ok(html.includes("Email me a sign-in link"));
  assert.ok(html.includes("30 minutes"));
  assert.ok(!/[—–]/.test(html));
});

test("view page: a valid link lists this buyer's orders with download and receipt; others never show", async () => {
  const { order } = await setup();
  const paid = await order("ada@example.com", "paid");
  const refunded = await order("ada@example.com", "refunded");
  const pending = await order("ada@example.com", "awaiting_payment");
  const other = await order("eve@example.com", "paid");
  try {
    const t = signPurchasesToken("ada@example.com", NOW, SECRET);
    const html = await view({ t });
    assert.equal(h1Count(html), 1);
    assert.ok(html.includes("My purchases"));
    assert.ok(html.includes(paid.orderRef) && html.includes(refunded.orderRef));
    assert.ok(!html.includes(pending.orderRef), "unpaid order hidden");
    assert.ok(!html.includes(other.orderRef) && !html.includes("eve@example.com"), "another buyer's order hidden");
    assert.ok(html.includes("N89,000"));
    assert.ok(html.includes("30 October 2026"));
    assert.ok(html.includes(">Paid<") && html.includes(">Refunded<"));
    // One Download form and one Receipt button, for the paid order only.
    assert.equal((html.match(/action="\/api\/companion\/purchases\/download"/g) ?? []).length, 1);
    assert.equal((html.match(/>Receipt</g) ?? []).length, 1);
    assert.ok(html.includes(`name="ref" value="${paid.orderRef}"`));
    assert.ok(!/[—–]/.test(html));

    const notice = await view({ t, m: "limit" });
    assert.ok(notice.includes("limit of 3 new download links"));
    const junk = await view({ t, m: "<script>" });
    assert.ok(!junk.includes("<script>"), "unknown notice keys are ignored");
  } finally {
    setRuntimeForTests(null);
  }
});

test("view page: missing, bad or expired link shows the expired screen with the form", async () => {
  await setup();
  try {
    const expired = signPurchasesToken("ada@example.com", new Date(NOW.getTime() - 31 * 60 * 1000), SECRET);
    for (const q of [{}, { t: "garbage" }, { t: expired }] as Record<string, string>[]) {
      const html = await view(q);
      assert.equal(h1Count(html), 1);
      assert.ok(html.includes("This link has expired"));
      assert.ok(html.includes("Email me a sign-in link"));
      assert.ok(!/[—–]/.test(html));
    }
    // Missing secret fails closed.
    const t = signPurchasesToken("ada@example.com", NOW, SECRET);
    delete process.env[PURCHASES_SECRET_ENV];
    assert.ok((await view({ t })).includes("This link has expired"));
  } finally {
    setRuntimeForTests(null);
  }
});

test("receipt: carries the required fields", () => {
  const lines = receiptLines({
    orderRef: "TEC-1", date: "30 October 2026", productName: "TheEditCompanion", amount: "N89,000", buyerName: "Ada", buyerEmail: "ada@example.com",
  });
  assert.deepEqual(lines.map(([k]) => k), ["Order reference", "Date", "Product", "Amount paid", "Paid via", "Buyer", "Email"]);
  assert.deepEqual(lines.find(([k]) => k === "Paid via"), ["Paid via", "Flutterwave"]);
});

test("My purchases is linked from the thanks page, the delivery email and the footer; privacy explains the link", async () => {
  assert.ok(renderToStaticMarkup(await ThanksPage({})).includes('href="/my-purchases"'));
  const { order } = await setup();
  setRuntimeForTests(null);
  const o = await order("ada@example.com", "paid");
  const mail = renderDelivery({ order: o, downloadUrl: "https://example.test/companion/download/x", linkExpiresAt: NOW, maxDownloads: 5, supportUntil: NOW });
  assert.ok(mail.text.includes("/my-purchases"));
  assert.ok(mail.html.includes('/my-purchases"'));
  assert.ok(!/[—–]/.test(mail.text + mail.html));
  const footer = renderToStaticMarkup(
    <FooterClient socialLinks={[]} email="contact@bigquivdigitals.com" telegramHandle="@x" telegramUrl="https://t.me/x" calendlyUrl="https://example.test" />,
  );
  assert.ok(footer.includes('href="/my-purchases"'));
  const privacy = decode(renderToStaticMarkup(<PrivacyPage />));
  assert.ok(privacy.includes("sign-in link") && privacy.includes("30 minutes"));
});

test("neon adapter: listOrdersByEmail filters on email and status in SQL, with a bounded limit", async () => {
  const calls: { text: string; params: unknown[] }[] = [];
  const store = createNeonCompanionStore({
    query: async (text: string, params: unknown[] = []) => {
      calls.push({ text, params });
      return [] as Row[];
    },
  });
  await store.listOrdersByEmail("ada@example.com", ["paid", "refunded"], 100000);
  assert.equal(calls.length, 1);
  assert.match(calls[0].text, /WHERE email = \$1 AND status = ANY\(\$2::text\[\]\)/);
  assert.deepEqual(calls[0].params, ["ada@example.com", ["paid", "refunded"], 200]);
});
