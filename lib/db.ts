import Database from "better-sqlite3";
import path from "node:path";
import fs from "node:fs";

const DB_PATH = process.env.DB_PATH || path.join(process.cwd(), "data", "duoday.db");
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

declare global {
  // eslint-disable-next-line no-var
  var __duodayDb: Database.Database | undefined;
}

function open(): Database.Database {
  const conn = new Database(DB_PATH);
  conn.pragma("journal_mode = WAL");
  conn.pragma("busy_timeout = 5000");
  conn.pragma("foreign_keys = ON");
  return conn;
}

export const db: Database.Database = global.__duodayDb ?? open();
if (process.env.NODE_ENV !== "production") global.__duodayDb = db;

/**
 * Schema. Idempotent: safe to run on every boot.
 * v1.1 adds emotion_tag, is_best, photos table for multi-photo support
 * (legacy date_logs.photo_path kept for backwards compatibility).
 */
export function migrate(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS couples (
      id          TEXT PRIMARY KEY,
      name        TEXT NOT NULL,
      partner_a   TEXT NOT NULL,
      partner_b   TEXT NOT NULL,
      started_on  TEXT NOT NULL,
      created_at  TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS questions (
      id      INTEGER PRIMARY KEY AUTOINCREMENT,
      prompt  TEXT NOT NULL UNIQUE
    );

    CREATE TABLE IF NOT EXISTS daily_questions (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      couple_id    TEXT NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
      date         TEXT NOT NULL,
      question_id  INTEGER NOT NULL REFERENCES questions(id),
      UNIQUE (couple_id, date)
    );

    CREATE TABLE IF NOT EXISTS answers (
      id                  INTEGER PRIMARY KEY AUTOINCREMENT,
      daily_question_id   INTEGER NOT NULL REFERENCES daily_questions(id) ON DELETE CASCADE,
      author              TEXT NOT NULL CHECK (author IN ('a','b')),
      body                TEXT NOT NULL,
      created_at          TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE (daily_question_id, author)
    );

    CREATE TABLE IF NOT EXISTS date_logs (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      couple_id     TEXT NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
      date          TEXT NOT NULL,
      place         TEXT NOT NULL,
      title         TEXT NOT NULL,
      feeling       TEXT NOT NULL,
      photo_path    TEXT,
      emotion_tag   TEXT,
      is_best       INTEGER NOT NULL DEFAULT 0,
      created_at    TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS date_photos (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      date_log_id INTEGER NOT NULL REFERENCES date_logs(id) ON DELETE CASCADE,
      path        TEXT NOT NULL,
      sort_order  INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS book_orders (
      id                 TEXT PRIMARY KEY,
      couple_id          TEXT NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
      title              TEXT NOT NULL,
      cover_color        TEXT NOT NULL,
      range_start        TEXT NOT NULL,
      range_end          TEXT NOT NULL,
      include_questions  INTEGER NOT NULL DEFAULT 1,
      include_dates      INTEGER NOT NULL DEFAULT 1,
      status             TEXT NOT NULL DEFAULT 'pending'
                          CHECK (status IN ('pending','processing','completed','cancelled')),
      note               TEXT,
      created_at         TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at         TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  // Lightweight column add for older DBs upgrading to v1.1
  const cols = db.prepare(`PRAGMA table_info(date_logs)`).all() as { name: string }[];
  const has = (n: string) => cols.some((c) => c.name === n);
  if (!has("emotion_tag")) db.exec(`ALTER TABLE date_logs ADD COLUMN emotion_tag TEXT`);
  if (!has("is_best")) db.exec(`ALTER TABLE date_logs ADD COLUMN is_best INTEGER NOT NULL DEFAULT 0`);
  if (!has("updated_at"))
    db.exec(`ALTER TABLE date_logs ADD COLUMN updated_at TEXT NOT NULL DEFAULT (datetime('now'))`);
}

migrate();
