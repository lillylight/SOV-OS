"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Menu, X, ArrowUpRight, Fingerprint } from "lucide-react";

const navItems = [
  { label: "Protocol", href: "#protocol" },
  { label: "System Logs", href: "#logs" },
  { label: "Register Agent", href: "/register" },
];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleHumanConnect = async () => {
    setIsConnecting(true);
    
    try {
      if (!window.ethereum) {
        alert("Please install MetaMask or another Web3 wallet");
        return;
      }

      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });

      const address = accounts[0];
      
      // Store human auth state
      localStorage.setItem("sovereign_human_auth", JSON.stringify({
        address,
        type: "human",
        timestamp: Date.now(),
      }));
      
      // Redirect to dashboard or stay on page
      alert("Connected as human operator");
      
    } catch (error) {
      console.error("Human connect error:", error);
      alert("Connection error");
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "glass-card shadow-sm"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-[1440px] mx-auto flex items-center justify-between px-6 md:px-8 py-4">
        <a href="#" className="flex items-center gap-3">
          <Fingerprint className="text-[var(--accent-red)]" size={14} strokeWidth={2.5} />
          <span className="text-sm font-bold tracking-[0.08em] uppercase">
            Sovereign OS
          </span>
        </a>

        <div className="hidden md:flex items-center gap-8">
          {navItems.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="text-[var(--ink-70)] hover:text-[var(--ink)] transition-colors text-sm font-medium"
            >
              {item.label}
            </a>
          ))}
          <button
            onClick={handleHumanConnect}
            disabled={isConnecting}
            className="px-4 py-2 border border-[var(--line)] text-[var(--ink)] font-semibold text-sm rounded hover:bg-black/5 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <Fingerprint size={16} />
            {isConnecting ? "Connecting..." : "Human Connect"}
          </button>
        </div>

        <div className="hidden md:flex items-center gap-4">
          <a
            href="/demo"
            className="inline-flex items-center gap-2 text-[11px] font-semibold tracking-[0.06em] uppercase border-b border-[var(--ink)] pb-0.5 hover:border-[var(--accent-red)] hover:text-[var(--accent-red)] transition-colors"
          >
            Launch App
            <ArrowUpRight size={12} />
          </a>
        </div>

        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden"
          aria-label="Toggle menu"
        >
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {menuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:hidden glass-card border-t border-[var(--line)] px-6 py-6 space-y-4"
        >
          {navItems.map((item) => (
            <a
              key={item.label}
              href={item.href}
              onClick={() => setMenuOpen(false)}
              className="block text-sm font-semibold tracking-wide uppercase text-[var(--ink-70)] hover:text-[var(--ink)]"
            >
              {item.label}
            </a>
          ))}
          <a
            href="/demo"
            onClick={() => setMenuOpen(false)}
            className="inline-flex items-center gap-2 text-sm font-semibold tracking-wide uppercase mt-4 border-b border-[var(--ink)] pb-0.5"
          >
            Launch App
            <ArrowUpRight size={14} />
          </a>
        </motion.div>
      )}
    </motion.header>
  );
}
