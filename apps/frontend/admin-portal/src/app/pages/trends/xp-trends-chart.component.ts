import { Component, computed, input } from '@angular/core';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';
import { TrendsEntityData, TrendsProjectData } from '@codeheroes/types';
import { getChartColor, getDefaultChartOptions, getGridColor, getSubtleTextColor } from './chart-theme.utils';

@Component({
  selector: 'admin-xp-trends-chart',
  standalone: true,
  imports: [BaseChartDirective],
  template: `
    <div class="chart-container">
      <h3 class="chart-title">XP Trends</h3>
      <div class="chart-wrapper">
        <canvas baseChart [data]="chartData()" [options]="chartOptions" type="line"></canvas>
      </div>
    </div>
  `,
  styles: [
    `
      .chart-container {
        background: var(--theme-color-bg-surface-default);
        border: 1px solid var(--theme-color-border-default-default);
        border-radius: 8px;
        padding: 20px;
      }
      .chart-title {
        font-size: 16px;
        font-weight: 600;
        color: var(--theme-color-text-default);
        margin-bottom: 16px;
      }
      .chart-wrapper { height: 320px; }
    `,
  ],
})
export class XpTrendsChartComponent {
  readonly entities = input.required<(TrendsEntityData | TrendsProjectData)[]>();
  readonly weekIds = input.required<string[]>();

  readonly chartOptions = {
    ...getDefaultChartOptions(),
    interaction: { mode: 'index' as const, intersect: false },
    scales: {
      x: {
        ticks: { color: getSubtleTextColor(), font: { size: 11 } },
        grid: { color: getGridColor() },
      },
      y: {
        beginAtZero: true,
        ticks: { color: getSubtleTextColor(), font: { size: 11 } },
        grid: { color: getGridColor() },
      },
    },
  };

  readonly chartData = computed<ChartConfiguration<'line'>['data']>(() => {
    const labels = [...this.weekIds()].reverse();
    const top10 = this.entities().slice(0, 10);

    return {
      labels,
      datasets: top10.map((entity, i) => ({
        label: 'displayName' in entity ? entity.displayName : entity.name,
        data: labels.map((weekId) => {
          const week = entity.weeklyData.find((w) => w.weekId === weekId);
          return week?.xpGained || 0;
        }),
        borderColor: getChartColor(i),
        backgroundColor: getChartColor(i) + '20',
        borderWidth: 2,
        pointRadius: 3,
        pointHoverRadius: 5,
        tension: 0.3,
        fill: false,
      })),
    };
  });
}
