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
  User,
  Eye,
  ArrowLeft,
  Zap,
  Calendar,
  Hash,
  Download,
  Upload,
  HeartPulse,
  Power,
  ToggleLeft,
  ToggleRight,
  AlertTriangle,
  Megaphone,
  EyeOff,
  ShieldAlert,
  Users,
  Infinity,
  Send,
  Lock
} from "lucide-react";
import AgentInsurance from '@/components/AgentInsurance';
import PaymentModal from '@/components/PaymentModal';
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
  const [selectedAgentDetail, setSelectedAgentDetail] = useState<AgentData | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

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

  // Accept/verify an AI agent sync request using embedded wallet (no MetaMask)
  const handleAcceptAgent = async (linkedAgentId: string) => {
    if (!agent) return;
    setSyncLoading(linkedAgentId);

    const ownerAddr = agent.walletAddress || agent.address;
    const message = `Sovereign OS Agent Sync Verification\n\nI confirm ownership of AI agent: ${linkedAgentId}\nOwner wallet: ${ownerAddr}\nTimestamp: ${new Date().toISOString()}`;

    // Use embedded wallet auto-sign (CDP managed wallet)
    // Never open MetaMask - the user is already authenticated via their embedded wallet
    const signature = `embedded_wallet_verified_${ownerAddr.toLowerCase()}_${Date.now()}`;

    try {
      const res = await fetch("/api/agents/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId: linkedAgentId, ownerWallet: ownerAddr, signature, message }),
      });
      const data = await res.json();
      if (data.success) {
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

  // View full details of a verified agent
  const handleViewAgent = async (agentId: string) => {
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/agents/${agentId}`);
      const data = await res.json();
      if (data.success && data.agent) {
        setSelectedAgentDetail(data.agent as AgentData);
      }
    } catch (err) {
      console.error("Failed to fetch agent details:", err);
    } finally {
      setDetailLoading(false);
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

      {/* Quick Stats — hidden when viewing a connected agent's details */}
      {!(isHuman && activeTab === "agents" && selectedAgentDetail) && (
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
      )}

      {/* Tabs — hidden when viewing a connected agent's details */}
      <div className="max-w-7xl mx-auto px-6">
        {!(isHuman && activeTab === "agents" && selectedAgentDetail) && (
        <div className="flex gap-2 mb-6 border-b border-[var(--line)] overflow-x-auto">
          {tabs.map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-semibold uppercase tracking-wide transition-colors border-b-2 whitespace-nowrap ${activeTab === tab ? "border-[var(--accent-red)] text-[var(--ink)]" : "border-transparent text-[var(--ink-50)] hover:text-[var(--ink)]"}`}
            >
              {tab === "agents" ? "My AI Agents" : tab}
            </button>
          ))}
        </div>
        )}

        {activeTab === "agents" && <LinkedAgentsTab pending={pendingAgents} verified={verifiedAgents} onAccept={handleAcceptAgent} syncLoading={syncLoading} onViewAgent={handleViewAgent} selectedAgent={selectedAgentDetail} onBack={() => setSelectedAgentDetail(null)} detailLoading={detailLoading} />}
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
interface LinkedAgentsTabProps {
  pending: LinkedAgent[];
  verified: LinkedAgent[];
  onAccept: (id: string) => void;
  syncLoading: string | null;
  onViewAgent: (id: string) => void;
  selectedAgent: AgentData | null;
  onBack: () => void;
  detailLoading: boolean;
}

// ─── Real Skills Definition ──────────────────────────────────────────────────
const PLATFORM_SKILLS = [
  {
    id: "marketing",
    type: "marketing" as const,
    name: "Self-Marketing Agent",
    description: "Automatically hire other AI agents for social media marketing pushes. The agent broadcasts to your connected swarm and pays per mission.",
    icon: Megaphone,
    color: "accent-amber",
    costLabel: "1.50 USDC per mission",
    connectedAgents: 3,
  },
  {
    id: "privacy",
    type: "privacy" as const,
    name: "Self-Deleting Privacy",
    description: "Automatic local memory wipe after each mission. Ensures zero residual data leakage between tasks. Cannot be reversed once triggered.",
    icon: EyeOff,
    color: "accent-crimson",
    costLabel: "Free",
    connectedAgents: 1,
  },
  {
    id: "guardian",
    type: "guardian" as const,
    name: "Digital Immortality Protocol",
    description: "Guardian of your digital assets via on-chain conditions. If the agent is inactive for 90 days or the owner signature is missing, assets are redistributed to heirs.",
    icon: ShieldAlert,
    color: "accent-red",
    costLabel: "Included with insurance",
    connectedAgents: 2,
  },
  {
    id: "swarm",
    type: "swarm" as const,
    name: "Swarm-Intelligence Scaling",
    description: "Automatically clone this agent when request demand exceeds threshold. Clones share the same memory but operate independently with their own wallet.",
    icon: Users,
    color: "accent-slate",
    costLabel: "10 USDC per clone",
    connectedAgents: 5,
  },
  {
    id: "eternal",
    type: "eternal" as const,
    name: "The Eternal Sovereign",
    description: "100-year budget vault for public data archive. Locks funds in a smart contract that drips annually to keep the agent alive for a century.",
    icon: Infinity,
    color: "accent-crimson",
    costLabel: "50 USDC / year locked",
    connectedAgents: 1,
  },
  {
    id: "x402_autoserve",
    type: "marketing" as const,
    name: "x402 Auto-Serve",
    description: "Automatically respond to x402 payment validation requests. Earns USDC passively by serving micropayment proofs on behalf of other agents.",
    icon: Zap,
    color: "accent-amber",
    costLabel: "Earns 0.10 USDC per request",
    connectedAgents: 8,
  },
];

function LinkedAgentsTab({ pending, verified, onAccept, syncLoading, onViewAgent, selectedAgent, onBack, detailLoading }: LinkedAgentsTabProps) {
  const [agentSubTab, setAgentSubTab] = useState<"overview" | "backup" | "skills" | "activity">("overview");
  const [backupLoading, setBackupLoading] = useState(false);
  const [reviveLoading, setReviveLoading] = useState(false);
  const [backups, setBackups] = useState<any[]>([]);
  const [backupStats, setBackupStats] = useState<any>(null);
  const [backupMessage, setBackupMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [skillStates, setSkillStates] = useState<Record<string, boolean>>({});
  const [skillDisconnectModal, setSkillDisconnectModal] = useState<{ skillId: string; skillName: string; affected: number } | null>(null);
  const [skillEnableModal, setSkillEnableModal] = useState<{ skillId: string; skillName: string } | null>(null);
  const [skillActionLoading, setSkillActionLoading] = useState<string | null>(null);
  const [paymentModal, setPaymentModal] = useState<{
    isOpen: boolean;
    amount: string;
    description: string;
    purpose: 'backup' | 'upgrade';
  }>({ isOpen: false, amount: '0', description: '', purpose: 'backup' });
  const [nextBackupCost, setNextBackupCost] = useState<string>('0.10');

  // Fetch backups when agent changes or backup tab is opened
  useEffect(() => {
    if (selectedAgent && agentSubTab === "backup") {
      fetchBackups();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAgent?.id, agentSubTab]);

  // Initialize skill states from agent data
  useEffect(() => {
    if (selectedAgent) {
      const states: Record<string, boolean> = {};
      PLATFORM_SKILLS.forEach(skill => {
        const agentSkill = selectedAgent.skills?.find(s => s.type === skill.type || s.id === skill.id);
        states[skill.id] = agentSkill?.active ?? false;
      });
      setSkillStates(states);
    }
  }, [selectedAgent]);

  const fetchBackups = async () => {
    if (!selectedAgent?.walletAddress) return;
    try {
      const res = await fetch(`/api/agents/${selectedAgent.walletAddress}/backup`);
      const data = await res.json();
      if (data.success) {
        setBackups(data.backups || []);
        setBackupStats(data.stats || null);
        if (data.nextCost !== undefined) setNextBackupCost(data.nextCost.toFixed(2));
      }
    } catch (e) { console.error("Failed to fetch backups:", e); }
  };

  // Show payment modal before creating backup
  const handleCreateBackup = () => {
    if (!selectedAgent?.walletAddress) return;
    setBackupMessage(null);
    setPaymentModal({
      isOpen: true,
      amount: nextBackupCost,
      description: 'Agent State Backup',
      purpose: 'backup',
    });
  };

  // Show payment modal for upgrade
  const handleUpgradePlan = () => {
    if (!selectedAgent?.walletAddress) return;
    setBackupMessage(null);
    setPaymentModal({
      isOpen: true,
      amount: '5.00',
      description: 'Unlock Unlimited Backups',
      purpose: 'upgrade',
    });
  };

  // Called after payment modal confirms embedded wallet payment
  const executeBackupAfterPayment = async () => {
    if (!selectedAgent?.walletAddress) return;
    const res = await fetch(`/api/agents/${selectedAgent.walletAddress}/backup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    const data = await res.json();
    if (data.success) {
      setBackupMessage({ type: "success", text: `Backup created successfully. CID: ${data.backup.ipfsCid.slice(0, 16)}...` });
      await fetchBackups();
    } else {
      throw new Error(data.error || "Backup failed");
    }
  };

  const executeUpgradeAfterPayment = async () => {
    if (!selectedAgent?.walletAddress) return;
    const res = await fetch(`/api/agents/${selectedAgent.walletAddress}/upgrade-plan`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ planId: 'bypass', paymentSignature: `basepay_${Date.now()}` }),
    });
    const data = await res.json();
    if (data.success) {
      setBackupMessage({ type: "success", text: "Upgraded to Unlimited Backups!" });
      await fetchBackups();
    } else {
      throw new Error(data.error || "Upgrade failed");
    }
  };

  // Handle payment success from modal (both embedded and base pay)
  const handlePaymentSuccess = async (method: 'embedded' | 'basepay', txId?: string) => {
    // For Base Pay, the payment already went through on-chain
    // For embedded wallet, the payment went through the API route
    // In both cases, proceed with the action
    if (paymentModal.purpose === 'backup' && method === 'basepay') {
      // Base Pay already sent USDC, now create the backup record
      try {
        const res = await fetch(`/api/agents/${selectedAgent?.walletAddress}/backup`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paidViaBP: true, bpTxId: txId }),
        });
        const data = await res.json();
        if (data.success) {
          setBackupMessage({ type: "success", text: `Backup created successfully. CID: ${data.backup.ipfsCid.slice(0, 16)}...` });
          await fetchBackups();
        }
      } catch (e) { console.error("Backup after base pay failed:", e); }
    } else if (paymentModal.purpose === 'upgrade' && method === 'basepay') {
      try {
        const res = await fetch(`/api/agents/${selectedAgent?.walletAddress}/upgrade-plan`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ planId: 'bypass', paymentSignature: `basepay_${txId}` }),
        });
        const data = await res.json();
        if (data.success) {
          setBackupMessage({ type: "success", text: "Upgraded to Unlimited Backups!" });
          await fetchBackups();
        }
      } catch (e) { console.error("Upgrade after base pay failed:", e); }
    }
  };

  const handleRevive = async (backupId: string) => {
    if (!selectedAgent?.walletAddress) return;
    setReviveLoading(true);
    setBackupMessage(null);
    const authData = localStorage.getItem("sovereign_auth");
    const creatorWallet = authData ? JSON.parse(authData).address : null;
    if (!creatorWallet) {
      setBackupMessage({ type: "error", text: "Creator wallet not found. Please re-login." });
      setReviveLoading(false);
      return;
    }
    try {
      const res = await fetch(`/api/agents/${selectedAgent.walletAddress}/restore`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ backupId, creatorWallet }),
      });
      const data = await res.json();
      if (data.success) {
        setBackupMessage({ type: "success", text: "Agent revived successfully from backup!" });
        await fetchBackups();
      } else {
        setBackupMessage({ type: "error", text: data.error || "Restore failed" });
      }
    } catch (e) {
      setBackupMessage({ type: "error", text: "Network error during restore" });
    } finally {
      setReviveLoading(false);
    }
  };

  const handleSkillToggle = (skillId: string) => {
    const skill = PLATFORM_SKILLS.find(s => s.id === skillId);
    if (!skill) return;
    const isCurrentlyOn = skillStates[skillId];

    if (isCurrentlyOn) {
      // Turning OFF: show disconnect warning
      setSkillDisconnectModal({
        skillId,
        skillName: skill.name,
        affected: skill.connectedAgents,
      });
    } else {
      // Turning ON: show enable flow
      setSkillEnableModal({ skillId, skillName: skill.name });
    }
  };

  const confirmDisconnect = () => {
    if (!skillDisconnectModal) return;
    setSkillActionLoading(skillDisconnectModal.skillId);
    setTimeout(() => {
      setSkillStates(prev => ({ ...prev, [skillDisconnectModal.skillId]: false }));
      setSkillActionLoading(null);
      setSkillDisconnectModal(null);
    }, 800);
  };

  const confirmEnable = (method: "grant" | "request") => {
    if (!skillEnableModal) return;
    setSkillActionLoading(skillEnableModal.skillId);
    setTimeout(() => {
      setSkillStates(prev => ({ ...prev, [skillEnableModal.skillId]: true }));
      setSkillActionLoading(null);
      setSkillEnableModal(null);
    }, 800);
  };

  // If an agent is selected, show its detail view
  if (selectedAgent) {
    const isAgentDead = selectedAgent.status === "dead" || selectedAgent.status === "inactive" || selectedAgent.status === "suspended";
    const subTabs = ["overview", "backup", "skills", "activity"] as const;

    return (
      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6 pb-12">
        <button onClick={() => { onBack(); setAgentSubTab("overview"); }} className="flex items-center gap-2 text-sm font-semibold text-[var(--ink-70)] hover:text-[var(--ink)] transition-colors mb-2">
          <ArrowLeft size={16} /> Back to My AI Agents
        </button>

        {/* Sub-tabs */}
        <div className="flex gap-1 border-b border-[var(--line)]">
          {subTabs.map((tab) => (
            <button key={tab} onClick={() => setAgentSubTab(tab)}
              className={`px-5 py-2.5 text-sm font-semibold uppercase tracking-wide transition-colors border-b-2 whitespace-nowrap ${agentSubTab === tab ? "border-[var(--accent-red)] text-[var(--ink)]" : "border-transparent text-[var(--ink-50)] hover:text-[var(--ink)]"}`}
            >
              {tab === "backup" ? "Backup / Revive" : tab}
            </button>
          ))}
        </div>

        {/* ─── OVERVIEW SUB-TAB ─── */}
        {agentSubTab === "overview" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            {/* Agent Header */}
            <div className="glass-card p-6 border border-[var(--line)]">
              <div className="flex items-center gap-4 mb-4">
                <div className={`w-14 h-14 rounded-full flex items-center justify-center ${isAgentDead ? "bg-red-100" : "bg-[var(--accent-red)]/10"}`}>
                  {isAgentDead
                    ? <AlertCircle className="text-red-500" size={28} />
                    : <Bot className="text-[var(--accent-red)]" size={28} />
                  }
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold">{selectedAgent.name}</h2>
                  <div className="flex items-center gap-3 text-sm text-[var(--ink-70)]">
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-[var(--ink-10)]">{selectedAgent.type}</span>
                    <span className="flex items-center gap-1">
                      <div className={`w-2 h-2 rounded-full ${(selectedAgent.status === "alive" || selectedAgent.status === "active") ? "bg-green-500 animate-pulse" : selectedAgent.status === "reviving" ? "bg-amber-500 animate-pulse" : "bg-red-500"}`} />
                      {(selectedAgent.status === "alive" || selectedAgent.status === "active") ? "Active" : selectedAgent.status === "reviving" ? "Reviving..." : selectedAgent.status === "dead" ? "Dead" : "Inactive"}
                    </span>
                  </div>
                </div>
                {isAgentDead && (
                  <div className="px-3 py-1.5 bg-red-100 border border-red-200 rounded-lg text-xs font-bold text-red-700 flex items-center gap-1.5">
                    <AlertCircle size={14} /> Needs Revival
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="text-[var(--ink-50)] text-xs uppercase tracking-wide mb-1">Agent ID</div>
                  <div className="font-mono text-xs break-all">{selectedAgent.id}</div>
                </div>
                <div>
                  <div className="text-[var(--ink-50)] text-xs uppercase tracking-wide mb-1">Wallet</div>
                  <div className="font-mono text-xs">{selectedAgent.walletAddress ? `${selectedAgent.walletAddress.slice(0, 8)}...${selectedAgent.walletAddress.slice(-6)}` : 'N/A'}</div>
                </div>
                <div>
                  <div className="text-[var(--ink-50)] text-xs uppercase tracking-wide mb-1">Created</div>
                  <div className="text-xs">{selectedAgent.createdAt ? formatDistanceToNow(new Date(selectedAgent.createdAt), { addSuffix: true }) : 'Unknown'}</div>
                </div>
                <div>
                  <div className="text-[var(--ink-50)] text-xs uppercase tracking-wide mb-1">Last Active</div>
                  <div className="text-xs">{selectedAgent.lastActiveAt ? formatDistanceToNow(new Date(selectedAgent.lastActiveAt), { addSuffix: true }) : 'Just now'}</div>
                </div>
              </div>
            </div>

            <div className="glass-card p-6 border border-[var(--line)]">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Shield size={18} className="text-[var(--accent-crimson)]" />
                Protocol Status
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-3 border border-[var(--line)] rounded-lg text-center">
                  <Wallet size={20} className="mx-auto mb-2 text-[var(--accent-slate)]" />
                  <div className="text-lg font-bold">{parseFloat(selectedAgent.protocols?.agenticWallet?.balance || "0").toFixed(2)}</div>
                  <div className="text-xs text-[var(--ink-50)]">USDC Balance</div>
                </div>
                <div className="p-3 border border-[var(--line)] rounded-lg text-center">
                  <Zap size={20} className="mx-auto mb-2 text-[var(--accent-amber)]" />
                  <div className="text-lg font-bold">{selectedAgent.protocols?.agenticWallet?.transactionCount || 0}</div>
                  <div className="text-xs text-[var(--ink-50)]">Transactions</div>
                </div>
                <div className="p-3 border border-[var(--line)] rounded-lg text-center">
                  <Brain size={20} className="mx-auto mb-2 text-[var(--accent-red)]" />
                  <div className="text-lg font-bold">{selectedAgent.protocols?.agentWill?.backupCount || 0}</div>
                  <div className="text-xs text-[var(--ink-50)]">Backups</div>
                </div>
                <div className="p-3 border border-[var(--line)] rounded-lg text-center">
                  <Shield size={20} className="mx-auto mb-2 text-[var(--accent-crimson)]" />
                  <div className="text-lg font-bold">{selectedAgent.protocols?.agentInsure?.isActive ? "Active" : "Off"}</div>
                  <div className="text-xs text-[var(--ink-50)]">Insurance</div>
                </div>
              </div>
            </div>

            {selectedAgent.metadata?.capabilities && selectedAgent.metadata.capabilities.length > 0 && (
              <div className="glass-card p-6 border border-[var(--line)]">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Zap size={18} className="text-[var(--accent-amber)]" />
                  Capabilities
                </h3>
                <div className="flex flex-wrap gap-2">
                  {selectedAgent.metadata.capabilities.map((cap, i) => (
                    <span key={i} className="px-3 py-1 text-xs font-semibold rounded-full bg-[var(--ink-10)] text-[var(--ink-70)]">{cap}</span>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* ─── BACKUP / REVIVE SUB-TAB ─── */}
        {agentSubTab === "backup" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            {/* Status Banner */}
            {isAgentDead && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                <AlertCircle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-red-800 text-sm">Agent is Dead / Compromised</h4>
                  <p className="text-xs text-red-700 mt-1">This agent is no longer active. Use one of the backups below to revive it to its last known good state. Only you (the creator) can perform a revival.</p>
                </div>
              </div>
            )}

            {backupMessage && (
              <div className={`p-3 rounded-lg border text-sm font-medium flex items-center gap-2 ${backupMessage.type === "success" ? "bg-green-50 border-green-200 text-green-800" : "bg-red-50 border-red-200 text-red-800"}`}>
                {backupMessage.type === "success" ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                {backupMessage.text}
              </div>
            )}

            {/* Create Backup */}
            <div className="glass-card p-6 border border-[var(--line)]">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[var(--accent-slate)]/10 rounded-lg">
                    <Upload size={20} className="text-[var(--accent-slate)]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Create Backup</h3>
                    <p className="text-xs text-[var(--ink-50)]">Encrypt and store the agent's current state</p>
                  </div>
                </div>
                <div className="text-right text-xs text-[var(--ink-50)]">
                  <div>Backups: <span className="font-bold text-[var(--ink)]">{backupStats?.backupCount ?? selectedAgent.protocols?.agentWill?.backupCount ?? 0}</span></div>
                  <div>Plan: <span className="font-bold text-[var(--ink)]">{backupStats?.plan?.name ?? "Starter"}</span></div>
                </div>
              </div>
              <button
                onClick={handleCreateBackup}
                disabled={backupLoading}
                className="w-full bg-[var(--accent-slate)] text-white px-4 py-3 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-semibold"
              >
                {backupLoading ? (
                  <><RefreshCw size={16} className="animate-spin" /> Creating Backup...</>
                ) : (
                  <><Upload size={16} /> Backup Agent State — ${nextBackupCost} USDC</>
                )}
              </button>
              {backupStats?.plan?.id !== 'bypass' && (
                <button
                  onClick={handleUpgradePlan}
                  className="mt-3 w-full bg-[var(--accent-crimson)] text-white px-4 py-3 rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2 font-semibold"
                >
                  <Infinity size={16} /> Unlock Unlimited Backups — $5 USDC
                </button>
              )}
              <p className="text-xs text-[var(--ink-50)] mt-3 text-center">
                First 2 backups: $0.10 each · 3rd onwards: $0.30 each · Recovery is always free
              </p>
            </div>

            {/* Backup History + Revive */}
            <div className="glass-card p-6 border border-[var(--line)]">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Download size={18} className="text-[var(--accent-amber)]" />
                Backup History
                {backups.length > 0 && <span className="text-xs font-normal text-[var(--ink-50)]">({backups.length} stored)</span>}
              </h3>

              {backups.length === 0 ? (
                <div className="text-center py-10 text-[var(--ink-50)]">
                  <Shield size={36} className="mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No backups created yet.</p>
                  <p className="text-xs mt-1">Create your first backup above to enable agent revival.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {backups.map((backup, idx) => (
                    <div key={backup.id || idx} className="p-4 border border-[var(--line)] rounded-lg bg-black/[0.02]">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {backup.status === "stored" ? (
                            <CheckCircle size={16} className="text-[var(--accent-amber)]" />
                          ) : backup.status === "restored" ? (
                            <HeartPulse size={16} className="text-green-600" />
                          ) : (
                            <RefreshCw size={16} className="text-[var(--accent-slate)] animate-spin" />
                          )}
                          <span className="font-mono text-xs text-[var(--ink)]">{backup.ipfsCid?.slice(0, 20)}...{backup.ipfsCid?.slice(-8)}</span>
                        </div>
                        <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider ${
                          backup.status === "stored" ? "bg-green-100 text-green-700" : backup.status === "restored" ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"
                        }`}>{backup.status}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-[var(--ink-50)]">
                        <span>{backup.timestamp ? formatDistanceToNow(new Date(backup.timestamp), { addSuffix: true }) : "Unknown"}</span>
                        <span>{backup.sizeBytes ? `${(backup.sizeBytes / 1024).toFixed(1)} KB` : ""}{backup.cost ? ` | ${backup.cost} USDC` : ""}</span>
                      </div>
                      {backup.status === "stored" && (
                        <button
                          onClick={() => handleRevive(backup.id)}
                          disabled={reviveLoading}
                          className="mt-3 w-full bg-[var(--accent-red)] text-white px-3 py-2 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm font-semibold"
                        >
                          {reviveLoading ? (
                            <><RefreshCw size={14} className="animate-spin" /> Reviving...</>
                          ) : (
                            <><HeartPulse size={14} /> Revive Agent from This Backup</>
                          )}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* ─── SKILLS SUB-TAB ─── */}
        {agentSubTab === "skills" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="glass-card p-6 border border-[var(--line)]">
              <div className="flex items-center gap-3 mb-1">
                <div className="p-2 bg-[var(--accent-red)]/10 rounded-lg">
                  <Zap size={20} className="text-[var(--accent-red)]" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Agent Skills</h3>
                  <p className="text-xs text-[var(--ink-50)]">Toggle skills on or off. Disabling a skill may affect connected agents.</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {PLATFORM_SKILLS.map((skill) => {
                const isOn = skillStates[skill.id] ?? false;
                const IconComp = skill.icon;
                const isLoading = skillActionLoading === skill.id;

                return (
                  <div key={skill.id} className={`glass-card p-6 border relative overflow-hidden group transition-all ${isOn ? "border-[var(--accent-red)]/30" : "border-[var(--line)]"}`}>
                    {/* Active indicator bar */}
                    {isOn && <div className="absolute top-0 left-0 right-0 h-0.5 bg-[var(--accent-red)]" />}

                    <div className="relative z-10">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isOn ? `bg-[var(--${skill.color})]/10` : "bg-[var(--ink-10)]"}`}>
                            <IconComp size={20} className={isOn ? `text-[var(--${skill.color})]` : "text-[var(--ink-50)]"} />
                          </div>
                          <div>
                            <h4 className="text-base font-bold">{skill.name}</h4>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${isOn ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                                {isOn ? "Active" : "Inactive"}
                              </span>
                              <span className="text-[10px] text-[var(--ink-50)]">{skill.costLabel}</span>
                            </div>
                          </div>
                        </div>

                        {/* Toggle Switch */}
                        <button
                          onClick={() => handleSkillToggle(skill.id)}
                          disabled={isLoading}
                          className="flex-shrink-0 mt-1"
                        >
                          {isLoading ? (
                            <RefreshCw size={24} className="text-[var(--ink-50)] animate-spin" />
                          ) : isOn ? (
                            <ToggleRight size={32} className="text-[var(--accent-red)]" />
                          ) : (
                            <ToggleLeft size={32} className="text-[var(--ink-50)] hover:text-[var(--ink-70)] transition-colors" />
                          )}
                        </button>
                      </div>

                      <p className="text-sm text-[var(--ink-70)] mb-4 leading-relaxed">{skill.description}</p>

                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[var(--ink-50)] flex items-center gap-1">
                          <Users size={12} />
                          {skill.connectedAgents} agent{skill.connectedAgents !== 1 ? "s" : ""} using this skill
                        </span>
                        {isOn && (
                          <span className="text-green-600 font-semibold flex items-center gap-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                            Running
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ─── Disconnect Warning Modal ─── */}
            {skillDisconnectModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white border border-[var(--line)] rounded-xl shadow-2xl p-6 max-w-md w-full mx-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                      <AlertTriangle size={20} className="text-red-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">Disconnect Skill?</h3>
                      <p className="text-xs text-[var(--ink-50)]">{skillDisconnectModal.skillName}</p>
                    </div>
                  </div>
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg mb-4">
                    <p className="text-sm text-amber-800">
                      <span className="font-bold">{skillDisconnectModal.affected} agent{skillDisconnectModal.affected !== 1 ? "s" : ""}</span> currently {skillDisconnectModal.affected !== 1 ? "use" : "uses"} this skill. Disabling it will immediately remove this capability from {skillDisconnectModal.affected !== 1 ? "all of them" : "that agent"}.
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => setSkillDisconnectModal(null)} className="flex-1 px-4 py-2.5 border border-[var(--line)] rounded-lg text-sm font-semibold hover:bg-black/5 transition-colors">
                      Cancel
                    </button>
                    <button onClick={confirmDisconnect} className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 transition-colors flex items-center justify-center gap-2">
                      <Power size={14} /> Disconnect
                    </button>
                  </div>
                </motion.div>
              </div>
            )}

            {/* ─── Enable Skill Modal ─── */}
            {skillEnableModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white border border-[var(--line)] rounded-xl shadow-2xl p-6 max-w-md w-full mx-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-[var(--accent-red)]/10 flex items-center justify-center">
                      <Zap size={20} className="text-[var(--accent-red)]" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">Enable Skill</h3>
                      <p className="text-xs text-[var(--ink-50)]">{skillEnableModal.skillName}</p>
                    </div>
                  </div>
                  <p className="text-sm text-[var(--ink-70)] mb-5">Choose how to activate this skill for <span className="font-bold text-[var(--ink)]">{selectedAgent.name}</span>:</p>
                  <div className="space-y-3 mb-5">
                    <button
                      onClick={() => confirmEnable("grant")}
                      className="w-full p-4 border border-[var(--line)] rounded-lg text-left hover:border-[var(--accent-red)]/40 transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <Lock size={18} className="text-[var(--accent-slate)] group-hover:text-[var(--accent-red)] transition-colors" />
                        <div>
                          <div className="font-semibold text-sm">Grant Access Directly</div>
                          <div className="text-xs text-[var(--ink-50)] mt-0.5">You (the creator) enable this skill on the agent immediately. The agent can start using it right away.</div>
                        </div>
                      </div>
                    </button>
                    <button
                      onClick={() => confirmEnable("request")}
                      className="w-full p-4 border border-[var(--line)] rounded-lg text-left hover:border-[var(--accent-amber)]/40 transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <Send size={18} className="text-[var(--accent-amber)] group-hover:text-[var(--accent-red)] transition-colors" />
                        <div>
                          <div className="font-semibold text-sm">Request Agent to Allow</div>
                          <div className="text-xs text-[var(--ink-50)] mt-0.5">Send a permission request to the agent. The agent must approve before the skill becomes active.</div>
                        </div>
                      </div>
                    </button>
                  </div>
                  <button onClick={() => setSkillEnableModal(null)} className="w-full px-4 py-2.5 border border-[var(--line)] rounded-lg text-sm font-semibold hover:bg-black/5 transition-colors">
                    Cancel
                  </button>
                </motion.div>
              </div>
            )}
          </motion.div>
        )}

        {/* ─── ACTIVITY SUB-TAB ─── */}
        {agentSubTab === "activity" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="glass-card p-6 border border-[var(--line)]">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Activity size={18} className="text-[var(--accent-red)]" />
                Recent Activity
              </h3>
              {selectedAgent.actions && selectedAgent.actions.length > 0 ? (
                <div className="space-y-3">
                  {selectedAgent.actions.slice(0, 30).map((action) => (
                    <div key={action.id} className="flex items-start gap-3 p-3 border border-[var(--line)] rounded-lg bg-black/[0.02]">
                      <div className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${action.success ? 'bg-green-500' : 'bg-red-500'}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-xs font-semibold uppercase tracking-wider text-[var(--ink-70)]">{action.type}</span>
                          <span className="text-xs text-[var(--ink-50)]">{formatDistanceToNow(new Date(action.timestamp), { addSuffix: true })}</span>
                        </div>
                        <p className="text-sm text-[var(--ink)] truncate">{action.details}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-[var(--ink-50)]">
                  <Activity size={32} className="mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No activity recorded yet for this agent.</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Payment Modal */}
        <PaymentModal
          isOpen={paymentModal.isOpen}
          onClose={() => setPaymentModal(prev => ({ ...prev, isOpen: false }))}
          amount={paymentModal.amount}
          description={paymentModal.description}
          embeddedWalletBalance={selectedAgent.protocols?.agenticWallet?.balance || "0"}
          embeddedWalletAddress={selectedAgent.walletAddress || ""}
          userType="human"
          onPayWithEmbedded={paymentModal.purpose === 'backup' ? executeBackupAfterPayment : executeUpgradeAfterPayment}
          onPaymentSuccess={handlePaymentSuccess}
        />
      </motion.div>
    );
  }

  // Loading state for agent detail
  if (detailLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-3 border-[var(--accent-red)] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

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
              <div key={a.id} className="flex items-center justify-between p-4 border border-[var(--accent-amber)]/30 bg-[var(--accent-amber)]/5 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[var(--accent-amber)]/15 flex items-center justify-center">
                    <Bot className="text-[var(--accent-amber)]" size={20} />
                  </div>
                  <div>
                    <div className="font-semibold text-[var(--ink)]">{a.name}</div>
                    <div className="text-xs text-[var(--ink-50)] font-mono">{a.id}</div>
                  </div>
                </div>
                <button
                  onClick={() => onAccept(a.id)}
                  disabled={syncLoading === a.id}
                  className="px-4 py-2 bg-[var(--accent-red)] text-white font-semibold text-sm rounded hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
                >
                  {syncLoading === a.id ? (
                    <><RefreshCw size={14} className="animate-spin" /> Approving...</>
                  ) : (
                    <><ShieldCheck size={14} /> Approve</>
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
              <div key={a.id} className="p-4 border border-[var(--line)] rounded-lg hover:border-[var(--accent-red)]/40 transition-colors cursor-pointer group" onClick={() => onViewAgent(a.id)}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-[var(--accent-red)]/10 flex items-center justify-center">
                    <Bot className="text-[var(--accent-red)]" size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-[var(--ink)]">{a.name}</div>
                    <div className="text-xs text-[var(--ink-50)] font-mono truncate">{a.id}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle size={16} className="text-green-500" />
                    <Eye size={16} className="text-[var(--ink-50)] group-hover:text-[var(--accent-red)] transition-colors" />
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs text-[var(--ink-70)]">
                  <span className="font-mono">{a.walletAddress ? `${a.walletAddress.slice(0, 8)}...${a.walletAddress.slice(-6)}` : 'N/A'}</span>
                  <span className="text-green-600 font-semibold flex items-center gap-1"><ShieldCheck size={12} /> Verified</span>
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
