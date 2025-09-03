import prompts from 'prompts';
import chalk from 'chalk';
import { execSync } from 'child_process';
import { join } from 'path';
import { ensureClinkyHome, loadConfig, getClinkyHome } from '../config';
import { loadCard, getDueCards, Card } from '../card';
import ReviewDatabase, { Score } from '../database';
import { gitPull, gitPush } from '../git';

export async function reviewCommand(path?: string): Promise<void> {
  ensureClinkyHome();
  const config = loadConfig();

  if (config.auto_pull) {
    gitPull();
  }

  let cards: Card[];

  if (path) {
    // Review specific card
    try {
      const card = loadCard(path);
      cards = [card];
    } catch (error) {
      console.error(`Failed to load card: ${error}`);
      process.exit(1);
    }
  } else {
    // Review all due cards
    cards = getDueCards();

    if (cards.length === 0) {
      console.log(chalk.green('No cards due for review!'));
      return;
    }
  }

  console.log(chalk.blue(`Starting review session with ${cards.length} card(s)`));
  console.log();

  const db = new ReviewDatabase();
  let reviewedCount = 0;

  for (const card of cards) {
    console.clear();
    console.log(chalk.yellow('=== Card Front ==='));
    console.log();
    console.log(card.front);
    console.log();

    const { action } = await prompts({
      type: 'select',
      name: 'action',
      message: 'Choose action',
      choices: [
        { title: 'Show back', value: 'show' },
        { title: 'Edit card', value: 'edit' },
        { title: 'Quit', value: 'quit' },
      ],
    });

    if (action === 'quit') {
      break;
    }

    if (action === 'edit') {
      const editor = process.env.EDITOR || 'vim';
      const cardPath = join(getClinkyHome(), 'cards', card.path);
      try {
        execSync(`${editor} "${cardPath}"`, { stdio: 'inherit' });
        console.log('Card edited');
      } catch (error) {
        console.error(`Failed to open editor: ${error}`);
      }
      continue;
    }

    console.log();
    console.log(chalk.yellow('=== Card Back ==='));
    console.log();
    console.log(card.back);
    console.log();

    const { rating } = await prompts({
      type: 'select',
      name: 'rating',
      message: 'How well did you recall?',
      choices: [
        { title: 'Again', value: Score.AGAIN },
        { title: 'Hard', value: Score.HARD },
        { title: 'Medium', value: Score.MEDIUM },
        { title: 'Easy', value: Score.EASY },
        { title: 'Edit card', value: 'edit' },
        { title: 'Quit', value: 'quit' },
      ],
    });

    if (rating === 'quit') {
      break;
    }

    if (rating === 'edit') {
      const editor = process.env.EDITOR || 'vim';
      const cardPath = join(getClinkyHome(), 'cards', card.path);
      try {
        execSync(`${editor} "${cardPath}"`, { stdio: 'inherit' });
        console.log('Card edited');
      } catch (error) {
        console.error(`Failed to open editor: ${error}`);
      }
      continue;
    }

    db.addReview(card.name, rating);
    reviewedCount++;
  }

  db.close();

  console.log();
  console.log(chalk.green(`Review session complete! Reviewed ${reviewedCount} card(s).`));

  if (config.auto_push && reviewedCount > 0) {
    gitPush(`Reviewed ${reviewedCount} cards`);
  }
}
