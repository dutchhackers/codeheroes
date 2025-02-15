# Authentication Service

A dedicated Firebase Functions service handling user authentication, creation, and validation triggers for Code Heroes.

## Overview

This service is responsible for managing authentication-related Firebase triggers, ensuring proper user creation and sign-in validation. It provides a clean separation of concerns by isolating authentication logic from the main API.

## Features

- Pre-user creation validation
  - Email domain restrictions
  - Required field validation
  - Existing user handling
- Pre-sign-in validation and logging
- User data synchronization with database

## Firebase Triggers

- `onBeforeUserCreated`: Validates and processes new user creation
- `onBeforeUserSignIn`: Handles pre-sign-in validation and logging

## Dependencies

- Firebase Functions v2
- @codeheroes/common package
  - UserService
  - SettingsService
  - Logger

## Development

- `nx serve auth-service`: Run the service locally
- `nx test auth-service`: Run unit tests
- `nx build auth-service`: Build the service

## Deployment

This service is deployed as a separate Firebase Functions unit. Ensure proper function naming and region configuration in your deployment pipeline.

## Configuration

- Region: Uses default region from @codeheroes/common
- Memory: 2GiB
- Timeout: 120 seconds

## Related Documentation

- [Firebase Authentication Triggers](https://firebase.google.com/docs/functions/auth-events)
- [Firebase Functions v2](https://firebase.google.com/docs/functions)
