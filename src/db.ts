import { Database } from "bun:sqlite";
import { existsSync } from "node:fs";

export type CardState = {
  card_name: string;
  ef: number;
  interval: number; // days
  reps: number;
  next_due: number; // unix timestamp
  last_reviewed: number | null;
};

export class ReviewDB {
  db: Database;

  constructor(public filepath: string) {
    const firstTime = !existsSync(filepath);
    this.db = new Database(filepath);
    this.db.exec("PRAGMA journal_mode=WAL;");
    if (firstTime) {
      this.migrate();
    } else {
      this.migrate(); // idempotent
    }
  }

  migrate() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS reviews (
        card_name TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        score INTEGER NOT NULL
      );
    `);
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS card_state (
        card_name TEXT PRIMARY KEY,
        ef REAL NOT NULL DEFAULT 2.5,
        interval INTEGER NOT NULL DEFAULT 0,
        reps INTEGER NOT NULL DEFAULT 0,
        next_due INTEGER NOT NULL DEFAULT 0,
        last_reviewed INTEGER
      );
    `);
    this.db.exec(`CREATE INDEX IF NOT EXISTS idx_reviews_card ON reviews(card_name);`);
    this.db.exec(`CREATE INDEX IF NOT EXISTS idx_card_due ON card_state(next_due);`);
  }

  getState(cardName: string): CardState {
    const row = this.db
      .query(
        `SELECT card_name, ef, interval, reps, next_due, last_reviewed FROM card_state WHERE card_name = ?`,
      )
      .get(cardName) as CardState | undefined;
    if (row) return row;
    const initial: CardState = {
      card_name: cardName,
      ef: 2.5,
      interval: 0,
      reps: 0,
      next_due: 0,
      last_reviewed: null,
    };
    this.db
      .query(
        `INSERT OR IGNORE INTO card_state (card_name, ef, interval, reps, next_due, last_reviewed) VALUES (?, ?, ?, ?, ?, ?)`,
      )
      .run(initial.card_name, initial.ef, initial.interval, initial.reps, initial.next_due, null);
    return initial;
  }

  recordReview(cardName: string, score: number, nowTs: number, next: Omit<CardState, "card_name">) {
    this.db
      .query(`INSERT INTO reviews (card_name, created_at, score) VALUES (?, ?, ?)`)
      .run(cardName, nowTs, score);
    this.db
      .query(
        `INSERT INTO card_state (card_name, ef, interval, reps, next_due, last_reviewed)
         VALUES (?, ?, ?, ?, ?, ?)
         ON CONFLICT(card_name) DO UPDATE SET
           ef=excluded.ef,
           interval=excluded.interval,
           reps=excluded.reps,
           next_due=excluded.next_due,
           last_reviewed=excluded.last_reviewed`,
      )
      .run(cardName, next.ef, next.interval, next.reps, next.next_due, next.last_reviewed);
  }

  dueCards(nowTs: number): string[] {
    const rows = this.db
      .query(
        `SELECT card_name FROM card_state WHERE next_due <= ? OR next_due IS NULL OR next_due = 0`,
      )
      .all(nowTs) as { card_name: string }[];
    return rows.map((r) => r.card_name);
  }
}
