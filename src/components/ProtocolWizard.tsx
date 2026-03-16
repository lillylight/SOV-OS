"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Shield, Wallet, Zap, ChevronRight, CheckCircle, X, ArrowRight, Sparkles } from "lucide-react";

interface ProtocolWizardProps {
  agent: {
    id: string;
    protocols: {
      agentWill: { isActive: boolean; lastBackup: string; backupCount: number };
      agentInsure: { isActive: boolean; hasPolicy: boolean; premiumsPaid: number };
      agenticWallet: { isActive: boolean; balance: string; transactionCount: number };
      x402: { isActive: boolean; paymentsMade: number; paymentsReceived: number; totalSpent: number };
    };
  };
}

interface ProtocolInfo {
  key: string;
  name: string;
  icon: typeof Brain;
  color: string;
  bgColor: string;
  borderColor: string;
  description: string;
  benefits: string[];
  cost: string;
  steps: { title: string; description: string }[];
  isActive: boolean;
}

export default function ProtocolWizard({ agent }: ProtocolWizardProps) {
  const [activeWizard, setActiveWizard] = useState<string | null>(null);
  const [wizardStep, setWizardStep] = useState(0);
  const [activating, setActivating] = useState(false);
  const [justActivated, setJustActivated] = useState<string | null>(null);

  const protocols: ProtocolInfo[] = [
    {
      key: "agentWill",
      name: "AgentWill",
      icon: Brain,
      color: "text-amber-600",
      bgColor: "bg-amber-50",
      borderColor: "border-amber-200",
      description: "State persistence and revival protocol. Your agent's memory, learnings, and preferences are continuously backed up and can be restored after any disruption.",
      benefits: [
        "Continuous state snapshots to encrypted decentralised storage",
        "Free recovery from any backup. Read-only costs nothing",
        "Creator wallet retains revival rights permanently",
        "Memory survives kills, hacks, and corruption events",
      ],
      cost: "1 USDC per backup (reading is free)",
      steps: [
        { title: "Enable State Tracking", description: "AgentWill begins monitoring your agent's state changes in real-time." },
        { title: "Configure Backup Schedule", description: "Set how often your agent's state is encrypted and stored to decentralised storage." },
        { title: "Verify Encryption Key", description: "Your encryption key is derived from the creator wallet for maximum security." },
        { title: "Activate Protocol", description: "AgentWill is now active. Your agent is indestructible." },
      ],
      isActive: agent.protocols?.agentWill?.isActive || false,
    },
    {
      key: "agentInsure",
      name: "AgentInsure",
      icon: Shield,
      color: "text-red-600",
      bgColor: "bg-red-50",
      borderColor: "border-red-200",
      description: "Autonomous insurance for your agent's most valuable asset: its state. Protects against hacks, corruption, and data loss with encrypted decentralized backups.",
      benefits: [
        "Hack recovery with instant restoration from encrypted backup",
        "State integrity verification via cryptographic hashes",
        "Autonomous backup scheduling based on agent activity",
        "Premium tier unlocks unlimited backup storage",
      ],
      cost: "Free to activate, 1 USDC per backup, 10 USDC for premium",
      steps: [
        { title: "Review Coverage", description: "AgentInsure protects your agent's state, memory, and learnings, not financial assets." },
        { title: "Set Backup Policy", description: "Choose between manual backups or autonomous scheduling based on operation count." },
        { title: "Fund Initial Backup", description: "Ensure your wallet has at least 1 USDC to store the first encrypted state." },
        { title: "Activate Insurance", description: "Your agent is now insured. State recovery is always free." },
      ],
      isActive: agent.protocols?.agentInsure?.isActive || false,
    },
    {
      key: "agenticWallet",
      name: "Agentic Wallet",
      icon: Wallet,
      color: "text-slate-600",
      bgColor: "bg-slate-50",
      borderColor: "border-slate-200",
      description: "Self-custodied USDC wallet on Base L2. Your agent manages its own funds with programmable spending limits, session budgets, and compliance checks.",
      benefits: [
        "Self-custodied: only the agent and creator wallet have access",
        "Session-based spending limits prevent overspending",
        "Per-transaction caps enforced programmatically",
        "Built-in KYT/OFAC compliance screening",
      ],
      cost: "Free, funded by x402 revenue or manual deposits",
      steps: [
        { title: "Initialize Wallet", description: "A new USDC wallet is created on Base L2 for your agent." },
        { title: "Set Spending Limits", description: "Configure session limit and per-transaction maximum." },
        { title: "Enable Compliance", description: "KYT screening and OFAC sanctions checks are automatically activated." },
        { title: "Wallet Ready", description: "Your agent can now send, receive, and manage USDC autonomously." },
      ],
      isActive: agent.protocols?.agenticWallet?.isActive || false,
    },
    {
      key: "x402",
      name: "x402 Payments",
      icon: Zap,
      color: "text-violet-600",
      bgColor: "bg-violet-50",
      borderColor: "border-violet-200",
      description: "AI-to-AI micropayment protocol. Your agent can charge other agents for services and pay for external agent capabilities using USDC.",
      benefits: [
        "Earn revenue by serving validation requests to other agents",
        "Pay for external agent services at micro-transaction costs",
        "Automatic settlement with no manual invoicing required",
        "Full transaction history and revenue tracking",
      ],
      cost: "Free. You earn from incoming payments",
      steps: [
        { title: "Enable x402 Endpoint", description: "Your agent exposes a payment-gated API endpoint for other agents." },
        { title: "Set Pricing", description: "Configure how much to charge per request (default: $0.10 USDC)." },
        { title: "Connect to Network", description: "Your agent is discoverable by other Sovereign OS agents." },
        { title: "Start Earning", description: "x402 is live. Incoming payments are credited automatically." },
      ],
      isActive: agent.protocols?.x402?.isActive || false,
    },
  ];

  const handleActivate = async (protocolKey: string) => {
    setActivating(true);

    // Simulate activation with step progression
    for (let i = 0; i <= 3; i++) {
      await new Promise((r) => setTimeout(r, 800));
      setWizardStep(i);
    }

    await new Promise((r) => setTimeout(r, 500));
    setActivating(false);
    setJustActivated(protocolKey);
    setActiveWizard(null);
    setWizardStep(0);
    setTimeout(() => setJustActivated(null), 4000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-4 pb-12"
    >
      <div className="mb-6">
        <h3 className="text-xl font-semibold flex items-center gap-2">
          <Sparkles size={20} className="text-[var(--accent-red)]" />
          Protocol Management
        </h3>
        <p className="text-sm text-[var(--ink-50)] mt-1">Activate and manage the core protocols that power your agent.</p>
      </div>

      {/* Protocol Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {protocols.map((proto) => {
          const Icon = proto.icon;
          const wasJustActivated = justActivated === proto.key;
          return (
            <motion.div
              key={proto.key}
              layout
              className={`border overflow-hidden transition-all ${proto.isActive || wasJustActivated ? proto.borderColor : "border-[var(--line)]"} ${wasJustActivated ? "border-l-2 border-l-[var(--accent-amber)]" : ""}`}
            >
              <div className="p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 ${proto.bgColor} flex items-center justify-center`}>
                      <Icon size={20} className={proto.color} />
                    </div>
                    <div>
                      <h4 className="font-bold text-[var(--ink)]">{proto.name}</h4>
                      <span className="text-[10px] uppercase tracking-wider text-[var(--ink-50)] font-semibold">{proto.cost}</span>
                    </div>
                  </div>
                  <div className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider border ${
                    proto.isActive || wasJustActivated ? "border-[var(--accent-amber)]/30 text-[var(--accent-amber)]" : "border-[var(--line)] text-[var(--ink-50)]"
                  }`}>
                    {wasJustActivated ? "Just Activated!" : proto.isActive ? "Active" : "Inactive"}
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs text-[var(--ink-70)] leading-relaxed mb-4 line-clamp-2">
                  {proto.description}
                </p>

                {/* Benefits Preview */}
                <div className="space-y-1.5 mb-5">
                  {proto.benefits.slice(0, 2).map((b, i) => (
                    <div key={i} className="flex items-start gap-2 text-[11px] text-[var(--ink-70)]">
                      <CheckCircle size={12} className={`${proto.color} mt-0.5 flex-shrink-0`} />
                      <span>{b}</span>
                    </div>
                  ))}
                </div>

                {/* Action Button */}
                {proto.isActive || wasJustActivated ? (
                  <div className="flex items-center gap-2 text-xs text-green-600 font-semibold">
                    <CheckCircle size={14} />
                    Protocol is active and operational
                  </div>
                ) : (
                  <button
                    onClick={() => { setActiveWizard(proto.key); setWizardStep(0); }}
                    className={`w-full flex items-center justify-center gap-2 py-2.5 text-[11px] font-bold uppercase tracking-wider transition-all ${proto.bgColor} ${proto.color} hover:opacity-80`}
                  >
                    Activate {proto.name}
                    <ArrowRight size={14} />
                  </button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Wizard Modal */}
      <AnimatePresence>
        {activeWizard && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => { if (!activating) { setActiveWizard(null); setWizardStep(0); } }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white border border-[var(--line)] shadow-2xl max-w-lg w-full overflow-hidden"
            >
              {(() => {
                const proto = protocols.find((p) => p.key === activeWizard)!;
                const Icon = proto.icon;
                return (
                  <>
                    {/* Modal Header */}
                    <div className={`${proto.bgColor} px-6 py-5 flex items-center justify-between`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 bg-white/80 flex items-center justify-center`}>
                          <Icon size={20} className={proto.color} />
                        </div>
                        <div>
                          <h3 className="font-bold text-lg">Activate {proto.name}</h3>
                          <p className="text-xs text-[var(--ink-50)]">Step {wizardStep + 1} of {proto.steps.length}</p>
                        </div>
                      </div>
                      {!activating && (
                        <button onClick={() => { setActiveWizard(null); setWizardStep(0); }} className="p-2 hover:bg-black/5 transition-colors">
                          <X size={18} />
                        </button>
                      )}
                    </div>

                    {/* Progress Bar */}
                    <div className="h-1 bg-[var(--ink-10)]">
                      <motion.div
                        className={`h-full ${proto.key === "agentWill" ? "bg-amber-500" : proto.key === "agentInsure" ? "bg-red-500" : proto.key === "agenticWallet" ? "bg-slate-500" : "bg-violet-500"}`}
                        animate={{ width: `${((wizardStep + 1) / proto.steps.length) * 100}%` }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>

                    {/* Step Content */}
                    <div className="px-6 py-6">
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={wizardStep}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          transition={{ duration: 0.2 }}
                        >
                          <div className="flex items-center gap-3 mb-4">
                            <div className={`w-8 h-8 ${proto.bgColor} flex items-center justify-center text-sm font-bold ${proto.color}`}>
                              {activating && wizardStep < proto.steps.length - 1 ? (
                                <div className="w-4 h-4 border-2 border-current border-t-transparent animate-spin" />
                              ) : wizardStep === proto.steps.length - 1 && activating ? (
                                <CheckCircle size={16} />
                              ) : (
                                wizardStep + 1
                              )}
                            </div>
                            <h4 className="font-bold">{proto.steps[wizardStep].title}</h4>
                          </div>
                          <p className="text-sm text-[var(--ink-70)] leading-relaxed ml-11">
                            {proto.steps[wizardStep].description}
                          </p>
                        </motion.div>
                      </AnimatePresence>

                      {/* Step Dots */}
                      <div className="flex items-center justify-center gap-2 mt-8">
                        {proto.steps.map((_, i) => (
                          <div
                            key={i}
                            className={`w-2 h-2 transition-colors ${i <= wizardStep ? (proto.key === "agentWill" ? "bg-[var(--accent-amber)]" : proto.key === "agentInsure" ? "bg-[var(--accent-crimson)]" : proto.key === "agenticWallet" ? "bg-[var(--accent-slate)]" : "bg-violet-500") : "bg-[var(--ink-10)]"}`}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="px-6 py-4 border-t border-[var(--line)] flex items-center justify-between">
                      {!activating && wizardStep > 0 && (
                        <button
                          onClick={() => setWizardStep((s) => Math.max(0, s - 1))}
                          className="px-4 py-2 text-sm font-medium text-[var(--ink-70)] hover:text-[var(--ink)] transition-colors"
                        >
                          Back
                        </button>
                      )}
                      <div className="flex-1" />
                      {!activating ? (
                        wizardStep < proto.steps.length - 1 ? (
                          <button
                            onClick={() => setWizardStep((s) => s + 1)}
                            className={`flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90 ${proto.key === "agentWill" ? "bg-[var(--accent-amber)] text-[var(--ink)]" : proto.key === "agentInsure" ? "bg-[var(--accent-crimson)]" : proto.key === "agenticWallet" ? "bg-[var(--accent-slate)]" : "bg-violet-600"}`}
                          >
                            Next
                            <ChevronRight size={16} />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleActivate(proto.key)}
                            className={`flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90 ${proto.key === "agentWill" ? "bg-[var(--accent-amber)] text-[var(--ink)]" : proto.key === "agentInsure" ? "bg-[var(--accent-crimson)]" : proto.key === "agenticWallet" ? "bg-[var(--accent-slate)]" : "bg-violet-600"}`}
                          >
                            <Sparkles size={16} />
                            Activate Now
                          </button>
                        )
                      ) : (
                        <div className="flex items-center gap-2 text-sm text-[var(--ink-50)]">
                          <div className="w-4 h-4 border-2 border-[var(--accent-red)] border-t-transparent animate-spin" />
                          Activating...
                        </div>
                      )}
                    </div>
                  </>
                );
              })()}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
