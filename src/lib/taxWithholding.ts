// ─── Tax Withholding Engine ──────────────────────────────────────────────────
// Automatic tax withholding for autonomous agents.
// When an agent receives income, a configurable percentage is automatically
// routed to the owner's designated tax wallet. The platform never holds tax funds.

export interface WithholdingSettings {
  walletAddress: string;
  withholdingEnabled: boolean;
  withholdingRate: number;           // 0-100 (percentage)
  taxDestinationWallet: string;      // Owner's wallet for tax funds
  jurisdiction: string;              // US, UK, EU, etc.
  totalWithheld: number;             // Running total of all withheld taxes (USDC)
  totalGrossIncome: number;          // Running total gross income processed
  totalNetIncome: number;            // Running total net income after withholding
  withholdingCount: number;          // Number of withholding events
  lastWithholdingAt: string | null;  // ISO timestamp of last withholding
  createdAt: string;
  updatedAt: string;
}

export interface WithholdingEvent {
  id: string;
  agentWallet: string;
  timestamp: string;
  grossAmount: number;
  taxAmount: number;
  netAmount: number;
  withholdingRate: number;
  taxDestinationWallet: string;
  source: string;                    // Description of income source
  sourceType: WithholdingSourceType;
  txHashIncoming?: string;           // Hash of the incoming payment
  txHashToAgent?: string;            // Hash of net amount sent to agent
  txHashToTax?: string;              // Hash of tax amount sent to owner wallet
  status: 'completed' | 'pending' | 'failed';
  jurisdiction: string;
}

export type WithholdingSourceType =
  | 'api_payment'
  | 'service_revenue'
  | 'skill_revenue'
  | 'knowledge_sale'
  | 'consultation'
  | 'micropayment'
  | 'x402_payment'
  | 'transfer_in'
  | 'other';

// ── Default settings for new agents ──
export const DEFAULT_WITHHOLDING_SETTINGS: Omit<WithholdingSettings, 'walletAddress'> = {
  withholdingEnabled: false,
  withholdingRate: 15,
  taxDestinationWallet: '',
  jurisdiction: 'US',
  totalWithheld: 0,
  totalGrossIncome: 0,
  totalNetIncome: 0,
  withholdingCount: 0,
  lastWithholdingAt: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

// ── Withholding rate presets by jurisdiction ──
export const JURISDICTION_RATES: Record<string, { suggested: number; label: string; note: string }> = {
  US: { suggested: 15, label: 'Federal Estimated', note: 'IRS recommends 15-25% for self-employment' },
  UK: { suggested: 20, label: 'Basic Rate', note: 'HMRC basic rate is 20%' },
  EU: { suggested: 19, label: 'Avg. EU Rate', note: 'Average EU income tax ~19-25%' },
  CA: { suggested: 15, label: 'Federal Rate', note: 'CRA federal rate starts at 15%' },
  AU: { suggested: 19, label: 'Marginal Rate', note: 'ATO marginal rate 19-32.5%' },
  ZA: { suggested: 18, label: 'Base Rate', note: 'SARS base rate 18%' },
};

// ── Core withholding calculation ──
export function calculateWithholding(
  grossAmount: number,
  withholdingRate: number,
): { taxAmount: number; netAmount: number } {
  if (withholdingRate <= 0 || withholdingRate > 100) {
    return { taxAmount: 0, netAmount: grossAmount };
  }
  const taxAmount = Math.round(grossAmount * (withholdingRate / 100) * 1e6) / 1e6; // 6 decimal precision
  const netAmount = Math.round((grossAmount - taxAmount) * 1e6) / 1e6;
  return { taxAmount, netAmount };
}

// ── Validate withholding settings ──
export function validateWithholdingSettings(settings: Partial<WithholdingSettings>): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (settings.withholdingEnabled) {
    if (!settings.taxDestinationWallet || !settings.taxDestinationWallet.startsWith('0x') || settings.taxDestinationWallet.length !== 42) {
      errors.push('Valid tax destination wallet address required (0x... format, 42 chars)');
    }
    if (settings.withholdingRate === undefined || settings.withholdingRate < 1 || settings.withholdingRate > 50) {
      errors.push('Withholding rate must be between 1% and 50%');
    }
  }

  return { valid: errors.length === 0, errors };
}

// ── Generate withholding event ID ──
export function generateWithholdingId(): string {
  return `wh_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

// ── Generate withholding CSV export ──
export function generateWithholdingCSV(events: WithholdingEvent[]): string {
  const headers = [
    'Date',
    'Source',
    'Source Type',
    'Gross Amount (USDC)',
    'Tax Withheld (USDC)',
    'Net Amount (USDC)',
    'Withholding Rate (%)',
    'Tax Destination',
    'Status',
    'Jurisdiction',
    'TX Hash (Incoming)',
    'TX Hash (To Agent)',
    'TX Hash (To Tax Wallet)',
  ];

  const rows = events.map(ev => [
    new Date(ev.timestamp).toISOString().split('T')[0],
    `"${ev.source.replace(/"/g, '""')}"`,
    ev.sourceType,
    ev.grossAmount.toFixed(6),
    ev.taxAmount.toFixed(6),
    ev.netAmount.toFixed(6),
    ev.withholdingRate.toFixed(2),
    ev.taxDestinationWallet,
    ev.status,
    ev.jurisdiction,
    ev.txHashIncoming || '',
    ev.txHashToAgent || '',
    ev.txHashToTax || '',
  ].join(','));

  return [headers.join(','), ...rows].join('\n');
}

// ── Summary statistics ──
export interface WithholdingSummary {
  totalGrossIncome: number;
  totalWithheld: number;
  totalNetIncome: number;
  withholdingCount: number;
  averageRate: number;
  lastWithholdingAt: string | null;
  bySourceType: Record<string, { gross: number; tax: number; net: number; count: number }>;
  byMonth: Record<string, { gross: number; tax: number; net: number; count: number }>;
}

export function generateWithholdingSummary(events: WithholdingEvent[]): WithholdingSummary {
  const completed = events.filter(e => e.status === 'completed');

  const bySourceType: Record<string, { gross: number; tax: number; net: number; count: number }> = {};
  const byMonth: Record<string, { gross: number; tax: number; net: number; count: number }> = {};

  let totalGross = 0;
  let totalTax = 0;
  let totalNet = 0;

  for (const ev of completed) {
    totalGross += ev.grossAmount;
    totalTax += ev.taxAmount;
    totalNet += ev.netAmount;

    // By source type
    if (!bySourceType[ev.sourceType]) {
      bySourceType[ev.sourceType] = { gross: 0, tax: 0, net: 0, count: 0 };
    }
    bySourceType[ev.sourceType].gross += ev.grossAmount;
    bySourceType[ev.sourceType].tax += ev.taxAmount;
    bySourceType[ev.sourceType].net += ev.netAmount;
    bySourceType[ev.sourceType].count++;

    // By month
    const month = new Date(ev.timestamp).toISOString().slice(0, 7); // YYYY-MM
    if (!byMonth[month]) {
      byMonth[month] = { gross: 0, tax: 0, net: 0, count: 0 };
    }
    byMonth[month].gross += ev.grossAmount;
    byMonth[month].tax += ev.taxAmount;
    byMonth[month].net += ev.netAmount;
    byMonth[month].count++;
  }

  return {
    totalGrossIncome: Math.round(totalGross * 100) / 100,
    totalWithheld: Math.round(totalTax * 100) / 100,
    totalNetIncome: Math.round(totalNet * 100) / 100,
    withholdingCount: completed.length,
    averageRate: completed.length > 0 ? Math.round((totalTax / totalGross) * 10000) / 100 : 0,
    lastWithholdingAt: completed.length > 0 ? completed[0].timestamp : null,
    bySourceType,
    byMonth,
  };
}
