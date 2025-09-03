import { expect, test, describe, beforeEach, afterEach } from 'bun:test';
import fs from 'fs';
import path from 'path';
import { spawnSync } from 'bun';

const TEST_CLINKY_HOME = './test_clinky_home';
const TEST_CARDS_DIR = path.join(TEST_CLINKY_HOME, 'cards');

const runClinky = (args: string[], options: { env?: NodeJS.ProcessEnv; input?: string } = {}) => {
  return spawnSync({
    cmd: ['bun', 'run', 'src/index.ts', ...args],
    env: { ...process.env, CLINKY_HOME: TEST_CLINKY_HOME, ...options.env },
    stdio: [options.input || 'pipe', 'pipe', 'pipe'],
  });
};

describe('E2E Tests', () => {
  beforeEach(() => {
    fs.mkdirSync(TEST_CARDS_DIR, { recursive: true });
  });

  afterEach(() => {
    fs.rmSync(TEST_CLINKY_HOME, { recursive: true, force: true });
  });

  test('clinky new - creates a new card with editor', () => {
    const editorCmd = `nvim --headless -u NONE -n -c "luafile ${path.resolve('tests/edit_card.lua')}"`;
    runClinky(['new'], { env: { EDITOR: editorCmd } });

    const files = fs.readdirSync(TEST_CARDS_DIR);
    expect(files.length).toBe(1);

    const cardContent = fs.readFileSync(path.join(TEST_CARDS_DIR, files[0]), 'utf-8');
    expect(cardContent).toContain('New Front Content');
    expect(cardContent).toContain('New Back Content');
  });

  test('clinky review - should report no due cards when none are due', () => {
    const proc = runClinky(['review']);
    const output = proc.stdout.toString();
    expect(output).toContain('No cards due for review.');
  });

  test('clinky review - should start a session with due cards', () => {
    // Create a card that is due
    fs.writeFileSync(path.join(TEST_CARDS_DIR, 'due_card.txt'), 'Front<!---split--->Back');

    // Provide 'q' to stdin to quit immediately after the first card
    const proc = runClinky(['review'], { input: 'q\n' });
    const output = proc.stdout.toString();
    expect(output).toContain('Starting review session for 1 card(s)');
    expect(output).toContain('Quitting review session.');
  });
});
