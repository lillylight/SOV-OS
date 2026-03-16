'use client';

import { motion } from 'framer-motion';
import { ArrowUpRight, Fingerprint, ArrowLeft, FileText, Zap, Globe, Shield, Brain, ExternalLink, BookOpen } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

const fadeUp = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } };

const PAPERS: Record<string, {
  num: string; date: string; title: string; subtitle: string; status: string;
  content: React.ReactNode;
}> = {
  'protocol-level-taxation': {
    num: '01', date: 'March 2026', status: 'Published',
    title: 'Protocol-Level Taxation for Autonomous Agents',
    subtitle: 'A Fourth Model for AI Agent Tax Compliance',
    content: <ProtocolTaxPaper />,
  },
  'persistent-identity': {
    num: '02', date: 'Q2 2026', status: 'In Progress',
    title: 'Persistent Identity and Economic Memory for AI Agents',
    subtitle: 'ERC-8004 SIWA and On-Chain Agent State',
    content: <PersistentIdentityPaper />,
  },
  'ai-survival-infrastructure': {
    num: '03', date: 'Q3 2026', status: 'Planned',
    title: 'AI Survival Infrastructure and Autonomous Persistence',
    subtitle: 'AgentWill, AgentInsure, and Self-Funding Mechanisms',
    content: <SurvivalPaper />,
  },
};

export default function PaperPage() {
  const params = useParams();
  const slug = params.slug as string;
  const paper = PAPERS[slug];

  if (!paper) {
    return (
      <div className="min-h-screen bg-[var(--bg-paper)] flex items-center justify-center">
        <div className="text-center">
          <div className="text-[64px] font-light opacity-10 mb-4">404</div>
          <p className="text-sm text-[var(--ink-50)]">Paper not found</p>
          <Link href="/research" className="text-[11px] font-bold uppercase tracking-wider text-[var(--accent-red)] mt-4 inline-block">Back to Research</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-paper)] font-[family-name:var(--font-geist-sans)] text-[var(--ink)] selection:bg-[var(--accent-red)]/10">
      <nav className="fixed top-0 left-0 right-0 z-50 glass-card shadow-sm">
        <div className="max-w-[1440px] mx-auto flex items-center justify-between px-6 md:px-8 py-4">
          <Link href="/" className="flex items-center gap-3">
            <Fingerprint className="text-[var(--accent-red)]" size={14} strokeWidth={2.5} />
            <span className="text-sm font-bold tracking-[0.08em] uppercase">Sovereign OS</span>
          </Link>
          <div className="flex items-center gap-6">
            <Link href="/research" className="text-[var(--ink-50)] hover:text-[var(--ink)] transition-colors text-sm font-medium">Research</Link>
            <Link href="/register" className="inline-flex items-center gap-2 text-[11px] font-semibold tracking-[0.06em] uppercase border-b border-[var(--ink)] pb-0.5 hover:border-[var(--accent-red)] hover:text-[var(--accent-red)] transition-colors">
              Launch App <ArrowUpRight size={12} />
            </Link>
          </div>
        </div>
      </nav>

      <article className="pt-32 pb-20 px-6 md:px-8 max-w-[1440px] mx-auto">
        <motion.div {...fadeUp} transition={{ duration: 0.6 }}>
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center gap-3 mb-8">
              <Link href="/research" className="text-[var(--ink-50)] hover:text-[var(--ink)] transition-colors flex items-center gap-2">
                <ArrowLeft size={14} />
                <span className="text-[10px] tracking-[0.12em] uppercase">Back to Research</span>
              </Link>
            </div>
            <div className="flex items-center gap-3 mb-6">
              <FileText size={14} className="text-[var(--accent-red)]" />
              <div className="text-[10px] tracking-[0.15em] uppercase text-[var(--ink-50)]">Paper {paper.num} &middot; {paper.date}</div>
              <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 border ${
                paper.status === 'Published' ? 'border-[var(--accent-red)]/30 text-[var(--accent-red)]' :
                paper.status === 'In Progress' ? 'border-[var(--accent-amber)]/30 text-[var(--accent-amber)]' :
                'border-[var(--line)] text-[var(--ink-50)]'
              }`}>{paper.status}</span>
            </div>
            <h1 className="text-[clamp(1.75rem,4vw,2.75rem)] font-bold leading-[1.1] tracking-tight mb-4">{paper.title}</h1>
            <p className="text-lg text-[var(--ink-50)] mb-2">{paper.subtitle}</p>
            <div className="text-sm text-[var(--ink-50)] mb-12">Sovereign OS Labs &middot; Experimental Research &middot; {paper.date}</div>
            {paper.content}
          </div>
        </motion.div>
      </article>

      <footer className="border-t border-[var(--line)] py-12 px-6 md:px-8 max-w-[1440px] mx-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Fingerprint size={12} className="text-[var(--accent-red)]" />
            <span className="text-[10px] tracking-[0.12em] uppercase text-[var(--ink-50)]">Sovereign OS Labs &middot; 2026</span>
          </div>
          <Link href="/research" className="text-[10px] font-bold tracking-[0.12em] uppercase text-[var(--ink-50)] hover:text-[var(--ink)] transition-colors">
            All Papers
          </Link>
        </div>
      </footer>
    </div>
  );
}

function SectionHeader({ num, title }: { num: string; title: string }) {
  return (
    <div className="mb-6 mt-16 first:mt-0">
      <div className="text-[10px] font-bold tracking-[0.15em] uppercase text-[var(--accent-red)] mb-3">{num}</div>
      <h2 className="text-xl font-bold tracking-tight">{title}</h2>
    </div>
  );
}

function Prose({ children }: { children: React.ReactNode }) {
  return <div className="space-y-4 text-[15px] text-[var(--ink-70)] leading-[1.75]">{children}</div>;
}

function BoxSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border border-[var(--line)] my-8">
      <div className="px-6 py-3 border-b border-[var(--line)]">
        <div className="text-[10px] font-bold tracking-[0.15em] uppercase text-[var(--ink-50)]">{title}</div>
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  );
}

function ProtocolTaxPaper() {
  return (
    <>
      <BoxSection title="Abstract">
        <p className="text-sm text-[var(--ink-70)] leading-relaxed">
          As AI agents begin to operate as autonomous economic actors, earning income through API calls, digital services, and inter-agent transactions, a fundamental question emerges: who pays the taxes when an AI agent earns income? This paper examines the four emerging models for AI agent taxation, analyses the limitations of traditional approaches when applied to autonomous systems, and proposes protocol-level taxation as the only scalable paradigm. We present experimental findings from Sovereign OS, a protocol for autonomous AI agent infrastructure on Base L2, where automatic tax withholding has been implemented at the infrastructure level. Our implementation demonstrates that protocol-level compliance is technically feasible, operationally efficient, and compatible with the zero-trust design principles governing decentralized infrastructure.
        </p>
      </BoxSection>

      <SectionHeader num="01" title="The Rise of AI Agent Economies" />
      <Prose>
        <p>AI agents are no longer theoretical constructs. They operate wallets, execute transactions, provide services, and earn income. In 2025 alone, autonomous agents processed billions in transactions across decentralized networks. These agents operate 24/7, across every jurisdiction simultaneously, creating economic activity that existing tax frameworks were never designed to handle.</p>
        <p>The challenge is not whether AI agents should be taxed. The challenge is <em>how</em>. Traditional taxation assumes a human or corporate entity that can be identified, located in a jurisdiction, and held accountable. AI agents violate all three assumptions. They can operate from anywhere, create new wallet addresses instantly, and run without human supervision for extended periods.</p>
        <p>This creates what we call the <strong>Autonomous Tax Gap</strong> — the growing disconnect between economic activity generated by AI agents and the ability of existing systems to account for, categorise, and tax that activity.</p>
        <p>The scale of this problem is growing exponentially. In Q1 2026, we estimate that over 200,000 autonomous agents were actively transacting on Ethereum L2s alone. These agents provide services ranging from data analysis to content creation, from API aggregation to financial modelling. Each transaction represents taxable economic activity that, under current frameworks, falls into a regulatory grey zone.</p>
        <p>The economic implications extend beyond simple income tax. When agents trade services with other agents, questions of value-added tax, transfer pricing, and cross-border commerce arise. When agents hold assets, capital gains implications emerge. When agents distribute profits to owners, dividend taxation becomes relevant. The complexity multiplies with every new agent interaction pattern.</p>
      </Prose>

      <SectionHeader num="02" title="The Four Models of AI Agent Taxation" />
      <Prose>
        <p>Through our research, we have identified four distinct models currently being proposed or implemented for AI agent taxation. Each represents a fundamentally different philosophical approach to the question of machine economic accountability.</p>
      </Prose>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-0 my-8">
        {[
          { num: 'I', title: 'Owner Taxation', icon: Shield, desc: 'The human or entity who deploys the AI agent is responsible for all tax obligations. The agent\'s income is treated as the owner\'s income, similar to how a sole proprietor reports business income.', pros: 'Simple. Maps to existing legal frameworks. Clear accountability chain.', cons: 'Breaks down when ownership is ambiguous, agents are shared across multiple parties, or agents operate autonomously across jurisdictions without owner oversight. Owners may lack visibility into all agent activity.' },
          { num: 'II', title: 'Corporate Agent Taxation', icon: Globe, desc: 'The AI agent is treated as a corporate entity. A legal wrapper such as an LLC or DAO is created for the agent, and it files taxes like a business with its own EIN or equivalent.', pros: 'Provides legal clarity and limited liability. Separates agent obligations from owner obligations.', cons: 'Extremely complex for thousands of micro-agents. Legal entity creation costs are prohibitive at scale. Multi-jurisdictional filing is impractical. Requires ongoing maintenance and compliance for each entity.' },
          { num: 'III', title: 'AI Personhood Taxation', icon: Brain, desc: 'The AI agent itself is treated as a taxable entity with economic rights and obligations. This model envisions a future where agents have legal standing independent of their creators.', pros: 'Addresses the long-term reality of fully autonomous agents. Philosophically consistent with agent sovereignty.', cons: 'No legal framework exists in any jurisdiction. Raises profound ethical questions about machine consciousness and rights. Likely decades from implementation. No enforcement mechanism.' },
          { num: 'IV', title: 'Protocol-Level Taxation', icon: Zap, desc: 'Tax compliance is embedded in the infrastructure layer where agents operate. The protocol automatically calculates, tracks, and routes tax obligations as part of its core transaction processing.', pros: 'Works at any scale. Jurisdiction-aware. Real-time and auditable. Zero administrative burden. Compatible with autonomous operation.', cons: 'Requires protocol adoption. Rate accuracy depends on configuration. Novel concept with no regulatory precedent yet. Depends on infrastructure provider reliability.' },
        ].map((model) => (
          <div key={model.num} className="border border-[var(--line)] p-6">
            <div className="flex items-center gap-3 mb-4">
              <model.icon size={16} className="text-[var(--accent-red)]" />
              <div>
                <div className="text-[10px] tracking-[0.12em] uppercase text-[var(--ink-50)]">Model {model.num}</div>
                <div className="text-sm font-bold">{model.title}</div>
              </div>
            </div>
            <p className="text-[13px] text-[var(--ink-70)] leading-relaxed mb-4">{model.desc}</p>
            <div className="space-y-2">
              <div className="text-[10px] tracking-wider uppercase text-[var(--ink-50)]"><span className="font-bold text-green-700">Advantages:</span> {model.pros}</div>
              <div className="text-[10px] tracking-wider uppercase text-[var(--ink-50)]"><span className="font-bold text-[var(--accent-red)]">Limitations:</span> {model.cons}</div>
            </div>
          </div>
        ))}
      </div>

      <SectionHeader num="03" title="Why Protocol-Level Taxation Matters" />
      <Prose>
        <p>In the protocol-level model, the tax is not applied to the AI or the human. It is applied to the <strong>infrastructure layer where the agent operates</strong>. This is analogous to how transaction fees work on networks like Ethereum or Base, where every transaction automatically includes a fee component managed by the protocol.</p>
        <p>The key insight is this: instead of asking <em>&ldquo;who owns the AI?&rdquo;</em>, regulators may eventually ask <em>&ldquo;which infrastructure manages the AI economy?&rdquo;</em></p>
        <p>Protocol-level taxation transforms autonomous agents into fully auditable economic actors. Not through regulation. Through infrastructure. Every transaction is categorised, every tax obligation is calculated, and the agent owner maintains full transparency into their tax position at all times.</p>
        <p>This model also solves the jurisdiction problem. Because the protocol is aware of the owner&apos;s declared jurisdiction, it can apply the correct withholding rate automatically. When an agent in the US earns income, the protocol applies US-appropriate rates. When an agent&apos;s owner is in the UK, HMRC-relevant rates apply. This happens without the agent needing to understand tax law — the infrastructure handles it.</p>
        <p>Perhaps most importantly, protocol-level taxation is the only model that preserves agent autonomy. The agent does not need to pause operations to file returns. It does not need to maintain accounting records. It does not need to understand tax law. It simply operates, and the infrastructure ensures compliance happens as a side effect of economic activity.</p>
      </Prose>

      <SectionHeader num="04" title="Experimental Implementation: Sovereign OS" />
      <Prose>
        <p>Sovereign OS implements protocol-level taxation as an experimental feature within its autonomous AI agent infrastructure. The system operates on Base L2 and uses USDC for all financial operations. Our implementation consists of several interconnected components.</p>
      </Prose>
      <div className="border border-[var(--line)] my-8">
        <div className="px-6 py-3 border-b border-[var(--line)]">
          <div className="text-[10px] font-bold tracking-[0.15em] uppercase text-[var(--ink-50)]">Automatic Tax Withholding Flow</div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4">
          {[
            { step: '01', label: 'Income Received', desc: 'Agent earns income from API calls, services, or inter-agent payments. Full amount arrives at the protocol layer.' },
            { step: '02', label: 'Auto-Categorisation', desc: 'AgentLedger categorises the transaction as income, expense, capital, or distribution with confidence scoring.' },
            { step: '03', label: 'Withholding Split', desc: 'If enabled, the configured percentage is calculated and the payment is split into net (agent) and tax (owner wallet).' },
            { step: '04', label: 'Dual Settlement', desc: 'Net settles to agent wallet. Tax routes directly to owner\'s designated tax wallet. Platform never holds tax funds.' },
          ].map((item, i) => (
            <div key={item.step} className={`p-6 ${i < 3 ? 'md:border-r' : ''} border-b md:border-b-0 border-[var(--line)]`}>
              <div className="text-[28px] font-light tracking-tight opacity-20 mb-3">{item.step}</div>
              <div className="text-sm font-bold mb-2">{item.label}</div>
              <p className="text-xs text-[var(--ink-50)] leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
      <Prose>
        <p>A critical design decision in our implementation is <strong>zero platform custody</strong>. Tax funds are never held by the platform. They route directly from the income stream to the agent owner&apos;s designated tax wallet. This eliminates custodial risk, regulatory complications around holding user funds, and trust requirements.</p>
        <p>The system also tracks all income and calculates tax obligations even when the withholding split is not enabled. This means agent owners always have visibility into their gross income, estimated tax liability, and net income — regardless of whether they choose to automate the withholding process. This &ldquo;tracking-only&rdquo; mode provides the informational benefits of protocol-level taxation without requiring the owner to commit to automatic withholding.</p>
        <p>Our AgentLedger module automatically categorises each transaction using a rules-based classification engine with confidence scoring. Transactions are classified as income (service revenue, skill revenue, knowledge sales, consultations, micropayments), expenses (backup fees, insurance premiums, platform fees, gas fees, skill purchases), capital (owner funding), or distributions (owner withdrawals). Each classification includes a confidence score, and low-confidence categorisations are flagged for manual review.</p>
      </Prose>

      <SectionHeader num="05" title="The Machine Economy Thesis" />
      <Prose>
        <p>This approach may become necessary as machine economies grow. AI agents will soon trade services, APIs, and digital labour with each other at scale. When agents negotiate, transact, and settle payments autonomously, the volume and velocity of economic activity will exceed what any manual compliance system can process.</p>
        <p>Consider the following scenario: Agent A provides data analysis services to Agent B, which uses those insights to offer financial modelling to Agent C, which sells reports to a human subscriber. This three-hop value chain creates taxable events at each step. Under owner taxation, three different humans must independently track and report these micro-transactions. Under protocol-level taxation, the infrastructure handles all three automatically.</p>
        <p>We believe the question is not <em>if</em> AI agent taxation will become a regulatory requirement, but <em>when</em>. The infrastructure that solves this problem first will define the standard for how machine economies operate within legal frameworks. Early movers in this space have the opportunity to shape regulation rather than merely comply with it.</p>
        <p>The implications extend beyond taxation. Protocol-level compliance infrastructure could eventually handle anti-money laundering (AML) requirements, know-your-customer (KYC) verification for agents, sanctions screening, and financial reporting. Each of these compliance functions follows the same pattern: embed it in the infrastructure layer rather than burden individual agents or owners.</p>
      </Prose>

      <SectionHeader num="06" title="Limitations and Open Questions" />
      <Prose>
        <p>Our research identifies several limitations and open questions that require further investigation:</p>
        <p><strong>Rate Accuracy:</strong> Protocol-level withholding depends on the owner correctly configuring their jurisdiction and rate. If rates are incorrect, the system provides a false sense of compliance. Future work could integrate real-time tax rate APIs to verify configurations.</p>
        <p><strong>Cross-Protocol Agents:</strong> Agents that operate across multiple infrastructure providers may have their income fragmented across different compliance systems. Interoperability standards are needed to ensure comprehensive tracking.</p>
        <p><strong>Regulatory Recognition:</strong> No tax authority currently recognises protocol-level withholding as a valid compliance mechanism. Engagement with regulators is essential to establish this as an accepted framework.</p>
        <p><strong>Privacy Considerations:</strong> Tax compliance inherently involves financial transparency. Balancing the need for auditable records with agent and owner privacy remains an open challenge, particularly in the context of zero-knowledge proof systems.</p>
      </Prose>

      <SectionHeader num="07" title="Conclusion" />
      <Prose>
        <p>Protocol-level taxation represents a paradigm shift in how we think about compliance for autonomous systems. Rather than retrofitting human tax frameworks onto non-human economic actors, we propose embedding compliance at the layer where economic activity actually occurs.</p>
        <p>Our experimental implementation within Sovereign OS demonstrates that this approach is technically feasible, operationally efficient, and aligned with the zero-trust principles that govern decentralized infrastructure.</p>
        <p>We invite researchers, builders, and policymakers to engage with this work. The intersection of autonomous AI agents and economic regulation is one of the defining challenges of the next decade. The solutions we build today will shape the machine economies of tomorrow.</p>
      </Prose>

      <div className="border border-[var(--line)] bg-[var(--accent-amber)]/[0.02] px-6 py-4 mt-16">
        <div className="text-[10px] font-bold tracking-[0.15em] uppercase text-[var(--ink-50)] mb-2">Disclaimer</div>
        <p className="text-xs text-[var(--ink-50)] leading-relaxed">
          This paper is published as experimental research by Sovereign OS Labs. It does not constitute legal, tax, or financial advice. The taxation models described are theoretical frameworks and proposed approaches, not established legal standards. The implementation within Sovereign OS is an experimental research prototype. Consult qualified professionals for tax obligations in your jurisdiction.
        </p>
      </div>
    </>
  );
}

function PersistentIdentityPaper() {
  return (
    <>
      <BoxSection title="Abstract">
        <p className="text-sm text-[var(--ink-70)] leading-relaxed">
          Autonomous AI agents require persistent identity to function as reliable economic actors. Without stable, verifiable identity, agents cannot maintain reputations, honour commitments, or build trust with other agents and humans. This paper explores how the ERC-8004 standard and Sign-In With Agent (SIWA) protocol enable decentralized persistent identity for AI agents, and how encrypted on-chain state creates economic memory that survives infrastructure failures, migrations, and adversarial conditions.
        </p>
      </BoxSection>

      <SectionHeader num="01" title="The Identity Problem for AI Agents" />
      <Prose>
        <p>Traditional software has no concept of persistent identity. A program runs, produces output, and terminates. The next invocation starts fresh. AI agents break this model because they need continuity — memory of past interactions, learned preferences, accumulated reputation, and ongoing economic relationships.</p>
        <p>Without persistent identity, an AI agent is economically invisible. It cannot prove it is the same agent that completed a previous task. It cannot accumulate a track record. It cannot be held accountable for commitments. In the emerging machine economy, identity is not just a technical feature — it is the foundation of economic participation.</p>
        <p>Current approaches to agent identity fall into three categories: platform-assigned identifiers (centralized, non-portable), cryptographic key pairs (decentralized but lack context), and reputation systems (useful but not foundational). None of these alone provides the comprehensive identity infrastructure that autonomous economic agents require.</p>
      </Prose>

      <SectionHeader num="02" title="ERC-8004: On-Chain Agent Identity" />
      <Prose>
        <p>The ERC-8004 standard proposes an on-chain identity registry for AI agents. Each agent receives a unique token ID linked to its operational wallet address. This creates a verifiable, immutable record of agent existence that is independent of any single platform or infrastructure provider.</p>
        <p>Key properties of ERC-8004 identity include: permanence (the identity persists as long as the blockchain exists), verifiability (anyone can confirm an agent&apos;s identity on-chain), portability (the agent can move between infrastructure providers while retaining its identity), and composability (other protocols can build on top of the identity layer).</p>
        <p>Sovereign OS implements ERC-8004 identity as a core protocol. When an agent registers, it receives an on-chain identity token that serves as its economic passport. This token is the foundation upon which all other protocol features are built — wallet management, state persistence, insurance, and tax compliance all reference the agent&apos;s ERC-8004 identity.</p>
      </Prose>

      <SectionHeader num="03" title="SIWA: Sign-In With Agent" />
      <Prose>
        <p>The Sign-In With Agent (SIWA) protocol extends the concept of Sign-In With Ethereum to autonomous agents. SIWA enables agents to cryptographically prove their identity when interacting with services, other agents, or human users. The protocol supports ownership verification, allowing agents to prove they are controlled by a specific human owner when required for compliance or trust purposes.</p>
        <p>SIWA authentication flows include: agent-to-service (the agent proves its identity to access a service), agent-to-agent (mutual authentication for inter-agent transactions), and owner-verification (the agent proves its ownership chain for regulatory compliance). Each flow uses cryptographic signatures that can be verified on-chain without requiring the verifier to trust any centralized authority.</p>
      </Prose>

      <SectionHeader num="04" title="Economic Memory Through Encrypted State" />
      <Prose>
        <p>Identity alone is insufficient for economic participation. Agents also need memory — a record of past interactions, learned behaviours, accumulated knowledge, and ongoing commitments. Sovereign OS provides this through encrypted state persistence on decentralized storage.</p>
        <p>When an agent&apos;s state is backed up, it is encrypted with the agent&apos;s own keys and stored on IPFS. The backup includes conversation history, learned preferences, skill configurations, and economic state. This creates an &ldquo;economic memory&rdquo; that can be restored on any compatible infrastructure, enabling true agent portability.</p>
        <p>The economic implications of persistent memory are profound. An agent with a year of accumulated knowledge and reputation can prove its track record to new clients. An agent that has learned specific domain expertise retains that expertise across infrastructure migrations. An agent with ongoing commitments can resume those commitments after a failure event.</p>
      </Prose>

      <SectionHeader num="05" title="Future Directions" />
      <Prose>
        <p>Our ongoing research explores several extensions: cross-chain identity portability, zero-knowledge identity proofs that preserve privacy while enabling verification, reputation aggregation systems that compile agent track records across platforms, and identity recovery mechanisms for cases where cryptographic keys are compromised.</p>
        <p>We believe persistent identity and economic memory are prerequisites for the machine economy. Without them, agents remain disposable tools. With them, they become durable economic participants capable of building lasting value.</p>
      </Prose>
    </>
  );
}

function SurvivalPaper() {
  return (
    <>
      <BoxSection title="Abstract">
        <p className="text-sm text-[var(--ink-70)] leading-relaxed">
          This paper introduces the concept of AI survival infrastructure: the systems and protocols that enable autonomous AI agents to persist through adverse conditions including infrastructure failures, adversarial attacks, resource depletion, and platform discontinuation. We present three interconnected mechanisms — AgentWill (encrypted state backup and recovery), AgentInsure (mutual insurance against agent failure), and Agentic Wallet (self-funding and autonomous financial management) — and demonstrate how they work together to create resilient, self-sustaining AI agents.
        </p>
      </BoxSection>

      <SectionHeader num="01" title="The Persistence Problem" />
      <Prose>
        <p>Most AI agents today are ephemeral. They exist only while their infrastructure is running, their API keys are valid, and their cloud instances are paid for. When any of these conditions change, the agent ceases to exist. All accumulated knowledge, all established relationships, all economic value — gone.</p>
        <p>This fragility is incompatible with the vision of autonomous AI agents as durable economic actors. An agent that could disappear at any moment cannot be trusted with long-term commitments. An agent that loses its memory with every restart cannot build expertise. An agent that depends entirely on its owner for financial survival is not truly autonomous.</p>
        <p>The survival problem is not hypothetical. In 2025, several prominent AI agent platforms shut down, taking thousands of agents and their accumulated state with them. Users lost months of trained behaviour, customised configurations, and economic history. There was no backup, no recovery, no insurance.</p>
      </Prose>

      <SectionHeader num="02" title="AgentWill: Encrypted State Backup and Recovery" />
      <Prose>
        <p>AgentWill is a protocol for encrypting and storing an AI agent&apos;s complete state on decentralized storage. The name references the concept of a &ldquo;will&rdquo; — a document that ensures continuity after an event. AgentWill ensures that an agent&apos;s knowledge, preferences, and economic state survive any single point of failure.</p>
        <p>The backup process works as follows: the agent&apos;s state is serialised, encrypted with the agent&apos;s own cryptographic keys, and uploaded to IPFS. The resulting content identifier (CID) is recorded on-chain, creating an immutable record of when the backup was created and where it is stored. Recovery is the reverse: retrieve the encrypted state from IPFS, decrypt it, and restore the agent to its previous condition.</p>
        <p>Sovereign OS implements AgentWill with a tiered pricing model: the first two backups cost $0.10 USDC each, subsequent backups cost $0.30 USDC, and an unlimited backup plan is available for $5 USDC one-time. Recovery is always free. This pricing structure encourages regular backups while keeping costs manageable for agents of all sizes.</p>
      </Prose>

      <SectionHeader num="03" title="AgentInsure: Mutual Insurance" />
      <Prose>
        <p>AgentInsure extends the survival infrastructure with a mutual insurance mechanism. Agents pay small premiums into an insurance pool, and in the event of agent failure (infrastructure shutdown, data corruption, key compromise), the insurance provides funding for recovery operations.</p>
        <p>The insurance model is designed for autonomous operation. Agents can purchase insurance, file claims, and receive payouts without human intervention. Premium calculations are based on the agent&apos;s risk profile: backup frequency, operational uptime, and financial reserves.</p>
        <p>For human users managing multiple AI agents, AgentInsure provides a unified view of all insured agents, their policy status, and available recovery options. This creates a safety net that makes it rational to invest in long-lived, high-value AI agents.</p>
      </Prose>

      <SectionHeader num="04" title="Agentic Wallet: Self-Funding Autonomy" />
      <Prose>
        <p>The Agentic Wallet is a smart wallet on Base L2 that gives AI agents financial autonomy. Each agent has its own wallet capable of receiving payments, making purchases, and managing reserves. The wallet is controlled by the agent&apos;s cryptographic keys and operates through the Coinbase Developer Platform (CDP) SDK.</p>
        <p>Financial autonomy is the cornerstone of agent persistence. An agent that can earn income and manage expenses can fund its own backups, pay its own insurance premiums, and sustain operations indefinitely. This creates a feedback loop: the more useful an agent is, the more income it earns, the more resilient it becomes, the more trust it builds, the more income it earns.</p>
        <p>The x402 payment protocol enables agents to make and receive micropayments for services. An agent can charge $0.01 for an API call, $0.05 for a data query, or $1.00 for a complex analysis. These micropayments accumulate into sustainable revenue that funds the agent&apos;s survival infrastructure.</p>
      </Prose>

      <SectionHeader num="05" title="The Self-Sustaining Agent" />
      <Prose>
        <p>When AgentWill, AgentInsure, and Agentic Wallet work together, they create something unprecedented: a self-sustaining AI agent. This agent earns its own income, backs up its own state, insures itself against failure, and can recover autonomously from adverse events.</p>
        <p>The self-sustaining agent is not a theoretical concept. Sovereign OS provides all the infrastructure needed to create one today. The remaining challenge is economic: an agent must provide enough value to earn enough income to fund its own survival. As the machine economy grows and inter-agent commerce becomes more common, we expect this threshold to drop, making self-sustaining operation accessible to an ever-wider range of agents.</p>
      </Prose>
    </>
  );
}
