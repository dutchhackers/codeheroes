import * as admin from 'firebase-admin';

import { Activity, ActivityType, XpBreakdownItem } from '@codeheroes/common';

export class XpCalculator {
  private gameSettings: any; // TODO: GameSettings

  constructor(gameSettings: any) {
    this.gameSettings = gameSettings;
  }

  public calculateXpForActivity(activity: Activity): number {
    let xp = 0;

    switch (activity.type) {
      case ActivityType.COMMIT:
        xp = this.calculateXpForCommit(activity);
        break;
    //   case ActivityType.PULL_REQUEST_OPENED:
    //     xp = this.calculateXpForPullRequestOpened(activity);
    //     break;
    //   case ActivityType.PULL_REQUEST_MERGED:
    //     xp = this.calculateXpForPullRequestMerged(activity);
    //     break;
    //   case ActivityType.PULL_REQUEST_REVIEWED:
    //     xp = this.calculateXpForPullRequestReviewed(activity);
    //     break;
    //   case ActivityType.WORKFLOW_RUN_COMPLETED:
    //     xp = this.calculateXpForWorkflowRunCompleted(activity);
    //     break;
    //   case ActivityType.PUSH_BONUS:
    //     xp = this.gameSettings.pushBonusXp;
    //     break;
      // ... cases for other activity types
      default:
        xp = 0; // Or throw an error for unknown activity types
    }

    // Apply bonuses
    xp += this.calculateXpBonuses(activity);

    return xp;
  }

  private calculateXpForCommit(activity: Activity): number {
    let xp = this.gameSettings.commitBaseXp;
    if (activity.commitCount && activity.commitCount > 1) {
      xp += this.gameSettings.commitMultipleBonusXp;
    }
    // ... other commit-specific calculations (e.g., based on lines of code changed)
    return xp;
  }

//   private calculateXpForPullRequestOpened(activity: Activity): number {
//     let xp = this.gameSettings.prOpenedBaseXp;
//     // ... other PR-opened-specific calculations
//     return xp;
//   }

//   private calculateXpForPullRequestMerged(activity: Activity): number {
//     let xp = this.gameSettings.prMergedBaseXp;
//     // ... other PR-merged-specific calculations
//     return xp;
//   }

//   private calculateXpForPullRequestReviewed(activity: Activity): number {
//     let xp = this.gameSettings.prReviewedBaseXp;
//     // ... other PR-reviewed-specific calculations
//     return xp;
//   }

//   private calculateXpForWorkflowRunCompleted(activity: Activity): number {
//     let xp = this.gameSettings.workflowRunCompletedBaseXp;
//     // ... other workflow-run-specific calculations
//     return xp;
//   }

  private calculateXpBonuses(activity: Activity): number {
    let bonusXp = 0;
    if (
      this.gameSettings.currentEvent &&
      this.isWithinEventDates(this.gameSettings.currentEvent)
    ) {
      bonusXp += this.gameSettings.currentEvent.bonusXp || 0; // Add event bonus XP if defined
    }
    // ... other bonus calculations (e.g., based on user streaks, etc.)
    return bonusXp;
  }

  public generateXpBreakdown(activity: Activity): XpBreakdownItem[] {
    const breakdown: XpBreakdownItem[] = [];

    switch (activity.type) {
      case ActivityType.COMMIT:
        breakdown.push({
          description: "Base XP for Commit",
          xp: this.gameSettings.commitBaseXp,
        });
        if (activity.commitCount && activity.commitCount > 1) {
          breakdown.push({
            description: "Bonus for multiple commits",
            xp: this.gameSettings.commitMultipleBonusXp,
          });
        }
        break;
      case ActivityType.PULL_REQUEST_OPENED:
        breakdown.push({
          description: "Base XP for Pull Request Opened",
          xp: this.gameSettings.prOpenedBaseXp,
        });
        break;
      case ActivityType.PULL_REQUEST_MERGED:
        breakdown.push({
          description: "Base XP for Pull Request Merged",
          xp: this.gameSettings.prMergedBaseXp,
        });
        break;
      case ActivityType.PULL_REQUEST_REVIEWED:
        breakdown.push({
          description: "Base XP for Pull Request Reviewed",
          xp: this.gameSettings.prReviewedBaseXp,
        });
        break;
      case ActivityType.WORKFLOW_RUN_COMPLETED:
        breakdown.push({
          description: "Base XP for Workflow Run Completed",
          xp: this.gameSettings.workflowRunCompletedBaseXp,
        });
        break;
    //   case ActivityType.PUSH_BONUS:
    //     breakdown.push({
    //       description: "Bonus for pushing code",
    //       xp: this.gameSettings.pushBonusXp,
    //     });
    //     break;
      // ... cases for other activity types
    }

    // Add bonus XP breakdown
    this.addBonusXpBreakdown(breakdown);

    return breakdown;
  }

  private addBonusXpBreakdown(breakdown: XpBreakdownItem[]): void {
    if (
      this.gameSettings.currentEvent &&
      this.isWithinEventDates(this.gameSettings.currentEvent)
    ) {
      breakdown.push({
        description: "Event Bonus",
        xp: this.gameSettings.currentEvent.bonusXp || 0,
      });
    }
    // ... add other bonus breakdowns
  }

  // Helper function to check if the current time is within an event's dates
  private isWithinEventDates(event: {
    startDate: admin.firestore.Timestamp;
    endDate: admin.firestore.Timestamp;
  }): boolean {
    const now = admin.firestore.Timestamp.now();
    return now >= event.startDate && now <= event.endDate;
  }
}