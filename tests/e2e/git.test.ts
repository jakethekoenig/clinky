import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { mkdtempSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { execSync } from 'child_process';
import { isGitRepo, gitPush } from '../../src/git';

describe('Git Integration E2E', () => {
  let tempDir: string;
  let originalClinkyHome: string | undefined;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'clinky-git-'));
    originalClinkyHome = process.env.CLINKY_HOME;
    process.env.CLINKY_HOME = tempDir;
  });

  afterEach(() => {
    if (originalClinkyHome) {
      process.env.CLINKY_HOME = originalClinkyHome;
    } else {
      delete process.env.CLINKY_HOME;
    }
    rmSync(tempDir, { recursive: true, force: true });
  });

  test('should detect git repository', () => {
    expect(isGitRepo()).toBe(false);

    execSync('git init', { cwd: tempDir, stdio: 'ignore' });
    execSync('git config user.email "test@example.com"', { cwd: tempDir, stdio: 'ignore' });
    execSync('git config user.name "Test User"', { cwd: tempDir, stdio: 'ignore' });

    expect(isGitRepo()).toBe(true);
  });

  test('should commit and handle push gracefully', () => {
    execSync('git init', { cwd: tempDir, stdio: 'ignore' });
    execSync('git config user.email "test@example.com"', { cwd: tempDir, stdio: 'ignore' });
    execSync('git config user.name "Test User"', { cwd: tempDir, stdio: 'ignore' });

    writeFileSync(join(tempDir, 'test.txt'), 'test content');

    // This will fail to push (no remote) but should handle it gracefully
    gitPush('Test commit');

    // Check that the commit was made
    const log = execSync('git log --oneline', { cwd: tempDir, encoding: 'utf-8' });
    expect(log).toContain('Test commit');
  });
});
