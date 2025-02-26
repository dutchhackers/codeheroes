import { GameAction as SharedGameAction, GameActionType } from '@codeheroes/shared/types';

// Legacy GameAction interface maintained for backward compatibility
export interface LegacyGameAction {
  userId: string;
  actionType: GameActionType;
  metadata: Record<string, any>;
}

// Re-export the GameAction from shared types
export type GameAction = LegacyGameAction;

// Type conversion utilities
export function convertSharedToLegacy(sharedAction: SharedGameAction): LegacyGameAction {
  return {
    userId: sharedAction.userId,
    actionType: sharedAction.type,
    metadata: {
      ...sharedAction.context,
      ...sharedAction.metrics,
      externalId: sharedAction.externalId,
      provider: sharedAction.provider,
      externalUser: sharedAction.externalUser,
      timestamp: sharedAction.timestamp,
    },
  };
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
