import { Command } from 'commander';
import { Config } from '../lib/config';
import { sendWebhook, getWebhookUrl } from '../lib/sender';
import { printEventInfo, printSending, printResult, printError, EventInfo } from '../lib/output';
import { buildReviewCommentPayload, ReviewCommentOptions } from '../payloads/review-comment';

export function createReviewCommentCommand(
  getConfig: () => Config,
  getOptions: () => { validate: boolean; verbose: boolean }
) {
  const command = new Command('review-comment')
    .description('Simulate pull request review comment events (inline code comments)');

  // review-comment create
  command
    .command('create')
    .description('Simulate creating an inline code comment on a pull request')
    .option('-p, --pr <num>', 'PR number')
    .option('-b, --body <body>', 'Comment body')
    .option('--path <path>', 'File path being commented on (e.g., src/example.ts)')
    .option('--line <line>', 'Line number in the file')
    .option('-s, --suggestion', 'Include a code suggestion block')
    .action(async (cmdOptions) => {
      const config = getConfig();
      const options = getOptions();

      try {
        const reviewCommentOptions: ReviewCommentOptions = {
          prNumber: cmdOptions.pr ? parseInt(cmdOptions.pr, 10) : undefined,
          body: cmdOptions.body,
          path: cmdOptions.path,
          line: cmdOptions.line ? parseInt(cmdOptions.line, 10) : undefined,
          withSuggestion: cmdOptions.suggestion,
        };

        const payload = buildReviewCommentPayload(config, reviewCommentOptions);

        const info: EventInfo = {
          eventType: 'pull_request_review_comment',
          action: 'created',
          details: {
            prNumber: payload.pull_request.number,
            path: payload.comment.path,
            line: payload.comment.line,
            hasSuggestion: payload.comment.body.includes('```suggestion') ? 'yes' : 'no',
          },
        };

        printEventInfo(info);

        const result = await sendWebhook('pull_request_review_comment', payload);
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
