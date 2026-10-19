/**
 * Scenarios 1 to 5 and 16: the card payment lifecycle through the real handlers
 * (checkout, webhook, return page, delivery, download, order-status) over the
 * in-memory fakes. Run: npx tsx --test tests/companion-e2e/01-card-lifecycle.test.ts
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import { hashToken, inspectToken } from "../../lib/companion/tokens";
import { handleReturn } from "../../lib/companion/return-handler";
import { SUPPORT_DAYS } from "../../lib/companion/orders";
import {
  FLW_HASH, THANKS_COOKIE_NAME, ZIP_BYTES, bodyBytes, buyByCard, checkout, claimJar, download, flwTx, makeWorld,
  orderStatus, sendWebhook, tokenFromEmail, tokenFromUrl,
} from "./harness";

const DAY = 24 * 3600 * 1000;

test("S1 card purchase: webhook first, then the return page. N89,000 locked, paid once, one email, support 30 days", async () => {
  const w = await makeWorld();
  const { res, order, claim } = await checkout(w, { email: "Ada@Example.com", name: "Ada Okafor", src: "x-bio" });
  assert.equal(res.status, 200);
  assert.equal(res.body.amountMinor, 8_900_000, "server price in kobo");
  assert.equal(res.body.currency, "NGN");
  assert.equal(res.body.tier, "founders");
  assert.match(String(res.body.link), /^https:\/\/checkout\.flutterwave\.com\//);
  assert.ok(order && claim);
  assert.equal(order.status, "awaiting_payment");
  assert.equal(order.expectedMinor, 8_900_000);
  assert.equal(order.claimHash, hashToken(claim as string), "only the hash of the claim cookie is stored");
  assert.notEqual(order.claimHash, claim);
  // What we asked Flutterwave to charge: N89000.00 in naira, our own ref, return URL on our domain.
  const create = w.flw.calls.find((c) => c.url.endsWith("/v3/payments"));
  const sent = create?.body as Record<string, unknown>;
  assert.equal(sent.amount, 89000);
  assert.equal(sent.currency, "NGN");
  assert.equal(sent.tx_ref, order.orderRef);
  assert.match(String(sent.redirect_url), /\/api\/companion\/return$/);

  // Webhook first.
  const tx = flwTx(w, order);
  const hook = await sendWebhook(w, tx);
  assert.equal(hook.status, 200);
  assert.equal(hook.body.outcome, "paid_now");
  await w.settle();

  const paid = (await w.store.getOrderById(order.id))!;
  assert.equal(paid.status, "paid");
  assert.equal(paid.amountReceivedMinor, 8_900_000);
  assert.equal(paid.providerTxId, String(tx.id));
  assert.ok(paid.paidAt && paid.supportUntil);
  assert.equal(paid.supportUntil.getTime() - paid.paidAt.getTime(), SUPPORT_DAYS * DAY, "support_until is paid_at + 30 days");
  assert.equal(SUPPORT_DAYS, 30);

  // Exactly one buyer email, to the normalised address, carrying the link and the support date.
  assert.equal(w.sender.sent.length, 1);
  const mail = w.sender.sent[0];
  assert.equal(mail.to, "ada@example.com");
  assert.ok(mail.text.includes(order.orderRef));
  assert.match(mail.text, /30 days of help run until \d+ \w+ 2026/);
  assert.equal(w.deliveries.length, 1);
  assert.equal(w.alerts.filter((a) => /New TheEditCompanion order/.test(a.subject)).length, 1, "owner told once");

  // Return page after the webhook: no second email, lands on the thanks page.
  const back = await handleReturn(w.deps, { status: "successful", txRef: order.orderRef, transactionId: String(tx.id) });
  assert.equal(back.location, `/theeditcompanion/thanks?ref=${order.orderRef}`);
  await w.settle();
  assert.equal(w.sender.sent.length, 1);
  assert.equal(w.deliveries.length, 1);

  // Download: every POST uses exactly one of the allowed downloads, bytes are intact.
  const token = tokenFromEmail(mail);
  const d1 = await download(w, token);
  assert.equal(d1.status, 200);
  assert.deepEqual(await bodyBytes(d1), ZIP_BYTES);
  const row = await w.store.getTokenByHash(hashToken(token));
  assert.equal(row?.downloadCount, 1);
  assert.equal(row?.maxDownloads, 5);
  assert.equal(row!.expiresAt.getTime() - paid.paidAt.getTime(), 168 * 3600 * 1000);
  const d2 = await download(w, token);
  assert.equal(d2.status, 200);
  await bodyBytes(d2);
  assert.equal((await w.store.getTokenByHash(hashToken(token)))?.downloadCount, 2);

  // Thanks page: claim cookie gives a separate link that also works.
  const st = await orderStatus(w, order.orderRef, claimJar(claim));
  assert.equal(st.status, 200);
  const body = st.body as { status: string; downloadUrl?: string };
  assert.equal(body.status, "paid");
  assert.ok(body.downloadUrl);
  assert.notEqual(tokenFromUrl(body.downloadUrl as string), token, "thanks link is a different token");
  const d3 = await download(w, tokenFromUrl(body.downloadUrl as string));
  assert.equal(d3.status, 200);
  await bodyBytes(d3);
  // The emailed link was not touched by the thanks link.
  assert.equal((await inspectToken(w.store, token, w.clock.t)).state, "valid");
  assert.equal(w.store.downloadLog.length, 3);
});

test("S2 card purchase: return page first, then the webhook. One winner, one email", async () => {
  const w = await makeWorld();
  const { order, claim } = await checkout(w);
  const o = order!;
  const tx = flwTx(w, o);

  const back = await handleReturn(w.deps, { status: "successful", txRef: o.orderRef, transactionId: String(tx.id) });
  assert.equal(back.location, `/theeditcompanion/thanks?ref=${o.orderRef}`);
  await w.settle();
  assert.equal((await w.store.getOrderById(o.id))?.status, "paid");
  assert.equal(w.sender.sent.length, 1);

  const hook = await sendWebhook(w, tx);
  assert.equal(hook.status, 200);
  assert.equal(hook.body.outcome, "already_paid");
  await w.settle();
  assert.equal(w.sender.sent.length, 1, "late webhook sends nothing");
  assert.equal(w.deliveries.length, 1);

  const st = await orderStatus(w, o.orderRef, claimJar(claim));
  assert.equal((st.body as { status: string }).status, "paid");
});

test("S2b return page by reference only (no transaction_id) verifies with the provider and settles", async () => {
  const w = await makeWorld();
  const { order } = await checkout(w);
  flwTx(w, order!);
  await handleReturn(w.deps, { status: "successful", txRef: order!.orderRef, transactionId: null });
  await w.settle();
  assert.equal((await w.store.getOrderById(order!.id))?.status, "paid");
  assert.equal(w.sender.sent.length, 1);
});

test("S2c return page query is never trusted: forged success, foreign transaction id, provider outage", async () => {
  const w = await makeWorld();
  const a = (await checkout(w, { email: "a@example.com" })).order!;
  const b = (await checkout(w, { email: "b@example.com" })).order!;
  // Forged: status=successful but Flutterwave has no such payment.
  await handleReturn(w.deps, { status: "successful", txRef: a.orderRef, transactionId: "999999999" });
  await handleReturn(w.deps, { status: "successful", txRef: a.orderRef, transactionId: null });
  // Foreign: B's real payment id offered for A's ref.
  const txB = flwTx(w, b);
  const back = await handleReturn(w.deps, { status: "successful", txRef: a.orderRef, transactionId: String(txB.id) });
  await w.settle();
  assert.equal((await w.store.getOrderById(a.id))?.status, "awaiting_payment", "A not paid by B's payment");
  assert.equal((await w.store.getOrderById(b.id))?.status, "awaiting_payment", "B not paid via A's ref either");
  assert.equal(w.sender.sent.length, 0);
  assert.match(back.location, /thanks/);
  // Non-TEC ref goes to the product page and calls nothing.
  const before = w.flw.calls.length;
  const away = await handleReturn(w.deps, { status: "successful", txRef: "QV-123", transactionId: "1" });
  assert.equal(away.location, "/theeditcompanion");
  assert.equal(w.flw.calls.length, before);
  // Provider outage: never throws, buyer still lands on thanks, webhook settles later.
  w.flw.mode = "down";
  const out = await handleReturn(w.deps, { status: "successful", txRef: a.orderRef, transactionId: String(txB.id) });
  assert.match(out.location, /thanks\?ref=TEC-/);
  // Odd characters in tx_ref never reach the redirect location.
  const odd = await handleReturn(w.deps, { status: "x", txRef: "TEC-abc<script>", transactionId: null });
  assert.equal(odd.location, "/theeditcompanion/thanks");
});

test("S2d BUG check: thanks link handed out before the delivery runs must still work after delivery", async () => {
  const w = await makeWorld();
  const { order, claim } = await checkout(w);
  const o = order!;
  const tx = flwTx(w, o);
  let release!: () => void;
  w.hold.gate = new Promise<void>((r) => (release = r));
  await handleReturn(w.deps, { status: "successful", txRef: o.orderRef, transactionId: String(tx.id) });
  // Buyer lands on the thanks page; the poll runs while the delivery job has not started yet.
  const st = await orderStatus(w, o.orderRef, claimJar(claim));
  const url = (st.body as { downloadUrl?: string }).downloadUrl;
  assert.ok(url, "paid order hands out a thanks link");
  release();
  await w.settle();
  assert.equal(w.sender.sent.length, 1);
  // BUG: deliverOrder -> issueDownloadLink revokes EVERY older token of the order, including the
  // thanks link just handed to the browser. The thanks page button then shows a dead link.
  const res = await download(w, tokenFromUrl(url as string));
  assert.equal(res.status, 200, "BUG: thanks link revoked by the delivery that ran just after it");
});

test("S3 webhook replayed 3 times sequentially: one winner, one email", async () => {
  const w = await makeWorld();
  const { order } = await checkout(w);
  const tx = flwTx(w, order!);
  const outcomes: unknown[] = [];
  for (let i = 0; i < 3; i++) outcomes.push((await sendWebhook(w, tx)).body.outcome);
  await w.settle();
  assert.deepEqual(outcomes, ["paid_now", "already_paid", "already_paid"]);
  assert.equal(w.sender.sent.length, 1);
  assert.equal(w.deliveries.length, 1);
  const tokens = [...w.store.tokens.values()].filter((t) => t.orderId === order!.id);
  assert.equal(tokens.length, 1, "one link minted");
  assert.equal(w.store.events.filter((e) => e.kind === "paid").length, 1);
});

test("S3 webhook delivered concurrently 10 times (mixed with return-page hits): one winner, one email", async () => {
  const w = await makeWorld();
  const { order } = await checkout(w);
  const o = order!;
  const tx = flwTx(w, o);
  const jobs: Promise<unknown>[] = [];
  for (let i = 0; i < 10; i++) jobs.push(sendWebhook(w, tx));
  for (let i = 0; i < 5; i++) jobs.push(handleReturn(w.deps, { status: "successful", txRef: o.orderRef, transactionId: String(tx.id) }));
  const results = await Promise.all(jobs);
  await w.settle();
  const hooks = results.slice(0, 10) as { status: number; body: { outcome: string } }[];
  assert.ok(hooks.every((h) => h.status === 200));
  assert.ok(hooks.filter((h) => h.body.outcome === "paid_now").length <= 1, "at most one webhook won");
  assert.equal(w.deliveries.length, 1, "exactly one caller scheduled delivery");
  assert.equal(w.sender.sent.length, 1, "exactly one email");
  assert.equal(w.store.events.filter((e) => e.kind === "paid").length, 1);
  assert.equal([...w.store.tokens.values()].filter((t) => t.orderId === o.id).length, 1);
  assert.equal((await w.store.getOrderById(o.id))?.status, "paid");
});

test("S4 wrong verif-hash is rejected with 401 and changes nothing", async () => {
  const w = await makeWorld();
  const { order } = await checkout(w);
  const tx = flwTx(w, order!);
  const eventsBefore = w.store.events.length;
  for (const bad of ["wrong", "", null, FLW_HASH.toUpperCase(), FLW_HASH.slice(0, -1), "x".repeat(5000)]) {
    const r = await sendWebhook(w, tx, bad);
    assert.equal(r.status, 401, `hash ${JSON.stringify(bad)?.slice(0, 20)}`);
    assert.deepEqual(r.body, { error: "Invalid signature" });
  }
  await w.settle();
  assert.equal(w.flw.verifyCalls(), 0, "no provider call before the signature passes");
  assert.equal((await w.store.getOrderById(order!.id))?.status, "awaiting_payment");
  assert.equal(w.store.events.length, eventsBefore);
  assert.equal(w.sender.sent.length, 0);
  assert.equal(w.deliveries.length, 0);
  // Fails closed when the secret is not configured at all.
  const open = { ...w.deps, env: { ...w.deps.env, flwSecretHash: "" } };
  const { handleCompanionFlutterwaveWebhook } = await import("../../lib/companion/flutterwave-handler");
  const r = await handleCompanionFlutterwaveWebhook(open, { verifHash: "", event: { event: "charge.completed", data: { id: tx.id, status: "successful", tx_ref: tx.tx_ref } } });
  assert.equal(r.status, 401);
});

test("S5 bad payments never deliver: underpayment, wrong currency, wrong tx_ref, failed verify, odd events", async () => {
  const w = await makeWorld();
  const mk = async (n: number) => (await checkout(w, { email: `buyer${n}@example.com` })).order!;
  const quiet = async (label: string, order: { id: string }, expectStatus: string) => {
    await w.settle();
    const o = (await w.store.getOrderById(order.id))!;
    assert.equal(o.status, expectStatus, `${label}: status`);
    assert.equal(w.sender.sent.length, 0, `${label}: no email`);
    assert.equal(w.deliveries.length, 0, `${label}: no delivery`);
    assert.equal([...w.store.tokens.values()].filter((t) => t.orderId === order.id).length, 0, `${label}: no token`);
  };

  // Underpaid by one kobo: order flagged underpaid, owner alerted, no link.
  const o1 = await mk(1);
  const r1 = await sendWebhook(w, flwTx(w, o1, { amount: 88999.99 }));
  assert.equal(r1.body.outcome, "underpaid");
  await quiet("underpaid", o1, "underpaid");
  assert.ok(w.alerts.some((a) => /UNDERPAID/.test(a.subject)));

  // Webhook body claims the full amount, the verify API says 100: the body is ignored.
  const o2 = await mk(2);
  const t2 = flwTx(w, o2, { amount: 100 });
  const r2 = await sendWebhook(w, t2, FLW_HASH, { data: { id: t2.id, tx_ref: o2.orderRef, status: "successful", amount: 89000, currency: "NGN" } });
  assert.equal(r2.body.outcome, "underpaid");
  await quiet("forged webhook amount", o2, "underpaid");

  // Wrong currency (USD 89000).
  const o3 = await mk(3);
  const r3 = await sendWebhook(w, flwTx(w, o3, { currency: "USD", amount: 89000 }));
  assert.equal(r3.body.outcome, "rejected");
  await quiet("wrong currency", o3, "awaiting_payment");

  // Unparseable amounts.
  const badAmounts: (string | number)[] = ["abc", -5, "", "89000.123"];
  for (const [i, amount] of badAmounts.entries()) {
    const o = await mk(10 + i);
    const r = await sendWebhook(w, flwTx(w, o, { amount }));
    assert.equal(r.body.outcome, "rejected", `amount ${JSON.stringify(amount)}`);
    await quiet(`bad amount ${amount}`, o, "awaiting_payment");
  }

  // Wrong tx_ref: provider says the payment belongs to an unknown ref, a QV- ref, a lower-cased ref, a padded ref.
  const o4 = await mk(4);
  for (const ref of ["TEC-doesnotexist00000000", "QV-1700000000099", o4.orderRef.toLowerCase(), o4.orderRef + " ", ""]) {
    const t = flwTx(w, o4, { tx_ref: ref });
    const r = await sendWebhook(w, t, FLW_HASH, { data: { id: t.id, tx_ref: o4.orderRef, status: "successful" } });
    assert.equal(r.status, 200);
    assert.notEqual(r.body.outcome, "paid_now", `tx_ref ${JSON.stringify(ref)}`);
  }
  await quiet("wrong tx_ref", o4, "awaiting_payment");

  // The webhook says TEC-..., Flutterwave verify says the payment failed / is pending / has odd status.
  const o5 = await mk(5);
  for (const status of ["failed", "pending", "cancelled", "Successful", "successful ", "SUCCESSFUL"]) {
    const t = flwTx(w, o5, { status });
    const r = await sendWebhook(w, t);
    assert.equal(r.body.outcome, "rejected", `verify status ${status}`);
  }
  await quiet("verify says failed", o5, "awaiting_payment");

  // Unknown transaction id: Flutterwave answers 404, we acknowledge and do nothing.
  const o6 = await mk(6);
  const r6 = await sendWebhook(w, { id: 424242424, tx_ref: o6.orderRef });
  assert.deepEqual(r6.body, { received: true, handled: false });
  // Other events and non-successful charges do not even call the provider.
  const calls = w.flw.verifyCalls();
  assert.deepEqual((await sendWebhook(w, { id: 1, tx_ref: o6.orderRef }, FLW_HASH, { event: "charge.failed" })).body, { received: true, handled: false });
  assert.deepEqual((await sendWebhook(w, { id: 1, tx_ref: o6.orderRef }, FLW_HASH, { data: { id: 1, status: "failed", tx_ref: o6.orderRef } })).body, { received: true, handled: false });
  assert.equal(w.flw.verifyCalls(), calls);
  // Non-numeric ids are refused before any provider call (path injection).
  for (const id of ["abc", "1/../../x", "12345678901234567890123", "", null, {}]) {
    const r = await sendWebhook(w, { id: id as never, tx_ref: o6.orderRef }, FLW_HASH, { data: { id, status: "successful", tx_ref: o6.orderRef } });
    assert.equal(r.status, 400, `id ${JSON.stringify(id)}`);
  }
  assert.equal(w.flw.verifyCalls(), calls);
  await quiet("unknown/odd events", o6, "awaiting_payment");
});

test("S5b provider outage returns 500 so Flutterwave retries; the retry pays exactly once", async () => {
  const w = await makeWorld();
  const { order } = await checkout(w);
  const tx = flwTx(w, order!);
  w.flw.mode = "down";
  const r1 = await sendWebhook(w, tx);
  assert.equal(r1.status, 500);
  await w.settle();
  assert.equal(w.sender.sent.length, 0);
  w.flw.mode = "ok";
  const r2 = await sendWebhook(w, tx);
  assert.equal(r2.body.outcome, "paid_now");
  const r3 = await sendWebhook(w, tx);
  assert.equal(r3.body.outcome, "already_paid");
  await w.settle();
  assert.equal(w.sender.sent.length, 1);
});

test("S5c an underpaid order can still be completed by a later full payment, delivered once", async () => {
  const w = await makeWorld();
  const { order } = await checkout(w);
  await sendWebhook(w, flwTx(w, order!, { amount: 50000 }));
  assert.equal((await w.store.getOrderById(order!.id))?.status, "underpaid");
  const r = await sendWebhook(w, flwTx(w, order!));
  assert.equal(r.body.outcome, "paid_now");
  await w.settle();
  assert.equal(w.sender.sent.length, 1);
});

test("S5d overpayment and string amounts are accepted and recorded exactly", async () => {
  const w = await makeWorld();
  const a = await buyByCard(w, { email: "over@example.com" }, { amount: 90000 });
  assert.equal((await w.store.getOrderById(a.order.id))?.amountReceivedMinor, 9_000_000);
  const b = await buyByCard(w, { email: "str@example.com" }, { amount: "89000.00" });
  assert.equal((await w.store.getOrderById(b.order.id))?.status, "paid");
  assert.equal(w.sender.sent.length, 2);
});

test("S16 an expired order that later receives a real payment is honoured (wave 1 decision)", async () => {
  // Path 1: Flutterwave link creation failed, the order was expired, the buyer was told they were not charged.
  const w = await makeWorld();
  w.flw.createFails = true;
  const failed = await checkout(w, { email: "late@example.com" });
  assert.equal(failed.res.status, 502);
  assert.equal(failed.res.body.code, "provider_error");
  const expired = w.orders()[0];
  assert.equal(expired.status, "expired");
  w.flw.createFails = false;
  const r = await sendWebhook(w, flwTx(w, expired));
  assert.equal(r.body.outcome, "paid_now");
  await w.settle();
  assert.equal((await w.store.getOrderById(expired.id))?.status, "paid");
  assert.equal(w.sender.sent.length, 1);

  // Path 2: owner expires an order by hand, money arrives afterwards.
  const { order } = await checkout(w, { email: "late2@example.com" });
  await w.store.setOrderStatus(order!.id, "expired");
  const r2 = await sendWebhook(w, flwTx(w, order!));
  assert.equal(r2.body.outcome, "paid_now");
  await w.settle();
  assert.equal(w.sender.sent.length, 2);

  // Path 3: refunded and flagged orders are NOT revived: owner alerted, no email.
  for (const status of ["refunded", "flagged"] as const) {
    const o = (await checkout(w, { email: `${status}@example.com` })).order!;
    await w.store.setOrderStatus(o.id, status);
    const sentBefore: number = w.sender.sent.length;
    const rr = await sendWebhook(w, flwTx(w, o));
    assert.equal(rr.body.outcome, "not_payable", status);
    await w.settle();
    assert.equal(w.sender.sent.length, sentBefore);
    assert.ok(w.alerts.some((a) => /closed order/.test(a.subject)));
  }
});

test("S16b the thanks cookie name is stable and unrelated to the claim cookie", () => {
  assert.notEqual(THANKS_COOKIE_NAME, "tec_claim");
});
