import assert from "node:assert/strict";
import { test } from "node:test";
import { checkPayment } from "./confirm";
import { consentGiven, CONSENT_VERSION } from "./consent";
import { computeHmacHex, safeEqual, verifyFlutterwaveHash, verifyHmac } from "./hmac";
import { toMinor } from "./money";
import { applyVerifiedPayment, createOrder, markOrderPaid, quote, supportUntil } from "./orders";
import { sanitiseSrc } from "./src";
import { currentTier } from "./tiers";
import { consumeDownload, hashToken, inspectToken, issueDownloadLink, mintToken, resendLink, revokeLinks } from "./tokens";
import { MemoryStore, sampleProduct } from "./testing/memory-store";

const NOW = new Date("2026-11-01T12:00:00Z");
const OK_CONSENT = { allSalesFinal: true, immediateAccess: true };

function setup(over = {}) {
  const store = new MemoryStore();
  store.products.set("theeditcompanion", sampleProduct(over));
  return store;
}
const base = (over = {}) => ({
  productSlug: "theeditcompanion",
  name: "Ada",
  email: "Ada@Example.com",
  method: "flutterwave" as const,
  consent: OK_CONSENT,
  ipSalt: "salt",
  ip: "1.2.3.4",
  now: NOW,
  ...over,
});

// ---- tiers
test("tier: neither set keeps founders on, no counter", () => {
  const r = currentTier(sampleProduct(), NOW, 999);
  assert.equal(r.tier, "founders");
  assert.equal(r.amountMinor, 8_900_000);
  assert.equal(r.foundersPlacesLeft, null);
  assert.equal(r.countdownTo, null);
});
test("tier: date edge (before, at, after)", () => {
  const p = sampleProduct({ foundersEndsAt: NOW });
  assert.equal(currentTier(p, new Date(NOW.getTime() - 1), 0).tier, "founders");
  assert.equal(currentTier(p, NOW, 0).tier, "regular");
  assert.equal(currentTier(p, new Date(NOW.getTime() + 1), 0).amountMinor, 12_900_000);
});
test("tier: cap edge", () => {
  const p = sampleProduct({ foundersCap: 10 });
  const nine = currentTier(p, NOW, 9);
  assert.equal(nine.tier, "founders");
  assert.equal(nine.foundersPlacesLeft, 1);
  assert.equal(currentTier(p, NOW, 10).tier, "regular");
});
test("tier: both set, either one ends the window", () => {
  const p = sampleProduct({ foundersEndsAt: new Date("2026-12-01T00:00:00Z"), foundersCap: 5 });
  const open = currentTier(p, NOW, 4);
  assert.equal(open.tier, "founders");
  assert.ok(open.countdownTo);
  assert.equal(currentTier(p, NOW, 5).tier, "regular");
  assert.equal(currentTier(p, new Date("2026-12-01T00:00:00Z"), 0).tier, "regular");
});

// ---- order creation and price lock
test("createOrder locks the server price and ignores a client amount", async () => {
  const store = setup();
  const r = await createOrder(store, { ...base(), amount: 1, expectedMinor: 1 } as never);
  assert.ok(r.ok);
  if (!r.ok) return;
  assert.equal(r.order.expectedMinor, 8_900_000);
  assert.equal(r.order.currency, "NGN");
  assert.equal(r.order.priceTier, "founders");
  assert.match(r.order.orderRef, /^TEC-[A-Za-z0-9_-]{22}$/);
  assert.equal(r.order.email, "ada@example.com");
  assert.equal(r.order.claimHash, hashToken(r.claimToken));
  assert.equal(r.order.consentVersion, CONSENT_VERSION);
});
test("price lock: changing the product later does not change the order", async () => {
  const store = setup();
  const r = await createOrder(store, base());
  assert.ok(r.ok);
  if (!r.ok) return;
  store.products.set("theeditcompanion", sampleProduct({ foundersEndsAt: new Date(NOW.getTime() - 1000) }));
  const again = await store.getOrderById(r.order.id);
  assert.equal(again?.expectedMinor, 8_900_000);
  assert.equal(again?.priceTier, "founders");
});
test("createOrder: regular after window, price_changed on stale shownTier", async () => {
  const store = setup({ foundersEndsAt: new Date(NOW.getTime() - 1) });
  const stale = await createOrder(store, base({ shownTier: "founders" }));
  assert.deepEqual(stale.ok, false);
  if (!stale.ok) {
    assert.equal(stale.code, "price_changed");
    if (stale.code === "price_changed") assert.equal(stale.amountMinor, 12_900_000);
  }
  const fresh = await createOrder(store, base({ shownTier: "regular" }));
  assert.ok(fresh.ok && fresh.order.expectedMinor === 12_900_000);
});
test("createOrder: validation, inactive product, manual transfer gate", async () => {
  const store = setup();
  const code = async (o: object) => {
    const r = await createOrder(store, base(o));
    return r.ok ? "ok" : r.code;
  };
  assert.equal(await code({ consent: { allSalesFinal: true } }), "consent_required");
  assert.equal(await code({ consent: { allSalesFinal: "true", immediateAccess: 1 } }), "consent_required");
  assert.equal(await code({ consent: null }), "consent_required");
  assert.equal(await code({ email: "nope" }), "invalid_email");
  assert.equal(await code({ name: "  " }), "invalid_name");
  assert.equal(await code({ productSlug: "x" }), "product_not_found");
  assert.equal(await code({ method: "bank_transfer" }), "method_not_allowed");
  store.products.set("theeditcompanion", sampleProduct({ active: false }));
  assert.equal(await code({}), "product_inactive");
  store.products.set("theeditcompanion", sampleProduct({ allowManualTransfer: true }));
  const t = await createOrder(store, base({ method: "bank_transfer" }));
  assert.ok(t.ok && t.order.status === "awaiting_transfer");
});
test("quote counts real founders rows against the cap", async () => {
  const store = setup({ foundersCap: 2 });
  assert.equal((await quote(store, "theeditcompanion", NOW))?.foundersPlacesLeft, 2);
  // Different buyers: the same buyer's second card checkout would reuse their in-flight order (store-extra.ts).
  await createOrder(store, base({ email: "one@example.com" }));
  await createOrder(store, base({ email: "two@example.com" }));
  const q = await quote(store, "theeditcompanion", NOW);
  assert.equal(q?.tier, "regular");
  // an unpaid card hold older than the hold time frees the place
  const later = new Date(NOW.getTime() + 2 * 3600 * 1000);
  assert.equal((await quote(store, "theeditcompanion", later))?.tier, "founders");
});

// ---- markOrderPaid
let buyerN = 0;
async function paidOrder(store: MemoryStore) {
  const r = await createOrder(store, base({ email: `buyer${++buyerN}@example.com` }));
  assert.ok(r.ok);
  if (!r.ok) throw new Error("x");
  return r.order;
}
test("markOrderPaid: parallel confirms give exactly one winner", async () => {
  const store = setup();
  const o = await paidOrder(store);
  const results = await Promise.all(
    Array.from({ length: 10 }, (_, i) =>
      markOrderPaid(store, o.id, { providerTxId: i === 0 ? "tx1" : "tx1", amountReceivedMinor: 8_900_000, actor: "webhook" }, NOW),
    ),
  );
  assert.equal(results.filter((r) => r.kind === "won").length, 1);
  assert.equal(results.filter((r) => r.kind === "already_paid").length, 9);
  const after = await store.getOrderById(o.id);
  assert.equal(after?.status, "paid");
  assert.equal(after?.supportUntil?.toISOString(), supportUntil(NOW).toISOString());
});
test("markOrderPaid: replay after paid is a no-op", async () => {
  const store = setup();
  const o = await paidOrder(store);
  const ev = { providerTxId: "tx1", amountReceivedMinor: 8_900_000, actor: "webhook" as const };
  assert.equal((await markOrderPaid(store, o.id, ev, NOW)).kind, "won");
  assert.equal((await markOrderPaid(store, o.id, ev, new Date(NOW.getTime() + 5000))).kind, "already_paid");
  assert.equal((await store.getOrderById(o.id))?.paidAt?.toISOString(), NOW.toISOString());
});
test("markOrderPaid: same provider payment on a second order flags it", async () => {
  const store = setup();
  const a = await paidOrder(store);
  const b = await paidOrder(store);
  await markOrderPaid(store, a.id, { providerTxId: "tx1", amountReceivedMinor: 8_900_000, actor: "webhook" }, NOW);
  const r = await markOrderPaid(store, b.id, { providerTxId: "tx1", amountReceivedMinor: 8_900_000, actor: "webhook" }, NOW);
  assert.equal(r.kind, "flagged_tx_conflict");
  assert.equal((await store.getOrderById(b.id))?.status, "flagged");
});
test("markOrderPaid: refunded order and unknown order", async () => {
  const store = setup();
  const o = await paidOrder(store);
  await store.setOrderStatus(o.id, "refunded");
  const ev = { providerTxId: "t", amountReceivedMinor: 1, actor: "admin" as const };
  assert.deepEqual(await markOrderPaid(store, o.id, ev, NOW), { kind: "not_payable", status: "refunded" });
  assert.equal((await markOrderPaid(store, "nope", ev, NOW)).kind, "not_found");
});

// ---- payment predicate and applyVerifiedPayment
test("checkPayment: rejects bad ref, status, currency, amount", async () => {
  const store = setup();
  const o = await paidOrder(store);
  const good = { txRef: o.orderRef, status: "successful", currency: "NGN", amount: 89000 };
  assert.deepEqual(checkPayment(o, good), { ok: true, receivedMinor: 8_900_000 });
  assert.deepEqual(checkPayment(o, { ...good, amount: "89000.00" }), { ok: true, receivedMinor: 8_900_000 });
  assert.equal(checkPayment(o, { ...good, amount: 95000 }).ok, true); // overpay accepted
  const why = (t: object) => {
    const r = checkPayment(o, { ...good, ...t });
    return r.ok ? "ok" : r.reason;
  };
  assert.equal(why({ txRef: "QV-123" }), "bad_ref_prefix");
  assert.equal(why({ txRef: "TEC-other" }), "ref_mismatch");
  assert.equal(why({ status: "failed" }), "status_not_successful");
  assert.equal(why({ status: "SUCCESSFUL" }), "status_not_successful");
  assert.equal(why({ currency: "USD" }), "currency_mismatch");
  assert.equal(why({ amount: 67 }), "amount_underpaid");
  assert.equal(why({ amount: 88999.99 }), "amount_underpaid");
  assert.equal(why({ amount: "abc" }), "amount_invalid");
  assert.equal(why({ amount: -5 }), "amount_invalid");
  assert.equal(why({ amount: NaN }), "amount_invalid");
});
test("applyVerifiedPayment: good, replay, underpaid, wrong ref", async () => {
  const store = setup();
  const o = await paidOrder(store);
  const tx = { txRef: o.orderRef, status: "successful", currency: "NGN", amount: 89000, providerTxId: 285959875 };
  assert.equal((await applyVerifiedPayment(store, tx, "webhook", NOW)).kind, "won");
  assert.equal((await applyVerifiedPayment(store, tx, "webhook", NOW)).kind, "already_paid");
  const o2 = await paidOrder(store);
  const low = await applyVerifiedPayment(store, { ...tx, txRef: o2.orderRef, amount: 50000, providerTxId: 2 }, "webhook", NOW);
  assert.deepEqual(low, { kind: "underpaid", receivedMinor: 5_000_000 });
  assert.equal((await store.getOrderById(o2.id))?.status, "underpaid");
  // after an underpay, a correct payment can still complete the order
  assert.equal((await applyVerifiedPayment(store, { ...tx, txRef: o2.orderRef, providerTxId: 3 }, "webhook", NOW)).kind, "won");
  assert.deepEqual(await applyVerifiedPayment(store, { ...tx, txRef: "QV-1" }, "webhook", NOW), { kind: "rejected", reason: "bad_ref_prefix" });
  assert.deepEqual(await applyVerifiedPayment(store, { ...tx, txRef: "TEC-unknown" }, "webhook", NOW), { kind: "rejected", reason: "unknown_order" });
});

// ---- money
test("toMinor is exact", () => {
  assert.equal(toMinor(89000), 8_900_000);
  assert.equal(toMinor(0.1 + 0.2 === 0.3 ? 0.3 : 0.30000000000000004), 30);
  assert.equal(toMinor("12900.50"), 1_290_050);
  assert.equal(toMinor(66.999), null);
  assert.equal(toMinor(""), null);
  assert.equal(toMinor(null), null);
});

// ---- HMAC
test("verifyFlutterwaveHash: plain secret compare, fails closed", () => {
  assert.equal(verifyFlutterwaveHash("abc123", "abc123"), true);
  assert.equal(verifyFlutterwaveHash("abc124", "abc123"), false);
  assert.equal(verifyFlutterwaveHash("abc12", "abc123"), false); // wrong length, no throw
  assert.equal(verifyFlutterwaveHash("abc1234567", "abc123"), false);
  assert.equal(verifyFlutterwaveHash(undefined, "abc123"), false);
  assert.equal(verifyFlutterwaveHash("", ""), false);
  assert.equal(verifyFlutterwaveHash("x", undefined), false);
});
test("verifyHmac: known vector, case, wrong length, fail closed", () => {
  // RFC 4231 test case 2: key "Jefe", data "what do ya want for nothing?"
  const sha512 =
    "164b7a7bfcf819e2e395fbe73b56e0a387bd64222e831fd610270cd7ea2505549758bf75c05a994a6d034f65f8f0e6fdcaeab1a34d4a6b4b636e070a38bce737";
  const body = "what do ya want for nothing?";
  assert.equal(computeHmacHex("sha512", "Jefe", body), sha512);
  assert.equal(verifyHmac({ algorithm: "sha512", secret: "Jefe", rawBody: body, signature: sha512 }), true);
  assert.equal(verifyHmac({ algorithm: "sha512", secret: "Jefe", rawBody: body, signature: sha512.toUpperCase() }), true);
  assert.equal(verifyHmac({ algorithm: "sha512", secret: "Jefe", rawBody: body, signature: sha512.slice(0, 64) }), false);
  assert.equal(verifyHmac({ algorithm: "sha512", secret: "Jefe", rawBody: body + "x", signature: sha512 }), false);
  assert.equal(verifyHmac({ algorithm: "sha512", secret: "", rawBody: body, signature: sha512 }), false);
  assert.equal(verifyHmac({ algorithm: "sha512", secret: "Jefe", rawBody: body, signature: undefined }), false);
  assert.equal(safeEqual("a", "ab"), false);
});

// ---- tokens
test("token mint and hash: random, only hash stored", async () => {
  const a = mintToken();
  const b = mintToken();
  assert.notEqual(a.token, b.token);
  assert.equal(Buffer.from(a.token, "base64url").length, 32);
  assert.equal(a.hash, hashToken(a.token));
  assert.match(a.hash, /^[0-9a-f]{64}$/);
  const store = setup();
  const o = await paidOrder(store);
  const link = await issueDownloadLink(store, { orderId: o.id, ttlHours: 168, maxDownloads: 5, createdBy: "system", now: NOW });
  for (const t of store.tokens.values()) assert.ok(!JSON.stringify(t).includes(link.token));
});
test("token: expiry, count, revoke, resend revokes old", async () => {
  const store = setup();
  const o = await paidOrder(store);
  const l1 = await issueDownloadLink(store, { orderId: o.id, ttlHours: 1, maxDownloads: 2, createdBy: "system", now: NOW });
  assert.equal((await inspectToken(store, l1.token, NOW)).state, "valid");
  assert.equal((await inspectToken(store, "garbage", NOW)).state, "invalid");
  // inspect does not consume
  assert.equal((await inspectToken(store, l1.token, NOW)).state, "valid");
  assert.equal((await consumeDownload(store, l1.token, NOW)).ok, true);
  assert.equal((await consumeDownload(store, l1.token, NOW)).ok, true);
  const third = await consumeDownload(store, l1.token, NOW);
  assert.deepEqual(third, { ok: false, reason: "exhausted" });
  // expiry
  const l2 = await issueDownloadLink(store, { orderId: o.id, ttlHours: 1, maxDownloads: 2, createdBy: "system", now: NOW });
  assert.equal((await inspectToken(store, l1.token, NOW)).state, "revoked"); // issuing revoked l1
  const later = new Date(NOW.getTime() + 3600 * 1000);
  assert.equal((await inspectToken(store, l2.token, later)).state, "expired");
  // revoke
  const l3 = await issueDownloadLink(store, { orderId: o.id, ttlHours: 5, maxDownloads: 2, createdBy: "admin", now: NOW });
  assert.equal(await revokeLinks(store, o.id, NOW), 1);
  assert.deepEqual(await consumeDownload(store, l3.token, NOW), { ok: false, reason: "revoked" });
});
test("download counter race: exactly max succeed", async () => {
  const store = setup();
  const o = await paidOrder(store);
  const l = await issueDownloadLink(store, { orderId: o.id, ttlHours: 5, maxDownloads: 5, createdBy: "system", now: NOW });
  const rs = await Promise.all(Array.from({ length: 10 }, () => consumeDownload(store, l.token, NOW)));
  assert.equal(rs.filter((r) => r.ok).length, 5);
});
test("resend: buyer limited to 3 per day, admin not, old link revoked", async () => {
  const store = setup();
  const o = await paidOrder(store);
  const opts = { orderId: o.id, ttlHours: 168, maxDownloads: 5, now: NOW };
  const first = await resendLink(store, { ...opts, by: "buyer" });
  assert.ok(first.ok);
  await resendLink(store, { ...opts, by: "buyer" });
  await resendLink(store, { ...opts, by: "buyer" });
  assert.deepEqual(await resendLink(store, { ...opts, by: "buyer" }), { ok: false, reason: "rate_limited" });
  if (first.ok) assert.equal((await inspectToken(store, first.link.token, NOW)).state, "revoked");
  assert.equal((await resendLink(store, { ...opts, by: "admin" })).ok, true);
  const nextDay = new Date(NOW.getTime() + 25 * 3600 * 1000);
  assert.equal((await resendLink(store, { ...opts, now: nextDay, by: "buyer" })).ok, true);
});

// ---- src, consent, support
test("sanitiseSrc", () => {
  assert.equal(sanitiseSrc("IG-Bio"), "ig-bio");
  assert.equal(sanitiseSrc("reel:Edit_1"), "reel:edit_1");
  assert.equal(sanitiseSrc("<script>alert(1)</script>"), "scriptalert1script");
  assert.equal(sanitiseSrc("a".repeat(100))?.length, 40);
  assert.equal(sanitiseSrc("!!!"), null);
  assert.equal(sanitiseSrc(undefined), null);
  assert.equal(sanitiseSrc(42), null);
});
test("consentGiven needs both literal true", () => {
  assert.equal(consentGiven({ allSalesFinal: true, immediateAccess: true }), true);
  assert.equal(consentGiven({ allSalesFinal: true }), false);
  assert.equal(consentGiven({ allSalesFinal: true, immediateAccess: "yes" }), false);
  assert.equal(consentGiven(undefined), false);
});
test("support_until is paid date plus 30 days", () => {
  assert.equal(supportUntil(new Date("2026-11-01T12:00:00Z")).toISOString(), "2026-12-01T12:00:00.000Z");
});
