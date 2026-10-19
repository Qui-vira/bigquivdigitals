/**
 * Scenarios 7, 8, 14, 17: founders window, checkout hardening, double click, odd input.
 * Run: npx tsx --test tests/companion-e2e/02-pricing-checkout.test.ts
 */
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { MAX_ORDERS_PER_EMAIL_PER_HOUR, originAllowed } from "../../lib/companion/checkout-handler";
import { quote } from "../../lib/companion/orders";
import { SLUG, buyByCard, checkout, flwTx, makeWorld, sendWebhook, validBody, type World } from "./harness";
import { handleCheckout } from "../../lib/companion/checkout-handler";

const ENDS = new Date("2026-11-30T00:00:00.000Z");
const MIN = 60_000;

async function tierAt(w: World, at: Date, email: string) {
  w.clock.t = at;
  const c = await checkout(w, { email });
  assert.equal(c.res.status, 200, JSON.stringify(c.res.body));
  return c.order!;
}

test("S7 founders window boundary: created 1 ms before the end keeps N89,000 even if paid after", async () => {
  const w = await makeWorld({ product: { foundersEndsAt: ENDS } });
  const before = await tierAt(w, new Date(ENDS.getTime() - 1), "early@example.com");
  assert.equal(before.priceTier, "founders");
  assert.equal(before.expectedMinor, 8_900_000);
  // The page quote and the checkout agree.
  assert.equal((await quote(w.store, SLUG, new Date(ENDS.getTime() - 1)))?.amountMinor, 8_900_000);

  // Paid two days after the window closed: the locked price is honoured, buyer is delivered.
  w.clock.t = new Date(ENDS.getTime() + 2 * 24 * 3600 * 1000);
  const r = await sendWebhook(w, flwTx(w, before));
  assert.equal(r.body.outcome, "paid_now");
  await w.settle();
  assert.equal(w.sender.sent.length, 1);
  assert.equal((await w.store.getOrderById(before.id))?.expectedMinor, 8_900_000);
});

test("S7 an order created at or after the end pays N129,000; N89,000 is an underpayment on it", async () => {
  const w = await makeWorld({ product: { foundersEndsAt: ENDS } });
  const at = await tierAt(w, ENDS, "at@example.com");
  const after = await tierAt(w, new Date(ENDS.getTime() + 1), "after@example.com");
  for (const o of [at, after]) {
    assert.equal(o.priceTier, "regular");
    assert.equal(o.expectedMinor, 12_900_000);
  }
  assert.equal((await quote(w.store, SLUG, ENDS))?.amountMinor, 12_900_000);
  const low = await sendWebhook(w, flwTx(w, at, { amount: 89000 }));
  assert.equal(low.body.outcome, "underpaid");
  const full = await sendWebhook(w, flwTx(w, after, { amount: 129000 }));
  assert.equal(full.body.outcome, "paid_now");
  await w.settle();
  assert.equal(w.sender.sent.length, 1);
});

test("S7 with a cap: the last place is founders, the next buyer pays regular; holds lapse after 60 minutes", async () => {
  const w = await makeWorld({ product: { foundersCap: 2 } });
  const a = (await checkout(w, { email: "a@example.com" })).order!;
  assert.equal(a.priceTier, "founders");
  assert.equal((await quote(w.store, SLUG, w.clock.t))?.foundersPlacesLeft, 1);
  const b = (await checkout(w, { email: "b@example.com" })).order!;
  assert.equal(b.priceTier, "founders", "the last place");
  assert.equal((await quote(w.store, SLUG, w.clock.t))?.foundersPlacesLeft, null, "closed: no counter");
  const c = (await checkout(w, { email: "c@example.com" })).order!;
  assert.equal(c.priceTier, "regular");
  assert.equal(c.expectedMinor, 12_900_000);

  // Pay A. B never pays: after the 60 minute hold its place is released.
  await sendWebhook(w, flwTx(w, a));
  w.clock.t = new Date(w.clock.t.getTime() + 61 * MIN);
  const d = (await checkout(w, { email: "d@example.com" })).order!;
  assert.equal(d.priceTier, "founders", "released hold re-opens a founders place");
});

test("S7 cap and date together: either one closes founders", async () => {
  const dateClosed = await makeWorld({ product: { foundersCap: 10, foundersEndsAt: ENDS } });
  assert.equal((await tierAt(dateClosed, ENDS, "x@example.com")).priceTier, "regular");
  const capClosed = await makeWorld({ product: { foundersCap: 1, foundersEndsAt: ENDS } });
  const first = await tierAt(capClosed, new Date(ENDS.getTime() - 10 * MIN), "one@example.com");
  assert.equal(first.priceTier, "founders");
  assert.equal((await tierAt(capClosed, new Date(ENDS.getTime() - 5 * MIN), "two@example.com")).priceTier, "regular");
});

test("S7 with neither a date nor a cap, founders stays on and there is no counter", async () => {
  const w = await makeWorld();
  w.clock.t = new Date("2031-01-01T00:00:00Z");
  const q = await quote(w.store, SLUG, w.clock.t);
  assert.equal(q?.tier, "founders");
  assert.equal(q?.foundersPlacesLeft, null);
  assert.equal(q?.countdownTo, null);
  assert.equal((await checkout(w)).order!.expectedMinor, 8_900_000);
});

test("S7 BUG check: two simultaneous checkouts for the LAST founders place must not both get founders", async () => {
  const w = await makeWorld({ product: { foundersCap: 1 } });
  const [x, y] = await Promise.all([checkout(w, { email: "x@example.com" }), checkout(w, { email: "y@example.com" })]);
  const founders = [x.order!, y.order!].filter((o) => o.priceTier === "founders").length;
  // BUG: createOrder reads countFoundersTaken and then inserts in two separate steps (orders.ts, neon-store insertOrder
  // is a plain INSERT), so both read 0 and both lock N89,000. The cap is oversold.
  assert.equal(founders, 1, "BUG: founders cap oversold under concurrent checkout");
});

test("S8 the client cannot choose the amount, currency, tier, status or email target", async () => {
  const w = await makeWorld();
  const { res, order } = await checkout(w, {
    amount: 1, currency: "USD", price: 1, amountMinor: 100, expectedMinor: 100, priceTier: "regular", tier: "regular",
    status: "paid", id: "x", orderRef: "TEC-chosenbyclient0000000", claimHash: "x", paidAt: "2020-01-01",
    customer: { email: "evil@example.com" }, to: "evil@example.com", payerEmail: "evil@example.com",
  });
  assert.equal(res.status, 200);
  assert.equal(order!.expectedMinor, 8_900_000);
  assert.equal(order!.currency, "NGN");
  assert.equal(order!.priceTier, "founders");
  assert.equal(order!.status, "awaiting_payment");
  assert.equal(order!.email, "ada@example.com");
  assert.notEqual(order!.orderRef, "TEC-chosenbyclient0000000");
  assert.equal(order!.paidAt, null);
  const sent = w.flw.calls.find((c) => c.url.endsWith("/v3/payments"))!.body as { amount: number; currency: string; customer: { email: string } };
  assert.equal(sent.amount, 89000);
  assert.equal(sent.currency, "NGN");
  assert.equal(sent.customer.email, "ada@example.com");
});

test("S8 a tier the page showed that no longer matches is refused (409), nothing created; email of the wrong type is refused", async () => {
  const w = await makeWorld();
  const stale = await checkout(w, { shownTier: "regular" });
  assert.equal(stale.res.status, 409);
  assert.equal(stale.res.body.code, "price_changed");
  assert.equal(stale.res.body.tier, "founders");
  assert.equal(stale.res.body.amountMinor, 8_900_000);
  assert.equal(w.orders().length, 0);
  for (const email of [["a@example.com", "evil@example.com"], { a: 1 }, 5, null, undefined, true]) {
    const r = await checkout(w, { email });
    assert.equal(r.res.status, 400, JSON.stringify(email));
    assert.equal(r.res.body.code, "invalid_email");
  }
  const odd = await checkout(w, { productSlug: "some-other-product" });
  assert.equal(odd.res.status, 404);
  assert.equal(w.orders().length, 0);
  const fine = await checkout(w, { shownTier: "founders" });
  assert.equal(fine.res.status, 200);
});

test("S8 BUG check: the checkout form must send shownTier so a stale page cannot be charged a higher price silently", () => {
  const src = readFileSync(path.resolve(__dirname, "../../components/companion/CheckoutForm.tsx"), "utf8");
  // BUG: the form body is { name, email, consentFinal, consentImmediate, src } only. If the founders window closes
  // between page render and click, the buyer sees N89,000 and is charged N129,000 with no warning.
  assert.ok(/shownTier/.test(src), "BUG: CheckoutForm never sends shownTier");
});

test("S8 both consent ticks are required, for every method, and nothing is created without them", async () => {
  const w = await makeWorld({ product: { allowManualTransfer: true } });
  const bad: Record<string, unknown>[] = [
    { consentFinal: undefined, consentImmediate: undefined },
    { consentFinal: false, consentImmediate: false },
    { consentFinal: true, consentImmediate: false },
    { consentFinal: false, consentImmediate: true },
    { consentFinal: true, consentImmediate: undefined },
    { consentFinal: "true", consentImmediate: "true" },
    { consentFinal: 1, consentImmediate: 1 },
    { consentFinal: "on", consentImmediate: "on" },
    { consent: { allSalesFinal: true, immediateAccess: false } },
    { consent: { allSalesFinal: true } },
    { consent: true },
    { consent: null },
  ];
  for (const method of ["flutterwave", "bank_transfer"]) {
    for (const consent of bad) {
      const body = validBody({ method, ...consent });
      if ("consent" in consent) {
        delete (body as Record<string, unknown>).consentFinal;
        delete (body as Record<string, unknown>).consentImmediate;
      }
      const r = await handleCheckout(w.deps, { body, ip: null });
      assert.equal(r.status, 400, `${method} ${JSON.stringify(consent)}`);
      assert.equal(r.body.code, "consent_required");
    }
  }
  assert.equal(w.orders().length, 0);
  assert.equal(w.flw.calls.length, 0, "no payment link opened without consent");
  // The nested form works when both are true.
  const ok = await handleCheckout(w.deps, { body: { name: "Ada", email: "ada@example.com", consent: { allSalesFinal: true, immediateAccess: true } }, ip: null });
  assert.equal(ok.status, 200);
});

test("S8 src tag is sanitised before it is stored", async () => {
  const w = await makeWorld();
  const cases: [unknown, RegExp | null][] = [
    ['X-Bio<script>alert(1)</script>', /^[a-z0-9:_-]+$/],
    ["x:Bio_01", /^x:bio_01$/],
    ["a".repeat(500), /^a{40}$/],
    [{ evil: 1 }, null],
    [["x"], null],
    ["   ", null],
    ["ÄÖÜ😀", null],
    ["'; DROP TABLE companion_orders;--", /^[a-z0-9:_-]+$/],
  ];
  for (const [i, [src, expect]] of cases.entries()) {
    const { order } = await checkout(w, { src, email: `src${i}@example.com` });
    if (expect === null) assert.equal(order!.src, null, JSON.stringify(src));
    else {
      assert.match(order!.src ?? "", expect, JSON.stringify(src));
      assert.ok(!/[<>()'"; ]/.test(order!.src ?? ""));
    }
  }
});

test("S8 honeypot, non-object bodies, unknown methods and origin check", async () => {
  const w = await makeWorld();
  assert.equal((await handleCheckout(w.deps, { body: validBody({ hp: "http://spam" }), ip: null })).status, 400);
  for (const body of [null, "str", 5, [], undefined]) {
    assert.equal((await handleCheckout(w.deps, { body, ip: null })).status, 400);
  }
  for (const method of ["blockradar", "paypal", "", ["flutterwave"], 5, null]) {
    const r = await handleCheckout(w.deps, { body: validBody({ method }), ip: null });
    assert.equal(r.status, 400, JSON.stringify(method));
    assert.equal(r.body.code, "method_not_allowed");
  }
  assert.equal(w.orders().length, 0);
  assert.equal(originAllowed("https://bigquivdigitals.com", null), true);
  assert.equal(originAllowed(null, "https://www.bigquivdigitals.com/theeditcompanion"), true);
  assert.equal(originAllowed("http://localhost:3000", null), true);
  for (const o of ["https://bigquivdigitals.com.evil.tld", "https://evilbigquivdigitals.com", "null", "", "javascript:alert(1)", "https://evil.tld/bigquivdigitals.com"]) {
    assert.equal(originAllowed(o, null), false, o);
  }
  assert.equal(originAllowed(null, null), false);
});

test("S14 double click: the actual rule is 5 orders per email per hour (checked one at a time)", async () => {
  const w = await makeWorld();
  assert.equal(MAX_ORDERS_PER_EMAIL_PER_HOUR, 5);
  for (let i = 0; i < 5; i++) assert.equal((await checkout(w)).res.status, 200);
  const sixth = await checkout(w);
  assert.equal(sixth.res.status, 429);
  assert.equal(sixth.res.body.code, "rate_limited");
  assert.equal(w.orders().length, 5);
  // Another hour later the same buyer can try again.
  w.clock.t = new Date(w.clock.t.getTime() + 61 * MIN);
  assert.equal((await checkout(w)).res.status, 200);
});

test("S14 BUG check: a double click (two identical simultaneous checkouts) must leave at most ONE live order", async () => {
  const w = await makeWorld();
  const [a, b] = await Promise.all([checkout(w), checkout(w)]);
  assert.equal(a.res.status, 200);
  const live = w.orders().filter((o) => o.status === "awaiting_payment").length;
  // BUG: the plan lists "double click on Pay" as a negative test and the 5 per hour rule is the only server side rule.
  // There is no idempotency key or reuse of an open order for the same email, so each click makes a new order and a new
  // Flutterwave link; if both links are paid the buyer is charged twice. Only a client-side inFlight ref guards it.
  assert.ok(live <= 1, `BUG: ${live} live orders from one double click (statuses ${b.res.status})`);
});

test("S14 BUG check: a burst of 10 simultaneous checkouts for one email must respect the 5 per hour limit", async () => {
  const w = await makeWorld();
  const results = await Promise.all(Array.from({ length: 10 }, () => checkout(w)));
  const created = results.filter((r) => r.res.status === 200).length;
  // BUG: countOrdersByEmailSince is a read followed by an insert; the check is not atomic, so a burst passes it.
  assert.ok(created <= 5, `BUG: ${created} orders created, limit is 5 per email per hour`);
});

test("S17 unicode, long names, plus-addressed and upper case emails, whitespace", async () => {
  const w = await makeWorld();
  const name = "Ádá Ọlá 张伟 😀";
  const u = await buyByCard(w, { name, email: "  Ada+Promo.Tag@Example.COM  " });
  assert.equal(u.order.name, name);
  assert.equal(u.order.email, "ada+promo.tag@example.com");
  assert.equal(w.sender.sent[0].to, "ada+promo.tag@example.com");
  const create = w.flw.calls.find((c) => c.url.endsWith("/v3/payments"))!.body as { customer: { name: string; email: string } };
  assert.equal(create.customer.name, name);
  assert.ok(w.sender.sent[0].text.startsWith("Hi Ádá,"));

  // Trimmed name; 100 characters is the limit; 101 is refused; empty and whitespace-only refused.
  assert.equal((await checkout(w, { name: "   Chidi   ", email: "c1@example.com" })).order!.name, "Chidi");
  assert.equal((await checkout(w, { name: "N".repeat(100), email: "c2@example.com" })).res.status, 200);
  assert.equal((await checkout(w, { name: "N".repeat(101), email: "c3@example.com" })).res.body.code, "invalid_name");
  for (const n of ["", "   ", "\t\n", 5, null, {}, ["a"]]) {
    assert.equal((await checkout(w, { name: n, email: "c4@example.com" })).res.body.code, "invalid_name", JSON.stringify(n));
  }

  // Emails: boundary, internal whitespace, header injection attempts, missing parts.
  const longLocal = "a".repeat(64);
  const email254 = `${longLocal}@${"b".repeat(63)}.${"c".repeat(63)}.${"d".repeat(57)}.com`;
  assert.equal(email254.length, 254);
  assert.equal((await checkout(w, { email: email254 })).res.status, 200);
  assert.equal((await checkout(w, { email: "x" + email254 })).res.body.code, "invalid_email", "255 chars");
  for (const e of ["ada @example.com", "ada@@example.com", "ada@example", "@example.com", "ada@", "ada@example.com\r\nBcc: evil@example.com", "ada@example.com,evil@example.com", "ada@exa mple.com", ""]) {
    const r = await checkout(w, { email: e });
    assert.equal(r.res.body.code, "invalid_email", JSON.stringify(e));
  }
  // Unicode local parts are accepted as typed.
  assert.equal((await checkout(w, { email: "ádá@exämple.com" })).res.status, 200);
});

test("S17 hostile names never reach the email as markup or as header lines", async () => {
  const w = await makeWorld();
  await buyByCard(w, { name: '<img src=x onerror=alert(1)> "Bob"', email: "x1@example.com" });
  await buyByCard(w, { name: "Ada\r\nBcc: evil@example.com", email: "x2@example.com" });
  assert.equal(w.sender.sent.length, 2);
  for (const m of w.sender.sent) {
    assert.ok(!/<img/i.test(m.html), "html escaped");
    assert.ok(!/[\r\n]/.test(m.subject), "subject is one line");
    assert.ok(!/Bcc:/i.test(m.subject));
  }
  assert.ok(!w.sender.sent[1].text.split("\n")[0].includes("Bcc"), "greeting uses the first word only");
  assert.equal(w.sender.sent[1].to, "x2@example.com");
});

test("S17 the consent ip hash is salted and never the raw ip", async () => {
  const w = await makeWorld();
  const a = (await checkout(w, { email: "ip1@example.com" }, "203.0.113.7")).order!;
  assert.equal(a.consentIpHash, createHash("sha256").update("e2e-salt203.0.113.7").digest("hex"));
  assert.ok(!JSON.stringify(a).includes("203.0.113.7"));
  const b = (await checkout(w, { email: "ip2@example.com" }, null)).order!;
  assert.equal(b.consentIpHash, null);
});
