import { Command } from 'commander';
import { Config } from '../lib/config';
import { sendWebhook, getWebhookUrl } from '../lib/sender';
import { printEventInfo, printSending, printResult, printError, EventInfo } from '../lib/output';
import { buildWorkflowRunPayload, WorkflowRunOptions } from '../payloads/workflow-run';

export function createWorkflowRunCommand(
  getConfig: () => Config,
  getOptions: () => { validate: boolean; verbose: boolean }
) {
  const command = new Command('workflow')
    .description('Simulate workflow run events (CI/CD)');

  // workflow success
  command
    .command('success')
    .description('Simulate a successful workflow run')
    .option('-n, --name <name>', 'Workflow name (e.g., "CI", "Deploy")')
    .option('-b, --branch <branch>', 'Branch name (default: main)')
    .action(async (cmdOptions) => {
      const config = getConfig();
      const options = getOptions();

      try {
        const workflowOptions: WorkflowRunOptions = {
          name: cmdOptions.name,
          conclusion: 'success',
          branch: cmdOptions.branch,
        };

        const payload = buildWorkflowRunPayload(config, workflowOptions);

        // Check if it's a deployment workflow
        const workflowName = payload.workflow_run.name.toLowerCase();
        const isDeployment =
          workflowName.includes('deploy') || workflowName.includes('release') || workflowName.includes('publish');

        const info: EventInfo = {
          eventType: 'workflow_run',
          action: 'completed',
          details: {
            name: payload.workflow_run.name,
            conclusion: payload.workflow_run.conclusion,
            branch: payload.workflow_run.head_branch,
            isDeployment: isDeployment ? 'yes' : 'no',
          },
        };

        printEventInfo(info);

        const result = await sendWebhook('workflow_run', payload);
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

  // workflow failure
  command
    .command('failure')
    .description('Simulate a failed workflow run')
    .option('-n, --name <name>', 'Workflow name (e.g., "CI", "Deploy")')
    .option('-b, --branch <branch>', 'Branch name (default: main)')
    .action(async (cmdOptions) => {
      const config = getConfig();
      const options = getOptions();

      try {
        const workflowOptions: WorkflowRunOptions = {
          name: cmdOptions.name,
          conclusion: 'failure',
          branch: cmdOptions.branch,
        };

        const payload = buildWorkflowRunPayload(config, workflowOptions);

        const info: EventInfo = {
          eventType: 'workflow_run',
          action: 'completed',
          details: {
            name: payload.workflow_run.name,
            conclusion: payload.workflow_run.conclusion,
            branch: payload.workflow_run.head_branch,
          },
        };

        printEventInfo(info);

        const result = await sendWebhook('workflow_run', payload);
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
