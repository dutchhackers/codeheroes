import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";

admin.initializeApp();

const db = admin.firestore();

if (process.env.FIRESTORE_EMULATOR_HOST) {
  logger.debug("Connect to emulator via host " + process.env.FIRESTORE_EMULATOR_HOST);
  db.settings({
    host: process.env.FIRESTORE_EMULATOR_HOST,
    ssl: false,
  });
}

export { admin, db };
