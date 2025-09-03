import { db } from './db';
import path from 'path';

export interface SrsData {
  card_name: string;
  due_date: Date;
  interval: number;
  easiness_factor: number;
}

const DEFAULT_EASINESS_FACTOR = 2.5;
const DEFAULT_INTERVAL = 1;

export const getSrsData = (cardPath: string): SrsData => {
  const card_name = path.basename(cardPath);
  const query = db.query('SELECT due_date, interval, easiness_factor FROM cards WHERE card_name = ?');
  const result = query.get(card_name) as Omit<SrsData, 'card_name' | 'due_date'> & { due_date: string } | null;

  if (result) {
    return {
      card_name,
      due_date: new Date(result.due_date),
      interval: result.interval,
      easiness_factor: result.easiness_factor,
    };
  }

  // Default for new cards
  return {
    card_name,
    due_date: new Date(),
    interval: DEFAULT_INTERVAL,
    easiness_factor: DEFAULT_EASINESS_FACTOR,
  };
};

export const updateSrsData = (cardPath: string, score: number) => {
  const card_name = path.basename(cardPath);
  let srsData = getSrsData(cardPath);

  if (score < 2) { // again
    srsData.interval = 1;
  } else {
    if (srsData.interval === 1) {
      srsData.interval = 6;
    } else {
      srsData.interval = Math.round(srsData.interval * srsData.easiness_factor);
    }
  }

  srsData.easiness_factor += 0.1 - (3 - score) * (0.08 + (3 - score) * 0.02);
  if (srsData.easiness_factor < 1.3) {
    srsData.easiness_factor = 1.3;
  }

  const now = new Date();
  srsData.due_date = new Date(now.setDate(now.getDate() + srsData.interval));

  const upsertQuery = db.query(`
    INSERT INTO cards (card_name, due_date, interval, easiness_factor)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(card_name) DO UPDATE SET
      due_date = excluded.due_date,
      interval = excluded.interval,
      easiness_factor = excluded.easiness_factor;
  `);
  upsertQuery.run(card_name, srsData.due_date.toISOString(), srsData.interval, srsData.easiness_factor);

  const reviewQuery = db.query('INSERT INTO reviews (card_name, score) VALUES (?, ?)');
  reviewQuery.run(card_name, score);
};
