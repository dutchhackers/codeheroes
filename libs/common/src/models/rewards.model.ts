import { XpBreakdownItem } from './xp-domain.model';

export interface BadgeReward {
  id: string;
  name: string;
  description: string;
  achievedAt: string;
}

export interface AchievementReward {
  id: string;
  name: string;
  description: string;
  progress: number;
  completed: boolean;
  completedAt?: string;
}

export interface XpReward {
  processed: boolean;
  awarded: number;
  breakdown: XpBreakdownItem[];
}

export interface ActivityProcessingResult {
  processed: boolean;
  processedAt: string;
  xp?: XpReward;
  badges?: BadgeReward[];
  achievements?: AchievementReward[];
}
