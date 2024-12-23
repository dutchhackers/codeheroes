import { EventSource } from "../enums";

export interface IExternalEvent {
  source: EventSource /** e.g. GITHUB */;
  type: string /** e.g. ISSUE */;
  action?: string /** e.g. CLOSED */;
  data?: any;
}

export interface IEvent extends IExternalEvent {
  timestamp: string;
}

/* 

const example: IExternalEvent = {
  source: EventSource.GITHUB,
  type: 'ISSUE',
  action: 'CLOSED',
  data: {
    user: 'employee@move4mobile.com',
    repository: { name: 'repo-name', owner: 'repo-owner', organization: true },
    project: 'crm-project-id'
  }
};

*/
