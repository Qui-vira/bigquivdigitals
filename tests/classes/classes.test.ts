/**
 * /classes: prices, early-bird counting, tx_ref routing, the two Flutterwave
 * routes, the emails and My purchases. No network, no database, nothing sent:
 * the payment deps are fakes and global fetch is replaced.
 *
 * Run: npx tsx --test tests/classes/classes.test.ts
 */
import assert from "node:assert/strict";
import { after, before, beforeEach, test } from "node:test";
import { NextRequest } from "next/server";
import {
  CLASS_COHORT,
  CLASS_PRODUCTS,
  COURSE_PRICES,
  EARLY_BIRD_GRACE_MS,
  checkClassPayment,
  classPriceNow,
  classProduct,
  newClassTxRef,
  routeTxRef,
} from "../../lib/course-prices";
import { renderClassConfirmation, renderOwnerSale } from "../../lib/class-emails";
import { setClassDepsForTests, type ClassDeps, type Row } from "../../lib/class-payments";
import { classSeatRow, loadPurchases, sendPurchasesLinkIfAny } from "../../lib/companion/purchases-handler";
import { signPurchasesToken } from "../../lib/companion/purchases-link";

process.env.DATABASE_URL = "postgres://u:p@fake.neon.invalid/db";
process.env.FLW_SECRET_HASH = "test-hash";
process.env.FLW_SECRET_KEY = "test-key";
delete process.env.RESEND_API_KEY;
delete process.env.COURSE_BOT_TOKEN;

// ---------------- the approved table (owner, 25 Nov 2026) ----------------

const APPROVED: Array<[string, number, number, number, number]> = [
  // slug, first 10, after, coaching 2w, coaching 3w
  ["ai-video-editing", 27000, 45000, 200000, 300000],
  ["ai-ugc-content", 27000, 45000, 210000, 315000],
  ["ai-web3-defi", 30000, 50000, 230000, 340000],
  ["ai-video-creation", 35000, 55000, 250000, 380000],
  ["ai-trading", 35000, 55000, 250000, 370000],
  ["vibe-coding", 40000, 65000, 275000, 410000],
  ["ai-agents", 40000, 65000, 290000, 430000],
];

test("every approved price is the server's price, naira only", () => {
  for (const [slug, early, standard, c2, c3] of APPROVED) {
    const p = COURSE_PRICES[slug];
    assert.deepEqual(p.minimums, { NGN: standard }, slug);
    assert.deepEqual(p.earlyBird, { minimums: { NGN: early }, seats: 10 }, slug);
    const niche = classProduct(slug)!.niche;
    assert.deepEqual(COURSE_PRICES[`coaching-${niche}-2w`], { minimums: { NGN: c2 } });
    assert.deepEqual(COURSE_PRICES[`coaching-${niche}-3w`], { minimums: { NGN: c3 } });
  }
  assert.deepEqual(COURSE_PRICES["ai-mastery-combo"], { minimums: { NGN: 280000 }, earlyBird: { minimums: { NGN: 175000 }, seats: 10 } });
  // The AI class is untouched.
  assert.deepEqual(COURSE_PRICES["ai-content-mastery"], { minimums: { NGN: 27000, USD: 18 } });
  assert.equal(CLASS_PRODUCTS.length, 7 + 1 + 14);
  assert.equal(CLASS_COHORT.startsOn, "2027-01-04");
  assert.equal(new Date(`${CLASS_COHORT.startsOn}T12:00:00Z`).getUTCDay(), 1, "4 January 2027 is a Monday");
});

test("tx_ref prefixes: unique, none a prefix of another, none collides with QV-, TEC- or QBOT-", () => {
  const prefixes = CLASS_PRODUCTS.map((p) => p.refPrefix);
  assert.equal(new Set(prefixes).size, prefixes.length);
  for (const a of prefixes) {
    for (const b of prefixes) if (a !== b) assert.ok(!b.startsWith(a), `${a} is a prefix of ${b}`);
    for (const reserved of ["QV-", "TEC-", "QBOT-"]) {
      assert.ok(!a.startsWith(reserved) && !reserved.startsWith(a), `${a} vs ${reserved}`);
    }
  }
  for (const p of CLASS_PRODUCTS) {
    const ref = newClassTxRef(p.refPrefix);
    assert.match(ref, /^[A-Z0-9]+-[A-Z0-9]+-\d{13}-[a-z0-9]{6}$/);
    const r = routeTxRef(ref);
    assert.equal(r.kind, "class");
    assert.equal(r.kind === "class" && r.product.slug, p.slug);
  }
});

test("routing table", () => {
  assert.deepEqual(routeTxRef("TEC-abc"), { kind: "companion" });
  assert.deepEqual(routeTxRef("QBOT-777-1"), { kind: "bot" });
  assert.deepEqual(routeTxRef("QV-1700000000000"), { kind: "ai-mastery" });
  assert.deepEqual(routeTxRef("XYZ-1"), { kind: "unknown" });
  assert.deepEqual(routeTxRef("cls-edit-1"), { kind: "unknown" }, "prefixes are case sensitive");
  assert.deepEqual(routeTxRef(12345), { kind: "unknown" });
  assert.deepEqual(routeTxRef(undefined), { kind: "unknown" });
});

// ---------------- early-bird counting ----------------

const T = new Date("2026-12-01T12:00:00Z");

test("early price while fewer than 10 seats are confirmed, standard after", () => {
  const open = { confirmed: 9, filledAt: null };
  assert.deepEqual(checkClassPayment("ai-video-editing", 27000, "NGN", open, T), { ok: true, tier: "early", minimum: 27000 });
  assert.equal(checkClassPayment("ai-video-editing", 26999, "NGN", open, T).ok, false);
  assert.deepEqual(checkClassPayment("ai-video-editing", 45000, "ngn", open, T), { ok: true, tier: "standard", minimum: 27000 });

  const fullLongAgo = { confirmed: 10, filledAt: new Date(T.getTime() - EARLY_BIRD_GRACE_MS - 1) };
  assert.equal(checkClassPayment("ai-video-editing", 27000, "NGN", fullLongAgo, T).ok, false);
  assert.deepEqual(checkClassPayment("ai-video-editing", 45000, "NGN", fullLongAgo, T), { ok: true, tier: "standard", minimum: 45000 });
});

test("race: the early price is honoured for 30 minutes after seat 10 filled, not a second longer", () => {
  const filledAt = new Date(T.getTime() - EARLY_BIRD_GRACE_MS);
  assert.deepEqual(checkClassPayment("ai-agents", 40000, "NGN", { confirmed: 11, filledAt }, T), { ok: true, tier: "early", minimum: 40000 });
  const late = new Date(T.getTime() + 1);
  assert.equal(checkClassPayment("ai-agents", 40000, "NGN", { confirmed: 11, filledAt }, late).ok, false);
  // Full but the fill time is unknown: no grace.
  assert.equal(checkClassPayment("ai-agents", 40000, "NGN", { confirmed: 10, filledAt: null }, T).ok, false);
});

test("coaching is a fixed price; unknown slug, USD and junk amounts fail closed", () => {
  const none = { confirmed: 0, filledAt: null };
  assert.deepEqual(checkClassPayment("coaching-agents-3w", 430000, "NGN", none, T), { ok: true, tier: "fixed", minimum: 430000 });
  assert.equal(checkClassPayment("coaching-agents-3w", 429999, "NGN", none, T).ok, false);
  assert.equal(checkClassPayment("ai-agents", 40000, "USD", none, T).ok, false);
  assert.equal(checkClassPayment("ai-agents", "abc", "NGN", none, T).ok, false);
  assert.equal(checkClassPayment("nope", 999999, "NGN", none, T).ok, false);
});

test("the page price: early with seats left, standard when full or when the count is unknown", () => {
  assert.deepEqual(classPriceNow("ai-video-creation", 3), { amount: 35000, early: 35000, standard: 55000, seatsLeft: 7 });
  assert.deepEqual(classPriceNow("ai-video-creation", 10), { amount: 55000, early: 35000, standard: 55000, seatsLeft: 0 });
  assert.deepEqual(classPriceNow("ai-video-creation", 14), { amount: 55000, early: 35000, standard: 55000, seatsLeft: 0 });
  assert.deepEqual(classPriceNow("ai-video-creation", null), { amount: 55000, early: 35000, standard: 55000, seatsLeft: null });
  assert.deepEqual(classPriceNow("coaching-video-2w", 0), { amount: 250000, early: null, standard: 250000, seatsLeft: null });
});

// ---------------- emails ----------------

test("buyer emails: cohort line for a class, 24 hours for coaching, no em dashes", () => {
  const niche = renderClassConfirmation({ product: classProduct("ai-trading")!, name: "Ada Obi", amount: 35000, currency: "NGN", txRef: "CLS-TRADE-1" });
  assert.ok(niche.text.includes("Your seat in the cohort starting Monday 4 January 2027 is confirmed"));
  assert.ok(niche.text.includes("added to the class group before it starts"));
  assert.ok(niche.text.includes("₦35,000") && niche.text.includes("AI for Trading") && niche.text.includes("Hey Ada,"));
  const coach = renderClassConfirmation({ product: classProduct("coaching-coding-2w")!, name: "", amount: 275000, currency: "NGN", txRef: "CO2-CODE-1" });
  assert.ok(coach.text.includes("We will contact you within 24 hours to book your sessions."));
  assert.ok(!coach.text.includes("cohort"));
  const owner = renderOwnerSale({ product: classProduct("ai-trading")!, email: "a@b.co", amount: 35000, currency: "NGN", txRef: "CLS-TRADE-1", tier: "early", seatNumber: 4, emailSent: true });
  assert.ok(owner.text.includes("Seat 4"));
  for (const s of [niche.text, niche.html, coach.text, coach.html, owner.text]) assert.ok(!s.includes("—"), "no em dash");
  const xss = renderClassConfirmation({ product: classProduct("ai-trading")!, name: "<b>x</b>", amount: 1, currency: "NGN", txRef: "<i>" });
  assert.ok(!xss.html.includes("<b>x</b>") && !xss.html.includes("<i>"));
});

// ---------------- the routes, end to end with fakes ----------------

type Fake = {
  seats: { n: number; filled_at: string | null };
  insertReturns: Row[];
  existing: Row[];
  queries: { text: string; params: unknown[] }[];
  sent: { to: string; subject: string; text: string }[];
  alerts: { subject: string; text: string }[];
};
let fake: Fake;
const outbound: string[] = [];
let flwAnswer: unknown = {};
const realFetch = globalThis.fetch;

function deps(): ClassDeps {
  return {
    sql: {
      async query(text, params = []) {
        fake.queries.push({ text, params });
        if (/WITH s AS/.test(text)) return [fake.seats];
        if (/^\s*INSERT INTO course_purchases/.test(text)) return fake.insertReturns;
        if (/SELECT transaction_ref, status FROM course_purchases/.test(text)) return fake.existing;
        return [];
      },
    },
    sender: { async send(m) { fake.sent.push(m); return { ok: true }; } },
    notifier: { async alertOwner(subject, text) { fake.alerts.push({ subject, text }); return true; } },
    now: () => T,
  };
}

before(() => {
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    outbound.push(new URL(url).hostname);
    if (new URL(url).hostname === "api.flutterwave.com") return new Response(JSON.stringify(flwAnswer), { status: 200 });
    return new Response(JSON.stringify({ command: "SELECT", rowCount: 0, rows: [], fields: [] }), { status: 200 });
  }) as typeof fetch;
  setClassDepsForTests(deps());
});
after(() => {
  globalThis.fetch = realFetch;
  setClassDepsForTests(null);
});
beforeEach(() => {
  fake = { seats: { n: 0, filled_at: null }, insertReturns: [{ id: "row-1" }], existing: [], queries: [], sent: [], alerts: [] };
  outbound.length = 0;
});

let ip = 0;
function post(body: unknown, headers: Record<string, string>) {
  return new NextRequest("http://localhost/x", {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": `10.9.0.${++ip}`, ...headers },
    body: JSON.stringify(body),
  });
}
const tx = (ref: unknown, over: Record<string, unknown> = {}) => ({
  id: 777001,
  status: "successful",
  amount: 27000,
  currency: "NGN",
  tx_ref: ref,
  created_at: T.toISOString(),
  customer: { email: "Buyer@Example.com", name: "buyer" },
  ...over,
});

const quiet = <R>(fn: () => Promise<R>) => async () => {
  const e = console.error, l = console.log;
  console.error = console.log = () => {};
  try { return await fn(); } finally { console.error = e; console.log = l; }
};

async function webhook(data: unknown) {
  const mod = await import("../../app/api/payment/flutterwave/webhook/route");
  const res = await mod.POST(post({ event: "charge.completed", data }, { "verif-hash": "test-hash" }));
  return { status: res.status, body: await res.json() };
}
async function verify(data: unknown) {
  flwAnswer = { status: "success", data };
  const mod = await import("../../app/api/payment/flutterwave/verify/route");
  const res = await mod.POST(post({ transaction_id: 777001 }, { origin: "https://bigquivdigitals.com" }));
  return { status: res.status, body: await res.json() };
}
const wroteSeat = () => fake.queries.some((q) => /INSERT INTO course_purchases/.test(q.text));

test("QBOT- on the webhook: 200, recorded:false, nothing read, written or sent", quiet(async () => {
  const r = await webhook(tx("QBOT-777-1", { amount: 30000 }));
  assert.deepEqual(r, { status: 200, body: { received: true, recorded: false } });
  assert.equal(fake.queries.length, 0);
  assert.deepEqual(outbound, []);
  assert.equal(fake.sent.length + fake.alerts.length, 0);
}));

test("QBOT- on the verify route: refused, nothing written", quiet(async () => {
  const r = await verify(tx("QBOT-777-1", { amount: 30000 }));
  assert.equal(r.status, 400);
  assert.equal(r.body.success, false);
  assert.equal(fake.queries.length, 0);
  assert.deepEqual(outbound, ["api.flutterwave.com"]);
}));

test("unknown prefixes grant nothing on either route", quiet(async () => {
  for (const ref of ["XYZ-1", "qv-1", "", 12345]) {
    const w = await webhook(tx(ref));
    assert.equal(w.status, 200);
    assert.equal(w.body.recorded, false, String(ref));
    const v = await verify(tx(ref));
    assert.equal(v.status, 400, String(ref));
  }
  assert.equal(fake.queries.length, 0);
  assert.ok(!outbound.some((h) => h.endsWith("neon.invalid")), "no AI class write either");
}));

test("a niche at the early price with seats left: one seat, one email, one owner alert", quiet(async () => {
  fake.seats = { n: 3, filled_at: null };
  const r = await webhook(tx("CLS-EDIT-1764000000000-abc123"));
  assert.deepEqual(r, { status: 200, body: { received: true, recorded: true } });
  const ins = fake.queries.find((q) => /INSERT INTO course_purchases/.test(q.text))!;
  assert.deepEqual(ins.params, ["buyer@example.com", "buyer", "ai-video-editing", 27000, "NGN", "CLS-EDIT-1764000000000-abc123"]);
  assert.match(ins.text, /ON CONFLICT \(email, course_slug\) DO NOTHING/);
  const count = fake.queries.find((q) => /WITH s AS/.test(q.text))!;
  assert.deepEqual(count.params, ["ai-video-editing", CLASS_COHORT.salesOpenFrom, "buyer@example.com", 9]);
  assert.equal(fake.sent.length, 1);
  assert.equal(fake.sent[0].to, "buyer@example.com");
  assert.ok(fake.sent[0].text.includes("Monday 4 January 2027"));
  assert.equal(fake.alerts.length, 1);
  assert.match(fake.alerts[0].subject, /New sale: AI Video Editing/);
  assert.ok(fake.alerts[0].text.includes("Seat 4"));
  assert.ok(fake.queries.some((q) => /UPDATE course_purchases SET email_sent = true/.test(q.text)));
}));

test("early price after seat 10, outside the 30 minutes: no seat, owner told", quiet(async () => {
  fake.seats = { n: 10, filled_at: new Date(T.getTime() - 2 * 3600_000).toISOString() };
  const r = await webhook(tx("CLS-EDIT-1"));
  assert.deepEqual(r, { status: 200, body: { received: true, recorded: false } });
  assert.equal(wroteSeat(), false);
  assert.equal(fake.sent.length, 0);
  assert.equal(fake.alerts.length, 1);
  assert.match(fake.alerts[0].subject, /NOT confirmed/);

  const v = await verify(tx("CLS-EDIT-1"));
  assert.equal(v.status, 400);
  assert.equal(fake.alerts.length, 1, "the verify route does not alert a second time");
}));

test("early price after seat 10, inside the 30 minutes: accepted", quiet(async () => {
  fake.seats = { n: 10, filled_at: new Date(T.getTime() - 10 * 60_000).toISOString() };
  const r = await webhook(tx("CLS-EDIT-1"));
  assert.equal(r.body.recorded, true);
  assert.equal(wroteSeat(), true);
}));

test("verify then webhook for the same payment: one email, one alert", quiet(async () => {
  const v = await verify(tx("CLS-COMBO-1", { amount: 175000 }));
  assert.deepEqual(v, { status: 200, body: { success: true } });
  fake.insertReturns = [];
  fake.existing = [{ transaction_ref: "CLS-COMBO-1", status: "confirmed" }];
  const w = await webhook(tx("CLS-COMBO-1", { amount: 175000 }));
  assert.equal(w.body.recorded, true);
  assert.equal(fake.sent.length, 1);
  assert.equal(fake.alerts.length, 1);
  assert.ok(fake.queries.filter((q) => /INSERT INTO course_purchases/.test(q.text)).every((q) => q.params[2] === "ai-mastery-combo"));
}));

test("a second, different payment for the same product is not written over the first; owner told", quiet(async () => {
  fake.insertReturns = [];
  fake.existing = [{ transaction_ref: "CO3-AGENT-OLD", status: "confirmed" }];
  const w = await webhook(tx("CO3-AGENT-NEW", { amount: 430000 }));
  assert.equal(w.body.recorded, true);
  assert.equal(fake.sent.length, 0);
  assert.equal(fake.alerts.length, 1);
  assert.match(fake.alerts[0].subject, /Second payment/);
  assert.ok(!fake.queries.some((q) => /UPDATE course_purchases SET (amount|transaction_ref)/.test(q.text)));
}));

test("coaching: fixed price, no seat count, the 24 hour line in the email", quiet(async () => {
  const ok = await webhook(tx("CO3-AGENT-1", { amount: 430000 }));
  assert.equal(ok.body.recorded, true);
  assert.equal(fake.queries.some((q) => /WITH s AS/.test(q.text)), false);
  assert.ok(fake.sent[0].text.includes("within 24 hours"));
  const ins = fake.queries.find((q) => /INSERT INTO course_purchases/.test(q.text))!;
  assert.equal(ins.params[2], "coaching-agents-3w");

  fake.queries = [];
  const under = await webhook(tx("CO3-AGENT-2", { amount: 429999 }));
  assert.equal(under.body.recorded, false);
  assert.equal(wroteSeat(), false);
}));

test("a class payment in USD is refused (naira only)", quiet(async () => {
  const r = await webhook(tx("CLS-AGENT-1", { amount: 100, currency: "USD" }));
  assert.equal(r.body.recorded, false);
  assert.equal(wroteSeat(), false);
}));

test("a failed charge with a class prefix writes nothing", quiet(async () => {
  const r = await webhook(tx("CLS-AGENT-1", { status: "failed" }));
  assert.deepEqual(r, { status: 200, body: { received: true } });
  assert.equal(fake.queries.length, 0);
}));

// ---------------- My purchases ----------------

test("My purchases: course seats are listed with their name and what happens next", async () => {
  assert.deepEqual(classSeatRow({ slug: "ai-ugc-content", amount: 27000, currency: "NGN", txRef: "CLS-UGC-1", createdAt: T }).kind, "niche");
  const coach = classSeatRow({ slug: "coaching-web3-2w", amount: 230000, currency: "NGN", txRef: "CO2-WEB3-1", createdAt: T });
  assert.equal(coach.productName, "AI for Web3 and DeFi coaching, 2 weeks");
  assert.match(coach.next ?? "", /24 hours/);
  const old = classSeatRow({ slug: "ai-content-mastery", amount: 27000, currency: "NGN", txRef: "QV-1", createdAt: T });
  assert.deepEqual([old.productName, old.kind, old.next], ["AI Mastery", "ai-mastery", null]);

  const secret = "s".repeat(32);
  const asked: string[] = [];
  const rt = {
    now: () => T,
    store: { async listOrdersByEmail() { return []; }, async getProduct() { return null; } },
    courses: {
      async listByEmail(email: string) {
        asked.push(email);
        return [{ slug: "ai-mastery-combo", amount: 175000, currency: "NGN", txRef: "CLS-COMBO-1", createdAt: T }];
      },
    },
  } as never;
  const v = await loadPurchases(rt, signPurchasesToken("buyer@example.com", T, secret), secret);
  assert.ok(v.ok);
  assert.deepEqual(asked, ["buyer@example.com"]);
  assert.equal(v.ok && v.classes[0].productName, "AI Mastery Combo (all 7 niches)");
  assert.match((v.ok && v.classes[0].next) || "", /Monday 4 January 2027/);
});

test("My purchases: a buyer who holds only a class seat still gets the sign-in link; nobody else does", async () => {
  const secret = "s".repeat(32);
  const sent: string[] = [];
  const mk = (seats: number) =>
    ({
      now: () => T,
      baseUrl: "https://example.test",
      sender: { async send(m: { to: string }) { sent.push(m.to); return { ok: true }; } },
      store: { async listOrdersByEmail() { return []; } },
      courses: { async listByEmail() { return seats ? [{ slug: "ai-agents", amount: 40000, currency: "NGN", txRef: "CLS-AGENT-1", createdAt: T }] : []; } },
    }) as never;
  await sendPurchasesLinkIfAny(mk(1), "buyer@example.com", secret);
  await sendPurchasesLinkIfAny(mk(0), "nobody@example.com", secret);
  assert.deepEqual(sent, ["buyer@example.com"]);
});
