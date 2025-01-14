import { Event } from './event.model';
import { UserActivity } from './user.model';

export type CreateEventInput = Omit<Event, 'id' | 'createdAt' | 'updatedAt'>;

export type CreateActivityInput = Omit<UserActivity, 'id' | 'createdAt' | 'updatedAt'>;
