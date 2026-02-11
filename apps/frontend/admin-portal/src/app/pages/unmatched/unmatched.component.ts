import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { SuiButtonComponent } from '@move4mobile/stride-ui';
import { UnmatchedEvent } from '@codeheroes/types';
import { UnmatchedEventsService } from '../../core/services/unmatched-events.service';
import { CreateUserModalComponent } from './components/create-user-modal.component';
import { LinkToUserModalComponent } from './components/link-to-user-modal.component';
import { LinkToProjectModalComponent } from './components/link-to-project-modal.component';
import { CreateProjectModalComponent } from './components/create-project-modal.component';

type TabType = 'unknown_user' | 'unlinked_repo';

@Component({
  selector: 'admin-unmatched',
  standalone: true,
  imports: [
    DatePipe,
    SuiButtonComponent,
    CreateUserModalComponent,
    LinkToUserModalComponent,
    LinkToProjectModalComponent,
    CreateProjectModalComponent,
  ],
  template: `
    <div>
      <div class="page-header">
        <div>
          <h1 class="page-title">Unmatched Events</h1>
          <p class="page-subtitle">Events that could not be matched to users or projects</p>
        </div>
        <sui-button variant="outline" color="neutral" size="sm" (click)="refresh()">
          Refresh
        </sui-button>
      </div>

      <div class="tabs">
        <button
          class="tab"
          [class.tab--active]="activeTab() === 'unknown_user'"
          (click)="switchTab('unknown_user')"
        >
          Unknown Users
          @if (unknownUserCount() > 0) {
            <span class="tab-badge">{{ unknownUserCount() }}</span>
          }
        </button>
        <button
          class="tab"
          [class.tab--active]="activeTab() === 'unlinked_repo'"
          (click)="switchTab('unlinked_repo')"
        >
          Unlinked Repos
          @if (unlinkedRepoCount() > 0) {
            <span class="tab-badge">{{ unlinkedRepoCount() }}</span>
          }
        </button>
      </div>

      @if (isLoading()) {
        <div class="loading-state">
          <p>Loading events...</p>
        </div>
      } @else if (error()) {
        <div class="error-state">
          <p>{{ error() }}</p>
          <sui-button variant="outline" color="neutral" size="sm" (click)="loadEvents()">
            Try again
          </sui-button>
        </div>
      } @else if (events().length === 0) {
        <div class="empty-state">
          <p>No {{ activeTab() === 'unknown_user' ? 'unknown users' : 'unlinked repos' }} found.</p>
        </div>
      } @else {
        <div class="table-container">
          @if (activeTab() === 'unknown_user') {
            <table class="data-table">
              <thead>
                <tr>
                  <th>Provider</th>
                  <th>External ID</th>
                  <th>Username</th>
                  <th>Event Types</th>
                  <th>Events</th>
                  <th>Last Seen</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                @for (event of events(); track event.id) {
                  <tr>
                    <td><span class="provider-badge">{{ event.provider }}</span></td>
                    <td class="monospace">{{ event.externalUserId }}</td>
                    <td>{{ event.externalUserName || '-' }}</td>
                    <td>
                      <div class="event-types">
                        @for (type of event.sampleEventTypes; track type) {
                          <span class="event-type-tag">{{ type }}</span>
                        }
                      </div>
                    </td>
                    <td>{{ event.eventCount }}</td>
                    <td>{{ event.lastSeenAt | date: 'medium' }}</td>
                    <td>
                      <div class="action-buttons">
                        <sui-button variant="outline" color="brand" size="sm" (click)="openLinkUserModal(event)">
                          Link
                        </sui-button>
                        <sui-button variant="outline" color="brand" size="sm" (click)="openCreateUserModal(event)">
                          Create
                        </sui-button>
                        <sui-button variant="ghost" color="neutral" size="sm" (click)="dismissEvent(event)">
                          Dismiss
                        </sui-button>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          } @else {
            <table class="data-table">
              <thead>
                <tr>
                  <th>Provider</th>
                  <th>Repository</th>
                  <th>Event Types</th>
                  <th>Events</th>
                  <th>Last Seen</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                @for (event of events(); track event.id) {
                  <tr>
                    <td><span class="provider-badge">{{ event.provider }}</span></td>
                    <td class="monospace">{{ event.repoFullName }}</td>
                    <td>
                      <div class="event-types">
                        @for (type of event.sampleEventTypes; track type) {
                          <span class="event-type-tag">{{ type }}</span>
                        }
                      </div>
                    </td>
                    <td>{{ event.eventCount }}</td>
                    <td>{{ event.lastSeenAt | date: 'medium' }}</td>
                    <td>
                      <div class="action-buttons">
                        <sui-button variant="outline" color="brand" size="sm" (click)="openLinkProjectModal(event)">
                          Link
                        </sui-button>
                        <sui-button variant="outline" color="brand" size="sm" (click)="openCreateProjectModal(event)">
                          Create
                        </sui-button>
                        <sui-button variant="ghost" color="neutral" size="sm" (click)="dismissEvent(event)">
                          Dismiss
                        </sui-button>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          }
        </div>
      }
    </div>

    @if (showCreateUserModal()) {
      <admin-create-user-modal
        [event]="selectedEvent()!"
        (saved)="onModalSaved()"
        (closed)="closeModals()"
      />
    }
    @if (showLinkUserModal()) {
      <admin-link-to-user-modal
        [event]="selectedEvent()!"
        (saved)="onModalSaved()"
        (closed)="closeModals()"
      />
    }
    @if (showLinkProjectModal()) {
      <admin-link-to-project-modal
        [event]="selectedEvent()!"
        (saved)="onModalSaved()"
        (closed)="closeModals()"
      />
    }
    @if (showCreateProjectModal()) {
      <admin-create-project-modal
        [event]="selectedEvent()!"
        (saved)="onModalSaved()"
        (closed)="closeModals()"
      />
    }
  `,
  styles: [
    `
      .page-header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        margin-bottom: 24px;
      }

      .page-title {
        font-size: 24px;
        font-weight: 700;
        color: var(--theme-color-text-default);
        margin-bottom: 4px;
      }

      .page-subtitle {
        font-size: 14px;
        color: var(--theme-color-text-neutral-tertiary);
      }

      .tabs {
        display: flex;
        gap: 0;
        margin-bottom: 24px;
        border-bottom: 1px solid var(--theme-color-border-default-default);
      }

      .tab {
        padding: 10px 20px;
        font-size: 14px;
        font-weight: 500;
        color: var(--theme-color-text-neutral-tertiary);
        background: none;
        border: none;
        border-bottom: 2px solid transparent;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 8px;
        font-family: inherit;
        transition: all 0.15s ease;
      }

      .tab:hover {
        color: var(--theme-color-text-default);
      }

      .tab--active {
        color: var(--theme-color-text-brand-default);
        border-bottom-color: var(--theme-color-border-brand-default);
      }

      .tab-badge {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 20px;
        height: 20px;
        padding: 0 6px;
        border-radius: 10px;
        background: var(--theme-color-bg-brand-default);
        color: white;
        font-size: 11px;
        font-weight: 600;
      }

      .loading-state,
      .empty-state {
        text-align: center;
        padding: 48px 0;
        color: var(--theme-color-text-neutral-tertiary);
        font-size: 14px;
      }

      .error-state {
        background: var(--theme-color-feedback-bg-error-secondary);
        border: 1px solid var(--theme-color-feedback-border-error-default);
        border-radius: 8px;
        padding: 16px;
        display: flex;
        align-items: center;
        gap: 12px;
        color: var(--theme-color-feedback-text-error-default);
        font-size: 14px;
      }

      .table-container {
        background: var(--theme-color-bg-surface-default);
        border: 1px solid var(--theme-color-border-default-default);
        border-radius: 8px;
        overflow: hidden;
      }

      .data-table {
        width: 100%;
        border-collapse: collapse;
      }

      .data-table th {
        text-align: left;
        padding: 12px 16px;
        font-size: 12px;
        font-weight: 600;
        color: var(--theme-color-text-neutral-tertiary);
        text-transform: uppercase;
        letter-spacing: 0.05em;
        border-bottom: 1px solid var(--theme-color-border-default-default);
        background: var(--theme-color-bg-neutral-secondary);
      }

      .data-table td {
        padding: 12px 16px;
        font-size: 14px;
        color: var(--theme-color-text-default);
        border-bottom: 1px solid var(--theme-color-border-default-default);
      }

      .data-table tr:last-child td {
        border-bottom: none;
      }

      .data-table tr:hover td {
        background: var(--theme-color-bg-neutral-secondary);
      }

      .provider-badge {
        display: inline-block;
        padding: 2px 8px;
        border-radius: 4px;
        font-size: 12px;
        font-weight: 500;
        background: var(--theme-color-bg-neutral-secondary);
        color: var(--theme-color-text-neutral-secondary);
        text-transform: capitalize;
      }

      .monospace {
        font-family: 'JetBrains Mono', monospace;
        font-size: 13px;
      }

      .event-types {
        display: flex;
        flex-wrap: wrap;
        gap: 4px;
      }

      .event-type-tag {
        display: inline-block;
        padding: 1px 6px;
        border-radius: 3px;
        font-size: 11px;
        background: var(--theme-color-bg-neutral-secondary);
        color: var(--theme-color-text-neutral-tertiary);
      }

      .action-buttons {
        display: flex;
        gap: 4px;
      }
    `,
  ],
})
export class UnmatchedComponent implements OnInit {
  readonly #unmatchedEventsService = inject(UnmatchedEventsService);

  readonly activeTab = signal<TabType>('unknown_user');
  readonly events = signal<UnmatchedEvent[]>([]);
  readonly isLoading = signal(true);
  readonly error = signal<string | null>(null);
  readonly unknownUserCount = signal(0);
  readonly unlinkedRepoCount = signal(0);

  // Modal state
  readonly selectedEvent = signal<UnmatchedEvent | null>(null);
  readonly showCreateUserModal = signal(false);
  readonly showLinkUserModal = signal(false);
  readonly showLinkProjectModal = signal(false);
  readonly showCreateProjectModal = signal(false);

  ngOnInit(): void {
    this.loadSummary();
    this.loadEvents();
  }

  switchTab(tab: TabType): void {
    this.activeTab.set(tab);
    this.loadEvents();
  }

  refresh(): void {
    this.loadSummary();
    this.loadEvents();
  }

  loadSummary(): void {
    this.#unmatchedEventsService.getSummary().subscribe({
      next: (summary) => {
        this.unknownUserCount.set(summary.unknownUserCount);
        this.unlinkedRepoCount.set(summary.unlinkedRepoCount);
      },
      error: (err) => console.error('Failed to load summary:', err),
    });
  }

  loadEvents(): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.#unmatchedEventsService
      .getEvents({ category: this.activeTab(), status: 'pending' })
      .subscribe({
        next: (events) => {
          this.events.set(events);
          this.isLoading.set(false);
        },
        error: (err) => {
          this.error.set('Failed to load events. Please try again.');
          this.isLoading.set(false);
          console.error('Failed to load events:', err);
        },
      });
  }

  dismissEvent(event: UnmatchedEvent): void {
    this.#unmatchedEventsService.dismiss(event.id).subscribe({
      next: () => this.refresh(),
      error: (err) => console.error('Failed to dismiss event:', err),
    });
  }

  openCreateUserModal(event: UnmatchedEvent): void {
    this.selectedEvent.set(event);
    this.showCreateUserModal.set(true);
  }

  openLinkUserModal(event: UnmatchedEvent): void {
    this.selectedEvent.set(event);
    this.showLinkUserModal.set(true);
  }

  openLinkProjectModal(event: UnmatchedEvent): void {
    this.selectedEvent.set(event);
    this.showLinkProjectModal.set(true);
  }

  openCreateProjectModal(event: UnmatchedEvent): void {
    this.selectedEvent.set(event);
    this.showCreateProjectModal.set(true);
  }

  closeModals(): void {
    this.showCreateUserModal.set(false);
    this.showLinkUserModal.set(false);
    this.showLinkProjectModal.set(false);
    this.showCreateProjectModal.set(false);
    this.selectedEvent.set(null);
  }

  onModalSaved(): void {
    this.closeModals();
    this.refresh();
  }
}
