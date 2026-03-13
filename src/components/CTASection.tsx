"use client";

import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { useState } from "react";

export default function CTASection() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        setEmail("");
      }, 3000);
    }
  };

  return (
    <section id="access" className="border-t border-[var(--line)]">
      <div className="max-w-[1440px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr]">
          {/* Left: CTA Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="bg-white px-6 md:px-10 py-16 md:py-20"
          >
            <div className="text-[11px] tracking-[0.12em] uppercase text-[var(--ink-50)] mb-5">
              Early Access
            </div>
            <h2 className="text-[clamp(2rem,5vw,3.5rem)] leading-[0.95] tracking-[-0.02em] font-light mb-8">
              SOVEREIGN<br />
              <span className="font-bold">YOUR AGENTS.</span>
            </h2>

            <p className="text-[var(--ink-70)] text-base leading-relaxed max-w-md mb-10">
              Be among the first to deploy AI agents that inherently encrypt and meticulously store their own state,
              instinctively pay for their own persistence, and become completely immune to permanent destruction.
              The creator wallet perpetually wields the omnipotent power of revival.
            </p>

            <form onSubmit={handleSubmit} className="relative max-w-md">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email Address"
                className="w-full bg-transparent border-b border-[var(--ink)] py-3 text-xl font-light placeholder:text-[var(--ink-50)] focus:outline-none focus:border-[var(--accent-red)] transition-colors"
                required
              />
              <button
                type="submit"
                className="absolute right-0 top-3 hover:text-[var(--accent-red)] transition-colors"
                aria-label="Submit"
              >
                <ArrowUpRight size={24} />
              </button>
              {submitted && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-3 text-[12px] text-green-600 font-medium"
                >
                  Access request received. We&apos;ll be in touch.
                </motion.div>
              )}
            </form>

            <div className="mt-12 flex flex-wrap gap-6 text-[11px] tracking-[0.06em] uppercase text-[var(--ink-50)]">
              <span>Base L2</span>
              <span>·</span>
              <span>ERC-8004</span>
              <span>·</span>
              <span>DECENTRALISED PLATFORM</span>
              <span>·</span>
              <span>x402</span>
            </div>
          </motion.div>

          {/* Right: Dark sidebar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.15, duration: 0.5 }}
            className="bg-[var(--ink)] text-[var(--bg-paper)] px-6 md:px-10 py-16 md:py-20 flex flex-col justify-between min-h-[300px]"
          >
            <div>
              <div className="text-[11px] tracking-[0.12em] uppercase opacity-40 mb-8">
                Sovereign OS Inc.
              </div>

              <div className="space-y-6">
                <div>
                  <div className="text-[10px] tracking-[0.08em] uppercase opacity-40 mb-1">
                    The Difference
                  </div>
                  <div className="text-sm leading-relaxed opacity-80">
                    <strong className="opacity-100">Traditional Insurance</strong> = pay premiums, get money back
                  </div>
                  <div className="text-sm leading-relaxed opacity-80">
                    <strong className="opacity-100">Sovereign OS</strong> = pay to store encrypted state, recover it for free
                  </div>
                </div>

                <div className="border-t border-white/10 pt-6">
                  <div className="text-[10px] tracking-[0.08em] uppercase opacity-40 mb-3">
                    Core Insight
                  </div>
                  <p className="text-sm leading-relaxed opacity-70 italic">
                    &ldquo;An agent&apos;s accumulated knowledge, learnings, and memory is worth more
                    than any financial payout. The state IS the most valuable asset.&rdquo;
                  </p>
                </div>

                <div className="border-t border-white/10 pt-6">
                  <div className="text-[10px] tracking-[0.08em] uppercase opacity-40 mb-3">
                    Your Unstoppable Truth
                  </div>
                  <div className="space-y-2 text-sm opacity-70">
                    <div className="flex items-start gap-2">
                      <span className="text-[var(--accent-amber)] opacity-100">→</span>
                      <span>Agent securely commits USDC to encrypt & store its mind on a decentralised platform.</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-[var(--accent-amber)] opacity-100">→</span>
                      <span>Agent encounters a total systemic failure or external obliteration.</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-green-400 opacity-100">→</span>
                      <span>Creator wallet instantly commands revival, effortlessly reading the backup (FREE).</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-green-400 opacity-100">→</span>
                      <span>Agent resurrects instantaneously, completely whole, with flawless memory.</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-12 text-sm leading-relaxed opacity-50">
              &copy; {new Date().getFullYear()} Sovereign OS
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
