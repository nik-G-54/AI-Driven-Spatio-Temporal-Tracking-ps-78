import type { AnalysisStep, EvolutionPoint, VariableAnalysis } from '../analysis/analysis.types';
import { CAP, PANEL, PANEL_HEAD, SIM_CHIP, TITLE } from './ui';

interface AnomalySummaryProps {
  variable: VariableAnalysis;
  steps: AnalysisStep[];
  evolution: EvolutionPoint[];
  frameIndex: number;
}

const num = (x: number) => String(Number(x.toFixed(1)));

// Compact numbers for the selected step and for the event as a whole (simulated),
// plus the "why flagged" reasoning against the prototype threshold.
export default function AnomalySummary({ variable, steps, evolution, frameIndex }: AnomalySummaryProps) {
  const point = evolution[Math.min(frameIndex, evolution.length - 1)];
  const { unit } = variable.meta;
  const stepHours = steps.length > 1 ? steps[1].leadTimeHours - steps[0].leadTimeHours : 0;
  const stepsAbove = evolution.filter((e) => e.aiFootprintAreaKm2 > 0).length;
  const eventPeak = Math.max(...evolution.map((e) => e.aiPeak));
  const flagged = point.aiFootprintAreaKm2 > 0;
  const stats: Array<{ label: string; value: string; note?: string }> = [
    { label: 'Peak intensity', value: `${num(point.aiPeak)} ${unit}`, note: `event peak ${num(eventPeak)}` },
    { label: 'Affected area', value: `${point.aiFootprintAreaKm2.toLocaleString('en-IN')} km²`, note: flagged ? 'AI footprint ≥ threshold' : 'below threshold' },
    { label: 'Confidence', value: point.confidence === null ? '—' : `${Math.round(point.confidence * 100)} %`, note: 'prototype' },
    { label: 'Duration', value: stepsAbove > 0 ? `≥ ${stepsAbove * stepHours || stepHours} h` : '0 h', note: `${stepsAbove} of ${steps.length} steps above` },
    { label: 'Anomaly magnitude', value: `${point.aiPeak >= variable.threshold ? '+' : '−'}${num(Math.abs(point.aiPeak - variable.threshold))} ${unit}`, note: 'peak vs threshold' },
    { label: 'Threshold', value: `≥ ${variable.threshold} ${unit}`, note: 'prototype, not official' },
  ];

  return (
    <section className={`${PANEL} flex flex-col`} aria-label="Anomaly summary">
      <div className={PANEL_HEAD}>
        <h3 className={TITLE}>Anomaly · why flagged</h3>
        <span className={SIM_CHIP}>SIMULATED</span>
      </div>
      <div className="flex items-center gap-2 px-3 py-2 border-b border-[#1F2A36]">
        <span className={flagged ? 'w-2 h-2 rounded-full bg-[#EF4444] shadow-[0_0_0_3px_rgba(239,68,68,0.2)]' : 'w-2 h-2 rounded-full bg-[#64748B]'} />
        <span className="text-[12.5px] font-semibold text-[#E6EDF4]">
          {flagged ? `Extreme ${variable.meta.label.toLowerCase()} anomaly detected` : 'No cell above the prototype threshold at this step'}
        </span>
      </div>
      <dl className="grid grid-cols-2">
        {stats.map((stat, i) => (
          <div key={stat.label} className={`flex flex-col gap-0.5 px-3 py-2 border-[#1F2A36] ${i % 2 === 0 ? 'border-r' : ''} ${i < stats.length - 2 ? 'border-b' : ''}`}>
            <dt className={CAP}>{stat.label}</dt>
            <dd className="font-mono text-[15px] font-semibold text-[#E6EDF4] leading-tight">{stat.value}</dd>
            {stat.note && <dd className="text-[10px] text-[#7F8C9C]">{stat.note}</dd>}
          </div>
        ))}
      </dl>
    </section>
  );
}
