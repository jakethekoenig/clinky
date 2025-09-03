import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { execSync } from 'child_process';
import { mkdirSync, rmSync, writeFileSync, existsSync, readFileSync } from 'fs';
import { join } from 'path';

const testClinkyHome = join(process.cwd(), 'test-clinky-home');
const testEnv = { ...process.env, CLINKY_HOME: testClinkyHome, EDITOR: 'echo' };

describe('e2e tests', () => {
  beforeEach(() => {
    // Clean up any existing test directory
    if (existsSync(testClinkyHome)) {
      rmSync(testClinkyHome, { recursive: true, force: true });
    }

    // Create test directory
    mkdirSync(testClinkyHome, { recursive: true });

    // Build the project
    execSync('bun run build', { stdio: 'pipe' });
  });

  afterEach(() => {
    // Clean up test directory
    if (existsSync(testClinkyHome)) {
      rmSync(testClinkyHome, { recursive: true, force: true });
    }
  });

  it('should create directory structure on first run', () => {
    // Run clinky review (which should create the directory structure)
    try {
      execSync('node dist/index.js review', {
        env: testEnv,
        stdio: 'pipe',
      });
    } catch (error) {
      // Expected to fail since no cards exist, but directory should be created
    }

    expect(existsSync(testClinkyHome)).toBe(true);
    expect(existsSync(join(testClinkyHome, 'cards'))).toBe(true);
    expect(existsSync(join(testClinkyHome, 'config.json'))).toBe(true);
    expect(existsSync(join(testClinkyHome, 'reviews.db'))).toBe(true);
  });

  it('should create default config file', () => {
    // Run a command to trigger config creation
    try {
      execSync('node dist/index.js review', {
        env: testEnv,
        stdio: 'pipe',
      });
    } catch (error) {
      // Expected to fail, but config should be created
    }

    const configPath = join(testClinkyHome, 'config.json');
    expect(existsSync(configPath)).toBe(true);

    const config = JSON.parse(readFileSync(configPath, 'utf-8'));
    expect(config.autoPull).toBe(true);
    expect(config.autoPush).toBe(true);
  });

  it('should handle review with no cards', () => {
    const output = execSync('node dist/index.js review', {
      env: testEnv,
      encoding: 'utf-8',
      stdio: 'pipe',
    });

    expect(output).toContain('No cards due for review');
  });

  it('should work with git repository', () => {
    // Initialize git repo in test directory
    execSync('git init', { cwd: testClinkyHome, stdio: 'pipe' });
    execSync('git config user.email "test@example.com"', {
      cwd: testClinkyHome,
      stdio: 'pipe',
    });
    execSync('git config user.name "Test User"', {
      cwd: testClinkyHome,
      stdio: 'pipe',
    });

    // Create a test card manually
    const cardsDir = join(testClinkyHome, 'cards');
    mkdirSync(cardsDir, { recursive: true });

    const cardContent = `Test front
<!---split--->
Test back
% Comment`;

    writeFileSync(join(cardsDir, 'test.txt'), cardContent);

    // Test that git operations work (auto_push disabled for test)
    const config = {
      autoPull: false,
      autoPush: false,
    };
    writeFileSync(join(testClinkyHome, 'config.json'), JSON.stringify(config));

    // This should not crash
    const output = execSync('node dist/index.js review', {
      env: testEnv,
      encoding: 'utf-8',
      stdio: 'pipe',
    });

    expect(output).toContain('Starting review session');
  });
});
