/**
 * Scenarios 12 and 15: manual bank transfer lifecycle, and a buyer who pays twice.
 * Run: npx tsx --test tests/companion-e2e/04-bank-transfer-double-pay.test.ts
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import { adminMarkTransferPaid } from "../../lib/companion/admin-ops";
import { handleTransferPaid, MAX_TRANSFER_CLAIMS_PER_DAY } from "../../lib/companion/transfer-handler";
import { SUPPORT_DAYS } from "../../lib/companion/orders";
import { buyByCard, checkout, flwTx, makeWorld, sendWebhook, tokenFromEmail, type World } from "./harness";

const admin = async () => ({ userId: 1 });
const DAY = 24 * 3600 * 1000;

async function transferOrder(w: World, email = "bank@example.com") {
  const c = await checkout(w, { method: "bank_transfer", email });
  assert.equal(c.res.status, 200, JSON.stringify(c.res.body));
  return c as { res: typeof c.res; order: NonNullable<typeof c.order>; claim: string };
}
const mark = (w: World, orderId: string, amount: string, reference = "GTB-0001", extra: Record<string, unknown> = {}) =>
  adminMarkTransferPaid(w.rt, admin, { orderId, amount, reference, ...extra });

test("S12 bank transfer is off by default and refused; also refused when on but no bank details are filled", async () => {
  const w = await makeWorld(); // allow_manual_transfer false, bank details present
  const off = await checkout(w, { method: "bank_transfer" });
  assert.equal(off.res.status, 400);
  assert.equal(off.res.body.code, "method_not_allowed");
  assert.equal(w.orders().length, 0);

  const noDetails = await makeWorld({ product: { allowManualTransfer: true }, bankDetails: null });
  const r = await checkout(noDetails, { method: "bank_transfer" });
  assert.equal(r.res.status, 400);
  assert.equal(noDetails.orders().length, 0);

  const flagOffDetailsOn = await makeWorld({ product: { allowManualTransfer: false }, bankDetails: "GTBank 1" });
  assert.equal((await checkout(flagOffDetailsOn, { method: "bank_transfer" })).res.status, 400);
});

test("S12 with allow_manual_transfer on: order awaits transfer, shows bank details and the ref as narration, opens no card payment", async () => {
  const w = await makeWorld({ product: { allowManualTransfer: true } });
  const { res, order } = await transferOrder(w);
  assert.equal(order.status, "awaiting_transfer");
  assert.equal(order.method, "bank_transfer");
  assert.equal(order.expectedMinor, 8_900_000);
  assert.equal(res.body.bankDetails, "GTBank 0123456789 BigQuiv Digitals");
  assert.equal(res.body.narration, order.orderRef);
  assert.equal(w.flw.calls.length, 0, "no Flutterwave call for a transfer");
  assert.equal(w.sender.sent.length, 0);
  // Consent is enforced on this path as well.
  const noConsent = await checkout(w, { method: "bank_transfer", consentImmediate: false, email: "nc@example.com" });
  assert.equal(noConsent.res.body.code, "consent_required");
});

test("S12 'I have paid' alerts the owner, needs the claim cookie, never marks paid, is capped at 3 per day", async () => {
  const w = await makeWorld({ product: { allowManualTransfer: true } });
  const { order, claim } = await transferOrder(w);
  const call = (cookie: string | undefined, body: Record<string, unknown> = {}) =>
    handleTransferPaid(w.deps, { body: { orderRef: order.orderRef, ...body }, claimCookie: cookie });

  // Uniform 404: no cookie, wrong cookie, short cookie, unknown ref, card order with a valid cookie.
  const card = await checkout(w, { email: "card@example.com" });
  const notFound = [
    await call(undefined),
    await call("W".repeat(43)),
    await call("abc"),
    await handleTransferPaid(w.deps, { body: { orderRef: "TEC-doesnotexist00000000" }, claimCookie: claim }),
    await handleTransferPaid(w.deps, { body: { orderRef: card.order!.orderRef }, claimCookie: card.claim }),
    await handleTransferPaid(w.deps, { body: { orderRef: 5 }, claimCookie: claim }),
    await handleTransferPaid(w.deps, { body: null, claimCookie: claim }),
  ];
  for (const r of notFound) {
    assert.equal(r.status, 404);
    assert.deepEqual(r.body, { ok: false, error: "We could not find this order." });
  }
  assert.equal(w.alerts.length, 0);

  const ok = await call(claim, { senderName: "  Ada\u0000 \r\nO.  ", note: "x".repeat(500) });
  assert.equal(ok.status, 200);
  assert.deepEqual(ok.body, { ok: true, state: "awaiting_transfer" });
  assert.equal(w.alerts.length, 1);
  assert.match(w.alerts[0].subject, /says they paid by transfer/);
  assert.match(w.alerts[0].text, new RegExp(order.orderRef));
  assert.match(w.alerts[0].text, /NGN 89000\.00/);
  assert.match(w.alerts[0].text, /Sender name: Ada O\./, "control characters collapsed");
  assert.ok(!/x{141}/.test(w.alerts[0].text), "note truncated to 140");
  assert.equal((await w.store.getOrderById(order.id))?.status, "awaiting_transfer", "never marked paid by the buyer");
  assert.equal([...w.store.tokens.values()].length, 0, "no link minted");
  assert.ok(w.sender.sent.every((m) => !m.text.includes("/companion/download/")), "no link released by an I-have-paid notice");

  assert.equal((await call(claim)).status, 200);
  assert.equal((await call(claim)).status, 200);
  assert.equal(MAX_TRANSFER_CLAIMS_PER_DAY, 3);
  assert.equal((await call(claim)).status, 429, "4th notice in 24 h");
  w.clock.t = new Date(w.clock.t.getTime() + DAY + 1000);
  assert.equal((await call(claim)).status, 200, "allowed again a day later");
});

test("S12b BUG check: plan section 11 sends the buyer 'Order received, confirming transfer' when they tap 'I have paid'", async () => {
  const w = await makeWorld({ product: { allowManualTransfer: true } });
  const { order, claim } = await transferOrder(w);
  await handleTransferPaid(w.deps, { body: { orderRef: order.orderRef }, claimCookie: claim });
  // BUG: handleTransferPaid only alerts the owner (PaymentsDeps has no email sender); the buyer gets no acknowledgement email.
  assert.ok(w.sender.sent.some((m) => m.to === order.email), "BUG: no 'order received' email to the buyer after 'I have paid'");
});

test("S12 admin mark paid with an EQUAL amount delivers once and sets support for 30 days", async () => {
  const w = await makeWorld({ product: { allowManualTransfer: true } });
  const { order } = await transferOrder(w);
  const r = await mark(w, order.id, "89000", "GTB-100", { note: "seen in app" });
  assert.deepEqual(r, { ok: true, delivery: { ok: true } });
  const o = (await w.store.getOrderById(order.id))!;
  assert.equal(o.status, "paid");
  assert.equal(o.amountReceivedMinor, 8_900_000);
  assert.equal(o.providerTxId, `bank:${order.orderRef}:GTB-100`);
  assert.match(o.receivedNote ?? "", /GTB-100 \| seen in app/);
  assert.equal(o.supportUntil!.getTime() - o.paidAt!.getTime(), SUPPORT_DAYS * DAY);
  assert.equal(w.sender.sent.length, 1);
  // A second click is refused and sends nothing.
  assert.deepEqual(await mark(w, order.id, "89000", "GTB-100"), { ok: false, reason: "already_paid" });
  assert.equal(w.sender.sent.length, 1);
});

test("S12 admin mark paid with MORE delivers and records the real amount", async () => {
  const w = await makeWorld({ product: { allowManualTransfer: true } });
  const { order } = await transferOrder(w);
  const r = await mark(w, order.id, "95000.50", "GTB-200");
  assert.equal(r.ok, true);
  assert.equal((await w.store.getOrderById(order.id))?.amountReceivedMinor, 9_500_050);
  assert.equal(w.sender.sent.length, 1);
});

test("S12 admin mark paid with LESS flags the order underpaid and sends nothing; a forced accept needs a note", async () => {
  const w = await makeWorld({ product: { allowManualTransfer: true } });
  const { order } = await transferOrder(w);
  assert.deepEqual(await mark(w, order.id, "88999.99", "GTB-300"), { ok: false, reason: "underpaid" });
  assert.equal((await w.store.getOrderById(order.id))?.status, "underpaid");
  assert.ok(w.store.events.some((e) => e.orderId === order.id && e.kind === "underpaid" && e.actor === "admin"));
  assert.equal(w.sender.sent.length, 0);
  assert.equal([...w.store.tokens.values()].length, 0);
  // force without a note is still refused
  assert.deepEqual(await mark(w, order.id, "50000", "GTB-301", { force: true }), { ok: false, reason: "underpaid" });
  assert.equal(w.sender.sent.length, 0);
  // top up with the full amount from the underpaid state: delivered once
  const top = await mark(w, order.id, "89000", "GTB-302");
  assert.equal(top.ok, true);
  assert.equal(w.sender.sent.length, 1);

  // A deliberate, noted exception (documented in DELIVERY.md): force + note accepts less.
  const b = await transferOrder(w, "forced@example.com");
  const forced = await mark(w, b.order.id, "80000", "GTB-303", { force: true, note: "owner agreed discount" });
  assert.equal(forced.ok, true);
  assert.equal(w.sender.sent.length, 2);
});

test("S12 admin mark paid input checks: reference, amount, method, unknown order, closed orders", async () => {
  const w = await makeWorld({ product: { allowManualTransfer: true } });
  const { order } = await transferOrder(w);
  assert.deepEqual(await mark(w, order.id, "89000", "   "), { ok: false, reason: "reference_required" });
  for (const bad of ["abc", "0", "-1", "89,000", "89000.123", "", "NaN", "Infinity"]) {
    assert.deepEqual(await mark(w, order.id, bad, "GTB-400"), { ok: false, reason: "bad_amount" }, bad);
  }
  assert.deepEqual(await mark(w, "11111111-1111-4111-8111-111111111111", "89000", "GTB-401"), { ok: false, reason: "not_found" });
  const card = (await checkout(w, { email: "cardx@example.com" })).order!;
  assert.deepEqual(await mark(w, card.id, "89000", "GTB-402"), { ok: false, reason: "not_transfer" });
  assert.equal(w.sender.sent.length, 0);
  assert.equal((await w.store.getOrderById(order.id))?.status, "awaiting_transfer", "bad input changed nothing");

  // Closed orders cannot be marked paid.
  for (const status of ["refunded", "flagged"] as const) {
    const x = await transferOrder(w, `${status}@example.com`);
    await w.store.setOrderStatus(x.order.id, status);
    const closed = await mark(w, x.order.id, "89000", `GTB-${status}`);
    assert.equal(closed.ok, false, status);
    assert.match((closed as { reason: string }).reason, /^(wrong_status|not_payable)$/, status);
    assert.equal((await w.store.getOrderById(x.order.id))?.status, status, "closed order left as it was");
  }
  assert.equal(w.sender.sent.length, 0);

});

test("S12c BUG check: one bank reference must not be able to mark two different orders paid", async () => {
  const w = await makeWorld({ product: { allowManualTransfer: true } });
  const a = await transferOrder(w, "a2@example.com");
  const b = await transferOrder(w, "b2@example.com");
  assert.equal((await mark(w, a.order.id, "89000", "GTB-SAME")).ok, true);
  const second = await mark(w, b.order.id, "89000", "GTB-SAME");
  // BUG: admin-ops builds the payment id as bank:<orderRef>:<reference>, so it is unique per order and the unique index on
  // provider_tx_id can no longer catch one transfer being used to release two orders (typo or fraud). Before the change the
  // second click was flagged (flagged_tx_conflict). Suggested fix: key the id on the reference alone, or warn when the same
  // reference already exists on another order.
  assert.equal(second.ok, false, "BUG: same bank reference released a second order");
  assert.equal(w.sender.sent.length, 1);
});

test("S12 two admins clicking Mark paid at once: one delivery", async () => {
  const w = await makeWorld({ product: { allowManualTransfer: true } });
  const { order } = await transferOrder(w);
  const rs = await Promise.all(Array.from({ length: 5 }, () => mark(w, order.id, "89000", "GTB-RACE")));
  assert.equal(rs.filter((r) => r.ok).length, 1);
  assert.equal(w.sender.sent.length, 1);
  assert.equal(w.store.events.filter((e) => e.kind === "paid").length, 1);
  assert.equal(tokenFromEmail(w.sender.sent[0]).length > 20, true);
});

test("S12 an unpaid bank transfer order keeps its founders place only as long as it is open (observation)", async () => {
  const w = await makeWorld({ product: { allowManualTransfer: true, foundersCap: 1 } });
  const { order } = await transferOrder(w);
  assert.equal(order.priceTier, "founders");
  w.clock.t = new Date(w.clock.t.getTime() + 30 * DAY);
  const next = await checkout(w, { email: "next@example.com" });
  // Documented design (INTERFACE.md countFoundersTaken): awaiting_transfer holds the place until the owner expires it.
  assert.equal(next.order!.priceTier, "regular", "an abandoned transfer order still holds the place after 30 days until expired in admin");
});

// ---------------------------------------------------------------- scenario 15

test("S15 BUG check: a second successful payment on the SAME order (different provider id) is flagged to the owner, not silently ignored", async () => {
  const w = await makeWorld();
  const { order } = await buyByCard(w);
  const alertsBefore = w.alerts.length;
  const again = flwTx(w, order); // a second, different successful Flutterwave transaction for the same tx_ref
  const r = await sendWebhook(w, again);
  await w.settle();
  assert.equal(w.sender.sent.length, 1, "no second delivery");
  // BUG: markOrderPaid returns already_paid for ANY second successful payment on a paid order, whether it is a harmless
  // replay of the same transaction or a genuine second charge with a new provider id. The second case needs an owner alert
  // (plan 20: "buyer pays twice, second payment flagged for owner"). Compare provider ids: order.providerTxId != tx.providerTxId.
  const flagged = w.alerts.length > alertsBefore || (await w.store.getOrderById(order.id))?.status === "flagged";
  assert.ok(flagged, `BUG: second payment (outcome ${String(r.body.outcome)}) raised no alert`);
});

test("S15 BUG check: two orders for the same buyer both paid (double click): the second payment is flagged, not silently delivered again", async () => {
  const w = await makeWorld();
  const first = await checkout(w, { email: "same.buyer@example.com" });
  const second = await checkout(w, { email: "same.buyer@example.com" });
  await sendWebhook(w, flwTx(w, first.order!));
  await w.settle();
  const alertsBefore = w.alerts.length;
  const r = await sendWebhook(w, flwTx(w, second.order!));
  await w.settle();
  assert.equal(r.body.outcome, "paid_now");
  const o2 = (await w.store.getOrderById(second.order!.id))!;
  // BUG: the second order is treated as an ordinary new sale: a second delivery email and a normal "New order" alert.
  // Nothing tells the owner that one email paid N178,000 for the same product. Plan 20 asks for the second payment to be flagged.
  const flagged = o2.status === "flagged" || w.alerts.slice(alertsBefore).some((a) => /twice|duplicate|second|already paid|double/i.test(a.subject + a.text));
  assert.ok(flagged, "BUG: second payment by the same email not flagged for the owner (and a second link was emailed)");
});
