# Environment Setup

This guide covers configuring environment variables and running the setup script.

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Create Environment File

Create a `.env` file in the project root with your Firebase configuration:

```bash
cp .env.example .env
```

Edit `.env` with your Firebase project values:

```env
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_API_KEY=your-api-key
FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
FIREBASE_MESSAGING_SENDER_ID=your-sender-id
FIREBASE_APP_ID=your-app-id
FIREBASE_VAPID_KEY=your-vapid-key
```

### Where to Find These Values

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Click the gear icon > Project settings
4. Scroll to "Your apps" section
5. Select your web app (or create one)
6. Copy the config values from the Firebase SDK snippet

For `FIREBASE_VAPID_KEY`:
1. Go to Project settings > Cloud Messaging
2. Under "Web Push certificates", generate a key pair
3. Copy the Key pair value

## Step 3: Run Setup Script

The setup script generates configuration files from your environment variables:

```bash
npm run setup
```

### What This Script Does

The script (`scripts/setup-firebase.js`) generates:

| Generated File | Template | Purpose |
|----------------|----------|---------|
| `.firebaserc` | `.firebaserc.template` | Firebase project targeting |
| `apps/frontend/web-legacy/src/environments/environment.local.ts` | `environment.ts.template` | Local Angular config |
| `apps/frontend/web-legacy/src/environments/environment.prod.ts` | `environment.ts.template` | Production Angular config |
| `apps/frontend/web-legacy/public/firebase-messaging-sw.js` | `firebase-messaging-sw.js.template` | Push notification service worker |
| `apps/frontend/app/src/environments/environment.local.ts` | `environment.local.ts.template` | Local App config |
| `apps/frontend/app/src/environments/environment.prod.ts` | `environment.prod.ts.template` | Production App config |

## Step 4: Verify Generated Files

Check that all files were generated:

```bash
# Firebase project config
cat .firebaserc

# Angular environment files (legacy)
ls -la apps/frontend/web-legacy/src/environments/

# Angular environment files (app)
ls -la apps/frontend/app/src/environments/

# Service worker
ls -la apps/frontend/web-legacy/public/firebase-messaging-sw.js
```

Expected `.firebaserc` content:
```json
{
  "targets": {},
  "projects": {
    "default": "your-project-id"
  }
}
```

## Troubleshooting

### "Missing environment variable" error

Ensure all required variables are in `.env`:
- `FIREBASE_PROJECT_ID`
- `FIREBASE_API_KEY`
- `FIREBASE_AUTH_DOMAIN`
- `FIREBASE_STORAGE_BUCKET`
- `FIREBASE_MESSAGING_SENDER_ID`
- `FIREBASE_APP_ID`
- `FIREBASE_VAPID_KEY`

### Template file not found

Ensure these template files exist:
- `.firebaserc.template`
- `apps/frontend/web-legacy/src/environments/environment.ts.template`
- `apps/frontend/web-legacy/public/firebase-messaging-sw.js.template`
- `apps/frontend/app/src/environments/environment.local.ts.template`
- `apps/frontend/app/src/environments/environment.prod.ts.template`

### Setup complete?

Proceed to [Running Locally](./03-running-locally.md).
