import { readCard, listAllCardPaths, openEditor } from "./cards";
import { getHistory, logReview } from "./db";
import type { ReviewScore } from "./types";
import readline from "readline";
import { existsSync } from "fs";
import { join } from "path";
import { getHomeDir } from "./config";

type SM2State = {
  ef: number; // E-Factor
  interval: number; // days
  repetitions: number;
  lastReview?: Date;
};

function computeState(historyScores: number[], historyDates: Date[]): SM2State {
  // SM-2 simplified; map score 0-5; we will use: again=1, hard=3, medium=4, easy=5
  let ef = 2.5;
  let interval = 0;
  let repetitions = 0;
  let lastReview: Date | undefined = undefined;
  for (let i = 0; i < historyScores.length; i++) {
    const q = historyScores[i]; // 0..5
    lastReview = historyDates[i];
    if (q < 3) {
      repetitions = 0;
      interval = 1;
    } else {
      if (repetitions === 0) interval = 1;
      else if (repetitions === 1) interval = 6;
      else interval = Math.round(interval * ef);
      repetitions++;
    }
    ef = ef + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
    if (ef < 1.3) ef = 1.3;
  }
  return { ef, interval, repetitions, lastReview };
}

function nextDueDate(historyScores: number[], historyDates: Date[]): Date {
  const state = computeState(historyScores, historyDates);
  const base = state.lastReview ?? new Date(0);
  const due = new Date(base);
  // interval in days; if repetitions==0 (never reviewed), due immediately
  const days = state.repetitions === 0 ? 0 : state.interval;
  due.setDate(due.getDate() + days);
  return due;
}

function isCardDue(cardName: string): boolean {
  const history = getHistory(cardName);
  if (history.length === 0) return true;
  const scores = history.map((h) => h.score);
  const dates = history.map((h) => new Date(h.created_at));
  const due = nextDueDate(scores, dates);
  return due <= new Date();
}

async function prompt(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  const answer: string = await new Promise((resolve) =>
    rl.question(question, resolve),
  );
  rl.close();
  return answer;
}

export async function startReview(optionalRelPath?: string): Promise<void> {
  let targets: string[] = [];
  if (optionalRelPath) {
    const abs = join(getHomeDir(), optionalRelPath);
    if (!existsSync(abs)) {
      console.error(`Card not found: ${optionalRelPath}`);
      return;
    }
    targets = [abs];
  } else {
    targets = await listAllCardPaths();
    targets = targets.filter((p) => isCardDue(p.split("/").pop()!));
  }

  if (targets.length === 0) {
    console.log("No due cards. 🎉");
    return;
  }

  let reviewedCount = 0;
  for (const p of targets) {
    const c = readCard(p);
    console.log("\n---");
    console.log(c.front);
    const cmd = await prompt(
      "\nPress Enter to reveal, 'e' to edit, 'q' to quit: ",
    );
    if (cmd.toLowerCase() === "q") break;
    if (cmd.toLowerCase() === "e") {
      openEditor(p);
      // reload
      continue;
    }
    console.log("\n" + c.back);
    while (true) {
      const ans = (
        await prompt(
          "\nRate recall [1] again [2] hard [3] medium [4] easy, or 'e' edit, 'q' quit: ",
        )
      )
        .trim()
        .toLowerCase();
      if (ans === "q") return;
      if (ans === "e") {
        openEditor(p);
        continue;
      }
      const map: Record<string, ReviewScore | undefined> = {
        "1": "again",
        "2": "hard",
        "3": "medium",
        "4": "easy",
      };
      const score = map[ans];
      if (!score) {
        console.log("Invalid input.");
        continue;
      }
      logReview(c.name, score);
      reviewedCount++;
      break;
    }
  }
  console.log(`\nReviewed ${reviewedCount} card(s).`);
}
