import { Component, input } from '@angular/core';
import { ProjectActivityDto } from '@codeheroes/types';

@Component({
  selector: 'app-top-projects',
  standalone: true,
  template: `
    <div class="top-projects-section">
      <h3 class="section-title">Top Projects This Week</h3>
      @if (projects() && projects()!.length > 0) {
        <div class="projects-list">
          @for (project of projects(); track project.id; let idx = $index) {
            <div class="project-item" role="listitem" [attr.aria-label]="'Rank ' + (idx + 1) + ': ' + project.name">
              <div class="rank-badge" [class.top-three]="idx < 3">
                <span class="rank-number">{{ idx + 1 }}</span>
              </div>
              <div class="project-content">
                <div class="project-info">
                  <h4 class="project-name">{{ project.name }}</h4>
                  <div class="project-meta">
                    <span class="meta-item">
                      <span class="meta-icon">⚡</span>
                      <span class="meta-value">{{ formatXp(project.xpGained) }} XP</span>
                    </span>
                    <span class="meta-separator">•</span>
                    <span class="meta-item">
                      <span class="meta-icon">👥</span>
                      <span class="meta-value">{{ project.activeMembers }}</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          }
        </div>
      } @else {
        <div class="empty-state">
          <p class="empty-text">No active projects yet</p>
        </div>
      }
    </div>
  `,
  styles: [
    `
      .top-projects-section {
        margin: 1.25rem 0;
      }

      .section-title {
        font-size: 0.875rem;
        font-weight: 600;
        color: rgba(255, 255, 255, 0.9);
        margin: 0 0 0.75rem 0;
        letter-spacing: -0.02em;
      }

      .projects-list {
        background: rgba(255, 255, 255, 0.05);
        backdrop-filter: blur(12px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 12px;
        padding: 0.5rem;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
      }

      .project-item {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.75rem;
        border-radius: 8px;
        transition: all 0.2s ease;
      }

      .project-item:hover {
        background: rgba(255, 255, 255, 0.05);
      }

      .project-item:not(:last-child) {
        border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      }

      .rank-badge {
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 8px;
        background: rgba(255, 255, 255, 0.1);
        flex-shrink: 0;
      }

      .rank-badge.top-three {
        background: linear-gradient(135deg, var(--neon-purple) 0%, var(--neon-cyan) 100%);
      }

      .rank-number {
        font-size: 0.875rem;
        font-weight: 700;
        color: rgba(255, 255, 255, 0.95);
      }

      .project-content {
        flex: 1;
        min-width: 0;
      }

      .project-info {
        display: flex;
        flex-direction: column;
        gap: 0.375rem;
      }

      .project-name {
        font-size: 0.9375rem;
        font-weight: 600;
        color: rgba(255, 255, 255, 0.95);
        margin: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .project-meta {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.75rem;
        color: rgba(255, 255, 255, 0.5);
      }

      .meta-item {
        display: flex;
        align-items: center;
        gap: 0.25rem;
      }

      .meta-icon {
        font-size: 0.875rem;
      }

      .meta-separator {
        opacity: 0.4;
      }

      .empty-state {
        background: rgba(255, 255, 255, 0.03);
        border: 1px dashed rgba(255, 255, 255, 0.15);
        border-radius: 12px;
        padding: 2rem 1rem;
        text-align: center;
      }

      .empty-text {
        font-size: 0.9375rem;
        color: rgba(255, 255, 255, 0.7);
        margin: 0;
      }

      @media (min-width: 640px) {
        .projects-list {
          padding: 0.75rem;
        }

        .project-item {
          padding: 1rem;
        }

        .rank-badge {
          width: 36px;
          height: 36px;
        }

        .rank-number {
          font-size: 1rem;
        }

        .project-name {
          font-size: 1rem;
        }

        .project-meta {
          font-size: 0.8125rem;
        }
      }
    `,
  ],
})
export class TopProjectsComponent {
  projects = input<ProjectActivityDto[] | null>(null);

  formatXp(xp: number): string {
    if (xp >= 1000) {
      return `${(xp / 1000).toFixed(1)}K`;
    }
    return xp.toString();
  }
}
