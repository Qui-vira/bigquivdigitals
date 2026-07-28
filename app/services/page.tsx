import { getSetting } from "@/lib/queries";
import { ServicesClient } from "@/components/ServicesClient";

export const revalidate = 60;

export const metadata = {
  title: "The Growth Operating System | BigQuiv Digitals",
  description:
    "One system covering website, AI content, community infrastructure, strategy and reporting. One invoice, one person responsible.",
};

export default async function ServicesPage() {
  // The `services` table held 14 rows across consulting, education and
  // ai_products. All 14 were retired on 2026-07-25. This page now presents the
  // single Growth Operating System offer, so it needs no service rows at all.
  const calendlyUrl = await getSetting("calendly_url");

  return <ServicesClient calendlyUrl={calendlyUrl} />;
}
