import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActiveUsersService, UserLastActivity } from '../../../core/services/active-users.service';
import { UserCacheService } from '../../../core/services/user-cache.service';

@Component({
  selector: 'app-active-users-feed',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="active-users-container card-glow-purple">
      <h3 class="section-title">
        <span class="icon">👥</span>
        ACTIVE COLLEAGUES
      </h3>

      @if (isLoading()) {
        <div class="loading-state">Loading active users...</div>
      } @else if (activeUsers().length === 0) {
        <div class="empty-state">No recent activity from colleagues</div>
      } @else {
        <div class="users-list">
          @for (user of activeUsers(); track user.userId) {
            <div class="user-item">
              <div class="user-avatar">
                @if (user.photoUrl) {
                  <img [src]="user.photoUrl" [alt]="user.displayName" class="avatar-image" />
                } @else {
                  <div class="avatar-placeholder">{{ getInitials(user.displayName) }}</div>
                }
              </div>
              <div class="user-content">
                <div class="user-header">
                  <span class="user-name">{{ user.displayName || 'Unknown User' }}</span>
                  <span class="activity-time">{{ formatTime(user.lastActivity.timestamp) }}</span>
                </div>
                <div class="activity-description">
                  <span class="activity-icon">{{ getActivityIcon(user.lastActivity.type) }}</span>
                  <span class="activity-text">{{ user.lastActivity.description }}</span>
                  @if (user.lastActivity.xp) {
                    <span class="activity-xp">(+{{ user.lastActivity.xp }} XP)</span>
                  }
                </div>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [
    `
      .active-users-container {
        background: rgba(0, 0, 0, 0.6);
        backdrop-filter: blur(8px);
        border-radius: 8px;
        padding: 1rem;
        margin: 1rem 0;
      }

      .section-title {
        font-size: 0.75rem;
        color: rgba(255, 255, 255, 0.6);
        text-transform: uppercase;
        letter-spacing: 0.1em;
        margin-bottom: 1rem;
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      .icon {
        font-size: 1rem;
      }

      .loading-state,
      .empty-state {
        text-align: center;
        padding: 1.5rem;
        color: rgba(255, 255, 255, 0.4);
        font-size: 0.85rem;
      }

      .users-list {
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }

      .user-item {
        display: flex;
        gap: 0.75rem;
        padding: 0.75rem;
        background: rgba(255, 255, 255, 0.03);
        border-radius: 6px;
        border: 1px solid rgba(139, 92, 246, 0.1);
        transition: all 0.2s ease;
      }

      .user-item:hover {
        background: rgba(255, 255, 255, 0.05);
        border-color: rgba(139, 92, 246, 0.3);
        transform: translateY(-1px);
      }

      .user-avatar {
        flex-shrink: 0;
        width: 2.5rem;
        height: 2.5rem;
      }

      .avatar-image {
        width: 100%;
        height: 100%;
        border-radius: 50%;
        object-fit: cover;
        border: 2px solid rgba(139, 92, 246, 0.3);
      }

      .avatar-placeholder {
        width: 100%;
        height: 100%;
        border-radius: 50%;
        background: linear-gradient(135deg, rgba(139, 92, 246, 0.3), rgba(59, 130, 246, 0.3));
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.9rem;
        font-weight: 600;
        color: rgba(255, 255, 255, 0.8);
        border: 2px solid rgba(139, 92, 246, 0.3);
      }

      .user-content {
        flex: 1;
        min-width: 0;
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
      }

      .user-header {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        gap: 0.5rem;
      }

      .user-name {
        font-size: 0.9rem;
        font-weight: 600;
        color: rgba(255, 255, 255, 0.9);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .activity-time {
        font-size: 0.7rem;
        color: rgba(255, 255, 255, 0.3);
        white-space: nowrap;
        flex-shrink: 0;
      }

      .activity-description {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.8rem;
        color: rgba(255, 255, 255, 0.7);
        line-height: 1.4;
      }

      .activity-icon {
        font-size: 0.9rem;
        flex-shrink: 0;
      }

      .activity-text {
        flex: 1;
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .activity-xp {
        color: var(--neon-green, #10b981);
        font-weight: 600;
        white-space: nowrap;
        flex-shrink: 0;
        font-size: 0.75rem;
      }

      @media (max-width: 640px) {
        .user-name {
          font-size: 0.85rem;
        }

        .activity-description {
          font-size: 0.75rem;
        }

        .user-avatar {
          width: 2rem;
          height: 2rem;
        }
      }
    `,
  ],
})
export class ActiveUsersFeedComponent implements OnInit {
  readonly #activeUsersService = inject(ActiveUsersService);
  readonly #userCacheService = inject(UserCacheService);

  isLoading = signal(true);
  #rawActiveUsers = signal<UserLastActivity[]>([]);

  // Merge active users with user cache data
  activeUsers = computed(() => {
    const raw = this.#rawActiveUsers();
    return raw.map((user) => {
      const userInfo = this.#userCacheService.getUserInfo(user.userId);
      return {
        ...user,
        displayName: userInfo?.displayName || user.displayName || 'Unknown User',
        photoUrl: userInfo?.photoUrl || user.photoUrl,
      };
    });
  });

  async ngOnInit() {
    try {
      // Ensure users are loaded in cache
      await this.#userCacheService.loadUsers();

      // Subscribe to active users
      this.#activeUsersService.getActiveUsers(10).subscribe({
        next: (users) => {
          this.#rawActiveUsers.set(users);
          this.isLoading.set(false);
        },
        error: (error) => {
          console.error('Failed to load active users:', error);
          this.isLoading.set(false);
        },
      });
    } catch (error) {
      console.error('Failed to initialize active users feed:', error);
      this.isLoading.set(false);
    }
  }

  getInitials(name: string): string {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  }

  getActivityIcon(type: string): string {
    const iconMap: Record<string, string> = {
      'game-action': '⚡',
      'badge-earned': '🏆',
      'level-up': '⬆️',
    };
    return iconMap[type] || '⚡';
  }

  formatTime(timestamp: string): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
}
