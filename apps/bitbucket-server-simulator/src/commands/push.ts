import { Command } from 'commander';
import { Config } from '../lib/config';
import { sendWebhook, getWebhookUrl } from '../lib/sender';
import { printEventInfo, printSending, printResult, printError, EventInfo } from '../lib/output';
import { buildPushPayload, PushOptions } from '../payloads/push';

export function createPushCommand(
  getConfig: () => Config,
  getOptions: () => { validate: boolean; verbose: boolean }
) {
  const command = new Command('push')
    .description('Simulate a Bitbucket Server push event')
    .option('-b, --branch <name>', 'Branch name', 'main')
    .option('-m, --message <msg>', 'Commit message', 'Update code')
    .option('-c, --commits <count>', 'Number of commits', '1')
    .action(async (cmdOptions) => {
      const config = getConfig();
      const options = getOptions();

      try {
        const pushOptions: PushOptions = {
          branch: cmdOptions.branch,
          message: cmdOptions.message,
          commitCount: parseInt(cmdOptions.commits, 10),
        };

        const payload = buildPushPayload(config, pushOptions);

        const info: EventInfo = {
          eventType: 'repo:refs_changed',
          details: {
            branch: pushOptions.branch || 'main',
            commits: pushOptions.commitCount || 1,
            message: pushOptions.message || 'Update code',
            repository: `${config.testRepository.projectKey}/${config.testRepository.slug}`,
          },
        };

        printEventInfo(info);

        const result = await sendWebhook('repo:refs_changed', payload);
        printSending(getWebhookUrl(), result.requestId);
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
