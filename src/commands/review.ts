import fs from 'fs';
import path from 'path';
import { CARDS_DIR, getConfig } from '../config';
import { getSrsData, updateSrsData } from '../srs';
import { isGitRepo, gitPull, gitCommit, gitPush } from '../git';
import { parseCard } from '../card';
import { spawnSync } from 'bun';
import { createInterface } from 'node:readline/promises';

const walkDir = (dir: string): string[] => {
  let files: string[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files = files.concat(walkDir(fullPath));
    } else {
      files.push(fullPath);
    }
  }
  return files;
};

export const getDueCards = (): string[] => {
  if (!fs.existsSync(CARDS_DIR)) {
    return [];
  }
  const allCards = walkDir(CARDS_DIR);
  const now = new Date();
  return allCards.filter(cardPath => {
    const srsData = getSrsData(cardPath);
    return srsData.due_date <= now;
  });
};

export const review = async (cardPath: string | undefined, options: { nonInteractive: boolean }) => {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const prompt = async (question: string): Promise<string> => {
    const answer = await rl.question(question);
    return answer.trim();
  };

  try {
    const config = getConfig();
    if (isGitRepo() && config.auto_pull) {
      if (!gitPull()) {
        return;
      }
    }

    const cardsToReview = cardPath ? [path.join(CARDS_DIR, cardPath)] : getDueCards();
    const reviewedCards: string[] = [];

    if (cardsToReview.length === 0) {
      console.log('No cards due for review.');
      return;
    }

    console.log(`Starting review session for ${cardsToReview.length} card(s)...`);

    let quitSession = false;
    for (const cardToReviewPath of cardsToReview) {
      const card = parseCard(cardToReviewPath);
      if (!card) continue;

      console.log('\n--------------------');
      console.log('Front:\n');
      console.log(card.front);

      if (!options.nonInteractive) {
        const preRevealAction = await prompt('\nPress Enter to see the back (or [ed]it, [q]uit) > ');

        if (preRevealAction === 'q') {
          console.log('Quitting review session.');
          quitSession = true;
          break;
        }

        if (preRevealAction === 'ed') {
          const editor = process.env.EDITOR || 'vim';
          spawnSync({
            cmd: ['sh', '-c', `${editor} "${cardToReviewPath}"`],
            stdio: ['inherit', 'inherit', 'inherit'],
          });
          continue;
        }
      }

      console.log('\nBack:\n');
      console.log(card.back);

      let validAction = false;
      while (!validAction) {
        const action = options.nonInteractive ? 'q' : await prompt('\nRate your recall: [e]asy, [m]edium, [h]ard, [a]gain, [ed]it, [q]uit > ');
        const scoreMap: { [key: string]: number } = { e: 3, m: 2, h: 1, a: 0 };

        if (action in scoreMap) {
          updateSrsData(cardToReviewPath, scoreMap[action]);
          reviewedCards.push(cardToReviewPath);
          console.log('Card updated.');
          validAction = true;
        } else if (action === 'ed') {
          const editor = process.env.EDITOR || 'vim';
          spawnSync({
            cmd: ['sh', '-c', `${editor} "${cardToReviewPath}"`],
            stdio: ['inherit', 'inherit', 'inherit'],
          });
        } else if (action === 'q') {
          console.log('Quitting review session.');
          quitSession = true;
          break;
        } else {
          console.log('Invalid input. Please try again.');
        }
      }

      if (quitSession) {
        break;
      }
    }

    if (reviewedCards.length > 0 && isGitRepo() && config.auto_push) {
      if (gitCommit(`Reviewed ${reviewedCards.length} card(s)`)) {
        gitPush();
      }
    }

    console.log('\nReview session complete!');
  } finally {
    rl.close();
  }
};
