import { DEFAULT_REGION } from '@codeheroes/common';
import { setGlobalOptions } from 'firebase-functions/v2';

import { initializeApp } from 'firebase-admin/app';
initializeApp();

import { handleEventCreation, calculateXp } from './events';

setGlobalOptions({ region: DEFAULT_REGION });

export { handleEventCreation, calculateXp };
