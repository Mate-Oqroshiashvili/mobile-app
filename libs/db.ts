import * as SQLite from "expo-sqlite";
import { SEED_USERS, type User } from "./users";

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

async function init(): Promise<SQLite.SQLiteDatabase> {
  const db = await SQLite.openDatabaseAsync("academy.db");
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS scan_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      turnstile_id TEXT NOT NULL,
      academy_id TEXT NOT NULL,
      scanned_at_iso TEXT NOT NULL,
      scanned_date TEXT NOT NULL,
      result TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_scan_logs_user_date
      ON scan_logs(user_id, scanned_date);
  `);
  for (const u of SEED_USERS) {
    await db.runAsync(
      "INSERT OR IGNORE INTO users (id, name, email) VALUES (?, ?, ?)",
      u.id,
      u.name,
      u.email,
    );
  }
  return db;
}

export function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) dbPromise = init();
  return dbPromise;
}

export async function getAllUsers(): Promise<User[]> {
  const db = await getDb();
  return db.getAllAsync<User>(
    "SELECT id, name, email FROM users ORDER BY name",
  );
}

export async function getUserById(id: string): Promise<User | null> {
  const db = await getDb();
  return db.getFirstAsync<User>(
    "SELECT id, name, email FROM users WHERE id = ?",
    id,
  );
}

export type ScanResultKind =
  | "allowed"
  | "duplicate"
  | "unknown_user"
  | "invalid_qr";

export type ScanLog = {
  id: number;
  user_id: string;
  turnstile_id: string;
  academy_id: string;
  scanned_at_iso: string;
  scanned_date: string;
  result: ScanResultKind;
};

export async function findAllowedScanForToday(
  userId: string,
  turnstileId: string,
  dateYYYYMMDD: string,
): Promise<ScanLog | null> {
  const db = await getDb();
  return db.getFirstAsync<ScanLog>(
    `SELECT * FROM scan_logs
     WHERE user_id = ? AND turnstile_id = ? AND scanned_date = ? AND result = 'allowed'
     LIMIT 1`,
    userId,
    turnstileId,
    dateYYYYMMDD,
  );
}

export async function insertScanLog(log: Omit<ScanLog, "id">): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO scan_logs (user_id, turnstile_id, academy_id, scanned_at_iso, scanned_date, result)
     VALUES (?, ?, ?, ?, ?, ?)`,
    log.user_id,
    log.turnstile_id,
    log.academy_id,
    log.scanned_at_iso,
    log.scanned_date,
    log.result,
  );
}

export async function getRecentLogs(limit = 200): Promise<ScanLog[]> {
  const db = await getDb();
  return db.getAllAsync<ScanLog>(
    "SELECT * FROM scan_logs ORDER BY id DESC LIMIT ?",
    limit,
  );
}
