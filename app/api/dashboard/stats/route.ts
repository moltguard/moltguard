import { NextResponse } from "next/server";
import { count, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { agents, scans } from "@/db/schema";

export const dynamic = "force-dynamic";

export async function GET() {
  const db = getDb();

  const totalAgents = db.select({ count: count() }).from(agents).get()?.count ?? 0;
  const totalScans = db.select({ count: count() }).from(scans).get()?.count ?? 0;

  const today = new Date().toISOString().slice(0, 10);
  const scansToday =
    db
      .select({ count: count() })
      .from(scans)
      .where(sql`date(${scans.createdAt}) = ${today}`)
      .get()?.count ?? 0;

  const highRiskToday =
    db
      .select({ count: count() })
      .from(scans)
      .where(
        sql`date(${scans.createdAt}) = ${today} AND (${scans.riskLevel} = 'high' OR ${scans.riskLevel} = 'critical')`
      )
      .get()?.count ?? 0;

  return NextResponse.json({
    totalAgents,
    totalScans,
    scansToday,
    highRiskToday,
  });
}
