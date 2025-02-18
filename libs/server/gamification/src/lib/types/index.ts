import { GameActionType } from '@codeheroes/shared/types';

export enum Collections {
  Users = 'users',
  User_UserBadges = 'badges',
  User_UserDailyStats = 'dailyStats',
  UserStats = 'userStats',
  User_UserActivities = 'userActivities',
}

export interface GameAction {
  userId: string;
  actionType: GameActionType;
  metadata: Record<string, any>;
}

export interface ActionResult {
  xpGained: number;
  newStreak?: number;
  streakBonus?: number;
  badgesEarned?: string[];
  rewards?: Record<string, any>;
}

export enum StreakType {
  CodePush = 'code_pushes',
  PullRequestCreate = 'pr_creations',
  PullRequestClose = 'pr_closes',
  PullRequestMerge = 'pr_merges',
}
