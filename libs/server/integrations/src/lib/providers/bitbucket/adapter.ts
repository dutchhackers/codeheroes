import { createHmac, timingSafeEqual } from 'crypto';
import {
  CodePushContext,
  CodePushMetrics,
  PullRequestContext,
  PullRequestMetrics,
} from '@codeheroes/types';
import { ProviderAdapter, GameActionResult } from '../interfaces/provider.interface';
import { BitbucketPushWebhook, BitbucketPullRequestWebhook } from './types';

export class BitbucketAdapter implements ProviderAdapter {
  readonly providerName = 'bitbucket';

  validateWebhook(
    headers: Record<string, string | string[] | undefined>,
    body: any,
    secret?: string,
    rawBody?: Buffer | string,
  ): { isValid: boolean; error?: string; eventType?: string; eventId?: string } {
    const eventType = headers['x-event-key'] as string;
    const eventId = headers['x-request-uuid'] as string;

    if (!eventType || !eventId) {
      return { isValid: false, error: 'Missing required Bitbucket webhook headers' };
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

    return { isValid: true, eventType, eventId };
  }

  extractUserId(eventData: any): string | undefined {
    return eventData?.actor?.account_id;
  }

  mapEventToGameAction(eventType: string, eventData: any, userId: string): GameActionResult {
    const handlers: Record<string, (data: any, uid: string) => GameActionResult> = {
      'repo:push': this.handlePushWebhook.bind(this),
      'pullrequest:created': this.handlePullRequestWebhook.bind(this),
      'pullrequest:fulfilled': this.handlePullRequestWebhook.bind(this),
    };

    const handler = handlers[eventType];
    return handler ? handler(eventData, userId) : null;
  }

  private handlePushWebhook(webhook: BitbucketPushWebhook, uid: string): GameActionResult {
    if (!webhook.push?.changes?.length) {
      return { skipReason: 'Push contains no changes' };
    }

    const change = webhook.push.changes.find(
      (c) => c && Array.isArray(c.commits) && c.commits.length > 0,
    );

    if (!change) {
      return { skipReason: 'Push contains no commits' };
    }

    const commits = change.commits;

    const branchName = change.new?.name || '';

    const parseAuthor = (raw: string) => {
      const match = raw.match(/^(.+?)\s*<(.+?)>$/);
      return match
        ? { name: match[1], email: match[2] }
        : { name: raw, email: '' };
    };

    const pushContext: CodePushContext = {
      type: 'code_push',
      provider: 'bitbucket',
      repository: {
        id: webhook.repository.uuid,
        name: webhook.repository.name,
        owner: webhook.repository.workspace.slug,
      },
      branch: branchName,
      commits: commits.map(commit => {
        const author = parseAuthor(commit.author.raw);
        return {
          id: commit.hash,
          message: commit.message,
          timestamp: commit.date,
          author,
          committer: author,
        };
      }),
      isNew: change.created,
      isDeleted: change.closed,
      isForced: change.forced,
    };

    const pushMetrics: CodePushMetrics = {
      type: 'code_push',
      timestamp: commits[0].date,
      commitCount: commits.length,
    };

    return {
      userId: uid,
      externalId: change.new?.target.hash || commits[0].hash,
      provider: 'bitbucket',
      type: 'code_push',
      timestamp: pushMetrics.timestamp,
      externalUser: {
        id: webhook.actor.account_id,
        username: webhook.actor.nickname,
      },
      context: pushContext,
      metrics: pushMetrics,
    };
  }

  private handlePullRequestWebhook(
    webhook: BitbucketPullRequestWebhook,
    uid: string,
  ): GameActionResult {
    const { pullrequest } = webhook;

    const actionType: 'pull_request_create' | 'pull_request_merge' =
      pullrequest.state === 'MERGED' ? 'pull_request_merge' : 'pull_request_create';

    const prContext: PullRequestContext = {
      type: 'pull_request',
      provider: 'bitbucket',
      repository: {
        id: webhook.repository.uuid,
        name: webhook.repository.name,
        owner: webhook.repository.workspace.slug,
      },
      pullRequest: {
        id: String(pullrequest.id),
        number: pullrequest.id,
        title: pullrequest.title,
        branch: pullrequest.source.branch.name,
        baseBranch: pullrequest.destination.branch.name,
      },
    };

    const timeDelta =
      actionType === 'pull_request_merge'
        ? (new Date(pullrequest.updated_on).getTime() - new Date(pullrequest.created_on).getTime()) / 1000
        : 0;

    const prMetrics: PullRequestMetrics = {
      type: 'pull_request',
      timestamp: pullrequest.updated_on,
      commits: 0,
      additions: 0,
      deletions: 0,
      changedFiles: 0,
      comments: pullrequest.comment_count || 0,
      reviewers: 0,
      timeToMerge: timeDelta,
    };

    return {
      userId: uid,
      externalId: String(pullrequest.id),
      provider: 'bitbucket',
      type: actionType,
      timestamp: prMetrics.timestamp,
      externalUser: {
        id: webhook.actor.account_id,
        username: webhook.actor.nickname,
      },
      context: prContext,
      metrics: prMetrics,
    };
  }
}
