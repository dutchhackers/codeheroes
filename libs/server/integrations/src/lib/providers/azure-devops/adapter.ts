import { timingSafeEqual } from 'crypto';
import {
  CodePushContext,
  CodePushMetrics,
  PullRequestContext,
  PullRequestMetrics,
} from '@codeheroes/types';
import { ProviderAdapter, GameActionResult } from '../interfaces/provider.interface';
import { AzurePushWebhook, AzurePullRequestWebhook } from './types';

export class AzureDevOpsProviderAdapter implements ProviderAdapter {
  readonly providerName = 'azure';

  mapEventToGameAction(
    eventType: string,
    eventData: any,
    userId: string
  ): GameActionResult {
    const handlers: Record<string, (data: any, uid: string) => GameActionResult> = {
      'git.push': this.handlePushWebhook.bind(this),
      'git.pullrequest.created': this.handlePullRequestWebhook.bind(this),
      'git.pullrequest.merged': this.handlePullRequestWebhook.bind(this),
    };

    const handler = handlers[eventType];
    return handler ? handler(eventData, userId) : null;
  }

  validateWebhook(
    headers: Record<string, string | string[] | undefined>,
    body: any,
    secret?: string,
    _rawBody?: Buffer | string,
  ): { isValid: boolean; error?: string; eventType?: string; eventId?: string } {
    if (secret) {
      const rawHeader = headers['authorization'];
      const authHeader = Array.isArray(rawHeader) ? rawHeader[0] : rawHeader;
      if (!authHeader) {
        return { isValid: false, error: 'Missing Authorization header' };
      }

      const expected = 'Basic ' + Buffer.from(secret).toString('base64');
      try {
        if (!timingSafeEqual(Buffer.from(authHeader), Buffer.from(expected))) {
          return { isValid: false, error: 'Invalid Authorization header' };
        }
      } catch {
        return { isValid: false, error: 'Invalid Authorization header' };
      }
    }

    const { eventType, id, notificationId } = body || {};

    if (!eventType) {
      return { isValid: false, error: 'Azure DevOps webhook missing eventType field' };
    }

    const eventIdentifier = id || notificationId?.toString();
    if (!eventIdentifier) {
      return { isValid: false, error: 'Azure DevOps webhook missing id/notificationId' };
    }

    return {
      isValid: true,
      eventType,
      eventId: eventIdentifier,
    };
  }

  extractUserId(eventData: any): string | undefined {
    return eventData?.resource?.pushedBy?.id || 
           eventData?.resource?.createdBy?.id;
  }

  private handlePushWebhook(webhook: AzurePushWebhook, uid: string): GameActionResult {
    const { resource } = webhook;
    
    if (!resource.commits?.length) {
      return { skipReason: 'Push contains no commits' };
    }

    const branchRef = resource.refUpdates[0]?.name || '';
    const branchDisplay = branchRef.replace(/^refs\/heads\//, '');

    const pushContext: CodePushContext = {
      type: 'code_push',
      provider: 'azure',
      repository: {
        id: resource.repository.id,
        name: resource.repository.name,
        owner: resource.repository.project.name,
      },
      branch: branchDisplay,
      commits: resource.commits.map(commit => ({
        id: commit.commitId,
        message: commit.comment,
        timestamp: commit.author.date,
        author: {
          name: commit.author.name,
          email: commit.author.email,
        },
        committer: {
          name: commit.committer.name,
          email: commit.committer.email,
        },
      })),
      isNew: false,
      isDeleted: false,
      isForced: false,
    };

    const pushMetrics: CodePushMetrics = {
      type: 'code_push',
      timestamp: resource.commits[0].author.date,
      commitCount: resource.commits.length,
    };

    return {
      userId: uid,
      externalId: String(resource.pushId),
      provider: 'azure',
      type: 'code_push',
      timestamp: pushMetrics.timestamp,
      externalUser: {
        id: resource.pushedBy.id,
        username: resource.pushedBy.uniqueName,
      },
      context: pushContext,
      metrics: pushMetrics,
    };
  }

  private handlePullRequestWebhook(
    webhook: AzurePullRequestWebhook,
    uid: string
  ): GameActionResult {
    const { resource, eventType } = webhook;

    let actionType: 'pull_request_create' | 'pull_request_merge' | null = null;
    if (eventType === 'git.pullrequest.created') {
      actionType = 'pull_request_create';
    } else if (eventType === 'git.pullrequest.merged' || resource.status === 'completed') {
      actionType = 'pull_request_merge';
    }

    if (!actionType) {
      return {
        skipReason: `PR event ${eventType} with status ${resource.status} not eligible for rewards`,
      };
    }

    const sourceBranchName = resource.sourceRefName.replace(/^refs\/heads\//, '');
    const targetBranchName = resource.targetRefName.replace(/^refs\/heads\//, '');

    const prContext: PullRequestContext = {
      type: 'pull_request',
      provider: 'azure',
      repository: {
        id: resource.repository.id,
        name: resource.repository.name,
        owner: resource.repository.project.name,
      },
      pullRequest: {
        id: String(resource.pullRequestId),
        number: resource.pullRequestId,
        title: resource.title,
        branch: sourceBranchName,
        baseBranch: targetBranchName,
      },
    };

    const timeDelta = resource.closedDate && resource.creationDate
      ? (new Date(resource.closedDate).getTime() - new Date(resource.creationDate).getTime()) / 1000
      : 0;

    // TODO: Enrich PR metrics via Azure DevOps REST API
    // Azure webhook payloads don't include diff stats (unlike GitHub).
    // To populate commits/additions/deletions/changedFiles, call:
    //   GET {org}/{project}/_apis/git/repositories/{repo}/pullRequests/{id}?api-version=7.0
    // with $expand=all to get iteration and thread counts.
    const prMetrics: PullRequestMetrics = {
      type: 'pull_request',
      timestamp: resource.closedDate || resource.creationDate || webhook.createdDate,
      commits: 0,
      additions: 0,
      deletions: 0,
      changedFiles: 0,
      comments: 0,
      reviewers: 0,
      timeToMerge: timeDelta,
    };

    return {
      userId: uid,
      externalId: String(resource.pullRequestId),
      provider: 'azure',
      type: actionType,
      timestamp: prMetrics.timestamp,
      externalUser: {
        id: resource.createdBy.id,
        username: resource.createdBy.uniqueName,
      },
      context: prContext,
      metrics: prMetrics,
    };
  }
}
