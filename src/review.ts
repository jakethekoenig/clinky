import { readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import readline from "node:readline";
import type { ClinkyPaths, Config } from "./util";
import { getClinkyHome, loadConfig, nowUnix } from "./util";
import { ReviewDB } from "./db";
import { readCard, cardNameFromPath } from "./cards";
import { updateSchedule, type Rating } from "./scheduling";
import { autoPull, autoPush } from "./git";

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
    // Build list of due cards by comparing card_state to files on disk
    const dueNames = new Set(db.dueCards(nowUnix()));
    // Scan cards dir
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
          if (dueNames.has(name) || dueNames.size === 0) {
            cardPaths.push(full);
          }
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
    await ask("\nPress Enter to show the back...");
    console.log("\n" + (card.back || "(empty back)"));

    // Ask for rating
    let ratingInput = await ask(
      "\nRate your recall: (e)asy, (m)edium, (h)ard, (a)gain, (e to edit card, q to quit) > ",
    );
    ratingInput = ratingInput.trim().toLowerCase();

    if (ratingInput === "q") {
      break;
    }
    if (ratingInput === "e") {
      // Signal to caller to handle edit by exiting with code
      rl.close();
      // Use cli main to handle 'e' flag; for now, tell user to rerun with 'clinky new' and open file manually
      console.log(
        "Edit within your editor using 'clinky new' to create or edit the file directly.",
      );
      return;
    }

    const map: Record<string, Rating> = {
      e: "easy",
      m: "medium",
      h: "hard",
      a: "again",
      easy: "easy",
      medium: "medium",
      hard: "hard",
      again: "again",
    };
    const rating = map[ratingInput];
    if (!rating) {
      console.log("Invalid input, skipping card.");
      continue;
    }

    const state = db.getState(name);
    const next = updateSchedule(state, rating);
    db.recordReview(
      name,
      rating === "again" ? 0 : rating === "hard" ? 2 : rating === "medium" ? 3 : 5,
      next.last_reviewed!,
      next,
    );
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
