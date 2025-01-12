import { BaseDocument, ConnectedAccountProvider } from './common.model';

// Activity Document
export interface UserActivity extends BaseDocument {
  action: string;
  userId: string;
  activityId: string;
  type: string;
  source: ConnectedAccountProvider;
  eventId: string;
  eventTimestamp: string; // ISO string
  userFacingDescription: string;
}

export type CreateActivityInput = Omit<
  UserActivity,
  'id' | 'createdAt' | 'updatedAt'
>;
