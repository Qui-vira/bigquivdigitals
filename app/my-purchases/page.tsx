import type { Metadata } from "next";
import { ContactList } from "@/components/companion/ContactList";
import { PurchasesRequestForm } from "@/components/companion/PurchasesRequestForm";
import { PaperSection, SectionHead } from "@/components/ui-paper";

/** Buyers ask for a sign-in link here. Not indexed, not in the sitemap. */
export const metadata: Metadata = {
  title: "My purchases | BigQuiv Digitals",
  robots: { index: false, follow: false },
};

const PURCHASES_INTRO =
  "Bought TheEditCompanion? Enter the email you used. We will email you a link to see your orders, download again and print a receipt. The link works for 30 minutes.";

export default function MyPurchasesPage() {
  return (
    <PaperSection ground="grid" width="text" pad="lg" aria-labelledby="purchases-h">
      <SectionHead as="h1" id="purchases-h" title="My purchases" size="md" />
      <p className="mt-6 max-w-[68ch] text-[17px] leading-relaxed text-ink-soft">{PURCHASES_INTRO}</p>
      <div className="mt-8 border-[3px] border-ink bg-paper p-5 shadow-brutal sm:p-8">
        <PurchasesRequestForm />
      </div>
      <div className="mt-10">
        <h2 className="font-display text-[22px] font-bold text-ink">Support contacts</h2>
        <ContactList className="mt-4" />
      </div>
    </PaperSection>
  );
}
