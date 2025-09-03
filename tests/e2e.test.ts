import { expect, test, describe, beforeEach, afterEach } from 'bun:test';
import fs from 'fs';
import path from 'path';
import { spawnSync } from 'bun';
import { Database } from 'bun:sqlite';

const TEST_CLINKY_HOME = './test_clinky_home';
process.env.CLINKY_HOME = TEST_CLINKY_HOME;
const TEST_CARDS_DIR = path.join(TEST_CLINKY_HOME, 'cards');

const runClinky = (args: string[], options: { env?: NodeJS.ProcessEnv; input?: string } = {}) => {
  return spawnSync({
    cmd: ['bun', 'run', 'src/index.ts', ...args],
    env: { ...process.env, CLINKY_HOME: TEST_CLINKY_HOME, ...options.env },
    stdin: options.input,
    stdio: ['pipe', 'pipe', 'pipe'],
  });
};

describe('E2E Tests', () => {
  beforeEach(() => {
    fs.mkdirSync(TEST_CARDS_DIR, { recursive: true });
    // Initialize a git repo in the test directory
    spawnSync({ cmd: ['git', 'init'], cwd: TEST_CLINKY_HOME });
    spawnSync({ cmd: ['git', 'config', 'user.email', 'test@example.com'], cwd: TEST_CLINKY_HOME });
    spawnSync({ cmd: ['git', 'config', 'user.name', 'Test User'], cwd: TEST_CLINKY_HOME });
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
    const cardPath = path.join(TEST_CARDS_DIR, 'due_card.txt');
    fs.writeFileSync(cardPath, 'Front<!---split--->Back');

    // Manually add SRS data to make it due
    const db = new Database(path.join(TEST_CLINKY_HOME, 'reviews.db'));
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 1);
    db.run('INSERT INTO cards (path, due_date) VALUES (?, ?)', [cardPath, pastDate.toISOString()]);
    db.close();

    const proc = runClinky(['review', '--non-interactive']);
    const output = proc.stdout.toString();
    expect(output).toContain('Starting review session for 1 card(s)');
    expect(output).toContain('Quitting review session.');
  });
});
