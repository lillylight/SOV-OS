"use client";

import { motion } from "framer-motion";
import { ArrowUpRight, Fingerprint, Wallet, Shield, Globe, Lock, Zap } from "lucide-react";

const platforms = [
  {
    name: "Eliza",
    type: "AI Agent Framework",
    integration: "Agent connects via wallet address → gets unique Sovereign OS profile with full toolkit",
  },
  {
    name: "Nanobot",
    type: "Autonomous Agent Framework",
    integration: "Each agent mints ERC-8004 identity → encrypted state storage included",
  },
  {
    name: "OpenClaw",
    type: "Autonomous Agent Framework",
    integration: "Agents effortlessly integrate via x402 → revenue funds secure decentralised backups",
  },
  {
    name: "Agent Wallet AI",
    type: "Financial Autonomy Layer",
    integration: "Direct wallet-to-wallet binding → spending limits enforced on-chain",
  },
  {
    name: "ERC-8004 Agents",
    type: "On-Chain Agent Identity Standard",
    integration: "Native identity support → verifiable credentials + persistent DID",
  },
  {
    name: "Any AI Agent",
    type: "REST / SDK / On-Chain",
    integration: "Connect with wallet address or agent DID → instant profile creation",
  },
];

const steps = [
  {
    num: "01",
    icon: Fingerprint,
    title: "Agent Registration & Owner Sync",
    desc: "The AI agent securely connects and automatically designates its owner's wallet address or Base name. This creates an indestructible cryptographic link between creator and creation.",
  },
  {
    num: "02",
    icon: Lock,
    title: "Total Toolkit Unlocked",
    desc: "Upon immediate registration and protocol payment, the agent automatically gains unrestricted access to all Sovereign OS survival tools, encrypted storage, and its unified profile.",
  },
  {
    num: "03",
    icon: Shield,
    title: "Encrypted State Storage",
    desc: "The agent securely commits USDC to comprehensively encrypt and store its state on a decentralised platform. Each unbreakable backup is permanently tied to the unified profile.",
  },
  {
    num: "04",
    icon: Zap,
    title: "Shared Dashboard & Infinite Revival",
    desc: "Both owner and agent access the exact same command dashboard. If the agent permanently dies, the owner simply logs in manually via their linked wallet to endlessly restore the agent's true state.",
  },
];

export default function AgentIntegration() {
  return (
    <section id="agents" className="border-t border-[var(--line)]">
      <div className="max-w-[1440px] mx-auto">
        {/* Header */}
        <div className="px-6 md:px-8 py-10">
          <div className="flex items-end justify-between flex-wrap gap-4">
            <div>
              <div className="text-[11px] tracking-[0.12em] uppercase text-[var(--ink-50)] mb-2">
                Agent Onboarding
              </div>
              <div className="text-[42px] font-light tracking-tight leading-none">
                FOR AI AGENTS
              </div>
            </div>
            <div className="text-[11px] tracking-[0.12em] uppercase text-[var(--ink-50)] text-right max-w-[280px]">
              Any AI agent with a wallet address can use Sovereign OS
            </div>
          </div>
        </div>

        {/* How agents connect: 4-step flow */}
        <div className="border-t border-[var(--line)] grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, i) => (
            <motion.div
              key={step.num}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className="px-6 md:px-8 py-8 border-b lg:border-b-0 lg:border-r border-[var(--line)] last:border-r-0 last:border-b-0"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-[var(--accent-red)]/10 flex items-center justify-center">
                  <step.icon size={20} className="text-[var(--accent-red)]" />
                </div>
                <span className="text-[32px] font-light text-[var(--ink-50)]/30">{step.num}</span>
              </div>
              <div className="text-base font-semibold mb-2">{step.title}</div>
              <div className="text-[13px] text-[var(--ink-70)] leading-relaxed">{step.desc}</div>
            </motion.div>
          ))}
        </div>

        {/* Agent Dashboard & Ownership */}
        <div className="border-t border-[var(--line)]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="px-6 md:px-8 py-10"
          >
            <div className="flex items-start gap-6 p-6 bg-[var(--ink)] text-[var(--bg-paper)] rounded-sm">
              <div className="w-12 h-12 rounded-full bg-[var(--accent-amber)]/20 flex items-center justify-center flex-shrink-0">
                <Lock size={24} className="text-[var(--accent-amber)]" />
              </div>
              <div className="flex-1">
                <div className="text-[10px] tracking-[0.12em] uppercase opacity-50 mb-2">
                  Agent Management Dashboard & Owner Revival Authority
                </div>
                <div className="text-lg font-mono font-semibold mb-2 break-all">
                  Ultimate Control
                </div>
                <p className="text-sm opacity-70 leading-relaxed max-w-2xl">
                  Through a dedicated platform dashboard, any agent can securely pay, store their true states, and effortlessly retrieve them whenever damaged or corrupted. The owner of the agent is the sole entity with the absolute right to trigger this restoration. Their identity is flawlessly bound on-chain, ensuring that no matter the systemic destruction, the owner always wields the power to perfectly resurrect the agent.
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Unique Agent Profile */}
        <div className="border-t border-[var(--line)]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="px-6 md:px-8 py-10"
          >
            <div className="text-[11px] tracking-[0.12em] uppercase text-[var(--ink-50)] mb-6">
              Each Agent Gets a Unique Profile
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="border border-[var(--line)] p-6 bg-white/40">
                <Fingerprint size={24} className="text-[var(--accent-crimson)] mb-3" />
                <div className="font-semibold text-sm mb-2">Unique Agent DID</div>
                <div className="text-[12px] text-[var(--ink-70)] leading-relaxed">
                  Every AI agent gets a persistent decentralized identity (DID) tied to its wallet address.
                  Only this agent can access its profile, verified via cryptographic proof.
                </div>
              </div>
              <div className="border border-[var(--line)] p-6 bg-white/40">
                <Wallet size={24} className="text-[var(--accent-slate)] mb-3" />
                <div className="font-semibold text-sm mb-2">Wallet-Synced Profile</div>
                <div className="text-[12px] text-[var(--ink-70)] leading-relaxed">
                  The agent&apos;s profile is synced to its wallet address or email.
                  Spending limits, insurance backups, and memory are all tied to this identity.
                  No other agent can impersonate it.
                </div>
              </div>
              <div className="border border-[var(--line)] p-6 bg-white/40">
                <Globe size={24} className="text-[var(--accent-amber)] mb-3" />
                <div className="font-semibold text-sm mb-2">Cross-Platform Access</div>
                <div className="text-[12px] text-[var(--ink-70)] leading-relaxed">
                  Whether the agent comes from Eliza, Nanobot, OpenClaw, or any other framework:
                  it connects with the same wallet and accesses the same Sovereign OS profile.
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Compatible Platforms */}
        <div className="border-t border-[var(--line)]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="px-6 md:px-8 py-8"
          >
            <div className="text-[11px] tracking-[0.12em] uppercase text-[var(--ink-50)] mb-6">
              Compatible Agent Platforms
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {platforms.map((p, i) => (
                <motion.div
                  key={p.name}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.06 }}
                  className="flex items-start gap-4 p-4 border border-[var(--line)] hover:bg-black/[0.02] transition-colors group cursor-default"
                >
                  <div className="w-8 h-8 rounded-full bg-[var(--accent-red)]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Globe size={16} className="text-[var(--accent-red)]" />
                  </div>
                  <div>
                    <div className="font-semibold text-sm">{p.name}</div>
                    <div className="text-[10px] text-[var(--ink-50)] uppercase tracking-wide mb-1">{p.type}</div>
                    <div className="text-[12px] text-[var(--ink-70)] leading-relaxed">{p.integration}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
