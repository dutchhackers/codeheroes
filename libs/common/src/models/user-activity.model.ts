import { BaseDocument, ConnectedAccountProvider } from './common.model';

// Activity Document
export interface UserActivity extends BaseDocument {
  action: string;
  type: string;
  userId: string;
  activityId: string;
  userFacingDescription: string;
  details: UserActivityDetails;
}

export interface UserActivityDetails {
  source: ConnectedAccountProvider;
  eventId: string;
  eventTimestamp: string; // ISO string
}

export type CreateActivityInput = Omit<
  UserActivity,
  'id' | 'createdAt' | 'updatedAt'
>;
