import {
    IssueEventData,
    PullRequestEventData,
    PullRequestReviewCommentEventData,
    PullRequestReviewEventData,
    PullRequestReviewThreadEventData,
    PushEventData,
} from '@codeheroes/providers';
import {
    IssueEvent,
    PullRequestEvent,
    PullRequestReviewCommentEvent,
    PullRequestReviewEvent,
    PullRequestReviewThreadEvent,
    PushEvent,
} from '../interfaces/github.interfaces';

export abstract class GitHubParser<T, R> {
  abstract parse(payload: T): R;
}

export class PushEventParser extends GitHubParser<PushEvent, PushEventData> {
  parse(payload: PushEvent): PushEventData {
    return {
      repository: {
        id: payload.repository.id.toString(),
        name: payload.repository.name,
        owner: payload.repository.owner.login,
        ownerType: payload.repository.owner.type,
      },
      metrics: {
        commits: payload.commits.length,
      },
      branch: payload.ref,
      lastCommitMessage: payload.head_commit?.message || null,
      sender: {
        id: payload.sender.id.toString(),
        login: payload.sender.login,
      },
    };
  }
}

export class PullRequestParser extends GitHubParser<PullRequestEvent, PullRequestEventData> {
  parse(payload: PullRequestEvent): PullRequestEventData {
    const { pull_request } = payload;
    return {
      repository: {
        id: payload.repository.id.toString(),
        name: payload.repository.name,
        owner: payload.repository.owner.login,
        ownerType: payload.repository.owner.type,
      },
      action: payload.action,
      prNumber: payload.number,
      title: pull_request.title,
      state: pull_request.state,
      merged: pull_request.merged || false,
      draft: pull_request.draft || false,
      createdAt: pull_request.created_at,
      updatedAt: pull_request.updated_at,
      ...(pull_request.merged_at && {
        mergedAt: pull_request.merged_at,
        mergedBy: {
          id: pull_request.merged_by!.id.toString(),
          login: pull_request.merged_by!.login,
        },
      }),
      metrics: {
        commits: pull_request.commits,
        additions: pull_request.additions,
        deletions: pull_request.deletions,
        changedFiles: pull_request.changed_files,
      },
      sender: {
        id: payload.sender.id.toString(),
        login: payload.sender.login,
      },
    };
  }
}

export class IssueParser extends GitHubParser<IssueEvent, IssueEventData> {
  parse(payload: IssueEvent): IssueEventData {
    return {
      repository: {
        id: payload.repository.id.toString(),
        name: payload.repository.name,
        owner: payload.repository.owner.login,
        ownerType: payload.repository.owner.type,
      },
      action: payload.action,
      issueNumber: payload.issue.number,
      title: payload.issue.title,
      state: payload.issue.state,
      stateReason: payload.issue.state_reason || null,
      sender: {
        id: payload.sender.id.toString(),
        login: payload.sender.login,
      },
    };
  }
}

export class PullRequestReviewParser extends GitHubParser<PullRequestReviewEvent, PullRequestReviewEventData> {
  parse(payload: PullRequestReviewEvent): PullRequestReviewEventData {
    return {
      repository: {
        id: payload.repository.id.toString(),
        name: payload.repository.name,
        owner: payload.repository.owner.login,
        ownerType: payload.repository.owner.type,
      },
      action: payload.action,
      state: payload.review.state,
      prNumber: payload.pull_request.number,
      prTitle: payload.pull_request.title,
      reviewer: {
        id: payload.review.user.id.toString(),
        login: payload.review.user.login,
      },
      submittedAt: payload.review.submitted_at,
      sender: {
        id: payload.sender.id.toString(),
        login: payload.sender.login,
      },
    };
  }
}

export class PullRequestReviewThreadParser extends GitHubParser<
  PullRequestReviewThreadEvent,
  PullRequestReviewThreadEventData
> {
  parse(payload: PullRequestReviewThreadEvent): PullRequestReviewThreadEventData {
    return {
      repository: {
        id: payload.repository.id.toString(),
        name: payload.repository.name,
        owner: payload.repository.owner.login,
        ownerType: payload.repository.owner.type,
      },
      action: payload.action,
      prNumber: payload.pull_request.number,
      prTitle: payload.pull_request.title,
      threadId: payload.thread.id,
      resolved: payload.thread.resolved,
      ...(payload.thread.resolution && {
        resolver: {
          id: payload.thread.resolution.user.id.toString(),
          login: payload.thread.resolution.user.login,
        },
      }),
      lineDetails: {
        line: payload.thread.line,
        startLine: payload.thread.start_line,
        originalLine: payload.thread.original_line,
      },
      sender: {
        id: payload.sender.id.toString(),
        login: payload.sender.login,
      },
    };
  }
}

export class PullRequestReviewCommentParser extends GitHubParser<
  PullRequestReviewCommentEvent,
  PullRequestReviewCommentEventData
> {
  parse(payload: PullRequestReviewCommentEvent): PullRequestReviewCommentEventData {
    return {
      repository: {
        id: payload.repository.id.toString(),
        name: payload.repository.name,
        owner: payload.repository.owner.login,
        ownerType: payload.repository.owner.type,
      },
      action: payload.action,
      prNumber: payload.pull_request.number,
      prTitle: payload.pull_request.title,
      comment: {
        id: payload.comment.id,
        createdAt: payload.comment.created_at,
        updatedAt: payload.comment.updated_at,
        inReplyToId: payload.comment.in_reply_to_id,
      },
      author: {
        id: payload.comment.user.id.toString(),
        login: payload.comment.user.login,
      },
      sender: {
        id: payload.sender.id.toString(),
        login: payload.sender.login,
      },
    };
  }
}
