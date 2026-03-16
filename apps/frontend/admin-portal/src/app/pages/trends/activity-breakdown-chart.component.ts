import { Component, input } from '@angular/core';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';
import { TrendsEntityData, TrendsProjectData } from '@codeheroes/types';
import { getChartColor, getDefaultChartOptions, getGridColor, getSubtleTextColor } from './chart-theme.utils';

@Component({
  selector: 'admin-activity-breakdown-chart',
  standalone: true,
  imports: [BaseChartDirective],
  template: `
    <div class="chart-container">
      <h3 class="chart-title">Activity Breakdown</h3>
      <div class="chart-wrapper">
        <canvas baseChart [data]="chartData()" [options]="chartOptions" type="bar"></canvas>
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
export class ActivityBreakdownChartComponent {
  readonly entities = input.required<(TrendsEntityData | TrendsProjectData)[]>();
  readonly weekIds = input.required<string[]>();

  readonly chartOptions = {
    ...getDefaultChartOptions(),
    interaction: { mode: 'index' as const, intersect: false },
    scales: {
      x: {
        stacked: true,
        ticks: { color: getSubtleTextColor(), font: { size: 11 } },
        grid: { color: getGridColor() },
      },
      y: {
        stacked: true,
        beginAtZero: true,
        ticks: { color: getSubtleTextColor(), font: { size: 11 } },
        grid: { color: getGridColor() },
      },
    },
  };

  chartData(): ChartConfiguration<'bar'>['data'] {
    const labels = [...this.weekIds()].reverse();
    const entities = this.entities();

    // Aggregate counters per week across all entities
    const weekAggregates = new Map<string, Record<string, number>>();
    for (const weekId of labels) {
      const agg: Record<string, number> = {};
      for (const entity of entities) {
        const week = entity.weeklyData.find((w) => w.weekId === weekId);
        if (week?.counters) {
          for (const [action, count] of Object.entries(week.counters)) {
            agg[action] = (agg[action] || 0) + count;
          }
        }
      }
      weekAggregates.set(weekId, agg);
    }

    // Collect all action types and sort by total count
    const actionTotals = new Map<string, number>();
    for (const agg of weekAggregates.values()) {
      for (const [action, count] of Object.entries(agg)) {
        actionTotals.set(action, (actionTotals.get(action) || 0) + count);
      }
    }

    const sortedActions = [...actionTotals.entries()].sort((a, b) => b[1] - a[1]);

    // Group minor types as "Other" if > 6 types
    const maxTypes = 6;
    const topActions = sortedActions.slice(0, maxTypes).map(([action]) => action);
    const hasOther = sortedActions.length > maxTypes;

    const datasets = topActions.map((action, i) => ({
      label: action,
      data: labels.map((weekId) => weekAggregates.get(weekId)?.[action] || 0),
      backgroundColor: getChartColor(i),
      borderRadius: 2,
    }));

    if (hasOther) {
      const otherActions = sortedActions.slice(maxTypes).map(([action]) => action);
      datasets.push({
        label: 'Other',
        data: labels.map((weekId) => {
          const agg = weekAggregates.get(weekId) || {};
          return otherActions.reduce((sum, action) => sum + (agg[action] || 0), 0);
        }),
        backgroundColor: '#9ca3af',
        borderRadius: 2,
      });
    }

    return { labels, datasets };
  }
}
