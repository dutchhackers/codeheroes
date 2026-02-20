import { Component, inject, signal, OnDestroy, AfterViewInit, ElementRef, viewChild } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription, forkJoin, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, Subject, catchError, take } from 'rxjs';
import { UserDto, UserStats, ProjectSummaryDto } from '@codeheroes/types';
import { UserSearchService } from '../../core/services/user-search.service';
import { UserStatsService } from '../../core/services/user-stats.service';
import { ProjectSearchService } from '../../core/services/project-search.service';

type SearchTab = 'heroes' | 'projects';

@Component({
  selector: 'app-user-search',
  standalone: true,
  imports: [FormsModule],
  template: `
    <!-- Header -->
    <header class="sticky top-0 z-20 bg-black/90 backdrop-blur-sm px-4 py-4 md:px-6 lg:px-8 md:py-5">
      <div class="flex items-center justify-between relative z-10">
        <h1 class="text-2xl md:text-4xl font-bold italic text-white">Search</h1>
      </div>
    </header>

    <!-- Main Content -->
    <main class="relative z-10 px-4 md:px-6 lg:px-8 pb-24">
      <div class="max-w-2xl mx-auto py-4 md:py-8">
        <!-- Search Input -->
        <div class="mb-4">
          <div class="relative">
            <input
              type="text"
              [(ngModel)]="searchTerm"
              (ngModelChange)="onSearchChange($event)"
              [placeholder]="activeTab() === 'heroes' ? 'Search for heroes...' : 'Search for projects...'"
              #searchInput
              class="search-input w-full px-4 py-3 pl-12 bg-black/50 border border-purple-500/30 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-colors"
              [attr.aria-label]="'Search for ' + activeTab()"
            />
            <svg
              class="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>

        <!-- Tab Buttons -->
        <div class="search-tabs">
          <button
            type="button"
            class="search-tab"
            [class.search-tab-active]="activeTab() === 'heroes'"
            (click)="switchTab('heroes')"
          >
            Heroes
          </button>
          <button
            type="button"
            class="search-tab"
            [class.search-tab-active]="activeTab() === 'projects'"
            (click)="switchTab('projects')"
          >
            Projects
          </button>
        </div>

        <!-- Heroes Tab -->
        @if (activeTab() === 'heroes') {
          @if (isSearching()) {
            <div class="flex items-center justify-center py-12">
              <div class="text-lg text-purple-400/70 animate-pulse" role="status" aria-live="polite">
                Searching...
              </div>
            </div>
          } @else if (searchTerm && users().length === 0) {
            <div class="text-center py-12">
              <p class="text-lg text-slate-500">No heroes found</p>
              <p class="text-sm mt-2 text-slate-600">Try a different search term</p>
            </div>
          } @else if (users().length > 0) {
            <div class="space-y-3">
              @for (user of users(); track user.id) {
                <button
                  type="button"
                  (click)="viewProfile(user.id)"
                  class="result-card w-full text-left"
                  [attr.aria-label]="'View profile of ' + user.displayName"
                >
                  <div class="flex items-center gap-4">
                    <div class="flex-shrink-0">
                      @if (user.photoUrl && !hasImageError(user.id)) {
                        <img
                          [src]="user.photoUrl"
                          [alt]="user.displayName + ' avatar'"
                          class="w-12 h-12 rounded-full border-2 border-purple-500/30"
                          (error)="onImageError(user.id)"
                        />
                      } @else {
                        <div
                          class="w-12 h-12 rounded-full border-2 border-purple-500/30 bg-gradient-to-br from-purple-600 to-cyan-600 flex items-center justify-center"
                        >
                          <span class="text-white font-bold text-lg">
                            {{ getInitials(user.displayName) }}
                          </span>
                        </div>
                      }
                    </div>
                    <div class="flex-1 min-w-0">
                      <h3 class="text-white font-semibold truncate">
                        {{ user.displayName }}
                      </h3>
                      @if (getUserStats(user.id); as stats) {
                        <p class="result-subtitle text-cyan-400">Level {{ stats.level }}</p>
                      } @else if (isLoadingStats()) {
                        <p class="result-subtitle result-subtitle-loading">Loading...</p>
                      }
                    </div>
                    <svg
                      class="w-5 h-5 text-slate-600 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </button>
              }
            </div>
          } @else {
            <div class="text-center py-12">
              <div class="text-3xl mb-3">⚔️</div>
              <p class="text-lg text-slate-500">Search for heroes</p>
              <p class="text-sm mt-1 text-slate-600">Find developers by name</p>
            </div>
          }
        }

        <!-- Projects Tab -->
        @if (activeTab() === 'projects') {
          @if (isSearchingProjects()) {
            <div class="flex items-center justify-center py-12">
              <div class="text-lg text-purple-400/70 animate-pulse" role="status" aria-live="polite">
                Searching...
              </div>
            </div>
          } @else if (searchTerm && projects().length === 0) {
            <div class="text-center py-12">
              <p class="text-lg text-slate-500">No projects found</p>
              <p class="text-sm mt-2 text-slate-600">Try a different search term</p>
            </div>
          } @else if (projects().length > 0) {
            <div class="space-y-3">
              @for (project of projects(); track project.id) {
                <button
                  type="button"
                  (click)="viewProject(project.id)"
                  class="result-card w-full text-left"
                  [attr.aria-label]="'View project ' + project.name"
                >
                  <div class="flex items-center gap-4">
                    <div class="flex-shrink-0">
                      <div
                        class="w-12 h-12 rounded-lg border-2 border-purple-500/30 bg-gradient-to-br from-purple-800 to-indigo-900 flex items-center justify-center"
                      >
                        <span class="text-white font-bold text-lg">
                          {{ getInitials(project.name) }}
                        </span>
                      </div>
                    </div>
                    <div class="flex-1 min-w-0">
                      <h3 class="text-white font-semibold truncate">{{ project.name }}</h3>
                      @if (project.description) {
                        <p class="result-subtitle text-slate-400 truncate">{{ project.description }}</p>
                      }
                      <div class="flex gap-3 mt-1">
                        <span class="text-xs text-cyan-400">{{ formatXp(project.totalXp) }} XP</span>
                        <span class="text-xs text-purple-400">{{ project.activeMemberCount }} members</span>
                        <span class="text-xs text-orange-400">{{ project.repositoryCount }} repos</span>
                      </div>
                    </div>
                    <svg
                      class="w-5 h-5 text-slate-600 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </button>
              }
            </div>
          } @else {
            <div class="text-center py-12">
              <div class="text-3xl mb-3">📂</div>
              <p class="text-lg text-slate-500">Search for projects</p>
              <p class="text-sm mt-1 text-slate-600">Find projects by name</p>
            </div>
          }
        }
      </div>
    </main>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .search-input {
        min-height: 48px;
      }

      .search-tabs {
        display: flex;
        gap: 0.5rem;
        margin-bottom: 1.5rem;
      }

      .search-tab {
        padding: 0.5rem 1rem;
        border-radius: 9999px;
        border: 1px solid rgba(139, 92, 246, 0.3);
        background: rgba(0, 0, 0, 0.3);
        color: rgba(255, 255, 255, 0.6);
        font-size: 0.875rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
      }

      .search-tab:hover {
        border-color: rgba(6, 182, 212, 0.5);
        color: white;
      }

      .search-tab-active {
        border-color: var(--neon-cyan);
        background: rgba(6, 182, 212, 0.15);
        color: var(--neon-cyan);
        box-shadow: 0 0 12px rgba(6, 182, 212, 0.2);
      }

      .result-card {
        background: rgba(0, 0, 0, 0.3);
        border: 1px solid rgba(139, 92, 246, 0.2);
        border-radius: 12px;
        padding: 1rem;
        transition: all 0.2s;
        cursor: pointer;
      }

      .result-card:hover {
        border-color: var(--neon-cyan);
        background: rgba(6, 182, 212, 0.1);
        box-shadow: 0 0 20px rgba(6, 182, 212, 0.2);
      }

      .result-card:focus {
        outline: 2px solid var(--neon-cyan);
        outline-offset: 2px;
      }

      .result-subtitle {
        font-size: 0.75rem;
        margin-top: 0.125rem;
      }

      .result-subtitle-loading {
        color: rgba(255, 255, 255, 0.3);
        animation: pulse 1.5s ease-in-out infinite;
      }

      @keyframes pulse {
        0%, 100% { opacity: 0.3; }
        50% { opacity: 0.6; }
      }
    `,
  ],
})
export class UserSearchComponent implements OnDestroy, AfterViewInit {
  readonly #userSearchService = inject(UserSearchService);
  readonly #userStatsService = inject(UserStatsService);
  readonly #projectSearchService = inject(ProjectSearchService);
  readonly #router = inject(Router);

  readonly searchInputRef = viewChild<ElementRef<HTMLInputElement>>('searchInput');

  activeTab = signal<SearchTab>('heroes');
  searchTerm = '';
  users = signal<UserDto[]>([]);
  projects = signal<ProjectSummaryDto[]>([]);
  isSearching = signal(false);
  isSearchingProjects = signal(false);
  isLoadingStats = signal(false);
  #failedImageIds = signal<Set<string>>(new Set());
  #userStatsMap = signal<Map<string, UserStats>>(new Map());
  #statsSubscription: Subscription | null = null;
  #projectSearchSubscription: Subscription | null = null;

  #searchSubject = new Subject<string>();
  #searchSubscription: Subscription;

  constructor() {
    this.#searchSubscription = this.#searchSubject
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe((term) => {
        if (this.activeTab() === 'heroes') {
          this.#performUserSearch(term);
        } else {
          this.#performProjectSearch(term);
        }
      });
  }

  ngAfterViewInit() {
    setTimeout(() => this.searchInputRef()?.nativeElement.focus(), 50);
  }

  ngOnDestroy() {
    this.#searchSubscription?.unsubscribe();
    this.#statsSubscription?.unsubscribe();
    this.#projectSearchSubscription?.unsubscribe();
  }

  switchTab(tab: SearchTab) {
    if (tab === this.activeTab()) return;
    this.activeTab.set(tab);
    // Re-search with current term in the new tab
    if (this.searchTerm) {
      this.#searchSubject.next(this.searchTerm);
    }
  }

  onSearchChange(term: string) {
    this.#searchSubject.next(term);
  }

  #performUserSearch(term: string) {
    if (!term || term.trim().length === 0) {
      this.users.set([]);
      this.isSearching.set(false);
      return;
    }

    this.isSearching.set(true);
    this.#userSearchService.searchUsers(term).subscribe({
      next: (users) => {
        this.users.set(users);
        this.isSearching.set(false);
        this.#loadStatsForUsers(users);
      },
      error: (error) => {
        console.error('Search failed:', error);
        this.isSearching.set(false);
      },
    });
  }

  #performProjectSearch(term: string) {
    if (!term || term.trim().length === 0) {
      this.projects.set([]);
      this.isSearchingProjects.set(false);
      return;
    }

    this.isSearchingProjects.set(true);
    this.#projectSearchSubscription?.unsubscribe();
    this.#projectSearchSubscription = this.#projectSearchService.searchProjects(term).subscribe({
      next: (projects) => {
        this.projects.set(projects);
        this.isSearchingProjects.set(false);
      },
      error: (error) => {
        console.error('Project search failed:', error);
        this.isSearchingProjects.set(false);
      },
    });
  }

  #loadStatsForUsers(users: UserDto[]) {
    this.#statsSubscription?.unsubscribe();
    if (users.length === 0) return;

    this.isLoadingStats.set(true);
    const statRequests = users.slice(0, 20).map((u) =>
      this.#userStatsService.getUserStats(u.id).pipe(
        take(1),
        catchError(() => of(null)),
      ),
    );

    this.#statsSubscription = forkJoin(statRequests).subscribe({
      next: (results) => {
        const statsMap = new Map<string, UserStats>();
        results.forEach((stats, i) => {
          if (stats) statsMap.set(users[i].id, stats);
        });
        this.#userStatsMap.set(statsMap);
        this.isLoadingStats.set(false);
      },
      error: () => this.isLoadingStats.set(false),
    });
  }

  getUserStats(userId: string): UserStats | null {
    return this.#userStatsMap().get(userId) ?? null;
  }

  viewProfile(userId: string) {
    this.#router.navigate(['/users', userId]);
  }

  viewProject(projectId: string) {
    this.#router.navigate(['/projects', projectId]);
  }

  hasImageError(userId: string): boolean {
    return this.#failedImageIds().has(userId);
  }

  onImageError(userId: string): void {
    this.#failedImageIds.update((set) => new Set(set).add(userId));
  }

  getInitials(name: string): string {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
    }
    return name.charAt(0).toUpperCase();
  }

  formatXp(value: number): string {
    if (value >= 1000000) return (value / 1000000).toFixed(1) + 'M';
    if (value >= 1000) return (value / 1000).toFixed(value >= 10000 ? 0 : 1) + 'K';
    return value.toLocaleString();
  }
}
