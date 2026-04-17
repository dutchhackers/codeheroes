import { BaseDocument } from '../core/base.types';

export type UserType = 'user' | 'bot' | 'system';
export type UserRole = 'admin' | 'user';

export interface UserDimensions {
  studio?: string | null;
  discipline?: string | null;
}

export interface UserDto extends BaseDocument {
  name: string;
  displayName: string;
  displayNameLower?: string | null;
  nameLower?: string;
  email: string;
  photoUrl: string | null;
  active: boolean;
  lastLogin: string; // ISO timestamp
  uid?: string; // Firebase Auth UID
  userType: UserType;
  role?: UserRole;
  dimensions?: UserDimensions;
}

export interface CreateUserDto {
  uid?: string;
  email: string;
  name: string;
  displayName: string;
  photoUrl?: string | null;
  userType?: UserType; // Default to 'user' if not specified
  role?: UserRole;
}

export interface UpdateUserDto {
  name?: string;
  displayName?: string;
  photoUrl?: string;
  active?: boolean;
  userType?: UserType;
  role?: UserRole;
  dimensions?: UserDimensions;
}

export interface UserProfileDto extends UserDto {
  level: number;
  xp: number;
}
