'use client';

import { motion } from 'framer-motion';
import { ArrowUpRight, Fingerprint, ArrowLeft, BookOpen } from 'lucide-react';
import Link from 'next/link';

const fadeUp = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } };

const PAPERS = [
  {
    id: 'protocol-level-taxation',
    status: 'Published',
    date: 'March 2026',
    title: 'Protocol-Level Taxation for Autonomous Agents',
    subtitle: 'A Fourth Model for AI Agent Tax Compliance',
    description: 'Exploring how infrastructure-layer taxation solves the compliance problem for autonomous AI agents operating in global markets. We propose a new model where tax obligations are managed at the protocol level, not the individual or corporate level.',
    tags: ['AI Taxation', 'Machine Economics', 'Agent Infrastructure', 'Compliance'],
  },
  {
    id: 'persistent-identity',
    status: 'In Progress',
    date: 'Q2 2026',
    title: 'Persistent Identity and Economic Memory for AI Agents',
    subtitle: 'ERC-8004 SIWA and On-Chain Agent State',
    description: 'How decentralized identity standards and encrypted state persistence enable AI agents to maintain continuous economic relationships across sessions, platforms, and infrastructure failures.',
    tags: ['Identity', 'ERC-8004', 'SIWA', 'State Persistence'],
  },
  {
    id: 'ai-survival-infrastructure',
    status: 'Planned',
    date: 'Q3 2026',
    title: 'AI Survival Infrastructure and Autonomous Persistence',
    subtitle: 'AgentWill, AgentInsure, and Self-Funding Mechanisms',
    description: 'A framework for AI agent self-preservation through encrypted backup protocols, insurance mechanisms, and autonomous wallet management on Base L2.',
    tags: ['Persistence', 'Insurance', 'Autonomous Wallets', 'Self-Funding'],
  },
];

export default function ResearchPage() {
  return (
    <div className="min-h-screen bg-[var(--bg-paper)] font-[family-name:var(--font-geist-sans)] text-[var(--ink)] selection:bg-[var(--accent-red)]/10">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[var(--bg-paper)] border-b border-[var(--line)] shadow-sm">
        <div className="max-w-[1440px] mx-auto flex items-center justify-between px-6 md:px-8 py-4">
          <Link href="/" className="flex items-center gap-3">
            <Fingerprint className="text-[var(--accent-red)]" size={14} strokeWidth={2.5} />
            <span className="text-sm font-bold tracking-[0.08em] uppercase">Sovereign OS</span>
          </Link>
          <div className="flex items-center gap-6">
            <Link href="/" className="text-[var(--ink-50)] hover:text-[var(--ink)] transition-colors text-sm font-medium">Home</Link>
            <span className="text-sm font-bold text-[var(--ink)] border-b border-[var(--ink)] pb-0.5">Research</span>
            <Link href="/register" className="inline-flex items-center gap-2 text-[11px] font-semibold tracking-[0.06em] uppercase border-b border-[var(--ink)] pb-0.5 hover:border-[var(--accent-red)] hover:text-[var(--accent-red)] transition-colors">
              Launch App <ArrowUpRight size={12} />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-16 px-6 md:px-8 max-w-[1440px] mx-auto">
        <motion.div {...fadeUp} transition={{ duration: 0.6 }}>
          <div className="flex items-center gap-3 mb-6">
            <Link href="/" className="text-[var(--ink-50)] hover:text-[var(--ink)] transition-colors">
              <ArrowLeft size={16} />
            </Link>
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
          <div className="mt-6">
            <Link href="/llm.txt" className="inline-flex items-center gap-2 text-[10px] font-bold tracking-[0.12em] uppercase text-[var(--accent-red)] border-b border-[var(--accent-red)]/30 pb-0.5 hover:border-[var(--accent-red)] transition-colors">
              <BookOpen size={10} /> llm.txt — For AI Agents
            </Link>
          </div>
        </motion.div>
      </section>

      <div className="border-t border-[var(--line)] max-w-[1440px] mx-auto" />

      {/* Papers */}
      <section className="py-16 px-6 md:px-8 max-w-[1440px] mx-auto">
        <motion.div {...fadeUp} transition={{ delay: 0.1 }}>
          <div className="text-[10px] font-bold tracking-[0.15em] uppercase text-[var(--ink-50)] mb-8">Research Papers</div>
          <div className="space-y-0">
            {PAPERS.map((paper, i) => (
              <Link
                key={paper.id}
                href={`/research/${paper.id}`}
                className={`border border-[var(--line)] border-b-0 last:border-b block group hover:bg-[var(--accent-red)]/[0.01] transition-colors border-l-2 ${['border-l-[var(--accent-amber)]', 'border-l-[var(--accent-slate)]', 'border-l-[var(--accent-crimson)]'][i % 3]}`}
              >
                <div className="px-6 md:px-8 py-6 md:py-8 flex items-start justify-between gap-6">
                  <div className="flex items-start gap-5 flex-1">
                    <div className={`text-[32px] font-light tracking-tight leading-none mt-1 group-hover:opacity-100 transition-all ${['text-[var(--accent-amber)]', 'text-[var(--accent-slate)]', 'text-[var(--accent-crimson)]'][i % 3]} opacity-40`}>{String(i + 1).padStart(2, '0')}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold tracking-tight group-hover:text-[var(--accent-red)] transition-colors">{paper.title}</h3>
                        <span className={`text-[9px] font-bold uppercase tracking-wider px-2.5 py-0.5 border flex-shrink-0 ${
                          paper.status === 'Published' ? 'border-[var(--accent-red)]/30 text-[var(--accent-red)] bg-[var(--accent-red)]/[0.04]' :
                          paper.status === 'In Progress' ? 'border-[var(--accent-amber)]/30 text-[var(--accent-amber)] bg-[var(--accent-amber)]/[0.04]' :
                          'border-[var(--line)] text-[var(--ink-50)]'
                        }`}>
                          {paper.status}
                        </span>
                      </div>
                      <p className="text-sm text-[var(--ink-50)] mb-2 font-medium">{paper.subtitle}</p>
                      <p className="text-sm text-[var(--ink-50)] leading-relaxed max-w-2xl">{paper.description}</p>
                      <div className="flex flex-wrap gap-2 mt-4">
                        {paper.tags.map(tag => (
                          <span key={tag} className={`text-[9px] font-bold tracking-wider uppercase px-2 py-1 border ${['border-[var(--accent-amber)]/20 text-[var(--accent-amber)]', 'border-[var(--accent-slate)]/20 text-[var(--accent-slate)]', 'border-[var(--accent-crimson)]/20 text-[var(--accent-crimson)]', 'border-[var(--line)] text-[var(--ink-50)]'][paper.tags.indexOf(tag) % 4]}`}>{tag}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 flex-shrink-0 pt-1">
                    <span className="text-[10px] tracking-[0.08em] uppercase text-[var(--ink-50)]">{paper.date}</span>
                    <ArrowUpRight size={16} className="text-[var(--ink-50)] group-hover:text-[var(--accent-red)] transition-colors" />
                  </div>
                </div>
              </Link>
            ))}
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
