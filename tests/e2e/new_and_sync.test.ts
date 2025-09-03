import { describe, expect, it } from "bun:test";
import { mkdtempSync, writeFileSync } from "fs";
import { join } from "path";
import { spawnSync } from "child_process";

describe("e2e: new card with git sync", () => {
  it("creates a card file and commits", () => {
    const tmp = mkdtempSync("/tmp/clinky-e2e-");
    process.env.CLINKY_HOME = tmp;

    // init git repo
    spawnSync("git", ["init"], { cwd: tmp });
    // configure user for committing
    spawnSync("git", ["config", "user.email", "test@example.com"], {
      cwd: tmp,
    });
    spawnSync("git", ["config", "user.name", "Test"], { cwd: tmp });

    // fake editor script
    const editorScript = join(tmp, "fake-editor.sh");
    writeFileSync(
      editorScript,
      "#!/usr/bin/env bash\n# Append a line and exit\n echo 'Q&A' >> \"$1\"\n",
      "utf8",
    );
    spawnSync("chmod", ["+x", editorScript]);

    process.env.EDITOR = editorScript;

    const res = spawnSync("bun", ["run", "clinky", "new"], {
      cwd: process.cwd(),
      encoding: "utf8",
      env: { ...process.env, CLINKY_HOME: tmp, EDITOR: editorScript },
    });
    expect(res.status).toBe(0);

    // check a .txt exists
    const ls = spawnSync(
      "bash",
      ["-lc", "ls " + join(tmp, "cards") + "/*.txt"],
      {
        encoding: "utf8",
      },
    );
    expect(ls.stdout.trim().length).toBeGreaterThan(0);

    // commit should exist (auto_push default true)
    const log = spawnSync("git", ["log", "-1", "--pretty=%s"], {
      cwd: tmp,
      encoding: "utf8",
    });
    expect(log.stdout).toMatch(/Created card/);

    // cleanup env
    delete process.env.CLINKY_HOME;
    delete process.env.EDITOR;
  });
});
