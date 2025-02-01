import { Event } from '@codeheroes/event';

export interface IEventFormatter {
  getProvider(): string;
  formatDescription(event: Event): string;
}