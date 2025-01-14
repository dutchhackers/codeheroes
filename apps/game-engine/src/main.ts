import { DEFAULT_REGION } from '@codeheroes/common';
import { setGlobalOptions } from 'firebase-functions/v2';

import { initializeApp } from 'firebase-admin/app';
initializeApp();

import { createUserActivity, calculateUserXp } from './events';

setGlobalOptions({ region: DEFAULT_REGION });

export { createUserActivity as handleEventCreation, calculateUserXp as calculateXp };
