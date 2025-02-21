import { GameActionType } from '@codeheroes/shared/types';

export interface Activity {
  id: string;
  userId: string;
  type: GameActionType;
  metadata: Record<string, any>;
  xp: {
    earned: number;
    breakdown: Array<{
      type: string;
      amount: number;
      description: string;
    }>;
  };
  achievements?: string[];
  badges?: string[];
  timestamp: string;
}

export interface ActivityStats {
  total: number;
  byType: Record<GameActionType, number>;
  lastActivity?: {
    type: GameActionType;
    timestamp: string;
  };
}
