import { GameActionType } from '@codeheroes/shared/types';
import { Firestore } from 'firebase-admin/firestore';
import { BaseActionHandler } from '../actions/base/base-action.handler';
import { CodePushHandler } from '../actions/code-push/code-push.handler';
import { CodeReviewSubmitHandler } from '../actions/code-review/code-review-submit.handler';
import { PullRequestCloseHandler } from '../actions/pull-request/pr-close.handler';
import { PullRequestCreateHandler } from '../actions/pull-request/pr-create.handler';
import { PullRequestMergeHandler } from '../actions/pull-request/pr-merge.handler';
import { GameAction } from '../core/interfaces/action';

export class ActionHandlerFactory {
  private static db: Firestore;
  private static handlers: Map<GameActionType, BaseActionHandler>;

  static initialize(db: Firestore): void {
    this.db = db;
    this.handlers = new Map();

    // Initialize all handlers
    this.handlers.set('code_push', new CodePushHandler(db));
    this.handlers.set('pull_request_create', new PullRequestCreateHandler(db));
    this.handlers.set('pull_request_close', new PullRequestCloseHandler(db));
    this.handlers.set('pull_request_merge', new PullRequestMergeHandler(db));
    this.handlers.set('code_review_submit', new CodeReviewSubmitHandler(db));
  }

  static getHandler(action: GameAction): BaseActionHandler {
    if (!this.handlers) {
      throw new Error('ActionHandlerFactory not initialized. Call initialize() first.');
    }

    const handler = this.handlers.get(action.actionType);
    if (!handler) {
      throw new Error(`No handler found for action type: ${action.actionType}`);
    }

    return handler;
  }
}
