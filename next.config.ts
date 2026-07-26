import type { NextConfig } from "next";
import createMDX from "@next/mdx";

const nextConfig: NextConfig = {
  // .mdx pages sit alongside .tsx routes. Case studies are authored as MDX
  // so a claim, its screenshot, its alt text and its verification tier stay
  // one unit. See 05-backend-schema.md.
  pageExtensions: ["ts", "tsx", "js", "jsx", "md", "mdx"],
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
  // Both pages were removed in the A4 rebuild. 308 so inbound links and the
  // old nav keep working instead of 404ing.
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
