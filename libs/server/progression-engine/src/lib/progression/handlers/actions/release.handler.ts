import { GameActionContext, GameActionMetrics, GameActionType } from '@codeheroes/types';
import { Firestore } from 'firebase-admin/firestore';
import { XP_VALUES } from '../../../config/xp-values.config';
import { AbstractActionHandler } from '../action-handler.base';

/**
 * Handler for release publish actions
 */
export class ReleaseHandler extends AbstractActionHandler {
  protected actionType: GameActionType = 'release_publish';

  constructor(protected db: Firestore) {
    super(db);
  }

  /**
   * Calculate bonuses for release actions
   * @param context Action context
   * @param metrics Action metrics
   * @returns Calculated bonuses
   */
  calculateBonuses(
    context: GameActionContext,
    metrics?: GameActionMetrics,
  ): {
    totalBonus: number;
    breakdown: Record<string, number>;
  } {
    const bonuses: Record<string, number> = {};
    let totalBonus = 0;

    // Major version bonus (e.g., v2.0.0)
    if (metrics && 'isMajorVersion' in metrics && metrics.isMajorVersion) {
      bonuses.majorVersion = XP_VALUES.RELEASE.BONUSES.MAJOR_VERSION;
      totalBonus += bonuses.majorVersion;
    }
    // Minor version bonus (e.g., v1.1.0)
    else if (metrics && 'isMinorVersion' in metrics && metrics.isMinorVersion) {
      bonuses.minorVersion = XP_VALUES.RELEASE.BONUSES.MINOR_VERSION;
      totalBonus += bonuses.minorVersion;
    }

    // With release notes bonus
    if (metrics && 'hasReleaseNotes' in metrics && metrics.hasReleaseNotes) {
      bonuses.withNotes = XP_VALUES.RELEASE.BONUSES.WITH_NOTES;
      totalBonus += bonuses.withNotes;
    }

    return {
      totalBonus,
      breakdown: bonuses,
    };
  }
}
