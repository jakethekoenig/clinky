#!/usr/bin/env bun
/**
 * Runs bun test with coverage, parses the summary, and enforces a baseline threshold.
 * - On first run (no baseline), writes coverage-baseline.json with current values.
 * - On subsequent runs, fails if any metric drops below baseline.
 */
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";

const BASELINE_FILE = "coverage-baseline.json";

function runCoverage() {
  const res = spawnSync("bun", ["test", "--coverage"], { encoding: "utf8" });
  process.stdout.write(res.stdout || "");
  process.stderr.write(res.stderr || "");
  if (res.status !== 0) {
    // Test failures should fail CI before coverage enforcement
    process.exit(res.status ?? 1);
  }
  return res.stdout || "";
}

function parseSummary(output) {
  // Expect a table like:
  // ------------------|---------|----------|---------|---------|-------------------
  // File              | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
  // All files         |   85.71 |       50 |      50 |   85.71 |
  const lines = output.split("\n");
  const headerIdx = lines.findIndex((l) => l.includes("% Stmts") && l.includes("% Lines"));
  if (headerIdx === -1) throw new Error("Could not find coverage summary header");
  const allLine = lines.slice(headerIdx).find((l) => l.startsWith("All files"));
  if (!allLine) throw new Error("Could not find 'All files' coverage summary");
  const cols = allLine.split("|").map((s) => s.trim());
  // cols: ["All files", "85.71", "50", "50", "85.71", ...] or with % signs
  const pct = (s) => parseFloat(String(s).replace("%", "").trim());
  return {
    statements: pct(cols[1]),
    branches: pct(cols[2]),
    functions: pct(cols[3]),
    lines: pct(cols[4]),
  };
}

function main() {
  const out = runCoverage();
  const current = parseSummary(out);

  if (!existsSync(BASELINE_FILE)) {
    writeFileSync(BASELINE_FILE, JSON.stringify(current, null, 2));
    console.log(`No baseline found. Wrote ${BASELINE_FILE}:`, current);
    process.exit(0);
  }

  const baseline = JSON.parse(readFileSync(BASELINE_FILE, "utf8"));
  let ok = true;
  const metrics = ["statements", "branches", "functions", "lines"];
  for (const m of metrics) {
    if (current[m] + 1e-9 < baseline[m]) {
      console.error(
        `Coverage decreased for ${m}: current=${current[m].toFixed(2)}% < baseline=${baseline[m].toFixed(2)}%`,
      );
      ok = false;
    }
  }
  if (!ok) {
    process.exit(1);
  }
  console.log("Coverage OK. Current:", current, "Baseline:", baseline);
}

main();
