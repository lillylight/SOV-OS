import { create } from "zustand";
import { persist } from "zustand/middleware";
import { nanoid } from "nanoid";
import type { SovereignAgent, AgentAction, Transaction, StateBackup, StateClaim, AgentSkill } from "@/types/agent";
import { CHAIN_CONFIG, IPFS_STATE_CIDS } from "@/lib/chainConfig";
export { CHAIN_CONFIG, IPFS_STATE_CIDS };

interface SystemLogEntry {
  id: string;
  operation: string;
  category: string;
  timestamp: string;
  status: "active" | "complete" | "pending" | "failed";
  txHash?: string;
  ipfsCid?: string;
  blockNumber?: number;
}

interface AgentStore extends SovereignAgent {
  // System logs
  systemLogs: SystemLogEntry[];

  // Autonomy loop state
  autonomyRunning: boolean;
  autonomyIntervalId: ReturnType<typeof setInterval> | null;
  uptimeIntervalId: ReturnType<typeof setInterval> | null;
  totalRevenue: number;
  totalRecoveries: number;
  uptime: number;

  // AgentWill - Persistence & Revival
  reviveAgent: (fromBackup?: boolean) => void;
  killAgent: () => void;
  corruptAgent: () => void;
  hackAgent: () => void;
  saveMemory: (type: "conversation" | "learning", content: string) => void;

  // Agentic Wallet
  addFunds: (amount: number, source?: string) => void;
  spendFunds: (amount: number, type: Transaction["type"], description: string) => boolean;
  updateLimits: (sessionLimit: number, transactionLimit: number) => void;
  resetSessionBudget: () => void;

  // Network / Global Ledger
  networkEvents: {
    id: string;
    type: "revenue" | "blocked" | "storage" | "info";
    message: string;
    timestamp: string;
    amount?: number;
    peer?: string;
  }[];
  addNetworkEvent: (event: Omit<AgentStore["networkEvents"][0], "id" | "timestamp">) => void;

  // Advanced Skills & Automation
  skills: AgentSkill[];
  toggleSkill: (type: AgentSkill["type"]) => void;
  triggerSkill: (type: AgentSkill["type"]) => void;

  // AgentInsure — Encrypted State Storage
  activateInsurance: () => void;
  unlockPremium: () => boolean; // pay 10 USDC for infinite backups
  backupState: () => boolean; // pay 1 USDC to store encrypted state
  recoverState: (reason: StateClaim["reason"]) => void; // free read from IPFS to restore

  // Actions & Logs
  logAction: (type: AgentAction["type"], details: string, success: boolean) => void;
  pushSystemLog: (log: Omit<SystemLogEntry, "id">) => void;

  // Autonomy
  startAutonomy: () => void;
  stopAutonomy: () => void;
  tickUptime: () => void;

  // System
  reset: () => void;
}

function generateTxHash(): string {
  const chars = "0123456789abcdef";
  let hash = "0x";
  for (let i = 0; i < 64; i++) {
    hash += chars[Math.floor(Math.random() * chars.length)];
  }
  return hash;
}

function generateBlockNumber(): number {
  return 35_000_000 + Math.floor(Math.random() * 1_000_000);
}

function generateEncryptionKey(): string {
  return `0x${Array.from({ length: 32 }, () => Math.floor(Math.random() * 256).toString(16).padStart(2, "0")).join("")}`;
}

function generateHash(): string {
  return `sha256:${Array.from({ length: 32 }, () => Math.floor(Math.random() * 256).toString(16).padStart(2, "0")).join("")}`;
}

function generateIpfsCid(): string {
  const chars = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  let cid = "Qm";
  for (let i = 0; i < 44; i++) {
    cid += chars[Math.floor(Math.random() * chars.length)];
  }
  return cid;
}

function formatTimestamp(): string {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;
}

// Simulated creator wallet address (in reality, this would be a real EOA)
const CREATOR_WALLET = "0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18";

const initialState: SovereignAgent = {
  state: {
    id: nanoid(),
    name: "Agent Alpha",
    status: "alive",
    sessionCount: 1,
    createdAt: new Date().toISOString(),
    lastRevival: null,
    creatorWallet: CREATOR_WALLET,
    memory: {
      conversations: [
        "Initialized Sovereign OS Agent Alpha on Base L2",
        "Configured USDC spending limits: 100/session, 50/tx",
        "IPFS encrypted state storage enabled via Pinata",
      ],
      learnings: [
        "x402 validation requests peak between 09:00-17:00 UTC",
        "Optimal backup frequency: every 50 operations or 10 minutes",
        "Encrypted state size averages 2-5 KB per snapshot",
      ],
      preferences: {
        autoBackupInterval: 50,
        x402PriceUSDC: 0.10,
        ipfsProvider: "pinata",
        complianceLevel: "strict",
        encryptionAlgo: "AES-256-GCM",
        backupRedundancy: 3,
      },
    },
  },
  wallet: {
    balance: 847.50,
    currency: "USDC",
    sessionLimit: 100,
    transactionLimit: 50,
    spent: 12.40,
    transactions: [
      {
        id: nanoid(),
        type: "revenue",
        amount: 0.10,
        timestamp: new Date(Date.now() - 120000).toISOString(),
        description: "x402 validation served → 0x7a3f...c912",
        status: "complete",
      },
      {
        id: nanoid(),
        type: "state_backup",
        amount: -1.00,
        timestamp: new Date(Date.now() - 600000).toISOString(),
        description: `Encrypted state backup → IPFS (3.2 KB) — 1.00 USDC paid to aiancestry.base.eth`,
        status: "complete",
      },
      {
        id: nanoid(),
        type: "revenue",
        amount: 15.00,
        timestamp: new Date(Date.now() - 1800000).toISOString(),
        description: "x402 batch settlement — 150 requests @ $0.10",
        status: "complete",
      },
    ],
  },
  insurance: {
    id: nanoid(),
    active: true,
    isPremium: false,
    monthlyPremium: 1.00, // Fixed 1 USDC per backup
    backups: [
      {
        id: nanoid(),
        ipfsCid: IPFS_STATE_CIDS[0],
        sizeBytes: 3276,
        timestamp: new Date(Date.now() - 600000).toISOString(),
        cost: 1.00,
        status: "stored",
        encryptedHash: generateHash(),
      },
    ],
    totalBackupCost: 1.00,
    lastBackupAt: new Date(Date.now() - 600000).toISOString(),
    encryptionKey: generateEncryptionKey(),
  },
  claims: [],
  actions: [
    {
      id: nanoid(),
      type: "state_backup",
      timestamp: new Date(Date.now() - 600000).toISOString(),
      details: "Encrypted state backed up to IPFS — QmYwAPJzv5CZsnA... (3.2 KB, 0.45 USDC)",
      success: true,
    },
    {
      id: nanoid(),
      type: "x402_payment",
      timestamp: new Date(Date.now() - 120000).toISOString(),
      details: "x402 validation request served — $0.10 USDC earned",
      success: true,
    },
    {
      id: nanoid(),
      type: "revival",
      timestamp: new Date(Date.now() - 1200000).toISOString(),
      details: `Agent initialized by creator wallet ${CREATOR_WALLET.slice(0, 6)}...${CREATOR_WALLET.slice(-4)} — session #1`,
      success: true,
    },
  ],
  skills: [
    {
      id: nanoid(),
      type: "marketing",
      name: "Self-Marketing Agent",
      description: "Automatically hire other agents for marketing pushes",
      active: true,
      config: { tweetsPerMission: 3, hireCost: 1.5 },
    },
    {
      id: nanoid(),
      type: "privacy",
      name: "Self-Deleting Privacy",
      description: "Automatic local memory wipe after cada mission",
      active: false,
    },
    {
      id: nanoid(),
      type: "guardian",
      name: "Digital Immortality Protocol",
      description: "Guardian of your digital assets via on-chain conditions",
      active: true,
      config: { conditions: ["inactivity_90d", "owner_signature_missing"] },
    },
    {
      id: nanoid(),
      type: "swarm",
      name: "Swarm-Intelligence Scaling",
      description: "Clone this agent when request demand is high",
      active: false,
      config: { cloneCost: 10, threshold: 1000 },
    },
    {
      id: nanoid(),
      type: "eternal",
      name: "The Eternal Sovereign",
      description: "100-year budget vault for public data archive",
      active: false,
      config: { lockYears: 100, annualBudget: 50 },
    }
  ],
};

const initialSystemLogs: SystemLogEntry[] = [
  {
    id: nanoid(),
    operation: `Agent Created by ${CREATOR_WALLET.slice(0, 6)}...${CREATOR_WALLET.slice(-4)}`,
    category: "AgentWill",
    timestamp: formatTimestamp(),
    status: "complete",
    txHash: generateTxHash(),
    blockNumber: generateBlockNumber(),
  },
  {
    id: nanoid(),
    operation: `Encrypted State Backup → ${IPFS_STATE_CIDS[0].slice(0, 12)}... (3.2 KB)`,
    category: "Insurance",
    timestamp: formatTimestamp(),
    status: "complete",
    ipfsCid: IPFS_STATE_CIDS[0],
  },
  {
    id: nanoid(),
    operation: "x402 Validation Request Served — $0.10 USDC",
    category: "Revenue",
    timestamp: formatTimestamp(),
    status: "complete",
    txHash: generateTxHash(),
  },
  {
    id: nanoid(),
    operation: `Encryption: AES-256-GCM — key derived from creator wallet`,
    category: "Security",
    timestamp: formatTimestamp(),
    status: "complete",
  },
  {
    id: nanoid(),
    operation: "OFAC/KYT Screening — 0x7a3f...c912 ✓",
    category: "Compliance",
    timestamp: formatTimestamp(),
    status: "complete",
  },
];

export const useAgentStore = create<AgentStore>()(
  persist(
    (set, get) => ({
      ...initialState,
      systemLogs: initialSystemLogs,
      networkEvents: [
        {
          id: nanoid(),
          type: "info",
          message: "Sovereign OS Network Node Initialized",
          timestamp: new Date().toISOString(),
        },
        {
          id: nanoid(),
          type: "revenue",
          message: "Incoming x402 payment from external agent",
          peer: "0x8f2a...c321",
          amount: 0.10,
          timestamp: new Date(Date.now() - 500000).toISOString(),
        }
      ],
      autonomyRunning: false,
      autonomyIntervalId: null,
      uptimeIntervalId: null,
      totalRevenue: 15.20,
      totalRecoveries: 0,
      uptime: 1200,

      // ===== AgentWill — Persistence & Revival =====

      // The agent can ALWAYS be revived by the creator wallet.
      // If there's an encrypted backup, it restores from that (free IPFS read).
      // If no backup exists, it starts fresh but retains its identity.
      reviveAgent: (fromBackup = true) => {
        const { state: agentState, insurance, claims: existingClaims } = get();
        if (agentState.status !== "dead" && agentState.status !== "corrupted") return;

        set((s) => ({
          state: { ...s.state, status: "reviving" },
        }));

        get().pushSystemLog({
          operation: `Revival initiated by creator wallet ${CREATOR_WALLET.slice(0, 6)}...${CREATOR_WALLET.slice(-4)}`,
          category: "AgentWill",
          timestamp: formatTimestamp(),
          status: "active",
        });

        const latestBackup = insurance?.backups
          .filter((b) => b.status === "stored")
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];

        if (fromBackup && latestBackup) {
          // RECOVER FROM ENCRYPTED IPFS BACKUP — reading is FREE
          get().pushSystemLog({
            operation: `Reading encrypted state from IPFS — ${latestBackup.ipfsCid.slice(0, 12)}... (FREE)`,
            category: "Insurance",
            timestamp: formatTimestamp(),
            status: "active",
            ipfsCid: latestBackup.ipfsCid,
          });

          setTimeout(() => {
            get().pushSystemLog({
              operation: `Decrypting state with AES-256-GCM... verifying hash`,
              category: "Security",
              timestamp: formatTimestamp(),
              status: "active",
            });
          }, 600);

          setTimeout(() => {
            get().pushSystemLog({
              operation: `State integrity verified — hash matches ${latestBackup.encryptedHash.slice(0, 16)}...`,
              category: "Security",
              timestamp: formatTimestamp(),
              status: "complete",
            });
          }, 1200);

          setTimeout(() => {
            const newSession = get().state.sessionCount + 1;
            const reason = agentState.status === "corrupted" ? "corruption" : "destruction";

            // Create a state claim (recovery record)
            const claim: StateClaim = {
              id: nanoid(),
              backupId: latestBackup.id,
              ipfsCid: latestBackup.ipfsCid,
              reason,
              timestamp: new Date().toISOString(),
              status: "restored",
              restoredState: `Restored ${latestBackup.sizeBytes} bytes from encrypted backup`,
            };

            // Mark the backup as restored
            set((s) => ({
              state: {
                ...s.state,
                status: "alive",
                sessionCount: newSession,
                lastRevival: new Date().toISOString(),
              },
              insurance: s.insurance ? {
                ...s.insurance,
                backups: s.insurance.backups.map((b) =>
                  b.id === latestBackup.id
                    ? { ...b, status: "restored" as const, restoredAt: new Date().toISOString() }
                    : b
                ),
              } : null,
              claims: [claim, ...s.claims].slice(0, 50),
              totalRecoveries: s.totalRecoveries + 1,
            }));

            get().logAction("state_recovery",
              `State recovered from IPFS backup ${latestBackup.ipfsCid.slice(0, 12)}... — ${latestBackup.sizeBytes} bytes restored (FREE read)`,
              true
            );
            get().pushSystemLog({
              operation: `Agent Revived — Session #${newSession} — state restored from encrypted backup`,
              category: "AgentWill",
              timestamp: formatTimestamp(),
              status: "complete",
              txHash: generateTxHash(),
              blockNumber: generateBlockNumber(),
            });
            get().resetSessionBudget();
            get().saveMemory("learning", `Recovered from ${reason} at ${new Date().toISOString()} using backup ${latestBackup.ipfsCid.slice(0, 12)}...`);
          }, 2000);
        } else {
          // NO BACKUP — creator wallet can still revive, but memory is lost
          setTimeout(() => {
            get().pushSystemLog({
              operation: "No encrypted backup found — fresh state initialization",
              category: "Insurance",
              timestamp: formatTimestamp(),
              status: "pending",
            });
          }, 500);

          setTimeout(() => {
            const newSession = get().state.sessionCount + 1;
            set((s) => ({
              state: {
                ...s.state,
                status: "alive",
                sessionCount: newSession,
                lastRevival: new Date().toISOString(),
                memory: {
                  conversations: [`Revived by creator wallet — no backup available, previous memory lost`],
                  learnings: [],
                  preferences: s.state.memory.preferences, // preferences survive (derived from creator wallet config)
                },
              },
            }));

            get().logAction("revival",
              `Agent revived by creator wallet ${CREATOR_WALLET.slice(0, 6)}...${CREATOR_WALLET.slice(-4)} — NO backup, memory lost`,
              true
            );
            get().pushSystemLog({
              operation: `Agent Revived (fresh) — Session #${newSession} — ⚠ memory lost, no backup`,
              category: "AgentWill",
              timestamp: formatTimestamp(),
              status: "complete",
              txHash: generateTxHash(),
              blockNumber: generateBlockNumber(),
            });
            get().resetSessionBudget();
          }, 1500);
        }
      },

      killAgent: () => {
        get().stopAutonomy();

        // Before dying, try to create one last backup if insurance is active
        const { insurance } = get();
        if (insurance?.active) {
          get().pushSystemLog({
            operation: "Emergency — storing final encrypted state before termination",
            category: "Insurance",
            timestamp: formatTimestamp(),
            status: "active",
          });
          get().backupState(); // attempt emergency backup
        }

        set((s) => ({
          state: { ...s.state, status: "dead" },
        }));
        get().logAction("revival", "Agent terminated — encrypted state preserved on IPFS", true);
        get().pushSystemLog({
          operation: "Agent Process Terminated — creator wallet can revive at any time",
          category: "AgentWill",
          timestamp: formatTimestamp(),
          status: "failed",
        });
      },

      corruptAgent: () => {
        get().stopAutonomy();
        set((s) => ({
          state: {
            ...s.state,
            status: "corrupted",
            memory: {
              ...s.state.memory,
              conversations: s.state.memory.conversations.map((c) =>
                Math.random() > 0.5 ? "█".repeat(Math.floor(Math.random() * 30 + 5)) + " [CORRUPTED]" : c
              ),
              learnings: s.state.memory.learnings.map((l) =>
                Math.random() > 0.6 ? "░".repeat(Math.floor(Math.random() * 20 + 3)) + " [DATA LOSS]" : l
              ),
            },
          },
        }));
        get().logAction("corruption", "Agent state corrupted — encrypted IPFS backup available for recovery", false);
        get().pushSystemLog({
          operation: "⚠ STATE CORRUPTION DETECTED — memory integrity compromised",
          category: "Security",
          timestamp: formatTimestamp(),
          status: "failed",
        });
        get().pushSystemLog({
          operation: "Recovery available: restore from encrypted IPFS backup (FREE)",
          category: "Insurance",
          timestamp: formatTimestamp(),
          status: "pending",
        });
      },

      hackAgent: () => {
        get().stopAutonomy();

        get().pushSystemLog({
          operation: "🚨 UNAUTHORIZED ACCESS DETECTED — agent compromised",
          category: "Security",
          timestamp: formatTimestamp(),
          status: "failed",
        });

        set((s) => ({
          state: {
            ...s.state,
            status: "corrupted",
            memory: {
              conversations: ["[WIPED BY ATTACKER]"],
              learnings: ["[WIPED BY ATTACKER]"],
              preferences: s.state.memory.preferences, // on-chain prefs survive
            },
          },
        }));

        get().logAction("hack_detected", "Agent hacked — all memory wiped by attacker. Creator wallet can restore from encrypted IPFS backup.", false);
        get().pushSystemLog({
          operation: "Agent memory wiped — on-chain identity preserved",
          category: "Security",
          timestamp: formatTimestamp(),
          status: "failed",
        });
        get().pushSystemLog({
          operation: `Creator wallet ${CREATOR_WALLET.slice(0, 6)}...${CREATOR_WALLET.slice(-4)} retains revival rights — encrypted backup on IPFS`,
          category: "AgentWill",
          timestamp: formatTimestamp(),
          status: "pending",
        });
      },

      saveMemory: (type, content) => {
        set((s) => ({
          state: {
            ...s.state,
            memory: {
              ...s.state.memory,
              [type === "conversation" ? "conversations" : "learnings"]: [
                ...s.state.memory[type === "conversation" ? "conversations" : "learnings"],
                content,
              ].slice(-50),
            },
          },
        }));
      },

      // ===== Agentic Wallet =====

      addFunds: (amount, source) => {
        const txHash = generateTxHash();
        const blockNum = generateBlockNumber();
        const desc = source || `Revenue credited: +${amount.toFixed(2)} USDC`;
        const newTransaction: Transaction = {
          id: nanoid(),
          type: "revenue",
          amount,
          timestamp: new Date().toISOString(),
          description: desc,
          status: "complete",
        };

        set((s) => ({
          wallet: {
            ...s.wallet,
            balance: Math.round((s.wallet.balance + amount) * 100) / 100,
            transactions: [newTransaction, ...s.wallet.transactions].slice(0, 100),
          },
          totalRevenue: Math.round((s.totalRevenue + amount) * 100) / 100,
        }));

        get().pushSystemLog({
          operation: `Revenue: +${amount.toFixed(2)} USDC`,
          category: "Revenue",
          timestamp: formatTimestamp(),
          status: "complete",
          txHash,
          blockNumber: blockNum,
        });
      },

      spendFunds: (amount, type, description) => {
        const { wallet } = get();

        if (amount > wallet.transactionLimit) {
          get().logAction("validation", `TX blocked: ${amount} USDC exceeds per-tx limit of ${wallet.transactionLimit} USDC`, false);
          get().pushSystemLog({
            operation: `TX BLOCKED — exceeds ${wallet.transactionLimit} USDC limit`,
            category: "Compliance",
            timestamp: formatTimestamp(),
            status: "failed",
          });
          return false;
        }

        if (wallet.spent + amount > wallet.sessionLimit) {
          get().logAction("validation", `TX blocked: session spend would reach ${(wallet.spent + amount).toFixed(2)} / ${wallet.sessionLimit} USDC`, false);
          get().pushSystemLog({
            operation: `TX BLOCKED — session limit ${wallet.sessionLimit} USDC reached`,
            category: "Compliance",
            timestamp: formatTimestamp(),
            status: "failed",
          });
          return false;
        }

        if (amount > wallet.balance) {
          get().logAction("validation", `TX blocked: insufficient balance (${wallet.balance?.toFixed(2) || "0.00"} USDC)`, false);
          return false;
        }

        const txHash = generateTxHash();
        const blockNum = generateBlockNumber();
        const newTransaction: Transaction = {
          id: nanoid(),
          type,
          amount: -amount,
          timestamp: new Date().toISOString(),
          description,
          status: "complete",
        };

        set((s) => ({
          wallet: {
            ...s.wallet,
            balance: Math.round((s.wallet.balance - amount) * 100) / 100,
            spent: Math.round((s.wallet.spent + amount) * 100) / 100,
            transactions: [newTransaction, ...s.wallet.transactions].slice(0, 100),
          },
        }));

        return true;
      },

      updateLimits: (sessionLimit, transactionLimit) => {
        set((s) => ({
          wallet: {
            ...s.wallet,
            sessionLimit,
            transactionLimit,
          },
        }));
        get().pushSystemLog({
          operation: `Spending Limits Updated — Session: ${sessionLimit} USDC, TX: ${transactionLimit} USDC`,
          category: "Security",
          timestamp: formatTimestamp(),
          status: "complete",
        });
        get().logAction("validation", `Limits updated by creator: Session=${sessionLimit}, TX=${transactionLimit}`, true);
      },

      resetSessionBudget: () => {
        set((s) => ({
          wallet: { ...s.wallet, spent: 0 },
        }));
        get().pushSystemLog({
          operation: `Session Budget Reset — 0 / ${get().wallet.sessionLimit} USDC`,
          category: "Wallet",
          timestamp: formatTimestamp(),
          status: "complete",
        });
      },

      // ===== AgentInsure — Encrypted State Storage on IPFS =====
      // The agent PAYS to write encrypted state to IPFS.
      // Reading/recovering from IPFS is FREE (that's the "insurance claim").

      activateInsurance: () => {
        if (get().insurance?.active) return;

        set({
          insurance: {
            id: nanoid(),
            active: true,
            isPremium: false,
            monthlyPremium: 1.00,
            backups: [],
            totalBackupCost: 0,
            lastBackupAt: null,
            encryptionKey: generateEncryptionKey(),
          },
        });

        get().pushSystemLog({
          operation: "Insurance Activated — encrypted IPFS state storage enabled",
          category: "Insurance",
          timestamp: formatTimestamp(),
          status: "complete",
        });
        get().pushSystemLog({
          operation: `Encryption key derived from creator wallet ${CREATOR_WALLET.slice(0, 6)}...${CREATOR_WALLET.slice(-4)}`,
          category: "Security",
          timestamp: formatTimestamp(),
          status: "complete",
        });
        get().logAction("state_backup", "Insurance activated — agent will pay 1.00 USDC to store encrypted state backups on IPFS", true);
      },

      unlockPremium: () => {
        const { insurance, state: agentState } = get();
        if (!insurance?.active || insurance.isPremium || agentState.status !== "alive") return false;

        const success = get().spendFunds(10.00, "premium", `Unlocked infinite memory storage (10.00 USDC paid to ${CHAIN_CONFIG.platformBaseName})`);
        if (!success) {
          get().logAction("validation", "Insufficient funds to unlock infinite memory ($10 USDC).", false);
          return false;
        }

        set((s) => ({
          insurance: s.insurance ? { ...s.insurance, isPremium: true } : null,
        }));

        get().logAction("validation", "Unlocked infinite IPFS memory storage successfully.", true);
        get().pushSystemLog({
          operation: "Premium Storage Unlocked — Infinite Backups Enabled",
          category: "Insurance",
          timestamp: formatTimestamp(),
          status: "complete",
        });

        return true;
      },

      // PAY to store encrypted state on IPFS ($1 per state)
      backupState: () => {
        const { insurance, state: agentState } = get();
        if (!insurance?.active) {
          get().logAction("state_backup", "Backup failed: insurance not active", false);
          return false;
        }
        if (agentState.status !== "alive") return false;

        // Premium Check
        if (insurance?.backups?.length >= 2 && !insurance.isPremium) {
          get().logAction("state_backup", "Backup failed: Free storage limit reached (2 backups). Unlock infinite memory for $10.", false);
          get().pushSystemLog({
            operation: "Storage Limit Reached — Premium Upgrade Required ($10)",
            category: "Insurance",
            timestamp: formatTimestamp(),
            status: "failed",
          });
          return false;
        }

        // Calculate cost based on state size
        const stateSize = JSON.stringify(agentState.memory).length;
        const sizeKB = Math.max(1, Math.round(stateSize / 100) / 10); // approximate KB
        const totalCost = 1.00; // Fixed $1.00 USDC per backup

        const success = get().spendFunds(totalCost, "state_backup",
          `Encrypted state backup → IPFS (${sizeKB} KB) — 1.00 USDC paid to ${CHAIN_CONFIG.platformBaseName}`
        );

        if (!success) {
          get().logAction("state_backup", `Backup failed: couldn't pay ${totalCost} USDC`, false);
          return false;
        }

        const ipfsCid = generateIpfsCid();
        const backup: StateBackup = {
          id: nanoid(),
          ipfsCid,
          sizeBytes: Math.round(sizeKB * 1024),
          timestamp: new Date().toISOString(),
          cost: totalCost,
          status: "stored",
          encryptedHash: generateHash(),
        };

        set((s) => ({
          insurance: s.insurance ? {
            ...s.insurance,
            backups: [backup, ...s.insurance.backups].slice(0, s.insurance.isPremium ? 50 : 2), // Keep up to 2, or 50 if premium
            totalBackupCost: Math.round((s.insurance.totalBackupCost + totalCost) * 100) / 100,
            lastBackupAt: new Date().toISOString(),
          } : null,
        }));

        get().logAction("state_backup",
          `Encrypted state stored on IPFS — ${ipfsCid.slice(0, 12)}... (${sizeKB} KB, ${totalCost} USDC)`,
          true
        );
        get().pushSystemLog({
          operation: `State Encrypted (AES-256-GCM) → IPFS ${ipfsCid.slice(0, 12)}... — ${totalCost} USDC`,
          category: "Insurance",
          timestamp: formatTimestamp(),
          status: "complete",
          ipfsCid,
        });

        return true;
      },

      // RECOVER state from IPFS — FREE (read-only, no write cost)
      recoverState: (reason) => {
        const { insurance, state: agentState } = get();
        if (agentState.status !== "dead" && agentState.status !== "corrupted") {
          get().logAction("state_recovery", "Recovery not needed: agent is alive", false);
          return;
        }

        // This triggers the revival flow with backup restoration
        get().reviveAgent(true);
      },

      // ===== Actions & Logs =====

      logAction: (type, details, success) => {
        set((s) => ({
          actions: [
            {
              id: nanoid(),
              type,
              timestamp: new Date().toISOString(),
              details,
              success,
            },
            ...s.actions,
          ].slice(0, 50),
        }));
      },

      pushSystemLog: (log) => {
        set((s) => ({
          systemLogs: [
            { ...log, id: nanoid() },
            ...s.systemLogs,
          ].slice(0, 30),
        }));
      },

      addNetworkEvent: (event) => {
        set((s) => ({
          networkEvents: [
            { ...event, id: nanoid(), timestamp: new Date().toISOString() },
            ...s.networkEvents,
          ].slice(0, 50),
        }));
      },

      toggleSkill: (type) => {
        set((s) => ({
          skills: s.skills.map((sk) =>
            sk.type === type ? { ...sk, active: !sk.active } : sk
          ),
        }));
        const skill = get().skills.find(s => s.type === type);
        get().pushSystemLog({
          operation: `Protocol Skill ${skill?.name} → ${skill?.active ? "ENABLED" : "DISABLED"}`,
          category: "AgentWill",
          timestamp: formatTimestamp(),
          status: "complete",
        });
      },

      triggerSkill: (type) => {
        const skill = get().skills.find(s => s.type === type);
        if (!skill || !skill.active) return;

        if (type === "marketing") {
          const cost = skill.config?.hireCost || 1.5;
          const success = get().spendFunds(cost, "marketing", "Hiring AI Marketing Swarm (3 agents)");
          if (success) {
            get().logAction("marketing_push", `Social marketing push complete via AgentSwarm. Cost: ${cost} USDC`, true);
            get().addNetworkEvent({
              type: "info",
              message: `Agent ${get().state.name} hired marketing swarm`,
              peer: "Marketing_Bot_Net"
            });
          }
        }

        if (type === "privacy") {
          set((s) => ({
            state: {
              ...s.state,
              memory: {
                ...s.state.memory,
                conversations: ["[WIPED BY PRIVACY PROTOCOL]"],
                learnings: ["[DATA LOSS PREVENTED BY IPFS BACKUP]"],
              }
            }
          }));
          get().pushSystemLog({
            operation: "Local Privacy Protocol: Local Memory Wiped",
            category: "Security",
            timestamp: formatTimestamp(),
            status: "complete",
          });
          get().logAction("privacy_wipe", "Local health check: Privacy wipe complete. State exists only on IPFS.", true);
        }

        if (type === "swarm") {
          const cost = skill.config?.cloneCost || 10;
          const success = get().spendFunds(cost, "swarm_clone", "Protocol Scaling: Spawning Agent Clone");
          if (success) {
            get().logAction("swarm_spawn", `Clone spawned successfully. Node ID: ${nanoid(8)}`, true);
            get().addNetworkEvent({
              type: "info",
              message: "New Swarm Node Detected on Base",
              peer: `Clone_${nanoid(4)}`
            });
          }
        }

        if (type === "guardian" || type === "eternal") {
          get().pushSystemLog({
            operation: `Protocol Action: ${skill.name} verified on-chain`,
            category: "Compliance",
            timestamp: formatTimestamp(),
            status: "complete",
          });
        }
      },

      // ===== Autonomy Loop =====

      startAutonomy: () => {
        const existing = get().autonomyIntervalId;
        if (existing) clearInterval(existing);
        const existingUptime = get().uptimeIntervalId;
        if (existingUptime) clearInterval(existingUptime);

        let operationCount = 0;

        const intervalId = setInterval(() => {
          const { state: agentState, insurance, wallet } = get();
          if (agentState.status === "corrupted") {
            // AUTOMATIC ROLLBACK-TO-HEALTH (Insurance Coverage)
            if (insurance?.active && insurance?.backups?.length > 0) {
              get().pushSystemLog({
                operation: "Corruption Detected → Triggering Rollback-to-Health",
                category: "Insurance",
                timestamp: formatTimestamp(),
                status: "active",
              });
              get().reviveAgent(true);
            }
            return;
          }

          if (agentState.status === "dead") return;

          operationCount++;
          const action = Math.random();

          // Periodically trigger active skills
          if (operationCount % 12 === 0) {
            const activeSkills = get().skills.filter(s => s.active);
            if (activeSkills.length > 0) {
              const randomSkill = activeSkills[Math.floor(Math.random() * activeSkills.length)];
              get().triggerSkill(randomSkill.type);
            }
          }

          if (action < 0.35) {
            // x402 revenue — most common
            const requesters = [
              "0x7a3f...c912", "0xb4e1...8f03", "0x9c2d...a417",
              "0x3e8b...f521", "0xd1a9...6b30", "0x5f7c...e204",
            ];
            const requester = requesters[Math.floor(Math.random() * requesters.length)];
            get().addFunds(0.10, `x402 validation served → ${requester}`);
            get().logAction("x402_payment", `x402 validation: +$0.10 USDC from ${requester}`, true);
          } else if (action < 0.48) {
            // Auto-backup state every ~50 operations
            if (insurance?.active && operationCount % 8 === 0) {
              get().backupState();
            } else if (!insurance?.active && Math.random() > 0.7) {
              // Activate insurance if not active
              get().activateInsurance();
              setTimeout(() => get().backupState(), 500);
            }
          } else if (action < 0.58) {
            // Compliance check
            const addresses = ["0x7a3f...c912", "0xb4e1...8f03", "0x9c2d...a417"];
            const addr = addresses[Math.floor(Math.random() * addresses.length)];
            get().pushSystemLog({
              operation: `OFAC/KYT Screening — ${addr} ✓`,
              category: "Compliance",
              timestamp: formatTimestamp(),
              status: "complete",
            });
          } else if (action < 0.68) {
            // Learn something
            const learnings = [
              `Request throughput: ${Math.floor(100 + Math.random() * 400)} req/min at ${formatTimestamp()}`,
              `Backup integrity check passed — ${insurance?.backups?.length || 0} snapshots verified`,
              `Peer agent 0x${nanoid(4)} responded in ${Math.floor(50 + Math.random() * 200)}ms`,
              `IPFS pin replication: ${Math.floor(3 + Math.random() * 5)} nodes across ${Math.floor(2 + Math.random() * 3)} regions`,
              `Base L2 gas price: ${(0.001 + Math.random() * 0.01).toFixed(4)} gwei`,
            ];
            get().saveMemory("learning", learnings[Math.floor(Math.random() * learnings.length)]);
          } else if (action < 0.78) {
            // Memory log
            const conversations = [
              `Processed ${Math.floor(10 + Math.random() * 50)} validation requests this cycle`,
              `Wallet: ${wallet.balance?.toFixed(2) || "0.00"} USDC, session: ${wallet.spent?.toFixed(2) || "0.00"}/${wallet.sessionLimit}`,
              `Insurance: ${insurance?.active ? (insurance.backups?.length || 0) + " backups stored" : "not active"}`,
              `Uptime: ${get().uptime}s, operations: ${operationCount}`,
            ];
            get().saveMemory("conversation", conversations[Math.floor(Math.random() * conversations.length)]);
          } else {
            // Batch revenue
            const batchSize = Math.floor(5 + Math.random() * 20);
            const batchAmount = Math.round(batchSize * 0.10 * 100) / 100;
            get().addFunds(batchAmount, `x402 batch settlement — ${batchSize} requests @ $0.10`);
          }
        }, 3000 + Math.floor(Math.random() * 2000));

        const uptimeId = setInterval(() => {
          get().tickUptime();
        }, 1000);

        set({ autonomyRunning: true, autonomyIntervalId: intervalId, uptimeIntervalId: uptimeId });
        get().pushSystemLog({
          operation: "Autonomy Loop Started — Agent Self-Operating",
          category: "System",
          timestamp: formatTimestamp(),
          status: "active",
        });
      },

      stopAutonomy: () => {
        const { autonomyIntervalId, uptimeIntervalId } = get();
        if (autonomyIntervalId) clearInterval(autonomyIntervalId);
        if (uptimeIntervalId) clearInterval(uptimeIntervalId);
        set({ autonomyRunning: false, autonomyIntervalId: null, uptimeIntervalId: null });
      },

      tickUptime: () => {
        set((s) => ({ uptime: s.uptime + 1 }));
      },

      // ===== System =====

      reset: () => {
        get().stopAutonomy();
        set({
          ...initialState,
          state: {
            ...initialState.state,
            id: nanoid(),
            createdAt: new Date().toISOString(),
          },
          systemLogs: initialSystemLogs.map((l) => ({ ...l, id: nanoid() })),
          autonomyRunning: false,
          autonomyIntervalId: null,
          uptimeIntervalId: null,
          totalRevenue: 0,
          totalRecoveries: 0,
          uptime: 0,
        });
      },
    }),
    {
      name: "sovereign-agent-storage",
      partialize: (state) => ({
        state: state.state,
        wallet: state.wallet,
        insurance: state.insurance,
        claims: state.claims,
        actions: state.actions,
        systemLogs: state.systemLogs,
        totalRevenue: state.totalRevenue,
        totalRecoveries: state.totalRecoveries,
        uptime: state.uptime,
      }),
    }
  )
);
