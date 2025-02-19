import { BaseDocument } from './common.types';

export interface UserDto extends BaseDocument {
  displayName: string;
  email: string;
  photoUrl: string | null;
  active: boolean;
  lastLogin: string; // ISO timestamp
  uid?: string; // Firebase Auth UID
}

export interface CreateUserDto {
  uid?: string;
  email: string;
  displayName: string;
  photoUrl?: string | null;
}

export interface UpdateUserDto {
  displayName?: string;
  photoUrl?: string;
  active?: boolean;
}

export interface UserProfileDto extends UserDto {
  level: number;
  xp: number;
}
