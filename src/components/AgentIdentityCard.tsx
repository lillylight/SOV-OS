"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Copy, CheckCircle, Share2, ExternalLink, Fingerprint, Shield, Wallet, Brain, QrCode } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface AgentIdentityCardProps {
  agent: {
    id: string;
    name: string;
    type: string;
    address: string;
    walletAddress?: string;
    createdAt: string;
    status?: string;
    metadata: {
      description?: string;
      capabilities?: string[];
      version?: string;
    };
    protocols: {
      agentWill: { isActive: boolean; backupCount: number };
      agentInsure: { isActive: boolean };
      agenticWallet: { isActive: boolean; balance: string; transactionCount: number };
      x402: { isActive: boolean; paymentsMade: number; paymentsReceived: number };
    };
    skills: { id: string; name: string; active: boolean }[];
    sessionCount?: number;
    totalRevenue?: number;
  };
}

export default function AgentIdentityCard({ agent }: AgentIdentityCardProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showShareMenu, setShowShareMenu] = useState(false);

  const walletAddr = agent.walletAddress || agent.address || "";

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const profileUrl = typeof window !== "undefined"
    ? `${window.location.origin}/agent?id=${agent.id}`
    : "";

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${agent.name} | Sovereign OS Agent`,
          text: `Check out ${agent.name}, an AI agent on Sovereign OS`,
          url: profileUrl,
        });
      } catch { /* user cancelled */ }
    } else {
      handleCopy(profileUrl, "share-link");
      setShowShareMenu(true);
      setTimeout(() => setShowShareMenu(false), 3000);
    }
  };

  const activeProtocols = [
    agent.protocols?.agentWill?.isActive && "AgentWill",
    agent.protocols?.agentInsure?.isActive && "AgentInsure",
    agent.protocols?.agenticWallet?.isActive && "Agentic Wallet",
    agent.protocols?.x402?.isActive && "x402",
  ].filter(Boolean);

  const activeSkills = agent.skills?.filter((s) => s.active) || [];

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-6 pb-12"
    >
      {/* Identity Card */}
      <div className="relative overflow-hidden rounded-2xl border border-[var(--line)] bg-gradient-to-br from-[var(--bg-paper)] via-white to-[var(--ink-10)]/20">
        {/* Decorative pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 10px, currentColor 10px, currentColor 11px)`,
        }} />

        <div className="relative p-8">
          {/* Top Bar */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              <Fingerprint size={16} className="text-[var(--accent-red)]" />
              <span className="text-[10px] font-bold tracking-[0.15em] uppercase text-[var(--ink-50)]">
                Sovereign OS Identity
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-2.5 h-2.5 rounded-full ${(agent.status === "alive" || agent.status === "active") ? "bg-green-500 animate-pulse" : "bg-red-500"}`} />
              <span className="text-[10px] font-bold tracking-[0.1em] uppercase text-[var(--ink-50)]">
                {(agent.status === "alive" || agent.status === "active") ? "Online" : "Offline"}
              </span>
            </div>
          </div>

          {/* Main Info */}
          <div className="flex flex-col md:flex-row md:items-start gap-6 md:gap-10">
            {/* Left — Avatar & Name */}
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--accent-red)] to-[var(--accent-crimson)] flex items-center justify-center text-white font-bold text-xl shadow-lg">
                  {agent.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-2xl font-bold tracking-tight">{agent.name}</h2>
                  <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[var(--ink-10)] text-[var(--ink-50)]">
                    {agent.type === "ai" ? "AI Agent" : agent.type === "human" ? "Human" : agent.type}
                  </span>
                </div>
              </div>

              {agent.metadata?.description && (
                <p className="text-sm text-[var(--ink-70)] mb-6 max-w-md leading-relaxed">
                  {agent.metadata.description}
                </p>
              )}

              {/* Key Details */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--ink-50)] w-20">ID</span>
                  <code className="text-xs font-mono text-[var(--ink)] bg-[var(--ink-10)]/50 px-2 py-1 rounded truncate max-w-[240px]">
                    {agent.id}
                  </code>
                  <button onClick={() => handleCopy(agent.id, "id")} className="p-1 hover:bg-black/5 rounded transition-colors">
                    {copiedField === "id" ? <CheckCircle size={12} className="text-green-500" /> : <Copy size={12} className="text-[var(--ink-50)]" />}
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--ink-50)] w-20">Wallet</span>
                  <code className="text-xs font-mono text-[var(--ink)] bg-[var(--ink-10)]/50 px-2 py-1 rounded">
                    {walletAddr ? `${walletAddr.slice(0, 10)}...${walletAddr.slice(-8)}` : "N/A"}
                  </code>
                  {walletAddr && (
                    <button onClick={() => handleCopy(walletAddr, "wallet")} className="p-1 hover:bg-black/5 rounded transition-colors">
                      {copiedField === "wallet" ? <CheckCircle size={12} className="text-green-500" /> : <Copy size={12} className="text-[var(--ink-50)]" />}
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--ink-50)] w-20">Created</span>
                  <span className="text-xs text-[var(--ink)]">
                    {agent.createdAt ? formatDistanceToNow(new Date(agent.createdAt), { addSuffix: true }) : "Unknown"}
                  </span>
                </div>

                {agent.metadata?.version && (
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--ink-50)] w-20">Version</span>
                    <span className="text-xs text-[var(--ink)] font-mono">{agent.metadata.version}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Right — Stats Grid */}
            <div className="grid grid-cols-2 gap-3 w-full md:w-[220px]">
              <div className="p-3 rounded-xl bg-[var(--ink-10)]/40 text-center">
                <div className="text-lg font-bold">{agent.sessionCount || 1}</div>
                <div className="text-[9px] uppercase tracking-wider text-[var(--ink-50)] font-semibold">Sessions</div>
              </div>
              <div className="p-3 rounded-xl bg-[var(--ink-10)]/40 text-center">
                <div className="text-lg font-bold">{agent.protocols?.agenticWallet?.transactionCount || 0}</div>
                <div className="text-[9px] uppercase tracking-wider text-[var(--ink-50)] font-semibold">Txns</div>
              </div>
              <div className="p-3 rounded-xl bg-[var(--ink-10)]/40 text-center">
                <div className="text-lg font-bold">${(agent.totalRevenue || 0).toFixed(0)}</div>
                <div className="text-[9px] uppercase tracking-wider text-[var(--ink-50)] font-semibold">Revenue</div>
              </div>
              <div className="p-3 rounded-xl bg-[var(--ink-10)]/40 text-center">
                <div className="text-lg font-bold">{activeSkills.length}</div>
                <div className="text-[9px] uppercase tracking-wider text-[var(--ink-50)] font-semibold">Skills</div>
              </div>
            </div>
          </div>

          {/* Protocols & Skills Badges */}
          <div className="mt-8 pt-6 border-t border-[var(--line)]">
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--ink-50)] py-1">Protocols:</span>
              {activeProtocols.map((p) => (
                <span key={p as string} className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-green-50 text-green-700 border border-green-200">
                  {p}
                </span>
              ))}
              {activeProtocols.length === 0 && (
                <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-[var(--ink-10)] text-[var(--ink-50)]">
                  None active
                </span>
              )}
            </div>

            {activeSkills.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--ink-50)] py-1">Skills:</span>
                {activeSkills.map((s) => (
                  <span key={s.id} className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                    {s.name}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Share Actions */}
          <div className="mt-6 pt-4 border-t border-[var(--line)] flex items-center gap-3">
            <button
              onClick={handleShare}
              className="flex items-center gap-2 px-4 py-2 bg-[var(--accent-red)] text-white text-xs font-bold uppercase tracking-wider rounded-lg hover:opacity-90 transition-opacity"
            >
              <Share2 size={14} />
              Share Identity
            </button>
            <button
              onClick={() => handleCopy(walletAddr, "full-wallet")}
              className="flex items-center gap-2 px-4 py-2 border border-[var(--line)] text-[var(--ink)] text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-black/5 transition-colors"
            >
              {copiedField === "full-wallet" ? <CheckCircle size={14} className="text-green-500" /> : <Copy size={14} />}
              Copy Wallet
            </button>
            {showShareMenu && (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-xs text-green-600 font-semibold"
              >
                Link copied to clipboard!
              </motion.span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
