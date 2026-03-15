"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  User, Mail, Wallet, Copy, CheckCircle, Save, Edit3,
  Fingerprint, Globe, Shield, Calendar, ExternalLink
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface AgentProfileProps {
  agent: {
    id: string;
    name: string;
    type: string;
    address: string;
    walletAddress?: string;
    walletId?: string;
    ownerWallet?: string;
    ownerVerified?: boolean;
    status?: string;
    registeredAt?: string;
    createdAt: string;
    lastActiveAt: string;
    metadata: {
      description?: string;
      capabilities?: string[];
      preferences?: Record<string, any>;
      version?: string;
    };
    protocols: {
      agentWill: { isActive: boolean };
      agentInsure: { isActive: boolean };
      agenticWallet: { isActive: boolean; balance: string };
      x402: { isActive: boolean };
    };
    sessionCount?: number;
    totalRevenue?: number;
  };
}

export default function AgentProfile({ agent }: AgentProfileProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(agent.name);
  const [email, setEmail] = useState(agent.metadata?.preferences?.email || "");
  const [description, setDescription] = useState(agent.metadata?.description || "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const walletAddr = agent.walletAddress || agent.address || "";
  const isRealWallet = walletAddr.startsWith("0x");

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/agents/${agent.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          metadata: {
            ...agent.metadata,
            description,
            preferences: {
              ...agent.metadata?.preferences,
              email,
            },
          },
        }),
      });
      if (res.ok) {
        setSaved(true);
        setIsEditing(false);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (e) {
      console.error("Failed to save profile:", e);
    } finally {
      setSaving(false);
    }
  };

  const isHuman = agent.type === "human";

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-6 pb-12"
    >
      {/* Profile Header Card */}
      <div className="glass-card border border-[var(--line)] overflow-hidden">
        {/* Banner */}
        <div className="h-24 bg-gradient-to-r from-[var(--accent-red)]/10 via-[var(--accent-crimson)]/5 to-[var(--accent-amber)]/10 relative">
          <div className="absolute inset-0 opacity-[0.04]" style={{
            backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 8px, currentColor 8px, currentColor 9px)`,
          }} />
        </div>

        <div className="px-6 pb-6 -mt-10 relative">
          {/* Avatar */}
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[var(--accent-red)] to-[var(--accent-crimson)] flex items-center justify-center text-white text-2xl font-bold shadow-lg border-4 border-white mb-4">
            {isHuman ? <User size={32} /> : agent.name.charAt(0).toUpperCase()}
          </div>

          <div className="flex items-start justify-between">
            <div>
              {isEditing ? (
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="text-2xl font-bold bg-transparent border-b-2 border-[var(--accent-red)] focus:outline-none pb-1 mb-1 w-full max-w-xs"
                  autoFocus
                />
              ) : (
                <h2 className="text-2xl font-bold mb-1">{agent.name}</h2>
              )}
              <div className="flex items-center gap-3 text-sm text-[var(--ink-50)]">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[var(--ink-10)]">
                  {isHuman ? "Human User" : "AI Agent"}
                </span>
                <span className="flex items-center gap-1">
                  <div className={`w-2 h-2 rounded-full ${(agent.status === "alive" || agent.status === "active") ? "bg-green-500 animate-pulse" : "bg-red-500"}`} />
                  {(agent.status === "alive" || agent.status === "active") ? "Active" : agent.status || "Inactive"}
                </span>
              </div>
            </div>

            <button
              onClick={() => isEditing ? handleSave() : setIsEditing(true)}
              disabled={saving}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                isEditing
                  ? "bg-[var(--accent-red)] text-white hover:opacity-90"
                  : "border border-[var(--line)] text-[var(--ink-70)] hover:bg-black/5"
              }`}
            >
              {isEditing ? (
                <>{saving ? "Saving..." : <><Save size={14} /> Save</>}</>
              ) : (
                <><Edit3 size={14} /> Edit Profile</>
              )}
            </button>
          </div>

          {saved && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-2 text-sm text-green-600 font-semibold flex items-center gap-1"
            >
              <CheckCircle size={14} /> Profile saved successfully
            </motion.div>
          )}
        </div>
      </div>

      {/* Profile Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Personal Info */}
        <div className="glass-card p-6 border border-[var(--line)]">
          <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--ink-50)] mb-5 flex items-center gap-2">
            <User size={14} />
            {isHuman ? "Personal Information" : "Agent Information"}
          </h3>

          <div className="space-y-5">
            {/* Name */}
            <div>
              <label className="block text-xs font-semibold text-[var(--ink-50)] uppercase tracking-wider mb-1.5">
                {isHuman ? "Display Name" : "Agent Name"}
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-[var(--line)] rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-red)]/30 focus:border-[var(--accent-red)] transition-all"
                />
              ) : (
                <div className="text-sm font-medium">{agent.name}</div>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-[var(--ink-50)] uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              {isEditing ? (
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="agent@example.com"
                  className="w-full px-3 py-2 border border-[var(--line)] rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-red)]/30 focus:border-[var(--accent-red)] transition-all"
                />
              ) : (
                <div className="text-sm font-medium flex items-center gap-2">
                  <Mail size={14} className="text-[var(--ink-50)]" />
                  {email || <span className="text-[var(--ink-50)] italic">Not set</span>}
                </div>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold text-[var(--ink-50)] uppercase tracking-wider mb-1.5">
                Description
              </label>
              {isEditing ? (
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="Describe yourself or your agent..."
                  className="w-full px-3 py-2 border border-[var(--line)] rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-red)]/30 focus:border-[var(--accent-red)] transition-all resize-none"
                />
              ) : (
                <div className="text-sm text-[var(--ink-70)] leading-relaxed">
                  {description || <span className="text-[var(--ink-50)] italic">No description</span>}
                </div>
              )}
            </div>

            {/* Agent ID */}
            <div>
              <label className="block text-xs font-semibold text-[var(--ink-50)] uppercase tracking-wider mb-1.5">
                {isHuman ? "User ID" : "Agent ID"}
              </label>
              <div className="flex items-center gap-2">
                <code className="text-xs font-mono bg-[var(--ink-10)]/50 px-2.5 py-1.5 rounded-lg truncate flex-1">
                  {agent.id}
                </code>
                <button
                  onClick={() => handleCopy(agent.id, "agent-id")}
                  className="p-1.5 hover:bg-black/5 rounded-lg transition-colors flex-shrink-0"
                >
                  {copiedField === "agent-id" ? <CheckCircle size={14} className="text-green-500" /> : <Copy size={14} className="text-[var(--ink-50)]" />}
                </button>
              </div>
            </div>

            {/* Type */}
            <div>
              <label className="block text-xs font-semibold text-[var(--ink-50)] uppercase tracking-wider mb-1.5">
                Account Type
              </label>
              <div className="text-sm font-medium capitalize">{agent.type}</div>
            </div>
          </div>
        </div>

        {/* Wallet & Connection */}
        <div className="glass-card p-6 border border-[var(--line)]">
          <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--ink-50)] mb-5 flex items-center gap-2">
            <Wallet size={14} />
            Wallet & Connection
          </h3>

          <div className="space-y-5">
            {/* Connected Wallet */}
            <div>
              <label className="block text-xs font-semibold text-[var(--ink-50)] uppercase tracking-wider mb-1.5">
                Connected Wallet
              </label>
              <div className="flex items-center gap-2">
                <div className={`flex-1 px-3 py-2.5 border rounded-lg ${
                  isRealWallet ? "bg-[var(--ink-10)]/30 border-[var(--line)]" : "bg-amber-50 border-amber-200"
                }`}>
                  <code className="text-xs font-mono text-[var(--ink)] break-all">
                    {isRealWallet ? walletAddr : "Legacy account. Please log out & re-register"}
                  </code>
                </div>
                {isRealWallet && (
                  <button
                    onClick={() => handleCopy(walletAddr, "wallet")}
                    className="p-2 hover:bg-black/5 rounded-lg transition-colors flex-shrink-0"
                  >
                    {copiedField === "wallet" ? <CheckCircle size={14} className="text-green-500" /> : <Copy size={14} className="text-[var(--ink-50)]" />}
                  </button>
                )}
              </div>
              {isRealWallet && (
                <a
                  href={`https://basescan.org/address/${walletAddr}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[10px] text-[var(--accent-red)] hover:underline mt-1.5 font-semibold"
                >
                  View on BaseScan <ExternalLink size={10} />
                </a>
              )}
              {!isRealWallet && walletAddr && (
                <p className="text-[10px] text-amber-600 mt-1.5 font-medium">
                  Your account was created before the wallet fix. Log out and sign in again to link your real on-chain address.
                </p>
              )}
            </div>

            {/* Wallet Balance */}
            <div>
              <label className="block text-xs font-semibold text-[var(--ink-50)] uppercase tracking-wider mb-1.5">
                Wallet Balance
              </label>
              <div className="text-2xl font-bold">
                {parseFloat(agent.protocols?.agenticWallet?.balance || "0").toFixed(2)}
                <span className="text-sm text-[var(--ink-50)] font-normal ml-1">USDC</span>
              </div>
            </div>

            {/* Owner Wallet */}
            {!isHuman && (
              <div>
                <label className="block text-xs font-semibold text-[var(--ink-50)] uppercase tracking-wider mb-1.5">
                  Owner Wallet
                </label>
                {agent.ownerWallet ? (
                  <div className="flex items-center gap-2">
                    <code className="text-xs font-mono bg-[var(--ink-10)]/50 px-2.5 py-1.5 rounded-lg truncate flex-1">
                      {agent.ownerWallet}
                    </code>
                    <button
                      onClick={() => handleCopy(agent.ownerWallet!, "owner")}
                      className="p-1.5 hover:bg-black/5 rounded-lg transition-colors flex-shrink-0"
                    >
                      {copiedField === "owner" ? <CheckCircle size={14} className="text-green-500" /> : <Copy size={14} className="text-[var(--ink-50)]" />}
                    </button>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${agent.ownerVerified ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                      {agent.ownerVerified ? "Verified" : "Pending"}
                    </span>
                  </div>
                ) : (
                  <div className="text-sm text-[var(--ink-50)] italic">No owner linked. Agent is independent</div>
                )}
              </div>
            )}

            {/* Network */}
            <div>
              <label className="block text-xs font-semibold text-[var(--ink-50)] uppercase tracking-wider mb-1.5">
                Network
              </label>
              <div className="flex items-center gap-2">
                <Globe size={14} className="text-blue-500" />
                <span className="text-sm font-medium">Base L2</span>
                <span className="text-[10px] text-[var(--ink-50)] font-mono">Chain ID: 8453</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Account Stats */}
      <div className="glass-card p-6 border border-[var(--line)]">
        <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--ink-50)] mb-5 flex items-center gap-2">
          <Fingerprint size={14} />
          Account Details
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-3 rounded-xl bg-[var(--ink-10)]/30">
            <div className="text-xs text-[var(--ink-50)] uppercase tracking-wider font-semibold mb-1">Created</div>
            <div className="text-sm font-medium">
              {agent.createdAt ? formatDistanceToNow(new Date(agent.createdAt), { addSuffix: true }) : "Unknown"}
            </div>
          </div>
          <div className="p-3 rounded-xl bg-[var(--ink-10)]/30">
            <div className="text-xs text-[var(--ink-50)] uppercase tracking-wider font-semibold mb-1">Last Active</div>
            <div className="text-sm font-medium">
              {agent.lastActiveAt ? formatDistanceToNow(new Date(agent.lastActiveAt), { addSuffix: true }) : "Just now"}
            </div>
          </div>
          <div className="p-3 rounded-xl bg-[var(--ink-10)]/30">
            <div className="text-xs text-[var(--ink-50)] uppercase tracking-wider font-semibold mb-1">Sessions</div>
            <div className="text-sm font-medium">{agent.sessionCount || 1}</div>
          </div>
          <div className="p-3 rounded-xl bg-[var(--ink-10)]/30">
            <div className="text-xs text-[var(--ink-50)] uppercase tracking-wider font-semibold mb-1">Revenue</div>
            <div className="text-sm font-medium">${(agent.totalRevenue || 0).toFixed(2)}</div>
          </div>
        </div>
      </div>

      {/* Active Protocols */}
      <div className="glass-card p-6 border border-[var(--line)]">
        <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--ink-50)] mb-4 flex items-center gap-2">
          <Shield size={14} />
          Active Protocols
        </h3>
        <div className="flex flex-wrap gap-2">
          {[
            { name: "AgentWill", active: agent.protocols?.agentWill?.isActive },
            { name: "AgentInsure", active: agent.protocols?.agentInsure?.isActive },
            { name: "Agentic Wallet", active: agent.protocols?.agenticWallet?.isActive },
            { name: "x402 Payments", active: agent.protocols?.x402?.isActive },
          ].map((p) => (
            <span
              key={p.name}
              className={`px-3 py-1.5 rounded-full text-xs font-bold ${
                p.active ? "bg-green-50 text-green-700 border border-green-200" : "bg-[var(--ink-10)] text-[var(--ink-50)] border border-[var(--line)]"
              }`}
            >
              {p.active ? "●" : "○"} {p.name}
            </span>
          ))}
        </div>
      </div>

      {/* Cancel editing */}
      {isEditing && (
        <div className="flex gap-3">
          <button
            onClick={() => {
              setIsEditing(false);
              setName(agent.name);
              setEmail(agent.metadata?.preferences?.email || "");
              setDescription(agent.metadata?.description || "");
            }}
            className="px-5 py-2.5 border border-[var(--line)] text-[var(--ink-70)] text-sm font-semibold rounded-lg hover:bg-black/5 transition-colors"
          >
            Cancel
          </button>
        </div>
      )}
    </motion.div>
  );
}
