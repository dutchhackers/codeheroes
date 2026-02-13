// User-specific settings (stored at users/{userId}/settings/preferences)
export interface UserSettings {
  userId: string;
  dailyGoal: number;
  notificationsEnabled: boolean;
  updatedAt: string;
}

export interface UpdateUserSettingsDto {
  dailyGoal?: number;
  notificationsEnabled?: boolean;
}

export const DEFAULT_DAILY_GOAL = 8000;

// System-wide settings (admin configurable)
export interface SystemSettings {
  allowedDomains: string[];
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

export interface UpdateSystemSettingsDto {
  allowedDomains?: string[];
  features?: Partial<SystemSettings['features']>;
  gamification?: Partial<SystemSettings['gamification']>;
  integration?: Partial<SystemSettings['integration']>;
}
