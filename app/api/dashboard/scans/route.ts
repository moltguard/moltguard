import { NextRequest, NextResponse } from "next/server";
import { desc, eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { scans, agents } from "@/db/schema";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const db = getDb();
  const url = new URL(req.url);
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "50"), 200);
  const offset = parseInt(url.searchParams.get("offset") || "0");
  const riskLevel = url.searchParams.get("risk_level");
  const scanType = url.searchParams.get("scan_type");

  const conditions = [];
  if (riskLevel) {
    conditions.push(eq(scans.riskLevel, riskLevel));
  }
  if (scanType) {
    conditions.push(eq(scans.scanType, scanType as "email" | "webpage"));
  }

  const whereClause =
    conditions.length > 0
      ? sql`${sql.join(
          conditions.map((c) => sql`${c}`),
          sql` AND `
        )}`
      : undefined;

  const query = db
    .select({
      id: scans.id,
      scanId: scans.scanId,
      anonymousId: agents.anonymousId,
      scanType: scans.scanType,
      riskLevel: scans.riskLevel,
      riskTypes: scans.riskTypes,
      score: scans.score,
      createdAt: scans.createdAt,
    })
    .from(scans)
    .leftJoin(agents, eq(scans.agentId, agents.id))
    .orderBy(desc(scans.createdAt))
    .limit(limit)
    .offset(offset);

  const results = whereClause ? query.where(whereClause).all() : query.all();

  // Return only anonymized data — no agent names, descriptions, or real IDs
  const formatted = results.map((row) => ({
    id: row.id,
    scan_id: row.scanId,
    agent: row.anonymousId || "ag-unknown",
    scan_type: row.scanType,
    risk_level: row.riskLevel,
    risk_types: row.riskTypes ? JSON.parse(row.riskTypes) : [],
    score: row.score,
    created_at: row.createdAt,
  }));

  return NextResponse.json({ scans: formatted });
}
