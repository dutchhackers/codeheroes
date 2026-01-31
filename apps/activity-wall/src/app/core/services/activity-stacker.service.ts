import { Injectable } from '@angular/core';
import { Activity, GameActionActivity, GameActionContext, isGameActionActivity } from '@codeheroes/types';
import {
  PR_STACKABLE_ACTION_TYPES,
  PRFinalState,
} from '../constants/stack.constants';
import {
  ActivityStack,
  FeedItem,
  SingleActivity,
} from '../models/activity-stack.model';

interface PRInfo {
  number: number;
  title: string;
}

@Injectable({
  providedIn: 'root',
})
export class ActivityStackerService {
  /**
   * Groups activities into stacks based on PR lifecycle.
   * Activities related to the same PR (same repo + PR number) are grouped together.
   *
   * @param activities - Array of activities sorted by createdAt desc (newest first)
   * @returns Array of FeedItems (stacks or single activities) sorted by lastUpdatedAt desc
   */
  stackActivities(activities: Activity[]): FeedItem[] {
    const stackMap = new Map<string, Activity[]>();
    const nonStackable: Activity[] = [];

    // Group stackable activities by their stack key
    for (const activity of activities) {
      const stackKey = this.getStackKey(activity);

      if (stackKey) {
        const existing = stackMap.get(stackKey) || [];
        existing.push(activity);
        stackMap.set(stackKey, existing);
      } else {
        nonStackable.push(activity);
      }
    }

    const feedItems: FeedItem[] = [];

    // Convert grouped activities into stacks (only if more than 1 activity)
    for (const [stackKey, stackActivities] of stackMap) {
      if (stackActivities.length > 1) {
        const stack = this.createStack(stackKey, stackActivities);
        feedItems.push(stack);
      } else {
        // Single PR activity - treat as regular item
        feedItems.push(this.createSingleItem(stackActivities[0]));
      }
    }

    // Add non-stackable activities as single items
    for (const activity of nonStackable) {
      feedItems.push(this.createSingleItem(activity));
    }

    // Sort all items by lastUpdatedAt desc (newest first)
    feedItems.sort((a, b) => {
      const aTime = this.getItemTimestamp(a);
      const bTime = this.getItemTimestamp(b);
      return new Date(bTime).getTime() - new Date(aTime).getTime();
    });

    return feedItems;
  }

  /**
   * Gets the stack key for an activity if it's stackable.
   * Stack key format: {repositoryId}:{prNumber}
   *
   * @returns Stack key string or null if not stackable
   */
  private getStackKey(activity: Activity): string | null {
    // Only game-action activities can be stacked
    // Badge-earned and level-up activities are never stacked
    if (!isGameActionActivity(activity)) {
      return null;
    }

    const actionType = activity.sourceActionType;

    // Check if action type is in the stackable list
    if (!PR_STACKABLE_ACTION_TYPES.includes(actionType)) {
      return null;
    }

    const context = activity.context;
    const prInfo = this.extractPRInfo(activity);

    if (!prInfo) {
      return null;
    }

    // Get repository ID from context
    const repoId = this.getRepositoryId(context);
    if (!repoId) {
      return null;
    }

    return `${repoId}:${prInfo.number}`;
  }

  /**
   * Extracts PR information from an activity based on its context type
   */
  private extractPRInfo(activity: Activity): PRInfo | null {
    // Only game-action activities have PR context
    if (!isGameActionActivity(activity)) {
      return null;
    }

    const context = activity.context;
    const actionType = activity.sourceActionType;

    // comment_create is only stackable when targeting a pull request
    if (actionType === 'comment_create') {
      if (context.type === 'comment' && context.target?.type === 'pull_request') {
        return {
          number: context.target.number,
          title: context.target.title,
        };
      }
      return null;
    }

    // Pull request actions
    if (context.type === 'pull_request' && 'pullRequest' in context) {
      return {
        number: context.pullRequest.number,
        title: context.pullRequest.title,
      };
    }

    // Code review actions
    if (context.type === 'code_review' && 'pullRequest' in context) {
      return {
        number: context.pullRequest.number,
        title: context.pullRequest.title,
      };
    }

    // Review comment actions
    if (context.type === 'review_comment' && 'pullRequest' in context) {
      return {
        number: context.pullRequest.number,
        title: context.pullRequest.title,
      };
    }

    return null;
  }

  /**
   * Gets the repository ID from a context object
   */
  private getRepositoryId(context: GameActionContext): string | null {
    if ('repository' in context && context.repository) {
      return context.repository.id;
    }
    return null;
  }

  /**
   * Gets the repository name from a context object
   */
  private getRepositoryName(context: GameActionContext): string {
    if ('repository' in context && context.repository) {
      return context.repository.name;
    }
    return 'Unknown Repo';
  }

  /**
   * Creates an ActivityStack from a group of related activities
   * Note: Only GameActionActivity can be stacked, so we cast safely here
   */
  private createStack(stackKey: string, activities: Activity[]): ActivityStack {
    // Sort activities by createdAt ascending (oldest first for timeline display)
    const sortedActivities = [...activities].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    // Cast to GameActionActivity since only game actions can be stacked
    const gameActivities = sortedActivities as GameActionActivity[];

    // Get PR info from the first activity that has it
    const prInfo = this.extractPRInfo(gameActivities[0]) ?? {
      number: 0,
      title: 'Unknown PR',
    };

    // Calculate total XP
    const totalXp = gameActivities.reduce(
      (sum, activity) => sum + (activity.xp?.earned ?? 0),
      0
    );

    // Determine final state based on most recent final action
    const finalState = this.determineFinalState(gameActivities);

    // Get timestamps
    const firstActivity = gameActivities[0];
    const lastActivity = gameActivities[gameActivities.length - 1];

    return {
      id: stackKey,
      type: 'stack',
      prNumber: prInfo.number,
      prTitle: this.findBestTitle(gameActivities) || prInfo.title,
      repoName: this.getRepositoryName(firstActivity.context),
      activities: sortedActivities,
      totalXp,
      finalState,
      lastUpdatedAt: lastActivity.createdAt,
      firstActivityAt: firstActivity.createdAt,
    };
  }

  /**
   * Finds the best (most complete) PR title from the activities
   */
  private findBestTitle(activities: GameActionActivity[]): string | null {
    for (const activity of activities) {
      const prInfo = this.extractPRInfo(activity);
      if (prInfo?.title && prInfo.title.length > 0) {
        return prInfo.title;
      }
    }
    return null;
  }

  /**
   * Determines the final state of a PR based on the activities
   */
  private determineFinalState(activities: GameActionActivity[]): PRFinalState {
    // Check from newest to oldest for final state actions
    for (let i = activities.length - 1; i >= 0; i--) {
      const actionType = activities[i].sourceActionType;
      if (actionType === 'pull_request_merge') {
        return 'merged';
      }
      if (actionType === 'pull_request_close') {
        return 'closed';
      }
    }
    return 'open';
  }

  /**
   * Creates a single activity feed item
   */
  private createSingleItem(activity: Activity): SingleActivity {
    return {
      type: 'single',
      activity,
    };
  }

  /**
   * Gets the timestamp for a feed item (for sorting)
   */
  private getItemTimestamp(item: FeedItem): string {
    if (item.type === 'stack') {
      return item.lastUpdatedAt;
    }
    return item.activity.createdAt;
  }
}
