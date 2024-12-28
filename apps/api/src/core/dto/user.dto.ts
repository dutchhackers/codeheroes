import { Expose } from 'class-transformer';

export class UserDto {
  @Expose()
  uid: string;

  @Expose()
  email: string;

  @Expose()
  displayName: string;

  @Expose()
  photoURL: string;

  @Expose()
  createdAt: string;

  @Expose()
  lastLogin: string;
}
