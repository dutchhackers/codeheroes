
import { Timestamp } from 'firebase-admin/firestore';

export interface BaseDocument {
  id: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}


