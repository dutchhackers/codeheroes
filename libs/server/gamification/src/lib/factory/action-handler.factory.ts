import { GameActionType } from '@codeheroes/shared/types';
import { Firestore } from 'firebase-admin/firestore';
import { BaseActionHandler } from '../handlers/base-action.handler';
import { CodePushHandler } from '../handlers/code-push.handler';
import { PullRequestCloseHandler } from '../handlers/pull-request-close.handler';
import { PullRequestCreateHandler } from '../handlers/pull-request-create.handler';
import { PullRequestMergeHandler } from '../handlers/pull-request-merge.handler';

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
