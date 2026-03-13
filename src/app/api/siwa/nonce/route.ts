import { NextRequest, NextResponse } from "next/server";
import { nonceStore } from "@/lib/db";
import { nanoid } from "nanoid";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { address, agentId } = body;

    if (!address) {
      return NextResponse.json(
        { error: "Address is required" },
        { status: 400 }
      );
    }

    // Generate nonce
    const nonce = nanoid(32);
    const expires = Date.now() + 5 * 60 * 1000; // 5 minutes

    // Store nonce with agent context
    const key = agentId ? `agent:${agentId}:${address}` : address;
    await nonceStore.set(key, { nonce, expires });

    return NextResponse.json({ nonce });
  } catch (error) {
    console.error("Nonce generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate nonce" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get("address");
  const agentId = searchParams.get("agentId");

  if (!address) {
    return NextResponse.json(
      { error: "Address is required" },
      { status: 400 }
    );
  }

  const key = agentId ? `agent:${agentId}:${address}` : address;
  const stored = await nonceStore.get(key);

  if (!stored || stored.expires < Date.now()) {
    return NextResponse.json(
      { error: "Nonce not found or expired" },
      { status: 404 }
    );
  }

  return NextResponse.json({ nonce: stored.nonce });
}
