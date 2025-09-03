import { writeFileSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';
import { getClinkyHome, ensureClinkyHome, loadConfig } from '../config';
import { gitPull, gitPush } from '../git';

const CARD_TEMPLATE = `Front of the card

<!---split--->
Back of the card
% Lines starting with % are comments and ignored by clinky when printing for review.
`;

export async function newCommand(): Promise<void> {
  ensureClinkyHome();
  const config = loadConfig();

  if (config.auto_pull) {
    gitPull();
  }

  const timestamp = Date.now();
  const cardPath = join(getClinkyHome(), 'cards', `${timestamp}.txt`);

  // Write template to file
  writeFileSync(cardPath, CARD_TEMPLATE);

  // Open editor
  const editor = process.env.EDITOR || 'vim';
  try {
    execSync(`${editor} "${cardPath}"`, { stdio: 'inherit' });
  } catch (error) {
    console.error(`Failed to open editor: ${error}`);
    process.exit(1);
  }

  console.log(`Created card: ${timestamp}.txt`);

  if (config.auto_push) {
    gitPush(`Created card ${timestamp}.txt`);
  }
}
