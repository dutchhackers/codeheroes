# Prerequisites

This guide lists all tools, versions, and accounts needed to run CodeHeroes locally.

## Required Tools

### Node.js

Node.js 24 is required (specified in `.nvmrc`).

```bash
# Check your version
node --version

# Should output v20.x.x
```

If using nvm:
```bash
nvm use
```

### Firebase CLI

Install globally:
```bash
npm install -g firebase-tools

# Verify installation
firebase --version
```

Login to Firebase:
```bash
firebase login
```

### Nx CLI (Optional but Recommended)

The project uses Nx for monorepo management. While you can use `npx nx`, installing globally improves performance:

```bash
npm install -g nx

# Verify installation
nx --version
```

### ngrok (For GitHub Webhook Testing)

ngrok creates a public tunnel to your local development server, enabling GitHub webhooks to reach your machine.

1. Create a free account at [ngrok.com](https://ngrok.com)
2. Download and install ngrok:
   - macOS: `brew install ngrok`
   - Or download from [ngrok.com/download](https://ngrok.com/download)
3. Authenticate with your auth token:
   ```bash
   ngrok config add-authtoken YOUR_AUTH_TOKEN
   ```
4. Verify installation:
   ```bash
   ngrok --version
   ```

## Required Accounts

### Firebase Project

You need access to a Firebase project with the following services enabled:
- Authentication
- Firestore Database
- Cloud Functions
- Cloud Storage
- Pub/Sub

### GitHub Account

For webhook testing, you need:
- A GitHub account
- A test repository where you can configure webhooks
- Repository admin permissions (to add webhooks)

## Verification Checklist

Run these commands to verify your setup:

```bash
# Node.js (should be v20.x)
node --version

# Firebase CLI
firebase --version

# Nx (optional)
nx --version

# ngrok
ngrok --version
```

All tools installed? Proceed to [Environment Setup](./02-environment-setup.md).
