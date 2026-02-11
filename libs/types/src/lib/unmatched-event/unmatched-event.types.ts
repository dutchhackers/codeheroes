import { BaseDocument } from '../core/base.types';
import { ConnectedAccountProvider } from '../core/providers';

export type UnmatchedEventCategory = 'unknown_user' | 'unlinked_repo';
export type UnmatchedEventStatus = 'pending' | 'resolved' | 'dismissed';
export type UnmatchedEventResolutionAction =
  | 'created_user'
  | 'linked_to_user'
  | 'linked_to_project'
  | 'created_project';

export interface UnmatchedEvent extends BaseDocument {
  category: UnmatchedEventCategory;
  status: UnmatchedEventStatus;
  provider: ConnectedAccountProvider;
  // unknown_user fields
  externalUserId?: string;
  externalUserName?: string | null;
  // unlinked_repo fields
  repoOwner?: string;
  repoName?: string;
  repoFullName?: string;
  // tracking
  eventCount: number;
  lastSeenAt: string;
  lastEventType?: string | null;
  sampleEventTypes: string[];
  // resolution
  resolvedAt?: string;
  resolvedBy?: string;
  resolutionAction?: UnmatchedEventResolutionAction;
  resolutionTargetId?: string;
}
