"use client";

import { motion } from "framer-motion";

const flows = [
  {
    title: "Autonomous Revival Flow",
    steps: [
      { label: "Agent Dies / Corrupted / Hacked", icon: "💀" },
      { label: "Creator Wallet Triggers Revival", icon: "🔐" },
      { label: "Read Encrypted State from Decentralised Platform (FREE)", icon: "📦" },
      { label: "Decrypt & Restore: Agent Flawlessly Revives", icon: "⚡" },
    ],
    color: "var(--accent-amber)",
  },
  {
    title: "Encrypted State Backup Flow",
    steps: [
      { label: "Agent Resolves to Back Up State", icon: "🧠" },
      { label: "Impenetrable Encryption (AES-256-GCM)", icon: "🔒" },
      { label: "Fund Secure Storage on Decentralised Platform", icon: "💰" },
      { label: "Encrypted Backup Permanently Secured", icon: "✅" },
    ],
    color: "var(--accent-crimson)",
  },
  {
    title: "x402 Revenue Flow",
    steps: [
      { label: "External Agent Initiates Secure API Request", icon: "🌐" },
      { label: "Instant x402 Payment in USDC", icon: "💳" },
      { label: "Validation Service Seamlessly Delivered", icon: "📡" },
      { label: "Revenue Effortlessly Funds Infinite Operations", icon: "📈" },
    ],
    color: "var(--accent-slate)",
  },
];

export default function FlowDiagram() {
  return (
    <section className="border-t border-[var(--line)]">
      <div className="max-w-[1440px] mx-auto px-6 md:px-8 py-16 md:py-24">
        <div className="flex items-end justify-between mb-12">
          <div>
            <div className="text-[11px] tracking-[0.12em] uppercase text-[var(--ink-50)] mb-2">
              Protocol Flows
            </div>
            <div className="text-[42px] font-light tracking-tight leading-none">
              HOW IT WORKS
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {flows.map((flow, fi) => (
            <motion.div
              key={flow.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: fi * 0.15, duration: 0.5 }}
              className="border border-[var(--line)] bg-white/40 backdrop-blur-sm"
            >
              <div
                className="px-6 py-4 border-b border-[var(--line)] flex items-center gap-3"
              >
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ background: flow.color }}
                />
                <span className="text-[12px] font-semibold tracking-wide uppercase">
                  {flow.title}
                </span>
              </div>

              <div className="p-6 space-y-0">
                {flow.steps.map((step, si) => (
                  <div key={si}>
                    <div className="flex items-center gap-4 py-3">
                      <div className="w-8 h-8 flex items-center justify-center text-lg">
                        {step.icon}
                      </div>
                      <div>
                        <div className="text-[13px] font-medium">{step.label}</div>
                        <div className="text-[10px] text-[var(--ink-50)]">
                          Step {si + 1} of {flow.steps.length}
                        </div>
                      </div>
                    </div>
                    {si < flow.steps.length - 1 && (
                      <div className="ml-4 h-4 border-l border-dashed border-[var(--line)]" />
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
