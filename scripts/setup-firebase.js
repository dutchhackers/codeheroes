require('dotenv').config();
const fs = require('fs');

// Generate .firebaserc file
const firebasercTemplate = fs.readFileSync('.firebaserc.template', 'utf8');
const firebasercConfig = firebasercTemplate.replace('${FIREBASE_PROJECT_ID}', process.env.FIREBASE_PROJECT_ID);
fs.writeFileSync('.firebaserc', firebasercConfig);

// Generate environment.prod.ts file
const envTemplate = fs.readFileSync('apps/web/src/environments/environment.prod.ts.template', 'utf8');
const envConfig = envTemplate
  .replace('${FIREBASE_API_KEY}', process.env.FIREBASE_API_KEY)
  .replace('${FIREBASE_AUTH_DOMAIN}', process.env.FIREBASE_AUTH_DOMAIN)
  .replace('${FIREBASE_PROJECT_ID}', process.env.FIREBASE_PROJECT_ID)
  .replace('${FIREBASE_STORAGE_BUCKET}', process.env.FIREBASE_STORAGE_BUCKET)
  .replace('${FIREBASE_MESSAGING_SENDER_ID}', process.env.FIREBASE_MESSAGING_SENDER_ID)
  .replace('${FIREBASE_APP_ID}', process.env.FIREBASE_APP_ID);
fs.writeFileSync('apps/web/src/environments/environment.prod.ts', envConfig);
