import { inject, Injectable } from '@angular/core';
import {
  collectionGroup,
  Firestore,
  query,
  orderBy,
  limit as firestoreLimit,
  collectionData,
  startAfter,
  getDocs,
  QueryDocumentSnapshot,
  DocumentData,
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { Activity } from '@codeheroes/types';

export interface LoadMoreResult {
  activities: Activity[];
  lastDoc: QueryDocumentSnapshot<DocumentData> | null;
  hasMore: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class ActivityFeedService {
  readonly #firestore = inject(Firestore);

  /**
   * Real-time listener for the most recent activities
   */
  getGlobalActivities(limit = 50): Observable<Activity[]> {
    const activitiesRef = collectionGroup(this.#firestore, 'activities');
    const activitiesQuery = query(activitiesRef, orderBy('createdAt', 'desc'), firestoreLimit(limit));
    return collectionData(activitiesQuery, { idField: 'id' }) as Observable<Activity[]>;
  }

  /**
   * One-time fetch for older activities (pagination)
   */
  async loadMoreActivities(lastDoc: QueryDocumentSnapshot<DocumentData>, limit = 50): Promise<LoadMoreResult> {
    const activitiesRef = collectionGroup(this.#firestore, 'activities');
    const activitiesQuery = query(
      activitiesRef,
      orderBy('createdAt', 'desc'),
      startAfter(lastDoc),
      firestoreLimit(limit),
    );

    const snapshot = await getDocs(activitiesQuery);
    const activities = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Activity[];

    const newLastDoc = snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : null;

    return {
      activities,
      lastDoc: newLastDoc,
      hasMore: snapshot.docs.length === limit,
    };
  }

  /**
   * Get the last document from an activity for cursor-based pagination
   */
  async getDocumentForActivity(
    activityId: string,
    userId: string,
  ): Promise<QueryDocumentSnapshot<DocumentData> | null> {
    const activitiesRef = collectionGroup(this.#firestore, 'activities');
    const activitiesQuery = query(activitiesRef, orderBy('createdAt', 'desc'), firestoreLimit(100));

    const snapshot = await getDocs(activitiesQuery);
    const doc = snapshot.docs.find((d) => d.id === activityId);
    return doc || null;
  }
}
