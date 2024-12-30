import { Expose } from 'class-transformer';

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
}
