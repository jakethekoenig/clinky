import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, basename, extname } from 'path';
import type { Card } from '../types.js';
import { getClinkyHome } from './config.js';

export function parseCard(filePath: string): Card | null {
  try {
    const content = readFileSync(filePath, 'utf-8');
    const splitMarker = '<!---split--->';
    const parts = content.split(splitMarker);

    if (parts.length !== 2) {
      console.warn(`Card ${filePath} does not have proper split marker`);
      return null;
    }

    const frontRaw = parts[0]?.trim() || '';
    const backRaw = parts[1]?.trim() || '';

    // Remove comment lines (starting with %) from both front and back
    const front = frontRaw
      .split('\n')
      .filter((line) => !line.trim().startsWith('%'))
      .join('\n')
      .trim();

    const back = backRaw
      .split('\n')
      .filter((line) => !line.trim().startsWith('%'))
      .join('\n')
      .trim();

    const name = basename(filePath, extname(filePath));

    return {
      name,
      front,
      back,
      filePath,
    };
  } catch (error) {
    console.error(`Error parsing card ${filePath}:`, error);
    return null;
  }
}

export function getAllCards(): Card[] {
  const cardsDir = join(getClinkyHome(), 'cards');
  const cards: Card[] = [];

  function scanDirectory(dir: string): void {
    try {
      const entries = readdirSync(dir);

      for (const entry of entries) {
        const fullPath = join(dir, entry);
        const stat = statSync(fullPath);

        if (stat.isDirectory()) {
          scanDirectory(fullPath);
        } else if (entry.endsWith('.txt')) {
          const card = parseCard(fullPath);
          if (card) {
            cards.push(card);
          }
        }
      }
    } catch (error) {
      console.error(`Error scanning directory ${dir}:`, error);
    }
  }

  scanDirectory(cardsDir);
  return cards;
}

export function getCard(cardName: string): Card | null {
  const cards = getAllCards();
  return cards.find((card) => card.name === cardName) || null;
}

export function getCardByPath(cardPath: string): Card | null {
  const clinkyHome = getClinkyHome();
  let fullPath: string;

  // If path is absolute, use it directly
  if (cardPath.startsWith('/')) {
    fullPath = cardPath;
  } else {
    // Treat as relative to CLINKY_HOME
    fullPath = join(clinkyHome, cardPath);
  }

  return parseCard(fullPath);
}

export function resolveCardArgument(arg: string): {
  name: string;
  card: Card | null;
} {
  // If argument contains path separators or ends with .txt, treat as path
  if (arg.includes('/') || arg.includes('\\') || arg.endsWith('.txt')) {
    const card = getCardByPath(arg);
    if (card) {
      return { name: card.name, card };
    }
    return { name: basename(arg, extname(arg)), card: null };
  } else {
    // Treat as card name
    const card = getCard(arg);
    return { name: arg, card };
  }
}

export function createCardTemplate(): string {
  return `Front of the card
Can be multiple lines
<!---split--->
Back of the card
% Lines starting with % are comments and ignored by clinky when printing for review.
`;
}

export function getCardPath(timestamp?: number): string {
  const ts = timestamp || Math.floor(Date.now() / 1000);
  return join(getClinkyHome(), 'cards', `${ts}.txt`);
}

export function saveCard(filePath: string, content: string): void {
  writeFileSync(filePath, content, 'utf-8');
}
