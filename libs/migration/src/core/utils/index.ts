export * from "./logger.util";

export function parsePubSubEvent(message: any): IExternalEvent {
  const data = message.json as IExternalEvent;
  return data;
}

export const groupBy = function (xs, key) {
  return xs.reduce(function (rv, x) {
    (rv[x[key]] = rv[x[key]] || []).push(x);
    return rv;
  }, {});
};

/*
 *
 *** TODO: cleanup and refactor to other files
 *
 */

enum EventSource {
  GITHUB = "GITHUB",
  TRAVIS = "TRAVIS",
  FRESHDESK = "FRESHDESK",
  JIRA = "JIRA",
}

interface IExternalEvent {
  source: EventSource;
  type: string;
  action?: string;
  data?: any;
  timestamp: string;
}
