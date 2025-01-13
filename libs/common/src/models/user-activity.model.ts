import { BaseDocument } from './common.model';
import { EventSource } from './event.model';

// Activity Document
export interface UserActivity extends BaseDocument {
  action: string;
  eventId: string; // In the future this might become an optional field
  userId: string;
  eventSource: EventSource;
}

export type CreateActivityInput = Omit<
  UserActivity,
  'id' | 'createdAt' | 'updatedAt'
>;
