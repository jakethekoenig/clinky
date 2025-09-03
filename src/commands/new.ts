import { spawn } from 'child_process';
import { existsSync } from 'fs';
import { basename, relative } from 'path';
import { ensureClinkyHome, getConfig, getClinkyHome } from '../lib/config.js';
import { createCardTemplate, getCardPath, saveCard } from '../lib/cards.js';
import { gitPull, gitCommitAndPush } from '../lib/git.js';
import { closeDatabase } from '../lib/database.js';

export async function newCommand(): Promise<void> {
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

  const cardPath = getCardPath();
  const template = createCardTemplate();

  // Save template to file
  saveCard(cardPath, template);

  // Determine editor
  const editor = process.env.EDITOR || 'vim';

  console.log(`Opening ${basename(cardPath)} in ${editor}...`);

  // Open editor
  const editorProcess = spawn(editor, [cardPath], {
    stdio: 'inherit',
  });

  return new Promise<void>((resolve, reject) => {
    editorProcess.on('close', async (code) => {
      if (code !== 0) {
        console.error(`Editor exited with code ${code}`);
        reject(new Error(`Editor exited with code ${code}`));
        return;
      }

      // Check if file still exists and has content
      if (!existsSync(cardPath)) {
        console.log('Card creation cancelled (file deleted)');
        resolve();
        return;
      }

      console.log(`Card created: ${basename(cardPath)}`);

      // Auto push if enabled
      if (config.autoPush) {
        console.log('Pushing changes...');
        const clinkyHome = getClinkyHome();
        const relativePath = relative(clinkyHome, cardPath);
        if (!gitCommitAndPush(`Created card ${relativePath}`)) {
          console.warn('Failed to push changes to git');
        }
      }

      resolve();
    });

    editorProcess.on('error', (error) => {
      console.error('Failed to start editor:', error);
      reject(error);
    });
  }).finally(() => {
    // Clean up database connection
    closeDatabase();
  });
}
