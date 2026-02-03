import { inject, Injectable, Injector, runInInjectionContext } from '@angular/core';
import {
  collectionData,
  collectionGroup,
  Firestore,
  limit as firestoreLimit,
  orderBy,
  query,
} from '@angular/fire/firestore';
import { Observable, map, catchError, of } from 'rxjs';
import { Activity } from '@codeheroes/types';

export interface UserLastActivity {
  userId: string;
  displayName: string;
  photoUrl: string | null;
  level: number;
  lastActivity: {
    type: string;
    description: string;
    timestamp: string;
    xp?: number;
  };
}

@Injectable({
  providedIn: 'root',
})
export class ActiveUsersService {
  readonly #firestore = inject(Firestore);
  readonly #injector = inject(Injector);

  /**
   * Get active users with their last activity.
   * This fetches recent activities and groups them by user, keeping only the most recent activity per user.
   */
  getActiveUsers(limit = 10): Observable<UserLastActivity[]> {
    // Fetch recent activities from all users
    const activitiesRef = collectionGroup(this.#firestore, 'activities');
    const activitiesQuery = query(activitiesRef, orderBy('createdAt', 'desc'), firestoreLimit(100));

    return runInInjectionContext(this.#injector, () =>
      collectionData(activitiesQuery, { idField: 'id' }),
    ).pipe(
      map((activities) => {
        const activitiesArray = activities as Activity[];
        
        // Group activities by userId and keep only the most recent one per user
        const userActivityMap = new Map<string, Activity>();
        
        for (const activity of activitiesArray) {
          if (!userActivityMap.has(activity.userId)) {
            userActivityMap.set(activity.userId, activity);
          }
        }

        // Convert to UserLastActivity array and limit results
        const activeUsers: UserLastActivity[] = [];
        
        for (const [userId, activity] of userActivityMap.entries()) {
          activeUsers.push({
            userId,
            displayName: '', // Will be populated from user cache
            photoUrl: null,
            level: 1,
            lastActivity: {
              type: activity.type,
              description: activity.userFacingDescription,
              timestamp: activity.createdAt,
              xp: activity.type === 'game-action' ? activity.xp?.earned : undefined,
            },
          });
          
          if (activeUsers.length >= limit) {
            break;
          }
        }

        return activeUsers;
      }),
      catchError((error) => {
        console.error('Error fetching active users:', error);
        return of([]);
      }),
    );
  }

  /**
   * Enhanced version that also fetches user details
   * This joins activity data with user data for a complete view
   */
  getActiveUsersWithDetails(limit = 10): Observable<UserLastActivity[]> {
    return this.getActiveUsers(limit).pipe(
      map((activeUsers) => {
        // In a real implementation, we would fetch user details here
        // For now, we'll let the component use the user cache service
        return activeUsers;
      }),
    );
  }
}
