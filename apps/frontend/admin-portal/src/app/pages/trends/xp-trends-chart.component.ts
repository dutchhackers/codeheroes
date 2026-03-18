import { Component, computed, input } from '@angular/core';
import { NgxEchartsDirective } from 'ngx-echarts';
import { TrendsEntityData, TrendsProjectData } from '@codeheroes/types';
import { EChartsOption, getChartColor, getDefaultEChartsOptions } from './chart-theme.utils';

@Component({
  selector: 'admin-xp-trends-chart',
  standalone: true,
  imports: [NgxEchartsDirective],
  template: `
    <div class="chart-container">
      <h3 class="chart-title">XP Trends</h3>
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
export class XpTrendsChartComponent {
  readonly entities = input.required<(TrendsEntityData | TrendsProjectData)[]>();
  readonly weekIds = input.required<string[]>();

  readonly chartOptions = computed<EChartsOption>(() => {
    const labels = [...this.weekIds()].reverse();
    const top10 = this.entities().slice(0, 10);
    const defaults = getDefaultEChartsOptions();

    return {
      ...defaults,
      xAxis: {
        ...(defaults.xAxis as object),
        data: labels,
      },
      yAxis: {
        ...(defaults.yAxis as object),
        min: 0,
      },
      series: top10.map((entity, i) => ({
        name: 'displayName' in entity ? entity.displayName : entity.name,
        type: 'line' as const,
        smooth: 0.3,
        data: labels.map((weekId) => {
          const week = entity.weeklyData.find((w) => w.weekId === weekId);
          return week?.xpGained || 0;
        }),
        itemStyle: { color: getChartColor(i) },
        lineStyle: { color: getChartColor(i), width: 2 },
        symbolSize: 6,
        symbol: 'circle',
      })),
    };
  });
}
