import { Command } from 'commander';
import { Config } from '../lib/config';
import { sendWebhook, getWebhookUrl } from '../lib/sender';
import { printEventInfo, printSending, printResult, printError, EventInfo } from '../lib/output';
import { buildIssuePayload, IssueOptions } from '../payloads/issue';

export function createIssueCommand(
  getConfig: () => Config,
  getOptions: () => { validate: boolean; verbose: boolean }
) {
  const command = new Command('issue')
    .description('Simulate issue events');

  // issue open
  command
    .command('open')
    .description('Simulate opening an issue')
    .option('-t, --title <title>', 'Issue title')
    .option('-b, --body <body>', 'Issue body')
    .option('-n, --number <num>', 'Issue number')
    .action(async (cmdOptions) => {
      const config = getConfig();
      const options = getOptions();

      try {
        const issueOptions: IssueOptions = {
          title: cmdOptions.title,
          body: cmdOptions.body,
          number: cmdOptions.number ? parseInt(cmdOptions.number, 10) : undefined,
        };

        const payload = buildIssuePayload(config, 'opened', issueOptions);

        const info: EventInfo = {
          eventType: 'issues',
          action: 'opened',
          details: {
            number: payload.issue.number,
            title: payload.issue.title,
          },
        };

        printEventInfo(info);

        const result = await sendWebhook('issues', payload);
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

  // issue close
  command
    .command('close')
    .description('Simulate closing an issue')
    .option('-n, --number <num>', 'Issue number')
    .action(async (cmdOptions) => {
      const config = getConfig();
      const options = getOptions();

      try {
        const issueOptions: IssueOptions = {
          number: cmdOptions.number ? parseInt(cmdOptions.number, 10) : undefined,
        };

        const payload = buildIssuePayload(config, 'closed', issueOptions);

        const info: EventInfo = {
          eventType: 'issues',
          action: 'closed',
          details: {
            number: payload.issue.number,
          },
        };

        printEventInfo(info);

        const result = await sendWebhook('issues', payload);
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
