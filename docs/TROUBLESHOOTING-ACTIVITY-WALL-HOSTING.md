# Troubleshooting: Activity Wall Firebase Hosting Deployment

## Goal
Deploy the `activity-wall` Angular app to Firebase Hosting as a second site alongside the main `web` app.

## Current State

### What Works
- `nx build activity-wall --configuration=test` builds successfully
- Build output is correct at `dist/apps/activity-wall/browser/` containing:
  - `index.html`
  - `main.js`, `polyfills.js`, `styles.css`
  - Source maps and favicon
- `firebase deploy --only hosting:activity-wall` reports success
- Firebase CLI shows releases exist on the `live` channel

### What Doesn't Work
- The deployed site returns **404 "Site Not Found"** on all URLs:
  - https://codeheroes-activity-wall.web.app/
  - https://codeheroes-activity-wall.web.app/index.html
  - https://codeheroes-activity-wall.web.app/main.js
- Preview channels also return 404
- Multiple site recreations haven't helped

## Configuration Files

### firebase.json (hosting section)
```json
"hosting": [
  {
    "target": "web",
    "public": "dist/apps/web/browser",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [{ "source": "**", "destination": "/index.html" }]
  },
  {
    "target": "activity-wall",
    "public": "dist/apps/activity-wall/browser",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [{ "source": "**", "destination": "/index.html" }]
  }
]
```

### .firebaserc
```json
{
  "projects": {
    "default": "codeheroes-app-test"
  },
  "targets": {
    "codeheroes-app-test": {
      "hosting": {
        "web": ["codeheroes-app-test"],
        "activity-wall": ["codeheroes-activity-wall"]
      }
    }
  }
}
```

## What We've Tried
1. Created hosting site: `firebase hosting:sites:create codeheroes-activity-wall-test`
2. Applied target: `firebase target:apply hosting activity-wall codeheroes-activity-wall-test`
3. Deployed: `firebase deploy --only hosting:activity-wall`
4. Deleted and recreated site with different name (`codeheroes-activity-wall`)
5. Deployed to preview channel - same 404 result
6. Verified dist folder structure is correct
7. Waited for propagation - still 404

## Observations
- Deploy logs show "8 files found" and "release complete"
- Debug logs show `uploads queued: 0` (files cached from previous upload)
- `firebase hosting:channel:list` shows releases exist
- HTTP response is always 404 with Firebase's "Site Not Found" page

## Possible Causes to Investigate
1. **Multi-site config issue**: Converting from single-site to array format may have broken something
2. **Site provisioning delay**: New sites might need more time to become active
3. **Target linking issue**: The target may not be correctly linked to the site
4. **GCP project permissions**: Site might be created but not properly associated
5. **CDN/DNS propagation**: Unlikely since even direct requests fail

## Commands for Verification

```bash
# Check site exists
firebase hosting:sites:list --project codeheroes-app-test

# Check releases
firebase hosting:channel:list --site codeheroes-activity-wall --project codeheroes-app-test

# Check targets
cat .firebaserc

# Test deployment
curl -sI https://codeheroes-activity-wall.web.app/

# Deploy with debug
firebase deploy --only hosting:activity-wall --project codeheroes-app-test --debug
```

## Expected Outcome
- https://codeheroes-activity-wall.web.app should serve the Angular app
- Should show login screen (Google Sign-In required for Firestore access)
