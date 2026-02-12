import { Component, input } from '@angular/core';
import { ProjectActivityDto } from '@codeheroes/types';

@Component({
  selector: 'app-my-active-projects',
  standalone: true,
  template: `
    <div class="my-active-projects-section">
      <h3 class="section-title">My Active Projects</h3>
      @if (projects() && projects()!.length > 0) {
        <div class="projects-list">
          @for (project of projects(); track project.id) {
            <div class="project-card" role="group" [attr.aria-label]="'Project: ' + project.name">
              <div class="project-header">
                <div class="project-icon">📦</div>
                <div class="project-info">
                  <h4 class="project-name">{{ project.name }}</h4>
                  @if (project.description) {
                    <p class="project-description">{{ project.description }}</p>
                  }
                </div>
              </div>
              <div class="project-stats">
                <div class="stat-item">
                  <span class="stat-value">{{ formatXp(project.xpGained) }}</span>
                  <span class="stat-label">XP This Week</span>
                </div>
                <div class="stat-item">
                  <span class="stat-value">{{ project.activeMembers }}</span>
                  <span class="stat-label">Active {{ project.activeMembers === 1 ? 'Member' : 'Members' }}</span>
                </div>
              </div>
            </div>
          }
        </div>
      } @else {
        <div class="empty-state">
          <p class="empty-text">No active projects this week</p>
          <p class="empty-subtext">Start contributing to see your projects here!</p>
        </div>
      }
    </div>
  `,
  styles: [
    `
      .my-active-projects-section {
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
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
      }

      .project-card {
        background: rgba(255, 255, 255, 0.05);
        backdrop-filter: blur(12px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 12px;
        padding: 1rem;
        transition: all 0.2s ease;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
      }

      .project-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
        border-color: var(--neon-purple);
        background: rgba(255, 255, 255, 0.08);
      }

      .project-header {
        display: flex;
        gap: 0.75rem;
        margin-bottom: 0.75rem;
      }

      .project-icon {
        width: 36px;
        height: 36px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 8px;
        background: rgba(168, 85, 247, 0.15);
        font-size: 1.25rem;
        flex-shrink: 0;
      }

      .project-info {
        flex: 1;
        min-width: 0;
      }

      .project-name {
        font-size: 0.9375rem;
        font-weight: 600;
        color: rgba(255, 255, 255, 0.95);
        margin: 0 0 0.25rem 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .project-description {
        font-size: 0.75rem;
        color: rgba(255, 255, 255, 0.5);
        margin: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .project-stats {
        display: flex;
        gap: 1rem;
        padding-top: 0.75rem;
        border-top: 1px solid rgba(255, 255, 255, 0.08);
      }

      .stat-item {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
      }

      .stat-value {
        font-size: 1rem;
        font-weight: 700;
        color: var(--neon-purple);
      }

      .stat-label {
        font-size: 0.6875rem;
        color: rgba(255, 255, 255, 0.5);
        text-transform: uppercase;
        letter-spacing: 0.05em;
        font-weight: 500;
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
        margin: 0 0 0.5rem 0;
      }

      .empty-subtext {
        font-size: 0.8125rem;
        color: rgba(255, 255, 255, 0.4);
        margin: 0;
      }

      @media (min-width: 640px) {
        .project-card {
          padding: 1.25rem;
        }

        .project-icon {
          width: 40px;
          height: 40px;
          font-size: 1.375rem;
        }

        .project-name {
          font-size: 1rem;
        }

        .project-description {
          font-size: 0.8125rem;
        }

        .stat-value {
          font-size: 1.125rem;
        }

        .stat-label {
          font-size: 0.75rem;
        }
      }
    `,
  ],
})
export class MyActiveProjectsComponent {
  projects = input<ProjectActivityDto[] | null>(null);

  formatXp(xp: number): string {
    if (xp >= 1000) {
      return `${(xp / 1000).toFixed(1)}K`;
    }
    return xp.toString();
  }
}
