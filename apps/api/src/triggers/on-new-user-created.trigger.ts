import { beforeUserCreated } from 'firebase-functions/v2/identity';
import { DEFAULT_REGION, UserService } from '@codeheroes/common';

export const onNewUserCreation = beforeUserCreated(
  {
    region: DEFAULT_REGION,
  },
  async (event) => {
    const user = event.data;

    const userService = new UserService();
    await userService.createUser({
      uid: user.uid,
      email: user.email,
      displayName: user.displayName ?? user.email,
      photoUrl: user.photoURL,
    });
  }
);
