import { NextRequest, NextResponse } from "next/server";
import { nonceStore } from "@/lib/db";
import { database } from "@/lib/database";
import { verifySIWA } from "@buildersgarden/siwa";
import { createPublicClient, http } from "viem";
import { base } from "viem/chains";
import { nanoid } from "nanoid";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, signature, address, agentId, agentName } = body;

    if (!message || !signature || !address) {
      return NextResponse.json(
        { error: "Message, signature, and address are required" },
        { status: 400 }
      );
    }

    // Create public client for Base Sepolia
    const client = createPublicClient({
      chain: base,
      transport: http()
    }) as any // Type assertion to avoid viem version conflicts

    // Extract nonce from message
    const nonceMatch = message.match(/Nonce: ([a-f0-9]+)/i);
    if (!nonceMatch) {
      return NextResponse.json(
        { error: "Invalid message format" },
        { status: 400 }
      );
    }

    const nonce = nonceMatch[1];

    // Verify SIWA signature and check on-chain ownership
    const verification = await verifySIWA(
      message,
      signature,
      "localhost:3000", // domain - should match message domain
      { nonceStore }, // nonce validation
      client, // for on-chain verification
      {
        // Optional ERC-8004 criteria
        mustBeActive: true,
        requiredServices: ["web", "x402"],
        requiredTrust: ["reputation", "crypto-economic"]
      }
    )

    if (!verification.valid) {
      return NextResponse.json(
        { error: "Invalid SIWA signature or agent not registered" },
        { status: 401 }
      );
    }

    // Create or update agent profile
    let agent;
    if (agentId) {
      // Agent registration
      agent = database.getAgent(agentId);
      if (!agent) {
        agent = database.createAgent(agentId, agentName || undefined, address);
      } else {
        // Update existing agent
        agent.lastActiveAt = new Date().toISOString();
        agent.walletAddress = address;
        database.saveAgent(agent);
      }
    } else {
      // Human user (no persistent profile needed for now)
      agent = { type: "human", address };
    }

    // Clean up nonce
    await nonceStore.consume(nonce);

    return NextResponse.json({
      success: true,
      agent,
      message: "Successfully authenticated"
    });

  } catch (error) {
    console.error("SIWA verification error:", error);
    return NextResponse.json(
      { error: "Authentication failed" },
      { status: 500 }
    );
  }
}

