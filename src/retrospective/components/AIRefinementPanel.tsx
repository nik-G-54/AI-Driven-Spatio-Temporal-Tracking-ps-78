import type { EvolutionPoint, VariableAnalysis } from '../analysis/analysis.types';
import { formatLead } from '../retrospective.utils';
import { CAP, NOTE, PANEL, PANEL_HEAD, SIM_CHIP, TITLE } from './ui';

interface AIRefinementPanelProps {
  variable: VariableAnalysis;
  point: EvolutionPoint;
}

const num = (x: number) => String(Number(x.toFixed(1)));
const signed = (x: number) => `${x >= 0 ? '+' : '−'}${num(Math.abs(x))}`;

// Explains what the eventual ML pipeline is meant to do, using the SIMULATED
// numbers of the selected step. Confidence is a prototype value, not a measured
// model result.
export default function AIRefinementPanel({ variable, point }: AIRefinementPanelProps) {
  const { unit, label } = variable.meta;
  const diff = point.aiPeak - point.nwpPeak;
  const focus =
    point.aiHalfMaxAreaKm2 < 0.9 * point.nwpHalfMaxAreaKm2
      ? 'Broader → concentrated'
      : point.aiHalfMaxAreaKm2 > 1.1 * point.nwpHalfMaxAreaKm2
        ? 'Concentrated → broader'
        : 'Similar spatial extent';
  // Bars are drawn relative to the baseline so the change in the anomaly is visible.
  const span = Math.max(Math.abs(point.nwpPeak - variable.baseline), Math.abs(point.aiPeak - variable.baseline), 1e-6) * 1.05;
  const bar = (v: number) => `${Math.round((Math.abs(v - variable.baseline) / span) * 100)}%`;

  return (
    <section className={`${PANEL} flex flex-col border-[#5C4510]`} aria-label="AI refinement">
      <div className={PANEL_HEAD}>
        <h3 className={`${TITLE} !text-[#FBBF24]`}>AI refinement</h3>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[11px] text-[#8794A4]">{formatLead(point.leadTimeHours)}</span>
          <span className={SIM_CHIP}>SIMULATED PROTOTYPE</span>
        </div>
      </div>

      <div className="flex flex-col gap-3 p-3">
        {[
          { name: `Input · NWP ${label.toLowerCase()}`, value: point.nwpPeak, color: 'bg-[#64748B]' },
          { name: 'Refined · AI (simulated)', value: point.aiPeak, color: 'bg-[#38BDF8]' },
        ].map((row) => (
          <div key={row.name} className="flex flex-col gap-1">
            <div className="flex items-baseline justify-between">
              <span className="text-[11px] text-[#8794A4]">{row.name}</span>
              <span className="font-mono text-[14px] font-semibold text-[#E6EDF4]">
                {num(row.value)} <span className="text-[10.5px] text-[#8794A4]">{unit}</span>
              </span>
            </div>
            <div className="h-1.5 bg-[#18222D]">
              <div className={`h-1.5 ${row.color}`} style={{ width: bar(row.value) }} />
            </div>
          </div>
        ))}

        <dl className="grid grid-cols-[120px_1fr] gap-x-3 text-[12px] border-t border-[#1F2A36]">
          <dt className="py-1.5 text-[#8794A4] border-b border-[#18212B]">Change</dt>
          <dd className="py-1.5 font-mono font-semibold text-[#E6EDF4] text-right border-b border-[#18212B]">
            {signed(diff)} {unit}
          </dd>
          <dt className="py-1.5 text-[#8794A4] border-b border-[#18212B]">Spatial effect</dt>
          <dd className="py-1.5 text-[#E6EDF4] text-right border-b border-[#18212B]">
            {focus}
            <span className="block font-mono text-[10px] text-[#7F8C9C]">
              half-max area {point.nwpHalfMaxAreaKm2.toLocaleString('en-IN')} → {point.aiHalfMaxAreaKm2.toLocaleString('en-IN')} km²
            </span>
          </dd>
          <dt className="py-1.5 text-[#8794A4]">Prototype confidence</dt>
          <dd className="py-1.5 font-mono font-semibold text-[#E6EDF4] text-right">{point.confidence === null ? '—' : `${Math.round(point.confidence * 100)}%`}</dd>
        </dl>

        <p className={NOTE}>
          <span className={`${CAP} !text-[#FBBF24] mr-1`}>Simulated</span>
          AI output — not measured model performance. No ML model was run; numbers are a prototype construction.
        </p>
      </div>
    </section>
  );
}
