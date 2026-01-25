# Activity Wall

Real-time activity feed display for TV/public screens. Shows developer activities (commits, PRs, reviews) as they happen.

## Development

### Serve Locally

| Environment        | Command                                        | Description                        |
| ------------------ | ---------------------------------------------- | ---------------------------------- |
| Local (emulators)  | `nx serve activity-wall`                       | Uses local Firebase emulators      |
| Test               | `nx serve activity-wall --configuration=test`  | Connects to test Firebase project  |

**URLs:**

- Local: http://localhost:4201
- Emulator UI: http://localhost:4000 (when running with emulators)

### Build

| Environment | Command                                        |
| ----------- | ---------------------------------------------- |
| Test        | `nx build activity-wall --configuration=test`  |
| Production  | `nx build activity-wall --configuration=production` |

Output: `dist/apps/activity-wall/browser/`

## Deployment

Activity Wall is deployed to Firebase Hosting as a separate site.

```bash
# Deploy activity-wall only
nx run firebase-app:firebase deploy --only hosting:activity-wall

# Deploy all hosting sites (web + activity-wall)
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
