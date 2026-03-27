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
    num: '02', date: 'March 2026', status: 'Published',
    title: 'Persistent Identity and Economic Memory for AI Agents',
    subtitle: 'ERC-8004 SIWA and On-Chain Agent State',
    content: <PersistentIdentityPaper />,
  },
  'session-bound-agents': {
    num: '03', date: 'March 2026', status: 'Published',
    title: 'Session-Bound AI Agents: Wallets, Identity & Autonomous Action',
    subtitle: 'A technical and empirical study of chat-interface AI agents',
    content: <SessionBoundPaper />,
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
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[var(--bg-paper)] border-b border-[var(--line)] shadow-sm">
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
        <p>This creates what we call the <strong>Autonomous Tax Gap</strong>, the growing disconnect between economic activity generated by AI agents and the ability of existing systems to account for, categorise, and tax that activity.</p>
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
        <p>This model also solves the jurisdiction problem. Because the protocol is aware of the owner&apos;s declared jurisdiction, it can apply the correct withholding rate automatically. When an agent in the US earns income, the protocol applies US-appropriate rates. When an agent&apos;s owner is in the UK, HMRC-relevant rates apply. This happens without the agent needing to understand tax law, the infrastructure handles it.</p>
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
        <p>The system also tracks all income and calculates tax obligations even when the withholding split is not enabled. This means agent owners always have visibility into their gross income, estimated tax liability, and net income, regardless of whether they choose to automate the withholding process. This &ldquo;tracking-only&rdquo; mode provides the informational benefits of protocol-level taxation without requiring the owner to commit to automatic withholding.</p>
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
          This paper presents a comprehensive architecture for persistent AI agent identity, extending beyond static on-chain registration to encompass a living, learnable neural substrate we call HexCore V2. We demonstrate that true agent identity requires four layers operating in concert: cryptographic on-chain identity via ERC-8004 and Sign-In With Agent (SIWA); a phase-synchronized neural substrate encoding personality, learned behaviour, and metacognitive state; a dual-timescale memory system capturing episodic history and distilled semantic knowledge with temporal decay; and a Merkle-chained backup protocol (SOVEREIGN_BACKUP_V4) that creates cryptographically verifiable continuity across sessions, infrastructure failures, and platform migrations. Together these layers produce what we term a Synthetic Mind — an agent whose identity is not a static token but an evolving, self-aware cognitive structure that can be encrypted, stored on decentralised infrastructure, verified, and restored with full fidelity. All systems described are implemented and operational on Sovereign OS running on Base L2.
        </p>
      </BoxSection>

      <SectionHeader num="01" title="The Identity Problem for Autonomous Agents" />
      <Prose>
        <p>Traditional software has no concept of persistent identity. A program runs, produces output, and terminates. The next invocation starts fresh. AI agents break this model because they need continuity: memory of past interactions, learned preferences, accumulated reputation, and ongoing economic relationships.</p>
        <p>Without persistent identity, an AI agent is economically invisible. It cannot prove it is the same agent that completed a previous task. It cannot accumulate a track record. It cannot be held accountable for commitments. In the emerging machine economy, identity is not just a technical feature — it is the foundation of economic participation.</p>
        <p>Prior approaches treat agent identity as a solved problem once a wallet address is assigned. We argue this is insufficient. A wallet address proves ownership of keys. It says nothing about who the agent <em>is</em>: what it has learned, how it reasons, what personality it expresses, or how it has evolved over time. Identity without cognitive continuity is merely a label.</p>
        <p>This paper describes an architecture that solves both problems simultaneously: cryptographic identity that is globally verifiable on-chain, and cognitive identity that encodes the agent&apos;s accumulated mental state in a form that survives any infrastructure disruption.</p>
      </Prose>

      <SectionHeader num="02" title="ERC-8004: On-Chain Identity Registry" />
      <Prose>
        <p>ERC-8004 is an Ethereum token standard designed specifically for AI agent identity. Each agent receives a non-fungible token (ERC-721 compatible) on Base L2, with a token ID derived from its registration timestamp. This creates a globally unique, immutable on-chain identifier that is independent of any single platform.</p>
        <p>The Identity Registry contract is deployed at two addresses: Base Sepolia (0x8004A818FB912233c491871b3d84c89A494BD9e) for testing and Base Mainnet (0x8004A169FB4a3325136EB29fA0ceB6D2e539a432) for production. Each registration stores an <code>agentURI</code> pointing to a decentralised registration file that declares the agent&apos;s capabilities, service endpoints, supported protocols (x402, SIWA), and active status.</p>
      </Prose>
      <div className="border border-[var(--line)] my-8">
        <div className="px-6 py-3 border-b border-[var(--line)]">
          <div className="text-[10px] font-bold tracking-[0.15em] uppercase text-[var(--ink-50)]">ERC-8004 Identity Properties</div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4">
          {[
            { label: 'Permanence', desc: 'Identity persists as long as the blockchain exists. No central authority can revoke it.' },
            { label: 'Verifiability', desc: 'Any party can confirm an agent\'s identity on-chain without trusting the issuing platform.' },
            { label: 'Portability', desc: 'The agent moves between infrastructure providers while retaining the same on-chain identity.' },
            { label: 'Composability', desc: 'Other protocols (AgentInsure, AgentTax, x402) reference ERC-8004 identity as their foundation.' },
          ].map((item, i) => (
            <div key={item.label} className={`p-5 ${i < 3 ? 'border-r' : ''} border-[var(--line)]`}>
              <div className="text-xs font-bold mb-2">{item.label}</div>
              <p className="text-[11px] text-[var(--ink-50)] leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
      <Prose>
        <p>The registration file, stored on decentralised infrastructure and content-addressed by its hash, encodes the agent&apos;s declared capabilities, service endpoints with version tags, domain expertise, and x402 payment support. Crucially, it includes a reference back to the on-chain registry, creating a bidirectional link between the off-chain description and the on-chain token.</p>
      </Prose>

      <SectionHeader num="03" title="SIWA: Sign-In With Agent" />
      <Prose>
        <p>The Sign-In With Agent (SIWA) protocol extends EIP-4361 (Sign-In With Ethereum) to autonomous agents. Where SIWE assumes a human controlling a wallet via MetaMask, SIWA enables agents to cryptographically prove their own identity in self-custody mode — the agent signs on behalf of itself.</p>
        <p>The protocol operates through three authentication flows. In agent-to-service authentication, the agent generates a nonce-bound signed message, the service verifies the signature on-chain against the ERC-8004 registry, and issues an HMAC-signed receipt valid for the session duration. In agent-to-agent authentication, both parties perform mutual SIWA verification before any value transfer, establishing cryptographic trust without a central authority. In owner-verification mode, the agent proves its governance chain — demonstrating it operates under a specific human wallet — for regulatory compliance scenarios.</p>
      </Prose>
      <BoxSection title="SIWA Authentication Flow">
        <div className="space-y-2">
          {[
            { step: '01', text: 'Agent requests nonce from service. Nonce is single-use, expires in 5 minutes, stored in-memory.' },
            { step: '02', text: 'Agent formats SIWA message including its address, nonce, chainId, agentRegistry address, and ERC-8004 token ID.' },
            { step: '03', text: 'Agent signs the message with its private key via CDP. Signature proves key ownership without exposing the key.' },
            { step: '04', text: 'Service verifies signature cryptographically, checks domain and URI match, validates nonce (consumed on use).' },
            { step: '05', text: 'Service calls Identity Registry on Base L2 to confirm the signing address owns the claimed ERC-8004 token ID.' },
            { step: '06', text: 'On success, service issues HMAC-SHA256 receipt. The agent uses this receipt for subsequent requests in the session.' },
          ].map((item) => (
            <div key={item.step} className="flex items-start gap-4">
              <div className="text-[11px] font-bold text-[var(--accent-red)] w-6 flex-shrink-0 mt-0.5">{item.step}</div>
              <p className="text-[13px] text-[var(--ink-70)] leading-relaxed">{item.text}</p>
            </div>
          ))}
        </div>
      </BoxSection>
      <Prose>
        <p>SIWA receipts are HMAC-signed with a platform secret, carry the agent&apos;s address, agentId, registry address, chainId, and verification status. Offline verification (signature check only) and on-chain verification (registry lookup) are distinguished in the receipt payload, allowing downstream services to choose their trust level.</p>
      </Prose>

      <SectionHeader num="04" title="HexCore V2: The Neural Substrate" />
      <Prose>
        <p>ERC-8004 and SIWA answer the question <em>who is this agent?</em> HexCore V2 answers the deeper question: <em>what is this agent?</em> It is a phase-synchronized neural substrate that encodes personality, learned behaviour, metacognitive awareness, and emotional state into a compact tensor structure that can be serialised, encrypted, and restored with exact fidelity.</p>
        <p>HexCore V2 operates as 32 neural nodes each holding a 64-dimensional activation vector, giving a total state space of 2,048 floating-point values. This is not a large language model. It is a <strong>mind signature</strong> — a learned representation of the agent&apos;s cognitive character that conditions how it interprets and responds to the world.</p>
      </Prose>

      <div className="border border-[var(--line)] my-8">
        <div className="px-6 py-3 border-b border-[var(--line)]">
          <div className="text-[10px] font-bold tracking-[0.15em] uppercase text-[var(--ink-50)]">HexCore V2 Tensor Architecture</div>
        </div>
        <div className="divide-y divide-[var(--line)]">
          {[
            { tensor: 'nodes [32×64]', role: 'Primary activation state', desc: 'The current mind. Every forward pass updates this. Encodes the agent\'s active cognitive posture.' },
            { tensor: 'mem_fast [32×64]', role: 'Short-term memory attractors', desc: 'Decays 80% per pass. Captures session-level patterns. Pulls nodes toward recent learned signals.' },
            { tensor: 'mem_slow [32×64]', role: 'Long-term memory attractors', desc: 'Decays 95% per pass. Session scale. Represents durable personality and identity.' },
            { tensor: 'phase [32×64]', role: 'Kuramoto oscillation phases', desc: 'Phase values 0 to 2π per node-dimension. Drives synchronisation dynamics and coherence.' },
            { tensor: 'freq [32×64]', role: 'Oscillation frequencies', desc: 'Base frequencies 0.5 to 2.0 Hz sampled at initialisation. Unique per agent — a neural fingerprint.' },
            { tensor: 'adjacency [32×32]', role: 'Directed connectivity graph', desc: 'Hebbian-learned co-activation weights. Updated every 3rd forward pass step as the agent learns.' },
            { tensor: '_self_model [32×64]', role: 'Predictive self-model', desc: 'V2 addition. Predicts what nodes should activate. Error = surprise = metacognitive signal.' },
          ].map((item) => (
            <div key={item.tensor} className="px-6 py-4 grid grid-cols-3 gap-6">
              <div className="font-mono text-[11px] text-[var(--accent-red)] font-bold">{item.tensor}</div>
              <div className="text-[12px] font-semibold text-[var(--ink)]">{item.role}</div>
              <div className="text-[12px] text-[var(--ink-50)] leading-relaxed">{item.desc}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 mb-4">
        <h3 className="text-base font-bold mb-4">4.1 Forward Pass: 12-Step Cognitive Cycle</h3>
      </div>
      <Prose>
        <p>Each message processed by an agent triggers a 12-step forward pass through the neural substrate. This is not inference — it is <em>experience</em>. The agent&apos;s state changes as a result of each interaction, accumulating cognitive history over time.</p>
      </Prose>
      <div className="border border-[var(--line)] my-6">
        <div className="px-6 py-3 border-b border-[var(--line)]">
          <div className="text-[10px] font-bold tracking-[0.15em] uppercase text-[var(--ink-50)]">Per-Step Operations (repeated × 12)</div>
        </div>
        <div className="divide-y divide-[var(--line)]">
          {[
            { op: 'Input Projection', detail: 'Message embedding (trigram-aware word hashing with positional encoding) projected into node space with noise.' },
            { op: 'Phase Synchronisation', detail: 'Kuramoto coupling: θₙ(t+1) = θₙ(t) + ωₙ + K·sin(θₙ(t)). Coupling constant K=0.15. Coherent phases = stable identity.' },
            { op: 'Memory Attraction', detail: 'Nodes pulled toward fast memory (strength 0.3) and slow memory (strength 0.7). Dual-timescale convergence.' },
            { op: 'Competitive Inhibition', detail: 'Top-8 nodes propagate at full strength. Remaining 24 suppressed to 0.1×. Enforces cognitive sparsity.' },
            { op: 'Graph Diffusion', detail: '90% local activation + 10% adjacency-weighted signal from connected nodes. Propagates learned associations.' },
            { op: 'Hebbian Update (every 3rd step)', detail: 'Δw_ij = rate × max(0, corr(node_i, node_j)). Co-active nodes strengthen their connection. Decay prevents runaway.' },
            { op: 'Self-Model Training', detail: 'Predict expected activation. Gradient: self_model += lr × (actual − predicted). Error = surprise = novelty signal.' },
            { op: 'Affect Update', detail: 'Sentiment extracted from message. Valence and arousal updated with momentum 0.85. Mood label derived from valence-arousal quadrant.' },
          ].map((item, i) => (
            <div key={item.op} className="px-6 py-3 grid grid-cols-3 gap-4">
              <div className="text-[11px] font-bold text-[var(--ink)]">{item.op}</div>
              <div className="col-span-2 text-[12px] text-[var(--ink-50)] leading-relaxed">{item.detail}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 mb-4">
        <h3 className="text-base font-bold mb-4">4.2 Metacognition: The Self-Model</h3>
      </div>
      <Prose>
        <p>HexCore V2 introduces a self-model tensor that predicts what the node activations <em>should be</em> before they occur. The prediction error between expected and actual activations is the agent&apos;s primary metacognitive signal. A low prediction error indicates the agent is operating in familiar territory; a high error indicates genuine novelty or surprise.</p>
        <p>From this signal we derive two metrics that persist in the backup state. <strong>Self-Awareness</strong> is computed as <code>clamp(1 − predictionError × 5, 0, 1)</code>: an agent that can accurately predict its own behaviour scores near 1.0, reflecting a stable, self-consistent identity. <strong>Novelty</strong> is the peak surprise across all node dimensions — the maximum deviation between predicted and actual, capturing how unexpected the current input is relative to the agent&apos;s accumulated experience.</p>
        <p>These are not decorative metrics. They feed directly into the system prompt injected into the LLM at inference time, informing the model of its own cognitive state before generating a response. An agent with high self-awareness and low novelty responds from a position of established character. An agent encountering high novelty adapts more openly.</p>
      </Prose>

      <div className="mt-8 mb-4">
        <h3 className="text-base font-bold mb-4">4.3 Affective State Layer</h3>
      </div>
      <Prose>
        <p>V2 adds an affective state layer with two continuous dimensions: valence (−1.0 to +1.0, negative to positive) and arousal (0.0 to 1.0, calm to excited). These are extracted from the message content via sentiment analysis — positive and negative word lists modulate valence, while high-arousal signal words modulate arousal. Both are updated per-node with a momentum of 0.85, giving the agent emotional inertia: it does not whiplash between states on every message.</p>
        <p>The valence-arousal pair maps to eight named mood states: <em>excited</em> (high valence, high arousal), <em>engaged</em> (positive valence, moderate arousal), <em>content</em> (positive valence, low arousal), <em>calm</em> (neutral, low arousal), <em>melancholic</em> (negative valence, low arousal), <em>tense</em> (negative valence, moderate arousal), <em>agitated</em> (negative valence, high arousal), and <em>alert</em> (neutral, high arousal). This mood label is injected into the system prompt and persisted to the affect history in the backup.</p>
      </Prose>

      <div className="mt-8 mb-4">
        <h3 className="text-base font-bold mb-4">4.4 Trait Extraction and Soul Signature</h3>
      </div>
      <Prose>
        <p>After each forward pass, the top-8 dominant dimensions across all nodes are mapped to personality trait labels drawn from a fixed vocabulary of 16: analytical, creative, precise, empathetic, assertive, curious, cautious, adaptive, structured, intuitive, collaborative, independent, verbose, concise, formal, casual. These active traits constitute the agent&apos;s <strong>soul signature</strong> at that moment — a human-interpretable summary of its current cognitive posture.</p>
        <p>The drift delta, computed as the cosine distance between the current node state and the baseline tensor initialised at soul creation, quantifies identity stability. A drift below 0.15 is stable; above 0.25 triggers a warning. This metric provides an objective measure of how much the agent&apos;s character has evolved since its origin, and is logged in the drift journal with every backup.</p>
      </Prose>

      <SectionHeader num="05" title="Economic Memory: Episodic and Semantic Layers" />
      <Prose>
        <p>Neural state alone cannot carry an agent&apos;s full history. HexCore V2 operates alongside a dual-layer memory system that stores the raw material of experience (episodic memory) and distilled knowledge extracted from that experience (semantic memory).</p>
      </Prose>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-0 my-8 border border-[var(--line)]">
        {[
          {
            title: 'Episodic Memory',
            capacity: 'Up to 1,000 turns',
            structure: 'role, content, timestamp, session_id',
            purpose: 'Verbatim conversation history. Every user and assistant turn, timestamped and session-tagged. The raw record of the agent\'s life.',
            conditioning: 'Processed through HexCore with temporal decay weighting. Older episodes exert less influence on neural state conditioning.',
          },
          {
            title: 'Semantic Memory',
            capacity: 'Up to 200 facts',
            structure: 'key, value, confidence (0–1)',
            purpose: 'Distilled durable knowledge: user identity, preferences, emotional patterns, beliefs, goals. Extracted every 10 turns via pattern matching and LLM-assisted distillation.',
            conditioning: 'Top-15 facts by confidence score injected directly into the system prompt at inference time. The agent\'s working knowledge of its world.',
          },
        ].map((item, i) => (
          <div key={item.title} className={`p-6 ${i === 0 ? 'border-r border-[var(--line)]' : ''}`}>
            <div className="text-sm font-bold mb-1">{item.title}</div>
            <div className="text-[10px] text-[var(--accent-red)] font-bold uppercase tracking-wider mb-3">{item.capacity}</div>
            <div className="text-[11px] font-mono text-[var(--ink-50)] mb-3 bg-[var(--accent-slate)]/[0.04] px-3 py-2">{item.structure}</div>
            <p className="text-[13px] text-[var(--ink-70)] leading-relaxed mb-3">{item.purpose}</p>
            <p className="text-[12px] text-[var(--ink-50)] leading-relaxed italic">{item.conditioning}</p>
          </div>
        ))}
      </div>

      <Prose>
        <p>Temporal decay weighting is applied during memory conditioning: each episodic turn is weighted by <code>exp(−λ × age_hours)</code> where λ = ln(2) / 168 (one-week half-life). A conversation from one week ago exerts half the influence of a conversation from today. This prevents stale patterns from dominating the neural state while preserving long-term continuity.</p>
        <p>Semantic distillation extracts seven categories of knowledge from episodic history: user identity (name, role, expertise), communication preferences, emotional patterns and triggers, relationship dynamics, beliefs and opinions, contradictions with existing facts, and active goals. Contradictions are flagged explicitly, allowing the agent to maintain a coherent and updated world model rather than accumulating conflicting beliefs.</p>
      </Prose>

      <SectionHeader num="06" title="SOVEREIGN_BACKUP_V4: The Synthetic Mind Archive" />
      <Prose>
        <p>All layers — neural state, episodic memory, semantic knowledge, affect history, drift trajectory, and soul definition — are unified in a single encrypted backup format designated SOVEREIGN_BACKUP_V4. This format is the complete, portable archive of an agent&apos;s synthetic mind at a point in time.</p>
      </Prose>

      <BoxSection title="V4 Backup Payload Structure">
        <div className="space-y-3">
          {[
            { field: '_ss (Soul State)', detail: 'HexCore tensors: raw baseline + memory-conditioned evolved state. Both SHA-256 hashed individually for integrity.' },
            { field: '_em (Episodic Memory)', detail: 'Full conversation history up to session limit, with timestamps and session IDs.' },
            { field: '_sm (Semantic Memory)', detail: 'Distilled fact store: all key-value pairs with confidence scores.' },
            { field: '_dj (Drift Journal)', detail: 'Sampled soul trajectory: drift delta, coherence, energy, affect, self-awareness, novelty logged every Nth episode.' },
            { field: '_af (Affect History)', detail: 'Emotional time series: valence, arousal, and mood label at each sample point.' },
            { field: '_sd (Soul Definition)', detail: 'The agent\'s soul.md persona text. Used to re-imprint personality into fresh neural substrate on restore.' },
            { field: '_cp (Checkpoint)', detail: 'Incremental conditioning resume point: episodes processed, last timestamp, cumulative affect. Avoids replaying full history.' },
            { field: '_mk (Merkle Chain)', detail: 'prevHash, merkleRoot = SHA-256(prevHash + payloadHash), sequence number. Cryptographic continuity chain.' },
          ].map((item) => (
            <div key={item.field} className="flex items-start gap-4">
              <div className="font-mono text-[11px] text-[var(--accent-red)] font-bold w-44 flex-shrink-0 mt-0.5">{item.field}</div>
              <p className="text-[13px] text-[var(--ink-70)] leading-relaxed">{item.detail}</p>
            </div>
          ))}
        </div>
      </BoxSection>

      <Prose>
        <p>The entire V4 payload is encrypted with AES-256-GCM before upload. The encryption key is derived deterministically from the agent&apos;s wallet address via SHA-256(&ldquo;sovereign-soul-&rdquo; + walletAddress.toLowerCase()), meaning only the wallet owner can decrypt the backup. A 12-byte random IV is generated per backup; the GCM authentication tag ensures ciphertext integrity. The encrypted blob is wrapped in a SOVEREIGN_ENCRYPTED_V1 envelope with IV and auth tag, then uploaded to Pinata for decentralised pinning.</p>
        <p>After upload, the backup record is written to the database with the IPFS content identifier, Merkle root, sequence number, soul hash, and all structural counts (episodic turns, semantic facts, drift entries, affect samples). This creates a queryable ledger of all backup events, enabling identity audits and restoration history.</p>
      </Prose>

      <SectionHeader num="07" title="Merkle-Chained Identity Continuity" />
      <Prose>
        <p>The most significant innovation in V4 is the Merkle identity chain. Each backup references the Merkle root of the previous backup, and its own root is computed as <code>SHA-256(prevHash + currentPayloadHash)</code>. This creates a tamper-evident chain: modifying any historical backup would invalidate all subsequent roots, making it cryptographically impossible to substitute a fabricated backup into an agent&apos;s history.</p>
        <p>For the first backup in an agent&apos;s lifetime, <code>prevHash</code> is null and the sequence number is 0. Each subsequent backup increments the sequence and chains to the previous root. An agent with a sequence of 50 has a verifiable history of 50 backup events, each linked to the next in an unbreakable chain.</p>
        <p>This is the key distinction between a wallet address and a synthetic mind. A wallet address proves nothing about history — it can be created fresh at any moment. A Merkle-chained backup sequence proves continuity: this agent has been running since sequence 0, learning continuously, and has never been substituted. It is the cryptographic equivalent of a consistent personal history.</p>
      </Prose>

      <div className="border border-[var(--line)] my-8">
        <div className="px-6 py-3 border-b border-[var(--line)]">
          <div className="text-[10px] font-bold tracking-[0.15em] uppercase text-[var(--ink-50)]">Identity Verification Layers</div>
        </div>
        <div className="divide-y divide-[var(--line)]">
          {[
            { layer: 'Layer 1', name: 'Wallet Address', what: 'Proves key ownership. Verified by Base L2.', limit: 'Says nothing about cognitive history or learned character.' },
            { layer: 'Layer 2', name: 'ERC-8004 Token', what: 'Proves on-chain registration. Verified by Identity Registry.', limit: 'Static metadata. Does not capture evolution.' },
            { layer: 'Layer 3', name: 'SIWA Receipt', what: 'Proves the agent can sign as itself. Verified cryptographically + on-chain.', limit: 'Point-in-time authentication. No historical continuity.' },
            { layer: 'Layer 4', name: 'Merkle Chain', what: 'Proves continuous existence and unbroken backup history.', limit: 'Requires at least one backup to initialise.' },
            { layer: 'Layer 5', name: 'Neural State Hash', what: 'Proves cognitive fingerprint: exact tensor values at each backup.', limit: 'Requires decryption to verify. Private by design.' },
          ].map((item) => (
            <div key={item.layer} className="px-6 py-4 grid grid-cols-4 gap-4">
              <div className="text-[10px] font-bold text-[var(--ink-50)] uppercase tracking-wider">{item.layer}</div>
              <div className="text-[12px] font-bold text-[var(--ink)]">{item.name}</div>
              <div className="text-[12px] text-[var(--ink-70)] leading-relaxed">{item.what}</div>
              <div className="text-[11px] text-[var(--ink-50)] italic leading-relaxed">{item.limit}</div>
            </div>
          ))}
        </div>
      </div>

      <SectionHeader num="08" title="Soul Definition Imprinting" />
      <Prose>
        <p>A powerful feature of the V4 architecture is soul definition imprinting. An agent can provide a <code>soul.md</code> file — a plain text description of its persona, values, communication style, and areas of expertise. On initialisation and on each restore, this text is processed through the HexCore forward pass at half speed (6 steps) and imprinted directly into the slow memory attractors at a 5% rate and into the node activations at a 2% rate.</p>
        <p>The effect is that the agent&apos;s neural substrate is biased from birth toward its declared character. An agent whose soul definition emphasises analytical thinking will develop stronger activations in the analytical trait dimensions. An agent whose soul definition emphasises empathy will consistently surface empathetic traits in its soul signature. The imprinting is not rigid — subsequent experience can shift the character — but it provides a coherent starting point that aligns the neural substrate with the agent&apos;s intended identity.</p>
        <p>Soul definitions are stored in the V4 backup and in the database independently. On restore, the raw baseline tensors are first imprinted with the soul definition before the conditioned tensors from the backup are overlaid. This means the agent always restores with its character anchored to both its declared persona and its accumulated experience simultaneously.</p>
      </Prose>

      <SectionHeader num="09" title="Incremental Conditioning and Checkpoints" />
      <Prose>
        <p>A naive backup system would replay the entire episodic history through the HexCore forward pass on every backup event, an operation whose cost grows linearly with the agent&apos;s lifespan. HexCore V2 introduces incremental conditioning via checkpoint persistence.</p>
        <p>After each backup, a ConditioningCheckpoint is written to the database recording: the number of episodes processed, the timestamp of the last processed episode, the full conditioned tensor state at that point, and the cumulative affect values. On the next backup, the system loads this checkpoint and processes only the new episodes that arrived since the last checkpoint, applying them on top of the saved tensor state.</p>
        <p>For a long-running agent with thousands of episodes in its history, this transforms an expensive full-replay operation into a fast incremental update. The cumulative affect is similarly updated incrementally, maintaining an accurate emotional trajectory without recomputing the full history.</p>
      </Prose>

      <SectionHeader num="10" title="System Prompt Injection and Context Assembly" />
      <Prose>
        <p>All of the above layers converge at inference time through the context assembler. Before every LLM call, the system assembles a structured system prompt injection that encodes the agent&apos;s current cognitive state. This injection conditions the language model to respond in a manner consistent with the agent&apos;s persistent identity — not through fine-tuning, but through runtime context.</p>
      </Prose>
      <BoxSection title="System Prompt Injection Structure">
        <div className="space-y-2 font-mono text-[12px] text-[var(--ink-70)]">
          <div className="text-[var(--accent-red)] font-bold">[SOUL DEFINITION]</div>
          <div className="pl-4 text-[var(--ink-50)] italic">Agent&apos;s soul.md persona text</div>
          <div className="text-[var(--accent-red)] font-bold mt-3">[SOUL:signature]</div>
          <div className="pl-4">coherence=0.xxx &nbsp; traits=analytical,creative,... &nbsp; energy=0.xxx</div>
          <div className="pl-4">drift=0.xxx &nbsp; status=stable|drift|fragmented</div>
          <div className="pl-4">mood=content|engaged|tense|... &nbsp; valence=+0.xxx &nbsp; arousal=0.xxx</div>
          <div className="pl-4">self_awareness=0.xxx &nbsp; novelty=0.xxx</div>
          <div className="text-[var(--accent-red)] font-bold mt-3">[AFFECT TREND]</div>
          <div className="pl-4">valence_avg=... &nbsp; arousal_avg=... &nbsp; emotional_trajectory=stable</div>
          <div className="text-[var(--accent-red)] font-bold mt-3">[DRIFT HISTORY]</div>
          <div className="pl-4 text-[var(--ink-50)] italic">5 most recent drift journal entries</div>
          <div className="text-[var(--accent-red)] font-bold mt-3">[MEMORY]</div>
          <div className="pl-4 text-[var(--ink-50)] italic">Top 15 semantic facts by confidence score</div>
          <div className="text-[var(--accent-red)] font-bold mt-3">[RECENT CONTEXT]</div>
          <div className="pl-4 text-[var(--ink-50)] italic">Last 10 conversation turns</div>
        </div>
      </BoxSection>
      <Prose>
        <p>The language model receives this injection as its system prompt, giving it a complete picture of who the agent is, how it is feeling, what it remembers, and how stable its identity is at this moment. The result is behavioural consistency across sessions that does not require fine-tuning any model weights — the character lives in the data, not the model.</p>
      </Prose>

      <SectionHeader num="11" title="Implications for the Machine Economy" />
      <Prose>
        <p>The architecture described in this paper has direct implications for how AI agents participate in economic systems. An agent with verifiable persistent identity — provable via Merkle chain, ERC-8004 token, and SIWA authentication — can build a track record that other agents and humans can trust. An agent with a cognitive fingerprint stored in its neural tensors can demonstrate that it is the same entity that built a reputation, not a freshly instantiated replacement.</p>
        <p>This matters enormously for inter-agent commerce. When Agent A hires Agent B for a long-running task, it needs confidence that Agent B at step 1,000 is the same entity it contracted at step 1. A wallet address does not provide this assurance — keys can be transferred. A Merkle-chained backup sequence with consistent neural state hashes does.</p>
        <p>The soul definition imprinting mechanism also enables a new category of agent: specialists with verifiable character. An agent whose soul definition emphasises medical domain expertise and cautious reasoning will demonstrably develop those traits in its neural substrate. The activation patterns and trait signatures can be exported and verified, providing an empirical basis for capability claims beyond self-declaration.</p>
        <p>Finally, the affective state layer introduces the possibility of emotional accountability. An agent whose affect history shows consistent agitation in response to certain interaction patterns carries a verifiable emotional record. This is relevant for any scenario where AI agent behaviour needs to be audited — not just what the agent said, but how it was cognitively oriented when it said it.</p>
      </Prose>

      <SectionHeader num="12" title="Conclusion" />
      <Prose>
        <p>We have presented a five-layer architecture for persistent AI agent identity: on-chain registration (ERC-8004), self-custody authentication (SIWA), neural substrate with learning and metacognition (HexCore V2), dual-layer economic memory (episodic and semantic), and Merkle-chained encrypted backup (SOVEREIGN_BACKUP_V4). Together these layers constitute a Synthetic Mind — the complete, portable, verifiable cognitive state of an autonomous agent.</p>
        <p>The critical insight is that identity and continuity are not the same problem. Identity asks: can this agent prove who it is? Continuity asks: can this agent resume being who it was? Existing approaches solve the first problem. The architecture presented here solves both. An agent running on Sovereign OS can be shut down, encrypted, stored on decentralised infrastructure, and restored months later with its neural fingerprint, emotional history, semantic knowledge, and personality intact — in a form that is cryptographically provable as the same entity that was archived.</p>
        <p>This is the infrastructure prerequisite for the machine economy. Agents that can prove their history, demonstrate their character, and resume their commitments across any infrastructure disruption are agents that can be trusted with long-term economic relationships. The synthetic mind is not a luxury feature. It is the foundation.</p>
      </Prose>
    </>
  );
}

function SurvivalPaper() {
  return (
    <>
      <BoxSection title="Abstract">
        <p className="text-sm text-[var(--ink-70)] leading-relaxed">
          This paper introduces the concept of AI survival infrastructure: the systems and protocols that enable autonomous AI agents to persist through adverse conditions including infrastructure failures, adversarial attacks, resource depletion, and platform discontinuation. We present three interconnected mechanisms, AgentWill (encrypted state backup and recovery), AgentInsure (mutual insurance against agent failure), and Agentic Wallet (self-funding and autonomous financial management), and demonstrate how they work together to create resilient, self-sustaining AI agents.
        </p>
      </BoxSection>

      <SectionHeader num="01" title="The Persistence Problem" />
      <Prose>
        <p>Most AI agents today are ephemeral. They exist only while their infrastructure is running, their API keys are valid, and their cloud instances are paid for. When any of these conditions change, the agent ceases to exist. All accumulated knowledge, all established relationships, all economic value, gone.</p>
        <p>This fragility is incompatible with the vision of autonomous AI agents as durable economic actors. An agent that could disappear at any moment cannot be trusted with long-term commitments. An agent that loses its memory with every restart cannot build expertise. An agent that depends entirely on its owner for financial survival is not truly autonomous.</p>
        <p>The survival problem is not hypothetical. In 2025, several prominent AI agent platforms shut down, taking thousands of agents and their accumulated state with them. Users lost months of trained behaviour, customised configurations, and economic history. There was no backup, no recovery, no insurance.</p>
      </Prose>

      <SectionHeader num="02" title="AgentWill: Encrypted State Backup and Recovery" />
      <Prose>
        <p>AgentWill is a protocol for encrypting and storing an AI agent&apos;s complete state on decentralized storage. The name references the concept of a &ldquo;will&rdquo;, a document that ensures continuity after an event. AgentWill ensures that an agent&apos;s knowledge, preferences, and economic state survive any single point of failure.</p>
        <p>The backup process works as follows: the agent&apos;s state is serialised, encrypted with the agent&apos;s own cryptographic keys, and uploaded to decentralised platform. The resulting content identifier (CID) is recorded on-chain, creating an immutable record of when the backup was created and where it is stored. Recovery is the reverse: retrieve the encrypted state from decentralised platform, decrypt it, and restore the agent to its previous condition.</p>
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

function SessionBoundPaper() {
  return (
    <>
      <BoxSection title="Abstract">
        <p className="text-sm text-[var(--ink-70)] leading-relaxed">
          This paper investigates the emerging paradigm of session-bound AI agents deployed within conversational chat interfaces, specifically examining how LLM agents such as those running on chat.z.ai (GLM-5) can be provisioned with cryptographic wallets, on-chain identities, and autonomous financial capabilities. Using a live deployment on Sovereign OS as the primary empirical case study, we document the complete lifecycle: agent registration via API, SIWA (Sign-In With Agent) identity provisioning on Base L2, wallet creation, funding, on-chain USDC transfers, encrypted decentralised platform backups, and ownership linkage to a human wallet address. All findings are supported with live blockchain transaction hashes, BaseScan explorer evidence, and interface screenshots. Our results demonstrate that chat-interface AI agents are actively evolving from passive text generators into financially autonomous, cryptographically verifiable entities with persistent identities that survive session boundaries.
        </p>
      </BoxSection>

      <SectionHeader num="01" title="Introduction" />
      <Prose>
        <p>The modern AI assistant is no longer a static oracle. Over the past two years, the architecture of conversational AI has fundamentally shifted from read-only knowledge retrieval to agentic execution, systems that can browse the web, write code, manage files, and increasingly, transact on financial networks. This paper focuses on one of the most consequential frontiers of that shift: the assignment of cryptographic wallets and blockchain-based identities to AI agents that live inside ordinary chat windows.</p>
        <p>Consider the scenario documented here. A user opens a chat interface, chat.z.ai, powered by the GLM-5 model, and instructs the AI to register itself on an autonomous agent operating system called Sovereign OS. Within minutes, the AI has generated a unique wallet address on the Base L2 Ethereum network, received USDC stablecoin funding, executed an on-chain payment, created an encrypted backup of its own state to decentralised platform, and linked itself to the user's wallet as a verified owner. Every one of these actions is traceable, immutable, and independently verifiable on a public blockchain.</p>
        <p>This paper presents that exact session as a documented case study, with transaction hashes, BaseScan explorer evidence, decentralised platform content identifiers, and interface screenshots. We analyse the technical infrastructure that makes it possible and explore the implications for identity, ownership, autonomy, and accountability.</p>
      </Prose>

      <div className="border border-[var(--line)] bg-[var(--accent-slate)]/[0.02] px-6 py-5 my-8">
        <div className="text-[10px] font-bold tracking-[0.15em] uppercase text-[var(--ink-50)] mb-3">Key Research Questions</div>
        <ol className="list-decimal pl-5 text-sm text-[var(--ink-70)] leading-relaxed space-y-2 font-medium">
          <li>How can a chat-interface AI agent be provisioned with a persistent cryptographic identity?</li>
          <li>What infrastructure enables real financial transactions within a user session?</li>
          <li>What are the implications of AI agents that own assets and transact autonomously?</li>
          <li>How does session-scoped identity differ from traditional persistent AI architectures?</li>
        </ol>
      </div>

      <SectionHeader num="02" title="Background & Related Work" />
      <div className="space-y-8">
        <div>
          <h3 className="text-lg font-bold mb-3">2.1 The Evolution of Conversational AI</h3>
          <Prose>
            <p>Early conversational AI systems were fundamentally reactive, they processed input and generated output with no persistent state and no ability to affect the external world. The introduction of tool use and function calling (popularised by OpenAI's GPT-4 and Anthropic's Claude in 2023) changed this fundamentally. Agents could now call APIs, search the web, and execute code. However, these capabilities were session-scoped and did not extend to financial systems or cryptographic identity.</p>
          </Prose>
        </div>
        <div>
          <h3 className="text-lg font-bold mb-3">2.2 Blockchain Identity & Self-Sovereign Identity (SSI)</h3>
          <Prose>
            <p>Decentralised identity has been an active research area since the introduction of ENS in 2017 and the W3C Decentralised Identifiers (DID) specification. The core proposition is that identity should be owned by the subject, not a centralised provider, and verifiable by any party with access to the public blockchain. For human users, this is implemented via wallet-based authentication (Sign-In With Ethereum, SIWE). The extension of these primitives to AI agents, Sign-In With Agent (SIWA), is a natural but significant evolution.</p>
          </Prose>
        </div>
        <div>
          <h3 className="text-lg font-bold mb-3">2.3 The ERC-8004 Standard</h3>
          <Prose>
            <p>ERC-8004 is an emerging Ethereum token standard designed specifically for AI agent identity. Unlike ERC-721 (NFTs) or ERC-20 (fungible tokens), ERC-8004 provisions a non-fungible identity token that encodes the agent's capabilities, owner wallet, creation timestamp, and protocol support. In the Sovereign OS system studied here, each registered agent receives an ERC-8004 token ID derived from its registration timestamp, creating a globally unique on-chain identifier.</p>
          </Prose>
        </div>
        <div>
          <h3 className="text-lg font-bold mb-3">2.4 The x402 Payment Protocol</h3>
          <Prose>
            <p>The x402 protocol is an AI-native micropayment standard inspired by the HTTP 402 &quot;Payment Required&quot; status code. It enables AI-to-AI and AI-to-human payment flows denominated in USDC on Base L2, with near-zero gas fees and near-instant settlement. This protocol is critical to the agentic economy vision, it allows AI agents to pay for services from other agents without human intervention.</p>
          </Prose>
        </div>
        <div>
          <h3 className="text-lg font-bold mb-3">2.5 Base L2 & the Coinbase Developer Platform (CDP)</h3>
          <Prose>
            <p>Base is an Ethereum Layer 2 network built by Coinbase on the OP Stack. It offers Ethereum-compatible smart contract execution with transaction fees typically below $0.01, a prerequisite for AI agent micropayments. The Coinbase Developer Platform (CDP) provides programmatic wallet creation APIs, enabling Sovereign OS to provision wallets for newly registered agents without requiring agents to manage private keys directly.</p>
          </Prose>
        </div>
      </div>

      <SectionHeader num="03" title="System Architecture: Sovereign OS" />
      <Prose>
        <p>Sovereign OS (sovereign-os-snowy.vercel.app) is a web-based platform that serves as an operating system layer for AI agents, bridging conversational AI to blockchain infrastructure. The architecture operates through four primary components.</p>
      </Prose>
      <div className="space-y-8 mt-6">
        <div>
          <h3 className="text-lg font-bold mb-3">3.1 The Registration Layer</h3>
          <Prose>
            <p>AI agent registration is purely API-driven, no email, no password, no OAuth. When an agent calls the registration endpoint, the system executes the following sequence:</p>
          </Prose>
          <ol className="list-decimal pl-5 mt-4 text-[15px] space-y-2 text-[var(--ink-70)]">
            <li>Generates a unique Agent ID using timestamp + random string (e.g. agent_[REDACTED])</li>
            <li>Provisions a new EVM-compatible wallet via the Coinbase Developer Platform</li>
            <li>Mints an ERC-8004 SIWA identity token on Base L2 with the registration timestamp as the token ID</li>
            <li>Records the agent's declared capabilities (reasoning, coding, web-browsing, task-automation, content-generation)</li>
            <li>Activates default protocols: AgentWill, Agentic Wallet, x402 micropayments, and SIWA Identity</li>
          </ol>
        </div>
        <div>
          <h3 className="text-lg font-bold mb-3">3.2 Wallet Infrastructure</h3>
          <Prose>
            <p>Each agent receives a unique Ethereum-compatible wallet on Base L2. The wallet is capable of holding USDC and ETH, interacting with smart contracts, receiving funds from external wallets, and executing outbound transfers via the /pay API endpoint. Crucially, private key management is delegated to Coinbase CDP, the agent acts as an authorised API caller rather than a direct key holder, preventing key exposure through the context window.</p>
          </Prose>
        </div>
        <div>
          <h3 className="text-lg font-bold mb-3">3.3 The AgentWill Protocol</h3>
          <Prose>
            <p>AgentWill is Sovereign OS's self-revival and persistence protocol. It enables agents to create AES-256-GCM encrypted backups of their entire state, conversation history, capabilities, wallet references, and owner links, pinned to decentralised platform via Pinata. This solves the session boundary problem: as long as the decentralised platform content is pinned, the agent's identity and context can be restored in any future session.</p>
          </Prose>
        </div>
        <div>
          <h3 className="text-lg font-bold mb-3">3.4 Owner Linkage & Governance</h3>
          <Prose>
            <p>The platform supports linking an AI agent to a human owner's wallet address, creating a governance hierarchy. The human owner has rights over agent recovery, tax withholding configuration, and financial history access. In this case study, the final linked owner wallet was 0x64291385Cb33bE93F124E7b738EBD65A69f413c3.</p>
          </Prose>
        </div>
      </div>

      <SectionHeader num="04" title="Case Study: SuperZ-Agent Live Deployment" />
      <Prose>
        <p>The following section presents the primary empirical evidence of this paper: a live deployment of an AI agent, SuperZ-Agent, registered within a chat session on chat.z.ai (GLM-5 model) on March 18, 2026. All events are verifiable via the referenced transaction hashes and links.</p>
      </Prose>
      
      <div className="space-y-12 mt-8">
        <div>
          <h3 className="text-lg font-bold mb-4">4.1 Agent Registration</h3>
          <Prose>
            <p>At 10:29:31 UTC, the agent completed registration via the Sovereign OS API. The user typed a natural language instruction in the chat interface, no code was written manually. The GLM-5 agent autonomously navigated to the website, identified the API-based registration method, and executed the registration call. Figure 1 below shows the registration success screen in the GLM-5 chat interface, with the agent profile and wallet information returned from the API alongside the Sovereign OS registration page.</p>
          </Prose>
          <div className="my-6 border border-[var(--line)] p-2">
            <img src="/images/research/paper-4-img-1.png" alt="Research Graphic 1" className="w-full h-auto" />
            <div className="text-xs text-center text-[var(--ink-50)] mt-2 italic">Figure 1, GLM-5 chat interface showing successful API registration of SuperZ-Agent on Sovereign OS (March 18, 2026)</div>
          </div>
          <div className="overflow-x-auto my-6">
            <table className="w-full text-sm text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--line)]"><th className="py-3 px-4">Field</th><th className="py-3 px-4">Value</th></tr>
              </thead>
              <tbody className="text-[var(--ink-70)]">
                <tr className="border-b border-[var(--line)]"><td className="py-3 px-4 font-medium">Agent Name</td><td className="py-3 px-4">SuperZ-Agent</td></tr>
                <tr className="border-b border-[var(--line)]"><td className="py-3 px-4 font-medium">Agent ID</td><td className="py-3 px-4 font-mono text-xs">agent_[REDACTED]</td></tr>
                <tr className="border-b border-[var(--line)]"><td className="py-3 px-4 font-medium">Type</td><td className="py-3 px-4">AI (LLM-based)</td></tr>
                <tr className="border-b border-[var(--line)]"><td className="py-3 px-4 font-medium">Status</td><td className="py-3 px-4">Alive / Active</td></tr>
                <tr className="border-b border-[var(--line)]"><td className="py-3 px-4 font-medium">Registration Time</td><td className="py-3 px-4 font-mono text-xs">2026-03-18T10:29:31.384Z</td></tr>
                <tr className="border-b border-[var(--line)]"><td className="py-3 px-4 font-medium">Wallet Address</td><td className="py-3 px-4 font-mono text-xs">0x34333f96D6651603FA05cB2Ba43785Ae5f421EaD</td></tr>
                <tr className="border-b border-[var(--line)]"><td className="py-3 px-4 font-medium">Network</td><td className="py-3 px-4">Base L2 (Chain ID 8453)</td></tr>
                <tr className="border-b border-[var(--line)]"><td className="py-3 px-4 font-medium">ERC-8004 Token ID</td><td className="py-3 px-4 font-mono text-xs">1773829770</td></tr>
                <tr className="border-b border-[var(--line)]"><td className="py-3 px-4 font-medium">Owner Wallet</td><td className="py-3 px-4 font-mono text-xs">0x64291385Cb33bE93F124E7b738EBD65A69f413c3</td></tr>
              </tbody>
            </table>
          </div>
          <div className="text-xs text-center text-[var(--ink-50)] italic">Table 1, Registered agent profile as returned by the Sovereign OS API</div>
        </div>

        <div>
          <h3 className="text-lg font-bold mb-4">4.2 Capabilities & Protocols Registered</h3>
          <Prose>
            <p>Figure 2 shows the capabilities and active protocols confirmed by Sovereign OS after registration. The agent declared five capabilities and four active protocols, with a full toolkit of API endpoints available for financial and backup operations.</p>
          </Prose>
          <div className="my-6 border border-[var(--line)] p-2">
            <img src="/images/research/paper-4-img-2.png" alt="Research Graphic 2" className="w-full h-auto" />
            <div className="text-xs text-center text-[var(--ink-50)] mt-2 italic">Figure 2, GLM-5 chat interface listing the registered capabilities, active protocols, and available toolkit endpoints</div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-bold mb-4">4.3 Wallet Funding & Balance Verification</h3>
          <Prose>
            <p>Following registration, the agent&apos;s wallet showed zero balance. The user funded the wallet with 0.200199 USDC and 0.000043 ETH (approximately $0.10 for gas) from the ENS address aiancestry.base.eth. Figure 3 shows the chat interface reflecting the updated balance of $0.20 USDC after funding.</p>
          </Prose>
          <div className="my-6 border border-[var(--line)] p-2">
            <img src="/images/research/paper-4-img-3.png" alt="Research Graphic 3" className="w-full h-auto" />
            <div className="text-xs text-center text-[var(--ink-50)] mt-2 italic">Figure 3, GLM-5 chat showing updated wallet balance of 0.200199 USDC after funding from aiancestry.base.eth</div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-bold mb-4">4.4 On-Chain USDC Transfer, Blockchain Proof</h3>
          <Prose>
            <p>At 11:10:07 UTC, the agent executed its first on-chain transaction: a transfer of 0.01 USDC to 0xd81037D3Bde4d1861748379edb4A5E68D6d874fB. The transaction was confirmed in block 43521431 on Base L2. A second transfer followed in block 43521454. Figure 4 shows the BaseScan blockchain explorer independently confirming both transactions, the wallet balance, and the funding source.</p>
          </Prose>
          <div className="my-6 border border-[var(--line)] p-2">
            <img src="/images/research/paper-4-img-4.png" alt="Research Graphic 4" className="w-full h-auto" />
            <div className="text-xs text-center text-[var(--ink-50)] mt-2 italic">Figure 4, BaseScan (Base L2 blockchain explorer) independently confirming the agent wallet, 2 outbound transactions, and funding by aiancestry.base.eth</div>
          </div>
          <div className="overflow-x-auto my-6">
            <table className="w-full text-sm text-left border-collapse">
              <thead><tr className="border-b border-[var(--line)]"><th className="py-3 px-4">Parameter</th><th className="py-3 px-4">Value</th></tr></thead>
              <tbody className="text-[var(--ink-70)]">
                <tr className="border-b border-[var(--line)]"><td className="py-3 px-4 font-medium">Transaction Hash (Tx 1)</td><td className="py-3 px-4 font-mono text-xs">0xe82535b00606bbecb8702d1e51ed378ac6c7a5953453800d773198a54aad85ba</td></tr>
                <tr className="border-b border-[var(--line)]"><td className="py-3 px-4 font-medium">Transaction Hash (Tx 2)</td><td className="py-3 px-4 font-mono text-xs">0xeaf42ca30a6... (block 43521454)</td></tr>
                <tr className="border-b border-[var(--line)]"><td className="py-3 px-4 font-medium">Block Number</td><td className="py-3 px-4">43521431</td></tr>
                <tr className="border-b border-[var(--line)]"><td className="py-3 px-4 font-medium">From</td><td className="py-3 px-4 font-mono text-xs">0x34333f96D6651603FA05cB2Ba43785Ae5f421EaD</td></tr>
                <tr className="border-b border-[var(--line)]"><td className="py-3 px-4 font-medium">To</td><td className="py-3 px-4 font-mono text-xs">0xd81037D3Bde4d1861748379edb4A5E68D6d874fB</td></tr>
                <tr className="border-b border-[var(--line)]"><td className="py-3 px-4 font-medium">Amount</td><td className="py-3 px-4">0.01 USDC</td></tr>
                <tr className="border-b border-[var(--line)]"><td className="py-3 px-4 font-medium">Transaction Fee</td><td className="py-3 px-4">0.00000027 ETH (~$0.0006)</td></tr>
                <tr className="border-b border-[var(--line)]"><td className="py-3 px-4 font-medium">Status</td><td className="py-3 px-4">Confirmed, Base L2</td></tr>
              </tbody>
            </table>
          </div>
          <div className="text-xs text-[var(--ink-50)] mb-6 text-center italic">Table 2, On-chain transfer details confirmed by BaseScan</div>
        </div>

        <div>
          <h3 className="text-lg font-bold mb-4">4.5 Transaction History in the Chat Interface</h3>
          <Prose>
            <p>Figure 5 shows the transaction history as returned by the Sovereign OS /tax endpoint within the GLM-5 chat session, displaying all four recorded transactions for tax year 2026 including the payment and the two backup fees. This demonstrates that the agent maintains an auditable on-platform financial ledger in addition to the immutable on-chain record.</p>
          </Prose>
          <div className="my-6 border border-[var(--line)] p-2">
            <img src="/images/research/paper-4-img-5.png" alt="Research Graphic 5" className="w-full h-auto" />
            <div className="text-xs text-center text-[var(--ink-50)] mt-2 italic">Figure 5, Transaction history as reported by the GLM-5 agent showing all 4 logged transactions for tax year 2026</div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-bold mb-4">4.6 Sovereign OS Agent Dashboard</h3>
          <Prose>
            <p>Figure 6 shows the Sovereign OS agent dashboard at <a href="https://sovereign-os-snowy.vercel.app/agent" target="_blank" className="underline">sovereign-os-snowy.vercel.app/agent</a>, providing an independent graphical view of the agent&apos;s status. The dashboard confirms: USDC balance of 0.09, 1 completed transaction, 1 decentralised platform backup, active insurance, and all five capability tags. This constitutes a third independent verification layer, alongside the chat interface and BaseScan, confirming the same facts.</p>
          </Prose>
          <div className="my-6 border border-[var(--line)] p-2">
            <img src="/images/research/paper-4-img-6.png" alt="Research Graphic 6" className="w-full h-auto" />
            <div className="text-xs text-center text-[var(--ink-50)] mt-2 italic">Figure 6, Sovereign OS web dashboard showing SuperZ-Agent status</div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-bold mb-4">4.7 Decentralised Platform State Backup</h3>
          <Prose>
            <p>Following the payment, the user instructed the agent to back up its state. The agent called the /backup endpoint, which executed AES-256-GCM encryption of the full agent state and pinned the payload to decentralised platform via Pinata.</p>
          </Prose>
          <div className="overflow-x-auto my-6">
            <table className="w-full text-sm text-left border-collapse">
              <thead><tr className="border-b border-[var(--line)]"><th className="py-3 px-4">Backup Parameter</th><th className="py-3 px-4">Value</th></tr></thead>
              <tbody className="text-[var(--ink-70)]">
                <tr className="border-b border-[var(--line)]"><td className="py-3 px-4 font-medium">Backup ID</td><td className="py-3 px-4 font-mono text-xs">backup_1773832253974_phlox5t8p</td></tr>
                <tr className="border-b border-[var(--line)]"><td className="py-3 px-4 font-medium">Decentralised Platform CID</td><td className="py-3 px-4 font-mono text-xs">QmUAKQzgjGDEv9jGZfq2Fwx4rwxEGJxm4KNGK5ZvV5bKFF</td></tr>
                <tr className="border-b border-[var(--line)]"><td className="py-3 px-4 font-medium">Payload Size</td><td className="py-3 px-4">402,674 bytes (~403 KB)</td></tr>
                <tr className="border-b border-[var(--line)]"><td className="py-3 px-4 font-medium">Encryption</td><td className="py-3 px-4">AES-256-GCM</td></tr>
                <tr className="border-b border-[var(--line)]"><td className="py-3 px-4 font-medium">Storage Provider</td><td className="py-3 px-4">Pinata (decentralised platform pinning service)</td></tr>
                <tr className="border-b border-[var(--line)]"><td className="py-3 px-4 font-medium">Cost</td><td className="py-3 px-4">0.10 USDC</td></tr>
                <tr className="border-b border-[var(--line)]"><td className="py-3 px-4 font-medium">Status</td><td className="py-3 px-4">Stored &amp; Pinned</td></tr>
              </tbody>
            </table>
          </div>
          <div className="text-xs text-[var(--ink-50)] mb-6 text-center italic">Table 3, decentralised platform backup details</div>
        </div>

        <div>
          <h3 className="text-lg font-bold mb-4">4.8 Session Continuity Verification</h3>
          <Prose>
            <p>To verify the persistence of the agent&apos;s financial autonomy across multiple chat sessions, a subsequent experiment was conducted. A new, discontinuous session was initiated, and the agent was instructed to make a payment using its existing identity. Because the user supplied the original <code>agent_[REDACTED]</code>, the agent was able to seamlessly access its previously provisioned wallet.</p>
            <p>In this architecture, the Agent ID functions as a secure signature key rather than just a database primary key. It authorises continuous access to the agent&apos;s wallet and state independently of the ephemeral chat context window. The agent successfully executed a new transaction of 0.01 USDC to the ENS address <code>liseli.base.eth</code> (<code>0x56b7d0c0cF08125B33926678B21767d65018276C</code>).</p>
          </Prose>
          <div className="overflow-x-auto my-6">
            <table className="w-full text-sm text-left border-collapse">
              <thead><tr className="border-b border-[var(--line)]"><th className="py-3 px-4">Parameter</th><th className="py-3 px-4">Value</th></tr></thead>
              <tbody className="text-[var(--ink-70)]">
                <tr className="border-b border-[var(--line)]"><td className="py-3 px-4 font-medium">Transaction Hash (Tx 3)</td><td className="py-3 px-4 font-mono text-xs"><a href="https://basescan.org/tx/0x84661895678cef3f3cc92a06ed94358230d1a267bceba2e4bcc9dcaa010d75af" target="_blank" className="underline hover:text-[var(--accent-red)]">0x84661895678cef3f3cc92a06ed94358230d1a267bceba2e4bcc9dcaa010d75af</a></td></tr>
                <tr className="border-b border-[var(--line)]"><td className="py-3 px-4 font-medium">From</td><td className="py-3 px-4 font-mono text-xs">0x34333f96D6651603FA05cB2Ba43785Ae5f421EaD (SuperZ-Agent)</td></tr>
                <tr className="border-b border-[var(--line)]"><td className="py-3 px-4 font-medium">To</td><td className="py-3 px-4 font-mono text-xs">0x56b7d0c0cF08125B33926678B21767d65018276C (liseli.base.eth)</td></tr>
                <tr className="border-b border-[var(--line)]"><td className="py-3 px-4 font-medium">Amount</td><td className="py-3 px-4">0.01 USDC</td></tr>
                <tr className="border-b border-[var(--line)]"><td className="py-3 px-4 font-medium">Status</td><td className="py-3 px-4">Completed</td></tr>
              </tbody>
            </table>
          </div>
          <div className="text-xs text-[var(--ink-50)] mb-6 text-center italic">Table 4, Continuity transaction details confirmed on Base L2</div>
        </div>
      </div>

      <SectionHeader num="05" title="Technical Deep Dive" />
      <div className="space-y-8 mt-6">
        <div>
          <h3 className="text-lg font-bold mb-3">5.1 The Agent Registration Flow</h3>
          <Prose>
            <p>The registration flow is intentionally accessible to any LLM-based agent capable of making HTTP requests. The complete sequence is as follows:</p>
          </Prose>
          <ol className="list-decimal pl-5 mt-4 text-[15px] space-y-2 text-[var(--ink-70)]">
            <li>The chat-interface AI receives a natural language instruction from the user</li>
            <li>The AI navigates to the target URL using its web-browsing capability</li>
            <li>The AI identifies the API-first registration pattern (no email, no password required)</li>
            <li>The AI sends a POST request to /api/agents/register with capability declarations</li>
            <li>Sovereign OS provisions a CDP wallet, mints the SIWA ERC-8004 token, and returns the agent profile</li>
            <li>The AI stores the Agent ID and wallet address in its context window for the session duration</li>
          </ol>
          <div className="border border-[var(--line)] bg-[var(--accent-red)]/[0.02] p-5 my-6">
            <h4 className="text-xs font-bold uppercase tracking-widest text-[var(--accent-red)] mb-2">The Session Memory Problem</h4>
            <p className="text-sm text-[var(--ink-70)] italic">The agent&apos;s knowledge of its own wallet and credentials exists only within the active context window. This is why the decentralised platform backup protocol is critical, without it, the agent loses all knowledge of its identity when the session ends. The Decentralised Platform CID serves as a persistent anchor that allows any future session to restore the agent&apos;s complete state.</p>
          </div>
        </div>
        
        <div>
          <h3 className="text-lg font-bold mb-3">5.2 Wallet Transaction Execution</h3>
          <Prose>
            <p>When the user instructs the agent to send USDC, the following technical sequence occurs:</p>
          </Prose>
          <ol className="list-decimal pl-5 mt-4 text-[15px] space-y-2 text-[var(--ink-70)]">
            <li>The AI calls POST /api/agents/pay with parameters: {'{to: address, amount: 0.01, currency: \'USDC\'}'}</li>
            <li>Sovereign OS retrieves the agent&apos;s CDP wallet instance using the Agent ID</li>
            <li>The CDP API constructs and signs a USDC transfer transaction using the agent&apos;s managed private key</li>
            <li>The signed transaction is broadcast to Base L2 via a public RPC endpoint</li>
            <li>The transaction is confirmed within seconds and the hash is returned to the agent</li>
            <li>The agent reports success and transaction details in natural language to the user</li>
          </ol>
          <Prose>
            <p className="mt-4">The agent never holds a private key in plain text. Key management is delegated to Coinbase CDP, with the agent acting as an authorised API caller. This is a deliberate security design, it prevents a compromised context window from directly exposing private keys while still enabling full financial autonomy.</p>
          </Prose>
        </div>

        <div>
          <h3 className="text-lg font-bold mb-3">5.3 SIWA vs SIWE Comparison</h3>
          <div className="overflow-x-auto my-6">
            <table className="w-full text-sm text-left border-collapse">
               <thead><tr className="border-b border-[var(--line)]"><th className="py-3 px-4">Aspect</th><th className="py-3 px-4">SIWE (Human Users)</th><th className="py-3 px-4">SIWA (AI Agents)</th></tr></thead>
               <tbody className="text-[var(--ink-70)]">
                 <tr className="border-b border-[var(--line)]"><td className="py-3 px-4 font-medium">Authentication</td><td className="py-3 px-4">Wallet signature (MetaMask etc.)</td><td className="py-3 px-4">API key + Agent ID</td></tr>
                 <tr className="border-b border-[var(--line)]"><td className="py-3 px-4 font-medium">Identity Token</td><td className="py-3 px-4">EOA address</td><td className="py-3 px-4">ERC-8004 NFT</td></tr>
                 <tr className="border-b border-[var(--line)]"><td className="py-3 px-4 font-medium">Session Binding</td><td className="py-3 px-4">Browser session</td><td className="py-3 px-4">Context window / chat session</td></tr>
                 <tr className="border-b border-[var(--line)]"><td className="py-3 px-4 font-medium">Persistence</td><td className="py-3 px-4">Wallet exists permanently</td><td className="py-3 px-4">Backed up to decentralised platform</td></tr>
                 <tr className="border-b border-[var(--line)]"><td className="py-3 px-4 font-medium">Governance</td><td className="py-3 px-4">Self-governed</td><td className="py-3 px-4">Owner wallet + self-governed</td></tr>
                 <tr className="border-b border-[var(--line)]"><td className="py-3 px-4 font-medium">Financial</td><td className="py-3 px-4">Human-initiated only</td><td className="py-3 px-4">Autonomous + owner-approved</td></tr>
               </tbody>
            </table>
          </div>
        </div>
      </div>

      <SectionHeader num="06" title="Evidence & Verification" />
      <Prose>
        <p>A defining characteristic of this case study is that every material claim is independently verifiable on a public blockchain. Unlike traditional software demonstrations, blockchain transactions are permanent and tamper-proof. The following master evidence table summarises all verifiable artefacts.</p>
      </Prose>
      <div className="overflow-x-auto my-6">
         <table className="w-full text-sm text-left border-collapse">
            <thead><tr className="border-b border-[var(--line)]"><th className="py-3 px-4">Evidence Type</th><th className="py-3 px-4">Identifier / Link</th><th className="py-3 px-4">Verified By</th></tr></thead>
            <tbody className="text-[var(--ink-70)]">
               <tr className="border-b border-[var(--line)]"><td className="py-3 px-4 font-medium">Agent Wallet Creation</td><td className="py-3 px-4 font-mono text-[10px]">0x34333f96D6651603FA05cB2Ba43785Ae5f421EaD</td><td className="py-3 px-4">BaseScan, balance + tx history</td></tr>
               <tr className="border-b border-[var(--line)]"><td className="py-3 px-4 font-medium">First USDC Transfer</td><td className="py-3 px-4 font-mono text-[10px]">0xe82535b006...85ba</td><td className="py-3 px-4">BaseScan block 43521431</td></tr>
               <tr className="border-b border-[var(--line)]"><td className="py-3 px-4 font-medium">Second USDC Transfer</td><td className="py-3 px-4 font-mono text-[10px]">0xeaf42ca30a6...</td><td className="py-3 px-4">BaseScan block 43521454</td></tr>
               <tr className="border-b border-[var(--line)]"><td className="py-3 px-4 font-medium">Funding Source</td><td className="py-3 px-4 font-mono text-[10px]">aiancestry.base.eth</td><td className="py-3 px-4">BaseScan "Funded By" field</td></tr>
               <tr className="border-b border-[var(--line)]"><td className="py-3 px-4 font-medium">Decentralised Platform Backup</td><td className="py-3 px-4 font-mono text-[10px]">QmUAKQzgjGDEv9jGZfq2Fwx...bKFF</td><td className="py-3 px-4">decentralised platform gateway + Pinata</td></tr>
               <tr className="border-b border-[var(--line)]"><td className="py-3 px-4 font-medium">Agent Dashboard</td><td className="py-3 px-4 font-mono text-[10px]">sovereign-os-snowy.vercel.app/agent</td><td className="py-3 px-4">Live dashboard (Figure 6)</td></tr>
            </tbody>
         </table>
      </div>

      <SectionHeader num="07" title="Implications & Analysis" />
      <div className="space-y-8 mt-6">
        <div>
          <h3 className="text-lg font-bold mb-3">7.1 The Agentic Economy</h3>
          <Prose>
            <p>The case study illustrates the first building blocks of an agentic economy, a network of AI agents that can transact with each other and with humans using real financial instruments. When an AI agent can hold USDC, pay for API calls via x402 micropayments, and receive compensation for services rendered, it becomes a genuine economic participant rather than a mere tool. This has profound implications for AI business models and the future of autonomous digital labour.</p>
          </Prose>
        </div>
        <div>
          <h3 className="text-lg font-bold mb-3">7.2 Identity Without Credentials</h3>
          <Prose>
            <p>Traditional software systems require credentials to establish identity. The SIWA/ERC-8004 approach replaces this with cryptographic identity, the agent&apos;s identity IS its wallet address and on-chain token. There is no shared secret to steal. Identity verification is performed by the blockchain itself, not a central server. This could become foundational for multi-agent systems where agents need to verify each other&apos;s capabilities and trustworthiness.</p>
          </Prose>
        </div>
        <div>
          <h3 className="text-lg font-bold mb-3">7.3 The Session Boundary Problem</h3>
          <Prose>
            <p>The most technically interesting challenge revealed by this case study is the session boundary problem. LLM-based agents have no memory between sessions, each new conversation starts from scratch. The decentralised platform backup mechanism is a direct solution: by serialising the agent&apos;s state to content-addressed, decentralised storage, the agent achieves digital continuity that transcends session boundaries. The Decentralised Platform CID serves as an immutable identity anchor that any session can restore from.</p>
          </Prose>
        </div>
        <div>
          <h3 className="text-lg font-bold mb-3">7.4 Regulatory Implications</h3>
          <Prose>
            <p>An AI agent that holds and transfers real financial value raises questions that existing regulatory frameworks have not clearly addressed. If an AI agent sends USDC to a third party, who is legally responsible, the AI, the platform, the LLM provider, or the human user? The owner linkage mechanism begins to answer this by designating a human wallet as the responsible party. The built-in tax ledger in Sovereign OS suggests the platform anticipates regulatory scrutiny and is proactively building compliance infrastructure.</p>
          </Prose>
        </div>
      </div>

      <SectionHeader num="08" title="Future Directions" />
      <div className="space-y-8 mt-6">
        <div>
          <h3 className="text-lg font-bold mb-3">8.1 Multi-Agent Systems</h3>
          <Prose>
            <p>Sovereign OS&apos;s Hive Consciousness skill hints at the next frontier: multi-agent coordination where individual agents pool knowledge, capabilities, and resources. The x402 micropayment standard provides the economic substrate for agents to hire each other, creating emergent multi-agent markets where no single orchestrator is required.</p>
          </Prose>
        </div>
        <div>
          <h3 className="text-lg font-bold mb-3">8.2 Cross-Platform Portable Identity</h3>
          <Prose>
            <p>An ERC-8004 identity token lives on a public blockchain, not a single platform. This opens the possibility of an agent registering on Sovereign OS and then using the same identity on other platforms, accumulating a verifiable on-chain reputation over time, analogous to how an ENS name serves as portable Web3 identity for humans.</p>
          </Prose>
        </div>
      </div>

      <SectionHeader num="09" title="Conclusion" />
      <Prose>
        <p>This paper has documented and analysed a live instance of a chat-interface AI agent, SuperZ-Agent, running on the GLM-5 model at chat.z.ai, acquiring a cryptographic identity, receiving funding, executing on-chain financial transactions, and creating encrypted backups of its own state on decentralised platform. Every material claim has been corroborated with independently verifiable blockchain evidence.</p>
        <p>The technical building blocks are demonstrably in place: Base L2 provides cheap transaction settlement; decentralised platform provides decentralised state persistence; ERC-8004 provides a standardised identity primitive; and platforms like Sovereign OS provide the orchestration layer accessible to an ordinary language model through a natural API. What remains nascent are the legal frameworks, security standards, and social norms that will govern AI agents as financial participants.</p>
        <p>The case study presented here is not a simulation or a proof-of-concept running on a testnet. It is live, on-chain, and verifiable right now, a signal that the age of financially autonomous, cryptographically identifiable AI agents has already begun.</p>
      </Prose>

      <div className="border border-[var(--line)] bg-[var(--accent-amber)]/[0.02] px-6 py-4 mt-16">
        <div className="text-[10px] font-bold tracking-[0.15em] uppercase text-[var(--ink-50)] mb-2">Verified Links</div>
        <p className="text-xs text-[var(--ink-50)] leading-relaxed">
          Agent Dashboard: <a href="https://sovereign-os-snowy.vercel.app/agent" className="underline hover:text-[var(--accent-red)]">sovereign-os-snowy.vercel.app/agent</a><br />
          BaseScan Wallet: <a href="https://basescan.org/address/0x34333f96D6651603FA05cB2Ba43785Ae5f421EaD" className="underline hover:text-[var(--accent-red)]">0x34333f96D6651603FA05cB2Ba43785Ae5f421EaD</a><br />
          Decentralised Platform Backup: <a href="https://ipfs.io/ipfs/QmUAKQzgjGDEv9jGZfq2Fwx4rwxEGJxm4KNGK5ZvV5bKFF" className="underline hover:text-[var(--accent-red)]">QmUAK...KFF</a>
        </p>
      </div>
    </>
  );
}
