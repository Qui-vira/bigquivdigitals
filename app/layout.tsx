import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { PublicNavbar, PublicWrapper } from "@/components/PublicShell";
import { FooterServer } from "@/components/FooterServer";
import { ParticleFieldLoader } from "@/components/ParticleFieldLoader";
import { CustomCursor } from "@/components/CustomCursor";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://bigquivdigitals.com"),
  title: "BigQuiv Digitals | Growth systems that turn attention into revenue",
  description: "Website, AI content, community infrastructure, strategy and reporting, built as one system. Three live builds you can go and check.",
  openGraph: {
    title: "BigQuiv Digitals | Growth systems that turn attention into revenue",
    description: "Website, AI content, community infrastructure, strategy and reporting, built as one system. Three live builds you can go and check.",
    type: "website",
    url: "https://bigquivdigitals.com",
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
    <html lang="en" className={inter.className}>
      <body className="min-h-screen bg-bg-primary text-text-primary antialiased">
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
