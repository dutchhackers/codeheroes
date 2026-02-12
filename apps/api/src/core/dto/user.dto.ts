import { Expose } from 'class-transformer';
import { UserRole, UserType } from '@codeheroes/types';

export class UserDto {
  @Expose()
  id: string;

  @Expose()
  uid: string;

  @Expose()
  email: string;

  @Expose()
  name: string;

  @Expose()
  displayName: string;

  @Expose()
  nameLower?: string;

  @Expose({ name: 'photoUrl' })
  photoUrl: string;

  @Expose()
  active: boolean;

  @Expose()
  lastLogin?: string | null;

  @Expose()
  userType: UserType;

  @Expose()
  role?: UserRole;

  @Expose()
  createdAt?: string;

  @Expose()
  updatedAt?: string;
}
