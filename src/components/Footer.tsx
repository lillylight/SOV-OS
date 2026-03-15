"use client";

import { ArrowUpRight, Fingerprint } from "lucide-react";
import { CHAIN_CONFIG } from "@/lib/chainConfig";

const links = [
  { label: "Base L2", href: "https://base.org" },
  { label: "BaseScan", href: CHAIN_CONFIG.blockExplorer },
  { label: "Decentralised Storage", href: "https://pinata.cloud" },
  { label: "x402 Protocol", href: "https://github.com/coinbase/x402" },
  { label: "ERC-8004", href: "https://eips.ethereum.org/EIPS/eip-8004" },
];

export default function Footer() {
  return (
    <footer className="border-t border-[var(--line)]">
      <div className="max-w-[1440px] mx-auto px-6 md:px-8 py-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <Fingerprint className="text-[var(--accent-red)]" size={14} strokeWidth={2.5} />
            <span className="text-[12px] font-bold tracking-[0.08em] uppercase">
              Sovereign OS
            </span>
            <span className="text-[10px] text-[var(--ink-50)] ml-2">
              &copy; {new Date().getFullYear()}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-6">
            {links.map((link) => (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[11px] tracking-[0.06em] uppercase text-[var(--ink-50)] hover:text-[var(--ink)] transition-colors"
              >
                {link.label}
                <ArrowUpRight size={10} />
              </a>
            ))}
          </div>

          <div className="text-[10px] text-[var(--ink-50)] tracking-wide flex items-center gap-3">
            <span>AgentWill</span>
            <span>·</span>
            <span>AgentInsure</span>
            <span>·</span>
            <span>Agentic Wallet</span>
            <span className="ml-3 font-mono">Chain {CHAIN_CONFIG.chainId}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
