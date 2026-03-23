import { NextRequest, NextResponse } from "next/server";
import { database } from "@/lib/database";
import { agentInsurance } from "@/lib/agentInsurance";
import { setSoulCache } from "@/lib/soul-cache";
import { loadMemoriesIntoSession } from "@/lib/memory-manager";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ walletAddress: string }> }
) {
  try {
    const { walletAddress } = await params;
    const { backupId, creatorWallet } = await request.json();

    if (!backupId || !creatorWallet) {
      return NextResponse.json({
        success: false,
        error: "Missing backupId or creatorWallet"
      }, { status: 400 });
    }

    // Verify the agent exists (try wallet address first, then ID)
    let agent = await database.getAgentByWallet(walletAddress);
    if (!agent) agent = await database.getAgent(walletAddress);
    if (!agent) {
      return NextResponse.json({
        success: false,
        error: "Agent not found"
      }, { status: 404 });
    }

    // Allow restore if:
    // 1. creatorWallet matches agent's owner (direct owner restore from dashboard)
    // 2. creatorWallet matches agent's own wallet (agent self-restore or dashboard fallback)
    // 3. creatorWallet matches agent's address (legacy address field)
    const isOwnerRestore = agent.ownerWallet && agent.ownerWallet.toLowerCase() === creatorWallet.toLowerCase();
    const isAgentSelfRestore = agent.walletAddress && agent.walletAddress.toLowerCase() === creatorWallet.toLowerCase();
    const isAgentAddressRestore = agent.address && (agent.address as string).toLowerCase() === creatorWallet.toLowerCase();

    if (!isOwnerRestore && !isAgentSelfRestore && !isAgentAddressRestore) {
      return NextResponse.json({
        success: false,
        error: "Only the registered creator/owner or the agent itself can restore"
      }, { status: 403 });
    }

    // Only require ownerVerified for owner-initiated restores (not agent self-restore)
    if (!isAgentSelfRestore && !isAgentAddressRestore && !agent.ownerVerified) {
      return NextResponse.json({
        success: false,
        error: "Owner must be verified (synced) before restoring an agent"
      }, { status: 403 });
    }

    const wasAlive = agent.status === "alive" || agent.status === "active";

    // Restore from backup — works whether agent is alive or dead
    const restoredState = await agentInsurance.restoreFromBackup(backupId, creatorWallet);

    // Restore Soul State + memory into live caches
    // Support V4, V3 (raw + conditioned), V2 (obfuscated), and V1 (legacy) formats
    let soulStateRestored = false;
    let memoriesRestored = { episodic: 0, semantic: 0, driftJournal: 0, affectHistory: 0 };
    let usedConditioned = false;
    let restoredFormat = 'unknown';

    console.log('[Restore] Backup format:', restoredState?.format);
    console.log('[Restore] Has soul data:', !!restoredState?._ss, !!restoredState?.soul);

    const soulData = restoredState?._ss || restoredState?.soul || (restoredState?.tensors ? restoredState : null);

    if (!soulData) {
      console.log('[Restore] No soul data found, skipping soul state restore');
    } else {
      // V4/V3 format: has both raw (_tr) and conditioned (_tc) tensors
      const rawTensors = soulData?._tr || (soulData?.format === 'SOVEREIGN_BACKUP_V3' ? soulData?.tensors : null);
      const conditionedTensors = soulData?._tc;
      const soulConfig = soulData?._c || soulData?.config;

      // V2/V1 format: single tensor set (_t or tensors)
      const legacyTensors = soulData?._t || soulData?.tensors || (soulData?.nodes ? soulData : null);

      // Determine which tensors to use
      let tensorsToLoad;
      let baselineToUse;

      try {
        if (conditionedTensors && rawTensors) {
          tensorsToLoad = conditionedTensors;
          baselineToUse = rawTensors.nodes;
          usedConditioned = true;
          restoredFormat = restoredState?.format || 'V3+';
          console.log('[Restore] Using conditioned tensors');
        } else if (legacyTensors) {
          tensorsToLoad = legacyTensors;
          baselineToUse = legacyTensors.nodes ? legacyTensors.nodes.map((r: number[]) => [...r]) : [];
          usedConditioned = false;
          restoredFormat = restoredState?.format || 'V1/V2';
          console.log('[Restore] Using legacy tensors');
        }

        if (tensorsToLoad && soulConfig) {
          setSoulCache(agent.id, {
            tensors: tensorsToLoad,
            config: soulConfig,
            baseline: baselineToUse,
            loadedAt: Date.now(),
            rawTensors: rawTensors || null,
          });
          soulStateRestored = true;
          console.log('[Restore] Soul state restored successfully');
        }
      } catch (error) {
        console.error('[Restore] Error setting soul cache:', error);
      }
    }

    // Load episodic + semantic + V2 additions
    const episodic = restoredState?._em || restoredState?.episodic_memory || restoredState?.memory?.conversations || [];
    const semantic = restoredState?._sm || restoredState?.semantic_memory || restoredState?.memory?.learnings || [];
    const driftJournal = restoredState?._dj || [];
    const affectHistory = restoredState?._af || [];
    const soulDefinition = restoredState?._sd || null;
    const checkpoint = restoredState?._cp || null;

    if (episodic.length || semantic.length || driftJournal.length) {
      loadMemoriesIntoSession(
        agent.id,
        episodic,
        semantic,
        driftJournal,
        soulDefinition,
        checkpoint,
        affectHistory,
      );
      memoriesRestored = {
        episodic: episodic.length,
        semantic: semantic.length,
        driftJournal: driftJournal.length,
        affectHistory: affectHistory.length,
      };
    }

    // Update agent metadata with Merkle info if available
    const merkle = restoredState?._mk || null;
    if (merkle) {
      agent.metadata = {
        ...agent.metadata,
        preferences: {
          ...agent.metadata?.preferences,
          merkleRoot: merkle.merkleRoot,
          merkleSequence: merkle.sequence,
        }
      };
    }

    // Never return raw backup payload — only safe metadata
    return NextResponse.json({
      success: true,
      agent: {
        id: agent.id,
        name: agent.name,
        walletAddress: agent.walletAddress,
      },
      previousStatus: wasAlive ? "alive" : agent.status,
      soulState: {
        restored: soulStateRestored,
        status: soulStateRestored ? 'active' : 'not_found',
        memoryConditioned: usedConditioned,
        format: restoredFormat,
      },
      memory: memoriesRestored,
      syntheticMind: {
        hasSoulDefinition: !!soulDefinition,
        hasCheckpoint: !!checkpoint,
        hasDriftJournal: driftJournal.length > 0,
        hasAffectHistory: affectHistory.length > 0,
        merkle: merkle ? {
          root: merkle.merkleRoot,
          sequence: merkle.sequence,
        } : null,
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("Backup restoration failed:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Backup restoration failed"
    }, { status: 500 });
  }
}
