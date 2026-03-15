"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { ArrowUpRight, ArrowDownLeft, Filter, Search, ChevronDown, ExternalLink, Copy, CheckCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Transaction {
  id: string;
  type: string;
  amount: number;
  timestamp: string;
  description: string;
  status: string;
  txHash?: string;
}

interface TransactionHistoryProps {
  agent: {
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

  const transactions: Transaction[] = useMemo(() => {
    return agent.actions
      .map((action) => {
        const amountMatch = action.details.match(/(\$?[\d.]+)\s*USDC/i);
        const amount = amountMatch ? parseFloat(amountMatch[1].replace("$", "")) : 0;
        const isIncoming = action.type === "revenue" || action.type === "x402_payment" || action.type === "state_recovery";
        return {
          id: action.id,
          type: action.type,
          amount: isIncoming ? amount : -amount,
          timestamp: action.timestamp,
          description: action.details,
          status: action.success ? "complete" : "failed",
          txHash: action.details.match(/0x[a-fA-F0-9]{8,}/)?.[0],
        };
      })
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [agent.actions]);

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

  const totalIn = transactions.filter((tx) => tx.amount > 0).reduce((s, tx) => s + tx.amount, 0);
  const totalOut = transactions.filter((tx) => tx.amount < 0).reduce((s, tx) => s + Math.abs(tx.amount), 0);

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
        <div className="glass-card p-5 border border-[var(--line)]">
          <div className="text-sm text-[var(--ink-50)] uppercase tracking-wide mb-1">Total Inflow</div>
          <div className="text-2xl font-bold text-green-600">+{totalIn.toFixed(2)} USDC</div>
        </div>
        <div className="glass-card p-5 border border-[var(--line)]">
          <div className="text-sm text-[var(--ink-50)] uppercase tracking-wide mb-1">Total Outflow</div>
          <div className="text-2xl font-bold text-red-500">-{totalOut.toFixed(2)} USDC</div>
        </div>
        <div className="glass-card p-5 border border-[var(--line)]">
          <div className="text-sm text-[var(--ink-50)] uppercase tracking-wide mb-1">Net</div>
          <div className={`text-2xl font-bold ${totalIn - totalOut >= 0 ? "text-green-600" : "text-red-500"}`}>
            {totalIn - totalOut >= 0 ? "+" : ""}{(totalIn - totalOut).toFixed(2)} USDC
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="glass-card p-4 border border-[var(--line)]">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink-50)]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search transactions..."
              className="w-full pl-9 pr-4 py-2.5 border border-[var(--line)] rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-red)]/30 focus:border-[var(--accent-red)] transition-all"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2.5 border rounded-lg text-sm font-medium transition-colors ${showFilters ? "border-[var(--accent-red)] text-[var(--accent-red)] bg-[var(--accent-red)]/5" : "border-[var(--line)] text-[var(--ink-70)] hover:bg-black/5"}`}
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
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${typeFilter === "all" ? "bg-[var(--ink)] text-white" : "bg-[var(--ink-10)] text-[var(--ink-70)] hover:bg-[var(--ink-10)]"}`}
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
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${typeFilter === type ? "bg-[var(--ink)] text-white" : `${meta.color} hover:opacity-80`}`}
                >
                  {meta.label} ({count})
                </button>
              );
            })}
          </motion.div>
        )}
      </div>

      {/* Transaction Table */}
      <div className="glass-card border border-[var(--line)] overflow-hidden">
        {/* Table Header */}
        <div className="hidden md:grid grid-cols-[1fr_120px_120px_2fr_80px] px-6 py-3 text-[10px] tracking-[0.08em] uppercase text-[var(--ink-50)] border-b border-[var(--line)] bg-[var(--ink-10)]/30">
          <div>Type</div>
          <div>Amount</div>
          <div>Time</div>
          <div>Description</div>
          <div className="text-right">Status</div>
        </div>

        {/* Rows */}
        {filteredTx.length === 0 ? (
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
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center ${meta.icon === "in" ? "bg-green-50" : "bg-red-50"}`}>
                    {meta.icon === "in" ? (
                      <ArrowDownLeft size={14} className="text-green-600" />
                    ) : (
                      <ArrowUpRight size={14} className="text-red-500" />
                    )}
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${meta.color}`}>
                    {meta.label}
                  </span>
                </div>

                {/* Amount */}
                <div className={`font-bold text-sm font-mono ${tx.amount >= 0 ? "text-green-600" : "text-red-500"}`}>
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
                  <span className={`inline-block w-2 h-2 rounded-full ${tx.status === "complete" ? "bg-green-500" : "bg-red-500"}`} />
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
