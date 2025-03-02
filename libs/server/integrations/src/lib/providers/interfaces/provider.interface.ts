import { GameAction } from '@codeheroes/shared/types';

/**
 * Interface for external provider adapters
 * Standardizes the integration with different source control systems
 */
export interface ProviderAdapter {
  /**
   * Provider identifier
   */
  readonly providerName: string;

  /**
   * Maps an external event to a game action
   * @param eventType Type of event from the provider
   * @param eventData Event payload data
   * @param userId User ID for the game action
   * @returns Partial GameAction or null if event should be skipped
   */
  mapEventToGameAction(eventType: string, eventData: any, userId: string): Partial<GameAction> | null;

  /**
   * Validates webhook request
   * @param headers Request headers
   * @param body Request body
   * @param secret Optional secret for validation
   * @returns Validation result with success flag and optional error
   */
  validateWebhook(
    headers: Record<string, string | string[] | undefined>,
    body: any,
    secret?: string,
  ): {
    isValid: boolean;
    error?: string;
    eventType?: string;
    eventId?: string;
  };

  /**
   * Extracts user identifier from event data
   * @param eventData Event payload data
   * @returns External user ID if found
   */
  extractUserId(eventData: any): string | undefined;
}
