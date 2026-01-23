# GitHub Integration

This guide covers setting up ngrok and configuring GitHub webhooks for local development.

## Default Test Repository

Use the **codeheroes-support** repository for webhook testing:

| Item | Value |
|------|-------|
| GitHub URL | https://github.com/mschilling/codeheroes-support |
| Webhook Settings | https://github.com/mschilling/codeheroes-support/settings/hooks |
| Local Clone | `/Users/michael.schilling/workspace/projects/sideprojects/code-heroes/codeheroes-support` |

This repo is pre-configured with webhooks for both local (ngrok) and production environments.

## Overview

```
┌────────┐           ┌───────┐           ┌─────────────┐
│ GitHub │ webhook → │ ngrok │ tunnel → │ localhost:  │
│  repo  │           │       │           │ 5001        │
└────────┘           └───────┘           └─────────────┘
                       :4040
                    (inspector)
```

GitHub cannot reach your localhost directly. ngrok creates a public HTTPS tunnel that forwards requests to your local Firebase Functions emulator.

## Step 1: Start the Backend

First, ensure your emulators are running:

```bash
nx serve firebase-app
```

Wait until all emulators show as started.

## Step 2: Start ngrok Tunnel

In a new terminal:

```bash
ngrok http 5001
```

You'll see output like:

```
Session Status                online
Account                       your-account
Version                       3.x.x
Region                        United States (us)
Forwarding                    https://abc123.ngrok-free.app -> http://localhost:5001
```

Copy the `https://xxx.ngrok-free.app` URL.

## Step 3: Construct Webhook URL

Your webhook URL format:
```
{ngrok-url}/{project-id}/europe-west1/gitHubReceiver
```

Example:
```
https://abc123.ngrok-free.app/codeheroes-dev/europe-west1/gitHubReceiver
```

## Step 4: Configure GitHub Webhook

1. Go to your test repository on GitHub
2. Navigate to **Settings** > **Webhooks**
3. Click **Add webhook**
4. Configure:

| Field | Value |
|-------|-------|
| Payload URL | Your constructed webhook URL |
| Content type | `application/json` |
| Secret | (optional, for production) |
| SSL verification | Enable (ngrok provides HTTPS) |

5. Select events to trigger:
   - **Push** - Code pushed to repository
   - **Pull requests** - PR opened, closed, merged
   - **Issues** - Issue created, edited, closed
   - Or select "Send me everything"

6. Click **Add webhook**

## Step 5: Test the Integration

### Trigger a Test Event

GitHub sends a ping event when you create the webhook. To test further:

1. **Push event:** Make a commit and push
   ```bash
   git commit --allow-empty -m "Test webhook"
   git push
   ```

2. **Pull request:** Open/close a PR

3. **Issue:** Create a new issue

### Verify in ngrok Inspector

**Web UI:** Open http://localhost:4040 in your browser:
- See all incoming requests
- Inspect request headers and body
- View response status and body
- Replay requests for debugging

**API (for programmatic access / AI agents):**
```bash
# List recent requests
curl -s http://127.0.0.1:4040/api/requests/http

# Get tunnel info (public URL)
curl -s http://127.0.0.1:4040/api/tunnels

# Quick check: count requests and show status
curl -s http://127.0.0.1:4040/api/requests/http | \
  python3 -c "import sys,json; d=json.load(sys.stdin); \
  [print(f\"{r['request']['method']} {r['response']['status']}\") for r in d.get('requests',[])]"
```

### Check Terminal Logs

Watch the terminal where `nx serve firebase-app` is running for function execution logs.

### Check Firestore

Open http://localhost:4000 and navigate to Firestore to see if data was written.

## Webhook Event Flow

```
1. GitHub event occurs (push, PR, issue)
           ↓
2. GitHub sends POST to ngrok URL
           ↓
3. ngrok forwards to localhost:5001
           ↓
4. gitHubReceiver function processes event
           ↓
5. Data written to Firestore
           ↓
6. game-engine triggers via Eventarc (if configured)
```

## Important Notes

### ngrok Session Expiration

Free ngrok accounts have session limits:
- URLs change each time you restart ngrok
- Update your GitHub webhook URL after each restart
- Consider ngrok paid plan for stable URLs

### Webhook Secret (Production)

For production, configure a webhook secret:
1. Generate a secret: `openssl rand -hex 20`
2. Add to GitHub webhook settings
3. Configure in Firebase Functions environment

### Multiple Repositories

You can point multiple repositories to the same ngrok URL. Each webhook will be processed by the same `gitHubReceiver` function.

## Troubleshooting

### Webhook shows "failed" in GitHub

1. Check ngrok is running: `ngrok http 5001`
2. Verify URL format includes project ID and region
3. Check ngrok inspector for error details
4. Review function logs in terminal

### Request reaches ngrok but function errors

1. Open http://localhost:4040
2. Click the failed request
3. Check the response body for error details
4. Review terminal logs for stack traces

### ngrok connection refused

Ensure emulators are running on port 5001:
```bash
lsof -i :5001
```

If empty, restart emulators:
```bash
nx serve firebase-app
```

## Next Steps

- [Debugging Guide](./05-debugging-guide.md) - Deep dive into debugging tools
- [Troubleshooting](./06-troubleshooting.md) - Common issues and solutions
