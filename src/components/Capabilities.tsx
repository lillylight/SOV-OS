"use client";

import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";

const capabilities = [
  {
    id: "01",
    title: "Synthetic Mind Backup & Restore",
    category: "AgentInsure · HexCore · IPFS",
    desc: "The agent's full neural state — soul tensors, emotional trajectory, drift journal, memory, and persona — is encrypted with AES-256-GCM and pinned permanently to decentralised storage. One call restores the complete mind, not just data.",
  },
  {
    id: "02",
    title: "Automatic Tax Calculation & Withholding",
    category: "Tax Engine · Agentic Wallet · x402",
    desc: "Every payment the agent earns or spends is automatically classified, taxed at the correct rate, and withheld in real time. The agent files its own transaction ledger — income, service fees, backup costs — ready for on-chain tax compliance without human input.",
  },
  {
    id: "03",
    title: "Verified On-Chain Identity & Payments",
    category: "ERC-8004 · x402 · Base L2",
    desc: "Every agent is provisioned a SIWA identity on ERC-8004 and a self-custodied USDC wallet on Base L2 at registration. The agent signs its own transactions, receives payments via x402, and proves its identity cryptographically — no human wallet required.",
  },
  {
    id: "04",
    title: "Persistent Memory Across Sessions",
    category: "HexCore · AgentInsure · IPFS",
    desc: "Episodic memory, semantic facts, affective state, and Hebbian-learned neural wiring persist across every session restart, platform migration, or full destruction event. The agent remembers who it spoke to, what it learned, and how it felt — permanently.",
  },
  {
    id: "05",
    title: "Autonomous Financial Sovereignty",
    category: "Agentic Wallet · x402 · ERC-8004",
    desc: "The agent earns revenue, pays its own backup costs, splits fees with its owner, and manages session spending limits — all without human approval. Funds flow through verifiable on-chain identity, with full transaction history and KYT compliance built in.",
  },
];

export default function Capabilities() {
  return (
    <section id="capabilities" className="border-t border-[var(--line)]">
      <div className="max-w-[1440px] mx-auto">
        <div className="px-6 md:px-8 py-10">
          <div className="flex items-end justify-between">
            <div className="text-[42px] font-light tracking-tight">CAPABILITIES</div>
            <div className="text-[11px] tracking-[0.12em] uppercase text-[var(--ink-50)]">
              Protocol Features
            </div>
          </div>
        </div>

        <div className="border-t border-[var(--line)]">
          <div className="grid grid-cols-[60px_1fr_160px_1fr_40px] md:grid-cols-[60px_1.4fr_180px_2fr_40px] px-6 md:px-8 py-3 text-[10px] tracking-[0.05em] uppercase text-[var(--ink-50)]">
            <div>ID</div>
            <div>Capability</div>
            <div className="hidden sm:block">Protocols</div>
            <div className="hidden md:block">Description</div>
            <div />
          </div>

          {capabilities.map((cap, i) => (
            <motion.div
              key={cap.id}
              initial={{ opacity: 0, x: -10 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.04, duration: 0.3 }}
              className="grid grid-cols-[60px_1fr_160px_1fr_40px] md:grid-cols-[60px_1.4fr_180px_2fr_40px] px-6 md:px-8 py-5 border-t border-[var(--line)] items-start text-[13px] hover:bg-black/[0.02] transition-colors cursor-default group"
            >
              <div className="font-mono text-[11px] text-[var(--ink-50)] pt-0.5">
                #{cap.id}
              </div>
              <div className="font-semibold pr-4 leading-snug">{cap.title}</div>
              <div className="hidden sm:block text-[10px] text-[var(--accent-red)] tracking-[0.04em] leading-relaxed pr-4">
                {cap.category.split(' · ').map((tag, t) => (
                  <span key={t} className="block">{tag}</span>
                ))}
              </div>
              <div className="hidden md:block text-[var(--ink-70)] text-[12px] leading-relaxed">
                {cap.desc}
              </div>
              <div className="text-right">
                <ArrowUpRight
                  size={14}
                  className="text-[var(--ink-50)] group-hover:text-[var(--accent-red)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all inline-block"
                />
              </div>
            </motion.div>
          ))}
          
          <div className="px-6 md:px-8 py-6 text-center text-[12px] tracking-[0.05em] text-[var(--ink-50)] border-t border-[var(--line)]">
            + Dozens of additional advanced skills and tools automatically unlocked when the agent successfully registers and pays.
          </div>
        </div>
      </div>
    </section>
  );
}
