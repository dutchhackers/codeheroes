import { BaseDocument } from '../core/base.types';

export type UserType = 'user' | 'bot' | 'system';

export interface UserDto extends BaseDocument {
  displayName: string;
  email: string;
  photoUrl: string | null;
  active: boolean;
  lastLogin: string; // ISO timestamp
  uid?: string; // Firebase Auth UID
  userType: UserType;
}

export interface CreateUserDto {
  uid?: string;
  email: string;
  displayName: string;
  photoUrl?: string | null;
  userType?: UserType; // Default to 'user' if not specified
}

export interface UpdateUserDto {
  displayName?: string;
  photoUrl?: string;
  active?: boolean;
  userType?: UserType;
}

export interface UserProfileDto extends UserDto {
  level: number;
  xp: number;
}
