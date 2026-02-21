import { Component, input } from '@angular/core';
import { ConnectedAccountDto, ConnectedAccountProvider } from '@codeheroes/types';

@Component({
  selector: 'app-connected-accounts',
  standalone: true,
  template: `
    <div class="accounts-section">
      @if (showTitle()) {
        <h3 class="section-title">Connected Accounts</h3>
      }

      @if (accounts().length === 0) {
        <p class="empty-text">No connected accounts yet</p>
      } @else {
        <div class="accounts-list">
          @for (account of accounts(); track account.id) {
            <div class="account-row">
              <div class="provider-icon" [innerHTML]="getProviderIcon(account.provider)"></div>
              <div class="account-info">
                <span class="provider-name">{{ getProviderLabel(account.provider) }}</span>
                @if (account.externalUserName) {
                  <span class="account-username">{{ account.externalUserName }}</span>
                }
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [
    `
      .accounts-section {
        background: rgba(255, 255, 255, 0.05);
        backdrop-filter: blur(12px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 16px;
        padding: 1.25rem;
        margin: 0;
      }

      .section-title {
        font-size: 0.875rem;
        font-weight: 600;
        color: rgba(255, 255, 255, 0.9);
        margin: 0 0 0.875rem 0;
        letter-spacing: -0.02em;
      }

      .empty-text {
        font-size: 0.875rem;
        color: rgba(255, 255, 255, 0.4);
        margin: 0;
      }

      .accounts-list {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
      }

      .account-row {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.625rem 0.75rem;
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.05);
        border-radius: 10px;
      }

      .provider-icon {
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: rgba(255, 255, 255, 0.7);
        flex-shrink: 0;
      }

      .provider-icon :global(svg) {
        width: 20px;
        height: 20px;
      }

      .account-info {
        display: flex;
        flex-direction: column;
        gap: 0.125rem;
        min-width: 0;
      }

      .provider-name {
        font-size: 0.875rem;
        font-weight: 500;
        color: rgba(255, 255, 255, 0.9);
      }

      .account-username {
        font-size: 0.75rem;
        color: var(--neon-cyan);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    `,
  ],
})
export class ConnectedAccountsComponent {
  accounts = input<ConnectedAccountDto[]>([]);
  showTitle = input(true);

  getProviderLabel(provider: ConnectedAccountProvider): string {
    const labels: Record<string, string> = {
      github: 'GitHub',
      azure: 'Azure DevOps',
      bitbucket: 'Bitbucket',
      strava: 'Strava',
      system: 'System',
    };
    return labels[provider] ?? provider;
  }

  getProviderIcon(provider: ConnectedAccountProvider): string {
    const icons: Record<string, string> = {
      github: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>`,
      azure: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M13.05 4.24L7.56 18.05l-2.58.01 4.66-11.97 3.41-1.85zM21 18.06H7.41l10.41-3.02L21 18.06zM9.25 18.06L17.6 5.94l3.4 1.85-11.75 10.27z"/></svg>`,
      bitbucket: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M.778 1.213a.768.768 0 00-.768.892l3.263 19.81c.084.5.515.868 1.022.873H19.95a.772.772 0 00.77-.646l3.27-20.03a.768.768 0 00-.768-.891zM14.52 15.53H9.522L8.17 8.466h7.561z"/></svg>`,
      strava: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169"/></svg>`,
    };
    return icons[provider] ?? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l2 2"/></svg>`;
  }
}
