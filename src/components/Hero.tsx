"use client";

import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { useEffect, useRef } from "react";

function HalftoneCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let t = 0;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };
    resize();
    window.addEventListener("resize", resize);

    const draw = () => {
      const w = canvas.getBoundingClientRect().width;
      const h = canvas.getBoundingClientRect().height;

      // Clear with transparent — parent bg shows through
      ctx.clearRect(0, 0, w, h);

      const spacing = 18;
      const maxRadius = spacing * 0.46;
      const minRadius = spacing * 0.03;
      const cols = Math.ceil(w / spacing) + 1;
      const rows = Math.ceil(h / spacing) + 1;

      for (let row = 1; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const x = col * spacing + spacing * 0.5;
          const y = row * spacing + spacing * 0.5;

          // Multiple overlapping sine waves → halftone density map
          const wave1 = Math.sin(x * 0.04 + t * 0.7) * Math.cos(y * 0.035 - t * 0.5);
          const wave2 = Math.sin((x + y) * 0.025 - t * 0.9) * 0.6;
          const wave3 = Math.cos(x * 0.02 - y * 0.03 + t * 0.4) * 0.4;

          // Combine waves → 0..1 range
          const raw = (wave1 + wave2 + wave3) / 2;
          const density = raw * 0.5 + 0.5; // normalise to 0..1

          const radius = minRadius + density * (maxRadius - minRadius);

          // Opacity also driven by density for softer small dots
          const alpha = 0.25 + density * 0.75;

          ctx.beginPath();
          ctx.arc(x, y, Math.max(radius, 0.5), 0, Math.PI * 2);
          ctx.fillStyle = `rgba(176, 57, 47, ${alpha.toFixed(2)})`;
          ctx.fill();
        }
      }

      t += 0.012;
      animId = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
    />
  );
}

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
              transition={{ delay: 0.4, duration: 0.6 }}
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
              Sovereign OS seamlessly unifies <strong className="text-[var(--ink)]">AgentWill</strong> (indestructible persistence),{" "}
              <strong className="text-[var(--ink)]">AgentInsure</strong> (encrypted state backups on secure decentralised storage), and{" "}
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

          {/* Right: Animated halftone dot-matrix visualization */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 1 }}
            className="relative min-h-[60vh] hidden lg:block"
          >
            <div className="absolute inset-0" style={{ top: "5%", bottom: "-30%" }}>
              <HalftoneCanvas />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
