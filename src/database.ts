import { Database } from 'bun:sqlite';
import { join } from 'path';
import { getClinkyHome, ensureClinkyHome } from './config';

export interface Review {
  card_name: string;
  created_at: number; // Julian day as REAL from SQLite
  score: number;
}

export enum Score {
  AGAIN = 0,
  HARD = 1,
  MEDIUM = 2,
  EASY = 3,
}

class ReviewDatabase {
  private db: Database;

  constructor() {
    ensureClinkyHome();
    const dbPath = join(getClinkyHome(), 'reviews.db');
    this.db = new Database(dbPath);
    this.initialize();
  }

  private initialize(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS reviews (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        card_name TEXT NOT NULL,
        created_at REAL DEFAULT (julianday('now')),
        score INTEGER NOT NULL
      )
    `);
  }

  addReview(cardName: string, score: Score): void {
    const stmt = this.db.prepare(
      'INSERT INTO reviews (card_name, created_at, score) VALUES (?, julianday("now"), ?)'
    );
    stmt.run(cardName, score);
  }

  getReviews(cardName: string): Review[] {
    const stmt = this.db.prepare(
      'SELECT * FROM reviews WHERE card_name = ? ORDER BY created_at DESC'
    );
    return stmt.all(cardName) as Review[];
  }

  getAllReviews(): Review[] {
    const stmt = this.db.prepare('SELECT * FROM reviews ORDER BY created_at DESC');
    return stmt.all() as Review[];
  }

  close(): void {
    this.db.close();
  }
}

export default ReviewDatabase;
