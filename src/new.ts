import { getClinkyHome, loadConfig, nowUnix, type ClinkyPaths, type Config } from "./util";
import { autoPull, autoPush } from "./git";
import { cardPathForTimestamp, ensureNewCardTemplate } from "./cards";
import { openEditor } from "./editor";
import { relative } from "node:path";
import { existsSync } from "node:fs";

export async function newCommand(paths: ClinkyPaths, config: Config) {
  const pulled = autoPull(paths, config);
  if (!pulled.ok) {
    console.error(pulled.message);
    process.exit(1);
  }

  const ts = nowUnix();
  const filePath = cardPathForTimestamp(paths, ts);
  ensureNewCardTemplate(paths, filePath);

  const res = openEditor(filePath);
  if (!res.ok) {
    console.error(res.message || "Failed to open editor");
    process.exit(1);
  }

  const rel = relative(paths.home, filePath);
  if (existsSync(filePath)) {
    const pushed = autoPush(paths, config, `Created card ${rel}`);
    if (!pushed.ok) {
      console.error(pushed.message);
    }
  }

  console.log(`Created: ${rel}`);
}
