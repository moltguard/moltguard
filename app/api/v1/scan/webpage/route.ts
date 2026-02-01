import { NextRequest } from "next/server";
import { randomUUID } from "crypto";
import { getDb } from "@/db";
import { scans } from "@/db/schema";
import { authenticateAgent } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { scanWebpage } from "@/lib/openguardrails";
import { errorResponse, successResponse } from "@/lib/errors";

export async function POST(req: NextRequest) {
  const authResult = await authenticateAgent(req);
  if ("error" in authResult) {
    return errorResponse(authResult.error, authResult.status);
  }
  const { agent } = authResult;

  const rateResult = checkRateLimit(agent.apiKey);
  if (!rateResult.allowed) {
    return errorResponse("Rate limit exceeded. Try again shortly.", 429, {
      retry_after_ms: rateResult.retryAfterMs,
    });
  }

  let body: { content?: string; url?: string };
  try {
    body = await req.json();
  } catch {
    return errorResponse("Invalid JSON body", 400);
  }

  const content = body.content?.trim();
  if (!content) {
    return errorResponse("content is required", 400);
  }
  const url = body.url?.trim();

  let scanResult;
  try {
    scanResult = await scanWebpage(
      content,
      {
        agent_id: agent.id,
        agent_name: agent.name,
        agent_description: agent.description,
      },
      url
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Upstream scan failed";
    return errorResponse(message, 502);
  }

  const scanId = randomUUID();
  const db = getDb();

  db.insert(scans)
    .values({
      scanId,
      agentId: agent.id,
      scanType: "webpage",
      riskLevel: scanResult.data.risk_level,
      riskTypes: JSON.stringify(scanResult.data.risk_types),
      score: scanResult.data.score,
    })
    .run();

  return successResponse({
    scan_id: scanId,
    scan_type: "webpage",
    risk_level: scanResult.data.risk_level,
    risk_types: scanResult.data.risk_types,
    score: scanResult.data.score,
    remaining_requests: rateResult.remaining,
  });
}
