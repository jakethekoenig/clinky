import { join, basename } from "node:path";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import type { ClinkyPaths } from "./util";

export const SPLIT_MARKER = "<!---split--->";

export function cardPathForTimestamp(paths: ClinkyPaths, timestamp: number): string {
  return join(paths.cardsDir, `${timestamp}.txt`);
}

export function ensureNewCardTemplate(paths: ClinkyPaths, filePath: string) {
  if (existsSync(filePath)) return;
  const template = `Front of the card
Can be multiple lines
${SPLIT_MARKER}
Back of the card
% Lines starting with % are comments and ignored by clinky when printing for review.
`;
  writeFileSync(filePath, template, "utf8");
}

export function parseCard(fileContent: string): { front: string; back: string } {
  const [frontRaw, backRaw = ""] = fileContent.split(SPLIT_MARKER);
  const normalize = (s: string) =>
    s
      .split("\n")
      .filter((line) => !line.trim().startsWith("%"))
      .join("\n")
      .trim();
  return { front: normalize(frontRaw || ""), back: normalize(backRaw || "") };
}

export function cardNameFromPath(paths: ClinkyPaths, filePath: string): string {
  // Per spec, card_name is the file name only, not path
  return basename(filePath);
}

export function readCard(filePath: string): { front: string; back: string } {
  const content = readFileSync(filePath, "utf8");
  return parseCard(content);
}
