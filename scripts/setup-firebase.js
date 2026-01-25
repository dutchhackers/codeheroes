require('dotenv').config();
const fs = require('fs');

// Generate .firebaserc file
const firebasercTemplate = fs.readFileSync('.firebaserc.template', 'utf8');
const firebasercConfig = firebasercTemplate.replace('${FIREBASE_PROJECT_ID}', process.env.FIREBASE_PROJECT_ID);
fs.writeFileSync('.firebaserc', firebasercConfig);

// Generate environment.{local,prod}.ts file
const envTemplate = fs.readFileSync('apps/web/src/environments/environment.ts.template', 'utf8');
const envConfig = envTemplate
  .replace('${FIREBASE_API_KEY}', process.env.FIREBASE_API_KEY)
  .replace('${FIREBASE_AUTH_DOMAIN}', process.env.FIREBASE_AUTH_DOMAIN)
  .replace('${FIREBASE_PROJECT_ID}', process.env.FIREBASE_PROJECT_ID)
  .replace('${FIREBASE_STORAGE_BUCKET}', process.env.FIREBASE_STORAGE_BUCKET)
  .replace('${FIREBASE_MESSAGING_SENDER_ID}', process.env.FIREBASE_MESSAGING_SENDER_ID)
  .replace('${FIREBASE_APP_ID}', process.env.FIREBASE_APP_ID)
  .replace('${FIREBASE_VAPID_KEY}', process.env.FIREBASE_VAPID_KEY);

// Generate both environment files
fs.writeFileSync('apps/web/src/environments/environment.local.ts', envConfig);
fs.writeFileSync('apps/web/src/environments/environment.prod.ts', envConfig);

// Generate firebase-messaging-sw.js file
const firebaseMessagingTemplate = fs.readFileSync('apps/web/public/firebase-messaging-sw.js.template', 'utf8');
const firebaseMessagingConfig = firebaseMessagingTemplate
  .replace('${FIREBASE_API_KEY}', process.env.FIREBASE_API_KEY)
  .replace('${FIREBASE_AUTH_DOMAIN}', process.env.FIREBASE_AUTH_DOMAIN)
  .replace('${FIREBASE_PROJECT_ID}', process.env.FIREBASE_PROJECT_ID)
  .replace('${FIREBASE_STORAGE_BUCKET}', process.env.FIREBASE_STORAGE_BUCKET)
  .replace('${FIREBASE_MESSAGING_SENDER_ID}', process.env.FIREBASE_MESSAGING_SENDER_ID)
  .replace('${FIREBASE_APP_ID}', process.env.FIREBASE_APP_ID);

// Generate both environment files
fs.writeFileSync('apps/web/public/firebase-messaging-sw.js', firebaseMessagingConfig);

// Generate activity-wall environment files
const activityWallLocalTemplate = fs.readFileSync('apps/activity-wall/src/environments/environment.local.ts.template', 'utf8');
const activityWallLocalConfig = activityWallLocalTemplate
  .replace('${FIREBASE_API_KEY}', process.env.FIREBASE_API_KEY)
  .replace('${FIREBASE_AUTH_DOMAIN}', process.env.FIREBASE_AUTH_DOMAIN)
  .replace('${FIREBASE_PROJECT_ID}', process.env.FIREBASE_PROJECT_ID)
  .replace('${FIREBASE_STORAGE_BUCKET}', process.env.FIREBASE_STORAGE_BUCKET)
  .replace('${FIREBASE_MESSAGING_SENDER_ID}', process.env.FIREBASE_MESSAGING_SENDER_ID)
  .replace('${FIREBASE_APP_ID}', process.env.FIREBASE_APP_ID);
fs.writeFileSync('apps/activity-wall/src/environments/environment.local.ts', activityWallLocalConfig);

// Generate activity-wall test environment (uses FIREBASE_TEST_* vars, falls back to regular vars)
const activityWallTestTemplate = fs.readFileSync('apps/activity-wall/src/environments/environment.test.ts.template', 'utf8');
const activityWallTestConfig = activityWallTestTemplate
  .replace('${FIREBASE_TEST_API_KEY}', process.env.FIREBASE_TEST_API_KEY || process.env.FIREBASE_API_KEY)
  .replace('${FIREBASE_TEST_AUTH_DOMAIN}', process.env.FIREBASE_TEST_AUTH_DOMAIN || process.env.FIREBASE_AUTH_DOMAIN)
  .replace('${FIREBASE_TEST_PROJECT_ID}', process.env.FIREBASE_TEST_PROJECT_ID || process.env.FIREBASE_PROJECT_ID)
  .replace('${FIREBASE_TEST_STORAGE_BUCKET}', process.env.FIREBASE_TEST_STORAGE_BUCKET || process.env.FIREBASE_STORAGE_BUCKET)
  .replace('${FIREBASE_TEST_MESSAGING_SENDER_ID}', process.env.FIREBASE_TEST_MESSAGING_SENDER_ID || process.env.FIREBASE_MESSAGING_SENDER_ID)
  .replace('${FIREBASE_TEST_APP_ID}', process.env.FIREBASE_TEST_APP_ID || process.env.FIREBASE_APP_ID);
fs.writeFileSync('apps/activity-wall/src/environments/environment.test.ts', activityWallTestConfig);

// Generate activity-wall prod environment (uses FIREBASE_PROD_* vars, falls back to regular vars)
const activityWallProdTemplate = fs.readFileSync('apps/activity-wall/src/environments/environment.prod.ts.template', 'utf8');
const activityWallProdConfig = activityWallProdTemplate
  .replace('${FIREBASE_PROD_API_KEY}', process.env.FIREBASE_PROD_API_KEY || process.env.FIREBASE_API_KEY)
  .replace('${FIREBASE_PROD_AUTH_DOMAIN}', process.env.FIREBASE_PROD_AUTH_DOMAIN || process.env.FIREBASE_AUTH_DOMAIN)
  .replace('${FIREBASE_PROD_PROJECT_ID}', process.env.FIREBASE_PROD_PROJECT_ID || process.env.FIREBASE_PROJECT_ID)
  .replace('${FIREBASE_PROD_STORAGE_BUCKET}', process.env.FIREBASE_PROD_STORAGE_BUCKET || process.env.FIREBASE_STORAGE_BUCKET)
  .replace('${FIREBASE_PROD_MESSAGING_SENDER_ID}', process.env.FIREBASE_PROD_MESSAGING_SENDER_ID || process.env.FIREBASE_MESSAGING_SENDER_ID)
  .replace('${FIREBASE_PROD_APP_ID}', process.env.FIREBASE_PROD_APP_ID || process.env.FIREBASE_APP_ID);
fs.writeFileSync('apps/activity-wall/src/environments/environment.prod.ts', activityWallProdConfig);
