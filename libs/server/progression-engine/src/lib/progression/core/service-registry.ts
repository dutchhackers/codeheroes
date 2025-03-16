import { DatabaseInstance } from '@codeheroes/common';
import { EventPublisherService } from '../events/event-publisher.service';
import { ActionHandlerFactory } from '../handlers/action-handler.factory';
import { ActivityRepository } from '../repositories/activity.repository';
import { GameActionRepository } from '../repositories/game-action.repository';
import { ProgressionStateRepository } from '../repositories/progression-state.repository';
import { ActivityRecorderService } from '../services/activity-recorder.service';
import { ProgressionService } from '../services/progression.service';
import { XpCalculatorService } from '../services/xp-calculator.service';
/**
 * Service registry containing all progression-related services
 * Acts as a simple dependency injection container
 */
export interface ServiceRegistry {
  progressionStateRepository: ProgressionStateRepository;
  activityRepository: ActivityRepository;
  gameActionRepository: GameActionRepository;
  xpCalculatorService: XpCalculatorService;
  activityRecorderService: ActivityRecorderService;
  eventPublisherService: EventPublisherService;
  progressionService: ProgressionService;
}

/**
 * Creates a service registry with all dependencies properly initialized
 * @returns Service registry object with all services
 */
export function createServiceRegistry(): ServiceRegistry {
  // Initialize Firestore instance
  const db = DatabaseInstance.getInstance();

  // Create repositories
  const progressionStateRepository = new ProgressionStateRepository();
  const activityRepository = new ActivityRepository();
  const gameActionRepository = new GameActionRepository();

  // Create supporting services
  const xpCalculatorService = new XpCalculatorService();
  const activityRecorderService = new ActivityRecorderService();
  const eventPublisherService = new EventPublisherService();

  // Create main progression service with all dependencies
  const progressionService = new ProgressionService(
    progressionStateRepository,
    activityRepository,
    gameActionRepository,
    xpCalculatorService,
    activityRecorderService,
    eventPublisherService,
  );

  // Initialize action handlers
  ActionHandlerFactory.initialize(db, progressionService);

  // Return the registry with all services
  return {
    progressionStateRepository,
    activityRepository,
    gameActionRepository,
    xpCalculatorService,
    activityRecorderService,
    eventPublisherService,
    progressionService,
  };
}
