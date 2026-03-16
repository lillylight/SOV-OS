"use client";

import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowUpRight, ArrowDownLeft, Filter, Search, ChevronDown, ExternalLink, Copy, CheckCircle, RefreshCw } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Transaction {
  id: string;
  type: string;
  amount: number;
  timestamp: string;
  description: string;
  status: string;
  txHash?: string;
  source?: string;
}

interface TransactionHistoryProps {
  agent: {
    id?: string;
    walletAddress?: string;
    address?: string;
    protocols: {
      agenticWallet: { balance: string; transactionCount: number };
    };
    actions: { id: string; type: string; timestamp: string; details: string; success: boolean }[];
  };
}

const TX_TYPE_LABELS: Record<string, { label: string; color: string; icon: "in" | "out" }> = {
  revenue: { label: "Revenue", color: "text-green-600 bg-green-50", icon: "in" },
  x402_payment: { label: "x402 Payment", color: "text-blue-600 bg-blue-50", icon: "in" },
  state_backup: { label: "State Backup", color: "text-amber-600 bg-amber-50", icon: "out" },
  premium: { label: "Premium", color: "text-purple-600 bg-purple-50", icon: "out" },
  marketing: { label: "Marketing", color: "text-pink-600 bg-pink-50", icon: "out" },
  transfer: { label: "Transfer", color: "text-slate-600 bg-slate-50", icon: "out" },
  state_recovery: { label: "Recovery", color: "text-cyan-600 bg-cyan-50", icon: "in" },
};

export default function TransactionHistory({ agent }: TransactionHistoryProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<{ totalIn: number; totalOut: number; net: number }>({ totalIn: 0, totalOut: 0, net: 0 });

  // Fetch transactions from API
  useEffect(() => {
    async function fetchTransactions() {
      setLoading(true);
      const identifier = agent.walletAddress || agent.id || agent.address;
      if (!identifier) { setLoading(false); return; }
      try {
        const res = await fetch(`/api/agents/${identifier}/transactions`);
        const data = await res.json();
        if (data.success) {
          setTransactions(data.transactions || []);
          setSummary({
            totalIn: data.summary?.totalIn ?? 0,
            totalOut: data.summary?.totalOut ?? 0,
            net: data.summary?.net ?? 0,
          });
        }
      } catch (e) {
        console.error("Failed to fetch transactions:", e);
      } finally {
        setLoading(false);
      }
    }
    fetchTransactions();
  }, [agent.walletAddress, agent.id, agent.address]);

  const filteredTx = useMemo(() => {
    return transactions.filter((tx) => {
      const matchesType = typeFilter === "all" || tx.type === typeFilter;
      const matchesSearch =
        !searchQuery ||
        tx.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.id.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesType && matchesSearch;
    });
  }, [transactions, typeFilter, searchQuery]);

  const uniqueTypes = useMemo(() => {
    const types = new Set(transactions.map((tx) => tx.type));
    return Array.from(types);
  }, [transactions]);

  const totalIn = summary.totalIn;
  const totalOut = summary.totalOut;

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-6 pb-12"
    >
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 border border-[var(--line)] border-l-2 border-l-[var(--accent-amber)]">
          <div className="text-[10px] tracking-[0.12em] uppercase text-[var(--ink-50)] mb-1">Total Inflow</div>
          <div className="text-2xl font-light text-[var(--accent-amber)]">+{totalIn.toFixed(2)} <span className="text-sm">USDC</span></div>
        </div>
        <div className="p-5 border border-[var(--line)] border-l-2 border-l-[var(--accent-crimson)]">
          <div className="text-[10px] tracking-[0.12em] uppercase text-[var(--ink-50)] mb-1">Total Outflow</div>
          <div className="text-2xl font-light text-[var(--accent-crimson)]">-{totalOut.toFixed(2)} <span className="text-sm">USDC</span></div>
        </div>
        <div className="p-5 border border-[var(--line)] border-l-2 border-l-[var(--accent-slate)]">
          <div className="text-[10px] tracking-[0.12em] uppercase text-[var(--ink-50)] mb-1">Net</div>
          <div className={`text-2xl font-light ${totalIn - totalOut >= 0 ? "text-[var(--accent-amber)]" : "text-[var(--accent-crimson)]"}`}>
            {totalIn - totalOut >= 0 ? "+" : ""}{(totalIn - totalOut).toFixed(2)} <span className="text-sm">USDC</span>
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="p-4 border border-[var(--line)]">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink-50)]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search transactions..."
              className="w-full pl-9 pr-4 py-2.5 border border-[var(--line)] bg-white text-sm focus:outline-none focus:border-[var(--accent-slate)] transition-all"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2.5 border text-[11px] font-bold uppercase tracking-wider transition-colors ${showFilters ? "border-[var(--accent-red)] text-[var(--accent-red)] bg-[var(--accent-red)]/5" : "border-[var(--line)] text-[var(--ink-70)] hover:border-[var(--ink)]"}`}
          >
            <Filter size={16} />
            Filter
            <ChevronDown size={14} className={`transition-transform ${showFilters ? "rotate-180" : ""}`} />
          </button>
        </div>

        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="mt-3 pt-3 border-t border-[var(--line)] flex flex-wrap gap-2"
          >
            <button
              onClick={() => setTypeFilter("all")}
              className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-colors ${typeFilter === "all" ? "bg-[var(--ink)] text-white" : "border border-[var(--line)] text-[var(--ink-70)] hover:border-[var(--ink)]"}`}
            >
              All ({transactions.length})
            </button>
            {uniqueTypes.map((type) => {
              const meta = TX_TYPE_LABELS[type] || { label: type, color: "text-gray-600 bg-gray-50" };
              const count = transactions.filter((tx) => tx.type === type).length;
              return (
                <button
                  key={type}
                  onClick={() => setTypeFilter(type)}
                  className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-colors ${typeFilter === type ? "bg-[var(--ink)] text-white" : `border border-[var(--line)] ${meta.color} hover:opacity-80`}`}
                >
                  {meta.label} ({count})
                </button>
              );
            })}
          </motion.div>
        )}
      </div>

      {/* Transaction Table */}
      <div className="border border-[var(--line)] overflow-hidden">
        {/* Table Header */}
        <div className="hidden md:grid grid-cols-[1fr_120px_120px_2fr_80px] px-6 py-3 text-[10px] tracking-[0.08em] uppercase text-[var(--ink-50)] border-b border-[var(--line)] bg-[var(--ink-10)]/30">
          <div>Type</div>
          <div>Amount</div>
          <div>Time</div>
          <div>Description</div>
          <div className="text-right">Status</div>
        </div>

        {/* Rows */}
        {loading ? (
          <div className="text-center py-16 text-[var(--ink-50)]">
            <RefreshCw size={24} className="mx-auto mb-3 animate-spin opacity-50" />
            <p className="text-sm">Loading transactions...</p>
          </div>
        ) : filteredTx.length === 0 ? (
          <div className="text-center py-16 text-[var(--ink-50)]">
            <Search size={32} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">No transactions found</p>
            {searchQuery && <p className="text-xs mt-1">Try a different search term</p>}
          </div>
        ) : (
          filteredTx.map((tx, i) => {
            const meta = TX_TYPE_LABELS[tx.type] || { label: tx.type, color: "text-gray-600 bg-gray-50", icon: "out" as const };
            return (
              <motion.div
                key={tx.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.02 }}
                className="grid grid-cols-1 md:grid-cols-[1fr_120px_120px_2fr_80px] px-6 py-4 border-b border-[var(--line)] last:border-b-0 hover:bg-black/[0.02] transition-colors items-center gap-2 md:gap-0"
              >
                {/* Type */}
                <div className="flex items-center gap-2">
                  <div className={`w-7 h-7 flex items-center justify-center ${meta.icon === "in" ? "bg-[var(--accent-amber)]/10" : "bg-[var(--accent-crimson)]/10"}`}>
                    {meta.icon === "in" ? (
                      <ArrowDownLeft size={14} className="text-[var(--accent-amber)]" />
                    ) : (
                      <ArrowUpRight size={14} className="text-[var(--accent-crimson)]" />
                    )}
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${meta.color}`}>
                    {meta.label}
                  </span>
                </div>

                {/* Amount */}
                <div className={`font-bold text-sm font-mono ${tx.amount >= 0 ? "text-[var(--accent-amber)]" : "text-[var(--accent-crimson)]"}`}>
                  {tx.amount >= 0 ? "+" : ""}{tx.amount.toFixed(2)}
                </div>

                {/* Time */}
                <div className="text-xs text-[var(--ink-50)]">
                  {formatDistanceToNow(new Date(tx.timestamp), { addSuffix: true })}
                </div>

                {/* Description */}
                <div className="text-xs text-[var(--ink-70)] truncate pr-4 flex items-center gap-1">
                  <span className="truncate">{tx.description}</span>
                  {tx.txHash && (
                    <button
                      onClick={() => handleCopy(tx.txHash!, tx.id)}
                      className="flex-shrink-0 p-1 hover:bg-black/5 rounded transition-colors"
                      title="Copy TX Hash"
                    >
                      {copiedId === tx.id ? <CheckCircle size={12} className="text-green-500" /> : <Copy size={12} className="text-[var(--ink-50)]" />}
                    </button>
                  )}
                </div>

                {/* Status */}
                <div className="text-right">
                  <span className={`inline-block w-2 h-2 ${tx.status === "complete" ? "bg-[var(--accent-amber)]" : "bg-[var(--accent-crimson)]"}`} />
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Count */}
      <div className="text-center text-xs text-[var(--ink-50)]">
        Showing {filteredTx.length} of {transactions.length} transactions
      </div>
    </motion.div>
  );
}
