import { DEFAULT_REGION } from '@codeheroes/common';
import { initializeApp } from 'firebase-admin/app';
import { setGlobalOptions } from 'firebase-functions/v2';

initializeApp();
setGlobalOptions({ region: DEFAULT_REGION });

export * from './triggers';
