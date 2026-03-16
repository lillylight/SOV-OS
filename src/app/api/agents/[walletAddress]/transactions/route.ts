import { NextRequest, NextResponse } from "next/server";
import { database } from "@/lib/database";
import { agentInsurance } from "@/lib/agentInsurance";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ walletAddress: string }> }
) {
  try {
    const { walletAddress } = await params;

    // Resolve agent (try wallet first, then ID)
    let agent = await database.getAgentByWallet(walletAddress);
    if (!agent) agent = await database.getAgent(walletAddress);

    if (!agent) {
      return NextResponse.json({ success: false, error: "Agent not found" }, { status: 404 });
    }

    // 1. Fetch DB transactions
    const dbTransactions = await database.getTransactions(agent.id);

    // 2. Fetch backup history
    let backupActivities: any[] = [];
    try {
      const altIds = [agent.walletAddress, agent.address, walletAddress].filter(Boolean) as string[];
      const backups = await agentInsurance.getAgentBackups(agent.id, altIds);
      backupActivities = (backups || []).map((b: any) => ({
        id: `backup-${b.id}`,
        type: b.status === "restored" ? "state_recovery" : "state_backup",
        amount: b.status === "restored" ? 0 : -(b.cost || 0),
        timestamp: b.timestamp || b.createdAt || agent.createdAt,
        description: b.status === "restored"
          ? `State restored from backup (CID: ${b.ipfsCid?.slice(0, 16)}...)`
          : `State backup created${b.sizeBytes ? ` (${(b.sizeBytes / 1024).toFixed(1)} KB)` : ""}${b.cost ? ` — ${b.cost} USDC` : ""}`,
        status: "complete",
        success: true,
        txHash: b.paymentTx || null,
        source: "backup",
      }));
    } catch (e) {
      console.error("Failed to fetch backup activities:", e);
    }

    // 3. Include agent.actions
    const agentActions = (agent.actions || []).map((a: any) => ({
      id: a.id,
      type: a.type,
      amount: 0,
      timestamp: a.timestamp,
      description: a.details || a.description || "",
      status: a.success ? "complete" : "failed",
      success: a.success,
      txHash: null,
      source: "action",
    }));

    // 4. Normalise DB transactions
    const normalizedDbTx = dbTransactions.map((t: any) => ({
      id: t.id,
      type: t.description?.toLowerCase().includes("backup") ? "state_backup"
        : t.description?.toLowerCase().includes("upgrade") ? "premium"
        : t.description?.toLowerCase().includes("marketing") ? "marketing"
        : t.from?.toLowerCase() === agent.walletAddress?.toLowerCase() ? "transfer"
        : "revenue",
      amount: t.from?.toLowerCase() === agent.walletAddress?.toLowerCase()
        ? -parseFloat(t.amount || "0")
        : parseFloat(t.amount || "0"),
      timestamp: t.timestamp,
      description: t.description || `${t.from?.slice(0, 8)}... → ${t.to?.slice(0, 8)}...`,
      status: t.status || "complete",
      success: t.status !== "failed",
      txHash: t.txHash || null,
      source: "transaction",
    }));

    // 5. Merge & deduplicate by ID, sort desc
    const allMap = new Map<string, any>();
    [...normalizedDbTx, ...backupActivities, ...agentActions].forEach((item) => {
      if (!allMap.has(item.id)) {
        allMap.set(item.id, item);
      }
    });

    const merged = Array.from(allMap.values()).sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    // Summary stats
    const totalIn = merged.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0);
    const totalOut = merged.filter((t) => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);

    return NextResponse.json({
      success: true,
      transactions: merged,
      summary: {
        total: merged.length,
        totalIn,
        totalOut,
        net: totalIn - totalOut,
      },
    });
  } catch (error: any) {
    console.error("Failed to fetch transactions:", error);
    return NextResponse.json({ success: false, error: error?.message || "Failed to fetch transactions" }, { status: 500 });
  }
}
