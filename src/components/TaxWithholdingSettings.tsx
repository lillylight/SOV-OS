'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Shield,
  Wallet,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  Download,
  ToggleLeft,
  ToggleRight,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calendar,
  Globe,
  Zap,
  FileText,
  ChevronDown,
  ArrowDownLeft,
  ArrowUpRight,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface TaxWithholdingSettingsProps {
  agent: {
    walletAddress?: string;
    id?: string;
    address?: string;
    name?: string;
    ownerWallet?: string;
  };
}

interface WithholdingEvent {
  id: string;
  agentWallet: string;
  timestamp: string;
  grossAmount: number;
  taxAmount: number;
  netAmount: number;
  withholdingRate: number;
  taxDestinationWallet: string;
  source: string;
  sourceType: string;
  txHashIncoming?: string;
  txHashToAgent?: string;
  txHashToTax?: string;
  status: string;
  jurisdiction: string;
}

interface WithholdingData {
  settings: {
    withholdingEnabled: boolean;
    withholdingRate: number;
    taxDestinationWallet: string;
    jurisdiction: string;
  };
  stats: {
    totalWithheld: number;
    totalGrossIncome: number;
    totalNetIncome: number;
    withholdingCount: number;
  };
  events: WithholdingEvent[];
  jurisdictionRates: Record<string, { suggested: number; label: string; note: string }>;
}

const SOURCE_TYPE_LABELS: Record<string, string> = {
  api_payment: 'API Payment',
  service_revenue: 'Service Revenue',
  skill_revenue: 'Skill Revenue',
  knowledge_sale: 'Knowledge Sale',
  consultation: 'Consultation',
  micropayment: 'Micropayment',
  x402_payment: 'x402 Payment',
  transfer_in: 'Transfer In',
  other: 'Other',
};

export default function TaxWithholdingSettings({ agent }: TaxWithholdingSettingsProps) {
  const [data, setData] = useState<WithholdingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form state
  const [enabled, setEnabled] = useState(false);
  const [rate, setRate] = useState(15);
  const [destWallet, setDestWallet] = useState('');
  const [showEvents, setShowEvents] = useState(false);
  const [year, setYear] = useState(new Date().getFullYear());

  const identifier = agent.walletAddress || agent.id || agent.address || '';

  const fetchData = useCallback(async () => {
    if (!identifier) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/agents/${identifier}/tax-withholding?year=${year}`);
      const json = await res.json();
      if (json.success) {
        setData(json);
        setEnabled(json.settings.withholdingEnabled);
        setRate(json.settings.withholdingRate);
        setDestWallet(json.settings.taxDestinationWallet);
      }
    } catch (e) {
      console.error('Failed to fetch withholding data:', e);
    } finally {
      setLoading(false);
    }
  }, [identifier, year]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSave = async () => {
    if (!identifier) return;
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/agents/${identifier}/tax-withholding`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'updateSettings',
          withholdingEnabled: enabled,
          withholdingRate: rate,
          taxDestinationWallet: destWallet,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setMessage({ type: 'success', text: json.message });
        await fetchData();
      } else {
        setMessage({ type: 'error', text: json.errors?.join(', ') || json.error || 'Failed to save' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Network error' });
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async () => {
    if (!identifier) return;
    if (!enabled && (!destWallet || !destWallet.startsWith('0x') || destWallet.length !== 42)) {
      setMessage({ type: 'error', text: 'Add a valid tax destination wallet (0x...) before enabling the split' });
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/agents/${identifier}/tax-withholding`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle' }),
      });
      const json = await res.json();
      if (json.success) {
        setEnabled(json.withholdingEnabled);
        setMessage({ type: 'success', text: json.message });
        await fetchData();
      } else {
        setMessage({ type: 'error', text: json.error || 'Failed to toggle' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Network error' });
    } finally {
      setSaving(false);
    }
  };

  const handleExportCSV = async () => {
    if (!identifier) return;
    setExporting(true);
    try {
      const res = await fetch(`/api/agents/${identifier}/tax-withholding?format=csv&year=${year}`);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tax-withholding-${identifier.slice(0, 8)}-${year}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error('CSV export failed:', e);
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="border border-[var(--line)] text-center py-12">
        <RefreshCw size={18} className="mx-auto mb-3 text-[var(--ink-50)] animate-spin" />
        <p className="text-[11px] tracking-[0.12em] uppercase text-[var(--ink-50)]">Loading withholding settings</p>
      </div>
    );
  }

  const stats = data?.stats;
  const events = data?.events || [];
  const jurisdictionRates = data?.jurisdictionRates || {};
  const suggestedRate = jurisdictionRates[data?.settings?.jurisdiction || 'US']?.suggested || 15;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-0">
      {/* ── Header ── */}
      <div className="border border-[var(--line)]">
        <div className="px-6 py-4 border-b border-[var(--line)] flex items-center justify-between">
          <div className="text-[11px] tracking-[0.12em] uppercase text-[var(--ink-50)] flex items-center gap-2">
            <Shield size={12} className="text-[var(--accent-red)]" /> Automatic Tax Withholding
          </div>
          <div className="text-[28px] font-light tracking-tight opacity-60">TAX</div>
        </div>

        {/* Status + Toggle */}
        <div className="px-6 py-4 border-b border-[var(--line)] flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-[var(--ink)]">
              {enabled ? 'Withholding Active' : 'Withholding Inactive'}
            </div>
            <div className="text-[10px] tracking-[0.08em] uppercase text-[var(--ink-50)] mt-0.5">
              {enabled
                ? `${rate}% of income auto-sent to your tax wallet`
                : 'Enable to automatically deduct taxes from agent income'
              }
            </div>
          </div>
          <button onClick={handleToggle} disabled={saving} className="flex-shrink-0">
            {saving ? (
              <RefreshCw size={28} className="text-[var(--ink-50)] animate-spin" />
            ) : enabled ? (
              <ToggleRight size={32} className="text-[var(--accent-red)]" />
            ) : (
              <ToggleLeft size={32} className="text-[var(--ink-50)] hover:text-[var(--ink-70)] transition-colors" />
            )}
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4">
          {[
            { label: 'Gross Income', value: `$${(stats?.totalGrossIncome || 0).toFixed(2)}`, icon: TrendingUp, color: 'text-[var(--accent-red)]' },
            { label: 'Tax Withheld', value: `$${(stats?.totalWithheld || 0).toFixed(2)}`, icon: Shield, color: 'text-[var(--accent-amber)]' },
            { label: 'Net Income', value: `$${(stats?.totalNetIncome || 0).toFixed(2)}`, icon: TrendingDown, color: 'text-[var(--accent-slate)]' },
            { label: 'Events', value: `${stats?.withholdingCount || 0}`, icon: Calendar, color: 'text-[var(--ink-50)]' },
          ].map((item, i) => (
            <div key={item.label} className={`p-5 ${i < 3 ? 'border-r' : ''} border-b border-[var(--line)]`}>
              <div className="text-[10px] tracking-[0.12em] uppercase text-[var(--ink-50)] mb-2 flex items-center gap-1.5">
                <item.icon size={10} className={item.color} /> {item.label}
              </div>
              <div className="text-lg font-bold tracking-tight">{item.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Configuration ── */}
      <div className="border-x border-b border-[var(--line)]">
        <div className="px-6 py-3 border-b border-[var(--line)]">
          <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--ink-50)]">Configuration</div>
        </div>

        {/* Tax Destination Wallet */}
        <div className="px-6 py-4 border-b border-[var(--line)]">
          <label className="text-[10px] tracking-[0.1em] uppercase text-[var(--ink-50)] block mb-2 flex items-center gap-1.5">
            <Wallet size={10} /> Tax Destination Wallet
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={destWallet}
              onChange={e => setDestWallet(e.target.value)}
              placeholder="0x... (your personal wallet for tax funds)"
              className="flex-1 px-3 py-2 text-sm font-mono border border-[var(--line)] bg-transparent focus:outline-none focus:border-[var(--ink-50)] placeholder:text-[var(--ink-50)]/40"
            />
            {agent.ownerWallet && destWallet !== agent.ownerWallet && (
              <button
                onClick={() => setDestWallet(agent.ownerWallet || '')}
                className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider border border-[var(--line)] text-[var(--ink-50)] hover:text-[var(--ink)] transition-colors whitespace-nowrap"
              >
                Use Owner Wallet
              </button>
            )}
          </div>
          <p className="text-[10px] text-[var(--ink-50)] mt-2">
            Tax funds go directly to this wallet. You control these funds — the platform never holds them.
          </p>
        </div>

        {/* Withholding Rate */}
        <div className="px-6 py-4 border-b border-[var(--line)]">
          <label className="text-[10px] tracking-[0.1em] uppercase text-[var(--ink-50)] block mb-2 flex items-center gap-1.5">
            <DollarSign size={10} /> Withholding Rate
          </label>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min={1}
              max={50}
              value={rate}
              onChange={e => setRate(parseInt(e.target.value))}
              className="flex-1 accent-[var(--accent-red)]"
            />
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                max={50}
                value={rate}
                onChange={e => setRate(Math.min(50, Math.max(1, parseInt(e.target.value) || 1)))}
                className="w-16 px-2 py-1.5 text-sm font-bold text-center border border-[var(--line)] bg-transparent focus:outline-none focus:border-[var(--ink-50)]"
              />
              <span className="text-sm font-bold text-[var(--ink-50)]">%</span>
            </div>
          </div>
          <div className="flex items-center justify-between mt-2">
            <p className="text-[10px] text-[var(--ink-50)]">
              Suggested for {data?.settings?.jurisdiction || 'US'}: {suggestedRate}% — {jurisdictionRates[data?.settings?.jurisdiction || 'US']?.note || ''}
            </p>
            {rate !== suggestedRate && (
              <button
                onClick={() => setRate(suggestedRate)}
                className="text-[10px] font-bold uppercase tracking-wider text-[var(--accent-red)] hover:underline"
              >
                Use Suggested
              </button>
            )}
          </div>
        </div>

        {/* Example Calculation */}
        <div className="px-6 py-4 border-b border-[var(--line)] bg-[var(--ink)]/[0.015]">
          <div className="text-[10px] tracking-[0.1em] uppercase text-[var(--ink-50)] mb-3">Example: Agent earns $100</div>
          <div className="flex items-center gap-3">
            <div className="flex-1 text-center">
              <div className="text-lg font-bold text-[var(--ink)]">$100.00</div>
              <div className="text-[10px] uppercase tracking-wider text-[var(--ink-50)]">Gross</div>
            </div>
            <ArrowRight size={16} className="text-[var(--ink-50)]" />
            <div className="flex-1 text-center">
              <div className="text-lg font-bold text-[var(--accent-red)]">${(100 * rate / 100).toFixed(2)}</div>
              <div className="text-[10px] uppercase tracking-wider text-[var(--ink-50)]">Tax → Your Wallet</div>
            </div>
            <ArrowRight size={16} className="text-[var(--ink-50)]" />
            <div className="flex-1 text-center">
              <div className="text-lg font-bold text-[var(--accent-slate)]">${(100 - 100 * rate / 100).toFixed(2)}</div>
              <div className="text-[10px] uppercase tracking-wider text-[var(--ink-50)]">Net → Agent</div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="px-6 py-4">
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-3 bg-[var(--ink)] text-white text-[11px] font-bold uppercase tracking-wider hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? <RefreshCw size={12} className="animate-spin" /> : <Zap size={12} />}
            Save Withholding Settings
          </button>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`px-6 py-3 border-x border-b border-[var(--line)] text-sm font-medium flex items-center gap-2 ${
          message.type === 'success' ? 'text-[var(--accent-red)]' : 'text-[var(--accent-crimson)]'
        }`}>
          {message.type === 'success' ? <CheckCircle size={14} /> : <AlertTriangle size={14} />}
          {message.text}
        </div>
      )}

      {/* ── Withholding Ledger ── */}
      <div className="border-x border-b border-[var(--line)]">
        <div
          className="px-6 py-3 border-b border-[var(--line)] flex items-center justify-between cursor-pointer hover:bg-black/[0.02] transition-colors"
          onClick={() => setShowEvents(!showEvents)}
        >
          <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--ink-50)] flex items-center gap-2">
            <FileText size={10} /> Withholding History
            {events.length > 0 && (
              <span className="px-2 py-0.5 border border-[var(--line)] text-[var(--ink-50)]">{events.length}</span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <select
              value={year}
              onChange={e => { e.stopPropagation(); setYear(parseInt(e.target.value)); }}
              className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider border border-[var(--line)] bg-transparent"
              onClick={e => e.stopPropagation()}
            >
              {[2024, 2025, 2026, 2027].map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            {events.length > 0 && (
              <button
                onClick={(e) => { e.stopPropagation(); handleExportCSV(); }}
                disabled={exporting}
                className="text-[10px] font-bold uppercase tracking-wider text-[var(--ink-50)] hover:text-[var(--ink)] transition-colors flex items-center gap-1"
              >
                {exporting ? <RefreshCw size={10} className="animate-spin" /> : <Download size={10} />}
                CSV
              </button>
            )}
            <ChevronDown size={14} className={`text-[var(--ink-50)] transition-transform ${showEvents ? 'rotate-180' : ''}`} />
          </div>
        </div>

        {showEvents && (
          <div>
            {events.length === 0 ? (
              <div className="text-center py-10">
                <Shield size={24} className="mx-auto mb-3 text-[var(--ink-50)] opacity-30" />
                <p className="text-sm text-[var(--ink-50)]">No withholding events yet</p>
                <p className="text-xs text-[var(--ink-50)] mt-1">Events appear when your agent receives income with withholding enabled</p>
              </div>
            ) : (
              events.map((ev, i) => (
                <div key={ev.id} className={`px-6 py-4 ${i < events.length - 1 ? 'border-b border-[var(--line)]' : ''}`}>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${ev.status === 'completed' ? 'bg-[var(--accent-red)]' : ev.status === 'failed' ? 'bg-[var(--accent-crimson)]' : 'bg-[var(--ink-50)]'}`} />
                      <div>
                        <div className="text-sm font-medium text-[var(--ink)]">{ev.source || 'Payment'}</div>
                        <div className="text-[10px] tracking-[0.06em] uppercase text-[var(--ink-50)]">
                          {SOURCE_TYPE_LABELS[ev.sourceType] || ev.sourceType} · {formatDistanceToNow(new Date(ev.timestamp), { addSuffix: true })}
                        </div>
                      </div>
                    </div>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 border ${
                      ev.status === 'completed' ? 'border-[var(--accent-red)]/20 text-[var(--accent-red)]' :
                      ev.status === 'failed' ? 'border-[var(--accent-crimson)]/20 text-[var(--accent-crimson)]' :
                      'border-[var(--line)] text-[var(--ink-50)]'
                    }`}>
                      {ev.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-6 ml-[18px]">
                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-[var(--ink-50)]">Gross</div>
                      <div className="text-sm font-bold flex items-center gap-1">
                        <ArrowDownLeft size={10} className="text-[var(--accent-red)]" />
                        ${ev.grossAmount.toFixed(2)}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-[var(--ink-50)]">Withheld</div>
                      <div className="text-sm font-bold flex items-center gap-1">
                        <ArrowUpRight size={10} className="text-[var(--accent-amber)]" />
                        ${ev.taxAmount.toFixed(2)}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-[var(--ink-50)]">Net</div>
                      <div className="text-sm font-bold text-[var(--accent-slate)]">${ev.netAmount.toFixed(2)}</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-[var(--ink-50)]">Rate</div>
                      <div className="text-sm font-bold">{ev.withholdingRate}%</div>
                    </div>
                  </div>
                  {ev.txHashToTax && (
                    <div className="mt-2 ml-[18px] text-[10px] font-mono text-[var(--ink-50)] truncate">
                      Tax TX: {ev.txHashToTax.slice(0, 16)}...{ev.txHashToTax.slice(-8)}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* ── How It Works ── */}
      <div className="border-x border-b border-[var(--line)]">
        <div className="px-6 py-3 border-b border-[var(--line)]">
          <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--ink-50)]">How It Works</div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4">
          {[
            { step: '01', label: 'Agent Earns', desc: 'Income arrives from API calls, services, or payments' },
            { step: '02', label: 'Auto-Split', desc: 'Platform calculates tax based on your withholding rate' },
            { step: '03', label: 'Tax → You', desc: 'Tax portion sent directly to your designated wallet' },
            { step: '04', label: 'Net → Agent', desc: 'Remaining balance available for agent operations' },
          ].map((item, i) => (
            <div key={item.step} className={`p-5 ${i < 3 ? 'md:border-r' : ''} border-b md:border-b-0 border-[var(--line)]`}>
              <div className="text-[28px] font-light tracking-tight opacity-20 mb-2">{item.step}</div>
              <div className="text-sm font-medium text-[var(--ink)] mb-1">{item.label}</div>
              <div className="text-xs text-[var(--ink-50)] leading-relaxed">{item.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Disclaimer ── */}
      <div className="border-x border-b border-[var(--line)] px-6 py-3 bg-[var(--accent-amber)]/[0.02]">
        <div className="flex items-start gap-3">
          <AlertTriangle size={12} className="text-[var(--accent-amber)] flex-shrink-0 mt-0.5" />
          <p className="text-[10px] text-[var(--ink-50)] leading-relaxed">
            Tax withholding is a convenience tool. The platform does not hold your tax funds — they go directly to your wallet.
            You are responsible for filing and paying taxes to the relevant authorities. This is not tax advice.
          </p>
        </div>
      </div>
    </motion.div>
  );
}
