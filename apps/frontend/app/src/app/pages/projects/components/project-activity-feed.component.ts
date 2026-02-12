import { Component, inject, input } from '@angular/core';
import { Activity } from '@codeheroes/types';
import { ActivityItemComponent } from '../../../components/activity-item.component';
import { UserInfo, UserCacheService } from '../../../core/services/user-cache.service';

@Component({
  selector: 'app-project-activity-feed',
  standalone: true,
  imports: [ActivityItemComponent],
  template: `
    <div class="activity-section">
      <h3 class="section-title">Recent Activity</h3>
      @if (activities().length === 0) {
        <p class="empty-text">No recent activity for this project.</p>
      } @else {
        <div class="activity-list">
          @for (activity of activities(); track activity.id) {
            <app-activity-item
              [activity]="activity"
              [userInfo]="getUserInfo(activity.userId)"
            />
          }
        </div>
      }
    </div>
  `,
  styles: [
    `
      .activity-section {
        margin-top: 1.5rem;
      }

      .section-title {
        font-size: 0.75rem;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        color: var(--neon-cyan, #00f5ff);
        margin: 0 0 1rem 0;
      }

      .empty-text {
        color: rgba(255, 255, 255, 0.4);
        font-size: 0.875rem;
      }

      .activity-list {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
      }
    `,
  ],
})
export class ProjectActivityFeedComponent {
  readonly #userCacheService = inject(UserCacheService);

  activities = input<Activity[]>([]);

  getUserInfo(userId: string): UserInfo | null {
    return this.#userCacheService.getUserInfo(userId);
  }
}
