import { Command } from 'commander';
import { Config } from '../lib/config';
import { sendWebhook, getWebhookUrl } from '../lib/sender';
import { printEventInfo, printSending, printResult, printError, EventInfo } from '../lib/output';
import { buildPullRequestPayload, PullRequestOptions } from '../payloads/pull-request';

export function createPrCommand(
  getConfig: () => Config,
  getOptions: () => { validate: boolean; verbose: boolean }
) {
  const command = new Command('pr')
    .description('Simulate pull request events');

  // pr open
  command
    .command('open')
    .description('Simulate opening a pull request')
    .option('-t, --title <title>', 'PR title')
    .option('-b, --body <body>', 'PR body')
    .option('--branch <name>', 'Source branch name')
    .option('--base <name>', 'Base branch name', 'main')
    .option('-n, --number <num>', 'PR number')
    .option('-d, --draft', 'Create as draft PR', false)
    .action(async (cmdOptions) => {
      const config = getConfig();
      const options = getOptions();

      try {
        const prOptions: PullRequestOptions = {
          title: cmdOptions.title,
          body: cmdOptions.body,
          branch: cmdOptions.branch,
          baseBranch: cmdOptions.base,
          number: cmdOptions.number ? parseInt(cmdOptions.number, 10) : undefined,
          draft: cmdOptions.draft,
        };

        const payload = buildPullRequestPayload(config, 'opened', prOptions);

        const info: EventInfo = {
          eventType: 'pull_request',
          action: cmdOptions.draft ? 'opened (draft)' : 'opened',
          details: {
            number: payload.number,
            title: payload.pull_request.title,
            branch: payload.pull_request.head.ref,
            base: payload.pull_request.base.ref,
          },
        };

        printEventInfo(info);

        const result = await sendWebhook('pull_request', payload);
        printSending(getWebhookUrl(), result.deliveryId);
        printResult(result, options.verbose);

        if (!result.success) {
          process.exit(1);
        }
      } catch (error) {
        printError(error instanceof Error ? error.message : String(error));
        process.exit(1);
      }
    });

  // pr close
  command
    .command('close')
    .description('Simulate closing a pull request (without merge)')
    .option('-n, --number <num>', 'PR number')
    .action(async (cmdOptions) => {
      const config = getConfig();
      const options = getOptions();

      try {
        const prOptions: PullRequestOptions = {
          number: cmdOptions.number ? parseInt(cmdOptions.number, 10) : undefined,
        };

        const payload = buildPullRequestPayload(config, 'closed', prOptions, false);

        const info: EventInfo = {
          eventType: 'pull_request',
          action: 'closed',
          details: {
            number: payload.number,
            merged: 'no',
          },
        };

        printEventInfo(info);

        const result = await sendWebhook('pull_request', payload);
        printSending(getWebhookUrl(), result.deliveryId);
        printResult(result, options.verbose);

        if (!result.success) {
          process.exit(1);
        }
      } catch (error) {
        printError(error instanceof Error ? error.message : String(error));
        process.exit(1);
      }
    });

  // pr merge
  command
    .command('merge')
    .description('Simulate merging a pull request')
    .option('-n, --number <num>', 'PR number')
    .action(async (cmdOptions) => {
      const config = getConfig();
      const options = getOptions();

      try {
        const prOptions: PullRequestOptions = {
          number: cmdOptions.number ? parseInt(cmdOptions.number, 10) : undefined,
        };

        const payload = buildPullRequestPayload(config, 'closed', prOptions, true);

        const info: EventInfo = {
          eventType: 'pull_request',
          action: 'closed',
          details: {
            number: payload.number,
            merged: 'yes',
          },
        };

        printEventInfo(info);

        const result = await sendWebhook('pull_request', payload);
        printSending(getWebhookUrl(), result.deliveryId);
        printResult(result, options.verbose);

        if (!result.success) {
          process.exit(1);
        }
      } catch (error) {
        printError(error instanceof Error ? error.message : String(error));
        process.exit(1);
      }
    });

  // pr ready
  command
    .command('ready')
    .description('Simulate marking a draft PR as ready for review')
    .option('-n, --number <num>', 'PR number')
    .action(async (cmdOptions) => {
      const config = getConfig();
      const options = getOptions();

      try {
        const prOptions: PullRequestOptions = {
          number: cmdOptions.number ? parseInt(cmdOptions.number, 10) : undefined,
          draft: false,
        };

        const payload = buildPullRequestPayload(config, 'ready_for_review', prOptions);

        const info: EventInfo = {
          eventType: 'pull_request',
          action: 'ready_for_review',
          details: {
            number: payload.number,
          },
        };

        printEventInfo(info);

        const result = await sendWebhook('pull_request', payload);
        printSending(getWebhookUrl(), result.deliveryId);
        printResult(result, options.verbose);

        if (!result.success) {
          process.exit(1);
        }
      } catch (error) {
        printError(error instanceof Error ? error.message : String(error));
        process.exit(1);
      }
    });

  return command;
}
