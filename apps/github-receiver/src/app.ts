import express from 'express';
// import { CheckSuiteEvent, CheckRunEvent } from "../../../../.local/migrate/libs/core/models";
// import { githubHandler } from "../../../../.local/migrate/libs/helpers/github-handler";
import * as logger from 'firebase-functions/logger';

const app = express();

app.use('/', async (req, res, next) => {
  const response = {
    source: null,
    echo: req.headers,
    succes: true,
    timestamp: new Date().toISOString(),
  };

  if (req.method !== 'POST') {
    res.send(`Method ${req.method} is not supported`);
    return;
  }

  const host = req.headers['x-forwarded-host'] || req.headers['host'];
  logger.info('Handle webhook for host: ' + host, { structuredData: true });
  // logger.info("Handle webhook for host: " + host);

  switch (host) {
    case 'aedc-86-82-222-18.ngrok-free.app':
    case 'ae13-86-82-222-18.ngrok-free.app':
    case 'dev.github.webhooks.m4m.io':
    case 'github.webhooks.m4m.io':
      response.source = 'github';

      logger.log('Handle GitHub webhook via new entrypoint', { structuredData: true });

      // if (req.headers["x-github-event"] === "check_suite") {
      //   handleCheckSuite(req);
      // } else if (req.headers["x-github-event"] === "check_run") {
      //   handleCheckRun(req);
      // } else {
      //   console.log("Handle GitHub webhook via new entrypoint");
      //   await githubHandler(req, res, next);
      // }

      break;
    // case "dev.travis.webhooks.m4m.io":
    // case "travis.webhooks.m4m.io":
    //   response.source = "travis";
    //   await travisHandler(req, res, next);
    //   break;
  }
  res.json(response);
});

export { app as GitHubReceiverApp };

// function handleCheckSuite(req) {
//   const entry = new CheckSuiteEvent(req.body);
//   console.log(entry);
//   entry.log();
// }

// function handleCheckRun(req) {
//   const entry = new CheckRunEvent(req.body);
//   console.log(entry);
//   entry.log();
// }
