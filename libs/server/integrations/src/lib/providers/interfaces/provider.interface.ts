import { GameAction } from '@codeheroes/types';

export interface SkippedAction {
  skipReason: string;
}

export type GameActionResult = Partial<GameAction> | SkippedAction | null;

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
   * @returns Partial GameAction, SkippedAction with reason, or null if event should be ignored
   */
  mapEventToGameAction(eventType: string, eventData: any, userId: string): GameActionResult;

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
    rawBody?: Buffer | string,
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
