// User-specific settings (stored at users/{userId}/settings/preferences)
export interface UserSettings {
  userId: string;
  dailyGoal: number;
  notificationsEnabled: boolean;
  fcmTokens?: string[];
  onboardingDismissed?: boolean;
  updatedAt: string;
}

export interface UpdateUserSettingsDto {
  dailyGoal?: number;
  notificationsEnabled?: boolean;
  fcmTokens?: string[];
  onboardingDismissed?: boolean;
}

export const DEFAULT_DAILY_GOAL = 8000;

// Dimension option entries (admin configurable via system/settings)
export interface StudioOption {
  id: string; // e.g. 'zwolle', 'copenhagen'
  label: string; // e.g. 'Zwolle', 'Copenhagen'
  country?: string; // ISO-3166 alpha-2, e.g. 'NL', 'DK' (reserved for future use)
  active: boolean;
}

export interface DisciplineOption {
  id: string; // e.g. 'frontend', 'backend', 'design', 'other'
  label: string;
  active: boolean;
}

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
  studios?: StudioOption[];
  disciplines?: DisciplineOption[];
}

export interface UpdateSystemSettingsDto {
  allowedDomains?: string[];
  features?: Partial<SystemSettings['features']>;
  gamification?: Partial<SystemSettings['gamification']>;
  integration?: Partial<SystemSettings['integration']>;
  studios?: StudioOption[];
  disciplines?: DisciplineOption[];
}

// Public read-only options payload (returned by GET /system/options)
export interface SystemOptionsDto {
  studios: StudioOption[];
  disciplines: DisciplineOption[];
}
