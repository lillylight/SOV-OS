"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, X, CheckCircle, AlertTriangle, Shield, Wallet, Brain, Info, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Notification {
  id: string;
  type: "success" | "warning" | "security" | "info";
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

interface NotificationCenterProps {
  agent: {
    id: string;
    protocols: {
      agentInsure: { isActive: boolean };
      agenticWallet: { balance: string };
      agentWill: { isActive: boolean; lastBackup: string; backupCount: number };
    };
    actions: { id: string; type: string; timestamp: string; details: string; success: boolean }[];
  };
}

function generateNotifications(agent: NotificationCenterProps["agent"]): Notification[] {
  const notifications: Notification[] = [];
  const now = new Date();

  const balance = parseFloat(agent.protocols?.agenticWallet?.balance || "0");
  if (balance < 10) {
    notifications.push({
      id: "low-balance",
      type: "warning",
      title: "Low Balance Warning",
      message: `Wallet balance is ${balance.toFixed(2)} USDC. Consider adding funds to maintain autonomous operations.`,
      timestamp: now.toISOString(),
      read: false,
    });
  }

  if (!agent.protocols?.agentInsure?.isActive) {
    notifications.push({
      id: "no-insurance",
      type: "warning",
      title: "Insurance Inactive",
      message: "AgentInsure is not active. Your agent's state is not being backed up to decentralised storage.",
      timestamp: now.toISOString(),
      read: false,
    });
  }

  if (agent.protocols?.agentWill?.isActive && agent.protocols.agentWill.backupCount > 0) {
    notifications.push({
      id: "backup-active",
      type: "success",
      title: "Backup System Active",
      message: `${agent.protocols.agentWill.backupCount} backup(s) stored. State persistence is operational.`,
      timestamp: agent.protocols.agentWill.lastBackup || now.toISOString(),
      read: true,
    });
  }

  const recentActions = agent.actions?.slice(0, 5) || [];
  recentActions.forEach((action) => {
    if (!action.success) {
      notifications.push({
        id: `failed-${action.id}`,
        type: "security",
        title: "Action Failed",
        message: action.details,
        timestamp: action.timestamp,
        read: false,
      });
    }
  });

  if (agent.protocols?.agenticWallet?.isActive) {
    notifications.push({
      id: "wallet-active",
      type: "info",
      title: "Agentic Wallet Online",
      message: "Your agent's wallet is active and processing transactions on Base L2.",
      timestamp: now.toISOString(),
      read: true,
    });
  }

  return notifications.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

const typeConfig = {
  success: { icon: CheckCircle, color: "text-green-600", bg: "bg-green-50", border: "border-green-200" },
  warning: { icon: AlertTriangle, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200" },
  security: { icon: Shield, color: "text-red-600", bg: "bg-red-50", border: "border-red-200" },
  info: { icon: Info, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200" },
};

export default function NotificationCenter({ agent }: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setNotifications(generateNotifications(agent));
  }, [agent]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell Button */}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) markAllRead();
        }}
        className="relative p-2 border border-[var(--line)] rounded-lg hover:bg-black/5 transition-colors"
        aria-label="Notifications"
      >
        <Bell size={18} className="text-[var(--ink-70)]" />
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 w-5 h-5 bg-[var(--accent-red)] text-white text-[10px] font-bold rounded-full flex items-center justify-center"
          >
            {unreadCount}
          </motion.span>
        )}
      </button>

      {/* Dropdown Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-12 w-[380px] max-h-[480px] bg-white border border-[var(--line)] rounded-xl shadow-2xl overflow-hidden z-50"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--line)] bg-[var(--ink-10)]/30">
              <span className="text-sm font-bold uppercase tracking-wider">Notifications</span>
              <div className="flex items-center gap-2">
                {notifications.length > 0 && (
                  <button
                    onClick={clearAll}
                    className="text-[10px] text-[var(--ink-50)] hover:text-[var(--accent-red)] transition-colors uppercase tracking-wider font-semibold"
                  >
                    Clear All
                  </button>
                )}
                <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-black/5 rounded transition-colors">
                  <X size={14} className="text-[var(--ink-50)]" />
                </button>
              </div>
            </div>

            {/* Notification List */}
            <div className="overflow-y-auto max-h-[400px]">
              {notifications.length === 0 ? (
                <div className="text-center py-12 text-[var(--ink-50)]">
                  <Bell size={28} className="mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No notifications</p>
                </div>
              ) : (
                notifications.map((notif, i) => {
                  const config = typeConfig[notif.type];
                  const Icon = config.icon;
                  return (
                    <motion.div
                      key={notif.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className={`flex items-start gap-3 px-4 py-3 border-b border-[var(--line)] last:border-b-0 hover:bg-black/[0.02] transition-colors group ${!notif.read ? "bg-blue-50/30" : ""}`}
                    >
                      <div className={`w-8 h-8 rounded-full ${config.bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                        <Icon size={14} className={config.color} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-xs font-bold text-[var(--ink)]">{notif.title}</span>
                          <button
                            onClick={() => removeNotification(notif.id)}
                            className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-black/5 rounded transition-all"
                          >
                            <X size={12} className="text-[var(--ink-50)]" />
                          </button>
                        </div>
                        <p className="text-[11px] text-[var(--ink-70)] leading-relaxed line-clamp-2">{notif.message}</p>
                        <span className="text-[10px] text-[var(--ink-50)] mt-1 block">
                          {formatDistanceToNow(new Date(notif.timestamp), { addSuffix: true })}
                        </span>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
