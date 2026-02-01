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
- GitHub CLI installed: `brew install gh` (for webhook setup)
- Logged into Firebase: `firebase login`
- Logged into GitHub: `gh auth login`
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
4. **Upgrade to Identity Platform** (required for blocking functions):
   - Look for "Upgrade to Identity Platform" banner or go to **Settings**
   - Click upgrade and accept terms
   - This enables blocking functions for custom auth logic
5. Go to **Settings** → **Authorized domains**
6. Add your hosting domain (e.g., `codeheroes-app-ui-test.web.app`)

**Important:** Without Identity Platform upgrade, the `auth-service` functions (onBeforeUserCreated, onBeforeUserSignIn) will fail to deploy.

## Step 5: Enable Firestore

1. Go to **Firestore Database**
2. Click "Create database"
3. Select **Production mode** (we'll deploy proper rules)
4. Choose location (recommend `eur3` for Europe or `nam5` for US)

**Important:** Firestore location cannot be changed after creation.

## Step 6: Enable Storage

**Important:** Storage must be initialized via Console before CLI deployment. This cannot be done via CLI.

1. Go to **Storage**
2. Click "Get Started"
3. Select security rules (test mode is fine, we'll deploy proper rules)
4. Choose location (recommend same region as Firestore)

Without this step, `firebase deploy --only storage` will fail.

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

## Step 9: Deploy Security Rules and Indexes

Deploy Firestore rules, indexes, and Storage rules:

```bash
# Deploy Firestore rules
firebase --project=codeheroes-test deploy --only firestore:rules

# Deploy Firestore indexes (required for queries to work)
firebase --project=codeheroes-test deploy --only firestore:indexes

# Deploy Storage rules
firebase --project=codeheroes-test deploy --only storage
```

### Verify Indexes

Check that all indexes are created:

```bash
firebase firestore:indexes --project=codeheroes-test
```

You should see indexes for:
- `activities` - createdAt + type, createdAt + processingResult.xp.awarded
- `connectedAccounts` - externalUserId + provider (collection group)
- `events` - data.action + source.event + createdAt, source.event + createdAt
- `records` - timeframeId + countersLastUpdated
- `users` - active + id

**Note:** Indexes may take a few minutes to build. Webhooks will fail with 500 errors until the `connectedAccounts` collection group index is ready.

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

### Note the Function URLs

After deployment, note the URLs from the output:
```
Function URL (api:api(europe-west1)): https://api-xxxxx-ew.a.run.app
Function URL (github-receiver:gitHubReceiver(europe-west1)): https://githubreceiver-xxxxx-ew.a.run.app
```

Update `environment.test.ts` with the API URL.

### Allow Unauthenticated API Access

By default, Cloud Run functions require IAM authentication. To allow the frontend to access the API without authentication tokens, grant public access:

```bash
gcloud run services add-iam-policy-binding api \
  --region=europe-west1 \
  --member="allUsers" \
  --role="roles/run.invoker" \
  --project=codeheroes-test
```

Verify the policy:

```bash
gcloud run services get-iam-policy api --region=europe-west1 --project=codeheroes-test
```

You should see:
```
bindings:
- members:
  - allUsers
  role: roles/run.invoker
```

**Note:** Without this step, API calls (like leaderboards) will return 403 Forbidden.

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

## Step 14: Configure GitHub Webhooks

Configure webhooks on repositories that should send events to Code Heroes.

### List Existing Webhooks

```bash
gh api repos/OWNER/REPO/hooks --jq '.[] | {id, url: .config.url, active}'
```

### Create Webhook

```bash
gh api repos/OWNER/REPO/hooks \
  -X POST \
  --input - << 'EOF'
{
  "config": {
    "url": "https://githubreceiver-xxxxx-ew.a.run.app",
    "content_type": "json"
  },
  "events": ["*"],
  "active": true
}
EOF
```

Replace:
- `OWNER/REPO` with your repository (e.g., `dutchhackers/codeheroes`)
- `githubreceiver-xxxxx-ew.a.run.app` with your deployed function URL

### Update Existing Webhook

```bash
# Get webhook ID
gh api repos/OWNER/REPO/hooks --jq '.[].id'

# Update webhook URL
gh api repos/OWNER/REPO/hooks/WEBHOOK_ID \
  -X PATCH \
  --input - << 'EOF'
{
  "config": {
    "url": "https://githubreceiver-xxxxx-ew.a.run.app",
    "content_type": "json"
  },
  "events": ["*"],
  "active": true
}
EOF
```

### Verify Webhook Deliveries

Check recent deliveries:

```bash
gh api repos/OWNER/REPO/hooks/WEBHOOK_ID/deliveries \
  --jq '.[:5] | .[] | {id, event, status_code, delivered_at}'
```

Successful deliveries should show `status_code: 200`.

## Step 15: Verify Deployment

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

### Check Firestore Indexes

```bash
firebase firestore:indexes --project=codeheroes-test
```

### Test Login

1. Go to the app URL
2. Sign in with Google (using an allowed domain email)
3. Verify profile loads correctly

### Test Webhook Processing

1. Trigger a GitHub event (push, PR, etc.)
2. Check webhook delivery status: `gh api repos/OWNER/REPO/hooks/WEBHOOK_ID/deliveries`
3. Verify XP was awarded in user's profile or Firestore

## Step 16: Configure Custom Domains (Optional)

Map custom domains to Cloud Run services and Firebase Hosting.

### Prerequisites

- Domain registered and DNS access available
- gcloud CLI installed and authenticated

### Cloud Run Services (API & Webhooks)

Custom domain mappings persist across deployments (tied to service name, not revision).

#### 1. Verify domain ownership

```bash
gcloud domains verify YOUR_DOMAIN --project=PROJECT_ID
```

#### 2. Map custom domain to API service

```bash
# Production
gcloud run domain-mappings create \
  --service=api \
  --domain=api.codeheroes.app \
  --region=europe-west1 \
  --project=codeheroes-prod

# Test
gcloud run domain-mappings create \
  --service=api \
  --domain=api-test.codeheroes.app \
  --region=europe-west1 \
  --project=codeheroes-test
```

#### 3. Map custom domain to GitHub Receiver

```bash
# Production
gcloud run domain-mappings create \
  --service=githubreceiver \
  --domain=webhooks.codeheroes.app \
  --region=europe-west1 \
  --project=codeheroes-prod

# Test
gcloud run domain-mappings create \
  --service=githubreceiver \
  --domain=webhooks-test.codeheroes.app \
  --region=europe-west1 \
  --project=codeheroes-test
```

#### 4. Configure DNS

After creating mappings, gcloud will display DNS records to add:

```
DNS_RECORD_TYPE  DNS_RECORD_NAME                 DNS_RECORD_VALUE
CNAME            api.codeheroes.app              ghs.googlehosted.com.
```

Add these records at your DNS provider.

#### 5. Verify mapping status

```bash
gcloud run domain-mappings list --region=europe-west1 --project=PROJECT_ID
```

### Firebase Hosting (App)

#### 1. Add custom domain in Firebase Console

1. Go to **Hosting** → **Add custom domain**
2. Enter domain (e.g., `codeheroes.app`)
3. Follow DNS verification steps
4. Add the provided DNS records

#### 2. Or via CLI

```bash
firebase hosting:channel:deploy production --project=codeheroes-prod
```

**Note:** Firebase Hosting custom domains are easier to configure via Console as they require DNS verification steps.

### Verify Custom Domains

**Via CLI:**

```bash
# Check Cloud Run mappings
gcloud beta run domain-mappings list --region=europe-west1 --project=PROJECT_ID

# Test endpoints
curl -I https://api.yourdomain.com
curl -I https://webhooks.yourdomain.com
```

**Via Google Cloud Console:**

| View | URL |
|------|-----|
| All domain mappings | `https://console.cloud.google.com/run/domains?project=PROJECT_ID` |
| Specific service | `https://console.cloud.google.com/run/detail/europe-west1/SERVICE_NAME/domainmappings?project=PROJECT_ID` |

Replace `PROJECT_ID` with your Firebase project ID and `SERVICE_NAME` with `api` or `githubreceiver`.

### Update Webhook URLs

After custom domains are active, update GitHub webhooks to use the new URLs:

```bash
gh api repos/OWNER/REPO/hooks/WEBHOOK_ID \
  -X PATCH \
  --input - << 'EOF'
{
  "config": {
    "url": "https://webhooks.codeheroes.app",
    "content_type": "json"
  }
}
EOF
```

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

# Deploy only rules and indexes
firebase --project=codeheroes-test deploy --only firestore:rules,firestore:indexes,storage

# Check indexes
firebase firestore:indexes --project=codeheroes-test

# Seed database
GOOGLE_APPLICATION_CREDENTIALS=".local/sa/codeheroes-test-firebase-adminsdk.json" nx seed database-seeds -c test

# Check function logs
firebase --project=codeheroes-test functions:log --only gitHubReceiver
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

### Webhooks Returning 500 Errors

Check function logs:
```bash
firebase --project=codeheroes-test functions:log --only gitHubReceiver
```

Common causes:
1. **"The query requires an index"** - Deploy indexes:
   ```bash
   firebase --project=codeheroes-test deploy --only firestore:indexes
   ```
2. **"Index is currently building"** - Wait a few minutes for index to build, then retry
3. **User not found** - Ensure database is seeded with user and connectedAccounts

### Functions Not Updating

Force rebuild:
```bash
nx run-many --targets=build --projects=api,auth-service,game-engine,github-receiver --skip-nx-cache
firebase --project=codeheroes-test deploy --only functions
```

### Blocking Functions Not Running

Verify they're configured in Firebase Console:
Authentication → Settings → Blocking functions

### Redeliver Failed Webhooks

After fixing issues, redeliver failed webhooks:
```bash
# Get delivery ID
gh api repos/OWNER/REPO/hooks/WEBHOOK_ID/deliveries --jq '.[0].id'

# Redeliver
gh api repos/OWNER/REPO/hooks/WEBHOOK_ID/deliveries/DELIVERY_ID/attempts -X POST
```

### API Returns 403 Forbidden

The API Cloud Run service requires IAM authentication by default. Allow public access:

```bash
gcloud run services add-iam-policy-binding api \
  --region=europe-west1 \
  --member="allUsers" \
  --role="roles/run.invoker" \
  --project=codeheroes-test
```

### Leaderboard or Highlights Empty

1. Check API is accessible (not returning 403)
2. Verify Firestore indexes are deployed and built
3. Check that user has activities recorded (trigger some webhook events)

## Checklist

Use this checklist when setting up a new environment:

- [ ] Create Firebase project
- [ ] Enable billing (Blaze plan)
- [ ] Create web app and note config values
- [ ] Enable Google Authentication
- [ ] Upgrade to Identity Platform (for blocking functions)
- [ ] Create Firestore database
- [ ] Initialize Storage via Console (required before CLI deploy)
- [ ] Create hosting site
- [ ] Update `.firebaserc` with project
- [ ] Update `.env` with credentials
- [ ] Create/update environment.ts file
- [ ] Deploy Firestore rules
- [ ] Deploy Firestore indexes
- [ ] Deploy Storage rules
- [ ] Build and deploy functions
- [ ] Allow unauthenticated API access (gcloud IAM)
- [ ] Configure blocking functions in Console
- [ ] Update apiUrl in environment.ts
- [ ] Rebuild and deploy hosting
- [ ] Create service account key
- [ ] Configure allowed domains in seed data
- [ ] Seed database
- [ ] Configure GitHub webhooks
- [ ] Test login and profile
- [ ] Verify webhook processing and XP awards

### Optional: Custom Domains

- [ ] Verify domain ownership with gcloud
- [ ] Map custom domain to API service
- [ ] Map custom domain to GitHub Receiver service
- [ ] Configure DNS records
- [ ] Add custom domain to Firebase Hosting
- [ ] Update webhook URLs to use custom domain
