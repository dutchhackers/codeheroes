import 'reflect-metadata';
import admin from 'firebase-admin';
import { onRequest } from 'firebase-functions/v2/https';
import { setGlobalOptions } from 'firebase-functions/v2';
import { DEFAULT_REGION } from '@codeheroes/common';

setGlobalOptions({ region: DEFAULT_REGION });

// Calling initializeApp directly; to be improved in the future by using initializeApp from common
admin.initializeApp();

export * from './triggers/on-before-user-created.trigger';
export * from './triggers/on-before-user-sign-in.trigger';
