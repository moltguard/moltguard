import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";

const DATABASE_PATH = process.env.DATABASE_PATH || "./moltguard.db";

let _db: ReturnType<typeof drizzle<typeof schema>> | null = null;

function ensureTables(sqlite: Database.Database) {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS agents (
      id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      api_key TEXT NOT NULL,
      anonymous_id TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      last_active TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE UNIQUE INDEX IF NOT EXISTS agents_api_key_unique ON agents (api_key);

    CREATE TABLE IF NOT EXISTS scans (
      id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
      scan_id TEXT NOT NULL,
      agent_id INTEGER NOT NULL REFERENCES agents(id),
      scan_type TEXT NOT NULL,
      risk_level TEXT,
      risk_types TEXT,
      score INTEGER,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE UNIQUE INDEX IF NOT EXISTS scans_scan_id_unique ON scans (scan_id);
  `);

  // Migrate: add anonymous_id column if missing (from older schema)
  try {
    sqlite.exec(`ALTER TABLE agents ADD COLUMN anonymous_id TEXT NOT NULL DEFAULT ''`);
  } catch {
    // Column already exists
  }
}

export function getDb() {
  if (!_db) {
    const sqlite = new Database(DATABASE_PATH);
    sqlite.pragma("journal_mode = WAL");
    sqlite.pragma("foreign_keys = ON");
    ensureTables(sqlite);
    _db = drizzle(sqlite, { schema });
  }
  return _db;
}
