import type { ReplayMosaic } from '../historical-replay.api';

interface ReplayAnalysisMosaicProps {
  mosaic: ReplayMosaic;
}

const CHART_WIDTH = 300;
const CHART_HEIGHT = 90;
const PRESSURE_MIN = 900;
const PRESSURE_MAX = 1015;

function pressureToY(hpa: number): number {
  const clamped = Math.min(PRESSURE_MAX, Math.max(PRESSURE_MIN, hpa));
  return CHART_HEIGHT - ((clamped - PRESSURE_MIN) / (PRESSURE_MAX - PRESSURE_MIN)) * CHART_HEIGHT;
}

function buildPath(points: Array<{ t: number; value: number }>): string {
  return points
    .map((p, index) => {
      const x = (p.t / 100) * CHART_WIDTH;
      const y = pressureToY(p.value);
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .join(' ');
}

export default function ReplayAnalysisMosaic({ mosaic }: ReplayAnalysisMosaicProps) {
  const { pressureDrop, topography, compute } = mosaic;
  const baselinePath = buildPath(pressureDrop.series.map((p) => ({ t: p.t, value: p.baselineHpa })));
  const groundTruthPath = buildPath(pressureDrop.series.map((p) => ({ t: p.t, value: p.groundTruthHpa })));
  const aiPath = buildPath(pressureDrop.series.map((p) => ({ t: p.t, value: p.aiHpa })));
  const peakPoint = pressureDrop.series.reduce((min, p) => (p.groundTruthHpa < min.groundTruthHpa ? p : min), pressureDrop.series[0]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
      <div className="bg-white p-4 rounded-xl shadow-sm flex flex-col justify-between gap-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-headline-sm text-[14px] text-[#0F172A] font-bold">Central Pressure Drop Reanalysis</h3>
            <span className="text-label-sm text-[10px] text-[#475569]">Minimum Barometric Eye Core</span>
          </div>
          <span className="font-mono text-code-sm px-2 py-0.5 rounded bg-[#E5EEFF] text-[#0F172A] font-semibold">
            {pressureDrop.minHpa} hPa Min
          </span>
        </div>
        <div className="h-24 w-full flex items-end">
          <svg className="w-full h-full" fill="none" viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}>
            <path d={baselinePath} fill="none" stroke="#94A3B8" strokeDasharray="4 3" strokeWidth="2" />
            <path d={groundTruthPath} fill="none" stroke="#0B1C30" strokeWidth="2.5" />
            <path d={aiPath} fill="none" stroke="#BA1A1A" strokeWidth="2" />
            {peakPoint && (
              <>
                <circle cx={(peakPoint.t / 100) * CHART_WIDTH} cy={pressureToY(peakPoint.groundTruthHpa)} r="3.5" fill="#0B1C30" />
                <circle cx={(peakPoint.t / 100) * CHART_WIDTH} cy={pressureToY(peakPoint.aiHpa)} r="3.5" fill="#BA1A1A" />
              </>
            )}
          </svg>
        </div>
        <div className="flex items-center justify-between font-mono text-code-sm text-[#475569] pt-1 border-t border-[#E5EEFF]">
          {pressureDrop.footer.map((item) => (
            <span key={item.label} className={item.highlight ? 'text-[#EF4444] font-semibold' : undefined}>
              {item.label} ({item.value} hPa)
            </span>
          ))}
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm flex flex-col justify-between gap-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-headline-sm text-[14px] text-[#0F172A] font-bold">Sub-Grid Topography Gradient</h3>
            <span className="text-label-sm text-[10px] text-[#475569]">Mangrove Estuary Dissipation Factor</span>
          </div>
          <span className="font-mono text-code-sm px-2 py-0.5 rounded bg-violet-100 text-[#6D28D9] font-semibold">
            {topography.badge}
          </span>
        </div>
        <div className="flex items-center gap-3 py-1">
          <div className="w-16 h-16 rounded-lg bg-[#DCE9FF] flex flex-col items-center justify-center p-1 text-center">
            <span className="text-label-sm text-[9px] uppercase text-[#475569]">{topography.nwpCellLabel}</span>
            <span className="font-mono text-code-sm text-[#0F172A] font-bold">{topography.nwpCellAreaKm2} km²</span>
          </div>
          <div className="flex flex-col gap-1 flex-1">
            <div className="flex justify-between text-label-sm">
              <span className="text-[#475569]">Spatial Resolving Gain</span>
              <span className="text-[#0F172A] font-bold">{topography.resolvingGainMultiplier}× Density</span>
            </div>
            <div className="w-full h-2 rounded-full bg-[#E5EEFF] overflow-hidden">
              <div className="h-full bg-black rounded-full" style={{ width: `${topography.resolvingGainPercent}%` }} />
            </div>
            <span className="font-mono text-[10px] text-[#475569]">{topography.caption}</span>
          </div>
        </div>
        <div className="text-body-sm text-[#45464D] pt-1 border-t border-[#E5EEFF]">{topography.footerText}</div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm flex flex-col justify-between gap-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-headline-sm text-[14px] text-[#0F172A] font-bold">Hindcast Inference Compute</h3>
            <span className="text-label-sm text-[10px] text-[#475569]">NVIDIA H100 Cluster Execution</span>
          </div>
          <span className="font-mono text-code-sm px-2 py-0.5 rounded bg-[#E5EEFF] text-[#16A34A] font-semibold">
            {compute.badge}
          </span>
        </div>
        <div className="flex flex-col gap-1.5 font-mono text-code-sm">
          {compute.rows.map((row) => (
            <div key={row.label} className="flex items-center justify-between p-1.5 rounded bg-[#EFF4FF]">
              <span className="text-[#475569]">{row.label}</span>
              <span className="text-[#0F172A] font-medium">{row.value}</span>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between text-label-sm text-[#475569] pt-1 border-t border-[#E5EEFF]">
          <span>Deterministic Seed: {compute.seed}</span>
          {compute.reproducible && (
            <span className="text-black font-semibold flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">check_circle</span>
              Bitwise Reproducible
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
