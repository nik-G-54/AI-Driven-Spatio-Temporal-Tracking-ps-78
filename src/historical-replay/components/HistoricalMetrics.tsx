import type { ReplayValidationMetrics } from '../historical-replay.api';

interface HistoricalMetricsProps {
  validation: ReplayValidationMetrics;
}

export default function HistoricalMetrics({ validation }: HistoricalMetricsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-2.5">
      <div className="p-3.5 rounded-lg bg-[#EFF4FF] flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold tracking-wider text-[#475569] uppercase">Observed Peak Rainfall</span>
          <span className="material-symbols-outlined text-[16px] text-[#475569]">verified</span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-display-md text-[#0F172A] font-bold tracking-tight">
            {validation.observedPeakRainfall.value}
          </span>
          <span className="font-mono text-code-sm text-[#475569] uppercase font-semibold">
            {validation.observedPeakRainfall.unit}
          </span>
        </div>
        <div className="font-mono text-[11px] text-[#475569]">{validation.observedPeakRainfall.source}</div>
      </div>

      <div className="p-3.5 rounded-lg bg-[#EFF4FF] flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold tracking-wider text-[#475569] uppercase">AI Downscaled Peak</span>
          <span className="inline-flex items-center font-mono text-[10px] px-1.5 py-0.5 rounded bg-violet-100 text-[#6D28D9] font-bold">
            {validation.aiDownscaledPeak.capturePercent.toFixed(1)}% CAPTURE
          </span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-display-md text-[#0F172A] font-bold tracking-tight">
            {validation.aiDownscaledPeak.value}
          </span>
          <span className="font-mono text-code-sm text-[#475569] uppercase font-semibold">
            {validation.aiDownscaledPeak.unit}
          </span>
        </div>
        <div className="font-mono text-[11px] text-[#16A34A] font-semibold">
          {validation.aiDownscaledPeak.deviationPercent}% relative deviation vs ground observation
        </div>
      </div>

      <div className="p-3.5 rounded-lg bg-[#EFF4FF] flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold tracking-wider text-[#475569] uppercase">Raw 12 km NWP Peak</span>
          <span className="inline-flex items-center font-mono text-[10px] px-1.5 py-0.5 rounded bg-red-100 text-[#93000A] font-bold">
            {validation.rawNwpPeak.dilutedPercent}% DILUTED
          </span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-display-md text-[#475569] font-bold tracking-tight">{validation.rawNwpPeak.value}</span>
          <span className="font-mono text-code-sm text-[#475569] uppercase font-semibold">{validation.rawNwpPeak.unit}</span>
        </div>
        <div className="font-mono text-[11px] text-[#EF4444] font-medium">{validation.rawNwpPeak.note}</div>
      </div>

      <div className="p-3.5 rounded-lg bg-[#EFF4FF] flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold tracking-wider text-[#475569] uppercase">Landfall Track Error</span>
          <span className="material-symbols-outlined text-[16px] text-[#475569]">explore</span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-display-md text-[#0F172A] font-bold tracking-tight">
            {validation.landfallTrackError.value}
          </span>
          <span className="font-mono text-code-sm text-[#475569] uppercase font-semibold">
            {validation.landfallTrackError.unit}
          </span>
        </div>
        <div className="font-mono text-[11px] text-[#475569]">
          Evaluated at {validation.landfallTrackError.evaluatedAtHour}-hour operational forecast lead
        </div>
      </div>
    </div>
  );
}
