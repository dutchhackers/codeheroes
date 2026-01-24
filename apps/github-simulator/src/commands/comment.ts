import { Command } from 'commander';
import { Config } from '../lib/config';
import { sendWebhook, getWebhookUrl } from '../lib/sender';
import { printEventInfo, printSending, printResult, printError, EventInfo } from '../lib/output';
import { buildCommentPayload, CommentOptions } from '../payloads/comment';

export function createCommentCommand(
  getConfig: () => Config,
  getOptions: () => { validate: boolean; verbose: boolean }
) {
  const command = new Command('comment')
    .description('Simulate comment events');

  // comment pr
  command
    .command('pr')
    .description('Simulate commenting on a pull request')
    .option('-p, --pr <num>', 'PR number')
    .option('-b, --body <body>', 'Comment body')
    .action(async (cmdOptions) => {
      const config = getConfig();
      const options = getOptions();

      try {
        const commentOptions: CommentOptions = {
          prNumber: cmdOptions.pr ? parseInt(cmdOptions.pr, 10) : undefined,
          body: cmdOptions.body,
        };

        const payload = buildCommentPayload(config, 'pr', commentOptions);

        const info: EventInfo = {
          eventType: 'issue_comment',
          action: 'created',
          details: {
            target: 'pull request',
            number: payload.issue.number,
          },
        };

        printEventInfo(info);

        const result = await sendWebhook('issue_comment', payload);
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

  // comment issue
  command
    .command('issue')
    .description('Simulate commenting on an issue')
    .option('-i, --issue <num>', 'Issue number')
    .option('-b, --body <body>', 'Comment body')
    .action(async (cmdOptions) => {
      const config = getConfig();
      const options = getOptions();

      try {
        const commentOptions: CommentOptions = {
          issueNumber: cmdOptions.issue ? parseInt(cmdOptions.issue, 10) : undefined,
          body: cmdOptions.body,
        };

        const payload = buildCommentPayload(config, 'issue', commentOptions);

        const info: EventInfo = {
          eventType: 'issue_comment',
          action: 'created',
          details: {
            target: 'issue',
            number: payload.issue.number,
          },
        };

        printEventInfo(info);

        const result = await sendWebhook('issue_comment', payload);
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
