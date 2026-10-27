import type { Metadata, Viewport } from "next";
import { SITE_URL } from "@/lib/site";
import localFont from "next/font/local";
import "./globals.css";
import "./v3.css";
import "./v3-shared.css";
import { PublicNavbar, PublicWrapper } from "@/components/PublicShell";
import { FooterServer } from "@/components/FooterServer";
import { OrganizationJsonLd } from "@/components/StructuredData";
import { OpenerMarkup } from "@/components/v3/Opener";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

/**
 * Display / body pairing. Inter was doing both jobs, which is why every heading
 * read as neutral. Bricolage Grotesque carries the headline weight without
 * looking like a default; Karla keeps body copy quiet underneath it.
 *
 * SELF-HOSTED, deliberately. These were `next/font/google` until 2026-08-14,
 * when two consecutive production builds failed with
 * `Module not found: Can't resolve '@vercel/turbopack-next/internal/font/google/font'`.
 * next/font/google downloads the woff2 files at build time, and when
 * fonts.gstatic.com is unreachable from the build machine it emits CSS pointing
 * at a module it never created. The build then fails on code that has not
 * changed, which is the worst kind of failure to debug.
 *
 * The files are committed under app/fonts (120 KB total, latin subset only), so
 * the build no longer depends on a third-party host being up. Identical
 * rendering; the only cost is that a font update is now a manual re-download.
 */
const display = localFont({
  src: [
    { path: "./fonts/BricolageGrotesque-600.woff2", weight: "600", style: "normal" },
    { path: "./fonts/BricolageGrotesque-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-display-face",
  display: "swap",
});

/**
 * Bricolage Grotesque, full variable font (opsz 12-96, wdth 75-100, wght
 * 200-800), latin subset from Google Fonts, self-hosted for the same reason as
 * above. The v3 public pages set headlines at 800 and condense them with
 * font-stretch, which the two static cuts above cannot do.
 */
const displayVar = localFont({
  src: [{ path: "./fonts/BricolageGrotesque-var.woff2", weight: "200 800", style: "normal" }],
  variable: "--font-bricolage",
  display: "swap",
});

const body = localFont({
  src: [
    { path: "./fonts/Karla-400.woff2", weight: "400", style: "normal" },
    { path: "./fonts/Karla-500.woff2", weight: "500", style: "normal" },
    { path: "./fonts/Karla-600.woff2", weight: "600", style: "normal" },
  ],
  variable: "--font-body",
  display: "swap",
});

/**
 * The two smaller faces of the v3 system (app/v3.css), self-hosted by the same rule as above,
 * latin only. Neither is critical, so neither is preloaded.
 *
 *   Courier Prime  --v3-mono: code and commands.
 *   Caveat 700     --v3-hand: the handwritten margin notes (.v3-hand). Subset to printable
 *                  ASCII plus curly quotes, arrows and the naira sign.
 *
 * Imbue, the condensed Didone of the October paper system, was removed with that system on
 * 27 Oct 2026.
 */
const typewriter = localFont({
  src: [
    { path: "./fonts/CourierPrime-400.woff2", weight: "400", style: "normal" },
    { path: "./fonts/CourierPrime-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-mono-face",
  display: "swap",
  preload: false,
});

const hand = localFont({
  src: [{ path: "./fonts/Caveat-700.woff2", weight: "700", style: "normal" }],
  variable: "--font-hand-face",
  display: "swap",
  preload: false,
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
  // X reads twitter:* before og:*, and a child page inherits whatever this block
  // sets. Hardcoding a title and description here meant EVERY page shared on X
  // rendered the homepage card: the Great Work waitlist link posted on 2026-09-03
  // showed "Growth systems that turn attention into revenue" instead of the page's
  // own copy. Leaving title and description out lets Next fall back to each page's
  // own title/description, so a page only needs its normal metadata to card
  // correctly. Set twitter.title on a page only to say something different there
  // than in its og tags.
  twitter: {
    card: "summary_large_image",
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
    <html lang="en" suppressHydrationWarning className={`${display.variable} ${displayVar.variable} ${body.variable} ${typewriter.variable} ${hand.variable}`}>
      <body id="top" className="min-h-screen bg-bg-primary font-sans text-text-primary antialiased">
        <OpenerMarkup />
        {/* JSON-LD. In the root layout so it is present on every route, and in
            the SSR HTML so a crawler sees it without executing anything. */}
        <OrganizationJsonLd />
        <PublicNavbar />
        <main id="main" tabIndex={-1} className="outline-none">{children}</main>
        <PublicWrapper>
          <FooterServer />
        </PublicWrapper>
      </body>
    </html>
  );
}
