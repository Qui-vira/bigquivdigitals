/**
 * Scenarios 9, 10, 11: email failure after payment, download token rules, order-status.
 * Run: npx tsx --test tests/companion-e2e/03-delivery-download-status.test.ts
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import { adminListOrders, adminResend, adminRevoke, ordersToCsv } from "../../lib/companion/admin-ops";
import { deliverOrderWith } from "../../lib/companion/delivery";
import { unavailableHtml } from "../../lib/companion/download-handler";
import { hashToken, inspectToken, revokeLinks } from "../../lib/companion/tokens";
import {
  THANKS_COOKIE_NAME, ZIP_BYTES, bodyBytes, buyByCard, checkout, claimJar, download, dlRequest, makeWorld, orderStatus,
  statusReq, tokenFromEmail, tokenFromUrl, flwTx, sendWebhook, jar, freshIp,
} from "./harness";
import { handleOrderStatus, handleDownload } from "../../lib/companion/download-handler";

const admin = async () => ({ userId: 1 });
const HOUR = 3600 * 1000;

test("S9 email failure after payment: order stays paid, failure flag set, thanks link works, admin resend works and revokes the old token", async () => {
  const w = await makeWorld();
  w.sender.failNext = "always";
  const { order, claim } = await buyByCard(w);
  const o = (await w.store.getOrderById(order.id))!;
  assert.equal(o.status, "paid", "still paid");
  const state = await w.store.getEmailState(o.id);
  assert.equal(state.sentAt, null);
  assert.equal(state.attempts, 1);
  assert.match(state.lastError ?? "", /simulated outage/);
  assert.equal(w.sender.sent.length, 0);
  assert.ok(w.store.events.some((e) => e.orderId === o.id && e.kind === "email_failed"));
  assert.ok(w.alerts.some((a) => /Delivery email FAILED/.test(a.subject)), "owner alerted");
  assert.ok(w.alerts.every((a) => !a.text.includes(claim!)), "alerts never carry the claim token");

  // Thanks page still gives the buyer the file.
  const st = await orderStatus(w, o.orderRef, claimJar(claim));
  const body = st.body as { status: string; downloadUrl?: string };
  assert.equal(body.status, "paid");
  const thanks = tokenFromUrl(body.downloadUrl!);
  const ok = await download(w, thanks);
  assert.equal(ok.status, 200);
  assert.deepEqual(await bodyBytes(ok), ZIP_BYTES);

  // The admin list shows the red flag fields, and the CSV carries the error.
  const rows = await adminListOrders(w.rt, admin, {});
  assert.equal(rows[0].email.sentAt, null);
  assert.match(ordersToCsv(rows), /simulated outage/);

  // The token minted for the failed email exists (hash only) and is live until the resend.
  const liveBefore = [...w.store.tokens.values()].filter((t) => !t.revokedAt);
  assert.equal(liveBefore.length, 2, "failed-email link + thanks link");

  // Admin resend: new email, every older token revoked (including the thanks link and the unsent one).
  w.sender.failNext = 0;
  const res = await adminResend(w.rt, admin, o.id);
  assert.deepEqual(res, { ok: true });
  assert.equal(w.sender.sent.length, 1);
  const fresh = tokenFromEmail(w.sender.sent[0]);
  assert.equal((await download(w, fresh)).status, 200);
  // The token minted for the email that failed is revoked by the resend; the thanks-page link is independent
  // (kind "thanks", the S2d fix) and keeps working until the admin uses Revoke all.
  const unsent = [...w.store.tokens.values()].find((t) => t.kind === "email" && t.createdAt <= w.clock.t && t.tokenHash !== hashToken(fresh));
  assert.ok(unsent?.revokedAt, "old emailed token revoked");
  const live = [...w.store.tokens.values()].filter((t) => !t.revokedAt);
  assert.deepEqual(live.map((t) => t.kind).sort(), ["email", "thanks"]);
  const thanksStill = await download(w, thanks);
  assert.equal(thanksStill.status, 200, "thanks link survives a plain resend");
  await bodyBytes(thanksStill);
  assert.equal(await adminRevoke(w.rt, admin, o.id), 2, "Revoke all kills both");
  assert.equal((await download(w, thanks)).status, 410);
  assert.equal((await download(w, fresh)).status, 410);
  const after = await w.store.getEmailState(o.id);
  assert.ok(after.sentAt);
  assert.equal(after.lastError, null);
  assert.match(w.sender.sent[0].subject, /new/i);
  // Delivering again is a no-op once an email succeeded.
  const again = await deliverOrderWith(w.rt, o.id);
  assert.deepEqual(again, { ok: true, reason: "already_delivered" });
  assert.equal(w.sender.sent.length, 1);
});

test("S9b BUG check: plan 10.3 says up to 3 send attempts inside the request; a transient outage must not leave the buyer unemailed", async () => {
  const w = await makeWorld();
  w.sender.failNext = 2; // two transient failures, the third attempt would succeed
  await buyByCard(w);
  // BUG: delivery.ts sends once (sendDelivery) with no retry or backoff, so a 2 second Resend blip leaves
  // email_sent_at null and needs a manual admin Re-send. Plan 10.3: "up to 3 attempts inside the request (backoff 1s, 5s)".
  assert.equal(w.sender.sent.length, 1, "BUG: no retry; delivery email not sent after transient failures");
});

test("S9c the delivery email carries what plan 10.4 and section 8 promise", async () => {
  const w = await makeWorld();
  await buyByCard(w);
  const m = w.sender.sent[0];
  assert.match(m.text, /TEC-/, "order ref");
  assert.match(m.text, /NGN 89000\.00/, "amount");
  assert.match(m.text, /All sales are final/i);
  assert.match(m.text, /@quivira_ophir/);
  assert.match(m.text, /\+234 706 509 2434/);
  assert.match(m.text, /contact@bigquivdigitals\.com/);
  assert.match(m.text, /START-HERE/);
  assert.ok(!/[–—]/.test(m.text + m.subject), "no dashes the brand forbids");
});

test("S9d BUG check: delivery email prints the SHA-256 of the file (plan 10.1 and 10.4)", async () => {
  const w = await makeWorld();
  await buyByCard(w);
  const ok = /\b[a-f0-9]{64}\b/.test(w.sender.sent[0].text);
  assert.ok(ok, "BUG: delivery email has no SHA-256 of the file (templates.ts renderDelivery; Product has no file_sha256 field)");
});

test("S9e BUG check: delivery email links the Terms and the Licence (plan 10.4)", async () => {
  const w = await makeWorld();
  await buyByCard(w);
  const html = w.sender.sent[0].html;
  assert.ok(/\/terms/.test(html) && /\/licence/.test(html), "BUG: delivery email does not link the Terms and the Licence");
});

test("S10 expired, revoked, over the max, unknown and malformed tokens all return the same generic page", async () => {
  const w = await makeWorld();
  const { order } = await buyByCard(w);
  const token = tokenFromEmail(w.sender.sent[0]);
  const generic = unavailableHtml();

  const results: { label: string; status: number; body: string; type: string | null; cache: string | null }[] = [];
  const snap = async (label: string, res: Response) =>
    results.push({ label, status: res.status, body: await res.text(), type: res.headers.get("content-type"), cache: res.headers.get("cache-control") });

  // unknown but well-formed, and malformed
  const rnd = "A".repeat(43);
  await snap("unknown", await download(w, rnd));
  const bad: (string | null)[] = [null, "", "abc", "x".repeat(300), "../../etc/passwd", "a b c d e f g h i j k l m n o p", "\r\nSet-Cookie: x=1", "%00", "' OR 1=1 --", "tec-" + "z".repeat(30)];
  for (const b of bad) await snap(`malformed ${JSON.stringify(b)?.slice(0, 20)}`, await download(w, b));
  await snap("json array", await handleDownload(w.rt, dlRequest(null, { raw: JSON.stringify({ token: ["a", "b"] }) })));
  await snap("not json", await handleDownload(w.rt, dlRequest(null, { raw: "not json at all" })));
  await snap("wrong content type", await handleDownload(w.rt, new Request("https://example.test/x", { method: "POST", headers: { "x-forwarded-for": freshIp(), "content-type": "text/plain" }, body: token })));

  // expired: one millisecond before expiry still works, at the expiry instant it is gone
  const row = (await w.store.getTokenByHash(hashToken(token)))!;
  w.clock.t = new Date(row.expiresAt.getTime() - 1);
  assert.equal((await inspectToken(w.store, token, w.clock.t)).state, "valid");
  w.clock.t = new Date(row.expiresAt.getTime());
  await snap("expired at instant", await download(w, token));
  w.clock.t = new Date(row.expiresAt.getTime() + 24 * HOUR);
  await snap("expired later", await download(w, token));

  // revoked
  w.clock.t = new Date(row.createdAt.getTime() + HOUR);
  assert.equal((await inspectToken(w.store, token, w.clock.t)).state, "valid");
  await revokeLinks(w.store, order.id, w.clock.t);
  await snap("revoked", await download(w, token));

  // over the max: fresh order, 5 downloads work, the 6th is the generic page
  const b = await buyByCard(w, { email: "max@example.com" });
  void b;
  const tok2 = tokenFromEmail(w.sender.sent[1]);
  for (let i = 0; i < 5; i++) {
    const r = await download(w, tok2);
    assert.equal(r.status, 200, `download ${i + 1}`);
    await bodyBytes(r);
  }
  await snap("over max", await download(w, tok2));

  assert.ok(results.length >= 18);
  for (const r of results) {
    assert.equal(r.status, 410, r.label);
    assert.equal(r.body, generic, `${r.label}: identical page`);
    assert.equal(r.type, "text/html; charset=utf-8", r.label);
    assert.equal(r.cache, "no-store, max-age=0", r.label);
    assert.ok(!r.body.includes(token) && !r.body.includes(tok2), "token never echoed");
  }
  assert.match(generic, /@quivira_ophir/);
  assert.match(generic, /contact@bigquivdigitals\.com/);
});

test("S10 ten parallel downloads with a maximum of 5 give exactly 5 successes", async () => {
  const w = await makeWorld({ product: { maxDownloads: 5 } });
  await buyByCard(w);
  const token = tokenFromEmail(w.sender.sent[0]);
  const responses = await Promise.all(Array.from({ length: 10 }, () => download(w, token)));
  const ok = responses.filter((r) => r.status === 200);
  const gone = responses.filter((r) => r.status === 410);
  assert.equal(ok.length, 5);
  assert.equal(gone.length, 5);
  for (const r of ok) assert.deepEqual(await bodyBytes(r), ZIP_BYTES);
  for (const r of gone) await r.text();
  assert.equal((await w.store.getTokenByHash(hashToken(token)))?.downloadCount, 5);
  assert.equal(w.store.downloadLog.length, 5, "one download_log row per success");
});

test("S10 a GET never consumes: the download route exports POST only and the landing check is read only", async () => {
  const w = await makeWorld();
  await buyByCard(w);
  const token = tokenFromEmail(w.sender.sent[0]);
  for (let i = 0; i < 10; i++) assert.equal((await inspectToken(w.store, token, w.clock.t)).state, "valid");
  assert.equal((await w.store.getTokenByHash(hashToken(token)))?.downloadCount, 0);
  const route = (await import("../../app/api/companion/download/route")) as Record<string, unknown>;
  assert.equal(typeof route.POST, "function");
  for (const verb of ["GET", "HEAD", "PUT", "PATCH", "DELETE"]) assert.equal(route[verb], undefined, `${verb} must not exist`);
});

test("S10 Range requests are refused and burn nothing; headers are fixed and safe", async () => {
  const w = await makeWorld();
  await buyByCard(w);
  const token = tokenFromEmail(w.sender.sent[0]);
  for (const range of ["bytes=0-10", "bytes=100-", "bytes=-5", "items=0-1"]) {
    const r = await download(w, token, { headers: { range } });
    assert.equal(r.status, 416, range);
    assert.equal(r.headers.get("accept-ranges"), "none");
    await r.text();
  }
  assert.equal((await w.store.getTokenByHash(hashToken(token)))?.downloadCount, 0, "refused ranges burn nothing");
  const ok = await download(w, token, { headers: { "user-agent": "x".repeat(1000) } });
  assert.equal(ok.status, 200);
  assert.equal(ok.headers.get("content-disposition"), 'attachment; filename="TheEditCompanion.zip"');
  assert.equal(ok.headers.get("content-type"), "application/zip");
  assert.equal(ok.headers.get("x-content-type-options"), "nosniff");
  assert.equal(ok.headers.get("cache-control"), "no-store, max-age=0");
  assert.equal(ok.headers.get("content-length"), String(ZIP_BYTES.length));
  assert.equal(ok.headers.get("accept-ranges"), "none");
  assert.equal(ok.headers.get("referrer-policy"), "no-referrer");
  for (const [k, v] of ok.headers) assert.ok(!/[\r\n]/.test(v), `header ${k} is one line`);
  await bodyBytes(ok);
  // user-agent is truncated before it is stored, the plaintext token is never stored or logged.
  assert.ok((w.store.downloadLog[0].ua ?? "").length <= 200);
  const dump = JSON.stringify([...w.store.tokens.values()]) + JSON.stringify(w.store.events) + JSON.stringify(w.store.downloadLog) + w.logs.join("\n");
  assert.ok(!dump.includes(token), "plaintext token appears nowhere in stored state");
  // Form encoded POST (the landing page button) works as well.
  const form = await download(w, token, { form: true });
  assert.equal(form.status, 200);
  await bodyBytes(form);
});

test("S10 a missing file answers 503 and does not burn a download", async () => {
  const w = await makeWorld({ withFile: false });
  await buyByCard(w);
  const token = tokenFromEmail(w.sender.sent[0]);
  const r = await download(w, token);
  assert.equal(r.status, 503);
  await r.text();
  assert.equal((await w.store.getTokenByHash(hashToken(token)))?.downloadCount, 0);
});

test("S10 download rate limit: the 21st request from one IP in the window is refused", async () => {
  const w = await makeWorld();
  const ip = "198.51.100.77";
  let last = 0;
  for (let i = 0; i < 21; i++) last = (await download(w, "A".repeat(43), { ip })).status;
  assert.equal(last, 429);
});

test("S11 order-status without the claim cookie never returns a link; wrong or unknown ref is a uniform not found", async () => {
  const w = await makeWorld();
  const { order, claim } = await buyByCard(w);
  const other = await checkout(w, { email: "other@example.com" });

  const noCookie = await orderStatus(w, order.orderRef, {});
  const wrongCookie = await orderStatus(w, order.orderRef, claimJar("W".repeat(43)));
  const otherBuyer = await orderStatus(w, order.orderRef, claimJar(other.claim));
  const shortCookie = await orderStatus(w, order.orderRef, claimJar("abc"));
  const unknownRef = await orderStatus(w, "TEC-doesnotexist00000000", claimJar(claim));
  const unknownNoCookie = await orderStatus(w, "TEC-doesnotexist00000000", {});
  for (const r of [noCookie, wrongCookie, otherBuyer, shortCookie, unknownRef, unknownNoCookie]) {
    assert.equal(r.status, 404);
    assert.deepEqual(r.body, { error: "not_found" });
    assert.equal(r.setCookie, undefined);
  }
  for (const ref of [null, "", "x".repeat(65), "TEC-' OR 1=1 --", "../x", "tec-lowercase"]) {
    const r = await orderStatus(w, ref, claimJar(claim));
    assert.equal(r.status, 404, JSON.stringify(ref));
    assert.deepEqual(r.body, { error: "not_found" });
  }
  // The buyer's own cookie works.
  const mine = await orderStatus(w, order.orderRef, claimJar(claim));
  assert.equal(mine.status, 200);
  assert.equal((mine.body as { status: string }).status, "paid");
  // Another buyer's cookie never opens this order, and the thanks cookie of another order is ignored.
  assert.ok(!JSON.stringify([noCookie, wrongCookie, otherBuyer]).includes("companion/download"));
});

test("S11 status words: pending, paid, failed; the thanks link is reused on repeat polls; unpaid orders get no link", async () => {
  const w = await makeWorld();
  const pending = await checkout(w, { email: "p@example.com" });
  const p = await orderStatus(w, pending.order!.orderRef, claimJar(pending.claim));
  assert.equal((p.body as { status: string }).status, "pending");
  assert.equal((p.body as { emailSent: boolean }).emailSent, false);
  for (const bad of ["underpaid", "expired", "flagged", "refunded"] as const) {
    const c = await checkout(w, { email: `${bad}@example.com` });
    await w.store.setOrderStatus(c.order!.id, bad);
    const r = await orderStatus(w, c.order!.orderRef, claimJar(c.claim));
    assert.equal((r.body as { status: string }).status, "failed", bad);
    assert.ok(!("downloadUrl" in r.body), bad);
  }
  const { order, claim } = await buyByCard(w, { email: "paid@example.com" });
  const first = await orderStatus(w, order.orderRef, claimJar(claim));
  assert.ok(first.setCookie && first.setCookie.name === THANKS_COOKIE_NAME);
  assert.equal(first.setCookie.maxAgeSeconds, 24 * 3600);
  const url1 = (first.body as { downloadUrl: string }).downloadUrl;
  const second = await orderStatus(w, order.orderRef, claimJar(claim, { [THANKS_COOKIE_NAME]: first.setCookie.value }));
  assert.equal((second.body as { downloadUrl: string }).downloadUrl, url1, "same link on repeat poll");
  assert.equal(second.setCookie, undefined);
  const thanksTokens = [...w.store.tokens.values()].filter((t) => t.orderId === order.id && t.maxDownloads === 2);
  assert.equal(thanksTokens.length, 1, "one thanks token, max 2 downloads, 24h");
  assert.equal(thanksTokens[0].expiresAt.getTime() - w.clock.t.getTime(), 24 * HOUR);
  // A thanks cookie that belongs to a different order is ignored and a fresh link is made.
  const stray = await orderStatus(w, order.orderRef, claimJar(claim, { [THANKS_COOKIE_NAME]: tokenFromEmail(w.sender.sent[0]).replace(/^./, "Z") }));
  assert.equal(stray.status, 200);
  // The pending order never leaks a link even with the right cookie.
  assert.ok(!JSON.stringify(p.body).includes("download"));
});

test("S11 order-status rate limit answers without leaking existence", async () => {
  const w = await makeWorld();
  const ip = "198.51.100.88";
  let r: Awaited<ReturnType<typeof handleOrderStatus>> | null = null;
  for (let i = 0; i < 121; i++) r = await handleOrderStatus(w.rt, statusReq("TEC-x", ip), jar({}));
  assert.equal(r!.status, 429);
  assert.deepEqual(r!.body, { error: "not_found" });
  void flwTx;
  void sendWebhook;
});
