import { ConnectedAccountProvider } from '@codeheroes/common';

export type GameActionType =
  | 'code_push'
  | 'pull_request_create'
  | 'pull_request_merge'
  | 'pull_request_close'
  | 'code_review_submit'
  | 'branch_create'
  | 'branch_delete';

export interface GameActionContext {
  repository: {
    id: string;
    name: string;
    owner: string;
  };
  ref?: string; // branch/tag name if applicable
}

export interface GameActionMetrics {
  commits?: number;
  additions?: number;
  deletions?: number;
  changedFiles?: number;
  comments?: number;
}

export interface GameAction {
  id: string;
  userId: string; // Internal user ID
  externalId: string; // ID from external system (e.g., GitHub event ID)
  provider: ConnectedAccountProvider;
  type: GameActionType;
  timestamp: string;

  // External identity info for debugging/auditing
  externalUser: {
    id: string; // e.g., GitHub user ID
    username: string; // e.g., GitHub username
  };

  context: GameActionContext;
  metrics?: GameActionMetrics;

  // Processing status
  status: 'pending' | 'processed' | 'failed';
  processedAt?: string;
  error?: string;

  createdAt: string;
  updatedAt: string;
}
