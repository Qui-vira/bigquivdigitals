import type { Metadata } from "next";
import { inspectToken } from "@/lib/companion/tokens";
import { getRuntime } from "@/lib/companion/runtime";
import { CONTACTS, STATUS_LINE, POLICY_LINE, WHATS_IN_ZIP } from "@/lib/companion/emails/templates";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Download TheEditCompanion",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

function Contacts() {
  return (
    <ul className="mt-4 space-y-1 text-sm">
      {Object.values(CONTACTS).map((c) => (
        <li key={c.label}>
          {c.label}: <a className="underline" href={c.href}>{c.value}</a>
        </li>
      ))}
    </ul>
  );
}

// Rendering a GET never consumes a download: only the POST below does.
export default async function DownloadLandingPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const rt = await getRuntime();
  const seen = await inspectToken(rt.store, token, rt.now());

  if (seen.state !== "valid") {
    // One page for expired, revoked, used up and unknown links. No hint which.
    return (
      <main className="mx-auto max-w-xl px-4 py-16">
        <h1 className="text-2xl font-bold">This link is not available</h1>
        <p className="mt-3">It may have expired or already been used. Contact us and we will send a new one.</p>
        <Contacts />
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-xl px-4 py-16">
      <h1 className="text-2xl font-bold">Your TheEditCompanion download</h1>
      <p className="mt-3">{WHATS_IN_ZIP}</p>
      <p className="mt-3">After you unzip it, open START-HERE.pdf first.</p>
      <form method="POST" action="/api/companion/download" className="mt-6">
        <input type="hidden" name="token" value={token} />
        <button type="submit" className="rounded-lg bg-black px-6 py-3 font-bold text-white">
          Download TheEditCompanion.zip
        </button>
      </form>
      <p className="mt-4 text-sm opacity-75">{STATUS_LINE}</p>
      <p className="mt-2 text-sm opacity-75">{POLICY_LINE}</p>
      <h2 className="mt-8 font-semibold">Need help?</h2>
      <Contacts />
    </main>
  );
}
