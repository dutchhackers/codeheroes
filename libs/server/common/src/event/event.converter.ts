import * as admin from 'firebase-admin';
import { WebhookEvent } from './event.model';

export const eventConverter: admin.firestore.FirestoreDataConverter<WebhookEvent> = {
  toFirestore: (user: WebhookEvent): admin.firestore.DocumentData => {
    return user;
  },
  fromFirestore: (snapshot: admin.firestore.QueryDocumentSnapshot): WebhookEvent => {
    const data = snapshot.data();
    if (!data) {
      throw new Error('Document data is undefined');
    }
    // Destructure to omit createdAt and lastLogin
    const { createdAt, updatedAt, ...restData } = data;
    return {
      id: snapshot.id,
      ...restData,
    } as WebhookEvent;
  },
};
