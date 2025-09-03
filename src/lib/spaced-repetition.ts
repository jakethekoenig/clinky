import { ReviewScore, type CardSchedule } from '../types.js';

/**
 * Implements a simplified SM-2 algorithm for spaced repetition
 * Based on the SuperMemo SM-2 algorithm
 */
export function calculateNextReview(
  currentSchedule: CardSchedule | null,
  score: ReviewScore
): CardSchedule {
  const now = new Date();

  // Default values for new cards
  let interval = 1;
  let easeFactor = 2.5;
  let repetitions = 0;
  let cardName = '';

  if (currentSchedule) {
    interval = currentSchedule.interval;
    easeFactor = currentSchedule.easeFactor;
    repetitions = currentSchedule.repetitions;
    cardName = currentSchedule.cardName;
  }

  // Update ease factor based on score
  if (score >= ReviewScore.Medium) {
    easeFactor = easeFactor + (0.1 - (5 - score) * (0.08 + (5 - score) * 0.02));
  }

  // Ensure ease factor doesn't go below 1.3
  if (easeFactor < 1.3) {
    easeFactor = 1.3;
  }

  // Calculate new interval based on score
  if (score < ReviewScore.Medium) {
    // Again or Hard - reset repetitions and use short interval
    repetitions = 0;
    interval =
      score === ReviewScore.Again ? 1 : Math.max(1, Math.floor(interval * 0.6));
  } else {
    // Medium or Easy - increase interval
    repetitions += 1;

    if (repetitions === 1) {
      interval = 1;
    } else if (repetitions === 2) {
      interval = 6;
    } else {
      interval = Math.round(interval * easeFactor);

      // Apply score modifier
      if (score === ReviewScore.Easy) {
        interval = Math.round(interval * 1.3);
      }
    }
  }

  // Calculate next review date
  const nextReview = new Date(now);
  nextReview.setDate(nextReview.getDate() + interval);

  return {
    cardName,
    nextReview,
    interval,
    easeFactor,
    repetitions,
  };
}

export function parseReviewScore(input: string): ReviewScore | null {
  const normalized = input.toLowerCase().trim();

  switch (normalized) {
    case 'again':
    case 'a':
    case '1':
      return ReviewScore.Again;
    case 'hard':
    case 'h':
    case '2':
      return ReviewScore.Hard;
    case 'medium':
    case 'm':
    case '3':
      return ReviewScore.Medium;
    case 'easy':
    case 'e':
    case '4':
      return ReviewScore.Easy;
    default:
      return null;
  }
}
