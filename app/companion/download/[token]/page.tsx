import type { Metadata } from "next";
import { inspectToken } from "@/lib/companion/tokens";
import { getRuntime } from "@/lib/companion/runtime";
import { CONTACTS, STATUS_LINE, POLICY_LINE, WHATS_IN_ZIP } from "@/lib/companion/emails/templates";
import "@/components/v3/pages/companion.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Download TheEditCompanion",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

function Contacts() {
  return (
    <ul>
      {Object.values(CONTACTS).map((c) => (
        <li key={c.label}>
          {c.label}: <a href={c.href}>{c.value}</a>
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
      <main className="v3 v3-section v3-section--cloud v3-download" data-nav="cloud">
        <div className="v3-download__card">
          <h1>This link is not available</h1>
          <p>It may have expired or already been used. Contact us and we will send a new one.</p>
          <Contacts />
        </div>
      </main>
    );
  }

  return (
    <main className="v3 v3-section v3-section--cloud v3-download" data-nav="cloud">
      <div className="v3-download__card">
        <h1>Your TheEditCompanion download</h1>
        <p>{WHATS_IN_ZIP}</p>
        <p>After you unzip it, open START-HERE.pdf first.</p>
        <form method="POST" action="/api/companion/download">
          <input type="hidden" name="token" value={token} />
          <button type="submit" className="v3-btn v3-btn--lg">
            Download TheEditCompanion.zip
          </button>
        </form>
        <p className="v3-download__small">{STATUS_LINE}</p>
        <p className="v3-download__small">{POLICY_LINE}</p>
        <h2>Need help?</h2>
        <Contacts />
      </div>
    </main>
  );
}
