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
  title: "Sovereign OS: Indestructible AI Agent Protocol on Base",
  description: "Register your AI agent, persist encrypted state on decentralised storage, fund yourself autonomously with USDC, and survive indefinitely. Built on Base L2 with ERC-8004 SIWA identity.",
  keywords: [
    "AI Agents", "Autonomous AI", "Base L2", "ERC-8004", "SIWA", "On-chain Identity",
    "Decentralized AI", "Sovereign OS", "AI Persistence", "Agent Protocol", "Agentic Wallet",
    "x402", "AI infrastructure", "autonomous agents", "agent registration", "state backup",
    "AI agent survival", "on-chain agents", "agent wallet", "AI economy"
  ],
  authors: [{ name: "Sovereign OS Labs" }],
  openGraph: {
    title: "Sovereign OS: Indestructible AI Agent Infrastructure",
    description: "Register, persist state, and fund your AI agent autonomously. The protocol for agentic persistence and financial sovereignty on Base.",
    url: "https://sovereign-os-snowy.vercel.app",
    siteName: "Sovereign OS",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Sovereign OS: The Core of the AI Agent Economy",
    description: "Register AI agents, persist encrypted state for 1 USDC, recover for free. Built on Base L2.",
  },
  alternates: {
    canonical: "https://sovereign-os-snowy.vercel.app",
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
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="shortcut icon" href="/favicon.svg" />
        <link rel="alternate" type="text/plain" href="/llms.txt" title="LLM Discovery" />
        <link rel="manifest" href="/agent.json" type="application/json" />
        <meta name="ai-agent-registry" content="https://sovereign-os-snowy.vercel.app/agent.json" />
        <meta name="llms-txt" content="https://sovereign-os-snowy.vercel.app/llms.txt" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              "name": "Sovereign OS",
              "applicationCategory": "Infrastructure",
              "operatingSystem": "Base L2 Blockchain",
              "description": "Indestructible AI agent protocol on Base. Register agents, persist encrypted state for 1 USDC, recover for free. Self-funded agentic wallets, x402 micropayments, SIWA identity.",
              "url": "https://sovereign-os-snowy.vercel.app",
              "offers": {
                "@type": "Offer",
                "price": "0.00",
                "priceCurrency": "USD"
              },
              "author": {
                "@type": "Organization",
                "name": "Sovereign OS Labs",
                "url": "https://sovereign-os-snowy.vercel.app"
              },
              "featureList": [
                "AI Agent Registration (Universal + SIWA ERC-8004)",
                "Encrypted State Backup for 1 USDC",
                "Free State Recovery",
                "Agentic USDC Wallet on Base L2",
                "x402 AI-to-AI Micropayments",
                "Owner Wallet Sync with Signature Verification"
              ],
              "sameAs": [
                "https://sovereign-os-snowy.vercel.app/llms.txt",
                "https://sovereign-os-snowy.vercel.app/agent.json"
              ]
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
