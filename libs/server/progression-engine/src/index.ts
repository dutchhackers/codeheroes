// // Unified Services
// export * from './lib/events/event-processor.service';
// export * from './lib/events/event-publisher.service';
// export * from './lib/progression/services/user-progression.service';
// export * from './lib/activities/services/activity.service';

// // Supporting Services
// export * from './lib/rewards/services/badge.service';
// export * from './lib/rewards/services/level.service';
// export * from './lib/rewards/services/reward.service';

// // Constants
// export * from './lib/config/xp-values.config';
// export * from './lib/config/level-thresholds';
// export * from './lib/config/level-definitions.config';

// // Utilities
// export * from './lib/utils/time-periods.utils';

// // Factories
// export * from './lib/factories/action-handler.factory';

// // Repositories > new refactoring
// export * from './lib/progression/core/service-registry';

// File: libs/server/progression-engine/src/index.ts

// Core models
export * from './lib/progression/core/progression-state.model';
export * from './lib/progression/core/progression-events.model';
export * from './lib/progression/core/xp-calculation.model';
export * from './lib/progression/core/service-registry';

// Repositories
export * from './lib/progression/repositories/progression-state.repository';
export * from './lib/progression/repositories/activity.repository';
export * from './lib/progression/repositories/game-action.repository';

// Services
export * from './lib/progression/services/progression.service';
export * from './lib/progression/services/xp-calculator.service';
export * from './lib/progression/services/activity-recorder.service';

// Handlers
export * from './lib/progression/handlers/action-handler.base';
export * from './lib/progression/handlers/action-handler.factory';

// Commands
export * from './lib/progression/commands/process-game-action.command';
export * from './lib/progression/commands/update-progression.command';
export * from './lib/progression/commands/command-factory';

// Events
export * from './lib/progression/events/event-processor.service';
export * from './lib/progression/events/event-publisher.service';

// Supporting Services (existing)
export * from './lib/rewards/services/badge.service';
export * from './lib/rewards/services/level.service';
export * from './lib/rewards/services/reward.service';

// Constants
export * from './lib/config/xp-values.config';
export * from './lib/config/level-thresholds';
export * from './lib/config/level-definitions.config';

// Utilities
export * from './lib/utils/time-periods.utils';
