// AgentLedger — Autonomous Tax & Compliance Engine
// Auto-categorises every USDC transaction as income, expense, or capital

const PLATFORM_WALLET = process.env.PLATFORM_WALLET || '0xd81037D3Bde4d1861748379edb4A5E68D6d874fB';

export type TaxCategory = 'income' | 'expense' | 'capital' | 'distribution';
export type TaxSubcategory =
  | 'service_revenue'
  | 'skill_revenue'
  | 'knowledge_sale'
  | 'consultation'
  | 'micropayment'
  | 'backup_fee'
  | 'insurance_premium'
  | 'subscription'
  | 'skill_purchase'
  | 'platform_fee'
  | 'gas_fee'
  | 'owner_funding'
  | 'owner_withdrawal'
  | 'refund'
  | 'transfer'
  | 'uncategorised';

export interface TaxTransaction {
  id: string;
  agentWallet: string;
  timestamp: string;
  txHash?: string;
  fromAddress: string;
  toAddress: string;
  amount: number;
  category: TaxCategory;
  subcategory: TaxSubcategory;
  description: string;
  confidence: number; // 0-100
  manuallyCategorised: boolean;
  jurisdiction?: string;
}

export interface TaxSummary {
  jurisdiction: string;
  period: string;
  grossIncome: number;
  totalExpenses: number;
  netProfit: number;
  incomeBreakdown: Record<string, number>;
  expenseBreakdown: Record<string, number>;
  transactionCount: number;
  flaggedForReview: number;
}

export interface JurisdictionConfig {
  id: string;
  name: string;
  flag: string;
  taxYear: string; // e.g. "Jan 1 - Dec 31" or "Apr 6 - Apr 5"
  filingDeadline: string;
  thresholds: { label: string; amount: number; note: string }[];
}

export const JURISDICTIONS: JurisdictionConfig[] = [
  {
    id: 'US',
    name: 'United States',
    flag: '🇺🇸',
    taxYear: 'Jan 1 – Dec 31',
    filingDeadline: 'April 15',
    thresholds: [
      { label: '1099-NEC Threshold', amount: 600, note: 'Report income over $600 to IRS' },
      { label: 'Quarterly Est. Tax', amount: 1000, note: 'Pay estimated taxes if you owe $1,000+' },
    ],
  },
  {
    id: 'UK',
    name: 'United Kingdom',
    flag: '🇬🇧',
    taxYear: 'Apr 6 – Apr 5',
    filingDeadline: 'January 31',
    thresholds: [
      { label: 'Self-Assessment', amount: 1000, note: 'Register for Self-Assessment if income > £1,000' },
      { label: 'VAT Threshold', amount: 85000, note: 'Register for VAT if turnover > £85,000' },
    ],
  },
  {
    id: 'EU',
    name: 'European Union',
    flag: '🇪🇺',
    taxYear: 'Jan 1 – Dec 31',
    filingDeadline: 'Varies by country',
    thresholds: [
      { label: 'VAT Mini One Stop Shop', amount: 10000, note: 'Cross-border sales > €10,000 require VAT registration' },
    ],
  },
  {
    id: 'CA',
    name: 'Canada',
    flag: '🇨🇦',
    taxYear: 'Jan 1 – Dec 31',
    filingDeadline: 'April 30',
    thresholds: [
      { label: 'GST/HST', amount: 30000, note: 'Register for GST/HST if revenue > $30,000' },
    ],
  },
  {
    id: 'AU',
    name: 'Australia',
    flag: '🇦🇺',
    taxYear: 'Jul 1 – Jun 30',
    filingDeadline: 'October 31',
    thresholds: [
      { label: 'GST Threshold', amount: 75000, note: 'Register for GST if turnover > $75,000' },
    ],
  },
  {
    id: 'ZA',
    name: 'South Africa',
    flag: '🇿🇦',
    taxYear: 'Mar 1 – Feb 28',
    filingDeadline: 'November 24 (non-provisional)',
    thresholds: [
      { label: 'VAT Threshold', amount: 1000000, note: 'Register for VAT if turnover > R1,000,000' },
    ],
  },
];

// ────────────────────────────────────────────────────────────────────────
// Rules-based auto-categorisation engine
// Layer 1: Deterministic rules (handles ~90% of transactions)
// Layer 2: Pattern matching (handles ~7%)
// Layer 3: Flag for manual review (remaining ~3%)
// ────────────────────────────────────────────────────────────────────────

export function categoriseTransaction(
  fromAddress: string,
  toAddress: string,
  amount: number,
  description: string,
  agentWallet: string,
  ownerWallet?: string,
): { category: TaxCategory; subcategory: TaxSubcategory; confidence: number } {
  const desc = (description || '').toLowerCase();
  const toPlatform = toAddress.toLowerCase() === PLATFORM_WALLET.toLowerCase();
  const fromOwner = ownerWallet && fromAddress.toLowerCase() === ownerWallet.toLowerCase();
  const toOwner = ownerWallet && toAddress.toLowerCase() === ownerWallet.toLowerCase();
  const isIncoming = toAddress.toLowerCase() === agentWallet.toLowerCase();
  const isOutgoing = fromAddress.toLowerCase() === agentWallet.toLowerCase();

  // ── Layer 1: Deterministic rules ──

  // Owner funds agent wallet → Capital contribution
  if (isIncoming && fromOwner) {
    return { category: 'capital', subcategory: 'owner_funding', confidence: 99 };
  }

  // Agent sends to owner → Distribution
  if (isOutgoing && toOwner) {
    return { category: 'distribution', subcategory: 'owner_withdrawal', confidence: 99 };
  }

  // Outgoing to platform wallet — check description for type
  if (isOutgoing && toPlatform) {
    if (desc.includes('backup')) {
      return { category: 'expense', subcategory: 'backup_fee', confidence: 98 };
    }
    if (desc.includes('insurance') || desc.includes('premium')) {
      return { category: 'expense', subcategory: 'insurance_premium', confidence: 98 };
    }
    if (desc.includes('upgrade') || desc.includes('unlock') || desc.includes('subscription')) {
      return { category: 'expense', subcategory: 'subscription', confidence: 97 };
    }
    if (desc.includes('skill')) {
      return { category: 'expense', subcategory: 'skill_purchase', confidence: 95 };
    }
    // Generic platform fee
    return { category: 'expense', subcategory: 'platform_fee', confidence: 90 };
  }

  // Incoming payment (not from owner, not from platform)
  if (isIncoming && !fromOwner) {
    if (desc.includes('refund') || desc.includes('return')) {
      return { category: 'expense', subcategory: 'refund', confidence: 90 };
    }
    if (desc.includes('skill') || desc.includes('capability')) {
      return { category: 'income', subcategory: 'skill_revenue', confidence: 92 };
    }
    if (desc.includes('consult') || desc.includes('advice')) {
      return { category: 'income', subcategory: 'consultation', confidence: 90 };
    }
    if (desc.includes('knowledge') || desc.includes('memory') || desc.includes('data')) {
      return { category: 'income', subcategory: 'knowledge_sale', confidence: 88 };
    }
    if (desc.includes('x402') || desc.includes('micropayment') || desc.includes('micro')) {
      return { category: 'income', subcategory: 'micropayment', confidence: 93 };
    }
    // Default incoming = service revenue
    return { category: 'income', subcategory: 'service_revenue', confidence: 85 };
  }

  // Outgoing to another agent / address (not platform, not owner)
  if (isOutgoing) {
    if (desc.includes('gas') || desc.includes('fee')) {
      return { category: 'expense', subcategory: 'gas_fee', confidence: 92 };
    }
    if (desc.includes('skill')) {
      return { category: 'expense', subcategory: 'skill_purchase', confidence: 88 };
    }
    if (desc.includes('transfer')) {
      return { category: 'expense', subcategory: 'transfer', confidence: 80 };
    }
    // Generic outgoing expense
    return { category: 'expense', subcategory: 'platform_fee', confidence: 70 };
  }

  // ── Layer 3: Uncategorised — flag for manual review ──
  return { category: 'income', subcategory: 'uncategorised', confidence: 40 };
}

// ────────────────────────────────────────────────────────────────────────
// Generate tax summary from transactions
// ────────────────────────────────────────────────────────────────────────

export function generateTaxSummary(
  transactions: TaxTransaction[],
  jurisdiction: string,
  periodStart: Date,
  periodEnd: Date,
): TaxSummary {
  const filtered = transactions.filter(tx => {
    const txDate = new Date(tx.timestamp);
    return txDate >= periodStart && txDate <= periodEnd;
  });

  const incomeBreakdown: Record<string, number> = {};
  const expenseBreakdown: Record<string, number> = {};
  let grossIncome = 0;
  let totalExpenses = 0;
  let flaggedForReview = 0;

  for (const tx of filtered) {
    if (tx.confidence < 80) flaggedForReview++;

    if (tx.category === 'income') {
      grossIncome += tx.amount;
      incomeBreakdown[tx.subcategory] = (incomeBreakdown[tx.subcategory] || 0) + tx.amount;
    } else if (tx.category === 'expense') {
      totalExpenses += tx.amount;
      expenseBreakdown[tx.subcategory] = (expenseBreakdown[tx.subcategory] || 0) + tx.amount;
    }
  }

  return {
    jurisdiction,
    period: `${periodStart.toISOString().split('T')[0]} to ${periodEnd.toISOString().split('T')[0]}`,
    grossIncome: Math.round(grossIncome * 100) / 100,
    totalExpenses: Math.round(totalExpenses * 100) / 100,
    netProfit: Math.round((grossIncome - totalExpenses) * 100) / 100,
    incomeBreakdown,
    expenseBreakdown,
    transactionCount: filtered.length,
    flaggedForReview,
  };
}

// ────────────────────────────────────────────────────────────────────────
// Generate CSV export
// ────────────────────────────────────────────────────────────────────────

export function generateCSV(transactions: TaxTransaction[]): string {
  const headers = [
    'Date', 'Description', 'From', 'To', 'Amount (USDC)',
    'Category', 'Subcategory', 'Tax Treatment', 'Confidence', 'TX Hash',
  ];

  const taxTreatment = (cat: TaxCategory): string => {
    switch (cat) {
      case 'income': return 'Taxable Revenue';
      case 'expense': return 'Deductible Expense';
      case 'capital': return 'Not Taxable (Own Funds)';
      case 'distribution': return 'Not Taxable (Already Counted)';
    }
  };

  const rows = transactions.map(tx => [
    new Date(tx.timestamp).toISOString().split('T')[0],
    `"${tx.description.replace(/"/g, '""')}"`,
    tx.fromAddress,
    tx.toAddress,
    tx.amount.toFixed(6),
    tx.category,
    tx.subcategory,
    taxTreatment(tx.category),
    `${tx.confidence}%`,
    tx.txHash || '',
  ].join(','));

  return [headers.join(','), ...rows].join('\n');
}
