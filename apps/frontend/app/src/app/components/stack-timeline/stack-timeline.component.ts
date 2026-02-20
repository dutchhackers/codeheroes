import { Component, input, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Activity, GameActionActivity, isGameActionActivity } from '@codeheroes/types';
import { getActionTypeDisplay } from '../../core/mappings/action-type.mapping';
import { UserCacheService, UserInfo } from '../../core/services/user-cache.service';

interface TimelineEvent {
  activity: Activity;
  userInfo: UserInfo | null;
  formattedTime: string;
  actionLabel: string;
  sanitizedIcon: SafeHtml;
  textColor: string;
  borderColor: string;
  xpEarned: number;
}

@Component({
  selector: 'app-stack-timeline',
  standalone: true,
  styles: [`
    .timeline-user-link {
      cursor: pointer;
      transition: color 0.15s;
    }
    .timeline-user-link:hover {
      color: var(--neon-cyan) !important;
      text-decoration: underline;
      text-underline-offset: 2px;
    }
  `],
  template: `
    <div class="relative pl-6">
      <!-- Vertical connecting line -->
      <div
        class="absolute left-[11px] top-3 bottom-3 w-0.5 bg-gradient-to-b from-slate-600 via-slate-500 to-slate-600"
      ></div>

      <!-- Timeline events -->
      <div class="flex flex-col gap-3">
        @for (event of timelineEvents(); track event.activity.id; let last = $last) {
          <div class="relative flex items-start gap-3">
            <!-- Timeline dot -->
            <div
              class="absolute -left-6 top-1 w-3 h-3 rounded-full border-2 bg-black z-10"
              [style.border-color]="event.borderColor"
              [style.box-shadow]="'0 0 6px ' + event.borderColor"
            ></div>

            <!-- Event icon -->
            <div class="w-5 h-5 flex-shrink-0" [class]="event.textColor" [innerHTML]="event.sanitizedIcon"></div>

            <!-- Event content -->
            <div class="flex-1 min-w-0 flex items-center gap-2">
              <span class="text-slate-500 text-xs">{{ event.formattedTime }}</span>
              <span class="timeline-user-link text-slate-400 text-sm font-medium" (click)="navigateToProfile(event.activity.userId, $event)">{{ event.userInfo?.displayName || 'Unknown' }}</span>
              <span [class]="event.textColor" class="text-sm">{{ event.actionLabel }}</span>
              @if (!last) {
                <!-- Subtle XP badge -->
                <span class="text-slate-600 text-xs ml-auto"> +{{ event.xpEarned }} XP </span>
              }
            </div>
          </div>
        }
      </div>
    </div>
  `,
})
export class StackTimelineComponent {
  readonly #sanitizer = inject(DomSanitizer);
  readonly #userCacheService = inject(UserCacheService);
  readonly #router = inject(Router);

  /** Activities sorted oldest to newest for timeline display */
  activities = input.required<Activity[]>();

  timelineEvents = computed((): TimelineEvent[] => {
    return this.activities()
      .filter(isGameActionActivity) // Only game actions in stacks
      .map((activity) => {
        const display = getActionTypeDisplay(activity.sourceActionType);
        return {
          activity,
          userInfo: this.#userCacheService.getUserInfo(activity.userId),
          formattedTime: this.formatTime(activity.createdAt),
          actionLabel: this.getActionLabel(activity),
          sanitizedIcon: this.#sanitizer.bypassSecurityTrustHtml(display.svgIcon),
          textColor: display.textColor,
          borderColor: display.borderColor,
          xpEarned: activity.xp?.earned ?? 0,
        };
      });
  });

  private formatTime(timestamp: string): string {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  }

  private getActionLabel(activity: GameActionActivity): string {
    switch (activity.sourceActionType) {
      case 'pull_request_create':
        return 'opened';
      case 'pull_request_merge':
        return 'merged';
      case 'pull_request_close':
        return 'closed';
      case 'code_review_submit':
        return this.getReviewLabel(activity);
      case 'code_review_comment':
        return 'commented on review';
      case 'comment_create':
        return 'commented';
      case 'review_comment_create':
        return 'added review comment';
      default:
        return activity.sourceActionType.replace(/_/g, ' ');
    }
  }

  private getReviewLabel(activity: GameActionActivity): string {
    const context = activity.context;
    if (context.type === 'code_review' && 'review' in context) {
      switch (context.review.state) {
        case 'approved':
          return 'approved';
        case 'changes_requested':
          return 'requested changes';
        case 'commented':
          return 'reviewed';
        default:
          return 'reviewed';
      }
    }
    return 'reviewed';
  }

  navigateToProfile(userId: string, event: Event) {
    event.stopPropagation();
    if (userId) {
      this.#router.navigate(['/users', userId]);
    }
  }
}
