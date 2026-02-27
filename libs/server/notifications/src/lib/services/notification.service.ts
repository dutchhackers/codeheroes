import { DatabaseInstance } from '@codeheroes/common';
import { Firestore, FieldValue } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';
import { Notification } from '../interfaces/notification.interface';
import { Collections, UserSettings } from '@codeheroes/types';

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
    const notificationRef = this.db
      .collection(Collections.Users)
      .doc(userId)
      .collection(Collections.Notifications)
      .doc();

    const newNotification: Notification = {
      id: notificationRef.id,
      userId,
      ...notification,
      read: false,
      createdAt: new Date().toISOString(),
    };

    await notificationRef.set(newNotification);

    // Send FCM push notification (fire-and-forget, don't block)
    this.sendPushNotification(userId, newNotification).catch((error) =>
      console.error('FCM push failed:', error),
    );

    return newNotification;
  }

  private async sendPushNotification(userId: string, notification: Notification): Promise<void> {
    const settingsRef = this.db
      .collection(Collections.Users)
      .doc(userId)
      .collection(Collections.Settings)
      .doc('preferences');

    const settingsSnap = await settingsRef.get();
    if (!settingsSnap.exists) return;

    const settings = settingsSnap.data() as UserSettings;
    if (!settings.notificationsEnabled || !settings.fcmTokens?.length) return;

    const message = {
      tokens: settings.fcmTokens,
      data: {
        title: notification.title,
        message: notification.message,
        type: notification.type,
        notificationId: notification.id,
        ...(notification.metadata?.['url'] ? { url: String(notification.metadata['url']) } : {}),
      },
    };

    const response = await getMessaging().sendEachForMulticast(message);

    // Clean up stale tokens
    if (response.failureCount > 0) {
      const staleTokens: string[] = [];
      response.responses.forEach((resp, idx) => {
        const invalidTokenCodes = [
          'messaging/registration-token-not-registered',
          'messaging/invalid-registration-token',
          'messaging/mismatched-credential',
        ];
        if (!resp.success && invalidTokenCodes.includes(resp.error?.code ?? '')) {
          staleTokens.push(settings.fcmTokens![idx]);
        }
      });

      if (staleTokens.length > 0) {
        await settingsRef.update({
          fcmTokens: FieldValue.arrayRemove(...staleTokens),
        });
      }
    }
  }

  async getUnreadNotifications(userId: string): Promise<Notification[]> {
    const snapshot = await this.db
      .collection(Collections.Users)
      .doc(userId)
      .collection(Collections.Notifications)
      .where('read', '==', false)
      .orderBy('createdAt', 'desc')
      .get();

    return snapshot.docs.map((doc) => doc.data() as Notification);
  }

  async markAsRead(userId: string, notificationIds: string[]): Promise<void> {
    const batch = this.db.batch();
    const userRef = this.db.collection(Collections.Users).doc(userId);

    for (const notificationId of notificationIds) {
      const notificationRef = userRef.collection(Collections.Notifications).doc(notificationId);
      batch.update(notificationRef, {
        read: true,
        readAt: new Date().toISOString(),
      });
    }

    await batch.commit();
  }

  async getNotificationHistory(userId: string, limit = 50): Promise<Notification[]> {
    const snapshot = await this.db
      .collection(Collections.Users)
      .doc(userId)
      .collection(Collections.Notifications)
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();

    return snapshot.docs.map((doc) => doc.data() as Notification);
  }
}
