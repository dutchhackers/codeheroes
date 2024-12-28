import { Timestamp } from 'firebase-admin/firestore';

export const getCurrentTimeAsISO = (): string => {
  return Timestamp.now().toDate().toISOString();
};
