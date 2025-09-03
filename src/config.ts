import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

export interface Config {
  auto_pull: boolean;
  auto_push: boolean;
}

const DEFAULT_CONFIG: Config = {
  auto_pull: true,
  auto_push: true,
};

export function getClinkyHome(): string {
  return process.env.CLINKY_HOME || join(homedir(), '.config', 'clinky');
}

export function ensureClinkyHome(): void {
  const clinkyHome = getClinkyHome();
  if (!existsSync(clinkyHome)) {
    mkdirSync(clinkyHome, { recursive: true });
  }

  const cardsDir = join(clinkyHome, 'cards');
  if (!existsSync(cardsDir)) {
    mkdirSync(cardsDir, { recursive: true });
  }
}

export function loadConfig(): Config {
  const configPath = join(getClinkyHome(), 'config.json');

  if (!existsSync(configPath)) {
    writeFileSync(configPath, JSON.stringify(DEFAULT_CONFIG, null, 2));
    return DEFAULT_CONFIG;
  }

  try {
    const configData = readFileSync(configPath, 'utf-8');
    return { ...DEFAULT_CONFIG, ...JSON.parse(configData) };
  } catch (error) {
    console.error('Error loading config, using defaults:', error);
    return DEFAULT_CONFIG;
  }
}
