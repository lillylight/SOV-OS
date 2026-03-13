"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useAgentStore, CHAIN_CONFIG } from "@/lib/agentStore";
import { ExternalLink } from "lucide-react";

export default function SystemLogs() {
  const { systemLogs, autonomyRunning, state: agentState, uptime } = useAgentStore();
  const [liveTime, setLiveTime] = useState("");

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setLiveTime(
        `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`
      );
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const statusColor = (s: string) => {
    if (s === "active") return "bg-[var(--accent-red)]";
    if (s === "complete") return "bg-green-500";
    if (s === "failed") return "bg-red-600";
    return "bg-[var(--accent-amber)]";
  };

  const statusLabel = (s: string) => {
    if (s === "active") return "PROCESSING";
    if (s === "complete") return "CONFIRMED";
    if (s === "failed") return "FAILED";
    return "PENDING";
  };

  const formatUptime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  return (
    <section id="logs" className="border-t border-[var(--line)]">
      <div className="max-w-[1440px] mx-auto">
        <div className="px-6 md:px-8 py-6">
          <div className="flex items-end justify-between flex-wrap gap-4">
            <div className="text-[42px] font-light tracking-tight">SYSTEM LOGS</div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${agentState.status === "alive" ? "bg-green-500 animate-pulse-glow" : agentState.status === "dead" ? "bg-red-500" : "bg-amber-500 animate-pulse"}`} />
                <div className="text-[11px] tracking-[0.12em] uppercase text-[var(--ink-50)]">
                  {agentState.status === "alive" ? "Live" : agentState.status === "dead" ? "Offline" : "Reviving"} : {liveTime}
                </div>
              </div>
              {autonomyRunning && (
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent-red)] animate-pulse-glow" />
                  <span className="text-[10px] tracking-[0.06em] uppercase text-[var(--ink-50)] font-mono">
                    Uptime {formatUptime(uptime)}
                  </span>
                </div>
              )}
              <a
                href={CHAIN_CONFIG.blockExplorer}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[10px] tracking-[0.06em] uppercase text-[var(--ink-50)] hover:text-[var(--accent-red)] transition-colors"
              >
                Base L2
                <ExternalLink size={9} />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-[var(--line)]">
          {/* Header */}
          <div className="grid grid-cols-[60px_1.5fr_120px_100px_90px] md:grid-cols-[60px_1.5fr_140px_100px_90px] px-6 md:px-8 py-3 text-[10px] tracking-[0.05em] uppercase text-[var(--ink-50)]">
            <div>#</div>
            <div>Operation</div>
            <div className="hidden sm:block">Category</div>
            <div className="hidden sm:block">Time</div>
            <div className="text-right">Status</div>
          </div>

          {systemLogs.slice(0, 8).map((log, i) => (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03, duration: 0.2 }}
              className="grid grid-cols-[60px_1.5fr_120px_100px_90px] md:grid-cols-[60px_1.5fr_140px_100px_90px] px-6 md:px-8 py-4 border-t border-[var(--line)] items-center text-[13px] hover:bg-black/[0.02] transition-colors cursor-default group"
            >
              <div className="font-mono text-[11px] text-[var(--ink-50)]">
                {String(i + 1).padStart(4, "0")}
              </div>
              <div className="font-semibold pr-4 truncate flex items-center gap-2">
                {log.operation}
                {log.txHash && (
                  <a
                    href={`${CHAIN_CONFIG.blockExplorer}/tx/${log.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[var(--ink-50)] hover:text-[var(--accent-red)] transition-colors opacity-0 group-hover:opacity-100"
                    onClick={(e) => e.stopPropagation()}
                    title={`View on BaseScan: ${log.txHash.slice(0, 10)}...`}
                  >
                    <ExternalLink size={11} />
                  </a>
                )}
              </div>
              <div className="hidden sm:block text-[11px] text-[var(--ink-50)]">{log.category}</div>
              <div className="hidden sm:block font-mono text-[11px] text-[var(--ink-50)]">{log.timestamp}</div>
              <div className="flex justify-end items-center gap-2">
                <span className={`text-[9px] tracking-wider font-semibold uppercase ${
                  log.status === "complete" ? "text-green-600" :
                  log.status === "failed" ? "text-red-600" :
                  log.status === "active" ? "text-[var(--accent-red)]" :
                  "text-amber-600"
                }`}>
                  {statusLabel(log.status)}
                </span>
                <div className={`w-2 h-2 rounded-full ${statusColor(log.status)} ${log.status === "active" ? "animate-pulse-glow" : ""}`} />
              </div>
            </motion.div>
          ))}

          {systemLogs.length === 0 && (
            <div className="px-6 md:px-8 py-8 text-center text-[var(--ink-50)] text-sm">
              No system activity yet. Start the agent demo to see live logs.
            </div>
          )}
        </div>

        {/* Chain info bar */}
        <div className="border-t border-[var(--line)] px-6 md:px-8 py-3 flex items-center justify-between text-[10px] tracking-[0.06em] uppercase text-[var(--ink-50)]">
          <div className="flex items-center gap-4">
            <span>Chain: Base L2 (ID {CHAIN_CONFIG.chainId})</span>
            <span>·</span>
            <span>USDC: {CHAIN_CONFIG.usdcContract.slice(0, 6)}...{CHAIN_CONFIG.usdcContract.slice(-4)}</span>
          </div>
          <div className="flex items-center gap-4">
            <span>IPFS: Pinata Gateway</span>
            <span>·</span>
            <span>{systemLogs.length} entries</span>
          </div>
        </div>
      </div>
    </section>
  );
}
