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
  // /pricing and /portfolio were removed in the A4 rebuild.
  //
  // /waitlist redirected to /greatwork-waitlist from 2026-08-18 to 2026-08-20.
  // The owner killed that on challenge-launch night: two courses share the word
  // "waitlist" and a silent redirect puts half the arrivals in the wrong room.
  // /waitlist is now a real chooser page (app/waitlist/page.tsx) naming both.
  // Old links in bios and DMs keep resolving — they just get the choice now.
  async redirects() {
    return [
      { source: "/pricing", destination: "/services", permanent: true },
      { source: "/portfolio", destination: "/", permanent: true },
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
