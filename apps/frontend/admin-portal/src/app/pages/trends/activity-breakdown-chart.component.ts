import { Component, computed, input } from '@angular/core';
import { NgxEchartsDirective } from 'ngx-echarts';
import { TrendsEntityData, TrendsProjectData } from '@codeheroes/types';
import { EChartsOption, getChartColor, getDefaultEChartsOptions } from './chart-theme.utils';

@Component({
  selector: 'admin-activity-breakdown-chart',
  standalone: true,
  imports: [NgxEchartsDirective],
  template: `
    <div class="chart-container">
      <h3 class="chart-title">Activity Breakdown</h3>
      <div class="chart-wrapper">
        <div echarts [options]="chartOptions()" [autoResize]="true"></div>
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
      .chart-wrapper > div { height: 100%; }
    `,
  ],
})
export class ActivityBreakdownChartComponent {
  readonly entities = input.required<(TrendsEntityData | TrendsProjectData)[]>();
  readonly weekIds = input.required<string[]>();

  readonly chartOptions = computed<EChartsOption>(() => {
    const labels = [...this.weekIds()].reverse();
    const entities = this.entities();
    const defaults = getDefaultEChartsOptions();

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

    const series = topActions.map((action, i) => ({
      name: action,
      type: 'bar' as const,
      stack: 'total',
      data: labels.map((weekId) => weekAggregates.get(weekId)?.[action] || 0),
      itemStyle: {
        color: getChartColor(i),
        borderRadius: [2, 2, 0, 0] as [number, number, number, number],
      },
    }));

    if (hasOther) {
      const otherActions = sortedActions.slice(maxTypes).map(([action]) => action);
      series.push({
        name: 'Other',
        type: 'bar' as const,
        stack: 'total',
        data: labels.map((weekId) => {
          const agg = weekAggregates.get(weekId) || {};
          return otherActions.reduce((sum, action) => sum + (agg[action] || 0), 0);
        }),
        itemStyle: {
          color: '#9ca3af',
          borderRadius: [2, 2, 0, 0] as [number, number, number, number],
        },
      });
    }

    return {
      ...defaults,
      tooltip: {
        ...(defaults.tooltip as object),
        axisPointer: { type: 'shadow' },
      },
      xAxis: {
        ...(defaults.xAxis as object),
        data: labels,
      },
      yAxis: {
        ...(defaults.yAxis as object),
        min: 0,
      },
      series,
    };
  });
}
