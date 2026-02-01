import { beforeUserSignedIn } from 'firebase-functions/v2/identity';
import { DEFAULT_REGION, logger, UserService } from '@codeheroes/common';

export const onBeforeUserSignIn = beforeUserSignedIn(
  {
    region: DEFAULT_REGION,
  },
  async (event) => {
    try {
      const user = event.data;
      logger.info('User attempting to sign in:', {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        provider: user.providerData,
        timestamp: new Date().toISOString(),
      });

      // Sync uid to user document if it exists but uid is missing/different
      // This handles cases where seed data overwrote the uid field
      // Note: We only sync uid, not displayName/photoUrl - users can customize those in-app
      if (user.email) {
        const userService = new UserService();
        const existingUser = await userService.findUserByEmail(user.email);

        if (existingUser && existingUser.uid !== user.uid) {
          logger.info('Syncing uid for existing user:', {
            email: user.email,
            userId: existingUser.id,
            oldUid: existingUser.uid,
            newUid: user.uid,
          });
          await userService.updateUser(existingUser.id, {
            uid: user.uid,
          });
        }
      }

      // Allow the sign-in to proceed
      return;
    } catch (error) {
      logger.error('Error in beforeSignIn trigger:', error);
      // Still allow the sign-in to proceed even if sync fails
      return;
    }
  },
);
