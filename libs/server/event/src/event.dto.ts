import { WebhookEvent } from "./event.model";

export type CreateEventInput = Omit<WebhookEvent, 'id' | 'createdAt' | 'updatedAt'>;
