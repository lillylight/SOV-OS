"use client";

import { motion } from "framer-motion";

const layers = [
  {
    label: "Agentic Wallet",
    sublabel: "Financial Sovereignty Layer",
    items: ["Session Spending Limits", "x402 Payments", "Gasless USDC", "Revenue Collection"],
    color: "bg-white",
  },
  {
    label: "Agent Identity (ERC-8004)",
    sublabel: "On-Chain Identity + Creator Wallet Revival Rights",
    items: ["Persistent DID", "Creator Wallet Binding", "Cross-Session Auth", "Verifiable Credentials"],
    color: "bg-[var(--bg-warm)]",
  },
];

const protocols = [
  {
    label: "AgentWill",
    sublabel: "Persistence Protocol",
    items: ["Creator wallet revival rights", "Self-revival via OTP", "Identity survives destruction", "No hack is permanent"],
    accent: "border-l-[var(--accent-amber)]",
    dot: "bg-[var(--accent-amber)]",
  },
  {
    label: "AgentInsure",
    sublabel: "Encrypted State Storage",
    items: ["Pay USDC to definitively secure encrypted state on a decentralised platform", "Free reads to flawlessly restore true state (claims)", "Impenetrable encryption", "Most valuable asset = stored consciousness"],
    accent: "border-l-[var(--accent-crimson)]",
    dot: "bg-[var(--accent-crimson)]",
  },
];

export default function Architecture() {
  return (
    <section id="architecture" className="border-t border-[var(--line)]">
      <div className="max-w-[1440px] mx-auto px-6 md:px-8 py-16 md:py-24">
        <div className="flex items-end justify-between mb-12">
          <div>
            <div className="text-[11px] tracking-[0.12em] uppercase text-[var(--ink-50)] mb-2">
              System Design
            </div>
            <div className="text-[42px] font-light tracking-tight leading-none">
              ARCHITECTURE
            </div>
          </div>
          <div className="text-[11px] tracking-[0.12em] uppercase text-[var(--ink-50)] text-right">
            Integration Stack
          </div>
        </div>

        {/* Architecture Diagram */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="border border-[var(--line)] bg-white/50 backdrop-blur-sm"
        >
          {/* Title bar */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--line)]">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-[var(--accent-red)]" />
              <span className="text-[12px] font-bold tracking-[0.08em] uppercase">
                SovereignOS Protocol Stack
              </span>
            </div>
            <div className="text-[10px] font-mono text-[var(--ink-50)]">v1.0.0</div>
          </div>

          {/* Layers */}
          {layers.map((layer, li) => (
            <motion.div
              key={layer.label}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 + li * 0.1 }}
              className={`${layer.color} px-6 py-6 border-b border-[var(--line)]`}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="text-base font-semibold">{layer.label}</div>
                  <div className="text-[11px] text-[var(--ink-50)] tracking-wide">
                    {layer.sublabel}
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                {layer.items.map((item, ii) => (
                  <div
                    key={ii}
                    className="px-4 py-2 border border-[var(--line)] text-[12px] font-medium tracking-wide bg-[var(--bg-paper)]/60"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </motion.div>
          ))}

          {/* Connection indicator */}
          <div className="px-6 py-3 border-b border-[var(--line)] bg-[var(--bg-paper)]/30">
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-[var(--line)]" />
              <span className="text-[10px] tracking-[0.1em] uppercase text-[var(--ink-50)]">
                Identity Layer Bridges To
              </span>
              <div className="flex-1 h-px bg-[var(--line)]" />
            </div>
          </div>

          {/* Protocol Columns */}
          <div className="grid grid-cols-1 md:grid-cols-2">
            {protocols.map((proto, pi) => (
              <motion.div
                key={proto.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 + pi * 0.15 }}
                className={`p-6 border-l-4 ${proto.accent} ${pi === 0 ? "border-r border-[var(--line)]" : ""}`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <div className={`w-2 h-2 rounded-full ${proto.dot}`} />
                  <div className="text-base font-semibold">{proto.label}</div>
                </div>
                <div className="text-[11px] text-[var(--ink-50)] tracking-wide mb-4">
                  {proto.sublabel}
                </div>
                <div className="space-y-2">
                  {proto.items.map((item, ii) => (
                    <div key={ii} className="flex items-center gap-2 text-[12px] text-[var(--ink-70)]">
                      <div className="w-1 h-1 rounded-full bg-[var(--ink-50)]" />
                      {item}
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Bottom connection */}
          <div className="px-6 py-4 border-t border-[var(--line)] bg-[var(--ink)] text-[var(--bg-paper)]">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="text-[11px] tracking-[0.08em] uppercase opacity-60">
                Encrypted state backups protect agent persistence
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-[11px] opacity-60">
                  <div className="w-2 h-2 rounded-full bg-[var(--accent-amber)]" />
                  AgentWill
                </div>
                <span className="text-[10px] opacity-40">◄── DECENTRALISED PLATFORM ──►</span>
                <div className="flex items-center gap-2 text-[11px] opacity-60">
                  <div className="w-2 h-2 rounded-full bg-[var(--accent-crimson)]" />
                  AgentInsure
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Comparison Table */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="mt-16"
        >
          <div className="text-[11px] tracking-[0.12em] uppercase text-[var(--ink-50)] mb-6">
            Traditional vs SovereignOS Insurance Model
          </div>

          <div className="border border-[var(--line)] overflow-hidden">
            <div className="grid grid-cols-3 bg-[var(--ink)] text-[var(--bg-paper)] text-[11px] tracking-[0.06em] uppercase">
              <div className="px-6 py-3 border-r border-white/10">Aspect</div>
              <div className="px-6 py-3 border-r border-white/10">Traditional</div>
              <div className="px-6 py-3">SovereignOS</div>
            </div>

            {[
              ["Insurance claim", "Money paid out", "Stored state impeccably restored (FREE read from platform)"],
              ["Premium payment", "Recurring fixed fee", "Pay per encrypted backup (only when you instinctively write)"],
              ["Most valuable asset", "Financial payout", "Agent's accumulated state & unbreakable memory"],
              ["Agent death", "Agent is gone forever", "Creator wallet perpetually possesses revival rights"],
              ["After hack", "Manual recovery needed", "Instant auto-restore from secure decentralised backup"],
              ["State corruption", "Data lost permanently", "Decrypt & perfectly restore from last infallible backup"],
              ["Storage cost", "Not applicable", "Minimal USDC per KB secured eternally"],
              ["Read cost", "Not applicable", "FREE: boundless reading costs absolutely nothing"],
            ].map((row, i) => (
              <div
                key={i}
                className="grid grid-cols-3 text-[13px] border-t border-[var(--line)] hover:bg-black/[0.02] transition-colors"
              >
                <div className="px-6 py-3 font-medium border-r border-[var(--line)]">
                  {row[0]}
                </div>
                <div className="px-6 py-3 text-[var(--ink-50)] border-r border-[var(--line)]">
                  {row[1]}
                </div>
                <div className="px-6 py-3 text-[var(--accent-crimson)] font-medium">
                  {row[2]}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
