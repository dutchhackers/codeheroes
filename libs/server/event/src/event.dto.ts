import { Event } from "./event.model";

export type CreateEventInput = Omit<Event, 'id' | 'createdAt' | 'updatedAt'>;
