// Core models
export * from './lib/progression/core/progression-state.model';
export * from './lib/progression/core/progression-events.model';
export * from './lib/progression/core/xp-calculation.model';
export * from './lib/progression/core/service-registry';

// Repositories
export * from './lib/progression/repositories/progression.repository';
export * from './lib/progression/repositories/activity.repository';
export * from './lib/progression/repositories/game-action.repository';

// Services
export * from './lib/progression/services/progression.service';
export * from './lib/progression/services/xp-calculator.service';
export * from './lib/progression/services/activity-recorder.service';

// Handlers
export * from './lib/progression/handlers/action-handler.base';
export * from './lib/progression/handlers/action-handler.factory';

// Events
export * from './lib/progression/events/event-processor.service';
export * from './lib/progression/events/event-publisher.service';

// Supporting Services (existing)
export * from './lib/rewards/services/badge.service';
export * from './lib/rewards/services/milestone-badge.service';
export * from './lib/rewards/services/special-badge.service';
export * from './lib/rewards/services/level.service';
export * from './lib/rewards/services/reward.service';
export * from './lib/rewards/services/reward-activity.service';

// Constants
export * from './lib/config/xp-values.config';
export * from './lib/config/level-thresholds';
export * from './lib/config/level-definitions.config';
export * from './lib/config/badge-catalog.config';
export * from './lib/config/milestone-badges.config';
export * from './lib/config/special-badges.config';

// Utilities
export * from './lib/utils/time-periods.utils';
