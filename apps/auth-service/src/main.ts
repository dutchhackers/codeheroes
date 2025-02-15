import 'reflect-metadata';
import { onRequest } from 'firebase-functions/v2/https';
import { setGlobalOptions } from 'firebase-functions/v2';
import { DEFAULT_REGION } from '@codeheroes/common';

setGlobalOptions({ region: DEFAULT_REGION });

// import { connectFirestore } from '@codeheroes/common';
// connectFirestore();

export * from './triggers/on-before-user-created.trigger';
export * from './triggers/on-before-user-sign-in.trigger';
