import { BaseDocument } from '../core/base.types';

// User-specific settings
export interface UserSettings extends BaseDocument {
  userId: string;
  notifications: {
    email: boolean;
    push: boolean;
    discord?: boolean;
    levelUp: boolean;
    achievements: boolean;
    dailyDigest: boolean;
  };
  privacy: {
    showProfile: boolean;
    showActivity: boolean;
    showAchievements: boolean;
  };
  theme: {
    mode: 'light' | 'dark' | 'system';
    accentColor?: string;
  };
  dashboard: {
    defaultView: 'activity' | 'achievements' | 'stats';
    widgetLayout?: string[];
  };
}

// System-wide settings (admin configurable)
export interface SystemSettings extends BaseDocument {
  allowedDomains: string[]; // For registration restrictions
  features: {
    enableDiscord: boolean;
    enableTeams: boolean;
    enableChallenges: boolean;
  };
  gamification: {
    xpMultiplier: number;
    maxDailyXP?: number;
    levelThresholds?: Record<number, number>;
  };
  integration: {
    githubWebhookSecret?: string;
    discordWebhookUrl?: string;
  };
}

// Update DTOs
export interface UpdateUserSettingsDto {
  notifications?: Partial<UserSettings['notifications']>;
  privacy?: Partial<UserSettings['privacy']>;
  theme?: Partial<UserSettings['theme']>;
  dashboard?: Partial<UserSettings['dashboard']>;
}

export interface UpdateSystemSettingsDto {
  allowedDomains?: string[];
  features?: Partial<SystemSettings['features']>;
  gamification?: Partial<SystemSettings['gamification']>;
  integration?: Partial<SystemSettings['integration']>;
}
