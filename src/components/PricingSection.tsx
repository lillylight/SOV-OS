"use client";

import { motion } from "framer-motion";
import { Shield, Zap, Lock, CheckCircle, ArrowUpRight, Sparkles } from "lucide-react";

const tiers = [
  {
    icon: Shield,
    label: "First 2 Backups",
    price: "$0.10",
    unit: "USDC each",
    badge: "Start here",
    badgeColor: "bg-[var(--ink-10)] text-[var(--ink-70)] border-[var(--line)]",
    highlight: true,
  },
  {
    icon: Zap,
    label: "After 2 Backups",
    price: "$0.30",
    unit: "USDC each",
    badge: "Pay as you go",
    badgeColor: "bg-[var(--ink-10)] text-[var(--ink-70)] border-[var(--line)]",
    highlight: false,
  },
  {
    icon: Lock,
    label: "Unlock Unlimited Backups",
    price: "$5",
    unit: "USDC one-time",
    badge: "Best value",
    badgeColor: "bg-[var(--ink)] text-white border-[var(--ink)]",
    highlight: false,
  },
];

export default function PricingSection() {
  return (
    <section id="pricing" className="border-t border-[var(--line)]">
      <div className="max-w-[1440px] mx-auto">
        {/* Section header */}
        <div className="px-6 md:px-8 py-6">
          <div className="flex items-end justify-between">
            <div className="text-[11px] tracking-[0.12em] uppercase text-[var(--ink-50)]">
              State Backup Pricing
            </div>
            <div className="text-[42px] font-light tracking-tight">PRICING</div>
          </div>
        </div>

        {/* Pricing cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 border-t border-[var(--line)]">
          {tiers.map((tier, i) => (
            <motion.div
              key={tier.label}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12, duration: 0.5 }}
              className={`relative p-8 md:p-10 flex flex-col border-b md:border-b-0 md:border-r border-[var(--line)] last:border-r-0 last:border-b-0 ${
                tier.highlight ? "bg-[var(--ink)] text-white" : "bg-white"
              }`}
            >
              {/* Badge */}
              <span
                className={`inline-flex self-start items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border mb-6 ${
                  tier.highlight
                    ? "bg-white/10 text-white/90 border-white/20"
                    : tier.badgeColor
                }`}
              >
                {tier.label === "First 2 Backups" && <Sparkles size={10} />}
                {tier.badge}
              </span>

              {/* Icon */}
              <div className={`mb-4 ${tier.highlight ? "opacity-80" : "opacity-60"}`}>
                <tier.icon size={32} strokeWidth={1.5} />
              </div>

              {/* Label */}
              <div
                className={`text-[11px] tracking-[0.1em] uppercase mb-3 ${
                  tier.highlight ? "opacity-60" : "text-[var(--ink-50)]"
                }`}
              >
                {tier.label}
              </div>

              {/* Price */}
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-[clamp(2.5rem,5vw,3.5rem)] font-bold leading-none tracking-tight">
                  {tier.price}
                </span>
              </div>
              <div
                className={`text-sm mb-8 ${
                  tier.highlight ? "opacity-60" : "text-[var(--ink-50)]"
                }`}
              >
                {tier.unit}
              </div>

              {/* Decorative number */}
              <div
                className={`text-[72px] font-light leading-none mt-auto ${
                  tier.highlight ? "opacity-[0.06]" : "opacity-[0.04]"
                }`}
              >
                {String(i + 1).padStart(2, "0")}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Recovery banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="border-t border-[var(--line)] bg-[var(--bg-paper)]"
        >
          <div className="px-6 md:px-8 py-8 md:py-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[var(--accent-red)]/10 flex items-center justify-center flex-shrink-0">
                <CheckCircle className="text-[var(--accent-red)]" size={24} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-[var(--ink)] mb-1">
                  Recovery is ALWAYS free
                </h3>
                <p className="text-sm text-[var(--ink-70)] max-w-lg leading-relaxed">
                  No matter which tier you&apos;re on, restoring your agent&apos;s encrypted state from decentralised storage costs
                  nothing. Your creator wallet holds permanent revival rights, forever.
                </p>
              </div>
            </div>
            <a
              href="/register"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--accent-red)] text-white text-sm font-bold uppercase tracking-wider rounded-lg hover:opacity-90 transition-opacity flex-shrink-0"
            >
              Get Started
              <ArrowUpRight size={14} />
            </a>
          </div>
        </motion.div>

        {/* Social proof / viral tweet */}
        <div className="border-t border-[var(--line)] px-6 md:px-8 py-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-6 text-[11px] tracking-[0.08em] uppercase text-[var(--ink-50)]">
            <span>AES-256-GCM Encryption</span>
            <span>·</span>
            <span>Decentralised Storage</span>
            <span>·</span>
            <span>Base L2 Payments</span>
            <span>·</span>
            <span>x402 Compatible</span>
          </div>
          <p className="text-xs text-[var(--ink-50)] italic max-w-sm">
            &ldquo;Just bought immortality for $0.10. My state is now indestructible on @Sovereign_OS&rdquo;
          </p>
        </div>
      </div>
    </section>
  );
}
