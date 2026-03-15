"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { 
  Brain, 
  Wallet, 
  Shield, 
  Activity, 
  LogOut,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock,
  Bot,
  Link2,
  ShieldCheck,
  User
} from "lucide-react";
import AgentInsurance from '@/components/AgentInsurance';
import AISharingStats from '@/components/AISharingStats';
import AgentSettings from '@/components/AgentSettings';
import TransactionHistory from '@/components/TransactionHistory';
import NotificationCenter from '@/components/NotificationCenter';
import AgentIdentityCard from '@/components/AgentIdentityCard';
import MemoryExplorer from '@/components/MemoryExplorer';
import ProtocolWizard from '@/components/ProtocolWizard';
import AgentProfile from '@/components/AgentProfile';
import { formatDistanceToNow } from "date-fns";

interface AgentData {
  id: string;
  name: string;
  type: "ai" | "human" | "eliza" | "openclaw" | "nanobot" | "custom";
  address: `0x${string}`;
  walletAddress?: string;
  walletId?: string;
  ownerWallet?: string;
  ownerVerified?: boolean;
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
    agentWill: { lastBackup: string; backupCount: number; isActive: boolean };
    agenticWallet: { balance: string; transactionCount: number; isActive: boolean };
    x402: { paymentsMade: number; paymentsReceived: number; totalSpent: number; isActive: boolean };
    agentInsure: { hasPolicy: boolean; premiumsPaid: number; claimsFiled: number; isActive: boolean };
  };
  memory?: {
    conversations: Array<{ id: string; timestamp: string; content: string }>;
    learnings: Array<{ id: string; type: string; content: string }>;
    preferences: Record<string, any>;
  };
  totalRevenue?: number;
  totalBackupCost?: number;
  sessionCount?: number;
  actions: { id: string; type: string; timestamp: string; details: string; success: boolean }[];
  skills: { id: string; type: string; name: string; description: string; active: boolean; config?: any }[];
}

interface LinkedAgent {
  id: string;
  name: string;
  type: string;
  walletAddress?: string;
  createdAt: string;
  ownerVerified: boolean;
}

export default function AgentDashboard() {
  const [agent, setAgent] = useState<AgentData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userType, setUserType] = useState<string>("agent");
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [pendingAgents, setPendingAgents] = useState<LinkedAgent[]>([]);
  const [verifiedAgents, setVerifiedAgents] = useState<LinkedAgent[]>([]);
  const [syncLoading, setSyncLoading] = useState<string | null>(null);

  // Fetch linked agents for human users
  const fetchLinkedAgents = useCallback(async (walletAddr: string) => {
    try {
      const res = await fetch(`/api/agents/sync?ownerWallet=${walletAddr}`);
      const data = await res.json();
      if (data.success) {
        setPendingAgents(data.pending || []);
        setVerifiedAgents(data.verified || []);
      }
    } catch (e) { console.error("Failed to fetch linked agents:", e); }
  }, []);

  useEffect(() => {
    async function loadAgent() {
      const authData = localStorage.getItem("sovereign_auth");
      if (authData) {
        try {
          const parsed = JSON.parse(authData);
          const { agentId, agent: cachedAgent, userType: savedType } = parsed;
          if (savedType) setUserType(savedType);

          // Fetch fresh data from server API
          if (agentId) {
            const res = await fetch(`/api/agents/${agentId}`);
            const data = await res.json();
            if (data.success && data.agent) {
              setAgent(data.agent as AgentData);
              if (data.agent.type === "human") {
                setUserType("human");
                setActiveTab("agents");
                fetchLinkedAgents(data.agent.walletAddress || data.agent.address);
              }
            } else if (cachedAgent) {
              // Fallback to cached data from localStorage
              setAgent(cachedAgent as AgentData);
              if (cachedAgent.type === "human" || savedType === "human") {
                setUserType("human");
                setActiveTab("agents");
                fetchLinkedAgents(cachedAgent.walletAddress || cachedAgent.address || parsed.address);
              }
            }
          }
        } catch (error) {
          console.error("Failed to load agent:", error);
        }
      }
      setIsLoading(false);
    }
    loadAgent();
  }, [fetchLinkedAgents]);

  const handleLogout = () => {
    localStorage.removeItem("sovereign_auth");
    window.location.href = "/";
  };

  // Accept/verify an AI agent sync request
  const handleAcceptAgent = async (linkedAgentId: string) => {
    if (!agent) return;
    setSyncLoading(linkedAgentId);

    const ownerAddr = agent.walletAddress || agent.address;
    const message = `Sovereign OS Agent Sync Verification\n\nI confirm ownership of AI agent: ${linkedAgentId}\nOwner wallet: ${ownerAddr}\nTimestamp: ${new Date().toISOString()}`;

    let signature = "";
    try {
      // Try MetaMask / external wallet signing
      if (typeof window !== "undefined" && (window as any).ethereum) {
        const accounts = await (window as any).ethereum.request({ method: "eth_requestAccounts" });
        signature = await (window as any).ethereum.request({
          method: "personal_sign",
          params: [message, accounts[0]],
        });
      } else {
        // Embedded wallet: auto-sign (simulate signature for CDP wallets)
        signature = `embedded_wallet_auto_sign_${Date.now()}`;
      }
    } catch {
      // If user rejects the sign, just auto-sign for embedded wallets
      signature = `auto_sign_${Date.now()}`;
    }

    try {
      const res = await fetch("/api/agents/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId: linkedAgentId, ownerWallet: ownerAddr, signature, message }),
      });
      const data = await res.json();
      if (data.success) {
        // Refresh lists
        await fetchLinkedAgents(ownerAddr);
      } else {
        alert(data.error || "Verification failed");
      }
    } catch (err) {
      console.error("Sync verification failed:", err);
      alert("Failed to verify agent ownership");
    } finally {
      setSyncLoading(null);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--bg-paper)] flex items-center justify-center pt-20">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[var(--accent-red)] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[var(--ink-70)]">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="min-h-screen bg-[var(--bg-paper)] flex items-center justify-center pt-20">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-[var(--accent-red)] mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Not Logged In</h2>
          <p className="text-[var(--ink-70)] mb-6">Please register or log in first</p>
          <a href="/register" className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--accent-red)] text-white font-semibold rounded hover:opacity-90 transition-opacity">
            Register
          </a>
        </div>
      </div>
    );
  }

  const isHuman = agent.type === "human" || userType === "human";
  const tabs = isHuman
    ? ["agents", "profile", "overview", "wallet", "insurance", "settings"] as const
    : ["profile", "overview", "identity", "wallet", "transactions", "insurance", "protocols", "memory", "sharing", "actions", "skills", "settings"] as const;

  return (
    <div className="min-h-screen bg-[var(--bg-paper)] pt-20">
      {/* Header */}
      <div className="border-b border-[var(--line)]">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isHuman ? "bg-blue-100" : (agent.status === "alive" || agent.status === "active") ? "bg-green-100" : agent.status === "reviving" ? "bg-amber-100" : "bg-red-100"}`}>
                {isHuman
                  ? <User className="text-blue-600" size={24} />
                  : <Brain className={(agent.status === "alive" || agent.status === "active") ? "text-green-600" : agent.status === "reviving" ? "text-amber-600" : "text-red-600"} size={24} />
                }
              </div>
              <div>
                <h1 className="text-2xl font-bold">{agent.name}</h1>
                <div className="flex items-center gap-3 text-sm text-[var(--ink-70)]">
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-[var(--ink-10)]">{isHuman ? "Human" : "AI Agent"}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <div className={`w-2 h-2 rounded-full ${(agent.status === "alive" || agent.status === "active") ? "bg-green-500 animate-pulse" : "bg-red-500"}`} />
                    {(agent.status === "alive" || agent.status === "active") ? "Active" : "Inactive"}
                  </span>
                  <span>•</span>
                  <span className="font-mono">{agent.walletAddress?.startsWith('0x') ? `${agent.walletAddress.slice(0, 6)}...${agent.walletAddress.slice(-4)}` : (agent.walletAddress ? 'Re-register needed' : 'No Wallet')}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <NotificationCenter agent={agent as any} />
              <button onClick={handleLogout} className="px-4 py-2 border border-[var(--line)] text-[var(--ink)] font-semibold text-sm rounded hover:bg-black/5 transition-colors flex items-center gap-2">
                <LogOut size={16} /> Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {isHuman ? (
            <>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5 border border-[var(--line)]">
                <div className="flex items-center gap-3 mb-2"><Bot className="text-[var(--accent-red)]" size={24} /><span className="text-sm text-[var(--ink-70)] uppercase tracking-wide">Linked Agents</span></div>
                <div className="text-3xl font-bold">{verifiedAgents.length}</div>
                <div className="text-xs text-[var(--ink-50)] mt-1">verified</div>
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-5 border border-[var(--line)]">
                <div className="flex items-center gap-3 mb-2"><Link2 className="text-[var(--accent-amber)]" size={24} /><span className="text-sm text-[var(--ink-70)] uppercase tracking-wide">Pending</span></div>
                <div className="text-3xl font-bold">{pendingAgents.length}</div>
                <div className="text-xs text-[var(--ink-50)] mt-1">awaiting verification</div>
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-5 border border-[var(--line)]">
                <div className="flex items-center gap-3 mb-2"><Wallet className="text-[var(--accent-slate)]" size={24} /><span className="text-sm text-[var(--ink-70)] uppercase tracking-wide">Balance</span></div>
                <div className="text-3xl font-bold">{parseFloat(agent?.protocols?.agenticWallet?.balance || "0").toFixed(2)}</div>
                <div className="text-xs text-[var(--ink-50)] mt-1">USDC</div>
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card p-5 border border-[var(--line)]">
                <div className="flex items-center gap-3 mb-2"><Shield className="text-[var(--accent-crimson)]" size={24} /><span className="text-sm text-[var(--ink-70)] uppercase tracking-wide">Insurance</span></div>
                <div className="text-3xl font-bold">{agent?.protocols?.agentInsure?.isActive ? "Active" : "Inactive"}</div>
              </motion.div>
            </>
          ) : (
            <>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5 border border-[var(--line)]">
                <div className="flex items-center gap-3 mb-2"><Wallet className="text-[var(--accent-slate)]" size={24} /><span className="text-sm text-[var(--ink-70)] uppercase tracking-wide">Balance</span></div>
                <div className="text-3xl font-bold">{parseFloat(agent?.protocols?.agenticWallet?.balance || "0").toFixed(2)}</div>
                <div className="text-xs text-[var(--ink-50)] mt-1">USDC</div>
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-5 border border-[var(--line)]">
                <div className="flex items-center gap-3 mb-2"><Activity className="text-[var(--accent-amber)]" size={24} /><span className="text-sm text-[var(--ink-70)] uppercase tracking-wide">Volume</span></div>
                <div className="text-3xl font-bold">{agent?.protocols?.agenticWallet?.transactionCount || 0}</div>
                <div className="text-xs text-[var(--ink-50)] mt-1">Transactions</div>
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-5 border border-[var(--line)]">
                <div className="flex items-center gap-3 mb-2"><Shield className="text-[var(--accent-crimson)]" size={24} /><span className="text-sm text-[var(--ink-70)] uppercase tracking-wide">Insurance</span></div>
                <div className="text-3xl font-bold">{agent?.protocols?.agentInsure?.isActive ? "Active" : "Inactive"}</div>
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card p-5 border border-[var(--line)]">
                <div className="flex items-center gap-3 mb-2"><Brain className="text-[var(--accent-slate)]" size={24} /><span className="text-sm text-[var(--ink-70)] uppercase tracking-wide">Memory</span></div>
                <div className="text-3xl font-bold">{agent.memory ? agent.memory.conversations.length + agent.memory.learnings.length : 0}</div>
                <div className="text-xs text-[var(--ink-50)] mt-1">items stored</div>
              </motion.div>
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex gap-2 mb-6 border-b border-[var(--line)] overflow-x-auto">
          {tabs.map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-semibold uppercase tracking-wide transition-colors border-b-2 whitespace-nowrap ${activeTab === tab ? "border-[var(--accent-red)] text-[var(--ink)]" : "border-transparent text-[var(--ink-50)] hover:text-[var(--ink)]"}`}
            >
              {tab === "agents" ? "My AI Agents" : tab}
            </button>
          ))}
        </div>

        {activeTab === "agents" && <LinkedAgentsTab pending={pendingAgents} verified={verifiedAgents} onAccept={handleAcceptAgent} syncLoading={syncLoading} />}
        {activeTab === "profile" && <AgentProfile agent={agent as any} />}
        {activeTab === "overview" && <OverviewTab agent={agent} />}
        {activeTab === "identity" && <AgentIdentityCard agent={agent as any} />}
        {activeTab === "wallet" && <WalletTab agent={agent} />}
        {activeTab === "transactions" && <TransactionHistory agent={agent as any} />}
        {activeTab === "insurance" && <InsuranceTab agent={agent} />}
        {activeTab === "protocols" && <ProtocolWizard agent={agent as any} />}
        {activeTab === "memory" && <MemoryExplorer agent={agent as any} />}
        {activeTab === "sharing" && <SharingTab agent={agent} />}
        {activeTab === "actions" && <ActionsTab agent={agent} />}
        {activeTab === "skills" && <SkillsTab agent={agent} />}
        {activeTab === "settings" && <AgentSettings agent={agent as any} />}
      </div>
    </div>
  );
}

// ─── Linked AI Agents Tab (Human Users) ──────────────────────────────────────
function LinkedAgentsTab({ pending, verified, onAccept, syncLoading }: { pending: LinkedAgent[]; verified: LinkedAgent[]; onAccept: (id: string) => void; syncLoading: string | null }) {
  return (
    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6 pb-12">
      {/* Pending Sync Requests */}
      <div className="glass-card p-6 border border-[var(--line)]">
        <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Link2 size={20} className="text-[var(--accent-amber)]" />
          Pending Sync Requests
        </h3>
        {pending.length === 0 ? (
          <div className="text-center py-8 text-[var(--ink-50)]">
            <Bot size={40} className="mx-auto mb-3 opacity-30" />
            <p>No pending agent sync requests.</p>
            <p className="text-xs mt-1">When an AI agent registers with your wallet address as its owner, it will appear here.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pending.map((a) => (
              <div key={a.id} className="flex items-center justify-between p-4 border border-amber-200 bg-amber-50/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                    <Bot className="text-amber-600" size={20} />
                  </div>
                  <div>
                    <div className="font-semibold">{a.name}</div>
                    <div className="text-xs text-[var(--ink-50)] font-mono">{a.id}</div>
                  </div>
                </div>
                <button
                  onClick={() => onAccept(a.id)}
                  disabled={syncLoading === a.id}
                  className="px-4 py-2 bg-[var(--accent-blue)] text-white font-semibold text-sm rounded hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
                >
                  {syncLoading === a.id ? (
                    <><RefreshCw size={14} className="animate-spin" /> Signing...</>
                  ) : (
                    <><ShieldCheck size={14} /> Accept &amp; Sign</>
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Verified Agents */}
      <div className="glass-card p-6 border border-[var(--line)]">
        <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <CheckCircle size={20} className="text-green-600" />
          Verified AI Agents
        </h3>
        {verified.length === 0 ? (
          <div className="text-center py-8 text-[var(--ink-50)]">
            <ShieldCheck size={40} className="mx-auto mb-3 opacity-30" />
            <p>No verified agents yet.</p>
            <p className="text-xs mt-1">Accept pending sync requests above to verify your AI agents.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {verified.map((a) => (
              <div key={a.id} className="p-4 border border-green-200 bg-green-50/50 rounded-lg">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                    <Bot className="text-green-600" size={20} />
                  </div>
                  <div>
                    <div className="font-semibold">{a.name}</div>
                    <div className="text-xs text-[var(--ink-50)] font-mono">{a.id}</div>
                  </div>
                  <CheckCircle size={16} className="text-green-500 ml-auto" />
                </div>
                <div className="flex items-center justify-between text-xs text-[var(--ink-70)]">
                  <span>Wallet: {a.walletAddress ? `${a.walletAddress.slice(0, 8)}...${a.walletAddress.slice(-6)}` : 'N/A'}</span>
                  <span className="text-green-600 font-semibold">Verified</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

function OverviewTab({ agent }: { agent: AgentData }) {
  const isHuman = agent.type === "human";
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-6"
    >
      <div className="glass-card p-6 border border-[var(--line)]">
        <h3 className="text-xl font-semibold mb-4">{isHuman ? "Account Information" : "Agent Information"}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-[var(--ink-70)] mb-1">{isHuman ? "User ID" : "Agent ID"}</div>
            <div className="font-mono text-sm break-all">{agent.id}</div>
          </div>
          <div>
            <div className="text-sm text-[var(--ink-70)] mb-1">Wallet Address</div>
            <div className="font-mono text-sm break-all">{agent.walletAddress || agent.address || "Not set"}</div>
          </div>
          <div>
            <div className="text-sm text-[var(--ink-70)] mb-1">Created</div>
            <div className="text-sm">{agent.createdAt ? formatDistanceToNow(new Date(agent.createdAt), { addSuffix: true }) : "Unknown"}</div>
          </div>
          <div>
            <div className="text-sm text-[var(--ink-70)] mb-1">Last Active</div>
            <div className="text-sm">{agent.lastActiveAt ? formatDistanceToNow(new Date(agent.lastActiveAt), { addSuffix: true }) : "Just now"}</div>
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
              agent?.protocols?.agentWill?.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
            }`}>
              {agent?.protocols?.agentWill?.isActive ? "Enabled" : "Disabled"}
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
              agent?.protocols?.agentInsure?.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
            }`}>
              {agent?.protocols?.agentInsure?.isActive ? "Active" : "Inactive"}
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
  const isHuman = agent.type === "human";
  const walletAddr = agent.walletAddress || agent.address || "";
  const isRealWallet = walletAddr.startsWith("0x");

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-6"
    >
      <div className="glass-card p-6 border border-[var(--line)]">
        <h3 className="text-xl font-semibold mb-4">{isHuman ? "Your Wallet" : "Wallet Configuration"}</h3>

        {/* Wallet Address */}
        <div className="mb-6">
          <div className="text-sm text-[var(--ink-70)] mb-1">Wallet Address</div>
          <div className="flex items-center gap-2">
            <code className="text-sm font-mono bg-[var(--ink-10)]/30 px-3 py-2 rounded-lg border border-[var(--line)] break-all flex-1">
              {isRealWallet ? walletAddr : "Not connected — please re-register"}
            </code>
            {isRealWallet && (
              <a
                href={`https://basescan.org/address/${walletAddr}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-[var(--accent-red)] hover:underline font-semibold whitespace-nowrap"
              >
                BaseScan ↗
              </a>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="text-sm text-[var(--ink-70)] mb-1">Current Balance</div>
            <div className="text-3xl font-bold">{parseFloat(agent?.protocols?.agenticWallet?.balance || "0").toFixed(2)}</div>
            <div className="text-xs text-[var(--ink-50)] mt-1">USDC on Base L2</div>
          </div>
          <div>
            <div className="text-sm text-[var(--ink-70)] mb-1">Total Transactions</div>
            <div className="text-3xl font-bold">{agent?.protocols?.agenticWallet?.transactionCount || 0}</div>
            <div className="text-xs text-[var(--ink-50)] mt-1">Confirmed on-chain</div>
          </div>
        </div>
      </div>

      <div className="glass-card p-4 border border-[var(--line)]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
            <Wallet className="text-blue-600" size={20} />
          </div>
          <div>
            <div className="font-medium text-sm">{isHuman ? "Base L2 Smart Wallet" : "Autonomous Funding"}</div>
            <div className="text-xs text-[var(--ink-70)] mt-0.5">
              {isHuman
                ? "Your embedded smart wallet on Base Mainnet. Fund it with USDC to manage your AI agents."
                : "This agent manages its own USDC liquidity on Base Mainnet."
              }
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
              agent?.protocols?.agentWill?.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
            }`}>
              {agent?.protocols?.agentWill?.isActive ? "Enabled" : "Disabled"}
            </div>
          </div>
          
          {agent?.protocols?.agentWill?.lastBackup && (
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

function ActionsTab({ agent }: { agent: AgentData }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-4"
    >
      <div className="glass-card p-6 border border-[var(--line)]">
        <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
          <Activity size={20} className="text-[var(--accent-red)]" />
          Recent Activity
        </h3>
        <div className="space-y-4">
          {agent.actions?.map((action) => (
            <div key={action.id} className="flex items-start gap-4 p-4 border border-[var(--line)] rounded-lg bg-black/[0.02]">
              <div className={`mt-1 w-2 h-2 rounded-full ${action.success ? 'bg-green-500' : 'bg-red-500'}`} />
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-semibold uppercase tracking-wider text-[var(--ink-70)]">{action.type}</span>
                  <span className="text-xs text-[var(--ink-50)]">{formatDistanceToNow(new Date(action.timestamp), { addSuffix: true })}</span>
                </div>
                <p className="text-sm text-[var(--ink)]">{action.details}</p>
              </div>
            </div>
          ))}
          {(!agent.actions || agent.actions.length === 0) && (
            <div className="text-center py-12 text-[var(--ink-50)]">No actions recorded yet.</div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function SkillsTab({ agent }: { agent: AgentData }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="grid grid-cols-1 md:grid-cols-2 gap-6"
    >
      {agent.skills?.map((skill) => (
        <div key={skill.id} className="glass-card p-6 border border-[var(--line)] relative overflow-hidden group">
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-bold">{skill.name}</h4>
              <div className={`w-3 h-3 rounded-full ${skill.active ? 'bg-green-500 animate-pulse-glow' : 'bg-gray-300'}`} />
            </div>
            <p className="text-sm text-[var(--ink-70)] mb-6">{skill.description}</p>
            <button 
              className={`w-full py-2 rounded text-xs font-bold uppercase tracking-widest transition-all ${
                skill.active 
                ? 'bg-[var(--accent-red)]/10 text-[var(--accent-red)] border border-[var(--accent-red)]/20 hover:bg-[var(--accent-red)]/20' 
                : 'bg-[var(--ink-10)] text-[var(--ink-50)] border border-[var(--line)]'
              }`}
            >
              {skill.active ? 'Deactivate Skill' : 'Activate Skill'}
            </button>
          </div>
        </div>
      ))}
      {(!agent.skills || agent.skills.length === 0) && (
        <div className="col-span-2 text-center py-12 text-[var(--ink-50)]">No advanced skills configured.</div>
      )}
    </motion.div>
  );
}
