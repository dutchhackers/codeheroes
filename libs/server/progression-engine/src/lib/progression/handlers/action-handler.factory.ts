import { GameActionType } from '@codeheroes/types';
import { Firestore } from 'firebase-admin/firestore';
import { AbstractActionHandler } from './action-handler.base';
import { CodePushHandler } from './actions/code-push.handler';
import { PullRequestCreateHandler } from './actions/pull-request.handler';
import { CodeReviewSubmitHandler } from './actions/code-review.handler';
import { IssueHandler } from './actions/issue.handler';
import { ProgressionService } from '../services/progression.service';

/**
 * Factory for creating action handlers based on action type
 */
export class ActionHandlerFactory {
  private static db: Firestore;
  private static handlers: Map<GameActionType, AbstractActionHandler>;
  private static initialized = false;

  /**
   * Initialize the factory with Firestore instance and handlers
   * @param db Firestore instance
   */
  static initialize(db: Firestore, progressionService: ProgressionService): void {
    this.db = db;
    this.handlers = new Map();

    // Register all handlers, passing the progression service
    this.handlers.set('code_push', new CodePushHandler(db, progressionService));
    this.handlers.set('pull_request_create', new PullRequestCreateHandler(db, progressionService, 'create'));
    this.handlers.set('pull_request_merge', new PullRequestCreateHandler(db, progressionService, 'merge'));
    this.handlers.set('pull_request_close', new PullRequestCreateHandler(db, progressionService, 'close'));
    this.handlers.set('code_review_submit', new CodeReviewSubmitHandler(db, progressionService));

    // Register issue handlers
    this.handlers.set('issue_create', new IssueHandler(db, progressionService, 'create'));
    this.handlers.set('issue_close', new IssueHandler(db, progressionService, 'close'));
    this.handlers.set('issue_reopen', new IssueHandler(db, progressionService, 'reopen'));

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
