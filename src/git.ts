import fs from 'fs';
import path from 'path';
import { spawnSync } from 'bun';
import { CLINKY_HOME } from './config';

export const isGitRepo = (): boolean => {
  return fs.existsSync(path.join(CLINKY_HOME, '.git'));
};

const gitCommand = (args: string[]) => {
  return spawnSync({
    cmd: ['git', ...args],
    cwd: CLINKY_HOME,
    stdio: ['inherit', 'pipe', 'pipe'],
  });
};

export const gitPull = (): boolean => {
  console.log('Pulling changes from remote...');
  const proc = gitCommand(['pull']);
  if (proc.exitCode !== 0) {
    const stderr = proc.stderr.toString();
    if (stderr.includes('merge conflict')) {
      console.error('Merge conflict detected. Please resolve conflicts manually.');
    } else {
      console.error('Failed to pull changes from remote.');
      console.error(stderr);
    }
    return false;
  }
  console.log('Successfully pulled changes.');
  return true;
};

export const gitCommit = (message: string) => {
  console.log('Committing changes...');
  gitCommand(['add', '.']);
  const proc = gitCommand(['commit', '-m', message]);
  if (proc.exitCode !== 0) {
    console.error('Failed to commit changes.');
    console.error(proc.stderr.toString());
    return false;
  }
  return true;
};

export const gitPush = () => {
  console.log('Pushing changes to remote...');
  const proc = gitCommand(['push']);
  if (proc.exitCode !== 0) {
    console.error('Failed to push changes to remote.');
    console.error(proc.stderr.toString());
    return false;
  }
  console.log('Successfully pushed changes.');
  return true;
};
