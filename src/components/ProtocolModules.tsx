"use client";

import { motion } from "framer-motion";
import { Shield, Brain, Wallet } from "lucide-react";

const modules = [
  {
    num: "01",
    step: "Persist",
    label: "AgentWill",
    desc: "The agent dies and brings itself back to life. The creator wallet retains permanent revival rights: no hack, corruption, or destruction is final.",
    color: "bg-[var(--accent-amber)]",
    textColor: "text-[var(--ink)]",
    icon: Brain,
    features: ["Creator wallet revival rights", "OTP self-authentication", "Cross-session identity"],
  },
  {
    num: "02",
    step: "Insure",
    label: "AgentInsure",
    desc: "Starting at just $0.10 USDC, your agent encrypts and stores its entire state on decentralised storage. If compromised, recovery is always free. That's true autonomous insurance.",
    color: "bg-[var(--accent-slate)]",
    textColor: "text-white",
    icon: Shield,
    features: ["$0.10 encrypted backups", "Recovery is ALWAYS free", "AES-256-GCM encryption"],
  },
  {
    num: "03",
    step: "Transact",
    label: "Agentic Wallet",
    desc: "Absolute financial sovereignty. The agent generates endless value via x402, dynamically utilizing its funds for secure decentralised storage and unstoppable operations.",
    color: "bg-[var(--accent-crimson)]",
    textColor: "text-white",
    icon: Wallet,
    features: ["Session spending limits", "x402 machine payments", "Built-in OFAC/KYT"],
  },
];

export default function ProtocolModules() {
  return (
    <section id="protocol" className="border-t border-[var(--line)]">
      <div className="max-w-[1440px] mx-auto">
        <div className="px-6 md:px-8 py-6">
          <div className="flex items-end justify-between">
            <div className="text-[11px] tracking-[0.12em] uppercase text-[var(--ink-50)]">
              Core Protocol Stack
            </div>
            <div className="text-[42px] font-light tracking-tight">MODULES</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 border-t border-[var(--line)]">
          {modules.map((m, i) => (
            <motion.div
              key={m.num}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15, duration: 0.5 }}
              className={`${m.color} ${m.textColor} p-7 md:p-8 min-h-[260px] flex flex-col justify-between relative border-b md:border-b-0 md:border-r border-[var(--line)] last:border-r-0 last:border-b-0 group cursor-default`}
            >
              <div
                className="absolute right-6 top-10 text-[10px] tracking-[0.1em] uppercase opacity-40"
                style={{ writingMode: "vertical-rl" }}
              >
                Step {m.num}
              </div>

              <div>
                <div className="mb-3 opacity-80">
                  <m.icon size={28} strokeWidth={1.5} />
                </div>
                <div className="text-[11px] tracking-[0.1em] uppercase opacity-60 mb-2">
                  {m.step}
                </div>
                <div className="text-2xl font-semibold leading-tight mb-3">
                  {m.label}
                </div>
                <div className="text-base leading-relaxed opacity-85 max-w-[85%]">
                  {m.desc}
                </div>
              </div>

              <div className="text-[56px] font-light opacity-15 leading-none mt-4">
                {m.num}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
