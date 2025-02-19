import { ActivityData } from '@codeheroes/common';
import { Event } from '@codeheroes/event';
import { ActivityType } from '@codeheroes/shared/types';

export interface ActivityHandler {
  canHandle(event: Event): boolean;
  handle(event: Event): ActivityData;
  generateDescription(event: Event): string;
  getActivityType(): ActivityType;
}
