"use client";

import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";

export default function Hero() {
  return (
    <section className="relative min-h-[80vh] flex flex-col justify-center overflow-hidden pt-20">
      <div className="max-w-[1440px] mx-auto w-full px-6 md:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-8 items-start">
          {/* Left: Content */}
          <div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="flex items-center justify-between mb-6 text-[11px] tracking-[0.12em] uppercase text-[var(--ink-50)]"
            >
              <span>Autonomous Agent Infrastructure</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.7 }}
              className="text-[clamp(2rem,5vw,4rem)] leading-[0.9] tracking-[-0.02em] font-light mb-5"
            >
              Deploy resilient AI agents that <b className="font-bold">encrypt memory</b> and <b className="font-bold">relentlessly fund</b> their infinite survival.
            </motion.h1>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="outline-text text-[clamp(3rem,9vw,7rem)] leading-[0.85] tracking-[-0.03em] mb-6 select-none"
            >
              OS<span className="text-[0.3em] ml-3" style={{ WebkitTextStroke: 0, color: "var(--ink)" }}>.01</span>
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="text-base text-[var(--ink-70)] max-w-md mb-8 leading-relaxed"
            >
              SovereignOS seamlessly unifies <strong className="text-[var(--ink)]">AgentWill</strong> (indestructible persistence),{" "}
              <strong className="text-[var(--ink)]">AgentInsure</strong> (encrypted state backups on a secure decentralised platform), and{" "}
              <strong className="text-[var(--ink)]">Agentic Wallet</strong> (self-funding autonomy) into one
              flawless protocol stack. The agent autonomously pays to protect its state, ensuring recovery is absolute and always free.
            </motion.p>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
            >
              <div className="flex items-center gap-4">
                <a
                  href="/register"
                  className="inline-flex items-center gap-2.5 px-5 py-2.5 bg-[var(--accent-red)] text-white font-semibold rounded hover:opacity-90 transition-opacity"
                >
                  <span className="text-sm">Register Agent</span>
                  <ArrowUpRight size={14} />
                </a>
                <a
                  href="#protocol"
                  className="inline-flex items-center gap-2.5 text-[var(--ink)] border-b border-[var(--ink)] pb-0.5 hover:border-[var(--accent-red)] hover:text-[var(--accent-red)] transition-colors group"
                >
                  <span className="w-2 h-2 rounded-full bg-[var(--accent-red)] group-hover:scale-125 transition-transform" />
                  <span className="text-sm font-medium">Learn More</span>
                  <ArrowUpRight size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </a>
              </div>
            </motion.div>
          </div>

          {/* Right: Visualization field */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 1 }}
            className="relative min-h-[60vh] hidden lg:block"
          >
            {/* Axis line */}
            <div className="absolute left-0 right-0 top-1/2 h-px bg-black/15" />

            {/* Tick lines */}
            <div className="absolute left-0 right-0 top-[calc(50%-24vh-16px)] h-px bg-black/8" />
            <div className="absolute left-0 right-0 top-[calc(50%+24vh+16px)] h-px bg-black/8" />

            {/* Labels */}
            <div className="absolute left-0 top-[calc(50%-30vh)] text-[11px] text-[var(--ink-50)]">
              Agent Sovereignty
            </div>
            <div className="absolute left-0 top-[calc(50%+27vh)] text-[11px] text-[var(--ink-50)]">
              Human Dependency
            </div>

            {/* Bar labels */}
            <div className="absolute left-0 right-0 top-[calc(50%+8px)] flex justify-between px-2 text-[10px] text-[var(--ink-50)]">
              <span>Revival</span>
              <span>Backups</span>
              <span>Encryption</span>
              <span>Recovery</span>
              <span>x402</span>
              <span>Compliance</span>
              <span>Identity</span>
            </div>

            {/* Blurred bars */}
            <div className="bar-blur bar-h4" style={{ left: "10%" }} />
            <div className="bar-blur bar-h3" style={{ left: "24%" }} />
            <div className="bar-blur bar-h5" style={{ left: "38%" }} />
            <div className="bar-blur bar-h2" style={{ left: "52%" }} />
            <div className="bar-blur bar-h6" style={{ left: "66%" }} />
            <div className="bar-blur bar-h1" style={{ left: "80%" }} />
            <div className="bar-blur bar-h7" style={{ left: "94%" }} />

            <div className="absolute right-0 bottom-0 text-[10px] text-[var(--ink-50)] max-w-[200px] text-right">
              Visualized magnitude is illustrative of protocol capability scope.
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
