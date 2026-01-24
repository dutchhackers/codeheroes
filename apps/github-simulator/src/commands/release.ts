import { Command } from 'commander';
import { Config } from '../lib/config';
import { sendWebhook, getWebhookUrl } from '../lib/sender';
import { printEventInfo, printSending, printResult, printError, EventInfo } from '../lib/output';
import { buildReleasePayload, ReleaseOptions } from '../payloads/release';

export function createReleaseCommand(
  getConfig: () => Config,
  getOptions: () => { validate: boolean; verbose: boolean }
) {
  const command = new Command('release')
    .description('Simulate release events');

  // release publish
  command
    .command('publish')
    .description('Simulate publishing a release')
    .option('-t, --tag <tag>', 'Tag name (e.g., v1.0.0)')
    .option('-n, --name <name>', 'Release name (defaults to tag name)')
    .option('-b, --body <body>', 'Release notes body')
    .option('--prerelease', 'Mark as a prerelease')
    .action(async (cmdOptions) => {
      const config = getConfig();
      const options = getOptions();

      try {
        const releaseOptions: ReleaseOptions = {
          tagName: cmdOptions.tag,
          name: cmdOptions.name,
          body: cmdOptions.body,
          prerelease: cmdOptions.prerelease,
        };

        const payload = buildReleasePayload(config, releaseOptions);

        // Determine version type for display
        const tag = payload.release.tag_name;
        const versionMatch = tag.replace(/^v/, '').match(/^(\d+)\.(\d+)\.(\d+)/);
        let versionType = 'patch';
        if (versionMatch) {
          const [, , minor, patch] = versionMatch;
          if (minor === '0' && patch === '0') versionType = 'major';
          else if (patch === '0') versionType = 'minor';
        }

        const info: EventInfo = {
          eventType: 'release',
          action: 'published',
          details: {
            tag: payload.release.tag_name,
            name: payload.release.name || payload.release.tag_name,
            versionType: versionType,
            prerelease: payload.release.prerelease ? 'yes' : 'no',
          },
        };

        printEventInfo(info);

        const result = await sendWebhook('release', payload);
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
