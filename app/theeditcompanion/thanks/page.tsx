import type { Metadata } from "next";
import Link from "next/link";
import { ContactList } from "@/components/companion/ContactList";
import { ThanksStatus } from "@/components/companion/ThanksStatus";
import { CHECKOUT, SUPPORT_LINE } from "@/components/companion/content";
import { Stage } from "@/components/v3/stage/Stage";
import "@/components/v3/pages/companion.css";

/**
 * Where the hosted payment page sends the buyer back. Private status page: not indexed,
 * not in the sitemap. It shows only what the status endpoint returns for this browser's
 * claim cookie; nothing from the URL is displayed.
 *
 * v3 layout (comp: CompanionThanks.dc.html): the product box, open and small, beside the
 * status panel on a short navy stage, then the support contacts. ThanksStatus, its props
 * and its polling are unchanged; components/v3/pages/companion.css restyles its markup.
 */
export const metadata: Metadata = {
  title: "Your order | BigQuiv Digitals",
  robots: { index: false, follow: false },
};

const REF_RE = /^TEC-[A-Za-z0-9_-]{1,64}$/;

export default async function ThanksPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const raw = (await searchParams)?.ref;
  const value = Array.isArray(raw) ? raw[0] : raw;
  const orderRef = value && REF_RE.test(value) ? value : null;
  return (
    <div className="v3 v3-companion v3-thanks">
      <Stage
        scene="box"
        params={{ mode: "thanks", folders: ["TheEditCompanion"], sub: "START-HERE.pdf" }}
        ground="navy"
        height={150}
        heightPhone={130}
        mark="ORDER"
        fallback="/v3/stills/box.webp"
        label="Your order"
      >
        <div className="v3-intro">
          <h1 id="thanks-h" className="v3-display v3-thanks__title">
            Your order
          </h1>
          <div className="v3-thanks__panel">
            <ThanksStatus
              orderRef={orderRef}
              copy={{
                working: CHECKOUT.working,
                errPayment: CHECKOUT.errPayment,
                errNotConfirmed: CHECKOUT.errNotConfirmed,
              }}
            />
          </div>
        </div>
      </Stage>
      <section className="v3-section v3-section--cloud v3-grain" data-nav="cloud" aria-labelledby="support-h">
        <div className="v3-wrap v3-thanks__support">
          <h2 id="support-h" className="v3-h2 v3-display">
            Support contacts
          </h2>
          <div>
            <div className="v3-contacts">
              <ContactList />
            </div>
            <p className="v3-thanks__support-line">{SUPPORT_LINE}</p>
            <p className="v3-thanks__purchases">
              Need your download or receipt later? Go to{" "}
              <Link href="/my-purchases" className="v3-link">
                My purchases
              </Link>
              .
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
