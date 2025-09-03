import { join } from "node:path";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";

export type ClinkyPaths = {
  home: string;
  cardsDir: string;
  dbPath: string;
  configPath: string;
};

export function getClinkyHome(): ClinkyPaths {
  const home =
    process.env.CLINKY_HOME || join(process.env.HOME || process.cwd(), ".config", "clinky");
  const cardsDir = join(home, "cards");
  const dbPath = join(home, "reviews.db");
  const configPath = join(home, "config.json");
  // Ensure base dirs exist
  if (!existsSync(home)) mkdirSync(home, { recursive: true });
  if (!existsSync(cardsDir)) mkdirSync(cardsDir, { recursive: true });
  return { home, cardsDir, dbPath, configPath };
}

export type Config = {
  auto_pull: boolean;
  auto_push: boolean;
};

export function loadConfig(paths: ClinkyPaths): Config {
  if (!existsSync(paths.configPath)) {
    const cfg: Config = { auto_pull: true, auto_push: true };
    writeFileSync(paths.configPath, JSON.stringify(cfg, null, 2), "utf8");
    return cfg;
  }
  try {
    const raw = readFileSync(paths.configPath, "utf8");
    const json = JSON.parse(raw);
    return {
      auto_pull: json.auto_pull !== false,
      auto_push: json.auto_push !== false,
    };
  } catch {
    // Fallback defaults
    return { auto_pull: true, auto_push: true };
  }
}

export function nowUnix(): number {
  return Math.floor(Date.now() / 1000);
}
