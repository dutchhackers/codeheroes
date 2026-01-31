# Firebase Environment Setup Guide

This guide walks through setting up a new Firebase environment (project) for Code Heroes from scratch.

## Overview

Code Heroes uses multiple Firebase environments:

| Environment | Project ID | Purpose |
|-------------|------------|---------|
| Test | `codeheroes-test` | Testing and staging |
| Production | `codeheroes-prod` | Live production |
| Local | Emulators | Local development |

## Prerequisites

- Firebase CLI installed: `npm install -g firebase-tools`
- Logged into Firebase: `firebase login`
- Access to create Firebase projects
- A Google Cloud billing account (for Cloud Functions)

## Step 1: Create Firebase Project

### Via Firebase Console (Recommended)

1. Go to https://console.firebase.google.com/
2. Click "Add project"
3. Enter project name (e.g., `codeheroes-test`)
4. Disable Google Analytics (optional for test environments)
5. Click "Create project"

### Via CLI

```bash
firebase projects:create codeheroes-test --display-name "CodeHeroes Test"
```

## Step 2: Enable Billing

Cloud Functions require a billing account.

1. Go to https://console.cloud.google.com/billing
2. Link the project to a billing account
3. Upgrade to Blaze plan in Firebase Console

## Step 3: Create Web App

1. In Firebase Console, go to Project Settings
2. Click "Add app" → Web
3. Register app name (e.g., "App - Test")
4. Copy the Firebase config values for later

## Step 4: Enable Authentication

1. Go to **Authentication** → **Sign-in method**
2. Enable **Google** provider
3. Configure OAuth consent screen if prompted
4. Go to **Settings** → **Authorized domains**
5. Add your hosting domain (e.g., `codeheroes-app-ui-test.web.app`)

## Step 5: Enable Firestore

1. Go to **Firestore Database**
2. Click "Create database"
3. Select **Production mode** (we'll deploy proper rules)
4. Choose location (recommend `eur3` for Europe or `nam5` for US)

**Important:** Firestore location cannot be changed after creation.

## Step 6: Enable Storage

Storage must be initialized via Console before CLI deployment.

1. Go to **Storage**
2. Click "Get Started"
3. Select security rules (test mode is fine, we'll deploy proper rules)
4. Choose location (recommend same region as Firestore)

## Step 7: Create Hosting Sites

Create dedicated hosting sites for the app:

```bash
# For test environment
firebase hosting:sites:create codeheroes-app-ui-test --project codeheroes-test

# For production environment
firebase hosting:sites:create codeheroes-app-ui --project codeheroes-prod
```

## Step 8: Configure Local Environment

### Update `.firebaserc`

Add the new project to `.firebaserc`:

```json
{
  "projects": {
    "default": "codeheroes-test",
    "test": "codeheroes-test",
    "production": "codeheroes-prod"
  },
  "targets": {
    "codeheroes-test": {
      "hosting": {
        "web-legacy": ["codeheroes-test"],
        "app": ["codeheroes-app-ui-test"]
      }
    },
    "codeheroes-prod": {
      "hosting": {
        "web-legacy": ["codeheroes-prod"],
        "app": ["codeheroes-app-ui"]
      }
    }
  }
}
```

### Update `.env`

Add environment variables (get values from Firebase Console → Project Settings):

```bash
# Test Environment
FIREBASE_TEST_PROJECT_ID=codeheroes-test
FIREBASE_TEST_API_KEY=your-test-api-key
FIREBASE_TEST_AUTH_DOMAIN=codeheroes-test.firebaseapp.com
FIREBASE_TEST_STORAGE_BUCKET=codeheroes-test.firebasestorage.app
FIREBASE_TEST_MESSAGING_SENDER_ID=your-test-sender-id
FIREBASE_TEST_APP_ID=your-test-app-id
FIREBASE_TEST_APP_SITE=codeheroes-app-ui-test

# Production Environment
FIREBASE_PROD_PROJECT_ID=codeheroes-prod
FIREBASE_PROD_API_KEY=your-prod-api-key
FIREBASE_PROD_AUTH_DOMAIN=codeheroes-prod.firebaseapp.com
FIREBASE_PROD_STORAGE_BUCKET=codeheroes-prod.firebasestorage.app
FIREBASE_PROD_MESSAGING_SENDER_ID=your-prod-sender-id
FIREBASE_PROD_APP_ID=your-prod-app-id
FIREBASE_PROD_APP_SITE=codeheroes-app-ui
```

### Update Angular Environment Files

Create/update environment files in `apps/frontend/app/src/environments/`:

**environment.test.ts:**
```typescript
export const environment = {
  useEmulators: false,
  apiUrl: 'https://api-xxxxx-ew.a.run.app', // Update after deploying functions
  firebase: {
    apiKey: 'your-test-api-key',
    authDomain: 'codeheroes-test.firebaseapp.com',
    projectId: 'codeheroes-test',
    storageBucket: 'codeheroes-test.firebasestorage.app',
    messagingSenderId: 'your-test-sender-id',
    appId: 'your-test-app-id',
    measurementId: 'your-measurement-id', // optional
  },
};
```

## Step 9: Deploy Security Rules

Deploy Firestore and Storage security rules:

```bash
# Deploy Firestore rules
firebase --project=codeheroes-test deploy --only firestore:rules

# Deploy Storage rules
firebase --project=codeheroes-test deploy --only storage
```

## Step 10: Deploy Functions

### Build Functions

```bash
nx run-many --targets=build --projects=api,auth-service,game-engine,github-receiver --parallel=4
```

### Deploy

```bash
firebase --project=codeheroes-test deploy --only functions
```

Or using nx:

```bash
nx run firebase-app:firebase -c test deploy --only functions
```

### Note the API URL

After deployment, note the API URL from the output:
```
Function URL (api:api(europe-west1)): https://api-xxxxx-ew.a.run.app
```

Update `environment.test.ts` with this URL.

## Step 11: Configure Blocking Functions

After deploying auth-service functions, configure them in Firebase Console:

1. Go to **Authentication** → **Settings** → **Blocking functions**
2. Set **Before account creation**: `onBeforeUserCreated(europe-west1)`
3. Set **Before sign in**: `onBeforeUserSignIn(europe-west1)`
4. Click **Save**

## Step 12: Seed Database

### Create Service Account Key

1. Go to Firebase Console → Project Settings → Service accounts
2. Click "Generate new private key"
3. Save to `.local/sa/codeheroes-test-firebase-adminsdk.json`

### Run Seeder

```bash
GOOGLE_APPLICATION_CREDENTIALS=".local/sa/codeheroes-test-firebase-adminsdk.json" nx seed database-seeds -c test
```

This seeds:
- `system/settings` - Allowed domains for registration
- `system/counters` - User ID counter
- `users` - User documents
- `users/{id}/connectedAccounts` - GitHub/Strava account links

### Configure Allowed Domains

Edit `libs/database-seeds/src/lib/data/system.local.json` before seeding:

```json
{
  "system": [
    {
      "settings": {
        "allowedDomains": ["@yourcompany.com"]
      },
      "counters": {
        "nextUserId": 20000000
      }
    }
  ]
}
```

Set `allowedDomains` to `[]` to allow any email domain.

## Step 13: Deploy Hosting

### Build App

```bash
nx build app -c test
```

### Deploy

```bash
nx run firebase-app:firebase -c test deploy --only hosting:app
```

Or combined:

```bash
nx build app -c test && nx run firebase-app:firebase -c test deploy --only hosting:app
```

## Step 14: Verify Deployment

### Check App

Visit: https://codeheroes-app-ui-test.web.app

### Check Functions

```bash
firebase --project=codeheroes-test functions:list
```

### Check Firestore Rules

```bash
firebase --project=codeheroes-test firestore:rules:get
```

### Test Login

1. Go to the app URL
2. Sign in with Google (using an allowed domain email)
3. Verify profile loads correctly

## Quick Reference Commands

### Test Environment

```bash
# Deploy everything
nx build app -c test && firebase --project=codeheroes-test deploy

# Deploy only functions
nx run-many --targets=build --projects=api,auth-service,game-engine,github-receiver
firebase --project=codeheroes-test deploy --only functions

# Deploy only hosting
nx build app -c test && nx run firebase-app:firebase -c test deploy --only hosting:app

# Deploy only rules
firebase --project=codeheroes-test deploy --only firestore:rules,storage

# Seed database
GOOGLE_APPLICATION_CREDENTIALS=".local/sa/codeheroes-test-firebase-adminsdk.json" nx seed database-seeds -c test
```

### Production Environment

```bash
# Deploy everything
nx build app -c production && firebase --project=codeheroes-prod deploy

# Deploy only functions
firebase --project=codeheroes-prod deploy --only functions

# Deploy only hosting
nx build app -c production && nx run firebase-app:firebase -c production deploy --only hosting:app

# Seed database
GOOGLE_APPLICATION_CREDENTIALS=".local/sa/codeheroes-prod-firebase-adminsdk.json" nx seed database-seeds -c production
```

## Troubleshooting

### "Could not load the default credentials"

Set the service account key path:
```bash
export GOOGLE_APPLICATION_CREDENTIALS=".local/sa/codeheroes-test-firebase-adminsdk.json"
```

### "Firebase Storage has not been set up"

Storage must be initialized via Firebase Console first (Step 6).

### "permission-denied" Errors in App

Firestore rules not deployed. Run:
```bash
firebase --project=codeheroes-test deploy --only firestore:rules
```

### Profile Page Stuck on "Loading..."

Check browser console for errors. Usually means:
- Firestore rules not deployed
- User not authenticated
- API URL incorrect in environment file

### Functions Not Updating

Force rebuild:
```bash
nx run-many --targets=build --projects=api,auth-service,game-engine,github-receiver --skip-nx-cache
firebase --project=codeheroes-test deploy --only functions
```

### Blocking Functions Not Running

Verify they're configured in Firebase Console:
Authentication → Settings → Blocking functions

## Checklist

Use this checklist when setting up a new environment:

- [ ] Create Firebase project
- [ ] Enable billing (Blaze plan)
- [ ] Create web app and note config values
- [ ] Enable Google Authentication
- [ ] Create Firestore database
- [ ] Initialize Storage via Console
- [ ] Create hosting site
- [ ] Update `.firebaserc` with project
- [ ] Update `.env` with credentials
- [ ] Create/update environment.ts file
- [ ] Deploy Firestore rules
- [ ] Deploy Storage rules
- [ ] Build and deploy functions
- [ ] Configure blocking functions in Console
- [ ] Update apiUrl in environment.ts
- [ ] Rebuild and deploy hosting
- [ ] Create service account key
- [ ] Configure allowed domains in seed data
- [ ] Seed database
- [ ] Test login and profile
