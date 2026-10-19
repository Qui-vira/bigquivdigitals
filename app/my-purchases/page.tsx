import type { Metadata } from "next";
import { ContactList } from "@/components/companion/ContactList";
import { PurchasesRequestForm } from "@/components/companion/PurchasesRequestForm";
import "@/components/v3/pages/companion.css";
import "@/components/v3/pages/purchases.css";

/** Buyers ask for a sign-in link here. Not indexed, not in the sitemap. v3 look: purchases.css. */
export const metadata: Metadata = {
  title: "My purchases | BigQuiv Digitals",
  robots: { index: false, follow: false },
};

const PURCHASES_INTRO =
  "Bought TheEditCompanion? Enter the email you used. We will email you a link to see your orders, download again and print a receipt. The link works for 30 minutes.";

export default function MyPurchasesPage() {
  return (
    <section className="v3 v3-pur" data-nav="cloud" aria-labelledby="purchases-h">
      <div className="v3-pur__wrap">
        <h1 id="purchases-h">My purchases</h1>
        <p className="v3-pur__lede">{PURCHASES_INTRO}</p>
        <div className="v3-pur__card">
          <PurchasesRequestForm />
        </div>
        <div className="v3-pur__support">
          <h2>Support contacts</h2>
          <div className="v3-contacts">
            <ContactList />
          </div>
        </div>
      </div>
    </section>
  );
}
