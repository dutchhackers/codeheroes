import { createHmac, timingSafeEqual } from 'crypto';
import {
  CodePushContext,
  CodePushMetrics,
  PullRequestContext,
  PullRequestMetrics,
} from '@codeheroes/types';
import { ProviderAdapter, GameActionResult } from '../interfaces/provider.interface';
import { BitbucketServerPushWebhook, BitbucketServerPullRequestWebhook } from './types';

export class BitbucketServerAdapter implements ProviderAdapter {
  readonly providerName = 'bitbucket_server';

  validateWebhook(
    headers: Record<string, string | string[] | undefined>,
    body: any,
    secret?: string,
    rawBody?: Buffer | string,
  ): { isValid: boolean; error?: string; eventType?: string; eventId?: string } {
    const eventType = headers['x-event-key'] as string;
    const eventId = headers['x-request-id'] as string;

    if (!eventType) {
      return { isValid: false, error: 'Missing required Bitbucket Server webhook headers' };
    }

    if (secret) {
      const signature = headers['x-hub-signature'] as string;
      if (!signature) {
        return { isValid: false, error: 'Missing webhook signature header' };
      }

      const payload = rawBody ?? (typeof body === 'string' ? body : JSON.stringify(body));
      const expected = 'sha256=' + createHmac('sha256', secret).update(payload).digest('hex');

      try {
        if (!timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
          return { isValid: false, error: 'Invalid webhook signature' };
        }
      } catch {
        return { isValid: false, error: 'Invalid webhook signature' };
      }
    }

    const derivedEventId = eventId
      || body?.changes?.[0]?.toHash
      || (body?.pullRequest ? `${body.pullRequest.id}-${body.pullRequest.updatedDate}-${eventType}` : undefined)
      || `${eventType}-${Date.now()}`;

    return {
      isValid: true,
      eventType,
      eventId: derivedEventId,
    };
  }

  extractUserId(eventData: any): string | undefined {
    return eventData?.actor?.id?.toString();
  }

  mapEventToGameAction(eventType: string, eventData: any, userId: string): GameActionResult {
    const handlers: Record<string, (data: any, uid: string) => GameActionResult> = {
      'repo:refs_changed': this.handlePushWebhook.bind(this),
      'pr:opened': this.handlePullRequestWebhook.bind(this),
      'pr:merged': this.handlePullRequestWebhook.bind(this),
    };

    const handler = handlers[eventType];
    return handler ? handler(eventData, userId) : null;
  }

  private handlePushWebhook(webhook: BitbucketServerPushWebhook, uid: string): GameActionResult {
    const change = webhook.changes?.[0];
    if (!change) {
      return { skipReason: 'Push contains no changes' };
    }

    const commits = webhook.commits || [];
    const branchName = change.ref?.displayId || change.refId?.replace(/^refs\/heads\//, '') || '';
    const isNew = change.type === 'ADD';
    const isDeleted = change.type === 'DELETE';

    const pushContext: CodePushContext = {
      type: 'code_push',
      provider: 'bitbucket_server',
      repository: {
        id: String(webhook.repository.id),
        name: webhook.repository.slug,
        owner: webhook.repository.project.key,
      },
      branch: branchName,
      commits: commits.map(commit => ({
        id: commit.id,
        message: commit.message,
        timestamp: new Date(commit.authorTimestamp).toISOString(),
        author: {
          name: commit.author.name,
          email: commit.author.emailAddress,
        },
        committer: {
          name: commit.committer.name,
          email: commit.committer.emailAddress,
        },
      })),
      isNew,
      isDeleted,
      isForced: false,
    };

    const normalizeTimestamp = (value: string | number): string => {
      try {
        const date = new Date(value);
        return isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
      } catch {
        return new Date().toISOString();
      }
    };

    const pushMetrics: CodePushMetrics = {
      type: 'code_push',
      timestamp: commits[0]
        ? new Date(commits[0].authorTimestamp).toISOString()
        : normalizeTimestamp(webhook.date),
      commitCount: commits.length,
    };

    return {
      userId: uid,
      externalId: change.toHash,
      provider: 'bitbucket_server',
      type: 'code_push',
      timestamp: pushMetrics.timestamp,
      externalUser: {
        id: String(webhook.actor.id),
        username: webhook.actor.name,
      },
      context: pushContext,
      metrics: pushMetrics,
    };
  }

  private handlePullRequestWebhook(
    webhook: BitbucketServerPullRequestWebhook,
    uid: string,
  ): GameActionResult {
    const { pullRequest, eventKey } = webhook;

    const actionType: 'pull_request_create' | 'pull_request_merge' =
      eventKey === 'pr:merged' ? 'pull_request_merge' : 'pull_request_create';

    const prContext: PullRequestContext = {
      type: 'pull_request',
      provider: 'bitbucket_server',
      repository: {
        id: String(pullRequest.toRef.repository.id),
        name: pullRequest.toRef.repository.slug,
        owner: pullRequest.toRef.repository.project.key,
      },
      pullRequest: {
        id: String(pullRequest.id),
        number: pullRequest.id,
        title: pullRequest.title,
        branch: pullRequest.fromRef.displayId,
        baseBranch: pullRequest.toRef.displayId,
      },
    };

    const timeDelta =
      pullRequest.closedDate && pullRequest.createdDate
        ? (pullRequest.closedDate - pullRequest.createdDate) / 1000
        : 0;

    const prMetrics: PullRequestMetrics = {
      type: 'pull_request',
      timestamp: new Date(pullRequest.updatedDate).toISOString(),
      commits: 0,
      additions: 0,
      deletions: 0,
      changedFiles: 0,
      comments: pullRequest.properties?.commentCount || 0,
      reviewers: pullRequest.reviewers?.length || 0,
      timeToMerge: timeDelta,
    };

    return {
      userId: uid,
      externalId: String(pullRequest.id),
      provider: 'bitbucket_server',
      type: actionType,
      timestamp: prMetrics.timestamp,
      externalUser: {
        id: String(webhook.actor.id),
        username: webhook.actor.name,
      },
      context: prContext,
      metrics: prMetrics,
    };
  }
}
