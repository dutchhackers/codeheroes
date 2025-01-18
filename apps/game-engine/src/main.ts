import { DEFAULT_REGION } from '@codeheroes/common';
import { setGlobalOptions } from 'firebase-functions/v2';
import { initializeApp } from 'firebase-admin/app';

initializeApp();
setGlobalOptions({ region: DEFAULT_REGION });

export * from './triggers';
