import { db } from "../../core/config/firebase.config";
import { IPubSubEvent } from "../../core/interfaces";
import { IExternalEvent } from "../../core/models/external-event";

const EVENT_COLLECTION = "events";

export async function eventToFirestore(event: IPubSubEvent) {
  console.log("[eventToFirestore] Sent external event to Cloud Firestore");

  const data = event.data.message.json as IExternalEvent;
  await execute(data);
}

async function execute(data: IExternalEvent): Promise<void> {
  console.log("execute eventToFirestore", data);
  // send analytics to Firestore
  const dbRef = db.collection(EVENT_COLLECTION);

  try {
    await dbRef.doc().set(data);
  } catch (error) {
    console.log("Something went wrong:" + error);
  }
}
