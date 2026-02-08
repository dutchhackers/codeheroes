#!/usr/bin/env node

import { Command } from 'commander';
import { loadConfig, Config } from './lib/config';
import { checkEmulator } from './lib/validator';
import { printHeader, printError, printWarning } from './lib/output';
import { createPushCommand } from './commands/push';
import { createPrCreatedCommand } from './commands/pr-created';
import { createPrMergedCommand } from './commands/pr-merged';

let config: Config;

async function preAction(validate: boolean): Promise<void> {
  printHeader();

  if (validate) {
    const validation = await checkEmulator();
    if (!validation.available) {
      printError(validation.error || 'Emulator not available');
      process.exit(1);
    }
  } else {
    printWarning('Skipping emulator validation');
  }

  try {
    config = loadConfig();
  } catch (error) {
    printError(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

const program = new Command();

program
  .name('bb-sim')
  .description('Simulate Bitbucket webhook events for local testing')
  .version('1.0.0')
  .option('--no-validate', 'Skip emulator availability check')
  .option('-v, --verbose', 'Show full request/response details', false)
  .hook('preAction', async (thisCommand) => {
    const opts = thisCommand.opts();
    await preAction(opts.validate !== false);
  });

const getCommandOptions = () => ({
  validate: program.opts().validate !== false,
  verbose: program.opts().verbose || false,
});

const getConfig = () => config;

program.addCommand(createPushCommand(getConfig, getCommandOptions));
program.addCommand(createPrCreatedCommand(getConfig, getCommandOptions));
program.addCommand(createPrMergedCommand(getConfig, getCommandOptions));

program.parseAsync(process.argv).catch((error) => {
  printError(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
