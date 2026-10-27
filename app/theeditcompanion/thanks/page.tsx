import type { Metadata } from "next";
import { ContactList } from "@/components/companion/ContactList";
import { ThanksStatus } from "@/components/companion/ThanksStatus";
import { CHECKOUT, SUPPORT_LINE } from "@/components/companion/content";
import { PaperSection, SectionHead } from "@/components/ui-paper";

/**
 * Where the hosted payment page sends the buyer back. Private status page: not indexed,
 * not in the sitemap. It shows only what the status endpoint returns for this browser's
 * claim cookie; nothing from the URL is displayed.
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
    <PaperSection ground="grid" width="mid" pad="lg" aria-labelledby="thanks-h">
      <SectionHead as="h1" id="thanks-h" title="Your order" size="md" />
      <div className="mt-8">
        <ThanksStatus
          orderRef={orderRef}
          copy={{
            working: CHECKOUT.working,
            errPayment: CHECKOUT.errPayment,
            errNotConfirmed: CHECKOUT.errNotConfirmed,
          }}
        />
      </div>
      <div className="mt-10">
        <h2 className="font-display text-[22px] font-bold text-ink">Support contacts</h2>
        <ContactList className="mt-4" />
        <p className="mt-6 text-[17px] font-semibold text-ink">{SUPPORT_LINE}</p>
      </div>
    </PaperSection>
  );
}
