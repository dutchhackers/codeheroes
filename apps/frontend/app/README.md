# Code Heroes App

Real-time activity feed display for TV/public screens. Shows developer activities (commits, PRs, reviews) as they happen.

## Development

### Serve Locally

| Environment       | Command                                       | Description                       |
| ----------------- | --------------------------------------------- | --------------------------------- |
| Local (emulators) | `nx serve app`                      | Uses local Firebase emulators     |
| Test              | `nx serve app --configuration=test` | Connects to test Firebase project |

**URLs:**

- Local: http://localhost:4201
- Emulator UI: http://localhost:4000 (when running with emulators)

### Build

| Environment | Command                                             |
| ----------- | --------------------------------------------------- |
| Test        | `nx build app --configuration=test`       |
| Production  | `nx build app --configuration=production` |

Output: `dist/apps/frontend/app/browser/`

### Bundle Size

Current production bundle size: ~2.6mb initial bundle

**Budget Configuration** (in `project.json`):
- Warning: 2mb
- Error: 3mb

**Future Optimization Opportunities:**
- Analyze bundle composition to identify large or duplicate dependencies
- Implement dynamic imports for Firebase SDK modules to reduce initial bundle size
- Optimize component-level imports and shared modules to avoid pulling in unused code
- Code splitting for large libraries
- Tree shaking unused dependencies
- Consider using Angular PWA optimizations for caching

## Deployment

Code Heroes App is deployed to Firebase Hosting as a separate site.

```bash
# Deploy app only
nx run firebase-app:firebase deploy --only hosting:app

# Deploy all hosting sites (web-legacy + app)
nx run firebase-app:firebase deploy --only hosting
```

## Authentication

- Uses Google Sign-In via Firebase Auth
- Required to access Firestore activity data
- Sign-in button appears on first load

## Features

- Real-time activity feed updates
- Avatar and user display
- Activity type badges (push, PR, review, etc.)
- Responsive layout for various screen sizes

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for developer guidelines, including:

- Firebase AngularFire best practices (avoiding injection context warnings)
- Service and component patterns
- Code style conventions
