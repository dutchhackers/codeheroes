import { BaseDocument } from '../core/base.types';

export enum NotificationType {
  LEVEL_UP = 'LEVEL_UP',
  BADGE_EARNED = 'BADGE_EARNED',
  ACHIEVEMENT_UNLOCKED = 'ACHIEVEMENT_UNLOCKED',
  STREAK_MILESTONE = 'STREAK_MILESTONE',
  SYSTEM = 'SYSTEM',
}

export interface Notification extends BaseDocument {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  readAt?: string;
  metadata?: Record<string, unknown>;
  action?: {
    type: string;
    label: string;
    url?: string;
  };
}
