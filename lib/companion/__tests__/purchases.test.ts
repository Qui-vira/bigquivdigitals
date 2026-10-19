/**
 * "My purchases": signed sign-in token, the request route (no email enumeration),
 * the view data (only this email's paid and refunded orders) and the download route
 * (ownership check, daily resend limit). No database, no network, no real email.
 * Run: npx tsx --test lib/companion/__tests__/purchases.test.ts
 */
import test from "node:test";
import assert from "node:assert/strict";
import { DeliveryMemoryStore } from "../delivery-memory";
import { sampleProduct } from "../testing/memory-store";
import { inspectToken, MAX_RESENDS_PER_DAY } from "../tokens";
import type { EmailSender, OutgoingEmail, SendResult } from "../emails/sender";
import type { Runtime } from "../runtime";
import type { Order, OrderStatus } from "../types";
import {
  PURCHASES_LINK_TTL_MS,
  normaliseEmail,
  signPurchasesToken,
  verifyPurchasesToken,
} from "../purchases-link";
import {
  PURCHASES_NEUTRAL,
  REQUEST_LIMIT_EMAIL,
  handlePurchasesDownload,
  handlePurchasesRequest,
  loadPurchases,
} from "../purchases-handler";

const SECRET = "test-secret-test-secret-test-secret-0123456789";
const T0 = new Date("2026-11-01T10:00:00Z");
const MIN = 60 * 1000;

class FakeSender implements EmailSender {
  sent: OutgoingEmail[] = [];
  fail = false;
  async send(m: OutgoingEmail): Promise<SendResult> {
    if (this.fail) return { ok: false, error: `could not deliver to ${m.to}` };
    this.sent.push(m);
    return { ok: true };
  }
}

let ipN = 0;
const freshIp = () => `198.51.100.${++ipN}`;
let refN = 0;

function world() {
  const store = new DeliveryMemoryStore();
  store.products.set("theeditcompanion", sampleProduct());
  const sender = new FakeSender();
  const clock = { t: new Date(T0) };
  const rt: Runtime = {
    store,
    files: { getStream: async () => null } as unknown as Runtime["files"],
    sender,
    notifier: { alertOwner: async () => true },
    baseUrl: "https://example.test",
    ipSalt: "salt",
    now: () => clock.t,
    sleep: async () => undefined,
  };
  async function order(email: string, status: OrderStatus, over: Partial<Order> = {}): Promise<Order> {
    const o = await store.insertOrder({
      orderRef: `TEC-PUR${String(++refN).padStart(6, "0")}`,
      productSlug: "theeditcompanion",
      email,
      name: "Ada Buyer",
      status,
      method: "flutterwave",
      priceTier: "founders",
      expectedMinor: 8_900_000,
      currency: "NGN",
      consentAt: T0,
      consentVersion: "v1",
      consentIpHash: null,
      src: null,
      claimHash: "x".repeat(64),
      createdAt: new Date(T0.getTime() - 3600_000),
    });
    const row = store.orders.get(o.id)!;
    if (status === "paid" || status === "refunded") {
      row.paidAt = new Date(T0.getTime() - 1800_000);
      row.amountReceivedMinor = 8_900_000;
    }
    Object.assign(row, over);
    return { ...row };
  }
  return { store, sender, clock, rt, order };
}

function form(fields: Record<string, string>, ip = freshIp()): Request {
  const body = new URLSearchParams(fields);
  return new Request("https://example.test/api/companion/purchases/download", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded", "x-forwarded-for": ip },
    body,
  });
}

/** Capture console.error while fn runs. */
async function captureErrors(fn: () => Promise<void>): Promise<string[]> {
  const logged: string[] = [];
  const orig = console.error;
  console.error = (...args: unknown[]) => void logged.push(args.map(String).join(" "));
  try {
    await fn();
  } finally {
    console.error = orig;
  }
  return logged;
}

// ---------------- token ----------------

test("token: sign then verify gives back the normalised email and a 30 minute expiry", () => {
  const t = signPurchasesToken("  Ada@Example.COM ", T0, SECRET);
  const s = verifyPurchasesToken(t, T0, SECRET);
  assert.ok(s);
  assert.equal(s.email, "ada@example.com");
  assert.equal(s.expiresAt.getTime(), T0.getTime() + PURCHASES_LINK_TTL_MS);
  assert.equal(PURCHASES_LINK_TTL_MS, 30 * MIN);
  assert.equal(normaliseEmail("not an email"), null);
});

test("token: expires at 30 minutes, works just before", () => {
  const t = signPurchasesToken("ada@example.com", T0, SECRET);
  assert.ok(verifyPurchasesToken(t, new Date(T0.getTime() + 29 * MIN), SECRET));
  assert.equal(verifyPurchasesToken(t, new Date(T0.getTime() + 30 * MIN), SECRET), null);
  assert.equal(verifyPurchasesToken(t, new Date(T0.getTime() + 24 * 60 * MIN), SECRET), null);
});

test("token: any change to payload or signature, or another secret, fails", () => {
  const t = signPurchasesToken("ada@example.com", T0, SECRET);
  const [payload, sig] = t.split(".");
  const flip = (s: string) => (s[0] === "A" ? "B" : "A") + s.slice(1);
  // Swap the email inside the payload but keep the old signature.
  const forged = Buffer.from(JSON.stringify({ e: "eve@example.com", x: T0.getTime() + PURCHASES_LINK_TTL_MS })).toString("base64url");
  // A longer life than we ever issue, signed with the right secret, is still refused.
  const longLife = signPurchasesToken("ada@example.com", new Date(T0.getTime() + 24 * 60 * MIN), SECRET);
  for (const bad of [
    `${flip(payload)}.${sig}`,
    `${payload}.${flip(sig)}`,
    `${forged}.${sig}`,
    `${payload}.${sig}x`,
    `${payload}`,
    `${payload}.${sig}.extra`,
    "",
    null,
    undefined,
    42,
    "x".repeat(5000),
  ]) {
    assert.equal(verifyPurchasesToken(bad, T0, SECRET), null, `must reject ${String(bad).slice(0, 40)}`);
  }
  assert.equal(verifyPurchasesToken(t, T0, SECRET.replace("0", "1")), null, "another secret");
  assert.equal(verifyPurchasesToken(longLife, T0, SECRET), null, "life longer than 30 minutes");
});

test("token: fails closed when the secret is missing or short", () => {
  const t = signPurchasesToken("ada@example.com", T0, SECRET);
  assert.equal(verifyPurchasesToken(t, T0, null), null);
  assert.equal(verifyPurchasesToken(t, T0, ""), null);
  assert.equal(verifyPurchasesToken(t, T0, "short"), null);
  assert.throws(() => signPurchasesToken("ada@example.com", T0, null));
  assert.throws(() => signPurchasesToken("ada@example.com", T0, "short"));
});

// ---------------- request route ----------------

test("request: the answer is identical whether the email has orders or not; only buyers get an email", async () => {
  const w = world();
  await w.order("paid@example.com", "paid");
  await w.order("refunded@example.com", "refunded");
  await w.order("unpaid@example.com", "awaiting_payment");
  await w.order("expired@example.com", "expired");

  const answers: string[] = [];
  for (const email of ["paid@example.com", "refunded@example.com", "unpaid@example.com", "expired@example.com", "nobody@example.com"]) {
    const out = await handlePurchasesRequest(w.rt, { body: { email }, ip: freshIp(), secret: SECRET });
    assert.equal(out.status, 200);
    assert.deepEqual(out.body, { ok: true, message: PURCHASES_NEUTRAL });
    // The lookup always runs after the answer, so the timing is the same too.
    assert.equal(typeof out.background, "function");
    answers.push(JSON.stringify({ s: out.status, b: out.body, h: out.retryAfter ?? null }));
    await out.background!();
  }
  assert.equal(new Set(answers).size, 1, "every answer is byte for byte the same");
  assert.deepEqual(w.sender.sent.map((m) => m.to).sort(), ["paid@example.com", "refunded@example.com"]);

  // The email carries a working link for that email only.
  const mail = w.sender.sent.find((m) => m.to === "paid@example.com")!;
  const url = mail.text.match(/https:\/\/example\.test\/my-purchases\/view\?t=(\S+)/);
  assert.ok(url, "view link in the email");
  const s = verifyPurchasesToken(decodeURIComponent(url[1]), T0, SECRET);
  assert.equal(s?.email, "paid@example.com");
  assert.ok(!/[—–]/.test(mail.text + mail.html + mail.subject), "no em or en dashes");
  assert.match(mail.text, /30 minutes/);
});

test("request: per email limit answers the same and sends nothing more; bad input and missing secret do not depend on orders", async () => {
  const w = world();
  await w.order("busy@example.com", "paid");
  for (let i = 0; i < REQUEST_LIMIT_EMAIL.max; i++) {
    const out = await handlePurchasesRequest(w.rt, { body: { email: "Busy@Example.com" }, ip: freshIp(), secret: SECRET });
    await out.background?.();
  }
  assert.equal(w.sender.sent.length, REQUEST_LIMIT_EMAIL.max);
  const over = await handlePurchasesRequest(w.rt, { body: { email: "busy@example.com" }, ip: freshIp(), secret: SECRET });
  assert.deepEqual(over.body, { ok: true, message: PURCHASES_NEUTRAL });
  assert.equal(over.status, 200);
  assert.equal(over.background, undefined);

  const bad = await handlePurchasesRequest(w.rt, { body: { email: "nope" }, ip: freshIp(), secret: SECRET });
  assert.equal(bad.status, 400);
  assert.equal((await handlePurchasesRequest(w.rt, { body: null, ip: freshIp(), secret: SECRET })).status, 400);

  const a = await captureErrors(async () => {
    const x = await handlePurchasesRequest(w.rt, { body: { email: "busy@example.com" }, ip: freshIp(), secret: null });
    const y = await handlePurchasesRequest(w.rt, { body: { email: "nobody2@example.com" }, ip: freshIp(), secret: null });
    assert.equal(x.status, 503);
    assert.deepEqual(x.body, y.body);
    assert.equal(x.background, undefined);
  });
  assert.ok(a.every((l) => !l.includes("@")), "no email in logs");
});

test("request: per IP limit gives 429", async () => {
  const w = world();
  const ip = freshIp();
  let last = 0;
  for (let i = 0; i < 11; i++) {
    last = (await handlePurchasesRequest(w.rt, { body: { email: `ip${i}@example.com` }, ip, secret: SECRET })).status;
  }
  assert.equal(last, 429);
});

test("request: a failed send logs no email address and no token", async () => {
  const w = world();
  await w.order("fails@example.com", "paid");
  w.sender.fail = true;
  const logs = await captureErrors(async () => {
    const out = await handlePurchasesRequest(w.rt, { body: { email: "fails@example.com" }, ip: freshIp(), secret: SECRET });
    await out.background!();
  });
  assert.ok(logs.length > 0);
  for (const l of logs) {
    assert.ok(!l.includes("@"), "no email in logs");
    assert.ok(!l.includes("view?t="), "no link in logs");
  }
});

// ---------------- view ----------------

test("view: lists only this email's paid and refunded orders, newest first", async () => {
  const w = world();
  const paid = await w.order("ada@example.com", "paid", { createdAt: new Date(T0.getTime() - 2 * 3600_000) });
  const refunded = await w.order("ada@example.com", "refunded");
  await w.order("ada@example.com", "awaiting_payment");
  await w.order("ada@example.com", "expired");
  await w.order("eve@example.com", "paid");

  const v = await loadPurchases(w.rt, signPurchasesToken("ada@example.com", T0, SECRET), SECRET);
  assert.ok(v.ok);
  assert.equal(v.email, "ada@example.com");
  assert.deepEqual(v.orders.map((o) => o.orderRef), [refunded.orderRef, paid.orderRef]);
  assert.deepEqual(v.orders.map((o) => o.status), ["refunded", "paid"]);
  assert.ok(v.orders.every((o) => o.buyerEmail === "ada@example.com"));
  assert.equal(v.orders[0].productName, "TheEditCompanion");
  assert.equal(v.orders[0].amountMinor, 8_900_000);

  assert.deepEqual(await loadPurchases(w.rt, signPurchasesToken("nobody@example.com", T0, SECRET), SECRET), {
    ok: true, email: "nobody@example.com", expiresAt: new Date(T0.getTime() + PURCHASES_LINK_TTL_MS), orders: [],
  });
  w.clock.t = new Date(T0.getTime() + 31 * MIN);
  assert.deepEqual(await loadPurchases(w.rt, signPurchasesToken("ada@example.com", T0, SECRET), SECRET), { ok: false });
  assert.deepEqual(await loadPurchases(w.rt, "garbage", SECRET), { ok: false });
});

// ---------------- download route ----------------

test("download: own paid order gives a fresh working link; another buyer's order is refused", async () => {
  const w = world();
  const mine = await w.order("ada@example.com", "paid");
  const theirs = await w.order("eve@example.com", "paid");
  const token = signPurchasesToken("ada@example.com", T0, SECRET);

  const refused = await handlePurchasesDownload(w.rt, form({ t: token, ref: theirs.orderRef }), SECRET);
  assert.equal(refused.status, 303);
  assert.match(refused.headers.get("location")!, /^\/my-purchases\/view\?t=.+&m=unavailable$/);
  assert.equal(refused.headers.get("cache-control"), "no-store, max-age=0");
  assert.equal(w.store.tokens.size, 0, "no link issued for another buyer's order");
  assert.equal(w.store.events.filter((e) => e.orderId === theirs.id).length, 0);

  const unknown = await handlePurchasesDownload(w.rt, form({ t: token, ref: "TEC-DOESNOTEXIST" }), SECRET);
  assert.equal(unknown.headers.get("location"), refused.headers.get("location"), "unknown ref looks the same");

  const ok = await handlePurchasesDownload(w.rt, form({ t: token, ref: mine.orderRef }), SECRET);
  assert.equal(ok.status, 303);
  const loc = ok.headers.get("location")!;
  const m = loc.match(/^\/companion\/download\/([A-Za-z0-9_-]+)$/);
  assert.ok(m, `redirects to the download page, got ${loc}`);
  const seen = await inspectToken(w.store, m[1], T0);
  assert.equal(seen.state, "valid");
  assert.equal(seen.state === "valid" && seen.row.orderId, mine.id);
});

test("download: refunded order, bad token and expired token are refused", async () => {
  const w = world();
  const refunded = await w.order("ada@example.com", "refunded");
  const paid = await w.order("ada@example.com", "paid");
  const token = signPurchasesToken("ada@example.com", T0, SECRET);

  const r1 = await handlePurchasesDownload(w.rt, form({ t: token, ref: refunded.orderRef }), SECRET);
  assert.match(r1.headers.get("location")!, /m=unavailable$/);

  const r2 = await handlePurchasesDownload(w.rt, form({ t: token + "x", ref: paid.orderRef }), SECRET);
  assert.equal(r2.headers.get("location"), "/my-purchases/view");

  const r3 = await handlePurchasesDownload(w.rt, form({ t: token, ref: paid.orderRef }), null);
  assert.equal(r3.headers.get("location"), "/my-purchases/view", "missing secret fails closed");

  w.clock.t = new Date(T0.getTime() + 30 * MIN);
  const r4 = await handlePurchasesDownload(w.rt, form({ t: token, ref: paid.orderRef }), SECRET);
  assert.equal(r4.headers.get("location"), "/my-purchases/view");
  assert.equal(w.store.tokens.size, 0);
});

test("download: respects MAX_RESENDS_PER_DAY", async () => {
  const w = world();
  const mine = await w.order("ada@example.com", "paid");
  const token = signPurchasesToken("ada@example.com", T0, SECRET);
  for (let i = 0; i < MAX_RESENDS_PER_DAY; i++) {
    const r = await handlePurchasesDownload(w.rt, form({ t: token, ref: mine.orderRef }), SECRET);
    assert.match(r.headers.get("location")!, /^\/companion\/download\//);
  }
  const over = await handlePurchasesDownload(w.rt, form({ t: token, ref: mine.orderRef }), SECRET);
  assert.equal(over.status, 303);
  assert.match(over.headers.get("location")!, /m=limit$/);
  assert.equal(w.store.tokens.size, MAX_RESENDS_PER_DAY, "no extra link once the limit is hit");
  // Older links were revoked by each new one: exactly one live link.
  assert.equal([...w.store.tokens.values()].filter((t) => !t.revokedAt).length, 1);
});
