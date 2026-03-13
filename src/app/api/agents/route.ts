import { NextRequest, NextResponse } from "next/server";
import { getOrCreateProfile, agentRegistry } from "@/lib/db";

// POST /api/agents — Register a new agent
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { walletAddress, name, platform, creatorWallet } = body;

    if (!walletAddress) {
      return NextResponse.json(
        { error: "walletAddress is required" },
        { status: 400 }
      );
    }

    // Get or create profile sets the standard schema via db.ts
    const profile = getOrCreateProfile(walletAddress);
    
    // Check if agent was already customized
    if (profile.platform !== "unknown") {
      return NextResponse.json({
        message: "Agent already registered",
        agent: sanitizeProfile(profile),
      });
    }

    // Otherwise, it's a new registration, customize it
    profile.creatorWallet = creatorWallet || walletAddress;
    profile.name = name || profile.name;
    profile.platform = platform || "custom";
    profile.memory.conversations.push(`Agent registered on SovereignOS at ${new Date().toISOString()}`);

    return NextResponse.json({
      message: "Agent registered successfully",
      agent: sanitizeProfile(profile),
      endpoints: {
        wallet: `/api/agents/${walletAddress}/wallet`,
        backup: `/api/agents/${walletAddress}/backup`,
        recover: `/api/agents/${walletAddress}/recover`,
        status: `/api/agents/${walletAddress}`,
      },
    }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
}

// GET /api/agents — List all registered agents (or query by platform)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const platform = searchParams.get("platform");

  const agents = Array.from(agentRegistry?.values() || [])
    .filter((a) => !platform || a.platform === platform)
    .map(sanitizeProfile);

  return NextResponse.json({
    count: agents.length,
    agents,
  });
}

function sanitizeProfile(profile: any) {
  return {
    id: profile.id,
    walletAddress: profile.walletAddress,
    creatorWallet: profile.creatorWallet,
    name: profile.name,
    platform: profile.platform,
    status: profile.status,
    sessionCount: profile.sessionCount,
    createdAt: profile.createdAt,
    lastActiveAt: profile.lastActiveAt,
    backupCount: profile.backups.length,
    walletBalance: profile.walletBalance,
    totalRevenue: profile.totalRevenue,
    totalBackupCost: profile.totalBackupCost,
  };
}
