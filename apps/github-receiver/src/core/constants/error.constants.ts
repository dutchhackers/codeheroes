export const ERROR_MESSAGES = {
  MISSING_HEADERS: 'Missing required GitHub webhook headers',
  UNSUPPORTED_EVENT: (type: string) => `Unsupported GitHub event type: ${type}`,
  UNSUPPORTED_ACTION: (action: string | undefined, type: string) => 
    `Unsupported action '${action}' for event type '${type}'`,
} as const;
