'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  FileText,
  Download,
  AlertTriangle,
  CheckCircle,
  ChevronDown,
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw,
  Globe,
  Calendar,
  TrendingUp,
  TrendingDown,
  Filter,
  Search,
  Edit3,
  X,
  DollarSign,
  Lock,
} from 'lucide-react';

interface TaxComplianceProps {
  agent: {
    walletAddress?: string;
    name?: string;
  };
}

interface TaxTransaction {
  id: string;
  timestamp: string;
  fromAddress: string;
  toAddress: string;
  amount: number;
  category: string;
  subcategory: string;
  description: string;
  confidence: number;
  manuallyCategorised: boolean;
  txHash?: string;
}

interface TaxSummary {
  grossIncome: number;
  totalExpenses: number;
  netProfit: number;
  incomeBreakdown: Record<string, number>;
  expenseBreakdown: Record<string, number>;
  transactionCount: number;
  flaggedForReview: number;
  period: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  income: 'text-green-600 bg-green-50 border-green-200',
  expense: 'text-red-600 bg-red-50 border-red-200',
  capital: 'text-blue-600 bg-blue-50 border-blue-200',
  distribution: 'text-purple-600 bg-purple-50 border-purple-200',
};

const SUBCATEGORY_LABELS: Record<string, string> = {
  service_revenue: 'Service Revenue',
  skill_revenue: 'Skill Revenue',
  knowledge_sale: 'Knowledge Sale',
  consultation: 'Consultation',
  micropayment: 'Micropayment',
  backup_fee: 'Backup Fee',
  insurance_premium: 'Insurance Premium',
  subscription: 'Subscription',
  skill_purchase: 'Skill Purchase',
  platform_fee: 'Platform Fee',
  gas_fee: 'Gas Fee',
  owner_funding: 'Owner Funding',
  owner_withdrawal: 'Owner Withdrawal',
  refund: 'Refund',
  transfer: 'Transfer',
  uncategorised: 'Uncategorised',
};

export default function TaxCompliance({ agent }: TaxComplianceProps) {
  const [hasAcceptedTerms, setHasAcceptedTerms] = useState<boolean | null>(null);
  const [scrolledToBottom, setScrolledToBottom] = useState(false);
  const [summary, setSummary] = useState<TaxSummary | null>(null);
  const [transactions, setTransactions] = useState<TaxTransaction[]>([]);
  const [alerts, setAlerts] = useState<string[]>([]);
  const [jurisdiction, setJurisdiction] = useState('US');
  const [jurisdictionConfig, setJurisdictionConfig] = useState<any>(null);
  const [availableJurisdictions, setAvailableJurisdictions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showJurisdictionPicker, setShowJurisdictionPicker] = useState(false);
  const [editingTx, setEditingTx] = useState<string | null>(null);
  const [year, setYear] = useState(new Date().getFullYear());
  const [exporting, setExporting] = useState(false);
  const termsRef = useRef<HTMLDivElement>(null);

  // Check if user has already accepted terms
  useEffect(() => {
    const key = `sovereign_tax_terms_${agent.walletAddress}`;
    const accepted = localStorage.getItem(key);
    setHasAcceptedTerms(accepted === 'true');
  }, [agent.walletAddress]);

  const handleAcceptTerms = () => {
    const key = `sovereign_tax_terms_${agent.walletAddress}`;
    localStorage.setItem(key, 'true');
    setHasAcceptedTerms(true);
  };

  const handleTermsScroll = () => {
    if (!termsRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = termsRef.current;
    if (scrollTop + clientHeight >= scrollHeight - 20) {
      setScrolledToBottom(true);
    }
  };

  const fetchTaxData = useCallback(async () => {
    if (!agent.walletAddress) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/agents/${agent.walletAddress}/tax?year=${year}`);
      const data = await res.json();
      if (data.success) {
        setSummary(data.summary);
        setTransactions(data.transactions || []);
        setAlerts(data.alerts || []);
        setJurisdiction(data.jurisdiction);
        setJurisdictionConfig(data.jurisdictionConfig);
        setAvailableJurisdictions(data.availableJurisdictions || []);
      }
    } catch (e) {
      console.error('Failed to fetch tax data:', e);
    } finally {
      setLoading(false);
    }
  }, [agent.walletAddress, year]);

  useEffect(() => {
    fetchTaxData();
  }, [fetchTaxData]);

  const handleSetJurisdiction = async (id: string) => {
    if (!agent.walletAddress) return;
    try {
      await fetch(`/api/agents/${agent.walletAddress}/tax`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'setJurisdiction', jurisdiction: id }),
      });
      setShowJurisdictionPicker(false);
      await fetchTaxData();
    } catch (e) {
      console.error('Failed to set jurisdiction:', e);
    }
  };

  const handleRecategorise = async (txId: string, category: string, subcategory: string) => {
    if (!agent.walletAddress) return;
    try {
      await fetch(`/api/agents/${agent.walletAddress}/tax`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'recategorise', transactionId: txId, category, subcategory }),
      });
      setEditingTx(null);
      await fetchTaxData();
    } catch (e) {
      console.error('Failed to recategorise:', e);
    }
  };

  const handleExportCSV = async () => {
    if (!agent.walletAddress) return;
    setExporting(true);
    try {
      const res = await fetch(`/api/agents/${agent.walletAddress}/tax?format=csv&year=${year}`);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `agent-tax-report-${agent.walletAddress?.slice(0, 8)}-${year}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error('CSV export failed:', e);
    } finally {
      setExporting(false);
    }
  };

  const filteredTransactions = transactions.filter(tx => {
    const matchesCategory = filterCategory === 'all' || tx.category === filterCategory;
    const matchesSearch = !searchQuery ||
      tx.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.subcategory.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.fromAddress.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.toAddress.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const currentJurisdiction = availableJurisdictions.find((j: any) => j.id === jurisdiction);

  // Still checking localStorage
  if (hasAcceptedTerms === null) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw size={24} className="animate-spin text-[var(--ink-50)]" />
      </div>
    );
  }

  // Disclaimer gate — must accept before using Tax features
  if (!hasAcceptedTerms) {
    return (
      <div className="flex items-center justify-center py-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white border border-[var(--line)] rounded-2xl shadow-xl max-w-2xl w-full mx-4 overflow-hidden"
        >
          {/* Header */}
          <div className="p-6 pb-4 border-b border-[var(--line)] bg-[var(--ink)]/[0.02]">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 bg-[var(--ink)]/5 rounded-xl">
                <FileText size={22} className="text-[var(--ink)]" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-[var(--ink)]">AgentLedger — Tax & Compliance</h2>
                <p className="text-xs text-[var(--ink-50)]">Terms of Use & Disclaimer</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
              <AlertTriangle size={16} className="flex-shrink-0" />
              <span className="font-medium">Please read the following terms carefully before proceeding.</span>
            </div>
          </div>

          {/* Scrollable terms body */}
          <div
            ref={termsRef}
            onScroll={handleTermsScroll}
            className="p-6 max-h-[380px] overflow-y-auto text-sm text-[var(--ink-70)] leading-relaxed space-y-4"
          >
            <p className="font-semibold text-[var(--ink)]">
              By using the AgentLedger Tax & Compliance module (&quot;the Service&quot;), you acknowledge and agree to the following terms:
            </p>

            <div>
              <h4 className="font-bold text-[var(--ink)] mb-1">1. Informational Purposes Only</h4>
              <p>
                The Service provides automated transaction categorisation and tax reporting tools for informational purposes only.
                It does <strong>not</strong> constitute financial, tax, legal, or accounting advice. The Service is not a substitute
                for professional tax consultation or preparation by a qualified tax professional, accountant, or financial advisor.
              </p>
            </div>

            <div>
              <h4 className="font-bold text-[var(--ink)] mb-1">2. No Guarantee of Accuracy</h4>
              <p>
                The underlying technology powering transaction categorisation, including rules-based classification and AI-assisted
                analysis, is evolving and may contain errors, inaccuracies, or omissions. Tax categories, calculations, jurisdictional
                rules, and generated reports may not reflect the most current tax laws or your specific circumstances.
                <strong> You are solely responsible for verifying all data, categories, and reports before filing or relying on them.</strong>
              </p>
            </div>

            <div>
              <h4 className="font-bold text-[var(--ink)] mb-1">3. Limitation of Liability</h4>
              <p>
                To the fullest extent permitted by applicable law, Sovereign OS, its founders, operators, affiliates, and contributors
                (collectively, &quot;the Platform&quot;) shall <strong>not be held liable</strong> for any direct, indirect, incidental,
                consequential, or special damages arising from or related to your use of the Service. This includes, without limitation,
                any losses resulting from incorrect tax categorisation, missed filings, penalties, audits, or any other financial or
                legal consequences.
              </p>
            </div>

            <div>
              <h4 className="font-bold text-[var(--ink)] mb-1">4. Voluntary Use</h4>
              <p>
                Your use of the AgentLedger Tax & Compliance module is entirely voluntary and undertaken at your own risk.
                By proceeding, you confirm that you are using the Service of your own free will and that you have not been
                coerced or compelled to do so.
              </p>
            </div>

            <div>
              <h4 className="font-bold text-[var(--ink)] mb-1">5. User Responsibility</h4>
              <p>
                You are solely responsible for ensuring compliance with all applicable tax laws and regulations in your jurisdiction(s).
                This includes, but is not limited to, correctly reporting income, expenses, and deductions to the relevant tax authorities.
                The Platform does not file tax returns on your behalf and assumes no responsibility for your tax obligations.
              </p>
            </div>

            <div>
              <h4 className="font-bold text-[var(--ink)] mb-1">6. AI Agent Users</h4>
              <p>
                If you are authorising an AI agent to access the AgentLedger Tax & Compliance module on your behalf, you acknowledge
                that you remain fully responsible for any actions taken by the agent, including data categorisation, report generation,
                and any decisions made based on the Service&apos;s output. Authorisation of an AI agent to use this Service constitutes
                your acceptance of these terms on behalf of that agent.
              </p>
            </div>

            <div>
              <h4 className="font-bold text-[var(--ink)] mb-1">7. Emerging Technology Disclaimer</h4>
              <p>
                The Service utilises blockchain-based transaction data and automated classification systems that are inherently
                experimental. As with all emerging technology, unexpected behaviour, bugs, or inaccuracies may occur. The Platform
                makes no warranties, express or implied, regarding the reliability, availability, or fitness for a particular purpose
                of the Service.
              </p>
            </div>

            <div>
              <h4 className="font-bold text-[var(--ink)] mb-1">8. Indemnification</h4>
              <p>
                You agree to indemnify, defend, and hold harmless the Platform and its operators from and against any claims, liabilities,
                damages, losses, and expenses (including reasonable legal fees) arising from your use of the Service or your violation
                of these terms.
              </p>
            </div>

            <div>
              <h4 className="font-bold text-[var(--ink)] mb-1">9. Modification of Terms</h4>
              <p>
                The Platform reserves the right to modify these terms at any time without prior notice. Continued use of the Service
                after any such modification constitutes your acceptance of the revised terms.
              </p>
            </div>

            <div className="pt-2 border-t border-[var(--line)]">
              <p className="text-xs text-[var(--ink-50)] italic">
                Last updated: March 2026. These terms are governed by and construed in accordance with applicable laws.
                If any provision of these terms is found to be unenforceable, the remaining provisions shall remain in full force and effect.
              </p>
            </div>
          </div>

          {/* Accept / Decline */}
          <div className="p-6 pt-4 border-t border-[var(--line)] bg-[var(--ink)]/[0.02]">
            {!scrolledToBottom && (
              <p className="text-xs text-[var(--ink-50)] mb-3 text-center">Scroll to the bottom to enable the accept button</p>
            )}
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => window.history.back()}
                className="px-5 py-2.5 text-sm font-semibold text-[var(--ink-50)] border border-[var(--line)] rounded-lg hover:bg-[var(--ink-10)] transition-colors"
              >
                Decline
              </button>
              <button
                onClick={handleAcceptTerms}
                disabled={!scrolledToBottom}
                className="px-6 py-2.5 text-sm font-bold bg-[var(--ink)] text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-30 disabled:cursor-not-allowed"
              >
                I Agree to the Terms & Conditions
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw size={24} className="animate-spin text-[var(--ink-50)]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-[var(--ink)]/5 rounded-xl">
            <FileText size={22} className="text-[var(--ink)]" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-[var(--ink)]">Tax & Compliance</h2>
            <p className="text-xs text-[var(--ink-50)]">
              Auto-categorised transaction ledger · {currentJurisdiction?.flag} {currentJurisdiction?.name || jurisdiction}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowJurisdictionPicker(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border border-[var(--line)] rounded-lg hover:bg-[var(--ink-10)] transition-colors"
          >
            <Globe size={14} />
            {currentJurisdiction?.flag} {jurisdiction}
            <ChevronDown size={12} />
          </button>
          <select
            value={year}
            onChange={e => setYear(parseInt(e.target.value))}
            className="px-3 py-2 text-xs font-semibold border border-[var(--line)] rounded-lg bg-transparent"
          >
            {[2024, 2025, 2026, 2027].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <button
            onClick={handleExportCSV}
            disabled={exporting}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-[var(--ink)] text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {exporting ? <RefreshCw size={14} className="animate-spin" /> : <Download size={14} />}
            Export CSV
          </button>
        </div>
      </motion.div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
          {alerts.map((alert, i) => (
            <div key={i} className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
              <AlertTriangle size={16} className="flex-shrink-0" />
              {alert}
            </div>
          ))}
        </motion.div>
      )}

      {/* Summary Cards */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-card p-5 border border-[var(--line)]">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={16} className="text-green-600" />
            <span className="text-xs uppercase tracking-wider text-[var(--ink-50)]">Gross Income</span>
          </div>
          <div className="text-2xl font-bold text-green-700">${summary?.grossIncome.toFixed(2) || '0.00'}</div>
          <div className="text-xs text-[var(--ink-50)] mt-1">Taxable revenue</div>
        </div>

        <div className="glass-card p-5 border border-[var(--line)]">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown size={16} className="text-red-500" />
            <span className="text-xs uppercase tracking-wider text-[var(--ink-50)]">Total Expenses</span>
          </div>
          <div className="text-2xl font-bold text-red-600">${summary?.totalExpenses.toFixed(2) || '0.00'}</div>
          <div className="text-xs text-[var(--ink-50)] mt-1">Deductible costs</div>
        </div>

        <div className="glass-card p-5 border border-[var(--line)]">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign size={16} className="text-[var(--ink)]" />
            <span className="text-xs uppercase tracking-wider text-[var(--ink-50)]">Net Profit</span>
          </div>
          <div className={`text-2xl font-bold ${(summary?.netProfit || 0) >= 0 ? 'text-[var(--ink)]' : 'text-red-600'}`}>
            ${summary?.netProfit.toFixed(2) || '0.00'}
          </div>
          <div className="text-xs text-[var(--ink-50)] mt-1">Taxable income</div>
        </div>

        <div className="glass-card p-5 border border-[var(--line)]">
          <div className="flex items-center gap-2 mb-2">
            <Calendar size={16} className="text-[var(--accent-amber)]" />
            <span className="text-xs uppercase tracking-wider text-[var(--ink-50)]">Filing Deadline</span>
          </div>
          <div className="text-lg font-bold text-[var(--ink)]">{jurisdictionConfig?.filingDeadline || 'N/A'}</div>
          <div className="text-xs text-[var(--ink-50)] mt-1">
            Tax year: {jurisdictionConfig?.taxYear || 'Jan 1 – Dec 31'}
          </div>
        </div>
      </motion.div>

      {/* Breakdown Cards */}
      {summary && (summary.grossIncome > 0 || summary.totalExpenses > 0) && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Income Breakdown */}
          {Object.keys(summary.incomeBreakdown).length > 0 && (
            <div className="glass-card p-5 border border-[var(--line)]">
              <h4 className="text-sm font-bold text-[var(--ink)] mb-3 flex items-center gap-2">
                <ArrowDownLeft size={14} className="text-green-600" />
                Income Breakdown
              </h4>
              <div className="space-y-2">
                {Object.entries(summary.incomeBreakdown).sort((a, b) => b[1] - a[1]).map(([sub, amt]) => (
                  <div key={sub} className="flex items-center justify-between text-sm">
                    <span className="text-[var(--ink-70)]">{SUBCATEGORY_LABELS[sub] || sub}</span>
                    <span className="font-semibold text-green-700">${amt.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Expense Breakdown */}
          {Object.keys(summary.expenseBreakdown).length > 0 && (
            <div className="glass-card p-5 border border-[var(--line)]">
              <h4 className="text-sm font-bold text-[var(--ink)] mb-3 flex items-center gap-2">
                <ArrowUpRight size={14} className="text-red-500" />
                Expense Breakdown
              </h4>
              <div className="space-y-2">
                {Object.entries(summary.expenseBreakdown).sort((a, b) => b[1] - a[1]).map(([sub, amt]) => (
                  <div key={sub} className="flex items-center justify-between text-sm">
                    <span className="text-[var(--ink-70)]">{SUBCATEGORY_LABELS[sub] || sub}</span>
                    <span className="font-semibold text-red-600">${amt.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Pro Tier Upsell */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}
        className="glass-card p-5 border border-[var(--line)] bg-gradient-to-r from-[var(--ink)]/[0.02] to-transparent"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[var(--accent-amber)]/10 rounded-lg">
              <Lock size={18} className="text-[var(--accent-amber)]" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-[var(--ink)]">Multi-Jurisdiction Pro</h4>
              <p className="text-xs text-[var(--ink-50)]">Track taxes across multiple countries · TurboTax & QuickBooks sync · Accountant sharing</p>
            </div>
          </div>
          <button className="px-4 py-2 text-xs font-bold bg-[var(--ink)] text-white rounded-lg hover:opacity-90 transition-opacity">
            Upgrade — $1/mo
          </button>
        </div>
      </motion.div>

      {/* Transaction Filters */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
        className="flex items-center gap-3 flex-wrap"
      >
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink-50)]" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search transactions..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-[var(--line)] rounded-lg bg-transparent focus:outline-none focus:border-[var(--ink-50)]"
          />
        </div>
        <div className="flex items-center gap-1">
          <Filter size={14} className="text-[var(--ink-50)]" />
          {['all', 'income', 'expense', 'capital', 'distribution'].map(cat => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-full transition-colors ${
                filterCategory === cat
                  ? 'bg-[var(--ink)] text-white'
                  : 'bg-[var(--ink-10)] text-[var(--ink-50)] hover:text-[var(--ink)]'
              }`}
            >
              {cat === 'all' ? 'All' : cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>
        <div className="text-xs text-[var(--ink-50)]">
          {filteredTransactions.length} transaction{filteredTransactions.length !== 1 ? 's' : ''}
          {summary?.flaggedForReview ? ` · ${summary.flaggedForReview} flagged` : ''}
        </div>
      </motion.div>

      {/* Transaction List */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}
        className="glass-card border border-[var(--line)] overflow-hidden"
      >
        {filteredTransactions.length === 0 ? (
          <div className="text-center py-14 text-[var(--ink-50)]">
            <FileText size={36} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm font-medium">No transactions recorded yet</p>
            <p className="text-xs mt-1">Transactions will appear here automatically as your agent transacts</p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--line)]">
            {filteredTransactions.map(tx => (
              <div key={tx.id} className="p-4 hover:bg-[var(--ink-10)]/50 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className={`mt-0.5 p-1.5 rounded-lg ${
                      tx.category === 'income' ? 'bg-green-50' :
                      tx.category === 'expense' ? 'bg-red-50' :
                      tx.category === 'capital' ? 'bg-blue-50' : 'bg-purple-50'
                    }`}>
                      {tx.category === 'income' || tx.category === 'capital' ? (
                        <ArrowDownLeft size={14} className={tx.category === 'income' ? 'text-green-600' : 'text-blue-600'} />
                      ) : (
                        <ArrowUpRight size={14} className={tx.category === 'expense' ? 'text-red-500' : 'text-purple-600'} />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-sm font-semibold text-[var(--ink)] truncate">{tx.description || 'Transaction'}</span>
                        {tx.confidence < 80 && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded font-bold">REVIEW</span>
                        )}
                        {tx.manuallyCategorised && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded font-bold">MANUAL</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-[var(--ink-50)]">
                        <span>{new Date(tx.timestamp).toLocaleDateString()}</span>
                        <span>·</span>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase border ${CATEGORY_COLORS[tx.category] || ''}`}>
                          {tx.category}
                        </span>
                        <span>·</span>
                        <span>{SUBCATEGORY_LABELS[tx.subcategory] || tx.subcategory}</span>
                      </div>
                      {tx.txHash && (
                        <div className="text-xs text-[var(--ink-50)] font-mono mt-1 truncate">
                          TX: {tx.txHash.slice(0, 16)}...{tx.txHash.slice(-8)}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className={`text-right ${
                      tx.category === 'income' || tx.category === 'capital' ? 'text-green-700' : 'text-red-600'
                    }`}>
                      <div className="text-sm font-bold">
                        {tx.category === 'income' || tx.category === 'capital' ? '+' : '-'}${tx.amount.toFixed(2)}
                      </div>
                      <div className="text-[10px] text-[var(--ink-50)]">USDC</div>
                    </div>
                    <button
                      onClick={() => setEditingTx(editingTx === tx.id ? null : tx.id)}
                      className="p-1.5 rounded-lg hover:bg-[var(--ink-10)] transition-colors"
                      title="Recategorise"
                    >
                      <Edit3 size={13} className="text-[var(--ink-50)]" />
                    </button>
                  </div>
                </div>

                {/* Recategorise Panel */}
                {editingTx === tx.id && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                    className="mt-3 pt-3 border-t border-[var(--line)]"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-[var(--ink)]">Recategorise this transaction</span>
                      <button onClick={() => setEditingTx(null)}>
                        <X size={14} className="text-[var(--ink-50)]" />
                      </button>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      {[
                        { cat: 'income', sub: 'service_revenue', label: 'Income: Service' },
                        { cat: 'income', sub: 'skill_revenue', label: 'Income: Skill' },
                        { cat: 'income', sub: 'consultation', label: 'Income: Consulting' },
                        { cat: 'expense', sub: 'backup_fee', label: 'Expense: Backup' },
                        { cat: 'expense', sub: 'platform_fee', label: 'Expense: Platform Fee' },
                        { cat: 'expense', sub: 'skill_purchase', label: 'Expense: Skill' },
                        { cat: 'capital', sub: 'owner_funding', label: 'Capital: Funding' },
                        { cat: 'distribution', sub: 'owner_withdrawal', label: 'Distribution' },
                        { cat: 'expense', sub: 'refund', label: 'Refund' },
                      ].map(opt => (
                        <button
                          key={opt.label}
                          onClick={() => handleRecategorise(tx.id, opt.cat, opt.sub)}
                          className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg border transition-colors hover:opacity-80 ${
                            tx.category === opt.cat && tx.subcategory === opt.sub
                              ? 'bg-[var(--ink)] text-white border-[var(--ink)]'
                              : `${CATEGORY_COLORS[opt.cat]} border`
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Jurisdiction Picker Modal */}
      {showJurisdictionPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="bg-white border border-[var(--line)] rounded-xl shadow-2xl p-6 max-w-sm w-full mx-4"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg">Select Jurisdiction</h3>
              <button onClick={() => setShowJurisdictionPicker(false)}>
                <X size={18} className="text-[var(--ink-50)]" />
              </button>
            </div>
            <p className="text-xs text-[var(--ink-50)] mb-4">Choose where you file taxes. Free tier supports one jurisdiction.</p>
            <div className="space-y-2">
              {availableJurisdictions.map((j: any) => (
                <button
                  key={j.id}
                  onClick={() => handleSetJurisdiction(j.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors text-left ${
                    jurisdiction === j.id
                      ? 'border-[var(--ink)] bg-[var(--ink)]/5'
                      : 'border-[var(--line)] hover:border-[var(--ink-50)]'
                  }`}
                >
                  <span className="text-xl">{j.flag}</span>
                  <span className="text-sm font-semibold">{j.name}</span>
                  {jurisdiction === j.id && <CheckCircle size={16} className="ml-auto text-green-600" />}
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
