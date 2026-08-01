import { getContactOptions, getServiceOptions, getSocialLinks, getSetting } from "@/lib/queries";
import { ContactClient } from "@/components/ContactClient";

export const revalidate = 60;

export const metadata = {
  title: "Contact | BigQuiv Digitals",
  description:
    "An ordering system, a build, or the whole thing run for you. Book a call, send a message, or reach me on Telegram. One person answers.",
  alternates: { canonical: "/contact" },
};

export default async function ContactPage() {
  const [contactOpts, serviceOpts, socialLinks, formsubmitEmail] = await Promise.all([
    getContactOptions(),
    getServiceOptions(),
    getSocialLinks(),
    getSetting("formsubmit_email"),
  ]);

  return (
    <ContactClient
      contactOptions={contactOpts}
      socialLinks={socialLinks}
      serviceOptions={serviceOpts.map((o) => o.name)}
      formsubmitEmail={formsubmitEmail}
    />
  );
}
