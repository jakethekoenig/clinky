import { spawnSync } from "node:child_process";
import type { ClinkyPaths, Config } from "./util";

function inGitRepo(paths: ClinkyPaths): boolean {
  const res = spawnSync("git", ["-C", paths.home, "rev-parse", "--is-inside-work-tree"], {
    encoding: "utf8",
  });
  return res.status === 0 && String(res.stdout).trim() === "true";
}

export function autoPull(paths: ClinkyPaths, config: Config): { ok: boolean; message?: string } {
  if (!config.auto_pull) return { ok: true };
  if (!inGitRepo(paths)) return { ok: true };
  const res = spawnSync("git", ["-C", paths.home, "pull"], { encoding: "utf8" });
  if (res.status !== 0) {
    const msg = (res.stderr || res.stdout || "").toString();
    // If contains "CONFLICT", report
    if (msg.includes("CONFLICT")) {
      return { ok: false, message: "Merge conflicts detected. Please resolve manually and retry." };
    }
    return { ok: false, message: `git pull failed: ${msg}` };
  }
  return { ok: true };
}

export function autoPush(
  paths: ClinkyPaths,
  config: Config,
  message: string,
): { ok: boolean; message?: string } {
  if (!config.auto_push) return { ok: true };
  if (!inGitRepo(paths)) return { ok: true };
  // Add changes
  let res = spawnSync("git", ["-C", paths.home, "add", "-A"], { encoding: "utf8" });
  if (res.status !== 0) {
    return { ok: false, message: `git add failed: ${res.stderr}` };
  }
  res = spawnSync("git", ["-C", paths.home, "commit", "-m", message], { encoding: "utf8" });
  // If nothing to commit, still ok
  if (res.status !== 0 && !String(res.stderr).includes("nothing to commit")) {
    return { ok: false, message: `git commit failed: ${res.stderr}` };
  }
  res = spawnSync("git", ["-C", paths.home, "push"], { encoding: "utf8" });
  if (res.status !== 0) {
    return { ok: false, message: `git push failed: ${res.stderr}` };
  }
  return { ok: true };
}
