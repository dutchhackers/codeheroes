import { GameActionType } from '@codeheroes/shared/types';

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
