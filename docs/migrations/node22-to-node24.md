# Migrating Firebase Functions from Node.js 22 to Node.js 24

This guide documents the migration of CodeHeroes Firebase Functions from Node.js 22 to Node.js 24 runtime.

## Overview

| Item | Before | After |
|------|--------|-------|
| Node.js Runtime | 22 | 24 |
| firebase-tools | ^13.30.0 | ^14.25.0 |
| @types/node | ~22.13.10 | ^24.0.0 |

## Prerequisites

- Node.js 24 installed locally (`nvm install 24`)
- Firebase CLI 14.25.0+ (required for Node.js 24 support)
- Access to deploy Firebase Functions

## Migration Steps

### 1. Update Local Node.js Version

```bash
# Install Node.js 24
nvm install 24

# Update .nvmrc
echo "24" > .nvmrc

# Switch to Node.js 24
nvm use
```

### 2. Update Root package.json

Update the following dependencies:

```json
{
  "devDependencies": {
    "firebase-tools": "^14.25.0",
    "@types/node": "^24.0.0"
  }
}
```

Then regenerate the lock file:

```bash
rm package-lock.json
npm install
```

### 3. Update firebase.json

Change the runtime for all function codebases from `nodejs22` to `nodejs24`:

```json
{
  "functions": [
    {
      "codebase": "api",
      "source": "dist/apps/api",
      "runtime": "nodejs24"
    },
    {
      "codebase": "auth-service",
      "source": "dist/apps/auth-service",
      "runtime": "nodejs24"
    },
    {
      "codebase": "game-engine",
      "source": "dist/apps/game-engine",
      "runtime": "nodejs24"
    },
    {
      "codebase": "github-receiver",
      "source": "dist/apps/github-receiver",
      "runtime": "nodejs24"
    }
  ]
}
```

### 4. Update Function App package.json Files

Each function app has a `package.json` with an `engines` field. Update all of them:

**Files to update:**
- `apps/api/package.json`
- `apps/auth-service/package.json`
- `apps/game-engine/package.json`
- `apps/github-receiver/package.json`

Change:
```json
{
  "engines": {
    "node": "22"
  }
}
```

To:
```json
{
  "engines": {
    "node": "24"
  }
}
```

### 5. Update esbuild Target in project.json Files

Each function app has a `project.json` with an esbuild target. Update all of them:

**Files to update:**
- `apps/api/project.json`
- `apps/auth-service/project.json`
- `apps/game-engine/project.json`
- `apps/github-receiver/project.json`

Change:
```json
{
  "targets": {
    "build": {
      "options": {
        "target": "node22"
      }
    }
  }
}
```

To:
```json
{
  "targets": {
    "build": {
      "options": {
        "target": "node24"
      }
    }
  }
}
```

### 6. Update Documentation References

Search for and update any documentation that references Node.js 22:

```bash
grep -r "Node.js 22\|nodejs22\|Node.js 20" --include="*.md" .
```

Common files to update:
- `CLAUDE.md`
- `docs/local-development/01-prerequisites.md`
- App-specific README files

## Testing Locally

### 1. Verify Node.js Version

```bash
node --version
# Should output v24.x.x
```

### 2. Start Emulators

```bash
nx serve firebase-app
```

Verify the emulator output shows:
```
✔  functions: Using node@24 from host.
```

### 3. Run Simulator Tests

```bash
# Seed database first
FIREBASE_PROJECT_ID=your-project-id nx seed database-seeds

# Test various events
nx serve github-simulator -- push
nx serve github-simulator -- pr open
nx serve github-simulator -- review approve --pr 1
```

## Deployment

### Build Functions

```bash
# Clean and rebuild
rm -rf dist/apps/{api,auth-service,game-engine,github-receiver}
nx run-many --targets=build --projects=api,auth-service,game-engine,github-receiver --skip-nx-cache
```

### Regenerate Lock Files

The generated `package-lock.json` files in `dist/apps/*/` must be in sync with `package.json`. After building, regenerate them:

```bash
for app in api auth-service game-engine github-receiver; do
  cd dist/apps/$app
  rm -f package-lock.json
  npm install --package-lock-only
  cd ../../..
done
```

### Deploy to Firebase

```bash
nx run firebase-app:firebase deploy --only functions --force
```

### Verify Deployment

Check that all functions are running on Node.js 24:

```bash
gcloud functions describe FUNCTION_NAME \
  --region=REGION \
  --project=PROJECT_ID \
  --format="value(buildConfig.runtime)"
```

If some functions show `nodejs22`, force update them:

```bash
gcloud functions deploy FUNCTION_NAME \
  --runtime=nodejs24 \
  --region=REGION \
  --project=PROJECT_ID \
  --gen2 \
  --quiet
```

## Troubleshooting

### npm ci fails with "package.json and package-lock.json out of sync"

This happens when the generated lock file doesn't include all transitive dependencies.

**Solution:** Regenerate the lock file in the dist folder:

```bash
cd dist/apps/FUNCTION_NAME
rm package-lock.json
npm install --package-lock-only
```

### Functions skipped during deployment ("No changes detected")

Firebase compares source hashes and skips unchanged functions. The runtime change alone doesn't trigger a redeploy.

**Solution 1:** Add a trivial change to force redeployment:
```bash
echo "// Node.js 24 migration" >> dist/apps/FUNCTION_NAME/main.js
```

**Solution 2:** Use gcloud to update the runtime directly:
```bash
gcloud functions deploy FUNCTION_NAME --runtime=nodejs24 --region=REGION --project=PROJECT_ID --gen2
```

### Emulators show "Using node@22 from host"

Your local Node.js version is still 22.

**Solution:**
```bash
nvm use 24
# or
nvm use  # if .nvmrc is updated
```

### OpenSSL errors with small keys

Node.js 24 uses OpenSSL 3.5 with security level 2, which prohibits:
- RSA, DSA, DH keys < 2048 bits
- ECC keys < 224 bits

**Solution:** Upgrade to larger key sizes or configure OpenSSL security level (not recommended for production).

## Breaking Changes in Node.js 24

Key changes from Node.js 22 to 24:

1. **OpenSSL 3.5** - Stricter security defaults for cryptographic keys
2. **Crypto module deprecations** - Some `generateKeyPair` methods deprecated
3. **ESM improvements** - Better ES module support

See the [official Node.js migration guide](https://nodejs.org/en/blog/migrations/v22-to-v24) for complete details.

## Files Changed Summary

| File | Change |
|------|--------|
| `.nvmrc` | `22` → `24` |
| `package.json` | firebase-tools, @types/node versions |
| `firebase.json` | runtime: `nodejs22` → `nodejs24` (4 codebases) |
| `apps/*/package.json` | engines.node: `22` → `24` |
| `apps/*/project.json` | target: `node22` → `node24` |
| `docs/**/*.md` | Node.js version references |

## References

- [Firebase Functions Runtime Support](https://firebase.google.com/docs/functions/manage-functions)
- [Node.js v22 to v24 Migration Guide](https://nodejs.org/en/blog/migrations/v22-to-v24)
- [Cloud Functions Release Notes](https://cloud.google.com/functions/docs/release-notes)
- [firebase-tools Releases](https://github.com/firebase/firebase-functions/releases)

## Timeline

| Node.js Version | Status | End of Life |
|-----------------|--------|-------------|
| Node.js 20 | Maintenance LTS | April 2026 |
| Node.js 22 | Active LTS | April 2027 |
| Node.js 24 | Active LTS | April 2028 |

---

*Last updated: February 2026*
