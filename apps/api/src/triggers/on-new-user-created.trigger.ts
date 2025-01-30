import { beforeUserCreated } from 'firebase-functions/v2/identity';
import { DEFAULT_REGION, UserService } from '@codeheroes/common';
import { logger } from '@codeheroes/common';

const ALLOWED_DOMAIN = '@domain.com';

export const onNewUserCreation = beforeUserCreated(
  {
    region: DEFAULT_REGION,
  },
  async (event) => {
    logger.info('Trigger received event:', event);
    const user = event.data;

    // Debug logging
    logger.info('Processing user creation:', {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
    });

    if (!user.email) {
      throw new Error('Email is required for registration');
    }

    if (!user.email.endsWith(ALLOWED_DOMAIN)) {
      throw new Error(`Only ${ALLOWED_DOMAIN} email addresses are allowed`);
    }

    const userService = new UserService();

    // Check if user already exists with this email
    const existingUser = await userService.findUserByEmail(user.email);
    if (existingUser) {
      // If user exists, just update the UID
      await userService.updateUser(existingUser.id, {
        uid: user.uid,
        photoUrl: user.photoURL || existingUser.photoUrl,
        displayName: user.displayName || existingUser.displayName,
      });
      return;
    }

    // Create new user if none exists
    await userService.createUser({
      uid: user.uid,
      email: user.email,
      displayName: user.displayName ?? user.email,
      photoUrl: user.photoURL,
    });
  },
);
