import { spawnSync } from "child_process";
import { getHomeDir } from "./config";

function runGit(args: string[]): {
  ok: boolean;
  stdout: string;
  stderr: string;
} {
  const home = getHomeDir();
  const res = spawnSync("git", args, { cwd: home, encoding: "utf8" });
  return {
    ok: res.status === 0,
    stdout: res.stdout ?? "",
    stderr: res.stderr ?? "",
  };
}

export function isGitRepo(): boolean {
  const res = runGit(["rev-parse", "--is-inside-work-tree"]);
  return res.ok && res.stdout.trim() === "true";
}

export function autoPullIfEnabled(enabled: boolean): void {
  if (!enabled) return;
  if (!isGitRepo()) return;
  // fetch + pull --rebase
  runGit(["fetch", "--all", "--prune"]);
  const pull = runGit(["pull", "--rebase"]);
  if (!pull.ok) {
    throw new Error(
      "git pull failed. Resolve conflicts manually and re-run. Details:\n" +
        pull.stderr,
    );
  }
}

export function autoPushIfEnabled(enabled: boolean, message: string): void {
  if (!enabled) return;
  if (!isGitRepo()) return;
  const add = runGit(["add", "--all"]);
  if (!add.ok) {
    throw new Error("git add failed: " + add.stderr);
  }
  const commit = runGit(["commit", "-m", message]);
  // If there's nothing to commit, commit exits non-zero. That's fine; try push anyway if prior commits exist
  runGit(["push"]);
}
