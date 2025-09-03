#!/usr/bin/env bun
import { Command } from 'commander';
import { initClinkyHome } from './config';

initClinkyHome();

const program = new Command();

import { newCard } from './commands/new';
import { review } from './commands/review';

program
  .name('clinky')
  .description('A CLI for spaced repetition')
  .version('0.0.1');

program
  .command('new')
  .description('Create a new card')
  .action(newCard);

program
  .command('review')
  .description('Review due cards')
  .argument('[path]', 'Optional path to a specific card to review')
  .action(review);

program.parse(process.argv);
