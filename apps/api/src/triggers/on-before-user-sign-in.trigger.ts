import { beforeUserSignedIn } from 'firebase-functions/v2/identity';
import { DEFAULT_REGION } from '@codeheroes/common';
import { logger } from '@codeheroes/common';

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

      // Allow the sign-in to proceed
      return;
    } catch (error) {
      logger.error('Error in beforeSignIn trigger:', error);
      // Still allow the sign-in to proceed even if logging fails
      return;
    }
  },
);
