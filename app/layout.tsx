import type { Metadata, Viewport } from "next";
import { SITE_URL } from "@/lib/site";
import { Bricolage_Grotesque, Karla } from "next/font/google";
import "./globals.css";
import { PublicNavbar, PublicWrapper } from "@/components/PublicShell";
import { FooterServer } from "@/components/FooterServer";
import { ParticleFieldLoader } from "@/components/ParticleFieldLoader";
import { CustomCursor } from "@/components/CustomCursor";
import { OrganizationJsonLd } from "@/components/StructuredData";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

/**
 * Display / body pairing. Inter was doing both jobs, which is why every heading
 * read as neutral. Bricolage Grotesque carries the headline weight without
 * looking like a default; Karla keeps body copy quiet underneath it.
 */
const display = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-display-face",
  display: "swap",
});

const body = Karla({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  alternates: { canonical: "/" },
  title: "BigQuiv Digitals | Growth systems that turn attention into revenue",
  description: "Website, AI content, community infrastructure, strategy and reporting, built as one system. Three live builds you can go and check.",
  openGraph: {
    title: "BigQuiv Digitals | Growth systems that turn attention into revenue",
    description: "Website, AI content, community infrastructure, strategy and reporting, built as one system. Three live builds you can go and check.",
    type: "website",
    url: SITE_URL,
    images: [
      {
        url: "/og-image.webp",
        width: 1456,
        height: 816,
        alt: "BigQuiv Digitals - Growth systems that turn attention into revenue",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "BigQuiv Digitals | Growth systems that turn attention into revenue",
    description: "Website, AI content, community infrastructure, strategy and reporting, built as one system. Three live builds you can go and check.",
    images: ["/og-image.webp"],
  },
  icons: {
    icon: "/icon",
    apple: "/apple-icon",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <head>
        {/*
          The hero is the largest contentful paint on the homepage and both
          plates are needed before the reveal can composite, so neither is
          lazy-loaded. Preloaded as avif at the two sizes the canvas actually
          picks; the 1024 pair is 29 KB total.
        */}
        {/* Breakpoints must match pickSrc() in components/HeroReveal.tsx.
            Both key on CSS pixels; mismatching them downloads the hero twice. */}
        <link rel="preload" as="image" type="image/avif" href="/hero/king-base-1024.avif" media="(max-width: 900px)" />
        <link rel="preload" as="image" type="image/avif" href="/hero/king-chrome-1024.avif" media="(max-width: 900px)" />
        <link rel="preload" as="image" type="image/avif" href="/hero/king-base-1600.avif" media="(min-width: 901px) and (max-width: 1600px)" />
        <link rel="preload" as="image" type="image/avif" href="/hero/king-chrome-1600.avif" media="(min-width: 901px) and (max-width: 1600px)" />
        <link rel="preload" as="image" type="image/avif" href="/hero/king-base-2560.avif" media="(min-width: 1601px)" />
        <link rel="preload" as="image" type="image/avif" href="/hero/king-chrome-2560.avif" media="(min-width: 1601px)" />
      </head>
      <body className="min-h-screen bg-bg-primary font-sans text-text-primary antialiased">
        {/* JSON-LD. In the root layout so it is present on every route, and in
            the SSR HTML so a crawler sees it without executing anything. */}
        <OrganizationJsonLd />
        <CustomCursor />
        <ParticleFieldLoader />
        <PublicNavbar />
        <main>{children}</main>
        <PublicWrapper>
          <FooterServer />
        </PublicWrapper>
      </body>
    </html>
  );
}
