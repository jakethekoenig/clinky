import { createInterface, Interface } from 'readline';
import { spawn } from 'child_process';
import { basename } from 'path';
import { ensureClinkyHome, getConfig } from '../lib/config.js';
import { getAllCards, resolveCardArgument } from '../lib/cards.js';
import type { Card } from '../types.js';
import {
  addReview,
  getCardSchedule,
  updateCardSchedule,
  getDueCards,
} from '../lib/database.js';
import {
  calculateNextReview,
  parseReviewScore,
} from '../lib/spaced-repetition.js';
import { gitPull, gitCommitAndPush } from '../lib/git.js';
import { closeDatabase } from '../lib/database.js';

export async function reviewCommand(cardPath?: string): Promise<void> {
  ensureClinkyHome();
  const config = getConfig();

  // Auto pull if enabled
  if (config.autoPull) {
    console.log('Pulling latest changes...');
    if (!gitPull()) {
      console.error(
        'Failed to pull changes. Please resolve conflicts manually.'
      );
      process.exit(1);
    }
  }

  let cardsToReview: string[];
  let allCards: ReturnType<typeof getAllCards>;

  if (cardPath) {
    // Review specific card - optimize by not scanning all cards
    const { name, card } = resolveCardArgument(cardPath);
    if (!card) {
      console.error(`Card not found: ${cardPath}`);
      process.exit(1);
    }
    cardsToReview = [name];
    // Create minimal allCards array with just this card
    allCards = [card];
  } else {
    // Get all due cards
    const dueCards = getDueCards();

    // Also include cards that have never been reviewed
    allCards = getAllCards();
    const allCardNames = allCards.map((c) => c.name);
    const neverReviewed = allCardNames.filter(
      (name) => !dueCards.includes(name)
    );

    // Add cards that don't have schedules yet
    for (const cardName of neverReviewed) {
      const schedule = getCardSchedule(cardName);
      if (!schedule) {
        dueCards.push(cardName);
      }
    }

    cardsToReview = dueCards;
  }

  if (cardsToReview.length === 0) {
    console.log('No cards due for review!');
    return;
  }

  console.log(`Starting review session with ${cardsToReview.length} card(s)\n`);

  let reviewedCount = 0;
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  // Create a map of cards to avoid repeated filesystem scans
  const cardMap = new Map(allCards.map((card) => [card.name, card]));

  try {
    for (const cardName of cardsToReview) {
      const card = cardMap.get(cardName);
      if (!card) {
        console.warn(`Card not found: ${cardName}`);
        continue;
      }

      const result = await reviewCard(card, rl);
      if (!result.continue) {
        break;
      }
      if (result.reviewed) {
        reviewedCount++;
      }
    }
  } finally {
    rl.close();
  }

  console.log(`\nReview session completed. Reviewed ${reviewedCount} card(s).`);

  // Auto push if enabled and cards were reviewed
  if (config.autoPush && reviewedCount > 0) {
    console.log('Pushing changes...');
    if (!gitCommitAndPush(`Reviewed ${reviewedCount} cards`)) {
      console.warn('Failed to push changes to git');
    }
  }

  // Clean up database connection
  closeDatabase();
}

async function reviewCard(
  card: Card | null,
  rl: Interface
): Promise<{ continue: boolean; reviewed: boolean }> {
  if (!card) return { continue: true, reviewed: false };

  console.log(`\n--- Card: ${card.name} ---`);
  console.log(card.front);
  console.log('\nPress Enter to see the back, or:');
  console.log('  edit - edit card');
  console.log('  q - quit review session');

  const frontResponse = await question(rl, '> ');

  if (frontResponse.toLowerCase() === 'q') {
    return { continue: false, reviewed: false };
  }

  if (frontResponse.toLowerCase() === 'edit') {
    await editCard(card.filePath);
    return { continue: true, reviewed: false };
  }

  // Show back of card
  console.log('\n--- Back ---');
  console.log(card.back);
  console.log('\nHow well did you remember this card?');
  console.log("  1/again - Didn't remember at all");
  console.log('  2/hard  - Remembered with difficulty');
  console.log('  3/medium - Remembered with some effort');
  console.log('  4/easy  - Remembered easily');
  console.log('  edit - edit card');
  console.log('  q - quit review session');

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const backResponse = await question(rl, '> ');

    if (backResponse.toLowerCase() === 'q') {
      return { continue: false, reviewed: false };
    }

    if (backResponse.toLowerCase() === 'edit') {
      await editCard(card.filePath);
      return { continue: true, reviewed: false };
    }

    const score = parseReviewScore(backResponse);
    if (score !== null) {
      // Record the review
      addReview({
        cardName: card.name,
        createdAt: new Date(),
        score,
      });

      // Update the card schedule
      const currentSchedule = getCardSchedule(card.name);
      const newSchedule = calculateNextReview(currentSchedule, score);
      newSchedule.cardName = card.name;
      updateCardSchedule(newSchedule);

      const nextReviewDate = newSchedule.nextReview.toLocaleDateString();
      console.log(`Card scheduled for next review: ${nextReviewDate}`);

      return { continue: true, reviewed: true };
    }

    console.log(
      'Invalid input. Please enter 1-4, again/hard/medium/easy, edit, or q.'
    );
  }
}

async function editCard(cardPath: string): Promise<void> {
  const editor = process.env.EDITOR || 'vim';
  console.log(`Opening ${basename(cardPath)} in ${editor}...`);

  const editorProcess = spawn(editor, [cardPath], {
    stdio: 'inherit',
  });

  return new Promise((resolve, reject) => {
    editorProcess.on('close', (code) => {
      if (code !== 0) {
        console.error(`Editor exited with code ${code}`);
        reject(new Error(`Editor exited with code ${code}`));
        return;
      }

      console.log('Card updated.');
      resolve();
    });

    editorProcess.on('error', (error) => {
      console.error('Failed to start editor:', error);
      reject(error);
    });
  });
}

function question(rl: Interface, prompt: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(prompt, (answer: string) => {
      resolve(answer);
    });
  });
}
