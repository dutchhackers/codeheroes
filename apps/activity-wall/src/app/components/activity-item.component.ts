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
      class="rounded-lg bg-black/70 cursor-pointer transition-all duration-300 hover:bg-black/90 overflow-hidden focus:outline-none focus:ring-2 focus:ring-white/50"
      [class]="actionDisplay().cardGlowClass"
      [class.activity-item-enter]="isNew()"
      tabindex="0"
      role="button"
      (click)="selectActivity.emit(activity())"
      (keydown.enter)="selectActivity.emit(activity())"
      (keydown.space)="$event.preventDefault(); selectActivity.emit(activity())"
    >
      <!-- Main content area -->
      <div class="flex items-center gap-3 md:gap-4 p-4 md:p-5 pb-3 md:pb-4">
        <!-- Icon on LEFT for certain types -->
        @if (iconPosition() === 'left') {
          @if (isBadgeActivity()) {
            <!-- Large emoji for badges -->
            <div
              class="w-10 h-10 md:w-12 md:h-12 flex-shrink-0 flex items-center justify-center text-3xl md:text-4xl"
              role="img"
              [attr.aria-label]="badgeIcon() + ' badge'"
            >
              {{ badgeIcon() }}
            </div>
          } @else {
            <div
              class="w-10 h-10 md:w-12 md:h-12 flex-shrink-0"
              [class]="actionDisplay().textColor"
              [innerHTML]="sanitizedIcon()"
              role="img"
              [attr.aria-label]="actionDisplay().label + ' icon'"
            ></div>
          }
        }

        <!-- Avatar on LEFT (when icon is on right) -->
        @if (iconPosition() === 'right') {
          <div class="flex-shrink-0">
            @if (userInfo()?.photoUrl) {
              <div class="cyber-avatar-wrapper" [style.--glow-color]="actionDisplay().borderColor">
                <img
                  [src]="userInfo()!.photoUrl"
                  [alt]="userInfo()!.displayName"
                  class="w-10 h-10 md:w-12 md:h-12 rounded-full object-cover cyber-avatar"
                  referrerpolicy="no-referrer"
                />
                <div class="cyber-avatar-tint"></div>
              </div>
            } @else {
              <div
                class="w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center text-sm md:text-base font-bold cyber-avatar-placeholder"
                [class]="actionDisplay().textColor"
                [style.--glow-color]="actionDisplay().borderColor"
              >
                {{ userInitials() }}
              </div>
            }
          </div>
        }

        <!-- Main content - single color text -->
        <div class="flex-1 min-w-0" [class]="actionDisplay().textColor">
          <p class="text-base md:text-xl leading-relaxed font-medium description-text">
            [{{ formattedTime() }}] {{ techUsername() }} {{ descriptionText() }}
          </p>
        </div>

        <!-- Avatar on RIGHT (when icon is on left) -->
        @if (iconPosition() === 'left') {
          <div class="flex-shrink-0">
            @if (userInfo()?.photoUrl) {
              <div class="cyber-avatar-wrapper" [style.--glow-color]="actionDisplay().borderColor">
                <img
                  [src]="userInfo()!.photoUrl"
                  [alt]="userInfo()!.displayName"
                  class="w-10 h-10 md:w-12 md:h-12 rounded-full object-cover cyber-avatar"
                  referrerpolicy="no-referrer"
                />
                <div class="cyber-avatar-tint"></div>
              </div>
            } @else {
              <div
                class="w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center text-sm md:text-base font-bold cyber-avatar-placeholder"
                [class]="actionDisplay().textColor"
                [style.--glow-color]="actionDisplay().borderColor"
              >
                {{ userInitials() }}
              </div>
            }
          </div>
        }

        <!-- Icon on RIGHT for certain types -->
        @if (iconPosition() === 'right') {
          <div
            class="w-10 h-10 md:w-14 md:h-14 flex-shrink-0"
            [class]="actionDisplay().textColor"
            [innerHTML]="sanitizedIcon()"
            role="img"
            [attr.aria-label]="actionDisplay().label + ' icon'"
          ></div>
        }
      </div>

      <!-- Footer with separator -->
      <div class="px-4 md:px-5 pb-3 md:pb-4">
        <div
          class="border-t pt-2 md:pt-3 flex items-center justify-between text-xs md:text-sm font-mono"
          [style.border-color]="actionDisplay().borderColor + '33'"
        >
          @if (isBadgeActivity()) {
            <span class="text-slate-400 truncate">{{ badgeName() }} <span class="text-slate-500">({{ badgeRarity() }})</span></span>
          } @else if (isLevelActivity()) {
            <span class="text-slate-400 truncate">Level {{ levelInfo() }}</span>
          } @else {
            <span class="text-slate-500 truncate">{{ repoName() }}</span>
          }
          @if (!isBadgeActivity() && !isLevelActivity()) {
            <span class="text-slate-400 flex-shrink-0 ml-4">+{{ xpEarned() }} XP</span>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* Line clamp for long descriptions */
    .description-text {
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    /* Avatar wrapper for color tint effect */
    .cyber-avatar-wrapper {
      position: relative;
      display: inline-block;
      border-radius: 50%;
      border: 2px solid var(--glow-color, #00f5ff);
      box-shadow:
        0 0 8px var(--glow-color, #00f5ff),
        0 0 16px color-mix(in srgb, var(--glow-color, #00f5ff) 50%, transparent);
    }

    /* Cyber-styled avatar with grayscale */
    .cyber-avatar {
      display: block;
      filter: grayscale(100%) contrast(1.2) brightness(1.1);
      transition: filter 0.3s ease;
    }

    /* Color tint overlay */
    .cyber-avatar-tint {
      position: absolute;
      inset: 0;
      border-radius: 50%;
      background: var(--glow-color, #00f5ff);
      mix-blend-mode: color;
      opacity: 0.6;
      pointer-events: none;
      transition: opacity 0.3s ease;
    }

    .cyber-avatar-wrapper:hover .cyber-avatar {
      filter: grayscale(50%) contrast(1.1) brightness(1.05);
    }

    .cyber-avatar-wrapper:hover .cyber-avatar-tint {
      opacity: 0.3;
    }

    /* Placeholder avatar with glow */
    .cyber-avatar-placeholder {
      background: rgba(0, 0, 0, 0.8);
      border: 2px solid var(--glow-color, #00f5ff);
      box-shadow:
        0 0 8px var(--glow-color, #00f5ff),
        0 0 16px color-mix(in srgb, var(--glow-color, #00f5ff) 50%, transparent);
    }

    /* Gold glow for badges */
    :host ::ng-deep .card-glow-gold {
      box-shadow:
        0 0 15px rgba(251, 191, 36, 0.3),
        0 0 30px rgba(251, 191, 36, 0.15),
        inset 0 0 20px rgba(251, 191, 36, 0.05);
    }
  `],
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

    const name = user.displayName;
    const parts = name.split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  });

  techUsername = computed(() => {
    const user = this.userInfo();
    if (!user) return 'UNKNOWN';

    const name = user.displayName;
    const upper = name.toUpperCase();

    // Check if it's two words (first + last name)
    const parts = upper.split(/\s+/);
    if (parts.length >= 2) {
      // "Sander Elderhorst" → "SANDER.E"
      return `${parts[0]}.${parts[1].charAt(0)}`;
    }

    // Single word - try to split camelCase or find natural break
    const singleWord = upper;

    // Common word breaks for compound names
    const breakPoints = ['NIGHT', 'CODE', 'DARK', 'FIRE', 'STAR', 'CYBER', 'TECH', 'MEGA', 'ULTRA'];
    for (const prefix of breakPoints) {
      if (singleWord.startsWith(prefix) && singleWord.length > prefix.length) {
        return `${prefix}.${singleWord.slice(prefix.length)}`;
      }
    }

    // If word is long enough, split roughly in half
    if (singleWord.length >= 8) {
      const mid = Math.floor(singleWord.length / 2);
      return `${singleWord.slice(0, mid)}.${singleWord.slice(mid)}`;
    }

    return singleWord;
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
    return (activity as Activity).userFacingDescription;
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
        const branch = 'workflow' in context && context.workflow?.headBranch
          ? context.workflow.headBranch
          : '';
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
