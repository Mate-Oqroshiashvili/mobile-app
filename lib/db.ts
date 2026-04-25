import * as SQLite from "expo-sqlite";

export type UserRole = "admin" | "user";

export type User = {
  id: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
};

export type ScanLog = {
  id: number;
  user_id: string;
  turnstile_id: string;
  academy_id: string;
  scanned_at_iso: string;
  scanned_date: string;
  result: "allowed" | "duplicate" | "invalid_qr" | "unknown_user";
};

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

async function init(): Promise<SQLite.SQLiteDatabase> {
  const db = await SQLite.openDatabaseAsync("academy.db");

  // ⚠️ ეს ხაზები შლის ძველ, გაფუჭებულ ბაზას და აგვარებს შენახვის ერორს
  await db.execAsync(`
    DROP TABLE IF EXISTS users;
    DROP TABLE IF EXISTS scan_logs;
  `);

  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user'
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
  `);

  return db;
}

export const getDb = () => {
  if (!dbPromise) dbPromise = init();
  return dbPromise;
};

export async function registerUser(user: Omit<User, "id">) {
  const db = await getDb();
  const id = `u_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const cleanEmail = user.email.toLowerCase().trim();

  try {
    await db.runAsync(
      "INSERT INTO users (id, name, email, password, role) VALUES (?, ?, ?, ?, ?)",
      [id, user.name, cleanEmail, user.password, user.role]
    );
    return id;
  } catch (error: any) {
    if (error.message?.includes("UNIQUE constraint failed")) {
      throw new Error("EMAIL_EXISTS");
    }
    throw new Error("DATABASE_WRITE_ERROR");
  }
}

export async function loginUser(email: string, pass: string): Promise<User | null> {
  const db = await getDb();
  const cleanEmail = email.toLowerCase().trim();
  return db.getFirstAsync<User>(
    "SELECT id, name, email, role FROM users WHERE email = ? AND password = ?",
    [cleanEmail, pass]
  );
}

export async function getUserById(id: string): Promise<User | null> {
  const db = await getDb();
  return db.getFirstAsync<User>("SELECT id, name, email, role FROM users WHERE id = ?", [id]);
}

export async function getAllUsers(): Promise<User[]> {
  const db = await getDb();
  return db.getAllAsync<User>("SELECT id, name, email, role FROM users");
}

export async function getRecentLogs(limit: number): Promise<ScanLog[]> {
  const db = await getDb();
  return db.getAllAsync<ScanLog>(
    "SELECT * FROM scan_logs ORDER BY scanned_at_iso DESC LIMIT ?", 
    [limit]
  );
}

export async function findAllowedScanForToday(
  userId: string,
  turnstileId: string,
  date: string
): Promise<ScanLog | null> {
  const db = await getDb();
  return db.getFirstAsync<ScanLog>(
    "SELECT * FROM scan_logs WHERE user_id = ? AND turnstile_id = ? AND scanned_date = ? AND result = 'allowed'",
    [userId, turnstileId, date]
  );
}

export async function insertScanLog(log: Omit<ScanLog, "id">): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    "INSERT INTO scan_logs (user_id, turnstile_id, academy_id, scanned_at_iso, scanned_date, result) VALUES (?, ?, ?, ?, ?, ?)",
    [log.user_id, log.turnstile_id, log.academy_id, log.scanned_at_iso, log.scanned_date, log.result]
  );
}