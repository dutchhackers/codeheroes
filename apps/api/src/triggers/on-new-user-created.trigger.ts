import { beforeUserCreated } from 'firebase-functions/v2/identity';
import { UserService } from '@codeheroes/common';

export const onNewUserCreation = beforeUserCreated(async (event) => {
  const user = event.data;

  const userService = new UserService();
  await userService.createUser({
    uid: user.uid,
    email: user.email,
    displayName: user.displayName ?? user.email,
    photoURL: user.photoURL,
  });
});
