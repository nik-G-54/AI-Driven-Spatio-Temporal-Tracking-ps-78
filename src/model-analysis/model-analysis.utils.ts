export type Variant = 'success' | 'danger' | 'info' | 'neutral' | 'neutralStrong' | 'primary' | 'warning' | 'ai';

export interface VariantStyle {
  bg: string;
  text: string;
  border: string;
  dot: string;
}

const VARIANT_STYLES: Record<Variant, VariantStyle> = {
  success: { bg: 'bg-[#DCFCE7]', text: 'text-[#15803D]', border: 'border-[#BBF7D0]', dot: '#16A34A' },
  danger: { bg: 'bg-red-100', text: 'text-[#B91C1C]', border: 'border-red-200', dot: '#EF4444' },
  info: { bg: 'bg-[#DCE9FF]', text: 'text-[#0F172A]', border: 'border-[#BFDBFE]', dot: '#2563EB' },
  neutral: { bg: 'bg-[#DCE9FF]', text: 'text-[#0F172A]', border: 'border-[#CBD5E1]', dot: '#64748B' },
  neutralStrong: { bg: 'bg-[#D3E4FE]', text: 'text-[#0F172A]', border: 'border-[#CBD5E1]', dot: '#334155' },
  primary: { bg: 'bg-[#DAE2FD]', text: 'text-[#131B2E]', border: 'border-[#BEC6E0]', dot: '#0F172A' },
  warning: { bg: 'bg-amber-100', text: 'text-[#A16207]', border: 'border-amber-200', dot: '#F59E0B' },
  ai: { bg: 'bg-violet-100', text: 'text-[#6D28D9]', border: 'border-violet-200', dot: '#7C3AED' },
};

export function getVariantStyle(variant: string): VariantStyle {
  return VARIANT_STYLES[variant as Variant] ?? VARIANT_STYLES.neutral;
}

const TREND_ICONS: Record<string, string> = {
  up: 'trending_up',
  down: 'trending_down',
  check: 'check_circle',
  check_circle: 'check_circle',
  bolt: 'bolt',
};

export function getTrendIcon(direction: string): string {
  return TREND_ICONS[direction] ?? direction;
}

export function formatMetricValue(value: number, options?: { decimals?: number; suffix?: string }): string {
  // Without an explicit decimals count, preserve the value's own precision
  // as authored in the data (e.g. 0.78 stays "0.78", 42.8 stays "42.8")
  // rather than forcing a fixed rounding that could silently drop digits.
  const text = options?.decimals !== undefined ? value.toFixed(options.decimals) : String(value);
  return `${text}${options?.suffix ?? ''}`;
}

export function formatPercentage(value: number, options?: { decimals?: number; signed?: boolean }): string {
  const decimals = options?.decimals ?? 0;
  const sign = options?.signed && value > 0 ? '+' : '';
  return `${sign}${value.toFixed(decimals)}%`;
}

export function formatDuration(valueMs: number): string {
  if (valueMs < 1000) return `${valueMs}ms`;
  return `${(valueMs / 1000).toFixed(1)}s`;
}

export interface ChartAxis {
  min: number;
  max: number;
}

export interface ChartPlotArea {
  x0: number;
  x1: number;
  y0: number;
  y1: number;
}

export interface ChartPoint {
  x: number;
  y: number;
}

/**
 * Deterministically projects a (leadHour, errorKm) data point onto the
 * Track Error Progression chart's SVG plot area. Centralizes the axis math
 * so it isn't scattered across chart JSX.
 */
export function projectChartPoint(
  leadHour: number,
  value: number,
  xAxis: ChartAxis,
  yAxis: ChartAxis,
  plotArea: ChartPlotArea,
): ChartPoint {
  const x = plotArea.x0 + ((leadHour - xAxis.min) / (xAxis.max - xAxis.min)) * (plotArea.x1 - plotArea.x0);
  const y = plotArea.y1 - ((value - yAxis.min) / (yAxis.max - yAxis.min)) * (plotArea.y1 - plotArea.y0);
  return { x, y };
}

export function classNames(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(' ');
}
