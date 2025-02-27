import { DatabaseInstance, DEFAULT_REGION } from '@codeheroes/common';
import { ActionHandlerFactory } from '@codeheroes/gamification';
import { initializeApp } from 'firebase-admin/app';
import { setGlobalOptions } from 'firebase-functions/v2';

// Initialize Firebase first, before any other operations
initializeApp();
setGlobalOptions({ region: DEFAULT_REGION });

// Initialize action handlers with Firestore instance
ActionHandlerFactory.initialize(DatabaseInstance.getInstance());

// Export after initialization
export * from './triggers';
