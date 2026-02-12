import { Component, input, output } from '@angular/core';
import { UserInfo } from '../../../core/services/user-cache.service';

@Component({
  selector: 'app-project-members',
  standalone: true,
  template: `
    <div class="members-section">
      <h3 class="section-title">Team Members</h3>
      @if (members().length === 0) {
        <p class="empty-text">No members recorded yet.</p>
      } @else {
        <div class="members-grid">
          @for (member of members(); track member.id) {
            <button type="button" class="member-chip" (click)="selectMember.emit(member.id)">
              @if (member.photoUrl) {
                <img
                  [src]="member.photoUrl"
                  [alt]="member.displayName"
                  class="member-avatar"
                  referrerpolicy="no-referrer"
                />
              } @else {
                <div class="member-avatar-placeholder">
                  {{ getInitials(member.displayName) }}
                </div>
              }
              <span class="member-name">{{ member.displayName }}</span>
            </button>
          }
        </div>
      }
    </div>
  `,
  styles: [
    `
      .members-section {
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

      .members-grid {
        display: flex;
        flex-wrap: wrap;
        gap: 0.75rem;
      }

      .member-chip {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 999px;
        padding: 0.375rem 0.75rem 0.375rem 0.375rem;
        cursor: pointer;
        transition: all 0.2s;
        color: white;
      }

      .member-chip:hover {
        background: rgba(255, 255, 255, 0.1);
        border-color: rgba(255, 255, 255, 0.2);
      }

      .member-avatar {
        width: 28px;
        height: 28px;
        border-radius: 50%;
        object-fit: cover;
      }

      .member-avatar-placeholder {
        width: 28px;
        height: 28px;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.1);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.7rem;
        font-weight: 600;
        color: rgba(255, 255, 255, 0.7);
      }

      .member-name {
        font-size: 0.8125rem;
        font-weight: 500;
        color: rgba(255, 255, 255, 0.85);
        white-space: nowrap;
      }
    `,
  ],
})
export class ProjectMembersComponent {
  members = input<UserInfo[]>([]);
  selectMember = output<string>();

  getInitials(name: string): string {
    const parts = name.split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }
}
