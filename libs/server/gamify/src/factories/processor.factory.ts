import { ActivityType } from '@codeheroes/activity';
import { BaseActivityProcessor } from '../activities/base/activity-processor.base';
import { IssueProcessor } from '../activities/issue/issue-processor';
import { PrReviewProcessor } from '../activities/pr-review/pr-review-processor';
import { PullRequestProcessor } from '../activities/pull-request/pr-processor';
import { PushActivityProcessor } from '../activities/push/push-processor';
import { BranchActivityProcessor } from '../activities/code/branch-processor';
import { TagActivityProcessor } from '../activities/code/tag-processor';

export class ProcessorFactory {
  // Map to store processor classes for each activity type
  private static processors = new Map<ActivityType, new () => BaseActivityProcessor>();

  static initialize() {
    // Register all processors
    this.processors.set(ActivityType.CODE_PUSH, PushActivityProcessor);
    this.processors.set(ActivityType.BRANCH_CREATED, BranchActivityProcessor);
    this.processors.set(ActivityType.BRANCH_DELETED, BranchActivityProcessor);
    this.processors.set(ActivityType.TAG_CREATED, TagActivityProcessor);
    this.processors.set(ActivityType.TAG_DELETED, TagActivityProcessor);
    this.processors.set(ActivityType.PR_CREATED, PullRequestProcessor);
    this.processors.set(ActivityType.PR_UPDATED, PullRequestProcessor);
    this.processors.set(ActivityType.PR_MERGED, PullRequestProcessor);
    this.processors.set(ActivityType.ISSUE_CREATED, IssueProcessor);
    this.processors.set(ActivityType.ISSUE_CLOSED, IssueProcessor);
    this.processors.set(ActivityType.ISSUE_UPDATED, IssueProcessor);
    this.processors.set(ActivityType.ISSUE_REOPENED, IssueProcessor);
    this.processors.set(ActivityType.PR_REVIEW_SUBMITTED, PrReviewProcessor);
    this.processors.set(ActivityType.PR_REVIEW_UPDATED, PrReviewProcessor);
    this.processors.set(ActivityType.PR_REVIEW_DISMISSED, PrReviewProcessor);
    this.processors.set(ActivityType.PR_REVIEW_THREAD_RESOLVED, PrReviewProcessor);
    this.processors.set(ActivityType.PR_REVIEW_THREAD_UNRESOLVED, PrReviewProcessor);
    this.processors.set(ActivityType.PR_REVIEW_COMMENT_CREATED, PrReviewProcessor);
    this.processors.set(ActivityType.PR_REVIEW_COMMENT_UPDATED, PrReviewProcessor);
  }

  static getProcessor(type: ActivityType): BaseActivityProcessor {
    const ProcessorClass = this.processors.get(type);
    if (!ProcessorClass) {
      throw new Error(`No processor registered for activity type: ${type}`);
    }
    return new ProcessorClass();
  }
}
