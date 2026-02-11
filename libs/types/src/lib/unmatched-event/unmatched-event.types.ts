import { BaseDocument } from '../core/base.types';
import { ConnectedAccountProvider } from '../core/providers';

export type UnmatchedEventCategory = 'unknown_user' | 'unlinked_repo';
export type UnmatchedEventStatus = 'pending' | 'resolved' | 'dismissed';

export interface UnmatchedEvent extends BaseDocument {
  category: UnmatchedEventCategory;
  status: UnmatchedEventStatus;
  provider: ConnectedAccountProvider;
  // unknown_user fields
  externalUserId?: string;
  externalUserName?: string;
  // unlinked_repo fields
  repoOwner?: string;
  repoName?: string;
  repoFullName?: string;
  // tracking
  eventCount: number;
  lastSeenAt: string;
  lastEventType?: string;
  sampleEventTypes: string[]; // deduplicated, up to ~10
  // resolution
  resolvedAt?: string;
  resolvedBy?: string;
  resolutionAction?: string; // 'created_user' | 'linked_to_user' | 'linked_to_project' | 'created_project'
  resolutionTargetId?: string;
}
