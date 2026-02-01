import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const agents = sqliteTable("agents", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  description: text("description"),
  apiKey: text("api_key").notNull().unique(),
  anonymousId: text("anonymous_id").notNull(),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
  lastActive: text("last_active")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const scans = sqliteTable("scans", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  scanId: text("scan_id").notNull().unique(),
  agentId: integer("agent_id")
    .notNull()
    .references(() => agents.id),
  scanType: text("scan_type", { enum: ["email", "webpage"] }).notNull(),
  riskLevel: text("risk_level"),
  riskTypes: text("risk_types"), // JSON text
  score: integer("score"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});
