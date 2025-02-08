# github-receiver

A Firebase Cloud Function that receives and processes GitHub webhook events. This function is part of the CodeHeroes platform and is responsible for handling various GitHub events, parsing them into a standardized format, and storing them for further processing.

## Overview

The github-receiver function:
- Receives GitHub webhook events
- Validates and parses webhook payloads
- Stores raw event data for audit purposes
- Processes events into standardized formats
- Prevents duplicate event processing
- Handles errors gracefully with appropriate HTTP responses

## Project Structure

### Parser Architecture

The application uses a dedicated parser system to handle different types of GitHub webhook events. Each event type has its own parser implementation:

```
src/
  app.ts                    # Main application entry point
  main.ts                   # Firebase function initialization
  core/
    constants/             # Application and GitHub-specific constants
    errors/               # Custom error handling
    interfaces/           # TypeScript interfaces for GitHub events
    utils/               # Helper utilities
  parsers/
    event-parsers/        # One parser file per GitHub event type
      base.parser.ts      # Base abstract parser class
      delete.parser.ts    # Parser for delete events
      issue.parser.ts     # Parser for issue events
      pull-request.parser.ts # Parser for pull request events
      push.parser.ts      # Parser for push events
      ...
    factory.ts           # Factory to create appropriate parser instance
    github.parser.ts     # Parser exports
  processor/
    event-processor.ts   # Main event processing logic
    utils.ts            # Processing utilities
```

### Parser System

Each parser:
- Extends the base `GitHubParser` class
- Implements specific parsing logic for its event type
- Converts raw GitHub webhook payload into standardized internal event format
- Handles event-specific data structures and validation

The parser system is designed to be extensible - new GitHub event types can be supported by:
1. Adding a new parser class in `event-parsers/`
2. Extending the factory to support the new event type
3. Updating the GitHub constants with the new event type and actions

### Supported Events

Currently supported GitHub events:
- Push events
- Pull Request events (open, close, sync, etc.)
- Issue events (open, close, edit, reopen)
- Pull Request Review events
- Pull Request Review Thread events
- Pull Request Review Comment events
- Delete events (branch, tag)

### Error Handling

The application implements a robust error handling system:
- Validation errors for malformed requests
- Unsupported event handling
- Duplicate event detection
- Graceful error responses with appropriate HTTP status codes

## Development

### Prerequisites
- Node.js 20
- Firebase CLI
- NX workspace tools

### Adding New Event Types

1. Create a new parser in `src/parsers/event-parsers/`
2. Add event type to `GitHubEventConfig` in `github.constants.ts`
3. Update interfaces in `github.interfaces.ts`
4. Add the parser to the factory class
5. Add appropriate tests

