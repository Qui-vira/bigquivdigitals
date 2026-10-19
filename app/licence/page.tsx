import type { Metadata } from "next";
import { LegalPage, type LegalSection } from "@/components/companion/LegalPage";

export const metadata: Metadata = {
  title: "Licence | BigQuiv Digitals",
  description: "The licence for TheEditCompanion by BigQuiv Digitals. Draft, not reviewed by a lawyer.",
  alternates: { canonical: "/licence" },
};

const SECTIONS: readonly LegalSection[] = [
  {
    heading: "What you may do",
    paragraphs: [
      "Your licence is for one person: the person named on the order.",
      "You may use TheEditCompanion to make videos for your own clients, as well as for yourself.",
    ],
  },
  {
    heading: "What you may not do",
    paragraphs: ["You may not:"],
    bullets: [
      "Share TheEditCompanion or your download link with anyone else",
      "Resell it, rent it or give it away",
      "Put it, or any part of it, on a public site or in a public folder",
      "Package it inside another product or course",
    ],
  },
  {
    heading: "Third-party tools keep their own licences",
    paragraphs: [
      "TheEditCompanion uses and bundles tools made by other people. Each keeps its own licence. This licence does not replace theirs.",
      "The full list of credits and licences is inside the download, in the docs folder. For example, Remotion has its own licence terms for companies.",
    ],
  },
  {
    heading: "References",
    paragraphs: [
      "Having this licence does not give you the right to copy any reference video. You must hold the rights to the reference you use.",
    ],
  },
  {
    heading: "No promise of updates",
    paragraphs: ["Updates are not promised. Install support runs for 30 days after you buy."],
  },
];

export default function LicencePage() {
  return (
    <LegalPage
      title="Licence"
      updated="15 October 2026"
      intro="This is the licence for TheEditCompanion by BigQuiv Digitals. It says who may use it and how."
      sections={SECTIONS}
    />
  );
}
