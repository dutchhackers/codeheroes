import { Component, inject, signal, OnDestroy, AfterViewInit, ElementRef, viewChild } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription, forkJoin, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, Subject, catchError, take } from 'rxjs';
import { UserDto, UserStats } from '@codeheroes/types';
import { UserSearchService } from '../../core/services/user-search.service';
import { UserStatsService } from '../../core/services/user-stats.service';

@Component({
  selector: 'app-user-search',
  standalone: true,
  imports: [FormsModule],
  template: `
    <!-- Header -->
    <header class="sticky top-0 z-20 bg-black/90 backdrop-blur-sm px-4 py-4 md:px-6 lg:px-8 md:py-5">
      <div class="flex items-center justify-between relative z-10">
        <h1 class="text-2xl md:text-4xl font-bold italic text-white">Find Heroes</h1>
      </div>
    </header>

    <!-- Main Content -->
    <main class="relative z-10 px-4 md:px-6 lg:px-8 pb-24">
      <div class="max-w-2xl mx-auto py-8">
        <!-- Search Input -->
        <div class="mb-6">
          <div class="relative">
            <input
              type="text"
              [(ngModel)]="searchTerm"
              (ngModelChange)="onSearchChange($event)"
              placeholder="Search for heroes..."
              #searchInput
              class="search-input w-full px-4 py-3 pl-12 bg-black/50 border border-purple-500/30 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-colors"
              aria-label="Search for users"
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

        <!-- Search Results -->
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
                class="user-card w-full text-left"
                [attr.aria-label]="'View profile of ' + user.displayName"
              >
                <div class="flex items-center gap-4">
                  <!-- Avatar -->
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

                  <!-- User Info -->
                  <div class="flex-1 min-w-0">
                    <h3 class="text-white font-semibold truncate">
                      {{ user.displayName }}
                    </h3>
                    @if (getUserStats(user.id); as stats) {
                      <p class="user-level">Level {{ stats.level }}</p>
                    } @else if (isLoadingStats()) {
                      <p class="user-level user-level-loading">Loading...</p>
                    }
                  </div>

                  <!-- Arrow -->
                  <svg
                    class="w-5 h-5 text-slate-600 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </button>
            }
          </div>
        } @else {
          <div class="text-center py-12">
            <p class="text-lg text-slate-500">Browse heroes or start typing to search</p>
          </div>
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

      .user-card {
        background: rgba(0, 0, 0, 0.3);
        border: 1px solid rgba(139, 92, 246, 0.2);
        border-radius: 12px;
        padding: 1rem;
        transition: all 0.2s;
        cursor: pointer;
      }

      .user-card:hover {
        border-color: var(--neon-cyan);
        background: rgba(6, 182, 212, 0.1);
        box-shadow: 0 0 20px rgba(6, 182, 212, 0.2);
      }

      .user-card:focus {
        outline: 2px solid var(--neon-cyan);
        outline-offset: 2px;
      }

      .user-level {
        font-size: 0.75rem;
        color: var(--neon-cyan);
        margin-top: 0.125rem;
      }

      .user-level-loading {
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
  readonly #router = inject(Router);

  readonly searchInputRef = viewChild<ElementRef<HTMLInputElement>>('searchInput');

  searchTerm = '';
  users = signal<UserDto[]>([]);
  isSearching = signal(false);
  isLoadingStats = signal(false);
  #failedImageIds = signal<Set<string>>(new Set());
  #userStatsMap = signal<Map<string, UserStats>>(new Map());
  #statsSubscription: Subscription | null = null;

  #searchSubject = new Subject<string>();
  #searchSubscription: Subscription;

  constructor() {
    // Set up debounced search
    this.#searchSubscription = this.#searchSubject
      .pipe(
        debounceTime(300),
        distinctUntilChanged()
      )
      .subscribe((term) => {
        this.#performSearch(term);
      });

    // Load initial users
    this.#loadInitialUsers();
  }

  ngAfterViewInit() {
    setTimeout(() => this.searchInputRef()?.nativeElement.focus(), 50);
  }

  ngOnDestroy() {
    this.#searchSubscription?.unsubscribe();
    this.#statsSubscription?.unsubscribe();
  }

  #loadInitialUsers() {
    this.isSearching.set(true);
    this.#userSearchService.getAllUsers(20).subscribe({
      next: (users) => {
        this.users.set(users);
        this.isSearching.set(false);
        this.#loadStatsForUsers(users);
      },
      error: (error) => {
        console.error('Failed to load users:', error);
        this.isSearching.set(false);
      },
    });
  }

  #performSearch(term: string) {
    if (!term || term.trim().length === 0) {
      this.#loadInitialUsers();
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

  onSearchChange(term: string) {
    this.#searchSubject.next(term);
  }

  viewProfile(userId: string) {
    this.#router.navigate(['/users', userId]);
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
}
