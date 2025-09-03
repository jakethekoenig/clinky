import { execSync } from 'child_process';
import { getClinkyHome } from './config';

export function isGitRepo(): boolean {
  try {
    execSync('git rev-parse --git-dir', {
      cwd: getClinkyHome(),
      stdio: 'ignore',
    });
    return true;
  } catch {
    return false;
  }
}

export function gitPull(): void {
  if (!isGitRepo()) return;

  try {
    console.log('Pulling latest changes from git...');
    execSync('git pull', {
      cwd: getClinkyHome(),
      stdio: 'inherit',
    });
  } catch (error) {
    console.error('Failed to pull from git. Please resolve conflicts manually.');
    process.exit(1);
  }
}

export function gitPush(message: string): void {
  if (!isGitRepo()) return;

  try {
    console.log('Pushing changes to git...');
    execSync('git add -A', {
      cwd: getClinkyHome(),
      stdio: 'ignore',
    });
    execSync(`git commit -m "${message}"`, {
      cwd: getClinkyHome(),
      stdio: 'ignore',
    });
    execSync('git push', {
      cwd: getClinkyHome(),
      stdio: 'inherit',
    });
  } catch (error) {
    // Might fail if nothing to commit, that's okay
    if (error instanceof Error && !error.message.includes('nothing to commit')) {
      console.error('Failed to push to git:', error);
    }
  }
}
