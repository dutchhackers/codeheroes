import type { EChartsOption } from 'echarts';

const DATAVIZ_VARS = [
  '--color-dataviz-categorical-1', // amber/secondary
  '--color-dataviz-categorical-2', // blue-base
  '--color-dataviz-categorical-3', // brand green
  '--color-dataviz-categorical-4', // sand
  '--color-dataviz-categorical-5', // info blue
  '--color-dataviz-categorical-6', // error orange
  '--color-dataviz-diverging-1',   // teal-blue
  '--color-dataviz-diverging-9',   // warm amber
  '--color-dataviz-diverging-3',   // light blue
  '--color-dataviz-diverging-8',   // peach
];

const DATAVIZ_FALLBACKS = [
  '#ffb55d', '#a1c7ce', '#1bc866', '#dccfac', '#1ba1d1',
  '#f7693e', '#1ba1d1', '#ffb55d', '#89d9ff', '#ffc27e',
];

export function getChartColor(index: number): string {
  const i = index % DATAVIZ_VARS.length;
  return getCssVar(DATAVIZ_VARS[i]) || DATAVIZ_FALLBACKS[i];
}

function getCssVar(name: string): string {
  return getComputedStyle(document.body).getPropertyValue(name).trim();
}

export function getTextColor(): string {
  return getCssVar('--color-text-default') || '#1f2937';
}

export function getSubtleTextColor(): string {
  return getCssVar('--color-text-neutral-tertiary') || '#9ca3af';
}

export function getGridColor(): string {
  return getCssVar('--color-border-default-default') || '#e5e7eb';
}

export function getSurfaceColor(): string {
  return getCssVar('--color-bg-surface-default') || '#ffffff';
}

export function getDefaultEChartsOptions(): EChartsOption {
  return {
    legend: {
      bottom: 0,
      textStyle: { color: getTextColor(), fontSize: 12 },
      itemWidth: 8,
      itemHeight: 8,
      icon: 'circle',
      padding: [16, 0, 0, 0],
    },
    tooltip: {
      trigger: 'axis',
      backgroundColor: getSurfaceColor(),
      borderColor: getGridColor(),
      borderWidth: 1,
      padding: 10,
      textStyle: { color: getTextColor(), fontSize: 12 },
    },
    grid: {
      containLabel: true,
      left: 12,
      right: 12,
      top: 12,
      bottom: 48,
    },
    xAxis: {
      type: 'category',
      axisLine: { lineStyle: { color: getGridColor() } },
      axisTick: { lineStyle: { color: getGridColor() } },
      axisLabel: { color: getSubtleTextColor(), fontSize: 11 },
      splitLine: { show: false },
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: getSubtleTextColor(), fontSize: 11 },
      splitLine: { lineStyle: { color: getGridColor() } },
    },
  };
}

export type { EChartsOption };
