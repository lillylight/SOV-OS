import { NextRequest, NextResponse } from "next/server";
import { createNonce } from "@/lib/siwa";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { address } = body;

    // Generate a nonce using the real SIWA nonce store
    const nonceResponse = createNonce();

    return NextResponse.json({
      success: true,
      ...nonceResponse,
      address: address || undefined,
    });
  } catch (error) {
    console.error("[SIWA Nonce] Error:", error);
    return NextResponse.json(
      { error: "Failed to generate nonce" },
      { status: 500 }
    );
  }
}

export async function GET() {
  // GET returns a fresh nonce (stateless — agent doesn't need to store it)
  const nonceResponse = createNonce();
  return NextResponse.json({
    success: true,
    ...nonceResponse,
  });
}
