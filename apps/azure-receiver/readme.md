# azure-receiver

Firebase Cloud Function that processes incoming webhook events from Azure DevOps and transforms them into the CodeHeroes standardized event format.

## Purpose

This function serves as the integration point between Azure DevOps and the CodeHeroes platform. It accepts webhook notifications from Azure DevOps services, validates the payloads, and converts them into a common event structure for downstream processing.

## Key Responsibilities

- Accept HTTP POST requests from Azure DevOps webhook subscriptions
- Validate incoming webhook signatures and payload structure
- Transform Azure DevOps event data into CodeHeroes internal format
- Store raw webhook data for auditing and troubleshooting
- Detect and prevent duplicate event processing
- Return appropriate HTTP status codes based on processing results

## Technical Details

### Runtime Environment
- Node.js 24
- Firebase Cloud Functions
- Built with esbuild for optimal performance
- ESM module format

### Build Configuration
The application uses NX build system with esbuild executor for:
- Fast compilation times
- Tree-shaking and bundling
- Automatic package.json generation
- Asset management

### Testing
Jest is configured for unit and integration testing:
- Test files: `*.spec.ts` or `*.test.ts`
- Coverage reports generated in `/coverage/apps/azure-receiver`
- Node test environment

### Deployment
Deployed as part of the firebase-app using:
```bash
nx deploy azure-receiver
```

This command builds the function and deploys it to Firebase with the name `azure-receiver`.

## Azure DevOps Event Support

The function handles various Azure DevOps webhook event types:
- Work item updates (creation, modification, state changes)
- Git push events (commits, branches)
- Pull request events (created, updated, completed)
- Build completion events
- Release deployment events

Each event type is processed and mapped to the corresponding CodeHeroes event structure.

## Development

### Running Tests
```bash
nx test azure-receiver
```

### Building Locally
```bash
nx build azure-receiver
```

### Linting
```bash
nx lint azure-receiver
```

## Function Export

The main Firebase function is exported as `azureReceiver` from `main.ts` and handles HTTP requests at the configured endpoint.
