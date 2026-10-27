/**
 * Wave 2 payments tests: Neon adapter (recording fake sql client), checkout,
 * Flutterwave webhook + return handlers, transfer-paid. No network, no database.
 * Run: npx tsx --test lib/companion/__tests__/payments.test.ts
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import { CLAIM_COOKIE, handleCheckout, originAllowed, THANKS_PATH } from "../checkout-handler";
import { hashToken } from "../tokens";
import type { PaymentsDeps } from "../deps";
import { handleCompanionFlutterwaveWebhook } from "../flutterwave-handler";
import { DuplicateOrderRefError } from "../store";
import { createNeonCompanionStore, type Row, type SqlClient } from "../neon-store";
import { handleReturn } from "../return-handler";
import { MemoryStore, sampleProduct } from "../testing/memory-store";
import { handleTransferPaid } from "../transfer-handler";

const NOW = new Date("2026-11-01T12:00:00Z");
const CONSENT = { allSalesFinal: true, immediateAccess: true };
const HASH = "secret-hash";

// ---------- recording fake of the Neon sql client ----------
type Call = { text: string; params: unknown[] };
function fakeSql(responder: (c: Call, n: number) => Row[] | Error) {
  const calls: Call[] = [];
  const sql: SqlClient = {
    async query(text, params = []) {
      const c = { text: text.replace(/\s+/g, " ").trim(), params };
      calls.push(c);
      const r = responder(c, calls.length);
      if (r instanceof Error) throw r;
      return r;
    },
  };
  return { sql, calls };
}
const UUID = "11111111-1111-4111-8111-111111111111";
const orderRow = (over: Row = {}): Row => ({
  id: UUID, order_ref: "TEC-abc", product_slug: "theeditcompanion", email: "a@b.co", name: "Ada",
  status: "paid", method: "flutterwave", price_tier: "founders", expected_minor: 8900000, currency: "NGN",
  support_until: null, provider_tx_id: "99", provider_ref: null, amount_received_minor: 8900000, received_note: null,
  consent_at: NOW, consent_version: "v", consent_ip_hash: null, src: null, claim_hash: "h", created_at: NOW, paid_at: NOW,
  ...over,
});
const uniq = () => Object.assign(new Error("duplicate key"), { code: "23505" });

test("neon: claimOrderPaid is ONE conditional UPDATE ... RETURNING (no read-then-write)", async () => {
  const { sql, calls } = fakeSql(() => [orderRow()]);
  const store = createNeonCompanionStore(sql);
  const patch = { paidAt: NOW, providerTxId: "99", amountReceivedMinor: 8900000, receivedNote: null, supportUntil: NOW };
  const r = await store.claimOrderPaid(UUID, ["created", "awaiting_payment"], patch);
  assert.equal(r.kind, "won");
  assert.equal(calls.length, 1, "exactly one statement");
  assert.match(calls[0].text, /^UPDATE companion_orders SET status = 'paid'/);
  assert.match(calls[0].text, /WHERE id = \$1 AND status = ANY\(\$2::text\[\]\) RETURNING \*$/);
  assert.deepEqual(calls[0].params[1], ["created", "awaiting_payment"]);
  assert.equal(calls[0].params[0], UUID);
  assert.equal(calls[0].params[3], "99");
});

test("neon: claimOrderPaid when no row: reports the current status; not_found when order gone", async () => {
  const a = fakeSql((_c, n) => (n === 1 ? [] : [{ status: "paid" }]));
  const r1 = await createNeonCompanionStore(a.sql).claimOrderPaid(UUID, ["created"], { paidAt: NOW, providerTxId: "1", amountReceivedMinor: 1, receivedNote: null, supportUntil: NOW });
  assert.deepEqual(r1, { kind: "not_claimable", status: "paid" });
  assert.equal(a.calls.length, 2);
  assert.match(a.calls[0].text, /^UPDATE/);
  assert.match(a.calls[1].text, /^SELECT status/);
  const b = fakeSql(() => []);
  const r2 = await createNeonCompanionStore(b.sql).claimOrderPaid(UUID, ["created"], { paidAt: NOW, providerTxId: "1", amountReceivedMinor: 1, receivedNote: null, supportUntil: NOW });
  assert.equal(r2.kind, "not_found");
});

test("neon: unique violation on provider_tx_id becomes tx_conflict; other errors throw", async () => {
  const patch = { paidAt: NOW, providerTxId: "1", amountReceivedMinor: 1, receivedNote: null, supportUntil: NOW };
  const a = fakeSql(() => uniq());
  assert.deepEqual(await createNeonCompanionStore(a.sql).claimOrderPaid(UUID, ["created"], patch), { kind: "tx_conflict" });
  const b = fakeSql(() => new Error("connection reset"));
  await assert.rejects(createNeonCompanionStore(b.sql).claimOrderPaid(UUID, ["created"], patch), /connection reset/);
});

test("neon: consumeDownload is one UPDATE that guards count, revoked and expiry", async () => {
  const tokRow = { id: UUID, order_id: UUID, token_hash: "x", expires_at: NOW, max_downloads: 5, download_count: 1, revoked_at: null, created_at: NOW, created_by: "system" };
  const { sql, calls } = fakeSql(() => [tokRow]);
  const store = createNeonCompanionStore(sql);
  const t = await store.consumeDownload(UUID, NOW);
  assert.equal(t?.downloadCount, 1);
  assert.equal(calls.length, 1);
  assert.match(calls[0].text, /SET download_count = download_count \+ 1 WHERE id = \$1 AND download_count < max_downloads AND revoked_at IS NULL AND expires_at > \$2 RETURNING \*/);
  const none = createNeonCompanionStore(fakeSql(() => []).sql);
  assert.equal(await none.consumeDownload(UUID, NOW), null);
});

test("neon: revoke, insertOrder duplicate, founders count, counts and throws", async () => {
  const rev = fakeSql(() => [{ id: "a" }, { id: "b" }]);
  assert.equal(await createNeonCompanionStore(rev.sql).revokeTokensForOrder(UUID, NOW), 2);
  assert.match(rev.calls[0].text, /WHERE order_id = \$1 AND revoked_at IS NULL RETURNING id/);

  const dup = createNeonCompanionStore(fakeSql(() => uniq()).sql);
  await assert.rejects(
    dup.insertOrder({ orderRef: "TEC-x", productSlug: "p", email: "a@b.co", name: "A", status: "awaiting_payment", method: "flutterwave", priceTier: "founders", expectedMinor: 1, currency: "NGN", consentAt: NOW, consentVersion: "v", consentIpHash: null, src: null, claimHash: "h", createdAt: NOW }),
    DuplicateOrderRefError,
  );

  const f = fakeSql(() => [{ n: 3 }]);
  assert.equal(await createNeonCompanionStore(f.sql).countFoundersTaken("p", NOW), 3);
  assert.match(f.calls[0].text, /status = 'paid'/);
  assert.match(f.calls[0].text, /status = 'awaiting_transfer' AND created_at >= \$3/);
  assert.match(f.calls[0].text, /status IN \('created','awaiting_payment'\) AND created_at >= \$2/);

  const boom = createNeonCompanionStore(fakeSql(() => new Error("db down")).sql);
  await assert.rejects(boom.getProduct("p"), /db down/);
  await assert.rejects(boom.getOrderByRef("TEC-x"), /db down/);
  await assert.rejects(boom.addEvent(UUID, "system", "k", "d", NOW), /db down/);
  await assert.rejects(boom.setOrderStatus(UUID, "expired"), /db down/);
});

test("neon: getOrderById with a non-uuid never hits the database", async () => {
  const { sql, calls } = fakeSql(() => []);
  assert.equal(await createNeonCompanionStore(sql).getOrderById("not-a-uuid"), null);
  assert.equal(calls.length, 0);
});

// ---------- handler harness ----------
type Harness = {
  deps: PaymentsDeps; store: MemoryStore; delivered: string[]; alerts: string[];
  fetchCalls: { url: string; init?: RequestInit }[];
  setFlw(handler: (url: string, init?: RequestInit) => Response | Promise<Response>): void;
};
function harness(productOver = {}, bank: string | null = null): Harness {
  const store = new MemoryStore();
  store.products.set("theeditcompanion", sampleProduct(productOver));
  const delivered: string[] = [];
  const alerts: string[] = [];
  const fetchCalls: { url: string; init?: RequestInit }[] = [];
  let flw: (url: string, init?: RequestInit) => Response | Promise<Response> = () => new Response("{}", { status: 500 });
  const deps: PaymentsDeps = {
    store, now: () => NOW,
    fetch: (async (u: RequestInfo | URL, init?: RequestInit) => {
      const url = String(u);
      fetchCalls.push({ url, init });
      return flw(url, init);
    }) as typeof fetch,
    env: { flwSecretKey: "sk", flwSecretHash: HASH, ipSalt: "salt", production: false },
    scheduleDelivery: (id) => void delivered.push(id),
    alert: async (s) => void alerts.push(s),
    log: () => {},
    getBankDetails: async () => bank,
    countOrdersByEmailSince: async (email, since) => {
      let n = 0;
      for (const o of store.orders.values()) if (o.email === email && o.createdAt >= since) n++;
      return n;
    },
  };
  return { deps, store, delivered, alerts, fetchCalls, setFlw: (h) => void (flw = h) };
}
const json = (o: unknown, status = 200) => new Response(JSON.stringify(o), { status });
const LINK = "https://checkout.flutterwave.com/v3/hosted/pay/flwlnk-01abc";
const okBody = (over = {}) => ({ name: "Ada", email: "Ada@Example.com", consentFinal: true, consentImmediate: true, ...over });

// ---------- checkout ----------
test("checkout: server price, TEC- tx_ref, NGN major units, client amount ignored", async () => {
  const h = harness();
  h.setFlw(() => json({ status: "success", data: { link: LINK } }));
  const r = await handleCheckout(h.deps, { body: okBody({ amount: 1, amountMinor: 1, currency: "USD", price: 1 }), ip: "1.2.3.4" });
  assert.equal(r.status, 200);
  assert.equal(r.body.ok, true);
  assert.equal(r.body.paymentLink, LINK);
  assert.equal(r.body.ref, r.body.orderRef);
  assert.match(String(r.body.ref), /^TEC-/);
  assert.equal(r.body.link, LINK);
  assert.equal(r.body.amountMinor, 8900000);
  assert.ok(r.claimToken && r.claimToken.length >= 40);
  const call = h.fetchCalls[0];
  assert.equal(call.url, "https://api.flutterwave.com/v3/payments");
  const sent = JSON.parse(String(call.init?.body));
  assert.equal(sent.amount, 89000);
  assert.equal(sent.currency, "NGN");
  assert.match(sent.tx_ref, /^TEC-[A-Za-z0-9_-]{22}$/);
  assert.equal(sent.redirect_url, "https://bigquivdigitals.com/api/companion/return");
  assert.equal(sent.meta.order_ref, sent.tx_ref);
  assert.ok(sent.meta.order_id);
  assert.equal(sent.customer.email, "ada@example.com");
  assert.equal((call.init?.headers as Record<string, string>).Authorization, "Bearer sk");
  const order = [...h.store.orders.values()][0];
  assert.equal(order.expectedMinor, 8900000);
  assert.equal(order.claimHash, hashToken(r.claimToken!));
  assert.equal(CLAIM_COOKIE, "tec_claim");
});

test("checkout: regular price after the founders window ends", async () => {
  const h = harness({ foundersEndsAt: new Date("2026-10-01T00:00:00Z") });
  h.setFlw(() => json({ status: "success", data: { link: LINK } }));
  const r = await handleCheckout(h.deps, { body: okBody(), ip: null });
  assert.equal(JSON.parse(String(h.fetchCalls[0].init?.body)).amount, 129000);
  assert.equal(r.body.tier, "regular");
});

test("checkout: both ticks required (either missing, or truthy non-true) and no order is made", async () => {
  const h = harness();
  for (const b of [
    okBody({ consentFinal: false }), okBody({ consentImmediate: undefined }), okBody({ consentFinal: "true" }),
    { name: "Ada", email: "a@b.co" }, okBody({ consent: { allSalesFinal: true, immediateAccess: false }, consentFinal: undefined }),
  ]) {
    const r = await handleCheckout(h.deps, { body: b, ip: null });
    assert.equal(r.status, 400);
    assert.equal(r.body.code, "consent_required");
  }
  assert.equal(h.store.orders.size, 0);
  assert.equal(h.fetchCalls.length, 0);
});

test("checkout: object consent shape, honeypot, bad body, crypto refused, bad email", async () => {
  const h = harness();
  h.setFlw(() => json({ status: "success", data: { link: LINK } }));
  assert.equal((await handleCheckout(h.deps, { body: { name: "A", email: "a@b.co", consent: CONSENT }, ip: null })).status, 200);
  assert.equal((await handleCheckout(h.deps, { body: okBody({ hp: "x" }), ip: null })).status, 400);
  assert.equal((await handleCheckout(h.deps, { body: null, ip: null })).status, 400);
  assert.equal((await handleCheckout(h.deps, { body: okBody({ method: "blockradar" }), ip: null })).body.code, "method_not_allowed");
  assert.equal((await handleCheckout(h.deps, { body: okBody({ email: "nope" }), ip: null })).body.code, "invalid_email");
  assert.equal(h.store.orders.size, 1);
});

test("checkout: price_changed returns 409 with the new price and creates nothing", async () => {
  const h = harness({ foundersEndsAt: new Date("2026-10-01T00:00:00Z") });
  const r = await handleCheckout(h.deps, { body: okBody({ shownTier: "founders" }), ip: null });
  assert.equal(r.status, 409);
  assert.equal(r.body.code, "price_changed");
  assert.equal(r.body.amountMinor, 12900000);
  assert.equal(h.store.orders.size, 0);
});

test("checkout: provider failure expires the order and returns 502; a hostile link is refused", async () => {
  const h = harness();
  h.setFlw(() => json({}, 500));
  const r = await handleCheckout(h.deps, { body: okBody(), ip: null });
  assert.equal(r.status, 502);
  assert.equal(r.claimToken, undefined);
  assert.equal([...h.store.orders.values()][0].status, "expired");

  const g = harness();
  g.setFlw(() => json({ status: "success", data: { link: "https://checkout.flutterwave.com.evil.tld/pay" } }));
  assert.equal((await handleCheckout(g.deps, { body: okBody(), ip: null })).status, 502);
  const g2 = harness();
  g2.setFlw(() => json({ status: "success", data: { link: "http://checkout.flutterwave.com/pay" } }));
  assert.equal((await handleCheckout(g2.deps, { body: okBody(), ip: null })).status, 502);
});

test("checkout: per-email hourly limit", async () => {
  const h = harness();
  h.setFlw(() => json({ status: "success", data: { link: LINK } }));
  for (let i = 0; i < 5; i++) assert.equal((await handleCheckout(h.deps, { body: okBody(), ip: null })).status, 200);
  assert.equal((await handleCheckout(h.deps, { body: okBody(), ip: null })).status, 429);
});

test("checkout: bank transfer only when allowed and bank details exist", async () => {
  const off = harness();
  assert.equal((await handleCheckout(off.deps, { body: okBody({ method: "bank_transfer" }), ip: null })).status, 400);

  const noDetails = harness({ allowManualTransfer: true }, null);
  assert.equal((await handleCheckout(noDetails.deps, { body: okBody({ method: "bank_transfer" }), ip: null })).status, 400);
  assert.equal(noDetails.store.orders.size, 0);

  const on = harness({ allowManualTransfer: true }, "GTBank 0123456789 Big Quiv Digitals");
  const r = await handleCheckout(on.deps, { body: okBody({ method: "bank_transfer" }), ip: null });
  assert.equal(r.status, 200);
  assert.equal(r.body.bankDetails, "GTBank 0123456789 Big Quiv Digitals");
  assert.equal(r.body.narration, r.body.orderRef);
  assert.equal(on.fetchCalls.length, 0, "no Flutterwave call for a manual transfer");
  assert.equal([...on.store.orders.values()][0].status, "awaiting_transfer");
});

test("originAllowed is host-exact and refuses a missing origin", () => {
  assert.equal(originAllowed("https://bigquivdigitals.com", null), true);
  assert.equal(originAllowed(null, "https://www.bigquivdigitals.com/theeditcompanion"), true);
  assert.equal(originAllowed("https://bigquivdigitals.com.evil.tld", null), false);
  assert.equal(originAllowed(null, null), false);
});

// ---------- webhook / return ----------
async function newPaidableOrder(h: Harness, expected = 8900000) {
  h.setFlw(() => json({ status: "success", data: { link: LINK } }));
  const r = await handleCheckout(h.deps, { body: okBody(), ip: null });
  const order = [...h.store.orders.values()].find((o) => o.orderRef === r.body.orderRef)!;
  assert.equal(order.expectedMinor, expected);
  return order;
}
const verifyAnswer = (ref: string, over: Record<string, unknown> = {}) =>
  json({ status: "success", data: { id: 777, tx_ref: ref, status: "successful", currency: "NGN", amount: 89000, ...over } });
const hook = (ref: string, over: Record<string, unknown> = {}) => ({
  event: "charge.completed",
  data: { id: 777, tx_ref: ref, status: "successful", amount: 1, currency: "USD", ...over },
});

test("webhook: valid payment pays the order once and schedules delivery once; replay is a no-op 200", async () => {
  const h = harness();
  const order = await newPaidableOrder(h);
  h.fetchCalls.length = 0;
  h.setFlw(() => verifyAnswer(order.orderRef));
  const first = await handleCompanionFlutterwaveWebhook(h.deps, { verifHash: HASH, event: hook(order.orderRef) });
  assert.equal(first.status, 200);
  assert.equal(first.body.outcome, "paid_now");
  assert.equal(h.store.orders.get(order.id)!.status, "paid");
  assert.equal(h.store.orders.get(order.id)!.providerTxId, "777");
  assert.equal(h.fetchCalls[0].url, "https://api.flutterwave.com/v3/transactions/777/verify");
  const again = await handleCompanionFlutterwaveWebhook(h.deps, { verifHash: HASH, event: hook(order.orderRef) });
  assert.equal(again.status, 200);
  assert.equal(again.body.outcome, "already_paid");
  assert.deepEqual(h.delivered, [order.id]);
});

test("webhook: the body amount/currency are ignored; the VERIFY response decides", async () => {
  const h = harness();
  const order = await newPaidableOrder(h);
  // body claims a huge payment, verify says only 100 naira
  h.setFlw(() => verifyAnswer(order.orderRef, { amount: 100 }));
  const r = await handleCompanionFlutterwaveWebhook(h.deps, { verifHash: HASH, event: hook(order.orderRef, { amount: 999999, currency: "NGN" }) });
  assert.equal(r.status, 200);
  assert.equal(r.body.outcome, "underpaid");
  assert.equal(h.store.orders.get(order.id)!.status, "underpaid");
  assert.equal(h.delivered.length, 0);
  assert.ok(h.alerts.some((a) => /UNDERPAID/.test(a)));
});

test("webhook: wrong currency, wrong ref in verify, failed status: no payment", async () => {
  for (const over of [{ currency: "USD" }, { tx_ref: "TEC-someoneelse0000000000" }, { status: "failed" }]) {
    const h = harness();
    const order = await newPaidableOrder(h);
    h.setFlw(() => verifyAnswer(order.orderRef, over));
    const r = await handleCompanionFlutterwaveWebhook(h.deps, { verifHash: HASH, event: hook(order.orderRef) });
    assert.equal(r.status, 200);
    assert.notEqual(h.store.orders.get(order.id)!.status, "paid");
    assert.equal(h.delivered.length, 0);
  }
});

test("webhook: hash is checked first and fails closed", async () => {
  const h = harness();
  const order = await newPaidableOrder(h);
  h.fetchCalls.length = 0;
  for (const bad of [null, "", "wrong", HASH + "x"]) {
    const r = await handleCompanionFlutterwaveWebhook(h.deps, { verifHash: bad, event: hook(order.orderRef) });
    assert.equal(r.status, 401);
  }
  const noSecret = { ...h.deps, env: { ...h.deps.env, flwSecretHash: "" } };
  assert.equal((await handleCompanionFlutterwaveWebhook(noSecret, { verifHash: "", event: hook(order.orderRef) })).status, 401);
  assert.equal(h.fetchCalls.length, 0);
});

test("webhook: real internal errors give 500 (so Flutterwave retries); duplicates and noise give 200", async () => {
  const h = harness();
  const order = await newPaidableOrder(h);
  h.setFlw(() => json({}, 503));
  assert.equal((await handleCompanionFlutterwaveWebhook(h.deps, { verifHash: HASH, event: hook(order.orderRef) })).status, 500);

  h.setFlw(() => verifyAnswer(order.orderRef));
  const broken = { ...h.deps, store: Object.assign(Object.create(h.store), { getOrderByRef: async () => { throw new Error("db down"); } }) };
  assert.equal((await handleCompanionFlutterwaveWebhook(broken, { verifHash: HASH, event: hook(order.orderRef) })).status, 500);

  assert.equal((await handleCompanionFlutterwaveWebhook(h.deps, { verifHash: HASH, event: { event: "transfer.completed", data: {} } })).status, 200);
  assert.equal((await handleCompanionFlutterwaveWebhook(h.deps, { verifHash: HASH, event: hook(order.orderRef, { status: "failed" }) })).status, 200);
  assert.equal((await handleCompanionFlutterwaveWebhook(h.deps, { verifHash: HASH, event: hook(order.orderRef, { id: "abc" }) })).status, 400);
  assert.equal(h.delivered.length, 0);
});

test("webhook: unknown TEC- order is acknowledged (200) and the owner is alerted; payment id reuse flags the order", async () => {
  const h = harness();
  h.setFlw(() => verifyAnswer("TEC-doesnotexist00000000a"));
  const r = await handleCompanionFlutterwaveWebhook(h.deps, { verifHash: HASH, event: hook("TEC-doesnotexist00000000a") });
  assert.equal(r.status, 200);
  assert.ok(h.alerts.some((a) => /unknown order/.test(a)));

  const a = await newPaidableOrder(h);
  const b = await newPaidableOrder(h);
  h.setFlw(() => verifyAnswer(a.orderRef));
  await handleCompanionFlutterwaveWebhook(h.deps, { verifHash: HASH, event: hook(a.orderRef) });
  h.setFlw(() => verifyAnswer(b.orderRef)); // same id 777 for a different order
  const r2 = await handleCompanionFlutterwaveWebhook(h.deps, { verifHash: HASH, event: hook(b.orderRef) });
  assert.equal(r2.body.outcome, "flagged");
  assert.equal(h.store.orders.get(b.id)!.status, "flagged");
  assert.deepEqual(h.delivered, [a.id]);
});

test("webhook and return arriving in either order: one winner, one delivery", async () => {
  for (const returnFirst of [true, false]) {
    const h = harness();
    const order = await newPaidableOrder(h);
    h.setFlw(() => verifyAnswer(order.orderRef));
    const ret = () => handleReturn(h.deps, { status: "successful", txRef: order.orderRef, transactionId: "777" });
    const hk = () => handleCompanionFlutterwaveWebhook(h.deps, { verifHash: HASH, event: hook(order.orderRef) });
    if (returnFirst) { await ret(); await hk(); } else { await hk(); await ret(); }
    assert.equal(h.store.orders.get(order.id)!.status, "paid");
    assert.deepEqual(h.delivered, [order.id]);
  }
  // truly concurrent
  const h = harness();
  const order = await newPaidableOrder(h);
  h.setFlw(() => verifyAnswer(order.orderRef));
  await Promise.all([
    handleReturn(h.deps, { status: "successful", txRef: order.orderRef, transactionId: "777" }),
    handleCompanionFlutterwaveWebhook(h.deps, { verifHash: HASH, event: hook(order.orderRef) }),
    handleCompanionFlutterwaveWebhook(h.deps, { verifHash: HASH, event: hook(order.orderRef) }),
  ]);
  assert.equal(h.delivered.length, 1);
});

test("return: query string is never trusted", async () => {
  const h = harness();
  const order = await newPaidableOrder(h);
  // status=successful in the URL but Flutterwave says failed
  h.setFlw(() => verifyAnswer(order.orderRef, { status: "failed" }));
  const r = await handleReturn(h.deps, { status: "successful", txRef: order.orderRef, transactionId: "777" });
  assert.equal(r.location, `${THANKS_PATH}?ref=${order.orderRef}`);
  assert.equal(h.store.orders.get(order.id)!.status, "awaiting_payment");
  // transaction id of another payment (tx_ref differs from the query): ignored
  h.setFlw(() => verifyAnswer("TEC-otherorder000000000a"));
  await handleReturn(h.deps, { status: "successful", txRef: order.orderRef, transactionId: "777" });
  assert.equal(h.store.orders.get(order.id)!.status, "awaiting_payment");
  // cancelled with no id: no provider call at all
  h.fetchCalls.length = 0;
  await handleReturn(h.deps, { status: "cancelled", txRef: order.orderRef, transactionId: null });
  assert.equal(h.fetchCalls.length, 0);
  // non-companion ref goes to the product page, no calls
  assert.equal((await handleReturn(h.deps, { status: "successful", txRef: "QV-123", transactionId: "9" })).location, "/theeditcompanion");
  assert.equal(h.fetchCalls.length, 0);
  // no id but status successful: verified by reference
  h.setFlw(() => verifyAnswer(order.orderRef));
  await handleReturn(h.deps, { status: "successful", txRef: order.orderRef, transactionId: null });
  assert.match(h.fetchCalls[0].url, /verify_by_reference\?tx_ref=TEC-/);
  assert.equal(h.store.orders.get(order.id)!.status, "paid");
});

test("return: a provider outage does not throw and still lands on the thanks page", async () => {
  const h = harness();
  const order = await newPaidableOrder(h);
  h.setFlw(() => { throw new Error("network"); });
  const r = await handleReturn(h.deps, { status: "successful", txRef: order.orderRef, transactionId: "777" });
  assert.equal(r.location, `${THANKS_PATH}?ref=${order.orderRef}`);
  assert.equal(h.store.orders.get(order.id)!.status, "awaiting_payment");
});

test("an expired order that is really paid late is honoured", async () => {
  const h = harness();
  const order = await newPaidableOrder(h);
  h.store.orders.get(order.id)!.status = "expired";
  h.setFlw(() => verifyAnswer(order.orderRef));
  await handleCompanionFlutterwaveWebhook(h.deps, { verifHash: HASH, event: hook(order.orderRef) });
  assert.equal(h.store.orders.get(order.id)!.status, "paid");
});

// ---------- transfer-paid ----------
async function transferOrder() {
  const h = harness({ allowManualTransfer: true }, "Bank 1");
  const r = await handleCheckout(h.deps, { body: okBody({ method: "bank_transfer" }), ip: null });
  return { h, ref: String(r.body.orderRef), cookie: r.claimToken! };
}

test("transfer-paid: records the claim, alerts the owner, never marks paid", async () => {
  const { h, ref, cookie } = await transferOrder();
  const r = await handleTransferPaid(h.deps, { body: { orderRef: ref, senderName: "Ada O\u0000kafor", note: "paid 2pm" }, claimCookie: cookie });
  assert.equal(r.status, 200);
  assert.equal(r.body.state, "awaiting_transfer");
  const order = [...h.store.orders.values()][0];
  assert.equal(order.status, "awaiting_transfer");
  assert.ok(h.store.events.some((e) => e.kind === "transfer_claimed" && e.actor === "buyer"));
  assert.equal(h.alerts.length, 1);
  assert.equal(h.delivered.length, 0);
});

test("transfer-paid: needs the claim cookie; one uniform 404; 3 per day cap; only transfer orders", async () => {
  const { h, ref, cookie } = await transferOrder();
  for (const c of [undefined, "wrong-cookie-value-wrong-cookie-value", cookie + "x"]) {
    assert.equal((await handleTransferPaid(h.deps, { body: { orderRef: ref }, claimCookie: c })).status, 404);
  }
  assert.equal((await handleTransferPaid(h.deps, { body: { orderRef: "TEC-nope" }, claimCookie: cookie })).status, 404);
  assert.equal((await handleTransferPaid(h.deps, { body: { orderRef: "QV-1" }, claimCookie: cookie })).status, 404);
  for (let i = 0; i < 3; i++) assert.equal((await handleTransferPaid(h.deps, { body: { orderRef: ref }, claimCookie: cookie })).status, 200);
  assert.equal((await handleTransferPaid(h.deps, { body: { orderRef: ref }, claimCookie: cookie })).status, 429);

  // a card order cannot use this route even with its own cookie
  const card = harness();
  card.setFlw(() => json({ status: "success", data: { link: LINK } }));
  const cr = await handleCheckout(card.deps, { body: okBody(), ip: null });
  assert.equal((await handleTransferPaid(card.deps, { body: { orderRef: cr.body.orderRef }, claimCookie: cr.claimToken })).status, 404);
});

test("transfer-paid: an alert failure does not fail the buyer", async () => {
  const { h, ref, cookie } = await transferOrder();
  const deps = { ...h.deps, alert: async () => { throw new Error("telegram down"); } };
  assert.equal((await handleTransferPaid(deps, { body: { orderRef: ref }, claimCookie: cookie })).status, 200);
});
