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
    <>
      {/* The hero photo. The stage requests it as soon as the page is
          interactive; preloading overlaps that fetch with hydration. Home only:
          no other page shows it. Phones take the half-size copy. */}
      <link rel="preload" as="image" type="image/webp" crossOrigin="anonymous" href="/hero3d/quiv-color-900.webp" media="(max-width: 760px)" />
      <link rel="preload" as="image" type="image/webp" crossOrigin="anonymous" href="/hero3d/quiv-color.webp" media="(min-width: 761px)" />
      <HomeClient calendlyUrl={calendlyUrl} proofStats={proofStats} testimonials={testimonials} />
    </>
  );
}
