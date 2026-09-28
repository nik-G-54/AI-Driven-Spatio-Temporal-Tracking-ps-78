import type { DensityChart } from '../event-details.api';

interface IntensityAnalysisProps {
  chart: DensityChart;
  conservationPercent: number;
}

const PLOT = { x0: 45, x1: 520, y0: 20, y1: 140 };
const VIEW_WIDTH = 540;
const VIEW_HEIGHT = 180;

function project(x: number, density: number, xMax: number) {
  const px = PLOT.x0 + (x / xMax) * (PLOT.x1 - PLOT.x0);
  const py = PLOT.y1 - (density / 100) * (PLOT.y1 - PLOT.y0);
  return { x: px, y: py };
}

function buildPath(points: Array<{ x: number; density: number }>, xMax: number): string {
  return points
    .map((p, index) => {
      const { x, y } = project(p.x, p.density, xMax);
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .join(' ');
}

export default function IntensityAnalysis({ chart, conservationPercent }: IntensityAnalysisProps) {
  const xMax = chart.xAxis.max;
  const nwpPath = buildPath(chart.nwp.points, xMax);
  const aiPath = buildPath(chart.ai.points, xMax);
  const nwpModePoint = chart.nwp.points.find((p) => p.x === chart.nwp.modeValue) ?? chart.nwp.points[0];
  const aiTailPoint = chart.ai.points.find((p) => p.x === chart.ai.tailValue) ?? chart.ai.points[0];
  const nwpModeProjected = project(nwpModePoint.x, nwpModePoint.density, xMax);
  const aiTailProjected = project(aiTailPoint.x, aiTailPoint.density, xMax);
  const thresholdProjected = project(chart.thresholdMmDay, 0, xMax);

  const xTicks = [0, 50, 100, 150, 200, 250].filter((tick) => tick <= xMax);

  return (
    <div className="flex flex-col bg-white rounded-xl shadow-sm p-5 gap-4">
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-0.5">
          <h2 className="text-headline-sm text-[#0F172A]">Extreme Value Analysis (Intensity Preservation)</h2>
          <p className="text-body-sm text-[#475569]">
            Comparison of precipitation intensity distribution before and after downscaling
          </p>
        </div>
        <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-[#E5EEFF] text-[#45464D] font-mono">
          {chart.leadTimeLabel}
        </span>
      </div>

      <div className="w-full bg-[#EFF4FF] p-4 rounded-xl flex flex-col gap-3">
        <div className="h-56 w-full">
          <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}>
            <line x1={PLOT.x0} x2={PLOT.x1} y1="20" y2="20" stroke="#cbd5e1" strokeDasharray="2 2" strokeWidth="0.75" />
            <line x1={PLOT.x0} x2={PLOT.x1} y1="60" y2="60" stroke="#cbd5e1" strokeDasharray="2 2" strokeWidth="0.75" />
            <line x1={PLOT.x0} x2={PLOT.x1} y1="100" y2="100" stroke="#cbd5e1" strokeDasharray="2 2" strokeWidth="0.75" />
            <line x1={PLOT.x0} x2={PLOT.x1} y1="140" y2="140" stroke="#94a3b8" strokeWidth="1.2" />

            <g fill="#64748b" fontFamily="JetBrains Mono" fontSize="10" textAnchor="middle">
              {xTicks.map((tick) => {
                const { x } = project(tick, 0, xMax);
                return (
                  <text key={tick} x={x} y="160">
                    {tick}
                    {tick === xTicks[xTicks.length - 1] ? ' mm/d' : ''}
                  </text>
                );
              })}
            </g>

            <line
              x1={thresholdProjected.x}
              x2={thresholdProjected.x}
              y1="15"
              y2="140"
              stroke="#ef4444"
              strokeDasharray="3 3"
              strokeWidth="1.2"
            />
            <text fill="#ef4444" fontFamily="JetBrains Mono" fontSize="9" fontWeight="600" x={thresholdProjected.x + 4} y="24">
              Threshold: {chart.thresholdMmDay} mm/d
            </text>

            <path d={nwpPath} fill="none" stroke="#2563eb" strokeDasharray="4 3" strokeWidth="2.2" />
            <path d={aiPath} fill="none" stroke="#7c3aed" strokeWidth="2.5" />

            <circle cx={nwpModeProjected.x} cy={nwpModeProjected.y} fill="#2563eb" r="3.5" />
            <circle cx={aiTailProjected.x} cy={aiTailProjected.y} fill="#7c3aed" r="4" />

            <g fontFamily="Inter" fontSize="10">
              <text fill="#1d4ed8" fontWeight="600" x={nwpModeProjected.x - 70} y={nwpModeProjected.y - 15}>
                12 km NWP Mode: {chart.nwp.modeValue} mm/d
              </text>
              <text fill="#6d28d9" fontWeight="700" x={aiTailProjected.x - 55} y={aiTailProjected.y - 15}>
                AI Tail: {chart.ai.tailValue} mm/d
              </text>
            </g>
          </svg>
        </div>

        <div className="flex flex-wrap items-center justify-between pt-2 border-t border-[#C6C6CD]/30 text-[11px]">
          <div className="flex flex-wrap items-center gap-5">
            <span className="flex items-center gap-2 text-body-sm text-[#475569]">
              <span className="w-4 h-0.5 bg-blue-600 inline-block border-b-2 border-dashed border-blue-600" />
              <span>12 km NWP (Smoothed peak, truncated tail)</span>
            </span>
            <span className="flex items-center gap-2 text-body-sm text-[#0F172A] font-medium">
              <span className="w-4 h-1 bg-purple-600 inline-block rounded" />
              <span>5 km AI Output (Restores heavy-tail extreme)</span>
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2.5 px-3.5 py-2.5 bg-[#E5EEFF] rounded-lg font-mono text-[11px] text-[#0F172A]">
        <span className="material-symbols-outlined text-[16px] text-[#565E74]">verified</span>
        <span>
          Physics constraint: Conservation of mass preserved within{' '}
          <strong className="font-bold text-[#0F172A]">±{conservationPercent}%</strong> across the regional domain.
        </span>
      </div>
    </div>
  );
}
