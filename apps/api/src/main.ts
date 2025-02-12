import 'reflect-metadata';
import { onRequest } from 'firebase-functions/v2/https';
import { setGlobalOptions } from 'firebase-functions/v2';
import { DEFAULT_REGION } from '@codeheroes/common';

setGlobalOptions({ region: DEFAULT_REGION });

// import { connectFirestore } from '@codeheroes/common';
// connectFirestore();

export * from './triggers/on-before-user-created.trigger';
export * from './triggers/on-before-user-sign-in.trigger';

import { defaultApi } from './app';

/**
 * HTTP trigger
 * */
export const api = onRequest({ memory: '2GiB', timeoutSeconds: 120 }, defaultApi);
