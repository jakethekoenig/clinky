import { existsSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { spawnSync } from "child_process";
import { ensureHomeLayout, getHomeDir } from "./config";
import type { Card } from "./types";

const SPLIT_MARKER = "<!---split--->";

export function cardsDir(): string {
  ensureHomeLayout();
  return join(getHomeDir(), "cards");
}

export function timestampName(): string {
  const ts = Math.floor(Date.now() / 1000);
  return `${ts}.txt`;
}

export function cardPathByName(name: string): string {
  return join(cardsDir(), name);
}

export function readCard(path: string): Card {
  const raw = readFileSync(path, "utf8");
  const [frontRaw, backRaw = ""] = raw.split(SPLIT_MARKER, 2);
  const clean = (s: string) =>
    s
      .split("\n")
      .filter((l) => !l.trimStart().startsWith("%"))
      .join("\n")
      .trimEnd();
  const front = clean(frontRaw ?? "");
  const back = clean(backRaw ?? "");
  const name = path.split("/").pop()!;
  return { path, name, front, back };
}

export function openEditor(filePath: string): void {
  const editor = process.env.EDITOR?.trim() || "vim";
  const res = spawnSync(editor, [filePath], { stdio: "inherit" });
  if (res.status !== 0) {
    throw new Error(`Editor exited with status ${res.status}`);
  }
}

export function createNewCard(): string {
  const dir = cardsDir();
  const name = timestampName();
  const full = join(dir, name);
  if (!existsSync(full)) {
    const template = `Front of the card
Can be multiple lines
${SPLIT_MARKER}
Back of the card
% Lines starting with % are comments and ignored by clinky when printing for review.
`;
    writeFileSync(full, template, "utf8");
  }
  openEditor(full);
  return full;
}

export function listAllCardPaths(): string[] {
  // Traverse cards directory recursively
  const dir = cardsDir();
  const { execSync } = await import("child_process");
  try {
    const out = execSync(`find "${dir}" -type f -name "*.txt"`, {
      encoding: "utf8",
    });
    return out
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
  } catch {
    return [];
  }
}
