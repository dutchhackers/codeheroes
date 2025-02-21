import { DatabaseInstance } from '@codeheroes/common';
import { NotificationService } from '@codeheroes/notifications';
import { Firestore } from 'firebase-admin/firestore';
import { Activity } from '../interfaces/activity';
import { RewardType } from '../interfaces/level';
import { ProgressionState } from '../interfaces/progression';
import { StreakType } from '../interfaces/streak';
import { BadgeService } from '../services/badge.service';
import { LevelService } from '../services/level.service';
import { ProgressionEventService } from '../services/progression-event.service';

interface ProgressionStateMachine {
  handleXpGain(xp: number, activity?: Activity): Promise<void>;
  handleLevelUp(): Promise<void>;
  handleStreakUpdate(streakType: StreakType, days: number): Promise<void>;
  getState(): ProgressionState;
}

export class GameProgressionStateMachine implements ProgressionStateMachine {
  private db: Firestore;
  private state: ProgressionState;
  private readonly levelService: LevelService;
  private readonly badgeService: BadgeService;
  private readonly eventService: ProgressionEventService;
  private readonly notificationService: NotificationService;

  constructor(
    initialState: ProgressionState,
    levelService: LevelService,
    badgeService: BadgeService,
    eventService: ProgressionEventService,
    notificationService: NotificationService,
  ) {
    this.db = DatabaseInstance.getInstance();
    this.state = initialState;
    this.levelService = levelService;
    this.badgeService = badgeService;
    this.eventService = eventService;
    this.notificationService = notificationService;
  }

  async handleXpGain(xp: number, activity?: Activity): Promise<void> {
    const previousState = { ...this.state };
    const oldLevel = this.state.level;

    // Apply XP gain
    this.state.xp += xp;

    // Calculate new level progress
    const progress = this.levelService.calculateLevelProgress(this.state.xp);
    this.state.level = progress.level;
    this.state.currentLevelXp = progress.currentLevelXp;
    this.state.xpToNextLevel = progress.xpToNextLevel;

    // Emit XP gain event
    if (activity) {
      await this.eventService.emitXpGained(this.state.userId, activity, this.state, previousState);
    }

    // Check for level up
    if (this.state.level > oldLevel) {
      await this.handleLevelUp();
    }

    // Save state
    await this.saveState();
  }

  async handleLevelUp(): Promise<void> {
    const previousLevel = this.state.level - 1;
    const nextLevelData = this.levelService.getNextLevelRequirements(previousLevel);

    // Process rewards
    if (nextLevelData.rewards && nextLevelData.rewards.length > 0) {
      await this.processRewards(nextLevelData.rewards);
    }

    // Create notification
    await this.notificationService.createNotification(this.state.userId, {
      type: 'LEVEL_UP',
      title: 'Level Up!',
      message: `Congratulations! You've reached level ${this.state.level}!`,
      metadata: { level: this.state.level, rewards: nextLevelData.rewards },
    });

    // Emit level up event
    await this.eventService.emitLevelUp(this.state.userId, this.state, { ...this.state, level: this.state.level - 1 });

    await this.saveState();
  }

  async handleStreakUpdate(streakType: StreakType, days: number): Promise<void> {
    const oldState = { ...this.state };
    if (!this.state.streaks) {
      this.state.streaks = {} as Record<StreakType, number>;
    }
    this.state.streaks[streakType] = days;

    // Process streak rewards based on milestones
    if (days === 7) {
      await this.handleXpGain(3000); // Weekly streak bonus
      await this.badgeService.processBadges(this.state.userId, {
        actionType: 'streak_milestone',
        currentStreak: days,
      });
    } else if (days === 30) {
      await this.handleXpGain(10000); // Monthly streak bonus
      await this.badgeService.processBadges(this.state.userId, {
        actionType: 'streak_milestone',
        currentStreak: days,
      });
    }

    // Emit streak update event
    await this.eventService.emitStreakUpdated(this.state.userId, this.state, oldState);

    await this.saveState();
  }

  private async processRewards(rewards: Array<{ type: RewardType; id: string; name: string; amount?: number }>) {
    for (const reward of rewards) {
      switch (reward.type) {
        case 'BADGE':
          await this.badgeService.processBadges(this.state.userId, {
            actionType: 'level_reward',
            totalActions: 1,
          });
          break;
        case 'POINTS':
          if (reward.amount) {
            await this.handleXpGain(reward.amount);
          }
          break;
        case 'FEATURE_UNLOCK':
          await this.notificationService.createNotification(this.state.userId, {
            type: 'FEATURE_UNLOCK',
            title: 'New Feature Unlocked!',
            message: `You've unlocked: ${reward.name}`,
            metadata: { featureId: reward.id },
          });
          break;
      }
    }
  }

  private async saveState(): Promise<void> {
    const userRef = this.db.collection('userStats').doc(this.state.userId);
    const stateToSave = {
      userId: this.state.userId,
      xp: this.state.xp,
      level: this.state.level,
      currentLevelXp: this.state.currentLevelXp,
      xpToNextLevel: this.state.xpToNextLevel,
      streaks: this.state.streaks,
      achievements: this.state.achievements,
      lastActivityDate: this.state.lastActivityDate,
    };
    await userRef.update(stateToSave);
  }

  getState(): ProgressionState {
    return { ...this.state };
  }
}
