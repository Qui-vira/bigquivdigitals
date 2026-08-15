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
  /**
   * The WhatsApp room invite.
   *
   * Read server-side and passed down rather than inlined as NEXT_PUBLIC_*, so
   * the link can be rotated from the Vercel dashboard without a code change —
   * which matters because a WhatsApp invite can be revoked or reset at any
   * time, and a dead invite on the success page is worse than no invite.
   *
   * Unset is a supported state: the room button simply does not render and the
   * page still delivers the Opportunity Map. Nothing on the page promises the
   * room, so nothing breaks by its absence.
   */
  const roomUrl = process.env.WHATSAPP_GROUP_URL?.trim() || null;

  if (!roomUrl) {
    console.warn(
      "[waitlist] WHATSAPP_GROUP_URL not set — the room invite is hidden. Set it in Vercel to switch it on."
    );
  }

  return <WaitlistClient roomUrl={roomUrl} />;
}
