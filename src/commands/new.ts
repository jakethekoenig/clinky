import path from 'path';
import fs from 'fs';
import { CARDS_DIR, getConfig } from '../config';
import { spawnSync } from 'bun';
import { isGitRepo, gitPull, gitCommit, gitPush } from '../git';

const CARD_TEMPLATE = `Front of the card
Can be multiple lines
<!---split--->
Back of the card
% Lines starting with % are comments and ignored by clinky when printing for review.`;

export const newCard = () => {
  const config = getConfig();
  if (isGitRepo() && config.auto_pull) {
    if (!gitPull()) {
      return;
    }
  }

  const editor = process.env.EDITOR || 'vim';
  const timestamp = Date.now();
  const cardPath = path.join(CARDS_DIR, `${timestamp}.txt`);

  fs.writeFileSync(cardPath, CARD_TEMPLATE);

  const proc = spawnSync({
    cmd: ['sh', '-c', `${editor} "${cardPath}"`],
    stdio: ['inherit', 'inherit', 'inherit'],
  });

  if (proc.exitCode !== 0) {
    console.error(`Editor process exited with code ${proc.exitCode}.`);
    fs.unlinkSync(cardPath); // Clean up template file
    return;
  }

  const content = fs.readFileSync(cardPath, 'utf-8');
  if (content.trim() === CARD_TEMPLATE.trim() || content.trim() === '') {
    console.log('Card content unchanged or empty. Deleting card.');
    fs.unlinkSync(cardPath);
  } else {
    console.log(`Card created at ${cardPath}`);
    if (isGitRepo() && config.auto_push) {
      const cardFileName = path.basename(cardPath);
      if (gitCommit(`Created card ${cardFileName}`)) {
        gitPush();
      }
    }
  }
};
