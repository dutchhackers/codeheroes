import { DatabaseInstance, DEFAULT_REGION } from '@codeheroes/common';
import { ActionHandlerFactory, createServiceRegistry } from '@codeheroes/progression-engine';
import { initializeApp } from 'firebase-admin/app';
import { setGlobalOptions } from 'firebase-functions/v2';

// Initialize Firebase first, before any other operations
initializeApp();
setGlobalOptions({ region: DEFAULT_REGION });

// Create services
const services = createServiceRegistry();

// Export after initialization
export * from './triggers';
