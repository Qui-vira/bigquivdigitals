import { getStats, getTestimonials, getSetting } from "@/lib/queries";
import { HomeClient } from "@/components/HomeClient";

export const revalidate = 60;

export default async function Home() {
  // Proof strip only. The old page ran two stat bars, a pillars section and a
  // product grid, all of which described retired offers. See a2-site-audit.md.
  const [proofStats, testimonials, calendlyUrl] = await Promise.all([
    getStats("home_trust"),
    getTestimonials("home"),
    getSetting("calendly_url"),
  ]);

  return (
    <HomeClient
      calendlyUrl={calendlyUrl}
      proofStats={proofStats}
      testimonials={testimonials}
    />
  );
}
