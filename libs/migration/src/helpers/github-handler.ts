import * as logger from "firebase-functions/logger";
import { db } from "../core/config/firebase.config";
import { IssueEvent, PullRequestAction, PullRequestEvent, PullRequestReviewEvent, PushEvent, ReleaseEvent } from "@codeheroes/migration-github-shared";
import {
  IActivity,
} from "../core/models";
import { Publisher } from "../core/utils/publisher";
import { PUB_SUB_PROJECT_ID } from "../core/config/app.config";
import { PublisherTopics } from "../core/utils/publisher-topics";
import { LookupService } from "../core/services/lookup-service";

export async function githubHandler(req, res, next) {
  // console.log('headers: ' + JSON.stringify(req.headers));
  // console.log("body: " + JSON.stringify(req.body));

  logger.info("Headers", req.headers, { structuredData: true });
  logger.info("Handle GitHub webhook via new entrypoint", req.body, { structuredData: true });

  const githubEvent = req.headers["x-github-event"];
  console.log("githubEvent", githubEvent);

  switch (githubEvent) {
    case "pull_request":
      await handlePullRequest(req);
      next();
      break;
    case "pull_request_review":
      await handlePullRequestReview(req);
      next();
      break;
    case "issues":
      await handleIssue(req);
      next();
      break;
    case "push":
      await handlePushes(req);
      next();
      break;
    case "release":
      await handleRelease(req);
      next();
      break;
    default:
      next();
      break;
  }
}
async function handlePullRequest(req) {
  const prAction = req.body.action;
  console.log(prAction);

  switch (prAction) {
    case PullRequestAction.Opened:
    case PullRequestAction.Closed:
      try {
        const prEvent = new PullRequestEvent(req.body);
        await publishPullRequest(prEvent);
      } catch (error) {
        console.error("githubHandler error", error);
      }
      break;
    default:
      console.log(`Could not match action opened or closed. Got ${req.body.action} instead.`);
      break;
  }
}

async function handlePullRequestReview(req) {
  const prAction = req.body.action;
  console.log(prAction);

  switch (prAction) {
    case "submitted":
      try {
        const prEvent = new PullRequestReviewEvent(req.body);
        await publishPullRequestReview(prEvent);
      } catch (error) {
        console.error("githubHandler error", error);
      }
      break;
    default:
      console.log(`Could not match action 'submitted'. Got ${req.body.action} instead.`);
      break;
  }
}

async function handleIssue(req) {
  const prAction = req.body.action;
  console.log(prAction);

  switch (prAction) {
    case "opened":
    case "closed":
      try {
        const evt = new IssueEvent(req.body);
        await publishIssue(evt);
      } catch (error) {
        console.error("githubHandler error", error);
      }
      break;
    default:
      console.log(`Could not match action 'opened' or 'closed'. Got ${req.body.action} instead.`);
      break;
  }
}

async function handleRelease(req) {
  const prAction = req.body.action;
  console.log("handleRelease action =" + prAction);

  switch (prAction) {
    case "published":
      try {
        const evt = new ReleaseEvent(req.body);
        await publishRelease(evt);
      } catch (error) {
        console.error("githubHandler error", error);
      }
      break;
    default:
      console.log(`Could not match action 'published'. Got ${req.body.action} instead.`);
      break;
  }
}

async function handlePushes(req) {
  if (req.body.head_commit) {
    try {
      console.info("Handle Pushes event");
      const evt = new PushEvent(req.body);
      await publishPush(evt);
    } catch (error) {
      console.error("githubHandler error", error);
    }
  }
}

async function publishPullRequest(evt: PullRequestEvent) {
  console.log("publishPullRequest", evt);

  const lookupService = new LookupService();

  let user = evt.sender.login;
  if (evt.action === PullRequestAction.Opened) {
    user = evt.pullRequest.user.login;
  } else if (evt.action === PullRequestAction.Closed) {
    user = evt.pullRequest.mergedBy.login;
  }

  const employee = await lookupService.findEmployeeByGithubLogin(user);

  const activity: any = {};
  activity.id = evt.pullRequest.id;
  activity.timestamp = new Date().toISOString();
  activity.message = evt.pullRequest.title;
  activity.user = employee.email;
  activity.repo = evt.repository.fullName;

  activity.eventType = "github-events";
  activity.eventData = {
    ...evt.pullRequest,
    event: "pull_request",
    action: evt.action,
  };

  const publisher = new Publisher(PUB_SUB_PROJECT_ID);
  publisher.publish(activity, PublisherTopics.GithubEvents);
}

async function publishPullRequestReview(evt: PullRequestReviewEvent) {
  console.log("publishPullRequestReview", evt);

  const lookupService = new LookupService();

  const user = evt.review.user.login;
  const employee = await lookupService.findEmployeeByGithubLogin(user);

  const activity: any = {};
  activity.id = evt.pullRequest.id;
  activity.timestamp = new Date().toISOString();
  activity.message = evt.pullRequest.title;
  activity.user = employee.email;
  activity.repo = evt.repository.fullName;

  activity.eventType = "github-events";
  activity.eventData = {
    ...evt,
    event: "pull_request_review",
    action: evt.action,
  };

  const publisher = new Publisher(PUB_SUB_PROJECT_ID);
  publisher.publish(activity, PublisherTopics.GithubEvents);
}

async function publishIssue(evt: IssueEvent) {
  console.log("publishIssue", evt);

  const lookupService = new LookupService();

  const user = evt.sender.login;
  const employee = await lookupService.findEmployeeByGithubLogin(user);

  const activity: any = {};
  activity.id = evt.issue.id;
  activity.timestamp = new Date().toISOString();
  activity.message = evt.issue.title;
  activity.user = employee.email;
  activity.repo = evt.repository.fullName;

  activity.eventType = "github-events";
  activity.eventData = {
    ...evt,
    event: "issues",
    action: evt.action,
  };

  const publisher = new Publisher(PUB_SUB_PROJECT_ID);
  publisher.publish(activity, PublisherTopics.GithubEvents);
}

async function publishRelease(evt: ReleaseEvent) {
  console.log("publishRelease", evt);

  const lookupService = new LookupService();

  const user = evt.sender.login;
  const employee = await lookupService.findEmployeeByGithubLogin(user); // OR=> author id ??

  const activity: any = {};
  activity.id = evt.release.id;
  activity.timestamp = new Date().toISOString();
  activity.message = evt.release.name;
  activity.user = employee.email;
  activity.repo = evt.repository.fullName;

  activity.eventType = "github-events";
  activity.eventData = {
    ...evt,
    event: "release",
    action: evt.action,
  };

  const publisher = new Publisher(PUB_SUB_PROJECT_ID);
  publisher.publish(activity, PublisherTopics.GithubEvents);
}

async function publishPush(evt: PushEvent) {
  console.log("publishPush (new)", evt);

  const lookupService = new LookupService();

  const user = evt.sender.login;
  const employee = await lookupService.findEmployeeByGithubLogin(user);

  const activity = <IActivity>{};
  activity.id = evt.push.headCommit.id;
  activity.timestamp = new Date().toISOString();
  activity.message = evt.push.headCommit ? evt.push.headCommit.message : "No message";
  activity.user = employee.email;
  activity.repo = evt.repository.fullName;

  activity.eventType = "github-events";
  activity.eventData = {
    ...evt.push,
    event: "push",
  };

  // New: clean event args
  activity.eventArgs = await evt.resolveEventArguments(db);
  console.log("[GitHub handler] [Publish Push] [EventArgs] ...", activity.eventArgs);

  const publisher = new Publisher(PUB_SUB_PROJECT_ID);
  await publisher.publishMessage(activity, PublisherTopics.GithubEvents);
}
