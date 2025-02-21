// Core interfaces
export * from './lib/core/interfaces/action';
export * from './lib/core/interfaces/progression';
export * from './lib/core/interfaces/streak';
export * from './lib/core/interfaces/activity';

// Core services and types
export * from './lib/core/services/progression-event.service';
export * from './lib/core/services/progression.service';
export * from './lib/core/services/badge.service';
export * from './lib/core/services/activity-tracker.service';
export * from './lib/core/services/reward.service';
export * from './lib/core/services/progression-event-handler.service';
export * from './lib/core/services/activity-event-handler.service';
export * from './lib/core/state-machine/progression-state-machine';

// Factories
export * from './lib/factories/action-handler.factory';

// Constants
export * from './lib/core/constants/collections';
export * from './lib/constants/xp-settings';
export * from './lib/constants/level-thresholds';

// Main service
export * from './lib/game-progression.service';
