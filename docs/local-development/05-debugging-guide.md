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

Useful for debugging without triggering new GitHub events:

1. Find the request you want to replay
2. Click **Replay** button
3. Optionally modify headers/body before replaying

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

## Next Steps

- [Troubleshooting](./06-troubleshooting.md) - Common issues and solutions
