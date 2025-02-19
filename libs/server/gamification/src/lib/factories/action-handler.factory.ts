import { GameActionType } from '@codeheroes/shared/types';
import { Firestore } from 'firebase-admin/firestore';
import { CodePushHandler } from '../actions/code-push/code-push.handler';
import { PullRequestCreateHandler } from '../actions/pull-request/pr-create.handler';
import { PullRequestMergeHandler } from '../actions/pull-request/pr-merge.handler';
import { PullRequestCloseHandler } from '../actions/pull-request/pr-close.handler';
import { BaseActionHandler } from '../actions/base/base-action.handler';

export class ActionHandlerFactory {
  private static handlers = new Map<GameActionType, BaseActionHandler>();

  static initialize(db: Firestore) {
    this.handlers
      .set('code_push', new CodePushHandler(db))
      .set('pull_request_create', new PullRequestCreateHandler(db))
      .set('pull_request_merge', new PullRequestMergeHandler(db))
      .set('pull_request_close', new PullRequestCloseHandler(db));
  }

  static getHandler(actionType: GameActionType): BaseActionHandler {
    const handler = this.handlers.get(actionType);
    if (!handler) {
      throw new Error(`No handler found for action type: ${actionType}`);
    }
    return handler;
  }
}
