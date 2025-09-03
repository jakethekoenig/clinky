import { readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import readline from "node:readline";
import type { ClinkyPaths, Config } from "./util";
import { nowUnix } from "./util";
import { ReviewDB } from "./db";
import { readCard, cardNameFromPath } from "./cards";
import { updateSchedule, type Rating, ratingToScore } from "./scheduling";
import { autoPull, autoPush } from "./git";
import { openEditor } from "./editor";

export async function reviewCommand(paths: ClinkyPaths, config: Config, relativePath?: string) {
  // Auto pull
  const pulled = autoPull(paths, config);
  if (!pulled.ok) {
    console.error(pulled.message);
    process.exit(1);
  }

  const db = new ReviewDB(paths.dbPath);
  let cardPaths: string[] = [];
  if (relativePath) {
    cardPaths = [resolve(paths.home, relativePath)];
  } else {
    // Scan filesystem and decide due per file (missing state => due)
    const now = nowUnix();
    const stack = [paths.cardsDir];
    while (stack.length) {
      const dir = stack.pop()!;
      for (const entry of readdirSync(dir)) {
        const full = join(dir, entry);
        const st = statSync(full);
        if (st.isDirectory()) {
          stack.push(full);
        } else if (st.isFile()) {
          const name = cardNameFromPath(paths, full);
          const state = db.getState(name);
          const due = state.last_reviewed == null || state.next_due <= now;
          if (due) cardPaths.push(full);
        }
      }
    }
  }

  if (cardPaths.length === 0) {
    console.log("No due cards.");
    return;
  }

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const ask = (q: string) => new Promise<string>((resolve) => rl.question(q, resolve));

  let reviewedCount = 0;

  for (const filePath of cardPaths) {
    const name = cardNameFromPath(paths, filePath);
    const card = readCard(filePath);

    // Show front
    console.log("-----");
    console.log(card.front || "(empty front)");
    const before = await ask("\nPress Enter to show the back (q=quit, e=edit)... ");
    if (before.trim().toLowerCase() === "q") {
      break;
    }
    if (before.trim().toLowerCase() === "e") {
      const editRes = openEditor(filePath);
      if (!editRes.ok) {
        console.error(editRes.message || "Failed to open editor");
        break;
      }
      // re-read updated card front before showing back
    }
    console.log("\n" + (readCard(filePath).back || "(empty back)"));

    // Ask for rating (1 easiest .. 4 hardest/again). Allow edit/quit here too.
    let ratingInput = await ask(
      "\nRate your recall: 1=easy, 2=medium, 3=hard, 4=again (e=edit, q=quit) > ",
    );
    ratingInput = ratingInput.trim().toLowerCase();

    if (ratingInput === "q") {
      break;
    }
    if (ratingInput === "e") {
      const editRes = openEditor(filePath);
      if (!editRes.ok) {
        console.error(editRes.message || "Failed to open editor");
        break;
      }
      // after edit, fall through to ask rating again
      ratingInput = await ask("\nRate your recall: 1=easy, 2=medium, 3=hard, 4=again (q=quit) > ");
      ratingInput = ratingInput.trim().toLowerCase();
      if (ratingInput === "q") break;
    }

    const mapNum: Record<string, Rating> = {
      "1": "easy",
      "2": "medium",
      "3": "hard",
      "4": "again",
    };
    const rating = mapNum[ratingInput];
    if (!rating) {
      console.log("Invalid input, skipping card.");
      continue;
    }

    const state = db.getState(name);
    const next = updateSchedule(state, rating);
    db.recordReview(name, ratingToScore(rating), next.last_reviewed!, next);
    reviewedCount += 1;
  }

  rl.close();

  if (reviewedCount > 0) {
    const pushed = autoPush(paths, config, `Reviewed ${reviewedCount} cards`);
    if (!pushed.ok) {
      console.error(pushed.message);
    }
  }
}
