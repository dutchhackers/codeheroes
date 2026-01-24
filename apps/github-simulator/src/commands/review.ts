import { Command } from 'commander';
import { Config } from '../lib/config';
import { sendWebhook, getWebhookUrl } from '../lib/sender';
import { printEventInfo, printSending, printResult, printError, EventInfo } from '../lib/output';
import { buildReviewPayload, ReviewOptions, ReviewState } from '../payloads/review';

export function createReviewCommand(
  getConfig: () => Config,
  getOptions: () => { validate: boolean; verbose: boolean }
) {
  const command = new Command('review')
    .description('Simulate pull request review events');

  const createReviewAction = (state: ReviewState) => {
    return async (cmdOptions: { pr?: string; body?: string }) => {
      const config = getConfig();
      const options = getOptions();

      try {
        const reviewOptions: ReviewOptions = {
          prNumber: cmdOptions.pr ? parseInt(cmdOptions.pr, 10) : undefined,
          body: cmdOptions.body,
        };

        const payload = buildReviewPayload(config, state, reviewOptions);

        const info: EventInfo = {
          eventType: 'pull_request_review',
          action: 'submitted',
          details: {
            prNumber: payload.pull_request.number,
            state: state,
          },
        };

        printEventInfo(info);

        const result = await sendWebhook('pull_request_review', payload);
        printSending(getWebhookUrl(), result.deliveryId);
        printResult(result, options.verbose);

        if (!result.success) {
          process.exit(1);
        }
      } catch (error) {
        printError(error instanceof Error ? error.message : String(error));
        process.exit(1);
      }
    };
  };

  // review approve
  command
    .command('approve')
    .description('Simulate approving a pull request')
    .option('-p, --pr <num>', 'PR number')
    .option('-b, --body <body>', 'Review body')
    .action(createReviewAction('approved'));

  // review request-changes
  command
    .command('request-changes')
    .description('Simulate requesting changes on a pull request')
    .option('-p, --pr <num>', 'PR number')
    .option('-b, --body <body>', 'Review body')
    .action(createReviewAction('changes_requested'));

  // review comment
  command
    .command('comment')
    .description('Simulate commenting on a pull request review')
    .option('-p, --pr <num>', 'PR number')
    .option('-b, --body <body>', 'Review body')
    .action(createReviewAction('commented'));

  return command;
}
