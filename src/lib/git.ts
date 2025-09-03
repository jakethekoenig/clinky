import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { getClinkyHome } from './config.js';

export function isGitRepository(): boolean {
  try {
    const clinkyHome = getClinkyHome();
    return existsSync(`${clinkyHome}/.git`);
  } catch {
    return false;
  }
}

export function gitPull(): boolean {
  if (!isGitRepository()) return true;

  try {
    const clinkyHome = getClinkyHome();
    execSync('git pull', { cwd: clinkyHome, stdio: 'pipe' });
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

    // Check if there are any changes to commit
    try {
      execSync('git diff --quiet && git diff --cached --quiet', {
        cwd: clinkyHome,
        stdio: 'pipe',
      });
      // No changes to commit
      return true;
    } catch {
      // There are changes, proceed with commit
    }

    execSync('git add .', { cwd: clinkyHome, stdio: 'pipe' });
    execSync(`git commit -m "${message}"`, { cwd: clinkyHome, stdio: 'pipe' });
    execSync('git push', { cwd: clinkyHome, stdio: 'pipe' });
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
    execSync('git diff --quiet && git diff --cached --quiet', {
      cwd: clinkyHome,
      stdio: 'pipe',
    });
    return false;
  } catch {
    return true;
  }
}
