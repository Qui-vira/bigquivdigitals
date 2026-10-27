/**
 * Scenario 13: admin actions and the CSV route refuse unauthenticated and non-admin callers; CSV cells that
 * start with = + - @ are neutralised. The real server actions and the real route handler are imported; only
 * `server-only`, `next/headers` and `next/cache` are replaced by stubs (fixtures/) because they need a Next
 * request scope. The REAL requireAdmin -> verifySession -> jose JWT check runs.
 * Run: npx tsx --test tests/companion-e2e/05-admin-auth-csv.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import Module from "node:module";
import path from "node:path";
import { test, before, beforeEach } from "node:test";
import { SignJWT } from "jose";

const FIX = path.resolve(__dirname, "fixtures");
const STUBS: Record<string, string> = {
  "server-only": path.join(FIX, "server-only-stub.ts"),
  "next/headers": path.join(FIX, "next-headers-stub.ts"),
  "next/cache": path.join(FIX, "next-cache-stub.ts"),
};
const M = Module as unknown as { _resolveFilename: (req: string, ...rest: unknown[]) => string };
const orig = M._resolveFilename;
M._resolveFilename = function (this: unknown, request: string, ...rest: unknown[]) {
  if (STUBS[request]) return STUBS[request];
  return orig.call(this, request, ...rest);
};

const TEST_SECRET = "unit-test-secret-not-a-real-key-0123456789";
process.env.ADMIN_SESSION_SECRET = TEST_SECRET;
const cookies = (c: Record<string, string | undefined>) => ((globalThis as unknown as { __TEST_COOKIES: unknown }).__TEST_COOKIES = c);

const sign = (secret: string, exp: string | number = "7d") =>
  new SignJWT({ userId: 1 }).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime(exp).sign(new TextEncoder().encode(secret));
const b64 = (o: unknown) => Buffer.from(JSON.stringify(o)).toString("base64url");

type Harness = typeof import("./harness");
let H: Harness;
let setRuntimeForTests: typeof import("../../lib/companion/runtime").setRuntimeForTests;
let actions: typeof import("../../app/admin/actions/companion-orders");
let route: typeof import("../../app/api/admin/companion-orders/export/route");

before(async () => {
  H = await import("./harness");
  ({ setRuntimeForTests } = await import("../../lib/companion/runtime"));
  actions = await import("../../app/admin/actions/companion-orders");
  route = await import("../../app/api/admin/companion-orders/export/route");
});
beforeEach(() => cookies({}));

function csvRows(csv: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let q = false;
  for (let i = 0; i < csv.length; i++) {
    const ch = csv[i];
    if (q) {
      if (ch === '"' && csv[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') q = false;
      else cell += ch;
    } else if (ch === '"') q = true;
    else if (ch === ",") {
      row.push(cell);
      cell = "";
    }
    else if (ch === "\r" && csv[i + 1] === "\n") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
      i++;
    }
    else cell += ch;
  }
  return rows;
}

const form = (o: Record<string, string>) => {
  const f = new FormData();
  for (const [k, v] of Object.entries(o)) f.set(k, v);
  return f;
};
const redirected = async (p: Promise<unknown>) => {
  try {
    await p;
  } catch (e) {
    return String((e as { digest?: string }).digest ?? e);
  }
  return "";
};

async function paidWorld() {
  const w = await H.makeWorld({ product: { allowManualTransfer: true } });
  setRuntimeForTests(w.rt);
  const { order } = await H.buyByCard(w);
  return { w, order };
}

test("S13 every admin server action refuses callers with no session, a junk cookie, a forged token, an expired token and alg none", async () => {
  const { w, order } = await paidWorld();
  const tokensBefore = [...w.store.tokens.values()].map((t) => t.revokedAt);
  const sentBefore = w.sender.sent.length;
  const transfer = (await H.checkout(w, { method: "bank_transfer", email: "bank@example.com" })).order!;
  const callers: Record<string, string | undefined>[] = [
    {},
    { admin_session: "junk" },
    { admin_session: await sign("some-other-secret-entirely-wrong-0000000") },
    { admin_session: await sign(TEST_SECRET, Math.floor(Date.now() / 1000) - 3600) },
    { admin_session: `${b64({ alg: "none", typ: "JWT" })}.${b64({ userId: 1 })}.` },
    { tec_claim: "a-buyer-with-a-real-claim-cookie-but-no-admin-session" },
  ];
  for (const jar of callers) {
    cookies(jar);
    const label = Object.keys(jar).join(",") || "no cookie";
    await assert.rejects(actions.resendAction(form({ orderId: order.id })), /Unauthorized/, `resend: ${label}`);
    await assert.rejects(actions.revokeAction(form({ orderId: order.id })), /Unauthorized/, `revoke: ${label}`);
    await assert.rejects(
      actions.markTransferPaidAction(form({ orderId: transfer.id, amount: "89000", reference: "GTB-X" })),
      /Unauthorized/,
      `mark paid: ${label}`,
    );
  }
  assert.equal(w.sender.sent.length, sentBefore, "no email from a refused call");
  assert.deepEqual([...w.store.tokens.values()].map((t) => t.revokedAt), tokensBefore, "no token revoked");
  assert.equal((await w.store.getOrderById(transfer.id))?.status, "awaiting_transfer", "order not marked paid");
});

test("S13 the CSV export route answers 401 to every unauthenticated or non-admin caller and never reads the store", async () => {
  const { w } = await paidWorld();
  let listCalls = 0;
  const realList = w.store.listOrders.bind(w.store);
  w.store.listOrders = async (f) => (listCalls++, realList(f));
  const callers: Record<string, string | undefined>[] = [
    {},
    { admin_session: "junk" },
    { admin_session: await sign("some-other-secret-entirely-wrong-0000000") },
    { admin_session: `${b64({ alg: "none", typ: "JWT" })}.${b64({ userId: 1 })}.` },
    { tec_claim: "x".repeat(43) },
  ];
  for (const jar of callers) {
    cookies(jar);
    const res = await route.GET(new Request("https://example.test/api/admin/companion-orders/export?status=paid"));
    assert.equal(res.status, 401, Object.keys(jar).join(",") || "no cookie");
    assert.equal(await res.text(), "Unauthorized");
    assert.ok(!res.headers.get("content-type")?.includes("csv"));
  }
  assert.equal(listCalls, 0, "store untouched by refused callers");
  for (const verb of ["POST", "PUT", "PATCH", "DELETE"]) assert.equal((route as Record<string, unknown>)[verb], undefined, verb);
});

test("S13 a valid admin session passes: export works, resend and revoke actions run", async () => {
  const { w, order } = await paidWorld();
  cookies({ admin_session: await sign(TEST_SECRET) });
  const res = await route.GET(new Request("https://example.test/api/admin/companion-orders/export"));
  assert.equal(res.status, 200);
  assert.match(res.headers.get("content-type") ?? "", /^text\/csv/);
  assert.match(res.headers.get("content-disposition") ?? "", /attachment; filename="companion-orders\.csv"/);
  assert.equal(res.headers.get("cache-control"), "no-store");
  const rows = csvRows(await res.text());
  assert.equal(rows[0][0], "order_ref");
  assert.equal(rows[1][0], order.orderRef);

  const sentBefore = w.sender.sent.length;
  const back = await redirected(actions.resendAction(form({ orderId: order.id })));
  assert.match(back, /NEXT_REDIRECT/);
  assert.match(decodeURIComponent(back), /New link sent/);
  assert.equal(w.sender.sent.length, sentBefore + 1);
  const rev = await redirected(actions.revokeAction(form({ orderId: order.id })));
  assert.match(decodeURIComponent(rev), /Revoked 1 link/);
  assert.equal([...w.store.tokens.values()].filter((t) => !t.revokedAt).length, 0);
});

test("S13 CSV cells that start with = + - @ tab or CR are neutralised end to end (checkout input to export file)", async () => {
  const w = await H.makeWorld();
  setRuntimeForTests(w.rt);
  const evil = [
    '=HYPERLINK("http://evil.test","click")',
    "+1+1",
    "-2+3",
    "@SUM(A1:A9)",
    "\t=cmd",
    "=1+1",
  ];
  let i = 0;
  for (const name of evil) {
    const c = await H.checkout(w, { name, email: `v${i}@example.com`, src: i === 1 ? "-bio" : "x-bio" });
    assert.equal(c.res.status, 200, `name ${JSON.stringify(name)}: ${JSON.stringify(c.res.body)}`);
    i++;
  }
  // An email may legally start with a formula character.
  const em = await H.checkout(w, { name: "Mallory", email: "=1+1@example.com" });
  assert.equal(em.res.status, 200);

  cookies({ admin_session: await sign(TEST_SECRET) });
  const res = await route.GET(new Request("https://example.test/api/admin/companion-orders/export"));
  const text = await res.text();
  const rows = csvRows(text);
  const body = rows.slice(1).filter((r) => r.length > 1);
  assert.equal(body.length, evil.length + 1);
  let neutralised = 0;
  for (const r of body) {
    for (const cell of r) {
      assert.ok(!/^[=+\-@\t\r]/.test(cell), `cell starts with a formula character: ${JSON.stringify(cell)}`);
      if (cell.startsWith("'")) neutralised++;
    }
  }
  assert.ok(neutralised >= 7, `expected the 7 dangerous cells to carry a leading quote, saw ${neutralised}`);
  assert.ok(body.some((r) => r.includes("'=1+1@example.com")));
  assert.ok(body.some((r) => r.includes(`'=HYPERLINK("http://evil.test","click")`)), "quotes inside are doubled, then re-read intact");
  // Raw file: no line may start a cell with a bare formula character after a delimiter.
  assert.ok(!/(^|,|\r\n)[=+@-][^,\r\n]/.test(text.split("\r\n").slice(1).join("\r\n").replace(/"[^"]*"/g, '"x"')), "no bare formula cell in the raw file");
});

test("S13 export filters are validated: unknown status is ignored, src is sanitised", async () => {
  const w = await H.makeWorld();
  setRuntimeForTests(w.rt);
  await H.buyByCard(w, { src: "x-bio" });
  await H.checkout(w, { email: "other@example.com", src: "ig-bio" });
  cookies({ admin_session: await sign(TEST_SECRET) });
  const get = async (q: string) => csvRows(await (await route.GET(new Request(`https://example.test/api/admin/companion-orders/export${q}`))).text()).filter((r) => r.length > 1);
  assert.equal((await get("")).length - 1, 2);
  assert.equal((await get("?status=paid")).length - 1, 1);
  assert.equal((await get("?status=%27%3B%20DROP%20TABLE")).length - 1, 2, "unknown status ignored, not injected");
  assert.equal((await get("?src=IG-Bio%3Cscript%3E")).length - 1, 0, "src sanitised to a value that matches nothing");
  assert.equal((await get("?src=x-bio")).length - 1, 1);
});

test("S13 source check: every exported function in the admin action file and the export route starts with requireAdmin", () => {
  const act = readFileSync(path.resolve(__dirname, "../../app/admin/actions/companion-orders.ts"), "utf8");
  const exported = [...act.matchAll(/export async function (\w+)\([^)]*\)\s*\{\s*\n\s*(await requireAdmin\(\))?/g)];
  assert.ok(exported.length >= 3);
  for (const m of exported) assert.ok(m[2], `${m[1]} must call requireAdmin() as its first statement`);
  const exp = readFileSync(path.resolve(__dirname, "../../app/api/admin/companion-orders/export/route.ts"), "utf8");
  assert.ok(exp.indexOf("requireAdmin()") < exp.indexOf("adminExportCsv("), "route authenticates before it reads");
});
