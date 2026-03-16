import { ChartOptions } from 'chart.js';

const CHART_COLORS = [
  '#6366f1', // indigo
  '#22c55e', // green
  '#f59e0b', // amber
  '#ef4444', // red
  '#3b82f6', // blue
  '#ec4899', // pink
  '#14b8a6', // teal
  '#f97316', // orange
  '#8b5cf6', // violet
  '#06b6d4', // cyan
];

export function getChartColor(index: number): string {
  return CHART_COLORS[index % CHART_COLORS.length];
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
