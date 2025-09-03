import { Database } from "bun:sqlite";
import { join } from "path";
import { ensureHomeLayout, getHomeDir } from "./config";
import type { ReviewRecord, ReviewScore } from "./types";

function dbPath(): string {
  ensureHomeLayout();
  return join(getHomeDir(), "reviews.db");
}

export function openDb(): Database {
  const db = new Database(dbPath());
  db.exec(`CREATE TABLE IF NOT EXISTS reviews (
    card_name TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    score INTEGER NOT NULL
  );`);
  return db;
}

export function logReview(cardName: string, score: ReviewScore): void {
  const map: Record<ReviewScore, number> = {
    again: 1,
    hard: 3,
    medium: 4,
    easy: 5,
  };
  const db = openDb();
  const stmt = db.prepare(
    "INSERT INTO reviews (card_name, score) VALUES (?, ?)",
  );
  stmt.run(cardName, map[score]);
  db.close();
}

export function getHistory(cardName: string): ReviewRecord[] {
  const db = openDb();
  const rows = db
    .query(
      "SELECT card_name, created_at, score FROM reviews WHERE card_name = ? ORDER BY created_at ASC",
    )
    .all(cardName) as any[];
  db.close();
  return rows.map((r) => ({
    card_name: r.card_name,
    created_at: r.created_at,
    score: Number(r.score),
  }));
}
