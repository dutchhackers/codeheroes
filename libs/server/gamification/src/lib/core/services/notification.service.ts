import { DatabaseInstance } from '@codeheroes/common';
import { Firestore } from 'firebase-admin/firestore';

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

export class NotificationService {
  private db: Firestore;

  constructor() {
    this.db = DatabaseInstance.getInstance();
  }

  async createNotification(
    userId: string,
    notification: {
      type: string;
      title: string;
      message: string;
      metadata?: Record<string, any>;
    },
  ): Promise<Notification> {
    const notificationRef = this.db.collection('users').doc(userId).collection('notifications').doc();

    const newNotification: Notification = {
      id: notificationRef.id,
      userId,
      ...notification,
      read: false,
      createdAt: new Date().toISOString(),
    };

    await notificationRef.set(newNotification);
    return newNotification;
  }

  async getUnreadNotifications(userId: string): Promise<Notification[]> {
    const snapshot = await this.db
      .collection('users')
      .doc(userId)
      .collection('notifications')
      .where('read', '==', false)
      .orderBy('createdAt', 'desc')
      .get();

    return snapshot.docs.map((doc) => doc.data() as Notification);
  }

  async markAsRead(userId: string, notificationIds: string[]): Promise<void> {
    const batch = this.db.batch();
    const userRef = this.db.collection('users').doc(userId);

    for (const notificationId of notificationIds) {
      const notificationRef = userRef.collection('notifications').doc(notificationId);
      batch.update(notificationRef, {
        read: true,
        readAt: new Date().toISOString(),
      });
    }

    await batch.commit();
  }

  async getNotificationHistory(userId: string, limit = 50): Promise<Notification[]> {
    const snapshot = await this.db
      .collection('users')
      .doc(userId)
      .collection('notifications')
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();

    return snapshot.docs.map((doc) => doc.data() as Notification);
  }
}
