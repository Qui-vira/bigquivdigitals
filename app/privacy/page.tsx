import type { Metadata } from "next";
import { LegalPage, type LegalSection } from "@/components/companion/LegalPage";

export const metadata: Metadata = {
  title: "Privacy | BigQuiv Digitals",
  description: "What BigQuiv Digitals stores when you buy TheEditCompanion. Draft, not reviewed by a lawyer.",
  alternates: { canonical: "/privacy" },
};

const SECTIONS: readonly LegalSection[] = [
  {
    heading: "What we store when you buy TheEditCompanion",
    paragraphs: ["When you place an order, we store:"],
    bullets: [
      "Your name and your email address",
      "The payment method, the order reference and the payment provider's reference, and the order status (for example awaiting payment, paid)",
      "The amount, the currency, which price you paid, and the amount we received",
      "A record that you ticked both boxes, with the time and the version of the wording",
      "A one-way hash of your IP address (not the address itself), stored with the consent record",
      "The source tag from the link you came from, if there was one (for example ig-bio)",
      "The dates of payment and of support (30 days after payment)",
      "Whether your delivery email was sent, how many tries it took, and the error text if it failed",
      "A hash of your order cookie, so we can tell the order is yours (the cookie value itself is not stored)",
      "Download links as hashes only (the link itself is not stored), with their expiry and how many downloads were used",
      "Each time a download link was used: the time, a one-way hash of your IP address, and the first 200 characters of your browser's user-agent text (it names your browser and system)",
      "An event log for the order: for example order created, paid, email sent, link issued, resend, download. If we ever switch on bank transfer, the log can also hold the sender name and note you give us",
    ],
  },
  {
    heading: "What we do not store",
    paragraphs: [
      "We do not store your card number or bank login. Flutterwave handles those on its own payment page.",
      "We do not add you to a marketing list. If we ever offer one, it will be a separate box, unticked.",
    ],
  },
  {
    heading: "Why",
    paragraphs: [
      "To take your payment, deliver your download, send your receipt and link, give you install support for 30 days, keep accounting records, and stop abuse.",
    ],
  },
  {
    heading: "Who processes it for us",
    paragraphs: ["We use these services to run the sale:"],
    bullets: [
      "Flutterwave, to take payment. It receives your name, your email and the amount",
      "Neon, which hosts the order database",
      "Resend, to send your download email. It receives your name, your email and the message",
      "Vercel, which hosts the website, keeps request logs (these include IP addresses and the page paths requested), and holds the download file in its file storage",
      "Telegram and email, for a short order alert to the owner. The alert can include your name, your email and the order reference",
    ],
  },
  {
    heading: "Cookies",
    paragraphs: ["When you start an order, the site sets two first-party cookies. Both are httpOnly, which means scripts on the page cannot read them:"],
    bullets: [
      "tec_claim: a random value that proves the order is yours. It lasts 14 days",
      "tec_dl: set on the order page after payment. It holds your page download link. It lasts 24 hours",
    ],
  },
  {
    heading: "How long we keep it",
    paragraphs: [
      "We do not delete order records automatically. We keep them until we delete them or you ask us to delete them, and we keep payment records for as long as accounting rules require. Download events and the order event log are kept with the order.",
    ],
  },
  {
    heading: "Ask us to delete your data",
    paragraphs: [
      "Email contact@bigquivdigitals.com from the address you used to buy, and say what you want deleted. We will delete what we are allowed to delete. We may have to keep payment records for accounting.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy"
      updated="15 October 2026"
      intro="This page says what BigQuiv Digitals stores when you buy TheEditCompanion, who handles it, and how to ask for it to be deleted."
      sections={SECTIONS}
    />
  );
}
