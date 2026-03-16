import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { SuiButtonComponent } from '@move4mobile/stride-ui';
import { TrendsEntityData, TrendsProjectData, TrendsResponse } from '@codeheroes/types';
import { TrendsService } from '../../core/services/trends.service';
import { TopMoversComponent, TopMoversData, computeTopMovers } from './top-movers.component';
import { XpTrendsChartComponent } from './xp-trends-chart.component';
import { RankChartComponent } from './rank-chart.component';
import { ActivityBreakdownChartComponent } from './activity-breakdown-chart.component';

type TabType = 'heroes' | 'bots' | 'projects';

@Component({
  selector: 'admin-trends',
  standalone: true,
  imports: [
    SuiButtonComponent,
    TopMoversComponent,
    XpTrendsChartComponent,
    RankChartComponent,
    ActivityBreakdownChartComponent,
  ],
  template: `
    <div>
      <div class="page-header">
        <div>
          <h1 class="page-title">Trends</h1>
          <p class="page-subtitle">Weekly activity over the last {{ weekCount }} weeks</p>
        </div>
      </div>

      <div class="filters">
        <div class="filter-group">
          <button class="filter-pill" [class.filter-pill--active]="selectedTab() === 'heroes'" (click)="selectedTab.set('heroes')">Heroes</button>
          <button class="filter-pill" [class.filter-pill--active]="selectedTab() === 'bots'" (click)="selectedTab.set('bots')">Bots</button>
          <button class="filter-pill" [class.filter-pill--active]="selectedTab() === 'projects'" (click)="selectedTab.set('projects')">Projects</button>
        </div>
      </div>

      @if (isLoading()) {
        <div class="loading-state">
          <p>Loading trends data...</p>
        </div>
      } @else if (error()) {
        <div class="error-state">
          <p>{{ error() }}</p>
          <sui-button variant="outline" color="neutral" size="sm" (click)="loadTrends()">
            Try again
          </sui-button>
        </div>
      } @else if (activeEntities().length === 0) {
        <div class="empty-state">
          <p>No trends data available for the selected category.</p>
        </div>
      } @else {
        <admin-top-movers [data]="topMovers()" />

        <div class="charts-grid">
          <admin-xp-trends-chart [entities]="activeEntities()" [weekIds]="weekIds()" />
          <admin-rank-chart [entities]="activeEntities()" [weekIds]="weekIds()" />
        </div>

        <admin-activity-breakdown-chart [entities]="activeEntities()" [weekIds]="weekIds()" />
      }
    </div>
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
      .filters {
        display: flex;
        align-items: center;
        margin-bottom: 20px;
      }
      .filter-group {
        display: flex;
        gap: 4px;
      }
      .filter-pill {
        padding: 6px 14px;
        border: 1px solid var(--theme-color-border-default-default);
        border-radius: 20px;
        background: var(--theme-color-bg-surface-default);
        color: var(--theme-color-text-neutral-tertiary);
        font-size: 13px;
        font-weight: 500;
        cursor: pointer;
        font-family: inherit;
        transition: all 0.15s ease;
      }
      .filter-pill:hover {
        border-color: var(--theme-color-border-brand-default);
        color: var(--theme-color-text-default);
      }
      .filter-pill--active {
        background: var(--theme-color-bg-brand-default);
        border-color: var(--theme-color-bg-brand-default);
        color: #fff;
      }
      .loading-state, .empty-state {
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
      .charts-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 16px;
        margin: 20px 0;
      }
      admin-activity-breakdown-chart {
        display: block;
        margin-bottom: 20px;
      }
      admin-top-movers {
        display: block;
        margin-bottom: 20px;
      }
    `,
  ],
})
export class TrendsComponent implements OnInit {
  readonly #trendsService = inject(TrendsService);

  readonly weekCount = 10;
  readonly trendsData = signal<TrendsResponse | null>(null);
  readonly selectedTab = signal<TabType>('heroes');
  readonly isLoading = signal(true);
  readonly error = signal<string | null>(null);

  readonly weekIds = computed(() => this.trendsData()?.weekIds || []);

  readonly activeEntities = computed<(TrendsEntityData | TrendsProjectData)[]>(() => {
    const data = this.trendsData();
    if (!data) return [];
    switch (this.selectedTab()) {
      case 'heroes':
        return data.users;
      case 'bots':
        return data.bots;
      case 'projects':
        return data.projects;
    }
  });

  readonly topMovers = computed<TopMoversData>(() => {
    return computeTopMovers(this.activeEntities(), this.weekIds());
  });

  ngOnInit(): void {
    this.loadTrends();
  }

  loadTrends(): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.#trendsService.getTrends(this.weekCount).subscribe({
      next: (data) => {
        this.trendsData.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.error.set('Failed to load trends data. Please try again.');
        this.isLoading.set(false);
        console.error('Failed to load trends:', err);
      },
    });
  }
}
