import { inject, Injectable, Injector, runInInjectionContext } from '@angular/core';
import {
  collectionData,
  collectionGroup,
  Firestore,
  query,
  where,
  orderBy,
  limit as firestoreLimit,
} from '@angular/fire/firestore';
import { Observable, map, catchError, of } from 'rxjs';
import { Activity, GameActionActivity } from '@codeheroes/types';
import { ActiveProject, formatProjectDisplayName, formatTimeAgo } from '../models/active-project.model';

@Injectable({
  providedIn: 'root',
})
export class ActiveProjectsService {
  readonly #firestore = inject(Firestore);
  readonly #injector = inject(Injector);

  /**
   * Get active projects from recent activities across all users
   * @param daysBack Number of days to look back for activities (default: 7)
   * @param maxActivities Maximum number of activities to fetch (default: 500)
   */
  getActiveProjects(daysBack = 7, maxActivities = 500): Observable<ActiveProject[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysBack);
    const cutoffTimestamp = cutoffDate.toISOString();

    // Query activities across all users via collection group query
    const activitiesRef = collectionGroup(this.#firestore, 'activities');
    const gameActionsQuery = query(
      activitiesRef,
      where('type', '==', 'game-action'),
      where('createdAt', '>=', cutoffTimestamp),
      orderBy('createdAt', 'desc'),
      firestoreLimit(maxActivities)
    );

    return runInInjectionContext(this.#injector, () =>
      collectionData(gameActionsQuery, { idField: 'id' })
    ).pipe(
      map((activities) => {
        const gameActivities = activities as Activity[];
        return this.#aggregateProjectsFromActivities(gameActivities);
      }),
      catchError((error) => {
        console.error('Error fetching active projects:', error);
        return of([]);
      })
    );
  }

  /**
   * Get active projects for a specific user
   * @param userId User ID to fetch projects for
   * @param daysBack Number of days to look back
   * @param maxActivities Maximum number of activities to fetch
   */
  getUserActiveProjects(userId: string, daysBack = 30, maxActivities = 200): Observable<ActiveProject[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysBack);
    const cutoffTimestamp = cutoffDate.toISOString();

    const activitiesRef = collectionGroup(this.#firestore, 'activities');
    const gameActionsQuery = query(
      activitiesRef,
      where('type', '==', 'game-action'),
      where('userId', '==', userId),
      where('createdAt', '>=', cutoffTimestamp),
      orderBy('createdAt', 'desc'),
      firestoreLimit(maxActivities)
    );

    return runInInjectionContext(this.#injector, () =>
      collectionData(gameActionsQuery, { idField: 'id' })
    ).pipe(
      map((activities) => {
        const gameActivities = activities as Activity[];
        return this.#aggregateProjectsFromActivities(gameActivities);
      }),
      catchError((error) => {
        console.error('Error fetching user active projects:', error);
        return of([]);
      })
    );
  }

  /**
   * Aggregate projects from a list of activities
   */
  #aggregateProjectsFromActivities(activities: Activity[]): ActiveProject[] {
    const projectMap = new Map<string, {
      name: string;
      owner: string;
      contributors: Set<string>;
      lastActivityAt: string;
      activities: Activity[];
      activityTypes: Map<string, number>;
    }>();

    // Process all activities
    for (const activity of activities) {
      // Only process game-action activities that have repository context
      if (activity.type !== 'game-action') continue;
      
      const gameActivity = activity as GameActionActivity;
      const context = gameActivity.context;

      // Check if context has repository information
      if (!('repository' in context)) continue;

      const repo = context.repository;
      const projectId = `${repo.owner}/${repo.name}`;
      
      // Get or create project entry
      let projectData = projectMap.get(projectId);
      if (!projectData) {
        projectData = {
          name: repo.name,
          owner: repo.owner,
          contributors: new Set<string>(),
          lastActivityAt: activity.createdAt,
          activities: [],
          activityTypes: new Map<string, number>(),
        };
        projectMap.set(projectId, projectData);
      }

      // Update project data
      projectData.contributors.add(activity.userId);
      projectData.activities.push(activity);

      // Update last activity if more recent
      if (activity.createdAt > projectData.lastActivityAt) {
        projectData.lastActivityAt = activity.createdAt;
      }

      // Track activity types
      const actionType = this.#mapActionTypeToCategory(gameActivity.sourceActionType);
      const currentCount = projectData.activityTypes.get(actionType) || 0;
      projectData.activityTypes.set(actionType, currentCount + 1);
    }

    // Convert map to array of ActiveProject
    const projects: ActiveProject[] = Array.from(projectMap.entries()).map(([projectId, data]) => {
      const activityBreakdown = {
        pushes: data.activityTypes.get('pushes') || 0,
        pullRequests: data.activityTypes.get('pullRequests') || 0,
        reviews: data.activityTypes.get('reviews') || 0,
        issues: data.activityTypes.get('issues') || 0,
        comments: data.activityTypes.get('comments') || 0,
      };

      return {
        id: projectId,
        name: data.name,
        owner: data.owner,
        displayName: formatProjectDisplayName(data.name),
        memberCount: data.contributors.size,
        contributors: Array.from(data.contributors),
        lastActivityAt: data.lastActivityAt,
        activityCount: data.activities.length,
        activityBreakdown,
        recentActivityDescription: formatTimeAgo(data.lastActivityAt),
      };
    });

    // Sort by last activity (most recent first)
    return projects.sort((a, b) => 
      new Date(b.lastActivityAt).getTime() - new Date(a.lastActivityAt).getTime()
    );
  }

  /**
   * Map game action types to simplified categories
   */
  #mapActionTypeToCategory(actionType: string): string {
    if (actionType.startsWith('code_push')) return 'pushes';
    if (actionType.startsWith('pull_request')) return 'pullRequests';
    if (actionType.startsWith('code_review')) return 'reviews';
    if (actionType.startsWith('issue')) return 'issues';
    if (actionType.includes('comment')) return 'comments';
    return 'other';
  }
}
