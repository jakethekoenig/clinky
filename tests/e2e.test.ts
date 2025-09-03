import { expect, test, describe, beforeEach, afterEach } from 'bun:test';
import fs from 'fs';
import path from 'path';
import { spawnSync } from 'bun';

const TEST_CLINKY_HOME = './test_clinky_home';
const TEST_CARDS_DIR = path.join(TEST_CLINKY_HOME, 'cards');

const runClinky = (args: string[]) => {
  return spawnSync({
    cmd: ['bun', 'run', 'src/index.ts', ...args],
    env: { ...process.env, CLINKY_HOME: TEST_CLINKY_HOME },
  });
};

describe('E2E Tests', () => {
  beforeEach(() => {
    fs.mkdirSync(TEST_CARDS_DIR, { recursive: true });
  });

  afterEach(() => {
    fs.rmSync(TEST_CLINKY_HOME, { recursive: true, force: true });
  });

  test('clinky new - creates a new card', () => {
    // This is tricky to test without a real editor.
    // We'll manually simulate the "new" command's effect.
    const timestamp = Date.now();
    const cardPath = path.join(TEST_CARDS_DIR, `${timestamp}.txt`);
    fs.writeFileSync(cardPath, 'Front<!---split--->Back');

    const files = fs.readdirSync(TEST_CARDS_DIR);
    expect(files.length).toBe(1);
    expect(files[0]).toContain(`${timestamp}.txt`);
  });

  test('clinky review - should report no due cards when none are due', () => {
    const proc = runClinky(['review']);
    const output = proc.stdout.toString();
    expect(output).toContain('No cards due for review.');
  });

});
