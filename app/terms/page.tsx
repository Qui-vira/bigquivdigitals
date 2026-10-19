import type { Metadata } from "next";
import { LegalPage, type LegalSection } from "@/components/companion/LegalPage";
import { INSTALL_STATUS } from "@/components/companion/content";

export const metadata: Metadata = {
  title: "Terms of sale | BigQuiv Digitals",
  description: "Terms of sale for TheEditCompanion by BigQuiv Digitals. Draft, not reviewed by a lawyer.",
  alternates: { canonical: "/terms" },
};

const SECTIONS: readonly LegalSection[] = [
  {
    heading: "Who sells this",
    paragraphs: [
      "TheEditCompanion is sold by BigQuiv Digitals, Nigeria. Contact details are at the bottom of this page.",
    ],
  },
  {
    heading: "What you buy",
    paragraphs: [
      "You buy one download of TheEditCompanion: a set of skills for Claude Code, with an installer, a doctor check, a rescue command and guides. The TheEditCompanion page lists what is inside.",
      "You get a licence to use it, not ownership of it. The Licence page says what you may and may not do.",
    ],
  },
  {
    heading: "Price and payment",
    paragraphs: [
      "You are charged in naira. The price shown on the page when you pay is the price you are charged. Dollar amounts on the page are a reference for international buyers and are not charged.",
      "Payment is taken by Flutterwave on its own hosted payment page. We do not see or store your card details.",
    ],
  },
  {
    id: "refunds",
    heading: "All sales are final",
    paragraphs: [
      "All sales are final. There are no refunds. You tick a box before you pay to confirm you understand this.",
      "You also tick a second box to say you want your download immediately and that you give up any right to cancel once you have it.",
      "If something does not install or work, we help you fix it. See the support section below. If you believe you were charged by mistake, message us with your email and the time of payment, and we will check it.",
    ],
  },
  {
    heading: "Delivery",
    paragraphs: [
      "After your payment is confirmed, you get a download link on the page you return to and by email. The link expires and has a limited number of downloads. If it stops working, message us and we will send a new one.",
    ],
  },
  {
    heading: "Support",
    paragraphs: [
      "For 30 days after you buy, we help you install and run it. Support is for installing and running TheEditCompanion. It is not editing work and it is not a promise about how your videos will look.",
      "Updates are not promised. We may release changes, but we do not owe you any.",
    ],
  },
  {
    heading: "Requirements and honest limits",
    paragraphs: [
      "You need a paid Claude plan that can run Claude Code. Plan limits apply, and the Claude plan is not included in the price.",
      "Windows first. " + INSTALL_STATUS,
      "The result depends on your reference, your script and what you approve. We promise no views, no sales and no income. Colour grading still needs a human eye.",
    ],
  },
  {
    heading: "References and third-party tools",
    paragraphs: [
      "You must hold the rights to any reference video you use. Downloading a video from a social platform may breach that platform's terms. That is your responsibility.",
      "TheEditCompanion works with tools made by other people, such as Claude Code, HyperFrames, Remotion and FFmpeg. They keep their own licences and terms. We are not affiliated with Anthropic, HeyGen or Remotion.",
    ],
  },
  {
    heading: "Our responsibility",
    paragraphs: [
      "We sell this as it is described on the page. To the extent the law allows, our responsibility to you for any claim about the product is limited to the price you paid.",
    ],
  },
  {
    heading: "Law",
    paragraphs: ["These terms are governed by the laws of Nigeria."],
  },
  {
    heading: "Changes to these terms",
    paragraphs: ["We may change these terms. The terms in force when you pay are the ones that apply to your order."],
  },
];

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of sale"
      updated="15 October 2026"
      intro="These are the terms for buying TheEditCompanion from BigQuiv Digitals. They are written in plain words on purpose."
      sections={SECTIONS}
    />
  );
}
