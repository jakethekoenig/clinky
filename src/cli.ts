#!/usr/bin/env bun

import { Command } from 'commander';
import { newCommand } from './commands/new';
import { reviewCommand } from './commands/review';
import { version } from '../package.json';

const program = new Command();

program.name('clinky').description('A CLI spaced repetition program').version(version);

program.command('new').description('Create a new card').action(newCommand);

program
  .command('review [path]')
  .description('Start a review session for due cards')
  .argument('[path]', 'Optional path to a specific card to review')
  .action(reviewCommand);

program.parse();
