import { logger } from '@codeheroes/common';
import { Collections } from '@codeheroes/types';
import * as express from 'express';
import { getFirestore } from 'firebase-admin/firestore';
import { z } from 'zod';
import { validate } from '../middleware/validate.middleware';

const router = express.Router();

const markAsReadSchema = z.object({
  notificationIds: z.array(z.string()).min(1),
});

// GET /notifications - Get notifications for the authenticated user
router.get('/', async (req, res) => {
  const userId = (req as any).userId;
  logger.debug('GET /notifications', { userId });

  if (!userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  try {
    const db = getFirestore();
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
    const unreadOnly = req.query.unreadOnly === 'true';

    let query = db
      .collection(Collections.Users)
      .doc(userId)
      .collection(Collections.Notifications)
      .orderBy('createdAt', 'desc')
      .limit(limit);

    if (unreadOnly) {
      query = query.where('read', '==', false) as any;
    }

    const snapshot = await query.get();
    const notifications = snapshot.docs.map((doc) => doc.data());

    res.json(notifications);
  } catch (error) {
    logger.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// PUT /notifications/read - Mark notifications as read
router.put('/read', validate(markAsReadSchema), async (req, res) => {
  const userId = (req as any).userId;
  const { notificationIds } = req.body;
  logger.debug('PUT /notifications/read', { userId, notificationIds });

  if (!userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  try {
    const db = getFirestore();
    const batch = db.batch();
    const now = new Date().toISOString();

    for (const notificationId of notificationIds) {
      const notificationRef = db
        .collection(Collections.Users)
        .doc(userId)
        .collection(Collections.Notifications)
        .doc(notificationId);

      batch.update(notificationRef, {
        read: true,
        readAt: now,
      });
    }

    await batch.commit();
    res.json({ success: true, markedCount: notificationIds.length });
  } catch (error) {
    logger.error('Error marking notifications as read:', error);
    res.status(500).json({ error: 'Failed to mark notifications as read' });
  }
});

export { router as NotificationsController };
