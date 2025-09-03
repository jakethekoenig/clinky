import fs from 'fs';

export interface Card {
  path: string;
  front: string;
  back: string;
}

const SPLIT_SEPARATOR = '<!---split--->';

export const parseCard = (cardPath: string): Card | null => {
  try {
    const content = fs.readFileSync(cardPath, 'utf-8');
    const parts = content.split(SPLIT_SEPARATOR);
    if (parts.length !== 2) {
      console.error(`Invalid card format: ${cardPath}`);
      return null;
    }

    const front = parts[0].trim();
    const back = parts[1]
      .split('\n')
      .filter(line => !line.startsWith('%'))
      .join('\n')
      .trim();

    return { path: cardPath, front, back };
  } catch (error) {
    console.error(`Error reading card: ${cardPath}`, error);
    return null;
  }
};
