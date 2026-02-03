import { Component, Input } from '@angular/core';
import { ActiveProject } from '../core/models/active-project.model';

@Component({
  selector: 'app-project-card',
  standalone: true,
  imports: [],
  template: `
    <div class="project-card" role="article" [attr.aria-label]="'Project: ' + project.displayName">
      <!-- Project Header -->
      <div class="project-header">
        <div class="project-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
        </div>
        <div class="project-info">
          <h3 class="project-name">{{ project.displayName }}</h3>
          <p class="project-owner">{{ project.owner }}</p>
        </div>
      </div>

      <!-- Project Stats -->
      <div class="project-stats">
        <div class="stat-item" [attr.aria-label]="project.memberCount + ' active members'">
          <svg class="stat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          <span class="stat-value">{{ project.memberCount }}</span>
          <span class="stat-label">{{ project.memberCount === 1 ? 'Member' : 'Members' }}</span>
        </div>

        <div class="stat-item" [attr.aria-label]="project.activityCount + ' activities'">
          <svg class="stat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
          </svg>
          <span class="stat-value">{{ project.activityCount }}</span>
          <span class="stat-label">{{ project.activityCount === 1 ? 'Activity' : 'Activities' }}</span>
        </div>
      </div>

      <!-- Activity Breakdown -->
      <div class="activity-breakdown">
        @if (project.activityBreakdown.pushes > 0) {
          <div class="activity-badge" title="Code Pushes">
            <span class="badge-icon">📤</span>
            <span class="badge-count">{{ project.activityBreakdown.pushes }}</span>
          </div>
        }
        @if (project.activityBreakdown.pullRequests > 0) {
          <div class="activity-badge" title="Pull Requests">
            <span class="badge-icon">🔀</span>
            <span class="badge-count">{{ project.activityBreakdown.pullRequests }}</span>
          </div>
        }
        @if (project.activityBreakdown.reviews > 0) {
          <div class="activity-badge" title="Code Reviews">
            <span class="badge-icon">👀</span>
            <span class="badge-count">{{ project.activityBreakdown.reviews }}</span>
          </div>
        }
        @if (project.activityBreakdown.issues > 0) {
          <div class="activity-badge" title="Issues">
            <span class="badge-icon">🐛</span>
            <span class="badge-count">{{ project.activityBreakdown.issues }}</span>
          </div>
        }
        @if (project.activityBreakdown.comments > 0) {
          <div class="activity-badge" title="Comments">
            <span class="badge-icon">💬</span>
            <span class="badge-count">{{ project.activityBreakdown.comments }}</span>
          </div>
        }
      </div>

      <!-- Last Activity -->
      <div class="last-activity">
        <span class="activity-time">{{ project.recentActivityDescription }}</span>
      </div>

      <!-- Pulse Animation for Recent Activity -->
      @if (isRecent()) {
        <div class="pulse-indicator" aria-hidden="true"></div>
      }
    </div>
  `,
  styles: [
    `
      .project-card {
        position: relative;
        background: rgba(0, 0, 0, 0.6);
        border: 1px solid rgba(191, 0, 255, 0.3);
        border-radius: 12px;
        padding: 1.25rem;
        transition: all 0.3s ease;
        overflow: hidden;
      }

      .project-card::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 2px;
        background: linear-gradient(90deg, 
          transparent 0%, 
          var(--neon-cyan, #00f5ff) 50%, 
          transparent 100%
        );
        opacity: 0;
        transition: opacity 0.3s ease;
      }

      .project-card:hover {
        border-color: rgba(191, 0, 255, 0.6);
        box-shadow: 0 4px 20px rgba(191, 0, 255, 0.2);
        transform: translateY(-2px);
      }

      .project-card:hover::before {
        opacity: 1;
      }

      .project-header {
        display: flex;
        align-items: center;
        gap: 1rem;
        margin-bottom: 1rem;
      }

      .project-icon {
        width: 48px;
        height: 48px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(191, 0, 255, 0.1);
        border-radius: 8px;
        color: var(--neon-purple, #bf00ff);
      }

      .project-icon svg {
        width: 28px;
        height: 28px;
      }

      .project-info {
        flex: 1;
        min-width: 0;
      }

      .project-name {
        font-size: 1.125rem;
        font-weight: 700;
        color: #ffffff;
        margin: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .project-owner {
        font-size: 0.875rem;
        color: rgba(255, 255, 255, 0.6);
        margin: 0.25rem 0 0;
        font-family: 'JetBrains Mono', monospace;
      }

      .project-stats {
        display: flex;
        gap: 1.5rem;
        margin-bottom: 1rem;
        padding-bottom: 1rem;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      }

      .stat-item {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      .stat-icon {
        width: 20px;
        height: 20px;
        color: var(--neon-cyan, #00f5ff);
      }

      .stat-value {
        font-size: 1.25rem;
        font-weight: 700;
        color: var(--neon-cyan, #00f5ff);
        font-family: 'JetBrains Mono', monospace;
      }

      .stat-label {
        font-size: 0.75rem;
        color: rgba(255, 255, 255, 0.5);
        text-transform: uppercase;
        letter-spacing: 0.05em;
        font-family: 'JetBrains Mono', monospace;
      }

      .activity-breakdown {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
        margin-bottom: 1rem;
      }

      .activity-badge {
        display: flex;
        align-items: center;
        gap: 0.375rem;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 6px;
        padding: 0.25rem 0.5rem;
        font-size: 0.875rem;
      }

      .badge-icon {
        font-size: 1rem;
        line-height: 1;
      }

      .badge-count {
        font-weight: 600;
        color: rgba(255, 255, 255, 0.8);
        font-family: 'JetBrains Mono', monospace;
      }

      .last-activity {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        color: rgba(255, 255, 255, 0.5);
        font-size: 0.8125rem;
        font-family: 'JetBrains Mono', monospace;
      }

      .activity-time {
        color: var(--neon-cyan, #00f5ff);
        font-weight: 500;
      }

      .pulse-indicator {
        position: absolute;
        top: 12px;
        right: 12px;
        width: 8px;
        height: 8px;
        background: var(--neon-cyan, #00f5ff);
        border-radius: 50%;
        animation: pulse 2s ease-in-out infinite;
      }

      @keyframes pulse {
        0%, 100% {
          opacity: 1;
          box-shadow: 0 0 0 0 rgba(0, 245, 255, 0.7);
        }
        50% {
          opacity: 0.5;
          box-shadow: 0 0 0 8px rgba(0, 245, 255, 0);
        }
      }

      @media (min-width: 768px) {
        .project-card {
          padding: 1.5rem;
        }

        .project-icon {
          width: 56px;
          height: 56px;
        }

        .project-icon svg {
          width: 32px;
          height: 32px;
        }

        .project-name {
          font-size: 1.25rem;
        }
      }
    `,
  ],
})
export class ProjectCardComponent {
  @Input({ required: true }) project!: ActiveProject;

  /**
   * Check if project had recent activity (within last hour)
   */
  isRecent(): boolean {
    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);
    return new Date(this.project.lastActivityAt) > oneHourAgo;
  }
}
