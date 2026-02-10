import { Component, input, output, computed } from '@angular/core';

import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import {
  Activity,
  GameActionType,
  isGameActionActivity,
  isBadgeEarnedActivity,
  isLevelUpActivity,
} from '@codeheroes/types';
import { getActivityTypeDisplay } from '../core/mappings/action-type.mapping';
import { UserInfo } from '../core/services/user-cache.service';

@Component({
  selector: 'app-activity-item',
  standalone: true,
  imports: [],
  template: `
    <div
      class="activity-card"
      [class]="actionDisplay().cardGlowClass"
      [class.activity-item-enter]="isNew()"
      tabindex="0"
      role="button"
      (click)="selectActivity.emit(activity())"
      (keydown.enter)="selectActivity.emit(activity())"
      (keydown.space)="$event.preventDefault(); selectActivity.emit(activity())"
    >
      <!-- Main content area -->
      <div class="activity-content">
        <!-- Icon on LEFT for certain types -->
        @if (iconPosition() === 'left') {
          @if (isBadgeActivity()) {
            <div class="activity-icon-large" role="img" [attr.aria-label]="badgeIcon() + ' badge icon'">
              {{ badgeIcon() }}
            </div>
          } @else {
            <div class="activity-icon" [class]="actionDisplay().textColor" [innerHTML]="sanitizedIcon()" role="img" [attr.aria-label]="actionDisplay().label + ' icon'"></div>
          }
        }

        <!-- Avatar on LEFT (when icon is on right) -->
        @if (iconPosition() === 'right') {
          <div class="activity-avatar-wrapper">
            @if (userInfo()?.photoUrl) {
              <div class="activity-avatar-container" [style.--border-color]="actionDisplay().borderColor">
                <img
                  [src]="userInfo()!.photoUrl"
                  [alt]="userInfo()!.displayName"
                  class="activity-avatar-img"
                  referrerpolicy="no-referrer"
                />
              </div>
            } @else {
              <div class="activity-avatar-placeholder" [class]="actionDisplay().textColor">
                {{ userInitials() }}
              </div>
            }
          </div>
        }

        <!-- Main content text -->
        <div class="activity-text" [class]="actionDisplay().textColor">
          <p class="activity-description">
            <span class="activity-time">[{{ formattedTime() }}]</span>
            <span class="activity-user">{{ userInfo()?.displayName || 'UNKNOWN' }}</span>
            <span>{{ descriptionText() }}</span>
          </p>
        </div>

        <!-- Avatar on RIGHT (when icon is on left) -->
        @if (iconPosition() === 'left') {
          <div class="activity-avatar-wrapper">
            @if (userInfo()?.photoUrl) {
              <div class="activity-avatar-container" [style.--border-color]="actionDisplay().borderColor">
                <img
                  [src]="userInfo()!.photoUrl"
                  [alt]="userInfo()!.displayName"
                  class="activity-avatar-img"
                  referrerpolicy="no-referrer"
                />
              </div>
            } @else {
              <div class="activity-avatar-placeholder" [class]="actionDisplay().textColor">
                {{ userInitials() }}
              </div>
            }
          </div>
        }

        <!-- Icon on RIGHT for certain types -->
        @if (iconPosition() === 'right') {
          <div class="activity-icon" [class]="actionDisplay().textColor" [innerHTML]="sanitizedIcon()" role="img" [attr.aria-label]="actionDisplay().label + ' icon'"></div>
        }
      </div>

      <!-- Footer with metadata -->
      <div class="activity-footer" [style.border-color]="actionDisplay().borderColor + '20'">
        @if (isBadgeActivity()) {
          <span class="footer-text">{{ badgeName() }} <span class="footer-rarity">({{ badgeRarity() }})</span></span>
        } @else if (isLevelActivity()) {
          <span class="footer-text">Level {{ levelInfo() }}</span>
        } @else {
          <span class="footer-text">{{ repoName() }}</span>
        }
        @if (!isBadgeActivity() && !isLevelActivity() && xpEarned() > 0) {
          <span class="footer-xp">+{{ xpEarned() }} XP</span>
        }
      </div>
    </div>
  `,
  styles: [
    `
      .activity-card {
        background: rgba(255, 255, 255, 0.05);
        backdrop-filter: blur(12px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 12px;
        overflow: hidden;
        cursor: pointer;
        transition: all 0.2s ease;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
      }

      .activity-card:hover {
        background: rgba(255, 255, 255, 0.08);
        border-color: rgba(255, 255, 255, 0.15);
        transform: translateY(-1px);
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
      }

      .activity-card:focus {
        outline: 2px solid rgba(255, 255, 255, 0.3);
        outline-offset: 2px;
      }

      .activity-content {
        display: flex;
        align-items: center;
        gap: 1rem;
        padding: 1rem 1.25rem 0.875rem;
      }

      .activity-icon {
        width: 40px;
        height: 40px;
        flex-shrink: 0;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .activity-icon-large {
        width: 48px;
        height: 48px;
        flex-shrink: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 2rem;
      }

      .activity-avatar-wrapper {
        flex-shrink: 0;
      }

      .activity-avatar-container {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        border: 2px solid var(--border-color, rgba(255, 255, 255, 0.2));
        overflow: hidden;
      }

      .activity-avatar-img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
      }

      .activity-avatar-placeholder {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.08);
        border: 2px solid rgba(255, 255, 255, 0.15);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.875rem;
        font-weight: 600;
      }

      .activity-text {
        flex: 1;
        min-width: 0;
      }

      .activity-description {
        font-size: 0.9375rem;
        line-height: 1.5;
        margin: 0;
        font-weight: 500;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }

      .activity-time {
        color: rgba(255, 255, 255, 0.5);
        margin-right: 0.5rem;
        font-size: 0.875rem;
      }

      .activity-user {
        font-weight: 600;
        margin-right: 0.5rem;
      }

      .activity-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.75rem 1.25rem;
        border-top: 1px solid;
        font-size: 0.8125rem;
      }

      .footer-text {
        color: rgba(255, 255, 255, 0.6);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        min-width: 0;
      }

      .footer-rarity {
        color: rgba(255, 255, 255, 0.4);
      }

      .footer-xp {
        color: rgba(255, 255, 255, 0.7);
        font-weight: 600;
        flex-shrink: 0;
        margin-left: 1rem;
      }

      @media (min-width: 768px) {
        .activity-content {
          gap: 1.25rem;
          padding: 1.25rem 1.5rem 1rem;
        }

        .activity-icon {
          width: 48px;
          height: 48px;
        }

        .activity-icon-large {
          width: 56px;
          height: 56px;
          font-size: 2.5rem;
        }

        .activity-avatar-container,
        .activity-avatar-placeholder {
          width: 48px;
          height: 48px;
        }

        .activity-description {
          font-size: 1.0625rem;
        }

        .activity-footer {
          padding: 0.875rem 1.5rem;
          font-size: 0.875rem;
        }
      }
    `,
  ],
})
export class ActivityItemComponent {
  activity = input.required<Activity>();
  userInfo = input<UserInfo | null>(null);
  isNew = input<boolean>(false);
  selectActivity = output<Activity>();

  constructor(private sanitizer: DomSanitizer) {}

  // Check activity type
  isBadgeActivity = computed(() => isBadgeEarnedActivity(this.activity()));
  isLevelActivity = computed(() => isLevelUpActivity(this.activity()));
  isGameActivity = computed(() => isGameActionActivity(this.activity()));

  actionDisplay = computed(() => {
    const activity = this.activity();
    if (isGameActionActivity(activity)) {
      return getActivityTypeDisplay('game-action', activity.sourceActionType);
    }
    return getActivityTypeDisplay(activity.type);
  });

  sanitizedIcon = computed((): SafeHtml => {
    return this.sanitizer.bypassSecurityTrustHtml(this.actionDisplay().svgIcon);
  });

  // Badge-specific computed properties
  badgeIcon = computed((): string => {
    const activity = this.activity();
    if (isBadgeEarnedActivity(activity)) {
      return activity.badge.icon;
    }
    return '';
  });

  badgeName = computed((): string => {
    const activity = this.activity();
    if (isBadgeEarnedActivity(activity)) {
      return activity.badge.name;
    }
    return '';
  });

  badgeRarity = computed((): string => {
    const activity = this.activity();
    if (isBadgeEarnedActivity(activity)) {
      return activity.badge.rarity.toLowerCase();
    }
    return '';
  });

  // Level-specific computed properties
  levelInfo = computed((): string => {
    const activity = this.activity();
    if (isLevelUpActivity(activity)) {
      return `${activity.level.new}`;
    }
    return '';
  });

  // Icon position based on action type
  iconPosition = computed((): 'left' | 'right' => {
    const activity = this.activity();

    // Badge and level-up activities always have icon on left
    if (isBadgeEarnedActivity(activity) || isLevelUpActivity(activity)) {
      return 'left';
    }

    if (isGameActionActivity(activity)) {
      const actionType = activity.sourceActionType;
      // Right side: push, PR created (code-related creation)
      const rightSideTypes: GameActionType[] = ['code_push', 'pull_request_create', 'release_publish'];
      return rightSideTypes.includes(actionType) ? 'right' : 'left';
    }

    return 'left';
  });

  userInitials = computed(() => {
    const user = this.userInfo();
    if (!user) return '?';

    const displayName = user.displayName;
    const parts = displayName.split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
    }
    return displayName.substring(0, 2).toUpperCase();
  });

  // Plain text description (no HTML, single color)
  descriptionText = computed((): string => {
    const activity = this.activity();

    // Handle badge-earned activities
    if (isBadgeEarnedActivity(activity)) {
      return `earned ${activity.badge.icon} ${activity.badge.name}!`;
    }

    // Handle level-up activities
    if (isLevelUpActivity(activity)) {
      if (activity.level.new - activity.level.previous > 1) {
        return `leveled up to ${activity.level.new}!`;
      }
      return `reached level ${activity.level.new}!`;
    }

    // Handle game action activities
    if (isGameActionActivity(activity)) {
      return this.buildSentence(activity.sourceActionType, activity);
    }

    // Fallback - this shouldn't happen with the current union types
    return (activity as Activity).userFacingDescription || 'performed an action';
  });

  private buildSentence(actionType: GameActionType, activity: Activity): string {
    if (!isGameActionActivity(activity)) {
      return activity.userFacingDescription;
    }

    const desc = activity.userFacingDescription;

    // Extract useful info from description
    const prMatch = desc.match(/#(\d+)/);
    const prNumber = prMatch ? prMatch[1] : '';

    // Extract quoted title if present
    const titleMatch = desc.match(/"([^"]+)"/);
    const title = titleMatch ? titleMatch[1] : '';

    // Extract repo name
    const repoMatch = desc.match(/in (\S+)$/);
    const repo = repoMatch ? repoMatch[1] : '';

    switch (actionType) {
      case 'code_push': {
        const branchMatch = desc.match(/to (\S+)\s+in/);
        const branch = branchMatch ? branchMatch[1] : 'main';
        return `pushed to \`${branch}\`${repo ? ` in \`${repo}\`` : ''}`;
      }

      case 'pull_request_create':
        return `opened PR #${prNumber}${title ? `: \`${title}\`` : ''}${repo ? ` in \`${repo}\`` : ''}`;

      case 'pull_request_merge':
        return `merged PR #${prNumber}${title ? `: \`${title}\`` : ''}${repo ? ` into \`${repo}\`` : ''}`;

      case 'pull_request_close':
        return `closed PR #${prNumber}${title ? `: \`${title}\`` : ''}`;

      case 'code_review_submit':
        return `reviewed PR #${prNumber}${repo ? ` in \`${repo}\`` : ''}`;

      case 'code_review_comment':
        return `commented on PR #${prNumber}${repo ? ` in \`${repo}\`` : ''}`;

      case 'review_comment_create':
        return `added review comment${prNumber ? ` on #${prNumber}` : ''}${repo ? ` in \`${repo}\`` : ''}`;

      case 'issue_create':
        return `opened Issue #${prNumber}${title ? `: \`${title}\`` : ''}${repo ? ` in \`${repo}\`` : ''}`;

      case 'issue_close':
        return `closed Issue #${prNumber}${title ? `: \`${title}\`` : ''}`;

      case 'issue_reopen':
        return `reopened Issue #${prNumber}`;

      case 'comment_create':
        return `commented${prNumber ? ` on #${prNumber}` : ''}${repo ? ` in \`${repo}\`` : ''}`;

      case 'release_publish': {
        const versionMatch = desc.match(/v?(\d+\.\d+\.\d+)/);
        const version = versionMatch ? versionMatch[1] : '';
        return `published release${version ? ` v${version}` : ''}${repo ? ` in \`${repo}\`` : ''}`;
      }

      case 'user_registration':
        return `joined Code Heroes!`;

      case 'ci_success': {
        const context = activity.context;
        const branch = 'workflow' in context && context.workflow?.headBranch ? context.workflow.headBranch : '';
        return `CI passed${branch ? ` on \`${branch}\`` : ''}`;
      }

      case 'discussion_create':
        return `started a discussion${repo ? ` in \`${repo}\`` : ''}`;

      case 'discussion_comment':
        return `commented on a discussion${repo ? ` in \`${repo}\`` : ''}`;

      case 'workout_complete':
        return `completed a workout`;

      case 'manual_update':
        return desc;

      default:
        // Fallback: clean up the original description
        return desc.replace(/^(Created|Merged|Approved|Closed|Pushed|Commented)\s+/i, '');
    }
  }

  formattedTime = computed(() => {
    const date = new Date(this.activity().createdAt);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  });

  repoName = computed((): string => {
    const activity = this.activity();
    if (isGameActionActivity(activity)) {
      const context = activity.context;
      if ('repository' in context && context.repository) {
        return context.repository.name;
      }
    }
    return '';
  });

  xpEarned = computed((): number => {
    const activity = this.activity();
    if (isGameActionActivity(activity)) {
      return activity.xp?.earned ?? 0;
    }
    return 0;
  });
}
