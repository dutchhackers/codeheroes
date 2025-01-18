import * as admin from 'firebase-admin';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as logger from 'firebase-functions/logger';

initializeApp();

const db = getFirestore();

if (process.env.FIRESTORE_EMULATOR_HOST) {
  logger.debug('Connect to emulator via host ' + process.env.FIRESTORE_EMULATOR_HOST);
  db.settings({
    host: process.env.FIRESTORE_EMULATOR_HOST,
    ssl: false,
  });
}

export { admin, db };
