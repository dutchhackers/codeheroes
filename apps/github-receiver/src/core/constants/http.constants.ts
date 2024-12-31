export const HTTP_STATUS = {
  OK: 200,
  BAD_REQUEST: 400,
  INTERNAL_SERVER_ERROR: 500,
} as const;

export const HTTP_MESSAGES = {
  MISSING_GITHUB_EVENT: 'Missing GitHub event header',
  DUPLICATE_EVENT: 'Duplicate event, skipping.',
  EVENT_PROCESSED: 'Event processed successfully',
  UNSUPPORTED_EVENT: (type: string) => `Event type '${type}' not supported`,
  PROCESSING_ERROR: 'Failed to process event',
} as const;
