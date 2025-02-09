import { Event } from '@codeheroes/event';
import {
  BranchDeleteHandler,
  IssueCloseHandler,
  IssueCreateHandler,
  IssueUpdateHandler,
  PrCreateHandler,
  PrMergeHandler,
  PrUpdateHandler,
  PushHandler,
  ReviewSubmitHandler,
  ReviewThreadHandler,
  TagDeleteHandler,
} from '../handlers';
import { ActivityCategory, ActivityHandler, ActivityType } from '../types';

export class ActivityHandlerFactory {
  private static handlers: ActivityHandler[] = [
    // Code handlers
    new PushHandler(),
    new BranchDeleteHandler(),
    new TagDeleteHandler(),

    // Pull request handlers
    new PrCreateHandler(),
    new PrUpdateHandler(),
    new PrMergeHandler(),

    // Issue handlers
    new IssueCreateHandler(),
    new IssueUpdateHandler(),
    new IssueCloseHandler(),

    // Review handlers
    new ReviewSubmitHandler(),
    new ReviewThreadHandler(),
  ];

  private static typeToCategory = new Map<ActivityType, ActivityCategory>([
    [ActivityType.CODE_PUSH, ActivityCategory.CODE],
    [ActivityType.CODE_COVERAGE, ActivityCategory.CODE],
    [ActivityType.BRANCH_DELETED, ActivityCategory.CODE],
    [ActivityType.TAG_DELETED, ActivityCategory.CODE],

    [ActivityType.PR_CREATED, ActivityCategory.PULL_REQUEST],
    [ActivityType.PR_UPDATED, ActivityCategory.PULL_REQUEST],
    [ActivityType.PR_MERGED, ActivityCategory.PULL_REQUEST],

    [ActivityType.ISSUE_CREATED, ActivityCategory.ISSUE],
    [ActivityType.ISSUE_CLOSED, ActivityCategory.ISSUE],
    [ActivityType.ISSUE_UPDATED, ActivityCategory.ISSUE],
    [ActivityType.ISSUE_REOPENED, ActivityCategory.ISSUE],

    [ActivityType.PR_REVIEW, ActivityCategory.REVIEW],
    [ActivityType.PR_REVIEW_SUBMITTED, ActivityCategory.REVIEW],
    [ActivityType.PR_REVIEW_UPDATED, ActivityCategory.REVIEW],
    [ActivityType.PR_REVIEW_DISMISSED, ActivityCategory.REVIEW],

    [ActivityType.DEPLOYMENT, ActivityCategory.DEPLOYMENT],
  ]);

  static getHandler(event: Event): ActivityHandler | undefined {
    return this.handlers.find((handler) => handler.canHandle(event));
  }

  static registerHandler(handler: ActivityHandler): void {
    this.handlers.push(handler);
  }

  static getActivityCategory(type: ActivityType): ActivityCategory {
    const category = this.typeToCategory.get(type);
    if (!category) {
      throw new Error(`No category mapping found for activity type: ${type}`);
    }
    return category;
  }
}
