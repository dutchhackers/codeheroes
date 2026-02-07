# Codeheroes

A monorepo project built with [Nx](https://nx.dev) workspace architecture.

## Project Structure

### Applications

- [api](apps/api) - Firebase Functions API
- [auth-service](apps/auth-service) - Authentication service for user management
- [firebase-app](apps/firebase-app) - Main Firebase application
- [game-engine](apps/game-engine) - Game engine Firebase function
- [github-receiver](apps/github-receiver) - GitHub webhooks receiver Firebase function
- [app](apps/frontend/app) - Main PWA application

### Libraries

#### Shared Libraries (Cross-platform)

> Libraries that can be used in both server and client applications

- [@shared/github-interfaces](libs/shared/github-interfaces) - GitHub interface definitions

#### Server Libraries (Backend Only)

- [@codeheroes/activity](libs/server/activity) - Activity tracking and processing
- [@codeheroes/common](libs/server/common) - Core utilities and shared functions
- [@codeheroes/event](libs/server/event) - Event handling and processing
- [@codeheroes/gamify](libs/server/gamify) - Gamification logic and rules
- [@codeheroes/providers](libs/server/providers) - Shared service providers

#### Legacy Libraries (Deprecated)

> The following libraries are deprecated and will be removed in future versions:

- [@codeheroes/migration](libs/migration/migration) - Legacy Core library
- [@codeheroes/migration-shared](libs/migration/migration-shared) - Legacy core models library

> Note: Database seeds library is maintained for development purposes:

- [@codeheroes/database-seeds](libs/database-seeds) - Database seeding tools

## Prerequisites

- Node.js
- Firebase CLI: `npm install -g firebase-tools`
- NX CLI: `npm install -g nx`

## Getting Started

1. Install dependencies:

   ```sh
   npm install
   ```

2. Configure Firebase project:

   - Create a `.env` file in the root directory with the following variables:
     ```sh
     FIREBASE_PROJECT_ID=your-firebase-project-id
     FIREBASE_API_KEY=your-firebase-api-key
     FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
     FIREBASE_STORAGE_BUCKET=your-project.appspot.com
     FIREBASE_MESSAGING_SENDER_ID=your-sender-id
     FIREBASE_APP_ID=your-app-id
     ```
   - These values can be found in your Firebase Console under Project Settings > General
   - Run the setup script to generate environment files:
     ```sh
     npm run setup
     ```
     This will:
   - Generate `.firebaserc` file with your project ID
   - Create environment files for the web applications:
     - `apps/frontend/app/src/environments/environment.local.ts` (development)
     - `apps/frontend/app/src/environments/environment.prod.ts` (production)

3. Start development environment:

   - To start the Firebase emulator suite with the firebase-app:
     ```sh
     nx serve firebase-app
     ```
     This will:
   - Start the Firebase emulators (Functions, Firestore, Auth, etc.)
   - Watch for code changes and rebuild automatically
   - Import/export emulator data from `.emulators` directory

4. Access development environment:
   - Firebase Emulator UI: http://localhost:4000
   - Functions Emulator: http://localhost:5001
   - Firestore Emulator: http://localhost:8080
   - Auth Emulator: http://localhost:9099

## Documentation

For a comprehensive overview of all features and screens in the application, see:
- **[Features Overview](docs/FEATURES.md)** - Complete list of all UI screens and functionalities (in Dutch)

Additional documentation:
- [Architecture](docs/architecture/) - System architecture and design
- [Contributing Guidelines](docs/contributing/) - How to contribute to the project

## Contributing

1. Create a feature branch
2. Make your changes
3. Run tests: `nx affected:test`
4. Run lint: `nx affected:lint`
5. Submit a pull request

## License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.
