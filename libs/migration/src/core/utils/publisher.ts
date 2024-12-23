import * as logger from "firebase-functions/logger";
import { PubSub } from "@google-cloud/pubsub";

export class Publisher {
  private _pubsub: PubSub;

  constructor(projectId: string = null) {
    logger.info("Initialize Publisher for project " + projectId);
    // Creates a client
    this._pubsub = projectId ? new PubSub({ projectId: projectId }) : new PubSub();
  }

  publish(payload, topic) {
    const dataBuffer = Buffer.from(JSON.stringify(payload));

    this._pubsub
      .topic(topic)
      // .publisher()
      .publish(dataBuffer)
      // .publishMessage(dataBuffer)
      .then(messageId => {
        logger.info(`Message ${messageId} published on topic ${topic}.`);
        logger.debug(`Message ${messageId} published.`, JSON.stringify(payload));
        // console.log(`Message ${messageId} published.`, JSON.stringify(payload));
      })
      .catch(err => {
        console.error("ERROR:", err);
      });
  }

  async publishMessage(payload, topic) {
    const dataBuffer = Buffer.from(JSON.stringify(payload));

    try {
      const messageId = await this._pubsub.topic(topic).publishMessage({ data: dataBuffer });
      logger.info(`Message ${messageId} published on topic ${topic}.`);
      logger.debug(`Message ${messageId} published.`, JSON.stringify(payload));
    } catch (error: any) {
      console.error(`Received error while publishing: ${error.message}`);
      // process.exitCode = 1;
    }
  }
}
