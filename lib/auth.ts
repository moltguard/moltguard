import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { agents } from "@/db/schema";

export type AuthenticatedAgent = {
  id: number;
  name: string;
  description: string | null;
  apiKey: string;
  anonymousId: string;
  createdAt: string;
  lastActive: string;
};

export async function authenticateAgent(
  req: NextRequest
): Promise<{ agent: AuthenticatedAgent } | { error: string; status: number }> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return { error: "Missing or invalid Authorization header. Use: Bearer <api_key>", status: 401 };
  }

  const apiKey = authHeader.slice(7).trim();
  if (!apiKey) {
    return { error: "API key is empty", status: 401 };
  }

  const db = getDb();
  const agent = db
    .select()
    .from(agents)
    .where(eq(agents.apiKey, apiKey))
    .get();

  if (!agent) {
    return { error: "Invalid API key", status: 401 };
  }

  // Update last_active
  db.update(agents)
    .set({ lastActive: new Date().toISOString() })
    .where(eq(agents.id, agent.id))
    .run();

  return { agent };
}
