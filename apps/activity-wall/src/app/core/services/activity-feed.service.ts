import { inject, Injectable } from '@angular/core';
import {
  collectionGroup,
  Firestore,
  query,
  orderBy,
  limit as firestoreLimit,
  collectionData,
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { Activity } from '@codeheroes/types';

@Injectable({
  providedIn: 'root',
})
export class ActivityFeedService {
  readonly #firestore = inject(Firestore);

  getGlobalActivities(limit = 100): Observable<Activity[]> {
    const activitiesRef = collectionGroup(this.#firestore, 'activities');
    const activitiesQuery = query(
      activitiesRef,
      orderBy('createdAt', 'desc'),
      firestoreLimit(limit)
    );
    return collectionData(activitiesQuery, { idField: 'id' }) as Observable<Activity[]>;
  }
}
