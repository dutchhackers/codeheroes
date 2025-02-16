import { UserActivity } from '@codeheroes/common';
import { ActivityType } from '@codeheroes/shared/types';
import { GameXpSettings, XpBreakdownItem, XpCalculationResponse } from '../../models/gamification.model';

export abstract class BaseActivityCalculator {
  protected settings: GameXpSettings;

  constructor(settings: GameXpSettings) {
    this.settings = settings;
  }

  abstract calculateXp(activity: UserActivity): XpCalculationResponse;

  protected createBaseXp(activityType: ActivityType, baseXp: number): XpBreakdownItem {
    const descriptions: Record<ActivityType, string> = {
      [ActivityType.CODE_PUSH]: 'Shipped new code to the repository',
      [ActivityType.CODE_COVERAGE]: 'Enhanced code quality with better test coverage',
      [ActivityType.BRANCH_CREATED]: 'Created new development branch',
      [ActivityType.BRANCH_DELETED]: 'Maintained repository cleanliness',
      [ActivityType.TAG_CREATED]: 'Created version tag for release',
      [ActivityType.TAG_DELETED]: 'Cleaned up repository by removing obsolete tag',
      [ActivityType.PR_CREATED]: 'Initiated code changes through a pull request',
      [ActivityType.PR_UPDATED]: 'Refined pull request with improvements',
      [ActivityType.PR_MERGED]: 'Successfully merged code into the project',
      [ActivityType.ISSUE_CREATED]: 'Documented a new project task or bug',
      [ActivityType.ISSUE_CLOSED]: 'Completed and resolved an issue',
      [ActivityType.ISSUE_UPDATED]: 'Enhanced issue documentation',
      [ActivityType.ISSUE_REOPENED]: 'Brought attention to an unresolved issue',
      [ActivityType.PR_REVIEW]: 'Participated in code quality improvement',
      [ActivityType.PR_REVIEW_SUBMITTED]: 'Completed a thorough code review',
      [ActivityType.PR_REVIEW_UPDATED]: 'Refined code review feedback',
      [ActivityType.PR_REVIEW_DISMISSED]: 'Contributed to review process',
      [ActivityType.PR_REVIEW_THREAD_RESOLVED]: 'Concluded a code review discussion',
      [ActivityType.PR_REVIEW_THREAD_UNRESOLVED]: 'Initiated important code discussion',
      [ActivityType.PR_REVIEW_COMMENT_CREATED]: 'Provided valuable code feedback',
      [ActivityType.PR_REVIEW_COMMENT_UPDATED]: 'Clarified review comments',
      [ActivityType.DEPLOYMENT]: 'Deployed code to production',
    };

    return {
      description:
        descriptions[activityType] || `Contributing through ${activityType.toLowerCase().replace(/_/g, ' ')}`,
      xp: baseXp,
    };
  }
}
