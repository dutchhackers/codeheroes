# Debugging Guide

This guide covers tools and techniques for debugging the CodeHeroes backend locally.

## Debugging Tools Overview

| Tool | URL | Purpose |
|------|-----|---------|
| Firebase Emulator UI | http://localhost:4000 | Database, auth, functions overview |
| ngrok Inspector | http://localhost:4040 | HTTP request/response inspection |
| Terminal Logs | (where nx serve runs) | Function execution logs |
| VS Code Debugger | - | Breakpoint debugging |

## Firebase Emulator UI

Open http://localhost:4000 after starting emulators.

### Firestore Tab

- Browse all collections and documents
- View document fields and values
- Add/edit/delete documents manually
- Useful for verifying webhook data was written

**Example:** After a GitHub push event, check:
```
collections/
  └── github-events/
      └── {event-id}/
          ├── type: "push"
          ├── repository: "..."
          └── timestamp: ...
```

### Authentication Tab

- View all emulated users
- Add test users manually
- See user metadata and tokens
- Useful for testing auth flows

### Functions Tab

- See all deployed functions
- View function logs
- Check invocation counts
- Note: Limited compared to terminal logs

### Storage Tab

- Browse uploaded files
- Upload test files
- View file metadata

## ngrok Inspector

Open http://localhost:4040 when ngrok is running.

### Inspecting Requests

1. Click any request in the left panel
2. View tabs:
   - **Request:** Headers, body, URL
   - **Response:** Status, headers, body
   - **Timing:** Request/response timing

### Replaying Requests

Useful for debugging without triggering new GitHub events.

#### Browser UI Replay

1. Find the request you want to replay in the left panel
2. Click **Replay** button
3. Optionally modify headers/body before replaying

**Note:** Browser replay uses the same `X-GitHub-Delivery` header, so the system may detect it as a duplicate and return "Event already processed".

#### Programmatic Replay via API

ngrok doesn't expose a direct replay API, but you can extract captured requests and replay them via curl.

**1. List recent requests:**
```bash
curl -s http://127.0.0.1:4040/api/requests/http | python3 -c "
import sys,json
for r in json.load(sys.stdin).get('requests',[])[:5]:
    print(f\"{r['id']}: {r['request']['method']} {r['request']['uri']} -> {r['response']['status']}\")"
```

**2. Get request details by ID:**
```bash
curl -s "http://127.0.0.1:4040/api/requests/http/{request-id}"
```

**3. Extract and save webhook payload:**
```bash
curl -s "http://127.0.0.1:4040/api/requests/http/{request-id}" | python3 -c "
import sys, json, base64
data = json.load(sys.stdin)
raw = data['request'].get('raw', '')
decoded = base64.b64decode(raw).decode('utf-8')
body = decoded.split('\r\n\r\n', 1)[1] if '\r\n\r\n' in decoded else ''
print(body)" > /tmp/webhook_payload.json
```

**4. Replay with a new delivery ID (bypasses duplicate detection):**
```bash
curl -X POST "http://localhost:5001/your-project-id/europe-west1/gitHubReceiver" \
  -H "Content-Type: application/json" \
  -H "X-GitHub-Event: push" \
  -H "X-GitHub-Delivery: replay-$(date +%s)" \
  -d @/tmp/webhook_payload.json
```

#### Event Idempotency

The system uses `X-GitHub-Delivery` header for idempotency:
- Same delivery ID → "Event already processed" (skipped)
- New delivery ID → Event fully processed

This is useful for:
- Testing webhook processing without new GitHub events
- Debugging event handling logic
- Load testing with repeated events

### Filtering Requests

Use the search bar to filter by:
- URL path
- HTTP method
- Status code

## Terminal Logs

Watch the terminal where `nx serve firebase-app` runs.

### Log Levels

```
i  functions: Beginning execution of "gitHubReceiver"
i  functions: Finished "gitHubReceiver" in 234ms
```

### Adding Debug Logs

In your function code:
```typescript
import { logger } from 'firebase-functions';

logger.info('Processing event', { eventType, data });
logger.error('Failed to process', { error });
logger.debug('Detailed info', { fullPayload });
```

### Viewing Full Payloads

For large payloads, use JSON.stringify:
```typescript
logger.info('Webhook payload', JSON.stringify(payload, null, 2));
```

## VS Code Debugging

### Setup

1. Create `.vscode/launch.json`:
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "attach",
      "name": "Attach to Functions",
      "port": 9229,
      "restart": true,
      "skipFiles": ["<node_internals>/**"]
    }
  ]
}
```

2. Start emulators with inspect flag:
```bash
nx run firebase-app:firebase emulators:start --inspect-functions
```

3. In VS Code, press F5 or click "Run and Debug" > "Attach to Functions"

### Setting Breakpoints

1. Open any function file (e.g., `apps/github-receiver/src/app.ts`)
2. Click left of line number to set breakpoint
3. Trigger the function (via webhook or curl)
4. Debugger will pause at breakpoint

### Debugging Tips

- Use "Step Over" (F10) to execute line by line
- Use "Step Into" (F11) to enter function calls
- Check "Variables" panel for current state
- Use "Watch" panel to track specific variables

## Debugging Workflow

### For Webhook Issues

1. **Start emulators:** `nx serve firebase-app`
2. **Start ngrok:** `ngrok http 5001`
3. **Trigger event** from GitHub
4. **Check ngrok inspector** - Did request arrive?
5. **Check terminal logs** - Did function execute?
6. **Check Firestore UI** - Was data written?

### For Function Errors

1. **Check terminal** for error message and stack trace
2. **Check ngrok inspector** response body for error details
3. **Add logger statements** around suspected code
4. **Use VS Code debugger** for complex issues

### For Data Issues

1. **Check Firestore UI** for document structure
2. **Compare expected vs actual** data
3. **Check function logs** for transformation errors
4. **Verify webhook payload** in ngrok inspector

## Common Debugging Scenarios

### Webhook Not Received

1. Verify ngrok is running: `ngrok http 5001`
2. Check GitHub webhook delivery status
3. Verify webhook URL includes correct project ID
4. Check ngrok inspector for any requests

### Function Throws Error

1. Read full error in terminal
2. Check ngrok response body
3. Look for common issues:
   - Missing environment variables
   - Firestore permission errors
   - Invalid data format

### Data Not Written to Firestore

1. Check function logs for errors
2. Verify Firestore rules allow writes
3. Check document path is correct
4. Verify data structure matches expected schema

## Quick Reference for AI Agents

### ngrok API Commands

```bash
# Get ngrok public URL
curl -s http://127.0.0.1:4040/api/tunnels | python3 -c "import sys,json; print(json.load(sys.stdin)['tunnels'][0]['public_url'])"

# List recent webhook requests (method, path, status)
curl -s http://127.0.0.1:4040/api/requests/http | python3 -c "
import sys,json
for r in json.load(sys.stdin).get('requests',[])[:5]:
    print(f\"{r['request']['method']} {r['request']['uri']} -> {r['response']['status']}\")"

# Get request details by ID
curl -s "http://127.0.0.1:4040/api/requests/http/{request-id}"

# Replay webhook with new delivery ID (processes as new event)
curl -X POST "http://localhost:5001/your-project-id/europe-west1/gitHubReceiver" \
  -H "Content-Type: application/json" \
  -H "X-GitHub-Event: push" \
  -H "X-GitHub-Delivery: replay-$(date +%s)" \
  -d @/tmp/webhook_payload.json
```

### Verification Commands

```bash
# Check emulator ports are listening
lsof -i :5001  # Functions
lsof -i :8080  # Firestore
lsof -i :4000  # Emulator UI

# Verify ngrok is running
curl -s http://127.0.0.1:4040/api/status

# Test webhook endpoint directly
curl -X POST "http://localhost:5001/your-project-id/europe-west1/gitHubReceiver" \
  -H "Content-Type: application/json" \
  -d '{"test": true}'
```

### Key URLs

| Service | URL |
|---------|-----|
| Emulator UI | http://localhost:4000 |
| Firestore UI | http://localhost:4000/firestore |
| ngrok Inspector | http://localhost:4040 |
| ngrok API | http://127.0.0.1:4040/api |
| Functions | http://localhost:5001 |

## Next Steps

- [Troubleshooting](./06-troubleshooting.md) - Common issues and solutions
