import { NextResponse } from "next/server";
import { unlockArticle } from "@/lib/articles-db";
import { mdToHtml, splitTitle } from "@/lib/doc-markdown";
import { getClientIp, rateLimit } from "@/lib/rate-limit";

/**
 * POST { slug, code } -> { html } for a code-word gated /doc page.
 *
 * The page for a gated article ships with no body at all. This is the only way
 * the body leaves the server, and only after the code word matches (trimmed,
 * case-insensitive, compared in SQL). A wrong code, an unknown slug and an
 * ungated slug all get the same 401, so the endpoint says nothing about rows.
 */
export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store" };

export async function POST(req: Request) {
  const ip = getClientIp(req.headers);
  const limit = rateLimit(`doc-unlock:${ip}`, 20, 60_000);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many tries. Wait a minute and try again." },
      { status: 429, headers: { ...NO_STORE, "Retry-After": String(limit.retryAfter ?? 60) } },
    );
  }

  let slug: unknown;
  let code: unknown;
  try {
    ({ slug, code } = await req.json());
  } catch {
    return NextResponse.json({ error: "Bad request." }, { status: 400, headers: NO_STORE });
  }
  if (
    typeof slug !== "string" ||
    typeof code !== "string" ||
    !slug ||
    slug.length > 200 ||
    !code.trim() ||
    code.length > 100
  ) {
    return NextResponse.json({ error: "Bad request." }, { status: 400, headers: NO_STORE });
  }

  let content: string | null;
  try {
    content = await unlockArticle(slug, code);
  } catch {
    return NextResponse.json(
      { error: "Could not check the code right now. Try again in a minute." },
      { status: 503, headers: NO_STORE },
    );
  }
  if (content === null) {
    return NextResponse.json({ error: "wrong-code" }, { status: 401, headers: NO_STORE });
  }

  // The page header already carries the title, so send the body without it.
  const { bodyHtml } = splitTitle(mdToHtml(content));
  return NextResponse.json({ html: bodyHtml }, { headers: NO_STORE });
}
