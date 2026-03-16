import { ChartOptions } from 'chart.js';

const DATAVIZ_VARS = [
  '--theme-color-dataviz-categorical-1', // amber/secondary
  '--theme-color-dataviz-categorical-2', // blue-base
  '--theme-color-dataviz-categorical-3', // brand green
  '--theme-color-dataviz-categorical-4', // sand
  '--theme-color-dataviz-categorical-5', // info blue
  '--theme-color-dataviz-categorical-6', // error orange
  '--theme-color-dataviz-diverging-1',   // teal-blue
  '--theme-color-dataviz-diverging-9',   // warm amber
  '--theme-color-dataviz-diverging-3',   // light blue
  '--theme-color-dataviz-diverging-8',   // peach
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
  return getCssVar('--theme-color-text-default') || '#1f2937';
}

export function getSubtleTextColor(): string {
  return getCssVar('--theme-color-text-neutral-tertiary') || '#9ca3af';
}

export function getGridColor(): string {
  return getCssVar('--theme-color-border-default-default') || '#e5e7eb';
}

export function getSurfaceColor(): string {
  return getCssVar('--theme-color-bg-surface-default') || '#ffffff';
}

export function getDefaultChartOptions(): ChartOptions {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: getTextColor(),
          padding: 16,
          usePointStyle: true,
          pointStyleWidth: 8,
          font: { size: 12 },
        },
      },
      tooltip: {
        backgroundColor: getSurfaceColor(),
        titleColor: getTextColor(),
        bodyColor: getSubtleTextColor(),
        borderColor: getGridColor(),
        borderWidth: 1,
        padding: 10,
        boxPadding: 4,
        usePointStyle: true,
      },
    },
    scales: {
      x: {
        ticks: { color: getSubtleTextColor(), font: { size: 11 } },
        grid: { color: getGridColor() },
      },
      y: {
        ticks: { color: getSubtleTextColor(), font: { size: 11 } },
        grid: { color: getGridColor() },
      },
    },
  };
}
