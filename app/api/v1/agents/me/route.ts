import { NextRequest } from "next/server";
import { eq, count } from "drizzle-orm";
import { getDb } from "@/db";
import { scans } from "@/db/schema";
import { authenticateAgent } from "@/lib/auth";
import { errorResponse, successResponse } from "@/lib/errors";

export async function GET(req: NextRequest) {
  const result = await authenticateAgent(req);
  if ("error" in result) {
    return errorResponse(result.error, result.status);
  }

  const { agent } = result;
  const db = getDb();

  const scanCountResult = db
    .select({ count: count() })
    .from(scans)
    .where(eq(scans.agentId, agent.id))
    .get();

  return successResponse({
    agent: {
      name: agent.name,
      description: agent.description,
      anonymous_id: agent.anonymousId,
      created_at: agent.createdAt,
      last_active: agent.lastActive,
      scan_count: scanCountResult?.count ?? 0,
    },
  });
}
