export const HTTP_STATUS = {
  OK: 200,
  BAD_REQUEST: 400,
  INTERNAL_SERVER_ERROR: 500,
} as const;

export const MESSAGES = {
  // GitHub Events
  MISSING_GITHUB_EVENT: 'Missing GitHub event header',
  MISSING_HEADERS: 'Missing required GitHub webhook headers',
  DUPLICATE_EVENT: 'Duplicate event, skipping.',
  EVENT_PROCESSED: 'Event processed successfully',
  PROCESSING_ERROR: 'Failed to process event',

  // Dynamic messages
  unsupportedEvent: (type: string) => `Unsupported GitHub event type: ${type}`,
  unsupportedAction: (action: string | undefined, type: string) => 
    `Unsupported action '${action}' for event type '${type}'`,
} as const;

export enum ErrorType {
  VALIDATION = 'VALIDATION',
  UNSUPPORTED_EVENT = 'UNSUPPORTED_EVENT',
  GITHUB_EVENT = 'GITHUB_EVENT'
}
