import { DatabaseInstance, logger } from '@codeheroes/common';
import { Event } from '@codeheroes/event';
import { Firestore } from 'firebase-admin/firestore';
import * as functions from 'firebase-functions';
import { ActionHandlerFactory } from './factories/action-handler.factory';
import { EventService } from './events/event.service';
import { ActionResult, GameAction } from './core/interfaces/action';
import { ProgressionService } from './core/services/progression.service';
import { LeaderboardService } from './leaderboard/leaderboard.service';

export class GameProgressionService {
  private db: Firestore;
  private eventService: EventService;
  private progressionService: ProgressionService;
  private leaderboardService: LeaderboardService;

  constructor() {
    this.db = DatabaseInstance.getInstance();
    this.progressionService = new ProgressionService();
    this.eventService = new EventService();
    this.leaderboardService = new LeaderboardService();
    ActionHandlerFactory.initialize(this.db);
  }

  async processGameAction(action: GameAction): Promise<ActionResult> {
    try {
      const handler = ActionHandlerFactory.getHandler(action.actionType);
      const result = await handler.handle(action);

      // Get updated progression state
      const progressionState = await this.progressionService.getProgressionState(action.userId);
      if (progressionState) {
        return {
          ...result,
          currentLevelProgress: {
            level: progressionState.level,
            currentLevelXp: progressionState.currentLevelXp,
            xpToNextLevel: progressionState.xpToNextLevel,
          },
        };
      }

      return result;
    } catch (error) {
      logger.error(`Error processing game action: ${action.actionType}`, error);
      throw new functions.https.HttpsError('internal', 'Failed to process game action');
    }
  }

  async handleNewEvent(event: Event): Promise<GameAction | null> {
    try {
      return await this.eventService.handleNewEvent(event);
    } catch (error) {
      logger.error('Error handling event:', error);
      return null;
    }
  }

  async getDailyLeaderboard(date?: string): Promise<Array<{ userId: string; xp: number; level: number }>> {
    const today = date || new Date().toISOString().split('T')[0];
    return this.leaderboardService.getDailyLeaderboard(today);
  }

  async getWeeklyLeaderboard(weekId?: string): Promise<Array<{ userId: string; xp: number; level: number }>> {
    const currentWeekId = weekId || this.getCurrentWeekId();
    return this.leaderboardService.getWeeklyLeaderboard(currentWeekId);
  }

  private getCurrentWeekId(): string {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const week = Math.floor(((now.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7);
    return `${now.getFullYear()}-W${week.toString().padStart(2, '0')}`;
  }
}
