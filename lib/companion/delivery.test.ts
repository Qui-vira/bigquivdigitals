import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, writeFile, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { DeliveryMemoryStore } from "./delivery-memory";
import { sampleProduct } from "./testing/memory-store";
import { LocalDiskFileStore, DEFAULT_FILE_KEY, VercelBlobFileStore } from "./file-store";
import { env } from "./env";
import { deliverOrderWith, resendDeliveryWith } from "./delivery";
import { markOrderPaid } from "./orders";
import { hashToken, inspectToken } from "./tokens";
import { handleDownload, handleOrderStatus, unavailableHtml } from "./download-handler";
import { CLAIM_COOKIE_NAME, THANKS_COOKIE_NAME } from "./claim";
import {
  adminListOrders,
  adminMarkTransferPaid,
  adminResend,
  adminRevoke,
  csvCell,
  ordersToCsv,
} from "./admin-ops";
import type { OutgoingEmail, EmailSender, SendResult } from "./emails/sender";
import type { Runtime } from "./runtime";
import { MAX_RESENDS_PER_DAY } from "./tokens";
import type { Order } from "./types";

const CONTENT = Buffer.from("PK-fake-zip-content-".repeat(500));

class FakeSender implements EmailSender {
  sent: OutgoingEmail[] = [];
  fail = false;
  async send(m: OutgoingEmail): Promise<SendResult> {
    if (this.fail) return { ok: false, error: "boom" };
    this.sent.push(m);
    return { ok: true };
  }
}

async function setup(opts: { maxDownloads?: number; method?: Order["method"] } = {}) {
  const store = new DeliveryMemoryStore();
  store.products.set("theeditcompanion", sampleProduct({ maxDownloads: opts.maxDownloads ?? 5, allowManualTransfer: true }));
  const dir = await mkdtemp(path.join(tmpdir(), "tec-"));
  await writeFile(path.join(dir, "TheEditCompanion.zip"), CONTENT);
  await import("node:fs/promises").then((fs) => fs.mkdir(path.join(dir, "companion"), { recursive: true }));
  await writeFile(path.join(dir, DEFAULT_FILE_KEY), CONTENT);
  const sender = new FakeSender();
  const alerts: string[] = [];
  const clock = { t: new Date("2026-10-20T10:00:00Z") };
  const rt: Runtime = {
    store,
    files: new LocalDiskFileStore(dir),
    sender,
    notifier: { alertOwner: async (s: string) => (alerts.push(s), true) },
    baseUrl: "https://example.test",
    ipSalt: "salt",
    now: () => clock.t,
    sleep: async () => undefined,
  };
  const claim = "claim-token-claim-token-1234567890";
  const order = await store.insertOrder({
    orderRef: "TEC-" + Math.random().toString(36).slice(2).padEnd(22, "x"),
    productSlug: "theeditcompanion",
    email: "buyer@example.com",
    name: "Ada Buyer",
    status: opts.method === "bank_transfer" ? "awaiting_transfer" : "awaiting_payment",
    method: opts.method ?? "flutterwave",
    priceTier: "founders",
    expectedMinor: 8_900_000,
    currency: "NGN",
    consentAt: clock.t,
    consentVersion: "v1",
    consentIpHash: null,
    src: "x:test",
    claimHash: hashToken(claim),
    createdAt: clock.t,
  });
  return { store, rt, sender, alerts, order, claim, clock };
}

async function pay(s: Awaited<ReturnType<typeof setup>>) {
  const r = await markOrderPaid(s.store, s.order.id, { providerTxId: "tx1", amountReceivedMinor: 8_900_000, actor: "webhook" }, s.clock.t);
  assert.equal(r.kind, "won");
}

function tokenFromEmail(m: OutgoingEmail): string {
  const hit = m.text.match(/\/companion\/download\/([A-Za-z0-9_-]+)/);
  assert.ok(hit, "email has a download link");
  return hit[1];
}

function post(token: string | null, ip = "9.9.9.9", extra: Record<string, string> = {}): Request {
  const body = new URLSearchParams(token === null ? {} : { token });
  return new Request("https://example.test/api/companion/download", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded", "x-forwarded-for": ip, ...extra },
    body,
  });
}

test("deliverOrder: mints a link, emails once, support_until set, idempotent", async () => {
  const s = await setup();
  await pay(s);
  const r1 = await deliverOrderWith(s.rt, s.order.id);
  assert.deepEqual(r1, { ok: true });
  assert.equal(s.sender.sent.length, 1);
  const m = s.sender.sent[0];
  assert.match(m.text, /powershell -NoProfile -ExecutionPolicy Bypass -File \.\\install\.ps1/);
  assert.match(m.text, /Tested on Windows 11 in a controlled setup\. Not yet tested on a brand new computer\. Mac is not tested yet\./);
  assert.match(m.text, /All sales are final\. For 30 days after you buy, we help you install and run it\. Updates are not promised\./);
  assert.match(m.text, /START-HERE\.pdf/);
  for (const c of ["@quivira_ophir", "+234 706 509 2434", "contact@bigquivdigitals.com", "@big_quiv"]) assert.ok(m.text.includes(c), c);
  assert.ok(!/—|–/.test(m.text + m.html), "no em or en dashes");
  const token = tokenFromEmail(m);
  const row = [...s.store.tokens.values()][0];
  assert.equal(row.tokenHash, hashToken(token), "only the hash is stored");
  assert.equal(row.maxDownloads, 5);
  const order = await s.store.getOrderById(s.order.id);
  assert.ok(order?.supportUntil && order.supportUntil.getTime() - order.paidAt!.getTime() === 30 * 86400000);

  const r2 = await deliverOrderWith(s.rt, s.order.id);
  assert.deepEqual(r2, { ok: true, reason: "already_delivered" });
  assert.equal(s.sender.sent.length, 1, "no second email");
  assert.equal(s.store.tokens.size, 1, "no second token");
  assert.equal(s.alerts.filter((a) => a.startsWith("New TheEditCompanion order")).length, 1);
});

test("deliverOrder refuses an unpaid order", async () => {
  const s = await setup();
  assert.deepEqual(await deliverOrderWith(s.rt, s.order.id), { ok: false, reason: "not_paid" });
  assert.equal(s.sender.sent.length, 0);
});

test("failed email leaves the order paid, sets the flag, thanks link still works", async () => {
  const s = await setup();
  await pay(s);
  s.sender.fail = true;
  const r = await deliverOrderWith(s.rt, s.order.id);
  assert.deepEqual(r, { ok: false, reason: "email_failed" });
  const order = await s.store.getOrderById(s.order.id);
  assert.equal(order?.status, "paid");
  const st = await s.store.getEmailState(s.order.id);
  assert.equal(st.sentAt, null);
  assert.equal(st.lastError, "boom");
  assert.ok(s.alerts.some((a) => a.startsWith("Delivery email FAILED")));
  const rows = await s.store.listOrders({});
  assert.ok(rows[0].order.status === "paid" && !rows[0].email.sentAt && rows[0].email.lastError, "admin red badge condition");

  // thanks page
  const jar = { get: (n: string) => (n === CLAIM_COOKIE_NAME ? s.claim : undefined) };
  const out = await handleOrderStatus(s.rt, new Request(`https://example.test/api/companion/order-status?ref=${s.order.orderRef}`), jar);
  assert.equal(out.body && "status" in out.body && out.body.status, "paid");
  const url = (out.body as { downloadUrl?: string }).downloadUrl!;
  assert.ok(url);
  const token = url.split("/").pop()!;
  const res = await handleDownload(s.rt, post(token, "1.1.1.1"));
  assert.equal(res.status, 200);
  await res.arrayBuffer();

  // retry later succeeds
  s.sender.fail = false;
  assert.deepEqual(await deliverOrderWith(s.rt, s.order.id), { ok: true });
  assert.equal((await s.store.getEmailState(s.order.id)).lastError, null);
});

test("resend revokes the old token, mints a new one, buyer is rate limited, admin is not", async () => {
  const s = await setup();
  await pay(s);
  await deliverOrderWith(s.rt, s.order.id);
  const oldToken = tokenFromEmail(s.sender.sent[0]);
  const r = await resendDeliveryWith(s.rt, s.order.id, "admin");
  assert.deepEqual(r, { ok: true });
  assert.equal(s.sender.sent.length, 2);
  const newToken = tokenFromEmail(s.sender.sent[1]);
  assert.notEqual(oldToken, newToken);
  assert.equal((await inspectToken(s.store, oldToken, s.clock.t)).state, "revoked");
  assert.equal((await inspectToken(s.store, newToken, s.clock.t)).state, "valid");

  // wave 1 counts every resend event (admin ones too) toward the daily buyer cap
  for (let i = 0; i < MAX_RESENDS_PER_DAY - 1; i++) assert.equal((await resendDeliveryWith(s.rt, s.order.id, "buyer")).ok, true);
  assert.deepEqual(await resendDeliveryWith(s.rt, s.order.id, "buyer"), { ok: false, reason: "rate_limited" });
  assert.equal((await resendDeliveryWith(s.rt, s.order.id, "admin")).ok, true, "admin not limited");
});

test("consume race: 10 parallel downloads, exactly max succeed, file bytes intact", async () => {
  const s = await setup({ maxDownloads: 3 });
  await pay(s);
  await deliverOrderWith(s.rt, s.order.id);
  const token = tokenFromEmail(s.sender.sent[0]);
  const results = await Promise.all(Array.from({ length: 10 }, () => handleDownload(s.rt, post(token, "2.2.2.2"))));
  const ok = results.filter((r) => r.status === 200);
  assert.equal(ok.length, 3);
  assert.equal(results.filter((r) => r.status === 410).length, 7);
  const first = ok[0];
  assert.equal(first.headers.get("content-type"), "application/zip");
  assert.equal(first.headers.get("content-disposition"), 'attachment; filename="TheEditCompanion.zip"');
  assert.equal(first.headers.get("content-length"), String(CONTENT.length));
  const bytes = Buffer.from(await first.arrayBuffer());
  assert.ok(bytes.equals(CONTENT));
  for (const r of ok.slice(1)) await r.arrayBuffer();
  assert.equal(s.store.downloadLog.length, 3);
});

test("a GET-style landing check (inspect) does not burn a download; Range is refused", async () => {
  const s = await setup({ maxDownloads: 1 });
  await pay(s);
  await deliverOrderWith(s.rt, s.order.id);
  const token = tokenFromEmail(s.sender.sent[0]);
  for (let i = 0; i < 5; i++) assert.equal((await inspectToken(s.store, token, s.clock.t)).state, "valid");
  const ranged = await handleDownload(s.rt, post(token, "3.3.3.3", { range: "bytes=0-10" }));
  assert.equal(ranged.status, 416);
  assert.equal((await inspectToken(s.store, token, s.clock.t)).state, "valid", "range refusal consumed nothing");
  const ok = await handleDownload(s.rt, post(token, "3.3.3.3"));
  assert.equal(ok.status, 200);
  await ok.arrayBuffer();
});

test("every bad token case returns the identical generic page", async () => {
  const s = await setup({ maxDownloads: 1 });
  await pay(s);
  await deliverOrderWith(s.rt, s.order.id);
  const good = tokenFromEmail(s.sender.sent[0]);

  const bodies: string[] = [];
  const grab = async (r: Response) => {
    assert.equal(r.status, 410);
    bodies.push(await r.text());
  };
  await grab(await handleDownload(s.rt, post("not-a-real-token-not-a-real-token", "4.4.4.4"))); // unknown
  await grab(await handleDownload(s.rt, post(null, "4.4.4.4"))); // missing
  s.clock.t = new Date("2026-10-30T10:00:00Z"); // after the 7 day expiry
  await grab(await handleDownload(s.rt, post(good, "4.4.4.4"))); // expired
  s.clock.t = new Date("2026-10-20T10:00:00Z");
  const used = await handleDownload(s.rt, post(good, "4.4.4.4"));
  assert.equal(used.status, 200);
  await used.arrayBuffer();
  await grab(await handleDownload(s.rt, post(good, "4.4.4.4"))); // exhausted
  await resendDeliveryWith(s.rt, s.order.id, "admin");
  await grab(await handleDownload(s.rt, post(good, "4.4.4.4"))); // revoked
  for (const b of bodies) assert.equal(b, unavailableHtml());
  assert.ok(bodies[0].includes("@quivira_ophir") && bodies[0].includes("+234 706 509 2434"));
});

test("a missing file does not burn a download", async () => {
  const s = await setup({ maxDownloads: 1 });
  await pay(s);
  await deliverOrderWith(s.rt, s.order.id);
  const token = tokenFromEmail(s.sender.sent[0]);
  const broken: Runtime = { ...s.rt, files: new LocalDiskFileStore(path.join(tmpdir(), "tec-empty-dir-xyz")) };
  const r = await handleDownload(broken, post(token, "5.5.5.5"));
  assert.equal(r.status, 503);
  assert.equal((await inspectToken(s.store, token, s.clock.t)).state, "valid");
});

test("order-status never returns a link without the claim cookie", async () => {
  const s = await setup();
  await pay(s);
  const url = `https://example.test/api/companion/order-status?ref=${s.order.orderRef}`;
  const none = await handleOrderStatus(s.rt, new Request(url), { get: () => undefined });
  assert.equal(none.status, 404);
  assert.ok(!JSON.stringify(none.body).includes("download"));
  const wrong = await handleOrderStatus(s.rt, new Request(url), { get: () => "wrong-cookie-wrong-cookie-wrong" });
  assert.equal(wrong.status, 404);
  const unknownRef = await handleOrderStatus(s.rt, new Request("https://example.test/x?ref=TEC-nope"), { get: () => s.claim });
  assert.deepEqual(unknownRef.body, none.body);
  assert.equal(s.store.tokens.size, 0, "nothing minted for a stranger");

  const good = await handleOrderStatus(s.rt, new Request(url), { get: (n) => (n === CLAIM_COOKIE_NAME ? s.claim : undefined) });
  assert.equal(good.status, 200);
  assert.ok((good.body as { downloadUrl?: string }).downloadUrl);
  assert.ok(good.setCookie);
  // second poll with the thanks cookie reuses the same link
  const again = await handleOrderStatus(s.rt, new Request(url), {
    get: (n) => (n === CLAIM_COOKIE_NAME ? s.claim : n === good.setCookie!.name ? good.setCookie!.value : undefined),
  });
  assert.equal((again.body as { downloadUrl?: string }).downloadUrl, (good.body as { downloadUrl?: string }).downloadUrl);
  assert.equal(s.store.tokens.size, 1);
});

test("order-status maps pending and failed without a link", async () => {
  const s = await setup();
  const jar = { get: (n: string) => (n === CLAIM_COOKIE_NAME ? s.claim : undefined) };
  const url = `https://example.test/api/companion/order-status?ref=${s.order.orderRef}`;
  const pending = await handleOrderStatus(s.rt, new Request(url), jar);
  assert.deepEqual(pending.body, { status: "pending", emailSent: false });
  await s.store.setOrderStatus(s.order.id, "expired");
  const failed = await handleOrderStatus(s.rt, new Request(url), jar);
  assert.deepEqual(failed.body, { status: "failed", emailSent: false });
});

test("CSV escaping neutralises formulas and quotes", () => {
  assert.equal(csvCell("=1+1"), "'=1+1");
  assert.equal(csvCell("+cmd"), "'+cmd");
  assert.equal(csvCell("-2"), "'-2");
  assert.equal(csvCell("@SUM(A1)"), "'@SUM(A1)");
  assert.equal(csvCell('say "hi", ok'), '"say ""hi"", ok"');
  assert.equal(csvCell("=a,b"), `"'=a,b"`);
  assert.equal(csvCell(null), "");
  assert.equal(csvCell("plain"), "plain");
});

test("CSV export rows carry escaped buyer names", async () => {
  const s = await setup();
  s.store.orders.get(s.order.id)!.name = "=HYPERLINK(\"x\")";
  const csv = ordersToCsv(await s.store.listOrders({}));
  assert.ok(csv.includes(`"'=HYPERLINK(""x"")"`));
  assert.ok(csv.split("\r\n")[0].startsWith("order_ref,"));
});

test("admin operations refuse a non-admin before touching the store", async () => {
  const s = await setup({ method: "bank_transfer" });
  const deny = async () => {
    throw new Error("Unauthorized");
  };
  let touched = 0;
  const spy = new Proxy(s.rt.store, {
    get(t, p, r) {
      if (typeof p === "string" && typeof (t as never)[p] === "function") touched++;
      return Reflect.get(t, p, r);
    },
  });
  const rt = { ...s.rt, store: spy };
  await assert.rejects(adminListOrders(rt, deny, {}), /Unauthorized/);
  await assert.rejects(adminResend(rt, deny, s.order.id), /Unauthorized/);
  await assert.rejects(adminRevoke(rt, deny, s.order.id), /Unauthorized/);
  await assert.rejects(adminMarkTransferPaid(rt, deny, { orderId: s.order.id, amount: "89000", reference: "R1" }), /Unauthorized/);
  assert.equal(touched, 0);
  assert.equal(s.sender.sent.length, 0);
});

test("every exported server action and the export route call requireAdmin first", async () => {
  const actions = await readFile(path.join(process.cwd(), "app/admin/actions/companion-orders.ts"), "utf8");
  const fns = actions.split(/export async function /).slice(1);
  assert.ok(fns.length >= 3);
  for (const f of fns) assert.match(f, /\)\s*\{\s*await requireAdmin\(\);/, f.slice(0, 40));
  const route = await readFile(path.join(process.cwd(), "app/api/admin/companion-orders/export/route.ts"), "utf8");
  assert.match(route, /await requireAdmin\(\)/);
});

test("admin mark transfer paid: amount check, reference required, delivery runs once", async () => {
  const s = await setup({ method: "bank_transfer" });
  const ok = async () => ({ userId: 1 });
  assert.deepEqual(await adminMarkTransferPaid(s.rt, ok, { orderId: s.order.id, amount: "89000", reference: " " }), { ok: false, reason: "reference_required" });
  assert.deepEqual(await adminMarkTransferPaid(s.rt, ok, { orderId: s.order.id, amount: "abc", reference: "R1" }), { ok: false, reason: "bad_amount" });
  const under = await adminMarkTransferPaid(s.rt, ok, { orderId: s.order.id, amount: "50000", reference: "R1" });
  assert.deepEqual(under, { ok: false, reason: "underpaid" });
  assert.equal((await s.store.getOrderById(s.order.id))?.status, "underpaid");
  assert.equal(s.sender.sent.length, 0);
  const paid = await adminMarkTransferPaid(s.rt, ok, { orderId: s.order.id, amount: "89000", reference: "R1" });
  assert.deepEqual(paid, { ok: true, delivery: { ok: true } });
  assert.equal(s.sender.sent.length, 1);
  assert.deepEqual(await adminMarkTransferPaid(s.rt, ok, { orderId: s.order.id, amount: "89000", reference: "R1" }), { ok: false, reason: "already_paid" });
  assert.equal(s.sender.sent.length, 1);
});

// ===================== review fix wave (H3, H4, M1, M4, M6, M8) =====================

const statusUrl = (ref: string) => `https://example.test/api/companion/order-status?ref=${ref}`;
const jarOf = (claim: string, thanks?: string) => ({
  get: (n: string) => (n === CLAIM_COOKIE_NAME ? claim : n === THANKS_COOKIE_NAME ? thanks : undefined),
});

test("H3: return-first settle, status poll mints the thanks token, THEN deliverOrder runs: thanks token still downloads", async () => {
  const s = await setup();
  await pay(s);
  const poll = await handleOrderStatus(s.rt, new Request(statusUrl(s.order.orderRef)), jarOf(s.claim));
  const thanksUrl = (poll.body as { downloadUrl?: string }).downloadUrl!;
  assert.ok(thanksUrl);
  await deliverOrderWith(s.rt, s.order.id); // used to revoke every token of the order
  const res = await handleDownload(s.rt, post(thanksUrl.split("/").pop()!, "6.6.6.6"));
  assert.equal(res.status, 200);
  await res.arrayBuffer();
  const emailed = await handleDownload(s.rt, post(tokenFromEmail(s.sender.sent[0]), "6.6.6.7"));
  assert.equal(emailed.status, 200);
  await emailed.arrayBuffer();
});

test("H3: a resend revokes the old email link but not a live thanks link; admin revoke-all kills both", async () => {
  const s = await setup();
  await pay(s);
  const poll = await handleOrderStatus(s.rt, new Request(statusUrl(s.order.orderRef)), jarOf(s.claim));
  const thanks = (poll.body as { downloadUrl?: string }).downloadUrl!.split("/").pop()!;
  await deliverOrderWith(s.rt, s.order.id);
  const oldEmail = tokenFromEmail(s.sender.sent[0]);
  await resendDeliveryWith(s.rt, s.order.id, "admin");
  assert.equal((await inspectToken(s.store, oldEmail, s.clock.t)).state, "revoked");
  assert.equal((await inspectToken(s.store, thanks, s.clock.t)).state, "valid");
  await resendDeliveryWith(s.rt, s.order.id, "admin", { revokeAll: true });
  assert.equal((await inspectToken(s.store, thanks, s.clock.t)).state, "revoked");
});

test("H4: no COMPANION_BLOB_TOKEN fails closed (503, nothing burned) and never falls back to BLOB_READ_WRITE_TOKEN", async () => {
  const s = await setup({ maxDownloads: 1 });
  await pay(s);
  await deliverOrderWith(s.rt, s.order.id);
  const token = tokenFromEmail(s.sender.sent[0]);
  const savedA = process.env.COMPANION_BLOB_TOKEN;
  const savedB = process.env.BLOB_READ_WRITE_TOKEN;
  const savedErr = console.error;
  const logged: string[] = [];
  console.error = (...a: unknown[]) => void logged.push(a.join(" "));
  try {
    delete process.env.COMPANION_BLOB_TOKEN;
    process.env.BLOB_READ_WRITE_TOKEN = "public-store-token-must-not-be-used";
    const rt: Runtime = { ...s.rt, files: new VercelBlobFileStore() };
    const r = await handleDownload(rt, post(token, "7.7.7.7"));
    assert.equal(r.status, 503);
    assert.ok(logged.some((l) => l.includes("COMPANION_BLOB_TOKEN")), "log names the variable");
    assert.ok(!logged.some((l) => l.includes("public-store-token")), "never prints a token");
    assert.equal((await inspectToken(s.store, token, s.clock.t)).state, "valid", "no download burned");
  } finally {
    console.error = savedErr;
    if (savedA === undefined) delete process.env.COMPANION_BLOB_TOKEN;
    else process.env.COMPANION_BLOB_TOKEN = savedA;
    if (savedB === undefined) delete process.env.BLOB_READ_WRITE_TOKEN;
    else process.env.BLOB_READ_WRITE_TOKEN = savedB;
  }
});

test("M1: mark transfer paid never downgrades a paid order (double click, second tab) or a refunded/flagged one", async () => {
  const s = await setup({ method: "bank_transfer" });
  const ok = async () => ({ userId: 1 });
  const paid = await adminMarkTransferPaid(s.rt, ok, { orderId: s.order.id, amount: "89000", reference: "R9" });
  assert.equal(paid.ok, true);
  const again = await adminMarkTransferPaid(s.rt, ok, { orderId: s.order.id, amount: "1000", reference: "R9b" });
  assert.deepEqual(again, { ok: false, reason: "already_paid" });
  assert.equal((await s.store.getOrderById(s.order.id))?.status, "paid");
  const [a, b] = await Promise.all([
    adminMarkTransferPaid(s.rt, ok, { orderId: s.order.id, amount: "100", reference: "R10" }),
    adminMarkTransferPaid(s.rt, ok, { orderId: s.order.id, amount: "100", reference: "R11" }),
  ]);
  assert.equal(a.ok || b.ok, false);
  assert.equal((await s.store.getOrderById(s.order.id))?.status, "paid");
  for (const st of ["refunded", "flagged"] as const) {
    await s.store.setOrderStatus(s.order.id, st);
    assert.deepEqual(await adminMarkTransferPaid(s.rt, ok, { orderId: s.order.id, amount: "100", reference: "R12" }), { ok: false, reason: "wrong_status" });
    assert.equal((await s.store.getOrderById(s.order.id))?.status, st);
  }
});

test("M4: deleting the cookie cannot mint unlimited thanks links; one live link", async () => {
  const s = await setup();
  await pay(s);
  const urls: (string | undefined)[] = [];
  for (let i = 0; i < 5; i++) {
    const o = await handleOrderStatus(s.rt, new Request(statusUrl(s.order.orderRef)), jarOf(s.claim));
    urls.push((o.body as { downloadUrl?: string }).downloadUrl);
  }
  assert.deepEqual(urls.map(Boolean), [true, true, true, false, false], "at most 3 mints per 24 h");
  const thanks = [...s.store.tokens.values()].filter((t) => t.kind === "thanks");
  assert.equal(thanks.length, 3);
  assert.equal(thanks.filter((t) => !t.revokedAt).length, 1, "only the newest thanks link is live");
});

test("M4: the thanks page gives at most 2 downloads per order in total, even across new links", async () => {
  const s = await setup();
  await pay(s);
  let got = 0;
  for (let i = 0; i < 3; i++) {
    const o = await handleOrderStatus(s.rt, new Request(statusUrl(s.order.orderRef)), jarOf(s.claim));
    const url = (o.body as { downloadUrl?: string }).downloadUrl;
    if (!url) continue;
    for (let j = 0; j < 3; j++) {
      const r = await handleDownload(s.rt, post(url.split("/").pop()!, `8.8.${i}.${j}`));
      if (r.status === 200) got++;
      await r.arrayBuffer();
    }
  }
  assert.equal(got, 2);
});

test("M6: env() trims, and the delivery files do not read process.env directly", async () => {
  process.env.TEC_TEST_VAR = "  value\n";
  assert.equal(env("TEC_TEST_VAR"), "value");
  delete process.env.TEC_TEST_VAR;
  assert.equal(env("TEC_TEST_VAR"), "");
  for (const f of [
    "lib/companion/emails/sender.ts",
    "lib/companion/emails/notify.ts",
    "lib/companion/file-store.ts",
    "lib/companion/runtime.ts",
    "lib/companion/delivery.ts",
    "lib/companion/download-handler.ts",
  ]) {
    const src = await readFile(path.join(process.cwd(), f), "utf8");
    assert.ok(!/process\.env/.test(src), `${f} must use env()`);
  }
});

test("M8: order-status emailSent is true only once the email was really sent", async () => {
  const s = await setup();
  await pay(s);
  const get = async () =>
    (await handleOrderStatus(s.rt, new Request(statusUrl(s.order.orderRef)), jarOf(s.claim))).body as { emailSent: boolean };
  assert.equal((await get()).emailSent, false, "paid but email not sent yet");
  s.sender.fail = true;
  await deliverOrderWith(s.rt, s.order.id);
  assert.equal((await get()).emailSent, false, "email failed");
  s.sender.fail = false;
  await deliverOrderWith(s.rt, s.order.id);
  assert.equal((await get()).emailSent, true);
});
