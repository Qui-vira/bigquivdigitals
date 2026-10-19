import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { handleOrderStatus } from "@/lib/companion/download-handler";
import { getRuntime } from "@/lib/companion/runtime";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const jar = await cookies();
    const out = await handleOrderStatus(await getRuntime(), req, { get: (n) => jar.get(n)?.value });
    const res = NextResponse.json(out.body, { status: out.status, headers: { "cache-control": "no-store" } });
    if (out.setCookie) {
      res.cookies.set(out.setCookie.name, out.setCookie.value, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: out.setCookie.maxAgeSeconds,
      });
    }
    return res;
  } catch (err) {
    console.error("[companion] order-status failed:", err instanceof Error ? err.message : "unknown");
    return NextResponse.json({ error: "server_error" }, { status: 500, headers: { "cache-control": "no-store" } });
  }
}
