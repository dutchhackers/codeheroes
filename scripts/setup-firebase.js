require('dotenv').config();
const fs = require('fs');
const { execSync } = require('child_process');

// Generate app version: semver+gitHash
const packageVersion = JSON.parse(fs.readFileSync('package.json', 'utf8')).version || '0.0.0';
let gitHash = 'unknown';
try {
  gitHash = execSync('git rev-parse --short HEAD', { encoding: 'utf-8' }).trim();
} catch {
  // git not available (e.g. in containerized builds without .git)
}
const appVersion = `${packageVersion}+${gitHash}`;
console.log(`App version: ${appVersion}`);

// Generate .firebaserc file (multi-project setup)
const firebasercTemplate = fs.readFileSync('.firebaserc.template', 'utf8');
const testProjectId = process.env.FIREBASE_TEST_PROJECT_ID || process.env.FIREBASE_PROJECT_ID;
const prodProjectId = process.env.FIREBASE_PROD_PROJECT_ID || process.env.FIREBASE_PROJECT_ID;
const firebasercConfig = firebasercTemplate
  .replaceAll('${FIREBASE_TEST_PROJECT_ID}', testProjectId)
  .replaceAll('${FIREBASE_PROD_PROJECT_ID}', prodProjectId)
  .replace('${FIREBASE_TEST_APP_SITE}', process.env.FIREBASE_TEST_APP_SITE || `${testProjectId}-app`)
  .replace('${FIREBASE_PROD_APP_SITE}', process.env.FIREBASE_PROD_APP_SITE || 'codeheroes-app-ui')
  .replace('${FIREBASE_TEST_ADMIN_PORTAL_SITE}', process.env.FIREBASE_TEST_ADMIN_PORTAL_SITE || 'codeheroes-admin-ui-test')
  .replace('${FIREBASE_PROD_ADMIN_PORTAL_SITE}', process.env.FIREBASE_PROD_ADMIN_PORTAL_SITE || 'codeheroes-admin-ui');
fs.writeFileSync('.firebaserc', firebasercConfig);

// Generate app (main PWA) environment files
const appLocalTemplate = fs.readFileSync('apps/frontend/app/src/environments/environment.local.ts.template', 'utf8');
const appLocalConfig = appLocalTemplate
  .replace('${FIREBASE_API_KEY}', process.env.FIREBASE_API_KEY)
  .replace('${FIREBASE_AUTH_DOMAIN}', process.env.FIREBASE_AUTH_DOMAIN)
  .replaceAll('${FIREBASE_PROJECT_ID}', process.env.FIREBASE_PROJECT_ID)
  .replace('${FIREBASE_STORAGE_BUCKET}', process.env.FIREBASE_STORAGE_BUCKET)
  .replace('${FIREBASE_MESSAGING_SENDER_ID}', process.env.FIREBASE_MESSAGING_SENDER_ID)
  .replace('${FIREBASE_APP_ID}', process.env.FIREBASE_APP_ID)
  .replace('${FIREBASE_VAPID_KEY}', process.env.FIREBASE_VAPID_KEY || '')
  .replace('${APP_VERSION}', appVersion);
fs.writeFileSync('apps/frontend/app/src/environments/environment.local.ts', appLocalConfig);

// Generate app test environment (uses FIREBASE_TEST_* vars, falls back to regular vars)
const appTestTemplate = fs.readFileSync('apps/frontend/app/src/environments/environment.test.ts.template', 'utf8');
const appTestConfig = appTestTemplate
  .replace('${FIREBASE_TEST_API_KEY}', process.env.FIREBASE_TEST_API_KEY || process.env.FIREBASE_API_KEY)
  .replace('${FIREBASE_TEST_AUTH_DOMAIN}', process.env.FIREBASE_TEST_AUTH_DOMAIN || process.env.FIREBASE_AUTH_DOMAIN)
  .replaceAll('${FIREBASE_TEST_PROJECT_ID}', process.env.FIREBASE_TEST_PROJECT_ID || process.env.FIREBASE_PROJECT_ID)
  .replace('${FIREBASE_TEST_STORAGE_BUCKET}', process.env.FIREBASE_TEST_STORAGE_BUCKET || process.env.FIREBASE_STORAGE_BUCKET)
  .replace('${FIREBASE_TEST_MESSAGING_SENDER_ID}', process.env.FIREBASE_TEST_MESSAGING_SENDER_ID || process.env.FIREBASE_MESSAGING_SENDER_ID)
  .replace('${FIREBASE_TEST_APP_ID}', process.env.FIREBASE_TEST_APP_ID || process.env.FIREBASE_APP_ID)
  .replace('${FIREBASE_TEST_MEASUREMENT_ID}', process.env.FIREBASE_TEST_MEASUREMENT_ID || process.env.FIREBASE_MEASUREMENT_ID || '')
  .replace('${FIREBASE_TEST_VAPID_KEY}', process.env.FIREBASE_TEST_VAPID_KEY || process.env.FIREBASE_VAPID_KEY || '')
  .replace('${APP_VERSION}', appVersion);
fs.writeFileSync('apps/frontend/app/src/environments/environment.test.ts', appTestConfig);

// Generate app prod environment (uses FIREBASE_PROD_* vars, falls back to regular vars)
const appProdTemplate = fs.readFileSync('apps/frontend/app/src/environments/environment.prod.ts.template', 'utf8');
const appProdConfig = appProdTemplate
  .replace('${FIREBASE_PROD_API_KEY}', process.env.FIREBASE_PROD_API_KEY || process.env.FIREBASE_API_KEY)
  .replace('${FIREBASE_PROD_AUTH_DOMAIN}', process.env.FIREBASE_PROD_AUTH_DOMAIN || process.env.FIREBASE_AUTH_DOMAIN)
  .replaceAll('${FIREBASE_PROD_PROJECT_ID}', process.env.FIREBASE_PROD_PROJECT_ID || process.env.FIREBASE_PROJECT_ID)
  .replace('${FIREBASE_PROD_STORAGE_BUCKET}', process.env.FIREBASE_PROD_STORAGE_BUCKET || process.env.FIREBASE_STORAGE_BUCKET)
  .replace('${FIREBASE_PROD_MESSAGING_SENDER_ID}', process.env.FIREBASE_PROD_MESSAGING_SENDER_ID || process.env.FIREBASE_MESSAGING_SENDER_ID)
  .replace('${FIREBASE_PROD_APP_ID}', process.env.FIREBASE_PROD_APP_ID || process.env.FIREBASE_APP_ID)
  .replace('${FIREBASE_PROD_MEASUREMENT_ID}', process.env.FIREBASE_PROD_MEASUREMENT_ID || process.env.FIREBASE_MEASUREMENT_ID || '')
  .replace('${FIREBASE_PROD_VAPID_KEY}', process.env.FIREBASE_PROD_VAPID_KEY || process.env.FIREBASE_VAPID_KEY || '')
  .replace('${APP_VERSION}', appVersion);
fs.writeFileSync('apps/frontend/app/src/environments/environment.prod.ts', appProdConfig);

// Generate admin-portal environment files
const adminLocalTemplate = fs.readFileSync('apps/frontend/admin-portal/src/environments/environment.local.ts.template', 'utf8');
const adminLocalConfig = adminLocalTemplate
  .replace('${FIREBASE_API_KEY}', process.env.FIREBASE_API_KEY)
  .replace('${FIREBASE_AUTH_DOMAIN}', process.env.FIREBASE_AUTH_DOMAIN)
  .replaceAll('${FIREBASE_PROJECT_ID}', process.env.FIREBASE_PROJECT_ID)
  .replace('${FIREBASE_STORAGE_BUCKET}', process.env.FIREBASE_STORAGE_BUCKET)
  .replace('${FIREBASE_MESSAGING_SENDER_ID}', process.env.FIREBASE_MESSAGING_SENDER_ID)
  .replace('${FIREBASE_APP_ID}', process.env.FIREBASE_APP_ID);
fs.writeFileSync('apps/frontend/admin-portal/src/environments/environment.local.ts', adminLocalConfig);

const adminTestTemplate = fs.readFileSync('apps/frontend/admin-portal/src/environments/environment.test.ts.template', 'utf8');
const adminTestConfig = adminTestTemplate
  .replace('${FIREBASE_TEST_API_KEY}', process.env.FIREBASE_TEST_API_KEY || process.env.FIREBASE_API_KEY)
  .replace('${FIREBASE_TEST_AUTH_DOMAIN}', process.env.FIREBASE_TEST_AUTH_DOMAIN || process.env.FIREBASE_AUTH_DOMAIN)
  .replaceAll('${FIREBASE_TEST_PROJECT_ID}', process.env.FIREBASE_TEST_PROJECT_ID || process.env.FIREBASE_PROJECT_ID)
  .replace('${FIREBASE_TEST_STORAGE_BUCKET}', process.env.FIREBASE_TEST_STORAGE_BUCKET || process.env.FIREBASE_STORAGE_BUCKET)
  .replace('${FIREBASE_TEST_MESSAGING_SENDER_ID}', process.env.FIREBASE_TEST_MESSAGING_SENDER_ID || process.env.FIREBASE_MESSAGING_SENDER_ID)
  .replace('${FIREBASE_TEST_APP_ID}', process.env.FIREBASE_TEST_APP_ID || process.env.FIREBASE_APP_ID)
  .replace('${FIREBASE_TEST_MEASUREMENT_ID}', process.env.FIREBASE_TEST_MEASUREMENT_ID || process.env.FIREBASE_MEASUREMENT_ID || '');
fs.writeFileSync('apps/frontend/admin-portal/src/environments/environment.test.ts', adminTestConfig);

const adminProdTemplate = fs.readFileSync('apps/frontend/admin-portal/src/environments/environment.prod.ts.template', 'utf8');
const adminProdConfig = adminProdTemplate
  .replace('${FIREBASE_PROD_API_KEY}', process.env.FIREBASE_PROD_API_KEY || process.env.FIREBASE_API_KEY)
  .replace('${FIREBASE_PROD_AUTH_DOMAIN}', process.env.FIREBASE_PROD_AUTH_DOMAIN || process.env.FIREBASE_AUTH_DOMAIN)
  .replaceAll('${FIREBASE_PROD_PROJECT_ID}', process.env.FIREBASE_PROD_PROJECT_ID || process.env.FIREBASE_PROJECT_ID)
  .replace('${FIREBASE_PROD_STORAGE_BUCKET}', process.env.FIREBASE_PROD_STORAGE_BUCKET || process.env.FIREBASE_STORAGE_BUCKET)
  .replace('${FIREBASE_PROD_MESSAGING_SENDER_ID}', process.env.FIREBASE_PROD_MESSAGING_SENDER_ID || process.env.FIREBASE_MESSAGING_SENDER_ID)
  .replace('${FIREBASE_PROD_APP_ID}', process.env.FIREBASE_PROD_APP_ID || process.env.FIREBASE_APP_ID)
  .replace('${FIREBASE_PROD_MEASUREMENT_ID}', process.env.FIREBASE_PROD_MEASUREMENT_ID || process.env.FIREBASE_MEASUREMENT_ID || '');
fs.writeFileSync('apps/frontend/admin-portal/src/environments/environment.prod.ts', adminProdConfig);

// Generate Firebase Messaging service worker (uses base FIREBASE_* vars — matches local/CI target)
const swTemplatePath = 'apps/frontend/app/public/firebase-messaging-sw.js.template';
if (fs.existsSync(swTemplatePath)) {
  const swTemplate = fs.readFileSync(swTemplatePath, 'utf8');
  const swConfig = swTemplate
    .replace('${FIREBASE_API_KEY}', process.env.FIREBASE_API_KEY)
    .replace('${FIREBASE_AUTH_DOMAIN}', process.env.FIREBASE_AUTH_DOMAIN)
    .replace('${FIREBASE_PROJECT_ID}', process.env.FIREBASE_PROJECT_ID)
    .replace('${FIREBASE_STORAGE_BUCKET}', process.env.FIREBASE_STORAGE_BUCKET)
    .replace('${FIREBASE_MESSAGING_SENDER_ID}', process.env.FIREBASE_MESSAGING_SENDER_ID)
    .replace('${FIREBASE_APP_ID}', process.env.FIREBASE_APP_ID);
  fs.writeFileSync('apps/frontend/app/public/firebase-messaging-sw.js', swConfig);
}
