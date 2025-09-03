import type { CardState } from "./db";
import { nowUnix } from "./util";

/**
 * Simplified SM-2 scheduling.
 * Scores:
 *  - again: 0
 *  - hard: 2
 *  - medium: 3
 *  - easy: 5
 */
export type Rating = "again" | "hard" | "medium" | "easy";
export function ratingToScore(r: Rating): number {
  switch (r) {
    case "again":
      return 0;
    case "hard":
      return 2;
    case "medium":
      return 3;
    case "easy":
      return 5;
  }
}

export function updateSchedule(
  state: CardState,
  rating: Rating,
  atTs = nowUnix(),
): Omit<CardState, "card_name"> {
  const q = ratingToScore(rating);
  let ef = state.ef;
  let reps = state.reps;
  let interval = state.interval;

  if (q < 3) {
    reps = 0;
    interval = 1;
  } else {
    if (reps === 0) {
      interval = 1;
    } else if (reps === 1) {
      interval = 6;
    } else {
      interval = Math.round(interval * ef);
    }
    reps += 1;
  }

  ef = ef + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
  if (ef < 1.3) ef = 1.3;

  const next_due = atTs + interval * 24 * 60 * 60;
  return {
    ef,
    reps,
    interval,
    next_due,
    last_reviewed: atTs,
  };
}
