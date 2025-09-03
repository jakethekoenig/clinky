import os from 'os';
import path from 'path';
import fs from 'fs';

export interface Config {
  auto_pull: boolean;
  auto_push: boolean;
}

export const getClinkyHome = (): string => {
  return process.env.CLINKY_HOME || path.join(os.homedir(), '.config', 'clinky');
};

export const CLINKY_HOME = getClinkyHome();
export const CARDS_DIR = path.join(CLINKY_HOME, 'cards');
const CONFIG_PATH = path.join(CLINKY_HOME, 'config.json');

const defaultConfig: Config = {
  auto_pull: true,
  auto_push: true,
};

export const getConfig = (): Config => {
  if (!fs.existsSync(CONFIG_PATH)) {
    return defaultConfig;
  }
  try {
    const configContent = fs.readFileSync(CONFIG_PATH, 'utf-8');
    return { ...defaultConfig, ...JSON.parse(configContent) };
  } catch (error) {
    console.error('Error reading config file, using defaults.', error);
    return defaultConfig;
  }
};

export const initClinkyHome = () => {
  if (!fs.existsSync(CLINKY_HOME)) {
    fs.mkdirSync(CLINKY_HOME, { recursive: true });
  }
  if (!fs.existsSync(CARDS_DIR)) {
    fs.mkdirSync(CARDS_DIR, { recursive: true });
  }
};
