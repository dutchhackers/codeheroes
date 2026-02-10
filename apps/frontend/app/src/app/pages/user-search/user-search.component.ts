import { Component, inject, signal, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';
import { UserDto } from '@codeheroes/types';
import { UserSearchService } from '../../core/services/user-search.service';

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
                [attr.aria-label]="'View profile of ' + (user.name || user.displayName)"
              >
                <div class="flex items-center gap-4">
                  <!-- Avatar -->
                  <div class="flex-shrink-0">
                    @if (user.photoUrl) {
                      <img
                        [src]="user.photoUrl"
                        [alt]="(user.name || user.displayName) + ' avatar'"
                        class="w-12 h-12 rounded-full border-2 border-purple-500/30"
                      />
                    } @else {
                      <div
                        class="w-12 h-12 rounded-full border-2 border-purple-500/30 bg-gradient-to-br from-purple-600 to-cyan-600 flex items-center justify-center"
                      >
                        <span class="text-white font-bold text-lg">
                          {{ getInitials(user.name || user.displayName) }}
                        </span>
                      </div>
                    }
                  </div>

                  <!-- User Info -->
                  <div class="flex-1 min-w-0">
                    <h3 class="text-white font-semibold truncate">
                      {{ user.name || user.displayName }}
                    </h3>
                    @if (user.name && user.displayName && user.name !== user.displayName) {
                      <p class="text-sm text-slate-400 truncate">{{ user.displayName }}</p>
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
    `,
  ],
})
export class UserSearchComponent implements OnDestroy {
  readonly #userSearchService = inject(UserSearchService);
  readonly #router = inject(Router);

  searchTerm = '';
  users = signal<UserDto[]>([]);
  isSearching = signal(false);

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

  ngOnDestroy() {
    this.#searchSubscription?.unsubscribe();
  }

  #loadInitialUsers() {
    this.isSearching.set(true);
    this.#userSearchService.getAllUsers(20).subscribe({
      next: (users) => {
        this.users.set(users);
        this.isSearching.set(false);
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
      },
      error: (error) => {
        console.error('Search failed:', error);
        this.isSearching.set(false);
      },
    });
  }

  onSearchChange(term: string) {
    this.#searchSubject.next(term);
  }

  viewProfile(userId: string) {
    this.#router.navigate(['/users', userId]);
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
