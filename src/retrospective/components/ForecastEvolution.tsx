import type { AnalysisStep, EvolutionPoint, VariableAnalysis } from '../analysis/analysis.types';
import { formatLead } from '../retrospective.utils';
import { PANEL, PANEL_HEAD, SIM_CHIP, TITLE } from './ui';

// Compact time-series of the event's evolution: intensity, affected area and
// confidence against forecast lead. All values are SIMULATED. Clicking a chart sets
// the page's shared time step (there is no separate time control).

interface ForecastEvolutionProps {
  variable: VariableAnalysis;
  steps: AnalysisStep[];
  evolution: EvolutionPoint[];
  frameIndex: number;
  onSelectFrame: (index: number) => void;
}

interface Series {
  label: string;
  values: number[];
  kind: 'ai' | 'nwp';
}

const W = 320;
const H = 118;
const M = { l: 40, r: 8, t: 8, b: 20 };

const compact = (x: number) => (Math.abs(x) >= 10000 ? `${Math.round(x / 1000)}k` : Math.abs(x) >= 100 ? String(Math.round(x)) : String(Number(x.toFixed(1))));

function Chart({
  title,
  unit,
  series,
  leads,
  frameIndex,
  onSelect,
  threshold,
  yMin,
  yMax,
}: {
  title: string;
  unit: string;
  series: Series[];
  leads: number[];
  frameIndex: number;
  onSelect: (index: number) => void;
  threshold?: number;
  yMin?: number;
  yMax?: number;
}) {
  const all = series.flatMap((s) => s.values);
  const lo = yMin ?? Math.min(0, ...all);
  const hiRaw = yMax ?? Math.max(...all, threshold ?? -Infinity) * 1.08;
  const hi = hiRaw <= lo ? lo + 1 : hiRaw;
  const x = (i: number) => M.l + (leads.length > 1 ? (i / (leads.length - 1)) * (W - M.l - M.r) : 0);
  const y = (v: number) => M.t + (1 - (v - lo) / (hi - lo)) * (H - M.t - M.b);
  const path = (values: number[]) => values.map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  const ai = series.find((s) => s.kind === 'ai');

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline justify-between">
        <span className="font-mono text-[10px] tracking-[0.1em] uppercase text-[#8794A4]">{title}</span>
        <span className="font-mono text-[10px] text-[#7F8C9C]">{unit}</span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label={`${title} over time`}>
        <line x1={M.l} x2={W - M.r} y1={y(lo)} y2={y(lo)} stroke="#243140" />
        <text x={M.l - 4} y={y(lo) + 3} textAnchor="end" className="fill-[#7F8C9C]" fontSize="9" fontFamily="JetBrains Mono, monospace">
          {compact(lo)}
        </text>
        <text x={M.l - 4} y={y(hi) + 8} textAnchor="end" className="fill-[#7F8C9C]" fontSize="9" fontFamily="JetBrains Mono, monospace">
          {compact(hi)}
        </text>
        {threshold !== undefined && threshold > lo && threshold < hi && (
          <>
            <line x1={M.l} x2={W - M.r} y1={y(threshold)} y2={y(threshold)} stroke="#FBBF24" strokeDasharray="3 3" strokeWidth="1" />
            <text x={W - M.r} y={y(threshold) - 2} textAnchor="end" fontSize="8" fill="#FBBF24">
              prototype threshold
            </text>
          </>
        )}
        {ai && <path d={`${path(ai.values)} L${x(leads.length - 1)},${y(lo)} L${x(0)},${y(lo)} Z`} fill="#38BDF8" opacity="0.12" />}
        {series
          .filter((s) => s.kind === 'nwp')
          .map((s) => (
            <path key={s.label} d={path(s.values)} fill="none" stroke="#8794A4" strokeWidth="1.5" strokeDasharray="4 3" />
          ))}
        {ai && <path d={path(ai.values)} fill="none" stroke="#38BDF8" strokeWidth="2" />}
        {leads.map((lead, i) => (
          <text key={lead} x={x(i)} y={H - 6} textAnchor="middle" fontSize="8.5" fontFamily="JetBrains Mono, monospace" className={i === frameIndex ? 'fill-[#EAF7FE] font-bold' : 'fill-[#7F8C9C]'}>
            {leads.length > 7 && i % 2 === 1 ? '' : formatLead(lead)}
          </text>
        ))}
        <line x1={x(frameIndex)} x2={x(frameIndex)} y1={M.t} y2={y(lo)} stroke="#8794A4" strokeWidth="1" opacity="0.6" />
        {ai && <circle cx={x(frameIndex)} cy={y(ai.values[frameIndex])} r="3.5" fill="#0B1117" stroke="#38BDF8" strokeWidth="2" />}
        {leads.map((lead, i) => (
          <rect key={`hit-${lead}`} x={x(i) - (W - M.l - M.r) / (2 * Math.max(leads.length - 1, 1))} y={M.t} width={(W - M.l - M.r) / Math.max(leads.length - 1, 1)} height={H - M.t - M.b} fill="transparent" className="cursor-pointer" onClick={() => onSelect(i)}>
            <title>{`${formatLead(lead)}: ${series.map((s) => `${s.label} ${compact(s.values[i])}`).join(' · ')}`}</title>
          </rect>
        ))}
      </svg>
    </div>
  );
}

export default function ForecastEvolution({ variable, steps, evolution, frameIndex, onSelectFrame }: ForecastEvolutionProps) {
  const leads = steps.map((s) => s.leadTimeHours);
  const confidence = evolution.map((e) => (e.confidence ?? 0) * 100);
  return (
    <section className={`${PANEL} flex flex-col`} aria-label="Forecast evolution">
      <div className={PANEL_HEAD}>
        <h3 className={TITLE}>Forecast evolution</h3>
        <span className={SIM_CHIP}>SIMULATED</span>
      </div>
      <div className="flex flex-col gap-3 p-3">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10.5px] text-[#B7C2CF]">
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-5 border-t-2 border-[#38BDF8]" />
          AI refined (simulated)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-5 border-t-2 border-dashed border-[#8794A4]" />
          NWP input
        </span>
        <span className="text-[#7F8C9C]">click a chart to set the time</span>
      </div>
      <Chart
        title="Peak intensity"
        unit={variable.meta.unit}
        series={[
          { label: 'NWP', values: evolution.map((e) => e.nwpPeak), kind: 'nwp' },
          { label: 'AI', values: evolution.map((e) => e.aiPeak), kind: 'ai' },
        ]}
        leads={leads}
        frameIndex={frameIndex}
        onSelect={onSelectFrame}
        threshold={variable.threshold}
        yMin={variable.baseline}
      />
      <Chart
        title="Affected area (≥ threshold)"
        unit="km²"
        series={[
          { label: 'NWP', values: evolution.map((e) => e.nwpFootprintAreaKm2), kind: 'nwp' },
          { label: 'AI', values: evolution.map((e) => e.aiFootprintAreaKm2), kind: 'ai' },
        ]}
        leads={leads}
        frameIndex={frameIndex}
        onSelect={onSelectFrame}
      />
      <Chart
        title="Prototype confidence"
        unit="%"
        series={[{ label: 'AI', values: confidence, kind: 'ai' }]}
        leads={leads}
        frameIndex={frameIndex}
        onSelect={onSelectFrame}
        yMin={0}
        yMax={100}
      />
      </div>
    </section>
  );
}
