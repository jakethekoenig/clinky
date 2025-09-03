import { join } from "path";
import { mkdirSync, existsSync, readFileSync, writeFileSync } from "fs";
import os from "os";
import type { Config } from "./types";

export function getHomeDir(): string {
  const env = Bun.env.CLINKY_HOME;
  if (env && env.trim().length > 0) return env;
  return join(os.homedir(), ".config", "clinky");
}

export function ensureHomeLayout(): string {
  const home = getHomeDir();
  const cardsDir = join(home, "cards");
  mkdirSync(home, { recursive: true });
  mkdirSync(cardsDir, { recursive: true });
  return home;
}

export function getConfigPath(): string {
  return join(getHomeDir(), "config.json");
}

export function loadConfig(): Config {
  ensureHomeLayout();
  const p = getConfigPath();
  if (!existsSync(p)) {
    const defaultCfg: Config = { auto_pull: true, auto_push: true };
    writeFileSync(p, JSON.stringify(defaultCfg, null, 2) + "\n", "utf8");
    return defaultCfg;
  }
  const raw = readFileSync(p, "utf8");
  try {
    const parsed = JSON.parse(raw);
    return {
      auto_pull: parsed.auto_pull !== false,
      auto_push: parsed.auto_push !== false,
    };
  } catch {
    // fallback to default if file corrupt
    return { auto_pull: true, auto_push: true };
  }
}
