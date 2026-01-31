import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-bottom-nav',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <nav class="bottom-nav">
      <a
        routerLink="/hq"
        routerLinkActive="active"
        class="nav-item"
        aria-label="Headquarters dashboard"
      >
        <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
        <span class="nav-label">HQ</span>
      </a>
      <a
        routerLink="/activity"
        routerLinkActive="active"
        class="nav-item"
        aria-label="Activity feed"
      >
        <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
        </svg>
        <span class="nav-label">ACTIVITY</span>
      </a>
      <a
        routerLink="/profile"
        routerLinkActive="active"
        class="nav-item"
        aria-label="User profile"
      >
        <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="8" r="4" />
          <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
        </svg>
        <span class="nav-label">PROFILE</span>
      </a>
    </nav>
  `,
  styles: [`
    .bottom-nav {
      display: flex;
      justify-content: space-around;
      align-items: center;
      background: rgba(0, 0, 0, 0.95);
      border-top: 2px solid rgba(191, 0, 255, 0.4);
      padding: 0.5rem 1rem;
      padding-bottom: max(0.5rem, env(safe-area-inset-bottom));
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      z-index: 50;
      backdrop-filter: blur(12px);
      box-shadow: 0 -4px 20px rgba(191, 0, 255, 0.15);
    }

    .nav-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 0.25rem;
      padding: 0.5rem 1.5rem;
      min-height: 44px;
      min-width: 64px;
      color: rgba(255, 255, 255, 0.5);
      text-decoration: none;
      transition: all 0.2s ease;
      border-radius: 8px;
    }

    .nav-item:hover {
      color: rgba(255, 255, 255, 0.8);
    }

    .nav-item.active {
      color: var(--neon-cyan, #00f5ff);
    }

    .nav-item.active .nav-icon {
      filter: drop-shadow(0 0 8px var(--neon-cyan, #00f5ff));
    }

    .nav-item.active .nav-label {
      text-shadow: 0 0 10px var(--neon-cyan, #00f5ff);
    }

    .nav-icon {
      width: 24px;
      height: 24px;
      transition: filter 0.2s ease;
    }

    .nav-label {
      font-size: 0.65rem;
      font-weight: 600;
      letter-spacing: 0.1em;
      font-family: 'JetBrains Mono', monospace;
    }

    @media (min-width: 768px) {
      .nav-item {
        padding: 0.75rem 2rem;
      }

      .nav-icon {
        width: 28px;
        height: 28px;
      }

      .nav-label {
        font-size: 0.75rem;
      }
    }
  `],
})
export class BottomNavComponent {}
