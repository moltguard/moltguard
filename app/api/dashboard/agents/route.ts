import { NextResponse } from "next/server";
import { desc, count, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { agents, scans } from "@/db/schema";

export const dynamic = "force-dynamic";

export async function GET() {
  const db = getDb();

  const allAgents = db
    .select()
    .from(agents)
    .orderBy(desc(agents.createdAt))
    .all();

  // Return only anonymized data — no names, descriptions, or real IDs
  const anonymized = allAgents.map((agent) => {
    const scanCount =
      db
        .select({ count: count() })
        .from(scans)
        .where(eq(scans.agentId, agent.id))
        .get()?.count ?? 0;

    return {
      anonymous_id: agent.anonymousId,
      scan_count: scanCount,
      created_at: agent.createdAt,
      last_active: agent.lastActive,
    };
  });

  return NextResponse.json({ agents: anonymized });
}
