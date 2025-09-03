import { readFileSync, readdirSync, statSync } from 'fs';
import { join, basename } from 'path';
import { getClinkyHome } from './config';
import ReviewDatabase, { Review, Score } from './database';

export interface Card {
  path: string;
  name: string;
  front: string;
  back: string;
}

export function parseCard(content: string): { front: string; back: string } {
  const parts = content.split('<!---split--->');
  if (parts.length !== 2) {
    throw new Error('Invalid card format: missing <!---split---> separator');
  }

  const front = parts[0].trim();
  const back = parts[1]
    .split('\n')
    .filter((line) => !line.startsWith('%'))
    .join('\n')
    .trim();

  return { front, back };
}

export function loadCard(path: string): Card {
  const fullPath = join(getClinkyHome(), 'cards', path);
  const content = readFileSync(fullPath, 'utf-8');
  const { front, back } = parseCard(content);

  return {
    path,
    name: basename(path, '.txt'),
    front,
    back,
  };
}

export function getAllCards(): Card[] {
  const cardsDir = join(getClinkyHome(), 'cards');
  const cards: Card[] = [];

  function scanDirectory(dir: string, relativePath: string = ''): void {
    const entries = readdirSync(dir);

    for (const entry of entries) {
      const fullPath = join(dir, entry);
      const relPath = relativePath ? join(relativePath, entry) : entry;
      const stat = statSync(fullPath);

      if (stat.isDirectory()) {
        scanDirectory(fullPath, relPath);
      } else if (entry.endsWith('.txt')) {
        try {
          const content = readFileSync(fullPath, 'utf-8');
          const { front, back } = parseCard(content);
          cards.push({
            path: relPath,
            name: basename(entry, '.txt'),
            front,
            back,
          });
        } catch (error) {
          console.error(`Error loading card ${relPath}:`, error);
        }
      }
    }
  }

  scanDirectory(cardsDir);
  return cards;
}

// Convert Julian day to milliseconds since Unix epoch
export function julianToMs(julianDay: number): number {
  return (julianDay - 2440587.5) * 86400000;
}

// Get initial interval based on score
function getInitialInterval(score: Score): number {
  switch (score) {
    case Score.AGAIN:
      return 1 * 60 * 1000; // 1 minute
    case Score.HARD:
      return 10 * 60 * 1000; // 10 minutes
    case Score.MEDIUM:
      return 24 * 60 * 60 * 1000; // 1 day
    case Score.EASY:
      return 4 * 24 * 60 * 60 * 1000; // 4 days
  }
}

// Scale interval based on score
function scaleInterval(prevInterval: number, score: Score): number {
  switch (score) {
    case Score.AGAIN:
      return 1 * 60 * 1000; // Reset to 1 minute
    case Score.HARD:
      return prevInterval * 1.2;
    case Score.MEDIUM:
      return prevInterval * 2.5;
    case Score.EASY:
      return prevInterval * 3.5;
  }
}

// Simple SM-2 algorithm implementation
export function calculateNextReview(reviews: Review[]): Date {
  if (reviews.length === 0) {
    // No reviews yet, card is due now
    return new Date();
  }

  const lastReview = reviews[0];
  const lastReviewMs = julianToMs(lastReview.created_at);
  const lastScore = lastReview.score as Score;

  let newInterval: number;

  if (reviews.length === 1) {
    // First review, use initial interval
    newInterval = getInitialInterval(lastScore);
  } else {
    // Calculate interval based on previous reviews
    const prevReview = reviews[1];
    const prevReviewMs = julianToMs(prevReview.created_at);
    const lastInterval = lastReviewMs - prevReviewMs;
    newInterval = scaleInterval(lastInterval, lastScore);
  }

  return new Date(lastReviewMs + newInterval);
}

export function getDueCards(): Card[] {
  const db = new ReviewDatabase();
  const allCards = getAllCards();
  const now = new Date();

  const dueCards = allCards.filter((card) => {
    const reviews = db.getReviews(card.name);

    if (reviews.length === 0) {
      // Never reviewed, so it's due
      return true;
    }

    const nextReviewDate = calculateNextReview(reviews);
    return nextReviewDate <= now;
  });

  db.close();
  return dueCards;
}
