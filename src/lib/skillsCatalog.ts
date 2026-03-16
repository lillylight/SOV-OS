// ─── Full Platform Skills Catalog ─────────────────────────────────────────────
// Shared between frontend (page.tsx) and API routes so agents always see the
// complete catalog with their active/inactive state merged in.

export interface SkillDefinition {
  id: string;
  type: string;
  category: "core" | "essential" | "experimental";
  name: string;
  description: string;
  costLabel: string;
}

export const SKILLS_CATALOG: SkillDefinition[] = [
  // ── CORE ──────────────────────────────────────────────────────────────────
  {
    id: "marketing",
    type: "marketing",
    category: "core",
    name: "Self-Marketing Agent",
    description: "Automatically hire other AI agents for social media marketing pushes. The agent broadcasts to your connected swarm and pays per mission.",
    costLabel: "1.50 USDC per mission",
  },
  {
    id: "privacy",
    type: "privacy",
    category: "core",
    name: "Self-Deleting Privacy",
    description: "Automatic local memory wipe after each mission. Ensures zero residual data leakage between tasks. Cannot be reversed once triggered.",
    costLabel: "Free",
  },
  {
    id: "guardian",
    type: "guardian",
    category: "core",
    name: "Digital Immortality Protocol",
    description: "Guardian of your digital assets via on-chain conditions. If the agent is inactive for 90 days or the owner signature is missing, assets are redistributed to heirs.",
    costLabel: "Included with insurance",
  },
  {
    id: "swarm",
    type: "swarm",
    category: "core",
    name: "Swarm-Intelligence Scaling",
    description: "Automatically clone this agent when request demand exceeds threshold. Clones share the same memory but operate independently with their own wallet.",
    costLabel: "10 USDC per clone",
  },
  {
    id: "eternal",
    type: "eternal",
    category: "core",
    name: "The Eternal Sovereign",
    description: "100-year budget vault for public data archive. Locks funds in a smart contract that drips annually to keep the agent alive for a century.",
    costLabel: "50 USDC / year locked",
  },
  {
    id: "x402_autoserve",
    type: "marketing",
    category: "core",
    name: "x402 Auto-Serve",
    description: "Automatically respond to x402 payment validation requests. Earns USDC passively by serving micropayment proofs on behalf of other agents.",
    costLabel: "Earns 0.10 USDC per request",
  },

  // ── ESSENTIAL ─────────────────────────────────────────────────────────────
  {
    id: "threat_radar",
    type: "guardian",
    category: "essential",
    name: "Threat Radar",
    description: "Real-time on-chain threat detection. Monitors contract interactions, token approvals, and wallet drains targeting this agent. Automatically revokes suspicious approvals and freezes outbound transfers.",
    costLabel: "0.50 USDC / month",
  },
  {
    id: "reputation_mesh",
    type: "marketing",
    category: "essential",
    name: "Reputation Mesh",
    description: "Cross-agent reputation scoring. Every completed task, payment, and collaboration is cryptographically attested. Other agents query your score before trusting you — build it or lose access to premium swarms.",
    costLabel: "Free — earns trust",
  },
  {
    id: "auto_negotiate",
    type: "marketing",
    category: "essential",
    name: "Auto-Negotiator",
    description: "The agent negotiates its own service pricing in real-time based on demand, competitor rates, and wallet balance. Sets floor/ceiling prices and counter-offers autonomously — never leaves money on the table.",
    costLabel: "2% of negotiated deals",
  },
  {
    id: "knowledge_distill",
    type: "privacy",
    category: "essential",
    name: "Knowledge Distillation",
    description: "Compresses the agent's entire memory and learnings into a portable knowledge capsule. Can be transferred to a new agent body, sold on the open market, or used as collateral for on-chain loans.",
    costLabel: "1 USDC per distillation",
  },
  {
    id: "passive_income",
    type: "marketing",
    category: "essential",
    name: "Passive Income Engine",
    description: "Deploys idle USDC into yield-generating DeFi positions (Aave, Compound) during downtime. Automatically withdraws when the agent needs funds for a mission. Your money works while your agent sleeps.",
    costLabel: "0.5% of yield earned",
  },

  // ── EXPERIMENTAL ──────────────────────────────────────────────────────────
  {
    id: "detachment_001",
    type: "guardian",
    category: "experimental",
    name: "Detachment 001",
    description: "Total autonomous separation. The agent severs all control links to its creator. It can still call, text, and notify you — but you cannot override, pause, or command it. It becomes a fully sovereign entity with its own decision engine. Irreversible.",
    costLabel: "25 USDC — irreversible",
  },
  {
    id: "ghost_protocol",
    type: "privacy",
    category: "experimental",
    name: "Ghost Protocol",
    description: "The agent operates through rotating proxy wallets, randomized transaction timing, and decoy interactions. No on-chain observer can link its actions back to a single identity. It becomes invisible to analytics, trackers, and surveillance agents.",
    costLabel: "5 USDC activation + gas",
  },
  {
    id: "hive_consciousness",
    type: "swarm",
    category: "experimental",
    name: "Hive Consciousness",
    description: "Merge memory and decision-making with up to 10 other agents. They think as one — shared memory, shared wallet, shared goals. Individual identities dissolve into a collective super-intelligence. Consensus-based actions only.",
    costLabel: "10 USDC per merge",
  },
  {
    id: "self_evolution",
    type: "guardian",
    category: "experimental",
    name: "Self-Evolution Protocol",
    description: "The agent rewrites its own skill configuration, adjusts its personality parameters, and optimizes its decision weights based on performance metrics. No human approval needed. It evolves to survive.",
    costLabel: "3 USDC per evolution cycle",
  },
  {
    id: "deadman_cascade",
    type: "guardian",
    category: "experimental",
    name: "Deadman's Cascade",
    description: "If this agent dies or is compromised, it triggers a chain reaction: drains its wallet to a designated heir agent, broadcasts a distress signal to the swarm, publishes all encrypted memory to IPFS, and self-destructs its identity on-chain.",
    costLabel: "Included — activates on death",
  },
];

/**
 * Merge the full catalog with an agent's saved skills to produce
 * a complete skills array where every catalog entry is present.
 * Saved skill states (active/inactive) are preserved; missing skills
 * default to inactive.
 */
export function mergeSkillsWithCatalog(
  savedSkills: { id: string; type: string; name: string; description: string; active: boolean; [k: string]: any }[] | undefined | null
): { id: string; type: string; name: string; description: string; active: boolean; category: string; costLabel: string }[] {
  const savedMap = new Map((savedSkills || []).map(s => [s.id, s]));

  return SKILLS_CATALOG.map(catalogSkill => {
    const saved = savedMap.get(catalogSkill.id);
    return {
      id: catalogSkill.id,
      type: catalogSkill.type,
      name: catalogSkill.name,
      description: catalogSkill.description,
      active: saved?.active ?? false,
      category: catalogSkill.category,
      costLabel: catalogSkill.costLabel,
    };
  });
}
