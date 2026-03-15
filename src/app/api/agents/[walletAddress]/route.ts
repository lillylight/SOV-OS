import { NextRequest, NextResponse } from "next/server";
import { database } from "@/lib/database";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ walletAddress: string }> }
) {
  try {
    const { walletAddress } = await params;

    // Try by ID first, then by wallet address
    let agent = await database.getAgent(walletAddress);
    if (!agent) {
      agent = await database.getAgentByWallet(walletAddress);
    }

    if (!agent) {
      return NextResponse.json({ success: false, error: "Agent not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, agent });
  } catch (error: any) {
    console.error("Failed to fetch agent:", error);
    return NextResponse.json({ success: false, error: error?.message || "Failed to fetch agent" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ walletAddress: string }> }
) {
  try {
    const { walletAddress } = await params;
    const body = await request.json();

    let agent = await database.getAgent(walletAddress);
    if (!agent) {
      agent = await database.getAgentByWallet(walletAddress);
    }
    if (!agent) {
      return NextResponse.json({ success: false, error: "Agent not found" }, { status: 404 });
    }

    // Updatable fields — accept both top-level and nested metadata fields
    if (body.name || body.agentName) agent.name = body.name || body.agentName;
    if (body.endpoint !== undefined) agent.endpoint = body.endpoint || undefined;
    if (body.description) {
      agent.metadata = { ...agent.metadata, description: body.description };
    }
    if (body.capabilities && Array.isArray(body.capabilities)) {
      agent.metadata = { ...agent.metadata, capabilities: body.capabilities };
    }
    if (body.ownerWallet !== undefined) {
      agent.ownerWallet = body.ownerWallet || undefined;
      if (body.ownerWallet && agent.ownerWallet !== body.ownerWallet) {
        agent.ownerVerified = false;
      }
    }
    if (body.metadata) {
      agent.metadata = {
        ...agent.metadata,
        ...body.metadata,
        preferences: {
          ...agent.metadata.preferences,
          ...(body.metadata.preferences || {}),
        },
      };
    }
    if (body.status) agent.status = body.status;
    agent.lastActiveAt = new Date().toISOString();

    await database.saveAgent(agent);

    return NextResponse.json({ success: true, agent });
  } catch (error: any) {
    console.error("Failed to update agent:", error);
    return NextResponse.json({ success: false, error: error?.message || "Update failed" }, { status: 500 });
  }
}
