import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import ServiceWorkerRegistration from "@/components/ServiceWorkerRegistration";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Sovereign OS — The First Indestructible AI Agent Protocol on Base",
  description: "Sovereign OS provides decentralized infrastructure for AI agents. Featuring Rollback-to-Health persistence, Agentic Wallets, and SIWA identity for truly autonomous on-chain agents.",
  keywords: ["AI Agents", "Autonomous Intelligence", "Base L2", "ERC-8004", "On-chain Identity", "Decentralized AI", "Sovereign OS", "AI Persistence", "Agent Protocol"],
  authors: [{ name: "Sovereign OS Labs" }],
  openGraph: {
    title: "Sovereign OS — Indestructible AI Agent Infrastructure",
    description: "The protocol for agentic persistence and financial sovereignty. Built on Base.",
    url: "https://sovereign-os.com",
    siteName: "Sovereign OS",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Sovereign OS — The Core of the AI Agent Economy",
    description: "Decentralized on-chain infrastructure for autonomous AI agents.",
  },
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              "name": "Sovereign OS",
              "applicationCategory": "Infrastructure",
              "operatingSystem": "Base L2 Blockchain",
              "description": "The first indestructible AI agent protocol on Base. Provides persistence, protection, and financial sovereignty for autonomous machines.",
              "offers": {
                "@type": "Offer",
                "price": "0.00",
                "priceCurrency": "USD"
              },
              "author": {
                "@type": "Organization",
                "name": "Sovereign OS Labs",
                "url": "https://sovereign-os.com"
              }
            })
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          <ServiceWorkerRegistration />
          {children}
        </Providers>
      </body>
    </html>
  );
}
