import { spawnSync } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';
import { getClinkyHome } from './config.js';

export function isGitRepository(): boolean {
  try {
    const clinkyHome = getClinkyHome();
    return existsSync(join(clinkyHome, '.git'));
  } catch {
    return false;
  }
}

export function gitPull(): boolean {
  if (!isGitRepository()) return true;

  try {
    const clinkyHome = getClinkyHome();
    const pullResult = spawnSync('git', ['pull'], {
      cwd: clinkyHome,
      stdio: 'pipe',
    });
    if (pullResult.status !== 0) {
      throw new Error(`git pull failed: ${pullResult.stderr?.toString()}`);
    }
    return true;
  } catch (error) {
    console.error('Git pull failed:', error);
    return false;
  }
}

export function gitCommitAndPush(message: string): boolean {
  if (!isGitRepository()) return true;

  try {
    const clinkyHome = getClinkyHome();

    // Check if there are any changes to commit using git status
    const statusResult = spawnSync('git', ['status', '--porcelain'], {
      cwd: clinkyHome,
      stdio: 'pipe',
    });
    if (statusResult.status !== 0) {
      throw new Error(`git status failed: ${statusResult.stderr?.toString()}`);
    }

    const output = statusResult.stdout?.toString().trim();
    if (!output) {
      // No changes to commit
      return true;
    }

    // Use spawnSync to avoid command injection vulnerabilities
    const addResult = spawnSync('git', ['add', '.'], {
      cwd: clinkyHome,
      stdio: 'pipe',
    });
    if (addResult.status !== 0) {
      throw new Error(`git add failed: ${addResult.stderr?.toString()}`);
    }

    const commitResult = spawnSync('git', ['commit', '-m', message], {
      cwd: clinkyHome,
      stdio: 'pipe',
    });
    if (commitResult.status !== 0) {
      throw new Error(`git commit failed: ${commitResult.stderr?.toString()}`);
    }

    const pushResult = spawnSync('git', ['push'], {
      cwd: clinkyHome,
      stdio: 'pipe',
    });
    if (pushResult.status !== 0) {
      throw new Error(`git push failed: ${pushResult.stderr?.toString()}`);
    }
    return true;
  } catch (error) {
    console.error('Git commit and push failed:', error);
    return false;
  }
}

export function hasUncommittedChanges(): boolean {
  if (!isGitRepository()) return false;

  try {
    const clinkyHome = getClinkyHome();
    const statusResult = spawnSync('git', ['status', '--porcelain'], {
      cwd: clinkyHome,
      stdio: 'pipe',
    });
    if (statusResult.status !== 0) {
      return false;
    }

    const output = statusResult.stdout?.toString().trim();
    return !!output;
  } catch {
    return false;
  }
}
