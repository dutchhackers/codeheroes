import { UserActivity } from './activity.model';

export type CreateActivityInput = Omit<UserActivity, 'id' | 'createdAt' | 'updatedAt'>;
