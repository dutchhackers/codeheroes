export enum EventSource {
  GITHUB = "GITHUB",
  TRAVIS = "TRAVIS",
  FRESHDESK = "FRESHDESK",
  JIRA = "JIRA",
}

export interface IExternalEvent {
  source: EventSource;
  type: string;
  action?: string;
  data?: any;
  timestamp: string;
}
