#!/usr/bin/env node

import { Command } from 'commander';
import { newCommand } from './commands/new.js';
import { reviewCommand } from './commands/review.js';
import { closeDatabase } from './lib/database.js';

const program = new Command();

program
  .name('clinky')
  .description('A CLI spaced repetition program')
  .version('1.0.0');

program
  .command('new')
  .description('Create a new flashcard')
  .action(async () => {
    try {
      await newCommand();
    } catch (error) {
      console.error('Error creating new card:', error);
      process.exit(1);
    }
  });

program
  .command('review')
  .description('Start a review session for due cards')
  .argument('[path]', 'Optional path to a specific card to review')
  .action(async (path?: string) => {
    try {
      await reviewCommand(path);
    } catch (error) {
      console.error('Error during review session:', error);
      process.exit(1);
    }
  });

// Handle cleanup on exit
process.on('SIGINT', () => {
  console.log('\nExiting...');
  closeDatabase();
  process.exit(0);
});

process.on('SIGTERM', () => {
  closeDatabase();
  process.exit(0);
});

// Parse command line arguments
program.parse();
