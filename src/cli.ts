#!/usr/bin/env bun
import { getClinkyHome, loadConfig } from "./util";
import { newCommand } from "./new";
import { reviewCommand } from "./review";

function printHelp() {
  console.log(`Clinky - a CLI spaced repetition program

Usage:
  clinky new
  clinky review [path]

Commands:
  new              Open editor to create a new card at CLINKY_HOME/cards/TIMESTAMP.txt
  review [path]    Start a review session. If 'path' is given (relative to CLINKY_HOME), review only that card.

Environment:
  CLINKY_HOME      Override the data directory (default: ~/.config/clinky)
  EDITOR           Editor to use for 'clinky new' (default: vim)
`);
}

async function main() {
  const args = process.argv.slice(2);
  const paths = getClinkyHome();
  const config = loadConfig(paths);

  const cmd = args[0];
  if (!cmd || cmd === "help" || cmd === "--help" || cmd === "-h") {
    printHelp();
    return;
  }
  if (cmd === "new") {
    await newCommand(paths, config);
    return;
  }
  if (cmd === "review") {
    const relPath = args[1];
    await reviewCommand(paths, config, relPath);
    return;
  }

  console.error(`Unknown command: ${cmd}`);
  printHelp();
  process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
