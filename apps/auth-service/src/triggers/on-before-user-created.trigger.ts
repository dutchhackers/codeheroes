import { beforeUserCreated } from 'firebase-functions/v2/identity';
import { HttpsError } from 'firebase-functions/v2/https';
import { DEFAULT_REGION, UserService, SettingsService } from '@codeheroes/common';
import { logger } from '@codeheroes/common';

export const onBeforeUserCreated = beforeUserCreated(
  {
    region: DEFAULT_REGION,
  },
  async (event) => {
    try {
      logger.info('Trigger received event:', event);
      const user = event.data;

      // Debug logging
      logger.info('Processing user creation:', {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
      });

      if (!user.email) {
        const message = 'Email is required for registration';
        logger.error(message);
        throw new HttpsError('failed-precondition', message);
      }

      // Check allowed domains from settings
      const settingsService = new SettingsService();
      const allowedDomains = await settingsService.getAllowedDomains();

      // If there are allowed domains configured, enforce the restriction
      if (allowedDomains.length > 0) {
        const isAllowedDomain = allowedDomains.some((domain) => user.email?.endsWith(domain));
        if (!isAllowedDomain) {
          const domainsText = allowedDomains.length === 1 ? 'domain is' : 'domains are';
          const message = `Email domain not allowed. Allowed ${domainsText}: ${allowedDomains.join(', ')}`;
          logger.error(message);
          throw new HttpsError('permission-denied', message);
        }
      }

      const userService = new UserService();

      // Check if user already exists with this email
      const existingUser = await userService.findUserByEmail(user.email);
      if (existingUser) {
        logger.info('Found existing user by email:', {
          email: user.email,
          existingUserId: existingUser.id,
          newUid: user.uid,
        });
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
    } catch (error) {
      const message = 'User creation failed';
      logger.error('User creation failed:', error);
      throw error instanceof HttpsError ? error : new HttpsError('internal', message);
    }
  },
);
