import { spawnSync } from "node:child_process";

export function openEditor(filePath: string): { ok: boolean; message?: string } {
  const editor = process.env.EDITOR || "vim";
  const res = spawnSync(editor, [filePath], {
    stdio: "inherit",
    env: process.env,
  });
  if (res.status !== 0) {
    return { ok: false, message: `${editor} exited with code ${res.status}` };
  }
  return { ok: true };
}
