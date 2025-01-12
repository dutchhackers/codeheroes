import { BaseDocument, ConnectedAccountProvider } from './common.model';

// Activity Document
export interface UserActivity extends BaseDocument {
  action: string;
  eventId: string;
  userId: string;
  userFacingDescription: string;
  details: UserActivityDetails;
}

export interface UserActivityDetails {
  source: ConnectedAccountProvider;
  externalEventId: string;
  externalEventTimestamp: string; // ISO string
}

export type CreateActivityInput = Omit<
  UserActivity,
  'id' | 'createdAt' | 'updatedAt'
>;
