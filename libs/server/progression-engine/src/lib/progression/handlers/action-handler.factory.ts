import { GameActionType } from '@codeheroes/types';
import { Firestore } from 'firebase-admin/firestore';
import { AbstractActionHandler } from './action-handler.base';
import { CodePushHandler } from './actions/code-push.handler';
import { PullRequestCreateHandler } from './actions/pull-request.handler';
import { CodeReviewSubmitHandler } from './actions/code-review.handler';
import { IssueHandler } from './actions/issue.handler';
import { CommentHandler } from './actions/comment.handler';
import { ReviewCommentHandler } from './actions/review-comment.handler';
import { ReleaseHandler } from './actions/release.handler';
import { WorkflowRunHandler } from './actions/workflow-run.handler';
import { DiscussionHandler } from './actions/discussion.handler';

/**
 * Factory for creating action handlers based on action type
 */
export class ActionHandlerFactory {
  private static handlers: Map<GameActionType, AbstractActionHandler>;
  private static initialized = false;

  /**
   * Initialize the factory with Firestore instance and handlers
   * @param db Firestore instance
   */
  static initialize(db: Firestore): void {
    this.handlers = new Map();

    // Register all handlers
    this.handlers.set('code_push', new CodePushHandler(db));
    this.handlers.set('pull_request_create', new PullRequestCreateHandler(db, 'create'));
    this.handlers.set('pull_request_merge', new PullRequestCreateHandler(db, 'merge'));
    this.handlers.set('pull_request_close', new PullRequestCreateHandler(db, 'close'));
    this.handlers.set('code_review_submit', new CodeReviewSubmitHandler(db));

    // Register issue handlers
    this.handlers.set('issue_create', new IssueHandler(db, 'create'));
    this.handlers.set('issue_close', new IssueHandler(db, 'close'));
    this.handlers.set('issue_reopen', new IssueHandler(db, 'reopen'));

    // Register comment handlers
    this.handlers.set('comment_create', new CommentHandler(db));
    this.handlers.set('review_comment_create', new ReviewCommentHandler(db));

    // Register release handler
    this.handlers.set('release_publish', new ReleaseHandler(db));

    // Register workflow run handler
    this.handlers.set('ci_success', new WorkflowRunHandler(db));

    // Register discussion handlers
    this.handlers.set('discussion_create', new DiscussionHandler(db, 'create'));
    this.handlers.set('discussion_comment', new DiscussionHandler(db, 'comment'));

    this.initialized = true;
  }

  /**
   * Get appropriate handler for an action type
   * @param actionType Game action type
   * @returns Action handler for the specified type
   * @throws Error if factory not initialized or handler not found
   */
  static getHandler(actionType: GameActionType): AbstractActionHandler {
    if (!this.initialized) {
      throw new Error('ActionHandlerFactory not initialized. Call initialize() first.');
    }

    const handler = this.handlers.get(actionType);
    if (!handler) {
      throw new Error(`No handler found for action type: ${actionType}`);
    }

    return handler;
  }

  /**
   * Check if a handler exists for the given action type
   * @param actionType Game action type to check
   * @returns True if a handler exists
   */
  static hasHandlerFor(actionType: GameActionType): boolean {
    return this.initialized && this.handlers.has(actionType);
  }

  /**
   * Get all supported action types
   * @returns Array of supported action types
   */
  static getSupportedActionTypes(): GameActionType[] {
    return this.initialized ? Array.from(this.handlers.keys()) : [];
  }
}
