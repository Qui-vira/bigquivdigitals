import type { Metadata } from "next";
import { WaitlistClient } from "./WaitlistClient";

/**
 * The link that goes in every bio, Story, Status and DM during the launch.
 *
 * It exists as its own route rather than pointing at the homepage form because
 * the homepage opens on the agency argument and sells the Growth Operating
 * System underneath it. Someone arriving from a Story about a skill that is not
 * paying them lands on a case study about a pharmacy. Same form, wrong room.
 */
export const metadata: Metadata = {
  title: "The Great Work waitlist | BigQuiv Digitals",
  description:
    "A small private list. First access, the founding price, and the Opportunity Map the moment you join.",
  alternates: { canonical: "/waitlist" },
  openGraph: {
    title: "The Great Work waitlist",
    description:
      "You already have the skill. Nobody showed you where the money is.",
    type: "website",
    url: "/waitlist",
  },
};

export default function WaitlistPage() {
  return <WaitlistClient />;
}
