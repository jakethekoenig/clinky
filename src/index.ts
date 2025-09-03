import { loadConfig } from "./config";
import { autoPullIfEnabled, autoPushIfEnabled } from "./git";
import { createNewCard } from "./cards";
import { startReview } from "./review";

function usage(): void {
  console.log(`Clinky - spaced repetition CLI

Usage:
  bun run clinky new
  bun run clinky review [path/to/card.txt]

Environment:
  CLINKY_HOME   Override data directory (default ~/.config/clinky)
  EDITOR        Editor to use (default vim)
`);
}

export async function main(argv: string[]): Promise<void> {
  const [cmd, ...rest] = argv;
  if (!cmd || cmd === "-h" || cmd === "--help") {
    usage();
    return;
  }
  const cfg = loadConfig();
  switch (cmd) {
    case "new": {
      autoPullIfEnabled(cfg.auto_pull);
      const path = createNewCard();
      autoPushIfEnabled(cfg.auto_push, `Created card ${path}`);
      break;
    }
    case "review": {
      autoPullIfEnabled(cfg.auto_pull);
      const pathArg = rest[0];
      await startReview(pathArg);
      if (cfg.auto_push) {
        autoPushIfEnabled(true, "Reviewed cards");
      }
      break;
    }
    default:
      usage();
  }
}

if (import.meta.main) {
  // Bun passes full argv including node/bun and script; slice after script
  const args = process.argv.slice(2);
  main(args).catch((e) => {
    console.error(e instanceof Error ? e.message : String(e));
    process.exit(1);
  });
}
