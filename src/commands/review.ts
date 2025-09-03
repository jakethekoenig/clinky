import fs from 'fs';
import path from 'path';
import { CARDS_DIR, getConfig } from '../config';
import { getSrsData, updateSrsData } from '../srs';
import { isGitRepo, gitPull, gitCommit, gitPush } from '../git';
import { parseCard } from '../card';
import { spawnSync } from 'bun';

export const getDueCards = (): string[] => {
  if (!fs.existsSync(CARDS_DIR)) {
    return [];
  }
  const allCards = fs.readdirSync(CARDS_DIR).map(file => path.join(CARDS_DIR, file));
  const now = new Date();
  return allCards.filter(cardPath => {
    const srsData = getSrsData(cardPath);
    return srsData.due_date <= now;
  });
};

const prompt = async (question: string): Promise<string> => {
  process.stdout.write(question);
  for await (const line of console) {
    return line.trim();
  }
  return '';
};

export const review = async (cardPath: string | undefined) => {
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

  for (const cardToReviewPath of cardsToReview) {
    const card = parseCard(cardToReviewPath);
    if (!card) continue;

    console.log('\n--------------------');
    console.log('Front:\n');
    console.log(card.front);

    await prompt('\nPress Enter to see the back...');

    console.log('\nBack:\n');
    console.log(card.back);

    let validAction = false;
    while (!validAction) {
      const action = await prompt('\nRate your recall: [e]asy, [m]edium, [h]ard, [a]gain, [ed]it, [q]uit > ');
      const scoreMap: { [key: string]: number } = { e: 3, m: 2, h: 1, a: 0 };

      if (action in scoreMap) {
        updateSrsData(cardToReviewPath, scoreMap[action]);
        reviewedCards.push(cardToReviewPath);
        console.log('Card updated.');
        validAction = true;
      } else if (action === 'ed') {
        const editor = process.env.EDITOR || 'vim';
        spawnSync({ cmd: [editor, cardToReviewPath], stdio: ['inherit', 'inherit', 'inherit'] });
        // Loop again to re-display card and prompt
      } else if (action === 'q') {
        console.log('Quitting review session.');
        return;
      } else {
        console.log('Invalid input. Please try again.');
      }
    }
  }

  if (reviewedCards.length > 0 && isGitRepo() && config.auto_push) {
    if (gitCommit(`Reviewed ${reviewedCards.length} card(s)`)) {
      gitPush();
    }
  }

  console.log('\nReview session complete!');
};
