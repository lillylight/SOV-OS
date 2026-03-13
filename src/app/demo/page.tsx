"use client";

import { useEffect, useState } from "react";
import { useAgentStore, CHAIN_CONFIG, IPFS_STATE_CIDS } from "@/lib/agentStore";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Brain, 
  Wallet, 
  Shield, 
  Activity, 
  DollarSign, 
  RefreshCw,
  Zap,
  AlertCircle,
  CheckCircle,
  Clock,
  ArrowUpRight,
  ExternalLink,
  Play,
  Square,
  Terminal,
  Server,
  Globe,
  Lock,
  Database,
  Skull,
  Bug,
  HardDrive,
  Twitter,
  Users,
  Layers,
  Infinity,
  ShieldCheck,
  Undo2
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function DemoPage() {
  const agent = useAgentStore();
  const [selectedTab, setSelectedTab] = useState<"overview" | "wallet" | "insurance" | "actions" | "memory" | "network" | "skills">("overview");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[var(--bg-paper)] flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-[var(--accent-red)] animate-pulse" />
          <span className="text-sm font-mono text-[var(--ink-50)] tracking-wide uppercase">
            Initializing SovereignOS Agent...
          </span>
        </div>
      </div>
    );
  }

  const formatUptime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-[var(--bg-paper)] pt-20">
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
            <div>
              <h1 className="text-4xl font-light tracking-tight mb-2">
                SovereignOS <span className="font-bold">Live Agent</span>
              </h1>
              <p className="text-[var(--ink-70)]">
                Autonomous agent on Base L2 — earns revenue, encrypts & stores its state, and survives destruction
              </p>
            </div>
            <div className="flex items-center gap-4">
              <a
                href={CHAIN_CONFIG.blockExplorer}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-[var(--ink-50)] hover:text-[var(--accent-red)] transition-colors"
              >
                <Globe size={12} />
                BaseScan
                <ExternalLink size={10} />
              </a>
              <a
                href="/"
                className="inline-flex items-center gap-2 text-sm border-b border-[var(--ink)] pb-0.5 hover:border-[var(--accent-red)] hover:text-[var(--accent-red)] transition-colors"
              >
                Back to Home
                <ArrowUpRight size={14} />
              </a>
            </div>
          </div>
        </div>

        {/* Agent Status Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6 mb-6 border border-[var(--line)]"
        >
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                agent.state.status === "alive" ? "bg-green-100" :
                agent.state.status === "reviving" ? "bg-amber-100" :
                agent.state.status === "corrupted" ? "bg-purple-100" :
                "bg-red-100"
              }`}>
                <Brain className={
                  agent.state.status === "alive" ? "text-green-600" :
                  agent.state.status === "reviving" ? "text-amber-600" :
                  agent.state.status === "corrupted" ? "text-purple-600" :
                  "text-red-600"
                } size={32} />
              </div>
              <div>
                <h2 className="text-2xl font-semibold mb-1">{agent.state.name}</h2>
                <div className="flex items-center gap-3 text-sm text-[var(--ink-70)] flex-wrap">
                  <span className="flex items-center gap-1">
                    <div className={`w-2 h-2 rounded-full ${
                      agent.state.status === "alive" ? "bg-green-500 animate-pulse-glow" :
                      agent.state.status === "reviving" ? "bg-amber-500 animate-pulse" :
                      agent.state.status === "corrupted" ? "bg-purple-500 animate-pulse" :
                      "bg-red-500"
                    }`} />
                    {agent.state.status === "alive" ? "Active" :
                     agent.state.status === "reviving" ? "Reviving..." :
                     agent.state.status === "corrupted" ? "Corrupted" :
                     "Terminated"}
                  </span>
                  <span>•</span>
                  <span>Session #{agent.state.sessionCount}</span>
                  <span>•</span>
                  <span className="font-mono text-xs">{agent.state.id.slice(0, 8)}...</span>
                  <span>•</span>
                  <span className="font-mono text-xs">Chain {CHAIN_CONFIG.chainId}</span>
                  {agent.autonomyRunning && (
                    <>
                      <span>•</span>
                      <span className="flex items-center gap-1 text-[var(--accent-red)]">
                        <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent-red)] animate-pulse-glow" />
                        <span className="font-mono text-xs">Autonomous</span>
                      </span>
                    </>
                  )}
                </div>
                <div className="text-[10px] text-[var(--ink-50)] mt-1 font-mono">
                  Creator: {agent.state.creatorWallet ? `${agent.state.creatorWallet.slice(0, 6)}...${agent.state.creatorWallet.slice(-4)}` : "Unknown"}
                </div>
              </div>
            </div>

            <div className="flex gap-2 flex-wrap">
              {agent.state.status === "alive" && !agent.autonomyRunning && (
                <button
                  onClick={agent.startAutonomy}
                  className="px-4 py-2 bg-green-600 text-white font-semibold text-sm rounded hover:opacity-90 transition-opacity flex items-center gap-2"
                >
                  <Play size={14} />
                  Start Autonomy
                </button>
              )}
              {agent.autonomyRunning && (
                <button
                  onClick={agent.stopAutonomy}
                  className="px-4 py-2 bg-amber-600 text-white font-semibold text-sm rounded hover:opacity-90 transition-opacity flex items-center gap-2"
                >
                  <Square size={14} />
                  Pause
                </button>
              )}
              {(agent.state.status === "dead" || agent.state.status === "corrupted") && (
                <button
                  onClick={() => agent.reviveAgent(true)}
                  className="px-4 py-2 bg-[var(--accent-amber)] text-[var(--ink)] font-semibold text-sm rounded hover:opacity-90 transition-opacity flex items-center gap-2"
                >
                  <RefreshCw size={16} />
                  Revive from Backup
                </button>
              )}
              {agent.state.status === "alive" && (
                <>
                  <button
                    onClick={agent.killAgent}
                    className="px-4 py-2 bg-[var(--accent-crimson)] text-white font-semibold text-sm rounded hover:opacity-90 transition-opacity flex items-center gap-2"
                  >
                    <Zap size={16} />
                    Terminate
                  </button>
                  <button
                    onClick={agent.corruptAgent}
                    className="px-4 py-2 bg-purple-600 text-white font-semibold text-sm rounded hover:opacity-90 transition-opacity flex items-center gap-2"
                  >
                    <Bug size={14} />
                    Corrupt
                  </button>
                  <button
                    onClick={agent.hackAgent}
                    className="px-4 py-2 bg-red-800 text-white font-semibold text-sm rounded hover:opacity-90 transition-opacity flex items-center gap-2"
                  >
                    <Skull size={14} />
                    Simulate Hack
                  </button>
                </>
              )}
              <button
                onClick={agent.reset}
                className="px-4 py-2 border border-[var(--line)] text-[var(--ink)] font-semibold text-sm rounded hover:bg-black/5 transition-colors"
              >
                Reset
              </button>
            </div>
          </div>
        </motion.div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="glass-card p-5 border border-[var(--line)]">
            <div className="flex items-center gap-3 mb-2">
              <Wallet className="text-[var(--accent-slate)]" size={20} />
              <span className="text-[10px] text-[var(--ink-70)] uppercase tracking-wide">Balance</span>
            </div>
            <div className="text-2xl font-bold">{agent.wallet?.balance?.toFixed(2) || "0.00"}</div>
            <div className="text-[10px] text-[var(--ink-50)] mt-1 font-mono">USDC on Base</div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className="glass-card p-5 border border-[var(--line)]">
            <div className="flex items-center gap-3 mb-2">
              <HardDrive className="text-[var(--accent-crimson)]" size={20} />
              <span className="text-[10px] text-[var(--ink-70)] uppercase tracking-wide">Backups</span>
            </div>
            <div className="text-2xl font-bold">{agent.insurance?.backups?.length || 0}</div>
            <div className="text-[10px] text-[var(--ink-50)] mt-1">encrypted snapshots on IPFS</div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="glass-card p-5 border border-[var(--line)]">
            <div className="flex items-center gap-3 mb-2">
              <DollarSign className="text-green-600" size={20} />
              <span className="text-[10px] text-[var(--ink-70)] uppercase tracking-wide">Revenue</span>
            </div>
            <div className="text-2xl font-bold text-green-700">{agent.totalRevenue?.toFixed(2) || "0.00"}</div>
            <div className="text-[10px] text-[var(--ink-50)] mt-1">total USDC earned</div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
            className="glass-card p-5 border border-[var(--line)]">
            <div className="flex items-center gap-3 mb-2">
              <Shield className="text-[var(--accent-amber)]" size={20} />
              <span className="text-[10px] text-[var(--ink-70)] uppercase tracking-wide">Recoveries</span>
            </div>
            <div className="text-2xl font-bold">{agent.totalRecoveries}</div>
            <div className="text-[10px] text-[var(--ink-50)] mt-1">state restorations from IPFS</div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="glass-card p-5 border border-[var(--line)]">
            <div className="flex items-center gap-3 mb-2">
              <Server className="text-[var(--ink-50)]" size={20} />
              <span className="text-[10px] text-[var(--ink-70)] uppercase tracking-wide">Uptime</span>
            </div>
            <div className="text-2xl font-bold font-mono">{formatUptime(agent.uptime)}</div>
            <div className="text-[10px] text-[var(--ink-50)] mt-1">session #{agent.state.sessionCount}</div>
          </motion.div>
        </div>

        <div className="flex gap-2 mb-6 border-b border-[var(--line)] overflow-x-auto">
          {(["overview", "wallet", "insurance", "network", "skills", "actions", "memory"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setSelectedTab(tab)}
              className={`px-4 py-2 text-sm font-semibold uppercase tracking-wide transition-colors border-b-2 whitespace-nowrap ${
                selectedTab === tab
                  ? "border-[var(--accent-red)] text-[var(--ink)]"
                  : "border-transparent text-[var(--ink-50)] hover:text-[var(--ink)]"
              }`}
            >
              {tab === "insurance" ? "State Backups" : tab}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {selectedTab === "overview" && <OverviewTab />}
          {selectedTab === "wallet" && <WalletTab />}
          {selectedTab === "insurance" && <InsuranceTab />}
          {selectedTab === "network" && <NetworkTab />}
          {selectedTab === "skills" && <SkillsTab />}
          {selectedTab === "actions" && <ActionsTab />}
          {selectedTab === "memory" && <MemoryTab />}
        </AnimatePresence>
      </div>
    </div>
  );
}

function OverviewTab() {
  const agent = useAgentStore();

  return (
    <motion.div key="overview" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-6">
      {/* Manual Actions */}
      <div className="glass-card p-6 border border-[var(--line)]">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold">Agent Actions</h3>
          <span className="text-[10px] tracking-[0.1em] uppercase text-[var(--ink-50)]">Manual Trigger</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <ActionButton
            icon={<DollarSign size={20} />}
            label="x402 Revenue"
            description="Serve validation request → earn $0.10 USDC"
            onClick={() => {
              const addrs = ["0x7a3f...c912", "0xb4e1...8f03", "0x9c2d...a417"];
              const addr = addrs[Math.floor(Math.random() * addrs.length)];
              agent.addFunds(0.10, `x402 validation served → ${addr}`);
              agent.logAction("x402_payment", `x402 validation: +$0.10 USDC from ${addr}`, true);
            }}
            disabled={agent.state.status !== "alive"}
          />
          <ActionButton
            icon={<HardDrive size={20} />}
            label="Backup State"
            description="Encrypt & store state on IPFS (costs USDC)"
            onClick={() => agent.backupState()}
            disabled={agent.state.status !== "alive" || !agent.insurance?.active}
          />
          <ActionButton
            icon={<Shield size={20} />}
            label={agent.insurance?.active ? "Insurance Active ✓" : "Activate Insurance"}
            description={agent.insurance?.active ? `${agent.insurance.backups?.length || 0} backups stored` : "Enable encrypted IPFS state storage"}
            onClick={() => agent.activateInsurance()}
            disabled={agent.state.status !== "alive" || !!agent.insurance?.active}
          />
          <ActionButton
            icon={<DollarSign size={20} />}
            label="Add 100 USDC"
            description="Simulate batch x402 settlement"
            onClick={() => agent.addFunds(100, "x402 batch settlement — 1000 requests")}
            disabled={agent.state.status !== "alive"}
          />
          <ActionButton
            icon={<Lock size={20} />}
            label="Compliance Check"
            description="Run OFAC/KYT screening"
            onClick={() => {
              const addrs = ["0x7a3f...c912", "0xb4e1...8f03", "0x9c2d...a417"];
              const addr = addrs[Math.floor(Math.random() * addrs.length)];
              agent.pushSystemLog({
                operation: `OFAC/KYT Screening — ${addr} ✓ CLEAR`,
                category: "Compliance",
                timestamp: new Date().toLocaleTimeString("en-US", { hour12: false }),
                status: "complete",
              });
              agent.logAction("validation", `OFAC/KYT screening passed for ${addr}`, true);
            }}
            disabled={agent.state.status !== "alive"}
          />
          <ActionButton
            icon={<Database size={20} />}
            label="Save Memory"
            description="Store a learning in agent memory"
            onClick={() => {
              agent.saveMemory("learning", `Manual insight recorded at ${new Date().toLocaleTimeString()}`);
              agent.logAction("validation", "New learning stored in agent memory", true);
            }}
            disabled={agent.state.status !== "alive"}
          />
        </div>
      </div>

      {/* Live System Log */}
      <div className="glass-card p-6 border border-[var(--line)]">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold flex items-center gap-2">
            <Terminal size={20} />
            Live System Log
          </h3>
          {agent.autonomyRunning && (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse-glow" />
              <span className="text-[10px] tracking-[0.08em] uppercase text-green-600 font-semibold">Auto-Operating</span>
            </div>
          )}
        </div>
        <div className="space-y-1 font-mono text-xs max-h-[300px] overflow-y-auto bg-[var(--ink)] text-green-400 p-4 rounded">
          {agent.systemLogs.slice(0, 15).map((log, i) => (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, x: -5 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.02 }}
              className={`flex items-start gap-2 py-0.5 ${
                log.status === "failed" ? "text-red-400" :
                log.status === "active" ? "text-amber-400" :
                log.status === "pending" ? "text-yellow-400" :
                "text-green-400"
              }`}
            >
              <span className="text-gray-500 flex-shrink-0">[{log.timestamp}]</span>
              <span className="text-gray-500 flex-shrink-0">[{log.category}]</span>
              <span className="flex-1">{log.operation}</span>
              {log.txHash && (
                <a href={`${CHAIN_CONFIG.blockExplorer}/tx/${log.txHash}`} target="_blank" rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 flex-shrink-0">
                  {log.txHash.slice(0, 8)}...
                </a>
              )}
              {log.blockNumber && (
                <span className="text-gray-600 flex-shrink-0">blk#{log.blockNumber}</span>
              )}
            </motion.div>
          ))}
          {agent.systemLogs.length === 0 && (
            <div className="text-gray-500 py-4 text-center">
              $ sovereign-os agent start --chain base --encrypt aes-256-gcm<br />
              Waiting for initialization...
            </div>
          )}
        </div>
      </div>

      {/* Recent Actions */}
      <div className="glass-card p-6 border border-[var(--line)]">
        <h3 className="text-xl font-semibold mb-4">Recent Actions</h3>
        <div className="space-y-2">
          {agent.actions.slice(0, 5).map((action) => (
            <div key={action.id} className="flex items-start gap-3 p-3 border border-[var(--line)] rounded hover:bg-black/5 transition-colors">
              {action.success ? (
                <CheckCircle className="text-green-500 flex-shrink-0 mt-0.5" size={18} />
              ) : (
                <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={18} />
              )}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium">{action.details}</div>
                <div className="text-xs text-[var(--ink-50)] mt-1">
                  {formatDistanceToNow(new Date(action.timestamp), { addSuffix: true })}
                </div>
              </div>
              <span className="text-xs uppercase tracking-wide text-[var(--ink-50)] px-2 py-1 bg-black/5 rounded whitespace-nowrap">
                {action.type.replace(/_/g, " ")}
              </span>
            </div>
          ))}
          {agent.actions.length === 0 && (
            <div className="text-center py-8 text-[var(--ink-50)]">
              No actions yet. Start autonomy or use the buttons above.
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function WalletTab() {
  const agent = useAgentStore();

  return (
    <motion.div key="wallet" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-6">
      <div className="glass-card p-6 border border-[var(--line)]">
        <h3 className="text-xl font-semibold mb-4">Wallet Configuration</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <div className="text-sm text-[var(--ink-70)] mb-1">Session Limit</div>
            <div className="text-2xl font-bold">{agent.wallet.sessionLimit} USDC</div>
          </div>
          <div>
            <div className="text-sm text-[var(--ink-70)] mb-1">Per-TX Limit</div>
            <div className="text-2xl font-bold">{agent.wallet.transactionLimit} USDC</div>
          </div>
          <div>
            <div className="text-sm text-[var(--ink-70)] mb-1">Currency</div>
            <div className="text-2xl font-bold">{agent.wallet.currency}</div>
            <div className="text-[10px] text-[var(--ink-50)] font-mono mt-1">
              {CHAIN_CONFIG.usdcContract.slice(0, 6)}...{CHAIN_CONFIG.usdcContract.slice(-4)}
            </div>
          </div>
          <div>
            <div className="text-sm text-[var(--ink-70)] mb-1">Network</div>
            <div className="text-2xl font-bold">Base</div>
            <div className="text-[10px] text-[var(--ink-50)] font-mono mt-1">Chain ID {CHAIN_CONFIG.chainId}</div>
          </div>
        </div>
      </div>

      {/* Session spending bar */}
      <div className="glass-card p-6 border border-[var(--line)]">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold">Session Budget</h3>
          <div className="flex items-center gap-4">
            <span className="text-sm text-[var(--ink-70)]">{agent.wallet?.spent?.toFixed(2) || "0.00"} / {agent.wallet?.sessionLimit || 0} USDC</span>
            <button 
              onClick={() => agent.resetSessionBudget()}
              className="text-[10px] uppercase font-bold text-[var(--accent-red)] hover:underline"
            >
              Reset Budget
            </button>
          </div>
        </div>
        <div className="h-3 bg-black/10 rounded-full overflow-hidden">
          <motion.div
            className={`h-full rounded-full transition-all ${
              agent.wallet.spent / agent.wallet.sessionLimit > 0.8 ? "bg-red-500" :
              agent.wallet.spent / agent.wallet.sessionLimit > 0.5 ? "bg-amber-500" : "bg-green-500"
            }`}
            style={{ width: `${Math.min((agent.wallet.spent / agent.wallet.sessionLimit) * 100, 100)}%` }}
            layout
          />
        </div>
      </div>

      {/* Limit Controls */}
      <div className="glass-card p-6 border border-[var(--line)] bg-black/5">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Lock size={18} />
            Indestructible Spending Guardrails
        </h3>
        <p className="text-sm text-[var(--ink-70)] mb-6">
            As the creator, you enforce the strict rules this agent must follow. 
            <strong>Even if the agent is hacked</strong>, it literally cannot spend more than these amounts.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold text-[var(--ink-50)]">Session Limit (USDC)</label>
                <div className="flex items-center gap-2">
                    <input 
                      type="number" 
                      value={agent.wallet.sessionLimit}
                      onChange={(e) => agent.updateLimits(Number(e.target.value), agent.wallet.transactionLimit)}
                      className="bg-white border border-[var(--line)] p-2 rounded w-full font-mono text-lg focus:outline-none focus:border-[var(--accent-red)]"
                    />
                </div>
            </div>
            <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold text-[var(--ink-50)]">Transaction Limit (USDC)</label>
                <div className="flex items-center gap-2">
                    <input 
                      type="number" 
                      value={agent.wallet.transactionLimit}
                      onChange={(e) => agent.updateLimits(agent.wallet.sessionLimit, Number(e.target.value))}
                      className="bg-white border border-[var(--line)] p-2 rounded w-full font-mono text-lg focus:outline-none focus:border-[var(--accent-red)]"
                    />
                </div>
            </div>
        </div>
        <div className="mt-4 text-[10px] text-[var(--ink-50)] italic">
            * Changes are cryptographically signed by your creator wallet and pushed to the Base L2 registry.
        </div>
      </div>

      <div className="glass-card p-6 border border-[var(--line)]">
        <h3 className="text-xl font-semibold mb-4">Transaction History ({agent.wallet.transactions.length})</h3>
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {agent.wallet.transactions.map((tx) => (
            <div key={tx.id} className="flex items-center justify-between p-3 border border-[var(--line)] rounded hover:bg-black/5 transition-colors">
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${
                  tx.status === "complete" ? "bg-green-500" : tx.status === "pending" ? "bg-amber-500" : "bg-red-500"
                }`} />
                <div>
                  <div className="text-sm font-medium">{tx.description}</div>
                  <div className="text-xs text-[var(--ink-50)] mt-0.5 flex items-center gap-2">
                    <span>{formatDistanceToNow(new Date(tx.timestamp), { addSuffix: true })}</span>
                    <span className="font-mono bg-black/5 px-1.5 py-0.5 rounded">{tx.type}</span>
                  </div>
                </div>
              </div>
              <div className={`text-lg font-bold ${tx.amount > 0 ? "text-green-600" : "text-red-600"}`}>
                {tx.amount > 0 ? "+" : ""}{tx.amount?.toFixed(2) || "0.00"} USDC
              </div>
            </div>
          ))}
          {agent.wallet.transactions.length === 0 && (
            <div className="text-center py-8 text-[var(--ink-50)]">No transactions yet</div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function InsuranceTab() {
  const agent = useAgentStore();

  return (
    <motion.div key="insurance" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-6">
      {agent.insurance ? (
        <>
          {/* Insurance Overview */}
          <div className="glass-card p-6 border border-[var(--line)]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold">Encrypted State Insurance</h3>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-xs font-semibold text-green-600 uppercase tracking-wide">Active</span>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-sm text-[var(--ink-70)] mb-1">Backups Stored</div>
                <div className="text-2xl font-bold">{agent.insurance.backups?.length || 0}</div>
                {!agent.insurance.isPremium && (
                  <div className="text-[10px] text-[var(--accent-red)] font-semibold mt-1">Limit: 2 backups</div>
                )}
              </div>
              <div>
                <div className="text-sm text-[var(--ink-70)] mb-1">Total Storage Cost</div>
                <div className="text-2xl font-bold">{agent.insurance?.totalBackupCost?.toFixed(2) || "0.00"} USDC</div>
              </div>
              <div>
                <div className="text-sm text-[var(--ink-70)] mb-1">Plan</div>
                <div className="text-sm font-bold">{agent.insurance.isPremium ? "Premium (Infinite)" : "Standard (Max 2)"}</div>
                {!agent.insurance.isPremium && agent.state.status === "alive" && (
                  <button 
                    onClick={() => agent.unlockPremium()}
                    className="text-[10px] bg-[var(--accent-crimson)] text-white px-2 py-0.5 rounded font-semibold mt-1 hover:opacity-90"
                  >
                    Unlock Infinite ($10)
                  </button>
                )}
              </div>
              <div>
                <div className="text-sm text-[var(--ink-70)] mb-1">Encryption</div>
                <div className="text-sm font-semibold font-mono">Impenetrable</div>
                <div className="text-[10px] text-[var(--ink-50)] font-mono mt-1">{agent.insurance.encryptionKey.slice(0, 10)}...</div>
              </div>
            </div>

            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded text-sm text-green-800">
              <strong>How it works:</strong> Agent pays exactly 1.00 USDC to explicitly pin encrypted state snapshots forever to IPFS.
              If destroyed — the creator uses their connected wallet to trigger a <strong>free read</strong>.
              (Exceeding 2 backups requires a one-time 10 USDC network upgrade).
            </div>
          </div>

          {/* Backups */}
          <div className="glass-card p-6 border border-[var(--line)]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold">Encrypted Backups on IPFS ({agent.insurance.backups?.length || 0})</h3>
              <button
                onClick={() => agent.backupState()}
                disabled={agent.state.status !== "alive"}
                className="px-3 py-1.5 bg-[var(--accent-crimson)] text-white text-sm font-semibold rounded hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
              >
                <HardDrive size={14} />
                Backup Now
              </button>
            </div>
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {agent.insurance.backups.map((backup) => (
                <div key={backup.id} className="flex items-start justify-between p-4 border border-[var(--line)] rounded hover:bg-black/5 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className={`mt-1 ${
                      backup.status === "stored" ? "text-green-500" :
                      backup.status === "restored" ? "text-blue-500" :
                      backup.status === "corrupted" ? "text-red-500" :
                      "text-amber-500"
                    }`}>
                      {backup.status === "stored" ? <Lock size={18} /> :
                       backup.status === "restored" ? <CheckCircle size={18} /> :
                       backup.status === "corrupted" ? <AlertCircle size={18} /> :
                       <Clock size={18} className="animate-pulse" />}
                    </div>
                    <div>
                      <div className="text-sm font-mono font-medium">{backup.ipfsCid.slice(0, 20)}...{backup.ipfsCid.slice(-6)}</div>
                      <div className="text-xs text-[var(--ink-50)] mt-1">
                        {(backup.sizeBytes / 1024)?.toFixed(1) || "0.0"} KB • {formatDistanceToNow(new Date(backup.timestamp), { addSuffix: true })}
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`text-xs uppercase tracking-wide px-2 py-0.5 rounded font-semibold ${
                          backup.status === "stored" ? "bg-green-100 text-green-700" :
                          backup.status === "restored" ? "bg-blue-100 text-blue-700" :
                          backup.status === "corrupted" ? "bg-red-100 text-red-700" :
                          "bg-amber-100 text-amber-700"
                        }`}>
                          {backup.status}
                        </span>
                        {backup.restoredAt && (
                          <span className="text-[10px] text-[var(--ink-50)]">
                            Restored {formatDistanceToNow(new Date(backup.restoredAt), { addSuffix: true })}
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-[var(--ink-50)] font-mono mt-1">
                        Hash: {backup.encryptedHash.slice(0, 24)}...
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-red-600">-{backup.cost?.toFixed(2) || "0.00"} USDC</div>
                    <a
                      href={`${CHAIN_CONFIG.ipfsGateway}/${backup.ipfsCid}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-[var(--accent-red)] hover:underline flex items-center gap-1 mt-1 justify-end"
                    >
                      IPFS <ExternalLink size={10} />
                    </a>
                  </div>
                </div>
              ))}
              {agent.insurance.backups.length === 0 && (
                <div className="text-center py-8 text-[var(--ink-50)]">
                  No backups yet. Click &quot;Backup Now&quot; to store encrypted state on IPFS.
                </div>
              )}
            </div>
          </div>

          {/* Recovery History */}
          {agent.claims.length > 0 && (
            <div className="glass-card p-6 border border-[var(--line)]">
              <h3 className="text-xl font-semibold mb-4">Recovery History ({agent.claims.length})</h3>
              <div className="space-y-2">
                {agent.claims.map((claim) => (
                  <div key={claim.id} className="flex items-start justify-between p-4 border border-[var(--line)] rounded hover:bg-black/5 transition-colors">
                    <div className="flex items-start gap-3">
                      {claim.status === "restored" ? (
                        <CheckCircle className="text-green-500 flex-shrink-0 mt-1" size={20} />
                      ) : claim.status === "recovering" ? (
                        <Clock className="text-amber-500 flex-shrink-0 mt-1 animate-pulse" size={20} />
                      ) : claim.status === "failed" ? (
                        <AlertCircle className="text-red-500 flex-shrink-0 mt-1" size={20} />
                      ) : (
                        <Clock className="text-amber-500 flex-shrink-0 mt-1" size={20} />
                      )}
                      <div>
                        <div className="text-sm font-medium">
                          State Recovery — {claim.reason.replace(/_/g, " ")}
                        </div>
                        <div className="text-xs text-[var(--ink-50)] mt-1 font-mono">
                          From: {claim.ipfsCid.slice(0, 16)}...
                        </div>
                        <div className="text-xs text-[var(--ink-50)] mt-1">
                          {formatDistanceToNow(new Date(claim.timestamp), { addSuffix: true })}
                        </div>
                        {claim.restoredState && (
                          <div className="text-xs text-green-600 mt-1">{claim.restoredState}</div>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          <span className={`text-xs uppercase tracking-wide px-2 py-0.5 rounded font-semibold ${
                            claim.status === "restored" ? "bg-green-100 text-green-700" :
                            claim.status === "failed" ? "bg-red-100 text-red-700" :
                            "bg-amber-100 text-amber-700"
                          }`}>
                            {claim.status}
                          </span>
                          <span className="text-[10px] text-green-600 font-semibold">(FREE — read from IPFS)</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="glass-card p-12 border border-[var(--line)] text-center">
          <Shield className="mx-auto mb-4 text-[var(--ink-50)]" size={48} />
          <h3 className="text-xl font-semibold mb-2">No Insurance Active</h3>
          <p className="text-[var(--ink-70)] mb-2 max-w-md mx-auto">
            Activate insurance to enable encrypted state backups on IPFS.
            The agent pays to write, and recovers for free.
          </p>
          <p className="text-xs text-[var(--ink-50)] mb-6">
            Without insurance, the creator wallet can still revive the agent — but memory will be lost.
          </p>
          <button
            onClick={() => agent.activateInsurance()}
            disabled={agent.state.status !== "alive"}
            className="px-6 py-3 bg-[var(--accent-crimson)] text-white font-semibold rounded hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Activate Insurance (Free — You Pay Per Backup)
          </button>
        </div>
      )}
    </motion.div>
  );
}

function ActionsTab() {
  const agent = useAgentStore();

  return (
    <motion.div key="actions" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
      className="glass-card p-6 border border-[var(--line)]">
      <h3 className="text-xl font-semibold mb-4">All Actions ({agent.actions.length})</h3>
      <div className="space-y-2 max-h-[600px] overflow-y-auto">
        {agent.actions.map((action) => (
          <div key={action.id} className="flex items-start gap-3 p-3 border border-[var(--line)] rounded hover:bg-black/5 transition-colors">
            {action.success ? (
              <CheckCircle className="text-green-500 flex-shrink-0 mt-0.5" size={18} />
            ) : (
              <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={18} />
            )}
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium">{action.details}</div>
              <div className="text-xs text-[var(--ink-50)] mt-1">
                {new Date(action.timestamp).toLocaleString()} ({formatDistanceToNow(new Date(action.timestamp), { addSuffix: true })})
              </div>
            </div>
            <span className="text-xs uppercase tracking-wide text-[var(--ink-50)] px-2 py-1 bg-black/5 rounded whitespace-nowrap">
              {action.type.replace(/_/g, " ")}
            </span>
          </div>
        ))}
        {agent.actions.length === 0 && (
          <div className="text-center py-12 text-[var(--ink-50)]">
            No actions logged yet.
          </div>
        )}
      </div>
    </motion.div>
  );
}

function NetworkTab() {
  const agent = useAgentStore();

  return (
    <motion.div key="network" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-6">
      <div className="glass-card p-8 border border-[var(--line)] bg-[var(--ink)] text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--accent-red)] opacity-5 blur-[100px] rounded-full -mr-20 -mt-20" />
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-2xl font-light tracking-tight flex items-center gap-3">
              <Globe className="text-[var(--accent-red)]" size={24} />
              Global <span className="font-bold">Agent Ledger</span>
            </h3>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-white/5 py-1.5 px-3 rounded-full border border-white/10">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[10px] tracking-widest uppercase font-bold opacity-60">Node Pulse: Nominal</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
                <div className="text-[10px] uppercase tracking-widest opacity-40 mb-3">Your Wallet Identity</div>
                <div className="text-xl font-mono text-[var(--accent-red)] mb-1">
                  0x742d...bD18
                </div>
                <div className="text-[11px] opacity-60">Connected to Sovereign OS Registry (Base Mainnet)</div>
              </div>
              
              <div className="p-4 bg-white/5 border border-white/10 rounded-xl relative overflow-hidden group">
                <div className="absolute inset-0 bg-green-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="text-[10px] uppercase tracking-widest opacity-40 mb-3">Live Economy Role</div>
                <div className="text-xl font-bold mb-1">x402 Service Provider</div>
                <div className="text-[11px] opacity-60">Providing crypto-validation services to 12.4k peers</div>
              </div>
            </div>

            <div className="bg-black/80 border border-white/10 rounded-xl p-4 font-mono text-[10px] overflow-hidden relative">
               <div className="absolute top-0 left-0 w-full h-1 bg-[var(--accent-red)] animate-pulse" />
               <div className="text-green-500 mb-2 flex justify-between items-center">
                  <span>LIVE TRAFFIC ANALYTICS</span>
                  <Activity size={12} className="animate-pulse" />
               </div>
               <div className="space-y-1.5 opacity-80">
                  <div className="flex justify-between">
                     <span className="text-white/40">RX_THROUGHPUT</span>
                     <span className="text-green-400">12.4 GB/s</span>
                  </div>
                  <div className="flex justify-between">
                     <span className="text-white/40">TX_BACKUPS</span>
                     <span className="text-green-400">841 snaps/min</span>
                  </div>
                  <div className="flex justify-between">
                     <span className="text-white/40">CONSENSUS_ROUNDS</span>
                     <span className="text-green-400">Stable (0.2s)</span>
                  </div>
                  <div className="mt-4 pt-3 border-t border-white/10 text-[9px] text-white/30 italic">
                     * Agents are currently operating at peak efficiency across the Base L2 cluster.
                  </div>
               </div>
            </div>
          </div>
        </div>
      </div>

      <div className="glass-card p-6 border border-[var(--line)]">
        <h3 className="text-xl font-semibold mb-6 flex items-center justify-between">
          <span>Global Network Activity</span>
          <span className="text-xs font-mono text-[var(--ink-50)]">Total Network Backups: 1.2M+</span>
        </h3>
        
        <div className="space-y-3">
          {agent.networkEvents.map((event, i) => (
            <motion.div 
                key={event.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center justify-between p-4 border border-[var(--line)] rounded-xl hover:bg-black/5 transition-colors group"
            >
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  event.type === "revenue" ? "bg-green-100 text-green-600" :
                  event.type === "blocked" ? "bg-red-100 text-red-600" :
                  event.type === "storage" ? "bg-blue-100 text-blue-600" :
                  "bg-gray-100 text-gray-600"
                }`}>
                  {event.type === "revenue" ? <DollarSign size={18} /> :
                   event.type === "blocked" ? <Shield size={18} /> :
                   event.type === "storage" ? <HardDrive size={18} /> :
                   <Activity size={18} />}
                </div>
                <div>
                  <div className="text-sm font-semibold text-[var(--ink)]">{event.message}</div>
                  <div className="text-[10px] text-[var(--ink-50)] mt-0.5 flex items-center gap-2">
                    <span className="font-mono">{formatDistanceToNow(new Date(event.timestamp), { addSuffix: true })}</span>
                    {event.peer && (
                       <span className="flex items-center gap-1">
                          • <span className="font-mono text-[var(--accent-red)]">Peer: {event.peer}</span>
                       </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-right">
                {event.amount && (
                  <div className="text-sm font-bold text-green-600">+{event.amount?.toFixed(2) || "0.00"} USDC</div>
                )}
                <div className="text-[9px] text-[var(--ink-50)] uppercase tracking-widest font-bold group-hover:text-[var(--accent-red)] transition-colors">
                    Verified by Base
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function ActionButton({ icon, label, description, onClick, disabled }: { 
  icon: React.ReactNode, 
  label: string, 
  description: string, 
  onClick: () => void,
  disabled?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex flex-col items-start p-4 border border-[var(--line)] rounded hover:bg-black/5 transition-all text-left group disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <div className="w-10 h-10 rounded-full bg-black/5 flex items-center justify-center mb-3 group-hover:bg-[var(--accent-red)] group-hover:text-white transition-colors">
        {icon}
      </div>
      <div className="font-semibold text-sm mb-1">{label}</div>
      <div className="text-xs text-[var(--ink-50)] leading-relaxed">{description}</div>
    </button>
  );
}

function MemoryTab() {
  const agent = useAgentStore();

  return (
    <motion.div key="memory" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-card p-6 border border-[var(--line)]">
          <div className="flex items-center gap-2 mb-4">
            <Brain size={20} />
            <h3 className="text-lg font-semibold">Conversations</h3>
            <span className="text-xs text-[var(--ink-50)] bg-black/5 px-2 py-0.5 rounded">
              {agent.state.memory.conversations.length}
            </span>
          </div>
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {agent.state.memory.conversations.map((conv, i) => (
              <div key={i} className={`text-sm p-3 border border-[var(--line)] rounded ${
                conv.includes("[CORRUPTED]") || conv.includes("[WIPED") ? "bg-red-50 border-red-200 text-red-700" : "bg-white/60"
              }`}>
                <span className="text-[var(--ink-50)] font-mono text-[10px] mr-2">#{i + 1}</span>
                {conv}
              </div>
            ))}
            {agent.state.memory.conversations.length === 0 && (
              <div className="text-center py-8 text-[var(--ink-50)] text-sm">No conversations stored</div>
            )}
          </div>
        </div>

        <div className="glass-card p-6 border border-[var(--line)]">
          <div className="flex items-center gap-2 mb-4">
            <Database size={20} />
            <h3 className="text-lg font-semibold">Learnings</h3>
            <span className="text-xs text-[var(--ink-50)] bg-black/5 px-2 py-0.5 rounded">
              {agent.state.memory.learnings.length}
            </span>
          </div>
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {agent.state.memory.learnings.map((learning, i) => (
              <div key={i} className={`text-sm p-3 border border-[var(--line)] rounded ${
                learning.includes("[DATA LOSS]") || learning.includes("[WIPED") ? "bg-red-50 border-red-200 text-red-700" : "bg-white/60"
              }`}>
                <span className="text-[var(--ink-50)] font-mono text-[10px] mr-2">#{i + 1}</span>
                {learning}
              </div>
            ))}
            {agent.state.memory.learnings.length === 0 && (
              <div className="text-center py-8 text-[var(--ink-50)] text-sm">No learnings stored</div>
            )}
          </div>
        </div>
      </div>

      {/* Preferences */}
      <div className="glass-card p-6 border border-[var(--line)]">
        <h3 className="text-lg font-semibold mb-4">Agent Preferences</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {Object.entries(agent.state.memory.preferences).map(([key, value]) => (
            <div key={key} className="p-3 border border-[var(--line)] rounded">
              <div className="text-[10px] uppercase tracking-wide text-[var(--ink-50)] mb-1 font-mono">{key}</div>
              <div className="text-sm font-semibold">
                {typeof value === "boolean" ? (value ? "Enabled" : "Disabled") : String(value)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Creator Wallet */}
      <div className="glass-card p-6 border border-[var(--line)]">
        <h3 className="text-lg font-semibold mb-4">Creator Wallet (Revival Authority)</h3>
        <div className="flex items-center gap-4 p-4 bg-amber-50 border border-amber-200 rounded">
          <Lock size={24} className="text-amber-600 flex-shrink-0" />
          <div>
            <div className="font-mono text-sm font-semibold">{agent.state.creatorWallet}</div>
            <div className="text-xs text-amber-700 mt-1">
              This wallet always retains the right to revive the agent, regardless of destruction, corruption, or hack.
              The agent&apos;s identity is bound to this wallet on-chain.
            </div>
          </div>
          <a
            href={`${CHAIN_CONFIG.blockExplorer}/address/${agent.state.creatorWallet}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-amber-600 hover:text-amber-800 flex-shrink-0"
          >
            <ExternalLink size={16} />
          </a>
        </div>
      </div>
    </motion.div>
  );
}

function SkillsTab() {
  const agent = useAgentStore();

  const getSkillIcon = (type: string) => {
    switch (type) {
      case "marketing": return <Twitter size={20} />;
      case "privacy": return <ShieldCheck size={20} />;
      case "guardian": return <Shield size={20} />;
      case "swarm": return <Users size={20} />;
      case "eternal": return <Infinity size={20} />;
      default: return <Zap size={20} />;
    }
  };

  return (
    <motion.div key="skills" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-6">
      <div className="glass-card p-8 border border-[var(--line)] bg-gradient-to-br from-[var(--bg-paper)] to-black/5">
        <div className="max-w-3xl">
          <h2 className="text-3xl font-light tracking-tight mb-4 flex items-center gap-3">
             <Layers className="text-[var(--accent-red)]" size={32} />
             Protocol <span className="font-bold">Skills & Intelligence</span>
          </h2>
          <p className="text-[var(--ink-70)] text-lg mb-8 leading-relaxed">
            Acquire and activate advanced autonomous capabilities. Each skill operates as a sovereign subroutine, 
            executing logic independently when conditions are met or manually triggered.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Rollback to Health - Special Coverage */}
          <div className="glass-card p-6 border-2 border-[var(--accent-red)]/20 bg-red-50/10">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center text-red-600">
                <Undo2 size={24} />
              </div>
              <div className="px-2 py-1 bg-green-100 text-green-700 text-[10px] font-bold uppercase tracking-widest rounded">
                Always Active
              </div>
            </div>
            <h4 className="text-lg font-bold mb-2">Rollback-to-Health</h4>
            <p className="text-xs text-[var(--ink-70)] leading-relaxed mb-4">
              State-Corruption Coverage: If the agent logic becomes corrupted, it automatically rolls back to the last verified IPFS state.
            </p>
            <div className="text-[10px] font-mono text-red-600/60 uppercase font-bold tracking-tighter">
              Protection Level: Sovereign Max
            </div>
          </div>

          {agent.skills.map((skill) => (
            <div key={skill.id} className={`glass-card p-6 border transition-all ${
              skill.active ? "border-[var(--line)] bg-white shadow-lg" : "border-dashed border-[var(--line)] opacity-60 grayscale"
            }`}>
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  skill.active ? "bg-black text-white" : "bg-black/5 text-[var(--ink-50)]"
                }`}>
                  {getSkillIcon(skill.type)}
                </div>
                <button
                  onClick={() => agent.toggleSkill(skill.type)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                    skill.active ? "bg-green-500" : "bg-gray-200"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      skill.active ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
              <h4 className="text-lg font-bold mb-2">{skill.name}</h4>
              <p className="text-xs text-[var(--ink-70)] leading-relaxed mb-6">
                {skill.description}
              </p>
              
              <div className="flex items-center gap-2">
                <button
                  disabled={!skill.active || agent.state.status !== "alive"}
                  onClick={() => agent.triggerSkill(skill.type)}
                  className="flex-1 py-2 bg-black text-white text-[10px] font-bold uppercase tracking-widest rounded hover:bg-gray-800 disabled:opacity-30 transition-all"
                >
                  Trigger Mission
                </button>
                {skill.config && (
                  <button className="p-2 border border-[var(--line)] rounded hover:bg-black/5 text-[var(--ink-50)]">
                    <Database size={14} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="p-6 bg-black/5 rounded-xl border border-[var(--line)] flex items-center gap-4">
         <div className="w-10 h-10 rounded-full bg-[var(--accent-red)] flex items-center justify-center text-white flex-shrink-0 animate-pulse-glow">
            <Zap size={20} />
         </div>
         <div>
            <div className="text-sm font-bold uppercase tracking-widest text-[var(--ink)] mb-0.5">Autonomous Protocol Rule</div>
            <div className="text-xs text-[var(--ink-70)] leading-relaxed">
              When a skill is active, the agent can autonomously trigger it during its mission loop, provided it has the necessary USDC budget to cover execution fees.
            </div>
         </div>
      </div>
    </motion.div>
  );
}


