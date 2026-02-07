import { Command } from 'commander';
import { Config } from '../lib/config';
import { sendWebhook, getWebhookUrl } from '../lib/sender';
import { printEventInfo, printSending, printResult, printError, EventInfo } from '../lib/output';
import { buildPullRequestMergedPayload, PullRequestOptions } from '../payloads/pull-request';

export function createPrMergedCommand(
  getConfig: () => Config,
  getOptions: () => { validate: boolean; verbose: boolean }
) {
  const command = new Command('pr-merged')
    .description('Simulate a Bitbucket Cloud pull request merged event')
    .option('-t, --title <title>', 'PR title', 'Add feature X')
    .option('-s, --source <branch>', 'Source branch')
    .option('-b, --base <branch>', 'Target branch', 'main')
    .option('-n, --number <number>', 'PR number')
    .action(async (cmdOptions) => {
      const config = getConfig();
      const options = getOptions();

      try {
        const prOptions: PullRequestOptions = {
          title: cmdOptions.title,
          sourceBranch: cmdOptions.source,
          targetBranch: cmdOptions.base,
          prNumber: cmdOptions.number ? parseInt(cmdOptions.number, 10) : undefined,
        };

        const payload = buildPullRequestMergedPayload(config, prOptions);

        const info: EventInfo = {
          eventType: 'pullrequest:fulfilled',
          details: {
            title: payload.pullrequest.title,
            source: payload.pullrequest.source.branch.name,
            target: payload.pullrequest.destination.branch.name,
            'PR #': payload.pullrequest.id,
          },
        };

        printEventInfo(info);

        const result = await sendWebhook('pullrequest:fulfilled', payload);
        printSending(getWebhookUrl(), result.requestUuid);
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
