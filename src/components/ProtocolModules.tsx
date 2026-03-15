"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Shield, Brain, Wallet, FileText } from "lucide-react";

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
  {
    num: "04",
    step: "Comply",
    label: "AgentLedger",
    desc: "Autonomous tax compliance. Every transaction is auto-categorised as income, expense, or capital. Generate tax-ready reports, export to your accountant, and never miss a filing deadline.",
    color: "bg-[var(--ink)]",
    textColor: "text-white",
    icon: FileText,
    features: ["Auto-categorised ledger", "CSV & PDF export", "Multi-jurisdiction Pro"],
  },
];

export default function ProtocolModules() {
  const sectionRef = useRef<HTMLElement>(null);
  const [shifted, setShifted] = useState(false);
  const lockedRef = useRef(false);

  const handleWheel = useCallback((e: WheelEvent) => {
    if (!sectionRef.current || lockedRef.current) return;

    const rect = sectionRef.current.getBoundingClientRect();
    const inView = rect.top <= 100 && rect.bottom > window.innerHeight * 0.4;
    if (!inView) return;

    // Scrolling DOWN while showing 01/02/03 → shift to 02/03/04
    if (e.deltaY > 0 && !shifted) {
      e.preventDefault();
      lockedRef.current = true;
      setShifted(true);
      setTimeout(() => { lockedRef.current = false; }, 800);
      return;
    }

    // Scrolling UP while showing 02/03/04 → shift back to 01/02/03
    if (e.deltaY < 0 && shifted) {
      e.preventDefault();
      lockedRef.current = true;
      setShifted(false);
      setTimeout(() => { lockedRef.current = false; }, 800);
      return;
    }
  }, [shifted]);

  useEffect(() => {
    window.addEventListener("wheel", handleWheel, { passive: false });
    return () => window.removeEventListener("wheel", handleWheel);
  }, [handleWheel]);

  return (
    <section id="protocol" ref={sectionRef} className="border-t border-[var(--line)]">
      <div className="max-w-[1440px] mx-auto">
        <div className="px-6 md:px-8 py-6">
          <div className="flex items-end justify-between">
            <div className="text-[11px] tracking-[0.12em] uppercase text-[var(--ink-50)]">
              Core Protocol Stack
            </div>
            <div className="text-[42px] font-light tracking-tight">MODULES</div>
          </div>
        </div>

        {/* Carousel viewport — shows 3 cards at a time, 4 total in the track */}
        <div className="border-t border-[var(--line)] overflow-hidden">
          <div
            className="flex"
            style={{
              width: "calc(400% / 3)",
              transform: shifted ? "translateX(-25%)" : "translateX(0)",
              transition: "transform 0.7s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          >
            {modules.map((m, i) => (
              <motion.div
                key={m.num}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, duration: 0.5 }}
                className={`${m.color} ${m.textColor} p-7 md:p-8 min-h-[260px] flex flex-col justify-between relative border-r border-[var(--line)] last:border-r-0 group cursor-default`}
                style={{ flex: "0 0 25%", width: "25%" }}
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

        {/* Carousel indicators */}
        <div className="flex justify-center gap-2 py-4">
          <button
            onClick={() => setShifted(false)}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${!shifted ? "bg-[var(--ink)] scale-125" : "bg-[var(--ink)]/20 hover:bg-[var(--ink)]/40"}`}
            aria-label="Show modules 1-3"
          />
          <button
            onClick={() => setShifted(true)}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${shifted ? "bg-[var(--ink)] scale-125" : "bg-[var(--ink)]/20 hover:bg-[var(--ink)]/40"}`}
            aria-label="Show modules 2-4"
          />
        </div>
      </div>
    </section>
  );
}
