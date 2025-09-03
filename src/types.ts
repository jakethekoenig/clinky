export interface Card {
  name: string;
  front: string;
  back: string;
  filePath: string;
}

export interface Review {
  cardName: string;
  createdAt: Date;
  score: ReviewScore;
}

export enum ReviewScore {
  Again = 1,
  Hard = 2,
  Medium = 3,
  Easy = 4,
}

export interface Config {
  autoPull: boolean;
  autoPush: boolean;
}

export interface CardSchedule {
  cardName: string;
  nextReview: Date;
  interval: number;
  easeFactor: number;
  repetitions: number;
}
