'use client';

import { useState, useEffect } from 'react';
import { Shield, Lock, Upload, RefreshCw, AlertCircle, CheckCircle, Infinity, CreditCard } from 'lucide-react';

interface BackupRecord {
  id: string;
  ipfsCid: string;
  sizeBytes: number;
  timestamp: string;
  hash: string;
  cost: number;
  status: 'pending' | 'stored' | 'failed' | 'restored';
}

interface InsuranceStats {
  backupCount: number;
  totalCost: number;
  totalSize: number;
  lastBackup: string | null;
  encryptionAlgorithm: string;
  storageProvider: string;
  plan: {
    id: string;
    name: string;
    maxBackups: number;
    price: number;
    features: string[];
  };
}

interface AgentInsuranceProps {
  walletAddress: string;
}

export default function AgentInsurance({ walletAddress }: AgentInsuranceProps) {
  const [backups, setBackups] = useState<BackupRecord[]>([]);
  const [stats, setStats] = useState<InsuranceStats | null>(null);
  const [canBackup, setCanBackup] = useState(true);
  const [backupReason, setBackupReason] = useState('');
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [isUpgrading, setIsUpgrading] = useState(false);

  useEffect(() => {
    fetchInsuranceData();
  }, [walletAddress]);

  const fetchInsuranceData = async () => {
    try {
      const response = await fetch(`/api/agents/${walletAddress}/backup`);
      const data = await response.json();
      
      if (data.success) {
        setBackups(data.backups);
        setStats(data.stats);
        setCanBackup(data.canBackup);
        setBackupReason(data.backupReason || '');
      }
    } catch (error) {
      console.error('Failed to fetch insurance data:', error);
    }
  };

  const createBackup = async () => {
    if (!canBackup) return;
    
    setIsCreatingBackup(true);
    try {
      const response = await fetch(`/api/agents/${walletAddress}/backup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const data = await response.json();
      if (data.success) {
        await fetchInsuranceData();
      } else {
        console.error('Backup failed:', data.error);
      }
    } catch (error) {
      console.error('Backup creation failed:', error);
    } finally {
      setIsCreatingBackup(false);
    }
  };

  const upgradePlan = async (planId: string) => {
    setIsUpgrading(true);
    try {
      const response = await fetch(`/api/agents/${walletAddress}/upgrade-plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          planId, 
          paymentSignature: `sig_${Math.random().toString(36).substr(2, 24)}` 
        })
      });
      
      const data = await response.json();
      if (data.success) {
        await fetchInsuranceData();
      } else {
        console.error('Upgrade failed:', data.error);
      }
    } catch (error) {
      console.error('Plan upgrade failed:', error);
    } finally {
      setIsUpgrading(false);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'less than a minute ago';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  if (!stats) {
    return (
      <div className="bg-[var(--bg-card)] border border-[var(--line)] rounded-lg p-6">
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="w-6 h-6 text-[var(--accent-blue)] animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[var(--bg-card)] border border-[var(--line)] rounded-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[var(--accent-green)]/10 rounded-lg">
            <Shield className="w-5 h-5 text-[var(--accent-green)]" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-[var(--ink)]">Encrypted State Insurance</h3>
            <p className="text-sm text-[var(--ink-70)]">Active</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm text-[var(--ink-70)]">Backups Stored</p>
          <p className="text-2xl font-bold text-[var(--ink)]">{stats.backupCount}</p>
        </div>
      </div>

      {/* Plan Info */}
      <div className="bg-[var(--bg-paper)] border border-[var(--line)] rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            {stats.plan.id === 'infinite' ? (
              <Infinity className="w-4 h-4 text-[var(--accent-purple)]" />
            ) : (
              <Lock className="w-4 h-4 text-[var(--accent-blue)]" />
            )}
            <span className="font-medium text-[var(--ink)]">{stats.plan.name}</span>
          </div>
          <span className="text-sm text-[var(--ink-70)]">
            Limit: {stats.plan.maxBackups === -1 ? '∞' : `${stats.plan.maxBackups} backups`}
          </span>
        </div>
        
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-[var(--ink-70)]">Total Storage Cost</span>
          <span className="font-semibold text-[var(--ink)]">{stats.totalCost.toFixed(2)} USDC</span>
        </div>

        {stats.plan.id !== 'infinite' && (
          <button
            onClick={() => upgradePlan('infinite')}
            disabled={isUpgrading}
            className="w-full bg-[var(--accent-purple)] text-white px-4 py-2 rounded-lg hover:bg-[var(--accent-purple)]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isUpgrading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <CreditCard className="w-4 h-4" />
            )}
            Unlock Infinite (${stats.plan.price})
          </button>
        )}
      </div>

      {/* Encryption Info */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-[var(--bg-paper)] border border-[var(--line)] rounded-lg p-3">
          <p className="text-xs text-[var(--ink-70)] mb-1">Encryption</p>
          <p className="text-sm font-medium text-[var(--ink)]">Impenetrable</p>
        </div>
        <div className="bg-[var(--bg-paper)] border border-[var(--line)] rounded-lg p-3">
          <p className="text-xs text-[var(--ink-70)] mb-1">Agent ID</p>
          <p className="text-sm font-mono text-[var(--ink)] truncate">{walletAddress.slice(0, 10)}...</p>
        </div>
      </div>

      {/* How it works */}
      <div className="bg-[var(--bg-paper)] border border-[var(--line)] rounded-lg p-4 mb-6">
        <p className="text-sm text-[var(--ink)]">
          <strong>How it works:</strong> Agent pays 1.00 USDC to store an encrypted state snapshot on decentralised storage. Recovery is always free. Over 2 backups requires a one-time 10 USDC upgrade.
        </p>
      </div>

      {/* Backups List */}
      <div className="mb-6">
        <h4 className="font-medium text-[var(--ink)] mb-3">Encrypted Backups ({stats.backupCount})</h4>
        
        <button
          onClick={createBackup}
          disabled={!canBackup || isCreatingBackup}
          className="w-full bg-[var(--accent-blue)] text-white px-4 py-2 rounded-lg hover:bg-[var(--accent-blue)]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mb-4"
        >
          {isCreatingBackup ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Upload className="w-4 h-4" />
          )}
          Backup Now
        </button>

        {!canBackup && backupReason && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-yellow-600" />
              <p className="text-sm text-yellow-800">{backupReason}</p>
            </div>
          </div>
        )}

        <div className="space-y-2">
          {backups.map((backup) => (
            <div key={backup.id} className="bg-[var(--bg-paper)] border border-[var(--line)] rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {backup.status === 'stored' ? (
                    <CheckCircle className="w-4 h-4 text-[var(--accent-green)]" />
                  ) : backup.status === 'pending' ? (
                    <RefreshCw className="w-4 h-4 text-[var(--accent-blue)] animate-spin" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-[var(--accent-red)]" />
                  )}
                  <span className="text-sm font-mono text-[var(--ink)]">
                    {backup.ipfsCid.slice(0, 20)}...{backup.ipfsCid.slice(-10)}
                  </span>
                </div>
                <span className={`text-xs px-2 py-1 rounded ${
                  backup.status === 'stored' 
                    ? 'bg-green-100 text-green-800' 
                    : backup.status === 'pending'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {backup.status}
                </span>
              </div>
              
              <div className="flex items-center justify-between text-xs text-[var(--ink-70)]">
                <span>{formatBytes(backup.sizeBytes)} • {formatTime(backup.timestamp)}</span>
                <span>-{backup.cost.toFixed(2)} USDC</span>
              </div>
              
              <div className="mt-2 text-xs text-[var(--ink-70)]">
                <div className="flex items-center justify-between">
                  <span>Hash: {backup.hash.slice(0, 20)}...</span>
                  <span>Decentralised</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
