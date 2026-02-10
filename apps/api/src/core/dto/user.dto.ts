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
  name?: string | null;

  @Expose()
  displayName: string;

  @Expose({ name: 'photoUrl' })
  photoUrl: string;

  @Expose()
  active: boolean;

  @Expose()
  lastLogin?: string | null;

  @Expose()
  userType: UserType;
}
