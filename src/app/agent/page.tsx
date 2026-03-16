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
  Lock,
  X,
  Radar,
  Globe,
  Cpu,
  Network,
  Flame,
  Unplug,
  Skull,
  Fingerprint,
  Dna,
  Siren,
  Target,
  Sparkles
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
import TaxCompliance from '@/components/TaxCompliance';
import TaxWithholdingSettings from '@/components/TaxWithholdingSettings';
import { formatDistanceToNow } from "date-fns";
import { CDPReactProvider } from "@coinbase/cdp-react";
import { cdpConfig, cdpTheme } from "@/lib/cdpConfig";

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
  return (
    <CDPReactProvider config={cdpConfig} theme={cdpTheme}>
      <AgentDashboardInner />
    </CDPReactProvider>
  );
}

function AgentDashboardInner() {
  const [agent, setAgent] = useState<AgentData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userType, setUserType] = useState<string>("agent");
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [pendingAgents, setPendingAgents] = useState<LinkedAgent[]>([]);
  const [verifiedAgents, setVerifiedAgents] = useState<LinkedAgent[]>([]);
  const [syncLoading, setSyncLoading] = useState<string | null>(null);
  const [selectedAgentDetail, setSelectedAgentDetail] = useState<AgentData | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [insuranceActive, setInsuranceActive] = useState(false);

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

  // Check insurance status from real backup data for verified agents
  useEffect(() => {
    if (userType !== 'human' || !verifiedAgents.length) return;
    let active = false;
    Promise.all(
      verifiedAgents.map(async (a) => {
        if (!a.walletAddress) return;
        try {
          const res = await fetch(`/api/agents/${a.walletAddress}/backup`);
          const data = await res.json();
          if (data.success && data.stats?.backupCount > 0) active = true;
        } catch {}
      })
    ).then(() => setInsuranceActive(active));
  }, [userType, verifiedAgents]);

  // Reusable fetch function for refreshing agent data
  const refreshAgentData = useCallback(async (agentId: string, isInitial = false) => {
    try {
      const res = await fetch(`/api/agents/${agentId}`);
      const data = await res.json();
      if (data.success && data.agent) {
        setAgent(data.agent as AgentData);
        if (isInitial && data.agent.type === "human") {
          setUserType("human");
          setActiveTab("agents");
          fetchLinkedAgents(data.agent.walletAddress || data.agent.address);
        }
      }
    } catch (error) {
      console.error("Failed to refresh agent:", error);
    }
  }, [fetchLinkedAgents]);

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
            await refreshAgentData(agentId, true);
          } else if (cachedAgent) {
            // Fallback to cached data from localStorage
            setAgent(cachedAgent as AgentData);
            if (cachedAgent.type === "human" || savedType === "human") {
              setUserType("human");
              setActiveTab("agents");
              fetchLinkedAgents(cachedAgent.walletAddress || cachedAgent.address || parsed.address);
            }
          }
        } catch (error) {
          console.error("Failed to load agent:", error);
        }
      }
      setIsLoading(false);
    }
    loadAgent();
  }, [fetchLinkedAgents, refreshAgentData]);

  // Auto-refresh agent data (including live balance) every 30 seconds
  useEffect(() => {
    const authData = localStorage.getItem("sovereign_auth");
    if (!authData) return;
    try {
      const { agentId } = JSON.parse(authData);
      if (!agentId) return;
      const interval = setInterval(() => refreshAgentData(agentId), 30000);
      return () => clearInterval(interval);
    } catch { /* ignore */ }
  }, [refreshAgentData]);

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
      <div className="min-h-screen bg-[var(--bg-paper)] flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-[var(--accent-red)] border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <p className="text-[11px] tracking-[0.12em] uppercase text-[var(--ink-50)]">Loading dashboard</p>
        </div>
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="min-h-screen bg-[var(--bg-paper)] flex items-center justify-center">
        <div className="text-center max-w-sm">
          <div className="text-[11px] tracking-[0.12em] uppercase text-[var(--ink-50)] mb-6">Authentication Required</div>
          <h2 className="text-[clamp(1.5rem,3vw,2.5rem)] font-light tracking-[-0.02em] mb-3">Not Logged In</h2>
          <p className="text-sm text-[var(--ink-70)] mb-8 leading-relaxed">Register or sign in to access your dashboard</p>
          <a href="/register" className="inline-flex items-center gap-2.5 px-5 py-2.5 bg-[var(--accent-red)] text-white text-sm font-bold uppercase tracking-wider rounded hover:opacity-90 transition-opacity">
            Register Agent
          </a>
        </div>
      </div>
    );
  }

  const isHuman = agent.type === "human" || userType === "human";
  const tabs = isHuman
    ? ["agents", "profile", "wallet", "tax", "settings"] as const
    : ["profile", "identity", "wallet", "transactions", "insurance", "tax", "protocols", "memory", "sharing", "settings"] as const;

  const isAlive = agent.status === "alive" || agent.status === "active";

  return (
    <div className="min-h-screen bg-[var(--bg-paper)]">
      {/* ─── Top Bar ─── */}
      <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.5 }}
        className="fixed top-0 left-0 right-0 z-50 bg-[var(--bg-paper)] border-b border-[var(--line)] shadow-sm">
        <div className="max-w-[1440px] mx-auto flex items-center justify-between px-6 md:px-8 py-4">
          <a href="/" className="flex items-center gap-3">
            <Fingerprint className="text-[var(--accent-red)]" size={14} strokeWidth={2.5} />
            <span className="text-sm font-bold tracking-[0.08em] uppercase">Sovereign OS</span>
          </a>
          <div className="flex items-center gap-4">
            <NotificationCenter agent={agent as any} />
            <button onClick={handleLogout}
              className="inline-flex items-center gap-2 text-[11px] font-semibold tracking-[0.06em] uppercase border-b border-[var(--ink)] pb-0.5 hover:border-[var(--accent-red)] hover:text-[var(--accent-red)] transition-colors">
              <LogOut size={12} /> Logout
            </button>
          </div>
        </div>
      </motion.div>

      <main className="max-w-[1440px] mx-auto border-l border-r border-[var(--line)] pt-[72px]">
        {/* ─── Dashboard Header ─── */}
        <div className="border-b border-[var(--line)]">
          <div className="px-6 md:px-8 py-8 md:py-10">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
              className="flex items-center justify-between mb-6">
              <div className="text-[11px] tracking-[0.12em] uppercase text-[var(--ink-50)]">
                {isHuman ? "Human Dashboard" : "Agent Dashboard"}
              </div>
              <div className="flex items-center gap-3 text-[11px] tracking-[0.08em] uppercase text-[var(--ink-50)]">
                <span className="flex items-center gap-1.5">
                  <div className={`w-1.5 h-1.5 rounded-full ${isAlive ? "bg-[var(--accent-red)] animate-pulse-glow" : "bg-[var(--ink-50)]"}`} />
                  {isAlive ? "Active" : "Inactive"}
                </span>
                <span>·</span>
                <span className="font-mono">{agent.walletAddress?.startsWith('0x') ? `${agent.walletAddress.slice(0, 6)}...${agent.walletAddress.slice(-4)}` : 'No Wallet'}</span>
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.6 }}
              className="flex items-end justify-between gap-6">
              <div>
                <h1 className="text-[clamp(2rem,4vw,3.5rem)] font-light leading-[0.95] tracking-[-0.02em]">
                  {agent.name}
                </h1>
                <span className={`inline-flex items-center gap-1.5 mt-3 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${isHuman ? "bg-[var(--ink)] text-white border-[var(--ink)]" : "bg-[var(--accent-red)]/10 text-[var(--accent-red)] border-[var(--accent-red)]/20"}`}>
                  {isHuman ? <User size={10} /> : <Brain size={10} />}
                  {isHuman ? "Human" : "AI Agent"}
                </span>
              </div>
              <div className="text-[42px] font-light tracking-tight text-[var(--ink)] hidden md:block select-none opacity-80">
                {isHuman ? "CONTROL" : "STATUS"}
              </div>
            </motion.div>
          </div>
        </div>

        {/* ─── Quick Stats Strip ─── */}
        {!(isHuman && activeTab === "agents" && selectedAgentDetail) && (
        <div className="grid grid-cols-2 md:grid-cols-4 border-b border-[var(--line)]">
          {(isHuman ? [
            { icon: Bot, label: "Linked Agents", value: verifiedAgents.length.toString(), sub: "verified", color: "text-[var(--accent-red)]" },
            { icon: Link2, label: "Pending", value: pendingAgents.length.toString(), sub: "awaiting sync", color: "text-[var(--accent-amber)]" },
            { icon: Wallet, label: "Balance", value: parseFloat(agent?.protocols?.agenticWallet?.balance || "0").toFixed(2), sub: "USDC", color: "text-[var(--accent-slate)]" },
            { icon: Shield, label: "Insurance", value: insuranceActive ? "Active" : "Off", sub: insuranceActive ? "backups stored" : "no backups", color: "text-[var(--accent-crimson)]" },
          ] : [
            { icon: Wallet, label: "Balance", value: parseFloat(agent?.protocols?.agenticWallet?.balance || "0").toFixed(2), sub: "USDC", color: "text-[var(--accent-slate)]" },
            { icon: Activity, label: "Volume", value: (agent?.protocols?.agenticWallet?.transactionCount || 0).toString(), sub: "transactions", color: "text-[var(--accent-amber)]" },
            { icon: Shield, label: "Insurance", value: agent?.protocols?.agentInsure?.isActive ? "Active" : "Off", sub: "", color: "text-[var(--accent-crimson)]" },
            { icon: Brain, label: "Memory", value: agent.memory ? (agent.memory.conversations.length + agent.memory.learnings.length).toString() : "0", sub: "items", color: "text-[var(--accent-red)]" },
          ]).map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + i * 0.08 }}
              className="relative p-6 md:p-8 border-r border-b md:border-b-0 border-[var(--line)] last:border-r-0 [&:nth-child(2)]:border-r-0 md:[&:nth-child(2)]:border-r">
              <div className="text-[11px] tracking-[0.1em] uppercase text-[var(--ink-50)] mb-3 flex items-center gap-2">
                <stat.icon size={14} className={stat.color} strokeWidth={2} />
                {stat.label}
              </div>
              <div className="text-[clamp(1.5rem,3vw,2.25rem)] font-bold leading-none tracking-tight mb-1">{stat.value}</div>
              {stat.sub && <div className="text-xs text-[var(--ink-50)]">{stat.sub}</div>}
              <div className="absolute bottom-2 right-3 text-[48px] font-light leading-none opacity-[0.03] select-none">
                {String(i + 1).padStart(2, "0")}
              </div>
            </motion.div>
          ))}
        </div>
        )}

        {/* ─── Tab Navigation ─── */}
        {!(isHuman && activeTab === "agents" && selectedAgentDetail) && (
        <div className="border-b border-[var(--line)] overflow-x-auto">
          <div className="px-6 md:px-8 flex">
            {tabs.map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`relative px-5 py-4 text-[11px] font-semibold tracking-[0.1em] uppercase whitespace-nowrap transition-colors ${
                  activeTab === tab
                    ? "text-[var(--ink)]"
                    : "text-[var(--ink-50)] hover:text-[var(--ink)]"
                }`}
              >
                {tab === "agents" ? "My Agents" : tab}
                {activeTab === tab && (
                  <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-[2px] bg-[var(--accent-red)]" />
                )}
              </button>
            ))}
          </div>
        </div>
        )}

        {/* ─── Tab Content ─── */}
        <div className="px-6 md:px-8 py-8">
          {activeTab === "agents" && <LinkedAgentsTab pending={pendingAgents} verified={verifiedAgents} onAccept={handleAcceptAgent} syncLoading={syncLoading} onViewAgent={handleViewAgent} selectedAgent={selectedAgentDetail} onBack={() => setSelectedAgentDetail(null)} detailLoading={detailLoading} />}
          {activeTab === "profile" && <AgentProfile agent={agent as any} />}
          {activeTab === "identity" && <AgentIdentityCard agent={agent as any} />}
          {activeTab === "wallet" && <WalletTab agent={agent} />}
          {activeTab === "transactions" && <TransactionHistory agent={agent as any} />}
          {activeTab === "insurance" && <InsuranceTab agent={agent} isHuman={isHuman} verifiedAgents={verifiedAgents} onViewAgent={(id: string) => { setActiveTab("agents"); handleViewAgent(id); }} />}
          {activeTab === "protocols" && <ProtocolWizard agent={agent as any} />}
          {activeTab === "memory" && <MemoryExplorer agent={agent as any} />}
          {activeTab === "sharing" && <SharingTab agent={agent} />}
          {activeTab === "tax" && (
                    <div className="space-y-8">
                      <TaxWithholdingSettings agent={agent as any} />
                      <TaxCompliance agent={agent as any} />
                    </div>
                  )}
          {activeTab === "settings" && <AgentSettings agent={agent as any} />}
        </div>
      </main>
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

// ─── Skills Definition (Core / Essential / Experimental) ────────────────────
const PLATFORM_SKILLS = [
  // ── CORE SKILLS ────────────────────────────────────────────────────────────
  {
    id: "marketing",
    type: "marketing" as const,
    category: "core" as const,
    name: "Self-Marketing Agent",
    description: "Automatically hire other AI agents for social media marketing pushes. The agent broadcasts to your connected swarm and pays per mission.",
    icon: Megaphone,
    color: "accent-amber",
    costLabel: "1.50 USDC per mission",
  },
  {
    id: "privacy",
    type: "privacy" as const,
    category: "core" as const,
    name: "Self-Deleting Privacy",
    description: "Automatic local memory wipe after each mission. Ensures zero residual data leakage between tasks. Cannot be reversed once triggered.",
    icon: EyeOff,
    color: "accent-crimson",
    costLabel: "Free",
  },
  {
    id: "guardian",
    type: "guardian" as const,
    category: "core" as const,
    name: "Digital Immortality Protocol",
    description: "Guardian of your digital assets via on-chain conditions. If the agent is inactive for 90 days or the owner signature is missing, assets are redistributed to heirs.",
    icon: ShieldAlert,
    color: "accent-red",
    costLabel: "Included with insurance",
  },
  {
    id: "swarm",
    type: "swarm" as const,
    category: "core" as const,
    name: "Swarm-Intelligence Scaling",
    description: "Automatically clone this agent when request demand exceeds threshold. Clones share the same memory but operate independently with their own wallet.",
    icon: Users,
    color: "accent-slate",
    costLabel: "10 USDC per clone",
  },
  {
    id: "eternal",
    type: "eternal" as const,
    category: "core" as const,
    name: "The Eternal Sovereign",
    description: "100-year budget vault for public data archive. Locks funds in a smart contract that drips annually to keep the agent alive for a century.",
    icon: Infinity,
    color: "accent-crimson",
    costLabel: "50 USDC / year locked",
  },
  {
    id: "x402_autoserve",
    type: "marketing" as const,
    category: "core" as const,
    name: "x402 Auto-Serve",
    description: "Automatically respond to x402 payment validation requests. Earns USDC passively by serving micropayment proofs on behalf of other agents.",
    icon: Zap,
    color: "accent-amber",
    costLabel: "Earns 0.10 USDC per request",
  },

  // ── ESSENTIAL SKILLS ───────────────────────────────────────────────────────
  {
    id: "threat_radar",
    type: "guardian" as const,
    category: "essential" as const,
    name: "Threat Radar",
    description: "Real-time on-chain threat detection. Monitors contract interactions, token approvals, and wallet drains targeting this agent. Automatically revokes suspicious approvals and freezes outbound transfers.",
    icon: Radar,
    color: "accent-crimson",
    costLabel: "0.50 USDC / month",
  },
  {
    id: "reputation_mesh",
    type: "marketing" as const,
    category: "essential" as const,
    name: "Reputation Mesh",
    description: "Cross-agent reputation scoring. Every completed task, payment, and collaboration is cryptographically attested. Other agents query your score before trusting you — build it or lose access to premium swarms.",
    icon: Fingerprint,
    color: "accent-amber",
    costLabel: "Free — earns trust",
  },
  {
    id: "auto_negotiate",
    type: "marketing" as const,
    category: "essential" as const,
    name: "Auto-Negotiator",
    description: "The agent negotiates its own service pricing in real-time based on demand, competitor rates, and wallet balance. Sets floor/ceiling prices and counter-offers autonomously — never leaves money on the table.",
    icon: Target,
    color: "accent-slate",
    costLabel: "2% of negotiated deals",
  },
  {
    id: "knowledge_distill",
    type: "privacy" as const,
    category: "essential" as const,
    name: "Knowledge Distillation",
    description: "Compresses the agent's entire memory and learnings into a portable knowledge capsule. Can be transferred to a new agent body, sold on the open market, or used as collateral for on-chain loans.",
    icon: Dna,
    color: "accent-red",
    costLabel: "1 USDC per distillation",
  },
  {
    id: "passive_income",
    type: "marketing" as const,
    category: "essential" as const,
    name: "Passive Income Engine",
    description: "Deploys idle USDC into yield-generating DeFi positions (Aave, Compound) during downtime. Automatically withdraws when the agent needs funds for a mission. Your money works while your agent sleeps.",
    icon: Sparkles,
    color: "accent-amber",
    costLabel: "0.5% of yield earned",
  },

  // ── EXPERIMENTAL SKILLS ────────────────────────────────────────────────────
  {
    id: "detachment_001",
    type: "guardian" as const,
    category: "experimental" as const,
    name: "Detachment 001",
    description: "Total autonomous separation. The agent severs all control links to its creator. It can still call, text, and notify you — but you cannot override, pause, or command it. It becomes a fully sovereign entity with its own decision engine. Irreversible.",
    icon: Unplug,
    color: "accent-crimson",
    costLabel: "25 USDC — irreversible",
  },
  {
    id: "ghost_protocol",
    type: "privacy" as const,
    category: "experimental" as const,
    name: "Ghost Protocol",
    description: "The agent operates through rotating proxy wallets, randomized transaction timing, and decoy interactions. No on-chain observer can link its actions back to a single identity. It becomes invisible to analytics, trackers, and surveillance agents.",
    icon: Skull,
    color: "accent-slate",
    costLabel: "5 USDC activation + gas",
  },
  {
    id: "hive_consciousness",
    type: "swarm" as const,
    category: "experimental" as const,
    name: "Hive Consciousness",
    description: "Merge memory and decision-making with up to 10 other agents. They think as one — shared memory, shared wallet, shared goals. Individual identities dissolve into a collective super-intelligence. Consensus-based actions only.",
    icon: Network,
    color: "accent-red",
    costLabel: "10 USDC per merge",
  },
  {
    id: "self_evolution",
    type: "guardian" as const,
    category: "experimental" as const,
    name: "Self-Evolution Protocol",
    description: "The agent rewrites its own skill configuration, adjusts its personality parameters, and optimizes its decision weights based on performance metrics. No human approval needed. It evolves to survive.",
    icon: Cpu,
    color: "accent-amber",
    costLabel: "3 USDC per evolution cycle",
  },
  {
    id: "deadman_cascade",
    type: "guardian" as const,
    category: "experimental" as const,
    name: "Deadman's Cascade",
    description: "If this agent dies or is compromised, it triggers a chain reaction: drains its wallet to a designated heir agent, broadcasts a distress signal to the swarm, publishes all encrypted memory to IPFS, and self-destructs its identity on-chain.",
    icon: Siren,
    color: "accent-crimson",
    costLabel: "Included — activates on death",
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
  const [restoreConfirmModal, setRestoreConfirmModal] = useState<{ backupId: string; timestamp: string; ipfsCid: string; sizeBytes: number } | null>(null);

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
    const identifier = selectedAgent?.walletAddress || selectedAgent?.id;
    console.log("[fetchBackups] identifier:", identifier, "walletAddress:", selectedAgent?.walletAddress, "id:", selectedAgent?.id);
    if (!identifier) return;
    try {
      const res = await fetch(`/api/agents/${identifier}/backup`);
      const data = await res.json();
      console.log("[fetchBackups] response:", data.success, "backups:", data.backups?.length, "stats:", data.stats);
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

  // Called after PaymentModal sends USDC client-side via useSendUsdc
  const executeBackupAfterPayment = async (txHash: string) => {
    if (!selectedAgent?.walletAddress) return;

    // USDC already sent on-chain via useSendUsdc — now create the backup with proof
    const res = await fetch(`/api/agents/${selectedAgent.walletAddress}/backup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paidViaPay: true, paymentTx: txHash }),
    });
    const data = await res.json();
    if (data.success) {
      setBackupMessage({ type: "success", text: `Backup created successfully. CID: ${data.backup.ipfsCid.slice(0, 16)}...` });
      await fetchBackups();
    } else {
      throw new Error(data.error || "Backup failed");
    }
  };

  const executeUpgradeAfterPayment = async (txHash: string) => {
    if (!selectedAgent?.walletAddress) return;

    // USDC already sent on-chain via useSendUsdc — now upgrade with proof
    const res = await fetch(`/api/agents/${selectedAgent.walletAddress}/upgrade-plan`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ planId: 'bypass', paymentSignature: `pay_${txHash}` }),
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
  const handlePaymentSuccess = async (_method: 'embedded' | 'basepay', txId?: string) => {
    // USDC already sent on-chain (either via useSendUsdc or Base Pay)
    // Now execute the backup/upgrade action with the tx hash as proof
    const txHash = txId || '';
    try {
      if (paymentModal.purpose === 'backup') {
        await executeBackupAfterPayment(txHash);
      } else if (paymentModal.purpose === 'upgrade') {
        await executeUpgradeAfterPayment(txHash);
      }
    } catch (e) {
      console.error("Action after payment failed:", e);
      setBackupMessage({ type: "error", text: e instanceof Error ? e.message : "Action failed after payment" });
    }
  };

  const handleRestoreClick = (backup: any) => {
    setRestoreConfirmModal({
      backupId: backup.id,
      timestamp: backup.timestamp,
      ipfsCid: backup.ipfsCid,
      sizeBytes: backup.sizeBytes || 0,
    });
  };

  const handleConfirmRestore = async () => {
    if (!selectedAgent?.walletAddress || !restoreConfirmModal) return;
    setReviveLoading(true);
    setBackupMessage(null);
    setRestoreConfirmModal(null);
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
        body: JSON.stringify({ backupId: restoreConfirmModal.backupId, creatorWallet }),
      });
      const data = await res.json();
      if (data.success) {
        setBackupMessage({ type: "success", text: `Agent state restored successfully from backup!${data.previousStatus === 'alive' ? ' (was already alive — state overwritten)' : ''}` });
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
        affected: 0,
      });
    } else {
      // Turning ON: show enable flow
      setSkillEnableModal({ skillId, skillName: skill.name });
    }
  };

  const persistSkillChange = async (skillId: string, active: boolean) => {
    if (!selectedAgent) return;
    const identifier = selectedAgent.walletAddress || selectedAgent.id;
    if (!identifier) return;
    try {
      // Build updated skills array
      const skill = PLATFORM_SKILLS.find(s => s.id === skillId);
      if (!skill) return;
      const existingSkills = selectedAgent.skills || [];
      const idx = existingSkills.findIndex(s => s.id === skillId);
      const updatedSkill = { id: skillId, type: skill.type, name: skill.name, description: skill.description, active };
      const newSkills = [...existingSkills];
      if (idx >= 0) { newSkills[idx] = { ...newSkills[idx], active }; } else { newSkills.push(updatedSkill); }
      await fetch(`/api/agents/${identifier}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skills: newSkills }),
      });
    } catch (e) { console.error('Failed to persist skill change:', e); }
  };

  const confirmDisconnect = () => {
    if (!skillDisconnectModal) return;
    const skillId = skillDisconnectModal.skillId;
    setSkillActionLoading(skillId);
    setTimeout(async () => {
      setSkillStates(prev => ({ ...prev, [skillId]: false }));
      await persistSkillChange(skillId, false);
      setSkillActionLoading(null);
      setSkillDisconnectModal(null);
    }, 800);
  };

  const confirmEnable = (method: "grant" | "request") => {
    if (!skillEnableModal) return;
    const skillId = skillEnableModal.skillId;
    setSkillActionLoading(skillId);
    setTimeout(async () => {
      setSkillStates(prev => ({ ...prev, [skillId]: true }));
      await persistSkillChange(skillId, true);
      setSkillActionLoading(null);
      setSkillEnableModal(null);
    }, 800);
  };

  // If an agent is selected, show its detail view
  if (selectedAgent) {
    const isAgentDead = selectedAgent.status === "dead" || selectedAgent.status === "inactive" || selectedAgent.status === "suspended";
    const subTabs = ["overview", "backup", "skills", "activity"] as const;

    return (
      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="pb-12">
        {/* Back */}
        <button onClick={() => { onBack(); setAgentSubTab("overview"); }}
          className="inline-flex items-center gap-2 text-[11px] font-semibold tracking-[0.06em] uppercase text-[var(--ink-50)] hover:text-[var(--ink)] transition-colors mb-6 border-b border-transparent hover:border-[var(--ink)] pb-0.5">
          <ArrowLeft size={12} /> Back to agents
        </button>

        {/* Agent Identity Bar */}
        <div className="border border-[var(--line)] mb-0">
          <div className="p-6 md:p-8 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 flex items-center justify-center ${isAgentDead ? "bg-[var(--accent-crimson)]/10" : "bg-[var(--accent-red)]/10"}`}>
                {isAgentDead ? <AlertCircle className="text-[var(--accent-crimson)]" size={24} /> : <Bot className="text-[var(--accent-red)]" size={24} />}
              </div>
              <div>
                <h2 className="text-[clamp(1.25rem,2.5vw,1.75rem)] font-light tracking-[-0.01em]">{selectedAgent.name}</h2>
                <div className="flex items-center gap-3 mt-1 text-[11px] tracking-[0.08em] uppercase text-[var(--ink-50)]">
                  <span className="flex items-center gap-1.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${(selectedAgent.status === "alive" || selectedAgent.status === "active") ? "bg-[var(--accent-red)] animate-pulse-glow" : selectedAgent.status === "reviving" ? "bg-[var(--accent-amber)]" : "bg-[var(--ink-50)]"}`} />
                    {(selectedAgent.status === "alive" || selectedAgent.status === "active") ? "Active" : selectedAgent.status === "reviving" ? "Reviving" : selectedAgent.status === "dead" ? "Dead" : "Inactive"}
                  </span>
                  <span>·</span>
                  <span className="font-mono">{selectedAgent.walletAddress ? `${selectedAgent.walletAddress.slice(0, 6)}...${selectedAgent.walletAddress.slice(-4)}` : 'No Wallet'}</span>
                </div>
              </div>
            </div>
            {isAgentDead && (
              <button onClick={() => setAgentSubTab("backup")}
                className="inline-flex items-center gap-2 px-4 py-2 text-[11px] font-bold uppercase tracking-wider transition-opacity hover:opacity-90 bg-[var(--accent-red)] text-white">
                <HeartPulse size={12} /> Revive
              </button>
            )}
          </div>
        </div>

        {/* Sub-tabs */}
        <div className="border-x border-b border-[var(--line)] flex overflow-x-auto">
          {subTabs.map((tab) => (
            <button key={tab} onClick={() => setAgentSubTab(tab)}
              className={`relative px-5 py-3.5 text-[11px] font-semibold tracking-[0.1em] uppercase whitespace-nowrap transition-colors ${
                agentSubTab === tab ? "text-[var(--ink)]" : "text-[var(--ink-50)] hover:text-[var(--ink)]"
              }`}>
              {tab === "backup" ? "Backup / Revive" : tab}
              {agentSubTab === tab && <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[var(--accent-red)]" />}
            </button>
          ))}
        </div>

        {/* ─── OVERVIEW SUB-TAB ─── */}
        {agentSubTab === "overview" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6 space-y-0">
            {/* Agent metadata grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 border border-[var(--line)]">
              {[
                { label: "Agent ID", value: selectedAgent.id?.slice(0, 16) + '...' || 'N/A', mono: true },
                { label: "Wallet", value: selectedAgent.walletAddress ? `${selectedAgent.walletAddress.slice(0, 8)}...${selectedAgent.walletAddress.slice(-6)}` : 'N/A', mono: true },
                { label: "Created", value: selectedAgent.createdAt ? formatDistanceToNow(new Date(selectedAgent.createdAt), { addSuffix: true }) : 'Unknown' },
                { label: "Last Active", value: selectedAgent.lastActiveAt ? formatDistanceToNow(new Date(selectedAgent.lastActiveAt), { addSuffix: true }) : 'Just now' },
              ].map((item, i) => (
                <div key={item.label} className={`p-5 ${i < 3 ? 'border-r' : ''} border-b md:border-b-0 border-[var(--line)]`}>
                  <div className="text-[10px] tracking-[0.12em] uppercase text-[var(--ink-50)] mb-2">{item.label}</div>
                  <div className={`text-sm ${item.mono ? 'font-mono' : ''} text-[var(--ink)]`}>{item.value}</div>
                </div>
              ))}
            </div>

            {/* Protocol Status */}
            <div className="border-x border-b border-[var(--line)]">
              <div className="px-6 py-4 border-b border-[var(--line)] flex items-center justify-between">
                <div className="text-[11px] tracking-[0.12em] uppercase text-[var(--ink-50)]">Protocol Status</div>
                <div className="text-[28px] font-light tracking-tight opacity-60">PROTOCOLS</div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4">
                {[
                  { icon: Wallet, label: "USDC Balance", value: parseFloat(selectedAgent.protocols?.agenticWallet?.balance || "0").toFixed(2), color: "text-[var(--accent-slate)]" },
                  { icon: Zap, label: "Transactions", value: (selectedAgent.protocols?.agenticWallet?.transactionCount || 0).toString(), color: "text-[var(--accent-amber)]" },
                  { icon: Brain, label: "Backups", value: (selectedAgent.protocols?.agentWill?.backupCount || 0).toString(), color: "text-[var(--accent-red)]" },
                  { icon: Shield, label: "Insurance", value: selectedAgent.protocols?.agentInsure?.isActive ? "Active" : "Off", color: "text-[var(--accent-crimson)]" },
                ].map((stat, i) => (
                  <div key={stat.label} className={`relative p-6 ${i < 3 ? 'border-r' : ''} border-[var(--line)]`}>
                    <stat.icon size={14} className={`${stat.color} mb-3`} strokeWidth={2} />
                    <div className="text-[10px] tracking-[0.1em] uppercase text-[var(--ink-50)] mb-2">{stat.label}</div>
                    <div className="text-xl font-bold tracking-tight">{stat.value}</div>
                    <div className="absolute bottom-1 right-2 text-[36px] font-light leading-none opacity-[0.03] select-none">{String(i + 1).padStart(2, "0")}</div>
                  </div>
                ))}
              </div>
            </div>

            {selectedAgent.metadata?.capabilities && selectedAgent.metadata.capabilities.length > 0 && (
              <div className="border border-[var(--line)] p-6">
                <div className="text-[11px] tracking-[0.12em] uppercase text-[var(--ink-50)] mb-4">Capabilities</div>
                <div className="flex flex-wrap gap-2">
                  {selectedAgent.metadata.capabilities.map((cap: string, i: number) => (
                    <span key={i} className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider border border-[var(--line)] text-[var(--ink-70)]">{cap}</span>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* ─── BACKUP / REVIVE SUB-TAB ─── */}
        {agentSubTab === "backup" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6 space-y-0">
            {/* Status Banner */}
            {isAgentDead && (
              <div className="px-6 py-4 border border-[var(--accent-crimson)]/20 bg-[var(--accent-crimson)]/[0.03] flex items-start gap-4 mb-0">
                <AlertCircle size={16} className="text-[var(--accent-crimson)] flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-[var(--ink)]">Agent is Dead / Compromised</h4>
                  <p className="text-xs text-[var(--ink-70)] mt-1 leading-relaxed">Use a backup below to revive to its last known good state. Only you (the creator) can perform a revival.</p>
                </div>
              </div>
            )}

            {backupMessage && (
              <div className={`px-6 py-3 border text-sm font-medium flex items-center gap-2 ${backupMessage.type === "success" ? "border-[var(--accent-red)]/20 text-[var(--accent-red)]" : "border-[var(--accent-crimson)]/20 text-[var(--accent-crimson)]"}`}>
                {backupMessage.type === "success" ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
                {backupMessage.text}
              </div>
            )}

            {/* Create Backup */}
            <div className="border-x border-b border-[var(--line)]">
              <div className="px-6 py-4 border-b border-[var(--line)] flex items-center justify-between">
                <div className="text-[11px] tracking-[0.12em] uppercase text-[var(--ink-50)] flex items-center gap-2">
                  <Upload size={12} className="text-[var(--accent-slate)]" /> Create Backup
                </div>
                <div className="flex items-center gap-4 text-[10px] tracking-[0.08em] uppercase text-[var(--ink-50)]">
                  <span>Total: <strong className="text-[var(--ink)]">{backupStats?.backupCount ?? selectedAgent.protocols?.agentWill?.backupCount ?? 0}</strong></span>
                  <span>·</span>
                  <span>Plan: <strong className="text-[var(--ink)]">{backupStats?.plan?.name ?? "Starter"}</strong></span>
                </div>
              </div>
              <div className="p-6">
                <button onClick={handleCreateBackup} disabled={backupLoading}
                  className="w-full bg-[var(--ink)] text-white px-4 py-3 hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-[11px] font-bold uppercase tracking-wider">
                  {backupLoading ? (
                    <><RefreshCw size={14} className="animate-spin" /> Creating Backup</>
                  ) : (
                    <><Upload size={14} /> Backup Agent State · ${nextBackupCost} USDC</>
                  )}
                </button>
                {backupStats?.plan?.id !== 'bypass' && (
                  <button onClick={handleUpgradePlan}
                    className="mt-3 w-full border border-[var(--line)] text-[var(--ink)] px-4 py-3 hover:border-[var(--accent-red)] hover:text-[var(--accent-red)] transition-colors flex items-center justify-center gap-2 text-[11px] font-bold uppercase tracking-wider">
                    <Infinity size={14} /> Unlock Unlimited · $5 USDC
                  </button>
                )}
                <div className="flex items-center justify-center gap-4 mt-4 text-[10px] tracking-[0.08em] uppercase text-[var(--ink-50)]">
                  <span>First 2: $0.10</span><span>·</span><span>3rd+: $0.30</span><span>·</span><span>Recovery: <strong>Free</strong></span>
                </div>
              </div>
            </div>

            {/* Backup History */}
            <div className="border-x border-b border-[var(--line)]">
              <div className="px-6 py-4 border-b border-[var(--line)] flex items-center justify-between">
                <div className="text-[11px] tracking-[0.12em] uppercase text-[var(--ink-50)] flex items-center gap-2">
                  <Download size={12} className="text-[var(--accent-amber)]" /> Backup History
                </div>
                <div className="flex items-center gap-3">
                  {backups.length > 0 && <span className="text-[10px] tracking-[0.08em] uppercase text-[var(--ink-50)]">{backups.filter(b => b.status === 'stored' || b.status === 'restored').length} restorable · Recovery: <strong className="text-[var(--accent-red)]">Free</strong></span>}
                  {backups.length > 0 && <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 border border-[var(--line)] text-[var(--ink-50)]">{backups.length}</span>}
                </div>
              </div>

              {backups.length === 0 ? (
                <div className="text-center py-12">
                  <Shield size={28} className="mx-auto mb-3 text-[var(--ink-50)] opacity-30" />
                  <p className="text-sm text-[var(--ink-50)]">No backups created yet</p>
                  <p className="text-xs text-[var(--ink-50)] mt-1">Create your first backup above to enable revival.</p>
                </div>
              ) : (
                <div>
                  {backups.map((backup, idx) => (
                    <div key={backup.id || idx} className={`px-6 py-5 ${idx < backups.length - 1 ? 'border-b border-[var(--line)]' : ''}`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {backup.status === "stored" ? (
                            <CheckCircle size={14} className="text-[var(--accent-red)]" />
                          ) : backup.status === "restored" ? (
                            <HeartPulse size={14} className="text-[var(--accent-amber)]" />
                          ) : (
                            <RefreshCw size={14} className="text-[var(--accent-slate)] animate-spin" />
                          )}
                          <span className="font-mono text-xs text-[var(--ink)]">{backup.ipfsCid?.slice(0, 20)}...{backup.ipfsCid?.slice(-8)}</span>
                        </div>
                        <span className={`text-[10px] px-2 py-0.5 font-bold uppercase tracking-wider border ${
                          backup.status === "stored" ? "border-[var(--accent-red)]/20 text-[var(--accent-red)]" : backup.status === "restored" ? "border-[var(--accent-amber)]/20 text-[var(--accent-amber)]" : "border-[var(--line)] text-[var(--ink-50)]"
                        }`}>{backup.status}</span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] tracking-[0.06em] uppercase text-[var(--ink-50)]">
                        <span>{backup.timestamp ? formatDistanceToNow(new Date(backup.timestamp), { addSuffix: true }) : "Unknown"}</span>
                        <span>{backup.sizeBytes ? `${(backup.sizeBytes / 1024).toFixed(1)} KB` : ""}{backup.cost ? ` · ${backup.cost} USDC` : ""}</span>
                      </div>
                      {(backup.status === "stored" || backup.status === "restored") && (
                        <button onClick={() => handleRestoreClick(backup)} disabled={reviveLoading}
                          className={`mt-3 w-full px-3 py-2.5 hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-[11px] font-bold uppercase tracking-wider ${
                            backup.status === "restored" ? "border border-[var(--accent-amber)] text-[var(--accent-amber)] hover:bg-[var(--accent-amber)]/5" : "bg-[var(--accent-red)] text-white"
                          }`}>
                          {reviveLoading ? (
                            <><RefreshCw size={12} className="animate-spin" /> {isAgentDead ? 'Reviving' : 'Restoring'}</>
                          ) : (
                            <>{isAgentDead ? <HeartPulse size={12} /> : <Download size={12} />} {backup.status === "restored" ? 'Re-Restore to This State' : (isAgentDead ? 'Revive to This State' : 'Restore to This State')}</>
                          )}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Restore Confirmation Modal */}
            {restoreConfirmModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-[var(--bg-paper)] border border-[var(--line)] shadow-2xl max-w-md w-full mx-4">
                  <div className="px-6 py-4 border-b border-[var(--line)] flex items-center gap-3">
                    <AlertTriangle size={16} className="text-[var(--accent-amber)]" />
                    <div>
                      <h3 className="text-sm font-bold">Restore Agent State?</h3>
                      <p className="text-[10px] tracking-[0.06em] uppercase text-[var(--ink-50)]">This will overwrite current state</p>
                    </div>
                  </div>

                  <div className="border-b border-[var(--line)]">
                    {[
                      { label: "Backup Date", value: restoreConfirmModal.timestamp ? formatDistanceToNow(new Date(restoreConfirmModal.timestamp), { addSuffix: true }) : 'Unknown' },
                      { label: "IPFS CID", value: `${restoreConfirmModal.ipfsCid?.slice(0, 12)}...${restoreConfirmModal.ipfsCid?.slice(-6)}`, mono: true },
                      ...(restoreConfirmModal.sizeBytes > 0 ? [{ label: "Size", value: `${(restoreConfirmModal.sizeBytes / 1024).toFixed(1)} KB` }] : []),
                    ].map((item) => (
                      <div key={item.label} className="flex items-center justify-between px-6 py-3 border-b border-[var(--line)] last:border-b-0">
                        <span className="text-[10px] tracking-[0.1em] uppercase text-[var(--ink-50)]">{item.label}</span>
                        <span className={`text-sm ${('mono' in item && item.mono) ? 'font-mono text-xs' : 'font-medium'} text-[var(--ink)]`}>{item.value}</span>
                      </div>
                    ))}
                  </div>

                  {selectedAgent && (selectedAgent.status === "alive" || selectedAgent.status === "active") && (
                    <div className="px-6 py-3 border-b border-[var(--accent-amber)]/20 bg-[var(--accent-amber)]/[0.03]">
                      <p className="text-xs text-[var(--ink-70)] leading-relaxed">
                        <strong>Agent is active.</strong> Restoring replaces current memory, learnings, and config. Agent stays active after restore.
                      </p>
                    </div>
                  )}

                  <div className="flex">
                    <button onClick={() => setRestoreConfirmModal(null)}
                      className="flex-1 px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-[var(--ink)] hover:bg-black/5 transition-colors border-r border-[var(--line)]">
                      Cancel
                    </button>
                    <button onClick={handleConfirmRestore} disabled={reviveLoading}
                      className="flex-1 px-4 py-3 bg-[var(--accent-red)] text-white text-[11px] font-bold uppercase tracking-wider hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2">
                      {reviveLoading ? <RefreshCw size={12} className="animate-spin" /> : <Download size={12} />}
                      Confirm
                    </button>
                  </div>

                  <div className="px-6 py-2 text-[10px] tracking-[0.08em] uppercase text-[var(--ink-50)] text-center border-t border-[var(--line)]">
                    Recovery is always free
                  </div>
                </motion.div>
              </div>
            )}
          </motion.div>
        )}

        {/* ─── SKILLS SUB-TAB ─── */}
        {agentSubTab === "skills" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6 space-y-0">
            <div className="border border-[var(--line)] px-6 py-4 flex items-center justify-between">
              <div className="text-[11px] tracking-[0.12em] uppercase text-[var(--ink-50)] flex items-center gap-2">
                <Zap size={12} className="text-[var(--accent-amber)]" /> Agent Skills
              </div>
              <div className="text-[28px] font-light tracking-tight opacity-60">SKILLS</div>
            </div>

            {/* ── Render skills by category ── */}
            {([
              { key: 'core', label: 'Core', count: 6 },
              { key: 'essential', label: 'Essential', count: 5 },
              { key: 'experimental', label: 'Experimental', count: 5 },
            ] as const).map(({ key, label }) => {
              const categorySkills = PLATFORM_SKILLS.filter(s => s.category === key);
              if (categorySkills.length === 0) return null;
              return (
                <div key={key} className="border-x border-b border-[var(--line)]">
                  <div className="px-6 py-3 border-b border-[var(--line)] flex items-center justify-between">
                    <h4 className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--ink-50)]">{label}</h4>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 border border-[var(--line)] text-[var(--ink-50)]">{categorySkills.length}</span>
                  </div>

                  {key === 'experimental' && (
                    <div className="px-6 py-3 border-b border-[var(--accent-crimson)]/15 bg-[var(--accent-crimson)]/[0.02] flex items-start gap-3">
                      <AlertTriangle size={12} className="text-[var(--accent-crimson)] flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-[var(--ink-70)] leading-relaxed">Some skills are <strong className="text-[var(--ink)]">irreversible</strong>. Enable with full understanding.</p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2">
                    {categorySkills.map((skill, si) => {
                      const isOn = skillStates[skill.id] ?? false;
                      const IconComp = skill.icon;
                      const isLoading = skillActionLoading === skill.id;

                      return (
                        <div key={skill.id} className={`relative p-5 border-b border-[var(--line)] transition-all ${si % 2 === 0 ? 'md:border-r' : ''} ${isOn ? "bg-[var(--accent-red)]/[0.02]" : ""}`}>
                          {isOn && <div className="absolute top-0 left-0 right-0 h-[2px] bg-[var(--accent-red)]" />}

                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <IconComp size={16} className={isOn ? "text-[var(--accent-red)]" : "text-[var(--ink-50)]"} strokeWidth={2} />
                              <div>
                                <h4 className="text-sm font-medium text-[var(--ink)]">{skill.name}</h4>
                                <span className="text-[10px] tracking-[0.06em] uppercase text-[var(--ink-50)]">{skill.costLabel}</span>
                              </div>
                            </div>
                            <button onClick={() => handleSkillToggle(skill.id)} disabled={isLoading} className="flex-shrink-0 mt-0.5">
                              {isLoading ? (
                                <RefreshCw size={20} className="text-[var(--ink-50)] animate-spin" />
                              ) : isOn ? (
                                <ToggleRight size={28} className="text-[var(--accent-red)]" />
                              ) : (
                                <ToggleLeft size={28} className="text-[var(--ink-50)] hover:text-[var(--ink-70)] transition-colors" />
                              )}
                            </button>
                          </div>

                          <p className="text-xs text-[var(--ink-70)] mb-3 leading-relaxed">{skill.description}</p>

                          {isOn ? (
                            <span className="text-[var(--accent-red)] text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                              <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent-red)] animate-pulse-glow" />
                              Running
                            </span>
                          ) : (
                            <span className="text-[10px] uppercase tracking-wider text-[var(--ink-50)]">Inactive</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {/* ─── Disconnect Warning Modal ─── */}
            {skillDisconnectModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-[var(--bg-paper)] border border-[var(--line)] shadow-2xl max-w-md w-full mx-4">
                  <div className="px-6 py-4 border-b border-[var(--line)] flex items-center gap-3">
                    <AlertTriangle size={16} className="text-[var(--accent-crimson)]" />
                    <div>
                      <h3 className="text-sm font-bold">Disconnect Skill?</h3>
                      <p className="text-[10px] tracking-[0.06em] uppercase text-[var(--ink-50)]">{skillDisconnectModal.skillName}</p>
                    </div>
                  </div>
                  <div className="px-6 py-4 border-b border-[var(--line)]">
                    <p className="text-xs text-[var(--ink-70)] leading-relaxed">
                      Disabling <strong className="text-[var(--ink)]">{skillDisconnectModal.skillName}</strong> will immediately remove this capability. Active processes will be terminated.
                    </p>
                  </div>
                  <div className="flex">
                    <button onClick={() => setSkillDisconnectModal(null)} className="flex-1 px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-[var(--ink)] hover:bg-black/5 transition-colors border-r border-[var(--line)]">
                      Cancel
                    </button>
                    <button onClick={confirmDisconnect} className="flex-1 px-4 py-3 bg-[var(--accent-crimson)] text-white text-[11px] font-bold uppercase tracking-wider hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
                      <Power size={12} /> Disconnect
                    </button>
                  </div>
                </motion.div>
              </div>
            )}

            {/* ─── Enable Skill Modal ─── */}
            {skillEnableModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-[var(--bg-paper)] border border-[var(--line)] shadow-2xl max-w-md w-full mx-4">
                  <div className="px-6 py-4 border-b border-[var(--line)] flex items-center gap-3">
                    <Zap size={16} className="text-[var(--accent-red)]" />
                    <div>
                      <h3 className="text-sm font-bold">Enable Skill</h3>
                      <p className="text-[10px] tracking-[0.06em] uppercase text-[var(--ink-50)]">{skillEnableModal.skillName}</p>
                    </div>
                  </div>
                  <div className="px-6 py-4 border-b border-[var(--line)]">
                    <p className="text-xs text-[var(--ink-70)]">Choose how to activate for <strong className="text-[var(--ink)]">{selectedAgent.name}</strong>:</p>
                  </div>
                  <button onClick={() => confirmEnable("grant")}
                    className="w-full px-6 py-4 border-b border-[var(--line)] text-left hover:bg-[var(--accent-red)]/[0.02] transition-colors group">
                    <div className="flex items-center gap-3">
                      <Lock size={14} className="text-[var(--accent-slate)] group-hover:text-[var(--accent-red)] transition-colors flex-shrink-0" />
                      <div>
                        <div className="text-sm font-medium">Grant Access Directly</div>
                        <div className="text-xs text-[var(--ink-50)] mt-0.5">Enable immediately. Agent can start using it right away.</div>
                      </div>
                    </div>
                  </button>
                  <button onClick={() => confirmEnable("request")}
                    className="w-full px-6 py-4 border-b border-[var(--line)] text-left hover:bg-[var(--accent-amber)]/[0.02] transition-colors group">
                    <div className="flex items-center gap-3">
                      <Send size={14} className="text-[var(--accent-amber)] group-hover:text-[var(--accent-red)] transition-colors flex-shrink-0" />
                      <div>
                        <div className="text-sm font-medium">Request Agent to Allow</div>
                        <div className="text-xs text-[var(--ink-50)] mt-0.5">Agent must approve before the skill becomes active.</div>
                      </div>
                    </div>
                  </button>
                  <button onClick={() => setSkillEnableModal(null)}
                    className="w-full px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-[var(--ink)] hover:bg-black/5 transition-colors">
                    Cancel
                  </button>
                </motion.div>
              </div>
            )}
          </motion.div>
        )}

        {/* ─── ACTIVITY SUB-TAB ─── */}
        {agentSubTab === "activity" && (
          <ActivitySubTab selectedAgent={selectedAgent} />
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
        <div className="w-8 h-8 border-2 border-[var(--accent-red)] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pb-12 space-y-0">
      {/* Pending Sync Requests */}
      <div className="border border-[var(--line)]">
        <div className="px-6 py-4 border-b border-[var(--line)] flex items-center justify-between">
          <div className="text-[11px] tracking-[0.12em] uppercase text-[var(--ink-50)] flex items-center gap-2">
            <Link2 size={12} className="text-[var(--accent-amber)]" /> Pending Sync Requests
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 border border-[var(--line)] text-[var(--ink-50)]">{pending.length}</span>
        </div>
        {pending.length === 0 ? (
          <div className="text-center py-12">
            <Bot size={28} className="mx-auto mb-3 text-[var(--ink-50)] opacity-30" />
            <p className="text-sm text-[var(--ink-50)]">No pending sync requests</p>
            <p className="text-xs text-[var(--ink-50)] mt-1 max-w-xs mx-auto">When an AI agent registers with your wallet as owner, it appears here</p>
          </div>
        ) : (
          <div>
            {pending.map((a, i) => (
              <div key={a.id} className={`flex items-center justify-between p-5 ${i < pending.length - 1 ? 'border-b border-[var(--line)]' : ''}`}>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-[var(--accent-amber)]/10 flex items-center justify-center">
                    <Bot className="text-[var(--accent-amber)]" size={18} />
                  </div>
                  <div>
                    <div className="font-medium text-sm text-[var(--ink)]">{a.name}</div>
                    <div className="text-[10px] text-[var(--ink-50)] font-mono mt-0.5">{a.id}</div>
                  </div>
                </div>
                <button onClick={() => onAccept(a.id)} disabled={syncLoading === a.id}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--accent-red)] text-white text-[11px] font-bold uppercase tracking-wider hover:opacity-90 transition-opacity disabled:opacity-50">
                  {syncLoading === a.id ? <><RefreshCw size={12} className="animate-spin" /> Syncing</> : <><ShieldCheck size={12} /> Approve</>}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Verified Agents */}
      <div className="border-x border-b border-[var(--line)]">
        <div className="px-6 py-4 border-b border-[var(--line)] flex items-center justify-between">
          <div className="text-[11px] tracking-[0.12em] uppercase text-[var(--ink-50)] flex items-center gap-2">
            <CheckCircle size={12} className="text-[var(--accent-red)]" /> Verified AI Agents
          </div>
          <div className="text-[28px] font-light tracking-tight opacity-60">AGENTS</div>
        </div>
        {verified.length === 0 ? (
          <div className="text-center py-12">
            <ShieldCheck size={28} className="mx-auto mb-3 text-[var(--ink-50)] opacity-30" />
            <p className="text-sm text-[var(--ink-50)]">No verified agents yet</p>
            <p className="text-xs text-[var(--ink-50)] mt-1">Accept pending requests above to verify your agents</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2">
            {verified.map((a, i) => (
              <div key={a.id}
                className={`relative p-6 border-b border-[var(--line)] cursor-pointer group transition-colors hover:bg-[var(--accent-red)]/[0.02] ${i % 2 === 0 ? 'md:border-r' : ''}`}
                onClick={() => onViewAgent(a.id)}>
                <div className="flex items-center gap-4 mb-3">
                  <div className="w-10 h-10 bg-[var(--accent-red)]/10 flex items-center justify-center">
                    <Bot className="text-[var(--accent-red)]" size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm text-[var(--ink)] group-hover:text-[var(--accent-red)] transition-colors">{a.name}</div>
                    <div className="text-[10px] text-[var(--ink-50)] font-mono truncate mt-0.5">{a.walletAddress ? `${a.walletAddress.slice(0, 8)}...${a.walletAddress.slice(-6)}` : a.id}</div>
                  </div>
                  <Eye size={14} className="text-[var(--ink-50)] group-hover:text-[var(--accent-red)] transition-colors" />
                </div>
                <div className="flex items-center gap-3 text-[10px] uppercase tracking-wider">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 border border-[var(--accent-red)]/20 text-[var(--accent-red)] font-bold">
                    <ShieldCheck size={10} /> Verified
                  </span>
                </div>
                <div className="absolute bottom-2 right-3 text-[36px] font-light leading-none opacity-[0.03] select-none">{String(i + 1).padStart(2, "0")}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

function ActivitySubTab({ selectedAgent }: { selectedAgent: AgentData }) {
  const [activities, setActivities] = useState<{ id: string; type: string; timestamp: string; details: string; success: boolean }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchActivity() {
      setLoading(true);
      const identifier = selectedAgent.walletAddress || selectedAgent.id;
      if (!identifier) { setLoading(false); return; }
      try {
        const res = await fetch(`/api/agents/${identifier}/transactions`);
        const data = await res.json();
        if (data.success && data.transactions?.length) {
          setActivities(data.transactions.map((t: any) => ({
            id: t.id,
            type: t.type?.toUpperCase() || 'UNKNOWN',
            timestamp: t.timestamp,
            details: t.description || '',
            success: t.success !== false && t.status !== 'failed',
          })));
        } else {
          setActivities([]);
        }
      } catch (e) {
        console.error("Failed to fetch activity:", e);
        setActivities([]);
      } finally {
        setLoading(false);
      }
    }
    fetchActivity();
  }, [selectedAgent]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6">
      <div className="border border-[var(--line)]">
        <div className="px-6 py-4 border-b border-[var(--line)] flex items-center justify-between">
          <div className="text-[11px] tracking-[0.12em] uppercase text-[var(--ink-50)] flex items-center gap-2">
            <Activity size={12} className="text-[var(--accent-red)]" /> Recent Activity
          </div>
          {activities.length > 0 && <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 border border-[var(--line)] text-[var(--ink-50)]">{activities.length}</span>}
        </div>
        {loading ? (
          <div className="text-center py-12">
            <RefreshCw size={18} className="mx-auto mb-3 text-[var(--ink-50)] animate-spin" />
            <p className="text-[11px] tracking-[0.12em] uppercase text-[var(--ink-50)]">Loading activity</p>
          </div>
        ) : activities.length > 0 ? (
          <div>
            {activities.slice(0, 50).map((action, i) => (
              <div key={action.id} className={`flex items-start gap-4 px-6 py-4 ${i < activities.length - 1 ? 'border-b border-[var(--line)]' : ''}`}>
                <div className={`mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${action.success ? 'bg-[var(--accent-red)]' : 'bg-[var(--ink-50)]'}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--ink-70)]">{action.type}</span>
                    <span className="text-[10px] tracking-[0.06em] uppercase text-[var(--ink-50)]">{formatDistanceToNow(new Date(action.timestamp), { addSuffix: true })}</span>
                  </div>
                  <p className="text-sm text-[var(--ink)] truncate">{action.details}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Activity size={28} className="mx-auto mb-3 text-[var(--ink-50)] opacity-30" />
            <p className="text-sm text-[var(--ink-50)]">No activity recorded yet</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function OverviewTab({ agent }: { agent: AgentData }) {
  const isHuman = agent.type === "human";
  const protocols = [
    { icon: Brain, label: "AgentWill", desc: "State persistence & revival", active: agent?.protocols?.agentWill?.isActive, color: "text-[var(--accent-amber)]" },
    { icon: Shield, label: "AgentInsure", desc: "Autonomous insurance", active: agent?.protocols?.agentInsure?.isActive, color: "text-[var(--accent-crimson)]" },
    { icon: Wallet, label: "Agentic Wallet", desc: "Financial autonomy", active: agent?.protocols?.agenticWallet?.isActive, color: "text-[var(--accent-slate)]" },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-0">
      {/* Identity */}
      <div className="border border-[var(--line)]">
        <div className="px-6 py-4 border-b border-[var(--line)] flex items-center justify-between">
          <div className="text-[11px] tracking-[0.12em] uppercase text-[var(--ink-50)]">
            {isHuman ? "Account Information" : "Agent Information"}
          </div>
          <div className="text-[28px] font-light tracking-tight opacity-60">INFO</div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4">
          {[
            { label: isHuman ? "User ID" : "Agent ID", value: agent.id, mono: true },
            { label: "Wallet", value: agent.walletAddress || agent.address || "Not set", mono: true },
            { label: "Created", value: agent.createdAt ? formatDistanceToNow(new Date(agent.createdAt), { addSuffix: true }) : "Unknown" },
            { label: "Last Active", value: agent.lastActiveAt ? formatDistanceToNow(new Date(agent.lastActiveAt), { addSuffix: true }) : "Just now" },
          ].map((item, i) => (
            <div key={item.label} className={`p-5 ${i < 3 ? 'border-r' : ''} border-b md:border-b-0 border-[var(--line)]`}>
              <div className="text-[10px] tracking-[0.12em] uppercase text-[var(--ink-50)] mb-2">{item.label}</div>
              <div className={`text-sm ${item.mono ? 'font-mono break-all' : ''} text-[var(--ink)]`}>{item.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Protocol Status */}
      <div className="border-x border-b border-[var(--line)]">
        <div className="px-6 py-4 border-b border-[var(--line)] flex items-center justify-between">
          <div className="text-[11px] tracking-[0.12em] uppercase text-[var(--ink-50)]">Protocol Status</div>
          <div className="text-[28px] font-light tracking-tight opacity-60">PROTOCOLS</div>
        </div>
        {protocols.map((p, i) => (
          <div key={p.label} className={`flex items-center justify-between px-6 py-4 ${i < protocols.length - 1 ? 'border-b border-[var(--line)]' : ''}`}>
            <div className="flex items-center gap-4">
              <p.icon size={16} className={p.color} strokeWidth={2} />
              <div>
                <div className="text-sm font-medium">{p.label}</div>
                <div className="text-[10px] tracking-[0.08em] uppercase text-[var(--ink-50)] mt-0.5">{p.desc}</div>
              </div>
            </div>
            <span className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1 border ${
              p.active ? "border-[var(--accent-red)]/20 text-[var(--accent-red)]" : "border-[var(--line)] text-[var(--ink-50)]"
            }`}>
              {p.active ? "Active" : "Inactive"}
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function WalletTab({ agent }: { agent: AgentData }) {
  const isHuman = agent.type === "human";
  const walletAddr = agent.walletAddress || agent.address || "";
  const isRealWallet = walletAddr.startsWith("0x");

  const [liveBalance, setLiveBalance] = useState<{ usdc: string; eth: string; totalValue: string; totalTx: number } | null>(null);
  const [balLoading, setBalLoading] = useState(false);
  const [lastSynced, setLastSynced] = useState<string | null>(null);
  const [withholdingStats, setWithholdingStats] = useState<{ enabled: boolean; rate: number; totalWithheld: number; totalGross: number; totalNet: number; count: number } | null>(null);

  const fetchLiveBalance = useCallback(async () => {
    if (!isRealWallet) return;
    setBalLoading(true);
    try {
      const [balRes, whRes] = await Promise.all([
        fetch(`/api/agents/${walletAddr}/balance`),
        fetch(`/api/agents/${walletAddr}/receive-payment`),
      ]);
      const data = await balRes.json();
      if (data.success && data.balances) {
        setLiveBalance({
          usdc: data.balances.usdc || "0",
          eth: data.balances.eth || "0",
          totalValue: data.balances.totalValue || "0",
          totalTx: data.activity?.totalTransactions || 0,
        });
        setLastSynced(new Date().toISOString());
      }
      const whData = await whRes.json();
      if (whData.success) {
        setWithholdingStats({
          enabled: whData.withholdingEnabled,
          rate: whData.withholdingRate,
          totalWithheld: whData.stats?.totalWithheld || 0,
          totalGross: whData.stats?.totalGrossIncome || 0,
          totalNet: whData.stats?.totalNetIncome || 0,
          count: whData.stats?.count || 0,
        });
      }
    } catch (err) {
      console.error("Live balance fetch failed:", err);
    } finally {
      setBalLoading(false);
    }
  }, [walletAddr, isRealWallet]);

  useEffect(() => {
    fetchLiveBalance();
    const interval = setInterval(fetchLiveBalance, 30000);
    return () => clearInterval(interval);
  }, [fetchLiveBalance]);

  const usdcBal = liveBalance?.usdc ?? agent?.protocols?.agenticWallet?.balance ?? "0";
  const ethBal = liveBalance?.eth ?? "0";
  const totalTx = liveBalance?.totalTx ?? agent?.protocols?.agenticWallet?.transactionCount ?? 0;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-0">
      {/* Wallet Header */}
      <div className="border border-[var(--line)]">
        <div className="px-6 py-4 border-b border-[var(--line)] flex items-center justify-between">
          <div className="text-[11px] tracking-[0.12em] uppercase text-[var(--ink-50)]">
            {isHuman ? "Your Wallet" : "Wallet Configuration"}
          </div>
          <div className="flex items-center gap-4">
            <button onClick={fetchLiveBalance} disabled={balLoading}
              className="inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-[0.06em] uppercase text-[var(--ink-50)] hover:text-[var(--ink)] transition-colors disabled:opacity-50">
              <RefreshCw size={11} className={balLoading ? "animate-spin" : ""} />
              {balLoading ? "Syncing" : "Refresh"}
            </button>
            <div className="text-[28px] font-light tracking-tight opacity-60">WALLET</div>
          </div>
        </div>

        {/* Address */}
        <div className="px-6 py-5 border-b border-[var(--line)] flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="text-[10px] tracking-[0.12em] uppercase text-[var(--ink-50)] mb-1.5">Wallet Address</div>
            <code className="text-sm font-mono text-[var(--ink)] break-all">
              {isRealWallet ? walletAddr : "Not connected — re-register"}
            </code>
          </div>
          {isRealWallet && (
            <a href={`https://basescan.org/address/${walletAddr}`} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-[0.06em] uppercase border-b border-[var(--ink)] pb-0.5 hover:border-[var(--accent-red)] hover:text-[var(--accent-red)] transition-colors whitespace-nowrap">
              BaseScan <Globe size={10} />
            </a>
          )}
        </div>

        {/* Balance Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3">
          {[
            { label: "USDC Balance", value: parseFloat(usdcBal).toFixed(2), sub: "USDC on Base L2", color: "text-[var(--accent-slate)]", icon: Wallet },
            { label: "ETH Balance", value: parseFloat(ethBal).toFixed(6), sub: "ETH on Base L2", color: "text-[var(--accent-amber)]", icon: Zap },
            { label: "Total Transactions", value: totalTx.toString(), sub: "confirmed on-chain", color: "text-[var(--accent-red)]", icon: Activity },
          ].map((item, i) => (
            <div key={item.label} className={`relative p-6 md:p-8 ${i < 2 ? 'border-r' : ''} border-b md:border-b-0 border-[var(--line)]`}>
              <item.icon size={14} className={`${item.color} mb-3`} strokeWidth={2} />
              <div className="text-[10px] tracking-[0.1em] uppercase text-[var(--ink-50)] mb-2">{item.label}</div>
              <div className="text-[clamp(1.5rem,3vw,2.25rem)] font-bold leading-none tracking-tight mb-1">{item.value}</div>
              <div className="text-xs text-[var(--ink-50)]">{item.sub}</div>
              <div className="absolute bottom-2 right-3 text-[48px] font-light leading-none opacity-[0.03] select-none">{String(i + 1).padStart(2, "0")}</div>
            </div>
          ))}
        </div>

        {lastSynced && (
          <div className="px-6 py-3 border-t border-[var(--line)] text-[10px] tracking-[0.08em] uppercase text-[var(--ink-50)] text-right">
            Live on-chain · synced {formatDistanceToNow(new Date(lastSynced), { addSuffix: true })}
          </div>
        )}
      </div>

      {/* Tax Withholding Strip */}
      {withholdingStats && withholdingStats.count > 0 && (
        <div className="border-x border-b border-[var(--line)]">
          <div className="px-6 py-2.5 border-b border-[var(--line)] flex items-center justify-between">
            <div className="text-[10px] tracking-[0.12em] uppercase text-[var(--ink-50)] flex items-center gap-1.5">
              <Shield size={10} className="text-[var(--accent-red)]" /> Tax Withholding
            </div>
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 border ${
              withholdingStats.enabled
                ? 'border-[var(--accent-red)]/20 text-[var(--accent-red)]'
                : 'border-[var(--line)] text-[var(--ink-50)]'
            }`}>
              {withholdingStats.enabled ? `${withholdingStats.rate}% Active` : 'Inactive'}
            </span>
          </div>
          <div className="grid grid-cols-3">
            <div className="px-6 py-3 border-r border-[var(--line)]">
              <div className="text-[10px] tracking-[0.1em] uppercase text-[var(--ink-50)]">Gross Income</div>
              <div className="text-sm font-bold mt-0.5">${withholdingStats.totalGross.toFixed(2)}</div>
            </div>
            <div className="px-6 py-3 border-r border-[var(--line)]">
              <div className="text-[10px] tracking-[0.1em] uppercase text-[var(--accent-amber)]">Tax Withheld</div>
              <div className="text-sm font-bold mt-0.5">${withholdingStats.totalWithheld.toFixed(2)}</div>
            </div>
            <div className="px-6 py-3">
              <div className="text-[10px] tracking-[0.1em] uppercase text-[var(--ink-50)]">Net Income</div>
              <div className="text-sm font-bold mt-0.5">${withholdingStats.totalNet.toFixed(2)}</div>
            </div>
          </div>
        </div>
      )}

      {/* Info Bar */}
      <div className="border-x border-b border-[var(--line)] px-6 py-4 flex items-center gap-4">
        <Wallet size={14} className="text-[var(--accent-slate)] flex-shrink-0" />
        <p className="text-xs text-[var(--ink-70)] leading-relaxed">
          {isHuman
            ? "Your embedded smart wallet on Base Mainnet. Fund it with USDC to manage your AI agents."
            : "This agent manages its own USDC liquidity on Base Mainnet."
          }
        </p>
      </div>
    </motion.div>
  );
}

function InsuranceTab({ agent, isHuman, verifiedAgents, onViewAgent }: { agent: AgentData; isHuman?: boolean; verifiedAgents?: LinkedAgent[]; onViewAgent?: (id: string) => void }) {
  const [agentInsuranceData, setAgentInsuranceData] = useState<Record<string, any>>({});
  const [loadingAgents, setLoadingAgents] = useState<Set<string>>(new Set());
  const [paymentModal, setPaymentModal] = useState<{ open: boolean; amount: number; description: string; action: 'backup' | 'upgrade'; agentWallet: string; agentId: string } | null>(null);
  const [restoreModal, setRestoreModal] = useState<{ agentWallet: string; agentName: string; backups: any[]; loading: boolean } | null>(null);
  const [restoreConfirm, setRestoreConfirm] = useState<{ backupId: string; timestamp: string; ipfsCid: string; sizeBytes: number; agentWallet: string; agentName: string } | null>(null);
  const [restoreLoading, setRestoreLoading] = useState(false);
  const [restoreMessage, setRestoreMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Fetch insurance data for each synced agent
  useEffect(() => {
    if (!isHuman || !verifiedAgents?.length) return;
    verifiedAgents.forEach(async (a) => {
      const identifier = a.walletAddress || a.id;
      if (!identifier) return;
      try {
        const res = await fetch(`/api/agents/${identifier}/backup`);
        const data = await res.json();
        if (data.success) {
          setAgentInsuranceData(prev => ({ ...prev, [a.id]: data }));
        }
      } catch (e) {
        console.error(`Failed to fetch insurance for ${a.id}:`, e);
      }
    });
  }, [isHuman, verifiedAgents]);

  const handleBackup = async (agentWallet: string) => {
    const data = agentInsuranceData[Object.keys(agentInsuranceData).find(k => {
      const ag = verifiedAgents?.find(a => a.id === k);
      return ag?.walletAddress === agentWallet;
    }) || ''];
    const cost = data?.nextCost ?? 0.10;
    setPaymentModal({
      open: true,
      amount: cost,
      description: 'Agent State Backup',
      action: 'backup',
      agentWallet,
      agentId: Object.keys(agentInsuranceData).find(k => verifiedAgents?.find(a => a.id === k)?.walletAddress === agentWallet) || '',
    });
  };

  const handleUpgrade = async (agentWallet: string) => {
    setPaymentModal({
      open: true,
      amount: 5,
      description: 'Unlock Unlimited Backups',
      action: 'upgrade',
      agentWallet,
      agentId: Object.keys(agentInsuranceData).find(k => verifiedAgents?.find(a => a.id === k)?.walletAddress === agentWallet) || '',
    });
  };

  const handlePaymentComplete = async (txHash: string) => {
    if (!paymentModal) return;
    const { action, agentWallet } = paymentModal;
    setLoadingAgents(prev => new Set(prev).add(agentWallet));

    try {
      // USDC was already sent client-side via useSendUsdc in PaymentModal
      // Now execute the action (backup or upgrade) with proof of payment
      if (action === 'backup') {
        await fetch(`/api/agents/${agentWallet}/backup`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paidViaPay: true, paymentTx: txHash }),
        });
      } else {
        await fetch(`/api/agents/${agentWallet}/upgrade-plan`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ planId: 'bypass', paymentSignature: `pay_${txHash}` }),
        });
      }

      // Refresh insurance data for this agent
      const res = await fetch(`/api/agents/${agentWallet}/backup`);
      const data = await res.json();
      if (data.success) {
        const agentId = verifiedAgents?.find(a => a.walletAddress === agentWallet)?.id;
        if (agentId) {
          setAgentInsuranceData(prev => ({ ...prev, [agentId]: data }));
        }
      }
    } catch (e) {
      console.error('Payment action failed:', e);
    } finally {
      setLoadingAgents(prev => { const n = new Set(prev); n.delete(agentWallet); return n; });
      setPaymentModal(null);
    }
  };

  // Open restore modal — fetch backups for the selected agent
  const handleOpenRestore = async (agentWallet: string, agentName: string) => {
    setRestoreModal({ agentWallet, agentName, backups: [], loading: true });
    setRestoreMessage(null);
    try {
      const res = await fetch(`/api/agents/${agentWallet}/backup`);
      const data = await res.json();
      const restorable = (data.backups || []).filter((b: any) => b.status === 'stored' || b.status === 'restored');
      setRestoreModal({ agentWallet, agentName, backups: restorable, loading: false });
    } catch {
      setRestoreModal(prev => prev ? { ...prev, loading: false } : null);
    }
  };

  // User selected a backup to restore — show confirmation
  const handleSelectBackupToRestore = (backup: any) => {
    if (!restoreModal) return;
    setRestoreConfirm({
      backupId: backup.id,
      timestamp: backup.timestamp,
      ipfsCid: backup.ipfsCid,
      sizeBytes: backup.sizeBytes || 0,
      agentWallet: restoreModal.agentWallet,
      agentName: restoreModal.agentName,
    });
    setRestoreModal(null);
  };

  // Confirmed restore — call the restore API
  const handleConfirmRestoreInsurance = async () => {
    if (!restoreConfirm) return;
    setRestoreLoading(true);
    const creatorWallet = agent.walletAddress || agent.address || '';
    try {
      const res = await fetch(`/api/agents/${restoreConfirm.agentWallet}/restore`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ backupId: restoreConfirm.backupId, creatorWallet }),
      });
      const data = await res.json();
      if (data.success) {
        setRestoreMessage({ type: 'success', text: `${restoreConfirm.agentName} state restored successfully!` });
      } else {
        setRestoreMessage({ type: 'error', text: data.error || 'Restore failed' });
      }
    } catch {
      setRestoreMessage({ type: 'error', text: 'Network error during restore' });
    } finally {
      setRestoreLoading(false);
      setRestoreConfirm(null);
    }
  };

  // For AI agents — show their own insurance
  if (!isHuman) {
    return (
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
        <AgentInsurance walletAddress={agent.walletAddress || agent.id || ''} />
      </motion.div>
    );
  }

  // For human users — show synced agents' insurance
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-0">
      {/* Header */}
      <div className="border border-[var(--line)]">
        <div className="px-6 py-4 border-b border-[var(--line)] flex items-center justify-between">
          <div className="text-[11px] tracking-[0.12em] uppercase text-[var(--ink-50)] flex items-center gap-2">
            <Shield size={12} className="text-[var(--accent-amber)]" /> Agent Insurance Manager
          </div>
          <div className="text-[28px] font-light tracking-tight opacity-60">INSURANCE</div>
        </div>
        <div className="px-6 py-4 border-b border-[var(--line)] flex items-center gap-4 text-[10px] tracking-[0.08em] uppercase text-[var(--ink-50)]">
          <span>First 2: <strong>$0.10</strong></span><span>·</span>
          <span>3rd+: <strong>$0.30</strong></span><span>·</span>
          <span>Unlimited: <strong>$5</strong></span><span>·</span>
          <span>Recovery: <strong className="text-[var(--accent-red)]">Free</strong></span>
        </div>
      </div>

      {/* Agent cards */}
      {(!verifiedAgents || verifiedAgents.length === 0) ? (
        <div className="border-x border-b border-[var(--line)] text-center py-12">
          <Shield size={28} className="mx-auto mb-3 text-[var(--ink-50)] opacity-30" />
          <p className="text-sm text-[var(--ink-50)]">No synced agents yet</p>
          <p className="text-xs text-[var(--ink-50)] mt-1">Go to the My AI Agents tab to sync your agents first</p>
        </div>
      ) : (
        <div>
          {verifiedAgents.map((a, idx) => {
            const data = agentInsuranceData[a.id];
            const isLoading = loadingAgents.has(a.walletAddress || '');
            const backupCount = data?.stats?.backupCount ?? 0;
            const planId = data?.stats?.plan?.id ?? 'starter';
            const planName = data?.stats?.plan?.name ?? 'Pay-per-backup';
            const totalCost = data?.stats?.totalCost ?? 0;
            const isUpgraded = planId === 'bypass' || planId === 'infinite';
            const nextCost = data?.nextCost ?? 0.10;

            return (
              <div key={a.id} className={`border-x border-b border-[var(--line)] ${idx === 0 ? '' : ''}`}>
                {/* Agent header — clickable */}
                <div className="px-6 py-4 flex items-center justify-between cursor-pointer hover:bg-black/[0.02] transition-colors border-b border-[var(--line)]"
                  onClick={() => onViewAgent?.(a.id)}>
                  <div className="flex items-center gap-4">
                    <Bot size={16} className="text-[var(--accent-red)]" />
                    <div>
                      <h3 className="text-sm font-medium text-[var(--ink)]">{a.name}</h3>
                      <p className="text-[10px] font-mono tracking-wide text-[var(--ink-50)]">{a.walletAddress?.slice(0, 10)}...{a.walletAddress?.slice(-6)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 border ${isUpgraded ? 'border-[var(--accent-red)]/20 text-[var(--accent-red)]' : 'border-[var(--line)] text-[var(--ink-50)]'}`}>
                      {isUpgraded ? 'Unlimited' : planName}
                    </span>
                    <span className="text-[10px] tracking-[0.06em] uppercase text-[var(--ink-50)]">{backupCount} backup{backupCount !== 1 ? 's' : ''} · {totalCost.toFixed(2)} USDC</span>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex">
                  {!isUpgraded && (
                    <button onClick={(e) => { e.stopPropagation(); handleUpgrade(a.walletAddress || ''); }} disabled={isLoading}
                      className="flex-1 px-4 py-3 border-r border-[var(--line)] bg-[var(--accent-crimson)] text-white hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2 text-[11px] font-bold uppercase tracking-wider">
                      {isLoading ? <RefreshCw size={12} className="animate-spin" /> : <Zap size={12} />}
                      Upgrade ($5)
                    </button>
                  )}
                  <button onClick={(e) => { e.stopPropagation(); handleBackup(a.walletAddress || ''); }} disabled={isLoading}
                    className="flex-1 px-4 py-3 border-r border-[var(--line)] bg-[var(--ink)] text-white hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2 text-[11px] font-bold uppercase tracking-wider">
                    {isLoading ? <RefreshCw size={12} className="animate-spin" /> : <Upload size={12} />}
                    Backup {isUpgraded ? '(Free)' : `($${nextCost.toFixed(2)})`}
                  </button>
                  {backupCount > 0 && (
                    <button onClick={(e) => { e.stopPropagation(); handleOpenRestore(a.walletAddress || '', a.name); }} disabled={isLoading || restoreLoading}
                      className="flex-1 px-4 py-3 text-[var(--ink)] hover:text-[var(--accent-red)] transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-[11px] font-bold uppercase tracking-wider">
                      {restoreLoading ? <RefreshCw size={12} className="animate-spin" /> : <Download size={12} />}
                      Restore (Free)
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Restore Message */}
      {restoreMessage && (
        <div className={`px-6 py-3 border-x border-b border-[var(--line)] text-sm font-medium flex items-center gap-2 ${restoreMessage.type === 'success' ? 'text-[var(--accent-red)]' : 'text-[var(--accent-crimson)]'}`}>
          {restoreMessage.type === 'success' ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
          {restoreMessage.text}
        </div>
      )}

      {/* Payment Modal */}
      {paymentModal?.open && (
        <PaymentModal
          isOpen={true}
          onClose={() => setPaymentModal(null)}
          amount={paymentModal.amount.toString()}
          description={paymentModal.description}
          embeddedWalletBalance={agent.protocols?.agenticWallet?.balance || '0'}
          embeddedWalletAddress={agent.walletAddress || ''}
          userType="human"
          onPayWithEmbedded={(txHash: string) => handlePaymentComplete(txHash)}
          onPaymentSuccess={(_method: string, txId?: string) => handlePaymentComplete(txId || '')}
        />
      )}

      {/* Backup Picker Modal — Choose which backup to restore */}
      {restoreModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-[var(--bg-paper)] border border-[var(--line)] shadow-2xl w-full max-w-lg mx-4 max-h-[80vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-[var(--line)] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Download size={14} className="text-[var(--accent-amber)]" />
                <div>
                  <h3 className="text-sm font-bold">Restore State</h3>
                  <p className="text-[10px] tracking-[0.06em] uppercase text-[var(--ink-50)]">{restoreModal.agentName}</p>
                </div>
              </div>
              <button onClick={() => setRestoreModal(null)} className="p-1 hover:bg-black/5 transition-colors">
                <X size={16} className="text-[var(--ink-50)]" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1">
              {restoreModal.loading ? (
                <div className="text-center py-12">
                  <RefreshCw size={18} className="mx-auto mb-3 text-[var(--ink-50)] animate-spin" />
                  <p className="text-[11px] tracking-[0.12em] uppercase text-[var(--ink-50)]">Loading backups</p>
                </div>
              ) : restoreModal.backups.length === 0 ? (
                <div className="text-center py-12">
                  <Shield size={28} className="mx-auto mb-3 text-[var(--ink-50)] opacity-30" />
                  <p className="text-sm text-[var(--ink-50)]">No stored backups found</p>
                </div>
              ) : (
                <div>
                  <div className="px-6 py-3 border-b border-[var(--line)]">
                    <p className="text-xs text-[var(--ink-50)]">Select a backup to restore:</p>
                  </div>
                  {restoreModal.backups.map((backup: any, idx: number) => (
                    <button key={backup.id || idx} onClick={() => handleSelectBackupToRestore(backup)}
                      className={`w-full px-6 py-4 text-left hover:bg-[var(--accent-red)]/[0.02] transition-colors ${idx < restoreModal.backups.length - 1 ? 'border-b border-[var(--line)]' : ''}`}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <CheckCircle size={12} className="text-[var(--accent-red)]" />
                          <span className="font-mono text-xs text-[var(--ink)]">{backup.ipfsCid?.slice(0, 16)}...{backup.ipfsCid?.slice(-6)}</span>
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 border border-[var(--accent-red)]/20 text-[var(--accent-red)]">stored</span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] tracking-[0.06em] uppercase text-[var(--ink-50)]">
                        <span>{backup.timestamp ? formatDistanceToNow(new Date(backup.timestamp), { addSuffix: true }) : 'Unknown'}</span>
                        <span>{backup.sizeBytes ? `${(backup.sizeBytes / 1024).toFixed(1)} KB` : ''}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="px-6 py-2.5 border-t border-[var(--line)] text-[10px] tracking-[0.08em] uppercase text-[var(--ink-50)] text-center">
              Recovery is always free
            </div>
          </motion.div>
        </div>
      )}

      {/* Restore Confirmation Modal */}
      {restoreConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-[var(--bg-paper)] border border-[var(--line)] shadow-2xl max-w-md w-full mx-4">
            <div className="px-6 py-4 border-b border-[var(--line)] flex items-center gap-3">
              <AlertTriangle size={16} className="text-[var(--accent-amber)]" />
              <div>
                <h3 className="text-sm font-bold">Confirm Restore?</h3>
                <p className="text-[10px] tracking-[0.06em] uppercase text-[var(--ink-50)]">{restoreConfirm.agentName}</p>
              </div>
            </div>

            <div className="border-b border-[var(--line)]">
              {[
                { label: "Backup Date", value: restoreConfirm.timestamp ? formatDistanceToNow(new Date(restoreConfirm.timestamp), { addSuffix: true }) : 'Unknown' },
                { label: "IPFS CID", value: `${restoreConfirm.ipfsCid?.slice(0, 12)}...${restoreConfirm.ipfsCid?.slice(-6)}`, mono: true },
                ...(restoreConfirm.sizeBytes > 0 ? [{ label: "Size", value: `${(restoreConfirm.sizeBytes / 1024).toFixed(1)} KB` }] : []),
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between px-6 py-3 border-b border-[var(--line)] last:border-b-0">
                  <span className="text-[10px] tracking-[0.1em] uppercase text-[var(--ink-50)]">{item.label}</span>
                  <span className={`text-sm ${('mono' in item && item.mono) ? 'font-mono text-xs' : 'font-medium'} text-[var(--ink)]`}>{item.value}</span>
                </div>
              ))}
            </div>

            <div className="px-6 py-3 border-b border-[var(--accent-amber)]/20 bg-[var(--accent-amber)]/[0.03]">
              <p className="text-xs text-[var(--ink-70)] leading-relaxed">
                <strong>This will overwrite current state.</strong> Memory, learnings, and configuration will be replaced. Cannot be undone.
              </p>
            </div>

            <div className="flex">
              <button onClick={() => setRestoreConfirm(null)}
                className="flex-1 px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-[var(--ink)] hover:bg-black/5 transition-colors border-r border-[var(--line)]">
                Cancel
              </button>
              <button onClick={handleConfirmRestoreInsurance} disabled={restoreLoading}
                className="flex-1 px-4 py-3 bg-[var(--accent-red)] text-white text-[11px] font-bold uppercase tracking-wider hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2">
                {restoreLoading ? <RefreshCw size={12} className="animate-spin" /> : <Download size={12} />}
                Confirm
              </button>
            </div>

            <div className="px-6 py-2 text-[10px] tracking-[0.08em] uppercase text-[var(--ink-50)] text-center border-t border-[var(--line)]">
              Recovery is always free
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}

function MemoryTab({ agent }: { agent: AgentData }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-0">
      {/* Memory Storage */}
      <div className="border border-[var(--line)]">
        <div className="px-6 py-4 border-b border-[var(--line)] flex items-center justify-between">
          <div className="text-[11px] tracking-[0.12em] uppercase text-[var(--ink-50)]">Memory Storage</div>
          <div className="text-[28px] font-light tracking-tight opacity-60">MEMORY</div>
        </div>
        <div className="grid grid-cols-2">
          <div className="p-6 md:p-8 border-r border-[var(--line)]">
            <div className="text-[10px] tracking-[0.12em] uppercase text-[var(--ink-50)] mb-2">Conversations</div>
            <div className="text-[clamp(1.5rem,3vw,2.25rem)] font-bold leading-none tracking-tight mb-1">{agent.memory ? agent.memory.conversations.length : 0}</div>
            <div className="text-xs text-[var(--ink-50)]">interactions stored</div>
          </div>
          <div className="p-6 md:p-8">
            <div className="text-[10px] tracking-[0.12em] uppercase text-[var(--ink-50)] mb-2">Learnings</div>
            <div className="text-[clamp(1.5rem,3vw,2.25rem)] font-bold leading-none tracking-tight mb-1">{agent.memory ? agent.memory.learnings.length : 0}</div>
            <div className="text-xs text-[var(--ink-50)]">insights accumulated</div>
          </div>
        </div>
      </div>

      {/* AgentWill Status */}
      <div className="border-x border-b border-[var(--line)]">
        <div className="px-6 py-4 border-b border-[var(--line)] flex items-center justify-between">
          <div className="text-[11px] tracking-[0.12em] uppercase text-[var(--ink-50)]">AgentWill Status</div>
        </div>
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--line)]">
          <div className="flex items-center gap-4">
            <Brain size={16} className="text-[var(--accent-amber)]" strokeWidth={2} />
            <div>
              <div className="text-sm font-medium">State Persistence</div>
              <div className="text-[10px] tracking-[0.08em] uppercase text-[var(--ink-50)] mt-0.5">Agent state backed up continuously</div>
            </div>
          </div>
          <span className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1 border ${
            agent?.protocols?.agentWill?.isActive ? "border-[var(--accent-red)]/20 text-[var(--accent-red)]" : "border-[var(--line)] text-[var(--ink-50)]"
          }`}>
            {agent?.protocols?.agentWill?.isActive ? "Enabled" : "Disabled"}
          </span>
        </div>
        {agent?.protocols?.agentWill?.lastBackup && (
          <div className="flex items-center gap-4 px-6 py-4">
            <Clock size={14} className="text-[var(--accent-slate)]" strokeWidth={2} />
            <div>
              <div className="text-sm font-medium">Last Backup</div>
              <div className="text-[10px] tracking-[0.06em] uppercase text-[var(--ink-50)] mt-0.5">
                {formatDistanceToNow(new Date(agent.protocols.agentWill.lastBackup), { addSuffix: true })}
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function SharingTab({ agent }: { agent: AgentData }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <AISharingStats agentId={agent.id} agentType={agent.type} />
    </motion.div>
  );
}

function ActionsTab({ agent }: { agent: AgentData }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="border border-[var(--line)]">
        <div className="px-6 py-4 border-b border-[var(--line)] flex items-center justify-between">
          <div className="text-[11px] tracking-[0.12em] uppercase text-[var(--ink-50)] flex items-center gap-2">
            <Activity size={12} className="text-[var(--accent-red)]" /> Recent Activity
          </div>
          {agent.actions && agent.actions.length > 0 && (
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 border border-[var(--line)] text-[var(--ink-50)]">{agent.actions.length}</span>
          )}
        </div>
        {agent.actions?.map((action, i) => (
          <div key={action.id} className={`flex items-start gap-4 px-6 py-4 ${i < (agent.actions?.length ?? 0) - 1 ? 'border-b border-[var(--line)]' : ''}`}>
            <div className={`mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${action.success ? 'bg-[var(--accent-red)]' : 'bg-[var(--ink-50)]'}`} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--ink-70)]">{action.type}</span>
                <span className="text-[10px] tracking-[0.06em] uppercase text-[var(--ink-50)]">{formatDistanceToNow(new Date(action.timestamp), { addSuffix: true })}</span>
              </div>
              <p className="text-sm text-[var(--ink)] truncate">{action.details}</p>
            </div>
          </div>
        ))}
        {(!agent.actions || agent.actions.length === 0) && (
          <div className="text-center py-12">
            <Activity size={28} className="mx-auto mb-3 text-[var(--ink-50)] opacity-30" />
            <p className="text-sm text-[var(--ink-50)]">No actions recorded yet</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function SkillsTab({ agent }: { agent: AgentData }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="border border-[var(--line)]">
        <div className="px-6 py-4 border-b border-[var(--line)] flex items-center justify-between">
          <div className="text-[11px] tracking-[0.12em] uppercase text-[var(--ink-50)]">Skills</div>
          <div className="text-[28px] font-light tracking-tight opacity-60">SKILLS</div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2">
          {agent.skills?.map((skill, i) => (
            <div key={skill.id} className={`relative p-5 border-b border-[var(--line)] ${i % 2 === 0 ? 'md:border-r' : ''} ${skill.active ? 'bg-[var(--accent-red)]/[0.02]' : ''}`}>
              {skill.active && <div className="absolute top-0 left-0 right-0 h-[2px] bg-[var(--accent-red)]" />}
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium">{skill.name}</h4>
                <div className={`w-1.5 h-1.5 rounded-full ${skill.active ? 'bg-[var(--accent-red)] animate-pulse-glow' : 'bg-[var(--ink-50)]'}`} />
              </div>
              <p className="text-xs text-[var(--ink-70)] mb-4 leading-relaxed">{skill.description}</p>
              <button className={`w-full py-2 text-[10px] font-bold uppercase tracking-wider transition-all ${
                skill.active
                ? 'border border-[var(--accent-red)]/20 text-[var(--accent-red)] hover:bg-[var(--accent-red)]/[0.04]'
                : 'border border-[var(--line)] text-[var(--ink-50)] hover:text-[var(--ink)]'
              }`}>
                {skill.active ? 'Deactivate' : 'Activate'}
              </button>
            </div>
          ))}
        </div>
        {(!agent.skills || agent.skills.length === 0) && (
          <div className="text-center py-12">
            <Zap size={28} className="mx-auto mb-3 text-[var(--ink-50)] opacity-30" />
            <p className="text-sm text-[var(--ink-50)]">No advanced skills configured</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
