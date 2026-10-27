/**
 * Review-fix tests (REVIEW-WAVE2: H5, M2, M3, M5, M6, M9). Each one fails on the
 * pre-fix code. Run: npx tsx --test lib/companion/__tests__/fixes.test.ts
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import { adminMarkTransferPaid, checkReferenceUse } from "../admin-ops";
import { DEV_TEST_SALT, handleCheckout, originAllowed } from "../checkout-handler";
import { hashIp } from "../consent";
import { deliverOrderWith } from "../delivery";
import type { PaymentsDeps } from "../deps";
import { renderOwnerNewOrder } from "../emails/templates";
import { env, hostAllowed, resolveSiteBase } from "../env";
import { handleCompanionFlutterwaveWebhook } from "../flutterwave-handler";
import { createNeonCompanionStore, type Row, type SqlClient } from "../neon-store";
import { runPostPayment } from "../post-payment";
import { MemoryStore, sampleProduct } from "../testing/memory-store";
import { checkout, flwTx, makeWorld, sendWebhook } from "../../../tests/companion-e2e/harness";

// ---------- H5: Preview host + redirect base ----------
test("H5: Preview host is allowed outside production only; lookalikes never", () => {
  assert.equal(originAllowed("https://website-git-feat-x.vercel.app", null, false), true);
  assert.equal(originAllowed("https://website-git-feat-x.vercel.app", null, true), false);
  assert.equal(originAllowed("http://localhost:3000", null, true), false, "localhost not allowed in production");
  assert.equal(originAllowed("http://localhost:3000", null, false), true);
  assert.equal(originAllowed("https://bigquivdigitals.com", null, true), true);
  assert.equal(originAllowed("https://vercel.app.evil.tld", null, false), false);
  assert.equal(originAllowed("https://evilvercel.app", null, false), false);
  assert.equal(hostAllowed("bigquivdigitals.com.evil.tld", false), false);
});

test("H5: redirect base is SITE_URL in production and the request origin / VERCEL_URL elsewhere", () => {
  assert.equal(resolveSiteBase("https://evil.vercel.app", true, "x.vercel.app"), "https://bigquivdigitals.com");
  assert.equal(resolveSiteBase("https://pv-1.vercel.app", false, ""), "https://pv-1.vercel.app");
  assert.equal(resolveSiteBase("https://evil.example.com", false, "pv-2.vercel.app"), "https://pv-2.vercel.app");
  assert.equal(resolveSiteBase(null, false, ""), "https://bigquivdigitals.com");
  assert.equal(resolveSiteBase("not a url", false, "bad host!"), "https://bigquivdigitals.com");
});

// ---------- handler harness (MemoryStore) ----------
const NOW = new Date("2026-11-01T12:00:00Z");
const HASH = "h";
function h(productOver = {}, envOver: Partial<PaymentsDeps["env"]> = {}) {
  const store = new MemoryStore();
  store.products.set("theeditcompanion", sampleProduct(productOver));
  const logs: string[] = [];
  const alerts: string[] = [];
  const calls: { url: string; body?: string }[] = [];
  const delivered: string[] = [];
  const deps: PaymentsDeps = {
    store,
    now: () => NOW,
    fetch: (async (u: RequestInfo | URL, init?: RequestInit) => {
      calls.push({ url: String(u), body: init?.body as string | undefined });
      return new Response(JSON.stringify({ status: "success", data: { link: "https://checkout.flutterwave.com/v3/hosted/pay/x" } }));
    }) as typeof fetch,
    env: { flwSecretKey: "k", flwSecretHash: HASH, ipSalt: "salt", production: false, ...envOver },
    scheduleDelivery: (id) => void delivered.push(id),
    alert: async (s) => void alerts.push(s),
    log: (m) => void logs.push(m),
    getBankDetails: async () => null,
    countOrdersByEmailSince: async () => 0,
  };
  return { deps, store, logs, alerts, calls, delivered };
}
const body = { name: "Ada", email: "ada@example.com", consentFinal: true, consentImmediate: true };

test("H5: checkout redirect_url uses the supplied base (Preview), default SITE_URL", async () => {
  const a = h();
  await handleCheckout(a.deps, { body, ip: null, siteBase: "https://pv-1.vercel.app" });
  assert.equal(JSON.parse(a.calls[0].body!).redirect_url, "https://pv-1.vercel.app/api/companion/return");
  const b = h();
  await handleCheckout(b.deps, { body, ip: null });
  assert.equal(JSON.parse(b.calls[0].body!).redirect_url, "https://bigquivdigitals.com/api/companion/return");
});

// ---------- M5: ORDER_IP_SALT ----------
test("M5: production with no salt refuses to create an order and logs loudly", async () => {
  const a = h({}, { ipSalt: "", production: true });
  const r = await handleCheckout(a.deps, { body, ip: "1.2.3.4" });
  assert.equal(r.status, 500);
  assert.equal(a.store.orders.size, 0);
  assert.equal(a.calls.length, 0);
  assert.ok(a.logs.some((l) => /ORDER_IP_SALT/.test(l)));
});

test("M5: outside production a missing salt uses the fixed test salt", async () => {
  const a = h({}, { ipSalt: "", production: false });
  const r = await handleCheckout(a.deps, { body, ip: "1.2.3.4" });
  assert.equal(r.status, 200);
  assert.equal([...a.store.orders.values()][0].consentIpHash, hashIp("1.2.3.4", DEV_TEST_SALT));
});

// ---------- M6: env helper ----------
test("M6: env() trims and never returns undefined", () => {
  process.env.TEC_TEST_VAR = "  secret\n";
  assert.equal(env("TEC_TEST_VAR"), "secret");
  assert.equal(env("TEC_TEST_VAR_UNSET"), "");
  delete process.env.TEC_TEST_VAR;
});

// ---------- M2 + S12c: bank reference reuse ----------
test("M2/S12c: a reference used by a PAID order is refused for another order unless overridden with a note; the override does not corrupt anything", async () => {
  const w = await makeWorld({ product: { allowManualTransfer: true } });
  const ids: string[] = [];
  for (const email of ["a@example.com", "b@example.com"]) {
    const c = await checkout(w, { method: "bank_transfer", email });
    assert.equal(c.res.status, 200);
    ids.push(c.order!.id);
  }
  const admin = async () => ({ userId: 1 });
  assert.equal((await adminMarkTransferPaid(w.rt, admin, { orderId: ids[0], amount: "89000", reference: " GTB  Same " })).ok, true);
  const warn = await checkReferenceUse(w.rt, admin, "gtb same", ids[1]);
  assert.equal(warn.used, true);
  assert.match(warn.warning ?? "", /already used to release TEC-/);
  assert.equal((await checkReferenceUse(w.rt, admin, "other-ref", ids[1])).warning, null);
  const refused = await adminMarkTransferPaid(w.rt, admin, { orderId: ids[1], amount: "89000", reference: "GTB SAME" });
  assert.deepEqual([refused.ok, (refused as { reason?: string }).reason], [false, "reference_used"]);
  const noNote = await adminMarkTransferPaid(w.rt, admin, { orderId: ids[1], amount: "89000", reference: "GTB SAME", overrideReference: true });
  assert.equal((noNote as { reason?: string }).reason, "override_needs_note");
  const ok = await adminMarkTransferPaid(w.rt, admin, { orderId: ids[1], amount: "89000", reference: "GTB SAME", overrideReference: true, note: "two real transfers, same narration" });
  assert.equal(ok.ok, true);
  assert.equal(w.orders().filter((o) => o.status === "paid").length, 2);
  assert.equal(w.orders().filter((o) => o.status === "flagged").length, 0);
});

// ---------- M3: owner alert independent of delivery ----------
type World = Awaited<ReturnType<typeof makeWorld>>;
function parts(w: World, deliver: (id: string) => Promise<{ ok: boolean; reason?: string }>) {
  const errors: string[] = [];
  const order: string[] = [];
  return {
    errors,
    order,
    p: {
      store: w.store,
      now: () => w.clock.t,
      deliver: async (id: string) => (order.push("deliver"), deliver(id)),
      alert: async (s: string) => void (order.push(`alert:${s}`), w.alerts.push({ subject: s, text: "" })),
      renderNewOrder: renderOwnerNewOrder,
      error: (m: string) => void errors.push(m),
    },
  };
}
async function paidOrder(w: World) {
  const c = await checkout(w);
  const tx = flwTx(w, c.order!);
  await sendWebhook(w, tx);
  await w.settle();
  w.alerts.length = 0;
  return c.order!.id;
}

test("M3: owner alert is sent BEFORE delivery, once, and delivery throwing is logged, evented and alerted", async () => {
  const w = await makeWorld();
  const id = await paidOrder(w);
  // drop the alert marker the earlier delivery wrote, to simulate a fresh paid order
  w.store.events = w.store.events.filter((e) => e.kind !== "owner_alerted");
  const x = parts(w, async () => {
    throw new Error("db down");
  });
  await runPostPayment(x.p, id);
  assert.match(x.order[0], /^alert:New TheEditCompanion order/);
  assert.equal(x.order[1], "deliver");
  assert.ok(x.errors.some((e) => /DELIVERY FAILED/.test(e)));
  assert.ok(w.store.events.some((e) => e.kind === "delivery_failed"));
  assert.ok(w.alerts.some((a) => /DELIVERY FAILED/.test(a.subject)));
  // idempotent: a second run does not send another new-order alert
  const before = w.alerts.filter((a) => /New TheEditCompanion order/.test(a.subject)).length;
  await runPostPayment(x.p, id);
  assert.equal(w.alerts.filter((a) => /New TheEditCompanion order/.test(a.subject)).length, before);
});

test("M3: together with delivery.ts deliverOrder exactly one new-order alert is sent", async () => {
  const w = await makeWorld();
  const c = await checkout(w);
  const tx = flwTx(w, c.order!);
  w.hold.gate = new Promise(() => {}); // keep the harness's own delivery from running
  await sendWebhook(w, tx);
  w.alerts.length = 0;
  const x = parts(w, (id) => deliverOrderWith(w.rt, id));
  await runPostPayment(x.p, c.order!.id);
  assert.equal(w.alerts.filter((a) => /New TheEditCompanion order/.test(a.subject)).length, 1);
  assert.equal(w.sender.sent.length, 1, "the buyer email still goes out");
});

test("M3: a not-ok delivery result is also treated as a failure", async () => {
  const w = await makeWorld();
  const id = await paidOrder(w);
  const x = parts(w, async () => ({ ok: false, reason: "email_failed" }));
  await runPostPayment(x.p, id);
  assert.ok(w.store.events.some((e) => e.kind === "delivery_failed"));
});

// ---------- M9: expiry on read ----------
const UUID = "11111111-1111-4111-8111-111111111111";
const row = (over: Row = {}): Row => ({
  id: UUID, order_ref: "TEC-abc", product_slug: "theeditcompanion", email: "a@b.co", name: "Ada",
  status: "awaiting_payment", method: "flutterwave", price_tier: "founders", expected_minor: 8900000, currency: "NGN",
  support_until: null, provider_tx_id: null, provider_ref: null, amount_received_minor: null, received_note: null,
  consent_at: NOW, consent_version: "v", consent_ip_hash: null, src: null, claim_hash: "h", created_at: NOW, paid_at: null,
  ...over,
});
const hoursAgo = (n: number) => new Date(NOW.getTime() - n * 3600 * 1000);
function sqlFor(first: Row, expireWins = true) {
  const calls: { text: string; params: unknown[] }[] = [];
  const sql: SqlClient = {
    async query(text, params = []) {
      calls.push({ text: text.replace(/\s+/g, " ").trim(), params });
      if (text.includes("SET status = 'expired'")) return expireWins ? [{ ...first, status: "expired" }] : [];
      return [first];
    },
  };
  return { sql, calls, store: createNeonCompanionStore(sql, () => NOW) };
}

test("M9: a card order unpaid for 48h+ expires when read; 47h does not", async () => {
  const old = sqlFor(row({ created_at: hoursAgo(49) }));
  const o = await old.store.getOrderByRef("TEC-abc");
  assert.equal(o?.status, "expired");
  const upd = old.calls.find((c) => c.text.includes("SET status = 'expired'"))!;
  assert.match(upd.text, /WHERE id = \$1 AND status = ANY\(\$2::text\[\]\) AND created_at <= \$3 RETURNING \*/);
  assert.deepEqual(upd.params[1], ["created", "awaiting_payment"]);
  assert.ok(old.calls.some((c) => /INSERT INTO companion_order_events/.test(c.text)));

  const fresh = sqlFor(row({ created_at: hoursAgo(47) }));
  assert.equal((await fresh.store.getOrderByRef("TEC-abc"))?.status, "awaiting_payment");
  assert.equal(fresh.calls.length, 1);
});

test("M9: manual transfer lasts 14 days; paid orders never expire; a lost race returns the truth", async () => {
  const t13 = sqlFor(row({ status: "awaiting_transfer", method: "bank_transfer", created_at: hoursAgo(13 * 24) }));
  assert.equal((await t13.store.getOrderById(UUID))?.status, "awaiting_transfer");
  const t15 = sqlFor(row({ status: "awaiting_transfer", method: "bank_transfer", created_at: hoursAgo(15 * 24) }));
  assert.equal((await t15.store.getOrderById(UUID))?.status, "expired");
  const paid = sqlFor(row({ status: "paid", created_at: hoursAgo(500) }));
  assert.equal((await paid.store.getOrderById(UUID))?.status, "paid");
  assert.equal(paid.calls.length, 1);
  const race = sqlFor(row({ created_at: hoursAgo(60) }), false);
  const r = await race.store.getOrderById(UUID);
  assert.equal(r?.status, "awaiting_payment", "re-read after the lost race");
});

test("M9: stale transfer orders stop holding founders places", async () => {
  const s = sqlFor(row());
  await s.store.countFoundersTaken("p", hoursAgo(1));
  const c = s.calls[0];
  assert.match(c.text, /status = 'awaiting_transfer' AND created_at >= \$3/);
  assert.equal((c.params[2] as Date).getTime(), NOW.getTime() - 14 * 24 * 3600 * 1000);
});

// ---------- M9: price lock does not outlive expiry; late real payment still honoured ----------
async function expiredFoundersOrder(x: ReturnType<typeof h>) {
  const r = await handleCheckout(x.deps, { body, ip: null });
  assert.equal(r.status, 200);
  const o = [...x.store.orders.values()][0];
  assert.equal(o.priceTier, "founders");
  o.status = "expired";
  return o;
}
const verify = (ref: string, amount: number) =>
  new Response(JSON.stringify({ status: "success", data: { id: 901, tx_ref: ref, status: "successful", currency: "NGN", amount } }));
async function payLate(x: ReturnType<typeof h>, ref: string, amount: number) {
  const d = { ...x.deps, fetch: (async () => verify(ref, amount)) as typeof fetch };
  return handleCompanionFlutterwaveWebhook(d, { verifHash: HASH, event: { event: "charge.completed", data: { id: 901, tx_ref: ref, status: "successful" } } });
}

test("M9 boundary: expired founders order paid late while the window is still open is honoured at the founders price", async () => {
  const x = h({ foundersEndsAt: new Date(NOW.getTime() + 1) });
  const o = await expiredFoundersOrder(x);
  const r = await payLate(x, o.orderRef, 89000);
  assert.equal(r.body.outcome, "paid_now");
  assert.equal(x.store.orders.get(o.id)!.status, "paid");
});

test("M9 boundary: at the exact end instant the window is closed; the founders amount no longer buys an expired order", async () => {
  const x = h({ foundersEndsAt: new Date(NOW.getTime() + 60_000) });
  const o = await expiredFoundersOrder(x);
  x.store.products.get("theeditcompanion")!.foundersEndsAt = new Date(NOW.getTime()); // now == end: regular
  const r = await payLate(x, o.orderRef, 89000);
  assert.equal(r.status, 200);
  assert.equal(r.body.outcome, "underpaid");
  assert.equal(x.store.orders.get(o.id)!.status, "underpaid");
  assert.equal(x.delivered.length, 0);
  assert.ok(x.alerts.some((a) => /LATE payment/.test(a)));
});

test("M9: after the window, an expired order paid at the regular price is honoured (real money is not lost)", async () => {
  const x = h({ foundersEndsAt: new Date(NOW.getTime() + 60_000) });
  const o = await expiredFoundersOrder(x);
  x.store.products.get("theeditcompanion")!.foundersEndsAt = new Date(NOW.getTime() - 1);
  const r = await payLate(x, o.orderRef, 129000);
  assert.equal(r.body.outcome, "paid_now");
  assert.deepEqual(x.delivered, [o.id]);
});

test("M9: a NOT expired founders order keeps its price lock until it expires", async () => {
  const x = h({ foundersEndsAt: new Date(NOW.getTime() + 60_000) });
  await handleCheckout(x.deps, { body, ip: null });
  const o = [...x.store.orders.values()][0];
  x.store.products.get("theeditcompanion")!.foundersEndsAt = new Date(NOW.getTime() - 1);
  const r = await payLate(x, o.orderRef, 89000);
  assert.equal(r.body.outcome, "paid_now");
});

// ---------- S7 / S14: the REAL SQL shape of the atomic operations ----------
const dupErr = (constraint: string) => Object.assign(new Error(`duplicate key value violates unique constraint "${constraint}"`), { code: "23505", constraint });
function scripted(handler: (text: string, params: unknown[], n: number) => Row[] | Error) {
  const calls: { text: string; params: unknown[] }[] = [];
  const sql: SqlClient = {
    async query(text, params = []) {
      calls.push({ text: text.replace(/\s+/g, " ").trim(), params });
      const r = handler(text, params, calls.length);
      if (r instanceof Error) throw r;
      return r;
    },
  };
  return { calls, store: createNeonCompanionStore(sql, () => NOW) };
}
const product = sampleProduct({ foundersCap: 1 });
const build = (price: { tier: "founders" | "regular"; amountMinor: number }) => ({
  orderRef: "TEC-x", productSlug: "theeditcompanion", email: "a@b.co", name: "A", status: "awaiting_payment" as const, method: "flutterwave" as const,
  priceTier: price.tier, expectedMinor: price.amountMinor, currency: "NGN" as const, consentAt: NOW, consentVersion: "v", consentIpHash: null, src: null, claimHash: "h", createdAt: NOW,
});
const place = (store: ReturnType<typeof scripted>["store"], over = {}) =>
  store.placeOrder({ product, email: "a@b.co", method: "flutterwave", now: NOW, holdSince: hoursAgo(1), build, ...over });

test("S7: the last founders place is a numbered slot; a lost slot race falls to the regular price", async () => {
  let inserts = 0;
  const { calls, store } = scripted((text) => {
    if (/SELECT founders_slot/.test(text)) return inserts === 0 ? [] : [{ founders_slot: 1 }];
    if (/^\s*INSERT INTO companion_orders/.test(text)) {
      inserts++;
      return inserts === 1 ? dupErr("companion_orders_founders_slot_uidx") : [row({ price_tier: "regular", expected_minor: 12900000 })];
    }
    return [];
  });
  const r = await place(store);
  assert.equal(r.kind, "created");
  assert.equal(r.kind === "created" && r.price.tier, "regular", "lost the slot, gets the regular price");
  const ins = calls.filter((c) => /^INSERT INTO companion_orders/.test(c.text));
  assert.equal(ins[0].params[15], 1, "first attempt claims slot 1 as founders");
  assert.equal(ins[0].params[6], "founders");
  assert.equal(ins[1].params[15], null);
  assert.equal(ins[1].params[6], "regular");
});

test("S14: an in-flight card order is returned instead of a second one", async () => {
  const { store } = scripted((text) => {
    if (/^INSERT INTO companion_orders/.test(text)) return dupErr("companion_orders_inflight_uidx");
    if (/provider_ref IS NULL\s+LIMIT 1/.test(text)) return [row({ provider_ref: null })];
    return [];
  });
  const r = await place(store, { product: sampleProduct() });
  assert.equal(r.kind, "in_flight");
});

test("S14: attempts are claimed one numbered slot at a time (insert-or-skip); the 6th is refused", async () => {
  let taken = 0;
  const { calls, store } = scripted((text) => {
    if (/INSERT INTO companion_checkout_attempts/.test(text)) {
      if (taken < 5) { taken++; return [{ n: taken }]; }
      return [];
    }
    return [];
  });
  for (let i = 0; i < 5; i++) assert.equal(await store.reserveCheckoutAttempt("a@b.co", NOW, 5), true);
  assert.equal(await store.reserveCheckoutAttempt("a@b.co", NOW, 5), false);
  assert.match(calls[0].text, /ON CONFLICT DO NOTHING RETURNING n/);
});

test("S15: duplicate payments raise a duplicate_payment event and an alert, and send no second delivery", async () => {
  const x = h();
  const r1 = await handleCheckout(x.deps, { body, ip: null });
  const o1 = [...x.store.orders.values()][0];
  assert.equal(r1.status, 200);
  const d = (ref: string, id: number, amount = 89000) => ({
    ...x.deps,
    fetch: (async () => new Response(JSON.stringify({ status: "success", data: { id, tx_ref: ref, status: "successful", currency: "NGN", amount } }))) as typeof fetch,
  });
  const ev = (ref: string, id: number) => ({ event: "charge.completed", data: { id, tx_ref: ref, status: "successful" } });
  await handleCompanionFlutterwaveWebhook(d(o1.orderRef, 11), { verifHash: HASH, event: ev(o1.orderRef, 11) });
  assert.equal(x.delivered.length, 1);
  // same order, different payment id
  await handleCompanionFlutterwaveWebhook(d(o1.orderRef, 12), { verifHash: HASH, event: ev(o1.orderRef, 12) });
  assert.equal(x.delivered.length, 1);
  assert.ok(x.store.events.some((e) => e.kind === "duplicate_payment" && e.orderId === o1.id));
  assert.ok(x.alerts.some((a) => /DUPLICATE/.test(a)));
  // replay of the SAME payment id is silent
  const before = x.alerts.length;
  await handleCompanionFlutterwaveWebhook(d(o1.orderRef, 11), { verifHash: HASH, event: ev(o1.orderRef, 11) });
  assert.equal(x.alerts.length, before);
});
