import { createHmac, timingSafeEqual } from 'crypto';
import {
  CodePushContext,
  CodePushMetrics,
  CodeReviewContext,
  CodeReviewMetrics,
  PullRequestContext,
  PullRequestMetrics,
  IssueContext,
  IssueMetrics,
  CommentContext,
  CommentMetrics,
  ReviewCommentContext,
  ReviewCommentMetrics,
  ReleaseContext,
  ReleaseMetrics,
  WorkflowRunContext,
  WorkflowRunMetrics,
  DiscussionContext,
  DiscussionMetrics,
} from '@codeheroes/types';
import { ProviderAdapter, GameActionResult } from '../interfaces/provider.interface';
import {
  IssueEvent,
  PullRequestEvent,
  PullRequestReviewEvent,
  PushEvent,
  IssueCommentEvent,
  PullRequestReviewCommentEvent,
  ReleaseEvent,
  WorkflowRunEvent,
  DiscussionEvent,
  DiscussionCommentEvent,
} from './interfaces/github.interfaces';

/**
 * GitHub provider adapter implementation
 */
export class GitHubAdapter implements ProviderAdapter {
  readonly providerName = 'github';

  /**
   * Maps GitHub events to game actions
   */
  mapEventToGameAction(eventType: string, eventData: any, userId: string): GameActionResult {
    switch (eventType) {
      case 'push':
        return this.mapCodePushEvent(eventData as PushEvent, userId);
      case 'pull_request_review':
        return this.mapReviewEvent(eventData as PullRequestReviewEvent, userId);
      case 'pull_request':
        return this.mapPullRequestEvent(eventData as PullRequestEvent, userId);
      case 'issues':
        return this.mapIssueEvent(eventData as IssueEvent, userId);
      case 'issue_comment':
        return this.mapIssueCommentEvent(eventData as IssueCommentEvent, userId);
      case 'pull_request_review_comment':
        return this.mapReviewCommentEvent(eventData as PullRequestReviewCommentEvent, userId);
      case 'release':
        return this.mapReleaseEvent(eventData as ReleaseEvent, userId);
      case 'workflow_run':
        return this.mapWorkflowRunEvent(eventData as WorkflowRunEvent, userId);
      case 'discussion':
        return this.mapDiscussionEvent(eventData as DiscussionEvent, userId);
      case 'discussion_comment':
        return this.mapDiscussionCommentEvent(eventData as DiscussionCommentEvent, userId);
      default:
        return null;
    }
  }

  /**
   * Validates GitHub webhook request
   */
  validateWebhook(
    headers: Record<string, string | string[] | undefined>,
    body: any,
    secret?: string,
    rawBody?: Buffer | string,
  ): { isValid: boolean; error?: string; eventType?: string; eventId?: string } {
    const githubEvent = headers['x-github-event'] as string;
    const eventId = headers['x-github-delivery'] as string;

    if (!githubEvent || !eventId) {
      return {
        isValid: false,
        error: 'Missing required GitHub webhook headers',
      };
    }

    if (secret) {
      const signature = headers['x-hub-signature-256'] as string;
      if (!signature) {
        return {
          isValid: false,
          error: 'Missing webhook signature header',
        };
      }

      const payload = rawBody ?? (typeof body === 'string' ? body : JSON.stringify(body));
      if (!this.verifySignature(payload, signature, secret)) {
        return {
          isValid: false,
          error: 'Invalid webhook signature',
        };
      }
    }

    return {
      isValid: true,
      eventType: githubEvent,
      eventId: eventId,
    };
  }

  /**
   * Extracts GitHub user ID from event data
   */
  extractUserId(eventData: any): string | undefined {
    return eventData?.sender?.id?.toString();
  }

  extractUserName(eventData: any): string | undefined {
    return eventData?.sender?.login;
  }

  private verifySignature(payload: string | Buffer, signature: string, secret: string): boolean {
    const expected = 'sha256=' + createHmac('sha256', secret).update(payload).digest('hex');
    try {
      return timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
    } catch {
      return false;
    }
  }

  private mapCodePushEvent(data: PushEvent, userId: string): GameActionResult {
    // Return null with skip reason if there are no commits
    if (!data.commits || data.commits.length === 0) {
      return {
        skipReason: 'No commits in push event',
      };
    }

    const context: CodePushContext = {
      type: 'code_push',
      provider: 'github',
      repository: {
        id: String(data.repository.id), // Convert number to string
        name: data.repository.name,
        owner: data.repository.owner.login, // Use owner.login from GitHubUser
      },
      branch: data.ref.replace('refs/heads/', ''), // Extract branch name from ref
      commits: data.commits.map((commit) => ({
        id: commit.id,
        message: commit.message,
        timestamp: commit.timestamp,
        author: {
          name: commit.author.name,
          email: commit.author.email,
          ...(commit.author.username && { username: commit.author.username }),
        },
        ...(commit.committer && {
          committer: {
            name: commit.committer.name,
            email: commit.committer.email,
            ...(commit.committer.username && { username: commit.committer.username }),
          },
        }),
      })),
      isNew: data.created,
      isDeleted: data.deleted,
      isForced: data.forced,
    };

    const actionMetrics: CodePushMetrics = {
      type: 'code_push',
      timestamp: data.commits[0]?.timestamp || new Date().toISOString(),
      commitCount: data.commits.length, // Use actual commit count from the array
    };

    return {
      userId,
      externalId: data.ref, // Use data.ref instead of event.ref
      provider: 'github',
      type: 'code_push',
      timestamp: actionMetrics.timestamp,
      externalUser: {
        id: String(data.sender.id), // Convert number to string
        username: data.sender.login,
      },
      context,
      metrics: actionMetrics,
    };
  }

  private mapReviewEvent(event: PullRequestReviewEvent, userId: string): GameActionResult {
    const context: CodeReviewContext = {
      type: 'code_review',
      provider: 'github',
      repository: {
        id: String(event.repository.id),
        name: event.repository.name,
        owner: event.repository.owner.login,
      },
      pullRequest: {
        id: String(event.pull_request.id),
        number: event.pull_request.number,
        title: event.pull_request.title,
      },
      review: {
        id: String(event.review.id),
        state: event.review.state,
      },
    };

    const actionMetrics: CodeReviewMetrics = {
      type: 'code_review',
      timestamp: event.review.submitted_at,
      commentsCount: 0, // Will need to be calculated from review content
      threadCount: 0, // Not available in webhook payload
      filesReviewed: 0, // Not available in webhook payload
      suggestionsCount: 0, // Would need to parse review comments
      timeToReview: 0, // Would need additional context
      thoroughness: 0, // Would need additional context
    };

    return {
      userId,
      externalId: String(event.review.id),
      provider: 'github',
      type: 'code_review_submit',
      timestamp: event.review.submitted_at,
      externalUser: {
        id: String(event.review.user.id),
        username: event.review.user.login,
      },
      context,
      metrics: actionMetrics,
    };
  }

  private mapPullRequestEvent(event: PullRequestEvent, userId: string): GameActionResult {
    // Determine action type - only track specific actions for XP
    const type = (() => {
      if (event.action === 'closed' && event.pull_request.merged) {
        return 'pull_request_merge';
      }
      if (event.action === 'closed') {
        return 'pull_request_close';
      }
      if (event.action === 'opened') {
        return 'pull_request_create';
      }
      // Skip synchronize, edited, reopened, etc. - no XP for these
      return null;
    })();

    // Skip actions we don't track for XP
    if (!type) {
      return {
        skipReason: `Pull request action '${event.action}' not tracked for XP gains`,
      };
    }

    const context: PullRequestContext = {
      type: 'pull_request',
      provider: 'github',
      repository: {
        id: String(event.repository.id),
        name: event.repository.name,
        owner: event.repository.owner.login,
      },
      pullRequest: {
        id: String(event.pull_request.id),
        number: event.pull_request.number,
        title: event.pull_request.title,
        branch: event.pull_request.head.ref,
        baseBranch: event.pull_request.base.ref,
      },
    };

    const metrics: PullRequestMetrics = {
      type: 'pull_request',
      timestamp: event.pull_request.updated_at,
      commits: event.pull_request.commits,
      additions: event.pull_request.additions,
      deletions: event.pull_request.deletions,
      changedFiles: event.pull_request.changed_files,
      comments: event.pull_request.comments,
      reviewers: event.pull_request.requested_reviewers?.length || 0,
      timeToMerge: event.pull_request.merged_at
        ? this.calculateTimeDifference(event.pull_request.created_at, event.pull_request.merged_at)
        : 0,
    };

    return {
      userId,
      externalId: String(event.pull_request.id),
      provider: 'github',
      type,
      timestamp: event.pull_request.updated_at,
      externalUser: {
        id: String(event.sender.id),
        username: event.sender.login,
      },
      context,
      metrics,
    };
  }

  private mapIssueEvent(event: IssueEvent, userId: string): GameActionResult {
    // Convert GitHub issue event to game action based on action type
    const actionType = (() => {
      switch (event.action) {
        case 'opened':
          return 'issue_create';
        case 'closed':
          return 'issue_close';
        case 'reopened':
          return 'issue_reopen';
        default:
          return null;
      }
    })();

    // Skip actions we don't track or give XP for
    if (!actionType) {
      return {
        skipReason: `Issue action '${event.action}' not tracked for XP gains`,
      };
    }

    // Create the issue context
    const context: IssueContext = {
      type: 'issue',
      provider: 'github',
      repository: {
        id: String(event.repository.id),
        name: event.repository.name,
        owner: event.repository.owner.login,
      },
      issue: {
        id: String(event.issue.id),
        number: event.issue.number,
        title: event.issue.title,
      },
    };

    // Calculate metrics for the issue
    const metrics: IssueMetrics = {
      type: 'issue',
      timestamp: event.issue.updated_at,
      bodyLength: event.issue.body?.length || 0,
      // Only include optional properties if they exist
      ...(event.action === 'closed' && event.issue.closed_at
        ? {
            timeToClose: this.calculateTimeDifference(event.issue.created_at, event.issue.closed_at),
          }
        : {}),
      // Store complexity as a heuristic based on body length
      complexity: Math.min(Math.floor((event.issue.body?.length || 0) / 100), 5),
    };

    // Return the mapped game action
    return {
      type: actionType,
      userId,
      externalId: String(event.issue.id),
      provider: 'github',
      timestamp: event.issue.updated_at,
      externalUser: {
        id: String(event.sender.id),
        username: event.sender.login,
      },
      context,
      metrics,
    };
  }

  private mapIssueCommentEvent(event: IssueCommentEvent, userId: string): GameActionResult {
    // Only track 'created' action for XP
    if (event.action !== 'created') {
      return {
        skipReason: `Comment action '${event.action}' not tracked for XP gains`,
      };
    }

    // Determine if the comment is on a PR or an issue
    const isOnPullRequest = !!event.issue.pull_request;
    const targetType = isOnPullRequest ? 'pull_request' : 'issue';

    // Create the comment context
    const context: CommentContext = {
      type: 'comment',
      provider: 'github',
      repository: {
        id: String(event.repository.id),
        name: event.repository.name,
        owner: event.repository.owner.login,
      },
      comment: {
        id: String(event.comment.id),
        body: event.comment.body,
      },
      target: {
        type: targetType,
        id: String(event.issue.id),
        number: event.issue.number,
        title: event.issue.title,
      },
    };

    // Calculate metrics for the comment
    const metrics: CommentMetrics = {
      type: 'comment',
      timestamp: event.comment.created_at,
      bodyLength: event.comment.body?.length || 0,
      isOnPullRequest,
    };

    // Return the mapped game action
    return {
      type: 'comment_create',
      userId,
      externalId: String(event.comment.id),
      provider: 'github',
      timestamp: event.comment.created_at,
      externalUser: {
        id: String(event.sender.id),
        username: event.sender.login,
      },
      context,
      metrics,
    };
  }

  private mapReviewCommentEvent(event: PullRequestReviewCommentEvent, userId: string): GameActionResult {
    // Only track 'created' action for XP
    if (event.action !== 'created') {
      return {
        skipReason: `Review comment action '${event.action}' not tracked for XP gains`,
      };
    }

    // Check if the comment contains a code suggestion (```suggestion block)
    const hasSuggestion = event.comment.body?.includes('```suggestion') || false;

    // Check if this is a reply to another comment
    const isReply = !!event.comment.in_reply_to_id;

    // Create the review comment context
    const context: ReviewCommentContext = {
      type: 'review_comment',
      provider: 'github',
      repository: {
        id: String(event.repository.id),
        name: event.repository.name,
        owner: event.repository.owner.login,
      },
      pullRequest: {
        id: String(event.pull_request.id),
        number: event.pull_request.number,
        title: event.pull_request.title,
      },
      comment: {
        id: String(event.comment.id),
        body: event.comment.body,
        path: event.comment.path,
        line: event.comment.line,
      },
    };

    // Calculate metrics for the review comment
    const metrics: ReviewCommentMetrics = {
      type: 'review_comment',
      timestamp: event.comment.created_at,
      bodyLength: event.comment.body?.length || 0,
      hasSuggestion,
      isReply,
    };

    // Return the mapped game action
    return {
      type: 'review_comment_create',
      userId,
      externalId: String(event.comment.id),
      provider: 'github',
      timestamp: event.comment.created_at,
      externalUser: {
        id: String(event.sender.id),
        username: event.sender.login,
      },
      context,
      metrics,
    };
  }

  private mapReleaseEvent(event: ReleaseEvent, userId: string): GameActionResult {
    // Only track 'published' action for XP (avoid double-counting)
    if (event.action !== 'published') {
      return {
        skipReason: `Release action '${event.action}' not tracked for XP gains`,
      };
    }

    // Skip draft releases
    if (event.release.draft) {
      return {
        skipReason: 'Draft releases not tracked for XP gains',
      };
    }

    // Parse semver from tag name
    const versionInfo = this.parseSemanticVersion(event.release.tag_name);

    // Create the release context
    const context: ReleaseContext = {
      type: 'release',
      provider: 'github',
      repository: {
        id: String(event.repository.id),
        name: event.repository.name,
        owner: event.repository.owner.login,
      },
      release: {
        id: String(event.release.id),
        tagName: event.release.tag_name,
        name: event.release.name,
        body: event.release.body,
        isDraft: event.release.draft,
        isPrerelease: event.release.prerelease,
      },
    };

    // Calculate metrics for the release
    const metrics: ReleaseMetrics = {
      type: 'release',
      timestamp: event.release.published_at || event.release.created_at,
      hasReleaseNotes: !!(event.release.body && event.release.body.length > 0),
      isMajorVersion: versionInfo.isMajor,
      isMinorVersion: versionInfo.isMinor,
      isPatchVersion: versionInfo.isPatch,
      isPrerelease: event.release.prerelease,
    };

    // Return the mapped game action
    return {
      type: 'release_publish',
      userId,
      externalId: String(event.release.id),
      provider: 'github',
      timestamp: event.release.published_at || event.release.created_at,
      externalUser: {
        id: String(event.sender.id),
        username: event.sender.login,
      },
      context,
      metrics,
    };
  }

  /**
   * Parse semantic version from a tag name
   * Returns which type of version bump this represents
   */
  private parseSemanticVersion(tagName: string): { isMajor: boolean; isMinor: boolean; isPatch: boolean } {
    // Remove leading 'v' if present
    const version = tagName.replace(/^v/, '');

    // Try to match semver pattern (e.g., 1.0.0, 1.2.3)
    const semverMatch = version.match(/^(\d+)\.(\d+)\.(\d+)/);

    if (!semverMatch) {
      // Not a valid semver, treat as patch
      return { isMajor: false, isMinor: false, isPatch: true };
    }

    const [, major, minor, patch] = semverMatch;

    // Heuristic: if minor and patch are 0, it's a major release (e.g., 2.0.0)
    if (minor === '0' && patch === '0' && parseInt(major) > 0) {
      return { isMajor: true, isMinor: false, isPatch: false };
    }

    // If patch is 0 but minor is not, it's a minor release (e.g., 1.1.0)
    if (patch === '0' && parseInt(minor) > 0) {
      return { isMajor: false, isMinor: true, isPatch: false };
    }

    // Otherwise it's a patch release (e.g., 1.0.1)
    return { isMajor: false, isMinor: false, isPatch: true };
  }

  private mapWorkflowRunEvent(event: WorkflowRunEvent, userId: string): GameActionResult {
    // Only track 'completed' action with 'success' conclusion for XP
    if (event.action !== 'completed') {
      return {
        skipReason: `Workflow run action '${event.action}' not tracked for XP gains`,
      };
    }

    // Only reward successful workflow runs
    if (event.workflow_run.conclusion !== 'success') {
      return {
        skipReason: `Workflow run conclusion '${event.workflow_run.conclusion}' not tracked for XP gains`,
      };
    }

    // Check if this is a deployment workflow
    const workflowName = event.workflow_run.name.toLowerCase();
    const isDeployment =
      workflowName.includes('deploy') || workflowName.includes('release') || workflowName.includes('publish');

    // Create the workflow run context
    const context: WorkflowRunContext = {
      type: 'workflow_run',
      provider: 'github',
      repository: {
        id: String(event.repository.id),
        name: event.repository.name,
        owner: event.repository.owner.login,
      },
      workflow: {
        id: String(event.workflow_run.id),
        name: event.workflow_run.name,
        headBranch: event.workflow_run.head_branch,
        conclusion: event.workflow_run.conclusion || 'unknown',
      },
    };

    // Calculate metrics for the workflow run
    const metrics: WorkflowRunMetrics = {
      type: 'workflow_run',
      timestamp: new Date().toISOString(), // workflow_run doesn't have a timestamp field
      conclusion: event.workflow_run.conclusion || 'unknown',
      isDeployment,
    };

    // Return the mapped game action
    return {
      type: 'ci_success',
      userId,
      externalId: String(event.workflow_run.id),
      provider: 'github',
      timestamp: new Date().toISOString(),
      externalUser: {
        id: String(event.sender.id),
        username: event.sender.login,
      },
      context,
      metrics,
    };
  }

  private mapDiscussionEvent(event: DiscussionEvent, userId: string): GameActionResult {
    // Only track 'created' action for XP
    if (event.action !== 'created') {
      return {
        skipReason: `Discussion action '${event.action}' not tracked for XP gains`,
      };
    }

    // Create the discussion context
    const context: DiscussionContext = {
      type: 'discussion',
      provider: 'github',
      repository: {
        id: String(event.repository.id),
        name: event.repository.name,
        owner: event.repository.owner.login,
      },
      discussion: {
        id: String(event.discussion.id),
        number: event.discussion.number,
        title: event.discussion.title,
        categoryName: event.discussion.category.name,
        isAnswerable: event.discussion.category.is_answerable,
      },
    };

    // Calculate metrics for the discussion
    const metrics: DiscussionMetrics = {
      type: 'discussion',
      timestamp: event.discussion.created_at,
      bodyLength: event.discussion.body?.length || 0,
      isAnswerable: event.discussion.category.is_answerable,
    };

    // Return the mapped game action
    return {
      type: 'discussion_create',
      userId,
      externalId: String(event.discussion.id),
      provider: 'github',
      timestamp: event.discussion.created_at,
      externalUser: {
        id: String(event.sender.id),
        username: event.sender.login,
      },
      context,
      metrics,
    };
  }

  private mapDiscussionCommentEvent(event: DiscussionCommentEvent, userId: string): GameActionResult {
    // Only track 'created' action for XP
    if (event.action !== 'created') {
      return {
        skipReason: `Discussion comment action '${event.action}' not tracked for XP gains`,
      };
    }

    // Create the discussion context
    const context: DiscussionContext = {
      type: 'discussion',
      provider: 'github',
      repository: {
        id: String(event.repository.id),
        name: event.repository.name,
        owner: event.repository.owner.login,
      },
      discussion: {
        id: String(event.discussion.id),
        number: event.discussion.number,
        title: event.discussion.title,
        categoryName: event.discussion.category.name,
        isAnswerable: event.discussion.category.is_answerable,
      },
      comment: {
        id: String(event.comment.id),
        body: event.comment.body,
      },
    };

    // Calculate metrics for the discussion comment
    // Note: We can't know if this is the accepted answer at creation time
    // That would require handling the 'answered' action on the discussion
    const metrics: DiscussionMetrics = {
      type: 'discussion',
      timestamp: event.comment.created_at,
      bodyLength: event.comment.body?.length || 0,
      isAnswerable: event.discussion.category.is_answerable,
      isAcceptedAnswer: false, // Will be updated later if marked as answer
    };

    // Return the mapped game action
    return {
      type: 'discussion_comment',
      userId,
      externalId: String(event.comment.id),
      provider: 'github',
      timestamp: event.comment.created_at,
      externalUser: {
        id: String(event.sender.id),
        username: event.sender.login,
      },
      context,
      metrics,
    };
  }

  private calculateTimeDifference(start: string, end: string): number {
    return (new Date(end).getTime() - new Date(start).getTime()) / 1000;
  }
}
