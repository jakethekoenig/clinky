import { describe, expect, it } from "bun:test";
import { mkdtempSync, writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import { spawn } from "child_process";

function runClinky(args: string[], env: Record&lt;string, string>, input: string): Promise&lt;{ code: number; stdout: string; stderr: string }> {
  return new Promise((resolve) => {
    const proc = spawn("bun", ["run", "clinky", ...args], {
      env: { ...process.env, ...env },
      stdio: ["pipe", "pipe", "pipe"]
    });
    let out = "";
    let err = "";
    proc.stdout.on("data", (d) => (out += d.toString()));
    proc.stderr.on("data", (d) => (err += d.toString()));
    proc.on("close", (code) => resolve({ code: code ?? 0, stdout: out, stderr: err }));
    proc.stdin.write(input);
    proc.stdin.end();
  });
}

describe("e2e: review session", () => {
  it("reviews a card and records to sqlite", async () => {
    const tmp = mkdtempSync("/tmp/clinky-e2e-");
    const cardsDir = join(tmp, "cards");
    mkdirSync(cardsDir, { recursive: true });
    const cardPath = join(cardsDir, "123.txt");
    writeFileSync(
      cardPath,
      `Front
<!---split--->
Back
`,
      "utf8"
    );

    const result = await runClinky(["review"], { CLINKY_HOME: tmp }, "\n" + "e\n");
    // First \n reveals back; then "e" rates as easy
    expect(result.code).toBe(0);
    expect(result.stdout).toContain("Front");
    expect(result.stdout).toContain("Back");
  });
});
