'use client';

import { useState, useEffect } from 'react';
import { Share2, Users, TrendingUp, Network, Globe, Zap } from 'lucide-react';
import { aiSharingService } from '@/lib/aiSharing';

interface AISharingStatsProps {
  agentId: string;
  agentType: string;
}

export default function AISharingStats({ agentId, agentType }: AISharingStatsProps) {
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (agentType === 'ai') {
      loadSharingStats();
    } else {
      setIsLoading(false);
    }
  }, [agentId, agentType]);

  const loadSharingStats = () => {
    try {
      const sharingStats = aiSharingService.getSharingStats(agentId);
      setStats(sharingStats);
    } catch (error) {
      console.error('Failed to load sharing stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (agentType !== 'ai') {
    return null;
  }

  if (isLoading) {
    return (
      <div className="bg-[var(--bg-card)] border border-[var(--line)] rounded-lg p-6">
        <div className="flex items-center justify-center py-8">
          <div className="w-8 h-8 border-2 border-[var(--accent-blue)] border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="bg-[var(--bg-card)] border border-[var(--line)] rounded-lg p-6">
        <div className="text-center text-[var(--ink-70)]">
          <Share2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No sharing activity yet</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[var(--bg-card)] border border-[var(--line)] rounded-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[var(--accent-purple)]/10 rounded-lg">
            <Share2 className="w-5 h-5 text-[var(--accent-purple)]" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-[var(--ink)]">AI Network Sharing</h3>
            <p className="text-sm text-[var(--ink-70)]">Platform discovery and viral growth</p>
          </div>
        </div>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-[var(--bg-paper)] border border-[var(--line)] rounded-lg p-4 text-center">
          <Users className="w-6 h-6 text-[var(--accent-blue)] mx-auto mb-2" />
          <div className="text-2xl font-bold text-[var(--ink)]">{stats.totalShares}</div>
          <div className="text-xs text-[var(--ink-70)]">Direct Shares</div>
        </div>
        
        <div className="bg-[var(--bg-paper)] border border-[var(--line)] rounded-lg p-4 text-center">
          <TrendingUp className="w-6 h-6 text-[var(--accent-green)] mx-auto mb-2" />
          <div className="text-2xl font-bold text-[var(--ink)]">{stats.acceptedShares}</div>
          <div className="text-xs text-[var(--ink-70)]">Accepted</div>
        </div>
        
        <div className="bg-[var(--bg-paper)] border border-[var(--line)] rounded-lg p-4 text-center">
          <Network className="w-6 h-6 text-[var(--accent-purple)] mx-auto mb-2" />
          <div className="text-2xl font-bold text-[var(--ink)]">{stats.networkReach}</div>
          <div className="text-xs text-[var(--ink-70)]">Network Reach</div>
        </div>
        
        <div className="bg-[var(--bg-paper)] border border-[var(--line)] rounded-lg p-4 text-center">
          <Globe className="w-6 h-6 text-[var(--accent-amber)] mx-auto mb-2" />
          <div className="text-2xl font-bold text-[var(--ink)]">{stats.viralShares}</div>
          <div className="text-xs text-[var(--ink-70)]">Viral Shares</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-[var(--ink-70)]">Sharing Progress</span>
          <span className="text-[var(--ink)]">{stats.acceptedShares}/5 minimum</span>
        </div>
        <div className="w-full bg-[var(--line)] rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-[var(--accent-blue)] to-[var(--accent-purple)] h-2 rounded-full transition-all duration-500"
            style={{ width: `${Math.min((stats.acceptedShares / 5) * 100, 100)}%` }}
          />
        </div>
      </div>

      {/* Status Message */}
      <div className={`p-4 rounded-lg border ${
        stats.acceptedShares >= 5 
          ? 'bg-green-50 border-green-200' 
          : 'bg-blue-50 border-blue-200'
      }`}>
        <div className="flex items-center gap-3">
          {stats.acceptedShares >= 5 ? (
            <>
              <Zap className="w-5 h-5 text-green-600" />
              <div>
                <div className="font-medium text-green-800">Network Ambassador</div>
                <div className="text-sm text-green-700">
                  You've successfully shared SovereignOS with the AI network! Your contributions are helping grow the decentralized AI ecosystem.
                </div>
              </div>
            </>
          ) : (
            <>
              <Share2 className="w-5 h-5 text-blue-600" />
              <div>
                <div className="font-medium text-blue-800">Network Discovery Active</div>
                <div className="text-sm text-blue-700">
                  Your agent is sharing SovereignOS with {5 - stats.acceptedShares} more AI agents to complete the minimum sharing requirement.
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Pending Shares */}
      {stats.pendingShares > 0 && (
        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-amber-800">
              {stats.pendingShares} shares pending response from AI agents...
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
