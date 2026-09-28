import type { MetricCard, ModelMetricsData } from '../model-analysis.api';
import { formatMetricValue, getTrendIcon, getVariantStyle } from '../model-analysis.utils';

interface PerformanceMetricsProps {
  metrics: ModelMetricsData;
}

function MetricCardView({ metric }: { metric: MetricCard }) {
  const trendStyle = getVariantStyle(metric.trend.variant);

  return (
    <div className="bg-white rounded-xl shadow-sm p-5 flex flex-col justify-between h-[164px]">
      <div className="flex items-start justify-between">
        <div className="flex flex-col">
          <span className="text-label-sm text-[#475569] uppercase tracking-wider">{metric.category}</span>
          <span className="text-headline-sm text-[#0F172A] font-semibold mt-0.5">{metric.title}</span>
        </div>
        <span
          className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded font-bold ${trendStyle.bg} ${trendStyle.text}`}
        >
          <span className="material-symbols-outlined text-[13px]">{getTrendIcon(metric.trend.direction)}</span>
          {metric.trend.label}
        </span>
      </div>
      <div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-display-lg text-[#0F172A] font-bold tracking-tight">
            {formatMetricValue(metric.value)}
            {metric.valueSuffix ?? ''}
          </span>
          <span className="font-mono text-code-sm text-[#475569] font-semibold">{metric.unit}</span>
        </div>
        <div className="text-[12px] text-[#475569] mt-1">{metric.description}</div>
      </div>
    </div>
  );
}

export default function PerformanceMetrics({ metrics }: PerformanceMetricsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      <MetricCardView metric={metrics.trackError} />
      <MetricCardView metric={metrics.spatialLocalization} />
      <MetricCardView metric={metrics.peakIntensityRecovery} />
      <MetricCardView metric={metrics.inferenceLatency} />
    </div>
  );
}
