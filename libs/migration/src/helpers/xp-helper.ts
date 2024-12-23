import { XpData } from "../core/models/xp-data";
import { IExternalEvent } from "../core/models/external-event";

export async function calculateXpData(event: IExternalEvent): Promise<XpData> {
  console.log("[calculateXpData]", JSON.stringify(event));

  const eventData = event.data || {};

  const xpData = new XpData();

  const xp = getXpValue(event);
  const userId = eventData.employee;
  if (userId) {
    xpData.addUserXpItem(userId, xp);
  } else {
    console.log("[INFO] [calculateXpData] no user found", event);
  }
  return Promise.resolve(xpData);
}

function getXpValue(event: IExternalEvent): number {
  const key = [event.source.toString(), event.type, event.action].filter(p => p).join("_");

  const xp: any = {};

  // GITHUB
  xp["GITHUB_PUSH"] = 50;
  xp["GITHUB_PUSH_COMMIT"] = 50; // Should change name <<

  xp["GITHUB_PULL_REQUEST_OPENED"] = 100;
  xp["GITHUB_PULL_REQUEST_CLOSED"] = 120;

  xp["GITHUB_ISSUE_OPENED"] = 75;
  xp["GITHUB_ISSUE_CLOSED"] = 50;

  // JIRA
  xp["JIRA_ISSUE_OPENED"] = 30;
  xp["JIRA_ISSUE_UPDATED"] = 10;
  xp["JIRA_ISSUE_CLOSED"] = 30;

  return xp[key] || 0;
}
