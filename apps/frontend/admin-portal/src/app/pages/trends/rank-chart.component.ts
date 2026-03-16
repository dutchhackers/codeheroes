import { Component, computed, input } from '@angular/core';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';
import { TrendsEntityData, TrendsProjectData } from '@codeheroes/types';
import { getChartColor, getDefaultChartOptions, getGridColor, getSubtleTextColor } from './chart-theme.utils';

@Component({
  selector: 'admin-rank-chart',
  standalone: true,
  imports: [BaseChartDirective],
  template: `
    <div class="chart-container">
      <h3 class="chart-title">Rank Movement</h3>
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
export class RankChartComponent {
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
        reverse: true,
        min: 1,
        ticks: {
          stepSize: 1,
          color: getSubtleTextColor(),
          font: { size: 11 },
        },
        grid: { color: getGridColor() },
        title: { display: true, text: 'Rank', color: getSubtleTextColor() },
      },
    },
  };

  readonly chartData = computed<ChartConfiguration<'line'>['data']>(() => {
    const labels = [...this.weekIds()].reverse();
    const top10 = this.entities().slice(0, 10);

    // Calculate rank per week
    const rankPerWeek = new Map<string, Map<string, number>>();
    for (const weekId of labels) {
      const sorted = [...top10]
        .map((e) => ({
          id: e.id,
          xp: e.weeklyData.find((w) => w.weekId === weekId)?.xpGained || 0,
        }))
        .sort((a, b) => b.xp - a.xp);

      const weekRanks = new Map<string, number>();
      sorted.forEach((entry, i) => {
        weekRanks.set(entry.id, entry.xp > 0 ? i + 1 : NaN);
      });
      rankPerWeek.set(weekId, weekRanks);
    }

    return {
      labels,
      datasets: top10.map((entity, i) => ({
        label: 'displayName' in entity ? entity.displayName : entity.name,
        data: labels.map((weekId) => {
          const rank = rankPerWeek.get(weekId)?.get(entity.id);
          return rank && !isNaN(rank) ? rank : null;
        }),
        borderColor: getChartColor(i),
        backgroundColor: getChartColor(i) + '20',
        borderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
        tension: 0.3,
        spanGaps: true,
      })),
    };
  });
}
