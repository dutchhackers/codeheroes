require('dotenv').config();
const fs = require('fs');

// Generate .firebaserc file (multi-project setup)
const firebasercTemplate = fs.readFileSync('.firebaserc.template', 'utf8');
const testProjectId = process.env.FIREBASE_TEST_PROJECT_ID || process.env.FIREBASE_PROJECT_ID;
const prodProjectId = process.env.FIREBASE_PROD_PROJECT_ID || process.env.FIREBASE_PROJECT_ID;
const firebasercConfig = firebasercTemplate
  .replaceAll('${FIREBASE_TEST_PROJECT_ID}', testProjectId)
  .replaceAll('${FIREBASE_PROD_PROJECT_ID}', prodProjectId)
  .replace('${FIREBASE_TEST_APP_SITE}', process.env.FIREBASE_TEST_APP_SITE || `${testProjectId}-app`)
  .replace('${FIREBASE_PROD_APP_SITE}', process.env.FIREBASE_PROD_APP_SITE || 'codeheroes-app-ui');
fs.writeFileSync('.firebaserc', firebasercConfig);

// Generate web-legacy environment.{local,prod}.ts file
const envTemplate = fs.readFileSync('apps/frontend/web-legacy/src/environments/environment.ts.template', 'utf8');
const envConfig = envTemplate
  .replace('${FIREBASE_API_KEY}', process.env.FIREBASE_API_KEY)
  .replace('${FIREBASE_AUTH_DOMAIN}', process.env.FIREBASE_AUTH_DOMAIN)
  .replace('${FIREBASE_PROJECT_ID}', process.env.FIREBASE_PROJECT_ID)
  .replace('${FIREBASE_STORAGE_BUCKET}', process.env.FIREBASE_STORAGE_BUCKET)
  .replace('${FIREBASE_MESSAGING_SENDER_ID}', process.env.FIREBASE_MESSAGING_SENDER_ID)
  .replace('${FIREBASE_APP_ID}', process.env.FIREBASE_APP_ID)
  .replace('${FIREBASE_VAPID_KEY}', process.env.FIREBASE_VAPID_KEY);

// Generate both environment files
fs.writeFileSync('apps/frontend/web-legacy/src/environments/environment.local.ts', envConfig);
fs.writeFileSync('apps/frontend/web-legacy/src/environments/environment.prod.ts', envConfig);

// Generate firebase-messaging-sw.js file
const firebaseMessagingTemplate = fs.readFileSync('apps/frontend/web-legacy/public/firebase-messaging-sw.js.template', 'utf8');
const firebaseMessagingConfig = firebaseMessagingTemplate
  .replace('${FIREBASE_API_KEY}', process.env.FIREBASE_API_KEY)
  .replace('${FIREBASE_AUTH_DOMAIN}', process.env.FIREBASE_AUTH_DOMAIN)
  .replace('${FIREBASE_PROJECT_ID}', process.env.FIREBASE_PROJECT_ID)
  .replace('${FIREBASE_STORAGE_BUCKET}', process.env.FIREBASE_STORAGE_BUCKET)
  .replace('${FIREBASE_MESSAGING_SENDER_ID}', process.env.FIREBASE_MESSAGING_SENDER_ID)
  .replace('${FIREBASE_APP_ID}', process.env.FIREBASE_APP_ID);

// Generate both environment files
fs.writeFileSync('apps/frontend/web-legacy/public/firebase-messaging-sw.js', firebaseMessagingConfig);

// Generate app (main PWA) environment files
const appLocalTemplate = fs.readFileSync('apps/frontend/app/src/environments/environment.local.ts.template', 'utf8');
const appLocalConfig = appLocalTemplate
  .replace('${FIREBASE_API_KEY}', process.env.FIREBASE_API_KEY)
  .replace('${FIREBASE_AUTH_DOMAIN}', process.env.FIREBASE_AUTH_DOMAIN)
  .replaceAll('${FIREBASE_PROJECT_ID}', process.env.FIREBASE_PROJECT_ID)
  .replace('${FIREBASE_STORAGE_BUCKET}', process.env.FIREBASE_STORAGE_BUCKET)
  .replace('${FIREBASE_MESSAGING_SENDER_ID}', process.env.FIREBASE_MESSAGING_SENDER_ID)
  .replace('${FIREBASE_APP_ID}', process.env.FIREBASE_APP_ID);
fs.writeFileSync('apps/frontend/app/src/environments/environment.local.ts', appLocalConfig);

// Generate app test environment (uses FIREBASE_TEST_* vars, falls back to regular vars)
const appTestTemplate = fs.readFileSync('apps/frontend/app/src/environments/environment.test.ts.template', 'utf8');
const appTestConfig = appTestTemplate
  .replace('${FIREBASE_TEST_API_KEY}', process.env.FIREBASE_TEST_API_KEY || process.env.FIREBASE_API_KEY)
  .replace('${FIREBASE_TEST_AUTH_DOMAIN}', process.env.FIREBASE_TEST_AUTH_DOMAIN || process.env.FIREBASE_AUTH_DOMAIN)
  .replaceAll('${FIREBASE_TEST_PROJECT_ID}', process.env.FIREBASE_TEST_PROJECT_ID || process.env.FIREBASE_PROJECT_ID)
  .replace('${FIREBASE_TEST_STORAGE_BUCKET}', process.env.FIREBASE_TEST_STORAGE_BUCKET || process.env.FIREBASE_STORAGE_BUCKET)
  .replace('${FIREBASE_TEST_MESSAGING_SENDER_ID}', process.env.FIREBASE_TEST_MESSAGING_SENDER_ID || process.env.FIREBASE_MESSAGING_SENDER_ID)
  .replace('${FIREBASE_TEST_APP_ID}', process.env.FIREBASE_TEST_APP_ID || process.env.FIREBASE_APP_ID);
fs.writeFileSync('apps/frontend/app/src/environments/environment.test.ts', appTestConfig);

// Generate app prod environment (uses FIREBASE_PROD_* vars, falls back to regular vars)
const appProdTemplate = fs.readFileSync('apps/frontend/app/src/environments/environment.prod.ts.template', 'utf8');
const appProdConfig = appProdTemplate
  .replace('${FIREBASE_PROD_API_KEY}', process.env.FIREBASE_PROD_API_KEY || process.env.FIREBASE_API_KEY)
  .replace('${FIREBASE_PROD_AUTH_DOMAIN}', process.env.FIREBASE_PROD_AUTH_DOMAIN || process.env.FIREBASE_AUTH_DOMAIN)
  .replaceAll('${FIREBASE_PROD_PROJECT_ID}', process.env.FIREBASE_PROD_PROJECT_ID || process.env.FIREBASE_PROJECT_ID)
  .replace('${FIREBASE_PROD_STORAGE_BUCKET}', process.env.FIREBASE_PROD_STORAGE_BUCKET || process.env.FIREBASE_STORAGE_BUCKET)
  .replace('${FIREBASE_PROD_MESSAGING_SENDER_ID}', process.env.FIREBASE_PROD_MESSAGING_SENDER_ID || process.env.FIREBASE_MESSAGING_SENDER_ID)
  .replace('${FIREBASE_PROD_APP_ID}', process.env.FIREBASE_PROD_APP_ID || process.env.FIREBASE_APP_ID);
fs.writeFileSync('apps/frontend/app/src/environments/environment.prod.ts', appProdConfig);
