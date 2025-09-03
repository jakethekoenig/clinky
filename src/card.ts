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
    throw new Error('Invalid card format: missing <!---split--> separator');
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

// Simple SM-2 algorithm implementation
export function calculateNextReview(reviews: Review[], score: Score): Date {
  const now = new Date();

  if (reviews.length === 0) {
    // First review
    switch (score) {
      case Score.AGAIN:
        return new Date(now.getTime() + 1 * 60 * 1000); // 1 minute
      case Score.HARD:
        return new Date(now.getTime() + 10 * 60 * 1000); // 10 minutes
      case Score.MEDIUM:
        return new Date(now.getTime() + 24 * 60 * 60 * 1000); // 1 day
      case Score.EASY:
        return new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000); // 4 days
    }
  }

  // Calculate interval based on previous reviews
  const lastReview = reviews[0];
  const lastInterval =
    reviews.length > 1
      ? new Date(lastReview.created_at).getTime() - new Date(reviews[1].created_at).getTime()
      : 24 * 60 * 60 * 1000; // Default to 1 day

  let newInterval: number;
  switch (score) {
    case Score.AGAIN:
      newInterval = 1 * 60 * 1000; // Reset to 1 minute
      break;
    case Score.HARD:
      newInterval = lastInterval * 1.2;
      break;
    case Score.MEDIUM:
      newInterval = lastInterval * 2.5;
      break;
    case Score.EASY:
      newInterval = lastInterval * 3.5;
      break;
  }

  return new Date(now.getTime() + newInterval);
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

    const lastReview = reviews[0];
    const lastScore = lastReview.score as Score;
    const nextReviewDate = calculateNextReview(reviews.slice(1), lastScore);

    return nextReviewDate <= now;
  });

  db.close();
  return dueCards;
}
