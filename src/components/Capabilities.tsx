"use client";

import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";

const capabilities = [
  {
    id: "01",
    title: "Hack Recovery",
    category: "AgentInsure",
    desc: "If an attack occurs, the creator instantly triggers impeccable restoration from the most recent encrypted decentralised backup. Infinite resilience, zero data loss.",
  },
  {
    id: "02",
    title: "Compliant Autonomous Operations",
    category: "Compliance",
    desc: "Built-in KYT screening, OFAC sanctions screening, and automatic blocking of high-risk interactions before every transaction.",
  },
  {
    id: "03",
    title: "State = Most Valuable Asset",
    category: "AgentInsure",
    desc: "The agent's accumulated knowledge, learnings, and memory is more valuable than any financial payout. Insurance protects the state itself.",
  },
  {
    id: "04",
    title: "Session-Based Spending Limits",
    category: "Agentic Wallet",
    desc: "Fresh session budget on every revival. Per-session and per-tx limits enforced programmatically to prevent overspending.",
  },
  {
    id: "05",
    title: "Autonomous Backup Scheduling",
    category: "AgentInsure",
    desc: "The agent intelligently decides when to back up its true state, perfectly balancing frequency with the costs of secure decentralised storage.",
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
          <div className="grid grid-cols-[60px_1fr_120px_1fr_40px] md:grid-cols-[60px_1.5fr_120px_2fr_40px] px-6 md:px-8 py-3 text-[10px] tracking-[0.05em] uppercase text-[var(--ink-50)]">
            <div>ID</div>
            <div>Capability</div>
            <div className="hidden sm:block">Module</div>
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
              className="grid grid-cols-[60px_1fr_120px_1fr_40px] md:grid-cols-[60px_1.5fr_120px_2fr_40px] px-6 md:px-8 py-4 border-t border-[var(--line)] items-center text-[13px] hover:bg-black/[0.02] transition-colors cursor-default group"
            >
              <div className="font-mono text-[11px] text-[var(--ink-50)]">
                #{cap.id}
              </div>
              <div className="font-semibold pr-4">{cap.title}</div>
              <div className="hidden sm:block text-[11px] text-[var(--ink-50)]">
                {cap.category}
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
