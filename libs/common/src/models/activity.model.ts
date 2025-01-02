import { BaseDocument, ConnectedAccountProvider } from './common.model';

// Activity Document
export interface Activity extends BaseDocument {
  activityId: string;
  type: string;
  source: ConnectedAccountProvider;
  eventId: string;
  eventTimestamp: string; // ISO string
  userFacingDescription: string;
}

export type CreateActivityInput = Omit<
  Activity,
  'id' | 'createdAt' | 'updatedAt'
>;
