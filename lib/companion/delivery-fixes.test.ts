/**
 * Wave 3 fixes in delivery/admin: S9 retry, S9/S18 email content, S12 buyer receipt,
 * S15 duplicate payment badge and no second email, S12c bank reference reuse.
 * Run: npx tsx --test lib/companion/delivery-fixes.test.ts
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import { adminMarkTransferPaid, findReferenceUse } from "./admin-ops";
import { CONSENT_FINAL_TEXT, CONSENT_IMMEDIATE_TEXT, CONSENT_VERSION } from "./consent";
import { deliverOrderWith, EMAIL_BACKOFF_MS } from "./delivery";
import { DELIVERY_FILE_BYTES, DELIVERY_FILE_SHA256 } from "./file-hash";
import { handleTransferPaid } from "./transfer-handler";
import { buyByCard, checkout, makeWorld } from "../../tests/companion-e2e/harness";

const admin = async () => ({ userId: 1 });
const instant = async () => undefined;

test("S9 retry: 3 attempts with 1 s and 5 s backoff, then the failure flag and one owner alert", async () => {
  const w = await makeWorld();
  const waits: number[] = [];
  w.rt.sleep = async (ms) => void waits.push(ms);
  w.sender.failNext = "always";
  const { order } = await buyByCard(w);
  assert.deepEqual(EMAIL_BACKOFF_MS, [1000, 5000]);
  assert.deepEqual(waits, [1000, 5000]);
  assert.equal(w.sender.sent.length, 0);
  assert.equal((await w.store.getEmailState(order.id)).sentAt, null);
  assert.equal(w.store.events.filter((e) => e.kind === "email_attempt_failed").length, 3);
  assert.equal(w.alerts.filter((a) => /Delivery email FAILED/.test(a.subject)).length, 1);
  assert.equal((await w.store.getOrderById(order.id))?.status, "paid");
});

test("S9 retry: success on the third attempt sends exactly one email and no failure alert", async () => {
  const w = await makeWorld();
  w.rt.sleep = instant;
  w.sender.failNext = 2;
  const { order } = await buyByCard(w);
  assert.equal(w.sender.sent.length, 1);
  assert.ok((await w.store.getEmailState(order.id)).sentAt);
  assert.ok(!w.alerts.some((a) => /FAILED/.test(a.subject)));
});

test("S9 retry: if a concurrent attempt already succeeded during the backoff, no duplicate email", async () => {
  const w2 = await makeWorld();
  w2.sender.failNext = 1;
  const c = await checkout(w2);
  const o = c.order!;
  await w2.store.claimOrderPaid(o.id, ["awaiting_payment"], {
    paidAt: w2.clock.t, providerTxId: "tx-race", amountReceivedMinor: o.expectedMinor, receivedNote: null, supportUntil: new Date(w2.clock.t.getTime() + 30 * 86400000),
  });
  w2.rt.sleep = async () => {
    await w2.store.recordEmailResult(o.id, { ok: true, at: w2.clock.t });
  };
  const r = await deliverOrderWith(w2.rt, o.id);
  assert.equal(r.ok, true);
  assert.equal(w2.sender.sent.length, 0, "the retry saw the success and stopped");
});

test("S9: the SHA-256 constant is 64 hex characters and the byte count is sane", () => {
  assert.match(DELIVERY_FILE_SHA256, /^[a-f0-9]{64}$/);
  assert.ok(Number.isInteger(DELIVERY_FILE_BYTES) && DELIVERY_FILE_BYTES > 1_000_000);
});

test("S9/S18: the delivery email prints the hash, links Terms and Licence on the production site, and repeats the consent", async () => {
  const w = await makeWorld();
  await buyByCard(w);
  const m = w.sender.sent[0];
  assert.ok(m.text.includes(DELIVERY_FILE_SHA256) && m.html.includes(DELIVERY_FILE_SHA256));
  for (const part of ["https://bigquivdigitals.com/terms", "https://bigquivdigitals.com/licence"]) {
    assert.ok(m.text.includes(part) && m.html.includes(part), part);
  }
  assert.ok(m.text.includes(CONSENT_FINAL_TEXT) && m.text.includes(CONSENT_IMMEDIATE_TEXT) && m.text.includes(CONSENT_VERSION));
  assert.ok(!/[–—]/.test(m.text + m.html), "no dashes");
});

test("S12: 'I have paid' sends the buyer an order received email once, no link in it", async () => {
  const w = await makeWorld({ product: { allowManualTransfer: true } });
  w.deps.sendBuyerEmail = (m) => w.sender.send(m);
  const c = await checkout(w, { method: "bank_transfer", email: "payer@example.com" });
  const order = c.order!;
  const body = { orderRef: order.orderRef };
  const r1 = await handleTransferPaid(w.deps, { body, claimCookie: c.claim });
  assert.equal(r1.status, 200);
  assert.equal(w.sender.sent.length, 1);
  const m = w.sender.sent[0];
  assert.equal(m.to, "payer@example.com");
  assert.match(m.text, /checking the payment/);
  assert.match(m.text, /All sales are final\. For 30 days after you buy, we help you install and run it\./);
  for (const c2 of ["@quivira_ophir", "+234 706 509 2434", "contact@bigquivdigitals.com", "@big_quiv"]) assert.ok(m.text.includes(c2), c2);
  assert.ok(!/companion\/download/.test(m.text + m.html), "no download link before payment is confirmed");
  await handleTransferPaid(w.deps, { body, claimCookie: c.claim });
  assert.equal(w.sender.sent.length, 1, "only the first notice emails the buyer");
});

test("S15: a duplicate_payment event never causes a second delivery email, and the admin list flags it", async () => {
  const w = await makeWorld();
  const { order } = await buyByCard(w);
  assert.equal(w.sender.sent.length, 1);
  await w.store.addEvent(order.id, "webhook", "duplicate_payment", "second charge tx=abc", w.clock.t);
  assert.deepEqual(await deliverOrderWith(w.rt, order.id), { ok: true, reason: "already_delivered" });
  assert.equal(w.sender.sent.length, 1);
  const rows = await w.store.listOrders({});
  assert.equal(rows.find((r) => r.order.id === order.id)?.duplicatePayment, true);
});

test("S12c: a bank reference already used on another order is refused unless overridden with a note", async () => {
  const w = await makeWorld({ product: { allowManualTransfer: true } });
  const a = await checkout(w, { method: "bank_transfer", email: "a3@example.com" });
  const b = await checkout(w, { method: "bank_transfer", email: "b3@example.com" });
  assert.equal((await adminMarkTransferPaid(w.rt, admin, { orderId: a.order!.id, amount: "89000", reference: "GTB-SAME" })).ok, true);
  assert.deepEqual(await findReferenceUse(w.rt, " gtb-same ", b.order!.id), [a.order!.orderRef], "case and space insensitive");
  const refused = await adminMarkTransferPaid(w.rt, admin, { orderId: b.order!.id, amount: "89000", reference: "GTB-SAME" });
  assert.equal(refused.ok, false);
  assert.equal(!refused.ok && refused.reason, "reference_used");
  const noNote = await adminMarkTransferPaid(w.rt, admin, { orderId: b.order!.id, amount: "89000", reference: "GTB-SAME", overrideReference: true });
  assert.equal(!noNote.ok && noNote.reason, "override_needs_note");
  assert.equal((await w.store.getOrderById(b.order!.id))?.status, "awaiting_transfer");
  const ok = await adminMarkTransferPaid(w.rt, admin, { orderId: b.order!.id, amount: "89000", reference: "GTB-SAME", overrideReference: true, note: "two buyers paid in one lump" });
  assert.equal(ok.ok, true);
  assert.ok(w.store.events.some((e) => e.orderId === b.order!.id && e.kind === "reference_override"));
});
