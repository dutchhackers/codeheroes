import { Component, computed, input } from '@angular/core';
import { NgxEchartsDirective } from 'ngx-echarts';
import { TrendsEntityData, TrendsProjectData } from '@codeheroes/types';
import { EChartsOption, getChartColor, getDefaultEChartsOptions, getSubtleTextColor } from './chart-theme.utils';

@Component({
  selector: 'admin-rank-chart',
  standalone: true,
  imports: [NgxEchartsDirective],
  template: `
    <div class="chart-container">
      <h3 class="chart-title">Rank Movement</h3>
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
export class RankChartComponent {
  readonly entities = input.required<(TrendsEntityData | TrendsProjectData)[]>();
  readonly weekIds = input.required<string[]>();

  readonly chartOptions = computed<EChartsOption>(() => {
    const labels = [...this.weekIds()].reverse();
    const top10 = this.entities().slice(0, 10);
    const defaults = getDefaultEChartsOptions();

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
      ...defaults,
      xAxis: {
        ...(defaults.xAxis as object),
        data: labels,
      },
      yAxis: {
        ...(defaults.yAxis as object),
        inverse: true,
        min: 1,
        minInterval: 1,
        name: 'Rank',
        nameTextStyle: { color: getSubtleTextColor() },
      },
      series: top10.map((entity, i) => ({
        name: 'displayName' in entity ? entity.displayName : entity.name,
        type: 'line' as const,
        smooth: 0.3,
        connectNulls: true,
        data: labels.map((weekId) => {
          const rank = rankPerWeek.get(weekId)?.get(entity.id);
          return rank && !isNaN(rank) ? rank : null;
        }),
        itemStyle: { color: getChartColor(i) },
        lineStyle: { color: getChartColor(i), width: 2 },
        symbolSize: 8,
        symbol: 'circle',
      })),
    };
  });
}
