import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { expect, test } from "bun:test";

function runCli(args: string[], env: Record<string, string>) {
  return spawnSync("bun", ["run", "src/cli.ts", ...args], {
    encoding: "utf8",
    env: { ...process.env, ...env },
    input: "",
  });
}

test("create a new card with non-interactive editor", () => {
  const home = mkdtempSync(join(tmpdir(), "clinky-"));
  // Fake EDITOR that appends text and exits
  const editorScript = join(home, "editor.sh");
  writeFileSync(editorScript, '#!/usr/bin/env bash\necho -e "Q\\n<!---split--->\\nA" >> "$1"\n', {
    mode: 0o755,
  });
  // Initialize git repo to test auto_push
  spawnSync("git", ["-C", home, "init"], { encoding: "utf8" });

  const res = runCli(["new"], { CLINKY_HOME: home, EDITOR: editorScript });
  expect(res.status).toBe(0);
  expect(res.stdout).toContain("Created:");
});

test("review a single card end-to-end", () => {
  const home = mkdtempSync(join(tmpdir(), "clinky-"));
  const editorScript = join(home, "editor.sh");
  writeFileSync(
    editorScript,
    '#!/usr/bin/env bash\necho -e "Front\\n<!---split--->\\nBack" > "$1"\n',
    { mode: 0o755 },
  );
  spawnSync("git", ["-C", home, "init"], { encoding: "utf8" });

  const newRes = spawnSync("bun", ["run", "src/cli.ts", "new"], {
    encoding: "utf8",
    env: { ...process.env, CLINKY_HOME: home, EDITOR: editorScript },
  });
  expect(newRes.status).toBe(0);

  // Find the created card path
  const relPath =
    "cards/" + spawnSync("ls", ["-1", join(home, "cards")], { encoding: "utf8" }).stdout.trim();

  // Review with a single 'easy' input
  const child = spawnSync("bun", ["run", "src/cli.ts", "review", relPath], {
    encoding: "utf8",
    env: { ...process.env, CLINKY_HOME: home },
    input: "\n" + "2\n",
  });
  expect(child.status).toBe(0);
  expect(child.stdout).toContain("Front");
  expect(child.stdout).toContain("Back");
});
