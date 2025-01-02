# Codeheroes

A monorepo project built with [Nx](https://nx.dev) workspace architecture.

## Project Structure

### Applications

- [api](apps/api) - Firebase Functions API
- [firebase-app](apps/firebase-app) - Main Firebase application
- [game-engine](apps/game-engine) - Game engine Firebase function
- [github-receiver](apps/github-receiver) - GitHub webhooks receiver Firebase function

### Libraries

- [@codeheroes/common](libs/common) - Shared utilities and models
- [@codeheroes/database-seeds](libs/database-seeds) - Database seeding tools
- [@codeheroes/external-shared](libs/external-shared) - External integrations shared code
- [@codeheroes/github-models](packages/github-models) - GitHub webhook models
- [@codeheroes/migration](libs/migration) - Database migration tools
- [@codeheroes/migration-github-shared](libs/migration-github-shared) - GitHub migration shared code
- [@codeheroes/shared](libs/shared) - Core shared library

## Prerequisites

- Node.js
- Firebase CLI: `npm install -g firebase-tools`
- NX CLI: `npm install -g nx`

## Getting Started

1. Install dependencies:
   ```sh
   npm install
   ```

2. Configure Firebase project

## Contributing

1. Create a feature branch
2. Make your changes
3. Run tests: `nx affected:test`
4. Run lint: `nx affected:lint`
5. Submit a pull request

## License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.