import { Command } from 'commander';
import { Config } from '../lib/config';
import { sendWebhook, getWebhookUrl } from '../lib/sender';
import { printEventInfo, printSending, printResult, printError, EventInfo } from '../lib/output';
import {
  buildDiscussionPayload,
  buildDiscussionCommentPayload,
  DiscussionOptions,
  DiscussionCommentOptions,
} from '../payloads/discussion';

export function createDiscussionCommand(
  getConfig: () => Config,
  getOptions: () => { validate: boolean; verbose: boolean }
) {
  const command = new Command('discussion')
    .description('Simulate GitHub Discussion events');

  // discussion create
  command
    .command('create')
    .description('Simulate creating a discussion')
    .option('-t, --title <title>', 'Discussion title')
    .option('-b, --body <body>', 'Discussion body')
    .option('-c, --category <category>', 'Category name (default: Q&A)')
    .option('--no-answerable', 'Mark category as not answerable')
    .action(async (cmdOptions) => {
      const config = getConfig();
      const options = getOptions();

      try {
        const discussionOptions: DiscussionOptions = {
          title: cmdOptions.title,
          body: cmdOptions.body,
          categoryName: cmdOptions.category,
          isAnswerable: cmdOptions.answerable !== false,
        };

        const payload = buildDiscussionPayload(config, discussionOptions);

        const info: EventInfo = {
          eventType: 'discussion',
          action: 'created',
          details: {
            number: payload.discussion.number,
            title: payload.discussion.title,
            category: payload.discussion.category.name,
            answerable: payload.discussion.category.is_answerable ? 'yes' : 'no',
          },
        };

        printEventInfo(info);

        const result = await sendWebhook('discussion', payload);
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

  // discussion comment
  command
    .command('comment')
    .description('Simulate commenting on a discussion')
    .option('-d, --discussion <num>', 'Discussion number')
    .option('-b, --body <body>', 'Comment body')
    .action(async (cmdOptions) => {
      const config = getConfig();
      const options = getOptions();

      try {
        const commentOptions: DiscussionCommentOptions = {
          discussionNumber: cmdOptions.discussion ? parseInt(cmdOptions.discussion, 10) : undefined,
          body: cmdOptions.body,
        };

        const payload = buildDiscussionCommentPayload(config, commentOptions);

        const info: EventInfo = {
          eventType: 'discussion_comment',
          action: 'created',
          details: {
            discussionNumber: payload.discussion.number,
            bodyLength: payload.comment.body.length,
          },
        };

        printEventInfo(info);

        const result = await sendWebhook('discussion_comment', payload);
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
