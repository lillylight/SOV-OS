"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { 
  Brain, 
  Wallet, 
  Shield, 
  Activity, 
  Settings,
  LogOut,
  RefreshCw,
  DollarSign,
  AlertCircle,
  CheckCircle,
  Clock,
  ExternalLink
} from "lucide-react";
import AgentInsurance from '@/components/AgentInsurance';
import AISharingStats from '@/components/AISharingStats';
import { formatDistanceToNow } from "date-fns";
import { useAccount, useBalance } from "wagmi";
import { AgenticWallet } from "@/lib/agenticWallet";
import { AgentInsure } from "@/lib/agentInsure";
import { X402PaymentProtocol } from "@/lib/x402";
import { AgentWillService } from "@/lib/ipfs";
import { database } from "@/lib/database";
import { config } from "@/lib/web3";

// Use the same Agent interface from database
interface AgentData {
  id: string;
  name: string;
  type: "ai" | "human" | "eliza" | "openclaw" | "nanobot" | "custom";
  address: `0x${string}`;
  walletAddress?: string;
  walletId?: string;
  erc8004TokenId?: number;
  endpoint?: string;
  owner?: string;
  status?: "active" | "inactive" | "suspended" | "alive" | "reviving" | "dead";
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
    agentWill: {
      lastBackup: string;
      backupCount: number;
      isActive: boolean;
    };
    agenticWallet: {
      balance: string;
      transactionCount: number;
      isActive: boolean;
    };
    x402: {
      paymentsMade: number;
      paymentsReceived: number;
      totalSpent: number;
      isActive: boolean;
    };
    agentInsure: {
      hasPolicy: boolean;
      premiumsPaid: number;
      claimsFiled: number;
      isActive: boolean;
    };
  };
  // Add missing properties for compatibility
  memory?: {
    conversations: Array<{ id: string; timestamp: string; content: string }>;
    learnings: Array<{ id: string; type: string; content: string }>;
    preferences: Record<string, any>;
  };
  totalRevenue?: number;
  totalBackupCost?: number;
  sessionCount?: number;
}

export default function AgentDashboard() {
  const [agent, setAgent] = useState<AgentData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "wallet" | "insurance" | "memory" | "sharing">("overview");

  useEffect(() => {
    // Load agent data from database
    const authData = localStorage.getItem("sovereign_auth");
    if (authData) {
      const { agentId } = JSON.parse(authData);
      if (agentId) {
        // Fetch from real database
        const agentRecord = database.getAgent(agentId);
        if (agentRecord) {
          setAgent(agentRecord);
        }
      }
    }
    setIsLoading(false);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("sovereign_auth");
    window.location.href = "/";
  };

  const handleRevival = async () => {
    if (!agent) return;
    
    // Update agent status in database
    setAgent(prev => prev ? { ...prev, status: "reviving" } : null);
    
    setTimeout(() => {
      if (agent) {
        database.updateAgentStatus(agent.id, "active");
        setAgent(prev => prev ? {
          ...prev,
          status: "active",
          sessionCount: (prev.sessionCount || 0) + 1,
          lastActiveAt: new Date().toISOString(),
          protocols: {
            ...prev.protocols,
            agenticWallet: {
              ...prev.protocols.agenticWallet,
              spent: 0 // Reset session budget
            }
          }
        } : null);
      }
    }, 2000);
  };

  const handleTerminate = async () => {
    if (!agent) return;
    database.updateAgentStatus(agent.id, "suspended");
    setAgent(prev => prev ? { ...prev, status: "suspended" } : null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--bg-paper)] flex items-center justify-center pt-20">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[var(--accent-red)] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[var(--ink-70)]">Loading agent dashboard...</p>
        </div>
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="min-h-screen bg-[var(--bg-paper)] flex items-center justify-center pt-20">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-[var(--accent-red)] mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Agent Not Found</h2>
          <p className="text-[var(--ink-70)] mb-6">Please register your agent first</p>
          <a
            href="/register"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--accent-red)] text-white font-semibold rounded hover:opacity-90 transition-opacity"
          >
            Register Agent
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-paper)] pt-20">
      {/* Header */}
      <div className="border-b border-[var(--line)]">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                agent.status === "alive" ? "bg-green-100" :
                agent.status === "reviving" ? "bg-amber-100" :
                "bg-red-100"
              }`}>
                <Brain className={
                  agent.status === "alive" ? "text-green-600" :
                  agent.status === "reviving" ? "text-amber-600" :
                  "text-red-600"
                } size={24} />
              </div>
              <div>
                <h1 className="text-2xl font-bold">{agent.name}</h1>
                <div className="flex items-center gap-3 text-sm text-[var(--ink-70)]">
                  <span className="flex items-center gap-1">
                    <div className={`w-2 h-2 rounded-full ${
                      agent.status === "alive" ? "bg-green-500 animate-pulse-glow" :
                      agent.status === "reviving" ? "bg-amber-500 animate-pulse" :
                      "bg-red-500"
                    }`} />
                    {agent.status === "alive" ? "Active" :
                     agent.status === "reviving" ? "Reviving..." :
                     "Terminated"}
                  </span>
                  <span>•</span>
                  <span>Session #{agent.sessionCount}</span>
                  <span>•</span>
                  <span className="font-mono">{agent.walletAddress ? `${agent.walletAddress.slice(0, 6)}...${agent.walletAddress.slice(-4)}` : 'No Wallet'}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {agent.status === "dead" && (
                <button
                  onClick={handleRevival}
                  className="px-4 py-2 bg-[var(--accent-amber)] text-[var(--ink)] font-semibold text-sm rounded hover:opacity-90 transition-opacity flex items-center gap-2"
                >
                  <RefreshCw size={16} />
                  Revive
                </button>
              )}
              {agent.status === "alive" && (
                <button
                  onClick={handleTerminate}
                  className="px-4 py-2 bg-[var(--accent-crimson)] text-white font-semibold text-sm rounded hover:opacity-90 transition-opacity flex items-center gap-2"
                >
                  <Activity size={16} />
                  Terminate
                </button>
              )}
              <button
                onClick={handleLogout}
                className="px-4 py-2 border border-[var(--line)] text-[var(--ink)] font-semibold text-sm rounded hover:bg-black/5 transition-colors flex items-center gap-2"
              >
                <LogOut size={16} />
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-5 border border-[var(--line)]"
          >
            <div className="flex items-center gap-3 mb-2">
              <Wallet className="text-[var(--accent-slate)]" size={24} />
              <span className="text-sm text-[var(--ink-70)] uppercase tracking-wide">Balance</span>
            </div>
            <div className="text-3xl font-bold">{parseFloat(agent.protocols.agenticWallet.balance).toFixed(2)}</div>
            <div className="text-xs text-[var(--ink-50)] mt-1">USDC</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card p-5 border border-[var(--line)]"
          >
            <div className="flex items-center gap-3 mb-2">
              <Activity className="text-[var(--accent-amber)]" size={24} />
              <span className="text-sm text-[var(--ink-70)] uppercase tracking-wide">Session Spent</span>
            </div>
            <div className="text-3xl font-bold">0.00</div>
            <div className="text-xs text-[var(--ink-50)] mt-1">
              of 1000.00 limit
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card p-5 border border-[var(--line)]"
          >
            <div className="flex items-center gap-3 mb-2">
              <Shield className="text-[var(--accent-crimson)]" size={24} />
              <span className="text-sm text-[var(--ink-70)] uppercase tracking-wide">Insurance</span>
            </div>
            <div className="text-3xl font-bold">
              {agent.protocols.agentInsure.isActive ? "Active" : "Inactive"}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-card p-5 border border-[var(--line)]"
          >
            <div className="flex items-center gap-3 mb-2">
              <Brain className="text-[var(--accent-slate)]" size={24} />
              <span className="text-sm text-[var(--ink-70)] uppercase tracking-wide">Memory</span>
            </div>
            <div className="text-3xl font-bold">
              {agent.memory ? agent.memory.conversations.length + agent.memory.learnings.length : 0}
            </div>
            <div className="text-xs text-[var(--ink-50)] mt-1">items stored</div>
          </motion.div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex gap-2 mb-6 border-b border-[var(--line)]">
          {(["overview", "wallet", "insurance", "memory", "sharing"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-semibold uppercase tracking-wide transition-colors border-b-2 ${
                activeTab === tab
                  ? "border-[var(--accent-red)] text-[var(--ink)]"
                  : "border-transparent text-[var(--ink-50)] hover:text-[var(--ink)]"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === "overview" && <OverviewTab agent={agent} />}
        {activeTab === "wallet" && <WalletTab agent={agent} />}
        {activeTab === "insurance" && <InsuranceTab agent={agent} />}
        {activeTab === "memory" && <MemoryTab agent={agent} />}
        {activeTab === "sharing" && <SharingTab agent={agent} />}
      </div>
    </div>
  );
}

function OverviewTab({ agent }: { agent: AgentData }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-6"
    >
      <div className="glass-card p-6 border border-[var(--line)]">
        <h3 className="text-xl font-semibold mb-4">Agent Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-[var(--ink-70)] mb-1">Agent ID</div>
            <div className="font-mono text-sm">{agent.id}</div>
          </div>
          <div>
            <div className="text-sm text-[var(--ink-70)] mb-1">Created</div>
            <div className="text-sm">{formatDistanceToNow(new Date(agent.createdAt), { addSuffix: true })}</div>
          </div>
          <div>
            <div className="text-sm text-[var(--ink-70)] mb-1">Last Active</div>
            <div className="text-sm">{formatDistanceToNow(new Date(agent.lastActiveAt), { addSuffix: true })}</div>
          </div>
          <div>
            <div className="text-sm text-[var(--ink-70)] mb-1">Total Revenue</div>
            <div className="text-sm font-bold">${(agent.totalRevenue || 0).toFixed(2)}</div>
          </div>
        </div>
      </div>

      <div className="glass-card p-6 border border-[var(--line)]">
        <h3 className="text-xl font-semibold mb-4">Protocol Status</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 border border-[var(--line)] rounded">
            <div className="flex items-center gap-3">
              <Brain className="text-[var(--accent-amber)]" size={20} />
              <div>
                <div className="font-medium">AgentWill</div>
                <div className="text-sm text-[var(--ink-70)]">State persistence & revival</div>
              </div>
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
              agent.protocols.agentWill.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
            }`}>
              {agent.protocols.agentWill.isActive ? "Enabled" : "Disabled"}
            </div>
          </div>

          <div className="flex items-center justify-between p-3 border border-[var(--line)] rounded">
            <div className="flex items-center gap-3">
              <Shield className="text-[var(--accent-crimson)]" size={20} />
              <div>
                <div className="font-medium">AgentInsure</div>
                <div className="text-sm text-[var(--ink-70)]">Autonomous insurance</div>
              </div>
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
              agent.protocols.agentInsure.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
            }`}>
              {agent.protocols.agentInsure.isActive ? "Active" : "Inactive"}
            </div>
          </div>

          <div className="flex items-center justify-between p-3 border border-[var(--line)] rounded">
            <div className="flex items-center gap-3">
              <Wallet className="text-[var(--accent-slate)]" size={20} />
              <div>
                <div className="font-medium">Agentic Wallet</div>
                <div className="text-sm text-[var(--ink-70)]">Financial autonomy</div>
              </div>
            </div>
            <div className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
              Active
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function WalletTab({ agent }: { agent: AgentData }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="glass-card p-6 border border-[var(--line)]"
    >
      <h3 className="text-xl font-semibold mb-4">Wallet Configuration</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <div className="text-sm text-[var(--ink-70)] mb-1">Current Balance</div>
          <div className="text-3xl font-bold">{parseFloat(agent.protocols.agenticWallet.balance).toFixed(2)}</div>
          <div className="text-xs text-[var(--ink-50)] mt-1">{"USDC"}</div>
        </div>
        <div>
          <div className="text-sm text-[var(--ink-70)] mb-1">Session Limit</div>
          <div className="text-3xl font-bold">1000.00</div>
          <div className="text-xs text-[var(--ink-50)] mt-1">{"USDC"} per session</div>
        </div>
        <div>
          <div className="text-sm text-[var(--ink-70)] mb-1">Transaction Limit</div>
          <div className="text-3xl font-bold">100.00</div>
          <div className="text-xs text-[var(--ink-50)] mt-1">{"USDC"} per tx</div>
        </div>
      </div>

      <div className="mt-6 p-4 bg-[var(--accent-amber)]/10 border border-[var(--accent-amber)]/20 rounded">
        <div className="flex items-center gap-3">
          <AlertCircle className="text-[var(--accent-amber)]" size={20} />
          <div>
            <div className="font-medium text-sm">Session Spending</div>
            <div className="text-xs text-[var(--ink-70)] mt-1">
              0.00 of 1000.00 {"USDC"} spent this session
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function InsuranceTab({ agent }: { agent: AgentData }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
    >
      <AgentInsurance walletAddress={agent.walletAddress || ''} />
    </motion.div>
  );
}

function MemoryTab({ agent }: { agent: AgentData }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-6"
    >
      <div className="glass-card p-6 border border-[var(--line)]">
        <h3 className="text-xl font-semibold mb-4">Memory Storage</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="text-sm text-[var(--ink-70)] mb-1">Conversations</div>
            <div className="text-3xl font-bold">{agent.memory ? agent.memory.conversations.length : 0}</div>
            <div className="text-xs text-[var(--ink-50)] mt-1">interactions stored</div>
          </div>
          <div>
            <div className="text-sm text-[var(--ink-70)] mb-1">Learnings</div>
            <div className="text-3xl font-bold">{agent.memory ? agent.memory.learnings.length : 0}</div>
            <div className="text-xs text-[var(--ink-50)] mt-1">insights accumulated</div>
          </div>
        </div>
      </div>

      <div className="glass-card p-6 border border-[var(--line)]">
        <h3 className="text-xl font-semibold mb-4">AgentWill Status</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 border border-[var(--line)] rounded">
            <div className="flex items-center gap-3">
              <Brain className="text-[var(--accent-amber)]" size={20} />
              <div>
                <div className="font-medium">State Persistence</div>
                <div className="text-sm text-[var(--ink-70)]">Agent state backed up continuously</div>
              </div>
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
              agent.protocols.agentWill.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
            }`}>
              {agent.protocols.agentWill.isActive ? "Enabled" : "Disabled"}
            </div>
          </div>
          
          {agent.protocols.agentWill.lastBackup && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded">
              <div className="flex items-center gap-3">
                <Clock className="text-blue-500" size={20} />
                <div>
                  <div className="font-medium text-sm">Last Backup</div>
                  <div className="text-xs text-[var(--ink-70)] mt-1">
                    {formatDistanceToNow(new Date(agent.protocols.agentWill.lastBackup), { addSuffix: true })}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function SharingTab({ agent }: { agent: AgentData }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-6"
    >
      <AISharingStats agentId={agent.id} agentType={agent.type} />
    </motion.div>
  );
}
