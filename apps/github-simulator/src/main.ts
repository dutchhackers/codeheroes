#!/usr/bin/env node

import { Command } from 'commander';
import { loadConfig, Config } from './lib/config';
import { checkEmulator } from './lib/validator';
import { printHeader, printError, printWarning } from './lib/output';
import { createPushCommand } from './commands/push';
import { createPrCommand } from './commands/pr';
import { createIssueCommand } from './commands/issue';
import { createReviewCommand } from './commands/review';
import { createCommentCommand } from './commands/comment';

let config: Config;

async function preAction(validate: boolean): Promise<void> {
  printHeader();

  // Check emulator availability unless skipped
  if (validate) {
    const validation = await checkEmulator();
    if (!validation.available) {
      printError(validation.error || 'Emulator not available');
      process.exit(1);
    }
  } else {
    printWarning('Skipping emulator validation');
  }

  // Load config
  try {
    config = loadConfig();
  } catch (error) {
    printError(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

const program = new Command();

program
  .name('gh-sim')
  .description('Simulate GitHub webhook events for local testing')
  .version('1.0.0')
  .option('--no-validate', 'Skip emulator availability check')
  .option('-v, --verbose', 'Show full request/response details', false)
  .hook('preAction', async (thisCommand) => {
    const opts = thisCommand.opts();
    await preAction(opts.validate !== false);
  });

// Create a lazy config getter for commands
const getCommandOptions = () => ({
  validate: program.opts().validate !== false,
  verbose: program.opts().verbose || false,
});

const getConfig = () => config;

// Add commands with lazy config loading
program.addCommand(createPushCommand(getConfig, getCommandOptions));
program.addCommand(createPrCommand(getConfig, getCommandOptions));
program.addCommand(createIssueCommand(getConfig, getCommandOptions));
program.addCommand(createReviewCommand(getConfig, getCommandOptions));
program.addCommand(createCommentCommand(getConfig, getCommandOptions));

program.parseAsync(process.argv).catch((error) => {
  printError(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
