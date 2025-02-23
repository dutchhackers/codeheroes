import { GameActionType } from '@codeheroes/shared/types';

export interface GameAction {
  userId: string;
  actionType: GameActionType;
  metadata: Record<string, any>;
}

export interface ActionResult {
  xpGained: number;
  badgesEarned?: string[];
  rewards?: Record<string, any>;
  level?: number;
  currentLevelProgress?: {
    level: number;
    currentLevelXp: number;
    xpToNextLevel: number;
  };
}
