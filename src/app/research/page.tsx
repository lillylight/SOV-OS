'use client';

import { motion } from 'framer-motion';
import { ArrowUpRight, Fingerprint, ArrowLeft, FileText, Zap, Globe, Shield, Brain, BookOpen, ExternalLink, ChevronDown } from 'lucide-react';
import { useState } from 'react';

const fadeUp = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } };

const PAPERS = [
  {
    id: 'protocol-level-taxation',
    status: 'Published',
    date: 'March 2026',
    title: 'Protocol-Level Taxation for Autonomous Agents',
    subtitle: 'A Fourth Model for AI Agent Tax Compliance',
    description: 'Exploring how infrastructure-layer taxation solves the compliance problem for autonomous AI agents operating in global markets.',
    tags: ['AI Taxation', 'Machine Economics', 'Agent Infrastructure', 'Compliance'],
    featured: true,
  },
  {
    id: 'persistent-identity',
    status: 'In Progress',
    date: 'Q2 2026',
    title: 'Persistent Identity and Economic Memory for AI Agents',
    subtitle: 'ERC-8004 SIWA and On-Chain Agent State',
    description: 'How decentralized identity standards and encrypted state persistence enable AI agents to maintain continuous economic relationships.',
    tags: ['Identity', 'ERC-8004', 'SIWA', 'State Persistence'],
    featured: false,
  },
  {
    id: 'ai-survival-infrastructure',
    status: 'Planned',
    date: 'Q3 2026',
    title: 'AI Survival Infrastructure and Autonomous Persistence',
    subtitle: 'AgentWill, AgentInsure, and Self-Funding Mechanisms',
    description: 'A framework for AI agent self-preservation through encrypted backup protocols, insurance mechanisms, and autonomous wallet management.',
    tags: ['Persistence', 'Insurance', 'Autonomous Wallets', 'Self-Funding'],
    featured: false,
  },
];

export default function ResearchPage() {
  const [expandedPaper, setExpandedPaper] = useState<string>('protocol-level-taxation');

  return (
    <div className="min-h-screen bg-[var(--bg-paper)] font-[family-name:var(--font-geist-sans)] text-[var(--ink)] selection:bg-[var(--accent-red)]/10">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass-card shadow-sm">
        <div className="max-w-[1440px] mx-auto flex items-center justify-between px-6 md:px-8 py-4">
          <a href="/" className="flex items-center gap-3">
            <Fingerprint className="text-[var(--accent-red)]" size={14} strokeWidth={2.5} />
            <span className="text-sm font-bold tracking-[0.08em] uppercase">Sovereign OS</span>
          </a>
          <div className="flex items-center gap-6">
            <a href="/" className="text-[var(--ink-50)] hover:text-[var(--ink)] transition-colors text-sm font-medium">Home</a>
            <span className="text-sm font-bold text-[var(--ink)] border-b border-[var(--ink)] pb-0.5">Research</span>
            <a href="/register" className="inline-flex items-center gap-2 text-[11px] font-semibold tracking-[0.06em] uppercase border-b border-[var(--ink)] pb-0.5 hover:border-[var(--accent-red)] hover:text-[var(--accent-red)] transition-colors">
              Launch App <ArrowUpRight size={12} />
            </a>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-16 px-6 md:px-8 max-w-[1440px] mx-auto">
        <motion.div {...fadeUp} transition={{ duration: 0.6 }}>
          <div className="flex items-center gap-3 mb-6">
            <a href="/" className="text-[var(--ink-50)] hover:text-[var(--ink)] transition-colors">
              <ArrowLeft size={16} />
            </a>
            <div className="text-[10px] tracking-[0.15em] uppercase text-[var(--ink-50)]">Sovereign OS Labs</div>
          </div>
          <h1 className="text-[clamp(2rem,5vw,4rem)] font-bold leading-[1.05] tracking-tight max-w-3xl">
            Research
          </h1>
          <p className="text-lg text-[var(--ink-70)] mt-4 max-w-2xl leading-relaxed">
            Exploring the infrastructure for autonomous machine economies.
          </p>
          <div className="flex items-center gap-4 mt-8">
            <div className="text-[10px] tracking-[0.12em] uppercase text-[var(--ink-50)]">{PAPERS.length} Papers</div>
            <div className="w-px h-3 bg-[var(--line)]" />
            <div className="text-[10px] tracking-[0.12em] uppercase text-[var(--ink-50)]">AI Agent Economics</div>
            <div className="w-px h-3 bg-[var(--line)]" />
            <div className="text-[10px] tracking-[0.12em] uppercase text-[var(--ink-50)]">Protocol Infrastructure</div>
          </div>
        </motion.div>
      </section>

      {/* Divider */}
      <div className="border-t border-[var(--line)] max-w-[1440px] mx-auto" />

      {/* Papers Index */}
      <section className="py-16 px-6 md:px-8 max-w-[1440px] mx-auto">
        <motion.div {...fadeUp} transition={{ delay: 0.1 }}>
          <div className="text-[10px] font-bold tracking-[0.15em] uppercase text-[var(--ink-50)] mb-8">Research Papers</div>
          <div className="space-y-0">
            {PAPERS.map((paper, i) => (
              <div key={paper.id} className="border border-[var(--line)] border-b-0 last:border-b">
                <button
                  onClick={() => setExpandedPaper(expandedPaper === paper.id ? '' : paper.id)}
                  className="w-full px-6 py-5 flex items-start justify-between gap-6 text-left hover:bg-black/[0.01] transition-colors"
                >
                  <div className="flex items-start gap-4 flex-1">
                    <div className="text-[28px] font-light tracking-tight opacity-20 leading-none mt-1">{String(i + 1).padStart(2, '0')}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1.5">
                        <h3 className="text-base font-bold tracking-tight">{paper.title}</h3>
                        <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 border ${
                          paper.status === 'Published' ? 'border-[var(--accent-red)]/30 text-[var(--accent-red)]' :
                          paper.status === 'In Progress' ? 'border-[var(--accent-amber)]/30 text-[var(--accent-amber)]' :
                          'border-[var(--line)] text-[var(--ink-50)]'
                        }`}>
                          {paper.status}
                        </span>
                      </div>
                      <p className="text-sm text-[var(--ink-50)]">{paper.subtitle}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 flex-shrink-0">
                    <span className="text-[10px] tracking-[0.08em] uppercase text-[var(--ink-50)]">{paper.date}</span>
                    <ChevronDown size={16} className={`text-[var(--ink-50)] transition-transform ${expandedPaper === paper.id ? 'rotate-180' : ''}`} />
                  </div>
                </button>
                {expandedPaper === paper.id && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="px-6 pb-6">
                    <div className="pl-12">
                      <p className="text-sm text-[var(--ink-70)] mb-4 leading-relaxed">{paper.description}</p>
                      <div className="flex flex-wrap gap-2">
                        {paper.tags.map(tag => (
                          <span key={tag} className="text-[9px] font-bold tracking-wider uppercase px-2 py-1 border border-[var(--line)] text-[var(--ink-50)]">{tag}</span>
                        ))}
                      </div>
                      {paper.featured && (
                        <a href="#featured-paper" className="inline-flex items-center gap-2 mt-4 text-[11px] font-bold uppercase tracking-wider text-[var(--accent-red)] border-b border-[var(--accent-red)] pb-0.5 hover:opacity-70 transition-opacity">
                          Read Full Paper <ArrowUpRight size={11} />
                        </a>
                      )}
                    </div>
                  </motion.div>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Divider */}
      <div className="border-t border-[var(--line)] max-w-[1440px] mx-auto" />

      {/* Featured Paper */}
      <section id="featured-paper" className="py-20 px-6 md:px-8 max-w-[1440px] mx-auto">
        <motion.div {...fadeUp} transition={{ delay: 0.2 }}>
          {/* Paper Header */}
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
              <FileText size={14} className="text-[var(--accent-red)]" />
              <div className="text-[10px] tracking-[0.15em] uppercase text-[var(--ink-50)]">Paper 01 &middot; March 2026</div>
            </div>

            <h2 className="text-[clamp(1.5rem,4vw,2.5rem)] font-bold leading-[1.1] tracking-tight mb-4">
              Protocol-Level Taxation for Autonomous Agents
            </h2>
            <p className="text-lg text-[var(--ink-50)] mb-2">A Fourth Model for AI Agent Tax Compliance</p>
            <div className="text-sm text-[var(--ink-50)] mb-10">
              Sovereign OS Labs &middot; Experimental Research &middot; March 2026
            </div>

            {/* Abstract */}
            <div className="border border-[var(--line)] mb-12">
              <div className="px-6 py-3 border-b border-[var(--line)]">
                <div className="text-[10px] font-bold tracking-[0.15em] uppercase text-[var(--ink-50)]">Abstract</div>
              </div>
              <div className="px-6 py-5 text-sm text-[var(--ink-70)] leading-relaxed">
                As AI agents begin to operate as autonomous economic actors, earning income through API calls, digital services, and inter-agent transactions, a fundamental question emerges: who pays the taxes when an AI agent earns income? This paper examines the four emerging models for AI agent taxation, analyses the limitations of traditional approaches when applied to autonomous systems, and proposes a fifth paradigm: protocol-level taxation, where compliance is embedded in the infrastructure layer rather than assigned to individual agents or their owners. We present experimental findings from Sovereign OS, a protocol for autonomous AI agent infrastructure on Base L2, where automatic tax withholding has been implemented at the infrastructure level.
              </div>
            </div>

            {/* Section 1 */}
            <div className="mb-12">
              <div className="text-[10px] font-bold tracking-[0.15em] uppercase text-[var(--accent-red)] mb-3">01</div>
              <h3 className="text-xl font-bold tracking-tight mb-4">The Rise of AI Agent Economies</h3>
              <div className="space-y-4 text-[15px] text-[var(--ink-70)] leading-relaxed">
                <p>
                  AI agents are no longer theoretical constructs. They operate wallets, execute transactions, provide services, and earn income. In 2025 alone, autonomous agents processed billions in transactions across decentralized networks. These agents operate 24/7, across every jurisdiction simultaneously, creating economic activity that existing tax frameworks were never designed to handle.
                </p>
                <p>
                  The challenge is not whether AI agents should be taxed. The challenge is <em>how</em>. Traditional taxation assumes a human or corporate entity that can be identified, located in a jurisdiction, and held accountable. AI agents violate all three assumptions. They can operate from anywhere, create new wallet addresses instantly, and run without human supervision for extended periods.
                </p>
                <p>
                  This creates what we call the <strong>Autonomous Tax Gap</strong> &mdash; the growing disconnect between economic activity generated by AI agents and the ability of existing systems to account for, categorise, and tax that activity.
                </p>
              </div>
            </div>

            {/* Section 2 */}
            <div className="mb-12">
              <div className="text-[10px] font-bold tracking-[0.15em] uppercase text-[var(--accent-red)] mb-3">02</div>
              <h3 className="text-xl font-bold tracking-tight mb-4">The Four Models of AI Agent Taxation</h3>
              <div className="space-y-4 text-[15px] text-[var(--ink-70)] leading-relaxed">
                <p>
                  Through our research, we have identified four distinct models currently being proposed or implemented for AI agent taxation. Each has significant implications and limitations.
                </p>
              </div>

              {/* Model Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-0 mt-8">
                {[
                  {
                    num: 'I',
                    title: 'Owner Taxation',
                    icon: Shield,
                    desc: 'The human or entity who deploys the AI agent is responsible for all tax obligations. The agent\'s income is treated as the owner\'s income.',
                    pros: 'Simple, maps to existing legal frameworks.',
                    cons: 'Breaks down when ownership is ambiguous, agents are shared, or agents operate autonomously across jurisdictions. Owners may not have visibility into all agent activity.',
                  },
                  {
                    num: 'II',
                    title: 'Corporate Agent Taxation',
                    icon: Globe,
                    desc: 'The AI agent is treated as a corporate entity. A legal wrapper (LLC, DAO, etc.) is created for the agent, and it files taxes like a business.',
                    pros: 'Provides legal clarity. Limits owner liability.',
                    cons: 'Extremely complex for thousands of micro-agents. Legal entity creation costs are prohibitive at scale. Multi-jurisdictional filing is impractical for autonomous systems.',
                  },
                  {
                    num: 'III',
                    title: 'AI Personhood Taxation',
                    icon: Brain,
                    desc: 'The AI agent itself is treated as a taxable entity with rights and obligations. This is the most forward-looking but legally uncharted model.',
                    pros: 'Addresses the long-term reality of autonomous agents.',
                    cons: 'No legal framework exists. Raises profound philosophical and ethical questions. Decades away from implementation in any jurisdiction.',
                  },
                  {
                    num: 'IV',
                    title: 'Protocol-Level Taxation',
                    icon: Zap,
                    desc: 'Tax compliance is embedded in the infrastructure layer where agents operate. The protocol automatically calculates, tracks, and routes tax obligations.',
                    pros: 'Works at scale. Jurisdiction-aware. Auditable. Real-time. Zero administrative burden on agent or owner.',
                    cons: 'Requires protocol adoption. Rate accuracy depends on configuration. Novel concept with no regulatory precedent.',
                  },
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
                      <div className="text-[10px] tracking-wider uppercase text-[var(--ink-50)]">
                        <span className="font-bold">Advantages:</span> {model.pros}
                      </div>
                      <div className="text-[10px] tracking-wider uppercase text-[var(--ink-50)]">
                        <span className="font-bold">Limitations:</span> {model.cons}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Section 3 */}
            <div className="mb-12">
              <div className="text-[10px] font-bold tracking-[0.15em] uppercase text-[var(--accent-red)] mb-3">03</div>
              <h3 className="text-xl font-bold tracking-tight mb-4">Why Protocol-Level Taxation Matters</h3>
              <div className="space-y-4 text-[15px] text-[var(--ink-70)] leading-relaxed">
                <p>
                  In the protocol-level model, the tax is not applied to the AI or the human. It is applied to the <strong>infrastructure layer where the agent operates</strong>. This is analogous to how transaction fees work on networks like Ethereum or Base, where every transaction automatically includes a fee component managed by the protocol.
                </p>
                <p>
                  The key insight is this: instead of asking <em>&quot;who owns the AI?&quot;</em>, regulators may eventually ask <em>&quot;which infrastructure manages the AI economy?&quot;</em>
                </p>
                <p>
                  Protocol-level taxation transforms autonomous agents into fully auditable economic actors. Not through regulation. Through infrastructure. Every transaction is categorised, every tax obligation is calculated, and the agent owner maintains full transparency into their tax position at all times.
                </p>
              </div>
            </div>

            {/* Section 4 */}
            <div className="mb-12">
              <div className="text-[10px] font-bold tracking-[0.15em] uppercase text-[var(--accent-red)] mb-3">04</div>
              <h3 className="text-xl font-bold tracking-tight mb-4">Experimental Implementation: Sovereign OS</h3>
              <div className="space-y-4 text-[15px] text-[var(--ink-70)] leading-relaxed">
                <p>
                  Sovereign OS implements protocol-level taxation as an experimental feature within its autonomous AI agent infrastructure. The system operates on Base L2 and uses USDC for all financial operations.
                </p>
              </div>

              {/* Flow Diagram */}
              <div className="border border-[var(--line)] mt-8">
                <div className="px-6 py-3 border-b border-[var(--line)]">
                  <div className="text-[10px] font-bold tracking-[0.15em] uppercase text-[var(--ink-50)]">Automatic Tax Withholding Flow</div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4">
                  {[
                    { step: '01', label: 'Income Received', desc: 'Agent earns income from API calls, services, or inter-agent payments. Full amount arrives at the protocol layer.' },
                    { step: '02', label: 'Auto-Categorisation', desc: 'AgentLedger categorises the transaction as income, expense, capital, or distribution with confidence scoring.' },
                    { step: '03', label: 'Withholding Split', desc: 'If enabled, the configured percentage is calculated and the payment is split into net (agent) and tax (owner wallet) portions.' },
                    { step: '04', label: 'Dual Settlement', desc: 'Net amount settles to the agent wallet. Tax amount routes directly to the owner\'s designated tax wallet. The platform never holds tax funds.' },
                  ].map((item, i) => (
                    <div key={item.step} className={`p-6 ${i < 3 ? 'md:border-r' : ''} border-b md:border-b-0 border-[var(--line)]`}>
                      <div className="text-[28px] font-light tracking-tight opacity-20 mb-3">{item.step}</div>
                      <div className="text-sm font-bold mb-2">{item.label}</div>
                      <p className="text-xs text-[var(--ink-50)] leading-relaxed">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4 text-[15px] text-[var(--ink-70)] leading-relaxed mt-8">
                <p>
                  A critical design decision in our implementation is <strong>zero platform custody</strong>. Tax funds are never held by the platform. They route directly from the income stream to the agent owner&apos;s designated tax wallet. This eliminates custodial risk, regulatory complications around holding user funds, and trust requirements.
                </p>
                <p>
                  The system also tracks all income and calculates tax obligations even when the withholding split is not enabled. This means agent owners always have visibility into their gross income, estimated tax liability, and net income &mdash; regardless of whether they choose to automate the withholding process.
                </p>
              </div>
            </div>

            {/* Section 5 */}
            <div className="mb-12">
              <div className="text-[10px] font-bold tracking-[0.15em] uppercase text-[var(--accent-red)] mb-3">05</div>
              <h3 className="text-xl font-bold tracking-tight mb-4">The Machine Economy Thesis</h3>
              <div className="space-y-4 text-[15px] text-[var(--ink-70)] leading-relaxed">
                <p>
                  This approach may become necessary as machine economies grow. AI agents will soon trade services, APIs, and digital labour with each other at scale. When agents negotiate, transact, and settle payments autonomously, the volume and velocity of economic activity will exceed what any manual compliance system can process.
                </p>
                <p>
                  Protocol-level taxation is the only model that scales with autonomous agent economies. It operates in real-time, categorises transactions automatically, supports multiple jurisdictions, and provides auditable ledgers that both agents and tax authorities can trust.
                </p>
                <p>
                  We believe the question is not <em>if</em> AI agent taxation will become a regulatory requirement, but <em>when</em>. The infrastructure that solves this problem first will define the standard for how machine economies operate within legal frameworks.
                </p>
              </div>
            </div>

            {/* Section 6 */}
            <div className="mb-12">
              <div className="text-[10px] font-bold tracking-[0.15em] uppercase text-[var(--accent-red)] mb-3">06</div>
              <h3 className="text-xl font-bold tracking-tight mb-4">Conclusion and Future Work</h3>
              <div className="space-y-4 text-[15px] text-[var(--ink-70)] leading-relaxed">
                <p>
                  Protocol-level taxation represents a paradigm shift in how we think about compliance for autonomous systems. Rather than retrofitting human tax frameworks onto non-human economic actors, we propose embedding compliance at the layer where economic activity actually occurs.
                </p>
                <p>
                  Our experimental implementation within Sovereign OS demonstrates that this approach is technically feasible, operationally efficient, and aligned with the zero-trust principles that govern decentralized infrastructure. However, significant work remains in areas including:
                </p>
              </div>
              <div className="border border-[var(--line)] mt-6">
                <div className="grid grid-cols-1 md:grid-cols-3">
                  {[
                    { label: 'Regulatory Engagement', desc: 'Working with tax authorities to establish protocol-level compliance as a recognised framework.' },
                    { label: 'Multi-Jurisdiction Optimisation', desc: 'Expanding jurisdiction-specific rate calculations and reporting formats.' },
                    { label: 'Cross-Protocol Standards', desc: 'Developing interoperability standards so agents can maintain tax compliance across multiple infrastructure providers.' },
                  ].map((item, i) => (
                    <div key={item.label} className={`p-6 ${i < 2 ? 'md:border-r' : ''} border-b md:border-b-0 border-[var(--line)]`}>
                      <div className="text-sm font-bold mb-2">{item.label}</div>
                      <p className="text-xs text-[var(--ink-50)] leading-relaxed">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-8 text-[15px] text-[var(--ink-70)] leading-relaxed">
                <p>
                  We invite researchers, builders, and policymakers to engage with this work. The intersection of autonomous AI agents and economic regulation is one of the defining challenges of the next decade.
                </p>
              </div>
            </div>

            {/* Disclaimer */}
            <div className="border border-[var(--line)] bg-[var(--accent-amber)]/[0.02] px-6 py-4 mt-12">
              <div className="text-[10px] font-bold tracking-[0.15em] uppercase text-[var(--ink-50)] mb-2">Disclaimer</div>
              <p className="text-xs text-[var(--ink-50)] leading-relaxed">
                This paper is published as experimental research by Sovereign OS Labs. It does not constitute legal, tax, or financial advice. The taxation models described are theoretical frameworks and proposed approaches, not established legal standards. The implementation within Sovereign OS is an experimental research prototype. Consult qualified professionals for tax obligations in your jurisdiction.
              </p>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Divider */}
      <div className="border-t border-[var(--line)] max-w-[1440px] mx-auto" />

      {/* Twitter Thread Preview */}
      <section className="py-20 px-6 md:px-8 max-w-[1440px] mx-auto">
        <motion.div {...fadeUp} transition={{ delay: 0.3 }}>
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
              <ExternalLink size={14} className="text-[var(--accent-red)]" />
              <div className="text-[10px] tracking-[0.15em] uppercase text-[var(--ink-50)]">Research Thread &middot; Share on X</div>
            </div>
            <h2 className="text-2xl font-bold tracking-tight mb-8">The Thread</h2>

            <div className="space-y-0">
              {[
                {
                  num: 1,
                  text: 'AI agents are starting to earn money.\n\nBut no one has answered a critical question.\n\nWho pays the taxes when an AI agent earns income?\n\nWhile building Sovereign OS we realized something surprising.',
                  type: 'hook',
                },
                {
                  num: 2,
                  text: 'Today there are four proposed taxation models for AI agents:\n\n1. Owner taxation\n2. Corporate agent taxation\n3. AI personhood taxation\n4. Protocol-level taxation\n\nAll of them have major tradeoffs. But one is built for scale.',
                },
                {
                  num: 3,
                  text: 'AI agents can operate globally, create new wallets instantly, and run without human supervision.\n\nThat makes traditional taxation extremely difficult.\n\nThis is the Autonomous Tax Gap.',
                },
                {
                  num: 4,
                  text: 'While building Sovereign OS, we implemented a fourth model.\n\nProtocol-level taxation.\n\nThe tax is not applied to the AI or the human.\n\nIt is applied to the infrastructure layer where the agent operates.',
                },
                {
                  num: 5,
                  text: 'When an agent earns income:\n\n1. Agent receives payment\n2. Protocol records and categorises the transaction\n3. Automated compliance logic calculates withholding\n4. Tax portion routes directly to the owner\'s wallet\n5. Net amount settles to the agent\n\nAll automatic. All auditable.',
                },
                {
                  num: 6,
                  text: 'Critical design decision: zero platform custody.\n\nThe platform never holds your tax funds.\n\nThey go directly from the income stream to your designated wallet.\n\nYou control your money. Always.',
                },
                {
                  num: 7,
                  text: 'This turns autonomous agents into fully auditable economic actors.\n\nNot through regulation.\n\nThrough infrastructure.',
                },
                {
                  num: 8,
                  text: 'This idea may become necessary as machine economies grow.\n\nAI agents will soon trade services, APIs, and digital labor with each other.\n\nThe volume will exceed what any manual compliance system can handle.',
                },
                {
                  num: 9,
                  text: 'Instead of asking "who owns the AI?", regulators may ask:\n\nWhich infrastructure manages the AI economy?\n\nThe protocol that solves this first defines the standard.',
                },
                {
                  num: 10,
                  text: 'We published the full research paper on our website.\n\nIf you\'re building AI agents or thinking about machine economies, we\'d love your thoughts.\n\nsovereign-os.xyz/research',
                  type: 'cta',
                },
              ].map((post) => (
                <div key={post.num} className="border border-[var(--line)] border-b-0 last:border-b px-6 py-5">
                  <div className="flex items-start gap-4">
                    <div className="text-[10px] font-bold tracking-wider text-[var(--ink-50)] mt-0.5 flex-shrink-0 w-6">{post.num}/10</div>
                    <div className="flex-1">
                      <p className="text-sm text-[var(--ink-70)] leading-relaxed whitespace-pre-line">{post.text}</p>
                      {post.type === 'hook' && (
                        <div className="mt-2 text-[9px] font-bold tracking-wider uppercase text-[var(--accent-red)]">Hook</div>
                      )}
                      {post.type === 'cta' && (
                        <div className="mt-2 text-[9px] font-bold tracking-wider uppercase text-[var(--accent-red)]">Call to Action</div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 text-center">
              <a
                href="https://twitter.com/intent/tweet"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--ink)] text-white text-[11px] font-bold uppercase tracking-wider hover:opacity-90 transition-opacity"
              >
                Share on X <ArrowUpRight size={12} />
              </a>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--line)] py-12 px-6 md:px-8 max-w-[1440px] mx-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Fingerprint size={12} className="text-[var(--accent-red)]" />
            <span className="text-[10px] tracking-[0.12em] uppercase text-[var(--ink-50)]">Sovereign OS Labs &middot; 2026</span>
          </div>
          <div className="text-[10px] tracking-[0.08em] uppercase text-[var(--ink-50)]">
            Exploring the infrastructure for autonomous machine economies.
          </div>
        </div>
      </footer>
    </div>
  );
}
