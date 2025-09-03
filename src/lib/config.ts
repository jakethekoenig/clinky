import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import type { Config } from '../types.js';

export function getClinkyHome(): string {
  return (
    process.env.CLINKY_HOME ||
    join(process.env.HOME || '~', '.config', 'clinky')
  );
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

export function getConfig(): Config {
  const configPath = join(getClinkyHome(), 'config.json');

  if (!existsSync(configPath)) {
    const defaultConfig: Config = {
      autoPull: true,
      autoPush: true,
    };
    writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2));
    return defaultConfig;
  }

  try {
    const configData = readFileSync(configPath, 'utf-8');
    return JSON.parse(configData) as Config;
  } catch (error) {
    console.error('Error reading config file, using defaults:', error);
    return {
      autoPull: true,
      autoPush: true,
    };
  }
}

export function saveConfig(config: Config): void {
  const configPath = join(getClinkyHome(), 'config.json');
  writeFileSync(configPath, JSON.stringify(config, null, 2));
}
