import { originAllowed } from "@/lib/companion/checkout-handler";
import { handlePurchasesDownload, NO_STORE } from "@/lib/companion/purchases-handler";
import { purchasesSecret } from "@/lib/companion/purchases-link";
import { getRuntime } from "@/lib/companion/runtime";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// POST from the My purchases page: checks the signed token and that the order is this
// buyer's, issues a fresh download link (daily limit applies), then redirects to it.
export async function POST(req: Request) {
  try {
    if (!originAllowed(req.headers.get("origin"), req.headers.get("referer"))) {
      return new Response("Forbidden", { status: 403, headers: { "cache-control": NO_STORE } });
    }
    return await handlePurchasesDownload(await getRuntime(), req, purchasesSecret());
  } catch (err) {
    // Never log the request body: it holds the signed token.
    console.error("[companion] purchases download failed:", err instanceof Error ? err.name : "unknown");
    return new Response("Something went wrong. Contact support.", { status: 500, headers: { "cache-control": NO_STORE } });
  }
}
