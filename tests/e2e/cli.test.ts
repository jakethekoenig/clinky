import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import {
  mkdtempSync,
  rmSync,
  existsSync,
  readFileSync,
  writeFileSync,
  readdirSync,
  mkdirSync,
} from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { execSync } from 'child_process';

describe('Clinky CLI E2E', () => {
  let tempDir: string;
  let originalClinkyHome: string | undefined;
  let originalEditor: string | undefined;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'clinky-e2e-'));
    originalClinkyHome = process.env.CLINKY_HOME;
    originalEditor = process.env.EDITOR;
    process.env.CLINKY_HOME = tempDir;
    process.env.EDITOR = 'echo'; // Use echo as a no-op editor for testing
  });

  afterEach(() => {
    if (originalClinkyHome) {
      process.env.CLINKY_HOME = originalClinkyHome;
    } else {
      delete process.env.CLINKY_HOME;
    }
    if (originalEditor) {
      process.env.EDITOR = originalEditor;
    } else {
      delete process.env.EDITOR;
    }
    rmSync(tempDir, { recursive: true, force: true });
  });

  test('clinky new should create a card', () => {
    execSync('bun run src/cli.ts new', {
      env: process.env,
      stdio: 'ignore',
    });

    const cardsDir = join(tempDir, 'cards');
    expect(existsSync(cardsDir)).toBe(true);

    const files = readdirSync(cardsDir);
    expect(files.length).toBe(1);
    expect(files[0]).toMatch(/^\d+\.txt$/);
  });

  test('config should be created with defaults', () => {
    execSync('bun run src/cli.ts new', {
      env: process.env,
      stdio: 'ignore',
    });

    const configPath = join(tempDir, 'config.json');
    expect(existsSync(configPath)).toBe(true);

    const config = JSON.parse(readFileSync(configPath, 'utf-8'));
    expect(config.auto_pull).toBe(true);
    expect(config.auto_push).toBe(true);
  });

  test('database should be created on review', () => {
    // Create a test card first
    const cardsDir = join(tempDir, 'cards');
    mkdirSync(cardsDir, { recursive: true });
    writeFileSync(join(cardsDir, 'test.txt'), 'Front\n<!---split--->\nBack');

    // Import the database directly to test it
    const ReviewDatabase = require('../../src/database').default;
    const db = new ReviewDatabase();
    db.close();

    const dbPath = join(tempDir, 'reviews.db');
    expect(existsSync(dbPath)).toBe(true);
  });
});
