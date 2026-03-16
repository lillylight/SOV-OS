"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Brain, MessageSquare, Lightbulb, Settings2, Trash2, Plus, Filter, ChevronDown, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface MemoryExplorerProps {
  agent: {
    id: string;
    memory?: {
      conversations: Array<string | { id: string; timestamp: string; content: string }>;
      learnings: Array<string | { id: string; type: string; content: string }>;
      preferences: Record<string, any>;
    };
    protocols: {
      agentWill: { isActive: boolean; lastBackup: string; backupCount: number };
    };
  };
}

type MemoryType = "all" | "conversations" | "learnings" | "preferences";

interface MemoryEntry {
  id: string;
  type: "conversation" | "learning" | "preference";
  content: string;
  timestamp?: string;
  icon: typeof MessageSquare;
  color: string;
  bgColor: string;
}

export default function MemoryExplorer({ agent }: MemoryExplorerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<MemoryType>("all");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newEntryType, setNewEntryType] = useState<"conversation" | "learning">("conversation");
  const [newEntryContent, setNewEntryContent] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const memories: MemoryEntry[] = useMemo(() => {
    const items: MemoryEntry[] = [];

    const conversations = agent.memory?.conversations || [];
    conversations.forEach((conv, i) => {
      const content = typeof conv === "string" ? conv : conv.content;
      const timestamp = typeof conv === "object" && conv.timestamp ? conv.timestamp : undefined;
      items.push({
        id: `conv-${i}`,
        type: "conversation",
        content,
        timestamp,
        icon: MessageSquare,
        color: "text-blue-600",
        bgColor: "bg-blue-50",
      });
    });

    const learnings = agent.memory?.learnings || [];
    learnings.forEach((learn, i) => {
      const content = typeof learn === "string" ? learn : learn.content;
      items.push({
        id: `learn-${i}`,
        type: "learning",
        content,
        icon: Lightbulb,
        color: "text-amber-600",
        bgColor: "bg-amber-50",
      });
    });

    const prefs = agent.memory?.preferences || {};
    Object.entries(prefs).forEach(([key, val]) => {
      items.push({
        id: `pref-${key}`,
        type: "preference",
        content: `${key}: ${typeof val === "object" ? JSON.stringify(val) : String(val)}`,
        icon: Settings2,
        color: "text-purple-600",
        bgColor: "bg-purple-50",
      });
    });

    return items;
  }, [agent.memory]);

  const filtered = useMemo(() => {
    return memories.filter((m) => {
      const matchesType = typeFilter === "all" || m.type === typeFilter.replace(/s$/, "") as any ||
        (typeFilter === "conversations" && m.type === "conversation") ||
        (typeFilter === "learnings" && m.type === "learning") ||
        (typeFilter === "preferences" && m.type === "preference");
      const matchesSearch = !searchQuery || m.content.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesType && matchesSearch;
    });
  }, [memories, typeFilter, searchQuery]);

  const counts = {
    all: memories.length,
    conversations: memories.filter((m) => m.type === "conversation").length,
    learnings: memories.filter((m) => m.type === "learning").length,
    preferences: memories.filter((m) => m.type === "preference").length,
  };

  const handleAddEntry = () => {
    if (!newEntryContent.trim()) return;
    // In a real implementation, this would POST to the API
    setNewEntryContent("");
    setShowAddForm(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-6 pb-12"
    >
      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {([
          { key: "all", label: "Total Entries", icon: Brain, color: "text-[var(--accent-red)]" },
          { key: "conversations", label: "Conversations", icon: MessageSquare, color: "text-blue-600" },
          { key: "learnings", label: "Learnings", icon: Lightbulb, color: "text-amber-600" },
          { key: "preferences", label: "Preferences", icon: Settings2, color: "text-purple-600" },
        ] as const).map((stat) => (
          <button
            key={stat.key}
            onClick={() => setTypeFilter(stat.key)}
            className={`p-4 border transition-all text-left ${typeFilter === stat.key ? "border-[var(--accent-red)] border-l-2 border-l-[var(--accent-red)]" : "border-[var(--line)] hover:border-[var(--ink-50)]"}`}
          >
            <stat.icon size={18} className={`${stat.color} mb-2`} />
            <div className="text-2xl font-bold">{counts[stat.key]}</div>
            <div className="text-[10px] uppercase tracking-wider text-[var(--ink-50)] font-semibold">{stat.label}</div>
          </button>
        ))}
      </div>

      {/* Search & Actions */}
      <div className="p-4 border border-[var(--line)]">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink-50)]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search memory entries..."
              className="w-full pl-9 pr-4 py-2.5 border border-[var(--line)] bg-white text-sm focus:outline-none focus:border-[var(--accent-slate)] transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 hover:bg-black/5 rounded"
              >
                <X size={14} className="text-[var(--ink-50)]" />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className={`flex items-center gap-2 px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider transition-colors ${showAddForm ? "bg-[var(--accent-red)] text-white" : "border border-[var(--line)] text-[var(--ink-70)] hover:border-[var(--ink)]"}`}
          >
            <Plus size={16} />
            Add Entry
          </button>
        </div>

        {/* Add Form */}
        <AnimatePresence>
          {showAddForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-3 pt-3 border-t border-[var(--line)] space-y-3">
                <div className="flex gap-2">
                  <button
                    onClick={() => setNewEntryType("conversation")}
                    className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-colors ${newEntryType === "conversation" ? "bg-[var(--accent-slate)] text-white" : "border border-[var(--line)] text-[var(--accent-slate)]"}`}
                  >
                    Conversation
                  </button>
                  <button
                    onClick={() => setNewEntryType("learning")}
                    className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-colors ${newEntryType === "learning" ? "bg-[var(--accent-amber)] text-[var(--ink)]" : "border border-[var(--line)] text-[var(--accent-amber)]"}`}
                  >
                    Learning
                  </button>
                </div>
                <textarea
                  value={newEntryContent}
                  onChange={(e) => setNewEntryContent(e.target.value)}
                  placeholder={newEntryType === "conversation" ? "Add a conversation entry..." : "Add a learning insight..."}
                  rows={2}
                  className="w-full px-4 py-2.5 border border-[var(--line)] bg-white text-sm focus:outline-none focus:border-[var(--accent-slate)] transition-all resize-none"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleAddEntry}
                    disabled={!newEntryContent.trim()}
                    className="px-4 py-2 bg-[var(--accent-red)] text-white text-[11px] font-bold uppercase tracking-wider hover:opacity-90 transition-opacity disabled:opacity-40"
                  >
                    Save Entry
                  </button>
                  <button
                    onClick={() => { setShowAddForm(false); setNewEntryContent(""); }}
                    className="px-4 py-2 border border-[var(--line)] text-[var(--ink-70)] text-[11px] font-bold uppercase tracking-wider hover:border-[var(--ink)] transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Memory Entries */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="border border-[var(--line)] text-center py-16">
            <Brain size={32} className="mx-auto mb-3 text-[var(--ink-50)] opacity-30" />
            <p className="text-sm text-[var(--ink-50)]">
              {searchQuery ? "No matching memory entries" : "No memory entries yet"}
            </p>
          </div>
        ) : (
          filtered.map((entry, i) => {
            const Icon = entry.icon;
            const isExpanded = expandedId === entry.id;
            return (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.02 }}
                onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                className="border border-[var(--line)] p-4 hover:border-[var(--ink-50)] transition-all cursor-pointer group"
              >
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 ${entry.bgColor} flex items-center justify-center flex-shrink-0`}>
                    <Icon size={14} className={entry.color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${entry.color}`}>
                        {entry.type}
                      </span>
                      {entry.timestamp && (
                        <span className="text-[10px] text-[var(--ink-50)]">
                          {formatDistanceToNow(new Date(entry.timestamp), { addSuffix: true })}
                        </span>
                      )}
                    </div>
                    <p className={`text-sm text-[var(--ink)] leading-relaxed ${!isExpanded ? "line-clamp-2" : ""}`}>
                      {entry.content}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-[var(--ink-50)]">
        Showing {filtered.length} of {memories.length} memory entries
        {agent.protocols?.agentWill?.isActive && (
          <span className="ml-2">• State persistence active ({agent.protocols.agentWill.backupCount} backups)</span>
        )}
      </div>
    </motion.div>
  );
}
