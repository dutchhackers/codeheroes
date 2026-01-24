import { Config } from '../lib/config';
import { buildRepository, buildSender, generateNodeId, generateNumber, generateSha, getCurrentTimestamp } from './common';

export interface WorkflowRunOptions {
  name?: string;
  conclusion?: 'success' | 'failure' | 'cancelled' | 'skipped';
  branch?: string;
}

export function buildWorkflowRunPayload(config: Config, options: WorkflowRunOptions = {}) {
  const timestamp = getCurrentTimestamp();
  const workflowRunId = generateNumber(100000000, 999999999);
  const workflowId = generateNumber(1000000, 9999999);

  const name = options.name || 'CI';
  const conclusion = options.conclusion || 'success';
  const branch = options.branch || 'main';
  const headSha = generateSha();

  const workflow_run = {
    id: workflowRunId,
    node_id: generateNodeId('WFR'),
    name: name,
    head_branch: branch,
    head_sha: headSha,
    path: `.github/workflows/${name.toLowerCase().replace(/\s+/g, '-')}.yml`,
    run_number: generateNumber(1, 999),
    event: 'push',
    status: 'completed',
    conclusion: conclusion,
    workflow_id: workflowId,
    html_url: `https://github.com/${config.testRepository.fullName}/actions/runs/${workflowRunId}`,
    created_at: timestamp,
    updated_at: timestamp,
    run_started_at: timestamp,
    jobs_url: `https://api.github.com/repos/${config.testRepository.fullName}/actions/runs/${workflowRunId}/jobs`,
    logs_url: `https://api.github.com/repos/${config.testRepository.fullName}/actions/runs/${workflowRunId}/logs`,
    artifacts_url: `https://api.github.com/repos/${config.testRepository.fullName}/actions/runs/${workflowRunId}/artifacts`,
    cancel_url: `https://api.github.com/repos/${config.testRepository.fullName}/actions/runs/${workflowRunId}/cancel`,
    rerun_url: `https://api.github.com/repos/${config.testRepository.fullName}/actions/runs/${workflowRunId}/rerun`,
    workflow_url: `https://api.github.com/repos/${config.testRepository.fullName}/actions/workflows/${workflowId}`,
    head_commit: {
      id: headSha,
      tree_id: generateSha(),
      message: 'Test commit',
      timestamp: timestamp,
      author: {
        name: config.github.username,
        email: `${config.github.username}@users.noreply.github.com`,
      },
      committer: {
        name: config.github.username,
        email: `${config.github.username}@users.noreply.github.com`,
      },
    },
    repository: buildRepository(config),
    head_repository: buildRepository(config),
    actor: buildSender(config),
    triggering_actor: buildSender(config),
  };

  return {
    action: 'completed' as const,
    workflow_run: workflow_run,
    workflow: {
      id: workflowId,
      node_id: generateNodeId('W'),
      name: name,
      path: `.github/workflows/${name.toLowerCase().replace(/\s+/g, '-')}.yml`,
      state: 'active',
    },
    repository: buildRepository(config),
    sender: buildSender(config),
  };
}
