import { logger, UserService } from '@codeheroes/common';
import { UserRole } from '@codeheroes/types';
import * as express from 'express';
import { getAuth } from 'firebase-admin/auth';
import { z } from 'zod';
import { adminMiddleware } from '../middleware/admin.middleware';
import { validate } from '../middleware/validate.middleware';

const router = express.Router();

// All admin routes require admin role
router.use(adminMiddleware);

const updateRoleSchema = z.object({
  role: z.enum(['admin', 'user']),
});

// PATCH /admin/users/:id/role — set user role in Firestore + Firebase Auth custom claims
router.patch('/users/:id/role', validate(updateRoleSchema), async (req, res) => {
  const { id } = req.params;
  const { role } = req.body as { role: UserRole };
  logger.debug('PATCH /admin/users/:id/role', { id, role });

  try {
    const userService = new UserService();
    const user = await userService.getUser(id);

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Update role in Firestore
    await userService.updateUser(id, { role });

    // Sync custom claims to Firebase Auth if user has a Firebase Auth UID
    if (user.uid) {
      await getAuth().setCustomUserClaims(user.uid, { role });
      logger.info('Updated Firebase Auth custom claims', { uid: user.uid, role });
    }

    res.json({ id, role });
  } catch (error) {
    logger.error('Error updating user role:', error);
    res.status(500).json({ error: 'Failed to update user role' });
  }
});

export { router as AdminController };
