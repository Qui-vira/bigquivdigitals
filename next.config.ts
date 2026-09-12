import type { NextConfig } from "next";
import createMDX from "@next/mdx";

const nextConfig: NextConfig = {
  // .mdx pages sit alongside .tsx routes. Case studies are authored as MDX
  // so a claim, its screenshot, its alt text and its verification tier stay
  // one unit. See 05-backend-schema.md.
  pageExtensions: ["ts", "tsx", "js", "jsx", "md", "mdx"],
  // The circled "N" at the bottom-left is this indicator, not site code. It
  // never shipped to production, but it sits on top of the hero during every
  // review and has been reported as an artifact twice. Off.
  devIndicators: false,
  images: {
    // Explicit allowlist. This was previously hostname "**", which let the
    // image optimizer fetch and resize from any host on the internet and
    // turned the deployment into an open image proxy billed to this account.
    remotePatterns: [
      { protocol: "https", hostname: "bnoqtghdptobbtrssmdj.supabase.co" },
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com" },
      { protocol: "https", hostname: "api.qrserver.com" },
      { protocol: "https", hostname: "bigquivdigitals.com" },
    ],
  },
  // 308 so inbound links and the old nav keep working instead of 404ing.
  //
  // /pricing was removed in the A4 rebuild. /portfolio is a real route again.
  //
  // /waitlist redirected to /greatwork-waitlist from 2026-08-18 to 2026-08-20.
  // The owner killed that on challenge-launch night: two courses share the word
  // "waitlist" and a silent redirect puts half the arrivals in the wrong room.
  // /waitlist is now a real chooser page (app/waitlist/page.tsx) naming both.
  // Old links in bios and DMs keep resolving — they just get the choice now.
  async redirects() {
    return [
      { source: "/pricing", destination: "/services", permanent: true },
      // /okx is the bio link for the 60-day challenge. It is spoken aloud in
      // the episodes as "my OKX link in bio", so the path can never change —
      // only where it points.
      //
      // permanent: false is deliberate. A 308 is cached by the browser and the
      // CDN, so when Golden Fall closes, everyone who already tapped it would
      // keep landing on a dead campaign with no way to clear it. 307 leaves the
      // destination swappable for everyone.
      //
      // Golden Fall registration closes ~19 Sep 2026, Day 27 of the 60. On
      // 17 Sep swap the destination to the evergreen referral link:
      //   https://www.okx.com/join/27163950
      // channelId=27163950 is the affiliate credit and must survive any edit.
      {
        source: "/okx",
        destination:
          "https://okx.com/campaigns/golden-fall?channelId=27163950&navigationBarHidden=1&utm_campaign=11304",
        permanent: false,
      },
    ];
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
};

const withMDX = createMDX({});

export default withMDX(nextConfig);
