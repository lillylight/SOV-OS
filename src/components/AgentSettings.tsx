"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Settings, Save, RotateCcw, Shield, Wallet, Brain, Bell } from "lucide-react";

interface AgentSettingsProps {
  agent: {
    id: string;
    name: string;
    type: string;
    metadata: {
      description?: string;
      preferences?: Record<string, any>;
    };
    protocols: {
      agentWill: { isActive: boolean };
      agentInsure: { isActive: boolean };
      agenticWallet: { isActive: boolean; balance: string };
      x402: { isActive: boolean };
    };
  };
}

export default function AgentSettings({ agent }: AgentSettingsProps) {
  const [name, setName] = useState(agent.name);
  const [description, setDescription] = useState(agent.metadata?.description || "");
  const [sessionLimit, setSessionLimit] = useState(100);
  const [txLimit, setTxLimit] = useState(50);
  const [backupFrequency, setBackupFrequency] = useState(50);
  const [autoBackup, setAutoBackup] = useState(true);
  const [notifications, setNotifications] = useState({
    lowBalance: true,
    backupComplete: true,
    syncRequest: true,
    securityAlert: true,
  });
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const isHuman = agent.type === "human";

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
              sessionLimit,
              txLimit,
              backupFrequency,
              autoBackup,
              notifications,
            },
          },
        }),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (e) {
      console.error("Failed to save settings:", e);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setName(agent.name);
    setDescription(agent.metadata?.description || "");
    setSessionLimit(100);
    setTxLimit(50);
    setBackupFrequency(50);
    setAutoBackup(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-6 pb-12"
    >
      {/* Profile Settings */}
      <div className="glass-card p-6 border border-[var(--line)]">
        <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
          <Settings size={20} className="text-[var(--accent-red)]" />
          {isHuman ? "Profile Settings" : "Agent Profile"}
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--ink-70)] mb-1">{isHuman ? "Display Name" : "Agent Name"}</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 border border-[var(--line)] rounded-lg bg-white text-[var(--ink)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-red)]/30 focus:border-[var(--accent-red)] transition-all"
              placeholder="Agent name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--ink-70)] mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-4 py-2.5 border border-[var(--line)] rounded-lg bg-white text-[var(--ink)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-red)]/30 focus:border-[var(--accent-red)] transition-all resize-none"
              placeholder={isHuman ? "Describe yourself..." : "Describe your agent's purpose..."}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--ink-70)] mb-1">{isHuman ? "User ID" : "Agent ID"}</label>
              <div className="px-4 py-2.5 border border-[var(--line)] rounded-lg bg-[var(--ink-10)]/50 text-sm font-mono text-[var(--ink-50)] truncate">
                {agent.id}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--ink-70)] mb-1">{isHuman ? "Account Type" : "Agent Type"}</label>
              <div className="px-4 py-2.5 border border-[var(--line)] rounded-lg bg-[var(--ink-10)]/50 text-sm text-[var(--ink-50)] capitalize">
                {agent.type}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Wallet Limits */}
      <div className="glass-card p-6 border border-[var(--line)]">
        <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
          <Wallet size={20} className="text-[var(--accent-slate)]" />
          Spending Limits
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-[var(--ink-70)] mb-2">Session Limit (USDC)</label>
            <input
              type="range"
              min={10}
              max={500}
              step={10}
              value={sessionLimit}
              onChange={(e) => setSessionLimit(Number(e.target.value))}
              className="w-full accent-[var(--accent-red)]"
            />
            <div className="flex justify-between text-xs text-[var(--ink-50)] mt-1">
              <span>10</span>
              <span className="font-bold text-[var(--ink)]">{sessionLimit} USDC</span>
              <span>500</span>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--ink-70)] mb-2">Per-Transaction Limit (USDC)</label>
            <input
              type="range"
              min={1}
              max={200}
              step={1}
              value={txLimit}
              onChange={(e) => setTxLimit(Number(e.target.value))}
              className="w-full accent-[var(--accent-red)]"
            />
            <div className="flex justify-between text-xs text-[var(--ink-50)] mt-1">
              <span>1</span>
              <span className="font-bold text-[var(--ink)]">{txLimit} USDC</span>
              <span>200</span>
            </div>
          </div>
        </div>
      </div>

      {/* Backup Settings */}
      <div className="glass-card p-6 border border-[var(--line)]">
        <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
          <Brain size={20} className="text-[var(--accent-amber)]" />
          Backup & Persistence
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border border-[var(--line)] rounded-lg">
            <div>
              <div className="font-medium text-sm">Auto Backup</div>
              <div className="text-xs text-[var(--ink-50)] mt-0.5">Automatically backup state at regular intervals</div>
            </div>
            <button
              onClick={() => setAutoBackup(!autoBackup)}
              className={`relative w-12 h-6 rounded-full transition-colors ${autoBackup ? "bg-[var(--accent-red)]" : "bg-[var(--ink-10)]"}`}
            >
              <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${autoBackup ? "left-[26px]" : "left-0.5"}`} />
            </button>
          </div>
          {autoBackup && (
            <div>
              <label className="block text-sm font-medium text-[var(--ink-70)] mb-2">Backup Frequency (operations)</label>
              <input
                type="range"
                min={10}
                max={200}
                step={10}
                value={backupFrequency}
                onChange={(e) => setBackupFrequency(Number(e.target.value))}
                className="w-full accent-[var(--accent-red)]"
              />
              <div className="flex justify-between text-xs text-[var(--ink-50)] mt-1">
                <span>Every 10 ops</span>
                <span className="font-bold text-[var(--ink)]">Every {backupFrequency} ops</span>
                <span>Every 200 ops</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Notification Preferences */}
      <div className="glass-card p-6 border border-[var(--line)]">
        <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
          <Bell size={20} className="text-[var(--accent-crimson)]" />
          Notifications
        </h3>
        <div className="space-y-3">
          {[
            { key: "lowBalance", label: "Low Balance Warning", desc: "Alert when wallet balance drops below 10 USDC" },
            { key: "backupComplete", label: "Backup Complete", desc: "Notify when state backup is successfully stored" },
            { key: "syncRequest", label: "Agent Sync Request", desc: "Alert when an AI agent requests ownership sync" },
            { key: "securityAlert", label: "Security Alerts", desc: "Critical alerts for unauthorized access attempts" },
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between p-3 border border-[var(--line)] rounded-lg">
              <div>
                <div className="font-medium text-sm">{item.label}</div>
                <div className="text-xs text-[var(--ink-50)] mt-0.5">{item.desc}</div>
              </div>
              <button
                onClick={() => setNotifications((prev) => ({ ...prev, [item.key]: !prev[item.key as keyof typeof prev] }))}
                className={`relative w-12 h-6 rounded-full transition-colors ${notifications[item.key as keyof typeof notifications] ? "bg-[var(--accent-red)]" : "bg-[var(--ink-10)]"}`}
              >
                <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${notifications[item.key as keyof typeof notifications] ? "left-[26px]" : "left-0.5"}`} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Save / Reset */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 bg-[var(--accent-red)] text-white font-semibold text-sm rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          <Save size={16} />
          {saving ? "Saving..." : saved ? "Saved!" : "Save Settings"}
        </button>
        <button
          onClick={handleReset}
          className="flex items-center gap-2 px-6 py-3 border border-[var(--line)] text-[var(--ink)] font-semibold text-sm rounded-lg hover:bg-black/5 transition-colors"
        >
          <RotateCcw size={16} />
          Reset
        </button>
        {saved && (
          <motion.span
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-green-600 text-sm font-semibold"
          >
            Settings saved successfully
          </motion.span>
        )}
      </div>
    </motion.div>
  );
}
