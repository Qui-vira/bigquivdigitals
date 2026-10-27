import { handleDownload } from "@/lib/companion/download-handler";
import { getRuntime } from "@/lib/companion/runtime";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 300;

// POST only: a GET (email scanner, link preview) never consumes a download.
export async function POST(req: Request) {
  try {
    return await handleDownload(await getRuntime(), req);
  } catch (err) {
    // Never log the request body: it holds the raw token.
    console.error("[companion] download failed:", err instanceof Error ? err.message : "unknown");
    return new Response("Something went wrong. Contact support.", { status: 500, headers: { "cache-control": "no-store" } });
  }
}
