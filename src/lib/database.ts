import Database from 'better-sqlite3';
import { join } from 'path';
import type { Review, CardSchedule } from '../types.js';
import { getClinkyHome } from './config.js';

let db: Database.Database | null = null;

export function getDatabase(): Database.Database {
  if (!db) {
    const dbPath = join(getClinkyHome(), 'reviews.db');
    db = new Database(dbPath);
    initializeDatabase();
  }
  return db;
}

function initializeDatabase(): void {
  if (!db) return;

  // Create reviews table
  db.exec(`
    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      card_name TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      score INTEGER NOT NULL
    )
  `);

  // Create card_schedules table for spaced repetition
  db.exec(`
    CREATE TABLE IF NOT EXISTS card_schedules (
      card_name TEXT PRIMARY KEY,
      next_review TIMESTAMP NOT NULL,
      interval_days INTEGER NOT NULL DEFAULT 1,
      ease_factor REAL NOT NULL DEFAULT 2.5,
      repetitions INTEGER NOT NULL DEFAULT 0,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

export function addReview(review: Review): void {
  const db = getDatabase();
  const stmt = db.prepare(`
    INSERT INTO reviews (card_name, created_at, score)
    VALUES (?, ?, ?)
  `);

  stmt.run(review.cardName, review.createdAt.toISOString(), review.score);
}

export function getCardSchedule(cardName: string): CardSchedule | null {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT card_name, next_review, interval_days, ease_factor, repetitions
    FROM card_schedules
    WHERE card_name = ?
  `);

  const row = stmt.get(cardName) as
    | {
        card_name: string;
        next_review: string;
        interval_days: number;
        ease_factor: number;
        repetitions: number;
      }
    | undefined;
  if (!row) return null;

  return {
    cardName: row.card_name,
    nextReview: new Date(row.next_review),
    interval: row.interval_days,
    easeFactor: row.ease_factor,
    repetitions: row.repetitions,
  };
}

export function updateCardSchedule(schedule: CardSchedule): void {
  const db = getDatabase();
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO card_schedules 
    (card_name, next_review, interval_days, ease_factor, repetitions, updated_at)
    VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
  `);

  stmt.run(
    schedule.cardName,
    schedule.nextReview.toISOString(),
    schedule.interval,
    schedule.easeFactor,
    schedule.repetitions
  );
}

export function getDueCards(): string[] {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT card_name
    FROM card_schedules
    WHERE next_review <= datetime('now')
    ORDER BY next_review ASC
  `);

  const rows = stmt.all() as { card_name: string }[];
  return rows.map((row) => row.card_name);
}

export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
  }
}
