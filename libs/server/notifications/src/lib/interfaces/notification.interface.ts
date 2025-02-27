export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  metadata?: Record<string, any>;
  read: boolean;
  createdAt: string;
  readAt?: string;
}
