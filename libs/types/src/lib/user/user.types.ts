import { BaseDocument } from '../core/base.types';

export type UserType = 'user' | 'bot' | 'system';

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
  preferences?: UserPreferences;
}

export interface UserPreferences {
  notificationsEnabled?: boolean;
}

export interface CreateUserDto {
  uid?: string;
  email: string;
  name?: string | null;
  displayName: string;
  photoUrl?: string | null;
  userType?: UserType; // Default to 'user' if not specified
}

export interface UpdateUserDto {
  name?: string;
  displayName?: string;
  photoUrl?: string;
  active?: boolean;
  userType?: UserType;
  preferences?: UserPreferences;
}

export interface UserProfileDto extends UserDto {
  level: number;
  xp: number;
}
