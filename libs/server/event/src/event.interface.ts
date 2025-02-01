import { Event } from './event.model';

export interface IEventFormatter {
  getProvider(): string;
  formatDescription(event: Event): string;
}