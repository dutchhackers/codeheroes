import { Expose } from 'class-transformer';
import { UserType } from '@codeheroes/types';

export class UserDto {
  @Expose()
  id: string;

  @Expose()
  uid: string;

  @Expose()
  email: string;

  @Expose()
  displayName: string;

  @Expose()
  photoURL: string;

  @Expose()
  lastLogin: string;

  @Expose()
  userType: UserType;
}
