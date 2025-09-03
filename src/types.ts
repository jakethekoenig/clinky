export type Config = {
  auto_pull: boolean;
  auto_push: boolean;
};

export type ReviewScore = "again" | "hard" | "medium" | "easy";

export type Card = {
  path: string; // absolute path to file
  name: string; // filename only (unique)
  front: string;
  back: string;
};

export type ReviewRecord = {
  card_name: string;
  created_at: string; // ISO
  score: number; // 0..5
};
