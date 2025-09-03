import { Database } from 'bun:sqlite';
import path from 'path';
import { CLINKY_HOME } from './config';

const DB_PATH = path.join(CLINKY_HOME, 'reviews.db');

export const db = new Database(DB_PATH);

const initDb = () => {
  db.run(`
    CREATE TABLE IF NOT EXISTS reviews (
      card_name TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      score INTEGER NOT NULL,
      PRIMARY KEY (card_name, created_at)
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS cards (
      card_name TEXT PRIMARY KEY,
      due_date TIMESTAMP NOT NULL,
      interval INTEGER NOT NULL,
      easiness_factor REAL NOT NULL
    );
  `);
};

initDb();
